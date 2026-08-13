<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const API_BASE = 'https://localhost:7255'

// posts：後台要管理的全部貼文，不管 status 是 public、hide 還是 check 都要看得到
// （跟前台 CommunityView.vue 不一樣，前台通常只給使用者看 public 的）。
const posts = ref([])
const loading = ref(true)

const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_BASE}/api/CommunityPost`)
    posts.value = res.data
  } catch (err) {
    console.error('讀取貼文列表失敗：', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchPosts)

// 分頁：跟 CommunityView.vue 的「載入更多」不同，這裡是傳統的頁碼分頁，
// 跟你原本 MVC 後台的呈現方式一樣。
const PAGE_SIZE = 5
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(posts.value.length / PAGE_SIZE)))
const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return posts.value.slice(start, start + PAGE_SIZE)
})
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

// statusLabel／statusClass：把資料庫存的英文狀態值，轉成中文文字跟對應的顏色 class。
const statusLabel = (status) => {
  if (status === 'public') return '公開'
  if (status === 'hide') return '隱藏'
  if (status === 'check') return '審核中'
  return status
}
const statusClass = (status) => {
  if (status === 'public') return 'badge-public'
  if (status === 'hide') return 'badge-hide'
  if (status === 'check') return 'badge-check'
  return ''
}

// deletePost：列表頁直接刪除，跟 UserProfileView.vue 的 deletePost 是同一套做法，
// 用瀏覽器內建的 confirm() 跳出確認視窗，不用另外做一個「刪除確認」頁面。
const deletePost = async (post) => {
  if (!confirm(`確定要刪除貼文編號 #${post.communityPostId} 嗎？刪除後資料無法復原，圖片、標記商品、留言等關聯紀錄都會一併刪除。`)) return

  try {
    await axios.delete(`${API_BASE}/api/CommunityPost/${post.communityPostId}`)
  } catch (err) {
    console.error('刪除貼文失敗：', err)
    alert('刪除失敗，請稍後再試一次！')
    return
  }

  posts.value = posts.value.filter(p => p.communityPostId !== post.communityPostId)
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-container">

      <div class="admin-breadcrumb">Admin / 社群貼文管理</div>
      <h1 class="admin-title">社群貼文管理</h1>

      <div v-if="loading" class="admin-loading">載入中...</div>

      <div v-else class="admin-card">
        <table class="admin-table">
          <thead>
            <tr>
              <th>發布者ID</th>
              <th>貼文內容</th>
              <th>發布時間</th>
              <th>狀態</th>
              <th>貼文圖片</th>
              <th>按讚數</th>
              <th>留言數</th>
              <th>標籤商品</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in pagedPosts" :key="post.communityPostId">
              <td>
                <router-link :to="`/community/profile/${post.userId}`">{{ post.userId }}</router-link>
              </td>
              <td class="cell-content">{{ post.content }}</td>
              <td class="cell-nowrap">{{ new Date(post.postDate).toLocaleString('zh-TW') }}</td>
              <td>
                <span class="status-badge" :class="statusClass(post.status)">{{ statusLabel(post.status) }}</span>
              </td>
              <td>
                <img
                  v-if="post.images && post.images.length"
                  :src="`${API_BASE}${post.images[0].imageFileName}`"
                  class="cell-thumb"
                  alt="貼文圖片"
                />
              </td>
              <td>♥ {{ post.likesCount }}</td>
              <td>💬 {{ post.commentsCount }}</td>
              <td>
                <span
                  v-for="tag in post.taggedProducts"
                  :key="tag.postTaggedProductId"
                  class="tag-chip"
                >{{ tag.name }}</span>
              </td>
              <td>
                <div class="cell-actions">
                  <router-link :to="`/admin/community/posts/${post.communityPostId}`" class="btn-admin-detail">詳情</router-link>
                  <button class="btn-admin-delete" @click="deletePost(post)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="admin-pagination">
          <span class="pagination-info">共 {{ posts.length }} 筆貼文（第 {{ currentPage }} / {{ totalPages }} 頁）</span>
          <div class="pagination-buttons">
            <button class="btn-page" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一頁</button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="btn-page"
              :class="{ active: p === currentPage }"
              @click="goToPage(p)"
            >{{ p }}</button>
            <button class="btn-page" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一頁</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
.admin-page{
  width:100%; min-height:100vh;
  background-color:#F9F4F0 !important;
  padding:2rem 0;
  --cream:#F9F4F0; --paper:#FFFDFB; --ink:#2A2420; --ink-soft:#7A6E63;
  --plum:#7A4B54; --plum-deep:#5E3941; --ochre:#B8862E; --hairline:#E4D8CC;
  font-family:'Noto Sans TC', sans-serif;
  color:var(--ink);
}
.admin-container{ max-width:1200px; margin:0 auto; padding:0 1.5rem; }
.admin-breadcrumb{ font-size:.8rem; color:var(--ink-soft); margin-bottom:.3rem; }
.admin-title{ font-family:'Noto Serif TC', serif; font-weight:900; font-size:1.6rem; margin-bottom:1.4rem; color:var(--ink); }
.admin-loading{ padding:2rem; text-align:center; color:var(--ink-soft); }

.admin-card{
  background:var(--paper); border:1px solid var(--hairline); border-radius:16px;
  padding:1.2rem; overflow-x:auto;
}
.admin-table{ width:auto; border-collapse:collapse; font-size:.86rem; }
.admin-table th{
  text-align:left; padding:.7rem .6rem; border-bottom:2px solid var(--hairline);
  color:var(--ink-soft); font-weight:700; white-space:nowrap;
  font-family:'Noto Serif TC', serif;
}
.admin-table td{ padding:.7rem .6rem; border-bottom:1px solid var(--hairline); vertical-align:middle; }
.admin-table tbody tr:hover{ background:var(--cream); }
.cell-content{ max-width:220px; }
.cell-nowrap{ white-space:nowrap; color:var(--ink-soft); }
.cell-thumb{ width:56px; height:56px; object-fit:cover; border-radius:6px; display:block; }

.status-badge{
  display:inline-block; padding:.25rem .7rem; border-radius:999px;
  font-size:.76rem; font-weight:700; color:#fff;
}
.badge-public{ background:#5E8C61; }
.badge-hide{ background:var(--ink-soft); }
.badge-check{ background:var(--ochre); }

.tag-chip{
  display:inline-block; background:var(--cream); color:var(--plum);
  border:1px solid var(--hairline);
  font-size:.72rem; padding:.2rem .55rem; border-radius:999px;
  margin:.1rem .2rem .1rem 0;
}

.cell-actions{ display:inline-flex; gap:.4rem; white-space:nowrap; }
.btn-admin-detail{
  display:inline-block; background:var(--ink); color:var(--paper);
  border:none; border-radius:4px; padding:.35rem .7rem; font-size:.78rem;
  text-decoration:none; transition:background .18s ease;
}
.btn-admin-detail:hover{ background:var(--plum-deep); }
.btn-admin-delete{
  background:transparent; color:#B4453A;
  border:1px solid #B4453A; border-radius:4px; padding:.35rem .7rem; font-size:.78rem;
  transition:all .18s ease;
}
.btn-admin-delete:hover{ background:#B4453A; color:#fff; }

.admin-pagination{
  display:flex; align-items:center; justify-content:space-between;
  margin-top:1rem; padding-top:1rem; border-top:1px dashed var(--hairline);
  font-size:.82rem; color:var(--ink-soft);
}
.pagination-buttons{ display:flex; gap:.3rem; }
.btn-page{
  border:1px solid var(--hairline); background:var(--paper); color:var(--ink);
  border-radius:4px; padding:.3rem .7rem; font-size:.8rem; transition:all .18s ease;
}
.btn-page:hover:not(:disabled){ border-color:var(--plum); color:var(--plum); }
.btn-page.active{ background:var(--plum); border-color:var(--plum); color:#fff; }
.btn-page:disabled{ opacity:.4; }
</style>