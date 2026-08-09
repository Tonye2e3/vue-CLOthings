<script setup>
import { ref, computed, onMounted } from 'vue'
// useRoute：Vue Router 提供的功能，讓我們可以在 <script> 裡面讀到「目前網址」的資訊，
// 例如網址上帶的動態參數。router/index.js 裡這個頁面對應的路由是
// path: '/community/post/:id'，所以網址上 :id 那一段的值，
// 就是這篇貼文的 communityPostId，要用 useRoute() 才能拿到。
import { useRoute } from 'vue-router'
// axios：打 API 用的套件，跟 CommunityView.vue 裡用的是同一套。
import axios from 'axios'

// 收藏功能共用資料（跟 UserProfileView.vue 共用同一份收藏清單，直接 import 那個檔案）
// savedPosts：目前所有收藏的貼文清單（雖然這裡沒有直接用到它本身，
// 但 isPostSaved 內部會去讀它，所以還是要 import 進來）
// isPostSaved：檢查某篇貼文有沒有被收藏
// toggleSavePost：切換某篇貼文的收藏狀態（收藏／取消收藏）
import { isPostSaved, toggleSavePost } from '@/views/Community/CommunityView.vue'


// 使用 import 引入本地 src/assets 下的圖片
// 這種寫法叫做「靜態資源引入」：因為圖片放在專案的 src 資料夾裡面，
// 不是一個網路上的網址，要用 import 讓建置工具（Vite）知道
// 「這個檔案要打包進網站裡」，import 進來的 postImage 變數，
// 最後會變成一個瀏覽器看得懂的圖片網址，可以直接給 <img :src="..."> 用。
import postImage from '@/assets/Postimage/post2.jpg'

// API_BASE：後端 API 專案的網址，跟 CommunityView.vue 裡用的是同一個。
const API_BASE = 'https://localhost:7255'

// route：呼叫 useRoute() 拿到「目前網址」的資訊物件。
const route = useRoute()

// 貼文詳細資料
// 這是一個很大的物件，裡面用「巢狀」的方式（物件裡面還有物件、陣列）
// 裝著這篇貼文需要的所有資訊。
// 先放一份「載入中」用的預設假資料，避免 API 還沒回來之前畫面整個空白、報錯。
const post = ref({
  communityPostId: null,
  userId: null,
  user: {
    name: '載入中...',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    location: ''
  },
  isFollowing: false,
  postDate: new Date().toISOString(),
  status: 'published',
  images: [
    { postImageId: null, imageFileName: null, sortOrder: 1, url: postImage }
  ],
  content: '',
  commentsCount: 0,
  isLiked: false,
  taggedProducts: []
})

// notFound：如果這個 id 在資料庫裡根本找不到對應的貼文，用這個來控制畫面顯示「找不到這篇貼文」。
const notFound = ref(false)

// fetchPost：向後端要「這一篇」貼文的完整資料。
const fetchPost = async () => {
  // route.params.id：讀出網址上 :id 這段動態參數的值，是字串型別
  // （例如網址是 /community/post/3，這裡拿到的就是 "3"）。
  const id = route.params.id
  try {
    const res = await axios.get(`${API_BASE}/api/CommunityPost/${id}`)

    // 這支 API 找不到資料時，後端是回傳 null（不是觸發 404 錯誤），
    // 所以要自己檢查 res.data 是不是 null，不能只靠 try/catch 判斷。
    if (!res.data) {
      notFound.value = true
      return
    }

    const p = res.data
    post.value = {
      communityPostId: p.communityPostId,
      userId: p.userId,
      user: p.user || { name: '未知使用者', avatar: '', location: '' },
      isFollowing: false, // API 目前沒有回傳「我有沒有追蹤這個人」，先預設沒有追蹤
      postDate: p.postDate,
      status: p.status,
      images: (p.images && p.images.length)
        ? p.images.map(img => ({
            postImageId: img.postImageId,
            imageFileName: img.imageFileName,
            sortOrder: img.sortOrder,
            // imageFileName 本身已經帶路徑了（例如 "/images/posts/post01_1.jpg"），
            // 直接接在 API_BASE 後面組成完整網址，跟 CommunityView.vue 的做法一樣。
            url: `${API_BASE}${img.imageFileName}`
          }))
        : [{ postImageId: null, imageFileName: null, sortOrder: 1, url: postImage }], // 完全沒有圖片時的保底畫面
      content: p.content,
      commentsCount: p.commentsCount ?? 0,
      isLiked: false,
      taggedProducts: p.taggedProducts || []
    }
    // 讚數也要跟著這篇貼文真正的數字重設，不能繼續用寫死的 1248。
    // ?? 0：如果 p.likesCount 是 undefined 或 null，就用 0 代替，
    // 避免後端這個欄位漏帶或叫別的名字時，讓 likesNumber 變成 undefined 把整頁弄壞。
    likesNumber.value = p.likesCount ?? 0
  } catch (err) {
    console.error('讀取貼文詳細資料失敗：', err)
    notFound.value = true
  }
}

// onMounted：頁面一打開，就照網址上的 id 去後端要這篇貼文的完整資料，同時也要這篇貼文的留言。
onMounted(() => {
  fetchPost()
  fetchComments()
})

// postTimeAgo：把 post.postDate 這個正式時間，轉換成「N 小時前」這種給人看的相對時間文字。
// 之後接上真的 API，這個計算方式不用變，只是 postDate 會是後端真正回傳的發文時間。
const postTimeAgo = computed(() => {
  const diffMs = Date.now() - new Date(post.value.postDate).getTime()
  const diffHours = Math.round(diffMs / (60 * 60 * 1000))
  if (diffHours < 1) return '剛剛'
  if (diffHours < 24) return `${diffHours} 小時前`
  return `${Math.round(diffHours / 24)} 天前`
})

// 按讚數改用數字追蹤，方便按讚時 +1、取消時 -1；畫面顯示再轉成千分位字串
// likesNumber：存「真正的數字」，方便計算加減。
const likesNumber = ref(1248) // 對應原本的 '1,248'
// likesDisplay：一個 computed，把 likesNumber 這個純數字，
// 轉換成「1,248」這種每三位數加一個逗號的格式，給畫面顯示用。
// .toLocaleString()：JavaScript 數字內建的方法，會依照使用者瀏覽器的地區設定，
// 自動幫數字加上千分位逗號。
const likesDisplay = computed(() => likesNumber.value.toLocaleString())

// toggleLike：按下愛心按鈕時執行。
const toggleLike = () => {
  post.value.isLiked = !post.value.isLiked // 先把「有沒有按讚」的狀態反過來
  // 如果現在是「已按讚」狀態，就 +1；如果是「取消讚」，就 -1
  // 條件 ? A : B 這種寫法叫三元運算子：條件成立回傳 A，不成立回傳 B。
  likesNumber.value += post.value.isLiked ? 1 : -1
}

// isSaved：這篇貼文現在有沒有被收藏。
// 用 computed 從共用的收藏清單即時判斷（呼叫 CommunityView.vue 提供的 isPostSaved），
// 而不是自己在這裡存一份 true/false，這樣不管使用者是從哪個頁面把貼文收藏／取消收藏，
// 這裡都會自動顯示正確的狀態。
const isSaved = computed(() => isPostSaved(post.value.communityPostId))

// toggleSave：按下收藏按鈕時執行。
const toggleSave = () => {
  // 把這篇貼文整理成 UserProfileView.vue 收藏牆看得懂的格式
  // （欄位名稱對照 Community_Favorite + Community_Post：communityPostId、content、image、
  // likesCount、commentsCount、tags），再呼叫 toggleSavePost 去新增或移除。
  toggleSavePost({
    communityPostId: post.value.communityPostId,
    content: post.value.content,
    image: post.value.images[0]?.url,
    likesCount: likesNumber.value,
    commentsCount: post.value.commentsCount,
    // .map(...)：把 taggedProducts 陣列裡每個標記物件，轉換成 "#商品名" 這種字串格式
    tags: post.value.taggedProducts.map(t => `#${t.name}`)
  })
}

// 這套穿搭的商品清單（右側欄要顯示的可購買商品）
// productId／productRoute：對應資料庫 Post_Tagged_Products 真正存的欄位。
const products = ref([
  {
    productId: 101,
    name: '奶油白V領針織上衣',
    price: '690',
    image: 'https://i.pinimg.com/1200x/dc/94/75/dc9475c6d350370bcf6c471e3ee6d6fb.jpg',
    productRoute: '/shop/product/101'
  },
  {
    productId: 102,
    name: '高腰垂墜寬褲 (卡其)',
    price: '890',
    image: 'https://i.pinimg.com/1200x/f3/dd/f4/f3ddf4c34ff005240958bddb9a8080d0.jpg',
    productRoute: '/shop/product/102'
  },
  {
    productId: 103,
    name: '復古麻編單肩托特包',
    price: '680',
    image: 'https://i.pinimg.com/736x/f2/cf/7b/f2cf7b273ca7445dce8800f855051f93.jpg',
    productRoute: '/shop/product/103'
  }
])

// findProductRoute：拿貼文標記商品的 productId，去 products 清單裡找同一個 productId 的商品，
// 回傳它的 productRoute。找不到（例如標記了一個已下架的商品）就回傳 '#'，
// 這樣連結還是有東西可以點，不會整個報錯。
const findProductRoute = (productId) => {
  const matched = products.value.find(p => p.productId === productId)
  return matched ? matched.productRoute : '#'
}

// 相似穿搭推薦
const similarPosts = ref([
  { id: 1, image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { id: 2, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=80' },
  { id: 3, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80' }
])

// 留言列表：等 fetchComments() 打完 API 才會有資料，先給空陣列避免顯示假留言。
// 欄位對照 Post_Comment 表：postCommentId、parentCommentId（回覆留言用，parentCommentId
// 有值代表這則是在回覆某一則留言）、commentText、commentDate，user／avatar 是後端 join User 表組出來的。
const comments = ref([])

// groupedComments：把後端回來的「一維陣列」，依 parentCommentId 整理成
// 「主留言 + 底下往內縮的回覆」這種巢狀結構，跟 IG 留言區的呈現方式一樣。
// parentCommentId 是 null（或沒有值）的是主留言，parentCommentId 指到誰，
// 就代表這則是在回覆那一則留言。
const groupedComments = computed(() => {
  const topLevel = comments.value.filter(c => !c.parentCommentId)
  return topLevel.map(c => ({
    ...c,
    replies: comments.value
      .filter(r => r.parentCommentId === c.postCommentId)
      // 回覆本身照留言時間「舊到新」排，符合對話的閱讀順序（跟主留言新到舊的排序方向相反）
      .sort((a, b) => new Date(a.commentDate) - new Date(b.commentDate))
  }))
})

// replyingTo：目前正在回覆哪一則留言。null 代表現在是要發「新的主留言」，
// 有值的話代表輸入框上面會出現「回覆 @xxx」的提示，送出時會帶上 parentCommentId。
const replyingTo = ref(null)

// startReply：點某則留言的「回覆」按鈕時執行，把輸入框切換成「回覆這則留言」的模式。
const startReply = (comment) => {
  replyingTo.value = comment
}

// cancelReply：取消回覆，輸入框切回「發新留言」的模式。
const cancelReply = () => {
  replyingTo.value = null
}

// fetchComments：跟後端要「這篇貼文底下的所有留言」，
// 打的是 PostCommentController.cs 裡的 GET api/PostComment/post/{communitypostid}。
const fetchComments = async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/PostComment/post/${route.params.id}`)
    comments.value = res.data
  } catch (err) {
    console.error('讀取留言失敗：', err)
  }
}

// newComment：跟留言輸入框做雙向綁定，存使用者「正在打字、還沒送出」的留言內容
const newComment = ref('')

const toggleFollow = () => {
  post.value.isFollowing = !post.value.isFollowing
}

// addComment：按下「送出」按鈕或在輸入框按 Enter 時執行。
// 改成 async，因為裡面要 await 打 API。
const addComment = async () => {
  // .trim()：去掉文字前後的空白。如果去掉空白後是空字串，代表使用者其實沒打字，
  // 直接 return（提早結束函式），不新增這則空白留言。
  if (!newComment.value.trim()) return

  try {
    await axios.post(`${API_BASE}/api/PostComment`, {
      // replyingTo 有值代表現在是在回覆某一則留言，parentCommentId 就帶那則留言的 id；
      // 沒有值（一般發新留言）就帶 null。
      parentCommentId: replyingTo.value ? replyingTo.value.postCommentId : null,
      communityPostId: post.value.communityPostId,
      userId: 1, // TODO: 之後接上真的登入系統，這裡要換成登入者的 user_id（先用測試帳號頂著，跟 CreatePostView.vue 一致）
      commentText: newComment.value
    })
  } catch (err) {
    console.error('送出留言失敗：', err)
    alert('留言失敗，請稍後再試一次！')
    return
  }

  newComment.value = '' // 送出後把輸入框清空，方便使用者繼續打下一則留言
  replyingTo.value = null // 送出後回到「發新留言」模式，不用使用者自己按取消
  post.value.commentsCount += 1 // 留言數 +1，跟按讚數那邊 likesNumber 的處理方式一樣，先讓畫面立刻反應
  fetchComments() // 重新跟後端要一次留言列表，這樣剛送出的留言才會有資料庫真正給的 postCommentId、commentDate、user、avatar
}
</script>

<template>
  

  <div class="community-page min-vh-100 w-100">
    

    <div class="container-fluid container-lg pb-5 pt-4">

      <!--
        返回社群按鈕：跟 CreatePostView.vue 的 back-pill 是同一顆按鈕、同一套樣式，
        統一放在頁面內容最上面，讓使用者不管是從「發文頁」還是「貼文詳細頁」，
        都能用同樣的方式一鍵回到社群列表，不用一直靠瀏覽器的上一頁。
      -->
      <router-link to="/community" class="back-pill">← 返回社群</router-link>

      <!--
        notFound：如果網址上的 id 在資料庫裡找不到對應的貼文（例如網址被亂改、
        或貼文已經被刪除），就顯示這個提示，不要繼續顯示「載入中...」那份假資料。
      -->
      <div v-if="notFound" class="not-found-state">
        <p>找不到這篇貼文，可能已經被刪除，或網址不正確。</p>
        <router-link to="/community" class="back-pill">← 返回社群</router-link>
      </div>

      <div class="row g-4" v-else>

        <!-- 左側：貼文主體區 (大圖、內文、互動、留言) -->
        <div class="col-12 col-lg-8">
          <div class="post-main-card">

           <!-- 發文者資訊列 -->
            <div class="author-bar">
              <!--
                把大頭貼跟名字包進 <router-link>，讓它可以點擊跳轉。
                to="/community/profile"：這是我們專案裡「個人檔案頁」(UserProfileView.vue) 對應的網址，
                跟 CommunityView.vue 側欄「熱門穿搭達人」點頭像時用的是同一個網址，
                點下去就會切換到 UserProfileView.vue 那個頁面。
                class="text-decoration-none"：Bootstrap 的工具 class，把 <a> 連結預設的底線拿掉。
              -->
              <router-link to="/community/profile" class="author-info text-decoration-none">
                <img :src="post.user.avatar" class="author-avatar" alt="avatar" />
                <div>
                  <h6 class="author-name">{{ post.user.name }}</h6>
                  <!-- postTimeAgo：上面 script 用 postDate 算出來的「N 小時前」文字 -->
                  <small class="author-meta">{{ postTimeAgo }} · {{ post.user.location }}</small>
                </div>
              </router-link>
              <button
                class="btn-follow-main"
                :class="{ following: post.isFollowing }"
                @click="toggleFollow"
              >
                {{ post.isFollowing ? '已追蹤' : '＋ 追蹤' }}
              </button>
            </div>

            <!-- 主圖（拿掉了浮在照片上的定位標籤，因為資料庫沒有存座標） -->
            <div class="post-media">
              <span class="tag-label" v-if="post.taggedProducts[0]">封面故事</span>
              <!-- images 是陣列（對應 Post_Images），這裡固定顯示第一張 -->
              <img :src="post.images[0]?.url" class="post-image" alt="post image" />
            </div>

            <!-- 按讚/分享/收藏 動作列 -->
            <div class="action-bar">
              <div class="action-left">
                <!--
                  :class="{ liked: post.isLiked }"：
                  如果 isLiked 是 true，就加上 liked 這個 class（讓按鈕變成紅色強調的樣子）。
                  @click="toggleLike"：點下去執行上面 script 定義的 toggleLike 函式。
                -->
                <button class="action-btn" :class="{ liked: post.isLiked }" @click="toggleLike">
                  ♥ {{ likesDisplay }}
                </button>
                <button class="action-btn">
                  💬 {{ post.commentsCount }}
                </button>
                <button class="action-btn">
                  ↗ 分享
                </button>
              </div>
              <!--
                收藏按鈕：
                @click="toggleSave"：呼叫上面 script 定義的 toggleSave 函式，
                這個函式會去更新「共用的收藏清單」，而不是只改這個頁面自己的一個變數，
                這樣 UserProfileView.vue 的收藏頁籤才看得到剛剛收藏的貼文。
                :class="{ saved: isSaved }" 跟 <i> 裡的 isSaved，
                都是讀上面那個 computed，會自動反映「這篇貼文現在是不是在收藏清單裡」。
                <i :class="['fa-bookmark', isSaved ? 'fa-solid' : 'fa-regular']">：
                這裡的 :class 綁定的是一個「陣列」，陣列裡每一項都會變成一個 class。
                'fa-bookmark' 固定會加上；第二項用三元運算子決定，
                如果已收藏，用實心的 fa-solid 樣式圖示；還沒收藏，用空心的 fa-regular 樣式圖示，
                點一下就能明顯看到書籤圖示「被收起來」的視覺變化。
              -->
              <button class="action-btn" :class="{ saved: isSaved }" @click="toggleSave">
                <i :class="['fa-bookmark', isSaved ? 'fa-solid' : 'fa-regular']"></i>
                {{ isSaved ? '已收藏' : '收藏' }}
              </button>
            </div>

            <!-- 貼文文字描述 -->
            <p class="post-content">{{ post.content }}</p>

            <!--
              標記商品：原本是浮在照片上的定位標籤，現在改成貼文下方的一排標籤。
              v-if="post.taggedProducts.length"：陣列裡有東西才顯示這一整塊。
              這裡先用 <span> 不用 <a>：因為現在是要給老師看前台畫面，
              productRoute 目前只是假的路徑（例如 /shop/product/101），
              真的點下去會導到不存在的頁面，demo 階段先不要讓它跳轉，
              只保留視覺樣式（看起來像標籤）。之後商城的商品頁做好、
              productRoute 是真的網址時，把 <span> 換回 <a :href="findProductRoute(tag.productId)">
              就可以了，findProductRoute 這個函式邏輯已經寫好、留著沒動。
            -->
            <div class="tagged-products" v-if="post.taggedProducts.length">
              <span class="tagged-label">標記商品</span>
              <div class="tag-cloud">
                <span
                  v-for="tag in post.taggedProducts"
                  :key="tag.postTaggedProductId"
                  class="tag-chip"
                >#{{ tag.name }}</span>
              </div>
            </div>

            <!-- 留言區塊 -->
            <div class="comment-block">
              <div class="comment-title">
                <span class="dot"></span>留言
              </div>

              <div class="comments-list">
                <!-- v-for="c in groupedComments"：只跑主留言，每則主留言底下再跑一次 c.replies 畫出它的回覆 -->
                <div v-for="c in groupedComments" :key="c.postCommentId" class="comment-thread">
                  <div class="comment-row">
                    <img :src="c.avatar" class="comment-avatar" alt="avatar" />
                    <div class="comment-bubble">
                      <span class="comment-user">{{ c.user }}</span>
                      <span>{{ c.commentText }}</span>
                      <button class="btn-reply" @click="startReply(c)">回覆</button>
                      <!-- 有人回覆過這則留言時，顯示「已回覆 N 則」，跟 IG 一樣讓人知道底下有討論 -->
                      <span v-if="c.replies.length" class="reply-count">已回覆 {{ c.replies.length }} 則</span>
                    </div>
                  </div>

                  <!-- 回覆列表：往內縮排（class="comment-reply"），跟 IG 留言底下的回覆呈現方式一樣 -->
                  <div v-for="r in c.replies" :key="r.postCommentId" class="comment-row comment-reply">
                    <img :src="r.avatar" class="comment-avatar" alt="avatar" />
                    <div class="comment-bubble">
                      <span class="comment-user">{{ r.user }}</span>
                      <span>{{ r.commentText }}</span>
                      <button class="btn-reply" @click="startReply(c)">回覆</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 正在回覆某則留言時的提示：顯示「回覆 @xxx」，可以按 ✕ 取消、切回發新留言 -->
              <div v-if="replyingTo" class="replying-to-row">
                回覆 <strong>@{{ replyingTo.user }}</strong>
                <button class="btn-cancel-reply" @click="cancelReply">✕</button>
              </div>

              <!-- 輸入留言 -->
              <div class="comment-input-row">
                <!--
                  @keyup.enter="addComment"：
                  監聽「鍵盤按鍵放開」這個事件，.enter 是修飾符，
                  代表「只有放開的是 Enter 鍵才觸發」，
                  這樣使用者打完留言按 Enter 就能直接送出，不用一定要滑鼠點送出按鈕。
                -->
                <input
                  type="text"
                  v-model="newComment"
                  class="comment-input"
                  :placeholder="replyingTo ? `回覆 @${replyingTo.user}...` : '留下你的想法...'"
                  @keyup.enter="addComment"
                />
                <button class="btn-send" @click="addComment">送出</button>
              </div>
            </div>

          </div>
        </div>

        <!-- 右側：這套穿搭的商品與推薦區 -->
        <div class="col-12 col-lg-4">

          <!-- 穿搭商品清單 -->
          <div class="side-card">
            <div class="side-title"><span class="dot"></span>這套穿搭的商品</div>

            <div class="product-list">
              <div v-for="item in products" :key="item.productId" class="product-row">
                <!--
                  product-link：把圖片＋商品資訊包成一個區塊，之後接上真的
                  商品頁時可以換回 <a :href="item.productRoute">，
                  現在先用 <div> 不會跳轉，只是給老師看畫面用，
                  跟旁邊「加入購物車」按鈕分開（按鈕還是純粹的按鈕）。
                -->
                <div class="product-link">
                  <img :src="item.image" class="product-thumb" alt="product" />
                  <div class="product-info">
                    <p class="product-name">{{ item.name }}</p>
                    <p class="product-price">NT$ {{ item.price }}</p>
                  </div>
                </div>
                <button class="btn-cart">加入購物車</button>
              </div>
            </div>

            <button class="btn-buy-all">
              一鍵購買全套穿搭 · NT$ 2,860
            </button>
          </div>

          <!-- 相似穿搭推薦 -->
          <div class="side-card">
            <div class="side-title"><span class="dot"></span>相似穿搭推薦</div>
            <div class="similar-grid">
              <div v-for="sim in similarPosts" :key="sim.id" class="similar-thumb">
                <img :src="sim.image" alt="similar look" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
.community-page {
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

/* ---------- 返回社群按鈕 ---------- */
.back-pill{
  display:inline-flex; align-items:center; gap:.3rem;
  border:1px solid var(--ink); border-radius:999px;
  padding:.35rem 1rem; font-size:.82rem; color:var(--ink);
  text-decoration:none; margin-bottom:1.2rem;
  transition:all .18s ease;
}
.back-pill:hover{ background:var(--ink); color:var(--cream); }

/* ---------- 找不到貼文 ---------- */
.not-found-state{
  background:var(--paper); border:1px dashed var(--hairline); border-radius:16px;
  padding:3rem 2rem; text-align:center; color:var(--ink-soft);
}
.not-found-state p{ margin-bottom:1rem; }

/* ---------- 主卡片 ---------- */
.post-main-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  padding:1.6rem;
}

/* ---------- 發文者列 ---------- */
.author-bar{
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:1.2rem;
}
.author-info{ display:flex; align-items:center; gap:.8rem; }
.author-avatar{
  width:48px; height:48px; border-radius:50%; object-fit:cover;
  box-shadow:0 0 0 2px var(--plum);
}
.author-name{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:.98rem;
  margin:0; color:var(--ink);
}
.author-meta{ font-size:.78rem; color:var(--ink-soft); }

.btn-follow-main{
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.5rem 1.3rem; font-size:.84rem; font-weight:600;
  transition:background .18s ease, transform .18s ease;
}
.btn-follow-main:hover{ background:var(--plum-deep); transform:translateY(-1px); }
.btn-follow-main.following{ background:var(--hairline); color:var(--ink-soft); }
.btn-follow-main.following:hover{ background:var(--hairline); transform:none; }

/* ---------- 主圖 ---------- */
.post-media{
  position:relative;
  border-radius:8px;
  overflow:hidden;
  background:var(--cream);
  margin-bottom:1.1rem;
}
.post-image{
  width:100%; height:550px; object-fit:contain;
  display:block; background:var(--paper);
}

.tag-label{
  position:absolute; top:16px; left:-6px; z-index:2;
  background:var(--plum); color:#fff;
  font-size:.7rem; letter-spacing:.05em; font-weight:600;
  padding:.3rem .75rem .3rem 1rem;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}
.tag-label::after{
  content:""; position:absolute; left:0; bottom:-6px;
  border-width:0 6px 6px 0; border-style:solid;
  border-color:transparent var(--plum-deep) transparent transparent;
}

/* ---------- 互動列 ---------- */
.action-bar{
  display:flex; align-items:center; justify-content:space-between;
  padding:.7rem 0;
  border-top:1px solid var(--hairline);
  border-bottom:1px solid var(--hairline);
  margin-bottom:1.2rem;
}
.action-left{ display:flex; gap:1.6rem; }
.action-btn{
  background:none; border:none; padding:0;
  font-size:.88rem; color:var(--ink-soft);
  transition:color .18s ease;
  display:inline-flex; align-items:center; gap:.4rem;
}
.action-btn:hover{ color:var(--ink); }
.action-btn.liked{ color:#B4453A; font-weight:600; }
.action-btn.saved{ color:var(--ochre); font-weight:600; }

/* ---------- 內文 ---------- */
.post-content{
  font-size:.94rem; line-height:1.8; color:var(--ink);
  margin-bottom:1.2rem;
}

/* ---------- 標記商品（貼文下方） ---------- */
.tagged-products{
  display:flex; align-items:center; flex-wrap:wrap; gap:.7rem;
  margin-bottom:1.6rem;
}
.tagged-label{
  font-size:.8rem; color:var(--ink-soft); font-weight:600; flex-shrink:0;
}
.tagged-products .tag-cloud{ display:flex; flex-wrap:wrap; gap:.5rem; }
.tagged-products .tag-chip{
  font-size:.78rem; padding:.32rem .8rem; border-radius:999px;
  background:var(--cream); border:1px solid var(--hairline); color:var(--plum);
  text-decoration:none; font-weight:600;
  transition:all .18s ease;
}
.tagged-products .tag-chip:hover{ border-color:var(--plum); background:var(--paper); }

/* ---------- 留言區 ---------- */
.comment-block{
  background:var(--cream);
  border-radius:8px;
  padding:1.3rem;
}
.comment-title{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:.95rem;
  display:flex; align-items:center; gap:.5rem;
  margin-bottom:1rem; color:var(--ink);
}
.comment-title .dot, .side-title .dot{
  width:6px; height:6px; border-radius:50%; background:var(--ochre);
}

.comments-list{ display:flex; flex-direction:column; gap:1rem; margin-bottom:1.1rem; }
.comment-thread{ display:flex; flex-direction:column; gap:.5rem; }
.comment-row{ display:flex; align-items:flex-start; gap:.6rem; }
.comment-row.comment-reply{ margin-left:2.4rem; } /* 往內縮排，跟 IG 的回覆呈現方式一樣 */
.comment-avatar{ width:28px; height:28px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.comment-bubble{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:4px;
  padding:.55rem .9rem;
  font-size:.85rem; color:var(--ink);
  width:100%;
  display:flex; align-items:baseline; flex-wrap:wrap; gap:.4rem;
}
.comment-user{ font-weight:700; margin-right:.1rem; }
.btn-reply{
  background:none; border:none; padding:0;
  font-size:.78rem; color:var(--ink-soft); cursor:pointer;
  margin-left:auto; flex-shrink:0;
}
.btn-reply:hover{ color:var(--plum); }
.reply-count{ font-size:.76rem; color:var(--ochre); font-weight:600; width:100%; }

.replying-to-row{
  display:flex; align-items:center; gap:.5rem;
  font-size:.8rem; color:var(--ink-soft);
  margin-bottom:.5rem;
}
.btn-cancel-reply{
  border:none; background:var(--hairline); color:var(--ink-soft);
  width:18px; height:18px; border-radius:50%;
  font-size:.68rem; line-height:1;
  display:flex; align-items:center; justify-content:center;
  transition:background .18s ease,color .18s ease;
}
.btn-cancel-reply:hover{ background:var(--plum); color:#fff; }

.comment-input-row{ display:flex; gap:.6rem; }
.comment-input{
  flex:1;
  border:1px solid var(--hairline);
  background:var(--paper);
  border-radius:4px;
  padding:.6rem 1rem;
  font-size:.86rem; color:var(--ink);
  outline:none;
  transition:border-color .18s ease;
}
.comment-input:focus{ border-color:var(--plum); }
.comment-input::placeholder{ color:var(--ink-soft); }
.btn-send{
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.6rem 1.4rem; font-size:.85rem; font-weight:600;
  white-space:nowrap;
  transition:background .18s ease;
}
.btn-send:hover{ background:var(--plum-deep); }

/* ---------- 側邊欄 ---------- */
.side-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  padding:1.4rem 1.3rem;
  margin-bottom:1.5rem;
}
.side-title{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:1.02rem;
  display:flex; align-items:center; gap:.5rem;
  margin-bottom:1.1rem; color:var(--ink);
}

.product-list{ display:flex; flex-direction:column; gap:.8rem; margin-bottom:1.2rem; }
.product-row{
  display:flex; align-items:center; gap:.7rem;
  background:var(--cream);
  border-radius:8px;
  padding:.55rem;
}
/*
  product-link 把圖片跟文字包在一起排成一列（目前是 <div>，不是連結，
  這幾行 color/text-decoration 先留著，之後如果換回 <a> 標籤，
  樣式不用再調）；flex:1 讓它撐滿按鈕以外的空間，min-width:0 避免文字太長把版面撐壞。
*/
.product-link{
  display:flex; align-items:center; gap:.7rem;
  flex:1; min-width:0;
  color:inherit; text-decoration:none;
}
.product-thumb{ width:56px; height:56px; border-radius:6px; object-fit:cover; flex-shrink:0; }
.product-info{ flex:1; min-width:0; }
.product-name{
  font-size:.83rem; font-weight:700; color:var(--ink);
  margin:0 0 .2rem;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.product-price{ font-size:.8rem; color:var(--ochre); font-weight:600; margin:0; }
.btn-cart{
  background:transparent; color:var(--ink);
  border:1px solid var(--ink); border-radius:4px;
  padding:.35rem .8rem; font-size:.74rem; white-space:nowrap;
  transition:all .18s ease;
  flex-shrink:0;
}
.btn-cart:hover{ background:var(--ink); color:var(--paper); }

.btn-buy-all{
  width:100%;
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.75rem; font-size:.88rem; font-weight:600;
  transition:background .18s ease;
}
.btn-buy-all:hover{ background:var(--plum-deep); }

.similar-grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:.6rem; }
.similar-thumb{
  aspect-ratio:3/4; border-radius:6px; overflow:hidden;
  background:var(--cream);
  cursor:pointer;
}
.similar-thumb img{
  width:100%; height:100%; object-fit:cover;
  transition:transform .3s ease;
}
.similar-thumb:hover img{ transform:scale(1.06); }

@media (max-width: 767px){
  .post-image{ height:380px; }
  .post-main-card{ padding:1.1rem; }
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