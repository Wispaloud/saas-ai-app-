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

export async function generateMarketingContent(prompt: string) {
  try {
    const openai = getOpenAIClient()
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a world-class marketing copywriter. Generate compelling marketing content based on the user\'s prompt.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || 'Failed to generate content'
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate content')
  }
}

export default getOpenAIClient
