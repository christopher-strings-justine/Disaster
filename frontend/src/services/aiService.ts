import Groq from 'groq-sdk';
import { Prediction } from '../types/prediction';

const groqClient = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY || 'dummy_key',
  dangerouslyAllowBrowser: true // Needed for frontend usage
});

export const aiService = {
  analyzePrediction: async (prediction: Prediction): Promise<string> => {
    try {
      if (!import.meta.env.VITE_GROQ_API_KEY) {
        return "AI analysis unavailable (Missing API Key).";
      }

      const prompt = `
You are a senior disaster-risk analyst AI.
Explain this predicted disaster risk in 2-3 concise sentences.
Do NOT invent fake data. Use ONLY the data provided below.
If data is missing, state it.

DATA:
Hazard: ${prediction.hazardType}
Location: ${prediction.locationName}
Probability: ${prediction.probability}%
Confidence: ${prediction.confidence}%
Severity: ${prediction.severity}
Forecast Window: ${prediction.forecastStart} to ${prediction.forecastEnd}
Methodology: ${prediction.methodology}

Factors driving this risk:
${prediction.contributingFactors.map(f => `- ${f.name} (${f.impact}): ${f.value}`).join('\n')}

Based on this structured data, provide a professional, concise assessment explaining why the risk is elevated and what should be monitored. Do NOT give general safety advice. Do NOT claim the disaster will definitely happen. Keep it strictly to explaining the model outputs provided above.`;

      const completion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.1,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content || "No explanation could be generated.";
    } catch (err) {
      console.error("[aiService] Groq analysis failed:", err);
      return "AI explanation is temporarily unavailable.";
    }
  }
};
