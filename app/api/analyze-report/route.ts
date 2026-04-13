import { streamText, convertToModelMessages, UIMessage } from 'ai'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const messages: UIMessage[] = body.messages || []
    
    // Extract report info from the last message's data
    const lastMessage = messages[messages.length - 1]
    const reportPathname = lastMessage?.data?.reportPathname
    const reportType = lastMessage?.data?.reportType

    // Build the system prompt for medical analysis
    const systemPrompt = `You are a helpful medical AI assistant. Your role is to analyze medical reports and provide helpful information about potential precautions and general health suggestions.

IMPORTANT DISCLAIMERS:
- You are NOT a licensed medical professional
- Your suggestions are for informational purposes only
- Always recommend consulting with a qualified healthcare provider
- Never prescribe specific medications or dosages
- Focus on general wellness advice, lifestyle recommendations, and when to seek professional help

When analyzing reports, provide:
1. A brief summary of what you observe in the report
2. General health precautions based on the findings
3. Lifestyle and wellness suggestions
4. Clear recommendation to consult with a doctor for proper diagnosis and treatment

Be empathetic, clear, and helpful while maintaining appropriate medical boundaries.`

    // If there's a report attached, include context about it
    let reportContext = ''
    if (reportPathname) {
      if (reportType?.startsWith('image/')) {
        reportContext = `\n\n[The user has uploaded a medical report image. Please analyze based on their description of symptoms and any information they share from the report.]`
      } else {
        reportContext = `\n\n[The user has uploaded a medical report PDF. Please analyze based on their description and any information they share from the document.]`
      }
    }

    const result = streamText({
      model: 'google/gemini-3-flash',
      system: systemPrompt + reportContext,
      messages: await convertToModelMessages(messages),
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Analysis error:', error)
    return new Response(JSON.stringify({ error: 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
