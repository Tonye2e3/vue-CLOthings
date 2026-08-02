<script setup>
import { ref } from 'vue'
// 1. 引入抽出來的暫時導覽列組件
import TempNavbar from '@/components/TempNavbar.vue'

// 分頁 Tab 狀態
const currentTab = ref('hot')

// 熱門商品標籤
const popularProducts = ref([
  { id: 1, name: '經典圓領短T' },
  { id: 2, name: '法式碎花洋裝' },
  { id: 3, name: '羊毛混紡針織外套' },
  { id: 4, name: '修身牛仔褲' },
  { id: 5, name: '百褶及膝裙' }
])

// 穿搭達人資料
const creators = ref([
  { id: 1, name: 'Amy_穿搭日記', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy', isFollowing: false },
  { id: 2, name: 'Kevin.style', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin', isFollowing: false },
  { id: 3, name: '小雨 rainy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rainy', isFollowing: true }
])

// 穿搭貼文假資料
const posts = ref([
  {
    postId: 1,
    user: { name: 'Amy_穿搭日記', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy' },
    title: '秋季奶茶色系穿搭，寬褲+針織的溫柔搭配',
    imageUrl: 'https://picsum.photos/400/500?random=11',
    likesCount: '1.2k',
    commentsCount: 89,
    taggedProducts: [{ id: 3, name: '羊毛混紡針織外套' }]
  },
  {
    postId: 2,
    user: { name: 'Kevin.style', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin' },
    title: '極簡工裝風 | 大地色機能外套通勤也好看',
    imageUrl: 'https://picsum.photos/400/500?random=12',
    likesCount: '856',
    commentsCount: 42,
    taggedProducts: [{ id: 1, name: '經典圓領短T' }]
  },
  {
    postId: 3,
    user: { name: '小雨 rainy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rainy' },
    title: '約會小心機 | 法式碎花洋裝配藤編包 🌸',
    imageUrl: 'https://picsum.photos/400/500?random=13',
    likesCount: '2.4k',
    commentsCount: 158,
    taggedProducts: [{ id: 2, name: '法式碎花洋裝' }]
  }
])

const toggleFollow = (creator) => {
  creator.isFollowing = !creator.isFollowing
}
</script>

<template>
  <!-- 引入 Bootstrap CSS -->
  <component is="style">
    @import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
  </component>

  <div class="community-page min-vh-100 w-100">

    <!-- 2. 替換為乾淨的 TempNavbar 組件 -->
    <TempNavbar />

    <div class="container-fluid container-lg pb-5">

      <!-- 1. 頁面標題與分享按鈕 -->
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <h2 class="fw-bold m-0 d-inline-block me-2 text-dark">穿搭社群</h2>
          <span class="fs-5 text-muted fw-normal">Outfit Community</span>
        </div>
        <div>
          <!-- 修改後：改成 router-link 讓點擊後直接跳轉到發文頁 -->
          <router-link to="/community/create" class="btn btn-dark rounded-pill px-4 py-2 text-white fw-medium shadow-sm text-decoration-none d-inline-block text-center">
            + 分享我的穿搭
          </router-link>
        </div>
      </div>

      <!-- 2. 頁籤與熱門商品標籤膠囊 -->
      <div class="d-flex align-items-center gap-2 mb-4 flex-wrap">
        <div class="btn-group bg-white p-1 rounded-pill border shadow-sm" role="group">
          <button 
            class="btn rounded-pill px-3 px-sm-4 py-1 border-0 fw-medium transition-all" 
            :class="currentTab === 'hot' ? 'btn-dark text-white' : 'text-secondary bg-transparent'"
            @click="currentTab = 'hot'"
          >
            熱門
          </button>
          <button 
            class="btn rounded-pill px-3 px-sm-4 py-1 border-0 fw-medium transition-all" 
            :class="currentTab === 'new' ? 'btn-dark text-white' : 'text-secondary bg-transparent'"
            @click="currentTab = 'new'"
          >
            最新
          </button>
          <button 
            class="btn rounded-pill px-3 px-sm-4 py-1 border-0 fw-medium transition-all" 
            :class="currentTab === 'follow' ? 'btn-dark text-white' : 'text-secondary bg-transparent'"
            @click="currentTab = 'follow'"
          >
            追蹤中
          </button>
        </div>

        <!-- 快速篩選商品 -->
        <div class="d-flex gap-2 flex-wrap ms-0 ms-md-2 mt-2 mt-md-0">
          <span 
            v-for="product in popularProducts.slice(0, 3)" 
            :key="product.id"
            class="badge tag-badge rounded-pill px-3 py-2 border style-tag"
          >
            🏷️ {{ product.name }}
          </span>
        </div>
      </div>

      <!-- 3. 主要內容區 (響應式：電腦多欄 / 手機單欄) -->
      <div class="row g-4">
        
        <!-- 左側：貼文列表區 -->
        <div class="col-12 col-lg-9">
          <div class="row g-4">
            
            <div v-for="post in posts" :key="post.postId" class="col-12 col-sm-6 col-md-4">
              <div class="card h-100 border-0 shadow-sm rounded-3 overflow-hidden post-card bg-white">
                <!-- 貼文圖片：加上 router-link 跳轉 -->
                <router-link :to="`/community/post/${post.postId || 8842}`" class="d-block text-decoration-none">
                  <div class="position-relative bg-light ratio ratio-4x5">
                    <img :src="post.imageUrl" class="card-img-top object-fit-cover" :alt="post.title" />
                  </div>
                </router-link>

                <!-- 貼文內容 -->
                <div class="card-body p-3 d-flex flex-column justify-content-between">
                  <div>
                  <!-- ⭕ 修改後：點擊頭像或名字直接跳去個人主頁 -->
                  <div class="d-flex align-items-center mb-2">
                    <router-link to="/community/profile" class="d-flex align-items-center text-decoration-none">
                      <img 
                       :src="post.user.avatar" 
                       class="rounded-circle me-2 border" 
                       style="width: 28px; height: 28px;"
                       alt="avatar" 
                      />
                      <span class="fw-bold small text-dark text-truncate">{{ post.user.name }}</span>
                   </router-link>
                  </div>

                    <!-- 標題/文字：加上 router-link 跳轉 -->
                    <router-link :to="`/community/post/${post.postId || 8842}`" class="text-decoration-none">
                      <p class="card-text small text-secondary line-clamp-2 mb-3">
                         {{ post.title }}
                      </p>
                    </router-link>
                  </div>

                  <div class="d-flex justify-content-between align-items-center pt-2 border-top text-muted extra-small">
                    <div>
                      <span class="me-2">♥ {{ post.likesCount }}</span>
                      <span>💬 {{ post.commentsCount }}</span>
                    </div>
                    <a href="#" class="text-dark text-decoration-none fw-medium underline-hover">
                      🛍️ 查看單品
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <!-- 載入更多 -->
          <div class="text-center my-4">
            <button class="btn btn-outline-dark rounded-pill px-5 py-2 bg-white shadow-sm text-dark load-more-btn">
              載入更多穿搭 ▾
            </button>
          </div>
        </div>

       <!-- 右側：側邊欄 -->
        <div class="col-12 col-lg-3">
          
          <!-- ⭕ 加上卡片外框，把達人列表包起來 -->
          <div class="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
            <h6 class="fw-bold mb-3 text-dark">✨ 熱門穿搭達人</h6>
            
            <!-- 右側達人列表 -->
            <div 
              v-for="creator in creators" 
              :key="creator.id" 
              class="d-flex align-items-center justify-content-between mb-3"
            >
              <!-- 用 router-link 把頭像跟名字包起來 -->
              <router-link to="/community/profile" class="d-flex align-items-center me-2 text-decoration-none">
                <img :src="creator.avatar" class="rounded-circle me-2 border" style="width: 36px; height: 36px;" />
                <span class="small fw-bold text-dark text-truncate" style="max-width: 90px;">{{ creator.name }}</span>
              </router-link>

              <button 
                class="btn btn-sm rounded-pill px-3 py-1 fw-medium border-0 transition-all"
                :class="creator.isFollowing ? 'btn-secondary text-white' : 'btn-outline-dark'"
                @click="toggleFollow(creator)"
              >
                {{ creator.isFollowing ? '已追蹤' : '追蹤' }}
              </button>
            </div>
          </div>

          <!-- 熱門商品標籤 (原本的卡片保持不變) -->
          <div class="card border-0 shadow-sm rounded-3 p-3 mb-4 bg-white">
            <h6 class="fw-bold mb-3 text-dark">🏷️ 熱門商品標籤</h6>
            <div class="d-flex flex-wrap gap-2">
              <span 
                v-for="product in popularProducts" 
                :key="product.id"
                class="badge tag-badge rounded-pill px-3 py-2 border style-tag"
                style="cursor: pointer;"
              >
                # {{ product.name }}
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 破開 App.vue Flex 限制並套用指定的暖奶油底色 #F9F4F0 */
.community-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw !important;
  min-height: 100vh;
  background-color: #F9F4F0 !important;
  box-sizing: border-box;
  z-index: 10;
}

/* 標籤膠囊 (暖灰/米色調) */
.tag-badge {
  background-color: #EFE8E1 !important;
  color: #4A4744 !important;
  border-color: #E2DED7 !important;
  font-weight: 500;
}

/* 標籤 Hover 效果 */
.style-tag {
  transition: all 0.2s ease;
}
.style-tag:hover {
  background-color: #5C5855 !important;
  color: #FFFFFF !important;
  border-color: #5C5855 !important;
}

/* 卡片與懸浮效果 */
.post-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.08) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.extra-small {
  font-size: 0.75rem;
}

.underline-hover:hover {
  text-decoration: underline !important;
}

.transition-all {
  transition: all 0.2s ease-in-out;
}

/* 載入更多按鈕 Hover 效果：變深灰色背景 + 白字 */
.load-more-btn:hover {
  background-color: #4a4744 !important;
  color: #ffffff !important;
  border-color: #4a4744 !important;
}
</style>