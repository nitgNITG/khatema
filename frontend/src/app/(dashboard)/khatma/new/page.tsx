'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const schema = z.object({
  title: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
  type: z.enum(['COLLECTIVE', 'INDIVIDUAL']),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
  requireApproval: z.boolean(),
  allowRepeat: z.boolean(),
  isContinuous: z.boolean(),
  maxMembers: z.number().min(1).max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewKhatmaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'COLLECTIVE',
      visibility: 'PUBLIC',
      requireApproval: false,
      allowRepeat: true,
      isContinuous: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/khatmas', data).then((r) => r.data),
    onSuccess: (res) => {
      toast.success('تم إنشاء الختمة بنجاح!');
      router.push(`/khatma/${res.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">إنشاء ختمة جديدة</h1>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-primary' : 'bg-gray-200'}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">معلومات الختمة</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">عنوان الختمة *</label>
              <input
                {...register('title')}
                className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="مثال: ختمة رمضان 1446"
              />
              {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">وصف (اختياري)</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                placeholder="وصف مختصر للختمة..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نوع الختمة</label>
              <div className="grid grid-cols-2 gap-3">
                {['COLLECTIVE', 'INDIVIDUAL'].map((type) => (
                  <label key={type} className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${watch('type') === type ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input type="radio" {...register('type')} value={type} className="hidden" />
                    <p className="font-semibold">{type === 'COLLECTIVE' ? 'جماعية' : 'فردية'}</p>
                    <p className="text-sm text-muted mt-0.5">{type === 'COLLECTIVE' ? 'مع الأصدقاء والعائلة' : 'بمفردك'}</p>
                  </label>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => setStep(2)} className="w-full bg-primary text-white rounded-xl py-3 font-semibold">
              التالي
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">الإعدادات</h2>

            <div>
              <label className="block text-sm font-medium mb-2">الخصوصية</label>
              <div className="grid grid-cols-2 gap-3">
                {['PUBLIC', 'PRIVATE'].map((v) => (
                  <label key={v} className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${watch('visibility') === v ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input type="radio" {...register('visibility')} value={v} className="hidden" />
                    <p className="font-semibold">{v === 'PUBLIC' ? 'عامة' : 'خاصة'}</p>
                    <p className="text-sm text-muted mt-0.5">{v === 'PUBLIC' ? 'يظهر للجميع' : 'بالدعوة فقط'}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: 'requireApproval', label: 'طلب الموافقة', desc: 'مراجعة طلبات الانضمام يدوياً' },
                { name: 'allowRepeat', label: 'السماح بالتكرار', desc: 'يمكن لكل شخص حجز أكثر من جزء' },
                { name: 'isContinuous', label: 'ختمة مستمرة', desc: 'تبدأ دورة جديدة تلقائياً عند الاكتمال' },
              ].map(({ name, label, desc }) => (
                <label key={name} className="flex items-center gap-4 p-4 border border-border rounded-xl cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" {...register(name as any)} className="w-5 h-5 accent-primary" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted">{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 border border-border rounded-xl py-3 font-semibold hover:bg-gray-50">
                السابق
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 bg-primary text-white rounded-xl py-3 font-semibold">
                التالي
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="font-semibold text-lg">مراجعة وإنشاء</h2>

            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">العنوان:</span><span className="font-medium">{watch('title')}</span></div>
              <div className="flex justify-between"><span className="text-muted">النوع:</span><span>{watch('type') === 'COLLECTIVE' ? 'جماعية' : 'فردية'}</span></div>
              <div className="flex justify-between"><span className="text-muted">الخصوصية:</span><span>{watch('visibility') === 'PUBLIC' ? 'عامة' : 'خاصة'}</span></div>
              <div className="flex justify-between"><span className="text-muted">عدد الأجزاء:</span><span>30 جزء</span></div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="flex-1 border border-border rounded-xl py-3 font-semibold hover:bg-gray-50">
                السابق
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-50"
              >
                {mutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الختمة'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
