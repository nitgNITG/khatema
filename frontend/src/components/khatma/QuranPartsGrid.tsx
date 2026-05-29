'use client';

import { QuranPart } from '@/types';
import { cn } from '@/lib/utils';

interface QuranPartsGridProps {
  parts: QuranPart[];
  myUserId?: string;
  onPartClick?: (part: QuranPart) => void;
  isReadOnly?: boolean;
}

const PART_STATUS_STYLES = {
  AVAILABLE: 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer text-green-800',
  RESERVED: 'bg-amber-50 border-amber-300 cursor-not-allowed text-amber-800',
  COMPLETED: 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500',
};

const MY_PART_STYLE = 'bg-blue-50 border-blue-400 cursor-pointer ring-2 ring-blue-300 text-blue-800';

export function QuranPartsGrid({ parts, myUserId, onPartClick, isReadOnly }: QuranPartsGridProps) {
  const handleClick = (part: QuranPart) => {
    if (isReadOnly) return;
    if (part.status === 'COMPLETED') return;
    if (part.status === 'RESERVED' && part.reservedBy?.id !== myUserId) return;
    onPartClick?.(part);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          متاح
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          محجوز
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />
          مكتمل
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-10">
        {parts.map((part) => {
          const isMyPart = part.reservedBy?.id === myUserId && part.status === 'RESERVED';
          const styleClass = isMyPart ? MY_PART_STYLE : PART_STATUS_STYLES[part.status];

          return (
            <div
              key={part.id}
              onClick={() => handleClick(part)}
              title={
                part.reservedBy
                  ? `${part.status === 'COMPLETED' ? 'أتمّه' : 'حجزه'}: ${part.reservedBy.displayName}`
                  : 'متاح'
              }
              className={cn(
                'relative flex flex-col items-center justify-center rounded-xl border-2 p-2 transition-all duration-200 select-none aspect-square',
                styleClass,
              )}
            >
              <span className="text-lg font-bold">{part.partNumber}</span>
              {part.status === 'COMPLETED' && (
                <span className="text-xs text-gray-400 absolute bottom-1">✓</span>
              )}
              {isMyPart && (
                <span className="text-xs font-medium absolute bottom-1">جزءك</span>
              )}
              {part.reservedBy && part.status === 'RESERVED' && !isMyPart && (
                <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full overflow-hidden border border-white bg-amber-200 flex items-center justify-center text-[8px] font-bold">
                  {part.reservedBy.displayName[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
