import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generateMarketingContent } from '@/lib/ai/openai'

export async function POST(request: NextRequest) {
  try {
    const { prompt, platform } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    // Check user's subscription and usage
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    const currentMonth = new Date().toISOString().slice(0, 7)
    const { data: currentUsage } = await supabase
      .from('usage_metrics')
      .select('generations_count')
      .eq('user_id', user.id)
      .gte('date', `${currentMonth}-01`)
      .lte('date', `${currentMonth}-31`)
      .single()

    const planLimits = {
      free: 10,
      pro: 1000,
      enterprise: Infinity
    }

    const plan = subscription?.plan || 'free'
    const maxGenerations = planLimits[plan as keyof typeof planLimits]
    const currentGenerations = currentUsage?.generations_count || 0

    if (currentGenerations >= maxGenerations) {
      return NextResponse.json(
        { error: 'Monthly limit reached. Please upgrade your plan.' },
        { status: 429 }
      )
    }

    // Generate content
    const platformPrompt = platform && platform !== 'general' 
      ? `Generate this content specifically for ${platform}: ${prompt}`
      : prompt

    const result = await generateMarketingContent(platformPrompt)

    // Estimate tokens (rough calculation)
    const tokensUsed = Math.ceil((prompt.length + result.length) / 4)

    return NextResponse.json({
      result,
      tokens_used: tokensUsed,
      platform,
      plan,
      remaining_generations: maxGenerations - currentGenerations - 1
    })

  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
