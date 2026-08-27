import { Router } from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Mock fallback if user hasn't set API key
      console.warn('GEMINI_API_KEY not found in .env, falling back to mock logic.');
      return res.json({
        isHazard: false,
        prediction: 'Mock Safe Environment (API Key Missing)',
        confidence: 99.9,
        boundingBoxes: []
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const imageParts = [
      {
        inlineData: {
          data: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype
        }
      }
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const responseText = result.response.text();
    
    // Extract JSON from markdown if present
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const parsedJson = JSON.parse(jsonStr);
      res.json(parsedJson);
    } catch (e) {
      console.error('Failed to parse Gemini response', responseText);
      res.status(500).json({ error: 'Failed to parse AI response' });
    }

  } catch (error) {
    console.error('Vision API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
