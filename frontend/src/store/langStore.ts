import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'ar' | 'en';

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'ar',
      setLang: (lang) => set({ lang }),
      toggle: () => set({ lang: get().lang === 'ar' ? 'en' : 'ar' }),
    }),
    { name: 'khatma-lang' },
  ),
);

// ── Translations ──────────────────────────────────────────────────────────

const translations = {
  ar: {
    // ── Nav / common ──
    home:          'الرئيسية',
    articles:      'المقالات',
    contact:       'اتصل بنا',
    about:         'عن ختمة',
    suggestions:   'مقترحات',
    login:         'تسجيل الدخول',
    register:      'ابدأ مجاناً',
    dashboard:     'الرئيسية',
    logout:        'تسجيل الخروج',
    profile:       'الملف الشخصي',
    groups:        'مجموعاتي',
    newKhatma:     'ختمة جديدة',
    loading:       'جارٍ التحميل...',

    // ── Footer ──
    allRightsReserved: 'جميع الحقوق محفوظة',
    implementedBy:     'تنفيذ',
    nitgName:          'الشركة الوطنية لتكنولوجيا المعلومات',
    tagline:           'منصة لإتمام ختم القرآن الكريم جماعةً',
    privacy:           'سياسة الخصوصية',
    terms:             'الشروط والأحكام',

    // ── Landing hero ──
    heroTitle:          'اختم القرآن',
    heroTitleHighlight: 'مع من تحب',
    heroDesc:           'أنشئ ختمة جماعية في دقيقة واحدة، وزِّع الأجزاء على الأصدقاء والعائلة، وتابع التقدم معاً حتى يكتمل القرآن.',
    heroCta:            'ابدأ ختمتك الآن — مجاناً',
    heroSecondary:      'لديّ حساب',

    // ── Articles ──
    readMore:       'اقرأ المزيد',
    publishedOn:    'نُشر في',
    views:          'مشاهدة',
    backToArticles: 'العودة للمقالات',
    noArticles:     'لا توجد مقالات حالياً',
    latestArticles: 'أحدث المقالات',
    articlesDesc:   'مقالات تلهمك على إتمام القرآن وتعرّفك بفضل الأعمال الصالحة',

    // ── Suggestions ──
    suggestionTitle:  'اقتراح',
    suggestionDesc:   'شاركنا آراءك ومقترحاتك لتحسين تجربة ختمة',
    yourName:         'اسمك (اختياري)',
    yourEmail:        'بريدك الإلكتروني (اختياري)',
    yourSuggestion:   'اكتب اقتراحك هنا...',
    submitSuggestion: 'إرسال الاقتراح',
    suggestionSent:   'شكراً! تم إرسال اقتراحك بنجاح',
    sendAnother:      'إرسال اقتراح آخر',

    // ── About ──
    aboutTitle: 'عن ختمة',
    aboutDesc:  'منصة تقنية تُمكّن المسلمين من إتمام ختم القرآن الكريم جماعةً بطريقة منظمة وسهلة.',

    // ── Contact ──
    contactTitle: 'اتصل بنا',
    contactDesc:  'نسعد بتواصلك معنا لأي استفسار أو دعم تقني.',
    faq:          'الأسئلة الشائعة',

    // ── Auth ──
    welcomeBack:        'مرحباً بعودتك 👋',
    loginSubtitle:      'سجّل دخولك لمتابعة ختمتك',
    emailAddress:       'البريد الإلكتروني',
    password:           'كلمة المرور',
    forgotPassword:     'نسيت كلمة المرور؟',
    signingIn:          'جارٍ الدخول...',
    signIn:             'تسجيل الدخول',
    noAccount:          'ليس لديك حساب؟',
    registerFree:       'سجّل مجاناً',
    orWithEmail:        'أو بالبريد الإلكتروني',
    signInWithGoogle:   'تسجيل الدخول بـ Google',
    registerWithGoogle: 'التسجيل بـ Google',
    createAccount:      'إنشاء حساب جديد 🎉',
    registerSubtitle:   'انضم مجاناً وابدأ ختمتك الأولى اليوم',
    displayName:        'الاسم',
    namePlaceholder:    'أدخل اسمك',
    createFree:         'إنشاء الحساب مجاناً',
    creatingAccount:    'جارٍ إنشاء الحساب...',
    haveAccount:        'لديك حساب بالفعل؟',
    agreeToTerms:       'بالتسجيل فأنت توافق على',
    andText:            'و',
    emailPlaceholder:   'example@email.com',

    // ── Dashboard ──
    goodMorning:   'صباح الخير',
    goodAfternoon: 'مساء الخير',
    goodEvening:   'مساء النور',
    myKhatmas:     'ختماتي',
    discoverKhatmas: 'اكتشف الختمات',
    noKhatmasYet:  'لم تنضم لأي ختمة بعد',
    noKhatmasHint: 'أنشئ ختمتك الأولى أو انضم لختمة عامة من القائمة أدناه',
    createKhatma:  'إنشاء ختمة الآن',
    totalKhatmas:  'إجمالي الختمات',
    activeNow:     'نشطة الآن',
    completed:     'مكتملة',
    collectiveActive: 'جماعية نشطة',
    hasActiveKhatmas: 'لديك {count} ختمة نشطة',
    startFirstKhatma: 'ابدأ ختمتك الأولى اليوم',
    joinKhatma:    'انضم للختمة',
    joining:       'جارٍ الانضمام...',
    reachedLimit:  'وصلت للحد الأقصى',
    searchKhatma:  'ابحث باسم الختمة...',
    all:           'الكل',
    active:        'نشطة',
    noResults:     'لا نتائج',
    noPublicKhatmas: 'لا توجد ختمات عامة حالياً',
    prev:          '← السابق',
    next:          'التالي →',
    collective:    '🤝 جماعية',
    individual:    '📖 فردية',
    participants:  'مشارك',
    progress:      'التقدم',
  },

  en: {
    // ── Nav / common ──
    home:          'Home',
    articles:      'Articles',
    contact:       'Contact',
    about:         'About',
    suggestions:   'Suggestions',
    login:         'Login',
    register:      'Get Started Free',
    dashboard:     'Home',
    logout:        'Logout',
    profile:       'Profile',
    groups:        'My Groups',
    newKhatma:     'New Khatma',
    loading:       'Loading...',

    // ── Footer ──
    allRightsReserved: 'All rights reserved',
    implementedBy:     'Implemented by',
    nitgName:          'National Company for Information Technology',
    tagline:           'A platform for completing the Holy Quran together',
    privacy:           'Privacy Policy',
    terms:             'Terms & Conditions',

    // ── Landing hero ──
    heroTitle:          'Complete the Quran',
    heroTitleHighlight: 'Together',
    heroDesc:           'Create a group khatma in one minute, distribute parts among family & friends, and track progress together until the Quran is complete.',
    heroCta:            'Start Free Now',
    heroSecondary:      'I have an account',

    // ── Articles ──
    readMore:       'Read More',
    publishedOn:    'Published on',
    views:          'views',
    backToArticles: '← Back to Articles',
    noArticles:     'No articles available yet',
    latestArticles: 'Latest Articles',
    articlesDesc:   'Articles that inspire you to complete the Quran and learn about the virtues of good deeds',

    // ── Suggestions ──
    suggestionTitle:  'Suggestion',
    suggestionDesc:   'Share your ideas and feedback to improve Khatma',
    yourName:         'Your name (optional)',
    yourEmail:        'Your email (optional)',
    yourSuggestion:   'Write your suggestion here...',
    submitSuggestion: 'Send Suggestion',
    suggestionSent:   'Thank you! Your suggestion was sent successfully',
    sendAnother:      'Send another suggestion',

    // ── About ──
    aboutTitle: 'About Khatma',
    aboutDesc:  'A technology platform that enables Muslims to complete the Holy Quran recitation together in an organized and easy way.',

    // ── Contact ──
    contactTitle: 'Contact Us',
    contactDesc:  'We\'d love to hear from you for any inquiry or technical support.',
    faq:          'Frequently Asked Questions',

    // ── Auth ──
    welcomeBack:        'Welcome back 👋',
    loginSubtitle:      'Sign in to continue your khatma',
    emailAddress:       'Email address',
    password:           'Password',
    forgotPassword:     'Forgot password?',
    signingIn:          'Signing in...',
    signIn:             'Sign In',
    noAccount:          "Don't have an account?",
    registerFree:       'Register for free',
    orWithEmail:        'Or with email',
    signInWithGoogle:   'Sign in with Google',
    registerWithGoogle: 'Register with Google',
    createAccount:      'Create a new account 🎉',
    registerSubtitle:   'Join for free and start your first khatma today',
    displayName:        'Name',
    namePlaceholder:    'Enter your name',
    createFree:         'Create Free Account',
    creatingAccount:    'Creating account...',
    haveAccount:        'Already have an account?',
    agreeToTerms:       'By registering you agree to the',
    andText:            'and',
    emailPlaceholder:   'example@email.com',

    // ── Dashboard ──
    goodMorning:      'Good morning',
    goodAfternoon:    'Good afternoon',
    goodEvening:      'Good evening',
    myKhatmas:        'My Khatmas',
    discoverKhatmas:  'Discover Khatmas',
    noKhatmasYet:     "You haven't joined any khatma yet",
    noKhatmasHint:    'Create your first khatma or join a public one from the list below',
    createKhatma:     'Create Khatma Now',
    totalKhatmas:     'Total Khatmas',
    activeNow:        'Active Now',
    completed:        'Completed',
    collectiveActive: 'Collective Active',
    hasActiveKhatmas: 'You have {count} active khatma(s)',
    startFirstKhatma: 'Start your first khatma today',
    joinKhatma:       'Join Khatma',
    joining:          'Joining...',
    reachedLimit:     'Limit reached',
    searchKhatma:     'Search by khatma name...',
    all:              'All',
    active:           'Active',
    noResults:        'No results',
    noPublicKhatmas:  'No public khatmas available',
    prev:             '← Prev',
    next:             'Next →',
    collective:       '🤝 Collective',
    individual:       '📖 Individual',
    participants:     'participants',
    progress:         'Progress',
  },
} as const;

export type TKey = keyof typeof translations.ar;

export function useT() {
  const lang = useLangStore((s) => s.lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = (key: TKey): string => (translations[lang] as Record<string, string>)[key] ?? (translations.ar as Record<string, string>)[key] ?? key;
  return { t, lang, dir, isAr: lang === 'ar' };
}
