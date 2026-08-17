<script setup>
// ChatView.vue：站內聊天室，取代原本 UserProfileView.vue「訊息」按鈕的 mailto 連結。
// 左側是對話清單，右側是選中對話的訊息串——跟 FB Messenger 的版面配置邏輯一樣。
// 即時收發訊息的部分（WebSocket）都包在 services/chatHub.js 裡，這個檔案只處理畫面。
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
// currentUserId、loadCurrentUserId：跟 CreatePostView.vue、PostDetailView.vue 是同一份，
// 從 CommunityView.vue 匯出，全站共用同一份「目前登入者是誰」的狀態，不用重複打 API。
import { currentUserId, loadCurrentUserId } from '@/views/Community/CommunityView.vue'
import { connectChat, disconnectChat, onReceiveMessage, offReceiveMessage, sendChatMessage } from '@/services/chatHub'

const route = useRoute()
const router = useRouter()

// IMAGE_BASE：大頭貼是靜態檔案，走的不是 /api 這條路徑，邏輯跟其他頁面一樣。
const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

const conversations = ref([])
const loadingConversations = ref(true)

const activeOtherUserId = ref(null)
const activeOtherUsername = ref('')
const activeOtherAvatar = ref(null)
const messages = ref([])
const loadingMessages = ref(false)
const newMessage = ref('')
const messagesEl = ref(null)

// avatarUrl／onAvatarError：跟 CommunityView.vue、PostDetailView.vue 是同一套邏輯——
// 資料庫有存大頭貼路徑就接 IMAGE_BASE，沒有（或載入失敗）就用 dicebear 依帳號名稱產生預設圖，
// 同一個帳號不管在哪個頁面看到的預設頭像都會是同一張。
const avatarUrl = (avatarPath, username) => {
  return avatarPath
    ? `${IMAGE_BASE}${avatarPath}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'guest'}`
}
const onAvatarError = (event, name) => {
  if (event.target.dataset.fallback) return
  event.target.dataset.fallback = '1'
  event.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
}

// formatChatTime：跟 PostDetailView.vue 的 formatDateTime 是同一套「2026-06-06 12:00」固定格式。
const formatChatTime = (dateStr) => {
  const d = new Date(dateStr)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

// fetchConversations：打 ChatController.cs 的 GET api/Chat/conversations，
// 拿左側對話清單要用的資料（每個聊過天的人、最後一則訊息、未讀數）。
const fetchConversations = async () => {
  loadingConversations.value = true
  try {
    const res = await api.get('/Chat/conversations')
    conversations.value = res.data
  } catch (err) {
    console.error('讀取對話清單失敗：', err)
  } finally {
    loadingConversations.value = false
  }
}

// scrollToBottom：訊息串永遠捲到最新一則，跟一般聊天軟體的行為一樣。
// nextTick：等 Vue 把新訊息實際畫到畫面上之後才捲動，不然畫面還沒更新，捲動高度會抓錯。
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

// fetchMessages：打 GET api/Chat/messages/{otherUserId}，拿跟某個人的完整對話歷史。
// 這支 API 後端會順便把「對方傳給我、我還沒讀過」的訊息標記已讀，
// 所以這裡同步把左側清單那一則的未讀數字歸零，不用整個重打 fetchConversations 一次。
const fetchMessages = async (otherUserId) => {
  loadingMessages.value = true
  try {
    const res = await api.get(`/Chat/messages/${otherUserId}`)
    messages.value = res.data
    scrollToBottom()
    const conv = conversations.value.find(c => c.otherUserId === otherUserId)
    if (conv) conv.unreadCount = 0
  } catch (err) {
    console.error('讀取對話訊息失敗：', err)
  } finally {
    loadingMessages.value = false
  }
}

// openConversation：點左側某個對話、或從個人頁「訊息」按鈕跳轉過來時執行。
const openConversation = async (otherUserId, username, avatar) => {
  activeOtherUserId.value = otherUserId
  activeOtherUsername.value = username
  activeOtherAvatar.value = avatar
  // 網址也跟著換成 /community/messages/:userId，重新整理頁面時才會記得剛剛開的是哪個對話。
  router.replace(`/community/messages/${otherUserId}`)
  await fetchMessages(otherUserId)
}

// initFromRoute：頁面載入、或網址直接帶著 userId 進來時（例如從個人頁按「訊息」跳過來）執行。
// 先看這個 userId 是不是已經在對話清單裡——是的話直接用清單裡現成的名稱、大頭貼；
// 不是的話代表這是一段全新的對話（兩人還沒聊過天），另外打 PublicUserProfile 這支既有的 API
// 去要對方的名稱、大頭貼，讓聊天室上方的標題不會是空的。
const initFromRoute = async () => {
  const userIdParam = route.params.userId
  if (!userIdParam) return
  const targetId = Number(userIdParam)
  if (targetId === activeOtherUserId.value) return

  const existing = conversations.value.find(c => c.otherUserId === targetId)
  if (existing) {
    await openConversation(targetId, existing.otherUsername, existing.otherAvatar)
    return
  }

  try {
    const res = await api.get(`/PublicUserProfile/${targetId}`)
    await openConversation(targetId, res.data.username, res.data.avatar)
  } catch (err) {
    console.error('找不到這個使用者：', err)
  }
}

// handleReceiveMessage：ChatHub 推來新訊息（不管是自己傳的、還是對方傳來的）時執行——
// 後端 ChatHub.cs 送出訊息後，會同時推一份給接收方跟寄件人自己，兩邊都是走這個事件。
const handleReceiveMessage = (dto) => {
  const isForActiveConversation =
    activeOtherUserId.value !== null &&
    (dto.senderId === activeOtherUserId.value || dto.receiverId === activeOtherUserId.value)

  if (isForActiveConversation) {
    messages.value.push(dto)
    scrollToBottom()
  }

  // 不管是不是目前開著的對話，都重新整理一次左側清單，讓「最後一則訊息」「排序」
  // 「未讀數字」保持最新——重新打一次 API 最單純，不用手動在前端拼湊排序、去重的邏輯。
  fetchConversations()
}

const handleSend = async () => {
  const content = newMessage.value.trim()
  if (!content || !activeOtherUserId.value) return
  newMessage.value = ''
  try {
    await sendChatMessage(activeOtherUserId.value, content)
  } catch (err) {
    console.error('送出訊息失敗：', err)
  }
}

onMounted(async () => {
  await loadCurrentUserId()
  await connectChat()
  onReceiveMessage(handleReceiveMessage)
  await fetchConversations()
  await initFromRoute()
})

onUnmounted(() => {
  offReceiveMessage(handleReceiveMessage)
  disconnectChat()
})

// 監聽網址參數變化：使用者已經在聊天室頁面時，又從別的地方（例如另一個人的個人頁）
// 點了「訊息」按鈕過來，Vue Router 有時候只會更新參數、不會整個重新掛載這個元件，
// 用 watch 確保這種情況下也能正確切換到新的對話。
watch(() => route.params.userId, (newVal) => {
  if (newVal) initFromRoute()
})
</script>

<template>
  <div class="chat-page">
    <div class="chat-container">

      <!-- 左側：對話清單 -->
      <aside class="chat-sidebar">
        <div class="chat-sidebar-header">
          <h1>訊息</h1>
        </div>

        <div v-if="loadingConversations" class="chat-loading">載入中...</div>
        <div v-else-if="conversations.length === 0" class="chat-empty-sidebar">
          還沒有任何對話，去別人的個人頁按「訊息」開始聊天吧
        </div>

        <div v-else class="chat-conversation-list">
          <button
            v-for="c in conversations"
            :key="c.otherUserId"
            type="button"
            class="chat-conversation-item"
            :class="{ active: c.otherUserId === activeOtherUserId }"
            @click="openConversation(c.otherUserId, c.otherUsername, c.otherAvatar)"
          >
            <img
              :src="avatarUrl(c.otherAvatar, c.otherUsername)"
              class="chat-avatar"
              alt="avatar"
              @error="onAvatarError($event, c.otherUsername)"
            />
            <div class="chat-conversation-info">
              <div class="chat-conversation-top">
                <span class="chat-conversation-name">{{ c.otherUsername }}</span>
                <span class="chat-conversation-time">{{ formatChatTime(c.lastMessageDate) }}</span>
              </div>
              <div class="chat-conversation-bottom">
                <span class="chat-conversation-preview">{{ c.lastMessageContent }}</span>
                <span v-if="c.unreadCount > 0" class="chat-unread-badge">{{ c.unreadCount }}</span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <!-- 右側：訊息串 -->
      <section class="chat-main">
        <template v-if="activeOtherUserId">
          <div class="chat-main-header">
            <img
              :src="avatarUrl(activeOtherAvatar, activeOtherUsername)"
              class="chat-avatar"
              alt="avatar"
              @error="onAvatarError($event, activeOtherUsername)"
            />
            <router-link :to="`/community/profile/${activeOtherUserId}`" class="chat-main-name">
              {{ activeOtherUsername }}
            </router-link>
          </div>

          <div class="chat-messages" ref="messagesEl">
            <div v-if="loadingMessages" class="chat-loading">載入中...</div>
            <template v-else>
              <div v-if="messages.length === 0" class="chat-empty-thread">
                還沒有訊息，打個招呼吧！
              </div>
              <div
                v-for="m in messages"
                :key="m.chatMessageId"
                class="chat-bubble-row"
                :class="{ mine: m.senderId === currentUserId }"
              >
                <img
                  v-if="m.senderId !== currentUserId"
                  :src="avatarUrl(activeOtherAvatar, activeOtherUsername)"
                  class="chat-bubble-avatar"
                  alt="avatar"
                  @error="onAvatarError($event, activeOtherUsername)"
                />
                <div class="chat-bubble">
                  <p>{{ m.content }}</p>
                  <span class="chat-bubble-time">{{ formatChatTime(m.sentAt) }}</span>
                </div>
              </div>
            </template>
          </div>

          <div class="chat-input-row">
            <input
              type="text"
              v-model="newMessage"
              class="chat-input"
              placeholder="輸入訊息..."
              @keyup.enter="handleSend"
            />
            <button type="button" class="btn-send-chat" :disabled="!newMessage.trim()" @click="handleSend">
              送出
            </button>
          </div>
        </template>

        <div v-else class="chat-placeholder">
          選一個對話開始聊天
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
.chat-page{
  --cream:#F9F4F0; --paper:#FFFDFB; --ink:#2A2420; --ink-soft:#7A6E63;
  --plum:#7A4B54; --plum-deep:#5E3941; --ochre:#B8862E; --hairline:#E4D8CC;
  width:100%; min-height:100vh; background-color:var(--cream);
  font-family:'Noto Sans TC', sans-serif;
  color:var(--ink);
  padding:1.5rem 0;
}
.chat-container{
  max-width:1100px; margin:0 auto; padding:0 1.5rem;
  display:grid; grid-template-columns:300px 1fr;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  overflow:hidden;
  height:calc(100vh - 3rem);
}

/* ---------- 左側對話清單 ---------- */
.chat-sidebar{
  border-right:1px solid var(--hairline);
  display:flex; flex-direction:column;
  overflow-y:auto;
}
.chat-sidebar-header{ padding:1.2rem 1.2rem .8rem; border-bottom:1px solid var(--hairline); }
.chat-sidebar-header h1{
  font-family:'Noto Serif TC', serif; font-weight:900; font-size:1.3rem; margin:0; color:var(--ink);
}
.chat-loading, .chat-empty-sidebar, .chat-empty-thread{
  padding:2rem 1.2rem; text-align:center; color:var(--ink-soft); font-size:.85rem;
}
.chat-conversation-list{ display:flex; flex-direction:column; }
.chat-conversation-item{
  display:flex; align-items:center; gap:.7rem;
  padding:.8rem 1.2rem; border:none; background:none;
  text-align:left; cursor:pointer;
  border-bottom:1px solid var(--hairline);
  transition:background .15s ease;
}
.chat-conversation-item:hover{ background:var(--cream); }
.chat-conversation-item.active{ background:var(--cream); }
.chat-avatar{ width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.chat-conversation-info{ flex:1; min-width:0; }
.chat-conversation-top{ display:flex; justify-content:space-between; align-items:baseline; gap:.5rem; }
.chat-conversation-name{ font-weight:700; font-size:.88rem; color:var(--ink); }
.chat-conversation-time{ font-size:.68rem; color:var(--ink-soft); flex-shrink:0; white-space:nowrap; }
.chat-conversation-bottom{ display:flex; justify-content:space-between; align-items:center; gap:.5rem; margin-top:.15rem; }
.chat-conversation-preview{
  font-size:.78rem; color:var(--ink-soft);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.chat-unread-badge{
  background:var(--plum); color:#fff; font-size:.68rem; font-weight:700;
  min-width:18px; height:18px; border-radius:9px; padding:0 .4rem;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}

/* ---------- 右側訊息串 ---------- */
.chat-main{ display:flex; flex-direction:column; min-width:0; }
.chat-placeholder{
  flex:1; display:flex; align-items:center; justify-content:center;
  color:var(--ink-soft); font-size:.9rem;
}
.chat-main-header{
  display:flex; align-items:center; gap:.7rem;
  padding:1rem 1.4rem; border-bottom:1px solid var(--hairline); flex-shrink:0;
}
.chat-main-name{ font-weight:700; color:var(--ink); text-decoration:none; }
.chat-main-name:hover{ color:var(--plum); }

.chat-messages{
  flex:1; overflow-y:auto; padding:1.2rem 1.4rem;
  display:flex; flex-direction:column; gap:.7rem;
}
.chat-bubble-row{ display:flex; align-items:flex-end; gap:.5rem; max-width:70%; }
.chat-bubble-row.mine{ align-self:flex-end; flex-direction:row-reverse; }
.chat-bubble-avatar{ width:26px; height:26px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.chat-bubble{
  background:var(--cream); border-radius:14px;
  padding:.55rem .8rem;
}
.chat-bubble-row.mine .chat-bubble{ background:var(--plum); color:#fff; }
.chat-bubble p{ margin:0; font-size:.86rem; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
.chat-bubble-time{
  display:block; font-size:.64rem; margin-top:.25rem; opacity:.65;
}

.chat-input-row{
  display:flex; gap:.6rem;
  padding:1rem 1.4rem; border-top:1px solid var(--hairline); flex-shrink:0;
}
.chat-input{
  flex:1; border:1px solid var(--hairline); border-radius:999px;
  padding:.6rem 1.1rem; font-size:.86rem; color:var(--ink);
  outline:none; transition:border-color .18s ease;
}
.chat-input:focus{ border-color:var(--plum); }
.btn-send-chat{
  background:var(--ink); color:var(--paper); border:none; border-radius:999px;
  padding:.6rem 1.4rem; font-size:.84rem; font-weight:600; cursor:pointer;
  transition:background .18s ease;
}
.btn-send-chat:hover:not(:disabled){ background:var(--plum-deep); }
.btn-send-chat:disabled{ opacity:.5; cursor:not-allowed; }

@media (max-width: 720px) {
  .chat-container{ grid-template-columns:1fr; height:calc(100vh - 2rem); }
  .chat-sidebar{ display:none; }
}
</style>