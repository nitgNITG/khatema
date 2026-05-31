import {
  Controller, Post, Body, Res, Req, UseGuards, Get, HttpCode, HttpStatus, ForbiddenException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SettingsService } from '@/modules/settings/settings.service';

@Throttle({ default: { ttl: 60000, limit: 5 } })
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
    private settings: SettingsService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const mode = await this.settings.getValue('registrationMode');
    if (mode === 'CLOSED') throw new ForbiddenException('التسجيل مغلق حالياً');
    if (mode === 'INVITE_ONLY') throw new ForbiddenException('التسجيل بالدعوة فقط');

    const result = await this.auth.register(dto, req.ip);
    await this.setRefreshCookie(res, result.refreshToken);
    const days = await this.settings.getValue('sessionDurationDays');
    return { success: true, data: { user: result.user, accessToken: result.accessToken, expiresIn: 900, sessionDays: days }, message: 'تم إنشاء الحساب بنجاح' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const result = await this.auth.login(dto, req.ip);
    await this.setRefreshCookie(res, result.refreshToken);
    const days = await this.settings.getValue('sessionDurationDays');
    return { success: true, data: { user: result.user, accessToken: result.accessToken, expiresIn: 900, sessionDays: days } };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'];
    const result = await this.auth.refresh(token, req.ip);
    await this.setRefreshCookie(res, result.refreshToken);
    const days = await this.settings.getValue('sessionDurationDays');
    return { success: true, data: { accessToken: result.accessToken, expiresIn: 900, sessionDays: days } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'];
    if (token) await this.auth.logout(token);
    res.clearCookie('refresh_token');
    return { success: true, message: 'تم تسجيل الخروج' };
  }

  @Post('send-email-otp')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async sendEmailOtp(@CurrentUser() user: any, @Req() req: Request) {
    await this.auth.sendEmailOtp(user.email, req.ip);
    return { success: true, message: 'تم إرسال رمز التحقق' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async verifyEmail(@CurrentUser() user: any, @Body() body: { otp: string }) {
    return this.auth.verifyEmailOtp(user.id, body.otp);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    await this.auth.forgotPassword(body.email);
    return { success: true, message: 'إذا كان البريد مسجلاً، سيصلك رابط إعادة التعيين' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    await this.auth.resetPassword(body.token, body.password);
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() body: { phone: string }) {
    await this.auth.sendOtp(body.phone);
    return { success: true, message: 'تم إرسال الرمز' };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() body: { phone: string; otp: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.verifyOtp(body.phone, body.otp);
    await this.setRefreshCookie(res, result.refreshToken as string);
    return { success: true, data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: Express.User) {
    return { success: true, data: user };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as any;
    const result = await this.auth.loginWithGoogle(profile, req.ip);
    await this.setRefreshCookie(res, result.refreshToken);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const user = encodeURIComponent(JSON.stringify(result.user));
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}&user=${user}`);
  }

  // ── Public settings endpoint (frontend uses this to set cookie lifetime) ──
  @Get('settings')
  @HttpCode(HttpStatus.OK)
  async publicSettings() {
    const s = await this.settings.get();
    return {
      sessionDurationDays: s.sessionDurationDays,
      registrationMode: s.registrationMode,
      maintenanceMode: s.maintenanceMode,
      maintenanceMessage: s.maintenanceMessage,
    };
  }

  private async setRefreshCookie(res: Response, token: string) {
    const days = await this.settings.getValue('sessionDurationDays');
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: days * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
