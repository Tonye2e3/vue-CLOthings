<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE = 'https://localhost:7255'
const route = useRoute()
const router = useRouter()

const post = ref(null)
const comments = ref([])
const loading = ref(true)
const notFound = ref(false)

// selectedStatus：下拉選單目前選的值，跟 post.value.status 分開存，
// 這樣使用者選了新的狀態、但還沒按「儲存變更」之前，畫面上方顯示狀態的地方
// 不會提早跟著變，要按下儲存才會真的生效（跟你原本 MVC 版本的行為一樣）。
const selectedStatus = ref('public')

const fetchPost = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/api/CommunityPost/${route.params.id}`)
    if (!res.data) {
      notFound.value = true
      return
    }
    post.value = res.data
    selectedStatus.value = res.data.status
  } catch (err) {
    console.error('讀取貼文失敗：', err)
    notFound.value = true
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const res = await axios.get(`${API_BASE}/api/PostComment/post/${route.params.id}`)
    comments.value = res.data
  } catch (err) {
    console.error('讀取留言失敗：', err)
  }
}

onMounted(() => {
  fetchPost()
  fetchComments()
})

// saveStatus：按「儲存變更」時執行。PutCommunityPost 需要完整帶 content、images、
// taggedProducts（不然會把這些欄位清空，因為後端是整批同步的寫法），
// 所以這裡照抄 post.value 現有的內容，只換掉 status 這一個欄位。
const saveStatus = async () => {
  try {
    await axios.put(`${API_BASE}/api/CommunityPost/${post.value.communityPostId}`, {
      communityPostId: post.value.communityPostId,
      userId: post.value.userId,
      content: post.value.content,
      status: selectedStatus.value,
      images: post.value.images.map(img => ({
        imageFileName: img.imageFileName,
        sortOrder: img.sortOrder
      })),
      taggedProducts: post.value.taggedProducts.map(t => ({
        productId: t.productId,
        productRoute: t.productRoute
      }))
    })
  } catch (err) {
    console.error('儲存狀態失敗：', err)
    alert('儲存失敗，請稍後再試一次！')
    return
  }
  post.value.status = selectedStatus.value
  alert('已儲存變更！')
}

// deleteComment：管理者刪除不當留言。
const deleteComment = async (comment) => {
  if (!confirm('確定要刪除這則留言嗎？')) return
  try {
    await axios.delete(`${API_BASE}/api/PostComment/${comment.postCommentId}`)
  } catch (err) {
    console.error('刪除留言失敗：', err)
    alert('刪除失敗，請稍後再試一次！')
    return
  }
  comments.value = comments.value.filter(c => c.postCommentId !== comment.postCommentId)
  post.value.commentsCount -= 1
}

// deletePost：整篇貼文一起刪掉，刪完直接導回列表頁。
const deletePost = async () => {
  if (!confirm(`確定要刪除貼文編號 #${post.value.communityPostId} 嗎？刪除後資料無法復原，圖片、標記商品、留言等關聯紀錄都會一併刪除。`)) return
  try {
    await axios.delete(`${API_BASE}/api/CommunityPost/${post.value.communityPostId}`)
  } catch (err) {
    console.error('刪除貼文失敗：', err)
    alert('刪除失敗，請稍後再試一次！')
    return
  }
  router.push('/admin/community/posts')
}

const statusLabel = (status) => {
  if (status === 'public') return '公開'
  if (status === 'hide') return '隱藏'
  if (status === 'check') return '審核中'
  return status
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-container">

      <div class="admin-breadcrumb">
        <router-link to="/admin/community/posts">Admin / 社群貼文管理</router-link> / 貼文詳情
      </div>

      <div v-if="loading" class="admin-loading">載入中...</div>
      <div v-else-if="notFound" class="admin-loading">找不到這篇貼文。</div>

      <template v-else>
        <div class="admin-title-row">
          <h1 class="admin-title">貼文詳情</h1>
          <span class="post-id-badge">貼文編號: {{ post.communityPostId }}</span>
        </div>

        <!-- 原始貼文資訊（唯讀） -->
        <div class="admin-card">
          <div class="section-head">📌 貼文主體內容</div>
          <div class="meta-row">
            <div>
              <span class="meta-label">發布使用者</span>
              <router-link :to="`/community/profile/${post.userId}`">{{ post.user ? post.user.name : post.userId }}</router-link>
            </div>
            <div>
              <span class="meta-label">發布時間</span>
              {{ new Date(post.postDate).toLocaleString('zh-TW') }}
            </div>
            <div>
              <span class="meta-label">目前狀態</span>
              <span class="status-badge" :class="`badge-${post.status}`">{{ statusLabel(post.status) }}</span>
            </div>
          </div>

          <div class="field-label">貼文內容：</div>
          <div class="readonly-box">{{ post.content }}</div>

          <div class="field-label">貼文圖片：</div>
          <div class="image-row">
            <img v-for="img in post.images" :key="img.postImageId" :src="`${API_BASE}${img.imageFileName}`" alt="貼文圖片" />
          </div>
        </div>

        <!-- 標記商品 -->
        <div class="admin-card" v-if="post.taggedProducts.length">
          <div class="section-head section-head-cyan">🏷 標記商品</div>
          <div>
            <span v-for="t in post.taggedProducts" :key="t.postTaggedProductId" class="tag-chip-big">{{ t.name }}</span>
          </div>
        </div>

        <!-- 管理者處置設定 -->
        <div class="admin-card">
          <div class="section-head section-head-blue">🛠 管理者處置設定</div>
          <label class="field-label">文章顯示狀態 (Status)</label>
          <select v-model="selectedStatus" class="status-select">
            <option value="public">public（公開顯示）</option>
            <option value="hide">hide（違規隱藏 / 下架）</option>
            <option value="check">check（審核中）</option>
          </select>
          <p class="status-hint">
            說明：public 為前台正常公開；若有爭議需釐清請設為 check（審核中）；若確認違規請設為 hide（強制下架）。
          </p>
          <div class="admin-actions">
            <button class="btn-save" @click="saveStatus">💾 儲存變更</button>
            <button class="btn-delete-big" @click="deletePost">🗑 刪除貼文</button>
            <router-link to="/admin/community/posts" class="btn-back">返回列表</router-link>
          </div>
        </div>

        <!-- 留言管理 -->
        <div class="admin-card">
          <div class="section-head section-head-dark">💬 貼文留言管理<span class="comment-count">共 {{ comments.length }} 則</span></div>
          <div v-if="!comments.length" class="admin-loading">目前沒有留言。</div>
          <div v-for="c in comments" :key="c.postCommentId" class="comment-row">
            <div class="comment-top">
              <router-link :to="`/community/profile/${c.userId}`">{{ c.user }}</router-link>
              <span class="comment-date">{{ new Date(c.commentDate).toLocaleString('zh-TW') }}</span>
              <button class="btn-delete-comment" @click="deleteComment(c)">🗑 刪除留言</button>
            </div>
            <div class="comment-text">{{ c.commentText }}</div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
.admin-page{
  width:100%; min-height:100vh;
  background:#F4F4F5;
  padding:2rem 0;
  --ink:#1F2937; --ink-soft:#6B7280; --paper:#FFFFFF; --hairline:#E5E7EB;
  --plum:#7A4B54; --plum-deep:#5E3941;
  font-family:'Noto Sans TC', sans-serif;
  color:var(--ink);
}
.admin-container{ max-width:900px; margin:0 auto; padding:0 1.5rem; }
.admin-breadcrumb{ font-size:.8rem; color:var(--ink-soft); margin-bottom:.3rem; }
.admin-breadcrumb a{ color:var(--ink-soft); }
.admin-loading{ padding:2rem; text-align:center; color:var(--ink-soft); }

.admin-title-row{ display:flex; align-items:center; justify-content:space-between; margin-bottom:1.2rem; }
.admin-title{ font-size:1.4rem; font-weight:800; margin:0; }
.post-id-badge{ background:var(--ink); color:#fff; font-size:.8rem; padding:.3rem .8rem; border-radius:6px; }

.admin-card{
  background:var(--paper); border:1px solid var(--hairline); border-radius:10px;
  padding:1.3rem; margin-bottom:1.2rem; overflow:hidden;
}
.section-head{
  background:#111827; color:#fff; font-weight:700; font-size:.9rem;
  padding:.6rem 1rem; margin:-1.3rem -1.3rem 1rem; display:flex; justify-content:space-between;
}
.section-head-cyan{ background:#06B6D4; }
.section-head-blue{ background:#2563EB; }
.section-head-dark{ background:#111827; }
.comment-count{ background:#374151; padding:.15rem .6rem; border-radius:999px; font-size:.75rem; }

.meta-row{ display:flex; gap:2rem; flex-wrap:wrap; margin-bottom:1rem; font-size:.86rem; }
.meta-label{ display:block; font-size:.72rem; color:var(--ink-soft); margin-bottom:.15rem; }

.field-label{ font-weight:700; font-size:.86rem; margin:1rem 0 .5rem; }
.readonly-box{
  border:1px solid var(--hairline); border-radius:6px; padding:.8rem;
  font-size:.86rem; background:#F9FAFB;
}
.image-row{ display:flex; gap:.6rem; flex-wrap:wrap; }
.image-row img{ width:110px; height:110px; object-fit:cover; border-radius:6px; }

.tag-chip-big{
  display:inline-block; background:#CFFAFE; color:#0E7490;
  font-size:.8rem; padding:.35rem .8rem; border-radius:6px; margin:.2rem .3rem .2rem 0;
}

.status-select{
  width:100%; border:1px solid var(--hairline); border-radius:6px;
  padding:.6rem .8rem; font-size:.88rem; color:var(--ink); background:var(--paper);
}
.status-hint{ font-size:.78rem; color:var(--ink-soft); margin:.6rem 0 0; }

.admin-actions{ display:flex; gap:.6rem; margin-top:1.2rem; flex-wrap:wrap; }
.btn-save{ background:#2563EB; color:#fff; border:none; border-radius:6px; padding:.55rem 1.2rem; font-size:.86rem; font-weight:600; }
.btn-delete-big{ background:#EF4444; color:#fff; border:none; border-radius:6px; padding:.55rem 1.2rem; font-size:.86rem; font-weight:600; }
.btn-back{ background:#6B7280; color:#fff; border:none; border-radius:6px; padding:.55rem 1.2rem; font-size:.86rem; text-decoration:none; }

.status-badge{ display:inline-block; padding:.2rem .6rem; border-radius:999px; font-size:.76rem; font-weight:700; color:#fff; }
.badge-public{ background:#16A34A; }
.badge-hide{ background:#9CA3AF; }
.badge-check{ background:#D97706; }

.comment-row{ border-bottom:1px solid var(--hairline); padding:.8rem 0; }
.comment-row:last-child{ border-bottom:none; }
.comment-top{ display:flex; align-items:center; gap:.8rem; font-size:.82rem; margin-bottom:.3rem; }
.comment-date{ color:var(--ink-soft); }
.btn-delete-comment{ margin-left:auto; background:#FEE2E2; color:#DC2626; border:1px solid #FCA5A5; border-radius:4px; padding:.25rem .6rem; font-size:.74rem; }
.comment-text{ font-size:.86rem; }
</style>