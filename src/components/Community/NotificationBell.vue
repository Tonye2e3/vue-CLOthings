<script setup>
// NotificationBell.vue：通知鈴鐺，設計成獨立、可以直接塞進任何頁面頂端導覽列的元件。
// 沒有放在 Community 資料夾底下的任何一個頁面裡，是因為導覽列本身是全站共用的，
// 不是這個社群模組自己的頁面——把它做成獨立元件，之後不管導覽列實際寫在哪個檔案
// （App.vue、Header.vue...），都只要 import 這個元件、丟進版面裡就能動。
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
// currentUserId、loadCurrentUserId：跟 Community 其他頁面共用同一份「目前登入者是誰」，
// 不用重複打 API 問一次。
import { currentUserId, loadCurrentUserId } from '@/views/Community/CommunityView.vue'

const router = useRouter()

const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
const avatarUrl = (avatarPath, username) => {
  return avatarPath
    ? `${IMAGE_BASE}${avatarPath}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'guest'}`
}
const onAvatarError = (event, name) => {
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
  if (event.target.src === fallbackUrl) return
  event.target.src = fallbackUrl
}

const unreadCount = ref(0)
const notifications = ref([])
const loading = ref(false)
const showPanel = ref(false)

// fetchUnreadCount：只問「有幾則還沒讀」，鈴鐺上的小紅點數字用這個，
// 不用整份通知清單都抓回來，平常沒打開面板的時候，這支負擔比較輕。
const fetchUnreadCount = async () => {
  if (!currentUserId.value) return
  try {
    const res = await api.get(`/Notification/unread-count/${currentUserId.value}`)
    unreadCount.value = res.data
  } catch (err) {
    console.error('讀取未讀通知數失敗：', err)
  }
}

// fetchNotifications：打開面板時才抓「完整」通知清單，平常收合的時候不用一直查。
const fetchNotifications = async () => {
  if (!currentUserId.value) return
  loading.value = true
  try {
    const res = await api.get(`/Notification/user/${currentUserId.value}`)
    notifications.value = res.data.map(n => ({
      ...n,
      fromAvatar: avatarUrl(n.fromAvatar, n.fromUsername)
    }))
  } catch (err) {
    console.error('讀取通知清單失敗：', err)
  } finally {
    loading.value = false
  }
}

// togglePanel：點鈴鐺時執行。打開的當下順便抓最新清單、並且把「畫面上看得到的」標成已讀。
//
// 後端 mark-all-read 現在只會標記「最新 20 則」裡面還沒讀的，如果未讀數超過 20，
// 會有一部分（使用者根本沒看到的那些）繼續維持未讀，所以這裡不能再像以前那樣
// 直接把 unreadCount 寫死成 0——標記完之後要重新問一次後端「現在真正還有幾則未讀」，
// 角標數字才會準確反映「還有沒看過的通知」，而不是不管三七二十一都歸零。
const togglePanel = async () => {
  showPanel.value = !showPanel.value
  if (showPanel.value) {
    await fetchNotifications()
    if (unreadCount.value > 0) {
      try {
        await api.put(`/Notification/mark-all-read/${currentUserId.value}`)
        // 重新抓一次真正的未讀數量，不要自己假設「標記已讀＝一定變成 0」。
        await fetchUnreadCount()
        // 這次抓回來的 notifications 清單，本來就是 mark-all-read 剛剛標記的那批
        // （同樣是「最新 20 則」），所以這裡直接把畫面上這份清單全部標成已讀顯示沒問題，
        // 不會有「畫面上顯示已讀，但其實後端還是未讀」的落差。
        notifications.value.forEach(n => { n.isRead = true })
      } catch (err) {
        console.error('標記已讀失敗：', err)
      }
    }
  }
}
const closePanel = () => {
  showPanel.value = false
}

// formatNotificationText：依通知類型組出要顯示的句子。
const formatNotificationText = (n) => {
  if (n.type === 'follow') return `${n.fromUsername} 追蹤了你`
  if (n.type === 'like') return `${n.fromUsername} 對你的貼文按了讚`
  if (n.type === 'comment') return `${n.fromUsername} 在你的貼文留言了`
  return `${n.fromUsername} 有新的動態`
}

// formatTime：跟 Community 其他頁面同一套「2026-06-06 12:00」固定格式。
const formatTime = (dateStr) => {
  const d = new Date(dateStr)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

// goToNotification：點某一則通知時執行——追蹤類型帶去對方的個人頁，
// 按讚／留言類型帶去那篇貼文的詳情頁。
const goToNotification = (n) => {
  closePanel()
  if (n.type === 'follow') {
    router.push(`/community/profile/${n.fromUserId}`)
  } else if (n.communityPostId) {
    router.push(`/community/post/${n.communityPostId}`)
  }
}

// pollTimer：每 15 秒重新問一次未讀數量，不用使用者自己重新整理頁面，才會看到「有新通知」的紅點 // 
const POLL_INTERVAL = 15000
let pollTimer = null

onMounted(async () => {
  await loadCurrentUserId()
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, POLL_INTERVAL)
})
onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="notif-bell-wrapper">
    <button type="button" class="notif-bell-btn" @click="togglePanel" aria-label="通知">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </svg>
      <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <div v-if="showPanel" class="notif-panel-backdrop" @click="closePanel"></div>
    <div v-if="showPanel" class="notif-panel">
      <div class="notif-panel-header">通知</div>
      <div v-if="loading" class="notif-empty">載入中...</div>
      <div v-else-if="notifications.length === 0" class="notif-empty">還沒有任何通知</div>
      <div v-else class="notif-list">
        <button
          v-for="n in notifications"
          :key="n.notificationId"
          type="button"
          class="notif-item"
          :class="{ unread: !n.isRead }"
          @click="goToNotification(n)"
        >
          <img :src="n.fromAvatar" class="notif-avatar" alt="avatar" @error="onAvatarError($event, n.fromUsername)" />
          <div class="notif-item-body">
            <p class="notif-text">{{ formatNotificationText(n) }}</p>
            <span class="notif-time">{{ formatTime(n.createdDate) }}</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notif-bell-wrapper{
  --cream:#F9F4F0; --paper:#FFFDFB; --ink:#2A2420; --ink-soft:#7A6E63;
  --plum:#7A4B54; --hairline:#E4D8CC;
  position:relative;
  font-family:'Noto Sans TC', sans-serif;
}
.notif-bell-btn{
  position:relative;
  display:inline-flex; align-items:center; justify-content:center;
  width:36px; height:36px; border-radius:50%;
  border:none; background:transparent;
  /* 不加自己的備援值（例如 var(--ink)）：直接跟旁邊搜尋、收藏、帳號那些圖示
     用一模一樣的 var(--home-text)，不管在哪個頁面、亮色或深色模式，
     這個變數解析出來是什麼顏色，鈴鐺就自動跟著變成什麼顏色——
     真正做到「跟其他圖示共用同一套顏色邏輯」，而不是自己另外帶一份、
     只是碰巧在亮色模式看起來差不多而已。 */
  color:var(--home-text);
  cursor:pointer;
  transition:background-color .2s ease, transform .15s ease;
}
.notif-bell-btn:hover{
  background:var(--home-bg-soft);
  transform:translateY(-1px);
}
.notif-badge{
  position:absolute; top:-2px; right:-2px;
  background:var(--plum); color:#fff; font-size:.62rem; font-weight:700;
  min-width:16px; height:16px; border-radius:8px; padding:0 .3rem;
  display:flex; align-items:center; justify-content:center;
}
.notif-panel-backdrop{ position:fixed; inset:0; z-index:99; }
.notif-panel{
  position:absolute; top:calc(100% + 10px); right:0; z-index:100;
  width:320px; max-height:420px; overflow-y:auto;
  background:var(--paper); border:1px solid var(--hairline); border-radius:10px;
  box-shadow:0 12px 32px rgba(42,36,32,.18);
}
.notif-panel-header{
  padding:.9rem 1.1rem; font-weight:700; color:var(--ink);
  border-bottom:1px solid var(--hairline);
  font-family:'Noto Serif TC', serif;
}
.notif-empty{ padding:2rem 1.1rem; text-align:center; color:var(--ink-soft); font-size:.85rem; }
.notif-list{ display:flex; flex-direction:column; }
.notif-item{
  display:flex; align-items:flex-start; gap:.7rem;
  padding:.8rem 1.1rem; background:none; border:none; border-bottom:1px solid var(--hairline);
  text-align:left; cursor:pointer; transition:background .15s ease;
}
.notif-item:last-child{ border-bottom:none; }
.notif-item:hover{ background:var(--cream); }
.notif-item.unread{ background:rgba(122,75,84,.06); }
.notif-avatar{ width:36px; height:36px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.notif-item-body{ flex:1; min-width:0; }
.notif-text{ margin:0; font-size:.85rem; color:var(--ink); line-height:1.4; }
.notif-time{ font-size:.68rem; color:var(--ink-soft); }
</style>