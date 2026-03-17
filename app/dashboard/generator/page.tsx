'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Navbar } from '@/components/dashboard/navbar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, Copy, Check } from 'lucide-react'

const platforms = [
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'google', label: 'Google Ads', icon: '🔍' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
]

const presetPrompts = [
  "Generate a compelling Facebook ad for a new coffee shop opening downtown",
  "Create an Instagram caption for a fitness app launch",
  "Write a Google Ads headline for a SaaS productivity tool",
  "Develop TikTok ad copy for a fashion brand targeting Gen Z",
  "Craft LinkedIn ad copy for a B2B consulting service",
  "Create Twitter announcement for a product update",
]

export default function GeneratorPage() {
  const [prompt, setPrompt] = useState('')
  const [platform, setPlatform] = useState('facebook')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [usage, setUsage] = useState<any>(null)
  const supabase = createClient()

  const checkUsage = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()

    // Get current month usage
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

    setUsage({ current: currentGenerations, max: maxGenerations, plan })

    return currentGenerations < maxGenerations
  }

  const generateContent = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    const canGenerate = await checkUsage()
    if (!canGenerate) {
      setError(`You've reached your monthly limit. Upgrade to ${usage?.plan === 'free' ? 'Pro' : 'Enterprise'} for more generations.`)
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, platform }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const data = await response.json()
      setResult(data.result)

      // Update usage metrics
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Store generation
        await supabase.from('ai_generations').insert({
          user_id: user.id,
          prompt,
          result: data.result,
          platform,
          tokens_used: data.tokens_used || 0,
        })

        // Update usage metrics
        const today = new Date().toISOString().split('T')[0]
        await supabase.rpc('increment_usage', {
          p_user_id: user.id,
          p_date: today,
          p_tokens: data.tokens_used || 0,
        })
      }
    } catch (error) {
      console.error('Error generating content:', error)
      setError('Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const usePreset = (presetPrompt: string) => {
    setPrompt(presetPrompt)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">AI Generator</h1>
              <p className="text-muted-foreground">
                Create compelling ad copy with AI-powered generation.
              </p>
              {usage && (
                <p className="text-sm text-muted-foreground mt-2">
                  {usage.current} of {usage.max === Infinity ? 'unlimited' : usage.max} generations used this month
                </p>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Ad Copy</CardTitle>
                  <CardDescription>
                    Describe what you want to create and select the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe the ad you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preset Prompts</Label>
                    <div className="flex flex-wrap gap-2">
                      {presetPrompts.map((preset, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => usePreset(preset)}
                          className="text-xs"
                        >
                          Use preset
                        </Button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <Button 
                    onClick={generateContent} 
                    disabled={loading || !prompt.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Zap className="mr-2 h-4 w-4 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Result Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    Your AI-generated ad copy will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {result ? (
                    <div className="space-y-4">
                      <div className="min-h-[200px] p-4 bg-gray-50 rounded-lg">
                        <p className="whitespace-pre-wrap">{result}</p>
                      </div>
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="w-full"
                      >
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy to Clipboard
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Zap className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p>Your generated content will appear here</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
