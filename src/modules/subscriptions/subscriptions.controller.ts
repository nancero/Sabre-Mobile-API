import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
// import { IOS_NOTIFICATION_TYPES } from '../../constants';
import { IAPService } from '../../utilities/iap';
import { PLATFORM_OS } from '../../utilities/iap/constants/iap.constants';
import { AuthGuard } from '../../guards/auth.guard';
import { UserRequest } from '../../decorators/user.decorator';
import { IUser } from '../users/interfaces/user.interface';
import { generate } from 'rxjs';

@ApiBearerAuth()
@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly iap: IAPService,
  ) {}

  @Post('verify')
  @UseGuards(AuthGuard)
  async verifyReceipt(
    @UserRequest() user: IUser,
    @Body() subscriptionBody: any,
  ) {
    try {
      console.log('###### Entered Subscription')
      const { platform, purchase } = subscriptionBody;

      if (platform !== 'ios' && platform !== 'android') {
        throw new BadRequestException('platform required ios or android');
      }

      return await this.subscriptionsService.create({
        platform,
        purchase,
        userId: user._id,
      });
    } catch (error) {
      console.log('ERROR OCCURED ON verifyReceipt', error);
    }
  }

  @Post('/webhook/:platform')
  async hook(
    @Body() data: any,
    @Param('platform') platform: keyof typeof PLATFORM_OS,
  ): Promise<any> {
    const { purchase, notificationType } =
      this.subscriptionsService.getWebhookData({
        platform,
        data,
      }) || {};

    if (!purchase) return null;

    const receipt = this?.iap?.generateReceipt({
      platform,
      purchase,
      isSubscription: true,
    });
    console.log('generateRec', receipt);
    return await this.subscriptionsService.processPurchase(
      platform,
      null,
      receipt,
    );

    // switch (notificationType) {
    //   case IOS_NOTIFICATION_TYPES.INITIAL_BUY:
    //   // Apple sends this notification when a user purchases a subscription at a first time in some subscriptions group.

    //   case IOS_NOTIFICATION_TYPES.CANCEL:
    //   // when user cancels subscriptions through Apple Care support and refunds his money.
    //   // Please note: this is not about the normal cancellation of a subscription through iOS settings

    //   // when user cancels or re-enables a subscription through iOS settings, App Store app or Apple Support
    //   case IOS_NOTIFICATION_TYPES.DID_CHANGE_RENEWAL_STATUS:
    //   // This notification is being sent if a user canceled his subscription and after some time re-enabled it.
    //   case IOS_NOTIFICATION_TYPES.INTERACTIVE_RENEWAL:
    //   // Apple sends this notification when a user’s subscription was canceled automatically due to billing issue
    //   // and was re-enabled again manually by a user.
    //   // In this case Apple sends RENEWAL notification.
    //   case IOS_NOTIFICATION_TYPES.RENEWAL:
    //   // TODO: process renew logic
    //   default: {
    //     // TODO: return error
    //     break;
    //   }
    // }
    // return null;
  }

  @Get()
  @UseGuards(AuthGuard)
  async get(@UserRequest() user: IUser): Promise<any> {
    try {
      const userId = user._id;

      const subscription = await this.subscriptionsService.getUserSubscription(
        userId,
      );
      const subscriptionStatus = await this.subscriptionsService.checkValidSubscription(
        subscription,
      );
      console.log('status', subscriptionStatus);
      const response = {
        subscription,
        isSubscribed: subscriptionStatus,
      };
      return response;
    } catch (error) {
      console.log('ERROR OCCURED', error);
    }
  }
}
