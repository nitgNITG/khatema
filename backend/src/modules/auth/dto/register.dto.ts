import { IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'بريد إلكتروني غير صالح' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'كلمة المرور يجب أن تحتوي على حرف كبير ورقم ورمز خاص',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'الاسم يجب أن يكون حرفين على الأقل' })
  displayName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
