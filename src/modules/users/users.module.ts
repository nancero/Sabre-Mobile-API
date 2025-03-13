import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersService } from './users.service';
import { UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { TwilioModule } from '../../utilities/twilio';
import { LoggerModule } from '../../common/logger/logger.module';
import { TrustedContactModule } from '../trusted-contacts/trusted-contacts.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    TwilioModule,
    LoggerModule,
    TrustedContactModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
