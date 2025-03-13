import { model, Schema } from 'mongoose';
import {
  ISubscription,
  ISubscriptionModel,
} from '../interfaces/subscription.interface';
import mongoosePaginate = require('mongoose-paginate-v2');

export const SubscriptionSchema: Schema = new Schema(
  {
    // either android or ios
    platform: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    environment: { type: String, required: true },
    originalTransactionId: { type: String, required: true },
    latestReceipt: { type: String, required: false },
    productId: { type: String, required: true },
    isCancelled: { type: Boolean, default: false },
    purchasedDateMs: { type: Number, default: Date.now() },
    expiresDateMs: { type: Number, default: Date.now() },
    cancellationDateMs: { type: Number, default: Date.now() },
    disabled: { type: Boolean, required: false },
    validationResponse: { type: String },
  },
  {
    timestamps: true,
  },
);

SubscriptionSchema.plugin(mongoosePaginate);

const SubscriptionModel: ISubscriptionModel = model<
  ISubscription,
  ISubscriptionModel
>('Subscription', SubscriptionSchema);

export default SubscriptionModel;
