import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)
  
  // Create an initial Destination
  const dest1 = await prisma.destination.create({
    data: {
      name: '法國，巴黎 (Paris, France)',
      description: '漫步在塞納河畔，感受這座光之城的浪漫與藝術氣息。無論是探索羅浮宮的稀世珍寶，還是品嚐街角的正宗法式可頌，巴黎總能為你帶來無盡的驚喜與感動。建議趁著秋季微涼的天氣造訪，避開夏日的人潮。',
      imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80',
      affiliateUrl: 'https://www.agoda.com/partners/partnersearch.aspx?pcs=1&cid=1234567&city=145', // Example Agoda link
      displayDate: new Date(),
    },
  })
  console.log(`Created destination with id: ${dest1.id}`)

  // Create initial Events
  const events = [
    {
      title: '慕尼黑夏日啤酒節',
      location: '德國，慕尼黑',
      startDate: new Date('2026-06-15'),
      endDate: new Date('2026-06-20'),
      description: '體驗巴伐利亞的傳統文化、音樂與精釀啤酒，不容錯過的年度盛事。',
      ticketUrl: 'https://www.klook.com/activity/12345',
    },
    {
      title: '紐約獨立日煙火大會',
      location: '美國，紐約',
      startDate: new Date('2026-07-04'),
      endDate: null,
      description: '在曼哈頓的天際線下，欣賞全美最盛大的煙火表演。',
      ticketUrl: 'https://www.agoda.com/city/new-york-ny-us.html',
    },
    {
      title: '富士搖滾音樂祭 (Fuji Rock)',
      location: '日本，新潟縣',
      startDate: new Date('2026-08-12'),
      endDate: new Date('2026-08-14'),
      description: '亞洲最大的戶外音樂祭之一，在群山環繞中享受音樂與大自然。',
      ticketUrl: 'https://www.ticketmaster.com',
    }
  ]

  for (const ev of events) {
    const event = await prisma.event.create({
      data: ev,
    })
    console.log(`Created event with id: ${event.id}`)
  }
  
  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
