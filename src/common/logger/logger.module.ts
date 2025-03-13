import { Module } from '@nestjs/common';
import { LoggerService } from 'nest-logger';
import { ConfigModule, ConfigService } from '@nestjs/config';
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LoggerService,
      useFactory: (config: ConfigService) => {
        // getLoggers() is a helper function to get configured console and/or rotate logger transports.
        // It takes takes two parameters:
        // 1: Appenders where to log to: console or rotate or both in array
        //    (eg. [LoggerTransport.CONSOLE, LoggerTransport.ROTATE])
        // 2: Logger options object that contains the following properties:
        //    timeFormat?: winston's time format syntax. Defaults to "HH:mm:ss".
        //    colorize?: whether to colorize the log output. Defaults to true.
        //    consoleOptions?: see Winston's ConsoleTransportOptions interface
        //    fileOptions?: see Winston Daily Rotate File's DailyRotateFile.DailyRotateFileTransportOptions
        const loggers = LoggerService.getLoggers(
          config.get('logger.logAppenders'),
          {
            colorize: config.get('logger.colorize'),
          },
        );
        // LoggerService constructor will take two parameters:
        // 1. Log level: debug, info, warn or error
        // 2. List of logger transport objects.
        return new LoggerService(config.get('logger').logLevel, loggers);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
