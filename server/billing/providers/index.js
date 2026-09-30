import { FakeProvider } from './fake.js';
import { StripeProvider } from './stripe.js';

let activeProviderInstance = null;

export function getBillingProvider(overrideProviderName = null) {
  if (activeProviderInstance && !overrideProviderName) {
    return activeProviderInstance;
  }

  const providerName =
    overrideProviderName ||
    process.env.BILLING_PROVIDER ||
    (process.env.STRIPE_SECRET_KEY ? 'stripe' : 'fake');

  if (providerName === 'stripe') {
    activeProviderInstance = new StripeProvider();
  } else {
    activeProviderInstance = new FakeProvider();
  }

  return activeProviderInstance;
}

export function setBillingProvider(instance) {
  activeProviderInstance = instance;
}

export { BillingProvider } from './base.js';
export { FakeProvider } from './fake.js';
export { StripeProvider } from './stripe.js';
