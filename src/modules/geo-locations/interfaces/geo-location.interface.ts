import { Model, Document, Schema } from 'mongoose';

export interface IGeoLocation extends Document {
  readonly userId: string;
  readonly coordinates?: [number, number];
  readonly type: string;
  readonly alertId?: string;
  readonly accuracy?: number;
}

export type GeoLocationList = {
  docs: IGeoLocation[];
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

export interface IGeoLocationModel extends Model<IGeoLocation> {
  paginate(
    query: object,
    options: Partial<optionsType>,
  ): Promise<GeoLocationList>;
}
