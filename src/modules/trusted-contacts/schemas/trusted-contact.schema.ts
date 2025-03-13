import { Schema, model } from 'mongoose';
import mongoosePaginate = require('mongoose-paginate-v2');

import {
  ITrustedContact,
  ITrustedContactModel,
} from '../interfaces/trusted-contact.interface';
import { convertPhone } from '../../../common/helpers/phone-utils';

export const TrustedContactSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    verifyToken: { type: String },
    phone: { type: String, required: true },
    phoneNumberVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// user update phone of trusted contact
TrustedContactSchema.pre<ITrustedContact>('save', function(next) {
  if ((this.isNew || this.isModified('phone')) && this.phone) {
    this.phone = convertPhone(this.phone);
    this.phoneNumberVerified = false;
    // TODO: Send verification text to phone
    next();
  } else {
    next();
  }
});

TrustedContactSchema.plugin(mongoosePaginate);

const TrustedContactModel: ITrustedContactModel = model<
  ITrustedContact,
  ITrustedContactModel
>('TrustedContact', TrustedContactSchema);

export default TrustedContactModel;
