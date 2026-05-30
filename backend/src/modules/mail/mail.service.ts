import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        secure: this.config.get<boolean>('SMTP_SECURE', false),
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendEmailOtp(toEmail: string, otp: string) {
    if (!this.transporter) {
      this.logger.log(`[MAIL] OTP for ${toEmail}: ${otp}`);
      return;
    }

    const from = this.config.get<string>('SMTP_FROM', 'ختمة <noreply@khatema.app>');
    await this.transporter.sendMail({
      from,
      to: toEmail,
      subject: 'رمز التحقق من بريدك الإلكتروني',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2d6a4f;">تحقق من بريدك الإلكتروني</h2>
          <p>مرحباً، استخدم الرمز التالي للتحقق من حسابك:</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2d6a4f;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px;">هذا الرمز صالح لمدة 5 دقائق. إذا لم تطلب هذا الرمز يمكنك تجاهل هذا البريد.</p>
        </div>
      `,
    });
  }

  async sendDeadlineReminder(opts: {
    toEmail: string;
    displayName: string;
    khatmaTitle: string;
    endDate: Date;
    hoursLeft: number;
    khatmaUrl: string;
  }) {
    const { toEmail, displayName, khatmaTitle, endDate, hoursLeft, khatmaUrl } = opts;

    if (!this.transporter) {
      this.logger.log(`[MAIL] Deadline reminder for ${toEmail}: "${khatmaTitle}" ends in ${hoursLeft}h`);
      return;
    }

    const from = this.config.get<string>('SMTP_FROM', 'ختمة <noreply@khatema.app>');
    await this.transporter.sendMail({
      from,
      to: toEmail,
      subject: `تذكير: ختمة "${khatmaTitle}" تنتهي خلال ${hoursLeft} ساعة`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2d6a4f;">تذكير بانتهاء الختمة</h2>
          <p>السلام عليكم ${displayName},</p>
          <p>تذكير بأن ختمة <strong>"${khatmaTitle}"</strong> ستنتهي خلال <strong>${hoursLeft} ساعة</strong>.</p>
          <p>تاريخ الانتهاء: ${endDate.toLocaleDateString('ar-SA')}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${khatmaUrl}" style="background-color: #2d6a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
              افتح الختمة
            </a>
          </div>
        </div>
      `,
    });
  }

  async sendKhatmaInvite(opts: {
    toEmail: string;
    toName?: string;
    fromName: string;
    khatmaTitle: string;
    inviteUrl: string;
  }) {
    const { toEmail, toName, fromName, khatmaTitle, inviteUrl } = opts;

    if (!this.transporter) {
      this.logger.log(
        `[MAIL] Invite to ${toEmail} for khatma "${khatmaTitle}": ${inviteUrl}`,
      );
      return;
    }

    const from = this.config.get<string>('SMTP_FROM', 'ختمة <noreply@khatema.app>');

    await this.transporter.sendMail({
      from,
      to: toEmail,
      subject: `${fromName} دعاك للمشاركة في ختمة "${khatmaTitle}"`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #2d6a4f;">دعوة للمشاركة في ختمة قرآنية</h2>
          <p>السلام عليكم${toName ? ` ${toName}` : ''},</p>
          <p>قام <strong>${fromName}</strong> بدعوتك للمشاركة في ختمة قرآنية بعنوان:</p>
          <p style="font-size: 20px; font-weight: bold; color: #2d6a4f; text-align: center; padding: 16px;">"${khatmaTitle}"</p>
          <p>انضم الآن واحجز جزءك من القرآن الكريم:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" style="background-color: #2d6a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
              انضم للختمة
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">هذه الدعوة صالحة لمدة 48 ساعة. إذا لم تتوقع هذه الدعوة يمكنك تجاهل هذا البريد.</p>
        </div>
      `,
    });
  }

  async sendParticipantReminder(opts: {
    toEmail: string;
    displayName: string;
    khatmaTitle: string;
    endDate?: Date | null;
    remainingParts: number;
    totalParts: number;
    khatmaUrl: string;
    inviteUrl: string;
  }) {
    const { toEmail, displayName, khatmaTitle, endDate, remainingParts, totalParts, khatmaUrl, inviteUrl } = opts;

    const endDateLine = endDate
      ? `<p>📅 <strong>تاريخ انتهاء الختمة:</strong> ${endDate.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>`
      : '';

    const body = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2d6a4f;">تذكير بختمة "${khatmaTitle}"</h2>
        <p>السلام عليكم ${displayName},</p>
        <p>تذكير من صاحب الختمة بشأن ختمة <strong>"${khatmaTitle}"</strong>.</p>
        ${endDateLine}
        <p>📖 <strong>الأجزاء المتبقية:</strong> ${remainingParts} من أصل ${totalParts} جزءاً لم تُحجز بعد.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${khatmaUrl}" style="background-color: #2d6a4f; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block; margin-bottom: 12px;">
            افتح الختمة
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #555; font-size: 14px;">هل تعرف أحداً يريد المشاركة؟ شارك هذا الرابط:</p>
        <p style="word-break: break-all; font-size: 13px; background: #f5f5f5; padding: 10px; border-radius: 6px; direction: ltr;">
          <a href="${inviteUrl}" style="color: #2d6a4f;">${inviteUrl}</a>
        </p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(`[MAIL] Participant reminder to ${toEmail} for khatma "${khatmaTitle}"`);
      return;
    }

    const from = this.config.get<string>('SMTP_FROM', 'ختمة <noreply@khatema.app>');
    await this.transporter.sendMail({
      from,
      to: toEmail,
      subject: `تذكير: ختمة "${khatmaTitle}" — ${remainingParts} جزء لم يُحجز بعد`,
      html: body,
    });
  }
}
