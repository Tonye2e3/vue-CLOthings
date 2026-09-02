<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/api'

// LINE/Facebook 分享圖示改用專案自己的 SVG 元件，不再依賴 Font Awesome CDN
import IconFacebook from '@/components/icons/IconFacebook.vue'
import IconLine from '@/components/icons/IconLine.vue'
// anime.js：按讚愛心的彈跳效果
import { animate } from 'animejs'

// 收藏功能跟 UserProfileView.vue 共用同一份清單
import { isPostSaved, toggleSavePost, currentUserId, loadCurrentUserId } from '@/views/Community/CommunityView.vue'

// 找不到圖片時的保底畫面
import postImage from '@/assets/Postimage/post2.jpg'

// 圖片是靜態檔案，走純網域不走 /api
const IMAGE_BASE = import.meta.env.VITE_API_URL

const route = useRoute()

// 大頭貼載入失敗時換成 dicebear 預設圖；比對網址而非用旗標，避免同一個 img 元素重複使用時卡住舊狀態
const onAvatarError = (event, name) => {
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
  if (event.target.src === fallbackUrl) return
  event.target.src = fallbackUrl
}

// 貼文詳細資料，先放一份載入中的假資料避免 API 還沒回來時報錯
const post = ref({
  communityPostId: null,
  userId: null,
  user: {
    name: '載入中...',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    location: '',
  },
  isFollowing: false,
  postDate: new Date().toISOString(),
  status: 'published',
  images: [{ postImageId: null, imageFileName: null, sortOrder: 1, url: postImage }],
  content: '',
  commentsCount: 0,
  isLiked: false,
  taggedProducts: [],
})

// 找不到這篇貼文時顯示「找不到這篇貼文」
const notFound = ref(false)

// 貼文完整資料還沒抓回來之前顯示骨架佔位畫面
const postLoading = ref(true)

// 主圖輪播現在顯示第幾張（從 0 開始），換貼文時要記得歸零
const currentImageIndex = ref(0)

const prevImage = () => {
  const len = post.value.images.length
  currentImageIndex.value = (currentImageIndex.value - 1 + len) % len
  restartAutoplay() // 手動切過圖，計時器重算，避免馬上又被自動播放跳走
}
const nextImage = () => {
  const len = post.value.images.length
  currentImageIndex.value = (currentImageIndex.value + 1) % len
  restartAutoplay()
}

// ---------- 主圖自動輪播 ----------

const AUTOPLAY_INTERVAL = 4000
let autoplayTimer = null

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

const startAutoplay = () => {
  stopAutoplay()
  if (post.value.images.length <= 1) return
  autoplayTimer = setInterval(() => {
    const len = post.value.images.length
    currentImageIndex.value = (currentImageIndex.value + 1) % len
  }, AUTOPLAY_INTERVAL)
}

const restartAutoplay = () => {
  startAutoplay()
}

const fetchPost = async () => {
  const id = route.params.id
  postLoading.value = true
  try {
    const res = await api.get(`/CommunityPost/${id}`)

    // 這支 API 找不到資料時回傳 null，不是丟 404
    if (!res.data) {
      notFound.value = true
      return
    }

    const p = res.data
    post.value = {
      communityPostId: p.communityPostId,
      userId: p.userId,
      user: p.user
        ? {
          ...p.user,
          avatar: p.user.avatar
            ? `${IMAGE_BASE}${p.user.avatar}`
            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.user.name,
        }
        : { name: '未知使用者', avatar: '', location: '' },
      isFollowing: false, // 實際狀態由 fetchFollowStatus() 另外查
      postDate: p.postDate,
      status: p.status,
      images: (p.images && p.images.length)
        ? p.images.map(img => ({
          postImageId: img.postImageId,
          imageFileName: img.imageFileName,
          sortOrder: img.sortOrder,
          url: `${IMAGE_BASE}${img.imageFileName}`
        }))
        : [{ postImageId: null, imageFileName: null, sortOrder: 1, url: postImage }],
      content: p.content,
      commentsCount: p.commentsCount ?? 0,
      isLiked: false, // 實際狀態由 fetchLikeStatus() 另外查
      taggedProducts: p.taggedProducts || []
    }
    likesNumber.value = p.likesCount ?? 0

    // 要等 images 真的載入完成才能開始自動輪播
    startAutoplay()

    // 必須等 post.value 整包設定完才呼叫這兩支——它們原本跟 fetchPost 平行呼叫，
    // 但 post.value = {...} 是整包蓋掉，會把已經正確設好的 isLiked/isFollowing 蓋回 false
    fetchFollowStatus()
    fetchLikeStatus()
  } catch (err) {
    console.error('讀取貼文詳細資料失敗：', err)
    notFound.value = true
  } finally {
    postLoading.value = false
  }
}

// 已按讚的話存這筆 Post_Like 的 id，取消讚要用；沒按過是 null
const myLikeId = ref(null)

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

// scrollToComments：捲動到留言區塊，不管是從外部帶 #comments 網址進來，
// 還是直接點這頁自己動作列上的留言圖示，都共用同一個函式。
const scrollToComments = async () => {
  await nextTick()
  document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// scrollToCommentsIfNeeded：網址如果帶著 #comments（從 CommunityView.vue 的貼文卡片
// 點「留言」數字過來就是這樣），資料抓回來、畫面渲染完之後自動捲到留言區塊，
// 不用使用者自己往下滑找。
const scrollToCommentsIfNeeded = () => {
  if (route.hash !== '#comments') return
  scrollToComments()
}

onMounted(async () => {
  // 先確定拿到真正的 userId，fetchPost（追蹤狀態）、fetchLikeStatus 才查得到對的人
  await loadCurrentUserId()
  await Promise.all([fetchPost(), fetchComments(), fetchSimilarPosts()])
  scrollToCommentsIfNeeded()
})

// 切換到別篇貼文時 Vue Router 會重用元件，onMounted 不會再跑，靠 watch 補上
watch(() => route.params.id, async () => {
  notFound.value = false
  newComment.value = ''
  replyingTo.value = null
  currentImageIndex.value = 0
  stopAutoplay()
  visibleCommentCount.value = COMMENTS_PAGE_SIZE
  await Promise.all([fetchPost(), fetchComments(), fetchSimilarPosts()])
  scrollToCommentsIfNeeded()
})

onUnmounted(() => {
  stopAutoplay()
})

// 把 ISO 時間轉成「N 小時前」這種相對時間文字
const formatTimeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffHours = Math.round(diffMs / (60 * 60 * 1000))
  if (diffHours < 1) return '剛剛'
  if (diffHours < 24) return `${diffHours} 小時前`
  return `${Math.round(diffHours / 24)} 天前`
}

// 把 ISO 時間轉成「2026-06-06 12:00」固定格式
const formatDateTime = (dateStr) => {
  const d = new Date(dateStr)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

const postTimeDisplay = computed(() => formatDateTime(post.value.postDate))

// 存純數字方便加減，畫面顯示時再轉千分位
const likesNumber = ref(1248)
const likesDisplay = computed(() => likesNumber.value.toLocaleString())

// 按讚愛心的 DOM 參照，animateLikeIcon 要用
const likeIconEl = ref(null)

// 按讚/取消讚時的彈跳回饋，純視覺效果跟 API 結果無關，立刻執行不等 API
const animateLikeIcon = () => {
  if (!likeIconEl.value) return
  animate(likeIconEl.value, {
    scale: [1, 1.4, 1],
    duration: 380,
    ease: 'outBack',
  })
}

const toggleLike = async () => {
  animateLikeIcon()
  if (post.value.isLiked) {
    try {
      await api.delete(`/PostLike/${myLikeId.value}`)
    } catch (err) {
      console.error('取消讚失敗：', err)
      return
    }
    post.value.isLiked = false
    myLikeId.value = null
    likesNumber.value -= 1
  } else {
    try {
      await api.post(`/PostLike`, {
        communityPostId: post.value.communityPostId,
        userId: currentUserId.value,
      })
    } catch (err) {
      console.error('按讚失敗：', err)
      return
    }
    // POST 不回傳新紀錄的 id，重新查一次才知道 myLikeId
    await fetchLikeStatus()
    likesNumber.value += 1
  }
}

// 從共用收藏清單即時判斷，不自己存一份狀態
const isSaved = computed(() => isPostSaved(post.value.communityPostId))

const toggleSave = () => {
  toggleSavePost({
    communityPostId: post.value.communityPostId,
    content: post.value.content,
    image: post.value.images[0]?.url,
    likesCount: likesNumber.value,
    commentsCount: post.value.commentsCount,
    tags: post.value.taggedProducts.map(t => `#${t.name}`)
  })
}

// ---------- 分享功能 ----------

// 短網址還沒拿到之前的備援網址
const fullShareUrl = computed(() => `${window.location.origin}/community/post/${route.params.id}`)

const shortUrl = ref(null)
const fetchingShortUrl = ref(false)
const shareUrl = computed(() => shortUrl.value || fullShareUrl.value)

// 跟後端要短碼；後端同一篇貼文只會生一次，這裡重複呼叫也不會產生新短碼
// 短網址走後端網域（不是前端 SPA），因為 /s/{code} 轉址是後端在處理，
// 要在載入前端 App 之前就先查資料庫決定導去哪
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

const showShareMenu = ref(false)
const toggleShareMenu = () => {
  showShareMenu.value = !showShareMenu.value
  if (showShareMenu.value) ensureShortUrl()
}
const closeShareMenu = () => {
  showShareMenu.value = false
}

// ---------- 檢舉功能 ----------

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

// 後端用 { ok, code } 表示「已經檢舉過」（不是真的 409 狀態碼），要檢查 res.data.ok
const submitReport = async () => {
  const reason = reportReason.value.trim()
  if (!reason) return
  reportSubmitting.value = true
  try {
    const res = await api.post('/PostReport', {
      communityPostId: post.value.communityPostId,
      reporterId: currentUserId.value,
      reason,
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

// 複製成功後短暫顯示「已複製！」
const linkCopied = ref(false)
const copyLink = async () => {
  await ensureShortUrl()
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    linkCopied.value = true
    setTimeout(() => {
      linkCopied.value = false
    }, 1500)
  } catch (err) {
    console.error('複製連結失敗：', err)
  }
}

// 走各平台自己的分享連結格式，不用串接 API 金鑰
const shareToLine = async () => {
  await ensureShortUrl()
  window.open(
    `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl.value)}`,
    '_blank',
  )
  closeShareMenu()
}
const shareToFacebook = async () => {
  await ensureShortUrl()
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`,
    '_blank',
  )
  closeShareMenu()
}

// 手機瀏覽器內建的系統分享面板，桌機大多不支援
const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share
const nativeShare = async () => {
  await ensureShortUrl()
  try {
    await navigator.share({ title: post.value.content, url: shareUrl.value })
  } catch (err) {
    // 使用者自己取消系統分享面板也會跑到這裡，是正常操作
  }
  closeShareMenu()
}

// 相似穿搭推薦：跟這篇貼文標記過同一個商品的其他貼文
const similarPosts = ref([])

const fetchSimilarPosts = async () => {
  try {
    const res = await api.get(`/CommunityPost/similar/${route.params.id}`)
    similarPosts.value = res.data.map((p) => ({
      communityPostId: p.communityPostId,
      image: p.images && p.images.length ? `${IMAGE_BASE}${p.images[0].imageFileName}` : postImage,
    }))
  } catch (err) {
    console.error('讀取相似穿搭推薦失敗：', err)
  }
}

// 留言列表，等 fetchComments() 打完才有資料
const comments = ref([])

// 把一維陣列依 parentCommentId 整理成主留言 + 縮排回覆的巢狀結構
const groupedComments = computed(() => {
  const topLevel = comments.value
    .filter(c => !c.parentCommentId)
    .sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate)) // 主留言新到舊
  return topLevel.map(c => ({
    ...c,
    replies: comments.value
      .filter(r => r.parentCommentId === c.postCommentId)
      .sort((a, b) => new Date(a.commentDate) - new Date(b.commentDate)) // 回覆舊到新
  }))
})

// ---------- 留言分頁 ----------

const COMMENTS_PAGE_SIZE = 5
const visibleCommentCount = ref(COMMENTS_PAGE_SIZE)
const visibleGroupedComments = computed(() => groupedComments.value.slice(0, visibleCommentCount.value))
const hasMoreComments = computed(() => visibleCommentCount.value < groupedComments.value.length)
const loadMoreComments = () => {
  visibleCommentCount.value += COMMENTS_PAGE_SIZE
}

// 目前正在回覆哪一則留言，null 代表發新的主留言
const replyingTo = ref(null)

const startReply = (comment) => {
  replyingTo.value = comment
}
const cancelReply = () => {
  replyingTo.value = null
}

const fetchComments = async () => {
  try {
    const res = await api.get(`/PostComment/post/${route.params.id}`)
    comments.value = res.data.map(c => ({
      ...c,
      avatar: c.avatar
        ? `${IMAGE_BASE}${c.avatar}`
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.user,
    }))
  } catch (err) {
    console.error('讀取留言失敗：', err)
  }
}

const newComment = ref('')

// 已追蹤這篇貼文作者的話存 userFollowId，取消追蹤要用；沒追蹤是 null
const myFollowId = ref(null)

const fetchFollowStatus = async () => {
  try {
    const res = await api.get(
      `/UserFollow/follower/${currentUserId.value}/following/${post.value.userId}`,
    )
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

const toggleFollow = async () => {
  if (post.value.isFollowing) {
    try {
      await api.delete(`/UserFollow/${myFollowId.value}`)
    } catch (err) {
      console.error('取消追蹤失敗：', err)
      return
    }
    post.value.isFollowing = false
    myFollowId.value = null
  } else {
    try {
      await api.post(`/UserFollow`, {
        followerId: currentUserId.value,
        followingId: post.value.userId,
      })
    } catch (err) {
      console.error('追蹤失敗：', err)
      return
    }
    await fetchFollowStatus()
  }
}

const addComment = async () => {
  if (!newComment.value.trim()) return

  try {
    await api.post(`/PostComment`, {
      parentCommentId: replyingTo.value ? replyingTo.value.postCommentId : null,
      communityPostId: post.value.communityPostId,
      userId: currentUserId.value,
      commentText: newComment.value,
    })
  } catch (err) {
    console.error('送出留言失敗：', err)
    alert('請登入後再留言！')
    return
  }

  newComment.value = ''
  replyingTo.value = null
  post.value.commentsCount += 1
  fetchComments() // 重打一次拿到真正的 postCommentId、commentDate 等欄位
}

//==============================================================
//測試按鈕資料
//檢舉留言
const demoReportData = [
  {
    contact: '詐騙,欠檢舉',
  },
  {
    contact: '不實廣告,冒犯言論',
  },
  {
    contact: '色情,不實廣告',
  },
]
// 隨機選擇一筆範例資料並填入表單
function selectReportDemoData() {
  const selected = demoReportData[Math.floor(Math.random() * demoReportData.length)]
  reportReason.value = selected.contact
}
//留言
const demoCommentData = [
  {
    contact: '這篇文章很棒！',
  },
  {
    contact: '我也有同樣的疑問，請問作者可以解答嗎？',
  },
  {
    contact: '謝謝分享，受益良多！',
  },
]
// 隨機選擇一筆範例資料並填入表單
function selectCommentDemoData() {
  const selected = demoCommentData[Math.floor(Math.random() * demoCommentData.length)]
  newComment.value = selected.contact
}
//===================================================================


</script>

<template>
  <div class="community-page min-vh-100 w-100">
    <div class="container-fluid container-lg pb-5 pt-4">

      <!-- 返回社群按鈕：跟 CreatePostView.vue 的 back-pill 同一顆按鈕、同一套樣式 -->
      <router-link to="/community" class="back-pill">← 返回社群</router-link>

      <!-- 骨架佔位畫面，取代原本資料回來前直接空白的體驗 -->
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
            <div class="skeleton-block skeleton-line skeleton-line-90" style="margin-top: 1.2rem"></div>
            <div class="skeleton-block skeleton-line skeleton-line-60" style="margin-top: 0.6rem"></div>
          </div>
        </div>
        <div class="col-12 col-lg-4">
          <div class="skeleton-block skeleton-side-card"></div>
        </div>
      </div>

      <!-- 找不到這篇貼文（網址被亂改或已刪除） -->
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
              <router-link :to="`/community/profile/${post.userId}`" class="author-info text-decoration-none">
                <img :src="post.user.avatar" class="author-avatar" alt="avatar"
                  @error="onAvatarError($event, post.user.name)" />
                <div>
                  <h6 class="author-name">{{ post.user.name }}</h6>
                  <small class="author-meta">{{ postTimeDisplay }} · {{ post.user.location }}</small>
                </div>
              </router-link>
              <button class="btn-follow-main" :class="{ following: post.isFollowing }" @click="toggleFollow">
                {{ post.isFollowing ? '已追蹤' : '＋ 追蹤' }}
              </button>
            </div>

            <!-- 主圖輪播：@mouseenter/@mouseleave 讓滑鼠移到主圖上時暫停自動輪播 -->
            <div class="post-media" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
              <span class="tag-label" v-if="post.taggedProducts[0]">封面故事</span>
              <img :src="post.images[currentImageIndex]?.url" class="post-image" alt="post image" />

              <!-- 超過 1 張才顯示箭頭／圓點 -->
              <template v-if="post.images.length > 1">
                <button class="media-arrow media-arrow-prev" @click="prevImage" aria-label="上一張">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button class="media-arrow media-arrow-next" @click="nextImage" aria-label="下一張">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4"
                    stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <div class="media-dots">
                  <button v-for="(img, idx) in post.images" :key="idx" class="media-dot"
                    :class="{ active: idx === currentImageIndex }" @click="
                      currentImageIndex = idx;
                    restartAutoplay();
                    "></button>
                </div>
              </template>
            </div>

            <!-- 縮圖列：跟主圖同一份 post.images，點法互通 -->
            <div class="post-thumb-row" v-if="post.images.length > 1">
              <button v-for="(img, idx) in post.images" :key="idx" class="post-thumb-item"
                :class="{ active: idx === currentImageIndex }" @click="
                  currentImageIndex = idx;
                restartAutoplay();
                ">
                <img :src="img.url" alt="縮圖" />
              </button>
            </div>

            <!-- 按讚/分享/收藏 動作列 -->
            <div class="action-bar">
              <div class="action-left">
                <button class="action-btn" :class="{ liked: post.isLiked }" @click="toggleLike">
                  <!-- 已按讚時整顆心實心紅色，還沒按讚時空心線條 -->
                  <svg ref="likeIconEl" class="icon-inline" viewBox="0 0 24 24" width="16" height="16"
                    :fill="post.isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {{ likesDisplay }}
                </button>
                <button class="action-btn" @click="scrollToComments">
                  <svg class="icon-inline" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path
                      d="M21 12c0 4.4-4 8-9 8-1.1 0-2.1-.2-3-.5L4 21l1.3-4.2A7.8 7.8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
                  </svg>
                  {{ post.commentsCount }}
                </button>
                <!-- share-wrapper：position:relative 讓選單相對這個按鈕定位 -->
                <div class="share-wrapper">
                  <button class="action-btn" @click="toggleShareMenu">↗ 分享</button>

                  <!-- 透明背景鋪滿全畫面，點選單外面直接關閉，不用另外偵測點擊位置 -->
                  <div v-if="showShareMenu" class="share-menu-backdrop" @click="closeShareMenu"></div>
                  <div v-if="showShareMenu" class="share-menu">
                    <button v-if="canNativeShare" type="button" class="share-menu-item" @click="nativeShare">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.6 13.5l6.8 4" />
                        <path d="M15.4 6.5l-6.8 4" />
                      </svg>
                      系統分享
                    </button>
                    <button type="button" class="share-menu-item" @click="copyLink">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
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

                <!-- 檢舉：跟分享選單同一種定位邏輯 -->
                <div class="report-wrapper">
                  <button class="action-btn" @click="toggleReportMenu">
                    <svg class="icon-inline" viewBox="0 0 24 24" width="15" height="15" fill="none"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 3v18" />
                      <path d="M5 4h13l-3 4 3 4H5" />
                    </svg>
                    檢舉
                  </button>
                  <div v-if="showReportMenu" class="share-menu-backdrop" @click="closeReportMenu"></div>
                  <div v-if="showReportMenu" class="report-panel">
                    <p class="report-panel-title">檢舉這篇貼文</p>
                    <!-- 測試按鈕 -->
                    <button type="button" class="report-btn-demo" @click="selectReportDemoData">
                      填入測試資料
                    </button>

                    <textarea v-model="reportReason" class="report-textarea" rows="3"
                      placeholder="請簡短說明檢舉原因（例如：不實廣告、冒犯言論...）"></textarea>
                    <div class="report-panel-actions">
                      <button type="button" class="report-btn-cancel" @click="closeReportMenu">
                        取消
                      </button>
                      <button type="button" class="report-btn-submit"
                        :disabled="!reportReason.trim() || reportSubmitting" @click="submitReport">
                        {{ reportSubmitting ? '送出中...' : '送出檢舉' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 收藏按鈕：更新共用收藏清單，UserProfileView.vue 收藏頁籤才看得到 -->
              <button class="action-btn" :class="{ saved: isSaved }" @click="toggleSave">
                <svg class="icon-inline" viewBox="0 0 24 24" width="14" height="14"
                  :fill="isSaved ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {{ isSaved ? '已收藏' : '收藏' }}
              </button>
            </div>

            <!-- 貼文文字描述 -->
            <p class="post-content">{{ post.content }}</p>

            <!-- 標記商品：點下去帶 ?tag= 查詢字串到社群首頁，等同幫使用者搜尋這個商品名稱 -->
            <div class="tagged-products" v-if="post.taggedProducts.length">
              <span class="tagged-label">標記商品</span>
              <div class="tag-cloud">
                <router-link v-for="tag in post.taggedProducts" :key="tag.postTaggedProductId"
                  :to="`/community?tag=${encodeURIComponent(tag.name)}`" class="tag-chip">#{{ tag.name }}</router-link>
              </div>
            </div>

            <!-- 留言區塊：id="comments" 讓外面（CommunityView.vue 的貼文卡片）可以用網址加
                 #comments 直接連過來，進頁面後自動捲到這裡，不用使用者自己往下滑找留言 -->
            <div class="comment-block" id="comments">
              <div class="comment-title">
                <span class="dot"></span>留言
              </div>
              <!-- //測試按鈕 -->
              <button class="btn-demo" @click="selectCommentDemoData">填入測試資料</button>

              <!-- 正在回覆某則留言時顯示提示，可按 ✕ 取消 -->
              <div v-if="replyingTo" class="replying-to-row">
                回覆 <strong>@{{ replyingTo.user }}</strong>
                <button class="btn-cancel-reply" @click="cancelReply">✕</button>
              </div>

              <!-- 輸入留言放最上面，不用先滑過所有留言才看得到輸入框 -->
              <div class="comment-input-row">
                <input type="text" v-model="newComment" class="comment-input"
                  :placeholder="replyingTo ? `回覆 @${replyingTo.user}...` : '留下你的想法...'" @keyup.enter="addComment" />
                <button class="btn-send" @click="addComment">送出</button>
              </div>

              <div class="comments-list">
                <!-- 只跑目前願意顯示的主留言（分頁），每則底下再跑 c.replies 畫回覆 -->
                <div v-for="c in visibleGroupedComments" :key="c.postCommentId" class="comment-thread">
                  <div class="comment-row">
                    <router-link :to="`/community/profile/${c.userId}`">
                      <img :src="c.avatar" class="comment-avatar" alt="avatar" @error="onAvatarError($event, c.user)" />
                    </router-link>
                    <div class="comment-bubble">
                      <router-link :to="`/community/profile/${c.userId}`" class="comment-user">{{ c.user
                      }}</router-link>
                      <span>{{ c.commentText }}</span>
                      <div class="comment-meta">
                        <span class="comment-time">{{ formatDateTime(c.commentDate) }}</span>
                        <button class="btn-reply" @click="startReply(c)">回覆</button>
                      </div>
                      <span v-if="c.replies.length" class="reply-count">已回覆 {{ c.replies.length }} 則</span>
                    </div>
                  </div>

                  <!-- 回覆往內縮排，跟 IG 呈現方式一樣 -->
                  <div v-for="r in c.replies" :key="r.postCommentId" class="comment-row comment-reply">
                    <router-link :to="`/community/profile/${r.userId}`">
                      <img :src="r.avatar" class="comment-avatar" alt="avatar" @error="onAvatarError($event, r.user)" />
                    </router-link>
                    <div class="comment-bubble">
                      <router-link :to="`/community/profile/${r.userId}`" class="comment-user">{{ r.user
                      }}</router-link>
                      <span>{{ r.commentText }}</span>
                      <div class="comment-meta">
                        <span class="comment-time">{{ formatDateTime(r.commentDate) }}</span>
                        <button class="btn-reply" @click="startReply(c)">回覆</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 查看更多留言：全部顯示完就自動收起 -->
              <div class="load-more-comments-wrap" v-if="hasMoreComments">
                <button class="btn-load-comments" @click="loadMoreComments">查看更多留言 ▾</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 右側：這套穿搭的商品與推薦區 -->
        <div class="col-12 col-lg-4">

          <!-- 只顯示作者真的標記過的商品，沒標記的貼文這張卡片不會出現 -->
          <div class="side-card" v-if="post.taggedProducts.length">
            <div class="side-title"><span class="dot"></span>這套穿搭的商品</div>

            <div class="product-list">
              <div v-for="item in post.taggedProducts" :key="item.postTaggedProductId" class="product-row">
                <!-- 圖片是 wwwroot/images/product/ 底下的檔案，跟貼文照片資料夾不一樣 -->
                <router-link :to="`/shop/product/${item.productId}`" class="product-link">
                  <img v-if="item.image" :src="`${IMAGE_BASE}/images/product/${item.image}`" class="product-thumb"
                    alt="product" />
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
              <router-link v-for="sp in similarPosts" :key="sp.communityPostId"
                :to="`/community/post/${sp.communityPostId}`" class="similar-thumb">
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

/* ---------- 返回社群按鈕 ---------- */
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
  margin-bottom: 1.2rem;
  transition: all 0.18s ease;
}

.back-pill:hover {
  background: var(--ink);
  color: var(--cream);
}

/* ---------- 骨架載入畫面（跟 CommunityView.vue 同一套光斑效果） ---------- */
@keyframes skeleton-shimmer {
  0% {
    background-position: -300px 0;
  }

  100% {
    background-position: 300px 0;
  }
}

.skeleton-block {
  background-color: var(--hairline);
  background-image: linear-gradient(90deg,
      rgba(255, 255, 255, 0) 0,
      rgba(255, 255, 255, 0.55) 50%,
      rgba(255, 255, 255, 0) 100%);
  background-size: 300px 100%;
  background-repeat: no-repeat;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}

.skeleton-author-bar {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.1rem;
}

.skeleton-avatar-lg {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-author-lines {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.skeleton-line {
  height: 14px;
}

.skeleton-line-40 {
  width: 40%;
}

.skeleton-line-30 {
  width: 30%;
}

.skeleton-line-90 {
  width: 90%;
}

.skeleton-line-60 {
  width: 60%;
}

.skeleton-main-media {
  width: 100%;
  height: 550px;
  border-radius: 8px;
}

.skeleton-side-card {
  width: 100%;
  height: 320px;
  border-radius: 16px;
}

@media (max-width: 767px) {
  .skeleton-main-media {
    height: 340px;
  }
}

/* ---------- 找不到貼文 ---------- */
.not-found-state {
  background: var(--paper);
  border: 1px dashed var(--hairline);
  border-radius: 16px;
  padding: 3rem 2rem;
  text-align: center;
  color: var(--ink-soft);
}

.not-found-state p {
  margin-bottom: 1rem;
}

/* ---------- 主卡片 ---------- */
.post-main-card {
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 16px;
  padding: 1.6rem;
}

/* ---------- 發文者列 ---------- */
.author-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 2px var(--plum);
}

.author-name {
  font-family: 'Noto Serif TC', serif;
  font-weight: 700;
  font-size: 0.98rem;
  margin: 0;
  color: var(--ink);
}

.author-meta {
  font-size: 0.78rem;
  color: var(--ink-soft);
}

.btn-follow-main {
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1.3rem;
  font-size: 0.84rem;
  font-weight: 600;
  transition:
    background 0.18s ease,
    transform 0.18s ease;
}

.btn-follow-main:hover {
  background: var(--plum-deep);
  transform: translateY(-1px);
}

.btn-follow-main.following {
  background: var(--hairline);
  color: var(--ink-soft);
}

.btn-follow-main.following:hover {
  background: var(--hairline);
  transform: none;
}

/* ---------- 主圖 ---------- */
.post-media {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: var(--cream);
  margin-bottom: 1.1rem;
}

.post-image {
  width: 100%;
  height: 550px;
  object-fit: contain;
  display: block;
  background: var(--paper);
}

.tag-label {
  position: absolute;
  top: 16px;
  left: -6px;
  z-index: 2;
  background: var(--plum);
  color: #fff;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  font-weight: 600;
  padding: 0.3rem 0.75rem 0.3rem 1rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
}

.tag-label::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -6px;
  border-width: 0 6px 6px 0;
  border-style: solid;
  border-color: transparent var(--plum-deep) transparent transparent;
}

/* ---------- 主圖輪播：箭頭、圓點 ---------- */
.media-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease;
}

.media-arrow:hover {
  background: rgba(0, 0, 0, 0.7);
}

.media-arrow-prev {
  left: 12px;
}

.media-arrow-next {
  right: 12px;
}

.media-dots {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  gap: 0.4rem;
}

.media-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  border: none;
  padding: 0;
  transition:
    background 0.18s ease,
    transform 0.18s ease;
}

.media-dot.active {
  background: #fff;
  transform: scale(1.25);
}

/* ---------- 縮圖列 ---------- */
.post-thumb-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.1rem;
}

.post-thumb-item {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid transparent;
  padding: 0;
  background: none;
  transition: border-color 0.18s ease;
}

.post-thumb-item.active {
  border-color: var(--plum);
}

.post-thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ---------- 互動列 ---------- */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 0;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  margin-bottom: 1.2rem;
}

.action-left {
  display: flex;
  gap: 1.6rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.88rem;
  color: var(--ink-soft);
  transition: color 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.action-btn:hover {
  color: var(--ink);
}

.action-btn.liked {
  color: #B4453A;
  font-weight: 600;
}

.action-btn.saved {
  color: var(--ochre);
  font-weight: 600;
}

/* icon-inline：文字並排的小圖示共用樣式，顏色跟著文字走 */
.icon-inline {
  flex-shrink: 0;
}

/* .share-wrapper 是定位參考點，.share-menu-backdrop 透明鋪滿全畫面處理「點外面關閉」 */
.share-wrapper {
  position: relative;
}

.share-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9;
}

.share-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 10;
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(42, 36, 32, .18);
  padding: .4rem;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: .15rem;
}

.share-menu-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: none;
  border: none;
  border-radius: 5px;
  padding: 0.55rem 0.7rem;
  font-size: 0.84rem;
  color: var(--ink);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.share-menu-item:hover {
  background: var(--cream);
}

.share-menu-item svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--ink-soft);
}

/* 跟分享選單同一種定位邏輯，共用同一顆 backdrop 處理「點外面關閉」 */
.report-wrapper {
  position: relative;
}

.report-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 10;
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(42, 36, 32, .18);
  padding: 1rem;
  width: 260px;
}

.report-panel-title {
  margin: 0 0 0.6rem;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--ink);
}

.report-textarea {
  width: 100%;
  border: 1px solid var(--hairline);
  background: var(--cream);
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  font-size: 0.82rem;
  color: var(--ink);
  font-family: inherit;
  resize: vertical;
}

.report-textarea:focus {
  outline: none;
  border-color: var(--plum);
}

.report-panel-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.7rem;
}

.report-btn-cancel {
  flex: 1;
  padding: 0.45rem;
  font-size: 0.78rem;
  background: transparent;
  color: var(--ink-soft);
  border: 1px solid var(--hairline);
  border-radius: 4px;
  cursor: pointer;
}

.report-btn-cancel:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.report-btn-submit {
  flex: 1;
  padding: 0.45rem;
  font-size: 0.78rem;
  font-weight: 600;
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.18s ease;
}

.report-btn-submit:hover:not(:disabled) {
  background: var(--plum-deep);
}

.report-btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------- 內文 ---------- */
.post-content {
  font-size: 0.94rem;
  line-height: 1.8;
  color: var(--ink);
  margin-bottom: 1.2rem;
}

/* ---------- 標記商品（貼文下方） ---------- */
.tagged-products {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-bottom: 1.6rem;
}

.tagged-label {
  font-size: 0.8rem;
  color: var(--ink-soft);
  font-weight: 600;
  flex-shrink: 0;
}

.tagged-products .tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tagged-products .tag-chip {
  font-size: 0.78rem;
  padding: 0.32rem 0.8rem;
  border-radius: 999px;
  background: var(--cream);
  border: 1px solid var(--hairline);
  color: var(--plum);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.18s ease;
}

.tagged-products .tag-chip:hover {
  border-color: var(--plum);
  background: var(--paper);
}

/* ---------- 留言區 ---------- */
.comment-block {
  background: var(--cream);
  border-radius: 8px;
  padding: 1.3rem;
}

.comment-title {
  font-family: 'Noto Serif TC', serif;
  font-weight: 700;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: var(--ink);
}

.comment-title .dot,
.side-title .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ochre);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.1rem;
}

/* 跟 CommunityView.vue「載入更多穿搭」同一顆按鈕樣式 */
.load-more-comments-wrap {
  text-align: center;
  margin-bottom: 1.3rem;
}

.btn-load-comments {
  background: transparent;
  border: 1px solid var(--ink);
  color: var(--ink);
  border-radius: 999px;
  padding: .5rem 1.6rem;
  font-size: .82rem;
  letter-spacing: .03em;
  transition: all .2s ease;
}

.btn-load-comments:hover {
  background: var(--ink);
  color: var(--cream);
}

.comment-thread {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.comment-row {
  display: flex;
  align-items: flex-start;
  gap: .6rem;
}

.comment-row.comment-reply {
  margin-left: 2.4rem;
}

/* 往內縮排，跟 IG 的回覆呈現方式一樣 */
.comment-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-row>a {
  flex-shrink: 0;
  line-height: 0;
}

/* 留言大頭貼外面包的連結：跟原本純 <img> 時視覺一樣，不要有底線、不要被 flex 壓縮 */
.comment-bubble {
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 4px;
  padding: .55rem .9rem;
  font-size: .85rem;
  color: var(--ink);
  width: 100%;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: .4rem;
}

.comment-user {
  font-weight: 700;
  margin-right: .1rem;
  color: var(--ink);
  text-decoration: none;
  /* 原本是純文字，現在改成連結，要蓋掉瀏覽器預設的藍字加底線 */
}

.comment-user:hover {
  text-decoration: underline;
}

/* 保留一點「可以點」的提示，不用整段都變色 */
.comment-meta {
  display: flex;
  align-items: center;
  gap: .6rem;
  margin-left: auto;
  flex-shrink: 0;
}

.comment-time {
  font-size: .72rem;
  color: var(--ink-soft);
  white-space: nowrap;
}

.btn-reply {
  background: none;
  border: none;
  padding: 0;
  font-size: .78rem;
  color: var(--ink-soft);
  cursor: pointer;
}

.btn-reply:hover {
  color: var(--plum);
}

.reply-count {
  font-size: 0.76rem;
  color: var(--ochre);
  font-weight: 600;
  width: 100%;
}

.replying-to-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--ink-soft);
  margin-bottom: 0.5rem;
}

.btn-cancel-reply {
  border: none;
  background: var(--hairline);
  color: var(--ink-soft);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  font-size: 0.68rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.btn-cancel-reply:hover {
  background: var(--plum);
  color: #fff;
}

.comment-input-row {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.3rem;
}

.comment-input {
  flex: 1;
  border: 1px solid var(--hairline);
  background: var(--paper);
  border-radius: 4px;
  padding: 0.6rem 1rem;
  font-size: 0.86rem;
  color: var(--ink);
  outline: none;
  transition: border-color 0.18s ease;
}

.comment-input:focus {
  border-color: var(--plum);
}

.comment-input::placeholder {
  color: var(--ink-soft);
}

.btn-send {
  background: var(--ink);
  color: var(--paper);
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.18s ease;
}

.btn-send:hover {
  background: var(--plum-deep);
}

/* ---------- 側邊欄 ---------- */
.side-card {
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 16px;
  padding: 1.4rem 1.3rem;
  margin-bottom: 1.5rem;
}

.side-title {
  font-family: 'Noto Serif TC', serif;
  font-weight: 700;
  font-size: 1.02rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.1rem;
  color: var(--ink);
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--cream);
  border-radius: 8px;
  padding: 0.55rem;
}

/* router-link 但視覺上不像連結（不變色、不加底線） */
.product-link {
  display: flex;
  align-items: center;
  gap: .7rem;
  flex: 1;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.product-thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 0.83rem;
  font-weight: 700;
  color: var(--ink);
  margin: 0 0 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-size: 0.8rem;
  color: var(--ochre);
  font-weight: 600;
  margin: 0;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}

.similar-thumb {
  display: block;
  aspect-ratio: 3/4;
  border-radius: 6px;
  overflow: hidden;
  background: var(--cream);
  cursor: pointer;
}

.similar-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.similar-thumb:hover img {
  transform: scale(1.06);
}

@media (max-width: 767px) {
  .post-image {
    height: 380px;
  }

  .post-main-card {
    padding: 1.1rem;
  }
}
</style>

<!--
  這個區塊「不加 scoped」：scoped 樣式只會作用在這個元件模板裡面的元素上，
  body 不在模板裡，寫在 scoped 區塊不會生效。不加 scoped 的話，
  這段 CSS 編譯出來就是全域樣式，不用改共用的 App.vue 也能讓 body 變成統一背景色。
-->
<style>
body {
  background-color: #f9f4f0 !important;
}
</style>