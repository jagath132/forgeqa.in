import React, { useMemo } from 'react';

export interface VolumeTierInfo {
  minSeats: number;
  maxSeats: number;
  pricePerSeat: number;
  discountPercent: number;
}

export const VOLUME_TIERS_CLIENT: VolumeTierInfo[] = [
  { minSeats: 1, maxSeats: 10, pricePerSeat: 1499, discountPercent: 0 },
  { minSeats: 11, maxSeats: 25, pricePerSeat: 1299, discountPercent: 13 },
  { minSeats: 26, maxSeats: 50, pricePerSeat: 1099, discountPercent: 27 },
  { minSeats: 51, maxSeats: 100, pricePerSeat: 899, discountPercent: 40 },
  { minSeats: 101, maxSeats: 999, pricePerSeat: 699, discountPercent: 53 },
];

export interface SeatSelectorProps {
  seats: number;
  onChangeSeats: (seats: number) => void;
  billingCycle?: 'monthly' | 'yearly';
  onSelectBillingCycle?: (cycle: 'monthly' | 'yearly') => void;
}

export function SeatSelector({
  seats,
  onChangeSeats,
  billingCycle = 'monthly',
  onSelectBillingCycle,
}: SeatSelectorProps) {
  const currentTier = useMemo(() => {
    const s = Math.max(1, seats);
    return (
      VOLUME_TIERS_CLIENT.find((t) => s >= t.minSeats && s <= t.maxSeats) ||
      VOLUME_TIERS_CLIENT[VOLUME_TIERS_CLIENT.length - 1]
    );
  }, [seats]);

  const effectivePricePerSeat = currentTier.pricePerSeat;
  const monthlyTotal = effectivePricePerSeat * seats;
  const yearlyTotal = monthlyTotal * 10; // 2 months free
  const totalDisplay = billingCycle === 'yearly' ? yearlyTotal : monthlyTotal;

  return (
    <div
      className="p-5 rounded-2xl border flex flex-col gap-4"
      style={{
        background: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))',
        borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.1))',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Enterprise Seat Configuration
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic volume discount applied as your team grows
          </p>
        </div>

        {onSelectBillingCycle && (
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onSelectBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white font-medium shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => onSelectBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white font-medium shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                2 Mo Free
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Seat Count Picker Controls */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-400 block mb-2">
            Number of Team Seats
          </label>
          <input
            type="range"
            min="1"
            max="150"
            value={seats}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeSeats(parseInt(e.target.value, 10) || 1)
            }
            className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeSeats(Math.max(1, seats - 1))}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            max="999"
            value={seats}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChangeSeats(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            className="w-16 h-9 text-center bg-slate-950 text-white font-mono font-bold rounded-lg border border-slate-700 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => onChangeSeats(seats + 1)}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 transition"
          >
            +
          </button>
        </div>
      </div>

      {/* Volume Tier Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {VOLUME_TIERS_CLIENT.map((tier) => {
          const isActive = seats >= tier.minSeats && seats <= tier.maxSeats;
          return (
            <button
              key={`${tier.minSeats}-${tier.maxSeats}`}
              type="button"
              onClick={() => onChangeSeats(tier.minSeats)}
              className={`p-2.5 rounded-xl border text-center transition-all text-xs flex flex-col items-center justify-between gap-1 ${
                isActive
                  ? 'border-blue-500 bg-blue-500/10 text-white font-semibold ring-1 ring-blue-500'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <span className="font-mono font-medium">
                {tier.minSeats}–{tier.maxSeats === 999 ? '100+' : tier.maxSeats} seats
              </span>
              <span className="text-blue-400 font-bold">
                ₹{tier.pricePerSeat.toLocaleString()}/mo
              </span>
              {tier.discountPercent > 0 ? (
                <span className="bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded text-[10px]">
                  {tier.discountPercent}% OFF
                </span>
              ) : (
                <span className="text-slate-500 text-[10px]">Standard</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pricing Summary Output */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-900/50 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              ₹{totalDisplay.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ₹{effectivePricePerSeat.toLocaleString()} / seat / month ({seats}{' '}
            {seats === 1 ? 'seat' : 'seats'})
          </p>
        </div>

        {currentTier.discountPercent > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3 py-1.5 rounded-lg font-medium">
            🎉 Saving {currentTier.discountPercent}% with Volume Tier ({seats} seats)
          </div>
        )}
      </div>
    </div>
  );
}
