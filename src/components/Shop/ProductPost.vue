<script setup>
import { ref } from 'vue'

const communityPosts = ref([
  {
    handle: '@wear_daily',
    caption: '簡約穿搭，回歸日常',
    image: '/img/community-1.jpg',
  },
  {
    handle: '@min_style',
    caption: '一件外套的四種穿法',
    image: '/img/community-2.jpg',
  },
  {
    handle: '@clothings_fan',
    caption: '週末的舒適選擇',
    image: '/img/community-3.jpg',
  },
])
</script>

<template>
  <div class="community-section">
    <div class="community-header">
      <h2 class="section-title">社群穿搭靈感</h2>
      <a href="#" class="community-link">前往社群 →</a>
    </div>

    <div class="community-grid">
      <div v-for="post in communityPosts" :key="post.handle" class="community-card">
        <div class="community-image">
          <img :src="post.image" alt="貼文圖片" />
        </div>
        <p class="community-handle">{{ post.handle }}</p>
        <p class="community-caption">{{ post.caption }}</p>
      </div>
    </div>
  </div>
</template>

<style scope>
.community-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 60px;
}

.community-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.community-link {
  font-size: 0.85rem;
  color: #666666;
  text-decoration: none;
}

.community-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.community-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #e5e5e5;
  overflow: hidden;
}

.community-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-handle {
  font-weight: 600;
  font-size: 0.9rem;
  margin-top: 10px;
}

.community-caption {
  font-size: 0.8rem;
  color: #666666;
  margin-top: 2px;
}
</style>
