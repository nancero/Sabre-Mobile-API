export enum AlertStatus {
  SAFE = 'safe',
  ALERT = 'alert',
  CANCELLED = 'cancelled',
}

export enum AlarmStatus {
  CLOSED = 'close',
  CANCELED = 'canceled',
}

export enum VerificationMethod {
  CALL = 'call',
  SMS = 'sms',
  EMAIL = 'email',
}

export type VerificationMethodType = 'call' | 'sms' | 'email';
