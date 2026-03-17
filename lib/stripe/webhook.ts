import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function getStripeClient() {
  // Only create client if it doesn't exist and we're in a server environment
  if (!stripeClient && typeof window === 'undefined') {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey || secretKey === 'your_stripe_secret_key') {
      throw new Error('Stripe secret key is not configured')
    }
    
    stripeClient = new Stripe(secretKey)
  }
  
  if (!stripeClient) {
    throw new Error('Stripe client can only be initialized server-side')
  }
  
  return stripeClient
}

export { getStripeClient as stripe }

export async function getStripeEvent(body: string, signature: string) {
  const client = getStripeClient()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret || webhookSecret === 'your_stripe_webhook_secret') {
    throw new Error('Stripe webhook secret is not configured')
  }
  
  return client.webhooks.constructEvent(
    body,
    signature,
    webhookSecret
  )
}
