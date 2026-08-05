<script setup>
import { RouterLink } from 'vue-router'

const posts = [
  { author: '@wear_daily', caption: '簡約穿搭，回歸日常' },
  { author: '@min_style', caption: '一件外套的四種穿法' },
  { author: '@clothings_fan', caption: '週末的舒適選擇' },
]
</script>

<template>
  <section class="community">
    <div class="community-head">
      <h2 class="section-title">社群穿搭靈感</h2>
      <RouterLink :to="{ name: 'Community' }" class="community-link">前往社群 →</RouterLink>
    </div>
    <div class="community-grid">
      <article v-for="p in posts" :key="p.author" class="post-card">
        <div class="post-image">
          <span class="placeholder-label">貼文圖片</span>
        </div>
        <p class="post-author">{{ p.author }}</p>
        <p class="post-caption">{{ p.caption }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.community {
  max-width: 1280px;
  margin: 0 auto;
  padding: 64px 24px;
}

.community-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--home-text);
}

.community-link {
  font-size: 0.85rem;
  color: var(--home-text);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}
.community-link:hover {
  border-color: var(--home-accent);
  color: var(--home-accent);
}

.community-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.post-card {
  border: 1px solid var(--home-border);
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}
.post-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-4px);
}

.post-image {
  aspect-ratio: 4 / 3;
  background: linear-gradient(135deg, #f2f2f2, #e5e5e5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-label {
  color: #999;
  font-size: 0.85rem;
}

.post-author {
  padding: 12px 16px 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--home-text);
}

.post-caption {
  padding: 4px 16px 16px;
  font-size: 0.8rem;
  color: #666;
}

@media (max-width: 768px) {
  .community-grid {
    grid-template-columns: 1fr;
  }
}
</style>
