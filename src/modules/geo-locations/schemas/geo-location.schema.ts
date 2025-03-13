import { Schema, model } from 'mongoose';
import mongoosePaginate = require('mongoose-paginate-v2');
import {
  IGeoLocation,
  IGeoLocationModel,
} from '../interfaces/geo-location.interface';

export const GeoLocationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    alertId: { type: Schema.Types.ObjectId },
    coordinates: { type: [Number, Number], required: true },
    accuracy: { type: Number, required: true },
    type: { type: String, enum: ['point'], default: 'point' },
  },
  {
    timestamps: true,
  },
);

GeoLocationSchema.plugin(mongoosePaginate);

const GeoLocationModel: IGeoLocationModel = model<
  IGeoLocation,
  IGeoLocationModel
>('GeoLocation', GeoLocationSchema);

export default GeoLocationModel;
