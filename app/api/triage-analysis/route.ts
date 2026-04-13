import { generateText } from 'ai'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { questions, calculatedSeverity, totalScore, maxScore } = await req.json()

    const questionsText = questions
      .map((q: { question: string; answer: string }, i: number) => `${i + 1}. ${q.question}\n   Answer: ${q.answer}`)
      .join('\n\n')

    const prompt = `You are a medical triage AI assistant. Based on the following patient assessment responses, provide:
1. A brief analysis of the patient's condition (2-3 sentences)
2. 4 specific recommendations based on the severity level

Patient Assessment Responses:
${questionsText}

Calculated Severity: ${calculatedSeverity}
Symptom Score: ${totalScore} out of ${maxScore}

IMPORTANT: 
- Be professional and empathetic
- Never diagnose specific conditions
- Always recommend consulting a healthcare provider
- Tailor recommendations to the ${calculatedSeverity} severity level

Respond in JSON format:
{
  "analysis": "Your analysis here...",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4"]
}`

    const result = await generateText({
      model: 'google/gemini-3-flash',
      prompt,
      maxOutputTokens: 500,
    })

    // Parse the JSON response
    let parsedResponse
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      // Fallback if JSON parsing fails
      parsedResponse = {
        analysis: result.text,
        recommendations: getDefaultRecommendations(calculatedSeverity)
      }
    }

    return Response.json({
      analysis: parsedResponse.analysis,
      recommendations: parsedResponse.recommendations
    })
  } catch (error) {
    console.error('Triage analysis error:', error)
    return Response.json({
      analysis: getDefaultAnalysis(),
      recommendations: getDefaultRecommendations('Moderate')
    })
  }
}

function getDefaultRecommendations(severity: string): string[] {
  if (severity === 'Low') {
    return [
      'Rest and monitor your symptoms at home',
      'Stay hydrated and maintain proper nutrition',
      'Take over-the-counter medication if appropriate',
      'Schedule a routine appointment if symptoms persist beyond 48 hours'
    ]
  } else if (severity === 'High') {
    return [
      'Seek immediate medical attention',
      'Consider visiting an emergency room',
      'Do not drive yourself - arrange for transportation',
      'Bring a list of your symptoms and medications'
    ]
  }
  return [
    'Consider seeing a healthcare provider today',
    'Monitor your symptoms for any changes',
    'Rest and avoid strenuous activities',
    'Keep track of symptom progression'
  ]
}

function getDefaultAnalysis(): string {
  return 'Based on your responses, we recommend consulting with a healthcare provider for proper evaluation. Your symptoms should be assessed by a medical professional to ensure appropriate care.'
}
