'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/store/langStore';

export default function AboutPage() {
  const { isAr, dir } = useT();

  const values = isAr ? [
    { icon: '📖', title: 'القرآن أولاً', desc: 'كل شيء في المنصة يخدم هدفاً واحداً: مساعدة المسلمين على إتمام كلام الله.' },
    { icon: '🤝', title: 'التعاون', desc: 'نؤمن أن العمل الجماعي يُيسّر الأعمال الصالحة ويجعلها ممتعة ومستدامة.' },
    { icon: '💎', title: 'البساطة', desc: 'نُصمّم المنصة لتكون بسيطة يستخدمها الجميع، من الجدة إلى الحفيد.' },
    { icon: '🔒', title: 'الأمان والخصوصية', desc: 'بياناتك وبيانات مجموعتك في أمان تام ولن تُشارَك مع أي طرف ثالث.' },
  ] : [
    { icon: '📖', title: 'Quran First', desc: 'Everything on the platform serves one goal: helping Muslims complete the word of God.' },
    { icon: '🤝', title: 'Collaboration', desc: 'We believe collective effort makes good deeds easier and more sustainable.' },
    { icon: '💎', title: 'Simplicity', desc: 'We design the platform to be simple for everyone — from grandmothers to grandchildren.' },
    { icon: '🔒', title: 'Security & Privacy', desc: 'Your data and your group\'s data are completely secure and will never be shared.' },
  ];

  return (
    <div dir={dir} className="max-w-4xl mx-auto px-4 py-16 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          {isAr ? 'عن ختمة' : 'About Khatma'}
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'ختمة منصة رقمية تُمكّن المسلمين من إتمام ختم القرآن الكريم جماعةً بطريقة منظمة وبسيطة، مع عائلاتهم وأصدقائهم ومجتمعاتهم.'
            : 'Khatma is a digital platform that enables Muslims to complete the Holy Quran recitation together in an organized and simple way, with their families, friends, and communities.'}
        </p>
      </div>

      {/* Mission */}
      <div className="bg-primary rounded-3xl p-10 text-white text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full" />
        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-3">
            {isAr ? 'رسالتنا' : 'Our Mission'}
          </p>
          <p className="text-2xl md:text-3xl font-extrabold leading-snug max-w-2xl mx-auto">
            {isAr
              ? 'أن نُيسّر على كل مسلم إتمام كلام الله بمرافقة من يحب'
              : 'To make it easy for every Muslim to complete the word of God alongside those they love'}
          </p>
        </div>
      </div>

      {/* Values */}
      <div>
        <h2 className="text-2xl font-extrabold text-center mb-8">
          {isAr ? 'قيمنا' : 'Our Values'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {values.map((v) => (
            <div key={v.title} className="card-lift bg-card border border-border rounded-2xl p-6 flex gap-4">
              <span className="text-3xl shrink-0">{v.icon}</span>
              <div>
                <h3 className="font-bold text-base mb-1">{v.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NITG section */}
      <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-5">
        <p className="text-sm text-muted font-semibold uppercase tracking-widest">
          {isAr ? 'تنفيذ' : 'Powered by'}
        </p>
        <Link href="https://nitg-eg.com/ar" target="_blank" rel="noopener noreferrer"
          className="inline-flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative w-20 h-17">
            <Image src="/nitg-logo.avif" alt="NITG" fill className="object-contain" unoptimized />
          </div>
          <div>
            <p className="font-extrabold text-lg text-foreground">
              {isAr ? 'الشركة الوطنية لتكنولوجيا المعلومات' : 'National Company for Information Technology'}
            </p>
            <p className="text-sm text-primary mt-1">nitg-eg.com</p>
          </div>
        </Link>
        <p className="text-muted text-sm max-w-lg mx-auto">
          {isAr
            ? 'الشركة الوطنية لتكنولوجيا المعلومات (NITG) شركة مصرية متخصصة في بناء الحلول التقنية التي تخدم المجتمع.'
            : 'NITG (National Company for Information Technology) is an Egyptian company specializing in building tech solutions that serve the community.'}
        </p>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <p className="text-muted">
          {isAr ? 'جاهز لتبدأ ختمتك الأولى؟' : 'Ready to start your first khatma?'}
        </p>
        <Link href="/register" className="btn-duo btn-duo-primary text-base px-10 py-3.5 inline-flex">
          {isAr ? 'سجّل الآن مجاناً' : 'Register for Free'}
        </Link>
      </div>
    </div>
  );
}
