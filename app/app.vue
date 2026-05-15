<template>
  <div>
    <!-- Hero Section -->
    <header class="hero">
      <div class="container">
        <h1>Wanderlust AI</h1>
        <p>您的每日智能旅遊顧問。探索世界角落，發掘即將到來的精彩活動。</p>
      </div>
    </header>

    <main class="container">
      <!-- Daily Recommendation -->
      <section v-if="pageData?.dailyRecommendation">
        <h2 class="section-title">今日推薦地點</h2>
        <div class="glass-card daily-rec">
          <span class="badge">今日推薦</span>
          <img 
            :src="pageData.dailyRecommendation.imageUrl" 
            :alt="pageData.dailyRecommendation.name" 
            class="daily-rec-img"
          />
          <h3>{{ pageData.dailyRecommendation.name }}</h3>
          <p>{{ pageData.dailyRecommendation.description }}</p>
          <div>
            <a :href="pageData.dailyRecommendation.affiliateUrl" target="_blank" class="btn">
              查看推薦行程與機票 (合作優惠)
            </a>
          </div>
        </div>
      </section>

      <div style="height: 4rem;"></div>

      <!-- Upcoming Events -->
      <section v-if="pageData?.upcomingEvents?.length">
        <h2 class="section-title">全球近期活動</h2>
        <div class="grid">
          <div 
            v-for="event in pageData.upcomingEvents" 
            :key="event.id"
            class="glass-card event-item"
          >
            <span class="event-date">
              {{ formatDate(event.startDate) }} 
              <template v-if="event.endDate"> ~ {{ formatDate(event.endDate) }}</template>
            </span>
            <h3>{{ event.title }}</h3>
            <p>地點：{{ event.location }}</p>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 0.5rem;">
              {{ event.description }}
            </p>
            <a :href="event.ticketUrl" target="_blank" class="btn" style="margin-top: auto; text-align: center;">
              購票資訊與周邊住宿
            </a>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useHead } from '#imports'
import staticData from '../data/content.json'

// SEO Setup
useHead({
  title: 'Wanderlust AI - 每日旅遊推薦與全球活動',
  meta: [
    { name: 'description', content: '每日為您推薦一個迷人的旅遊地點，並自動整理全球即遇到發生的精彩活動，幫助您規劃下一趟完美旅程。' }
  ],
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@400;700&display=swap' }
  ]
})

// Use static data directly
const pageData = staticData

// Helper to format date
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toISOString().split('T')[0]
}
</script>
