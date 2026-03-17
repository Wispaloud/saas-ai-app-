import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import AgencyIntelligenceEngine from '@/lib/aie/core-engine'

export async function POST(request: NextRequest) {
  try {
    const aieInput = await request.json()

    // Validate input structure
    if (!aieInput.account_id || !aieInput.time_window || !aieInput.entities) {
      return NextResponse.json(
        { error: 'Invalid input structure. Required: account_id, time_window, entities' },
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

    // Check user's subscription (AIE is premium feature)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    if (!subscription || !['pro', 'enterprise'].includes(subscription.plan)) {
      return NextResponse.json(
        { error: 'AIE requires Pro or Enterprise plan' },
        { status: 403 }
      )
    }

    // Initialize AIE engine
    const aie = new AgencyIntelligenceEngine()

    // Process data and generate decisions
    const result = await aie.process(aieInput)

    // Log the analysis for audit trail
    await supabase
      .from('aie_analyses')
      .insert({
        user_id: user.id,
        account_id: aieInput.account_id,
        input_data: aieInput,
        output_data: result,
        created_at: new Date().toISOString()
      })

    return NextResponse.json(result)

  } catch (error) {
    console.error('AIE analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to process AIE analysis' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const account_id = searchParams.get('account_id')

    if (!account_id) {
      return NextResponse.json(
        { error: 'account_id parameter is required' },
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

    // Get recent AIE analyses
    const { data: analyses, error } = await supabase
      .from('aie_analyses')
      .select('*')
      .eq('user_id', user.id)
      .eq('account_id', account_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    return NextResponse.json({ analyses })

  } catch (error) {
    console.error('AIE history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AIE history' },
      { status: 500 }
    )
  }
}
