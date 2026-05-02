import { IsEmail, IsIn, IsString, Length } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateTeamInvitationDto {
  @IsString()
  @Length(2, 120)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(10, 30)
  phone: string;

  @IsIn([UserRole.DELIVERY, UserRole.STAFF])
  role: UserRole;
}
