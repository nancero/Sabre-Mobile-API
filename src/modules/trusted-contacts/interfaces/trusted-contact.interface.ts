import { Model, Document, Schema } from 'mongoose';

export interface ITrustedContact extends Document {
  firstName: string;
  lastName: string;
  phone: string;
  userId: string;
  phoneNumberVerified?: boolean;
  verifyToken?: string;
}

export type TrustedContactList = {
  docs: ITrustedContact[];
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
export interface ITrustedContactModel extends Model<ITrustedContact> {
  paginate(
    query: object,
    options: Partial<optionsType>,
  ): Promise<TrustedContactList>;
}
