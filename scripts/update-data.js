import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../data/content.json');

// --- API 配置 ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * 使用 Gemini AI 產生每日推薦旅遊地點與文案
 */
async function generateAIRecommendation() {
  if (!GEMINI_API_KEY) {
    console.warn('Missing GEMINI_API_KEY, using dummy recommendation.');
    return {
      name: '日本，京都 (Kyoto, Japan)',
      description: '請設定 GEMINI_API_KEY 以啟用 AI 自動生成精美文案。'
    };
  }

  const prompt = "請隨機挑選一個世界旅遊城市，並撰寫一段約 100 字的繁體中文旅遊推薦文案。回傳格式必須是 JSON: { \"name\": \"城市名\", \"description\": \"文案\" }。不要有任何其他文字。";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error Response:', JSON.stringify(data, null, 2));
      throw new Error(`API returned status ${response.status}`);
    }

    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      console.error('Invalid Gemini API Structure:', JSON.stringify(data, null, 2));
      throw new Error('Unexpected API response structure');
    }

    const text = data.candidates[0].content.parts[0].text;
    
    // 清理可能出現的 markdown 標籤
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Gemini API Error:', error);
    return { name: '瑞士，策馬特', description: 'AI 生成失敗，請檢查 API Key 或網路連線。' };
  }
}

/**
 * 從 Unsplash 抓取高畫質地點圖片
 */
async function getUnsplashImage(query) {
  if (!UNSPLASH_ACCESS_KEY) {
    return 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80';
  }

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&client_id=${UNSPLASH_ACCESS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results[0]?.urls?.regular || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80';
  } catch (error) {
    return 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80';
  }
}

/**
 * 從 Ticketmaster 抓取全球即將舉辦的活動
 */
async function fetchRealEvents() {
  if (!TICKETMASTER_API_KEY) {
    console.warn('Missing TICKETMASTER_API_KEY, using dummy events.');
    return [
      { id: 101, title: "範例活動：倫敦跨年派對", location: "英國，倫敦", startDate: new Date().toISOString(), description: "請設定 TICKETMASTER_API_KEY 以抓取真實活動。", ticketUrl: "#" }
    ];
  }

  try {
    // 抓取未來 30 天內全球熱門活動
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&size=5&sort=relevance,desc`;
    const response = await fetch(url);
    const data = await response.json();
    
    const events = data._embedded?.events || [];
    return events.map(e => ({
      id: e.id,
      title: e.name,
      location: `${e._embedded?.venues[0]?.city?.name}, ${e._embedded?.venues[0]?.country?.name}`,
      startDate: e.dates.start.dateTime || e.dates.start.localDate,
      endDate: null,
      description: `這是一場即將在 ${e._embedded?.venues[0]?.name} 舉行的精彩活動。`,
      ticketUrl: e.url
    }));
  } catch (error) {
    console.error('Ticketmaster Error:', error);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting real data update engine...');

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const content = JSON.parse(rawData);

  // 1. 抓取 AI 推薦地點
  const aiRec = await generateAIRecommendation();
  console.log('✅ AI generated location:', aiRec.name);

  // 2. 抓取圖片
  const imageUrl = await getUnsplashImage(aiRec.name);
  
  content.dailyRecommendation = {
    ...aiRec,
    imageUrl: imageUrl,
    affiliateUrl: `https://www.agoda.com/partners/partnersearch.aspx?pcs=1&city=${encodeURIComponent(aiRec.name)}`,
    displayDate: new Date().toISOString()
  };

  // 3. 抓取真實活動
  const realEvents = await fetchRealEvents();
  if (realEvents.length > 0) {
    content.upcomingEvents = realEvents;
    console.log(`✅ Fetched ${realEvents.length} real events.`);
  }

  // 寫入檔案
  fs.writeFileSync(dataPath, JSON.stringify(content, null, 2), 'utf-8');
  console.log('🎉 Update completed successfully!');
}

main().catch(console.error);
