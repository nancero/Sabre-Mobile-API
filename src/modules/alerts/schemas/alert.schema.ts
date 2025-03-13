import { Schema, model } from 'mongoose';
import mongoosePaginate = require('mongoose-paginate-v2');

import { IAlert, IAlertModel } from '../interfaces/alert.interface';
import { AlertStatus, AlarmStatus } from '../../../constants/enums';

export const AlertSchema: Schema = new Schema(
  {
    endAt: { type: Date, default: null },
    alarmId: { type: String, default: null },
    createdAtLocationId: { type: Schema.Types.ObjectId },
    endAtLocationId: { type: Schema.Types.ObjectId },
    currentLocationId: { type: Schema.Types.ObjectId },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      required: true,
    },
    isTriggerByDevice: { type: Boolean, required: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    canceledBy: { type: String },
    alarmStatus: {
      type: String,
      enum: Object.values(AlarmStatus),
    },
  },
  {
    timestamps: true,
  },
);

AlertSchema.plugin(mongoosePaginate);

const AlertModel: IAlertModel = model<IAlert, IAlertModel>(
  'Alert',
  AlertSchema,
);

export default AlertModel;
