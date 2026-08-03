<script setup>
import { ref } from 'vue'
// 引入暫時導覽列組件
import TempNavbar from '@/components/TempNavbar.vue'

// 使用者個人資料
const userProfile = ref({
  name: 'Emily 艾米莉',
  handle: '@emily_style',
  bioTag: '韓系 | 簡約 | 日常穿搭分享',
  bio: '喜歡分享每天的穿搭靈感 ✨ 點擊看板搭配同款單品，一起變美！',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
  bannerBg: '#EFE8E1', // 暖質感奶茶底色
  postsCount: '1,284',
  followersCount: '58.6K',
  followingCount: '342',
  isFollowing: false
})

// 當前頁籤 (穿搭作品, 收藏, 同款商品, 關於我)
const activeTab = ref('works')

// 穿搭作品列表 (改回帶有 # 的標籤格式)
const userPosts = ref([
  {
    id: 1,
    title: '春日約會穿搭 · 碎花洋裝',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    likes: '2,341',
    comments: '128',
    tags: ['#法式碎花洋裝', '#皮革側背包']
  },
  {
    id: 2,
    title: '秋冬層次感 · 大衣外套',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    likes: '1,876',
    comments: '94',
    tags: ['#羊毛長大衣', '#親膚針織衫']
  },
  {
    id: 3,
    title: '休閒日常 · 針織上衣',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
    likes: '3,102',
    comments: '210',
    tags: ['#V領軟糯針織', '#高腰休閒褲']
  },
  {
    id: 4,
    title: '通勤 OL 風 · 配件搭配',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
    likes: '1,542',
    comments: '76',
    tags: ['#質感西裝外套', '#真皮皮帶']
  }
])

const toggleFollow = () => {
  userProfile.value.isFollowing = !userProfile.value.isFollowing
}
</script>

<template>
  <component is="style">
    @import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
  </component>

  <div class="community-page min-vh-100 w-100">
    <!-- 暫時導覽列 -->
    <TempNavbar />

    <div class="container-fluid container-lg pb-5">
      <div class="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
        
        <!-- 頂部封面橫幅 -->
        <div class="profile-banner w-100" style="height: 140px; background-color: #EFE8E1;"></div>

        <!-- 個人核心資訊區塊 -->
        <div class="px-4 px-md-5 pb-4 position-relative">
          <div class="row align-items-end mb-3">
            
            <!-- 大頭貼 -->
            <div class="col-auto position-relative" style="margin-top: -60px;">
              <div class="avatar-wrapper rounded-circle p-1 bg-white shadow-sm">
                <img 
                  :src="userProfile.avatar" 
                  class="rounded-circle border border-2 border-warm" 
                  style="width: 110px; height: 110px; object-fit: cover;"
                  alt="Avatar"
                />
              </div>
            </div>

            <!-- 右側數據與動作按鈕 -->
            <div class="col d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3 mt-md-0">
              
              <!-- 數據統計 -->
              <div class="d-flex gap-4 gap-md-5 text-center ms-auto ms-md-0 me-md-auto">
                <div>
                  <div class="fw-bold fs-5 text-dark">{{ userProfile.postsCount }}</div>
                  <div class="extra-small text-muted">貼文</div>
                </div>
                <div>
                  <div class="fw-bold fs-5 text-dark">{{ userProfile.followersCount }}</div>
                  <div class="extra-small text-muted">粉絲</div>
                </div>
                <div>
                  <div class="fw-bold fs-5 text-dark">{{ userProfile.followingCount }}</div>
                  <div class="extra-small text-muted">追蹤中</div>
                </div>
              </div>

              <!-- 按鈕區 -->
              <div class="d-flex gap-2">
                <button 
                  class="btn rounded-pill px-4 py-2 fw-medium border-0 transition-all shadow-sm"
                  :class="userProfile.isFollowing ? 'btn-secondary text-white' : 'btn-dark text-white'"
                  @click="toggleFollow"
                >
                  {{ userProfile.isFollowing ? '已追蹤' : '+ 追蹤' }}
                </button>
                <button class="btn btn-outline-dark rounded-pill px-4 py-2 fw-medium shadow-sm">
                  ✉ 訊息
                </button>
              </div>

            </div>
          </div>

          <!-- 使用者姓名與簡介 -->
          <div class="mt-2">
            <h4 class="fw-bold text-dark mb-1">{{ userProfile.name }}</h4>
            <div class="text-muted small mb-2">
              <span class="me-2">{{ userProfile.handle }}</span> · 
              <span class="ms-2 text-dark font-medium">{{ userProfile.bioTag }}</span>
            </div>
            <p class="text-secondary small mb-0 lh-base" style="max-width: 650px;">
              {{ userProfile.bio }}
            </p>
          </div>

          <!-- 頁籤導覽列 -->
          <div class="d-flex gap-4 border-bottom mt-4 pt-2">
            <button 
              class="btn nav-tab-btn pb-2 px-1 fw-bold position-relative text-nowrap"
              :class="activeTab === 'works' ? 'text-dark active' : 'text-muted'"
              @click="activeTab = 'works'"
            >
              穿搭作品
            </button>
            <button 
              class="btn nav-tab-btn pb-2 px-1 fw-bold position-relative text-nowrap"
              :class="activeTab === 'saved' ? 'text-dark active' : 'text-muted'"
              @click="activeTab = 'saved'"
            >
              收藏
            </button>
            <button 
              class="btn nav-tab-btn pb-2 px-1 fw-bold position-relative text-nowrap"
              :class="activeTab === 'products' ? 'text-dark active' : 'text-muted'"
              @click="activeTab = 'products'"
            >
              同款商品
            </button>
            <button 
              class="btn nav-tab-btn pb-2 px-1 fw-bold position-relative text-nowrap"
              :class="activeTab === 'about' ? 'text-dark active' : 'text-muted'"
              @click="activeTab = 'about'"
            >
              關於我
            </button>
          </div>

        </div>
      </div>

      <!-- 下方卡片列表牆 -->
      <div v-if="activeTab === 'works'" class="row g-4">
        <div v-for="post in userPosts" :key="post.id" class="col-12 col-sm-6 col-md-3">
          <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden post-card bg-white">
            
            <!-- 貼文圖片 -->
            <router-link :to="`/community/post/${post.id}`" class="d-block text-decoration-none">
              <div class="position-relative bg-light ratio ratio-4x5 overflow-hidden">
                <img :src="post.image" class="card-img-top object-fit-cover hover-scale" :alt="post.title" />
              </div>
            </router-link>

            <!-- 內容描述與數據 -->
            <div class="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <router-link :to="`/community/post/${post.id}`" class="text-decoration-none">
                  <h6 class="card-title fw-bold text-dark fs-7 mb-2 line-clamp-1 hover-dark">
                    {{ post.title }}
                  </h6>
                </router-link>
                
                <!-- 數據 -->
                <div class="d-flex gap-3 text-muted extra-small mb-2">
                  <span>♥ {{ post.likes }}</span>
                  <span>💬 {{ post.comments }}</span>
                  <router-link :to="`/community/post/${post.id}`" class="text-muted text-decoration-none ms-auto">
                    🛍️ 查看同款
                  </router-link>
                </div>
              </div>

              <!-- 標籤列表 (帶有 # 字號的膠囊按鈕) -->
              <div class="d-flex flex-wrap gap-1 mt-1">
                <span v-for="tag in post.tags" :key="tag" class="tag-pill extra-small px-2 py-1 rounded-pill">
                  {{ tag }}
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>

      <!-- 其它頁籤未開啟時的預設狀態 -->
      <div v-else class="card border-0 shadow-sm rounded-4 p-5 text-center text-muted bg-white">
        <div class="fs-1 mb-2">📁</div>
        <div>該區塊內容載入中...</div>
      </div>

    </div>
  </div>
</template>

<style scoped>
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

.border-warm {
  border-color: #4A4744 !important;
}

.nav-tab-btn {
  border: none;
  background: transparent;
  transition: color 0.2s ease;
}
.nav-tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #4A4744;
  border-radius: 2px;
}

/* 暖米色軟調標籤樣式 */
.tag-pill {
  background-color: #F4EFEA;
  color: #6C6661;
}

.fs-7 {
  font-size: 0.9rem;
}

.extra-small {
  font-size: 0.78rem;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hover-dark:hover {
  color: #000000 !important;
}

.hover-scale {
  transition: transform 0.3s ease;
}
.post-card:hover .hover-scale {
  transform: scale(1.05);
}

.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>