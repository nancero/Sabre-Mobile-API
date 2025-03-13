import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { MongoError } from 'mongodb';
import { getErrorMessage } from '../common/helpers/error-handler';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const message = getErrorMessage(exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = 400;

    response.status(status).json({
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
