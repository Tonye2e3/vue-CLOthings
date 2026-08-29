<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const IMAGE_BASE = import.meta.env.VITE_API_URL

// posts：後台要管理的全部貼文，不管 status 是 public、hide 還是 check 都要看得到
// （跟前台 CommunityView.vue 不一樣，前台通常只給使用者看 public 的）。
const posts = ref([])
const loading = ref(true)

const fetchPosts = async () => {
  loading.value = true
  try {
    // 打 AdminCommunityPostController（獨立的後台專用 Controller），不是一般的 CommunityPostController——
    // 那支現在固定只回傳 public 狀態的貼文，後台要看到全部狀態（含隱藏、審核中的）才能管理。
    // 這支整個 Controller 都加了 [Authorize(Roles = "Admin,SuperAdmin")]，配合這個檔案自己
    // onMounted 裡的 authStore.isAdmin 檢查，前後端都有擋。
    const res = await api.get(`/AdminCommunityPost`)
    // 依發布時間「新到舊」排序，最新發的貼文會排在第一頁最上面——後端 AdminCommunityPostController
    // 沒有特別排序（預設照資料庫的主鍵順序回傳，等於是「舊到新」），這裡在前端補排一次。
    posts.value = [...res.data].sort((a, b) => new Date(b.postDate) - new Date(a.postDate))
  } catch (err) {
    console.error('讀取貼文列表失敗：', err)
  } finally {
    loading.value = false
  }
}

// ============================================================
// 檢舉次數：之前做檢舉功能時，PostReportController.cs 就已經有一支
// GET api/PostReport/summary 可以查「每篇貼文各被檢舉幾次」，但一直沒有接進這個列表——
// 導致檢舉紀錄其實有存進資料庫，管理員卻完全看不到任何提示。這裡補上。
// ============================================================

// reportCounts：用 Map 存「communityPostId → 被檢舉次數」，畫面上用 getReportCount(id)
// 查某一篇貼文的檢舉次數，查不到（表示這篇沒人檢舉過）就當作 0。
const reportCounts = ref(new Map())
const fetchReportCounts = async () => {
  try {
    const res = await api.get('/PostReport/summary')
    reportCounts.value = new Map(res.data.map(s => [s.communityPostId, s.reportCount]))
  } catch (err) {
    console.error('讀取檢舉次數失敗：', err)
  }
}
const getReportCount = (communityPostId) => reportCounts.value.get(communityPostId) || 0

// 只有登入者是管理員才能看這頁，這個檢查完全寫在這個檔案自己裡面，
// 不用改共用的 router-index.js（那個全域守衛之後要不要加，等問過隊友再說）。
onMounted(() => {
  if (!authStore.isLoggedIn || !authStore.isAdmin) {
    alert('您沒有執行此操作的權限')
    router.push('/')
    return
  }
  fetchPosts()
  fetchReportCounts()
})

// searchQuery：搜尋框打的文字，同時比對「貼文內容」「發布者ID」「發布者帳號」，
// 符合任一個就留在篩選結果裡。
// p.user?.name：後端 AdminCommunityPostController 其實有把使用者帳號（例如 mei_chen88）
// 一起包在 User.Name 裡回傳，只是列表表格目前沒有把這欄顯示出來（只顯示 userId 數字）——
// 一開始漏掉這個欄位沒加進搜尋比對範圍，導致打帳號名稱搜尋不到東西，這裡補上。
const searchQuery = ref('')
const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return posts.value
  return posts.value.filter(p =>
    p.content?.toLowerCase().includes(q) ||
    String(p.userId).includes(q) ||
    p.user?.name?.toLowerCase().includes(q)
  )
})

// 分頁：跟 CommunityView.vue 的「載入更多」不同，這裡是傳統的頁碼分頁，
// 跟你原本 MVC 後台的呈現方式一樣。
const PAGE_SIZE = 5
const currentPage = ref(1)
// totalPages、pagedPosts 現在都改看 filteredPosts（篩選後的結果），
// 沒有搜尋文字時 filteredPosts 就等於 posts，行為跟原本一樣。
const totalPages = computed(() => Math.max(1, Math.ceil(filteredPosts.value.length / PAGE_SIZE)))
const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredPosts.value.slice(start, start + PAGE_SIZE)
})
const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

// 搜尋文字改變時，把頁碼重設回第 1 頁——不然搜尋結果變少了，
// 但頁碼還停在原本比較後面，可能會出現「這一頁是空的」的狀況。
watch(searchQuery, () => {
  currentPage.value = 1
})

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
    await api.delete(`/CommunityPost/${post.communityPostId}`)
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

      <!--
        admin-header-row：標題跟搜尋框排在同一排，靠 justify-content:space-between
        一個貼左邊、一個貼右邊，對應畫面上紅框那個位置。
      -->
      <div class="admin-header-row">
        <div>
          <div class="admin-breadcrumb">Admin / 社群貼文管理</div>
          <h1 class="admin-title">社群貼文管理</h1>
        </div>
        <div class="admin-search-bar">
          <svg class="admin-search-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            class="admin-search-input"
            placeholder="搜尋貼文內容、發布者ID或帳號"
          />
          <button v-if="searchQuery" type="button" class="admin-search-clear" @click="searchQuery = ''">✕</button>
        </div>
      </div>

      <div v-if="loading" class="admin-loading">載入中...</div>

      <div v-else-if="filteredPosts.length === 0 && searchQuery.trim()" class="admin-loading">
        找不到符合「{{ searchQuery }}」的貼文
      </div>

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
              <th>檢舉次數</th>
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
                  :src="`${IMAGE_BASE}${post.images[0].imageFileName}`"
                  class="cell-thumb"
                  alt="貼文圖片"
                />
              </td>
              <td>♥ {{ post.likesCount }}</td>
              <td>💬 {{ post.commentsCount }}</td>
              <td>
                <!--
                  getReportCount(post.communityPostId) > 0：只有真的被檢舉過才顯示紅色警示樣式，
                  沒被檢舉過就是普通灰色的「0」，不會讓整排列表看起來每筆都在警告什麼。
                  這裡故意不做成連結——檢舉明細（誰檢舉的、原因是什麼）可以之後
                  在貼文詳情頁（AdminCommunityPostDetailView.vue）用 GET api/PostReport/post/{id}
                  另外顯示，這裡先只做「有沒有被檢舉過、幾次」的提示就好。
                -->
                <span class="report-count" :class="{ 'report-count-flagged': getReportCount(post.communityPostId) > 0 }">
                  {{ getReportCount(post.communityPostId) > 0 ? `⚠ ${getReportCount(post.communityPostId)}` : '0' }}
                </span>
              </td>
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
.admin-title{ font-family:'Noto Serif TC', serif; font-weight:900; font-size:1.6rem; margin:0; color:var(--ink); }
.admin-loading{ padding:2rem; text-align:center; color:var(--ink-soft); }

.admin-header-row{
  display:flex; align-items:flex-end; justify-content:space-between;
  gap:1rem; flex-wrap:wrap;
  margin-bottom:1.4rem;
}
.admin-search-bar{
  position:relative;
  display:flex; align-items:center;
  width:100%; max-width:320px;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:999px;
  padding:.55rem 1rem;
  transition:border-color .18s ease, box-shadow .18s ease;
}
.admin-search-bar:focus-within{
  border-color:var(--plum);
  box-shadow:0 0 0 3px rgba(122,75,84,.12);
}
.admin-search-icon{ width:16px; height:16px; color:var(--ink-soft); flex-shrink:0; }
.admin-search-input{
  border:none; outline:none; background:transparent;
  flex:1; margin-left:.6rem; font-family:'Noto Sans TC', sans-serif;
  font-size:.86rem; color:var(--ink);
}
.admin-search-input::placeholder{ color:var(--ink-soft); }
.admin-search-clear{
  border:none; background:var(--hairline); color:var(--ink-soft);
  width:18px; height:18px; border-radius:50%; font-size:.65rem;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  cursor:pointer; margin-left:.4rem;
}
.admin-search-clear:hover{ background:var(--plum); color:#fff; }

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

/* status-badge：改成固定寬高的正圓形容器（原本沒有固定寬高，圓圈大小是靠文字內容
   撐出來的，文字幾乎把圓圈撐滿、沒有多餘空間可以置中，才會看起來偏一邊）。
   固定寬高之後用 flex 把文字置中擺進這個圓裡，不管文字要不要換行都能穩定置中，
   字體大小、字型都沒有變動，只調整外層圓圈容器本身。 */
.status-badge{
  display:inline-flex; align-items:center; justify-content:center;
  width:2.4rem; height:2.4rem; border-radius:999px;
  line-height:1.15; text-align:center;
  font-size:.76rem; font-weight:700; color:#fff;
}
.badge-public{ background:#5E8C61; }
.badge-hide{ background:var(--ink-soft); }
.badge-check{ background:var(--ochre); }

/* report-count：預設是普通灰色文字（沒被檢舉過的貼文，大多數情況）；
   真的被檢舉過（次數 > 0）才切成紅棕色警示字，跟按讚愛心的紅色是不同色階，
   避免管理員一眼掃過去分不清楚「這是讚數還是警告」。 */
.report-count{ color:var(--ink-soft); font-weight:600; }
.report-count-flagged{ color:#B4453A; }

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