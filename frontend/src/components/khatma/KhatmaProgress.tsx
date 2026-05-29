'use client';

interface KhatmaProgressProps {
  totalParts: number;
  completedParts: number;
  reservedParts?: number;
}

export function KhatmaProgress({ totalParts, completedParts, reservedParts = 0 }: KhatmaProgressProps) {
  const completedPct = Math.round((completedParts / totalParts) * 100);
  const reservedPct = Math.round((reservedParts / totalParts) * 100);
  const availableParts = totalParts - completedParts - reservedParts;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-muted">
        <span>{completedPct}% مكتمل</span>
        <span>{completedParts} / {totalParts}</span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full flex">
          <div
            className="bg-gray-400 transition-all duration-500"
            style={{ width: `${completedPct}%` }}
          />
          <div
            className="bg-amber-400 transition-all duration-500"
            style={{ width: `${reservedPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span>{completedParts} مكتمل</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{reservedParts} محجوز</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-600">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span>{availableParts} متاح</span>
        </div>
      </div>
    </div>
  );
}
