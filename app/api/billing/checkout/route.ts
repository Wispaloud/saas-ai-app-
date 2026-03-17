import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe/webhook'

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create Stripe customer
    let customerId: string
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (subscription?.stripe_customer_id) {
      customerId = subscription.stripe_customer_id
    } else {
      const stripe = getStripeClient()
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Update subscription with customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Define pricing
    const prices = {
      pro: {
        price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_1Oxxxx', // Replace with actual price ID
        quantity: 1,
      },
      enterprise: {
        price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_1Oxxxx', // Replace with actual price ID
        quantity: 1,
      },
    }

    const price = prices[planId as keyof typeof prices]
    if (!price) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Create checkout session
    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.price_id,
          quantity: price.quantity,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan: planId,
      },
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
