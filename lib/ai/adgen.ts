import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  // Only create client if it doesn't exist and we're in a server environment
  if (!openaiClient && typeof window === 'undefined') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured')
    }
    
    openaiClient = new OpenAI({
      apiKey,
    })
  }
  
  if (!openaiClient) {
    throw new Error('OpenAI client can only be initialized server-side')
  }
  
  return openaiClient
}

// Platform-specific ad generation prompts
const PLATFORM_PROMPTS = {
  facebook: {
    system: "You are a Facebook advertising expert. Create compelling Facebook ad copy that drives engagement and conversions. Focus on emotional storytelling, clear value propositions, and strong CTAs. Keep copy under 280 characters for primary text.",
    constraints: {
      maxLength: 280,
      style: 'conversational',
      tone: 'friendly',
      cta: 'clear and action-oriented'
    }
  },
  instagram: {
    system: "You are an Instagram advertising specialist. Create visually-driven Instagram ad copy that complements imagery. Use emojis strategically, hashtags effectively, and tell stories that resonate with younger audiences. Keep it concise and scroll-stopping.",
    constraints: {
      maxLength: 2200,
      style: 'visual-first',
      tone: 'inspirational',
      hashtags: '3-5 relevant hashtags'
    }
  },
  google: {
    system: "You are a Google Ads expert. Create high-converting Google Ads copy that maximizes Quality Score and CTR. Focus on keywords, benefits, urgency, and clear CTAs. Follow Google's character limits precisely.",
    constraints: {
      headlines: 'max 30 characters each',
      descriptions: 'max 90 characters each',
      style: 'benefit-focused',
      cta: 'direct and urgent'
    }
  },
  tiktok: {
    system: "You are a TikTok advertising creator. Write trendy, authentic TikTok ad copy that feels native to the platform. Use slang appropriately, focus on entertainment value, and create FOMO. Keep it short, punchy, and shareable.",
    constraints: {
      maxLength: 150,
      style: 'trendy and authentic',
      tone: 'energetic and fun',
      hooks: 'strong opening hook'
    }
  },
  linkedin: {
    system: "You are a LinkedIn B2B advertising specialist. Create professional, value-driven LinkedIn ad copy that appeals to business decision-makers. Focus on ROI, efficiency, and business outcomes. Maintain a professional yet engaging tone.",
    constraints: {
      maxLength: 600,
      style: 'professional and data-driven',
      tone: 'authoritative',
      focus: 'business value and ROI'
    }
  },
  twitter: {
    system: "You are a Twitter advertising expert. Create concise, impactful Twitter ad copy that stands out in fast-scrolling feeds. Use strong hooks, clear value props, and timely CTAs. Leverage trending topics when relevant.",
    constraints: {
      maxLength: 280,
      style: 'punchy and direct',
      tone: 'conversational',
      hooks: 'attention-grabbing opening'
    }
  }
}

export async function generatePlatformSpecificAd(
  platform: keyof typeof PLATFORM_PROMPTS,
  prompt: string,
  options: {
    product?: string
    targetAudience?: string
    objectives?: string[]
    brandVoice?: string
    additionalContext?: string
  } = {}
) {
  try {
    const openai = getOpenAIClient()
    const platformConfig = PLATFORM_PROMPTS[platform]
    
    if (!platformConfig) {
      throw new Error(`Unsupported platform: ${platform}`)
    }

    // Build enhanced prompt based on platform and options
    const enhancedPrompt = buildEnhancedPrompt(platform, prompt, options)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: platformConfig.system
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: platform === 'google' ? 200 : 500,
      temperature: 0.7,
    })

    const generatedContent = completion.choices[0]?.message?.content
    
    if (!generatedContent) {
      throw new Error('Failed to generate content')
    }

    // Parse and format response based on platform
    return formatPlatformResponse(platform, generatedContent, options)
    
  } catch (error) {
    console.error(`OpenAI API error for ${platform}:`, error)
    throw new Error(`Failed to generate ${platform} ad content`)
  }
}

function buildEnhancedPrompt(
  platform: keyof typeof PLATFORM_PROMPTS,
  basePrompt: string,
  options: {
    product?: string
    targetAudience?: string
    objectives?: string[]
    brandVoice?: string
    additionalContext?: string
  }
): string {
  let enhancedPrompt = basePrompt
  
  if (options.product) {
    enhancedPrompt += `\n\nProduct/Service: ${options.product}`
  }
  
  if (options.targetAudience) {
    enhancedPrompt += `\n\nTarget Audience: ${options.targetAudience}`
  }
  
  if (options.objectives && options.objectives.length > 0) {
    enhancedPrompt += `\n\nCampaign Objectives: ${options.objectives.join(', ')}`
  }
  
  if (options.brandVoice) {
    enhancedPrompt += `\n\nBrand Voice: ${options.brandVoice}`
  }
  
  if (options.additionalContext) {
    enhancedPrompt += `\n\nAdditional Context: ${options.additionalContext}`
  }
  
  // Add platform-specific instructions
  const constraints = PLATFORM_PROMPTS[platform].constraints
  enhancedPrompt += `\n\nPlatform Requirements:\n${Object.entries(constraints).map(([key, value]) => `- ${key}: ${value}`).join('\n')}`
  
  return enhancedPrompt
}

function formatPlatformResponse(
  platform: keyof typeof PLATFORM_PROMPTS,
  content: string,
  options: any
) {
  const baseResponse = {
    platform,
    content,
    generatedAt: new Date().toISOString(),
    metadata: {
      product: options.product || null,
      targetAudience: options.targetAudience || null,
      objectives: options.objectives || [],
      brandVoice: options.brandVoice || null
    }
  }

  // Platform-specific formatting
  switch (platform) {
    case 'google':
      // Parse Google Ads format (headlines and descriptions)
      const lines = content.split('\n').filter(line => line.trim())
      const headlines = lines.filter((_, index) => index < 3).slice(0, 3)
      const descriptions = lines.slice(3, 5)
      
      return {
        ...baseResponse,
        format: 'google_ads',
        headlines: headlines.map(h => h.trim().substring(0, 30)),
        descriptions: descriptions.map(d => d.trim().substring(0, 90))
      }
      
    case 'instagram':
      // Parse Instagram format with hashtags
      const words = content.split(' ')
      const hashtags = words.filter(word => word.startsWith('#'))
      const caption = words.filter(word => !word.startsWith('#')).join(' ')
      
      return {
        ...baseResponse,
        format: 'instagram_post',
        caption: caption.trim(),
        hashtags: hashtags.slice(0, 5)
      }
      
    case 'tiktok':
      return {
        ...baseResponse,
        format: 'tiktok_video',
        hook: content.split('\n')[0]?.trim() || '',
        body: content.split('\n').slice(1).join('\n').trim(),
        cta: extractCTA(content)
      }
      
    default:
      return {
        ...baseResponse,
        format: 'standard_ad',
        headline: extractHeadline(content),
        body: extractBody(content),
        cta: extractCTA(content)
      }
  }
}

// Helper functions for content parsing
function extractHeadline(content: string): string {
  const lines = content.split('\n')
  return lines[0]?.trim() || content.substring(0, 50)
}

function extractBody(content: string): string {
  const lines = content.split('\n')
  return lines.slice(1, -1).join('\n').trim()
}

function extractCTA(content: string): string {
  const ctaKeywords = ['shop now', 'learn more', 'sign up', 'get started', 'buy now', 'click here', 'discover', 'explore']
  const lines = content.split('\n')
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    for (const keyword of ctaKeywords) {
      if (lowerLine.includes(keyword)) {
        return line.trim()
      }
    }
  }
  
  return lines[lines.length - 1]?.trim() || ''
}

// Batch generation for multiple platforms
export async function generateMultiPlatformAds(
  platforms: (keyof typeof PLATFORM_PROMPTS)[],
  basePrompt: string,
  options: {
    product?: string
    targetAudience?: string
    objectives?: string[]
    brandVoice?: string
    additionalContext?: string
  } = {}
) {
  const results = await Promise.allSettled(
    platforms.map(platform => 
      generatePlatformSpecificAd(platform, basePrompt, options)
    )
  )
  
  return results.map((result, index) => ({
    platform: platforms[index],
    success: result.status === 'fulfilled',
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason.message : null
  }))
}

// Creative concept generation
export async function generateCreativeConcepts(
  platform: keyof typeof PLATFORM_PROMPTS,
  product: string,
  targetAudience: string,
  objectives: string[]
) {
  try {
    const openai = getOpenAIClient()
    
    const prompt = `Generate 3 creative concepts for ${platform} ads promoting ${product} to ${targetAudience}. 
    Objectives: ${objectives.join(', ')}.
    
    For each concept, provide:
    1. Concept Name (catchy title)
    2. Core Idea (main message)
    3. Visual Direction (imagery/style)
    4. Copy Angle (how to frame the message)
    5. CTA Approach (call to action strategy)`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a creative director specializing in ${platform} advertising. Generate innovative, platform-native creative concepts that drive results.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.8,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('Failed to generate concepts')

    // Parse the concepts into structured format
    return parseCreativeConcepts(content, platform)
    
  } catch (error) {
    console.error('Creative concepts generation error:', error)
    throw new Error('Failed to generate creative concepts')
  }
}

function parseCreativeConcepts(content: string, platform: string) {
  // Simple parsing - in production, you'd want more sophisticated parsing
  const concepts = content.split(/\d+\./).filter(concept => concept.trim())
  
  return concepts.map((concept, index) => ({
    id: `concept_${index + 1}`,
    platform,
    name: concept.split('\n')[0]?.trim() || `Concept ${index + 1}`,
    coreIdea: extractSection(concept, 'Core Idea'),
    visualDirection: extractSection(concept, 'Visual Direction'),
    copyAngle: extractSection(concept, 'Copy Angle'),
    ctaApproach: extractSection(concept, 'CTA Approach'),
    fullDescription: concept.trim()
  }))
}

function extractSection(content: string, sectionName: string): string {
  const lines = content.split('\n')
  const startIndex = lines.findIndex(line => 
    line.toLowerCase().includes(sectionName.toLowerCase())
  )
  
  if (startIndex === -1) return ''
  
  const sectionLines = []
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line === '' || /^\d+\./.test(line)) break
    sectionLines.push(line)
  }
  
  return sectionLines.join(' ').replace(/^[:\s]+/, '')
}

export default {
  generatePlatformSpecificAd,
  generateMultiPlatformAds,
  generateCreativeConcepts,
  PLATFORM_PROMPTS
}
