import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ExpenseType } from '../../../common/enums/expense-type.enum';

export class CreateExpenseDto {
  @IsDateString()
  date: string;

  @IsString()
  @MaxLength(180)
  description: string;

  @IsString()
  @MaxLength(100)
  category: string;

  @IsEnum(ExpenseType)
  type: ExpenseType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
