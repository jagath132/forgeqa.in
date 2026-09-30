/**
 * Abstract Base Class for Billing Providers (Stripe, Razorpay, FakeProvider)
 */
export class BillingProvider {
  /**
   * Creates or retrieves a customer in the provider system.
   * @param {{ id: string, email: string, name?: string }} owner
   * @returns {Promise<string>} providerCustomerId
   */
  async createCustomer(_owner) {
    throw new Error('createCustomer() must be implemented by billing provider');
  }

  /**
   * Creates a hosted checkout session.
   * @param {{ id: string, email: string }} owner
   * @param {{ code: string, interval: string, price_amount: number, provider_price_id?: string, seats?: number }} plan
   * @param {string} successUrl
   * @param {string} cancelUrl
   * @returns {Promise<{ url: string, sessionId: string }>}
   */
  async createCheckoutSession(_owner, _plan, _successUrl, _cancelUrl) {
    throw new Error('createCheckoutSession() must be implemented by billing provider');
  }

  /**
   * Creates a customer billing portal session.
   * @param {string} customerId
   * @param {string} returnUrl
   * @returns {Promise<{ url: string }>}
   */
  async createPortalSession(_customerId, _returnUrl) {
    throw new Error('createPortalSession() must be implemented by billing provider');
  }

  /**
   * Updates an existing subscription to a new plan.
   * @param {string} subscriptionId
   * @param {{ code: string, provider_price_id: string }} newPlan
   * @param {boolean} [proration=true]
   * @returns {Promise<object>}
   */
  async changePlan(_subscriptionId, _newPlan, _proration = true) {
    throw new Error('changePlan() must be implemented by billing provider');
  }

  /**
   * Cancels a subscription immediately or at period end.
   * @param {string} subscriptionId
   * @param {boolean} [atPeriodEnd=true]
   * @returns {Promise<object>}
   */
  async cancelSubscription(_subscriptionId, _atPeriodEnd = true) {
    throw new Error('cancelSubscription() must be implemented by billing provider');
  }

  /**
   * Resumes a canceled-at-period-end subscription.
   * @param {string} subscriptionId
   * @returns {Promise<object>}
   */
  async resumeSubscription(_subscriptionId) {
    throw new Error('resumeSubscription() must be implemented by billing provider');
  }

  /**
   * Verifies the webhook signature against raw request body.
   * Throws if signature is invalid.
   * @param {Buffer|string} rawBody
   * @param {string} signatureHeader
   * @returns {Promise<{ id: string, type: string, data: { object: object }, created: number }>}
   */
  async verifyWebhook(_rawBody, _signatureHeader) {
    throw new Error('verifyWebhook() must be implemented by billing provider');
  }

  /**
   * Lists historical invoices for a customer.
   * @param {string} customerId
   * @returns {Promise<Array<object>>}
   */
  async listInvoices(_customerId) {
    throw new Error('listInvoices() must be implemented by billing provider');
  }
}
