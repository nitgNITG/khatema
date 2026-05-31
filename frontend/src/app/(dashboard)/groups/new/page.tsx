'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    visibility: 'PUBLIC',
    requireApproval: false,
    maxMembers: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('اسم المجموعة مطلوب');
    setLoading(true);
    try {
      const res = await api.post('/groups', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        visibility: form.visibility,
        requireApproval: form.requireApproval,
        maxMembers: form.maxMembers ? Number(form.maxMembers) : undefined,
      });
      toast.success('تم إنشاء المجموعة!');
      router.push(`/groups/${res.data.id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/groups" className="text-muted hover:text-foreground transition-colors text-sm">
          ← المجموعات
        </Link>
        <h1 className="text-2xl font-bold">مجموعة جديدة</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">اسم المجموعة <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="مثال: مجموعة الأسرة"
            maxLength={100}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">الوصف</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="وصف اختياري للمجموعة..."
            maxLength={500}
            rows={3}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">الظهور</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['PUBLIC', 'عامة', '🌍', 'تظهر للجميع'],
              ['PRIVATE', 'خاصة', '🔒', 'مخفية، بالدعوة فقط'],
              ['INVITE_ONLY', 'بالدعوة', '🔗', 'مرئية لكن بدعوة'],
            ] as [string, string, string, string][]).map(([val, label, icon, hint]) => (
              <button
                key={val}
                type="button"
                onClick={() => setForm({ ...form, visibility: val })}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-colors ${
                  form.visibility === val ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                }`}
              >
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">طلب موافقة للانضمام</p>
            <p className="text-xs text-muted">الأعضاء الجدد يحتاجون موافقتك</p>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, requireApproval: !form.requireApproval })}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.requireApproval ? 'bg-primary' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.requireApproval ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">الحد الأقصى للأعضاء <span className="text-muted">(اختياري)</span></label>
          <input
            type="number"
            value={form.maxMembers}
            onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
            placeholder="بلا حد"
            min={2}
            className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'جارٍ الإنشاء...' : 'إنشاء المجموعة'}
        </button>
      </form>
    </div>
  );
}
