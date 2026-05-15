import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  // 1. 安全性檢查：驗證 Request Headers 或是 Query 參數中的密碼
  const authHeader = getHeader(event, 'authorization')
  
  // 請確認您的 Render 環境變數 (Environment Variables) 中有設定 CRON_SECRET
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    console.warn('Unauthorized cron trigger attempt.')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  console.log('Authorized cron job triggered by external service.')

  try {
    // 2. 爬蟲或生成新資料的邏輯
    const newDestination = await prisma.destination.create({
      data: {
        name: '自動更新產生 ' + new Date().toISOString().split('T')[0],
        description: '這是一段由 Render Cron Job 呼叫 API 產生的最新旅遊推薦文案。',
        imageUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80',
        affiliateUrl: 'https://www.agoda.com/partners/partnersearch.aspx',
        displayDate: new Date(),
      }
    })
    
    console.log('Successfully added new daily recommendation:', newDestination.name)
    
    return {
      success: true,
      message: 'Daily update completed successfully.',
      data: newDestination
    }
  } catch (error) {
    console.error('Failed to execute daily update:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error'
    })
  }
})
