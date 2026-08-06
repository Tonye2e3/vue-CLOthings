<script setup>
import { ref, computed } from 'vue'
// useRouter：Vue Router 提供的功能，讓我們可以在 <script> 裡面「用程式的方式」
// 切換網址（例如發文成功後自動跳轉回社群頁），而不是只能靠使用者自己點連結。
import { useRouter } from 'vue-router'


// 全站共用的貼文清單（跟 CommunityView.vue 共用同一份資料，直接 import 那個檔案）
// 這裡 import 進來的 addPost、currentUser，就是 CommunityView.vue 裡面
// 用 export 開放出來的那兩個東西（可以回去那個檔案最上面看說明）。
// 因為兩邊抓到的是「同一份」資料，所以只要在這裡呼叫 addPost() 新增一篇貼文，
// 回到 CommunityView.vue 的畫面上就會馬上看得到，不需要重新整理頁面、也不需要資料庫。
import { addPost, currentUser } from '@/views/Community/CommunityView.vue'

// useRouter() 執行後會拿到一個「路由控制器」物件，
// 之後想切換頁面，就呼叫 router.push('網址') 就可以了。
const router = useRouter()

// 表單雙向綁定資料
// 這個物件會透過 v-model 直接跟畫面上的輸入框「雙向同步」
// （使用者打字，這裡的值自動更新；這裡的值變了，輸入框顯示也會變）。
const postForm = ref({
  title: '', // 使用者輸入的穿搭心得文字
  selectedProducts: [] // 改為陣列，支援複選；存放使用者勾選的商品標籤名稱
})

// 圖片檔案與預覽用的 URL（改為陣列，支援多張照片）
// 陣列裡每一筆長這樣：{ file, url }
// file：使用者選取的原始檔案（瀏覽器的 File 物件，包含檔名、大小等資訊）
// url：給 <img> 標籤顯示用的「本地暫時預覽網址」（不是真的上傳到網路上的網址）
const imageFiles = ref([])

// 模擬商城可標記的熱門單品
const availableProducts = ref([
  { id: 1, name: '經典圓領短T' },
  { id: 2, name: '法式碎花洋裝' },
  { id: 3, name: '羊毛混紡針織外套' },
  { id: 4, name: '修身牛仔褲' },
  { id: 5, name: '百褶及膝裙' }
])

// 搜尋標籤商品
// productSearch：使用者在「標記標籤商品」那個搜尋框打的文字。
const productSearch = ref('')
// filteredProducts：一個 computed，根據 productSearch 目前的內容，
// 從 availableProducts 裡篩選出符合的商品，畫面上的標籤雲會顯示這個篩選後的結果。
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return availableProducts.value
  return availableProducts.value.filter(p => p.name.toLowerCase().includes(q))
})

// 處理檔案選取與即時預覽（可一次選多張，也可分次加選）
// handleFileChange：當使用者透過檔案選擇視窗選好照片、按下「開啟」之後，
// 瀏覽器會自動呼叫這個函式，並且傳進一個 event（事件）物件，
// 裡面裝著使用者剛剛選了哪些檔案的資訊。
const handleFileChange = (event) => {
  // event.target.files：使用者這次選取的所有檔案（瀏覽器提供的一種特殊清單格式，不是真的陣列）。
  // Array.from(...)：把它轉換成「真正的 JavaScript 陣列」，這樣才能用 .forEach 這種陣列方法。
  // || []：如果 event.target.files 是空的（沒有選檔案），就改用空陣列，避免出錯。
  const files = Array.from(event.target.files || [])
  // .forEach(file => { ... })：把剛剛選的每一個檔案都跑一次下面這段程式碼。
  files.forEach(file => {
    imageFiles.value.push({
      file,
      // URL.createObjectURL(file)：瀏覽器內建的功能，可以幫一個「還沒上傳到網路」的
      // 本地檔案，產生一個暫時的網址，讓 <img> 標籤可以直接拿來預覽，
      // 但這個網址只在「現在這個分頁」有效，重新整理頁面就會失效。
      url: URL.createObjectURL(file)
    })
  })
  // 清空 input 的值，避免選同一張圖片時不觸發 change
  // 如果不清空，使用者選過一次某張圖片後，下次再選「同一張」，
  // 瀏覽器會覺得「值沒有改變」，就不會再次呼叫這個函式了。
  event.target.value = ''
}

// 移除單一張已選圖片
// index：要移除的是陣列裡的第幾筆（從 0 開始算）。
// splice(index, 1)：陣列內建方法，意思是「從 index 這個位置開始，刪除 1 筆資料」。
const removeImage = (index) => {
  imageFiles.value.splice(index, 1)
}

// 點選商品標籤：已選就取消，未選就加入（複選）
const toggleProduct = (name) => {
  const list = postForm.value.selectedProducts
  // indexOf(name)：在陣列裡找 name 這個值「排在第幾個」，如果找不到會回傳 -1。
  const idx = list.indexOf(name)
  if (idx === -1) {
    // 找不到，代表目前還沒選這個標籤 → 加進去
    list.push(name)
  } else {
    // 找得到，代表已經選過了 → 從陣列裡移除（取消勾選）
    list.splice(idx, 1)
  }
}

/// 送出發文：組出貼文資料，加進全站共用的貼文清單
// handleSubmit：使用者按下「確認發布」按鈕時，會執行這個函式。
const handleSubmit = () => {
  // 檢查：如果一張照片都沒選、或是心得文字是空的，就跳出提示視窗、不繼續往下執行。
  if (imageFiles.value.length === 0 || !postForm.value.title) {
    alert('請上傳穿搭照片並填寫貼文心得！')
    return // return 在這裡的作用是「提早結束這個函式」，後面的程式碼都不會被執行。
  }

  // 呼叫從 CommunityView.vue 拿來的 addPost 函式，
  // 把使用者剛剛填寫的內容，組成跟 CommunityView.vue 裡 posts 陣列
  // 一樣格式的物件，塞進那份共用的貼文清單。
  addPost({
    postId: Date.now(), // Date.now() 會回傳「現在的時間」轉成一個數字，拿來當作這篇貼文的唯一編號很方便
    user: { name: currentUser.name, avatar: currentUser.avatar }, // 發文者資訊，來自剛剛 import 的 currentUser
    // 目前表單只有一個文字欄位，標題／內文先共用同一段文字
    title: postForm.value.title,
    desc: postForm.value.title,
    // 用第一張照片當封面圖（本地預覽網址，僅在目前分頁有效）
    imageUrl: imageFiles.value[0].url,
    publishedAt: new Date().toISOString(), // 用「現在」當作發布時間
    likesCount: '0',
    commentsCount: 0,
    // .map(name => ({ name }))：把選中的商品名稱陣列（字串陣列），
    // 轉換成一個「物件陣列」，每個物件長得像 { name: '經典圓領短T' } 這樣，
    // 這樣格式才會跟 CommunityView.vue 裡其他貼文的 taggedProducts 一致。
    taggedProducts: postForm.value.selectedProducts.map(name => ({ name }))
  })

  // 這裡之後可以串接真正的 API 上傳，目前先跳回社群動態牆
  alert('發文成功！即將返回社群首頁。')
  router.push('/community') // 呼叫路由控制器，把畫面切換到 /community 這個網址
}
</script>

<template>
  

  <div class="create-post-page min-vh-100 w-100">
    

    <div class="container container-md py-4">

      <!-- 返回與頁首：韓風簡約版 — 左側細直線引導，字體維持原本的 Noto Serif TC -->
      <div class="page-head">
        <router-link to="/community" class="back-pill">← 返回社群</router-link>
        <div class="page-head-inner">
          <div class="page-head-divider"></div>
          <div class="page-head-text">
            <div class="eyebrow">New Entry · 寫下今天的穿著</div>
            <h1 class="page-title">分享你的穿搭心得</h1>
            <p class="page-sub">用一張照片、幾句話，紀錄今天想成為的樣子</p>
          </div>
        </div>
      </div>

      <!-- 發文表單主卡片：左圖右文，呼應社群頁的封面故事卡 -->
      <div class="compose-card">
        <!--
          @submit.prevent="handleSubmit"：
          @submit 是監聽「表單送出」這個事件（通常是按下 type="submit" 的按鈕觸發）。
          .prevent 是 Vue 的「修飾符」，作用是「阻止瀏覽器預設的送出行為」，
          因為表單原本預設送出時會「整頁重新整理」，我們不想要這樣，
          只想單純執行 handleSubmit 這個函式，所以加了 .prevent。
        -->
        <form @submit.prevent="handleSubmit">
          <div class="compose-grid">

            <!-- 左側：上傳／預覽 -->
            <div class="compose-media">
              <span class="tag-label">封面預覽</span>

              <!--
                這裡是「隱藏原生檔案輸入框、自己畫一個好看的上傳區」的常見技巧：
                <label> 包住 <input type="file">，因為 HTML 規則是
                「點擊 label，等於點擊它裡面包住的 input」，
                所以使用者點這一整塊卡通感的區域，實際上就是在觸發檔案選擇視窗，
                我們再用 CSS 把真正的 input 藏起來（opacity:0），只讓 label 的外觀顯示出來。

                :class="{ 'has-image': imageFiles.length }"：
                如果 imageFiles 陣列裡已經有照片了，就加上 has-image 這個 class，
                讓這個區塊的樣式從「虛線空框」變成「顯示照片」的樣子。
              -->
              <label class="dropzone" :class="{ 'has-image': imageFiles.length }">
                <input
                  type="file"
                  class="file-input-hidden"
                  accept="image/*"
                  multiple
                  @change="handleFileChange"
                />

                <!-- v-if：還沒選任何照片時，顯示這個提示畫面 -->
                <div v-if="imageFiles.length === 0" class="dropzone-empty">
                  <span class="dz-icon"><i class="fa-solid fa-image" style="color: rgb(122, 75, 84);"></i></span>
                  <span class="dz-title">點擊上傳穿搭照片</span>
                  <span class="dz-sub">可一次選取多張，建議直式構圖</span>
                </div>

                <!-- v-else：已經選了照片，改成顯示第一張照片當封面預覽 -->
                <img v-else :src="imageFiles[0].url" alt="封面預覽" class="dropzone-preview" />

                <div v-if="imageFiles.length" class="dropzone-hover">更換封面照片</div>
              </label>

              <!-- 已選照片縮圖列 -->
              <div class="thumb-row" v-if="imageFiles.length">
                <!--
                  v-for="(img, idx) in imageFiles"：
                  這種寫法可以同時拿到「這一筆資料」(img) 跟「這一筆資料排第幾個」(idx，從 0 開始算)。
                  跟前面看到的 v-for="post in posts" 差別，是多拿了一個索引值 idx，
                  下面會用它來判斷「這是不是第一張」、以及「要移除第幾張」。
                -->
                <div class="thumb-item" v-for="(img, idx) in imageFiles" :key="idx">
                  <img :src="img.url" alt="縮圖" />
                  <span v-if="idx === 0" class="thumb-cover-badge">封面</span>
                  <button type="button" class="thumb-remove" @click="removeImage(idx)">✕</button>
                </div>

                <!-- 這個「＋」縮圖其實也是另一個隱藏的檔案上傳框，讓使用者可以再加選照片 -->
                <label class="thumb-add">
                  <input
                    type="file"
                    class="file-input-hidden"
                    accept="image/*"
                    multiple
                    @change="handleFileChange"
                  />
                  ＋
                </label>
              </div>

              <p class="upload-hint" v-if="imageFiles.length">
                已選 {{ imageFiles.length }} 張照片，第一張會作為封面，點縮圖右上角可移除
              </p>
            </div>

            <!-- 右側：文字內容 -->
            <div class="compose-body">

              <div class="field-block">
                <label class="field-label">
                  <i class="fa-solid fa-pen-to-square" style="color: rgb(122, 75, 84);"></i> 穿搭心得與介紹
                </label>
                <!--
                  v-model="postForm.title"：雙向綁定，
                  使用者在這個文字框打的內容，會自動同步存進 postForm.title。
                -->
                <textarea
                  class="field-textarea"
                  rows="6"
                  v-model="postForm.title"
                  placeholder="分享一下今天這套穿搭的靈感、單品材質或搭配技巧吧..."
                ></textarea>
              </div>

              <div class="field-block">
                <label class="field-label">
                  <i class="fa-solid fa-hashtag" style="color: rgb(122, 75, 84);"></i> 標記標籤商品（選填，可複選）
                </label>
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
                  <!--
                    :class="{ active: postForm.selectedProducts.includes(product.name) }"：
                    .includes(...)：判斷陣列裡「有沒有」某個值。
                    這裡的意思是：如果 selectedProducts 這個陣列裡已經有這個商品的名字，
                    就幫這顆標籤按鈕加上 active 樣式（顯示成「已選中」的樣子）。
                  -->
                  <button
                    v-for="product in filteredProducts"
                    :key="product.id"
                    type="button"
                    class="tag-chip selectable"
                    :class="{ active: postForm.selectedProducts.includes(product.name) }"
                    @click="toggleProduct(product.name)"
                  >#{{ product.name }}</button>

                  <span v-if="filteredProducts.length === 0" class="tag-empty">
                    找不到符合「{{ productSearch }}」的商品
                  </span>
                </div>

                <!-- 已選標籤預覽區：把使用者選中的標籤，各自畫成一個可以再點掉的小標籤 -->
                <div class="tag-preview" v-if="postForm.selectedProducts.length">
                  <span v-for="name in postForm.selectedProducts" :key="name" class="tag-chip selected-chip">
                    #{{ name }}
                    <button type="button" class="chip-remove" @click="toggleProduct(name)">✕</button>
                  </span>
                </div>
              </div>

              <div class="compose-actions">
                <router-link to="/community" class="btn-cancel">取消</router-link>
                <!-- type="submit"：這個按鈕會觸發上面 <form> 的 @submit.prevent="handleSubmit" -->
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
/* 在最上方引入 Font Awesome CDN */
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
/*
  Font Awesome 的圖示有分「款式」(Style)，例如 Solid（實心）、Regular（外框空心）等，
  瀏覽器要靠 font-weight（字重）這個數值，去挑選正確的圖示字型檔案來畫出圖案：
  900 對應到 Solid、400 對應到 Regular。
  如果圖示外面剛好包在某個設定了別的 font-weight 的元素裡（像這裡的 .field-label 設了 700），
  子元素會「繼承」到那個字重，導致瀏覽器抓錯字型檔案、顯示成缺字的方框。
  這裡強制 .fa-solid 一定要用字重 900，確保 Solid 款式的圖示不會因為繼承而抓錯字型。
*/
.fa-solid {
  font-weight: 900 !important;
}
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

/* ---------- 頁首：韓風簡約版（左側細直線引導） ---------- */
.page-head{ padding:2rem 0 1.4rem; }
.back-pill{
  display:inline-flex; align-items:center; gap:.3rem;
  border:1px solid var(--ink); border-radius:999px;
  padding:.35rem 1rem; font-size:.82rem; color:var(--ink);
  text-decoration:none; margin-bottom:1.1rem;
  transition:all .18s ease;
}
.back-pill:hover{ background:var(--ink); color:var(--cream); }

.page-head-inner{
  display:flex; align-items:center; gap:1.2rem;
}
.page-head-divider{
  width:1px; align-self:stretch;
  background:var(--hairline);
  flex-shrink:0;
}
.page-head-text{ padding-left:.2rem; }
.eyebrow{
  font-size:.7rem; letter-spacing:.24em; text-transform:uppercase;
  color:#A9A196; font-weight:600; margin-bottom:.4rem;
}
.page-title{
  font-family:'Noto Serif TC', serif;
  font-weight:900;
  font-size:clamp(1.5rem, 3.2vw, 1.9rem);
  line-height:1.15;
  margin:0 0 .4rem;
  color:var(--ink);
}
.page-sub{
  font-family:'Noto Serif TC', serif;
  font-style:italic;
  color:#9C9086;
  font-size:.9rem;
  margin:0;
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

.thumb-row{
  display:flex; flex-wrap:wrap; gap:.6rem;
  margin-top:.9rem;
}
.thumb-item{
  position:relative;
  width:64px; height:64px;
  border-radius:6px;
  overflow:hidden;
  border:1px solid var(--hairline);
  flex-shrink:0;
}
.thumb-item img{ width:100%; height:100%; object-fit:cover; display:block; }
.thumb-cover-badge{
  position:absolute; bottom:0; left:0; right:0;
  background:rgba(42,36,32,.72);
  color:#fff; font-size:.58rem; text-align:center;
  padding:.1rem 0;
}
.thumb-remove{
  position:absolute; top:2px; right:2px;
  width:18px; height:18px; border-radius:50%;
  background:rgba(42,36,32,.75); color:#fff;
  border:none; font-size:.62rem; line-height:1;
  display:flex; align-items:center; justify-content:center;
  transition:background .18s ease;
}
.thumb-remove:hover{ background:var(--plum); }

.thumb-add{
  width:64px; height:64px;
  border-radius:6px;
  border:1.5px dashed var(--hairline);
  display:flex; align-items:center; justify-content:center;
  font-size:1.3rem; color:var(--ink-soft);
  cursor:pointer; position:relative;
  flex-shrink:0;
  transition:border-color .18s ease, color .18s ease;
}
.thumb-add:hover{ border-color:var(--plum); color:var(--plum); }

.upload-hint{
  font-size:.76rem; color:var(--ink-soft);
  margin:.7rem 0 0;
}

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

.tag-preview{
  margin-top:.9rem;
  padding-top:.9rem;
  border-top:1px dashed var(--hairline);
  display:flex; flex-wrap:wrap; gap:.5rem;
}
.tag-chip{
  display:inline-block;
  font-size:.78rem; padding:.4rem .9rem; border-radius:999px;
  background:var(--cream); border:1px solid var(--ochre); color:var(--ochre);
  font-weight:600;
}
.tag-chip.selected-chip{
  display:inline-flex; align-items:center; gap:.4rem;
  background:var(--plum); border-color:var(--plum); color:#fff;
}
.chip-remove{
  background:rgba(255,255,255,.25); border:none; color:#fff;
  width:16px; height:16px; border-radius:50%;
  font-size:.6rem; line-height:1;
  display:flex; align-items:center; justify-content:center;
  transition:background .18s ease;
}
.chip-remove:hover{ background:rgba(255,255,255,.45); }

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

<!--
  這個區塊「不加 scoped」：scoped 樣式只會作用在這個元件模板裡面的元素上，
  body 不在模板裡，寫在 scoped 區塊不會生效。不加 scoped 的話，
  這段 CSS 編譯出來就是全域樣式，不用改共用的 App.vue 也能讓 body 變成統一背景色。
-->
<style>
body {
  background-color: #F9F4F0 !important;
}
</style>