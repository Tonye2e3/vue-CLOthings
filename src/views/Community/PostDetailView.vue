<script setup>
import { ref } from 'vue'
// 引入暫時導覽列組件
import TempNavbar from '@/components/TempNavbar.vue'

// 使用 import 引入本地 src/assets 下的圖片
import postImage from '@/assets/Postimage/post2.jpg'

// 貼文詳細資料
const post = ref({
  id: 8842,
  user: {
    name: 'Emily_穿搭日記',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    time: '2 小時前',
    location: '台北'
  },
  isFollowing: false,
  // 指向剛才 import 的本地圖片變數
  imageUrl: postImage,
  content: '今天走簡約韓系風格 🤍 這套針織上衣與打褶寬褲質感超好，版型顯瘦又舒服，很適合秋天約會或上班～ 全身都可以直接點連結購買！',
  likesCount: '1,248',
  commentsCount: 86,
  isLiked: false,
  isSaved: false,
  taggedProducts: [
    { id: 101, name: '針織上衣', x: '45%', y: '35%' },
    { id: 102, name: '高腰寬褲', x: '50%', y: '70%' },
    { id: 103, name: '托特包', x: '30%', y: '90%' }
  ]
})

// 這套穿搭的商品清單
const products = ref([
  { id: 101, name: '奶油白V領針織上衣', price: '690', image: 'https://i.pinimg.com/1200x/dc/94/75/dc9475c6d350370bcf6c471e3ee6d6fb.jpg' },
  { id: 102, name: '高腰垂墜寬褲 (卡其)', price: '890', image: 'https://i.pinimg.com/1200x/f3/dd/f4/f3ddf4c34ff005240958bddb9a8080d0.jpg' },
  { id: 103, 
  name: '復古麻編單肩托特包', 
  price: '680', 
  image: 'https://i.pinimg.com/736x/f2/cf/7b/f2cf7b273ca7445dce8800f855051f93.jpg' }
])

// 相似穿搭推薦
const similarPosts = ref([
  { id: 1, image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { id: 2, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=80' },
  { id: 3, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80' }
])

// 留言列表
const comments = ref([
  { id: 1, user: '小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=May', text: '這套超好看！請問褲子是什麼顏色？' },
  { id: 2, user: '阿哲', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jerry', text: '已收藏！等發薪就下單 🤩' }
])

const newComment = ref('')

const toggleFollow = () => {
  post.value.isFollowing = !post.value.isFollowing
}

const addComment = () => {
  if (!newComment.value.trim()) return
  comments.value.push({
    id: Date.now(),
    user: '我',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
    text: newComment.value
  })
  newComment.value = ''
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
      <div class="row g-4">
        
        <!-- 左側：貼文主體區 (大圖、內文、互動、留言) -->
        <div class="col-12 col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
            
            <!-- 發文者資訊列 -->
            <div class="d-flex justify-content-between align-items-center mb-3">
              <div class="d-flex align-items-center">
                <img :src="post.user.avatar" class="rounded-circle me-3 border" style="width: 48px; height: 48px;" alt="avatar" />
                <div>
                  <h6 class="fw-bold mb-0 text-dark">{{ post.user.name }}</h6>
                  <small class="text-muted">{{ post.user.time }} · {{ post.user.location }}</small>
                </div>
              </div>
              <button 
                class="btn btn-sm rounded-pill px-3 py-1 fw-medium border-0 transition-all"
                :class="post.isFollowing ? 'btn-secondary text-white' : 'btn-dark text-white'"
                @click="toggleFollow"
              >
                {{ post.isFollowing ? '已追蹤' : '+ 追蹤' }}
              </button>
            </div>

            <!-- 主圖 (附帶商品標籤) -->
            <div class="position-relative bg-light rounded-3 overflow-hidden mb-3">
             <img :src="post.imageUrl" class="w-100 object-fit-contain bg-white" style="height: 550px;" alt="post image" />
              
              <!-- 模擬相片上的商品標籤 -->
              <span 
                v-for="tag in post.taggedProducts" 
                :key="tag.id"
                class="position-absolute badge tag-badge shadow-sm rounded-pill px-3 py-2"
                :style="{ top: tag.y, left: tag.x }"
              >
                🏷️ {{ tag.name }}
              </span>
            </div>

            <!-- 按讚/分享/收藏 動作列 -->
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom mb-3 text-secondary">
              <div class="d-flex gap-4">
                <button class="btn btn-link text-decoration-none p-0 text-secondary hover-dark" @click="post.isLiked = !post.isLiked">
                  <span :class="{ 'text-danger': post.isLiked }">♥</span> {{ post.likesCount }}
                </button>
                <button class="btn btn-link text-decoration-none p-0 text-secondary hover-dark">
                  💬 {{ post.commentsCount }}
                </button>
                <button class="btn btn-link text-decoration-none p-0 text-secondary hover-dark">
                  ↗ 分享
                </button>
              </div>
              <button class="btn btn-link text-decoration-none p-0 text-secondary hover-dark" @click="post.isSaved = !post.isSaved">
                <span :class="{ 'text-warning': post.isSaved }">📌</span> 收藏
              </button>
            </div>

            <!-- 貼文文字描述 -->
            <p class="text-dark lh-base mb-4">
              {{ post.content }}
            </p>

            <!-- 留言區塊 -->
            <div class="bg-light p-3 rounded-3">
              <div class="comments-list mb-3 d-flex flex-column gap-2">
                <div v-for="c in comments" :key="c.id" class="d-flex align-items-start gap-2">
                  <img :src="c.avatar" class="rounded-circle border" style="width: 28px; height: 28px;" />
                  <div class="bg-white p-2 px-3 rounded-3 shadow-sm border text-dark fs-7 w-100">
                    <span class="fw-bold me-2">{{ c.user }}:</span>
                    <span>{{ c.text }}</span>
                  </div>
                </div>
              </div>

              <!-- 輸入留言 -->
              <div class="d-flex gap-2">
                <input 
                  type="text" 
                  v-model="newComment" 
                  class="form-control rounded-pill border-0 shadow-sm px-3" 
                  placeholder="留言..." 
                  @keyup.enter="addComment"
                />
                <button class="btn btn-dark rounded-pill px-4 text-white text-nowrap" @click="addComment">
                  送出
                </button>
              </div>
            </div>

          </div>
        </div>

        <!-- 右側：這套穿搭的商品與推薦區 -->
        <div class="col-12 col-lg-4">
          
          <!-- 穿搭商品清單 -->
          <div class="card border-0 shadow-sm rounded-4 p-3 p-md-4 mb-4 bg-white">
            <h6 class="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              🛍️ 這套穿搭的商品
            </h6>
            
            <div class="d-flex flex-column gap-3 mb-3">
              <div 
                v-for="item in products" 
                :key="item.id" 
                class="p-2 rounded-3 bg-light d-flex align-items-center justify-content-between gap-2"
              >
                <img :src="item.image" class="rounded-2 object-fit-cover" style="width: 60px; height: 60px;" />
                <div class="flex-grow-1 min-w-0">
                  <p class="fw-bold text-dark small mb-1 text-truncate">{{ item.name }}</p>
                  <p class="text-muted small mb-0">NT$ {{ item.price }}</p>
                </div>
                <button class="btn btn-dark btn-sm rounded-pill text-nowrap px-3 py-1">
                  加入購物車
                </button>
              </div>
            </div>

            <!-- 一鍵購買按鈕 -->
            <button class="btn btn-dark rounded-pill w-100 py-2 fw-medium shadow-sm">
              🛒 一鍵購買全套穿搭 · NT$ 2,860
            </button>
          </div>

          <!-- 相似穿搭推薦 -->
          <div class="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white">
            <h6 class="fw-bold mb-3 text-dark">✨ 相似穿搭推薦</h6>
            <div class="row g-2">
              <div v-for="sim in similarPosts" :key="sim.id" class="col-4">
                <div class="ratio ratio-3x4 rounded-3 overflow-hidden bg-light hover-scale">
                  <img :src="sim.image" class="object-fit-cover w-100 h-100" />
                </div>
              </div>
            </div>
          </div>

        </div>

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

.tag-badge {
  background-color: #EFE8E1 !important;
  color: #4A4744 !important;
  border: 1px solid #E2DED7 !important;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tag-badge:hover {
  background-color: #5C5855 !important;
  color: #FFFFFF !important;
}

.fs-7 {
  font-size: 0.875rem;
}

.hover-dark:hover {
  color: #212529 !important;
}

.hover-scale {
  transition: transform 0.2s ease;
  cursor: pointer;
}
.hover-scale:hover {
  transform: scale(1.03);
}

.transition-all {
  transition: all 0.2s ease-in-out;
}
</style>