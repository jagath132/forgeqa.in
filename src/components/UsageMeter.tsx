import React from 'react';

interface UsageMeterProps {
  label: string;
  current: number;
  limit: number | null;
  unit?: string;
  description?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  label,
  current,
  limit,
  unit = '',
  description,
}) => {
  const isUnlimited = limit === null || limit >= 9999;
  const percentage = isUnlimited || !limit ? 0 : Math.min(100, Math.round((current / limit) * 100));

  const isWarning = !isUnlimited && percentage >= 80 && percentage < 100;
  const isDanger = !isUnlimited && percentage >= 100;

  const getProgressColor = () => {
    if (isDanger) return '#ef4444';
    if (isWarning) return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between min-h-[120px]">
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-xs font-bold text-slate-800 leading-tight">{label}</span>
        <span className="text-[10px] font-mono font-medium text-slate-400 whitespace-nowrap">
          {current.toLocaleString()} {unit} /{' '}
          {isUnlimited ? 'Unlimited' : `${limit.toLocaleString()} ${unit}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden my-3">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] mt-1">
        <span className="text-slate-400">{description || 'Current usage period'}</span>
        {isDanger ? (
          <span className="text-red-500 font-bold">Limit Reached</span>
        ) : isWarning ? (
          <span className="text-amber-500 font-bold">{100 - percentage}% remaining</span>
        ) : (
          <span className="text-slate-400">
            {isUnlimited ? 'No restriction' : `${percentage}% used`}
          </span>
        )}
      </div>
    </div>
  );
};
