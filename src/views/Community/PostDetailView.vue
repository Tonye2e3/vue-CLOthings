<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
// useRoute：Vue Router 提供的功能，讓我們可以在 <script> 裡面讀到「目前網址」的資訊，
// 例如網址上帶的動態參數。router/index.js 裡這個頁面對應的路由是
// path: '/community/post/:id'，所以網址上 :id 那一段的值，
// 就是這篇貼文的 communityPostId，要用 useRoute() 才能拿到。
import { useRoute } from 'vue-router'
// api：跟其他頁面共用同一個 axios 實例（src/services/api.js），會自動把登入後的 JWT
// token 帶進 Authorization header，跟直接 import axios from 'axios' 不一樣。
import api from '@/services/api'

// IconFacebook、IconLine：分享選單裡「分享到 Facebook／LINE」原本是用 Font Awesome
// 的品牌圖示（<i class="fa-brands fa-facebook">），改成專案裡自己準備的 SVG 圖示元件
// （src/components/icons/），畫面上其他地方（例如頁尾社群連結）也是用同一套元件，
// 統一起來風格才會一致，也不用再依賴外部 CDN 載入 Font Awesome 的品牌圖示子集。
import IconFacebook from '@/components/icons/IconFacebook.vue'
import IconLine from '@/components/icons/IconLine.vue'
// animate：anime.js v4 的動畫函式，這裡用來讓按讚愛心在點下去的瞬間做一個「彈跳」效果，
// 跟 CommunityView.vue 貼文卡片的進場動畫是同一個套件、同一套用法。
import { animate } from 'animejs'

// 收藏功能共用資料（跟 UserProfileView.vue 共用同一份收藏清單，直接 import 那個檔案）
// savedPosts：目前所有收藏的貼文清單（雖然這裡沒有直接用到它本身，
// 但 isPostSaved 內部會去讀它，所以還是要 import 進來）
// isPostSaved：檢查某篇貼文有沒有被收藏
// toggleSavePost：切換某篇貼文的收藏狀態（收藏／取消收藏）
import { isPostSaved, toggleSavePost, currentUserId, loadCurrentUserId } from '@/views/Community/CommunityView.vue'


// 使用 import 引入本地 src/assets 下的圖片
// 這種寫法叫做「靜態資源引入」：因為圖片放在專案的 src 資料夾裡面，
// 不是一個網路上的網址，要用 import 讓建置工具（Vite）知道
// 「這個檔案要打包進網站裡」，import 進來的 postImage 變數，
// 最後會變成一個瀏覽器看得懂的圖片網址，可以直接給 <img :src="..."> 用。
import postImage from '@/assets/Postimage/post2.jpg'

// IMAGE_BASE：圖片是靜態檔案，走的不是 /api 這條路徑，不能直接用 api 服務的
// baseURL（那個含 /api）。這裡把 VITE_API_URL 尾巴的 /api 拿掉，變成純網域。
const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

// currentUserId：目前登入者真正的 userId，跟 CommunityView.vue 共用同一份（import 進來的），
// 不用自己再打一次 /User/me。

// route：呼叫 useRoute() 拿到「目前網址」的資訊物件。
const route = useRoute()

// onAvatarError：大頭貼圖片載入失敗時執行（例如資料庫存的路徑指到 wwwroot 裡
// 實際上還沒有的檔案），失敗時把圖片來源換成 dicebear 產生的預設頭像，
// 跟 CommunityView.vue 的 onAvatarError 是同一套邏輯。
const onAvatarError = (event, name) => {
  // 用「換過的網址是不是已經是預設圖」來判斷要不要再換一次，而不是用一個存在
  // DOM 元素上的旗標（dataset.fallback）——原因跟 CommunityView.vue 的
  // onAvatarError 註解一樣：這種寫法在「單一、被重複使用」的欄位上會有問題
  // （例如這個檔案的發文者大頭貼，換到另一篇貼文時 Vue 只會更新同一個 <img> 的 src），
  // 舊旗標可能卡住新資料的備援。改成比對「現在這個網址是不是已經是預設圖網址」，
  // 就不會有這種問題。
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
  if (event.target.src === fallbackUrl) return
  event.target.src = fallbackUrl
}

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

// postLoading：貼文完整資料還沒抓回來之前是 true，畫面用這個顯示骨架佔位畫面，
// 跟 CommunityView.vue 動態牆的骨架畫面是同一套做法。
const postLoading = ref(true)

// currentImageIndex：主圖輪播現在顯示 post.images 裡的第幾張（從 0 開始算）。
// 每次換到新的一篇貼文時要記得歸零，不然會出現「這篇貼文明明只有 1 張圖，
// 卻想顯示上一篇貼文停在的第 3 張」這種指到不存在的索引的情況。
const currentImageIndex = ref(0)

// prevImage／nextImage：按輪播箭頭時執行。
// % post.value.images.length：取餘數，讓索引超過最後一張時自動繞回第一張，
// 索引小於 0 時（在第一張按「上一張」）也用同樣的算法繞到最後一張。
const prevImage = () => {
  const len = post.value.images.length
  currentImageIndex.value = (currentImageIndex.value - 1 + len) % len
  restartAutoplay() // 使用者自己手動切過圖了，計時器重新算，不然可能手動切完馬上又被自動播放跳走
}
const nextImage = () => {
  const len = post.value.images.length
  currentImageIndex.value = (currentImageIndex.value + 1) % len
  restartAutoplay()
}

// ============================================================
// 主圖自動輪播：不用一直手動點箭頭，超過 1 張照片時會每隔幾秒自動切下一張。
// ============================================================

const AUTOPLAY_INTERVAL = 4000 // 每 4 秒切一張
let autoplayTimer = null

// stopAutoplay：把目前的計時器停掉並清乾淨。每次要重新啟動之前都要先呼叫這個，
// 不然舊的計時器沒清掉、又設了一個新的，會變成同時有兩個計時器同時在跑，
// 圖片會跳得比預期快兩倍。
const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

// startAutoplay：只有超過 1 張照片時才需要自動播放（只有 1 張的話，
// 切來切去都是同一張，設計時器只是白白浪費資源）。
const startAutoplay = () => {
  stopAutoplay()
  if (post.value.images.length <= 1) return
  autoplayTimer = setInterval(() => {
    const len = post.value.images.length
    currentImageIndex.value = (currentImageIndex.value + 1) % len
  }, AUTOPLAY_INTERVAL)
}

// restartAutoplay：使用者自己按了箭頭或點了圓點手動切圖時呼叫，
// 把計時器重新算一次——不然使用者才剛手動切到某一張，計時器可能下一秒就到了，
// 畫面又自動跳走，體感上會覺得「我明明剛剛才選了這張」。
const restartAutoplay = () => {
  startAutoplay()
}

const fetchPost = async () => {
  // route.params.id：讀出網址上 :id 這段動態參數的值，是字串型別
  // （例如網址是 /community/post/3，這裡拿到的就是 "3"）。
  const id = route.params.id
  postLoading.value = true
  try {
    const res = await api.get(`/CommunityPost/${id}`)

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
      // p.user.avatar 後端存的是相對路徑（例如 /avatars/user002.png），要接上 IMAGE_BASE
      // 才是瀏覽器看得懂的完整網址，跟貼文圖片、商品圖片是同一種處理方式。
      // 沒有設大頭貼的人（avatar 是 null）就用預設的頭像頂著，不要顯示破圖。
      user: p.user
        ? { ...p.user, avatar: p.user.avatar ? `${IMAGE_BASE}${p.user.avatar}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.user.name }
        : { name: '未知使用者', avatar: '', location: '' },
      isFollowing: false, // 先給預設值，實際有沒有追蹤過由下面 fetchFollowStatus() 另外去問後端才知道
      postDate: p.postDate,
      status: p.status,
      images: (p.images && p.images.length)
        ? p.images.map(img => ({
            postImageId: img.postImageId,
            imageFileName: img.imageFileName,
            sortOrder: img.sortOrder,
            // imageFileName 本身已經帶路徑了（例如 "/images/posts/post01_1.jpg"），
            // 直接接在 IMAGE_BASE 後面組成完整網址，跟 CommunityView.vue 的做法一樣。
            url: `${IMAGE_BASE}${img.imageFileName}`
          }))
        : [{ postImageId: null, imageFileName: null, sortOrder: 1, url: postImage }], // 完全沒有圖片時的保底畫面
      content: p.content,
      commentsCount: p.commentsCount ?? 0,
      isLiked: false, // 先給預設值，實際有沒有按過讚由下面 fetchLikeStatus() 另外去問後端才知道
      taggedProducts: p.taggedProducts || []
    }
    // 讚數也要跟著這篇貼文真正的數字重設，不能繼續用寫死的 1248。
    // ?? 0：如果 p.likesCount 是 undefined 或 null，就用 0 代替，
    // 避免後端這個欄位漏帶或叫別的名字時，讓 likesNumber 變成 undefined 把整頁弄壞。
    likesNumber.value = p.likesCount ?? 0

    // 圖片資料确定載入完成、真的知道這篇貼文有幾張圖之後，才能開始自動輪播——
    // 不能提早在 fetchPost 呼叫之前就開始，那時候 post.value.images 還是預設的假資料。
    startAutoplay()

    // fetchFollowStatus、fetchLikeStatus 都要等上面 post.value 設定完才能呼叫——
    // 這兩支原本是在 onMounted 裡跟 fetchPost() 平行呼叫的，看起來各自獨立、
    // 互不相干，但其實有問題：post.value = { ... } 那段是「整包蓋掉」，
    // 裡面 isLiked、isFollowing 都寫死是預設值 false。如果 fetchLikeStatus 先回來、
    // 正確把 isLiked 設成 true，緊接著上面這段 post.value = { ... } 才執行完，
    // 就會把剛剛設對的 isLiked 又蓋回 false——使用者明明已經按過讚，
    // 畫面卻顯示成還沒按，一按下去又想新增一筆，才會撞到資料庫的唯一鍵限制。
    // 改成在這裡（post.value 已經設定完之後）才呼叫，就不會有這個「後到的蓋掉先到的」問題。
    fetchFollowStatus()
    fetchLikeStatus()
  } catch (err) {
    console.error('讀取貼文詳細資料失敗：', err)
    notFound.value = true
  } finally {
    postLoading.value = false
  }
}

// myLikeId：如果目前這個使用者已經對這篇貼文按過讚，這裡存那筆 Post_Like 紀錄的 postLikesId，
// 之後要取消讚（DELETE）要靠這個 id 才能刪對紀錄。還沒按過讚就是 null。
const myLikeId = ref(null)

// fetchLikeStatus：問後端「這個使用者有沒有幫這篇貼文按過讚」，
// 打的是 PostLikeController.cs 裡的 GET api/PostLike/post/{communitypostid}/user/{userid}。
const fetchLikeStatus = async () => {
  try {
    const res = await api.get(`/PostLike/post/${route.params.id}/user/${currentUserId.value}`)
    if (res.data) {
      post.value.isLiked = true
      myLikeId.value = res.data.postLikesId
    } else {
      post.value.isLiked = false
      myLikeId.value = null
    }
  } catch (err) {
    console.error('讀取按讚狀態失敗：', err)
  }
}

// onMounted：頁面一打開，就照網址上的 id 去後端要這篇貼文的完整資料、留言、
// 這個使用者按讚過沒有，還有跟這篇貼文標記過同一個商品的相似穿搭推薦。
// 先 await loadCurrentUserId()：這頁可能是使用者直接連進來的（沒先經過
// CommunityView.vue），currentUserId 這時候還是 null，要先確定拿到真正的
// userId，fetchPost（裡面會問追蹤狀態）、fetchLikeStatus 才能查到對的人。
onMounted(async () => {
  await loadCurrentUserId()
  fetchPost()
  fetchComments()
  fetchSimilarPosts()
})

// watch：監看網址上的 :id 這個參數。
// 因為從「這篇貼文詳細頁」點連結跳到「另一篇貼文詳細頁」時，
// Vue Router 會重複使用同一個元件（不會整個重新建立），
// 所以 onMounted 不會再執行第二次，畫面資料就不會跟著新的 id 換。
// 這裡另外監看 route.params.id，只要它變了（換了一篇貼文），
// 就重新打一次全部的 API，資料才會真的換成新那篇的內容。
watch(() => route.params.id, () => {
  notFound.value = false
  newComment.value = '' // 清空還沒送出的留言草稿，避免帶到別篇貼文底下去
  replyingTo.value = null // 取消原本在回覆的狀態，避免對新貼文的留言用到舊貼文的 parentCommentId
  currentImageIndex.value = 0 // 換到新貼文時輪播歸零，從第一張開始顯示
  stopAutoplay() // 換貼文了，先把舊貼文的自動輪播計時器停掉，fetchPost 拿到新資料後會重新啟動
  visibleCommentCount.value = COMMENTS_PAGE_SIZE // 換貼文了，留言分頁也重設回第一頁
  fetchPost()
  fetchComments()
  fetchSimilarPosts()
})

// onUnmounted：離開這個頁面時，把自動輪播的計時器停掉，
// 不然使用者已經離開頁面了，計時器還留在背景繼續跑，是不必要的資源浪費。
onUnmounted(() => {
  stopAutoplay()
})

// formatTimeAgo：把一個 ISO 時間字串，轉換成「N 小時前」這種給人看的相對時間文字。
// 抽成共用函式，這樣貼文本身的時間（postTimeAgo）跟留言、回覆的時間可以共用同一套邏輯。
const formatTimeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffHours = Math.round(diffMs / (60 * 60 * 1000))
  if (diffHours < 1) return '剛剛'
  if (diffHours < 24) return `${diffHours} 小時前`
  return `${Math.round(diffHours / 24)} 天前`
}

// formatDateTime：把一個 ISO 時間字串，轉換成「2026-06-06 12:00」這種固定格式的日期時間文字。
// 留言、回覆的時間改用這個（不用「N 天前」的相對時間），可以直接看出是哪一天留的言。
// padStart(2, '0')：數字不足兩位時前面補 0，例如 6 月要顯示成 06。
const formatDateTime = (dateStr) => {
  const d = new Date(dateStr)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

// postTimeDisplay：把 post.postDate 這個正式時間，轉換成「2026-06-06 12:00」這種固定格式的日期時間文字。
// 原本這裡是用 formatTimeAgo 顯示「N 天前」，改成跟留言一樣用 formatDateTime，直接看得出是哪一天發的文。
const postTimeDisplay = computed(() => formatDateTime(post.value.postDate))

// 按讚數改用數字追蹤，方便按讚時 +1、取消時 -1；畫面顯示再轉成千分位字串
// likesNumber：存「真正的數字」，方便計算加減。
const likesNumber = ref(1248) // 對應原本的 '1,248'
// likesDisplay：一個 computed，把 likesNumber 這個純數字，
// 轉換成「1,248」這種每三位數加一個逗號的格式，給畫面顯示用。
// .toLocaleString()：JavaScript 數字內建的方法，會依照使用者瀏覽器的地區設定，
// 自動幫數字加上千分位逗號。
const likesDisplay = computed(() => likesNumber.value.toLocaleString())

// likeIconEl：按讚按鈕裡那顆心形 SVG 圖示的 DOM 參照，animateLikeIcon 需要直接抓到
// 這個元素才能對它播放動畫。
const likeIconEl = ref(null)

// animateLikeIcon：心形圖示的「彈跳」效果——不管這次是要按讚還是取消讚，
// 點下去都先給一個小小的放大再彈回去的回饋，操作起來比較有「按到了」的實感。
// 這個動畫純粹是視覺回饋，跟後面 API 呼叫成功與否無關，所以放在 toggleLike 最開頭、
// 立刻執行，不用等 API 回應。
const animateLikeIcon = () => {
  if (!likeIconEl.value) return
  animate(likeIconEl.value, {
    scale: [1, 1.4, 1],
    duration: 380,
    ease: 'outBack'
  })
}

// toggleLike：按下愛心按鈕時執行。改成 async，因為裡面要 await 打 API。
const toggleLike = async () => {
  animateLikeIcon()
  if (post.value.isLiked) {
    // 目前是「已按讚」狀態 → 這次是要取消讚 → 打 DELETE，刪掉 myLikeId 那筆紀錄
    try {
      await api.delete(`/PostLike/${myLikeId.value}`)
    } catch (err) {
      console.error('取消讚失敗：', err)
      return // 失敗就不要動畫面上的狀態，維持「已按讚」原樣
    }
    post.value.isLiked = false
    myLikeId.value = null
    likesNumber.value -= 1
  } else {
    // 目前是「還沒按讚」狀態 → 這次是要按讚 → 打 POST 新增一筆 Post_Like 紀錄
    try {
      await api.post(`/PostLike`, {
        communityPostId: post.value.communityPostId,
        userId: currentUserId.value
      })
    } catch (err) {
      console.error('按讚失敗：', err)
      return
    }
    // POST 只會回傳成功與否，不會回傳剛剛新增那筆紀錄的 id，
    // 所以要重新問一次後端才知道 myLikeId 是多少（之後要取消讚會用到），跟留言那邊的做法一樣。
    await fetchLikeStatus()
    likesNumber.value += 1
  }
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

// ============================================================
// 分享功能
// ============================================================

// fullShareUrl：這篇貼文完整的路由網址，當作短網址「還沒拿到之前」的備援。
const fullShareUrl = computed(() => `${window.location.origin}/community/post/${route.params.id}`)

// shortUrl：跟後端要到的短碼組出來的完整短網址，null 代表還沒拿到（或這次沒拿到）。
// shareUrl：真正拿去分享／複製的網址——拿到短網址就優先用短網址，
// 還沒拿到、或後端這支 API 掛了，就先用 fullShareUrl 頂著，不會讓分享功能整個壞掉。
const shortUrl = ref(null)
const fetchingShortUrl = ref(false)
const shareUrl = computed(() => shortUrl.value || fullShareUrl.value)

// ensureShortUrl：跟後端要這篇貼文的短碼，打的是 ShortUrlController.cs 裡的
// POST api/ShortUrl。後端邏輯是「這篇貼文已經產生過短碼就回傳原本那組，沒有才新產生」，
// 所以這裡不用擔心重複呼叫會一直生出新的短碼；用 shortUrl.value 判斷「已經拿過了」，
// 避免同一次瀏覽重複打好幾次 API。
// 短網址走的是後端網域（IMAGE_BASE，跟圖片是同一個網域），不是前端 SPA 的網域，
// 因為 /s/{code} 這個轉址路由是後端提供的，不是 Vue Router 的路由——
// 使用者點下短網址時，是瀏覽器直接對後端發請求，後端才能在還沒載入前端 App 之前
// 就先查資料庫、決定要導去哪一篇貼文。
const ensureShortUrl = async () => {
  if (shortUrl.value || fetchingShortUrl.value) return
  fetchingShortUrl.value = true
  try {
    const res = await api.post('/ShortUrl', { communityPostId: Number(route.params.id) })
    shortUrl.value = `${IMAGE_BASE}/s/${res.data.shortCode}`
  } catch (err) {
    console.error('取得短網址失敗，先用完整網址分享：', err)
  } finally {
    fetchingShortUrl.value = false
  }
}

// showShareMenu：分享選單目前是不是打開的。打開的當下順便去要短網址，
// 使用者點「複製連結」的時候通常已經拿到短碼了。
const showShareMenu = ref(false)
const toggleShareMenu = () => {
  showShareMenu.value = !showShareMenu.value
  if (showShareMenu.value) ensureShortUrl()
}
const closeShareMenu = () => {
  showShareMenu.value = false
}

// ============================================================
// 檢舉功能
// ============================================================

const showReportMenu = ref(false)
const reportReason = ref('')
const reportSubmitting = ref(false)

const toggleReportMenu = () => {
  showReportMenu.value = !showReportMenu.value
}
const closeReportMenu = () => {
  showReportMenu.value = false
  reportReason.value = ''
}

// submitReport：送出檢舉。後端 PostReportController.cs 不是用真正的 HTTP 409 狀態碼
// 表示「已經檢舉過了」，是回傳 200 但內容是 { ok: false, code: 409 } 這種格式
// （跟專案裡其他 Controller 是同一套 ResultDTO 慣例），所以這裡要檢查 res.data.ok，
// 不能只靠 try/catch 抓錯誤——用 try/catch 抓不到「已經檢舉過」這種情況，
// 因為對 axios 來說這仍然是一個成功的 200 回應。
const submitReport = async () => {
  const reason = reportReason.value.trim()
  if (!reason) return
  reportSubmitting.value = true
  try {
    const res = await api.post('/PostReport', {
      communityPostId: post.value.communityPostId,
      reporterId: currentUserId.value,
      reason
    })
    if (res.data.ok) {
      alert('已送出檢舉，謝謝你的回報！')
    } else if (res.data.code === 409) {
      alert('你已經檢舉過這篇貼文了')
    } else {
      alert('檢舉失敗，請稍後再試一次！')
    }
  } catch (err) {
    console.error('檢舉失敗：', err)
    alert('檢舉失敗，請稍後再試一次！')
  } finally {
    reportSubmitting.value = false
    closeReportMenu()
  }
}

// linkCopied：複製連結成功後，短暫把按鈕文字換成「已複製！」給使用者一個回饋，
// 用 setTimeout 在 1.5 秒後自動切回「複製連結」。
const linkCopied = ref(false)
const copyLink = async () => {
  // await ensureShortUrl()：保險起見再等一次——萬一使用者點開選單後，
  // 手比 API 回應還快就按了複製，這裡確保複製到的是短網址，而不是還沒拿到就先用備援網址。
  await ensureShortUrl()
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 1500)
  } catch (err) {
    console.error('複製連結失敗：', err)
  }
  // 複製連結不需要馬上關閉選單，讓使用者看得到「已複製！」的回饋文字再自己收起來，
  // 或繼續點別的分享方式。
}

// shareToLine／shareToFacebook：開一個新分頁，帶上這篇貼文的網址，
// 走各平台自己提供的「分享連結」網址格式（不需要串接對方的 API 金鑰）。
const shareToLine = async () => {
  await ensureShortUrl()
  window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl.value)}`, '_blank')
  closeShareMenu()
}
const shareToFacebook = async () => {
  await ensureShortUrl()
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`, '_blank')
  closeShareMenu()
}

// nativeShare：手機瀏覽器（或部分桌機瀏覽器）通常有內建的系統分享面板
// （例如手機上會跳出「傳送給...」「Line」「Messages」這種系統選單），
// navigator.share 就是呼叫那個系統面板；電腦版 Chrome/Firefox 大多不支援，
// 所以只有支援的瀏覽器才會顯示這個選項（canNativeShare 判斷）。
const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share
const nativeShare = async () => {
  await ensureShortUrl()
  try {
    await navigator.share({ title: post.value.content, url: shareUrl.value })
  } catch (err) {
    // 使用者自己按取消系統分享面板也會跑到這裡，是正常操作，不用特別跳錯誤訊息。
  }
  closeShareMenu()
}

// 「這套穿搭的商品」右側清單：直接用 post.taggedProducts（貼文作者真的搜尋、勾選過的商品），
// 不再是另一份跟這篇貼文毫不相干的假資料。這樣畫面上只會出現作者自己標記過的東西，
// 不會出現「使用者身上每一件都被當成我們家商品在賣」這種狀況。

// 相似穿搭推薦：跟這篇貼文標記過同一個商品的其他貼文，先給空陣列，
// 等 fetchSimilarPosts() 打完 API 才會有真正資料庫裡的貼文。
const similarPosts = ref([])

// fetchSimilarPosts：打 CommunityPostController.cs 裡的 GET api/CommunityPost/similar/{communitypostid}。
const fetchSimilarPosts = async () => {
  try {
    const res = await api.get(`/CommunityPost/similar/${route.params.id}`)
    similarPosts.value = res.data.map(p => ({
      communityPostId: p.communityPostId,
      image: (p.images && p.images.length) ? `${IMAGE_BASE}${p.images[0].imageFileName}` : postImage
    }))
  } catch (err) {
    console.error('讀取相似穿搭推薦失敗：', err)
  }
}

// 留言列表：等 fetchComments() 打完 API 才會有資料，先給空陣列避免顯示假留言。
// 欄位對照 Post_Comment 表：postCommentId、parentCommentId（回覆留言用，parentCommentId
// 有值代表這則是在回覆某一則留言）、commentText、commentDate，user／avatar 是後端 join User 表組出來的。
const comments = ref([])

// groupedComments：把後端回來的「一維陣列」，依 parentCommentId 整理成
// 「主留言 + 底下往內縮的回覆」這種巢狀結構，跟 IG 留言區的呈現方式一樣。
// parentCommentId 是 null（或沒有值）的是主留言，parentCommentId 指到誰，
// 就代表這則是在回覆那一則留言。
const groupedComments = computed(() => {
  const topLevel = comments.value
    .filter(c => !c.parentCommentId)
    // 主留言照留言時間「新到舊」排，最新留的言會排在最上面
    .sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate))
  return topLevel.map(c => ({
    ...c,
    replies: comments.value
      .filter(r => r.parentCommentId === c.postCommentId)
      // 回覆本身照留言時間「舊到新」排，符合對話的閱讀順序（跟主留言新到舊的排序方向相反）
      .sort((a, b) => new Date(a.commentDate) - new Date(b.commentDate))
  }))
})

// ============================================================
// 留言分頁：留言一多（幾十則），一次全部攤開會把頁面撐得很長。
// 改成一開始只顯示前幾則「主留言」（連同它們的回覆），按「查看更多留言」才多顯示幾則，
// 跟 CommunityView.vue 網格區「載入更多穿搭」是同一套做法。
// ============================================================

const COMMENTS_PAGE_SIZE = 5
// visibleCommentCount：目前願意顯示到第幾則「主留言」（不含回覆，回覆是跟著主留言一起出現的）。
const visibleCommentCount = ref(COMMENTS_PAGE_SIZE)

// visibleGroupedComments：真正給 template 用 v-for 畫出來的清單，是 groupedComments
// 裡「前 visibleCommentCount 則」。.slice(0, n)：從陣列開頭取到第 n 筆（不含第 n 筆）。
const visibleGroupedComments = computed(() => groupedComments.value.slice(0, visibleCommentCount.value))

// hasMoreComments：判斷還有沒有更多沒顯示出來的主留言，用來決定「查看更多留言」
// 按鈕要不要出現，全部顯示完就不用再讓使用者看到一顆按下去沒有反應的按鈕。
const hasMoreComments = computed(() => visibleCommentCount.value < groupedComments.value.length)

// loadMoreComments：按下「查看更多留言」時執行，一次多開放顯示 5 則主留言。
const loadMoreComments = () => {
  visibleCommentCount.value += COMMENTS_PAGE_SIZE
}

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
    const res = await api.get(`/PostComment/post/${route.params.id}`)
    // c.avatar 後端存的是相對路徑（例如 /avatars/user002.png），要接上 IMAGE_BASE
    // 才是完整網址；沒設大頭貼的人（avatar 是 null）用預設頭像頂著。
    comments.value = res.data.map(c => ({
      ...c,
      avatar: c.avatar ? `${IMAGE_BASE}${c.avatar}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.user
    }))
  } catch (err) {
    console.error('讀取留言失敗：', err)
  }
}

// newComment：跟留言輸入框做雙向綁定，存使用者「正在打字、還沒送出」的留言內容
const newComment = ref('')

// myFollowId：如果目前這個測試帳號已經追蹤這篇貼文的作者，這裡存那筆 User_Follow 紀錄的
// userFollowId，之後要取消追蹤（DELETE）要靠這個 id 才能刪對紀錄。還沒追蹤就是 null。
const myFollowId = ref(null)

// fetchFollowStatus：問後端「這個測試帳號有沒有追蹤這篇貼文的作者」，
// 打的是 UserFollowController.cs 裡的 GET api/UserFollow/follower/{followerid}/following/{followingid}。
const fetchFollowStatus = async () => {
  try {
    const res = await api.get(`/UserFollow/follower/${currentUserId.value}/following/${post.value.userId}`)
    if (res.data) {
      post.value.isFollowing = true
      myFollowId.value = res.data.userFollowId
    } else {
      post.value.isFollowing = false
      myFollowId.value = null
    }
  } catch (err) {
    console.error('讀取追蹤狀態失敗：', err)
  }
}

// toggleFollow：按下「＋ 追蹤」按鈕時執行。改成 async，因為裡面要 await 打 API。
const toggleFollow = async () => {
  if (post.value.isFollowing) {
    // 目前是「已追蹤」狀態 → 這次是要取消追蹤 → 打 DELETE，刪掉 myFollowId 那筆紀錄
    try {
      await api.delete(`/UserFollow/${myFollowId.value}`)
    } catch (err) {
      console.error('取消追蹤失敗：', err)
      return // 失敗就不要動畫面上的狀態，維持「已追蹤」原樣
    }
    post.value.isFollowing = false
    myFollowId.value = null
  } else {
    // 目前是「還沒追蹤」狀態 → 這次是要追蹤 → 打 POST 新增一筆 User_Follow 紀錄
    try {
      await api.post(`/UserFollow`, {
        followerId: currentUserId.value,
        followingId: post.value.userId
      })
    } catch (err) {
      console.error('追蹤失敗：', err)
      return
    }
    // POST 只會回傳成功與否，不會回傳剛剛新增那筆紀錄的 id，
    // 所以要重新問一次後端才知道 myFollowId 是多少（之後要取消追蹤會用到），跟按讚那邊的做法一樣。
    await fetchFollowStatus()
  }
}

// addComment：按下「送出」按鈕或在輸入框按 Enter 時執行。
// 改成 async，因為裡面要 await 打 API。
const addComment = async () => {
  // .trim()：去掉文字前後的空白。如果去掉空白後是空字串，代表使用者其實沒打字，
  // 直接 return（提早結束函式），不新增這則空白留言。
  if (!newComment.value.trim()) return

  try {
    await api.post(`/PostComment`, {
      // replyingTo 有值代表現在是在回覆某一則留言，parentCommentId 就帶那則留言的 id；
      // 沒有值（一般發新留言）就帶 null。
      parentCommentId: replyingTo.value ? replyingTo.value.postCommentId : null,
      communityPostId: post.value.communityPostId,
      userId: currentUserId.value,
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
        postLoading：貼文完整資料還沒抓回來之前顯示骨架佔位畫面，
        取代原本「直接空白，資料到了才整個跳出來」的體驗。
      -->
      <div v-if="postLoading" class="row g-4">
        <div class="col-12 col-lg-8">
          <div class="post-main-card">
            <div class="skeleton-author-bar">
              <div class="skeleton-block skeleton-avatar-lg"></div>
              <div class="skeleton-author-lines">
                <div class="skeleton-block skeleton-line skeleton-line-40"></div>
                <div class="skeleton-block skeleton-line skeleton-line-30"></div>
              </div>
            </div>
            <div class="skeleton-block skeleton-main-media"></div>
            <div class="skeleton-block skeleton-line skeleton-line-90" style="margin-top:1.2rem;"></div>
            <div class="skeleton-block skeleton-line skeleton-line-60" style="margin-top:.6rem;"></div>
          </div>
        </div>
        <div class="col-12 col-lg-4">
          <div class="skeleton-block skeleton-side-card"></div>
        </div>
      </div>

      <!--
        notFound：如果網址上的 id 在資料庫裡找不到對應的貼文（例如網址被亂改、
        或貼文已經被刪除），就顯示這個提示，不要繼續顯示「載入中...」那份假資料。
      -->
      <div v-else-if="notFound" class="not-found-state">
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
                :to="`/community/profile/${post.userId}`"：帶上這篇貼文真正的發文者 userId，
                點下去會跳到那個人的個人檔案頁（UserProfileView.vue），不同貼文的作者會連到不同網址。
                class="text-decoration-none"：Bootstrap 的工具 class，把 <a> 連結預設的底線拿掉。
              -->
              <router-link :to="`/community/profile/${post.userId}`" class="author-info text-decoration-none">
                <img :src="post.user.avatar" class="author-avatar" alt="avatar" @error="onAvatarError($event, post.user.name)" />
                <div>
                  <h6 class="author-name">{{ post.user.name }}</h6>
                  <!-- postTimeDisplay：上面 script 用 postDate 算出來的「2026-06-06 12:00」固定日期時間文字 -->
                  <small class="author-meta">{{ postTimeDisplay }} · {{ post.user.location }}</small>
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

            <!-- 主圖：改成可以左右切換的輪播，顯示 CreatePostView.vue 上傳時選的每一張照片，
                 不再固定只顯示第一張。currentImageIndex 記錄現在顯示第幾張（從 0 開始）。 -->
            <!-- @mouseenter/@mouseleave：滑鼠移到主圖上面時暫停自動輪播，方便使用者
                 好好看清楚正在顯示的這張圖，不會看到一半突然自動跳到下一張；
                 滑鼠移開再恢復自動播放。 -->
            <div class="post-media" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
              <span class="tag-label" v-if="post.taggedProducts[0]">封面故事</span>
              <img :src="post.images[currentImageIndex]?.url" class="post-image" alt="post image" />

              <!-- 上一張／下一張箭頭：只有超過 1 張照片才顯示，不然單張照片也會出現沒意義的箭頭 -->
              <template v-if="post.images.length > 1">
                <!--
                  原本這裡是用文字符號 ‹ › 當箭頭，但文字字元在字型裡的「字符框」本身
                  就不是正中央對齊的（不同字型、不同瀏覽器對不齊的程度還不一樣），
                  就算外層按鈕用 flex 置中，符號看起來還是會偏一邊。
                  換成尺寸固定的 SVG 圖示，用 stroke 畫出來的線條圖形，
                  就能真正置中在灰色圓形按鈕正中間，不受字型影響。
                -->
                <button class="media-arrow media-arrow-prev" @click="prevImage" aria-label="上一張">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button class="media-arrow media-arrow-next" @click="nextImage" aria-label="下一張">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <!-- 圓點指示器：點某個點可以直接跳到那張照片，目前顯示的那個點會反白 -->
                <div class="media-dots">
                  <button
                    v-for="(img, idx) in post.images"
                    :key="idx"
                    class="media-dot"
                    :class="{ active: idx === currentImageIndex }"
                    @click="currentImageIndex = idx; restartAutoplay()"
                  ></button>
                </div>
              </template>
            </div>

            <!-- 縮圖列：跟輪播是同一份 post.images，點縮圖也能直接跳到那張，主圖跟縮圖列點法互通 -->
            <div class="post-thumb-row" v-if="post.images.length > 1">
              <button
                v-for="(img, idx) in post.images"
                :key="idx"
                class="post-thumb-item"
                :class="{ active: idx === currentImageIndex }"
                @click="currentImageIndex = idx; restartAutoplay()"
              >
                <img :src="img.url" alt="縮圖" />
              </button>
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
                  <!-- fill="currentColor" 只有 isLiked 是 true 時才套用：已按讚時整顆心是實心的紅色，
                       跟大部分社群 App「按讚＝實心愛心」的視覺習慣一致；還沒按讚時維持空心線條。 -->
                  <svg ref="likeIconEl" class="icon-inline" viewBox="0 0 24 24" width="16" height="16" :fill="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {{ likesDisplay }}
                </button>
                <button class="action-btn">
                  <svg class="icon-inline" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12c0 4.4-4 8-9 8-1.1 0-2.1-.2-3-.5L4 21l1.3-4.2A7.8 7.8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
                  </svg>
                  {{ post.commentsCount }}
                </button>
                <!--
                  share-wrapper：包住分享按鈕跟下拉選單的容器，加 position:relative，
                  這樣選單（position:absolute）才會是「相對這個按鈕」定位，而不是整個頁面。
                -->
                <div class="share-wrapper">
                  <button class="action-btn" @click="toggleShareMenu">
                    ↗ 分享
                  </button>

                  <!--
                    分享選單：showShareMenu 是 true 才顯示。
                    外層再包一層 share-menu-backdrop，鋪滿整個畫面但完全透明，
                    點選單以外的任何地方都算點到這層背景，直接關閉選單——
                    這是不用額外寫「偵測點擊選單外面」邏輯的簡單做法。
                  -->
                  <div v-if="showShareMenu" class="share-menu-backdrop" @click="closeShareMenu"></div>
                  <div v-if="showShareMenu" class="share-menu">
                    <!--
                      這兩顆原本用 Font Awesome 的 fa-share-nodes、fa-link，這次也一起換成
                      SVG——跟其他檔案陸續脫離 Font Awesome 是同一個理由（不吃字型／CDN，
                      不用擔心某些網路環境擋掉外部字型 CDN 導致圖示變成空白方框），
                      現在整個 Community 已經沒有任何地方在用 Font Awesome 了。
                    -->
                    <button v-if="canNativeShare" type="button" class="share-menu-item" @click="nativeShare">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.6 13.5l6.8 4" />
                        <path d="M15.4 6.5l-6.8 4" />
                      </svg>
                      系統分享
                    </button>
                    <button type="button" class="share-menu-item" @click="copyLink">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      {{ linkCopied ? '已複製！' : '複製連結' }}
                    </button>
                    <button type="button" class="share-menu-item" @click="shareToLine">
                      <IconLine /> 分享到 LINE
                    </button>
                    <button type="button" class="share-menu-item" @click="shareToFacebook">
                      <IconFacebook /> 分享到 Facebook
                    </button>
                  </div>
                </div>

                <!--
                  檢舉：跟分享選單同一種「小面板」做法（position:relative 的外層包住
                  position:absolute 的面板 + 透明背景擋點外面），不用像編輯貼文那種
                  Teleport 彈出視窗那麼重，畢竟只是一個文字欄位加送出按鈕。
                -->
                <div class="report-wrapper">
                  <button class="action-btn" @click="toggleReportMenu">
                    <svg class="icon-inline" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 3v18" />
                      <path d="M5 4h13l-3 4 3 4H5" />
                    </svg>
                    檢舉
                  </button>
                  <div v-if="showReportMenu" class="share-menu-backdrop" @click="closeReportMenu"></div>
                  <div v-if="showReportMenu" class="report-panel">
                    <p class="report-panel-title">檢舉這篇貼文</p>
                    <textarea
                      v-model="reportReason"
                      class="report-textarea"
                      rows="3"
                      placeholder="請簡短說明檢舉原因（例如：不實廣告、冒犯言論...）"
                    ></textarea>
                    <div class="report-panel-actions">
                      <button type="button" class="report-btn-cancel" @click="closeReportMenu">取消</button>
                      <button type="button" class="report-btn-submit" :disabled="!reportReason.trim() || reportSubmitting" @click="submitReport">
                        {{ reportSubmitting ? '送出中...' : '送出檢舉' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!--
                收藏按鈕：
                @click="toggleSave"：呼叫上面 script 定義的 toggleSave 函式，
                這個函式會去更新「共用的收藏清單」，而不是只改這個頁面自己的一個變數，
                這樣 UserProfileView.vue 的收藏頁籤才看得到剛剛收藏的貼文。
                書籤圖示原本是 Font Awesome 的 fa-bookmark（依 isSaved 切換 fa-solid／
                fa-regular），一起換成 SVG，用 :fill 動態切換實心／空心，
                跟按讚愛心「已讚=實心」是同一套做法。
              -->
              <button class="action-btn" :class="{ saved: isSaved }" @click="toggleSave">
                <svg class="icon-inline" viewBox="0 0 24 24" width="14" height="14" :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {{ isSaved ? '已收藏' : '收藏' }}
              </button>
            </div>

            <!-- 貼文文字描述 -->
            <p class="post-content">{{ post.content }}</p>

            <!--
              標記商品：點下去會跳到社群首頁，並帶上 ?tag=商品名稱 這個查詢字串，
              CommunityView.vue 那邊已經改成會讀這個查詢字串、自動塞進搜尋框，
              等於「幫使用者按下這個商品名稱去搜尋」，畫面上就會看到其他標記過同一件
              商品的貼文——跟右側欄「熱門商品標籤」點下去的效果是同一套邏輯。
              之前先用 <span>（不能點）是因為那時候想接的是「商品頁」，但 productRoute
              還是假資料；現在改成連到「相關貼文」，不需要真的商品頁網址，
              所以可以先做。
            -->
            <div class="tagged-products" v-if="post.taggedProducts.length">
              <span class="tagged-label">標記商品</span>
              <div class="tag-cloud">
                <router-link
                  v-for="tag in post.taggedProducts"
                  :key="tag.postTaggedProductId"
                  :to="`/community?tag=${encodeURIComponent(tag.name)}`"
                  class="tag-chip"
                >#{{ tag.name }}</router-link>
              </div>
            </div>

            <!-- 留言區塊 -->
            <div class="comment-block">
              <div class="comment-title">
                <span class="dot"></span>留言
              </div>

              <!-- 正在回覆某則留言時的提示：顯示「回覆 @xxx」，可以按 ✕ 取消、切回發新留言 -->
              <div v-if="replyingTo" class="replying-to-row">
                回覆 <strong>@{{ replyingTo.user }}</strong>
                <button class="btn-cancel-reply" @click="cancelReply">✕</button>
              </div>

              <!-- 輸入留言：移到留言列表最上面，一打開貼文就能馬上留言，不用先滑過所有留言才看得到輸入框 -->
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

              <div class="comments-list">
                <!-- v-for="c in visibleGroupedComments"：只跑「目前願意顯示的那幾則」主留言，
                     不是把 groupedComments 全部畫出來——跟 CommunityView.vue 網格區的
                     「載入更多穿搭」是同一種做法，一開始只看得到前 5 則，按「查看更多留言」
                     才會再多顯示幾則。每則主留言底下再跑一次 c.replies 畫出它的回覆。 -->
                <div v-for="c in visibleGroupedComments" :key="c.postCommentId" class="comment-thread">
                  <div class="comment-row">
                    <img :src="c.avatar" class="comment-avatar" alt="avatar" @error="onAvatarError($event, c.user)" />
                    <div class="comment-bubble">
                      <span class="comment-user">{{ c.user }}</span>
                      <span>{{ c.commentText }}</span>
                      <div class="comment-meta">
                        <!-- formatDateTime：留言時間顯示成「2026-06-06 12:00」固定格式，不用「N 天前」的相對時間 -->
                        <span class="comment-time">{{ formatDateTime(c.commentDate) }}</span>
                        <button class="btn-reply" @click="startReply(c)">回覆</button>
                      </div>
                      <!-- 有人回覆過這則留言時，顯示「已回覆 N 則」，跟 IG 一樣讓人知道底下有討論 -->
                      <span v-if="c.replies.length" class="reply-count">已回覆 {{ c.replies.length }} 則</span>
                    </div>
                  </div>

                  <!-- 回覆列表：往內縮排（class="comment-reply"），跟 IG 留言底下的回覆呈現方式一樣 -->
                  <div v-for="r in c.replies" :key="r.postCommentId" class="comment-row comment-reply">
                    <img :src="r.avatar" class="comment-avatar" alt="avatar" @error="onAvatarError($event, r.user)" />
                    <div class="comment-bubble">
                      <span class="comment-user">{{ r.user }}</span>
                      <span>{{ r.commentText }}</span>
                      <div class="comment-meta">
                        <span class="comment-time">{{ formatDateTime(r.commentDate) }}</span>
                        <button class="btn-reply" @click="startReply(c)">回覆</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 查看更多留言：只有還有更多沒顯示出來的主留言時才出現，全部顯示完就自動收起來 -->
              <div class="load-more-comments-wrap" v-if="hasMoreComments">
                <button class="btn-load-comments" @click="loadMoreComments">查看更多留言 ▾</button>
              </div>
            </div>

          </div>
        </div>

        <!-- 右側：這套穿搭的商品與推薦區 -->
        <div class="col-12 col-lg-4">

          <!-- 穿搭商品清單：只顯示這篇貼文作者真的標記過的商品，沒有標記任何商品的貼文，這整張卡片不會出現 -->
          <div class="side-card" v-if="post.taggedProducts.length">
            <div class="side-title"><span class="dot"></span>這套穿搭的商品</div>

            <div class="product-list">
              <div v-for="item in post.taggedProducts" :key="item.postTaggedProductId" class="product-row">
                <!--
                  product-link：現在商品詳情頁路由確定是 /shop/product/:id 了，
                  改回真正的 router-link，點圖片或名稱都會跳過去那件商品的頁面。
                  圖片是後端 TaggedProductDTO.Image 帶回來的檔名，實際檔案放在
                  wwwroot/images/product/ 底下，所以組網址要多接這段路徑，
                  跟貼文照片（wwwroot/images/posts/）用的資料夾不一樣。
                -->
                <router-link :to="`/shop/product/${item.productId}`" class="product-link">
                  <img
                    v-if="item.image"
                    :src="`${IMAGE_BASE}/images/product/${item.image}`"
                    class="product-thumb"
                    alt="product"
                  />
                  <div class="product-info">
                    <p class="product-name">{{ item.name }}</p>
                    <p class="product-price">NT$ {{ item.price }}</p>
                  </div>
                </router-link>
              </div>
            </div>
          </div>

          <!-- 相似穿搭推薦：跟這篇貼文標記過同一個商品的其他貼文，點縮圖可以直接跳過去那篇貼文 -->
          <div class="side-card">
            <div class="side-title"><span class="dot"></span>相似穿搭推薦</div>
            <div class="similar-grid">
              <router-link
                v-for="sp in similarPosts"
                :key="sp.communityPostId"
                :to="`/community/post/${sp.communityPostId}`"
                class="similar-thumb"
              >
                <img :src="sp.image" alt="similar look" />
              </router-link>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
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

/* ---------- 骨架載入畫面 ---------- */
/* 跟 CommunityView.vue 的骨架畫面是同一套「光斑掃過」效果，各自獨立的 <style scoped>
   沒辦法共用，這裡複製一份對應這個頁面的版面形狀（發文者列＋大圖＋內文＋側欄）。 */
@keyframes skeleton-shimmer {
  0% { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.skeleton-block{
  background-color: var(--hairline);
  background-image: linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,.55) 50%, rgba(255,255,255,0) 100%);
  background-size: 300px 100%;
  background-repeat: no-repeat;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}
.skeleton-author-bar{ display:flex; align-items:center; gap:.7rem; margin-bottom:1.1rem; }
.skeleton-avatar-lg{ width:44px; height:44px; border-radius:50%; flex-shrink:0; }
.skeleton-author-lines{ display:flex; flex-direction:column; gap:.5rem; flex:1; }
.skeleton-line{ height:14px; }
.skeleton-line-40{ width:40%; }
.skeleton-line-30{ width:30%; }
.skeleton-line-90{ width:90%; }
.skeleton-line-60{ width:60%; }
.skeleton-main-media{ width:100%; height:550px; border-radius:8px; }
.skeleton-side-card{ width:100%; height:320px; border-radius:16px; }
@media (max-width: 767px){
  .skeleton-main-media{ height:340px; }
}

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

/* ---------- 主圖輪播：箭頭、圓點 ---------- */
.media-arrow{
  position:absolute; top:50%; transform:translateY(-50%); z-index:3;
  width:36px; height:36px; border-radius:50%;
  background:rgba(0,0,0,.45); color:#fff; border:none; padding:0;
  display:flex; align-items:center; justify-content:center;
  transition:background .18s ease;
}
.media-arrow:hover{ background:rgba(0,0,0,.7); }
.media-arrow-prev{ left:12px; }
.media-arrow-next{ right:12px; }

.media-dots{
  position:absolute; bottom:14px; left:50%; transform:translateX(-50%); z-index:3;
  display:flex; gap:.4rem;
}
.media-dot{
  width:7px; height:7px; border-radius:50%;
  background:rgba(255,255,255,.55); border:none; padding:0;
  transition:background .18s ease, transform .18s ease;
}
.media-dot.active{ background:#fff; transform:scale(1.25); }

/* ---------- 縮圖列 ---------- */
.post-thumb-row{ display:flex; gap:.5rem; margin-bottom:1.1rem; }
.post-thumb-item{
  width:56px; height:56px; border-radius:6px; overflow:hidden; flex-shrink:0;
  border:2px solid transparent; padding:0; background:none;
  transition:border-color .18s ease;
}
.post-thumb-item.active{ border-color:var(--plum); }
.post-thumb-item img{ width:100%; height:100%; object-fit:cover; display:block; }

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
/* icon-inline：跟文字並排的小圖示共用樣式，顏色跟著所在文字走（currentColor），
   跟 CommunityView.vue 的 .icon-inline 是同一個概念，各自獨立的 <style scoped> 沒辦法共用，
   所以這裡也宣告一次。 */
.icon-inline{ flex-shrink:0; }

/*
  分享選單：
  .share-wrapper 是定位的參考點（position:relative），.share-menu 用 position:absolute
  相對它往下展開，不用 Teleport 也不會被裁切（.action-bar 本身沒有 overflow:hidden）。
  .share-menu-backdrop 鋪滿整個畫面但透明，點選單以外的地方都算點到它，直接關閉選單，
  比自己寫「偵測點擊發生在選單外面」的邏輯簡單很多。
*/
.share-wrapper{ position:relative; }
.share-menu-backdrop{ position:fixed; inset:0; z-index:9; }
.share-menu{
  position:absolute; top:calc(100% + 8px); left:0; z-index:10;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:8px;
  box-shadow:0 10px 30px rgba(42,36,32,.18);
  padding:.4rem;
  min-width:180px;
  display:flex; flex-direction:column; gap:.15rem;
}
.share-menu-item{
  display:flex; align-items:center; gap:.6rem;
  background:none; border:none; border-radius:5px;
  padding:.55rem .7rem; font-size:.84rem; color:var(--ink);
  text-align:left; cursor:pointer;
  transition:background .15s ease;
}
.share-menu-item:hover{ background:var(--cream); }
/* 系統分享、複製連結、LINE、Facebook 現在全部都是 SVG（沒有任何 <i> 圖示了），
   統一用同一條規則控制尺寸／顏色，currentColor 會直接跟著這裡設定的 color 走。 */
.share-menu-item svg{ width:16px; height:16px; flex-shrink:0; color:var(--ink-soft); }

/* 檢舉面板：跟分享選單同一種定位邏輯（.report-wrapper 是參考點），
   共用同一顆 .share-menu-backdrop 處理「點外面關閉」。 */
.report-wrapper{ position:relative; }
.report-panel{
  position:absolute; top:calc(100% + 8px); right:0; z-index:10;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:8px;
  box-shadow:0 10px 30px rgba(42,36,32,.18);
  padding:1rem;
  width:260px;
}
.report-panel-title{
  margin:0 0 .6rem; font-size:.86rem; font-weight:700; color:var(--ink);
}
.report-textarea{
  width:100%; border:1px solid var(--hairline); background:var(--cream);
  border-radius:6px; padding:.6rem .7rem; font-size:.82rem; color:var(--ink);
  font-family:inherit; resize:vertical;
}
.report-textarea:focus{ outline:none; border-color:var(--plum); }
.report-panel-actions{ display:flex; gap:.5rem; margin-top:.7rem; }
.report-btn-cancel{
  flex:1; padding:.45rem; font-size:.78rem;
  background:transparent; color:var(--ink-soft);
  border:1px solid var(--hairline); border-radius:4px; cursor:pointer;
}
.report-btn-cancel:hover{ border-color:var(--ink); color:var(--ink); }
.report-btn-submit{
  flex:1; padding:.45rem; font-size:.78rem; font-weight:600;
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px; cursor:pointer;
  transition:background .18s ease;
}
.report-btn-submit:hover:not(:disabled){ background:var(--plum-deep); }
.report-btn-submit:disabled{ opacity:.5; cursor:not-allowed; }

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
/* 查看更多留言：跟 CommunityView.vue「載入更多穿搭」是同一顆按鈕樣式，維持整個網站
   一致的「還有更多內容」互動語言。 */
.load-more-comments-wrap{ text-align:center; margin-bottom:1.3rem; }
.btn-load-comments{
  background:transparent; border:1px solid var(--ink); color:var(--ink);
  border-radius:999px; padding:.5rem 1.6rem; font-size:.82rem; letter-spacing:.03em;
  transition:all .2s ease;
}
.btn-load-comments:hover{ background:var(--ink); color:var(--cream); }
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
.comment-meta{ display:flex; align-items:center; gap:.6rem; margin-left:auto; flex-shrink:0; }
.comment-time{ font-size:.72rem; color:var(--ink-soft); white-space:nowrap; }
.btn-reply{
  background:none; border:none; padding:0;
  font-size:.78rem; color:var(--ink-soft); cursor:pointer;
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

.comment-input-row{ display:flex; gap:.6rem; margin-bottom:1.3rem; }
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
  product-link 把圖片跟文字包在一起排成一列，現在是真的 router-link（會跳轉到
  /shop/product/:id），color/text-decoration 這兩行是為了讓連結看起來不像連結
  （不變色、不加底線），維持跟其他文字一樣的視覺樣式。
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
.similar-grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:.6rem; }
.similar-thumb{
  display:block;
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