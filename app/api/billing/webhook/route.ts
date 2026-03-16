import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getStripeEvent } from '@/lib/stripe/webhook'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    const event = await getStripeEvent(body, signature)

    const supabase = await createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.user_id
        const plan = session.metadata?.plan
        const customerId = session.customer

        if (userId && plan) {
          // Update subscription
          await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: plan,
              status: 'active',
              stripe_subscription_id: session.subscription,
              stripe_customer_id: customerId,
              current_period_start: new Date(session.created * 1000).toISOString(),
              current_period_end: new Date(session.created * 1000).toISOString(), // Will be updated by invoice.payment_succeeded
            })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription
        const customerId = invoice.customer

        // Get user from customer ID
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('user_id, plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (subscription && subscriptionId) {
          // Update subscription period
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date(invoice.period_start * 1000).toISOString(),
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subscriptionId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const subscriptionId = subscription.id

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            plan: 'free' // Downgrade to free
          })
          .eq('stripe_subscription_id', subscriptionId)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
