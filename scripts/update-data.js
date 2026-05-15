import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/content.json');

async function updateData() {
  console.log('Starting static data update...');

  // 讀取舊資料
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const content = JSON.parse(rawData);

  // 模擬爬蟲抓取新資料或是呼叫 OpenAI API
  const newDate = new Date().toISOString();
  
  content.dailyRecommendation = {
    name: '隨機產生地點 (SSG 更新測試)',
    description: `這是在 ${newDate} 由 GitHub Actions 觸發 Node.js 腳本自動更新的文案。完全不需要資料庫，省錢又安全！`,
    imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
    affiliateUrl: 'https://www.skyscanner.com.tw/',
    displayDate: newDate
  };

  // 寫入新資料回 content.json
  fs.writeFileSync(dataPath, JSON.stringify(content, null, 2), 'utf-8');
  console.log('Successfully updated content.json');
}

updateData().catch(console.error);
