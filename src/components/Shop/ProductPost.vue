<script setup>
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/services/api'

// productId：從父層 ProductView.vue 傳進來，是「目前正在看的這件商品」的 id——
// 這個元件本身不知道自己在哪個商品頁底下，一定要靠外面傳進來才知道要查哪件商品。
const props = defineProps({
  productId: {
    type: [Number, String],
    default: null
  }
})

// IMAGE_BASE：貼文圖片是靜態檔案，走的不是 /api 這條路徑，
// 跟 CommunityView.vue 拿圖片網址的邏輯一樣。
const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

const communityPosts = ref([])
const loading = ref(true)

// fetchPostsByProduct：查「有標記過這件商品的貼文」，依讚數排序取前 3 篇——
// 跟首頁 CommunitySection.vue 的「全站最熱門 3 篇」不一樣，這裡刻意只看
// 跟「當下這件商品」有關的貼文，畢竟商品頁擺這一區，目的是讓使用者看看
// 別人實際怎麼搭這件商品，不是隨便推薦不相干的熱門貼文。
const fetchPostsByProduct = async () => {
  if (!props.productId) {
    communityPosts.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await api.get(`/CommunityPost/by-product/${props.productId}`)
    communityPosts.value = res.data.map(p => ({
      communityPostId: p.communityPostId,
      handle: p.user?.name ? `@${p.user.name}` : '@未知使用者',
      caption: p.content,
      image: p.images && p.images.length ? `${IMAGE_BASE}${p.images[0].imageFileName}` : null
    }))
  } catch (err) {
    console.error('讀取商品相關穿搭貼文失敗：', err)
    communityPosts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchPostsByProduct)

// watch productId：使用者可能在同一個 ProductView.vue 頁面上，透過「相似穿搭推薦」
// 或其他連結切到另一件商品（Vue Router 重複使用同一個元件、不會整個重新掛載），
// 這種情況 onMounted 不會再執行第二次，要另外監看 productId 改變時重新查一次。
watch(() => props.productId, fetchPostsByProduct)
</script>

<template>
  <div class="community-section">
    <div class="community-header">
      <h2 class="section-title">社群穿搭靈感</h2>
      <RouterLink to="/community" class="community-link">前往社群 →</RouterLink>
    </div>

    <p v-if="loading" class="state-label">載入中...</p>
    <p v-else-if="communityPosts.length === 0" class="state-label">目前還沒有人分享這件商品的穿搭</p>

    <!-- 每張卡片點下去會跳到那篇貼文的詳情頁，跟 CommunityView.vue 網格卡片點進去是同一個目的地。 -->
    <div v-else class="community-grid">
      <RouterLink
        v-for="post in communityPosts"
        :key="post.communityPostId"
        :to="`/community/post/${post.communityPostId}`"
        class="community-card"
      >
        <div class="community-image">
          <img v-if="post.image" :src="post.image" :alt="post.caption" />
          <span v-else class="placeholder-label">貼文圖片</span>
        </div>
        <p class="community-handle">{{ post.handle }}</p>
        <p class="community-caption">{{ post.caption }}</p>
      </RouterLink>
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

.state-label {
  color: #999;
  font-size: 0.9rem;
}

.community-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.community-card {
  display: block;
  text-decoration: none;
  color: inherit;
}

.community-image {
  display: flex;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #e5e5e5;
  overflow: hidden;
  justify-content: center;
  align-items: center;
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
  /* 貼文內文長度不一，真實資料可能比原本寫死的示範文字長很多，限制最多顯示 2 行，
     避免某一張卡片內文特別長，把整排卡片的高度撐得不一致。 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>