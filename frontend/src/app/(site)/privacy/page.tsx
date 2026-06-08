'use client';

import { useT } from '@/store/langStore';

export default function PrivacyPage() {
  const { isAr, dir } = useT();

  return (
    <div dir={dir} className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2">
        {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
      </h1>
      <p className="text-sm text-muted mb-8">
        {isAr ? 'آخر تحديث: مايو 2025' : 'Last updated: May 2025'}
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        {isAr ? (
          <>
            <section>
              <h2 className="text-xl font-bold mb-2">١. المعلومات التي نجمعها</h2>
              <p className="text-muted leading-relaxed">نجمع المعلومات التي تُقدّمها مباشرةً مثل: الاسم، البريد الإلكتروني، ورقم الهاتف. كما نجمع بيانات الاستخدام تلقائياً مثل: عنوان IP، نوع المتصفح، والصفحات التي تزورها.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٢. كيف نستخدم معلوماتك</h2>
              <ul className="list-disc list-inside text-muted space-y-1 leading-relaxed">
                <li>توفير الخدمة وتحسينها</li>
                <li>إرسال الإشعارات المتعلقة بختمتك</li>
                <li>التواصل معك للدعم الفني</li>
                <li>تحليل استخدام المنصة لتحسين التجربة</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٣. مشاركة المعلومات</h2>
              <p className="text-muted leading-relaxed">لا نبيع معلوماتك الشخصية لأي طرف ثالث. قد نشارك بيانات مجمّعة وغير شخصية لأغراض تحليلية. نشارك المعلومات عند الضرورة القانونية فقط.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٤. الكوكيز</h2>
              <p className="text-muted leading-relaxed">نستخدم كوكيز جلسة المستخدم للحفاظ على تسجيل دخولك. لا نستخدم كوكيز تتبع خارجية أو إعلانية.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٥. أمان البيانات</h2>
              <p className="text-muted leading-relaxed">نستخدم تشفير SSL وأفضل الممارسات الأمنية لحماية بياناتك. لا يمكن لأي عضو في الفريق الاطلاع على كلمات مرورك (مشفرة بالكامل).</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٦. حقوقك</h2>
              <p className="text-muted leading-relaxed">يحق لك طلب الاطلاع على بياناتك، تعديلها، أو حذفها في أي وقت. تواصل معنا على <a href="mailto:support@khatema.com" className="text-primary hover:underline">support@khatema.com</a>.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٧. بيانات الأطفال</h2>
              <p className="text-muted leading-relaxed">لا نجمع بيانات من أشخاص دون 13 عاماً عن قصد. إذا اكتشفنا مثل هذه البيانات، سنحذفها فوراً.</p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-bold mb-2">1. Information We Collect</h2>
              <p className="text-muted leading-relaxed">We collect information you provide directly such as: name, email address, and phone number. We also automatically collect usage data such as: IP address, browser type, and pages you visit.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted space-y-1 leading-relaxed">
                <li>Providing and improving the service</li>
                <li>Sending notifications related to your khatma</li>
                <li>Contacting you for technical support</li>
                <li>Analyzing platform usage to improve the experience</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">3. Information Sharing</h2>
              <p className="text-muted leading-relaxed">We do not sell your personal information to any third party. We may share aggregated, non-personal data for analytical purposes. We only share information when legally required.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">4. Cookies</h2>
              <p className="text-muted leading-relaxed">We use session cookies to maintain your login state. We do not use external tracking or advertising cookies.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">5. Data Security</h2>
              <p className="text-muted leading-relaxed">We use SSL encryption and security best practices to protect your data. No team member can view your passwords (fully encrypted).</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">6. Your Rights</h2>
              <p className="text-muted leading-relaxed">You have the right to access, modify, or delete your data at any time. Contact us at <a href="mailto:support@khatema.com" className="text-primary hover:underline">support@khatema.com</a>.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">7. Children's Data</h2>
              <p className="text-muted leading-relaxed">We do not knowingly collect data from persons under 13. If we discover such data, we will delete it immediately.</p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
