const Groq = require('groq-sdk');
require('dotenv').config({ path: 'c:/Users/G. divyesh/OneDrive/Desktop/Disaster Sih/backend/.env' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function test() {
  try {
    const models = await groq.models.list();
    console.log(models.data.map(m => m.id).filter(id => id.includes('vision') || id.includes('llama')));
  } catch (e) {
    console.error(e.message);
  }
}
test();
