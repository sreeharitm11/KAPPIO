import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(2, 120)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(10, 30)
  phone: string;

  @IsString()
  @MinLength(6)
  password: string;
}
