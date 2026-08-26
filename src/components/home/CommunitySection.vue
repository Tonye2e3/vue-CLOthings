<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
// api：跟 Community 那幾個頁面共用同一個 axios 實例（src/services/api.js），
// 會自動把登入後的 JWT token 帶進 Authorization header。
import api from '@/services/api'

// IMAGE_BASE：貼文圖片是靜態檔案，走的不是 /api 這條路徑，
// 跟 CommunityView.vue 拿圖片網址的邏輯一樣。
const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

// posts：先給空陣列，等 fetchTopPosts() 打完 API 才會有真正資料庫裡的熱門貼文。
const posts = ref([])
const loading = ref(true)

// fetchTopPosts：跟後端要「全部貼文」，依讚數（likesCount）由多到少排序，
// 取前 3 篇當作首頁「社群穿搭靈感」要秀出來的熱門貼文——
// 跟 CommunityView.vue「熱門」分頁的排序邏輯是同一套（也是依 likesCount 排序），
// 只是這裡不需要分頁、追蹤這些額外功能，單純取前 3 名。
// 後端 GetCommunityPost 已經固定只回傳 status 是 public 的貼文，這裡不用再另外篩選。
const fetchTopPosts = async () => {
  try {
    const res = await api.get('/CommunityPost')
    posts.value = [...res.data]
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, 3)
      .map(p => ({
        communityPostId: p.communityPostId,
        author: p.user?.name ? `@${p.user.name}` : '@未知使用者',
        caption: p.content,
        // p.images[0]？如果這篇貼文有圖片，接上 IMAGE_BASE 組成完整網址；
        // 沒有圖片（理論上不會發生，發文一定要選照片）就留 null，畫面上退回原本的灰底佔位。
        image: p.images && p.images.length ? `${IMAGE_BASE}${p.images[0].imageFileName}` : null
      }))
  } catch (err) {
    console.error('讀取首頁熱門穿搭失敗：', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTopPosts()
})
</script>

<template>
  <section class="community">
    <div class="community-head">
      <h2 class="section-title">社群穿搭靈感</h2>
      <RouterLink :to="{ name: 'Community' }" class="community-link">前往社群 →</RouterLink>
    </div>

    <div v-if="loading" class="community-empty">載入中...</div>
    <div v-else-if="posts.length === 0" class="community-empty">目前還沒有貼文</div>

    <!--
      每張卡片點下去會跳到那篇貼文的詳情頁（/community/post/:id），
      跟 CommunityView.vue 網格卡片點進去是同一個目的地。
    -->
    <div v-else class="community-grid">
      <RouterLink
        v-for="p in posts"
        :key="p.communityPostId"
        :to="`/community/post/${p.communityPostId}`"
        class="post-card"
      >
        <div class="post-image">
          <img v-if="p.image" :src="p.image" :alt="p.caption" />
          <span v-else class="placeholder-label">貼文圖片</span>
        </div>
        <p class="post-author">{{ p.author }}</p>
        <p class="post-caption">{{ p.caption }}</p>
      </RouterLink>
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

/* community-empty：載入中／目前沒有貼文時顯示的提示文字，取代原本三張卡片的位置 */
.community-empty {
  padding: 48px 0;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

.post-card {
  display: block;
  border: 1px solid var(--home-border);
  border-radius: 8px;
  overflow: hidden; /* 卡片本身的直角圖片要跟著裁成圓角，得靠 overflow:hidden 把超出圓角範圍的部分裁掉 */
  text-decoration: none;
  color: inherit;
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
  overflow: hidden;
}
/* 有真的貼文圖片時，鋪滿整個 4:3 的框，沒有圖片（image 是 null）時，
   維持原本灰底 + 「貼文圖片」文字佔位的樣子。 */
.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  /* 貼文內文長度不一，真實資料可能比原本寫死的示範文字長很多，限制最多顯示 2 行，
     避免某一張卡片內文特別長，把整排卡片的高度撐得不一致。 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .community-grid {
    grid-template-columns: 1fr;
  }
}
</style>