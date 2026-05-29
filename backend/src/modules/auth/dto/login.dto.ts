import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'بريد إلكتروني غير صالح' })
  email: string;

  @IsString()
  password: string;
}
