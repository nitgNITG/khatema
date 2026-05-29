'use client';

import { QuranPartsGrid } from '@/components/khatma/QuranPartsGrid';
import { KhatmaProgress } from '@/components/khatma/KhatmaProgress';
import { QuranPart } from '@/types';

const MOCK_PARTS: QuranPart[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  if (n <= 8) return { id: `p${n}`, partNumber: n, status: 'COMPLETED', reservedBy: { id: 'u1', displayName: 'أحمد' } };
  if (n === 9) return { id: `p${n}`, partNumber: n, status: 'RESERVED', reservedBy: { id: 'me', displayName: 'أنا' } };
  if (n >= 10 && n <= 13) return { id: `p${n}`, partNumber: n, status: 'RESERVED', reservedBy: { id: 'u2', displayName: 'سارة' } };
  return { id: `p${n}`, partNumber: n, status: 'AVAILABLE' };
});

export default function DemoPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8" dir="rtl">
      <h1 className="text-2xl font-bold text-primary">معاينة — ختمة رمضان 1447</h1>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <p className="text-sm text-muted">12 مشارك • الدورة 1</p>
        <KhatmaProgress totalParts={30} completedParts={8} reservedParts={5} />
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">الأجزاء</h2>
        <QuranPartsGrid
          parts={MOCK_PARTS}
          myUserId="me"
          onPartClick={(p) => alert(`جزء ${p.partNumber} — ${p.status}`)}
        />
      </div>

      <p className="text-xs text-muted text-center">صفحة معاينة — تُحذف قبل الإنتاج</p>
    </div>
  );
}
