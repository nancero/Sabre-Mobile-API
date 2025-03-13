import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { LoggerService } from 'nest-logger';
import { Schema } from 'mongoose';

import {
  ISubscription,
  ISubscriptionModel,
} from './interfaces/subscription.interface';
import { IAPService, PLATFORM_OS, PAYMENT_SERVICES } from '../../utilities/iap';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel('Subscription')
    private readonly subscriptionModel: ISubscriptionModel,
    private readonly logger: LoggerService,
    private readonly iap: IAPService,
  ) {}

  create(data) {
    const { platform, purchase, userId } = data;
    const receipt = this?.iap?.generateReceipt({
      platform,
      purchase,
      isSubscription: true,
    });
    return this.processPurchase(platform, userId, receipt);
  }

  getActiveSubscriptions(): Promise<any> {
    return this.subscriptionModel
      .find({
        expiresDateMs: { $gte: Date.now() },
      })
      .exec();
  }

  @Cron('0 0 0 * * *', {
    name: 'validate-subscription',
  })
  async validateAllSubscriptions() {
    const subscriptions = await this?.getActiveSubscriptions();
    for (const subscription of subscriptions) {
      try {
        await this?.processPurchase(
          subscription?.app,
          subscription?.user_id,
          subscription?.platform === 'ios'
            ? subscription?.latest_receipt
            : JSON.parse(subscription?.latest_receipt),
        );
      } catch (err) {
        this?.logger?.error('Failed to validate subscription', subscription);
      }
    }
  }

  async updateSubscription(subscription: {
    platform?: string;
    userId?: string;
    productId: string;
    environment: string;
    latestReceipt?: string;
    originalTransactionId: string;
    cancellationDateMs?: string;
    purchasedDateMs?: number;
    expiresDateMs?: number;
    isCancelled?: number;
    validationResponse?: string;
  }) {
    console.log(subscription.originalTransactionId,"OTD")
    const data = Object.keys(subscription)?.reduce((result, currentKey) => {
      const currentValue = subscription[currentKey];
      if (currentValue === null || currentValue === undefined) return result;

      result[currentKey] = currentValue;
      return result;
    }, {});
    console.log("--Updating data",data,subscription?.originalTransactionId)
    return this?.subscriptionModel?.findOneAndUpdate(
      { originalTransactionId: subscription?.originalTransactionId },
      data,
      { upsert: true },
    );
  }

  async processPurchase(platform: string, userId: string, receipt) {
    try {

    console.log("Started Compiling",receipt,platform,userId)
    await this?.iap?.setup();
    console.log("IAP setup")
    const validationResponse = await this?.iap?.validate(PAYMENT_SERVICES.GOGGLE, receipt , undefined);
    console.log("validationResponse",validationResponse);

    if (
      (platform === PLATFORM_OS?.ANDROID &&
        validationResponse?.service !== PAYMENT_SERVICES?.GOGGLE) ||
      (platform === PLATFORM_OS.IOS &&
        validationResponse?.service !== PAYMENT_SERVICES?.APPLE)
    ) {
      return new Error('Platform input is incorrect');
    }

    const purchaseData = await this?.iap?.getPurchaseData(validationResponse);
    const firstPurchaseItem = purchaseData[0];
    const isCancelled = await this?.iap?.isCanceled(firstPurchaseItem);
    const { productId } = firstPurchaseItem;

    console.log("purchaseData",purchaseData,isCancelled);

    if (platform === PLATFORM_OS.IOS) {
      const originalTransactionId = firstPurchaseItem?.originalTransactionId;
      const latestReceipt = validationResponse?.latest_receipt;
      const purchasedDateMs = firstPurchaseItem?.originalPurchaseDateMs;
      const expiresDateMs = firstPurchaseItem?.expiresDateMs;
      const environment = validationResponse?.sandbox
        ? 'sandbox'
        : 'production';

      return await this?.updateSubscription({
        platform,
        userId,
        environment,
        productId,
        latestReceipt,
        originalTransactionId,
        expiresDateMs,
        purchasedDateMs,
        isCancelled,
        validationResponse: JSON.stringify(validationResponse),
      });
    }

    if (platform === PLATFORM_OS?.ANDROID) {
      const originalTransactionId = firstPurchaseItem?.transactionId;
      const latestReceipt = JSON?.stringify(receipt);
      const purchasedDateMs = parseInt(firstPurchaseItem?.startTimeMillis, 10);
      const expiresDateMs = parseInt(firstPurchaseItem?.expiryTimeMillis, 10);
      const environment = validationResponse?.sandbox
        ? 'sandbox'
        : 'production';

      const result = await this?.updateSubscription({
        platform,
        userId,
        environment,
        productId,
        latestReceipt,
        originalTransactionId,
        expiresDateMs,
        purchasedDateMs,
        isCancelled,
        validationResponse: JSON?.stringify(validationResponse),
      });

      console.log("---result",result);

      if (validationResponse?.acknowledgementState === 0) {
        // From https://developer.android.com/google/play/billing/billing_library_overview:
        // You must acknowledge all purchases within three days.
        // Failure to properly acknowledge purchases results in those purchases being refunded.
        await this?.iap?.androidAcknowledge({
          subscriptionId: productId,
          token: receipt.purchaseToken,
        });
      }
      return result;
    }
    } catch (error) {
        console.log("ERROR ON processPurchase",error,JSON.stringify(error.message))
    }
    
  }

  async getActiveSubscription(userId: string) {
    try {
      const nowMs = Date.now();
      const subscription: ISubscription = await this?.subscriptionModel
        .findOne({
          userId,
          purchasedDateMs: { $lte: nowMs },
          expiresDateMs: { $gte: nowMs },
        })
        .exec();
  
      return subscription;
    } catch (error) {
        console.log("ERROR OCCURED ON getActiveSubscription",error);
    }
   
  }

  async getUserSubscription(userId: string) {
    try {
      const subscription = await this?.subscriptionModel
      .find({
        userId,
      })
      .sort({ purchasedDateMs: -1 })
      .limit(1)
      .exec();
    console.log("getUserSubscription",subscription?.[0])
    return subscription?.[0];
    } catch (error) {
      console.log("ERROR OCCURED ON getUserSubscription",error)
    }
   
  }

  async checkValidSubscription(subscription:any) {
    try {
      if (subscription?.isCancelled) {
        console.log('entered cancellation')
        return false;
      }
      const nowMs = Date.now();
      console.log(nowMs,subscription?.purchasedDateMs,subscription?.expiresDateMs);
      return subscription?.purchasedDateMs <= nowMs && subscription?.expiresDateMs >= nowMs ;
    } catch (error) {
      console.log('ERROR OCCURED ON checkValidSubscription',error);
    }
   
  }

  getWebhookData({ platform, data }) {
    if (platform === PLATFORM_OS.IOS) {
      return {
        purchase: {
          transactionReceipt:
            data.latest_receipt || data.latest_expired_receipt,
        },
        notificationType: data.notification_type,
      };
      // const {
      //   environment,
      //   latest_receipt_info: latestReceiptInfo,
      //   latest_receipt: latestReceipt,
      //   notification_type: notificationType,
      //   // For CANCEL
      //   /* The date in milliseconds at which the user cancelled */
      //   cancellation_date_ms: cancellationDateMs,
      //   /* The latest receipt information, now expired, but you should still update it in your DB */
      //   latest_expired_receipt: latestExpiredReceipt,
      //   latest_expired_receipt_info: latestExpiredReceiptInfo,
      // } = data;

      // const transactionReceipt = latestExpiredReceipt
      //   ? latestExpiredReceipt
      //   : latestReceipt;
      // const receiptInfo = latestExpiredReceiptInfo
      //   ? latestExpiredReceiptInfo
      //   : latestReceiptInfo;
      // const {
      //   /* This is your primary key for a subscription, it does not change and is attached to every transaction. */
      //   original_transaction_id: originalTransactionId,
      //   /* This is the date in milliseconds at which the user started their subscription. */
      //   original_purchase_date_ms: purchasedDateMs,
      //   /* This is the date in milliseconds at which the user's subscription will end if it is not renewed. */
      //   expires_date_ms: expiresDateMs,
      //   /* The subscription they have decided to take, as set in App Store Connect */
      //   product_id: productId,
      // } = receiptInfo[0];

      // return {
      //   purchase: {
      //     platform,
      //     originalTransactionId,
      //     purchasedDateMs,
      //     expiresDateMs,
      //     productId,
      //     transactionReceipt,
      //     environment,
      //     cancellationDateMs,
      //   },
      //   notificationType,
      // };
    } else {
      const { message } = data;
      const decoded = new Buffer(message.data, 'base64').toString('ascii');
      const json = JSON.parse(decoded);
      const { subscriptionNotification } = json;

      if (!subscriptionNotification) return null;
      const {
        purchaseToken,
        subscriptionId,
        notificationType,
      } = subscriptionNotification;
      return {
        purchase: {
          purchaseToken,
          productId: subscriptionId,
        },
        notificationType,
      };
    }
  }
}
