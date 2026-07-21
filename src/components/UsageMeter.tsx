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
    if (isDanger) return 'var(--danger, #ef4444)';
    if (isWarning) return 'var(--warning, #f59e0b)';
    return 'var(--accent, #3b82f6)';
  };

  return (
    <div
      className="p-4 rounded-xl border flex flex-col justify-between"
      style={{
        background: 'var(--bg-secondary, rgba(255, 255, 255, 0.03))',
        borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.1))',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </span>
        <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-muted)' }}>
          {current.toLocaleString()} {unit} /{' '}
          {isUnlimited ? 'Unlimited' : `${limit.toLocaleString()} ${unit}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="w-full bg-slate-700/30 rounded-full h-2 overflow-hidden my-2">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${percentage}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs mt-1">
        <span style={{ color: 'var(--text-muted)' }}>{description || 'Current usage period'}</span>
        {isDanger ? (
          <span className="text-red-400 font-medium">Limit Reached</span>
        ) : isWarning ? (
          <span className="text-amber-400 font-medium">{100 - percentage}% remaining</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            {isUnlimited ? 'No restriction' : `${percentage}% used`}
          </span>
        )}
      </div>
    </div>
  );
};
