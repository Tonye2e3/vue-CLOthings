<script setup>
import { ref } from 'vue'

const reviews = ref([
  {
    name: '林小姐',
    rating: 4,
    comment: '摸起來柔軟不扎，暖沙色很顯氣質，搭襯大衣超好看。',
  },
  {
    name: '周先生',
    rating: 5,
    comment: '細節做得很精緻，邊緣走線乾淨，保暖度也不錯。',
  },
  {
    name: '蔡先生',
    rating: 2,
    comment: '太JO了，我女友不喜歡。',
  },
])
</script>

<template>
  <div class="reviews-section">
    <h2 class="section-title">顧客評價</h2>

    <div class="reviews-grid">
      <div v-for="review in reviews" :key="review.name" class="review-card">
        <div class="review-header">
          <div class="review-avatar"></div>
          <span class="review-name">{{ review.name }}</span>
          <span class="review-stars">
            <span v-for="n in review.rating" :key="n">★</span>
          </span>
        </div>
        <p class="review-comment">{{ review.comment }}</p>
      </div>
    </div>
  </div>
</template>

<style scope>
.reviews-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.review-card {
  background: #f9f8f6;
  padding: 20px;
  border-radius: 4px;
}

.review-header {
  display: flex;
  align-items: center; /*對齊*/
  gap: 8px;
  margin-bottom: 8px;
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%; /* 正方形變圓 */
  background: #d9d9d9;
}

.review-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.review-stars {
  margin-left: auto; /* 把星星推到最右邊 */
  color: #e6a817;
  font-size: 0.85rem;
}

.review-comment {
  font-size: 0.85rem;
  color: #333333;
  line-height: 1.6;
}
</style>
