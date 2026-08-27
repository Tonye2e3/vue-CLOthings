<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
// anime.js：編輯彈窗的開關動畫
import { animate } from 'animejs'

// 收藏清單、formatCount、currentUserId 都從 CommunityView.vue 共用
import { savedPosts, loadSavedPosts, formatCount, currentUserId, loadCurrentUserId } from '@/views/Community/CommunityView.vue'

// 圖片是靜態檔案，不走 /api，用 VITE_API_URL 去掉 /api 尾巴
const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

const route = useRoute()

// 大頭貼載入失敗時換成 dicebear 預設圖；比對網址而非用旗標，避免同一個 img 元素重複使用時卡住舊狀態
const onAvatarError = (event, name) => {
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
  if (event.target.src === fallbackUrl) return
  event.target.src = fallbackUrl
}

// viewedUserId：正在看誰的頁面（網址參數）；currentUserId：我是誰（import 進來）
// 用 computed 才會隨路由切換即時更新（Vue Router 會重用同一個元件）
const viewedUserId = computed(() => Number(route.params.userId))

const userProfile = ref({
  name: '',
  handle: '',
  bioTag: '',
  bio: '',
  avatar: '',
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
  isFollowing: false
})

const activeTab = ref('works')

// 貼文清單，等 fetchUserPosts() 填入
const userPosts = ref([])

// 個人資料、貼文都還沒抓回來之前顯示骨架畫面
const profileLoading = ref(true)

// 抓這個使用者發的所有貼文
const fetchUserPosts = async () => {
  try {
    const res = await api.get(`/CommunityPost/user/${viewedUserId.value}`)
    userPosts.value = res.data.map(post => ({
      communityPostId: post.communityPostId,
      userId: post.userId,
      status: post.status,
      content: post.content,
      image: post.images && post.images.length > 0
        ? `${IMAGE_BASE}${post.images[0].imageFileName}`
        : '',
      images: post.images || [], // 編輯貼文換照片要用完整清單
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      tags: post.taggedProducts.map(t => `#${t.name}`),
      taggedProducts: post.taggedProducts || [] // 編輯貼文改標記商品要用
    }))
    userProfile.value.postsCount = userPosts.value.length
  } catch (err) {
    console.error('讀取個人貼文失敗：', err)
  }
}

const deletePost = async (communityPostId) => {
  if (!confirm('確定要刪除這篇貼文嗎？刪除後就無法恢復。')) return

  try {
    await api.delete(`/CommunityPost/${communityPostId}`)
  } catch (err) {
    console.error('刪除貼文失敗：', err)
    alert('刪除失敗，請稍後再試一次！')
    return
  }

  userPosts.value = userPosts.value.filter(p => p.communityPostId !== communityPostId)
}

// 目前正在編輯哪一篇貼文，null 代表沒有
const editingPostId = ref(null)

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

const productSearch = ref('')
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) {
    // 沒搜尋時只列前 5 個熱門標籤，避免標籤區塊被拉長
    return availableProducts.value.slice(0, 5)
  }
  return availableProducts.value.filter(p => p.name.toLowerCase().includes(q))
})

const toggleEditProduct = (name) => {
  const list = editForm.value.taggedProducts
  const idx = list.indexOf(name)
  if (idx === -1) {
    list.push(name)
  } else {
    list.splice(idx, 1)
  }
}

// images 裡每筆 isNew=false 是舊照片，isNew=true 是這次新選的（還沒真正上傳）
const editForm = ref({ content: '', status: 'public', images: [], taggedProducts: [] })

const startEdit = (post) => {
  editingPostId.value = post.communityPostId
  productSearch.value = ''
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

const cancelEdit = () => {
  editingPostId.value = null
}

// ---------- 編輯彈窗開關動畫（Transition JS hook + anime.js） ----------

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

// :css="false" 模式下 leave 一定要呼叫 done()，不然元素會卡在 DOM 拿不掉
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

const lightboxImage = ref(null)
const openLightbox = (url) => {
  lightboxImage.value = url
}
const closeLightbox = () => {
  lightboxImage.value = null
}

const handleEditFileChange = (event) => {
  const files = Array.from(event.target.files || [])
  files.forEach(file => {
    editForm.value.images.push({
      file,
      imageFileName: file.name, // 佔位，saveEdit 上傳成功後換成真正路徑
      sortOrder: editForm.value.images.length + 1,
      url: URL.createObjectURL(file),
      isNew: true
    })
  })
  event.target.value = ''
}

const removeEditImage = (index) => {
  editForm.value.images.splice(index, 1)
}

// 儲存編輯：先上傳新照片，再打 PUT 更新貼文
const saveEdit = async (post) => {
  const newImages = editForm.value.images.filter(img => img.isNew)

  if (newImages.length > 0) {
    const formData = new FormData()
    newImages.forEach(img => formData.append('files', img.file))

    try {
      const uploadRes = await api.post(`/CommunityPost/upload-images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      newImages.forEach((img, idx) => {
        img.imageFileName = uploadRes.data[idx]
      })
    } catch (err) {
      console.error('圖片上傳失敗：', err)
      alert('圖片上傳失敗，請稍後再試一次！')
      return
    }
  }

  // 重新編號 sortOrder，避免移除中間照片後留下缺口
  const images = editForm.value.images.map((img, idx) => ({
    imageFileName: img.imageFileName,
    sortOrder: idx + 1
  }))

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

  // 成功後直接更新畫面，不用重打 GET
  post.content = editForm.value.content
  post.status = editForm.value.status
  post.images = images
  post.image = images.length > 0 ? `${IMAGE_BASE}${images[0].imageFileName}` : ''
  post.tags = editForm.value.taggedProducts.map(name => `#${name}`)
  post.taggedProducts = editForm.value.taggedProducts.map(name => {
    const matched = availableProducts.value.find(p => p.name === name)
    return { name, productId: matched ? matched.productId : null, productRoute: null }
  })
  editingPostId.value = null
  alert('儲存成功！')
}

onMounted(async () => {
  loadProfileData()
  loadSavedPosts() // 避免直接連進這頁時收藏頁籤看起來是空的
  fetchProducts() // 編輯表單要用，只有本人頁面用得上但先載入沒關係
  // 先確定拿到真正的 userId，才能準確比對「是不是在看自己的頁面」
  await loadCurrentUserId()
  if (viewedUserId.value !== currentUserId.value) {
    fetchFollowStatus()
  }
})

// 三支 API 平行送出，全部回來才關掉骨架畫面，避免資料只到一半的破圖
const loadProfileData = async () => {
  profileLoading.value = true
  try {
    await Promise.all([fetchUserPosts(), fetchFollowCounts(), fetchPublicProfile()])
  } finally {
    profileLoading.value = false
  }
}

// 切換到別人的個人頁時 Vue Router 會重用元件，onMounted 不會再跑，靠 watch 補上
watch(() => route.params.userId, () => {
  loadProfileData()
  if (viewedUserId.value !== currentUserId.value) {
    fetchFollowStatus()
  } else {
    userProfile.value.isFollowing = false
    myFollowId.value = null
  }
})

const tabs = [
  { key: 'works', label: '穿搭作品' },
  { key: 'saved', label: '收藏' }
]

// 目前登入者對這個人的追蹤紀錄 id，還沒追蹤是 null
const myFollowId = ref(null)

const fetchPublicProfile = async () => {
  try {
    const res = await api.get(`/PublicUserProfile/${viewedUserId.value}`)
    userProfile.value.name = res.data.username
    userProfile.value.handle = `@${res.data.account}`
    // 沒設大頭貼時用 username 當 dicebear seed，跟貼文卡片、留言的預設頭像一致
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

const toggleFollow = async () => {
  if (userProfile.value.isFollowing) {
    try {
      await api.delete(`/UserFollow/${myFollowId.value}`)
    } catch (err) {
      console.error('取消追蹤失敗：', err)
      return
    }
    userProfile.value.isFollowing = false
    myFollowId.value = null
    userProfile.value.followersCount -= 1
  } else {
    try {
      await api.post(`/UserFollow`, {
        followerId: currentUserId.value,
        followingId: viewedUserId.value
      })
    } catch (err) {
      console.error('追蹤失敗：', err)
      return
    }
    userProfile.value.followersCount += 1
    // POST 不回傳新紀錄的 id，重新查一次才知道 myFollowId
    await fetchFollowStatus()
  }
}
</script>


<template>
  

  <div class="community-page min-vh-100 w-100">
    

    <div class="container-fluid container-lg pb-5">

      <!--  返回社群按鈕 -->
      <router-link to="/community" class="back-pill">← 返回社群</router-link>

      <!-- profileLoading：個人資料、貼文都還沒抓回來之前顯示骨架佔位畫面 -->
      <template v-if="profileLoading">
        <div class="skeleton-profile-card">
          <div class="skeleton-block skeleton-banner"></div>
          <div class="skeleton-profile-body">
            <div class="skeleton-block skeleton-avatar-xl"></div>
            <div class="skeleton-stats-row">
              <div class="skeleton-block skeleton-line skeleton-stat"></div>
              <div class="skeleton-block skeleton-line skeleton-stat"></div>
              <div class="skeleton-block skeleton-line skeleton-stat"></div>
            </div>
            <div class="skeleton-block skeleton-line skeleton-line-30" style="margin-top:1.1rem;"></div>
            <div class="skeleton-block skeleton-line skeleton-line-60" style="margin-top:.6rem;"></div>
            <div class="skeleton-block skeleton-line skeleton-line-90" style="margin-top:.6rem;"></div>
          </div>
        </div>
        <div class="skeleton-grid">
          <div class="skeleton-card" v-for="n in 6" :key="n">
            <div class="skeleton-block skeleton-card-media"></div>
            <div class="skeleton-card-body">
              <div class="skeleton-block skeleton-line skeleton-line-50"></div>
              <div class="skeleton-block skeleton-line skeleton-line-90"></div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
      <!-- 個人檔案卡 -->
      <div class="profile-card mb-4">

        <!-- 封面橫幅 -->
        <div class="profile-banner"></div>

        <div class="profile-body">
          <div class="profile-top">

            <!-- 大頭貼 -->
            <div class="avatar-wrapper">
              <img :src="userProfile.avatar" class="avatar-img" alt="Avatar" @error="onAvatarError($event, userProfile.name)" />
            </div>

            <!-- 數據與動作 -->
            <div class="profile-meta">
              <div class="stat-group">
                <div class="stat-item">
                  <div class="stat-num">{{ userProfile.postsCount }}</div>
                  <div class="stat-label">貼文</div>
                </div>
                <router-link :to="`/community/profile/${viewedUserId}/followers`" class="stat-item stat-item-clickable">
                  <div class="stat-num">{{ userProfile.followersCount }}</div>
                  <div class="stat-label">粉絲</div>
                </router-link>
                <router-link :to="`/community/profile/${viewedUserId}/following`" class="stat-item stat-item-clickable">
                  <div class="stat-num">{{ userProfile.followingCount }}</div>
                  <div class="stat-label">追蹤中</div>
                </router-link>
              </div>

              <!-- 只有瀏覽別人的頁面才顯示追蹤／訊息按鈕 -->
              <div class="action-group" v-if="viewedUserId !== currentUserId">
                <button
                  class="btn-follow-main"
                  :class="{ following: userProfile.isFollowing }"
                  @click="toggleFollow"
                >
                  {{ userProfile.isFollowing ? '已追蹤' : '＋ 追蹤' }}
                </button>
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

      <!-- 穿搭作品牆 -->
      <div v-if="activeTab === 'works'" class="post-grid">
        <div v-for="post in userPosts" :key="post.communityPostId" class="post-card">

          <router-link :to="`/community/post/${post.communityPostId}`" class="post-media d-block text-decoration-none">
            <span class="tag-label" v-if="post.tags[0]">{{ post.tags[0].replace('#', '') }}</span>
            <!--  狀態徽章只給本人看  -->
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
              <span>♥ {{ formatCount(post.likesCount) }}</span>
              <span>💬 {{ formatCount(post.commentsCount) }}</span>
            </div>

            <div class="tag-cloud">
              <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>

            <!-- 編輯／刪除只有本人看自己頁面才會出現 -->
            <template v-if="viewedUserId === currentUserId">
              <!-- Teleport 到 body，脫離卡片欄寬限制才能置中彈出 -->
              <Teleport to="body">
                <!-- :css="false"：動畫改由 anime.js 控制，v-if 要放進去才觸發得到 enter/leave -->
                <Transition @enter="onEditModalEnter" @leave="onEditModalLeave" :css="false">
                  <div v-if="editingPostId === post.communityPostId" class="edit-modal-overlay" @click.self="cancelEdit">
                    <div class="edit-modal">
                    <div class="edit-modal-header">
                      <h3 class="edit-modal-title">編輯貼文</h3>
                      <button type="button" class="edit-modal-close" @click="cancelEdit">✕</button>
                    </div>

                    <div class="edit-form">
                      <textarea v-model="editForm.content" class="edit-textarea" rows="3"></textarea>

                      <div class="edit-thumb-row">
                        <div class="edit-thumb-item" v-for="(img, idx) in editForm.images" :key="idx">
                          <img :src="img.url" alt="縮圖" @click="openLightbox(img.url)" />
                          <button type="button" class="edit-thumb-remove" @click="removeEditImage(idx)">✕</button>
                        </div>
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

      <!-- 收藏牆 -->
      <div v-else-if="activeTab === 'saved'">
        <div v-if="savedPosts.length" class="post-grid">
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

        <!-- 收藏清單是空的時候顯示這個提示 -->
        <div v-else class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 8l2.5-4h11L20 8" />
            <path d="M4 8v10a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18V8" />
            <path d="M4 8h16" />
            <path d="M9.5 12h5" />
          </svg>
          <p class="empty-note">「還沒有收藏任何穿搭，去社群逛逛按個收藏吧。」</p>
        </div>
      </div>

      </template>
    </div>

    <!--  圖片放大燈箱  -->
    <Teleport to="body" v-if="lightboxImage">
      <div class="lightbox-overlay" @click.self="closeLightbox">
        <button type="button" class="lightbox-close" @click="closeLightbox">✕</button>
        <img :src="lightboxImage" class="lightbox-image" alt="放大圖片" />
      </div>
    </Teleport>
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

/* ---------- 個人檔案卡 ---------- */
.profile-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:22px;
  overflow:hidden;
}

/* ---------- 骨架載入畫面 ---------- */
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
/* 骨架版的個人檔案卡 */
.skeleton-profile-card{
  background:var(--paper); border:1px solid var(--hairline); border-radius:22px;
  overflow:hidden; margin-bottom:1.6rem;
}
.skeleton-banner{ height:150px; border-radius:0; }
.skeleton-profile-body{ padding:0 2.2rem 1.6rem; position:relative; }
.skeleton-avatar-xl{
  width:112px; height:112px; border-radius:50%;
  margin-top:-58px; border:5px solid var(--paper);
}
.skeleton-stats-row{ display:flex; gap:2rem; margin-top:1rem; }
.skeleton-stat{ width:48px; height:14px; }
.skeleton-line{ height:14px; }
.skeleton-line-30{ width:30%; }
.skeleton-line-60{ width:60%; }
.skeleton-line-90{ width:90%; }
.skeleton-line-50{ width:50%; }

/* 骨架版的貼文網格：跟 .post-grid／.post-card 同一組欄數、圓角、間距。 */
.skeleton-grid{
  display:grid; grid-template-columns:repeat(4, 1fr); gap:1.4rem; margin-top:2rem;
}
.skeleton-card{
  background:var(--paper); border:1px solid var(--hairline); border-radius:16px; overflow:hidden;
}
.skeleton-card-media{ aspect-ratio:4/5; border-radius:0; }
.skeleton-card-body{ padding:1rem; display:flex; flex-direction:column; gap:.6rem; }

@media (max-width: 767px){
  .skeleton-grid{ grid-template-columns:repeat(2, 1fr); }
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
  半透明黑底 + flex 編輯貼文置中彈窗
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
  font-family:inherit;
  outline:none;
  /* 輸入框固定高度（不會隨內容變高），貼文內容太長的話用 overflow-y:auto，輸入框自己出現垂直捲軸 */
  height:160px;
  resize:none;
  overflow-y:auto;
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

/* 縮圖放大燈箱，同樣 Teleport 到 body，補宣告 --ink 避免抓空值 */
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

/* ---------- RWD ---------- */
@media (max-width: 991px){
  .post-grid{ grid-template-columns:repeat(2, 1fr); }
}
@media (max-width: 640px){
  .profile-top{ flex-direction:column; align-items:flex-start; }
  .profile-meta{ width:100%; justify-content:space-between; }
  .post-grid{ grid-template-columns:1fr; }
}
</style>

<!--  這個區塊「不加 scoped」：scoped 樣式只會作用在這個元件模板裡面的元素上 -->
<style>
body {
  background-color: #F9F4F0 !important;
}
</style>