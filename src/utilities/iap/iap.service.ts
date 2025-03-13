import { Injectable } from '@nestjs/common';
import * as iap from 'in-app-purchase';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { PLATFORM_OS } from './constants/iap.constants';
import { type } from 'os';

// import { IAPOptions } from './interfaces/iap-options.interface';
// import { IAP_OPTIONS, PLATFORM_OS } from './constants/iap.constants';

@Injectable()
export class IAPService {
  androidGoogleApi: any;
  constructor(private readonly configService: ConfigService) {
    console.log(
      'PrivateKEY Logged',
      this.configService.get('iap.googleServiceAccountEmail'),
      this.configService
        ?.get<string>('iap.googleServiceAccountPrivateKey')
        ?.replace(/\\n/g, '\n'),
      typeof this.configService?.get<string>(
        'iap.googleServiceAccountPrivateKey',
      ),
    );
    iap.config({
      /* Configuration for IOS Platform */
      // If you want to exclude old transaction, set this to true. Default is false:
      appleExcludeOldTransactions: true,
      // this comes from iTunes Connect (You need this to validate subscriptions):
      applePassword: this.configService.get<string>('iap.applePassword'),

      /* Configuration for Android Platform */
      googleServiceAccount: {
        clientEmail: this.configService.get('iap.googleServiceAccountEmail'),
        privateKey: this.configService
          ?.get<string>('iap.googleServiceAccountPrivateKey')
          ?.replace(/\\n/g, '\n'),
      },
      /* Configurations all platforms */
      // For Apple and Google Play to force Sandbox validation only
      test: this.configService.get<string>('iap.env') === 'sandbox',
      // Output debug logs to stdout stream
      verbose: true,
    });

    google.options({
      auth: new JWT(
        this.configService.get('iap.googleServiceAccountEmail'),
        null,
        this.configService
          ?.get('iap.googleServiceAccountPrivateKey')
          ?.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/androidpublisher'],
      ),
    });
    console.log(
      'mailUsed',
      this.configService.get('iap.googleServiceAccountEmail'),
    );

    this.androidGoogleApi = google.androidpublisher({ version: 'v3' });
  }

  generateReceipt({
    platform,
    purchase,
    isSubscription,
  }: {
    platform: keyof typeof PLATFORM_OS;
    purchase: any;
    isSubscription: boolean;
  }) {
    const receipt =
      platform === PLATFORM_OS.IOS
        ? purchase.transactionReceipt
        : {
            packageName: this.configService.get<string>(
              'iap.androidPackageName',
            ),
            productId: purchase.productId,
            purchaseToken: purchase.purchaseToken,
            subscription: isSubscription,
          };

    return receipt;
  }

  setup() {
    return iap.setup();
  }

  validate(service, receipt, cb) {
    return iap.validate(service, receipt, cb);
  }

  getPurchaseData(validationResponse) {
    return iap.getPurchaseData(validationResponse);
  }

  isCanceled(purchaseItem) {
    return iap.isCanceled(purchaseItem);
  }

  isExpired(purchaseItem) {
    return iap.isExpired(purchaseItem);
  }

  androidAcknowledge({ subscriptionId, token }) {
    return this.androidGoogleApi.purchases.subscriptions.acknowledge({
      packageName: this.configService.get<string>('iap.androidPackageName'),
      subscriptionId,
      token,
    });
  }
}
