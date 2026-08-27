import { Router } from 'express';
import multer from 'multer';
import Groq from 'groq-sdk';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Mock fallback if user hasn't set API key
      console.warn('GROQ_API_KEY not found in .env, falling back to mock logic.');
      return res.json({
        isHazard: false,
        prediction: 'Mock Safe Environment (API Key Missing)',
        confidence: 99.9,
        boundingBoxes: []
      });
    }

    const groq = new Groq({ apiKey });

    const prompt = `
      You are an expert disaster management AI.
      Analyze this image for any structural damage, geological hazards (like landslides, sinkholes, mudslides, large cracks), flooding, or fires.
      Return ONLY a raw JSON object with the following schema:
      {
        "isHazard": boolean (true if a real disaster/hazard is present, false if it's a normal indoor/urban environment, animals, people, etc.),
        "prediction": string (short description of the hazard, or 'Safe Environment' if none),
        "confidence": number (percentage 0-100),
        "boundingBoxes": array of objects { x: number (percentage 0-100), y: number (percentage 0-100), w: number (percentage 0-100), h: number (percentage 0-100), label: string, confidence: number } (Optional, leave empty if no hazard)
      }
    `;

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: dataUri
              }
            }
          ]
        }
      ],
      model: 'llama-3.2-11b-vision-preview',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '{}';
    
    // Extract JSON from markdown if present
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsedJson = JSON.parse(jsonStr);
      res.json(parsedJson);
    } catch (e) {
      console.error('Failed to parse Groq response', responseText);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }

  } catch (error) {
    console.error('Vision API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
