import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DatabaseService } from '@/database/database.service';
import { RedisService } from '@/redis/redis.service';
import { MailService } from '@/modules/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { v4 as uuidv4 } from 'uuid';
import { SettingsService } from '@/modules/settings/settings.service';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
    private redis: RedisService,
    private config: ConfigService,
    private mail: MailService,
    private settings: SettingsService,
  ) {}

  async register(dto: RegisterDto, ipAddress?: string) {
    const existing = await this.db.user.findFirst({
      where: { OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
    });

    if (existing?.email === dto.email) throw new ConflictException('البريد الإلكتروني مستخدم');
    if (dto.phone && existing?.phone === dto.phone) throw new ConflictException('رقم الهاتف مستخدم');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { defaultMaxCollective, defaultMaxIndividual } = await this.settings.get();

    const user = await this.db.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        displayName: dto.displayName,
        maxCollectiveKhatmas: defaultMaxCollective,
        maxIndividualKhatmas: defaultMaxIndividual,
      },
      select: { id: true, displayName: true, email: true, role: true },
    });

    const tokens = await this.generateTokens(user.id, user.email!, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress);

    // Send email OTP for new registrations
    await this.sendEmailOtp(dto.email!, ipAddress);

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async sendEmailOtp(email: string, ip?: string) {
    const ipKey = `otp:count:ip:${ip || 'unknown'}`;
    const emailKey = `otp:count:email:${email}`;

    const [ipCount, emailCount] = await Promise.all([
      this.redis.get(ipKey),
      this.redis.get(emailKey),
    ]);

    if (parseInt(ipCount || '0') >= 10) {
      throw new HttpException('تم تجاوز الحد المسموح. حاول لاحقاً', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (parseInt(emailCount || '0') >= 5) {
      throw new HttpException('انتظر ساعة قبل المحاولة مجدداً', HttpStatus.TOO_MANY_REQUESTS);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    await Promise.all([
      this.redis.set(`otp:email:${email}`, hash, 300),
      this.redis.incr(ipKey, 3600),
      this.redis.incr(emailKey, 3600),
    ]);

    await this.mail.sendEmailOtp(email, otp);
  }

  async verifyEmailOtp(userId: string, otp: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
    if (!user?.email) throw new BadRequestException('لا يوجد بريد إلكتروني مرتبط');

    const stored = await this.redis.get(`otp:email:${user.email}`);
    if (!stored) throw new BadRequestException('الرمز منتهٍ أو غير موجود');

    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    const valid = crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(hash));
    if (!valid) throw new UnauthorizedException('الرمز غير صحيح');

    await Promise.all([
      this.db.user.update({ where: { id: userId }, data: { emailVerified: true } }),
      this.redis.del(`otp:email:${user.email}`),
    ]);

    return { success: true, message: 'تم التحقق من البريد الإلكتروني بنجاح' };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    if (user.status === 'SUSPENDED') throw new UnauthorizedException('الحساب موقوف');
    if (user.deletedAt) throw new UnauthorizedException('الحساب غير موجود');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const tokens = await this.generateTokens(user.id, user.email!, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress);

    return {
      user: { id: user.id, displayName: user.displayName, email: user.email, role: user.role },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string, ipAddress?: string) {
    const session = await this.db.session.findUnique({
      where: { refreshToken },
      include: { user: { select: { id: true, email: true, role: true, status: true } } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('الجلسة منتهية، يرجى تسجيل الدخول');
    }

    if (session.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('الحساب غير نشط');
    }

    // Revoke old session
    await this.db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });

    const tokens = await this.generateTokens(session.user.id, session.user.email!, session.user.role);
    await this.saveRefreshToken(session.user.id, tokens.refreshToken, ipAddress);

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(refreshToken: string) {
    await this.db.session.updateMany({
      where: { refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  async sendOtp(phone: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redis.set(`otp:${phone}`, otp, 300); // 5 min TTL
    // TODO: integrate SMS provider
    console.log(`OTP for ${phone}: ${otp}`); // Dev only
  }

  async verifyOtp(phone: string, otp: string): Promise<{ user: object; accessToken: string; refreshToken: string }> {
    const stored = await this.redis.get(`otp:${phone}`);
    if (!stored || stored !== otp) throw new BadRequestException('الرمز غير صحيح أو منتهٍ');

    await this.redis.del(`otp:${phone}`);

    let user = await this.db.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.db.user.create({
        data: { phone, displayName: phone, phoneVerified: true },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email || phone, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, displayName: user.displayName, role: user.role },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const secret = this.config.get<string>('JWT_SECRET', 'dev-secret');
    const accessExpiry = this.config.get<string>('JWT_ACCESS_EXPIRY', '15m');
    const refreshExpiry = this.config.get<string>('JWT_REFRESH_EXPIRY', '7d');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync({ sub: userId, email, role }, { secret, expiresIn: accessExpiry as any }),
      this.jwt.signAsync({ sub: userId, type: 'refresh' }, { secret, expiresIn: refreshExpiry as any }),
    ]);

    return { accessToken, refreshToken };
  }

  async loginWithGoogle(profile: { googleId: string; email?: string; displayName: string; avatarUrl?: string }, ipAddress?: string) {
    let user = profile.email
      ? await this.db.user.findFirst({ where: { OR: [{ email: profile.email }] } })
      : null;

    if (!user) {
      const { defaultMaxCollective, defaultMaxIndividual } = await this.settings.get();
      user = await this.db.user.create({
        data: {
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          emailVerified: true,
          status: 'ACTIVE',
          maxCollectiveKhatmas: defaultMaxCollective,
          maxIndividualKhatmas: defaultMaxIndividual,
        },
      });
    } else if (!user.avatarUrl && profile.avatarUrl) {
      user = await this.db.user.update({
        where: { id: user.id },
        data: { avatarUrl: profile.avatarUrl },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email || profile.displayName, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken, ipAddress);

    return {
      user: { id: user.id, displayName: user.displayName, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.db.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) return; // no email enumeration

    const token = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`pwd-reset:${token}`, user.id, 3600);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    await this.mail.sendPasswordReset(email, `${frontendUrl}/reset-password?token=${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`pwd-reset:${token}`);
    if (!userId) throw new BadRequestException('الرابط منتهي الصلاحية أو غير صالح');

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.db.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(`pwd-reset:${token}`);
    // Force re-login by revoking all sessions
    await this.db.session.updateMany({ where: { userId }, data: { revokedAt: new Date() } });
  }

  async getSessionDurationDays(): Promise<number> {
    return this.settings.getValue('sessionDurationDays');
  }

  private async saveRefreshToken(userId: string, refreshToken: string, ipAddress?: string) {
    const days = await this.settings.getValue('sessionDurationDays');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await this.db.session.create({
      data: { userId, refreshToken, expiresAt, ipAddress },
    });
  }
}
