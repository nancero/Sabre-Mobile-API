import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwtDecode from 'jwt-decode';
import { get, throttle } from 'lodash';
import { LoggerService } from 'nest-logger';
import { UsersService } from '../users/users.service';
import { AlertsService } from '../alerts/alerts.service';
import { forwardRef, Inject } from '@nestjs/common';
import { GeoLocationsService } from '../geo-locations/geo-locations.service';
import { NoonlightService } from '../../utilities/noonlight/noonlight.service';
import { AlertStatus } from '../../constants/enums';

@WebSocketGateway()
export class LocationSubscribeGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logger: LoggerService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AlertsService))
    private readonly alertsService: AlertsService,
    private readonly noonlightService: NoonlightService,
    @Inject(forwardRef(() => GeoLocationsService))
    private readonly geoLocationsService: GeoLocationsService,
  ) {}

  @SubscribeMessage('message')
  handleMessage(_: Socket, data: any): any {
    this.logger.debug(data);
    const room = data?.alertId ? `alert-${data.alertId}` : null;

    if (room) {
      this.logger.debug(`Sending message to room: ${room}`);

      this.listClientsInRoom(room);
      this.sendToAllClientsInRoom(room, 'message', data);

      this.logger.debug(`Message sent to room: ${room}`);

      // Sync location with Noonlight API
      const throttleSyncLocationWithNoonlight = throttle(
        this.syncLocationWithNoonlight,
        10000,
      );
      throttleSyncLocationWithNoonlight(data.alertId, data.location);

      // Create new location
      if (data?.userId && data?.alertId && data?.location) {
        this.geoLocationsService.create(data.userId, {
          accuracy: data.location.accuracy,
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          alertId: data.alertId,
        });
      }
    }
  }

  syncLocationWithNoonlight = async (alertId: string, location: any) => {
    const { alarmId, status } = await this.alertsService.findOneById(alertId);
    if (alarmId && status === AlertStatus.ALERT) {
      this.noonlightService.updateLocation(alarmId, location);
    }
  };

  leaveRoom(room: string) {
    const allClients = this.server.sockets.connected;
    for (const socket of Object.values(allClients)) {
      socket.leave(room);
    }
  }

  addSocketsToRooms(ids: string[], room: string) {
    const allClients = this.server.sockets.connected;
    const allConnectedSockets = ids.map((id) => allClients[id]);
    for (const socket of allConnectedSockets) {
      if (socket) {
        socket.join(room);
      }
    }
  }

  listClientsInRoom(room: string) {
    const roomObj = this.server.sockets.adapter.rooms[room];
    if (roomObj) {
      const clients = Object.keys(roomObj.sockets);
      console.log(`Clients in room '${room}': ${clients.join(', ')}`);
    } else {
      console.log(`Clients in room '${room}': No clients`);
    }
  }

  // sending to all clients in room except sender
  sendToAllClientsInRoom(room: string, eventName: string, data: any): void {
    this.server.sockets.in(room).emit(eventName, data);
  }

  // sending to individual socketId (private message)
  sendToIndividualSocketId(socketId: string, data: any) {
    this.server.to(`${socketId}`).emit(data);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const token = get(client, 'handshake.query.token', null);
    const alertId = get(client, 'handshake.query.alertId', null);

    if (token) {
      const result = jwtDecode(client.handshake.query.token);
      const { userId } = result;
      this.usersService.updateSocketId(userId, client.id);
      return result;
    }

    // Proceed client connecting to room
    client.on('room', async (room) => {
      client.join(room);
      // @ts-ignore
      client.room = room;

      if (alertId) {
        const alert = await this.alertsService.findOneById(alertId);
        const [user, locations] = await Promise.all([
          this.usersService.findOneById(alert?.createdBy),
          this.geoLocationsService.getAllLocationsByAlertId(alertId),
        ]);
        const userData = {
          firstName: user?.firstName,
          lastName: user?.lastName,
          phoneNumber: user?.phone,
        };
        this.server.to(`${client.id}`).emit('user', userData);
        this.server
          .to(`${client.id}`)
          .emit('alert-initial', { alert, locations });

        // @ts-ignore
        client.alert = alert;
        // @ts-ignore
        client.user = userData;

        this.logger.log(JSON.stringify(userData, null, 4));
      }
    });

    return null;
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const token = get(client, 'handshake.query.token', null);
    if (token !== null) {
      const result = jwtDecode(client.handshake.query.token);
      const { userId } = result;
      this.usersService.updateSocketId(userId, null);
      return client;
    }

    // @ts-ignore
    if (client.room) {
      // @ts-ignore
      client.leave(client.room);
    }

    return null;
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }
}
