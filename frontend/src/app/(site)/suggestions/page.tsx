'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useT } from '@/store/langStore';
import { useAuthStore } from '@/store/authStore';

export default function SuggestionsPage() {
  const { t, isAr, dir } = useT();
  const { user } = useAuthStore();

  const [form, setForm] = useState({ name: '', email: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    try {
      await api.post('/suggestions', {
        content: form.content,
        name: form.name || undefined,
        email: form.email || undefined,
      });
      setSent(true);
      toast.success(t('suggestionSent'));
    } catch {
      toast.error(isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={dir} className="max-w-2xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="text-5xl">💡</div>
        <h1 className="text-3xl font-extrabold">{t('suggestionTitle')}</h1>
        <p className="text-muted">{t('suggestionDesc')}</p>
      </div>

      {sent ? (
        <div className="bg-success/10 border border-success/30 rounded-2xl p-10 text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <p className="font-bold text-lg">{t('suggestionSent')}</p>
          <button
            onClick={() => { setSent(false); setForm({ name: '', email: '', content: '' }); }}
            className="btn-duo btn-duo-outline text-sm px-6 py-2.5"
          >
            {isAr ? 'إرسال اقتراح آخر' : 'Send another suggestion'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-8 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('yourName')}</label>
            <input
              type="text"
              value={form.name || (user?.displayName ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-border bg-background rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder={isAr ? 'اسمك (اختياري)' : 'Your name (optional)'}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">{t('yourEmail')}</label>
            <input
              type="email"
              dir="ltr"
              value={form.email || (user?.email ?? '')}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-border bg-background rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-right"
              placeholder="example@email.com"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              {isAr ? 'اقتراحك' : 'Your suggestion'}
              <span className="text-destructive mr-1">*</span>
            </label>
            <textarea
              required
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={5}
              className="w-full border border-border bg-background rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              placeholder={t('yourSuggestion')}
            />
            <p className="text-xs text-muted mt-1">{form.content.length} {isAr ? 'حرف' : 'chars'}</p>
          </div>

          <button
            type="submit"
            disabled={loading || !form.content.trim()}
            className="btn-duo btn-duo-primary w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:border-b-4"
          >
            {loading ? (isAr ? 'جارٍ الإرسال...' : 'Sending...') : t('submitSuggestion')}
          </button>
        </form>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        {[
          { icon: '👁', title: isAr ? 'يراها الفريق' : 'Seen by the team', desc: isAr ? 'جميع الاقتراحات تصل مباشرة للمدير' : 'All suggestions go directly to the admin' },
          { icon: '📬', title: isAr ? 'نرد عليك' : 'We respond', desc: isAr ? 'إذا أضفت بريدك نتواصل معك بالتحديثات' : 'If you add your email we\'ll keep you updated' },
        ].map((c) => (
          <div key={c.title} className="bg-card border border-border rounded-xl p-4 flex gap-3">
            <span className="text-2xl">{c.icon}</span>
            <div>
              <p className="font-semibold text-sm">{c.title}</p>
              <p className="text-xs text-muted mt-0.5">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
