'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Zap, TrendingUp, Calendar } from 'lucide-react'

interface UsageData {
  currentGenerations: number
  maxGenerations: number
  totalGenerations: number
  tokensUsed: number
  plan: string
}

export function Usage() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get subscription data
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .single()

        // Get current month usage
        const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
        const { data: currentUsage } = await supabase
          .from('usage_metrics')
          .select('generations_count')
          .eq('user_id', user.id)
          .gte('date', `${currentMonth}-01`)
          .lte('date', `${currentMonth}-31`)
          .single()

        // Get total generations
        const { count: totalGenerations } = await supabase
          .from('ai_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        // Get total tokens
        const { data: tokenData } = await supabase
          .from('ai_generations')
          .select('tokens_used')
          .eq('user_id', user.id)

        const totalTokens = tokenData?.reduce((sum, gen) => sum + gen.tokens_used, 0) || 0

        // Plan limits
        const planLimits = {
          free: 10,
          pro: 1000,
          enterprise: Infinity
        }

        const plan = subscription?.plan || 'free'
        const maxGenerations = planLimits[plan as keyof typeof planLimits]

        setUsage({
          currentGenerations: currentUsage?.generations_count || 0,
          maxGenerations,
          totalGenerations: totalGenerations || 0,
          tokensUsed: totalTokens,
          plan
        })
      } catch (error) {
        console.error('Error fetching usage:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsage()
  }, [supabase])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!usage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Failed to load usage data. Please try again later.
          </div>
        </CardContent>
      </Card>
    )
  }

  const usagePercentage = usage.maxGenerations === Infinity ? 0 : (usage.currentGenerations / usage.maxGenerations) * 100

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.currentGenerations}</div>
            <p className="text-xs text-muted-foreground">
              of {usage.maxGenerations === Infinity ? 'Unlimited' : usage.maxGenerations} generations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalGenerations}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.tokensUsed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total tokens consumed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💎</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{usage.plan}</div>
            <p className="text-xs text-muted-foreground">
              Your subscription tier
            </p>
          </CardContent>
        </Card>
      </div>

      {usage.maxGenerations !== Infinity && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Usage</CardTitle>
            <CardDescription>
              You've used {usage.currentGenerations} of {usage.maxGenerations} generations this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span>{usagePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              {usagePercentage >= 90 && (
                <p className="text-sm text-orange-600">
                  You're approaching your monthly limit. Consider upgrading to Pro for unlimited generations.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
