'use client';

import { useEffect } from 'react';
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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((d) => !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate), {
  message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية',
  path: ['endDate'],
});

type FormData = z.infer<typeof schema>;

export default function NewKhatmaPage() {
  const router = useRouter();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'COLLECTIVE',
      visibility: 'PUBLIC',
      requireApproval: false,
      allowRepeat: true,
      isContinuous: false,
    },
  });

  const type = watch('type');
  const isIndividual = type === 'INDIVIDUAL';

  // When switching to INDIVIDUAL, lock down irrelevant fields
  useEffect(() => {
    if (isIndividual) {
      setValue('visibility', 'PRIVATE');
      setValue('requireApproval', false);
      setValue('allowRepeat', false);
    } else {
      setValue('visibility', 'PUBLIC');
      setValue('allowRepeat', true);
    }
  }, [isIndividual, setValue]);

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

  const collectiveSettings = [
    { name: 'requireApproval' as const, label: 'طلب الموافقة', desc: 'مراجعة طلبات الانضمام يدوياً' },
    { name: 'allowRepeat' as const, label: 'السماح بالتكرار', desc: 'يمكن لكل شخص حجز أكثر من جزء' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">إنشاء ختمة جديدة</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">

        {/* Step 1 — Basic info */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
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
              {(['COLLECTIVE', 'INDIVIDUAL'] as const).map((t) => (
                <label key={t} className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${watch('type') === t ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input type="radio" {...register('type')} value={t} className="hidden" />
                  <p className="font-semibold">{t === 'COLLECTIVE' ? 'جماعية' : 'فردية'}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {t === 'COLLECTIVE' ? 'مع الأصدقاء والعائلة' : 'بمفردك — خاصة تلقائياً'}
                  </p>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2 — Settings */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
          <h2 className="font-semibold text-lg">الإعدادات</h2>

          {/* Visibility — dimmed for individual */}
          <div className={isIndividual ? 'opacity-40 pointer-events-none select-none' : ''}>
            <label className="block text-sm font-medium mb-2">
              الخصوصية
              {isIndividual && <span className="mr-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">خاصة دائماً في الفردية</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['PUBLIC', 'PRIVATE'] as const).map((v) => (
                <label key={v} className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${watch('visibility') === v ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <input type="radio" {...register('visibility')} value={v} className="hidden" disabled={isIndividual} />
                  <p className="font-semibold">{v === 'PUBLIC' ? 'عامة' : 'خاصة'}</p>
                  <p className="text-sm text-muted mt-0.5">{v === 'PUBLIC' ? 'يظهر للجميع' : 'بالدعوة فقط'}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Collective-only toggles */}
          <div className={`space-y-3 ${isIndividual ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            {isIndividual && (
              <p className="text-xs text-muted bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                الختمة الفردية لا تحتاج موافقة أو دعوات
              </p>
            )}
            {collectiveSettings.map(({ name, label, desc }) => (
              <label key={name} className="flex items-center gap-4 p-4 border border-border rounded-xl cursor-pointer hover:bg-gray-50">
                <input type="checkbox" {...register(name)} disabled={isIndividual} className="w-5 h-5 accent-primary" />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Continuous — allowed for both */}
          <label className="flex items-center gap-4 p-4 border border-border rounded-xl cursor-pointer hover:bg-gray-50">
            <input type="checkbox" {...register('isContinuous')} className="w-5 h-5 accent-primary" />
            <div>
              <p className="font-medium">ختمة مستمرة</p>
              <p className="text-sm text-muted">تبدأ دورة جديدة تلقائياً عند الاكتمال</p>
            </div>
          </label>

          {/* Start/End dates — collective only */}
          {!isIndividual && (
            <div className="space-y-4 pt-2 border-t border-border">
              <p className="text-sm font-medium">مدة الختمة (اختياري)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">تاريخ البداية</label>
                  <input
                    type="datetime-local"
                    {...register('startDate')}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    {...register('endDate')}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.endDate && <p className="text-destructive text-xs mt-1">{errors.endDate.message}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary + submit */}
        <div className="bg-gray-50 border border-border rounded-2xl p-5 space-y-3 text-sm">
          <h3 className="font-semibold">مراجعة</h3>
          <div className="flex justify-between"><span className="text-muted">العنوان:</span><span className="font-medium">{watch('title') || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted">النوع:</span><span>{watch('type') === 'COLLECTIVE' ? 'جماعية' : 'فردية'}</span></div>
          <div className="flex justify-between"><span className="text-muted">الخصوصية:</span><span>{watch('visibility') === 'PUBLIC' ? 'عامة' : 'خاصة'}</span></div>
          <div className="flex justify-between"><span className="text-muted">عدد الأجزاء:</span><span>30 جزء</span></div>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary text-white rounded-xl py-3 font-semibold disabled:opacity-50"
        >
          {mutation.isPending ? 'جارٍ الإنشاء...' : 'إنشاء الختمة'}
        </button>
      </form>
    </div>
  );
}
