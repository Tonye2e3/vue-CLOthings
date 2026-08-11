<script>
// ============================================================
// 注意：這個檔案有「兩個」<script> 標籤，這是比較少見、進階一點的寫法，
// 這一個沒有寫 setup（就是普通的 <script>），
// 下面還有一個 <script setup>。
//
// 為什麼要拆成兩個？
// 因為這裡面的 posts（貼文清單）資料，不只這個頁面自己要用，
// 「發文頁」(CreatePostView.vue) 發表新文章的時候，
// 也需要把新文章加進「同一份」posts 清單裡，這樣使用者發文後，
// 回到這個頁面才看得到自己剛剛發的文章。
//
// 一般 <script setup> 裡面宣告的變數，是「private 私有」的，
// 外面的檔案沒辦法直接拿到；但如果用普通 <script> + export 關鍵字，
// 就可以把這些變數「開放」給別的檔案 import 進去用，
// 這樣兩個檔案就能共用同一份資料，而不是各自擁有一份自己的假資料。
// ============================================================
import { reactive } from 'vue'
// axios：打 API 用的套件，這個 <script> 區塊要另外自己 import 一次，
// 跟下面 <script setup> 那個 import axios 是各自獨立的，不會共用。
import axios from 'axios'

// API_BASE：後端 API 專案的網址，跟下面 <script setup> 用的是同一個。
const API_BASE = 'https://localhost:7255'

// currentTestUserId：先用資料庫裡真的存在的測試帳號 id 頂著，等登入系統做好再換掉。
const currentTestUserId = 1

// reactive() 跟前面看到的 ref() 功能很像，也是讓 Vue 追蹤資料變化、
// 資料一改畫面就自動更新。差別是 reactive() 通常用在「物件」或「陣列」上，
// 而且在 <script> 裡面使用它包起來的資料時，不用加 .value（這點跟 ref 不一樣）。

// export const：export 代表「把這個變數開放給其他檔案使用」，
// 其他檔案只要寫 import { currentUser } from '這個檔案路徑'，就能拿到它。
// 這裡先寫死一個「目前登入的使用者」資料，之後如果接上真正的登入系統，
// 只要把這裡換成登入後拿到的真實使用者資料即可。
export const currentUser = {
  name: 'Emily 艾米莉',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily'
}

// 假資料的發布時間改成「相對現在往前推 N 天」，而不是寫死未來日期。
// 這樣不管使用者電腦當下實際日期是哪一天，假資料永遠會比「剛剛發布」的新貼文舊，
// 「最新」分頁排序時，新發的貼文才會保證排在最上面。
//
// 這一行是「箭頭函式」的寫法：(n) => { ... } 的意思是
// 「定義一個函式，它需要一個叫做 n 的輸入值，然後回傳後面算出來的結果」。
// Date.now()：拿到「現在」的時間（用電腦看得懂的數字格式）。
// n * 24 * 60 * 60 * 1000：把「n 天」換算成「n 天總共有幾毫秒」
// （1 天 = 24 小時 = 24*60 分鐘 = 24*60*60 秒 = 24*60*60*1000 毫秒）。
// 用「現在的時間」減掉「n 天份的毫秒數」，就會得到「n 天前的時間」。
// .toISOString()：把時間轉換成一種國際通用的文字格式，方便存起來、之後比較大小。
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

// formatCount：把純數字（例如 1200）轉成「1.2k」這種縮寫格式，只給畫面顯示用。
// 之後接上真的 API 時，後端 likesCount／commentsCount 會是用
// SELECT COUNT(*) FROM Post_Likes WHERE post_id = ... 這種方式算出來的「純數字」，
// 不會是字串，所以資料本身要存數字，顯示的時候才格式化成「1.2k」，
// 這樣排序、比大小的時候才不會出錯（字串 '1.2k' 沒辦法拿來做數學運算或排序）。
export const formatCount = (n) => {
  if (n >= 1000) {
    // (n / 1000).toFixed(1)：除以 1000 後取到小數點第 1 位，例如 1234 → "1.2"
    // .replace(/\.0$/, '')：如果結果剛好是整數（像 "2.0"），把 ".0" 拿掉，變成單純的 "2"
    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return String(n)
}

// posts：全站所有貼文的清單，這是一個陣列，每個元素都是一篇貼文的資料物件。
// 一樣用 export 開放給 CreatePostView.vue 使用。
//
// 欄位對照資料庫（Community_Post + Post_Images + Post_Tagged_Products）：
// communityPostId      對應 post_id
// userId      對應 user_id（真正串 API 後，user 顯示資訊會是後端 join Users 表回傳的）
// content     對應 content（資料庫只有一個欄位，所以原本拆開的 title/desc 合併成一個）
// postDate    對應 post_date
// status      對應 status（貼文狀態，例如 'published' 已發布）
// images      對應 Post_Images 這張表（一篇貼文可以有多張圖，依 sortOrder 排序）
// likesCount / commentsCount   之後會是後端算好的 COUNT(*) 數字，這裡先存純數字
// taggedProducts   對應 Post_Tagged_Products（productId、productRoute 是資料庫真的欄位；
//                   name 是「假設」後端會順便 join 商品名稱回傳，方便畫面直接顯示）
export const posts = reactive([
  {
    communityPostId: 1,
    userId: 1,
    user: { name: 'Amy_穿搭日記', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy' },
    content: '秋季奶茶色系穿搭，寬褲+針織的溫柔搭配。用奶茶色打底，寬褲修飾比例，針織外套增加層次，走在街上也很有電影感。',
    postDate: daysAgo(2), // 呼叫剛剛定義的函式，代表「2 天前發布的」
    status: 'published',
    images: [
      { postImageId: 101, imageFileName: 'outfit-cream-knit.jpg', sortOrder: 1, url: 'https://picsum.photos/seed/outfit-cream-knit/900/720' }
    ],
    likesCount: 1200,
    commentsCount: 89,
    taggedProducts: [{ postTaggedProductId: 1, productId: 3, productRoute: '/shop/product/3', name: '羊毛混紡針織外套' }]
  },
  {
    communityPostId: 2,
    userId: 2,
    user: { name: 'Kevin.style', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin' },
    content: '極簡工裝風｜大地色機能外套通勤也好看。極簡工裝風，大地色機能外套通勤也好看，口袋設計實用又有型。',
    postDate: daysAgo(4),
    status: 'published',
    images: [
      { postImageId: 102, imageFileName: 'outfit-utility-jacket.jpg', sortOrder: 1, url: 'https://picsum.photos/seed/outfit-utility-jacket/700/560' }
    ],
    likesCount: 856,
    commentsCount: 42,
    taggedProducts: [{ postTaggedProductId: 2, productId: 1, productRoute: '/shop/product/1', name: '經典圓領短T' }]
  },
  {
    communityPostId: 3,
    userId: 3,
    user: { name: '小雨 rainy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rainy' },
    content: '約會小心機｜法式碎花洋裝配藤編包 🌸。約會小心機，法式碎花洋裝配藤編包，甜而不膩剛剛好。',
    postDate: daysAgo(1),
    status: 'published',
    images: [
      { postImageId: 103, imageFileName: 'outfit-floral-dress.jpg', sortOrder: 1, url: 'https://picsum.photos/seed/outfit-floral-dress/700/560' }
    ],
    likesCount: 2400,
    commentsCount: 158,
    taggedProducts: [{ postTaggedProductId: 3, productId: 2, productRoute: '/shop/product/2', name: '法式碎花洋裝' }]
  },
  {
    communityPostId: 4,
    userId: 4,
    user: { name: 'Leo_urban', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
    content: '街頭機能風｜背心＋工裝褲率性感。機能背心＋工裝褲，街頭感十足，鞋款選厚底增加率性。',
    postDate: daysAgo(5),
    status: 'published',
    images: [
      { postImageId: 104, imageFileName: 'outfit-street-utility.jpg', sortOrder: 1, url: 'https://picsum.photos/seed/outfit-street-utility/700/560' }
    ],
    likesCount: 631,
    commentsCount: 27,
    taggedProducts: [{ postTaggedProductId: 4, productId: 4, productRoute: '/shop/product/4', name: '修身牛仔褲' }]
  },
  {
    communityPostId: 5,
    userId: 5,
    user: { name: 'Mia.wardrobe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia' },
    content: '極簡膠囊衣櫥｜五件單品排列組合穿一週。挑五件百搭基本款互相搭配，減法生活從衣櫃開始，出門前不再猶豫要穿什麼。',
    postDate: daysAgo(3),
    status: 'published',
    images: [
      { postImageId: 105, imageFileName: 'outfit-capsule-wardrobe.jpg', sortOrder: 1, url: 'https://picsum.photos/seed/outfit-capsule-wardrobe/700/560' }
    ],
    likesCount: 1100,
    commentsCount: 54,
    taggedProducts: [{ postTaggedProductId: 5, productId: 5, productRoute: '/shop/product/5', name: '百褶及膝裙' }]
  }
])

// addPost：一個函式，作用是「把一篇新貼文加到 posts 清單的最前面」。
// CreatePostView.vue 裡使用者按「確認發布」的時候，就會呼叫這個函式。
// posts.unshift(post)：unshift 是 JavaScript 陣列內建的方法，
// 作用是「把新的東西塞進陣列的最前面」（相對的，push 是塞到最後面）。
// 因為 posts 是用 reactive() 包起來的，這裡呼叫 unshift 之後，
// Vue 會自動偵測到「陣列變了」，畫面上有顯示 posts 的地方會自動更新。
export const addPost = (post) => {
  posts.unshift(post)
}

// ------------------------------------------------------------
// 收藏功能：PostDetailView.vue 按「收藏」時，會把貼文加進這份清單；
// UserProfileView.vue 的「收藏」頁籤，直接讀這份清單來顯示。
// 兩個檔案共用同一份 savedPosts，所以只要有一邊改了，另一邊畫面就會自動更新。
// ------------------------------------------------------------

// savedPosts：使用者收藏的貼文清單，一開始是空陣列，等 loadSavedPosts() 打完 API 才會有資料。
export const savedPosts = reactive([])

// loadSavedPosts：跟後端要「這個使用者收藏的所有貼文」，
// 打的是 CommunityFavoriteController.cs 裡的 GET api/CommunityFavorite/user/{userid}。
// App.vue 或這個頁面掛載時呼叫一次，把 savedPosts 填成資料庫裡真正的收藏清單。
export const loadSavedPosts = async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/CommunityFavorite/user/${currentTestUserId}`)
    savedPosts.splice(0, savedPosts.length) // 先清空，避免重複呼叫時舊資料疊加
    res.data.forEach(p => {
      savedPosts.push({
        communityPostId: p.communityPostId,
        content: p.content,
        image: (p.images && p.images.length) ? `${API_BASE}${p.images[0].imageFileName}` : '',
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        tags: (p.taggedProducts || []).map(t => `#${t.name}`)
      })
    })
  } catch (err) {
    console.error('讀取收藏清單失敗：', err)
  }
}

// isPostSaved：檢查某篇貼文（用 communityPostId 判斷）現在是不是已經在收藏清單裡。
// .some(...)：陣列方法，只要陣列裡「有任何一筆」符合條件，就回傳 true，否則回傳 false。
export const isPostSaved = (communityPostId) => savedPosts.some(p => p.communityPostId === communityPostId)

// toggleSavePost：切換某篇貼文的收藏狀態。改成 async，因為裡面要打真正的 API。
// post 參數是一個「整理好格式」的貼文物件，欄位名稱對照 Community_Favorite +
// Community_Post：communityPostId、content、image、likesCount、commentsCount、tags。
export const toggleSavePost = async (post) => {
  const idx = savedPosts.findIndex(p => p.communityPostId === post.communityPostId)

  if (idx === -1) {
    // 還沒收藏過 → 打 POST 新增一筆 Community_Favorite 紀錄
    try {
      await axios.post(`${API_BASE}/api/CommunityFavorite`, {
        userId: currentTestUserId,
        communityPostId: post.communityPostId
      })
    } catch (err) {
      console.error('收藏失敗：', err)
      return // API 失敗就不要動本地清單，避免畫面顯示「已收藏」但資料庫其實沒存到
    }
    savedPosts.unshift(post)
  } else {
    // 已經收藏過了 → 先問後端這筆收藏紀錄的 id，再打 DELETE 刪掉
    try {
      const res = await axios.get(`${API_BASE}/api/CommunityFavorite/post/${post.communityPostId}/user/${currentTestUserId}`)
      if (res.data) {
        await axios.delete(`${API_BASE}/api/CommunityFavorite/${res.data.communityFavoriteId}`)
      }
    } catch (err) {
      console.error('取消收藏失敗：', err)
      return
    }
    savedPosts.splice(idx, 1)
  }
}
</script>

<script setup>
// ============================================================
// 這裡開始是這個頁面「自己專屬」的邏輯，不會被其他檔案拿去用
// ============================================================
import { ref, computed, onMounted } from 'vue'

// posts 已經在上面的 <script> 區塊宣告並 export，這裡同一個檔案內可以直接使用，不用再 import
// axios、API_BASE 現在也移到上面那個 <script> 區塊宣告了（因為 loadSavedPosts 也需要用到），
// 這裡同樣不用再重複 import／宣告一次。

// fetchPosts：向後端要「全部貼文」的資料，成功拿到之後取代掉原本寫死的假資料。
// async function：宣告成「非同步函式」，代表裡面可以用 await「等」一個需要花時間的動作
// （像是打 API 這種要等網路回應的操作）完成，再繼續往下執行，而不會卡住整個網頁。
const fetchPosts = async () => {
  try {
    // axios.get(網址)：對這個網址發送 GET 請求。
    // await：先暫停在這一行，等 API 真的回應了，才把結果存進 res，再往下執行。
    const res = await axios.get(`${API_BASE}/api/CommunityPost`)

    // res.data：axios 已經把後端回傳的 JSON 自動轉換成 JavaScript 的陣列／物件了，
    // 這裡直接可以用 .map(...) 這種陣列方法，不用自己再解析一次字串。
    // .map(p => ({ ... }))：把後端回傳的每一筆資料，轉換成畫面需要的格式。
    // 大部分欄位名稱其實跟後端 DTO 已經一致（因為之前有跟後端一起對過欄位名稱），
    // 這裡主要是幫 images 陣列裡每張圖，組出一個可以直接放進 <img> 的完整網址，
    // 因為後端目前只回傳 imageFileName（檔名），還沒有回傳完整網址。
    const apiPosts = res.data.map(p => ({
      communityPostId: p.communityPostId,
      userId: p.userId,
      user: p.user || { name: '未知使用者', avatar: '' },
      content: p.content,
      postDate: p.postDate,
      status: p.status,
      images: (p.images || []).map(img => ({
        postImageId: img.postImageId,
        imageFileName: img.imageFileName,
        sortOrder: img.sortOrder,
        // imageFileName 本身已經帶路徑了（例如 "/images/posts/post01_1.jpg"），
        // 不是單純的檔名，所以這裡直接接在 API_BASE 後面就好，
        // 不用再自己加一段 /uploads/ 進去（之前那樣寫網址會多一層、變成錯的路徑）。
        url: `${API_BASE}${img.imageFileName}`
      })),
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      taggedProducts: p.taggedProducts || []
    }))

    // posts.splice(0, posts.length, ...apiPosts)：
    // 因為 posts 是 reactive() 陣列，不能直接用 posts = apiPosts 整個換掉
    // （reactive 包起來的變數不能重新賦值，只能改裡面的內容），
    // 所以用 splice 先把陣列裡原本所有假資料都刪掉（從第 0 筆開始，刪 posts.length 筆），
    // 再把 apiPosts 裡的每一筆都塞進去，這樣畫面才會正確地跟著更新。
    posts.splice(0, posts.length, ...apiPosts)
  } catch (err) {
    // 如果打 API 失敗（後端沒開、網址打錯、CORS 設定問題...），
    // 先在瀏覽器主控台印出錯誤內容方便除錯，畫面就繼續顯示原本的假資料，不會整頁空白。
    console.error('讀取貼文列表失敗：', err)
  }
}

// onMounted：Vue 的生命週期鉤子，代表「這個元件的畫面第一次被畫出來、掛載到網頁上之後」
// 要執行的動作。在這裡呼叫 fetchPosts，就是「頁面一打開，就馬上去後端要最新的貼文資料」。
// 同時也呼叫 loadSavedPosts，把這個使用者收藏過的貼文清單一起讀回來。
onMounted(() => {
  fetchPosts()
  loadSavedPosts()
})

// formatCount：跟上面那個 <script>（非 setup）區塊裡的 formatCount 是「一模一樣」的函式，
// 這裡要重複宣告一次，是因為 Vue 的規則是：<template> 只能直接使用宣告在
// 這個 <script setup> 區塊裡的變數／函式，宣告在旁邊那個「非 setup」<script> 裡的東西
// （即使有 export），<template> 是抓不到的，只有「其他檔案」import 進去才抓得到。
// 所以「給別的檔案共用」跟「給這個檔案自己的畫面用」，要各自放一份。
const formatCount = (n) => {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return String(n)
}

// 分頁 Tab 狀態
// 記錄使用者現在點的是「熱門」「最新」還是「追蹤中」哪一個分頁，
// 預設一開始是 'hot'（熱門）。
const currentTab = ref('hot')

// 熱門商品標籤：右側欄要顯示的標籤清單
const popularProducts = ref([
  { id: 1, name: '經典圓領短T' },
  { id: 2, name: '法式碎花洋裝' },
  { id: 3, name: '羊毛混紡針織外套' },
  { id: 4, name: '修身牛仔褲' },
  { id: 5, name: '百褶及膝裙' }
])

// 穿搭達人資料：右側欄「熱門穿搭達人」清單，每個人有自己的追蹤狀態
const creators = ref([
  { id: 1, name: 'Amy_穿搭日記', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy', meta: '2.1萬追蹤', isFollowing: false },
  { id: 2, name: 'Kevin.style', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin', meta: '1.6萬追蹤', isFollowing: false },
  { id: 3, name: '小雨 rainy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rainy', meta: '3.4萬追蹤', isFollowing: true }
])

// 頁籤文案（每個頁籤對應的封面卡標籤與副標、沒有內容時顯示的提示文字）
// 這是一個「物件的物件」，外層用 hot / new / follow 三個 key，
// 對應到現在的三個分頁；每個分頁裡面又是一個小物件，裝著這個分頁要顯示的文字。
const tabCopy = {
  hot:    { ribbon: '封面故事', role: '本週封面 · 秋季選品', empty: '目前沒有符合的熱門穿搭。' },
  new:    { ribbon: '最新發布', role: '剛剛發布的穿搭',      empty: '目前還沒有最新的穿搭貼文。' },
  follow: { ribbon: '追蹤精選', role: '來自你追蹤的達人',    empty: '你還沒有追蹤任何穿搭達人，去右側「熱門穿搭達人」追蹤幾位，這裡就會出現他們的貼文。' }
}

// computed() 是 Vue 提供的另一種「特殊變數」，跟 ref() 不一樣的地方是：
// computed 裡面放的是一段「計算邏輯」，它會根據裡面用到的其他變數
// 自動重新計算結果，你可以把它想成一個「永遠保持最新答案的公式」。
// 例如這裡：只要 currentTab 改變，currentTabCopy 就會自動重新算一次，
// 抓出目前分頁對應的文案，不用自己手動去同步更新。
//
// tabCopy[currentTab.value]：這是「用變數當作 key，去物件裡面找對應的值」的寫法，
// 例如 currentTab.value 是 'hot'，這行就等於在寫 tabCopy.hot。
// || tabCopy.hot：如果前面那個找不到值（結果是 undefined），就改用 tabCopy.hot 當預設值，避免出錯。
const currentTabCopy = computed(() => tabCopy[currentTab.value] || tabCopy.hot)

// 依照目前分頁 (熱門 / 最新 / 追蹤中) 先篩出對應的貼文清單
// 這也是一個 computed，裡面的邏輯比較長，逐行說明在下面。
const tabPosts = computed(() => {
  if (currentTab.value === 'new') {
    // 最新：依發布時間新到舊排序
    // [...posts]：這個寫法叫做「展開運算子」，作用是「複製一份新的陣列」，
    // 不直接對原本的 posts 排序，是為了避免不小心把原始資料的順序也永久打亂。
    // .sort((a, b) => ...)：sort 是陣列排序方法，a、b 代表「拿來互相比較的兩筆資料」。
    // new Date(b.postDate) - new Date(a.postDate)：
    // 把日期文字轉換成「時間」再相減，結果是正數還是負數，決定了 a、b 誰排前面，
    // 這樣寫的效果就是「時間新的排前面、時間舊的排後面」。
    return [...posts].sort(
      (a, b) => new Date(b.postDate) - new Date(a.postDate)
    )
  }
  if (currentTab.value === 'follow') {
    // 追蹤中：只顯示已追蹤達人的貼文
    // .filter(...)：filter 是陣列方法，作用是「留下符合條件的資料，其他丟掉」。
    // 這裡先從 creators 裡面，篩出「isFollowing 是 true」的人，
    // 再用 .map(...) 把這些人的名字抽出來，變成一個「名字陣列」。
    const followingNames = creators.value
      .filter(c => c.isFollowing)
      .map(c => c.name)
    // 接著再對 posts 做一次 filter：只留下「發文者的名字」有出現在
    // followingNames 這個名單裡的貼文。
    return posts.filter(p => followingNames.includes(p.user.name))
  }
  // 熱門：維持假資料原本的順序（可想像成已經依熱度排序好）
  return posts
})

// 搜尋（可搜尋貼文標題、標籤商品、用戶名），在目前分頁的結果之上再過濾一次
// searchQuery：使用者在搜尋框打的文字，會透過 v-model 自動雙向同步（下面 template 會看到）。
const searchQuery = ref('')

const filteredPosts = computed(() => {
  // .trim()：把文字前後多餘的空白刪掉。
  // .toLowerCase()：把文字全部轉成小寫，這樣搜尋 "T恤" 或 "t恤" 才不會因為大小寫不同而搜不到。
  const q = searchQuery.value.trim().toLowerCase()
  const base = tabPosts.value
  // 如果搜尋框是空的，就直接回傳目前分頁的完整清單，不用篩選。
  if (!q) return base
  return base.filter(post => {
    // .includes(q)：判斷字串裡面「有沒有包含」q 這段文字。
    // 原本是搜尋 post.title，因為資料庫沒有分開存 title/desc，改成搜尋 post.content。
    const inContent = post.content.toLowerCase().includes(q)
    const inUser = post.user.name.toLowerCase().includes(q)
    // post.taggedProducts || []：如果這篇貼文沒有 taggedProducts（是 undefined），
    // 就改用一個空陣列 []，避免下面呼叫 .some() 的時候噴錯。
    // .some(...)：只要陣列裡「有任何一筆」符合條件，就回傳 true。
    const inTags = (post.taggedProducts || []).some(p => p.name.toLowerCase().includes(q))
    // 內文、發文者名字、標籤，只要其中一個有搜尋到關鍵字，這篇貼文就會被留下來。
    return inContent || inUser || inTags
  })
})

const filteredCreators = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return creators.value
  return creators.value.filter(c => c.name.toLowerCase().includes(q))
})

const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return popularProducts.value
  return popularProducts.value.filter(p => p.name.toLowerCase().includes(q))
})

// isSearching：判斷「使用者現在是不是正在搜尋」，
// 只要搜尋框去掉前後空白後不是空字串，就代表正在搜尋中。
const isSearching = computed(() => searchQuery.value.trim() !== '')

// 未搜尋時：第一篇當作「封面故事」，其餘進入雙欄網格
// 搜尋時：不特別放大第一篇，全部以網格呈現
// featurePost：如果正在搜尋，就沒有封面故事（回傳 null，也就是「什麼都沒有」）；
// 如果沒有在搜尋，就拿 filteredPosts 陣列的第 0 筆（陣列的第一筆，程式裡都是從 0 開始算）當封面故事。
const featurePost = computed(() => (isSearching.value ? null : filteredPosts.value[0]))
// gridPosts：如果正在搜尋，網格就顯示全部搜尋結果；
// 如果沒有搜尋，網格就顯示「除了第一篇以外」的其他貼文
// （.slice(1) 的意思是「從陣列的第 1 筆開始，取到最後」，等於跳過第 0 筆）。
const gridPosts = computed(() => (isSearching.value ? filteredPosts.value : filteredPosts.value.slice(1)))

// 點擊追蹤按鈕時呼叫：把該達人的 isFollowing 改成相反的值。
// 這裡的 creator 是從 template 裡 @click="toggleFollow(creator)" 傳進來的，
// 代表「使用者點的是哪一位達人」。
const toggleFollow = (creator) => {
  creator.isFollowing = !creator.isFollowing
}
</script>

<template>
  <div class="community-page min-vh-100 w-100">

    

    <div class="container-fluid container-lg pb-5">

      <!-- 頁首：韓風簡約版 — 左側細直線引導，字體維持原本的 Noto Serif TC -->
      <div class="page-head">
        <div class="page-head-inner">
          <div class="page-head-divider"></div>
          <div class="page-head-text">
            <div class="eyebrow">Style Journal</div>
            <h1 class="page-title">CLO Daily</h1>
            <p class="page-sub">紀錄每一天的穿著練習</p>
          </div>
        </div>

        <!-- 搜尋列：可搜尋穿搭標籤、單品或用戶 -->
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <!--
            v-model="searchQuery"：這是「雙向綁定」，白話說：
            使用者在這個輸入框打字，searchQuery 這個變數會自動同步更新；
            反過來，如果程式改了 searchQuery 的值，輸入框顯示的文字也會跟著變。
            不用自己寫「監聽輸入 → 手動更新變數」這種重複的程式碼。
          -->
          <input
            type="text"
            v-model="searchQuery"
            class="search-input"
            placeholder="搜尋標籤、單品或用戶..."
          />
          <!--
            v-if="searchQuery"：只有搜尋框裡有文字的時候，才顯示這個「清除」按鈕。
            @click="searchQuery = ''"：點下去，直接把 searchQuery 設回空字串，等於清空搜尋框。
          -->
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" aria-label="清除搜尋">✕</button>
        </div>
      </div>

      <!-- 分頁與分享按鈕 -->
      <div class="section-row mb-4">
        <div class="tab-group">
          <!--
            這三顆按鈕沒有用 v-for（因為只有固定 3 個、不是從陣列畫出來的），
            是各自手動寫好，但邏輯是一樣的模式：
            :class="{ active: currentTab === 'hot' }"：
            如果目前分頁是 'hot'，就幫這顆按鈕加上 active 樣式（看起來「被選中」）。
            @click="currentTab = 'hot'"：點下去就把目前分頁切成 'hot'。
          -->
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'hot' }"
            @click="currentTab = 'hot'"
          >熱門</button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'new' }"
            @click="currentTab = 'new'"
          >最新</button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'follow' }"
            @click="currentTab = 'follow'"
          >追蹤中</button>
        </div>

        <router-link to="/community/create" class="btn-share text-decoration-none">
          ＋ 分享我的穿搭
        </router-link>
      </div>

      <!-- 主要內容區 -->
      <div class="row g-4">

        <!-- 左側：貼文列表區 -->
        <div class="col-12 col-lg-9">

          <!--
            封面故事卡（依目前分頁取第一筆）
            v-if="featurePost"：只有 featurePost 有值的時候（不是 null）才顯示這張大卡片。
            還記得上面 script 裡的邏輯嗎？正在搜尋的時候 featurePost 會是 null，
            這時候這整塊就不會出現，搜尋結果會全部乖乖排在下面的網格裡。
          -->
          <div class="feature-card" v-if="featurePost">
            <router-link :to="`/community/post/${featurePost.communityPostId}`" class="feature-media d-block text-decoration-none">
              <span class="tag-label">{{ currentTabCopy.ribbon }}</span>
              <img :src="featurePost.images[0]?.url" :alt="featurePost.content" />
            </router-link>
            <div class="feature-body">
              <router-link to="/community/profile" class="author-row text-decoration-none">
                <img class="avatar" :src="featurePost.user.avatar" alt="avatar" />
                <div>
                  <div class="author-name">{{ featurePost.user.name }}</div>
                  <div class="author-role">{{ currentTabCopy.role }}</div>
                </div>
              </router-link>
              <!--
                資料庫的 content 只有一個欄位（不像以前假資料分開存 title/desc），
                所以這裡直接把 content 當內文顯示，不再另外拆一段標題。
              -->
              <router-link :to="`/community/post/${featurePost.communityPostId}`" class="text-decoration-none text-dark">
                <h3>{{ featurePost.content }}</h3>
              </router-link>
              <div class="stat-row">
                <span>♥ {{ formatCount(featurePost.likesCount) }}</span>
                <span>💬 {{ formatCount(featurePost.commentsCount) }}</span>               
              </div>
            </div>
          </div>

          <!--
            沒有結果（搜尋無結果 / 追蹤中還沒有內容 等）
            v-if="filteredPosts.length === 0"：如果篩選完的貼文陣列長度是 0（一筆都沒有），才顯示這個提示。
            裡面用了 {{ }} 搭配三元運算子：
            如果正在搜尋，顯示「找不到符合關鍵字」的訊息（用樣板字串把 searchQuery 塞進句子裡）；
            如果不是搜尋造成的空清單（例如切到「追蹤中」但還沒追蹤任何人），
            就改顯示 currentTabCopy.empty 這個針對目前分頁寫好的提示文字。
          -->
          <div class="empty-state" v-if="filteredPosts.length === 0">
            {{ isSearching ? `找不到符合「${searchQuery}」的穿搭、標籤或用戶，換個關鍵字試試。` : currentTabCopy.empty }}
          </div>

          <!--
            其餘貼文：雙欄網格
            v-if="gridPosts.length"：gridPosts 陣列裡如果「有東西」(長度大於 0，也就是條件成立)，才畫這個區塊。
            v-for="post in gridPosts"：把 gridPosts 裡每一筆貼文都畫成一張小卡片。
          -->
          <div class="post-grid" v-if="gridPosts.length">
            <div v-for="post in gridPosts" :key="post.communityPostId" class="post-card">

              <router-link :to="`/community/post/${post.communityPostId}`" class="post-media d-block text-decoration-none">
                <span class="tag-label" v-if="post.taggedProducts && post.taggedProducts[0]">
                  {{ post.taggedProducts[0].name }}
                </span>
                <!--
                  post.images[0]?.url：images 是一個陣列（對應資料庫 Post_Images 表，
                  一篇貼文可以有多張圖），這裡先固定拿「第一張」當卡片縮圖。
                  ?. 叫做「可選鏈」，如果 post.images 是空陣列、抓不到第 0 張，
                  就不會整個報錯，只會安靜地回傳 undefined。
                -->
                <img :src="post.images[0]?.url" :alt="post.content" />
              </router-link>

              <div class="post-body">
                <router-link to="/community/profile" class="post-author text-decoration-none">
                  <img :src="post.user.avatar" alt="avatar" />
                  <span>{{ post.user.name }}</span>
                </router-link>

                <router-link :to="`/community/post/${post.communityPostId}`" class="text-decoration-none">
                  <p class="post-desc line-clamp-2">{{ post.content }}</p>
                </router-link>

                <div class="post-foot">
                  <!--
                    formatCount(...)：post.likesCount／commentsCount 現在存的是純數字
                    （例如 1200），不是寫死的 '1.2k' 字串，畫面顯示時才呼叫 formatCount
                    轉換成縮寫格式。這樣資料本身仍然是「可以排序、可以比大小」的數字。
                  -->
                  <span>♥ {{ formatCount(post.likesCount) }}</span>
                  <span>💬 {{ formatCount(post.commentsCount) }}</span>                 
                </div>
              </div>
            </div>
          </div>

          <!-- 載入更多 -->
          <div class="load-more-wrap">
            <button class="btn-load">載入更多穿搭 ▾</button>
          </div>
        </div>

        <!-- 右側：側邊欄 -->
        <div class="col-12 col-lg-3">

          <div class="side-card">
            <div class="side-title"><span class="dot"></span>熱門穿搭達人</div>
            <!-- 把 filteredCreators（可能被搜尋篩選過的達人清單）逐筆畫成一列 -->
            <div v-for="creator in filteredCreators" :key="creator.id" class="stylist-row">
              <router-link to="/community/profile" class="d-flex align-items-center text-decoration-none flex-grow-1 min-w-0">
                <img class="stylist-avatar" :src="creator.avatar" alt="avatar" />
                <div class="min-w-0">
                  <div class="stylist-name text-truncate">{{ creator.name }}</div>
                  <div class="stylist-meta">{{ creator.meta }}</div>
                </div>
              </router-link>
              <button
                class="btn-follow"
                :class="{ following: creator.isFollowing }"
                @click="toggleFollow(creator)"
              >
                {{ creator.isFollowing ? '已追蹤' : '追蹤' }}
              </button>
            </div>
          </div>

          <div class="side-card">
            <div class="side-title"><span class="dot"></span>熱門商品標籤</div>
            <div class="tag-cloud" v-if="filteredTags.length">
              <!--
                @click="searchQuery = product.name"：
                點一個標籤，直接把它的名字塞進搜尋框，等於「幫使用者按下這個關鍵字搜尋」。
              -->
              <span
                v-for="product in filteredTags"
                :key="product.id"
                class="tag-chip"
                @click="searchQuery = product.name"
              >#{{ product.name }}</span>
            </div>
            <p class="empty-hint" v-else>沒有符合的標籤</p>
          </div>

          <div class="side-card">
            <p class="side-note">「穿搭不是規則，是每天寫給自己的一封短信。」</p>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/*
  這個 <style> 標籤有加 scoped，代表這裡的 CSS 只會套用在這個檔案自己的 HTML 上，
  不會不小心影響到其他頁面。詳細原理可以參考 UserProfileView.vue 裡的說明。
*/
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');

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
  --font-serif:'Noto Serif TC', serif;
  --font-sans:'Noto Sans TC', sans-serif;
  color: var(--ink);
  font-family: var(--font-sans);
}

/* ---------- 頁首：韓風簡約版（左側細直線引導） ---------- */
.page-head{ padding:2.4rem 0 1.2rem; }
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
  font-family:var(--font-serif);
  font-weight:900;
  font-size:clamp(1.7rem, 3.2vw, 2.1rem);
  line-height:1.1;
  margin:0 0 .4rem;
  color: var(--ink);
}
.page-sub{
  font-family:var(--font-serif);
  font-style:italic;
  color:#9C9086;
  font-size:.92rem;
  margin:0;
}

/* ---------- 搜尋列 ---------- */
.search-bar{
  position:relative;
  display:flex; align-items:center;
  max-width:420px;
  margin-top:1.4rem;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:999px;
  padding:.55rem 1rem;
  transition:border-color .18s ease, box-shadow .18s ease;
}
.search-bar:focus-within{
  border-color:var(--plum);
  box-shadow:0 0 0 3px rgba(122,75,84,.12);
}
.search-icon{ width:17px; height:17px; color:var(--ink-soft); flex-shrink:0; }
.search-input{
  border:none; outline:none; background:transparent;
  flex:1; margin-left:.6rem;
  font-family:var(--font-sans);
  font-size:.88rem; color:var(--ink);
}
.search-input::placeholder{ color:var(--ink-soft); }
.search-clear{
  border:none; background:var(--hairline); color:var(--ink-soft);
  width:20px; height:20px; border-radius:50%; font-size:.7rem;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  cursor:pointer;
}
.search-clear:hover{ background:var(--plum); color:#fff; }

/* ---------- 分頁列 ---------- */
.section-row{
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:1rem;
  border-bottom:1px solid var(--hairline);
  padding-bottom:.2rem;
}
.tab-group{ display:flex; gap:1.8rem; }
.tab-btn{
  background:none; border:none; padding:.7rem 0;
  font-family:var(--font-serif);
  font-size:1.02rem; color:var(--ink-soft);
  position:relative; cursor:pointer;
}
.tab-btn.active{ color:var(--ink); font-weight:700; }
.tab-btn.active::after{
  content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px;
  background:var(--plum);
}
.btn-share{
  background:var(--ink); color:var(--paper) !important; border:none;
  border-radius:999px; padding:.6rem 1.4rem; font-size:.88rem; font-weight:600;
  display:inline-flex; align-items:center; gap:.4rem;
  transition:background .18s ease, transform .18s ease;
}
.btn-share:hover{ background:var(--plum-deep); transform:translateY(-1px); }

/* ---------- 封面故事卡 ---------- */
.feature-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:22px;
  overflow:hidden;
  display:grid;
  grid-template-columns:1.15fr 1fr;
  margin-bottom:1.6rem;
  transition:box-shadow .25s ease;
}
.feature-card:hover{ box-shadow:0 18px 34px -22px rgba(42,36,32,.35); }
.feature-media{ position:relative; overflow:hidden; min-height:320px; background:var(--hairline); }
.feature-media img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .6s ease; }
.feature-card:hover .feature-media img{ transform:scale(1.04); }

.tag-label{
  position:absolute; top:16px; left:16px; z-index:2;
  background:var(--plum); color:#fff;
  font-size:.72rem; letter-spacing:.05em; font-weight:600;
  padding:.32rem .85rem;
  border-radius:999px;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}

.feature-body{ padding:1.9rem 1.8rem; display:flex; flex-direction:column; }
.author-row{ display:flex; align-items:center; gap:.65rem; margin-bottom:1rem; color:var(--ink); }
.avatar{ width:40px; height:40px; border-radius:50%; object-fit:cover; box-shadow:0 0 0 1.5px var(--plum); background:#fff; }
.author-name{ font-weight:700; font-size:.95rem; }
.author-role{ font-size:.76rem; color:var(--ink-soft); }

.feature-body h3{
  font-family:var(--font-serif);
  font-size:1.3rem; font-weight:700; line-height:1.5; margin-bottom:.6rem;
  flex:1;
  /* content 現在是合併過的完整內文，比原本的短標題長很多，用 line-clamp 限制最多顯示 5 行 */
  display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden;
}

.stat-row{
  display:flex; align-items:center; gap:1.2rem;
  border-top:1px dashed var(--hairline); padding-top:1rem; margin-top:1rem;
  font-size:.85rem; color:var(--ink-soft);
}
.stat-row .link-out{ margin-left:auto; color:var(--plum); font-weight:600; text-decoration:none; border-bottom:1px solid var(--plum); }

/* ---------- 貼文網格 ---------- */
.post-grid{ display:grid; grid-template-columns:repeat(2, 1fr); gap:1.4rem; }
.post-card{
  background:var(--paper); border:1px solid var(--hairline);
  border-radius:16px;
  overflow:hidden; transition:transform .25s ease, box-shadow .25s ease;
}
.post-card:hover{ transform:translateY(-4px) rotate(-0.3deg); box-shadow:0 16px 30px -20px rgba(42,36,32,.4); }
.post-media{ position:relative; display:block; aspect-ratio:4/3; overflow:hidden; background:var(--hairline); }
.post-media img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
.post-card:hover .post-media img{ transform:scale(1.06); }
.post-media .tag-label{ font-size:.66rem; padding:.24rem .7rem; top:12px; left:12px; }

.post-body{ padding:1rem 1.1rem 1.2rem; }
.post-author{ display:flex; align-items:center; gap:.5rem; margin-bottom:.6rem; color:var(--ink); }
.post-author img{ width:28px; height:28px; border-radius:50%; object-fit:cover; }
.post-author span{ font-size:.85rem; font-weight:700; }
.post-desc{ font-size:.85rem; color:var(--ink-soft); line-height:1.55; min-height:2.6em; margin:0; }
.post-foot{
  display:flex; align-items:center; gap:1rem; margin-top:.9rem;
  padding-top:.8rem; border-top:1px solid var(--hairline);
  font-size:.8rem; color:var(--ink-soft);
}
.post-foot a{ margin-left:auto; color:var(--plum); text-decoration:none; font-weight:600; }

.line-clamp-2{
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}

.empty-state{
  background:var(--paper); border:1px dashed var(--hairline); border-radius:16px;
  padding:2.2rem 1.5rem; text-align:center; color:var(--ink-soft);
  font-size:.92rem; margin-bottom:1.6rem;
}
.empty-hint{ font-size:.8rem; color:var(--ink-soft); margin:0; }

/* ---------- 載入更多 ---------- */
.load-more-wrap{ text-align:center; margin-top:2.2rem; }
.btn-load{
  background:transparent; border:1px solid var(--ink); color:var(--ink);
  border-radius:999px; padding:.6rem 2rem; font-size:.88rem; letter-spacing:.03em;
  transition:all .2s ease;
}
.btn-load:hover{ background:var(--ink); color:var(--cream); }

/* ---------- 側邊欄 ---------- */
.side-card{ background:var(--paper); border:1px solid var(--hairline); border-radius:16px; padding:1.4rem 1.3rem; margin-bottom:1.4rem; }
.side-title{
  font-family:var(--font-serif); font-weight:700; font-size:1.02rem;
  margin-bottom:1.1rem; display:flex; align-items:center; gap:.5rem; color:var(--ink);
}
.side-title .dot{ width:6px; height:6px; border-radius:50%; background:var(--ochre); }

.stylist-row{ display:flex; align-items:center; gap:.7rem; padding:.65rem 0; border-bottom:1px solid var(--hairline); }
.stylist-row:last-child{ border-bottom:none; padding-bottom:0; }
.stylist-avatar{ width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.stylist-name{ font-weight:700; font-size:.88rem; color:var(--ink); }
.stylist-meta{ font-size:.72rem; color:var(--ink-soft); }
.min-w-0{ min-width:0; }
.btn-follow{
  margin-left:.5rem; font-size:.74rem; padding:.34rem .85rem; border-radius:999px;
  border:1px solid var(--plum); color:var(--plum); background:transparent;
  transition:all .18s ease; white-space:nowrap; flex-shrink:0;
}
.btn-follow.following{ background:var(--hairline); border-color:var(--hairline); color:var(--ink-soft); }
.btn-follow:not(.following):hover{ background:var(--plum); color:#fff; }

.tag-cloud{ display:flex; flex-wrap:wrap; gap:.5rem; }
.tag-chip{
  font-size:.76rem; padding:.38rem .85rem; border-radius:999px;
  background:var(--cream); border:1px solid var(--hairline); color:var(--ink);
  cursor:pointer; transition:all .18s ease;
}
.tag-chip:nth-child(3n+1){ transform:rotate(-1deg); }
.tag-chip:nth-child(3n+2){ transform:rotate(1deg); }
.tag-chip:hover{ border-color:var(--ochre); color:var(--ochre); }

.side-note{
  font-family:var(--font-serif); font-style:italic;
  font-size:.84rem; color:var(--ink-soft); line-height:1.7;
  border-left:2px solid var(--plum); padding-left:.9rem; margin:0;
}

@media (max-width: 991px){
  .feature-card{ grid-template-columns:1fr; }
  .feature-media{ min-height:240px; }
}
@media (max-width: 767px){
  .post-grid{ grid-template-columns:1fr; }
  .section-row{ flex-direction:column; align-items:flex-start; }
  .search-bar{ max-width:100%; }
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