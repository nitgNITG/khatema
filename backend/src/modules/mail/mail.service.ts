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
}
