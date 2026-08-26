<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'

// 接收商品頁傳來的 productId
const props = defineProps({
  productId: {
    type: Number,
    required: true,
  },
})

const reviews = ref([])

const API_BASE = import.meta.env.VITE_API_URL
function getImageUrl(fileName) {
  if (!fileName) return null
  return `${API_BASE}/images/review/${fileName}`   // 評價圖片路徑（依你實際擺放調整）
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

async function loadReviews() {
  try {
    const response = await api.get(`/review/product/${props.productId}`)
    console.log('評價 API 回傳:', response.data)   // 加這行
    reviews.value = response.data
  } catch (error) {
    console.error('載入評價失敗：', error)
  }
}

function avatarColor(name) {
  const colors = ['#c9a063', '#7fa87f', '#a67f9e', '#7f95a8', '#c98080']
  const index = (name?.charCodeAt(0) || 0) % colors.length
  return colors[index]
}

onMounted(loadReviews)
// productId 變了（換商品）重載
watch(() => props.productId, loadReviews)
</script>

<template>
  <div class="reviews-section">
    <h2 class="section-title">顧客評價</h2>

    <!-- 沒有評價 -->
    <div v-if="reviews.length === 0" class="no-review">
      目前還沒有評價
    </div>

    <div v-else class="reviews-grid">
      <div v-for="review in reviews" :key="review.reviewId" class="review-card">
        <div class="review-header">
          <!-- 頭貼取名子第一個字就好 -->
          <div class="review-avatar" :style="{ background: avatarColor(review.userName) }">
            {{ review.userName?.charAt(0) }}
          </div>
          <span class="review-name">{{ review.userName }}</span>
          <span class="review-stars">
            <span v-for="n in review.rating" :key="n">★</span>
          </span>
        </div>
        <p class="review-comment">{{ review.reviewComment }}</p>
        <p class="review-date">{{ formatDate(review.reviewDatetime) }}</p>
      </div>
    </div>
  </div>
</template>

<style scope>
.no-review {
  text-align: center;
  padding: 40px;
  color: #888;
}

.review-date {
  font-size: 0.75rem;
  color: #aaa;
  margin-top: 8px;
}

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
  align-items: center;
  /*對齊*/
  gap: 8px;
  margin-bottom: 8px;
}

.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #c9a063;
  /* 底色（改你喜歡的）*/
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.review-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.review-stars {
  margin-left: auto;
  /* 把星星推到最右邊 */
  color: #e6a817;
  font-size: 0.85rem;
}

.review-comment {
  font-size: 0.85rem;
  color: #333333;
  line-height: 1.6;
}
</style>
