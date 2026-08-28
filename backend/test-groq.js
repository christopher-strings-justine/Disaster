const Groq = require('groq-sdk');
require('dotenv').config({ path: 'c:/Users/G. divyesh/OneDrive/Desktop/Disaster Sih/backend/.env' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function test() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: "Hello" }],
      model: 'llama-3.2-11b-vision-preview',
    });
    console.log(chatCompletion.choices[0].message.content);
  } catch (e) {
    console.error(e.message);
  }
}
test();
