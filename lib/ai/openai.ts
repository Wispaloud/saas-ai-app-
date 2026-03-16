import OpenAI from 'openai'

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured')
  }
  
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
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
