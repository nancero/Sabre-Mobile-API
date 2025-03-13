declare const module: any;

import { NestFactory } from '@nestjs/core';
import dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import path from 'path';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { AppModule } from './app.module';
import { setupSwagger } from './utilities/swagger/index';
import { MongoExceptionFilter } from './filters/mongo-exception.filter';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });

  app.enableCors({
    origin(_origin, callback) {
      return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: 'Content-Type, Accept',
  });
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10000, // limit each IP to 10000 requests per windowMs
    }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(), new MongoExceptionFilter());
  app.useStaticAssets(path.join(__dirname, '..', 'public'));
  app.setBaseViewsDir(path.join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

app.getHttpAdapter().getInstance().get('/', (_req: any, res: { send: (arg0: string) => void; }) => {
  res.send("SABRE SERVER IS RUNNING");
});

  const configService = app.get<ConfigService>(ConfigService);
  if (['development', 'staging'].includes(configService.get('app.nodeEnv'))) {
    setupSwagger(app);
  }
  
  await app.listen(process.env.PORT);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
