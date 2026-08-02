<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 引入共用的暫時導覽列
import TempNavbar from '@/components/TempNavbar.vue'

const router = useRouter()

// 表單雙向綁定資料
const postForm = ref({
  title: '',
  imageUrl: '',
  selectedProduct: ''
})

// 模擬商城可標記的熱門單品
const availableProducts = ref([
  { id: 1, name: '經典圓領短T' },
  { id: 2, name: '法式碎花洋裝' },
  { id: 3, name: '羊毛混紡針織外套' },
  { id: 4, name: '修身牛仔褲' },
  { id: 5, name: '百褶及膝裙' }
])

// 模擬送出發文
const handleSubmit = () => {
  if (!postForm.value.title || !postForm.value.imageUrl) {
    alert('請填寫貼文標題並提供圖片連結！')
    return
  }
  
  // 這裡之後可以串接 API，目前先跳回社群動態牆
  alert('發文成功！即將返回社群首頁。')
  router.push('/community')
}
</script>

<template>
  <!-- 引入 Bootstrap CSS -->
  <component is="style">
    @import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
  </component>

  <div class="create-post-page min-vh-100 w-100">
    <!-- 頂部導覽列 -->
    <TempNavbar />

    <div class="container container-md py-4">
      
      <!-- 返回按鈕與標題 -->
      <div class="d-flex align-items-center mb-4">
        <router-link to="/community" class="btn btn-outline-dark rounded-pill px-3 py-1 btn-sm me-3">
          ← 返回社群
        </router-link>
        <h3 class="fw-bold m-0 text-dark">分享你的穿搭心得</h3>
      </div>

      <!-- 發文表單主卡片 -->
      <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
        <form @submit.prevent="handleSubmit">
          
          <!-- 1. 圖片網址輸入與預覽 -->
          <div class="mb-4">
            <label class="form-label fw-bold text-dark">📸 穿搭照片連結 (Image URL)</label>
            <input 
              type="text" 
              class="form-control rounded-pill px-3 py-2" 
              v-model="postForm.imageUrl" 
              placeholder="請輸入圖片網址 (例如: https://picsum.photos/400/500)"
            />
            <!-- 圖片即時預覽框 -->
            <div v-if="postForm.imageUrl" class="mt-3 text-center bg-light rounded-3 p-2 border" style="max-height: 250px; overflow: hidden;">
              <img :src="postForm.imageUrl" class="img-fluid rounded object-fit-contain" style="max-height: 230px;" alt="預覽圖" />
            </div>
          </div>

          <!-- 2. 貼文標題/心得 -->
          <div class="mb-4">
            <label class="form-label fw-bold text-dark">✍️ 穿搭心得與介紹</label>
            <textarea 
              class="form-control rounded-3 p-3" 
              rows="4" 
              v-model="postForm.title" 
              placeholder="分享一下今天這套穿搭的靈感、單品材質或搭配技巧吧..."
            ></textarea>
          </div>

          <!-- 3. 標記商城單品 -->
          <div class="mb-4">
            <label class="form-label fw-bold text-dark">🛍️ 標記搭配商品 (選填)</label>
            <select class="form-select rounded-pill px-3 py-2" v-model="postForm.selectedProduct">
              <option disabled value="">請選擇您使用的商城單品</option>
              <option v-for="product in availableProducts" :key="product.id" :value="product.name">
                {{ product.name }}
              </option>
            </select>
          </div>

          <!-- 4. 送出按鈕 -->
          <div class="d-grid gap-2 d-md-flex justify-content-md-end pt-3 border-top">
            <router-link to="/community" class="btn btn-light rounded-pill px-4 py-2 text-secondary">
              取消
            </router-link>
            <button type="submit" class="btn btn-dark rounded-pill px-5 py-2 text-white fw-medium shadow-sm">
              確認發布
            </button>
          </div>

        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 破開全版限制，套用暖奶油背景 */
.create-post-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw !important;
  min-height: 100vh;
  background-color: #F9F4F0 !important;
  box-sizing: border-box;
  z-index: 10;
}
</style>