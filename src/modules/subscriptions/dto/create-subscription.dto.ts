import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length, IsDate } from 'class-validator';

type ReceiptInfo = {
  product_id: string;
  transaction_id: string;
  expires_date: string;
  purchase_date: string;
};

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  readonly environment: string;
}
