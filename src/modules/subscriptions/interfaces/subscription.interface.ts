import { Model, Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  readonly userId: string;
  readonly originalTransactionId: string;
  // readonly status: string;
  readonly expiredDate: string; // save as timestamp ms
  readonly receiptData: string;
}

export type SubscriptionList = {
  docs: ISubscription[];
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

export interface ISubscriptionModel extends Model<ISubscription> {
  paginate(
    query: object,
    options: Partial<optionsType>,
  ): Promise<SubscriptionList>;
}
