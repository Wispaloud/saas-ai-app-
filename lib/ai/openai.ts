import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateMarketingContent(prompt: string) {
  try {
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

export default openai
