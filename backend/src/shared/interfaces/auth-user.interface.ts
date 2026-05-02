import { UserRole } from '../../common/enums/user-role.enum';

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
}
