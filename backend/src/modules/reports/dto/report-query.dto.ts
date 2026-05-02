import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ReportPeriod } from '../../../common/enums/report-period.enum';

export class ReportQueryDto {
  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  @IsOptional()
  @IsDateString()
  anchorDate?: string;
}
