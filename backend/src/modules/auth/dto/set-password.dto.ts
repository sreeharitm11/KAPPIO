import { IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsString()
  @MinLength(32)
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
