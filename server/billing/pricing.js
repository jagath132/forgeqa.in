import { PLANS, VOLUME_TIERS } from './plans.js';

/**
 * Retrieves the matching volume tier for a given number of seats.
 * @param {number} seatCount
 */
export function getVolumeTier(seatCount = 1) {
  const seats = Math.max(1, parseInt(seatCount || 1, 10));
  const tier = VOLUME_TIERS.find((t) => seats >= t.minSeats && seats <= t.maxSeats);
  return tier || VOLUME_TIERS[VOLUME_TIERS.length - 1];
}

/**
 * Calculates total monthly/yearly price, price per seat, and savings percentage for a subscription plan.
 * @param {number} seats
 * @param {string} tierName ('free' | 'pro' | 'enterprise')
 * @param {string} billingCycle ('monthly' | 'yearly')
 */
export function calculatePrice(seats = 1, tierName = 'pro', billingCycle = 'monthly') {
  const seatCount = Math.max(1, parseInt(seats || 1, 10));
  const plan = PLANS[tierName] || PLANS.free;

  if (tierName === 'free') {
    return {
      tier: 'free',
      seats: 1,
      pricePerSeat: 0,
      basePricePerSeat: 0,
      discountPercent: 0,
      monthlyTotal: 0,
      yearlyTotal: 0,
      totalAmount: 0,
      currency: 'INR',
    };
  }

  if (tierName === 'pro') {
    const pricePerSeat = plan.pricePerSeat || 1499;
    const monthlyTotal = pricePerSeat * seatCount;
    const yearlyTotal = monthlyTotal * 10; // 2 months free on annual billing (16.6% discount)
    const totalAmount = billingCycle === 'yearly' ? yearlyTotal : monthlyTotal;

    return {
      tier: 'pro',
      seats: seatCount,
      pricePerSeat,
      basePricePerSeat: pricePerSeat,
      discountPercent: billingCycle === 'yearly' ? 16 : 0,
      monthlyTotal,
      yearlyTotal,
      totalAmount,
      currency: 'INR',
    };
  }

  // Enterprise Tier with Seat-Based Volume Tiering
  const volumeTier = getVolumeTier(seatCount);
  const pricePerSeat = volumeTier.pricePerSeat;
  const basePricePerSeat = VOLUME_TIERS[0].pricePerSeat; // 1,499
  const monthlyTotal = pricePerSeat * seatCount;
  const yearlyTotal = monthlyTotal * 10; // 2 months free on annual billing
  const totalAmount = billingCycle === 'yearly' ? yearlyTotal : monthlyTotal;

  return {
    tier: 'enterprise',
    seats: seatCount,
    pricePerSeat,
    basePricePerSeat,
    discountPercent: volumeTier.discountPercent,
    monthlyTotal,
    yearlyTotal,
    totalAmount,
    currency: 'INR',
    volumeTier: {
      minSeats: volumeTier.minSeats,
      maxSeats: volumeTier.maxSeats,
      discountPercent: volumeTier.discountPercent,
    },
  };
}
