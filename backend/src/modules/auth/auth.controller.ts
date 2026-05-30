import {
  Controller, Post, Body, Res, Req, UseGuards, Get, HttpCode, HttpStatus,
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

@Throttle({ default: { ttl: 60000, limit: 5 } })
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private config: ConfigService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const result = await this.auth.register(dto, req.ip);
    this.setRefreshCookie(res, result.refreshToken);
    return { success: true, data: { user: result.user, accessToken: result.accessToken, expiresIn: 900 }, message: 'تم إنشاء الحساب بنجاح' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const result = await this.auth.login(dto, req.ip);
    this.setRefreshCookie(res, result.refreshToken);
    return { success: true, data: { user: result.user, accessToken: result.accessToken, expiresIn: 900 } };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'];
    const result = await this.auth.refresh(token, req.ip);
    this.setRefreshCookie(res, result.refreshToken);
    return { success: true, data: { accessToken: result.accessToken, expiresIn: 900 } };
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
    this.setRefreshCookie(res, result.refreshToken as string);
    return { success: true, data: result };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: Express.User) {
    return { success: true, data: user };
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Passport redirects to Google — no body needed
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as any;
    const result = await this.auth.loginWithGoogle(profile, req.ip);
    this.setRefreshCookie(res, result.refreshToken);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const user = encodeURIComponent(JSON.stringify(result.user));
    res.redirect(`${frontendUrl}/auth/callback?token=${result.accessToken}&user=${user}`);
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
