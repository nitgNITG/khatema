'use client';

import { useT } from '@/store/langStore';

export default function ContactPage() {
  const { isAr, dir } = useT();

  const channels = isAr ? [
    { icon: '📧', label: 'البريد الإلكتروني', value: 'support@khatema.com', href: 'mailto:support@khatema.com' },
    { icon: '🌐', label: 'الموقع الإلكتروني', value: 'nitg-eg.com/ar', href: 'https://nitg-eg.com/ar' },
    { icon: '📍', label: 'المقر', value: 'مصر — القاهرة', href: null },
  ] : [
    { icon: '📧', label: 'Email', value: 'support@khatema.com', href: 'mailto:support@khatema.com' },
    { icon: '🌐', label: 'Website', value: 'nitg-eg.com/ar', href: 'https://nitg-eg.com/ar' },
    { icon: '📍', label: 'Location', value: 'Egypt — Cairo', href: null },
  ];

  const faqs = isAr ? [
    { q: 'هل ختمة مجانية؟', a: 'نعم، ختمة مجانية تماماً لجميع المستخدمين.' },
    { q: 'كم عدد المشاركين في الختمة؟', a: 'يمكن أن تضم الختمة ما يصل إلى 100 مشارك.' },
    { q: 'هل يمكنني إنشاء ختمة خاصة؟', a: 'نعم، يمكنك إنشاء ختمة خاصة يراها فقط من تدعوهم.' },
    { q: 'كيف أتواصل مع الدعم؟', a: 'راسلنا على البريد الإلكتروني أو استخدم صفحة المقترحات.' },
  ] : [
    { q: 'Is Khatma free?', a: 'Yes, Khatma is completely free for all users.' },
    { q: 'How many participants can join a khatma?', a: 'A khatma can have up to 100 participants.' },
    { q: 'Can I create a private khatma?', a: 'Yes, you can create a private khatma visible only to those you invite.' },
    { q: 'How do I contact support?', a: 'Email us or use the Suggestions page.' },
  ];

  return (
    <div dir={dir} className="max-w-4xl mx-auto px-4 py-16 space-y-14">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold">
          {isAr ? 'اتصل بنا' : 'Contact Us'}
        </h1>
        <p className="text-muted text-lg max-w-lg mx-auto">
          {isAr
            ? 'نسعد بتواصلك معنا. فريقنا يرد خلال 24 ساعة'
            : 'We\'d love to hear from you. Our team responds within 24 hours.'}
        </p>
      </div>

      {/* Contact channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {channels.map((c) => (
          <div key={c.label} className="card-lift bg-card border border-border rounded-2xl p-6 text-center space-y-3">
            <span className="text-4xl">{c.icon}</span>
            <p className="font-semibold text-sm text-muted">{c.label}</p>
            {c.href ? (
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline break-all">
                {c.value}
              </a>
            ) : (
              <p className="font-bold">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-extrabold mb-6 text-center">
          {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.q} className="group bg-card border border-border rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-sm select-none hover:bg-border/20 transition-colors list-none">
                <span>{faq.q}</span>
                <svg className="w-4 h-4 text-muted group-open:rotate-180 transition-transform shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted leading-relaxed">{faq.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
