<script setup>
import { ref, computed, onMounted } from 'vue'
// useRouter：Vue Router 提供的功能，讓我們可以在 <script> 裡面「用程式的方式」
// 切換網址（例如發文成功後自動跳轉回社群頁），而不是只能靠使用者自己點連結。
import { useRouter } from 'vue-router'
// api：跟其他頁面共用同一個 axios 實例（src/api/api.js），會自動把登入後的 JWT
// token 帶進 Authorization header，跟直接 import axios from 'axios' 不一樣。
import api from '@/api/api'

// 全站共用的貼文清單（跟 CommunityView.vue 共用同一份資料，直接 import 那個檔案）
// 這裡 import 進來的 addPost、currentUser，就是 CommunityView.vue 裡面
// 用 export 開放出來的那兩個東西（可以回去那個檔案最上面看說明）。
// 因為兩邊抓到的是「同一份」資料，所以只要在這裡呼叫 addPost() 新增一篇貼文，
// 回到 CommunityView.vue 的畫面上就會馬上看得到，不需要重新整理頁面、也不需要資料庫。
import {
  addPost,
  currentUser,
  currentUserId,
  loadCurrentUserId,
} from '@/views/Community/CommunityView.vue'

// IMAGE_BASE：圖片是靜態檔案，走的不是 /api 這條路徑，不能直接用 api 服務的
// baseURL（那個含 /api）；VITE_API_URL 本身就是純後端主機網址。
const IMAGE_BASE = import.meta.env.VITE_API_URL

// useRouter() 執行後會拿到一個「路由控制器」物件，
// 之後想切換頁面，就呼叫 router.push('網址') 就可以了。
const router = useRouter()

// 表單雙向綁定資料
// 這個物件會透過 v-model 直接跟畫面上的輸入框「雙向同步」

// （使用者打字，這裡的值自動更新；這裡的值變了，輸入框顯示也會變）。
const postForm = ref({
  content: '', // 使用者輸入的穿搭心得文字（對應資料庫 Community_Post.content 這個欄位）
  selectedProducts: [], // 改為陣列，支援複選；存放使用者勾選的商品標籤名稱
  status: 'public', // 貼文狀態：public（公開）或 hide（隱藏），對應資料庫 Community_Post.status，預設公開
})

// 圖片檔案與預覽用的 URL（改為陣列，支援多張照片）
// 陣列裡每一筆長這樣：{ file, url }
// file：使用者選取的原始檔案（瀏覽器的 File 物件，包含檔名、大小等資訊）
// url：給 <img> 標籤顯示用的「本地暫時預覽網址」（不是真的上傳到網路上的網址）
const imageFiles = ref([])

// 可標記的商品清單：先給空陣列，等 fetchProducts() 打完 API 才會有真正資料庫裡的商品，
// 這樣才不會有商品「搜尋不到」的問題（之前是寫死只有 5 筆假資料）。
// productId 對應資料庫 Post_Tagged_Product.Product_Id
const availableProducts = ref([])

// fetchProducts：跟後端要「全部商品」清單，打的是 ProductController.cs 裡的 GET api/Product。
const fetchProducts = async () => {
  try {
    const res = await api.get(`/Product`)
    availableProducts.value = res.data.map((p) => ({
      productId: p.productId,
      name: p.productName,
    }))
  } catch (err) {
    console.error('讀取商品清單失敗：', err)
  }
}

onMounted(() => {
  fetchProducts()
  loadCurrentUserId()
})

// 搜尋標籤商品
// productSearch：使用者在「標記標籤商品」那個搜尋框打的文字。
const productSearch = ref('')
// filteredProducts：一個 computed，根據 productSearch 目前的內容，
// 從 availableProducts 裡篩選出符合的商品，畫面上的標籤雲會顯示這個篩選後的結果。
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) {
    // 沒有搜尋文字時，只列出前 5 個當作「熱門標籤」頂著，不要把商品全部攤開，
    // 不然商品一多，標籤區塊就會被拉得越來越長。跟 UserProfileView.vue 編輯表單
    // 那邊「標記標籤商品」是同一套邏輯——想標記其他商品，直接在上面搜尋框打名字就好。
    // 這裡先用 availableProducts 原本的順序（後端 /Product 回來的順序）取前 5 個；
    // 之後如果後端有「熱門商品」（例如依標記次數排序）的 API，把這裡換成打那支 API 就好，
    // 前端邏輯不用變。
    return availableProducts.value.slice(0, 5)
  }
  return availableProducts.value.filter((p) => p.name.toLowerCase().includes(q))
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
  files.forEach((file) => {
    imageFiles.value.push({
      file,
      // URL.createObjectURL(file)：瀏覽器內建的功能，可以幫一個「還沒上傳到網路」的
      // 本地檔案，產生一個暫時的網址，讓 <img> 標籤可以直接拿來預覽，
      // 但這個網址只在「現在這個分頁」有效，重新整理頁面就會失效。
      url: URL.createObjectURL(file),
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

/// 送出發文：打真正的 API，把貼文存進資料庫
// handleSubmit：使用者按下「確認發布」按鈕時，會執行這個函式。
// 改成 async，因為裡面要用 await 等後端 API 回應。
const handleSubmit = async () => {
  // 檢查：如果一張照片都沒選、或是心得文字是空的，就跳出提示視窗、不繼續往下執行。
  if (
    imageFiles.value.length === 0 ||
    !postForm.value.content ||
    postForm.value.selectedProducts.length === 0
  ) {
    alert('請上傳穿搭照片、填寫貼文心得，並至少標記一項商品！')
    return // return 在這裡的作用是「提早結束這個函式」，後面的程式碼都不會被執行。
  }

  // currentUserId 還是 null，代表還沒登入（或 /User/me 還沒查完），
  // 不能讓使用者以為發文成功、結果 userId 是空的送出去被後端擋掉（400）。
  if (!currentUserId.value) {
    alert('請先登入才能發文！')
    return
  }

  // 第一步：把選好的照片真正上傳到後端，存進 wwwroot/images/posts/，拿回真正的路徑。
  // FormData：瀏覽器內建的物件，專門用來包「檔案」這種二進位資料送出去
  // （一般的 axios.post(url, { ... }) 送 JSON 沒辦法包真正的檔案內容，要用 FormData）。
  const formData = new FormData()
  imageFiles.value.forEach((img) => {
    // 'files' 這個欄位名稱要跟後端 UploadImages(List<IFormFile> files) 的參數名稱一致，
    // 模型繫結才抓得到；append 同一個名稱多次，後端就會收到一個「檔案清單」。
    formData.append('files', img.file)
  })

  let uploadedPaths = []
  try {
    const uploadRes = await api.post(`/CommunityPost/upload-images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    uploadedPaths = uploadRes.data
  } catch (err) {
    console.error('圖片上傳失敗：', err)
    alert('圖片上傳失敗，請稍後再試一次！')
    return
  }

  // 組出要送給後端的資料，對應 CommunityPostController.cs 的 PostCommunityPost(CommunityPostDTO)。
  // 圖片、標記商品的部分後端會照這裡的清單，各自新增進 Post_Image、Post_Tagged_Product 兩張表。
  const payload = {
    userId: currentUserId.value,
    content: postForm.value.content, // 對應 Community_Post.content
    status: postForm.value.status, // 對應 status：public（公開）或 hide（隱藏），來自上面選的公開設定
    // images：用「剛剛上傳完、後端真正回傳的路徑」組成 Post_Image 表的格式，
    // 不再是檔案原始名稱佔位了——uploadedPaths 陣列的順序跟 imageFiles 是對應的。
    images: uploadedPaths.map((path, idx) => ({
      imageFileName: path,
      sortOrder: idx + 1,
    })),
    // taggedProducts：把選中的商品名稱陣列，轉換成對應 Post_Tagged_Product 格式的物件陣列。
    // 用 availableProducts.find(...) 找回這個名字對應的 productId。
    taggedProducts: postForm.value.selectedProducts.map((name) => {
      const matched = availableProducts.value.find((p) => p.name === name)
      return {
        productId: matched ? matched.productId : null,
        productRoute: null,
      }
    }),
  }

  try {
    await api.post(`/CommunityPost`, payload)
  } catch (err) {
    // API 出錯就提醒使用者，不要假裝發文成功、也不要繼續往下跳轉頁面。
    console.error('發文失敗：', err)
    alert('發文失敗，請稍後再試一次！')
    return
  }

  // 呼叫從 CommunityView.vue 拿來的 addPost 函式，讓畫面「立刻」看到剛剛發的貼文，
  // 不用等重新整理、重新打一次 GET API。真正存進資料庫的資料已經在上面 axios.post 那步完成了。
  addPost({
    communityPostId: Date.now(), // 這裡只是先讓畫面上有個暫時的唯一編號可以用，跟資料庫實際存的 id 無關
    userId: currentUserId.value,
    user: { name: currentUser.value.name, avatar: currentUser.value.avatar }, // 發文者資訊，來自剛剛 import 的 currentUser（現在是 ref，資料庫真實的暱稱／大頭貼）
    content: postForm.value.content,
    postDate: new Date().toISOString(),
    status: postForm.value.status,
    images: uploadedPaths.map((path, idx) => ({
      postImageId: null,
      imageFileName: path,
      sortOrder: idx + 1,
      // 這裡直接組出跟 CommunityView.vue 一樣的正式網址（IMAGE_BASE + 路徑），
      // 不用再靠本地暫時預覽網址頂著了，因為圖片這時候已經是真的存在伺服器上。
      url: `${IMAGE_BASE}${path}`,
    })),
    likesCount: 0,
    commentsCount: 0,
    taggedProducts: postForm.value.selectedProducts.map((name) => {
      const matched = availableProducts.value.find((p) => p.name === name)
      return {
        postTaggedProductId: null,
        productId: matched ? matched.productId : null,
        productRoute: null,
        name,
      }
    }),
  })

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
                  <span class="dz-icon">
                    <!--
                      這裡跟其他地方換掉 Font Awesome 圖示是同一個理由：這個檔案雖然有正確
                      載入 Font Awesome（下面 <style> 有 @import），圖示本身沒有壞掉，
                      但既然已經把 UserProfileView.vue、ChatView.vue 的圖示陸續換成專案自己的
                      SVG 風格，這裡也一起換掉，整個 Community 的圖示風格才會一致，
                      也少一個依賴外部字型/CDN 的地方。
                    -->
                    <svg
                      viewBox="0 0 24 24"
                      width="32"
                      height="32"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <circle cx="8.5" cy="9.5" r="1.5" />
                      <path d="M21 15l-5-5-4 4-3-3-6 6" />
                    </svg>
                  </span>
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
                  <svg
                    class="field-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  穿搭心得與介紹
                </label>
                <!--
                  v-model="postForm.content"：雙向綁定，
                  使用者在這個文字框打的內容，會自動同步存進 postForm.content
                  （對應資料庫 Community_Post.content 這個欄位）。
                -->
                <textarea
                  class="field-textarea"
                  rows="6"
                  v-model="postForm.content"
                  placeholder="分享一下今天這套穿搭的靈感、單品材質或搭配技巧吧..."
                ></textarea>
              </div>

              <div class="field-block">
                <label class="field-label">
                  <svg
                    class="field-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M9 4L7 20" />
                    <path d="M17 4l-2 16" />
                    <path d="M4 9h16" />
                    <path d="M3 15h16" />
                  </svg>
                  標記標籤商品（至少選 1 項，可複選）
                </label>
                <div class="search-bar">
                  <svg
                    class="search-icon"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.6" />
                    <path
                      d="M14 14L18 18"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                    />
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
                  >
                    ✕
                  </button>
                </div>

                <!--
                  沒有打字搜尋的時候，只列出「熱門」的前 5 個標籤，提示使用者
                  想找其他商品要用上面的搜尋框，避免以為標籤雲裡列出來的就是全部商品。
                -->
                <p class="field-hint" v-if="!productSearch.trim()">
                  熱門標籤，想找其他商品請直接搜尋
                </p>

                <div class="tag-cloud">
                  <!--
                    :class="{ active: postForm.selectedProducts.includes(product.name) }"：
                    .includes(...)：判斷陣列裡「有沒有」某個值。
                    這裡的意思是：如果 selectedProducts 這個陣列裡已經有這個商品的名字，
                    就幫這顆標籤按鈕加上 active 樣式（顯示成「已選中」的樣子）。
                  -->
                  <button
                    v-for="product in filteredProducts"
                    :key="product.productId"
                    type="button"
                    class="tag-chip selectable"
                    :class="{ active: postForm.selectedProducts.includes(product.name) }"
                    @click="toggleProduct(product.name)"
                  >
                    #{{ product.name }}
                  </button>

                  <span v-if="filteredProducts.length === 0" class="tag-empty">
                    找不到符合「{{ productSearch }}」的商品
                  </span>
                </div>

                <!-- 已選標籤預覽區：把使用者選中的標籤，各自畫成一個可以再點掉的小標籤 -->
                <div class="tag-preview" v-if="postForm.selectedProducts.length">
                  <span
                    v-for="name in postForm.selectedProducts"
                    :key="name"
                    class="tag-chip selected-chip"
                  >
                    #{{ name }}
                    <button type="button" class="chip-remove" @click="toggleProduct(name)">
                      ✕
                    </button>
                  </span>
                </div>
              </div>

              <!-- 公開／隱藏選擇：對應資料庫 Community_Post.status -->
              <div class="field-block">
                <label class="field-label">公開設定</label>
                <div class="visibility-toggle">
                  <label class="visibility-option">
                    <input type="radio" v-model="postForm.status" value="public" />
                    <span>公開（所有人都看得到）</span>
                  </label>
                  <label class="visibility-option">
                    <input type="radio" v-model="postForm.status" value="hide" />
                    <span>隱藏（只有自己看得到）</span>
                  </label>
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
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
.create-post-page {
  width: 100%;
  min-height: 100vh;
  background-color: #f9f4f0 !important;
  box-sizing: border-box;
  --cream: #f9f4f0;
  --paper: #fffdfb;
  --ink: #2a2420;
  --ink-soft: #7a6e63;
  --plum: #7a4b54;
  --plum-deep: #5e3941;
  --ochre: #b8862e;
  --hairline: #e4d8cc;
  color: var(--ink);
  font-family: 'Noto Sans TC', sans-serif;
}
.page-head {
  padding: 2rem 0 1.4rem;
}
.back-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid var(--ink);
  border-radius: 999px;
  padding: 0.35rem 1rem;
  font-size: 0.82rem;
  color: var(--ink);
  text-decoration: none;
  margin-bottom: 1.1rem;
  transition: all 0.18s ease;
}
.back-pill:hover {
  background: var(--ink);
  color: var(--cream);
}
.page-head-inner {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}
.page-head-divider {
  width: 1px;
  align-self: stretch;
  background: var(--hairline);
  flex-shrink: 0;
}
.page-head-text {
  padding-left: 0.2rem;
}
.eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #a9a196;
  font-weight: 600;
  margin-bottom: 0.4rem;
}
.page-title {
  font-family: 'Noto Serif TC', serif;
  font-weight: 900;
  font-size: clamp(1.5rem, 3.2vw, 1.9rem);
  line-height: 1.15;
  margin: 0 0 0.4rem;
  color: var(--ink);
}
.page-sub {
  font-family: 'Noto Serif TC', serif;
  font-style: italic;
  color: #9c9086;
  font-size: 0.9rem;
  margin: 0;
}
.compose-card {
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 22px;
  overflow: hidden;
}
.compose-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
}
.compose-media {
  position: relative;
  background: var(--cream);
  padding: 1.6rem;
  display: flex;
  flex-direction: column;
}
.compose-media .tag-label {
  position: absolute;
  top: 16px;
  left: 1rem;
  z-index: 2;
  background: var(--plum);
  color: #fff;
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  font-weight: 600;
  padding: 0.32rem 0.8rem 0.32rem 1.1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
}
.compose-media .tag-label::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -7px;
  border-width: 0 8px 7px 0;
  border-style: solid;
  border-color: transparent var(--plum-deep) transparent transparent;
}
.dropzone {
  position: relative;
  flex: 1;
  min-height: 360px;
  border: 1.5px dashed var(--hairline);
  background: var(--paper);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}
.dropzone:hover {
  border-color: var(--plum);
}
.dropzone.has-image {
  border-style: solid;
}
.file-input-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.dropzone-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  color: var(--ink-soft);
  padding: 2rem;
  text-align: center;
}
.dz-icon {
  display: flex;
  margin-bottom: 0.3rem;
  color: var(--plum);
}
.dz-title {
  font-family: 'Noto Serif TC', serif;
  font-weight: 700;
  color: var(--ink);
  font-size: 1rem;
}
.dz-sub {
  font-size: 0.78rem;
}
.dropzone-preview {
  width: 100%;
  height: 100%;
  min-height: 360px;
  object-fit: cover;
  display: block;
}
.dropzone-hover {
  position: absolute;
  inset: 0;
  background: rgba(42, 36, 32, 0.45);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}
.dropzone.has-image:hover .dropzone-hover {
  opacity: 1;
}
.thumb-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.9rem;
}
.thumb-item {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--hairline);
  flex-shrink: 0;
}
.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.thumb-cover-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(42, 36, 32, 0.72);
  color: #fff;
  font-size: 0.58rem;
  text-align: center;
  padding: 0.1rem 0;
}
.thumb-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(42, 36, 32, 0.75);
  color: #fff;
  border: none;
  font-size: 0.62rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease;
}
.thumb-remove:hover {
  background: var(--plum);
}
.thumb-add {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  border: 1.5px dashed var(--hairline);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  color: var(--ink-soft);
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition:
    border-color 0.18s ease,
    color 0.18s ease;
}
.thumb-add:hover {
  border-color: var(--plum);
  color: var(--plum);
}
.upload-hint {
  font-size: 0.76rem;
  color: var(--ink-soft);
  margin: 0.7rem 0 0;
}
.compose-body {
  padding: 2rem 2rem 1.8rem;
  display: flex;
  flex-direction: column;
}
.field-block {
  margin-bottom: 1.6rem;
}
.field-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Noto Serif TC', serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--ink);
  margin-bottom: 0.6rem;
}
.field-icon {
  width: 16px;
  height: 16px;
  color: var(--plum);
  flex-shrink: 0;
}
.field-hint {
  font-size: 0.76rem;
  color: var(--ink-soft);
  margin: 0.5rem 0 0;
}
.field-textarea {
  width: 100%;
  border: 1px solid var(--hairline);
  background: var(--cream);
  border-radius: 4px;
  padding: 0.9rem 1rem;
  font-family: 'Noto Sans TC', sans-serif;
  font-size: 0.92rem;
  color: var(--ink);
  resize: vertical;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}
.field-textarea:focus {
  outline: none;
  border-color: var(--plum);
  background: var(--paper);
}
.field-textarea::placeholder {
  color: var(--ink-soft);
}
.visibility-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
}
.visibility-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.88rem;
  color: var(--ink);
  cursor: pointer;
}
.visibility-option input[type='radio'] {
  accent-color: var(--plum);
  width: 16px;
  height: 16px;
  cursor: pointer;
}
.tag-preview {
  margin-top: 0.9rem;
  padding-top: 0.9rem;
  border-top: 1px dashed var(--hairline);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.tag-chip {
  display: inline-block;
  font-size: 0.78rem;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: var(--cream);
  border: 1px solid var(--ochre);
  color: var(--ochre);
  font-weight: 600;
}
.tag-chip.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--plum);
  border-color: var(--plum);
  color: #fff;
}
.chip-remove {
  background: rgba(255, 255, 255, 0.25);
  border: none;
  color: #fff;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 0.6rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease;
}
.chip-remove:hover {
  background: rgba(255, 255, 255, 0.45);
}
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid var(--hairline);
  background: var(--cream);
  border-radius: 4px;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}
.search-bar:focus-within {
  border-color: var(--plum);
  background: var(--paper);
}
.search-icon {
  width: 16px;
  height: 16px;
  color: var(--ink-soft);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.15rem 0.6rem;
  font-size: 0.88rem;
  color: var(--ink);
  outline: none;
}
.search-input::placeholder {
  color: var(--ink-soft);
}
.search-clear {
  border: none;
  background: var(--hairline);
  color: var(--ink-soft);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 0.7rem;
  line-height: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}
.search-clear:hover {
  background: var(--plum);
  color: #fff;
}
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.8rem;
}
.tag-chip.selectable {
  border: 1px solid var(--hairline);
  background: var(--paper);
  color: var(--ink);
  cursor: pointer;
  transition: all 0.18s ease;
}
.tag-chip.selectable:hover {
  border-color: var(--ochre);
  color: var(--ochre);
}
.tag-chip.selectable.active {
  background: var(--plum);
  border-color: var(--plum);
  color: #fff;
}
.tag-empty {
  font-size: 0.8rem;
  color: var(--ink-soft);
  font-family: 'Noto Serif TC', serif;
  font-style: italic;
}
.compose-actions {
  margin-top: auto;
  padding-top: 1.4rem;
  border-top: 1px dashed var(--hairline);
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
}
.btn-cancel {
  border: 1px solid var(--hairline);
  color: var(--ink-soft);
  border-radius: 4px;
  padding: 0.6rem 1.6rem;
  font-size: 0.88rem;
  text-decoration: none;
  transition: all 0.18s ease;
}
.btn-cancel:hover {
  border-color: var(--ink);
  color: var(--ink);
}
.btn-publish {
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 4px;
  padding: 0.65rem 2.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  transition:
    background 0.18s ease,
    transform 0.18s ease;
}
.btn-publish:hover {
  background: var(--plum-deep);
  transform: translateY(-1px);
}
@media (max-width: 860px) {
  .compose-grid {
    grid-template-columns: 1fr;
  }
  .compose-media {
    padding: 1.2rem;
  }
  .dropzone,
  .dropzone-preview {
    min-height: 280px;
  }
  .compose-body {
    padding: 1.6rem;
  }
}
</style>

<!-- 不加 scoped：讓這段 CSS 變成全域樣式，直接套用到 body 上 -->
<style>
body {
  background-color: #f9f4f0 !important;
}
</style>
