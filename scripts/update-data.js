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
 * 嘗試多個模型名稱以確保相容性
 */
async function generateAIRecommendation() {
  if (!GEMINI_API_KEY) {
    console.warn('Missing GEMINI_API_KEY, using dummy recommendation.');
    return {
      name: '日本，京都 (Kyoto, Japan)',
      description: '請設定 GEMINI_API_KEY 以啟用 AI 自動生成精美文案。'
    };
  }

  const prompt = "請隨機挑選一個世界旅遊城市，並撰寫一段約 100 字的繁體中文旅遊推薦文案。回傳格式必須是純 JSON，不要包含 markdown 或其他文字: { \"name\": \"國家，城市 (English Name)\", \"description\": \"文案內容\" }";
  
  // 嘗試多個模型，確保至少有一個能用
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-pro'];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    console.log(`Trying model: ${model}...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 1.0,
            responseMimeType: 'application/json'
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(`Model ${model} failed (${response.status}):`, data.error?.message || 'Unknown error');
        continue; // 嘗試下一個模型
      }

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.warn(`Model ${model} returned no content. finishReason:`, data.candidates?.[0]?.finishReason);
        continue;
      }

      const text = data.candidates[0].content.parts[0].text;
      console.log(`✅ Model ${model} responded:`, text);

      // 強化版 JSON 提取
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(`Model ${model} response has no JSON, trying next...`);
        continue;
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.warn(`Model ${model} exception:`, error.message);
      continue;
    }
  }

  // 所有模型都失敗時的 fallback
  console.error('All Gemini models failed.');
  return { name: '瑞士，策馬特 (Zermatt)', description: 'AI 暫時無法生成文案，但策馬特的馬特洪峰絕對值得一訪！被白雪覆蓋的阿爾卑斯山巒、空氣中瀰漫的巧克力香氣，這裡是每個旅人心中的夢幻目的地。' };
}

/**
 * 從 Unsplash 抓取高畫質地點圖片
 */
async function getUnsplashImage(query) {
  if (!UNSPLASH_ACCESS_KEY) {
    return 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80';
  }

  try {
    // 只取城市英文名稱部分來搜尋，提高精準度
    const searchQuery = query.match(/\(([^)]+)\)/)?.[1] || query;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery + ' travel')}&per_page=1&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results?.[0]?.urls?.regular || 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80';
  } catch (error) {
    console.error('Unsplash Error:', error.message);
    return 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80';
  }
}

/**
 * 從 Ticketmaster 抓取全球多元化的即將舉辦活動
 * 分別搜尋不同類型 (音樂/體育/藝術) 並去重
 */
async function fetchRealEvents() {
  if (!TICKETMASTER_API_KEY) {
    console.warn('Missing TICKETMASTER_API_KEY, using dummy events.');
    return [
      { id: 101, title: "範例活動：倫敦跨年派對", location: "英國，倫敦", startDate: new Date().toISOString(), description: "請設定 TICKETMASTER_API_KEY 以抓取真實活動。", ticketUrl: "#" }
    ];
  }

  // 搜尋不同類別的活動，確保多樣性
  const categories = [
    { name: 'Music', id: 'KZFzniwnSyZfZ7v7nJ' },
    { name: 'Sports', id: 'KZFzniwnSyZfZ7v7nE' },
    { name: 'Arts & Theatre', id: 'KZFzniwnSyZfZ7v7na' }
  ];

  const allEvents = [];
  const seenTitles = new Set();

  for (const category of categories) {
    try {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&size=3&sort=date,asc&classificationId=${category.id}`;
      const response = await fetch(url);
      const data = await response.json();

      const events = data._embedded?.events || [];
      console.log(`📂 ${category.name}: found ${events.length} events`);

      for (const e of events) {
        // 用活動名稱去重，避免同名活動重複出現
        if (seenTitles.has(e.name)) continue;
        seenTitles.add(e.name);

        allEvents.push({
          id: e.id,
          title: e.name,
          location: `${e._embedded?.venues?.[0]?.city?.name || 'Unknown'}, ${e._embedded?.venues?.[0]?.country?.name || ''}`,
          startDate: e.dates?.start?.dateTime || e.dates?.start?.localDate || null,
          endDate: null,
          description: `${category.name} 活動 — 即將在 ${e._embedded?.venues?.[0]?.name || '未知場館'} 舉行。`,
          ticketUrl: e.url || '#'
        });
      }
    } catch (error) {
      console.error(`Ticketmaster ${category.name} Error:`, error.message);
    }
  }

  // 最多回傳 5 筆，確保頁面排版正常
  return allEvents.slice(0, 5);
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
    console.log(`✅ Fetched ${realEvents.length} unique events.`);
  } else {
    console.warn('⚠️ No events fetched, keeping existing data.');
  }

  // 寫入檔案
  fs.writeFileSync(dataPath, JSON.stringify(content, null, 2), 'utf-8');
  console.log('🎉 Update completed successfully!');
}

main().catch(console.error);
