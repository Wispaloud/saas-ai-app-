'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out AdGen",
    features: [
      "10 AI generations per month",
      "Basic ad templates",
      "Email support",
      "Single user account"
    ],
    notHighlighted: true
  },
  {
    name: "Pro",
    price: "$29",
    description: "For growing businesses and agencies",
    features: [
      "1,000 AI generations per month",
      "Advanced templates",
      "Priority support",
      "Team collaboration (5 users)",
      "Performance analytics",
      "Brand guidelines",
      "API access"
    ],
    highlighted: true,
    popular: true
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large teams with custom needs",
    features: [
      "Unlimited AI generations",
      "Custom templates",
      "Dedicated support",
      "Unlimited team members",
      "Advanced analytics",
      "Custom integrations",
      "White-label options",
      "SLA guarantee"
    ],
    notHighlighted: true
  }
]

export function Pricing() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handleSubscribe = async (planName: string) => {
    setLoading(planName)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/signup'
        return
      }

      // In a real app, this would call Stripe Checkout
      alert(`Redirecting to Stripe Checkout for ${planName} plan...`)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <section id="pricing" className="container space-y-6 py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[980px] flex-col items-center space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          Simple, Transparent Pricing
        </h2>
        <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
          Choose the perfect plan for your business. Start free and scale as you grow.
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`relative ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center space-x-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                  <Star className="h-3 w-3" />
                  <span>Most Popular</span>
                </div>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-sm text-gray-500">/month</span>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.highlighted ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.name)}
                disabled={loading === plan.name}
              >
                {loading === plan.name ? "Loading..." : plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
