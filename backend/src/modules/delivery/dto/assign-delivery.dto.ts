import { IsUUID } from 'class-validator';

export class AssignDeliveryDto {
  @IsUUID()
  partnerId: string;
}
