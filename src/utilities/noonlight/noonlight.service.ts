import { Injectable } from '@nestjs/common';
import got from 'got';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NoonlightService {
  private noonlightServerToken: string;
  private noonlightURL: string;
  constructor(private readonly configService: ConfigService) {
    this.noonlightServerToken = configService.get('noonlight.serverToken');
    this.noonlightURL = this.configService.get('noonlight.url');
  }

  async createAlarm(user, location): Promise<any> {
    const { firstName, lastName, phone, pinCode } = user;
    const { latitude, longitude, accuracy } = location;
console.log("pradeep");
let data_json = JSON.stringify({
        name: `${firstName} ${lastName}`,
        phone: phone.replace(/[^\d]/, ''),
        pin: pinCode,
        owner_id: user._id,
        location: {
          coordinates: {
            lat: latitude,
            lng: longitude,
            accuracy: parseInt(accuracy, 10) || 50,
          },
        },
        services: {
          police: true,
          fire: false,
          medical: false,
        },
      });

    console.log(data_json);
    console.log("hosn response");
    const response = await got.post(`${this.noonlightURL}/dispatch/v1/alarms`, {
      headers: {
        authorization: `Bearer ${this.noonlightServerToken}`,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      responseType: 'json',
      body: JSON.stringify({
        name: `${firstName} ${lastName}`,
        phone: phone.replace(/[^\d]/, ''),
        pin: pinCode,
        owner_id: user._id,
        location: {
          coordinates: {
            lat: latitude,
            lng: longitude,
            accuracy: parseInt(accuracy, 10) || 50,
          },
        },
        services: {
          police: true
        },
      }),
    });
    console.log(response.body);
    const { id } = response.body as any;
    return id;
  }

  async cancelAlarm(alarmId, pin): Promise<any> {
    return await got.post(
      `${this.noonlightURL}/dispatch/v1/alarms/${alarmId}/status`,
      {
        headers: {
          authorization: `Bearer ${this.noonlightServerToken}`,
          accept: 'application/json',
          'content-type': 'application/json',
        },
        responseType: 'json',
        body: JSON.stringify({
          status: 'CANCELED',
          pin,
        }),
      },
    );
  }

  async updateLocation(alarmId, location): Promise<any> {
    const { latitude, longitude, accuracy } = location;

    return await got.post(
      `${this.noonlightURL}/dispatch/v1/alarms/${alarmId}/locations`,
      {
        headers: {
          authorization: `Bearer ${this.noonlightServerToken}`,
          accept: 'application/json',
          'content-type': 'application/json',
        },
        responseType: 'json',
        body: JSON.stringify({
          coordinates: {
            lat: latitude,
            lng: longitude,
            accuracy: parseInt(accuracy, 10) || 50,
          },
        }),
      },
    );
  }

  // async updatePerson(alarmId, person: IUser): Promise<any> {
  //   const input = {
  //     height: { value: person.height?.value, unit: person.height?.unit },
  //     weight: { value: person.weight?.value, unit: person.weight?.unit },
  //     blood_type: { value: person.bloodType },
  //     wheelchair_use: { value: person.wheelchairUse },
  //     sex: { value: person.sex },
  //     inhaler_use: { value: person.inhalerUse },
  //     race: { value: person.race },
  //     ethnicity: { value: person.inhalerUse },
  //     photo: { value: person.avatar },
  //   };

  //   const bodyData = Object.keys(input).reduce((target, currentValue) => {
  //     if (input[currentValue].value) {
  //       target[currentValue] = input[currentValue];
  //     }
  //     return target;
  //   }, {});

  //   return await got.post(
  //     `${this.noonlightURL}/dispatch/v1/alarms/${alarmId}/people/${person._id}`,
  //     {
  //       headers: {
  //         authorization: `Bearer ${this.noonlightServerToken}`,
  //         accept: 'application/json',
  //         'content-type': 'application/json',
  //       },
  //       responseType: 'json',
  //       body: JSON.stringify(bodyData),
  //     },
  //   );
  // }
}
