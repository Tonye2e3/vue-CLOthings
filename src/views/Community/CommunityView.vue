<script>
import { reactive, ref } from 'vue'
import api from '@/api/api'
import { useAuthStore } from '@/stores/auth'

const IMAGE_BASE = import.meta.env.VITE_API_URL

export const currentUser = ref({
  name: '',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
})

export const currentUserId = ref(null)
export const loadCurrentUserId = async () => {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    currentUserId.value = null
    return
  }
  try {
    const res = await api.get('/User/me')
    currentUserId.value = res.data.userId
    await loadCurrentUser()
  } catch (err) {
    console.error('讀取登入者 userId 失敗：', err)
  }
}

const loadCurrentUser = async () => {
  if (!currentUserId.value) return
  try {
    const res = await api.get(`/PublicUserProfile/${currentUserId.value}`)
    currentUser.value = {
      name: res.data.username,
      avatar: res.data.avatar
        ? `${IMAGE_BASE}${res.data.avatar}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.data.username}`,
    }
  } catch (err) {
    console.error('讀取自己的公開個人資料失敗：', err)
  }
}

export const formatCount = (n) => {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return String(n)
}

export const posts = reactive([])

export const addPost = (post) => {
  posts.unshift(post)
}

export const savedPosts = reactive([])

export const loadSavedPosts = async () => {
  if (!currentUserId.value) return
  try {
    const res = await api.get(`/CommunityFavorite/user/${currentUserId.value}`)
    savedPosts.splice(0, savedPosts.length)
    res.data.forEach((p) => {
      savedPosts.push({
        communityPostId: p.communityPostId,
        content: p.content,
        image: p.images && p.images.length ? `${IMAGE_BASE}${p.images[0].imageFileName}` : '',
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        tags: (p.taggedProducts || []).map((t) => `#${t.name}`),
      })
    })
  } catch (err) {
    console.error('讀取收藏清單失敗：', err)
  }
}

export const isPostSaved = (communityPostId) =>
  savedPosts.some((p) => p.communityPostId === communityPostId)

export const toggleSavePost = async (post) => {
  const idx = savedPosts.findIndex((p) => p.communityPostId === post.communityPostId)

  if (idx === -1) {
    try {
      await api.post(`/CommunityFavorite`, {
        userId: currentUserId.value,
        communityPostId: post.communityPostId,
      })
    } catch (err) {
      console.error('收藏失敗：', err)
      return
    }
    savedPosts.unshift(post)
  } else {
    try {
      const res = await api.get(
        `/CommunityFavorite/post/${post.communityPostId}/user/${currentUserId.value}`,
      )
      if (res.data) {
        await api.delete(`/CommunityFavorite/${res.data.communityFavoriteId}`)
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { animate } from 'animejs'

const route = useRoute()
const authStore = useAuthStore()

const onAvatarError = (event, name) => {
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
  if (event.target.src === fallbackUrl) return
  event.target.src = fallbackUrl
}

const postsLoading = ref(true)

const fetchPosts = async () => {
  postsLoading.value = true
  try {
    const res = await api.get(`/CommunityPost`)
    const apiPosts = res.data.map((p) => ({
      communityPostId: p.communityPostId,
      userId: p.userId,
      user: p.user
        ? {
            ...p.user,
            avatar: p.user.avatar
              ? `${IMAGE_BASE}${p.user.avatar}`
              : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.user.name,
          }
        : { name: '未知使用者', avatar: '' },
      content: p.content,
      postDate: p.postDate,
      status: p.status,
      images: (p.images || []).map((img) => ({
        postImageId: img.postImageId,
        imageFileName: img.imageFileName,
        sortOrder: img.sortOrder,
        url: `${IMAGE_BASE}${img.imageFileName}`,
      })),
      likesCount: p.likesCount,
      commentsCount: p.commentsCount,
      taggedProducts: p.taggedProducts || [],
    }))
    posts.splice(0, posts.length, ...apiPosts)
  } catch (err) {
    console.error('讀取貼文列表失敗：', err)
  } finally {
    postsLoading.value = false
  }
}

onMounted(async () => {
  fetchPosts()
  await loadCurrentUserId()
  loadSavedPosts()
  loadLikedPosts()
  fetchCreators()
})

const formatCount = (n) => {
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return String(n)
}

const likedPostIds = reactive(new Map())

const loadLikedPosts = async () => {
  try {
    const res = await api.get(`/PostLike/user/${currentUserId.value}`)
    likedPostIds.clear()
    res.data.forEach((like) => {
      likedPostIds.set(like.communityPostId, like.postLikesId)
    })
  } catch (err) {
    console.error('讀取按讚清單失敗：', err)
  }
}

const isPostLiked = (communityPostId) => likedPostIds.has(communityPostId)

const toggleLikePost = async (post) => {
  const likeId = likedPostIds.get(post.communityPostId)
  if (likeId) {
    try {
      await api.delete(`/PostLike/${likeId}`)
    } catch (err) {
      console.error('取消讚失敗：', err)
      return
    }
    likedPostIds.delete(post.communityPostId)
    post.likesCount -= 1
  } else {
    try {
      await api.post(`/PostLike`, {
        communityPostId: post.communityPostId,
        userId: currentUserId.value,
      })
    } catch (err) {
      console.error('按讚失敗：', err)
      return
    }
    try {
      const res = await api.get(
        `/PostLike/post/${post.communityPostId}/user/${currentUserId.value}`,
      )
      if (res.data) likedPostIds.set(post.communityPostId, res.data.postLikesId)
    } catch (err) {
      console.error('讀取剛剛按讚的紀錄失敗：', err)
    }
    post.likesCount += 1
  }
}

const currentTab = ref('hot')

const popularProducts = ref([
  { id: 1, name: '經典圓領短T' },
  { id: 2, name: '法式碎花洋裝' },
  { id: 3, name: '羊毛混紡針織外套' },
  { id: 4, name: '修身牛仔褲' },
  { id: 5, name: '百褶及膝裙' },
])

const creators = ref([])

const fetchCreators = async () => {
  try {
    const res = await api.get(`/UserFollow/popular-creators`, {
      params: { take: 3, followerId: currentUserId.value },
    })
    creators.value = res.data.map((c) => ({
      id: c.userId,
      name: c.name,
      avatar: c.avatar
        ? `${IMAGE_BASE}${c.avatar}`
        : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + c.name,
      followersCount: c.followersCount,
      isFollowing: c.isFollowing,
      userFollowId: c.userFollowId,
    }))
  } catch (err) {
    console.error('讀取熱門穿搭達人失敗：', err)
  }
}

const tabCopy = {
  hot: { ribbon: '封面故事', role: '本週封面 · 秋季選品', empty: '目前沒有符合的熱門穿搭。' },
  new: { ribbon: '最新發布', role: '剛剛發布的穿搭', empty: '目前還沒有最新的穿搭貼文。' },
  follow: {
    ribbon: '追蹤精選',
    role: '來自你追蹤的達人',
    empty: '你還沒有追蹤任何穿搭達人，去右側「熱門穿搭達人」追蹤幾位，這裡就會出現他們的貼文。',
  },
}

const currentTabCopy = computed(() => tabCopy[currentTab.value] || tabCopy.hot)

const tabPosts = computed(() => {
  if (currentTab.value === 'new') {
    return [...posts].sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
  }
  if (currentTab.value === 'follow') {
    const followingNames = creators.value.filter((c) => c.isFollowing).map((c) => c.name)
    return posts.filter((p) => followingNames.includes(p.user.name))
  }
  return [...posts].sort((a, b) => b.likesCount - a.likesCount)
})

const searchQuery = ref(route.query.tag || '')

watch(
  () => route.query.tag,
  (newTag) => {
    if (newTag) searchQuery.value = newTag
  },
)

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const base = tabPosts.value
  if (!q) return base
  return base.filter((post) => {
    const inContent = post.content.toLowerCase().includes(q)
    const inUser = post.user.name.toLowerCase().includes(q)
    const inTags = (post.taggedProducts || []).some((p) => p.name.toLowerCase().includes(q))
    return inContent || inUser || inTags
  })
})

const filteredCreators = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return creators.value
  return creators.value.filter((c) => c.name.toLowerCase().includes(q))
})

const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return popularProducts.value
  return popularProducts.value.filter((p) => p.name.toLowerCase().includes(q))
})

const isSearching = computed(() => searchQuery.value.trim() !== '')

const featurePost = computed(() => (isSearching.value ? null : filteredPosts.value[0]))

const featureImageIndex = ref(0)
const prevFeatureImage = () => {
  const len = featurePost.value.images.length
  featureImageIndex.value = (featureImageIndex.value - 1 + len) % len
}
const nextFeatureImage = () => {
  const len = featurePost.value.images.length
  featureImageIndex.value = (featureImageIndex.value + 1) % len
}

const cardImageIndex = reactive({})
const getCardImageIndex = (postId) => cardImageIndex[postId] || 0
const prevCardImage = (post) => {
  const len = post.images.length
  const cur = getCardImageIndex(post.communityPostId)
  cardImageIndex[post.communityPostId] = (cur - 1 + len) % len
}
const nextCardImage = (post) => {
  const len = post.images.length
  const cur = getCardImageIndex(post.communityPostId)
  cardImageIndex[post.communityPostId] = (cur + 1) % len
}

const cardAutoplayTimers = new Map()
const CARD_AUTOPLAY_INTERVAL = 1200

const startCardAutoplay = (post) => {
  if (post.images.length <= 1) return
  const timer = setInterval(() => nextCardImage(post), CARD_AUTOPLAY_INTERVAL)
  cardAutoplayTimers.set(post.communityPostId, timer)
}
const stopCardAutoplay = (post) => {
  const timer = cardAutoplayTimers.get(post.communityPostId)
  if (timer) {
    clearInterval(timer)
    cardAutoplayTimers.delete(post.communityPostId)
  }
  cardImageIndex[post.communityPostId] = 0
}

let featureAutoplayTimer = null
const startFeatureAutoplay = () => {
  if (!featurePost.value || featurePost.value.images.length <= 1) return
  featureAutoplayTimer = setInterval(nextFeatureImage, CARD_AUTOPLAY_INTERVAL)
}
const stopFeatureAutoplay = () => {
  if (featureAutoplayTimer) {
    clearInterval(featureAutoplayTimer)
    featureAutoplayTimer = null
  }
  featureImageIndex.value = 0
}

const gridPosts = computed(() =>
  isSearching.value ? filteredPosts.value : filteredPosts.value.slice(1),
)

const GRID_PAGE_SIZE = 6
const visibleGridCount = ref(GRID_PAGE_SIZE)

const visibleGridPosts = computed(() => gridPosts.value.slice(0, visibleGridCount.value))

const hasMoreGridPosts = computed(() => visibleGridCount.value < gridPosts.value.length)

const loadMoreGridPosts = () => {
  visibleGridCount.value += GRID_PAGE_SIZE
}

watch([currentTab, searchQuery], () => {
  visibleGridCount.value = GRID_PAGE_SIZE
})

const featureCardEl = ref(null)
watch(
  () => featurePost.value?.communityPostId,
  () => {
    featureImageIndex.value = 0
  },
)

const scrollAnimatedIds = new Set()

const runRevealAnimation = (el, translateFrom = 20, duration = 500) => {
  animate(el, {
    opacity: [0, 1],
    translateY: [translateFrom, 0],
    duration,
    ease: 'outQuad',
    onComplete: () => {
      el.style.opacity = ''
      el.style.transform = ''
    },
  })
}

let cardObserver = null
const getCardObserver = () => {
  if (cardObserver) return cardObserver
  cardObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        runRevealAnimation(entry.target)
        cardObserver.unobserve(entry.target)
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
  )
  return cardObserver
}

const observeGridCards = () => {
  const observer = getCardObserver()
  document.querySelectorAll('.post-grid .post-card').forEach((el, idx) => {
    const post = visibleGridPosts.value[idx]
    if (!post || scrollAnimatedIds.has(post.communityPostId)) return
    scrollAnimatedIds.add(post.communityPostId)
    el.style.opacity = '0'
    observer.observe(el)
  })
}

watch(
  visibleGridPosts,
  () => {
    observeGridCards()
  },
  { flush: 'post' },
)

watch(featureCardEl, (el) => {
  if (!el) return
  el.style.opacity = '0'
  getCardObserver().observe(el)
})

onUnmounted(() => {
  if (cardObserver) cardObserver.disconnect()
  cardAutoplayTimers.forEach((timer) => clearInterval(timer))
  cardAutoplayTimers.clear()
  if (featureAutoplayTimer) clearInterval(featureAutoplayTimer)
})

const toggleFollow = async (creator) => {
  if (creator.isFollowing) {
    try {
      await api.delete(`/UserFollow/${creator.userFollowId}`)
    } catch (err) {
      console.error('取消追蹤失敗：', err)
      return
    }
    creator.isFollowing = false
    creator.userFollowId = null
    creator.followersCount -= 1
  } else {
    try {
      await api.post(`/UserFollow`, {
        followerId: currentUserId.value,
        followingId: creator.id,
      })
    } catch (err) {
      console.error('追蹤失敗：', err)
      return
    }
    creator.isFollowing = true
    creator.followersCount += 1
    try {
      const statusRes = await api.get(
        `/UserFollow/follower/${currentUserId.value}/following/${creator.id}`,
      )
      creator.userFollowId = statusRes.data ? statusRes.data.userFollowId : null
    } catch (err) {
      console.error('讀取追蹤狀態失敗：', err)
    }
  }
}
</script>

<template>
  <div class="community-page min-vh-100 w-100">
    <div class="container-fluid container-lg pb-5">
      <div class="page-head">
        <div class="page-head-inner">
          <div class="page-head-divider"></div>
          <div class="page-head-text">
            <div class="eyebrow">Style Journal</div>
            <h1 class="page-title">CLO Daily</h1>
            <p class="page-sub">紀錄每一天的穿著練習</p>
          </div>
        </div>

        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <input type="text" v-model="searchQuery" class="search-input" placeholder="搜尋穿搭、標籤或用戶..." />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" aria-label="清除搜尋">✕</button>
        </div>
      </div>

      <div class="section-row mb-4">
        <div class="tab-group">
          <button class="tab-btn" :class="{ active: currentTab === 'hot' }" @click="currentTab = 'hot'">熱門</button>
          <button class="tab-btn" :class="{ active: currentTab === 'new' }" @click="currentTab = 'new'">最新</button>
          <button class="tab-btn" :class="{ active: currentTab === 'follow' }" @click="currentTab = 'follow'">追蹤中</button>
        </div>

        <div class="d-flex align-items-center gap-2">
          <router-link to="/community/create" class="btn-share text-decoration-none">＋ 分享我的穿搭</router-link>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-12 col-lg-9">
          <template v-if="postsLoading">
            <div class="skeleton-feature">
              <div class="skeleton-block skeleton-feature-media"></div>
              <div class="skeleton-feature-body">
                <div class="skeleton-block skeleton-avatar"></div>
                <div class="skeleton-block skeleton-line skeleton-line-80"></div>
                <div class="skeleton-block skeleton-line skeleton-line-60"></div>
              </div>
            </div>
            <div class="skeleton-grid">
              <div class="skeleton-card" v-for="n in 6" :key="n">
                <div class="skeleton-block skeleton-card-media"></div>
                <div class="skeleton-card-body">
                  <div class="skeleton-block skeleton-line skeleton-line-50"></div>
                  <div class="skeleton-block skeleton-line skeleton-line-90"></div>
                  <div class="skeleton-block skeleton-line skeleton-line-70"></div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="feature-card" v-if="featurePost" ref="featureCardEl">
              <div class="feature-media" @mouseenter="startFeatureAutoplay" @mouseleave="stopFeatureAutoplay">
                <router-link :to="`/community/post/${featurePost.communityPostId}`" class="feature-media-link d-block text-decoration-none">
                  <span class="tag-label">{{ currentTabCopy.ribbon }}</span>
                  <img :src="featurePost.images[featureImageIndex]?.url" :alt="featurePost.content" />
                </router-link>

                <template v-if="featurePost.images.length > 1">
                  <button class="media-arrow media-arrow-prev" @click.stop="prevFeatureImage" aria-label="上一張">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button class="media-arrow media-arrow-next" @click.stop="nextFeatureImage" aria-label="下一張">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                  <div class="media-dots">
                    <button v-for="(img, idx) in featurePost.images" :key="idx" class="media-dot" :class="{ active: idx === featureImageIndex }" @click.stop="featureImageIndex = idx"></button>
                  </div>
                </template>
              </div>
              <div class="feature-body">
                <router-link :to="`/community/profile/${featurePost.userId}`" class="author-row text-decoration-none">
                  <img class="avatar" :src="featurePost.user.avatar" alt="avatar" @error="onAvatarError($event, featurePost.user.name)" />
                  <div>
                    <div class="author-name">{{ featurePost.user.name }}</div>
                    <div class="author-role">{{ currentTabCopy.role }}</div>
                  </div>
                </router-link>
                <router-link :to="`/community/post/${featurePost.communityPostId}`" class="text-decoration-none text-dark">
                  <h3>{{ featurePost.content }}</h3>
                </router-link>
                <div class="stat-row">
                  <button type="button" class="stat-like-btn" :class="{ liked: isPostLiked(featurePost.communityPostId) }" @click="toggleLikePost(featurePost)">
                    <svg class="icon-inline" viewBox="0 0 24 24" width="14" height="14" :fill="isPostLiked(featurePost.communityPostId) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {{ formatCount(featurePost.likesCount) }}
                  </button>
                  <router-link :to="`/community/post/${featurePost.communityPostId}#comments`" class="text-decoration-none">
                    <svg class="icon-inline" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 12c0 4.4-4 8-9 8-1.1 0-2.1-.2-3-.5L4 21l1.3-4.2A7.8 7.8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
                    </svg>
                    {{ formatCount(featurePost.commentsCount) }}
                  </router-link>
                </div>
              </div>
            </div>

            <div class="empty-state" v-if="filteredPosts.length === 0">
              {{ isSearching ? `找不到符合「${searchQuery}」的穿搭、標籤或用戶，換個關鍵字試試。` : currentTabCopy.empty }}
            </div>

            <div class="post-grid" v-if="gridPosts.length">
              <div v-for="post in visibleGridPosts" :key="post.communityPostId" class="post-card">
                <div class="post-media" @mouseenter="startCardAutoplay(post)" @mouseleave="stopCardAutoplay(post)">
                  <router-link :to="`/community/post/${post.communityPostId}`" class="post-media-link d-block text-decoration-none">
                    <span class="tag-label" v-if="post.taggedProducts && post.taggedProducts[0]">{{ post.taggedProducts[0].name }}</span>
                    <img :src="post.images[getCardImageIndex(post.communityPostId)]?.url" :alt="post.content" />
                  </router-link>

                  <template v-if="post.images.length > 1">
                    <button class="media-arrow media-arrow-prev" @click.stop="prevCardImage(post)" aria-label="上一張">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button class="media-arrow media-arrow-next" @click.stop="nextCardImage(post)" aria-label="下一張">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                    <div class="media-dots">
                      <button v-for="(img, idx) in post.images" :key="idx" class="media-dot" :class="{ active: idx === getCardImageIndex(post.communityPostId) }" @click.stop="cardImageIndex[post.communityPostId] = idx"></button>
                    </div>
                  </template>
                </div>

                <div class="post-body">
                  <router-link :to="`/community/profile/${post.userId}`" class="post-author text-decoration-none">
                    <img :src="post.user.avatar" alt="avatar" @error="onAvatarError($event, post.user.name)" />
                    <span>{{ post.user.name }}</span>
                  </router-link>

                  <router-link :to="`/community/post/${post.communityPostId}`" class="text-decoration-none">
                    <p class="post-desc line-clamp-2">{{ post.content }}</p>
                  </router-link>

                  <div class="post-foot">
                    <button type="button" class="stat-like-btn" :class="{ liked: isPostLiked(post.communityPostId) }" @click="toggleLikePost(post)">
                      <svg class="icon-inline" viewBox="0 0 24 24" width="13" height="13" :fill="isPostLiked(post.communityPostId) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {{ formatCount(post.likesCount) }}
                    </button>
                    <router-link :to="`/community/post/${post.communityPostId}#comments`" class="text-decoration-none">
                      <svg class="icon-inline" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 12c0 4.4-4 8-9 8-1.1 0-2.1-.2-3-.5L4 21l1.3-4.2A7.8 7.8 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
                      </svg>
                      {{ formatCount(post.commentsCount) }}
                    </router-link>
                  </div>
                </div>
              </div>
            </div>

            <div class="load-more-wrap" v-if="hasMoreGridPosts">
              <button class="btn-load" @click="loadMoreGridPosts">載入更多穿搭 ▾</button>
            </div>
          </template>
        </div>

        <div class="col-12 col-lg-3">
          <div class="side-card">
            <div class="side-title"><span class="dot"></span>熱門穿搭達人</div>
            <div v-for="creator in filteredCreators" :key="creator.id" class="stylist-row">
              <router-link :to="`/community/profile/${creator.id}`" class="d-flex align-items-center text-decoration-none flex-grow-1 min-w-0">
                <img class="stylist-avatar" :src="creator.avatar" alt="avatar" @error="onAvatarError($event, creator.name)" />
                <div class="min-w-0">
                  <div class="stylist-name text-truncate">{{ creator.name }}</div>
                  <div class="stylist-meta">{{ formatCount(creator.followersCount) }}追蹤</div>
                </div>
              </router-link>
              <button class="btn-follow" :class="{ following: creator.isFollowing }" @click="toggleFollow(creator)">
                {{ creator.isFollowing ? '已追蹤' : '追蹤' }}
              </button>
            </div>
          </div>

          <div class="side-card">
            <div class="side-title"><span class="dot"></span>熱門商品標籤</div>
            <div class="tag-cloud" v-if="filteredTags.length">
              <span v-for="product in filteredTags" :key="product.id" class="tag-chip" @click="searchQuery = product.name">#{{ product.name }}</span>
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
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');

.community-page {
  width: 100%; min-height: 100vh; background-color: #f9f4f0 !important; box-sizing: border-box;
  --cream: #f9f4f0; --paper: #fffdfb; --ink: #2a2420; --ink-soft: #7a6e63;
  --plum: #7a4b54; --plum-deep: #5e3941; --ochre: #b8862e; --hairline: #e4d8cc;
  --font-serif: 'Noto Serif TC', serif; --font-sans: 'Noto Sans TC', sans-serif;
  color: var(--ink); font-family: var(--font-sans);
}

.page-head { padding: 2.4rem 0 1.2rem; }
.page-head-inner { display: flex; align-items: center; gap: 1.2rem; }
.page-head-divider { width: 1px; align-self: stretch; background: var(--hairline); flex-shrink: 0; }
.page-head-text { padding-left: 0.2rem; }
.eyebrow { font-size: 0.7rem; letter-spacing: 0.24em; text-transform: uppercase; color: #a9a196; font-weight: 600; margin-bottom: 0.4rem; }
.page-title { font-family: var(--font-serif); font-weight: 900; font-size: clamp(1.7rem, 3.2vw, 2.1rem); line-height: 1.1; margin: 0 0 0.4rem; color: var(--ink); }
.page-sub { font-family: var(--font-serif); font-style: italic; color: #9c9086; font-size: 0.92rem; margin: 0; }

.search-bar { position: relative; display: flex; align-items: center; max-width: 420px; margin-top: 1.4rem; background: var(--paper); border: 1px solid var(--hairline); border-radius: 999px; padding: 0.55rem 1rem; transition: border-color 0.18s ease, box-shadow 0.18s ease; }
.search-bar:focus-within { border-color: var(--plum); box-shadow: 0 0 0 3px rgba(122, 75, 84, 0.12); }
.search-icon { width: 17px; height: 17px; color: var(--ink-soft); flex-shrink: 0; }
.search-input { border: none; outline: none; background: transparent; flex: 1; margin-left: 0.6rem; font-family: var(--font-sans); font-size: 0.88rem; color: var(--ink); }
.search-input::placeholder { color: var(--ink-soft); }
.search-clear { border: none; background: var(--hairline); color: var(--ink-soft); width: 20px; height: 20px; border-radius: 50%; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer; }
.search-clear:hover { background: var(--plum); color: #fff; }

.section-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--hairline); padding-bottom: 0.2rem; }
.tab-group { display: flex; gap: 1.8rem; }
.tab-btn { background: none; border: none; padding: 0.7rem 0; font-family: var(--font-serif); font-size: 1.02rem; color: var(--ink-soft); position: relative; cursor: pointer; }
.tab-btn.active { color: var(--ink); font-weight: 700; }
.tab-btn.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--plum); }
.btn-share { background: var(--ink); color: var(--paper) !important; border: none; border-radius: 999px; padding: 0.6rem 1.4rem; font-size: 0.88rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; transition: background 0.18s ease, transform 0.18s ease; }
.btn-share:hover{ background:var(--plum-deep); transform:translateY(-1px); }

.feature-card { background: var(--paper); border: 1px solid var(--hairline); border-radius: 22px; overflow: hidden; display: grid; grid-template-columns: 1.15fr 1fr; margin-bottom: 1.6rem; transition: box-shadow 0.25s ease; }
.feature-card:hover { box-shadow: 0 18px 34px -22px rgba(42, 36, 32, 0.35); }
.feature-media { position: relative; overflow: hidden; min-height: 320px; background: var(--hairline); }
.feature-media-link { display: block; width: 100%; height: 100%; }
.feature-media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
.feature-card:hover .feature-media img { transform: scale(1.04); }

.media-arrow{ position:absolute; top:50%; transform:translateY(-50%); z-index:3; width:36px; height:36px; border-radius:50%; background:rgba(0,0,0,.45); color:#fff; border:none; padding:0; display:flex; align-items:center; justify-content:center; transition:background .18s ease; }
.media-arrow:hover { background: rgba(0, 0, 0, 0.7); }
.media-arrow-prev { left: 12px; }
.media-arrow-next { right: 12px; }
.media-dots { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 3; display: flex; gap: 0.4rem; }
.media-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, 0.55); border: none; padding: 0; transition: background 0.18s ease, transform 0.18s ease; }
.media-dot.active { background: #fff; transform: scale(1.25); }

.tag-label { position: absolute; top: 16px; left: 16px; z-index: 2; background: var(--plum); color: #fff; font-size: 0.72rem; letter-spacing: 0.05em; font-weight: 600; padding: 0.32rem 0.85rem; border-radius: 999px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18); }

.feature-body { padding: 1.9rem 1.8rem; display: flex; flex-direction: column; }
.author-row { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 1rem; color: var(--ink); }
.avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 1.5px var(--plum); background: #fff; }
.author-name { font-weight: 700; font-size: 0.95rem; }
.author-role { font-size: 0.76rem; color: var(--ink-soft); }

.feature-body h3{ font-family:var(--font-serif); font-size:1.3rem; font-weight:700; line-height:1.5; margin-bottom:.6rem; flex:1; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

.stat-row { display: flex; align-items: center; gap: 1.2rem; border-top: 1px dashed var(--hairline); padding-top: 1rem; margin-top: 1rem; font-size: 0.85rem; color: var(--ink-soft); }
.stat-row span, .stat-row a{ display:inline-flex; align-items:center; gap:.3rem; color:inherit; }
.stat-like-btn{ display:inline-flex; align-items:center; gap:.3rem; background:none; border:none; padding:0; margin:0; font-size:inherit; font-family:inherit; color:inherit; cursor:pointer; transition:color .18s ease; }
.stat-like-btn:hover{ color:#B4453A; }
.stat-like-btn.liked{ color:#B4453A; font-weight:600; }
.icon-inline{ flex-shrink:0; }

.post-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.4rem; }
.post-card { background: var(--paper); border: 1px solid var(--hairline); border-radius: 16px; overflow: hidden; transition: transform 0.25s ease, box-shadow 0.25s ease; }
.post-card:hover { transform: translateY(-4px) rotate(-0.3deg); box-shadow: 0 16px 30px -20px rgba(42, 36, 32, 0.4); }
.post-media { position: relative; display: block; aspect-ratio: 4/3; overflow: hidden; background: var(--hairline); }
.post-media-link { display: block; width: 100%; height: 100%; }
.post-media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
.post-card:hover .post-media img { transform: scale(1.06); }
.post-media .tag-label { font-size: 0.66rem; padding: 0.24rem 0.7rem; top: 12px; left: 12px; }
.post-media .media-arrow { width: 26px; height: 26px; }
.post-media .media-arrow-prev { left: 8px; }
.post-media .media-arrow-next { right: 8px; }
.post-media .media-dots { bottom: 8px; }
.post-media .media-dot { width: 5px; height: 5px; }

.post-body { padding: 1rem 1.1rem 1.2rem; }
.post-author { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; color: var(--ink); }
.post-author img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
.post-author span { font-size: 0.85rem; font-weight: 700; }
.post-desc { font-size: 0.85rem; color: var(--ink-soft); line-height: 1.55; min-height: 2.6em; margin: 0; }
.post-foot { display: flex; align-items: center; gap: 1rem; margin-top: 0.9rem; padding-top: 0.8rem; border-top: 1px solid var(--hairline); font-size: 0.8rem; color: var(--ink-soft); }
.post-foot span { display: inline-flex; align-items: center; gap: 0.3rem; }
.post-foot a { margin-left: auto; color: var(--plum); text-decoration: none; font-weight: 600; }

.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

@keyframes skeleton-shimmer { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }
.skeleton-block { background-color: var(--hairline); background-image: linear-gradient(90deg, rgba(255, 255, 255, 0) 0, rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0) 100%); background-size: 300px 100%; background-repeat: no-repeat; animation: skeleton-shimmer 1.4s ease-in-out infinite; border-radius: 6px; }

.skeleton-feature{ background:var(--paper); border:1px solid var(--hairline); border-radius:22px; overflow:hidden; margin-bottom:1.6rem; display:grid; grid-template-columns:1.15fr 1fr; }
.skeleton-feature-media { min-height: 320px; border-radius: 0; }
.skeleton-feature-body { padding: 1.9rem 1.8rem; display: flex; flex-direction: column; gap: 0.9rem; }
.skeleton-avatar { width: 40px; height: 40px; border-radius: 50%; }
.skeleton-line { height: 14px; }
.skeleton-line-80 { width: 80%; }
.skeleton-line-60 { width: 60%; }
.skeleton-line-50 { width: 50%; }
.skeleton-line-90 { width: 90%; }
.skeleton-line-70 { width: 70%; }

.skeleton-grid{ display:grid; grid-template-columns:repeat(2, 1fr); gap:1.4rem; }
.skeleton-card{ background:var(--paper); border:1px solid var(--hairline); border-radius:16px; overflow:hidden; }
.skeleton-card-media { aspect-ratio: 4/3; border-radius: 0; }
.skeleton-card-body { padding: 1rem 1.1rem 1.2rem; display: flex; flex-direction: column; gap: 0.6rem; }

@media (max-width: 991px) { .skeleton-feature { grid-template-columns: 1fr; } .skeleton-feature-media { min-height: 240px; } }
@media (max-width: 767px) { .skeleton-grid { grid-template-columns: 1fr; } }

.empty-state { background: var(--paper); border: 1px dashed var(--hairline); border-radius: 16px; padding: 2.2rem 1.5rem; text-align: center; color: var(--ink-soft); font-size: 0.92rem; margin-bottom: 1.6rem; }
.empty-hint { font-size: 0.8rem; color: var(--ink-soft); margin: 0; }

.load-more-wrap { text-align: center; margin-top: 2.2rem; }
.btn-load { background: transparent; border: 1px solid var(--ink); color: var(--ink); border-radius: 999px; padding: 0.6rem 2rem; font-size: 0.88rem; letter-spacing: 0.03em; transition: all 0.2s ease; }
.btn-load:hover { background: var(--ink); color: var(--cream); }

.side-card { background: var(--paper); border: 1px solid var(--hairline); border-radius: 16px; padding: 1.4rem 1.3rem; margin-bottom: 1.4rem; }
.side-title { font-family: var(--font-serif); font-weight: 700; font-size: 1.02rem; margin-bottom: 1.1rem; display: flex; align-items: center; gap: 0.5rem; color: var(--ink); }
.side-title .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ochre); }

.stylist-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.65rem 0; border-bottom: 1px solid var(--hairline); }
.stylist-row:last-child { border-bottom: none; padding-bottom: 0; }
.stylist-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.stylist-name { font-weight: 700; font-size: 0.88rem; color: var(--ink); }
.stylist-meta { font-size: 0.72rem; color: var(--ink-soft); }
.min-w-0 { min-width: 0; }
.btn-follow { margin-left: 0.5rem; font-size: 0.74rem; padding: 0.34rem 0.85rem; border-radius: 999px; border: 1px solid var(--plum); color: var(--plum); background: transparent; transition: all 0.18s ease; white-space: nowrap; flex-shrink: 0; }
.btn-follow.following { background: var(--hairline); border-color: var(--hairline); color: var(--ink-soft); }
.btn-follow:not(.following):hover { background: var(--plum); color: #fff; }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.tag-chip { font-size: 0.76rem; padding: 0.38rem 0.85rem; border-radius: 999px; background: var(--cream); border: 1px solid var(--hairline); color: var(--ink); cursor: pointer; transition: all 0.18s ease; }
.tag-chip:nth-child(3n + 1) { transform: rotate(-1deg); }
.tag-chip:nth-child(3n + 2) { transform: rotate(1deg); }
.tag-chip:hover { border-color: var(--ochre); color: var(--ochre); }

.side-note { font-family: var(--font-serif); font-style: italic; font-size: 0.84rem; color: var(--ink-soft); line-height: 1.7; border-left: 2px solid var(--plum); padding-left: 0.9rem; margin: 0; }

@media (max-width: 991px) { .feature-card { grid-template-columns: 1fr; } .feature-media { min-height: 240px; } }
@media (max-width: 767px) { .post-grid { grid-template-columns: 1fr; } .section-row { flex-direction: column; align-items: flex-start; } .search-bar { max-width: 100%; } }
</style>

<style>
body { background-color: #f9f4f0 !important; }
</style>