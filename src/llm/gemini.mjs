import axios from 'axios';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';

export async function geminiChat({ apiKey, system, messages, json = false }){
  const headers = { 'Content-Type': 'application/json' };
  const body = {
    contents: [
      ...(system ? [{ role: 'user', parts: [{ text: system }] }] : []),
      ...messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, parts: [{ text: m.content }] }))
    ],
    generationConfig: json ? { responseMimeType: 'application/json' } : undefined
  };
  const { data } = await axios.post(`${GEMINI_URL}?key=${apiKey}`, body, { headers, timeout: 15000 });
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
  return text;
}
