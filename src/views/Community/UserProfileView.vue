<script setup>
// ============================================================
// 這裡是「邏輯」的部分：資料存在哪裡、發生什麼事情要做什麼事
// ============================================================

// ref() 是 Vue 提供的功能，用來建立一個「會被畫面自動追蹤」的變數。
// 白話說：只要 ref() 包起來的資料改變了，畫面上有用到這個資料的地方
// 會自動跟著重新顯示，不用自己手動去更新 HTML。
import { ref, onMounted, watch, computed } from 'vue'
// useRoute：讀取網址上的動態參數，router/index.js 裡這個頁面對應的路由是
// path: '/community/profile/:userId'，要用 useRoute() 才能拿到 :userId 那段的值。
import { useRoute } from 'vue-router'
// axios：打 API 用的套件，跟 CommunityView.vue、PostDetailView.vue 裡用的是同一套。
import axios from 'axios'

// 收藏功能共用資料（跟 PostDetailView.vue 共用同一份收藏清單，直接 import 那個檔案）
// savedPosts：使用者收藏的所有貼文，格式對照 Community_Favorite + Community_Post：
// { communityPostId, content, image, likesCount, commentsCount, tags }。
// formatCount：把純數字（例如 1200）轉成「1.2k」這種縮寫格式，這裡是「跨檔案 import」，
// 跟 CommunityView.vue 自己 <template> 要另外重複宣告一份不一樣——
// 因為這裡是「別的檔案」透過 import 拿到它，並不是同一個 SFC 裡的 <script setup>／<template>
// 那種限制，所以可以直接在這個檔案的 <template> 裡正常使用。
import { savedPosts, loadSavedPosts, formatCount } from '@/views/Community/CommunityView.vue'

// API_BASE：後端 API 專案的網址，跟 CommunityView.vue、PostDetailView.vue 裡用的是同一個。
const API_BASE = 'https://localhost:7255'

const route = useRoute()

// currentTestUserId：目前登入的測試帳號 id，跟 CreatePostView.vue、PostDetailView.vue
// 用的是同一個測試帳號。之後接上真的登入系統，這裡要換成登入者真正的 user_id。
// 這個是「我是誰」，跟下面的 viewedUserId（「我正在看誰的頁面」）是兩回事——
// 只有兩者相等時，才代表「我正在看自己的頁面」，編輯／刪除貼文才該出現。
const currentTestUserId = 1

// viewedUserId：現在看的是哪個使用者的個人頁，從網址上的 :userId 讀出來。
// 網址上的參數本身是字串（例如 "3"），這裡用 Number(...) 轉成數字，
// 因為後端 API、資料庫的 userId 都是 int，字串跟數字型別不一致，某些比對可能會出錯。
// 用 computed 而不是普通變數：從「這個人的個人頁」點連結切到「另一個人的個人頁」時，
// Vue Router 會重複使用同一個元件、不會重新建立，普通變數只會算一次、不會跟著網址變，
// 這裡用 computed 才能保證 viewedUserId 隨時反映網址上「現在」的 :userId。
const viewedUserId = computed(() => Number(route.params.userId))



// 使用者個人資料
// 這是一個「物件」（用 { } 包起來、裡面很多 key: value 的資料），
// 存放這個使用者頁面要顯示的所有基本資訊。
// 外面包了 ref()，代表以後如果我們改了裡面任何一個值（例如按追蹤後
// isFollowing 從 false 變 true），畫面會自動更新，不用自己重畫。
const userProfile = ref({
  name: 'Emily 艾米莉',
  handle: '@emily_style',
  bioTag: '韓系 | 簡約 | 日常穿搭分享',
  bio: '喜歡分享每天的穿搭靈感    點擊看板搭配同款單品，一起變美！',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', // 大頭貼圖片網址
  bannerBg: '#EFE8E1', // 暖質感奶茶底色
  postsCount: '1,284',    // 貼文數（純文字顯示用，不是拿來計算的數字）
  followersCount: '58.6K',
  followingCount: '342',
  email: 'emily.style@example.com', // 訊息按鈕要用的信箱，先用假信箱佔位，之後接真的使用者資料再換掉
  isFollowing: false // 「我」有沒有追蹤這個人，true/false 這種只有兩種狀態的值叫做布林值
})

// 當前頁籤 (穿搭作品, 收藏, 同款商品, 關於我)
// 這個 ref 只存一個字串，代表「現在使用者點的是哪一個分類頁籤」。
// 畫面會根據這個值，決定要顯示哪一塊內容（下面 template 會用到）。
const activeTab = ref('works')

// 穿搭作品列表
// 這是一個「陣列」（用 [ ] 包起來、裡面放很多筆資料），每一筆都是一篇貼文的資訊。
// 之後畫面會用 v-for 把這個陣列「一筆一筆」畫成一張一張的卡片。
// 欄位對照資料庫（Community_Post）：communityPostId、content（合併原本的 title）、
// image（對應 Post_Images 第一張圖）、likesCount／commentsCount（純數字，顯示時再用
// formatCount 轉成「1.2k」這種縮寫）、tags（對應 Post_Tagged_Products 的商品名稱）。
// 先給空陣列，畫面會等 fetchUserPosts() 打完 API 才有資料，避免還沒載入完就出現假資料。
const userPosts = ref([])

// fetchUserPosts：跟後端要「這個使用者自己發的所有貼文」，
// 打的是 CommunityPostController.cs 裡新增的 GET api/CommunityPost/user/{userid}。
const fetchUserPosts = async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/CommunityPost/user/${viewedUserId.value}`)
    // 後端回傳的格式（CommunityPostDTO）跟這頁 template 原本期待的格式不太一樣，
    // 這裡把它轉成 template 需要的形狀：content、image（取第一張圖）、likesCount、
    // commentsCount、tags（把 taggedProducts 陣列轉成 '#商品名稱' 字串陣列）。
    userPosts.value = res.data.map(post => ({
      communityPostId: post.communityPostId,
      userId: post.userId,
      status: post.status,
      content: post.content,
      image: post.images && post.images.length > 0
        ? `${API_BASE}${post.images[0].imageFileName}`
        : '',
      // images：保留完整的原始圖片清單（不是只有第一張），編輯貼文換照片時要用到，
      // 卡片本身的縮圖顯示還是繼續用上面那個扁平的 image 欄位就好。
      images: post.images || [],
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      tags: post.taggedProducts.map(t => `#${t.name}`)
    }))
  } catch (err) {
    console.error('讀取個人貼文失敗：', err)
  }
}

// deletePost：按下「刪除貼文」時執行。
// 打的是 CommunityPostController.cs 裡的 DELETE api/CommunityPost/{communitypostid}。
const deletePost = async (communityPostId) => {
  // confirm(...)：瀏覽器內建的確認視窗，會跳出「確定／取消」讓使用者選，
  // 按確定回傳 true，按取消回傳 false。刪除是不能復原的動作，先跟使用者確認一次比較安全。
  if (!confirm('確定要刪除這篇貼文嗎？刪除後就無法恢復。')) return

  try {
    await axios.delete(`${API_BASE}/api/CommunityPost/${communityPostId}`)
  } catch (err) {
    console.error('刪除貼文失敗：', err)
    alert('刪除失敗，請稍後再試一次！')
    return
  }

  // API 刪除成功後，把畫面上這篇貼文也從 userPosts 移除，不用整頁重新整理、重打一次 API。
  userPosts.value = userPosts.value.filter(p => p.communityPostId !== communityPostId)
}

// editingPostId：現在正在編輯哪一篇貼文，null 代表沒有任何一篇正在編輯中。
// 用「哪一篇的 id」而不是單純 true/false，是因為同一個頁面裡有好幾張貼文卡片，
// 這樣才知道要在「哪一張」卡片底下顯示編輯表單。
const editingPostId = ref(null)

// editForm：編輯表單目前打的內容，對應 CommunityPostController.cs 的
// PutCommunityPost 能改的欄位：content、status、images。
// images 陣列裡每一筆是 { imageFileName, sortOrder, url, isNew }：
// isNew 是 false 代表這張是「本來就有」的舊照片（imageFileName 是資料庫裡真的路徑）；
// isNew 是 true 代表這張是「這次新選的」照片（imageFileName 先用檔案原始名稱佔位，
// 等圖片上傳功能做好再換成真正存到伺服器後的路徑，跟 CreatePostView.vue 現在的做法一樣）。
const editForm = ref({ content: '', status: 'public', images: [] })

// startEdit：按下「編輯貼文」時執行，把表單內容預先填成這篇貼文現在的資料，
// 並把 editingPostId 設成這篇貼文的 id，畫面上就會展開編輯表單。
const startEdit = (post) => {
  editingPostId.value = post.communityPostId
  editForm.value = {
    content: post.content,
    status: post.status || 'public',
    images: (post.images || []).map(img => ({
      imageFileName: img.imageFileName,
      sortOrder: img.sortOrder,
      url: `${API_BASE}${img.imageFileName}`,
      isNew: false
    }))
  }
}

// cancelEdit：取消編輯，收起表單，不送出任何變更。
const cancelEdit = () => {
  editingPostId.value = null
}

// handleEditFileChange：編輯表單裡選新照片時執行，邏輯跟 CreatePostView.vue 的
// handleFileChange 是同一套，只是這裡是加進 editForm.value.images。
const handleEditFileChange = (event) => {
  const files = Array.from(event.target.files || [])
  files.forEach(file => {
    editForm.value.images.push({
      file, // 保留原始檔案本身，saveEdit 真正送出前要用它上傳
      imageFileName: file.name, // 先用檔案原始名稱佔位，saveEdit 上傳成功後會換成真正的路徑
      sortOrder: editForm.value.images.length + 1,
      url: URL.createObjectURL(file), // 本地暫時預覽網址
      isNew: true
    })
  })
  event.target.value = ''
}

// removeEditImage：移除編輯表單裡的其中一張照片（不管是舊照片還是新選的都可以移除）。
const removeEditImage = (index) => {
  editForm.value.images.splice(index, 1)
}

// saveEdit：按下「儲存」時執行，先把「新選的照片」真正上傳，再打 PUT api/CommunityPost/{id}。
const saveEdit = async (post) => {
  // 第一步：把 isNew 是 true 的照片（這次新選的）真正上傳到後端，
  // 舊照片（isNew 是 false）已經在伺服器上了，不用再傳一次。
  const newImages = editForm.value.images.filter(img => img.isNew)

  if (newImages.length > 0) {
    const formData = new FormData()
    newImages.forEach(img => formData.append('files', img.file))

    try {
      const uploadRes = await axios.post(`${API_BASE}/api/CommunityPost/upload-images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // uploadRes.data 的順序跟 newImages 送出的順序是對應的，
      // 把每一筆新照片的 imageFileName 換成後端真正回傳的路徑。
      newImages.forEach((img, idx) => {
        img.imageFileName = uploadRes.data[idx]
      })
    } catch (err) {
      console.error('圖片上傳失敗：', err)
      alert('圖片上傳失敗，請稍後再試一次！')
      return
    }
  }

  // 送出前先把 sortOrder 依照現在畫面上的順序重新編一次號（1、2、3...），
  // 避免使用者移除中間某張照片後，順序留下缺口（例如變成 1、3、4）。
  const images = editForm.value.images.map((img, idx) => ({
    imageFileName: img.imageFileName,
    sortOrder: idx + 1
  }))

  try {
    await axios.put(`${API_BASE}/api/CommunityPost/${post.communityPostId}`, {
      communityPostId: post.communityPostId,
      userId: post.userId,
      content: editForm.value.content,
      status: editForm.value.status,
      images
    })
  } catch (err) {
    console.error('編輯貼文失敗：', err)
    alert('儲存失敗，請稍後再試一次！')
    return
  }

  // 成功後直接更新畫面上這篇貼文的內容，不用重新整理、重打一次 GET API。
  post.content = editForm.value.content
  post.status = editForm.value.status
  post.images = images
  post.image = images.length > 0 ? `${API_BASE}${images[0].imageFileName}` : ''
  editingPostId.value = null
}

// onMounted：這個元件的畫面第一次被畫出來之後，自動執行裡面的程式碼一次。
// 跟 PostDetailView.vue 抓單篇貼文的邏輯是一樣的模式。
// 也順便呼叫 loadSavedPosts，避免使用者是直接連進這頁（沒先經過 CommunityView.vue），
// 導致收藏頁籤看起來是空的。
onMounted(() => {
  fetchUserPosts()
  loadSavedPosts()
})

// watch：監看網址上的 :userId 這個參數。
// 跟 PostDetailView.vue 換貼文時遇到的狀況一樣——從「這個人的個人頁」點連結切到
// 「另一個人的個人頁」時，Vue Router 會重複使用同一個元件，onMounted 不會再執行第二次，
// 所以另外監看 :userId，只要它變了（換了要看的人），就重新打一次 API。
watch(() => route.params.userId, () => {
  fetchUserPosts()
})

// 這是頁籤按鈕要顯示的清單：每個頁籤有一個「代號」(key，程式判斷用)
// 跟一個「顯示文字」(label，給人看的)。
// 這裡沒有包 ref()，因為這份清單開頭到結束都不會被改變（不會新增/刪除頁籤），
// 只有純顯示用途，所以不需要讓 Vue 特別去「追蹤」它的變化。
const tabs = [
  { key: 'works', label: '穿搭作品' },
  { key: 'saved', label: '收藏' }
]

// 這是一個「函式」（function，可以想成一個按鈕按下去要執行的一段動作）。
// 按「追蹤」按鈕的時候會呼叫這個函式。
// userProfile.value：因為 userProfile 是用 ref() 包起來的，
// 在 <script> 裡面要拿裡面真正的資料，一定要加 .value。
// （在 <template> 裡面則不用加 .value，Vue 會自動幫你處理，等一下會看到）
// !userProfile.value.isFollowing：「!」代表「相反」，
// 所以這行的意思是「把 isFollowing 改成跟現在相反的值」（true 變 false，false 變 true）。
const toggleFollow = () => {
  userProfile.value.isFollowing = !userProfile.value.isFollowing
}
</script>

<template>
  

  <div class="community-page min-vh-100 w-100">
    

    <div class="container-fluid container-lg pb-5">

      <!--
        返回社群按鈕：跟 CreatePostView.vue、PostDetailView.vue 的 back-pill 是同一顆按鈕、同一套樣式，
        統一放在頁面內容最上面，讓使用者從個人頁也能一鍵回到社群列表，不用一直靠瀏覽器的上一頁。
      -->
      <router-link to="/community" class="back-pill">← 返回社群</router-link>

      <!-- 個人檔案卡 -->
      <div class="profile-card mb-4">

        <!-- 封面橫幅：改用斜紋質感取代純色平塗 -->
        <div class="profile-banner"></div>

        <div class="profile-body">
          <div class="profile-top">

            <!-- 大頭貼 -->
            <div class="avatar-wrapper">
              <!--
                :src="userProfile.avatar"
                前面加冒號的屬性（例如 :src）叫做「動態綁定」，
                意思是「這個屬性的值不是寫死的文字，而是綁定一個變數」。
                所以這裡的圖片網址會直接抓 userProfile 裡的 avatar 值。
                （在 template 裡面直接寫 userProfile.avatar，不用加 .value）
              -->
              <img :src="userProfile.avatar" class="avatar-img" alt="Avatar" />
            </div>

            <!-- 數據與動作 -->
            <div class="profile-meta">
              <div class="stat-group">
                <div class="stat-item">
                  <!-- {{ }} 雙大括號叫做「插值」，作用是把後面的變數值印到畫面上 -->
                  <div class="stat-num">{{ userProfile.postsCount }}</div>
                  <div class="stat-label">貼文</div>
                </div>
                <div class="stat-item">
                  <div class="stat-num">{{ userProfile.followersCount }}</div>
                  <div class="stat-label">粉絲</div>
                </div>
                <div class="stat-item">
                  <div class="stat-num">{{ userProfile.followingCount }}</div>
                  <div class="stat-label">追蹤中</div>
                </div>
              </div>

              <div class="action-group">
                <button
                  class="btn-follow-main"
                  :class="{ following: userProfile.isFollowing }"
                  @click="toggleFollow"
                >
                  <!--
                    {{ 條件 ? A : B }} 叫做「三元運算子」，白話翻譯：
                    「如果條件成立，顯示 A；不成立的話，顯示 B」。
                    這裡的意思是：如果已經追蹤了，按鈕文字顯示「已追蹤」，
                    沒追蹤的話顯示「＋ 追蹤」。
                  -->
                  {{ userProfile.isFollowing ? '已追蹤' : '＋ 追蹤' }}
                </button>
                <!--
                  改用 mailto 連結：href 前面加上 "mailto:"，瀏覽器看到這個開頭
                  就知道不是要跳到一般網頁，而是要打開使用者電腦裡設定好的
                  預設郵件軟體（例如 Outlook、Gmail 桌面版），
                  自動幫忙帶入收件人信箱，就不用自己另外做一個站內聊天室頁面。
                  class="btn-message" 還是套用原本的按鈕樣式，
                  外觀不會變，只是從 <button> 換成 <a> 標籤。
                -->
                <a :href="`mailto:${userProfile.email}`" class="btn-message">✉ 訊息</a>
              </div>
            </div>
          </div>

          <!-- 姓名與簡介 -->
          <div class="profile-intro">
            <h1 class="profile-name">{{ userProfile.name }}</h1>
            <div class="profile-handle">
              <span>{{ userProfile.handle }}</span>
              <span class="dot">·</span>
              <span class="tagline">{{ userProfile.bioTag }}</span>
            </div>
            <p class="profile-bio">{{ userProfile.bio }}</p>
          </div>

          <!-- 頁籤 -->
          <div class="tab-row">
            <!--
              v-for="t in tabs"：這是「迴圈」，意思是「把 tabs 這個陣列
              裡的每一筆資料拿出來，重複畫一次下面這個 <button>」。
              t 就是「這一輪迴圈拿到的那一筆資料」，你可以想像成
              tabs 陣列裡有 4 筆，這個 <button> 就會被畫出 4 次，
              每一次的 t 分別是 tabs[0]、tabs[1]、tabs[2]、tabs[3]。

              :key="t.key"：Vue 規定用 v-for 畫重複元素時，
              一定要給每一個元素一個獨一無二的「身分證字號」(key)，
              這樣 Vue 才能準確知道「哪一個元素改變了、要更新哪一個」，
              不然畫面更新可能會出現奇怪的錯亂。

              :class="{ active: activeTab === t.key }"：
              這是「條件式加 class」的寫法。意思是：
              如果 activeTab（目前選的頁籤）等於這顆按鈕的 t.key，
              就幫這顆按鈕加上 class="active"（讓它顯示成「被選中」的樣子）；
              不符合的話就不加。

              @click="activeTab = t.key"：
              @click 代表「監聽點擊事件」，也就是「使用者點這個按鈕的時候要做什麼」。
              這裡點下去，就把 activeTab 改成這顆按鈕代表的 key，
              畫面下面就會跟著切換顯示對應的內容。
            -->
            <button
              v-for="t in tabs"
              :key="t.key"
              class="tab-btn"
              :class="{ active: activeTab === t.key }"
              @click="activeTab = t.key"
            >{{ t.label }}</button>
          </div>
        </div>
      </div>

      <!--
        穿搭作品牆
        v-if="activeTab === 'works'"：「條件式顯示」，意思是
        「只有當 activeTab 剛好等於 'works' 的時候，才把這一整塊畫出來」，
        不符合條件的話，這塊 HTML 根本不會出現在畫面上（不是隱藏，是完全不畫）。
      -->
      <div v-if="activeTab === 'works'" class="post-grid">
        <!-- 一樣是 v-for 迴圈，把 userPosts 陣列裡每一篇貼文都畫成一張卡片 -->
        <div v-for="post in userPosts" :key="post.communityPostId" class="post-card">

          <!--
            <router-link> 是 Vue Router（負責網址切換的套件）提供的元件，
            功能跟 HTML 原生的 <a> 連結很像，差別是點下去不會整頁重新整理，
            而是在同一個網頁內「偷偷換內容」，速度比較快。
            :to="`/community/post/${post.communityPostId}`" 這種寫法叫做「樣板字串」，
            用反引號 ` ` 包起來，裡面的 ${...} 會被換成實際的變數值，
            例如 post.communityPostId 是 1，網址就會變成 /community/post/1。
          -->
          <router-link :to="`/community/post/${post.communityPostId}`" class="post-media d-block text-decoration-none">
            <!--
              v-if="post.tags[0]"：如果這篇貼文的標籤陣列第一筆存在（不是空的），
              才顯示這個標籤小方塊。
              .replace('#', '')：把字串裡的 '#' 符號換成空字串（也就是刪掉它），
              因為原始資料裡標籤是 "#法式碎花洋裝" 這樣帶 # 的格式，
              這裡顯示的時候想拿掉 #。
            -->
            <span class="tag-label" v-if="post.tags[0]">{{ post.tags[0].replace('#', '') }}</span>
            <img :src="post.image" :alt="post.content" />
          </router-link>

          <div class="post-body">
            <router-link :to="`/community/post/${post.communityPostId}`" class="text-decoration-none">
              <h6 class="post-title">{{ post.content }}</h6>
            </router-link>

            <div class="post-stats">
              <!-- formatCount：把純數字轉成「1.2k」這種縮寫，跟 CommunityView.vue import 進來的是同一個函式 -->
              <span>♥ {{ formatCount(post.likesCount) }}</span>
              <span>💬 {{ formatCount(post.commentsCount) }}</span>
            </div>

            <div class="tag-cloud">
              <!-- 這篇貼文可能有好幾個標籤，所以再用一次 v-for 把每個標籤都畫出來 -->
              <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>

            <!--
              編輯／刪除貼文：只有在「穿搭作品」這個頁籤（自己發的貼文）才會出現，收藏牆那邊不會有；
              另外還要 viewedUserId === currentTestUserId 才顯示——也就是「現在瀏覽的這個人」
              跟「目前登入的我」是同一個人，才代表這是「我自己的」貼文，才能編輯／刪除。
              瀏覽別人的個人頁時，這整塊（包含編輯表單本身）完全不會出現。
            -->
            <template v-if="viewedUserId === currentTestUserId">
              <div v-if="editingPostId === post.communityPostId" class="edit-form">
                <textarea v-model="editForm.content" class="edit-textarea" rows="3"></textarea>

                <!-- 照片編輯：跟 CreatePostView.vue 的縮圖列是同一套邏輯，只是排版比較精簡 -->
                <div class="edit-thumb-row">
                  <div class="edit-thumb-item" v-for="(img, idx) in editForm.images" :key="idx">
                    <img :src="img.url" alt="縮圖" />
                    <button type="button" class="edit-thumb-remove" @click="removeEditImage(idx)">✕</button>
                  </div>
                  <!-- 這個「＋」縮圖也是一個隱藏的檔案上傳框，讓使用者可以再加選照片 -->
                  <label class="edit-thumb-add">
                    <input
                      type="file"
                      class="file-input-hidden"
                      accept="image/*"
                      multiple
                      @change="handleEditFileChange"
                    />
                    ＋
                  </label>
                </div>
                <p class="edit-photo-hint">
                  第一張會作為封面
                </p>

                <div class="edit-visibility">
                  <label><input type="radio" v-model="editForm.status" value="public" /> 公開</label>
                  <label><input type="radio" v-model="editForm.status" value="hide" /> 隱藏</label>
                </div>
                <div class="edit-actions">
                  <button class="btn-cancel-edit" @click="cancelEdit">取消</button>
                  <button class="btn-save-edit" @click="saveEdit(post)">儲存</button>
                </div>
              </div>

              <div v-else class="post-manage-actions">
                <button class="btn-edit-post" @click="startEdit(post)">編輯貼文</button>
                <button class="btn-delete-post" @click="deletePost(post.communityPostId)">刪除貼文</button>
              </div>
            </template>
          </div>

        </div>
      </div>

      <!--
        收藏牆
        v-else-if="activeTab === 'saved'"：接在上面 v-if 後面的「再一個條件」，
        意思是「如果上面 works 那個條件不成立，再檢查看看是不是 'saved'，
        是的話就換畫這一塊」。
        裡面又分兩種情況：
        savedPosts.length（收藏清單裡有東西，長度大於 0）→ 顯示收藏牆（卡片排版跟上面作品牆幾乎一樣）；
        沒有收藏任何貼文 → 顯示一個「還沒收藏」的提示畫面。
      -->
      <div v-else-if="activeTab === 'saved'">
        <div v-if="savedPosts.length" class="post-grid">
          <!-- 這裡的卡片排版跟上面「穿搭作品牆」幾乎一模一樣，差別只是資料來源換成 savedPosts -->
          <div v-for="post in savedPosts" :key="post.communityPostId" class="post-card">
            <router-link :to="`/community/post/${post.communityPostId}`" class="post-media d-block text-decoration-none">
              <span class="tag-label" v-if="post.tags[0]">{{ post.tags[0].replace('#', '') }}</span>
              <img :src="post.image" :alt="post.content" />
            </router-link>

            <div class="post-body">
              <router-link :to="`/community/post/${post.communityPostId}`" class="text-decoration-none">
                <h6 class="post-title">{{ post.content }}</h6>
              </router-link>

              <div class="post-stats">
                <span>♥ {{ formatCount(post.likesCount) }}</span>
                <span>💬 {{ formatCount(post.commentsCount) }}</span>
              </div>

              <div class="tag-cloud">
                <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- v-else（搭配上面裡層的 v-if）：收藏清單是空的時候，顯示這個提示，而不是一片空白 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <i class="fa-solid fa-bookmark" style="color: rgb(122, 75, 84);"></i>
          </div>
          <p class="empty-note">「還沒有收藏任何穿搭，去社群逛逛按個收藏吧。」</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/*
  這個 <style> 標籤有加 scoped，意思是「這裡面寫的 CSS 樣式，
  只會套用在這個檔案自己的 HTML 上」，不會不小心影響到其他頁面的元素。
  Vue 是怎麼做到的？它會偷偷幫這個檔案裡的每個 HTML 元素加上一個
  獨一無二的隱藏屬性（例如 data-v-xxxxx），
  然後把下面每一條 CSS 規則也自動加上同樣的屬性選擇器，
  這樣瀏覽器比對的時候就只會匹配到「這個檔案畫出來的元素」。
*/
.community-page {
  width: 100%;
  min-height: 100vh;
  background-color: #F9F4F0 !important;
  box-sizing: border-box;
  /*
    --cream、--paper 這種用兩個減號開頭的名稱，叫做「CSS 變數」。
    可以把它想成幫顏色取一個好記的名字，之後在其他樣式規則裡
    只要寫 var(--cream) 就能重複使用同一個顏色，
    以後想換色系，只要改這裡一個地方，全部套用到它的樣式都會一起變。
  */
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

/* ---------- 返回社群按鈕 ---------- */
.back-pill{
  display:inline-flex; align-items:center; gap:.3rem;
  border:1px solid var(--ink); border-radius:999px;
  padding:.35rem 1rem; font-size:.82rem; color:var(--ink);
  text-decoration:none; margin-bottom:1.2rem;
  transition:all .18s ease;
}
.back-pill:hover{ background:var(--ink); color:var(--cream); }

/* ---------- 個人檔案卡 ---------- */
.profile-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:22px;
  overflow:hidden;
}

.profile-banner{
  height:150px;
  background:
    repeating-linear-gradient(
      135deg,
      var(--cream) 0px, var(--cream) 22px,
      #F1E6DC 22px, #F1E6DC 44px
    );
  position:relative;
}
.profile-banner::after{
  content:"";
  position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(122,75,84,.08), rgba(122,75,84,0) 60%);
}

.profile-body{ padding:0 2.2rem 1.6rem; position:relative; }

.profile-top{
  display:flex; align-items:flex-end; justify-content:space-between;
  flex-wrap:wrap; gap:1.2rem;
  margin-top:-58px;
}

.avatar-wrapper{
  width:112px; height:112px; border-radius:50%;
  background:var(--paper); padding:5px;
  box-shadow:0 0 0 2px var(--plum);
  flex-shrink:0;
}
.avatar-img{ width:100%; height:100%; border-radius:50%; object-fit:cover; display:block; }

.profile-meta{
  flex:1;
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:1rem;
  padding-bottom:.3rem;
}

.stat-group{ display:flex; gap:2.2rem; }
.stat-item{ text-align:center; }
.stat-num{
  font-family:'Noto Serif TC', serif;
  font-weight:900; font-size:1.25rem; color:var(--ink); line-height:1.1;
}
.stat-label{ font-size:.74rem; color:var(--ink-soft); margin-top:.15rem; }

.action-group{ display:flex; gap:.7rem; }
.btn-follow-main{
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.6rem 1.5rem; font-size:.88rem; font-weight:600;
  transition:background .18s ease, transform .18s ease;
}
.btn-follow-main:hover{ background:var(--plum-deep); transform:translateY(-1px); }
.btn-follow-main.following{ background:var(--hairline); color:var(--ink-soft); }
.btn-follow-main.following:hover{ background:var(--hairline); transform:none; }

.btn-message{
  display:inline-block; text-decoration:none;
  background:transparent; color:var(--ink);
  border:1px solid var(--ink); border-radius:4px;
  padding:.6rem 1.4rem; font-size:.88rem; font-weight:500;
  transition:all .18s ease;
}
.btn-message:hover{ background:var(--ink); color:var(--paper); }

/* ---------- 姓名 / 簡介 ---------- */
.profile-intro{ margin-top:1rem; }
.profile-name{
  font-family:'Noto Serif TC', serif;
  font-weight:900; font-size:1.5rem;
  margin:0 0 .3rem;
  color:var(--ink);
}
.profile-handle{
  font-size:.86rem; color:var(--ink-soft);
  display:flex; align-items:center; gap:.4rem; margin-bottom:.6rem;
}
.profile-handle .dot{ color:var(--hairline); }
.profile-handle .tagline{ color:var(--ochre); font-weight:600; }
.profile-bio{
  font-size:.9rem; color:var(--ink-soft); line-height:1.7;
  max-width:640px; margin:0;
}

/* ---------- 頁籤 ---------- */
.tab-row{
  display:flex; gap:1.8rem;
  border-bottom:1px solid var(--hairline);
  margin-top:1.6rem;
}
.tab-btn{
  background:none; border:none; padding:.8rem 0;
  font-family:'Noto Serif TC', serif;
  font-size:1rem; color:var(--ink-soft);
  position:relative; cursor:pointer;
}
.tab-btn.active{ color:var(--ink); font-weight:700; }
.tab-btn.active::after{
  content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px;
  background:var(--plum);
}

/* ---------- 作品牆 ---------- */
.post-grid{
  display:grid;
  grid-template-columns:repeat(4, 1fr);
  gap:1.4rem;
  margin-top:2rem;
}
.post-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  overflow:hidden;
  transition:transform .25s ease, box-shadow .25s ease;
}
.post-card:hover{
  transform:translateY(-4px) rotate(-0.3deg);
  box-shadow:0 16px 30px -20px rgba(42,36,32,.4);
}

.post-media{ position:relative; aspect-ratio:4/5; overflow:hidden; display:block; background:var(--hairline); }
.post-media img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
.post-card:hover .post-media img{ transform:scale(1.06); }

.tag-label{
  position:absolute; top:12px; left:-6px; z-index:2;
  background:var(--plum); color:#fff;
  font-size:.66rem; letter-spacing:.04em; font-weight:600;
  padding:.26rem .65rem .26rem .9rem;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}
.tag-label::after{
  content:""; position:absolute; left:0; bottom:-6px;
  border-width:0 6px 6px 0; border-style:solid;
  border-color:transparent var(--plum-deep) transparent transparent;
}

.post-body{ padding:.95rem 1rem 1.1rem; }
.post-title{
  font-family:'Noto Serif TC', serif;
  font-weight:700; font-size:.92rem; color:var(--ink);
  margin:0 0 .55rem;
  display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;
}
.post-stats{
  display:flex; align-items:center; gap:.9rem;
  font-size:.76rem; color:var(--ink-soft);
}
.post-stats a{ color:var(--plum); text-decoration:none; font-weight:600; }

.tag-cloud{ display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.7rem; }
.tag-chip{
  font-size:.7rem; padding:.28rem .65rem; border-radius:4px;
  background:var(--cream); border:1px solid var(--hairline); color:var(--ink-soft);
}

.post-manage-actions{ display:flex; gap:.6rem; margin-top:.8rem; }

.btn-edit-post{
  flex:1;
  background:transparent; color:var(--ink);
  border:1px solid var(--ink); border-radius:4px;
  padding:.45rem; font-size:.78rem; font-weight:600;
  transition:all .18s ease;
}
.btn-edit-post:hover{ background:var(--ink); color:var(--paper); }

.btn-delete-post{
  flex:1;
  background:transparent; color:#B4453A;
  border:1px solid #B4453A; border-radius:4px;
  padding:.45rem; font-size:.78rem; font-weight:600;
  transition:all .18s ease;
}
.btn-delete-post:hover{ background:#B4453A; color:#fff; }

.edit-form{ margin-top:.8rem; display:flex; flex-direction:column; gap:.6rem; }
.edit-textarea{
  width:100%;
  border:1px solid var(--hairline); border-radius:4px;
  padding:.6rem .8rem; font-size:.83rem; color:var(--ink);
  font-family:inherit; resize:vertical;
  outline:none;
}
.edit-textarea:focus{ border-color:var(--plum); }
.edit-visibility{ display:flex; gap:1rem; font-size:.8rem; color:var(--ink); }
.edit-visibility label{ display:flex; align-items:center; gap:.35rem; cursor:pointer; }
.edit-actions{ display:flex; gap:.6rem; }

.file-input-hidden{
  position:absolute; opacity:0; width:100%; height:100%;
  top:0; left:0; cursor:pointer;
}
.edit-thumb-row{ display:flex; flex-wrap:wrap; gap:.5rem; }
.edit-thumb-item{
  position:relative;
  width:64px; height:64px; border-radius:6px; overflow:hidden;
  border:1px solid var(--hairline); flex-shrink:0;
}
.edit-thumb-item img{ width:100%; height:100%; object-fit:cover; display:block; }
.edit-thumb-remove{
  position:absolute; top:2px; right:2px;
  width:18px; height:18px; border-radius:50%;
  background:rgba(0,0,0,.6); color:#fff; border:none;
  font-size:.65rem; line-height:1;
  display:flex; align-items:center; justify-content:center;
}
.edit-thumb-add{
  position:relative;
  width:64px; height:64px; border-radius:6px; flex-shrink:0;
  border:1px dashed var(--hairline);
  display:flex; align-items:center; justify-content:center;
  font-size:1.2rem; color:var(--ink-soft); cursor:pointer;
}
.edit-thumb-add:hover{ border-color:var(--plum); color:var(--plum); }
.edit-photo-hint{ font-size:.72rem; color:var(--ink-soft); margin:0; }
.btn-cancel-edit{
  flex:1;
  background:transparent; color:var(--ink-soft);
  border:1px solid var(--hairline); border-radius:4px;
  padding:.45rem; font-size:.78rem;
}
.btn-save-edit{
  flex:1;
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.45rem; font-size:.78rem; font-weight:600;
  transition:background .18s ease;
}
.btn-save-edit:hover{ background:var(--plum-deep); }


/* ---------- 其他頁籤空狀態 ---------- */
.empty-state{
  background:var(--paper); border:1px solid var(--hairline); border-radius:22px;
  padding:3.5rem 2rem; text-align:center; margin-top:2rem;
}
.empty-icon{ font-size:2.2rem; margin-bottom:.8rem; opacity:.7; }
.empty-note{
  font-family:'Noto Serif TC', serif; font-style:italic;
  color:var(--ink-soft); font-size:.95rem; margin:0;
}

/*
  @media (max-width: 991px) { ... } 這種寫法叫做「響應式設計 / RWD」，
  意思是「當瀏覽器視窗寬度小於等於 991px 時，才套用大括號裡的樣式」。
  這樣可以讓網頁在手機、平板、電腦上，自動切換成不同的排版方式。
*/
@media (max-width: 991px){
  .post-grid{ grid-template-columns:repeat(2, 1fr); }
}
@media (max-width: 640px){
  .profile-top{ flex-direction:column; align-items:flex-start; }
  .profile-meta{ width:100%; justify-content:space-between; }
  .post-grid{ grid-template-columns:1fr; }
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