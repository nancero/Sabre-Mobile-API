import twilio = require('twilio');
import { Inject, Injectable } from '@nestjs/common';
import { TWILIO_OPTIONS } from './constants/twilio-options.constant';
import { TwilioOptions } from './interfaces/twilio-options.interface';

@Injectable()
export class TwilioService {
  private client: twilio.Twilio;
  constructor(
    @Inject(TWILIO_OPTIONS) private readonly twilioOptions: TwilioOptions,
  ) {
    this.client = twilio(twilioOptions.accountSid, twilioOptions.authToken);

    this.client.verify
      .services(twilioOptions.verificationSid)
      .update({ dtmfInputRequired: false, friendlyName: 'Sabre OTP' });
  }

  get instance() {
    return this.client;
  }
  public sendSMS(to: string, message: string): Promise<any> {
    console.log('sendSMS triggered', message);
    return this.client.messages.create({
      from: this.twilioOptions.twilioNumber,
      to,
      body: message,
    });
  }

  public sendManySMS(to: string[], message): Promise<any[]> {
    return Promise.all(to.map((receiver) => this.sendSMS(receiver, message)));
  }

  public sendCall(to: string, message: string): Promise<any> {
    console.log('sendCall triggered');
    return this.client.calls.create({
      to,
      from: this.twilioOptions.twilioNumber,
      twiml: `<Response><Say>${message}</Say></Response>`,
    });
  }

  public sendManyCalls(to: string[], message): Promise<any[]> {
    return Promise.all(to.map((receiver) => this.sendCall(receiver, message)));
  }

  public createService({ friendlyName, codeLength }) {
    return this.client.verify.services.create({
      friendlyName,
      codeLength,
    });
  }

  public verifyOTP(phoneNumber: string, code: string) {
    console.log('verifyOTP triggered');
    return this.client.verify
      .services(this.twilioOptions.verificationSid)
      .verificationChecks.create({ code, to: phoneNumber });
  }

  public sendOTP(phoneNumber: string, channel: 'sms' | 'call') {
    console.log('sendOTP triggered');
    return this.client.verify
      .services(this.twilioOptions.verificationSid)
      .verifications.create({ channel, to: phoneNumber });
  }
}
