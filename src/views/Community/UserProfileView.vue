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
// api：跟其他頁面共用同一個 axios 實例（src/services/api.js），會自動把登入後的 JWT
// token 帶進 Authorization header，跟直接 import axios from 'axios' 不一樣。
import api from '@/services/api'
// animate：anime.js v4 的動畫函式，這裡用來做編輯貼文彈出視窗的開關動畫，
// 跟 CommunityView.vue、ChatView.vue 是同一個套件、同一套用法。
import { animate } from 'animejs'

// 收藏功能共用資料（跟 PostDetailView.vue 共用同一份收藏清單，直接 import 那個檔案）
// savedPosts：使用者收藏的所有貼文，格式對照 Community_Favorite + Community_Post：
// { communityPostId, content, image, likesCount, commentsCount, tags }。
// formatCount：把純數字（例如 1200）轉成「1.2k」這種縮寫格式，這裡是「跨檔案 import」，
// 跟 CommunityView.vue 自己 <template> 要另外重複宣告一份不一樣——
// 因為這裡是「別的檔案」透過 import 拿到它，並不是同一個 SFC 裡的 <script setup>／<template>
// 那種限制，所以可以直接在這個檔案的 <template> 裡正常使用。
import { savedPosts, loadSavedPosts, formatCount, currentUserId, loadCurrentUserId } from '@/views/Community/CommunityView.vue'

// IMAGE_BASE：圖片是靜態檔案，走的不是 /api 這條路徑，不能直接用 api 服務的
// baseURL（那個含 /api）。這裡把 VITE_API_URL 尾巴的 /api 拿掉，變成純網域。
const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

const route = useRoute()

// onAvatarError：大頭貼圖片載入失敗時執行（例如資料庫存的路徑指到 wwwroot 裡
// 實際上還沒有的檔案），失敗時把圖片來源換成 dicebear 產生的預設頭像，
// 跟 CommunityView.vue 的 onAvatarError 是同一套邏輯。
const onAvatarError = (event, name) => {
  // 用「換過的網址是不是已經是預設圖」來判斷要不要再換一次，而不是用一個存在
  // DOM 元素上的旗標（dataset.fallback）——原因跟 CommunityView.vue 的
  // onAvatarError 註解一樣：這種寫法在「單一、被重複使用」的欄位上會有問題
  // （例如這個檔案自己的大頭貼欄位），舊旗標可能卡住新資料的備援。
  // 改成比對「現在這個網址是不是已經是預設圖網址」，就不會有這種問題。
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
  if (event.target.src === fallbackUrl) return
  event.target.src = fallbackUrl
}

// currentUserId：目前登入者真正的 userId，跟 CommunityView.vue 共用同一份（import 進來的）。
// 這個是「我是誰」，跟下面的 viewedUserId（「我正在看誰的頁面」）是兩回事——
// 只有兩者相等時，才代表「我正在看自己的頁面」，編輯／刪除貼文才該出現。

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
    const res = await api.get(`/CommunityPost/user/${viewedUserId.value}`)
    // 後端回傳的格式（CommunityPostDTO）跟這頁 template 原本期待的格式不太一樣，
    // 這裡把它轉成 template 需要的形狀：content、image（取第一張圖）、likesCount、
    // commentsCount、tags（把 taggedProducts 陣列轉成 '#商品名稱' 字串陣列）。
    userPosts.value = res.data.map(post => ({
      communityPostId: post.communityPostId,
      userId: post.userId,
      status: post.status,
      content: post.content,
      image: post.images && post.images.length > 0
        ? `${IMAGE_BASE}${post.images[0].imageFileName}`
        : '',
      // images：保留完整的原始圖片清單（不是只有第一張），編輯貼文換照片時要用到，
      // 卡片本身的縮圖顯示還是繼續用上面那個扁平的 image 欄位就好。
      images: post.images || [],
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      tags: post.taggedProducts.map(t => `#${t.name}`),
      // taggedProducts：保留完整的原始標記商品清單（不是只有格式化過的 #名稱 字串），
      // 編輯貼文改標記商品時要用到，卡片本身顯示還是繼續用上面那個 tags 就好。
      taggedProducts: post.taggedProducts || []
    }))
    // 貼文數：直接用剛剛抓回來的貼文數量就好，不用另外多打一支 API 算，
    // 跟 CommunityPostController.cs 裡 LikesCount／CommentsCount 用 .Count() 算的道理一樣，
    // 只是這裡前端已經有資料在手上了，直接拿陣列長度更省一次 API 呼叫。
    userProfile.value.postsCount = userPosts.value.length
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
    await api.delete(`/CommunityPost/${communityPostId}`)
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

// availableProducts：可標記的商品清單，跟 CreatePostView.vue 是同一套邏輯，
// 先給空陣列，等 fetchProducts() 打完 API 才會有真正資料庫裡的商品。
const availableProducts = ref([])
const fetchProducts = async () => {
  try {
    const res = await api.get('/Product')
    availableProducts.value = res.data.map(p => ({
      productId: p.productId,
      name: p.productName
    }))
  } catch (err) {
    console.error('讀取商品清單失敗：', err)
  }
}

// productSearch：編輯表單裡「標記標籤商品」搜尋框打的文字。
// 因為同一時間只會有一張卡片在編輯模式，全頁共用一份搜尋狀態就夠了。
const productSearch = ref('')
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) {
    // 沒有搜尋文字時，只列出前 5 個當作「熱門標籤」頂著，不要把商品全部攤開，
    // 不然商品一多，標籤區塊、進而整張卡片就會被拉得越來越長（開會時提到的問題）。
    // 這裡先用 availableProducts 原本的順序（後端 /Product 回來的順序）取前 5 個；
    // 之後如果後端有「熱門商品」（例如依標記次數排序）的 API，把這裡換成打那支 API 就好，
    // 前端邏輯不用變。
    return availableProducts.value.slice(0, 5)
  }
  return availableProducts.value.filter(p => p.name.toLowerCase().includes(q))
})

// toggleEditProduct：點某個商品標籤時執行，已選就取消、未選就加入，跟
// CreatePostView.vue 的 toggleProduct 是同一套邏輯，只是改在編輯表單上操作。
const toggleEditProduct = (name) => {
  const list = editForm.value.taggedProducts
  const idx = list.indexOf(name)
  if (idx === -1) {
    list.push(name)
  } else {
    list.splice(idx, 1)
  }
}

// editForm：編輯表單目前打的內容，對應 CommunityPostController.cs 的
// PutCommunityPost 能改的欄位：content、status、images、taggedProducts。
// images 陣列裡每一筆是 { imageFileName, sortOrder, url, isNew }：
// isNew 是 false 代表這張是「本來就有」的舊照片（imageFileName 是資料庫裡真的路徑）；
// isNew 是 true 代表這張是「這次新選的」照片（imageFileName 先用檔案原始名稱佔位，
// 等圖片上傳功能做好再換成真正存到伺服器後的路徑，跟 CreatePostView.vue 現在的做法一樣）。
// taggedProducts 是商品名稱的字串陣列（跟 CreatePostView.vue 的 selectedProducts 同一種格式）。
const editForm = ref({ content: '', status: 'public', images: [], taggedProducts: [] })

// startEdit：按下「編輯貼文」時執行，把表單內容預先填成這篇貼文現在的資料，
// 並把 editingPostId 設成這篇貼文的 id，畫面上就會展開編輯表單。
const startEdit = (post) => {
  editingPostId.value = post.communityPostId
  productSearch.value = '' // 每次打開編輯表單，搜尋框重設乾淨
  editForm.value = {
    content: post.content,
    status: post.status || 'public',
    images: (post.images || []).map(img => ({
      imageFileName: img.imageFileName,
      sortOrder: img.sortOrder,
      url: `${IMAGE_BASE}${img.imageFileName}`,
      isNew: false
    })),
    taggedProducts: (post.taggedProducts || []).map(t => t.name)
  }
}

// cancelEdit：取消編輯，收起表單，不送出任何變更。
const cancelEdit = () => {
  editingPostId.value = null
}

// ============================================================
// 編輯貼文彈出視窗的開關動畫（Vue <Transition> 的 JS hook 搭配 anime.js）
// ============================================================

// onEditModalEnter：彈出視窗「出現」的時候執行——el 是 Vue 傳進來的
// .edit-modal-overlay 這個真正的 DOM 元素，done 是「動畫播完了，可以繼續」的通知函式。
// 背景（overlay）淡入的同時，裡面的視窗本體（.edit-modal）從稍微縮小的狀態
// 放大回原本尺寸＋淡入，兩層疊在一起有種「從畫面中間浮出來」的感覺，
// 比單純的淡入更有彈出視窗該有的存在感。
const onEditModalEnter = (el, done) => {
  const modalBox = el.querySelector('.edit-modal')
  animate(el, { opacity: [0, 1], duration: 200, ease: 'outQuad' })
  animate(modalBox, {
    opacity: [0, 1],
    scale: [0.92, 1],
    duration: 260,
    ease: 'outQuad',
    onComplete: done
  })
}

// onEditModalLeave：彈出視窗「關閉」的時候執行——跟 enter 相反，背景淡出、
// 視窗本體縮小＋淡出。:css="false" 模式下，leave 的 done() 一定要呼叫，
// 不然 Vue 不知道動畫什麼時候播完，會讓這個元素（連同 Teleport 出去的節點）
// 卡在 DOM 裡拿不掉。
const onEditModalLeave = (el, done) => {
  const modalBox = el.querySelector('.edit-modal')
  animate(el, { opacity: [1, 0], duration: 180, ease: 'inQuad' })
  animate(modalBox, {
    opacity: [1, 0],
    scale: [1, 0.92],
    duration: 180,
    ease: 'inQuad',
    onComplete: done
  })
}

// lightboxImage：目前燈箱裡放大顯示的圖片網址，null 代表燈箱沒有打開。
// openLightbox／closeLightbox：點編輯表單裡的縮圖放大看原圖、點背景或 ✕ 關閉。
const lightboxImage = ref(null)
const openLightbox = (url) => {
  lightboxImage.value = url
}
const closeLightbox = () => {
  lightboxImage.value = null
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
      const uploadRes = await api.post(`/CommunityPost/upload-images`, formData, {
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

  // 把選中的商品名稱陣列，轉換成對應 Post_Tagged_Product 格式的物件陣列，
  // 用 availableProducts.find(...) 找回這個名字對應的 productId，
  // 跟 CreatePostView.vue 組 taggedProducts 的方式完全一樣。
  const taggedProducts = editForm.value.taggedProducts.map(name => {
    const matched = availableProducts.value.find(p => p.name === name)
    return {
      productId: matched ? matched.productId : null,
      productRoute: null
    }
  })

  try {
    await api.put(`/CommunityPost/${post.communityPostId}`, {
      communityPostId: post.communityPostId,
      userId: post.userId,
      content: editForm.value.content,
      status: editForm.value.status,
      images,
      taggedProducts
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
  post.image = images.length > 0 ? `${IMAGE_BASE}${images[0].imageFileName}` : ''
  // 標記商品也要跟著更新畫面：tags（給卡片顯示用的 #名稱 字串）跟
  // taggedProducts（保留原始格式，下次再編輯時要用）都要同步。
  post.tags = editForm.value.taggedProducts.map(name => `#${name}`)
  post.taggedProducts = editForm.value.taggedProducts.map(name => {
    const matched = availableProducts.value.find(p => p.name === name)
    return { name, productId: matched ? matched.productId : null, productRoute: null }
  })
  editingPostId.value = null
  alert('儲存成功！')
}

// onMounted：這個元件的畫面第一次被畫出來之後，自動執行裡面的程式碼一次。
// 跟 PostDetailView.vue 抓單篇貼文的邏輯是一樣的模式。
// 也順便呼叫 loadSavedPosts，避免使用者是直接連進這頁（沒先經過 CommunityView.vue），
// 導致收藏頁籤看起來是空的。
onMounted(async () => {
  fetchUserPosts()
  loadSavedPosts()
  fetchFollowCounts()
  fetchPublicProfile()
  fetchProducts() // 編輯貼文表單要用到，只有看自己的頁面才用得上，但先載入沒關係
  // await loadCurrentUserId()：這頁可能是使用者直接連進來的（沒先經過 CommunityView.vue），
  // currentUserId 這時候還是 null，要先確定拿到真正的 userId，下面比對
  // 「瀏覽的是不是自己」才會準——不然沒登入或還沒查完時，currentUserId.value 是 null，
  // viewedUserId 不可能等於 null，會誤判成「不是自己」而多打一次不必要的查詢。
  await loadCurrentUserId()
  if (viewedUserId.value !== currentUserId.value) {
    fetchFollowStatus()
  }
})

// watch：監看網址上的 :userId 這個參數。
// 跟 PostDetailView.vue 換貼文時遇到的狀況一樣——從「這個人的個人頁」點連結切到
// 「另一個人的個人頁」時，Vue Router 會重複使用同一個元件，onMounted 不會再執行第二次，
// 所以另外監看 :userId，只要它變了（換了要看的人），就重新打一次 API。
watch(() => route.params.userId, () => {
  fetchUserPosts()
  fetchFollowCounts()
  fetchPublicProfile()
  if (viewedUserId.value !== currentUserId.value) {
    fetchFollowStatus()
  } else {
    // 換到看自己的頁面時，重設狀態，避免殘留上一個人的追蹤紀錄 id
    userProfile.value.isFollowing = false
    myFollowId.value = null
  }
})

// 這是頁籤按鈕要顯示的清單：每個頁籤有一個「代號」(key，程式判斷用)
// 跟一個「顯示文字」(label，給人看的)。
// 這裡沒有包 ref()，因為這份清單開頭到結束都不會被改變（不會新增/刪除頁籤），
// 只有純顯示用途，所以不需要讓 Vue 特別去「追蹤」它的變化。
const tabs = [
  { key: 'works', label: '穿搭作品' },
  { key: 'saved', label: '收藏' }
]

// myFollowId：如果目前這個測試帳號已經追蹤這個人，這裡存那筆 User_Follow 紀錄的
// userFollowId，之後要取消追蹤（DELETE）要靠這個 id 才能刪對紀錄。還沒追蹤就是 null。
const myFollowId = ref(null)

// fetchFollowStatus：問後端「這個測試帳號有沒有追蹤現在瀏覽的這個人」，
// 打的是 UserFollowController.cs 裡的 GET api/UserFollow/follower/{followerid}/following/{followingid}。
// fetchFollowCounts：跟後端要「這個人的粉絲數／追蹤中數」，
// 打的是 UserFollowController.cs 裡的 GET api/UserFollow/counts/{userid}。
// fetchPublicProfile：跟後端要「這個人的公開基本資料」（暱稱、帳號、大頭貼、風格標籤、自我介紹），
// 打的是 PublicUserProfileController.cs 裡的 GET api/PublicUserProfile/{userid}。
const fetchPublicProfile = async () => {
  try {
    const res = await api.get(`/PublicUserProfile/${viewedUserId.value}`)
    userProfile.value.name = res.data.username
    userProfile.value.handle = `@${res.data.account}`
    // res.data.avatar 後端存的是相對路徑（例如 /avatars/user002.png），要接上 IMAGE_BASE
    // 才是完整網址；沒設大頭貼的人（avatar 是 null）改成用 dicebear 產生跟這個人帳號綁定
    // 的預設頭像——不能再像原本那樣「維持 userProfile.value.avatar 原本的值」，那個原本的值
    // 是元件一開始寫死的預設圖（seed=Emily），不管換到哪個沒設大頭貼的人的頁面都會長一樣，
    // 也會跟貼文卡片、留言那邊用 username 當 seed 產生出來的頭像對不起來（同一個人在不同頁面
    // 卻顯示兩種不同的預設頭像）。這裡改成一樣用 res.data.username 當 seed，
    // 這樣同一個帳號不管在貼文卡片、留言、還是自己的個人頁，沒設大頭貼時看到的預設圖都會是同一張。
    userProfile.value.avatar = res.data.avatar
      ? `${IMAGE_BASE}${res.data.avatar}`
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.data.username}`
    userProfile.value.bioTag = res.data.styleTag || ''
    userProfile.value.bio = res.data.intro || ''
  } catch (err) {
    console.error('讀取公開個人資料失敗：', err)
  }
}

const fetchFollowCounts = async () => {
  try {
    const res = await api.get(`/UserFollow/counts/${viewedUserId.value}`)
    userProfile.value.followersCount = res.data.followersCount
    userProfile.value.followingCount = res.data.followingCount
  } catch (err) {
    console.error('讀取粉絲/追蹤數失敗：', err)
  }
}

const fetchFollowStatus = async () => {
  try {
    const res = await api.get(`/UserFollow/follower/${currentUserId.value}/following/${viewedUserId.value}`)
    if (res.data) {
      userProfile.value.isFollowing = true
      myFollowId.value = res.data.userFollowId
    } else {
      userProfile.value.isFollowing = false
      myFollowId.value = null
    }
  } catch (err) {
    console.error('讀取追蹤狀態失敗：', err)
  }
}

// toggleFollow：按下「追蹤」按鈕時執行。改成 async，因為裡面要 await 打 API。
const toggleFollow = async () => {
  if (userProfile.value.isFollowing) {
    // 目前是「已追蹤」狀態 → 這次是要取消追蹤 → 打 DELETE，刪掉 myFollowId 那筆紀錄
    try {
      await api.delete(`/UserFollow/${myFollowId.value}`)
    } catch (err) {
      console.error('取消追蹤失敗：', err)
      return // 失敗就不要動畫面上的狀態，維持「已追蹤」原樣
    }
    userProfile.value.isFollowing = false
    myFollowId.value = null
    userProfile.value.followersCount -= 1 // 取消追蹤，粉絲數立刻減 1，不用重新整理頁面才看得到
  } else {
    // 目前是「還沒追蹤」狀態 → 這次是要追蹤 → 打 POST 新增一筆 User_Follow 紀錄
    try {
      await api.post(`/UserFollow`, {
        followerId: currentUserId.value,
        followingId: viewedUserId.value
      })
    } catch (err) {
      console.error('追蹤失敗：', err)
      return
    }
    userProfile.value.followersCount += 1 // 追蹤成功，粉絲數立刻加 1
    // POST 只會回傳成功與否，不會回傳剛剛新增那筆紀錄的 id，
    // 所以要重新問一次後端才知道 myFollowId 是多少（之後要取消追蹤會用到）。
    await fetchFollowStatus()
  }
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
              <img :src="userProfile.avatar" class="avatar-img" alt="Avatar" @error="onAvatarError($event, userProfile.name)" />
            </div>

            <!-- 數據與動作 -->
            <div class="profile-meta">
              <div class="stat-group">
                <div class="stat-item">
                  <!-- {{ }} 雙大括號叫做「插值」，作用是把後面的變數值印到畫面上 -->
                  <div class="stat-num">{{ userProfile.postsCount }}</div>
                  <div class="stat-label">貼文</div>
                </div>
                <!-- router-link 換掉了原本的彈窗按鈕：長列表切到獨立頁面比彈窗好滑、好找 -->
                <router-link :to="`/community/profile/${viewedUserId}/followers`" class="stat-item stat-item-clickable">
                  <div class="stat-num">{{ userProfile.followersCount }}</div>
                  <div class="stat-label">粉絲</div>
                </router-link>
                <router-link :to="`/community/profile/${viewedUserId}/following`" class="stat-item stat-item-clickable">
                  <div class="stat-num">{{ userProfile.followingCount }}</div>
                  <div class="stat-label">追蹤中</div>
                </router-link>
              </div>

              <!-- 只有瀏覽「別人」的個人頁才顯示追蹤／訊息按鈕；瀏覽自己的頁面不會出現這排按鈕 -->
              <div class="action-group" v-if="viewedUserId !== currentUserId">
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
                  改用站內聊天室：原本這裡是 mailto 連結（打開使用者電腦的預設信箱軟體），
                  現在改成 router-link 跳到 ChatView.vue，帶著對方的 viewedUserId，
                  ChatView.vue 自己會判斷「這個人是不是已經聊過天」，決定要開啟現有對話
                  還是開一段新對話。class="btn-message" 還是套用原本的按鈕樣式，
                  外觀不會變，只是從 <a mailto> 換成站內的 <router-link>。
                -->
                <router-link :to="`/community/messages/${viewedUserId}`" class="btn-message">✉ 訊息</router-link>
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
            <!--
              狀態徽章：只有在「看自己的頁面」才顯示——因為別人看不到你 hide/check 狀態的貼文
              （後端已經擋掉了，別人的 userPosts 裡本來就不會有這些），所以這個徽章對別人來說
              永遠不會出現，只有本人才看得到自己貼文目前是公開／隱藏／審核中。
            -->
            <span
              v-if="viewedUserId === currentUserId && post.status !== 'public'"
              class="post-status-badge"
              :class="post.status === 'hide' ? 'badge-hide' : 'badge-check'"
            >{{ post.status === 'hide' ? '隱藏' : '審核中' }}</span>
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
              另外還要 viewedUserId === currentUserId 才顯示——也就是「現在瀏覽的這個人」
              跟「目前登入的我」是同一個人，才代表這是「我自己的」貼文，才能編輯／刪除。
              瀏覽別人的個人頁時，這整塊（包含編輯表單本身）完全不會出現。
            -->
            <template v-if="viewedUserId === currentUserId">
              <!--
                Teleport to="body"：把編輯表單「傳送」到 <body> 底下渲染，脫離原本這張
                貼文卡片狹窄的欄寬限制，這樣才能做成置中的彈出視窗，而不是被卡片撐得
                又窄又長。同一時間只會有一篇貼文在編輯（editingPostId 是單一值），
                所以就算表單搬到 <body> 下面，也不會跟其他卡片衝突。
              -->
              <Teleport to="body">
                <!--
                  Transition + :css="false"：v-if 原本是「一改條件，元素馬上出現／消失」，
                  沒有中間過程。包一層 <Transition>，Vue 才會在元素真正被加進 DOM 之前
                  呼叫 @enter，元素被拿掉之前呼叫 @leave，讓我們有機會在這兩個時間點插入
                  anime.js 的動畫。:css="false" 是告訴 Vue「這裡的動畫由 JS（anime.js）
                  自己控制，不用去偵測 CSS transition/animation 的結束事件」，
                  不然 Vue 預設會等 CSS transitionend 事件，但這裡根本沒有寫 CSS transition。
                  v-if 從原本放在 <Teleport> 上，改成放在裡面這個真正的元素上——
                  Transition 是靠偵測「包住的這個元素」被插入/移除來觸發 enter/leave，
                  v-if 要跟著移到這裡才抓得到。
                -->
                <Transition @enter="onEditModalEnter" @leave="onEditModalLeave" :css="false">
                  <div v-if="editingPostId === post.communityPostId" class="edit-modal-overlay" @click.self="cancelEdit">
                    <div class="edit-modal">
                    <!-- 新增一個標題列：跟原本純表單比起來更有「這是一個彈出視窗」的感覺，右上角 ✕ 也能關閉 -->
                    <div class="edit-modal-header">
                      <h3 class="edit-modal-title">編輯貼文</h3>
                      <button type="button" class="edit-modal-close" @click="cancelEdit">✕</button>
                    </div>

                    <div class="edit-form">
                      <textarea v-model="editForm.content" class="edit-textarea" rows="3"></textarea>

                      <!-- 照片編輯：跟 CreatePostView.vue 的縮圖列是同一套邏輯，只是排版比較精簡 -->
                      <div class="edit-thumb-row">
                        <div class="edit-thumb-item" v-for="(img, idx) in editForm.images" :key="idx">
                          <!-- @click="openLightbox(img.url)"：點縮圖本身放大看原圖，跟點右上角 ✕ 移除圖片是分開的兩個按鈕，不會互相誤觸 -->
                          <img :src="img.url" alt="縮圖" @click="openLightbox(img.url)" />
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
                        第一張會作為封面，點縮圖可以放大看原圖
                      </p>

                      <!-- 標記標籤商品：跟 CreatePostView.vue 是同一套搜尋/選取邏輯，只是改在編輯表單上操作 -->
                      <label class="edit-field-label">標記標籤商品</label>
                      <div class="edit-search-bar">
                        <input
                          type="text"
                          v-model="productSearch"
                          class="edit-search-input"
                          placeholder="輸入商品名稱搜尋，例如：牛仔褲"
                        />
                        <button
                          v-if="productSearch"
                          type="button"
                          class="edit-search-clear"
                          @click="productSearch = ''"
                        >✕</button>
                      </div>
                      <!--
                        沒有打字搜尋的時候，只列出「熱門」的前 5 個標籤，
                        而不是把資料庫裡所有商品全部攤開——不然商品一多，
                        這個標籤區塊、進而整張卡片就會被拉得越來越長。
                        想標記其他商品的話，直接在上面搜尋框打名字就找得到。
                      -->
                      <p class="edit-field-hint" v-if="!productSearch.trim()">熱門標籤，想找其他商品請直接搜尋</p>
                      <div class="tag-cloud">
                        <button
                          v-for="product in filteredProducts"
                          :key="product.productId"
                          type="button"
                          class="tag-chip selectable"
                          :class="{ active: editForm.taggedProducts.includes(product.name) }"
                          @click="toggleEditProduct(product.name)"
                        >#{{ product.name }}</button>
                        <span v-if="filteredProducts.length === 0" class="tag-empty">
                          找不到符合「{{ productSearch }}」的商品
                        </span>
                      </div>
                      <div class="tag-preview" v-if="editForm.taggedProducts.length">
                        <span v-for="name in editForm.taggedProducts" :key="name" class="tag-chip selected-chip">
                          #{{ name }}
                          <button type="button" class="chip-remove" @click="toggleEditProduct(name)">✕</button>
                        </span>
                      </div>

                      <div class="edit-visibility">
                        <label><input type="radio" v-model="editForm.status" value="public" /> 公開</label>
                        <label><input type="radio" v-model="editForm.status" value="hide" /> 隱藏</label>
                      </div>
                    </div>

                    <!-- 底部按鈕獨立在 .edit-form 外面，不會跟著上面內容一起捲動，滑到多長都找得到 -->
                    <div class="edit-modal-footer">
                      <button class="btn-cancel-edit" @click="cancelEdit">取消</button>
                      <button class="btn-save-edit" @click="saveEdit(post)">儲存</button>
                    </div>
                  </div>
                </div>
                </Transition>
              </Teleport>

              <div v-if="editingPostId !== post.communityPostId" class="post-manage-actions">
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
          <!--
            原本這裡是用 emoji（📁）當圖示，跟之前 ChatView.vue 的相機按鈕圖示消失
            是同一類風險：emoji 靠字型渲染，換一台電腦、換個瀏覽器字型設定就可能跑掉或消失；
            這裡也還沒踩到問題，但既然已經在處理圖示一致性，先換成 SVG 畫的線條圖示——
            不吃字型，風格上也比較貼近網站其他地方（搜尋圖示、輪播箭頭）用的線條風。
          -->
          <svg class="empty-icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 8l2.5-4h11L20 8" />
            <path d="M4 8v10a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18V8" />
            <path d="M4 8h16" />
            <path d="M9.5 12h5" />
          </svg>
          <p class="empty-note">「還沒有收藏任何穿搭，去社群逛逛按個收藏吧。」</p>
        </div>
      </div>

    </div>

    <!--
      圖片放大燈箱：跟編輯視窗一樣 Teleport 到 <body>，蓋在最上面。
      放在整個頁面最外層（不是放在某張貼文卡片裡面），這樣不管是哪張卡片、
      哪張縮圖被點開，都共用同一個燈箱，不用每張卡片各自複製一份。
      lightboxImage 有值才顯示；點背景（不是點到圖片本身）就關閉。
    -->
    <Teleport to="body" v-if="lightboxImage">
      <div class="lightbox-overlay" @click.self="closeLightbox">
        <button type="button" class="lightbox-close" @click="closeLightbox">✕</button>
        <img :src="lightboxImage" class="lightbox-image" alt="放大圖片" />
      </div>
    </Teleport>
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
.stat-item-clickable{
  background:none; border:none; padding:0; cursor:pointer;
  text-decoration:none; display:block;
  transition:opacity .18s ease;
}
.stat-item-clickable:hover{ opacity:.7; }
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

.post-status-badge{
  position:absolute; top:12px; right:12px; z-index:2;
  color:#fff; font-size:.68rem; font-weight:700;
  padding:.26rem .7rem; border-radius:999px;
  box-shadow:0 2px 6px rgba(0,0,0,.2);
}
.post-status-badge.badge-hide{ background:var(--ink-soft); }
.post-status-badge.badge-check{ background:var(--ochre); }

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

/*
  edit-modal-overlay：鋪滿整個畫面的半透明黑底，蓋在其他內容上面（position:fixed + inset:0），
  用 flex 置中把 .edit-modal 放在正中間。z-index 開高一點，確保蓋在導覽列之類的元素之上。
  @click.self="cancelEdit"（寫在 template 裡）：點背景（不是點到裡面的表單）就等於取消編輯。

  這裡重新宣告一次跟 .community-page 一樣的顏色變數（--ink、--plum...），是因為 Teleport
  會把這個彈出視窗「搬到」<body> 底下渲染，脫離了原本 .community-page 這個父層元素——
  CSS 變數是跟著 DOM 樹「父傳子」繼承下去的，搬出去之後就不再是 .community-page 的子元素，
  裡面所有用 var(--plum) 之類寫法的樣式全部會抓不到值（之前選好的標籤商品變成一片空白，
  就是因為 var(--plum) 抓不到值，背景跟文字都變不出顏色）。在這裡重新宣告一次，
  底下所有 var(--xxx) 才能正常運作。
*/
.edit-modal-overlay{
  --cream:#F9F4F0;
  --paper:#FFFDFB;
  --ink:#2A2420;
  --ink-soft:#7A6E63;
  --plum:#7A4B54;
  --plum-deep:#5E3941;
  --ochre:#B8862E;
  --hairline:#E4D8CC;
  position:fixed; inset:0;
  background:rgba(42,36,32,.55);
  display:flex; align-items:center; justify-content:center;
  z-index:1000;
  padding:1.5rem;
}
.edit-modal{
  background:var(--paper);
  border-radius:14px;
  width:100%;
  max-width:760px;
  max-height:90vh;
  box-shadow:0 20px 60px rgba(42,36,32,.35);
  display:flex; flex-direction:column;
  overflow:hidden; /* 讓內層 .edit-form 自己捲動，標題列跟底部按鈕才能固定不跟著捲走 */
}
.edit-modal-header{
  display:flex; align-items:center; justify-content:space-between;
  padding:1.2rem 1.6rem;
  border-bottom:1px solid var(--hairline);
  flex-shrink:0;
}
.edit-modal-title{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:1.1rem;
  color:var(--ink); margin:0;
}
.edit-modal-close{
  width:28px; height:28px; border-radius:50%;
  border:none; background:var(--hairline); color:var(--ink-soft);
  font-size:.8rem; line-height:1; cursor:pointer;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  transition:background .18s ease, color .18s ease;
}
.edit-modal-close:hover{ background:var(--plum); color:#fff; }
.edit-field-hint{ font-size:.72rem; color:var(--ink-soft); margin:-.3rem 0 0; }

.edit-form{ display:flex; flex-direction:column; gap:.6rem; padding:1.4rem 1.6rem; overflow-y:auto; }

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
.edit-modal-footer{
  display:flex; gap:.6rem;
  padding:1.1rem 1.6rem;
  border-top:1px solid var(--hairline);
  flex-shrink:0;
}
.edit-modal-footer .btn-cancel-edit,
.edit-modal-footer .btn-save-edit{ flex:1; }

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
.edit-thumb-item img{ width:100%; height:100%; object-fit:cover; display:block; cursor:zoom-in; }
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

.edit-field-label{ font-size:.8rem; font-weight:700; color:var(--ink); }
.edit-search-bar{
  display:flex; align-items:center; gap:.4rem;
  border:1px solid var(--hairline); border-radius:4px;
  padding:.4rem .7rem; background:var(--paper);
}
.edit-search-input{
  flex:1; border:none; outline:none; font-size:.82rem; color:var(--ink); background:transparent;
}
.edit-search-clear{ background:none; border:none; color:var(--ink-soft); font-size:.75rem; }

.tag-chip.selectable{
  background:var(--paper); border:1px solid var(--hairline); color:var(--ink);
  cursor:pointer; transition:all .18s ease;
}
.tag-chip.selectable:hover{ border-color:var(--plum); color:var(--plum); }
.tag-chip.selectable.active{ background:var(--plum); border-color:var(--plum); color:#fff; }
.tag-empty{ font-size:.76rem; color:var(--ink-soft); }

.tag-preview{ display:flex; flex-wrap:wrap; gap:.4rem; }
.tag-chip.selected-chip{
  background:var(--plum); border:1px solid var(--plum); color:#fff;
  display:inline-flex; align-items:center; gap:.35rem;
}
.chip-remove{ background:none; border:none; color:#fff; font-size:.68rem; line-height:1; opacity:.8; }
.chip-remove:hover{ opacity:1; }
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

/*
  燈箱（lightbox）：點編輯表單裡的縮圖時，把原圖放大顯示在最上層。
  一樣用 Teleport 搬到 <body> 下面，所以這裡也要重新宣告一次顏色變數，
  理由跟上面 .edit-modal-overlay 註解講的一樣——不過燈箱本身用到的顏色不多，
  這裡只是保險加上，之後如果燈箱樣式要用到 var(--xxx) 也不會抓空值。
*/
.lightbox-overlay{
  --ink:#2A2420;
  position:fixed; inset:0;
  background:rgba(20,16,14,.88);
  display:flex; align-items:center; justify-content:center;
  z-index:1100;
  padding:2rem;
  cursor:zoom-out;
}
.lightbox-image{
  max-width:90vw; max-height:88vh;
  object-fit:contain;
  border-radius:6px;
  box-shadow:0 20px 60px rgba(0,0,0,.5);
  cursor:default; /* 圖片本身不算「背景」，不用跟著顯示可以關閉的游標 */
}
.lightbox-close{
  position:fixed; top:1.5rem; right:1.8rem;
  width:38px; height:38px; border-radius:50%;
  border:none; background:rgba(255,255,255,.15); color:#fff;
  font-size:1rem; line-height:1; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background .18s ease;
}
.lightbox-close:hover{ background:rgba(255,255,255,.3); }


/* ---------- 其他頁籤空狀態 ---------- */
.empty-state{
  background:var(--paper); border:1px solid var(--hairline); border-radius:22px;
  padding:3.5rem 2rem; text-align:center; margin-top:2rem;
}
.empty-icon{ display:block; margin:0 auto .8rem; color:var(--ink-soft); opacity:.7; }
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