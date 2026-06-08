'use client';

import { useT } from '@/store/langStore';

export default function TermsPage() {
  const { isAr, dir } = useT();

  return (
    <div dir={dir} className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold mb-2">
        {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
      </h1>
      <p className="text-sm text-muted mb-8">
        {isAr ? 'آخر تحديث: مايو 2025' : 'Last updated: May 2025'}
      </p>

      <div className="prose prose-sm max-w-none space-y-6 text-foreground">
        {isAr ? (
          <>
            <section>
              <h2 className="text-xl font-bold mb-2">١. القبول بالشروط</h2>
              <p className="text-muted leading-relaxed">باستخدامك لمنصة ختمة، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام المنصة.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٢. الخدمة المقدمة</h2>
              <p className="text-muted leading-relaxed">ختمة منصة إلكترونية تُتيح للمستخدمين إنشاء وإدارة ختمات القرآن الكريم بشكل فردي وجماعي. الخدمة مجانية للاستخدام الشخصي.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٣. حسابات المستخدمين</h2>
              <p className="text-muted leading-relaxed">أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور. يجب أن تكون المعلومات التي تُقدّمها عند التسجيل صحيحة وحديثة.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٤. الاستخدام المقبول</h2>
              <p className="text-muted leading-relaxed">توافق على عدم استخدام المنصة لأي غرض غير قانوني أو ضار، وعدم نشر محتوى مسيء أو غير لائق، وعدم انتهاك حقوق الآخرين.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٥. الملكية الفكرية</h2>
              <p className="text-muted leading-relaxed">جميع المحتويات والتصاميم والشفرات البرمجية في المنصة مملوكة للشركة الوطنية لتكنولوجيا المعلومات (NITG) ومحمية بموجب قوانين حقوق النشر.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٦. إخلاء المسؤولية</h2>
              <p className="text-muted leading-relaxed">تُقدَّم الخدمة "كما هي" دون ضمانات صريحة أو ضمنية. لن تكون الشركة مسؤولة عن أي أضرار ناجمة عن استخدام أو عدم إمكانية استخدام الخدمة.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٧. التعديلات</h2>
              <p className="text-muted leading-relaxed">نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو عبر إشعار في المنصة.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">٨. التواصل</h2>
              <p className="text-muted leading-relaxed">لأي استفسار حول هذه الشروط، تواصل معنا على: <a href="mailto:support@khatema.com" className="text-primary hover:underline">support@khatema.com</a></p>
            </section>
          </>
        ) : (
          <>
            <section>
              <h2 className="text-xl font-bold mb-2">1. Acceptance of Terms</h2>
              <p className="text-muted leading-relaxed">By using the Khatma platform, you agree to be bound by these Terms and Conditions. If you do not agree to any of these terms, please stop using the platform.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">2. Service Description</h2>
              <p className="text-muted leading-relaxed">Khatma is an online platform that allows users to create and manage Quran recitation completions (khatmas) individually and collectively. The service is free for personal use.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">3. User Accounts</h2>
              <p className="text-muted leading-relaxed">You are responsible for maintaining the confidentiality of your account credentials. The information you provide at registration must be accurate and up to date.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">4. Acceptable Use</h2>
              <p className="text-muted leading-relaxed">You agree not to use the platform for any unlawful or harmful purpose, not to post offensive or inappropriate content, and not to violate others' rights.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">5. Intellectual Property</h2>
              <p className="text-muted leading-relaxed">All content, designs, and code on the platform are owned by the National Company for Information Technology (NITG) and protected by copyright law.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">6. Disclaimer</h2>
              <p className="text-muted leading-relaxed">The service is provided "as is" without express or implied warranties. The company will not be liable for any damages arising from use or inability to use the service.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">7. Modifications</h2>
              <p className="text-muted leading-relaxed">We reserve the right to modify these terms at any time. You will be notified of any material changes via email or a notice on the platform.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">8. Contact</h2>
              <p className="text-muted leading-relaxed">For any questions about these terms, contact us at: <a href="mailto:support@khatema.com" className="text-primary hover:underline">support@khatema.com</a></p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
