import { registerAs } from '@nestjs/config';
export default registerAs('logger', () => ({
  // logLevel: debug, info, warn or error
  logLevel: 'debug',
  // serviceName: daily rotate files will have this name
  serviceName: 'SabreServer',
  // logAppenders: console or rotate or both in array
  logAppenders: 'console',
  // logFilePath: where daily rotate files are saved
  logFilePath: '../logger',
  // timeFormat?: winston's time format syntax. Defaults to "YYYY-MM-DD HH:mm:ss".
  // fileDatePattern?: appended to daily rotate filename. Defaults to "YYYY-MM-DD".
  // maxFiles?: how long rotate files are stored. Defaults to "10d" which means 10 days.
  // zippedArchive?: whether to zip old log file. Defaults to false.
  // colorize?: whether to colorize the log output. Defaults to true.
  colorize: true,
}));
