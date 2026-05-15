import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    // 獲取最新的推薦地點 (今天或最近的)
    const dailyRecommendation = await prisma.destination.findFirst({
      orderBy: {
        displayDate: 'desc'
      }
    })

    // 獲取未來的活動
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: new Date()
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: 3
    })

    return {
      success: true,
      data: {
        dailyRecommendation,
        upcomingEvents
      }
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: 'Failed to fetch data'
    }
  }
})
