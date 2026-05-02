import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CollectCodPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  collectedAmount: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
