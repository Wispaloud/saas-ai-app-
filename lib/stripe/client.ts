import { loadStripe } from '@stripe/stripe-js'

let stripePromise: Promise<any> | null = null

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!publishableKey || publishableKey === 'your_stripe_publishable_key') {
      console.warn('Stripe publishable key is not configured')
      return null
    }
    stripePromise = loadStripe(publishableKey)
  }
  return stripePromise
}
