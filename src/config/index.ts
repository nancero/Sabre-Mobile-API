import * as Joi from '@hapi/joi';
import { LoggerTransport } from 'nest-logger';
import path from 'path';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  TEST_WHITELIST: Joi.string(),
  SERVER_URI: Joi.string(),
  WEBAPP_URI: Joi.string(),
  MONGODB_URL: Joi.string(),

  // Twilio
  TWILIO_ACCOUNT_SID: Joi.string(),
  TWILIO_AUTH_TOKEN: Joi.string(),
  TWILIO_NUMBER: Joi.string(),
  TWILIO_VERIFICATION_SID: Joi.string(),

  // auth
  AUTH_JWT_SECRET: Joi.string(),
  AUTH_JWT_EXPIRES_IN: Joi.number(),
  AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN: Joi.number(),
  AUTH_OTP_EXPIRED_TIME: Joi.number(),

  // Mailer
  MAILER_SENDGRID_API_KEY: Joi.string(),
  MAILER_SENDER: Joi.string(),
  MAILER_FROM: Joi.string(),

  // AWS
  AWS_BUCKET_NAME: Joi.string(),
  AWS_REGION: Joi.string(),
  AWS_ACCESS_KEY_ID: Joi.string(),
  AWS_SECRET_ACCESS_KEY: Joi.string(),

  // Iap
  IAP_ENVIRONMENT: Joi.string(),
  IAP_APPLE_PASSWORD: Joi.string(),
  IAP_ANDROID_PACKAGE_NAME: Joi.string(),
  IAP_GOOGLE_SERVICE_ACCOUNT_EMAIL: Joi.string(),
  IAP_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: Joi.string(),
  IAP_OAUTH_CLIENT_ID: Joi.string(),
  IAP_OAUTH_CLIENT_SECRET_KEY: Joi.string(),

  // Noonlight
  NOONLIGHT_URL: Joi.string(),
  NOONLIGHT_SERVER_TOKEN: Joi.string(),
  NOONLIGHT_WEBHOOK_SECRET: Joi.string(),

  // Onesignal
  ONESIGNAL_USER_AUTH_KEY: Joi.string(),
  ONESIGNAL_APP_AUTH_KEY: Joi.string(),
  ONESIGNAL_APP_ID: Joi.string(),

  // Logger
  LOGGER_LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('debug'),
  LOGGER_LOG_APPENDERS: Joi.string()
    .valid(LoggerTransport.CONSOLE, LoggerTransport.ROTATE)
    .default(LoggerTransport.CONSOLE),
  LOGGER_SERVICE_NAME: Joi.string().default('SaludoServer'),
  LOGGER_LOG_PATH: Joi.string().default(path.resolve(process.cwd(), '/log')),
  LOGGER_COLORIZE: Joi.boolean().default('true'),
});

export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV,
    serverUri: process.env.SERVER_URI,
    webappUri: process.env.WEBAPP_URI,
  },
  database: {
    mongoUrl: process.env.MONGODB_URL,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    twilioNumber: process.env.TWILIO_NUMBER,
    verificationSid: process.env.TWILIO_VERIFICATION_SID,
  },
  logger: {
    logLevel: process.env.LOGGER_LOG_LEVEL,
    serviceName: process.env.LOGGER_SERVICE_NAME,
    logAppenders: process.env.LOGGER_LOG_APPENDERS,
    logFilePath: process.env.LOGGER_LOG_PATH,
    colorize: process.env.LOGGER_COLORIZE === 'true',
  },
  auth: {
    jwtSecret: process.env.AUTH_JWT_SECRET,
    jwtExpiresIn: parseInt(process.env.AUTH_JWT_EXPIRES_IN, 10),
    jwtRefreshTokenExpiresIn: parseInt(
      process.env.AUTH_JWT_REFRESH_TOKEN_EXPIRES_IN,
      10,
    ),
    otpExpiresIn: parseInt(process.env.AUTH_OTP_EXPIRED_TIME, 10),
  },
  mailer: {
    sendgridApiKey: process.env.MAILER_SENDGRID_API_KEY,
    sender: process.env.MAILER_SENDER,
    emailFrom: process.env.MAILER_FROM,
  },
  aws: {
    bucketName: process.env.AWS_BUCKET_NAME,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  iap: {
    env: process.env.IAP_ENVIRONMENT,
    applePassword: process.env.IAP_APPLE_PASSWORD,
    androidPackageName: process.env.IAP_ANDROID_PACKAGE_NAME,
    googleServiceAccountEmail: process.env.IAP_GOOGLE_SERVICE_ACCOUNT_EMAIL,
    googleServiceAccountPrivateKey:
      process.env.IAP_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    oauthClientId: process.env.IAP_OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.IAP_OAUTH_CLIENT_SECRET_KEY,
  },
  noonlight: {
    url: process.env.NOONLIGHT_URL,
    serverToken: process.env.NOONLIGHT_SERVER_TOKEN,
    webhookSecret: process.env.NOONLIGHT_WEBHOOK_SECRET,
  },
  onesignal: {
    userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
    appAuthKey: process.env.ONESIGNAL_APP_AUTH_KEY,
    appId: process.env.ONESIGNAL_APP_ID,
  },
  whitelist: process.env.TEST_WHITELIST,
});
