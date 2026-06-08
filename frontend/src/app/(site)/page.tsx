'use client';

import Link from 'next/link';
import { useT } from '@/store/langStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useMemo } from 'react';

/* ─────────────── Rotating quotes ─────────────── */
const QUOTES_AR = [
  { text: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ', source: 'سورة المائدة: ٢', type: 'quran' },
  { text: 'خيركم من تعلَّم القرآن وعلَّمه', source: 'رواه البخاري', type: 'hadith' },
  { text: 'اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه', source: 'رواه مسلم', type: 'hadith' },
  { text: 'مَن قرأ حرفاً من كتاب الله فله به حسنة والحسنة بعشر أمثالها', source: 'رواه الترمذي', type: 'hadith' },
  { text: 'وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ', source: 'سورة آل عمران: ١٣٣', type: 'quran' },
  { text: 'مَثَلُ الَّذِي يَقْرَأُ الْقُرْآنَ كَالْمَاهِرِ مَعَ السَّفَرَةِ الْكِرَامِ الْبَرَرَةِ', source: 'متفق عليه', type: 'hadith' },
];
const QUOTES_EN = [
  { text: 'Cooperate in righteousness and piety', source: 'Al-Ma\'idah: 2', type: 'quran' },
  { text: 'The best among you are those who learn the Quran and teach it', source: 'Al-Bukhari', type: 'hadith' },
  { text: 'Read the Quran — for it will come as an intercessor for its companions on the Day of Resurrection', source: 'Muslim', type: 'hadith' },
  { text: 'Whoever reads one letter from the Book of Allah, for him is a good deed — multiplied ten times', source: 'At-Tirmidhi', type: 'hadith' },
  { text: 'Hasten towards forgiveness from your Lord', source: 'Al-Imran: 133', type: 'quran' },
  { text: 'The one proficient in the Quran will be with the noble, righteous scribes (angels)', source: 'Agreed upon', type: 'hadith' },
];

/* ─────────────── Types of Khatmas ─────────────── */
const KHATMA_TYPES_AR = [
  { icon: '👨‍👩‍👧‍👦', label: 'ختمة عائلية', color: 'bg-primary/10 text-primary border-primary/20' },
  { icon: '🕌',        label: 'ختمة المسجد', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  { icon: '🎓',        label: 'ختمة الأصدقاء', color: 'bg-success/10 text-success border-success/20' },
  { icon: '🌙',        label: 'ختمة رمضان', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { icon: '🤲',        label: 'للوالدين / الأحياء', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { icon: '🕊️',        label: 'لروح المتوفى', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  { icon: '🌍',        label: 'ختمة لأهل غزة', color: 'bg-green-600/10 text-green-700 border-green-600/20' },
  { icon: '💊',        label: 'ختمة للمريض', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { icon: '🙏',        label: 'تفريج الكرب', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { icon: '⭐',        label: 'يوم عرفة', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  { icon: '🌐',        label: 'ختمة عامة', color: 'bg-info/10 text-info border-info/20' },
  { icon: '🔒',        label: 'ختمة خاصة', color: 'bg-border text-muted border-border' },
];
const KHATMA_TYPES_EN = [
  { icon: '👨‍👩‍👧‍👦', label: 'Family Khatma', color: 'bg-primary/10 text-primary border-primary/20' },
  { icon: '🕌',        label: 'Mosque Khatma', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  { icon: '🎓',        label: 'Friends Khatma', color: 'bg-success/10 text-success border-success/20' },
  { icon: '🌙',        label: 'Ramadan Khatma', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { icon: '🤲',        label: 'For Parents / Living', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { icon: '🕊️',        label: 'For the Deceased', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  { icon: '🌍',        label: 'For Gaza', color: 'bg-green-600/10 text-green-700 border-green-600/20' },
  { icon: '💊',        label: 'For the Sick', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { icon: '🙏',        label: 'Relief from Hardship', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { icon: '⭐',        label: 'Day of Arafah', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  { icon: '🌐',        label: 'Public Khatma', color: 'bg-info/10 text-info border-info/20' },
  { icon: '🔒',        label: 'Private Khatma', color: 'bg-border text-muted border-border' },
];

/* ─────────────── Why participate ─────────────── */
const WHY_AR = [
  { icon: '📖', title: 'أجر التلاوة', desc: 'كل حرف تقرأه يُكتب لك حسنة — والحسنة بعشر أمثالها. لا يضيع منها شيء.' },
  { icon: '🤝', title: 'التعاون على الخير', desc: '"وتعاونوا على البر والتقوى" — ختمتك الجماعية هي عبادة وتواصل في آنٍ معاً.' },
  { icon: '🔔', title: 'تذكير يومي', desc: 'لا تنسَ وِردك — الإشعارات الذكية تُذكّرك بلطف حين يحين وقت جزأك.' },
  { icon: '🎁', title: 'صدقة جارية رقمية', desc: 'أنشئ ختمة إهداءً لوالديك أو لميتٍ أحببته — يجري أجرها بعد رحيلهم.' },
];
const WHY_EN = [
  { icon: '📖', title: 'Reward for Every Letter', desc: 'Every letter you read earns you a good deed — multiplied ten times. Nothing is wasted.' },
  { icon: '🤝', title: 'Cooperating in Goodness', desc: '"Cooperate in righteousness and piety" — your group khatma is both worship and connection.' },
  { icon: '🔔', title: 'Daily Reminder', desc: 'Never miss your daily portion — smart notifications gently remind you when it\'s time.' },
  { icon: '🎁', title: 'Digital Ongoing Charity', desc: 'Create a khatma as a gift for your parents or a loved one — the reward flows even after their passing.' },
];

/* ─────────────── Testimonials ─────────────── */
const TESTI_AR = [
  { name: 'أم عمر', role: 'أم وربة منزل', text: 'خططت مع بناتي ختمة في رمضان — كانت تجربة لا تُنسى. كل يوم نتابع معاً كم اكتمل. شعور لا يُوصف!', avatar: '👩‍👧', stars: 5 },
  { name: 'محمد الغامدي', role: 'طالب جامعي في الغربة', text: 'أنشأت ختمة مع أصدقائي بعيداً عن الوطن — ربطنا بعضاً وأحسسنا بالجماعة رغم البُعد. جزاكم الله خيراً.', avatar: '👨‍💻', stars: 5 },
  { name: 'مجموعة مسجد النور', role: 'مجموعة مسجد', text: 'أكملنا ١٢ ختمة هذا العام. الأداة سهّلت التنظيم وجعلت الجميع يشارك بحماس وانتظام.', avatar: '🕌', stars: 5 },
];
const TESTI_EN = [
  { name: 'Umm Omar', role: 'Mother & homemaker', text: 'I planned a Ramadan khatma with my daughters — an unforgettable experience. Every day we tracked progress together. Indescribable!', avatar: '👩‍👧', stars: 5 },
  { name: 'Mohammed Al-Ghamdi', role: 'University student abroad', text: 'I started a khatma with friends far from home — it connected us and made us feel like a community despite the distance.', avatar: '👨‍💻', stars: 5 },
  { name: 'Al-Nour Mosque Group', role: 'Mosque community', text: 'We completed 12 khatmas this year. The platform made organizing easy and kept everyone participating with enthusiasm.', avatar: '🕌', stars: 5 },
];

/* ─────────────── Helper components ─────────────── */
function ProgressRing({ pct, size = 56 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" className="transition-all duration-700" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const { t, lang, isAr, dir } = useT();

  /* Rotating quote — changes every page load */
  const QUOTES = isAr ? QUOTES_AR : QUOTES_EN;
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [isAr]);

  /* Live stats from backend */
  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.get('/khatmas/public/stats').then((r) => r.data),
    staleTime: 60_000,
  });

  /* Near-completion khatmas */
  const { data: nearCompletion = [] } = useQuery({
    queryKey: ['near-completion'],
    queryFn: () => api.get('/khatmas/public/near-completion').then((r) => r.data),
    staleTime: 60_000,
  });

  const KHATMA_TYPES = isAr ? KHATMA_TYPES_AR : KHATMA_TYPES_EN;
  const WHY         = isAr ? WHY_AR   : WHY_EN;
  const TESTI       = isAr ? TESTI_AR : TESTI_EN;

  /* Format numbers nicely */
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  const LIVE_STATS = [
    {
      icon: '✅',
      value: stats ? fmt(stats.totalCompleted) : '—',
      label: isAr ? 'ختمة مكتملة' : 'Khatmas completed',
      color: 'text-success',
    },
    {
      icon: '👥',
      value: stats ? fmt(stats.totalParticipants) : '—',
      label: isAr ? 'مشارك نشط' : 'Active participants',
      color: 'text-primary',
    },
    {
      icon: '🔥',
      value: stats ? fmt(stats.totalActive) : '—',
      label: isAr ? 'ختمة نشطة الآن' : 'Active khatmas now',
      color: 'text-orange-500',
    },
    {
      icon: '📖',
      value: stats ? fmt(stats.partsThisWeek) : '—',
      label: isAr ? 'جزء قُرئ هذا الأسبوع' : 'Parts read this week',
      color: 'text-secondary',
    },
  ];

  return (
    <div dir={dir}>

      {/* ══════════════════════════════════════
          ① HERO
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 -left-16 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-right space-y-6">

            {/* Rotating badge quote */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full">
              <span className="pulse-dot w-2 h-2 bg-primary rounded-full inline-block" />
              {quote.type === 'quran' ? `﴿ ${quote.text} ﴾` : `"${quote.text}"`}
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
              {isAr
                ? <><span>اجتمعوا على</span><br /><span className="text-primary">كتاب الله</span></>
                : <><span>Unite Around</span><br /><span className="text-primary">the Book of Allah</span></>
              }
            </h1>

            <p className="text-lg text-muted max-w-md mx-auto md:mx-0 leading-relaxed">
              {isAr
                ? 'اختر جزءاً من القرآن الكريم، وساهم في إتمام ختمة جماعية مع آلاف المسلمين، وكن سبباً في نشر الخير والتعاون على البر والتقوى.'
                : 'Choose a part of the Quran, contribute to completing a group khatma with thousands of Muslims, and be a reason for spreading goodness.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/register" className="btn-duo btn-duo-primary text-base px-8 py-3.5">
                {isAr ? '📖 ابدأ ختمة جديدة' : '📖 Start a New Khatma'}
              </Link>
              <Link href="/dashboard" className="btn-duo btn-duo-outline text-base px-8 py-3.5">
                {isAr ? '🤝 انضم لختمة قائمة' : '🤝 Join an Existing Khatma'}
              </Link>
            </div>

            {/* Trust badge */}
            <p className="text-xs text-muted">
              {isAr ? '✓ مجاني تماماً · ✓ بدون إعلانات مزعجة · ✓ سهل الاستخدام' : '✓ Completely free · ✓ No spam · ✓ Easy to use'}
            </p>
          </div>

          {/* Floating demo card */}
          <div className="flex-1 flex justify-center">
            <div className="float-anim relative w-72 h-72 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-secondary/20 rounded-3xl rotate-6 shadow-lg" />
              <div className="absolute inset-0 bg-primary/15 rounded-3xl -rotate-3 shadow-lg" />
              <div className="relative bg-card border border-border rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center gap-4 h-full">
                <div className="text-6xl">📗</div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{isAr ? 'ختمة رمضان' : 'Ramadan Khatma'}</span>
                    <span className="text-primary font-bold">٨٧%</span>
                  </div>
                  <div className="h-3 bg-border rounded-full overflow-hidden">
                    <div className="progress-bar h-full bg-primary rounded-full" style={{ width: '87%' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span>👥 {isAr ? '١٢ مشارك' : '12 participants'}</span>
                  <span>•</span>
                  <span className="streak-glow text-orange-500 font-bold">🔥 {isAr ? '٤ أجزاء متبقية' : '4 parts left'}</span>
                </div>
                <Link href="/dashboard" className="w-full btn-duo btn-duo-primary text-xs py-2">
                  {isAr ? 'ساهم الآن ←' : 'Contribute Now →'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ② LIVE IMPACT STATS
      ══════════════════════════════════════ */}
      <section className="bg-primary text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-center text-white/70 text-sm font-semibold mb-6 uppercase tracking-widest">
            {isAr ? 'الأثر الحقيقي — بالأرقام الحية' : 'Real Impact — Live Numbers'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {LIVE_STATS.map((s) => (
              <div key={s.label}>
                <div className="text-3xl mb-1">{s.icon}</div>
                <p className="text-3xl md:text-4xl font-extrabold">{s.value}</p>
                <p className="text-sm text-white/75 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ③ VERSE + ROTATING QUOTE
      ══════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-primary/6 to-transparent border-y border-primary/15">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center space-y-5">
          <p className="text-2xl md:text-3xl font-extrabold leading-relaxed" style={{ fontFamily: 'var(--font-arabic)' }}>
            ﴿ وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ ﴾
          </p>
          <p className="text-sm text-primary font-semibold">{isAr ? 'سورة المائدة: ٢' : 'Al-Ma\'idah: 2'}</p>
          <p className="text-muted text-base max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'ختمة القرآن الجماعية هي من أجمل صور التعاون على البر — تُعين أخاك ويُعينك، وتجتمعون على كلام الله.'
              : 'A group Quran khatma is one of the most beautiful forms of cooperating in righteousness — you help each other and gather around the words of Allah.'}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ④ WHY PARTICIPATE
      ══════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl font-extrabold">{isAr ? 'لماذا أشارك؟' : 'Why Participate?'}</h2>
          <p className="text-muted">{isAr ? 'أربعة أسباب تجعل كل ختمة تستحق' : 'Four reasons every khatma is worth it'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY.map((w) => (
            <div key={w.title} className="card-lift bg-card border border-border rounded-2xl p-6 text-center space-y-3">
              <div className="text-4xl">{w.icon}</div>
              <h3 className="font-bold">{w.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>

        {/* Reward calculator */}
        <div className="mt-10 bg-amber-50 dark:bg-amber-950/30 border border-amber-300/40 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 text-center md:text-right">
          <div className="text-5xl shrink-0">🧮</div>
          <div className="space-y-1">
            <p className="font-extrabold text-amber-800 dark:text-amber-300 text-xl">
              {isAr ? 'القرآن الكريم = ٣٢٣,٦٧١ حرفاً' : 'The Holy Quran = 323,671 letters'}
            </p>
            <p className="text-amber-700 dark:text-amber-400 text-sm leading-relaxed">
              {isAr
                ? 'ختمة واحدة = ٣,٢٣٦,٧١٠ حسنة على الأقل. اضرب ذلك بعدد المشاركين في ختمتك — والله يضاعف لمن يشاء!'
                : 'One khatma = at least 3,236,710 good deeds. Multiply that by your participants — and Allah multiplies for whom He wills!'}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ⑤ TYPES OF KHATMAS
      ══════════════════════════════════════ */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-extrabold">{isAr ? 'ختمة لكل مناسبة' : 'A Khatma for Every Occasion'}</h2>
            <p className="text-muted">
              {isAr
                ? 'أنشئ ختمة بأي نية — وشاركها مع من تحب'
                : 'Create a khatma with any intention — and share it with those you love'}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {KHATMA_TYPES.map((kt) => (
              <div key={kt.label} className={`card-lift border rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-default ${kt.color}`}>
                <span className="text-2xl shrink-0">{kt.icon}</span>
                <span className="text-sm font-semibold leading-tight">{kt.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/register" className="btn-duo btn-duo-primary px-8 py-3 inline-flex gap-2">
              {isAr ? '+ أنشئ ختمتك الآن' : '+ Create Your Khatma Now'}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ⑥ NEAR-COMPLETION (ختمات تحتاج مساهمتك)
      ══════════════════════════════════════ */}
      {nearCompletion.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-3xl font-extrabold">
              🔥 {isAr ? 'ختمات تحتاج مساهمتك الآن' : 'Khatmas that need you now'}
            </h2>
            <p className="text-muted">
              {isAr
                ? 'هذه الختمات على وشك الاكتمال — كن آخر من يضع الحجر'
                : 'These khatmas are almost done — be the one who completes it'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(nearCompletion as any[]).map((k: any) => (
              <div key={k.id} className="card-lift bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-base line-clamp-1">{k.title}</h3>
                  <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {k.completionPercentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-3 bg-border rounded-full overflow-hidden">
                    <div
                      className="progress-bar h-full rounded-full transition-all"
                      style={{
                        width: `${k.completionPercentage}%`,
                        background: k.completionPercentage >= 90
                          ? 'var(--success)'
                          : 'linear-gradient(to left, var(--primary), var(--secondary))',
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>{k.completedParts} / {k.totalParts} {isAr ? 'جزء' : 'parts'}</span>
                    <span className="font-bold text-orange-500">
                      🔥 {isAr ? `${k.remaining} جزء متبقي` : `${k.remaining} part${k.remaining > 1 ? 's' : ''} left`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">👥 {k.participantCount} {isAr ? 'مشارك' : 'participants'}</span>
                  <Link
                    href={`/khatma/${k.id}`}
                    className="btn-duo btn-duo-primary text-xs px-5 py-2"
                  >
                    {k.remaining === 1
                      ? (isAr ? '⚡ أكمل الختمة' : '⚡ Complete it!')
                      : (isAr ? 'ساهم الآن ←' : 'Contribute Now →')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/dashboard" className="btn-duo btn-duo-outline px-8 py-3 inline-flex gap-2">
              {isAr ? 'عرض جميع الختمات العامة' : 'View all public khatmas'}
            </Link>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          ⑦ HOW IT WORKS (3 steps)
      ══════════════════════════════════════ */}
      <section className={`${nearCompletion.length === 0 ? '' : 'bg-card border-y border-border'}`}>
        <div className={`max-w-5xl mx-auto px-4 py-20 ${nearCompletion.length > 0 ? 'bg-card' : ''}`}>
          <h2 className="text-3xl font-extrabold text-center mb-3">
            {isAr ? 'كيف تعمل ختمة؟' : 'How does Khatma work?'}
          </h2>
          <p className="text-center text-muted mb-12">
            {isAr ? 'ثلاث خطوات وتبدأ ختمتك' : 'Three steps to start your khatma'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(isAr ? [
              { step: '١', icon: '✨', title: 'سجّل حسابك',    desc: 'في ثوانٍ عبر بريدك الإلكتروني أو Google.' },
              { step: '٢', icon: '📋', title: 'أنشئ ختمة',     desc: 'اختر اسماً ونوعاً ونيّةً وحدد من ينضم.' },
              { step: '٣', icon: '🚀', title: 'ادعُ المشاركين', desc: 'شارك الرابط على واتساب أو تيليجرام وزِّع الأجزاء تلقائياً.' },
            ] : [
              { step: '1', icon: '✨', title: 'Create an Account',   desc: 'In seconds via email or Google.' },
              { step: '2', icon: '📋', title: 'Start a Khatma',      desc: 'Choose a name, type, intention, and who can join.' },
              { step: '3', icon: '🚀', title: 'Invite Participants', desc: 'Share the link on WhatsApp or Telegram and distribute parts automatically.' },
            ]).map((item) => (
              <div key={item.step} className="card-lift text-center bg-background border border-border rounded-2xl p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-extrabold text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ⑧ SHARING CTA (viral mechanics)
      ══════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-secondary/10 border border-secondary/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <div className="text-6xl shrink-0">📤</div>
          <div className="flex-1 space-y-3 text-center md:text-right">
            <h3 className="text-2xl font-extrabold">
              {isAr ? 'ادعُ ٥ أشخاص — وانشر الأجر' : 'Invite 5 people — spread the reward'}
            </h3>
            <p className="text-muted leading-relaxed">
              {isAr
                ? 'بعد إنشاء ختمتك ستحصل على رابط خاص — شاركه على واتساب أو تيليجرام، وكل من ينضم ويقرأ يزيد من أجرك أنت أيضاً.'
                : 'After creating your khatma, you\'ll get a unique link — share it on WhatsApp or Telegram. Every person who joins and reads also adds to your reward.'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {['📱 واتساب / WhatsApp', '✈️ تيليجرام / Telegram', '🔗 نسخ الرابط / Copy Link'].map((btn) => (
                <span key={btn} className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-semibold text-muted">
                  {btn}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ⑨ TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-extrabold">💬 {isAr ? 'قالوا عن ختمة' : 'What people say'}</h2>
            <p className="text-muted">{isAr ? 'آلاف العائلات والمجموعات أكملت القرآن معاً' : 'Thousands of families and groups have completed the Quran together'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTI.map((item) => (
              <div key={item.name} className="card-lift bg-background border border-border rounded-2xl p-6 space-y-4">
                <div className="flex gap-0.5">{[...Array(item.stars)].map((_, i) => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
                <p className="text-sm text-foreground leading-relaxed">"{item.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <span className="text-2xl">{item.avatar}</span>
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-muted">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ⑩ FINAL CTA
      ══════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="relative overflow-hidden bg-primary rounded-3xl p-10 md:p-14 text-center text-white">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-white/5 rounded-full" />
          <div className="relative space-y-5">
            <div className="text-5xl">🌙</div>
            <h2 className="text-3xl font-extrabold">
              {isAr ? 'لا تنتظر — الأجر لا يتأخر' : "Don't wait — the reward starts now"}
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto leading-relaxed">
              {isAr
                ? 'كل لحظة تؤجّل فيها هي حسنات لم تُكسب بعد. ابدأ ختمتك الآن مع مَن تحب.'
                : 'Every moment you delay is good deeds not yet earned. Start your khatma now with those you love.'}
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 inline-block">
              <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-arabic)' }}>
                ﴿ وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ ﴾
              </p>
              <p className="text-white/70 text-xs mt-1">{isAr ? 'آل عمران: ١٣٣' : 'Al-Imran: 133'}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold px-10 py-4 rounded-2xl text-base border-b-4 border-white/30 hover:bg-white/90 active:translate-y-0.5 transition-all">
                {isAr ? '📖 إنشاء حساب مجاني' : '📖 Create a Free Account'}
              </Link>
              <Link href="/articles" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-base border border-white/20 hover:bg-white/20 transition-all">
                {isAr ? '📰 اقرأ مقالاتنا' : '📰 Read our articles'}
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
