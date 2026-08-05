<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
// // 引入共用的暫時導覽列
// import TempNavbar from '@/components/TempNavbar.vue'

const router = useRouter()

// 表單雙向綁定資料
const postForm = ref({
  title: '',
  selectedProduct: ''
})

// 圖片檔案與預覽用的 URL
const imageFile = ref(null)
const imagePreviewUrl = ref('')

// 模擬商城可標記的熱門單品
const availableProducts = ref([
  { id: 1, name: '經典圓領短T' },
  { id: 2, name: '法式碎花洋裝' },
  { id: 3, name: '羊毛混紡針織外套' },
  { id: 4, name: '修身牛仔褲' },
  { id: 5, name: '百褶及膝裙' }
])

// 搜尋標籤商品
const productSearch = ref('')
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return availableProducts.value
  return availableProducts.value.filter(p => p.name.toLowerCase().includes(q))
})

// 處理檔案選取與即時預覽
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    imageFile.value = file
    // 利用 URL.createObjectURL 產生本地端預覽網址
    imagePreviewUrl.value = URL.createObjectURL(file)
  }
}

// 移除已選圖片，回到上傳區
const clearImage = () => {
  imageFile.value = null
  imagePreviewUrl.value = ''
}

// 從搜尋結果點選商品標籤
const selectProduct = (name) => {
  postForm.value.selectedProduct = name
}

/// 模擬送出發文
const handleSubmit = () => {
  if (!imageFile.value || !postForm.value.title) {
    alert('請上傳穿搭照片並填寫貼文心得！')
    return
  }

  // 這裡之後可以串接 API，目前先跳回社群動態牆
  alert('發文成功！即將返回社群首頁。')
  router.push('/community')
}
</script>

<template>
  <!-- 引入 Bootstrap CSS + 字體 -->
  <component is="style">
    @import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&amp;family=Noto+Sans+TC:wght@400;500;600;700&amp;display=swap');
  </component>

  <div class="create-post-page min-vh-100 w-100">
    <!-- 頂部導覽列
    <TempNavbar /> -->

    <div class="container container-md py-4">

      <!-- 返回與頁首 -->
      <div class="page-head">
        <router-link to="/community" class="back-pill">← 返回社群</router-link>
        <div class="eyebrow">New Entry · 寫下今天的穿著</div>
        <h1 class="page-title">
          分享你的穿搭心得
          <svg viewBox="0 0 300 14" preserveAspectRatio="none">
            <path d="M2 8 C 46 2, 92 12, 138 6 S 230 2, 298 8" fill="none" stroke="#B8862E" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </h1>
        <p class="page-sub">用一張照片、幾句話，紀錄今天想成為的樣子</p>
      </div>

      <!-- 發文表單主卡片：左圖右文，呼應社群頁的封面故事卡 -->
      <div class="compose-card">
        <form @submit.prevent="handleSubmit">
          <div class="compose-grid">

            <!-- 左側：上傳／預覽 -->
            <div class="compose-media">
              <span class="tag-label">封面預覽</span>

              <label class="dropzone" :class="{ 'has-image': imagePreviewUrl }">
                <input
                  type="file"
                  class="file-input-hidden"
                  accept="image/*"
                  @change="handleFileChange"
                />

                <div v-if="!imagePreviewUrl" class="dropzone-empty">
                  <span class="dz-icon">📷</span>
                  <span class="dz-title">點擊上傳穿搭照片</span>
                  <span class="dz-sub">建議直式構圖，光線自然最好看</span>
                </div>

                <img v-else :src="imagePreviewUrl" alt="上傳預覽" class="dropzone-preview" />

                <div v-if="imagePreviewUrl" class="dropzone-hover">更換照片</div>
              </label>

              <button
                v-if="imagePreviewUrl"
                type="button"
                class="btn-remove"
                @click="clearImage"
              >✕ 移除照片</button>
            </div>

            <!-- 右側：文字內容 -->
            <div class="compose-body">

              <div class="field-block">
                <label class="field-label">✍️ 穿搭心得與介紹</label>
                <textarea
                  class="field-textarea"
                  rows="6"
                  v-model="postForm.title"
                  placeholder="分享一下今天這套穿搭的靈感、單品材質或搭配技巧吧..."
                ></textarea>
              </div>

              <div class="field-block">
                <label class="field-label">🔍 搜尋標籤商品</label>
                <div class="search-bar">
                  <svg class="search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.6"/>
                    <path d="M14 14L18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <input
                    type="text"
                    v-model="productSearch"
                    class="search-input"
                    placeholder="輸入商品名稱搜尋，例如：牛仔褲"
                  />
                  <button
                    v-if="productSearch"
                    type="button"
                    class="search-clear"
                    @click="productSearch = ''"
                  >✕</button>
                </div>

                <div class="tag-cloud">
                  <button
                    v-for="product in filteredProducts"
                    :key="product.id"
                    type="button"
                    class="tag-chip selectable"
                    :class="{ active: postForm.selectedProduct === product.name }"
                    @click="selectProduct(product.name)"
                  >#{{ product.name }}</button>

                  <span v-if="filteredProducts.length === 0" class="tag-empty">
                    找不到符合「{{ productSearch }}」的商品
                  </span>
                </div>
              </div>

              <div class="field-block">
                <label class="field-label">🏷️ 標記搭配商品（選填）</label>
                <select class="field-select" v-model="postForm.selectedProduct">
                  <option disabled value="">請選擇您使用的商城單品</option>
                  <option v-for="product in availableProducts" :key="product.id" :value="product.name">
                    {{ product.name }}
                  </option>
                </select>
                <div class="tag-preview" v-if="postForm.selectedProduct">
                  <span class="tag-chip">#{{ postForm.selectedProduct }}</span>
                </div>
              </div>

              <div class="compose-actions">
                <router-link to="/community" class="btn-cancel">取消</router-link>
                <button type="submit" class="btn-publish">確認發布</button>
              </div>

            </div>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
.create-post-page {
  width: 100%;
  min-height: 100vh;
  background-color: #F9F4F0 !important;
  box-sizing: border-box;
  --cream:#F9F4F0;
  --paper:#FFFDFB;
  --ink:#2A2420;
  --ink-soft:#7A6E63;
  --plum:#7A4B54;
  --plum-deep:#5E3941;
  --ochre:#B8862E;
  --hairline:#E4D8CC;
  color: var(--ink);
  font-family: 'Noto Sans TC', sans-serif;
}

/* ---------- 頁首 ---------- */
.page-head{ padding:2rem 0 1.4rem; }
.back-pill{
  display:inline-flex; align-items:center; gap:.3rem;
  border:1px solid var(--ink); border-radius:999px;
  padding:.35rem 1rem; font-size:.82rem; color:var(--ink);
  text-decoration:none; margin-bottom:1.1rem;
  transition:all .18s ease;
}
.back-pill:hover{ background:var(--ink); color:var(--cream); }

.eyebrow{
  font-size:.78rem; letter-spacing:.28em; text-transform:uppercase;
  color:var(--ochre); font-weight:700; margin-bottom:.6rem;
}
.page-title{
  font-family:'Noto Serif TC', serif;
  font-weight:900;
  font-size:clamp(1.7rem, 4vw, 2.4rem);
  line-height:1.15;
  margin:0;
  color:var(--ink);
}
.page-title svg{ display:block; width:240px; max-width:70%; height:14px; margin-top:4px; }
.page-sub{
  font-family:'Noto Serif TC', serif;
  font-style:italic;
  color:var(--ink-soft);
  font-size:.98rem;
  margin:.6rem 0 0;
}

/* ---------- 主卡片 ---------- */
.compose-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:22px;
  overflow:hidden;
}
.compose-grid{
  display:grid;
  grid-template-columns:1fr 1.1fr;
}

/* ---------- 左：上傳區 ---------- */
.compose-media{ position:relative; background:var(--cream); padding:1.6rem; display:flex; flex-direction:column; }
.compose-media .tag-label{
  position:absolute; top:16px; left:1rem; z-index:2;
  background:var(--plum); color:#fff;
  font-size:.72rem; letter-spacing:.05em; font-weight:600;
  padding:.32rem .8rem .32rem 1.1rem;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}
.compose-media .tag-label::after{
  content:""; position:absolute; left:0; bottom:-7px;
  border-width:0 8px 7px 0; border-style:solid;
  border-color:transparent var(--plum-deep) transparent transparent;
}

.dropzone{
  position:relative;
  flex:1;
  min-height:360px;
  border:1.5px dashed var(--hairline);
  background:var(--paper);
  border-radius:4px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer;
  overflow:hidden;
  transition:border-color .2s ease, background .2s ease;
}
.dropzone:hover{ border-color:var(--plum); }
.dropzone.has-image{ border-style:solid; }

.file-input-hidden{
  position:absolute; inset:0;
  opacity:0; cursor:pointer;
}

.dropzone-empty{
  display:flex; flex-direction:column; align-items:center; gap:.4rem;
  color:var(--ink-soft); padding:2rem; text-align:center;
}
.dz-icon{ font-size:2rem; margin-bottom:.3rem; }
.dz-title{ font-family:'Noto Serif TC', serif; font-weight:700; color:var(--ink); font-size:1rem; }
.dz-sub{ font-size:.78rem; }

.dropzone-preview{
  width:100%; height:100%; min-height:360px;
  object-fit:cover; display:block;
}
.dropzone-hover{
  position:absolute; inset:0;
  background:rgba(42,36,32,.45);
  color:#fff; font-size:.9rem; font-weight:600;
  display:flex; align-items:center; justify-content:center;
  opacity:0; transition:opacity .2s ease;
  pointer-events:none;
}
.dropzone.has-image:hover .dropzone-hover{ opacity:1; }

.btn-remove{
  align-self:flex-start;
  margin-top:.9rem;
  background:none; border:none;
  font-size:.8rem; color:var(--ink-soft);
  text-decoration:underline;
  padding:0;
}
.btn-remove:hover{ color:var(--plum); }

/* ---------- 右：表單 ---------- */
.compose-body{ padding:2rem 2rem 1.8rem; display:flex; flex-direction:column; }
.field-block{ margin-bottom:1.6rem; }
.field-label{
  display:block;
  font-family:'Noto Serif TC', serif;
  font-weight:700; font-size:.95rem;
  color:var(--ink); margin-bottom:.6rem;
}
.field-textarea{
  width:100%;
  border:1px solid var(--hairline);
  background:var(--cream);
  border-radius:4px;
  padding:.9rem 1rem;
  font-family:'Noto Sans TC', sans-serif;
  font-size:.92rem;
  color:var(--ink);
  resize:vertical;
  transition:border-color .18s ease, background .18s ease;
}
.field-textarea:focus{
  outline:none; border-color:var(--plum); background:var(--paper);
}
.field-textarea::placeholder{ color:var(--ink-soft); }

.field-select{
  width:100%;
  border:1px solid var(--hairline);
  background:var(--cream);
  border-radius:4px;
  padding:.65rem 1.1rem;
  font-size:.9rem;
  color:var(--ink);
  transition:border-color .18s ease, background .18s ease;
}
.field-select:focus{ outline:none; border-color:var(--plum); background:var(--paper); }

.tag-preview{ margin-top:.7rem; }
.tag-chip{
  display:inline-block;
  font-size:.78rem; padding:.4rem .9rem; border-radius:999px;
  background:var(--cream); border:1px solid var(--ochre); color:var(--ochre);
  font-weight:600;
}

/* ---------- 搜尋標籤商品 ---------- */
.search-bar{
  position:relative;
  display:flex; align-items:center;
  border:1px solid var(--hairline);
  background:var(--cream);
  border-radius:4px;
  padding:.5rem .5rem .5rem 1rem;
  transition:border-color .18s ease, background .18s ease;
}
.search-bar:focus-within{ border-color:var(--plum); background:var(--paper); }
.search-icon{ width:16px; height:16px; color:var(--ink-soft); flex-shrink:0; }
.search-input{
  flex:1; border:none; background:transparent;
  padding:.15rem .6rem; font-size:.88rem; color:var(--ink);
  outline:none;
}
.search-input::placeholder{ color:var(--ink-soft); }
.search-clear{
  border:none; background:var(--hairline); color:var(--ink-soft);
  width:20px; height:20px; border-radius:50%;
  font-size:.7rem; line-height:1; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  transition:background .18s ease, color .18s ease;
}
.search-clear:hover{ background:var(--plum); color:#fff; }

.tag-cloud{
  display:flex; flex-wrap:wrap; gap:.5rem;
  margin-top:.8rem;
}
.tag-chip.selectable{
  border:1px solid var(--hairline);
  background:var(--paper);
  color:var(--ink);
  cursor:pointer;
  transition:all .18s ease;
}
.tag-chip.selectable:hover{ border-color:var(--ochre); color:var(--ochre); }
.tag-chip.selectable.active{
  background:var(--plum); border-color:var(--plum); color:#fff;
}
.tag-empty{
  font-size:.8rem; color:var(--ink-soft);
  font-family:'Noto Serif TC', serif; font-style:italic;
}

.compose-actions{
  margin-top:auto;
  padding-top:1.4rem;
  border-top:1px dashed var(--hairline);
  display:flex; justify-content:flex-end; gap:.8rem;
}
.btn-cancel{
  border:1px solid var(--hairline);
  color:var(--ink-soft);
  border-radius:4px;
  padding:.6rem 1.6rem;
  font-size:.88rem;
  text-decoration:none;
  transition:all .18s ease;
}
.btn-cancel:hover{ border-color:var(--ink); color:var(--ink); }
.btn-publish{
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.65rem 2.1rem; font-size:.9rem; font-weight:600;
  transition:background .18s ease, transform .18s ease;
}
.btn-publish:hover{ background:var(--plum-deep); transform:translateY(-1px); }

@media (max-width: 860px){
  .compose-grid{ grid-template-columns:1fr; }
  .compose-media{ padding:1.2rem; }
  .dropzone, .dropzone-preview{ min-height:280px; }
  .compose-body{ padding:1.6rem; }
}
</style>