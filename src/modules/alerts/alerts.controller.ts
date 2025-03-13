import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UnprocessableEntityException,
  Query,
  UseGuards,
  ForbiddenException,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { AlertsService } from './alerts.service';
import { IAlert } from './interfaces/alert.interface';
import { MESSAGES_RESPONSE, ROLES } from '../../constants';
import { CreateAlertDto } from './dto/create-alert.dto';
import { EndAlertDto } from './dto/end-alert.dto';
import { Auth } from '../../decorators/auth.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { IUser } from '../users/interfaces/user.interface';
import { UserRequest } from '../../decorators/user.decorator';
import { IsString } from 'class-validator';
import { CreateLogDto } from './dto/log.dto';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@UserRequest() user: IUser, @Body() alertData: CreateAlertDto) {
    console.log("Entered Backend", alertData);
    return this.alertsService.create(user._id, alertData);
  }

  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @Get('user')
  @UseGuards(AuthGuard)
  getAlertOfUser(
    @UserRequest() user: IUser,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.alertsService.findAll({
      query: {
        userId: user.id,
      },
      limit: limit ? Number(limit) : 10,
      offset: offset ? Number(offset) : 0,
    });
  }

  @Get()
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
  })
  @Auth(ROLES.admin)
  findAll(@Query('offset') offset?: number, @Query('limit') limit?: number) {
    return this.alertsService.findAll({
      limit: limit ? Number(limit) : null,
      offset: offset ? Number(offset) : null,
    });
  }

  @Get('in-location')
  @ApiQuery({
    name: 'topLeftLat',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'topLeftLong',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'rightBottomLat',
    required: true,
    type: Number,
  })
  @ApiQuery({
    name: 'rightBottomLong',
    required: true,
    type: Number,
  })
  getAlertsInLocation(
    @Query('topLeftLat') topLeftLat?: number,
    @Query('topLeftLong') topLeftLong?: number,
    @Query('rightBottomLat') rightBottomLat?: number,
    @Query('rightBottomLong') rightBottomLong?: number,
  ) {
    return this.alertsService.findAllInLocation({
      topLeftLat: topLeftLat ? Number(topLeftLat) : null,
      topLeftLong: topLeftLong ? Number(topLeftLong) : null,
      rightBottomLat: rightBottomLat ? Number(rightBottomLat) : null,
      rightBottomLong: rightBottomLong ? Number(rightBottomLong) : null,
    });
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard)
  async cancel(
    @UserRequest() user: IUser,
    @Param('id') id: string,
    @Body() alertData: EndAlertDto,
  ) {
    const { pinCode } = alertData;
    if (pinCode !== user.pinCode) {
      throw new BadRequestException('Incorrect pin code');
    }

    const alert = await this.alertsService.findOneById(id);
    if (!alert) {
      throw new UnprocessableEntityException(MESSAGES_RESPONSE.NoRecord);
    }

    if (alert.createdBy.toString() === user.id) {
      return await this.alertsService.cancel(id, alertData);
    }

    throw new ForbiddenException(MESSAGES_RESPONSE.Forbidden);
  }

  @Patch(':id/safe')
  @UseGuards(AuthGuard)
  async safe(
    @UserRequest() user: IUser,
    @Param('id') id: string,
    @Body() alertData: EndAlertDto,
  ) {
    const { pinCode } = alertData;
    if (pinCode !== user.pinCode) {
      throw new BadRequestException('Incorrect pin code');
    }

    const alert = await this.alertsService.findOneById(id);
    if (!alert) {
      throw new UnprocessableEntityException(MESSAGES_RESPONSE.NoRecord);
    }

    if (alert.createdBy.toString() === user.id) {
      return await this.alertsService.safe(id, alertData);
    }

    throw new ForbiddenException(MESSAGES_RESPONSE.Forbidden);
  }

  @Get('/active-alert')
  @UseGuards(AuthGuard)
  getActiveAlert(@UserRequest() user: IUser): Promise<IAlert> {
    return this.alertsService.findActiveAlertByUserId(user._id);
  }

  @Post('logs')
  logMessage(@Body() logData: CreateLogDto) {
    try {
      const currentTime = new Date().toLocaleTimeString(); // Get the current time in "HH:MM" format
    console.log(`[${currentTime}], "${logData.message}",Location : ${logData.location}`);
    return { message: 'Log recorded successfully', timestamp: currentTime };
    } catch (error) {
      console.log("ERROR ON POST LOGS",error);
    }
    
  }

  @Post('logs-t')
  logMessages(@Body() logData: any) {
    try {
      const currentTime = new Date().toLocaleTimeString(); // Get the current time in "HH:MM" format
    console.log(`[${currentTime}], ${JSON.parse(logData)}`);
    return { message: 'Logs-t recorded successfully', timestamp: currentTime };
    } catch (error) {
      console.log("ERROR ON POST LOGS",error);
    }
    
  }
}


