import { Model, Document } from 'mongoose';

export interface IAlert extends Document {
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly endAt: Date;
  readonly updateAt: Date;
  readonly status: string;
  readonly alarmId: string;
  readonly createdAtLocationId: string;
  readonly endAtLocationId: string;
  readonly isTriggerByDevice: boolean; // is trigger by Sabre device
  readonly currentLocationId: string;
}

export type AlertList = {
  docs: IAlert[];
  totalDocs: number;
  totalPages: number;
  limit: number;
  offset: number;
  page: number;
  hasPrevPage: number;
  hasNextPage: number;
  prevPage: number;
  nextPage: number;
  pagingCounter: number;
  meta: object;
};

type optionsType = {
  select: string;
  sort: any;
  populate: string;
  lean: boolean;
  offset: number;
  limit: number;
};

export interface IAlertModel extends Model<IAlert> {
  paginate(query: object, options: Partial<optionsType>): Promise<AlertList>;
}
