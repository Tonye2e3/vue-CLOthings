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
// animate：anime.js v4 的動畫函式，這裡用來讓「即時收到的新訊息」滑入畫面，
// 跟 CommunityView.vue 貼文卡片的捲動進場動畫是同一個套件、同一套用法。
import { animate } from 'animejs'

const route = useRoute()
const router = useRouter()

// IMAGE_BASE：大頭貼是靜態檔案，走的不是 /api 這條路徑，邏輯跟其他頁面一樣。
const IMAGE_BASE = import.meta.env.VITE_API_URL

const conversations = ref([])
const loadingConversations = ref(true)

const activeOtherUserId = ref(null)
const activeOtherUsername = ref('')
const activeOtherAvatar = ref(null)
const messages = ref([])
const loadingMessages = ref(false)
const newMessage = ref('')
const messagesEl = ref(null)

// pendingImages：使用者選好、還沒送出的圖片，可以一次選很多張。每一項 file 是原始檔案物件
// （要上傳用），previewUrl 是本地暫時網址（選好馬上看到縮圖，不用等上傳完成）。
// uploading：正在上傳中，避免使用者連點好幾次送出，重複送出同一批圖。
const pendingImages = ref([])
const uploading = ref(false)

// avatarUrl／onAvatarError：跟 CommunityView.vue、PostDetailView.vue 是同一套邏輯——
// 資料庫有存大頭貼路徑就接 IMAGE_BASE，沒有（或載入失敗）就用 dicebear 依帳號名稱產生預設圖，
// 同一個帳號不管在哪個頁面看到的預設頭像都會是同一張。
const avatarUrl = (avatarPath, username) => {
  return avatarPath
    ? `${IMAGE_BASE}${avatarPath}`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'guest'}`
}
const onAvatarError = (event, name) => {
  // 用「換過的網址是不是已經是預設圖」來判斷要不要再換一次，而不是用一個存在
  // DOM 元素上的旗標（例如 dataset.fallback）——這裡的大頭貼是「單一、被重複使用」
  // 的欄位（不是 v-for 跑出來的），例如切換到不同的聊天對象時，Vue 只會更新同一個
  // <img> 的 src，不會整個重新產生一個新的 <img> 元素。如果用旗標記錄「這個元素已經
  // 失敗過、觸發過備援了」，切到下一個對話對象、換了新的大頭貼網址，舊的旗標還留著，
  // 新網址就算真的載入失敗，也會被那個舊旗標擋下來、不會真的換成預設圖，
  // 使用者會看到大頭貼一直是破圖。改成比對「現在這個網址是不是已經是預設圖網址」，
  // 不會有這種「換了新資料，但舊旗標還卡著」的問題。
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
  if (event.target.src === fallbackUrl) return
  event.target.src = fallbackUrl
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
//
// 修正：這支元件現在被兩種路由共用——獨立的 /community/messages/:userId，
// 跟掛在會員中心裡的 /user/messages/:userId（User.vue 用 <RouterView> 包這個元件）。
// 原本這裡不管三七二十一都用絕對路徑 router.replace('/community/messages/...')，
// 如果現在是在會員中心裡點對話，就會被導去獨立的社群聊天頁，等於離開了會員中心版面
// （側邊欄不見了），使用者感覺起來就像「點了又跳轉」。改成看「目前是哪個路由名稱」，
// 用同一個名稱、只換 userId 參數，這樣不管在哪個版面點對話，都留在原本那個版面裡，
// 只有網址列的 userId 換掉。
const targetRouteName = () => (route.name === 'UserMessages' ? 'UserMessages' : 'CommunityMessagesWith')

const openConversation = async (otherUserId, username, avatar) => {
  activeOtherUserId.value = otherUserId
  activeOtherUsername.value = username
  activeOtherAvatar.value = avatar
  // 網址也跟著換成 .../messages/:userId，重新整理頁面時才會記得剛剛開的是哪個對話。
  router.replace({ name: targetRouteName(), params: { userId: otherUserId } })
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
    // pendingSlideInIds：記下這則訊息是「即時收到的」，等一下畫出來的時候要播放滑入動畫。
    // 一開始用 fetchMessages 載入的歷史訊息不會經過這裡，只有透過 ChatHub 即時推送進來的
    // 新訊息才會被標記，這樣歷史訊息就不會跟著一起播動畫，只有真的「剛收到」的才會滑入。
    pendingSlideInIds.add(dto.chatMessageId)
    messages.value.push(dto)
    scrollToBottom()
  }

  // 不管是不是目前開著的對話，都重新整理一次左側清單，讓「最後一則訊息」「排序」
  // 「未讀數字」保持最新——重新打一次 API 最單純，不用手動在前端拼湊排序、去重的邏輯。
  fetchConversations()
}

// ============================================================
// 新訊息滑入動畫：只有「即時收到的新訊息」（handleReceiveMessage 標記過的）才會播放，
// 一開始載入的歷史訊息維持直接顯示，不會整批一起滑動，那樣反而不像「剛收到」的感覺。
// ============================================================

// pendingSlideInIds：等著播放滑入動畫的訊息 id 清單。
const pendingSlideInIds = new Set()

// animatePendingBubbles：把「畫面上剛渲染出來、還在等著播動畫」的訊息氣泡抓出來播放。
// 自己傳的訊息（.mine）從右邊滑入，對方傳來的訊息從左邊滑入，方向跟氣泡本身靠左靠右一致，
// 感覺像是「這則訊息真的從那個方向冒出來」。
const animatePendingBubbles = () => {
  if (pendingSlideInIds.size === 0) return
  document.querySelectorAll('.chat-bubble-row').forEach(el => {
    const id = Number(el.dataset.messageId)
    if (!pendingSlideInIds.has(id)) return
    pendingSlideInIds.delete(id)
    const isMine = el.classList.contains('mine')
    animate(el, {
      opacity: [0, 1],
      translateX: [isMine ? 24 : -24, 0],
      duration: 380,
      ease: 'outQuad',
      // onComplete：清掉 anime.js 留下的行內 opacity／transform 樣式，避免卡住
      // 之後任何跟 transform 有關的效果（目前氣泡本身沒有用到，純粹是保險習慣）。
      onComplete: () => {
        el.style.opacity = ''
        el.style.transform = ''
      }
    })
  })
}

// flush: 'post'：等 Vue 把新訊息真正畫到畫面上（DOM 更新完）之後才執行，
// 這樣 document.querySelectorAll 才抓得到剛渲染出來的新氣泡。
watch(messages, () => {
  animatePendingBubbles()
}, { flush: 'post' })

// handlePickImage：使用者從檔案選擇視窗選好圖片之後執行（可以一次選很多張，也可以分次
//加選）——這裡只做「本地預覽」，還沒真的上傳到伺服器，上傳的動作留到按下「送出」的那一刻
// 才做（handleSend 裡）。這樣如果選好圖片後反悔按了「移除」，就不會浪費一次上傳。
const handlePickImage = (event) => {
  const files = Array.from(event.target.files || [])
  files.forEach(file => {
    pendingImages.value.push({
      file,
      // URL.createObjectURL(file)：瀏覽器內建功能，幫本地檔案產生一個暫時網址，
      // 讓 <img> 可以直接預覽，重新整理頁面就會失效（跟 CreatePostView.vue 選圖片預覽同一招）。
      previewUrl: URL.createObjectURL(file)
    })
  })
  event.target.value = '' // 清空，這樣選同一張圖也能再次觸發 change
}
const removePendingImage = (index) => {
  pendingImages.value.splice(index, 1)
}

const handleSend = async () => {
  const content = newMessage.value.trim()
  // 文字、圖片至少要有一個才能送出——都是空的話不用送。
  if ((!content && pendingImages.value.length === 0) || !activeOtherUserId.value) return

  let imagePaths = []
  if (pendingImages.value.length > 0) {
    uploading.value = true
    try {
      const formData = new FormData()
      // 'files'（跟 CommunityPostController.cs 的 UploadImages(List<IFormFile> files) 一樣）：
      // append 同一個欄位名稱多次，後端就會收到一個「檔案清單」，一次上傳全部選好的圖片。
      pendingImages.value.forEach(img => formData.append('files', img.file))
      const res = await api.post('/Chat/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      imagePaths = res.data
    } catch (err) {
      console.error('圖片上傳失敗：', err)
      alert('圖片上傳失敗，請稍後再試一次！')
      uploading.value = false
      return
    }
    uploading.value = false
  }

  // 先呼叫 sendChatMessage，確定後端真的收下了才清空輸入框跟圖片預覽——
  // 不然像之前那樣「先清空、再送出」，一旦後端這步失敗，畫面上什麼提示都沒有，
  // 打好的字、選好的圖也跟著憑空消失，使用者只會覺得「送出去了但沒反應」。
  try {
    await sendChatMessage(activeOtherUserId.value, content, imagePaths)
    newMessage.value = ''
    pendingImages.value = []
  } catch (err) {
    console.error('送出訊息失敗：', err)
    alert('訊息送出失敗，請稍後再試一次！')
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
    <div class="chat-page-container">
      <!-- 返回上一頁：跟 UserProfileView.vue、FollowListView.vue 是同一顆 back-pill 按鈕、
           同一套樣式。用 $router.back() 而不是寫死 to="/community"，是因為使用者可能是從
           不同地方點「訊息」進來的（例如某個人的個人頁），返回應該回到「剛剛那一頁」，
           不是每次都固定跳去社群首頁。 -->
      <button type="button" class="back-pill" @click="$router.back()">← 返回</button>

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
                :data-message-id="m.chatMessageId"
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
                <div class="chat-bubble" :class="{ 'image-only': m.imagePaths?.length > 0 && !m.content }">
                  <!--
                    多張圖片排成小格狀（跟貼文卡片縮圖列是同樣的排版邏輯），只有 1 張時自然
                    就是單張大圖。點圖片開新分頁看原始大小的圖，跟其他頁面的燈箱比起來陽春
                    一點，但聊天室的圖片通常是隨手拍的截圖，用新分頁看原圖已經夠用。
                  -->
                  <div v-if="m.imagePaths?.length > 0" class="chat-bubble-image-grid" :class="`count-${Math.min(m.imagePaths.length, 4)}`">
                    <a
                      v-for="(img, idx) in m.imagePaths"
                      :key="idx"
                      :href="`${IMAGE_BASE}${img}`"
                      target="_blank"
                      rel="noopener"
                    >
                      <img :src="`${IMAGE_BASE}${img}`" class="chat-bubble-image" alt="聊天圖片" />
                    </a>
                  </div>
                  <p v-if="m.content">{{ m.content }}</p>
                  <span class="chat-bubble-time">{{ formatChatTime(m.sentAt) }}</span>
                </div>
              </div>
            </template>
          </div>

          <!-- 選好但還沒送出的圖片預覽（可以一次選好幾張）：送出前可以先看一眼、
               或個別按 ✕ 移除某一張、換一張／取消 -->
          <div v-if="pendingImages.length > 0" class="chat-pending-row">
            <div v-for="(img, idx) in pendingImages" :key="idx" class="chat-pending-image">
              <img :src="img.previewUrl" alt="預覽圖片" />
              <button type="button" class="chat-pending-remove" @click="removePendingImage(idx)">✕</button>
            </div>
          </div>

          <div class="chat-input-row">
            <!-- 圖片按鈕本身是一個包住隱藏 file input 的 label，點按鈕視覺上是點圖示，
                 實際觸發的是底下那個看不見的 <input type="file">，開出系統的檔案選擇視窗。
                 multiple：可以一次選很多張圖片，也可以分好幾次加選。
                 這裡跟 CreatePostView.vue、CommunityView.vue 一起把 Font Awesome 圖示換成
                 專案自己的 SVG 線條圖示，理由一樣：不吃字型／CDN，風格也統一。 -->
            <label class="chat-image-btn" title="傳送圖片">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="8.5" cy="9.5" r="1.5" />
                <path d="M21 15l-5-5-4 4-3-3-6 6" />
              </svg>
              <input
                type="file"
                accept="image/*"
                multiple
                class="file-input-hidden"
                @change="handlePickImage"
              />
            </label>
            <input
              type="text"
              v-model="newMessage"
              class="chat-input"
              placeholder="輸入訊息..."
              @keyup.enter="handleSend"
            />
            <button
              type="button"
              class="btn-send-chat"
              :disabled="(!newMessage.trim() && pendingImages.length === 0) || uploading"
              @click="handleSend"
            >
              {{ uploading ? '上傳中...' : '送出' }}
            </button>
          </div>
        </template>

        <div v-else class="chat-placeholder">
          選一個對話開始聊天
        </div>
      </section>

      </div>
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
.chat-page-container{ max-width:1100px; margin:0 auto; padding:0 1.5rem; }
.back-pill{
  display:inline-flex; align-items:center; gap:.3rem;
  border:1px solid var(--ink); border-radius:999px;
  padding:.35rem 1rem; font-size:.82rem; color:var(--ink);
  background:none; margin-bottom:1.2rem; cursor:pointer;
  transition:all .18s ease;
}
.back-pill:hover{ background:var(--ink); color:var(--cream); }
.chat-container{
  display:grid; grid-template-columns:300px 1fr;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  overflow:hidden;
  height:calc(100vh - 8rem);
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
/*
  chat-unread-badge 的脈動效果：這裡改用純 CSS 的 @keyframes，不是 anime.js。
  這個角標會隨著左側清單重新整理（每次收發訊息都會重打一次 fetchConversations）
  不斷被 Vue 重新渲染／可能被整批換掉，如果用 anime.js 的 loop:true 持續動畫，
  要另外處理「元素換掉了、動畫實例要不要重建」這種生命週期管理，反而變複雜；
  純 CSS 的無限循環動畫，瀏覽器原生處理好這一切，不用寫任何 JS 去維護，
  也更省效能——這種「持續存在、不需要精準控制播放時機」的效果，CSS 天生就是更適合的工具。
*/
@keyframes chat-badge-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(122,75,84,.45); }
  50% { transform: scale(1.14); box-shadow: 0 0 0 4px rgba(122,75,84,0); }
}
.chat-unread-badge{
  background:var(--plum); color:#fff; font-size:.68rem; font-weight:700;
  min-width:18px; height:18px; border-radius:9px; padding:0 .4rem;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  animation: chat-badge-pulse 1.6s ease-in-out infinite;
}

/* ---------- 右側訊息串 ---------- */
.chat-main{ display:flex; flex-direction:column; min-width:0; min-height:0; }
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

/*
  min-height:0：flex 子元素預設的 min-height 是 auto，不是 0，意思是「flex:1 最多只會
  縮到剛好裝得下裡面所有內容為止」，不會真的縮小到比內容還小——這樣一來，訊息一多，
  .chat-messages 就會直接把自己撐高去塞下所有訊息，而不是維持固定高度、內部出現捲軸。
  整個 .chat-main 也跟著被撐高，把下面的輸入框推到看不見的地方（就是這次回報的問題：
  訊息一多，輸入框「消失」了，其實不是不見，是被推到很下面，要一直往下捲頁面才找得到）。
  加上 min-height:0，才會照 flex:1 原本該有的行為：固定在容器剩下的空間裡，
  超出的內容用內部捲軸（overflow-y:auto）處理，輸入框永遠固定在底部。
*/
.chat-messages{
  flex:1; min-height:0; overflow-y:auto; padding:1.2rem 1.4rem;
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
/* 圖片訊息：圖片本身要有自己的圓角、限制最大寬度，避免一張超大照片把整個聊天室撐爆版 */
.chat-bubble-image{
  display:block; width:100%; height:100%;
  border-radius:10px; object-fit:cover; cursor:zoom-in;
}
/*
  chat-bubble-image-grid：一則訊息可能附好幾張圖片，用 CSS Grid 排成小格狀，
  跟 CreatePostView.vue 選圖片的縮圖列是同樣的排版邏輯——只有 1 張時 grid 只有一格，
  視覺上就等於單張大圖，不用另外寫一套「只有 1 張時特別處理」的邏輯。
  count-2／count-3／count-4：依照這則訊息實際附了幾張圖片，切換 grid 的欄數，
  2 張並排比較好看，3 張以上排成 2 欄多列的九宮格感覺（IG、Messenger 常見的排法）。
*/
.chat-bubble-image-grid{
  display:grid; gap:3px; border-radius:10px; overflow:hidden;
}
/* 只有 1 張圖片時，維持原始比例（不強制裁成正方形），跟原本單張大圖的呈現方式一樣，
   只限制最大寬高，避免超大照片把整個聊天室撐爆版 */
.chat-bubble-image-grid.count-1{ max-width:220px; max-height:220px; }
.chat-bubble-image-grid.count-1 .chat-bubble-image{ width:auto; height:auto; max-width:220px; max-height:220px; }
/* 2 張以上：排成正方形小格的網格，才能對齊整齊（IG、Messenger 常見的多圖排法） */
.chat-bubble-image-grid.count-2{ grid-template-columns:1fr 1fr; width:220px; }
.chat-bubble-image-grid.count-2 .chat-bubble-image{ aspect-ratio:1; }
.chat-bubble-image-grid.count-3{ grid-template-columns:1fr 1fr; width:220px; }
.chat-bubble-image-grid.count-3 a:first-child{ grid-column:span 2; }
.chat-bubble-image-grid.count-3 .chat-bubble-image{ aspect-ratio:1; }
.chat-bubble-image-grid.count-4{ grid-template-columns:1fr 1fr; width:220px; }
.chat-bubble-image-grid.count-4 .chat-bubble-image{ aspect-ratio:1; }
/* image-only：這則訊息只有圖片、沒有文字時，氣泡本身不要留白底色跟內距，
   讓圖片本身的圓角直接就是氣泡的邊界，貼合一般聊天軟體「純圖片訊息」的呈現方式 */
.chat-bubble.image-only{ background:none; padding:0; }
/*
  這裡要多寫一條 .chat-bubble-row.mine .chat-bubble.image-only，是因為
  .chat-bubble-row.mine .chat-bubble{ background:var(--plum); } 那條規則選擇器
  疊了 3 層 class（chat-bubble-row + mine + chat-bubble），比上面 .chat-bubble.image-only
  （只疊 2 層）更「精確」，CSS 選中規則是「越精確的規則優先」，不是「寫在後面的優先」，
  所以自己傳的純圖片訊息，底色沒有真的被蓋掉、還是看得到梅紫色的方框——這裡把兩個 class
  疊在同一條規則上（4 層），確保精確度贏過那條，背景才真的會被拿掉。
*/
.chat-bubble-row.mine .chat-bubble.image-only{ background:none; }
.chat-bubble.image-only .chat-bubble-time{
  margin-top:.3rem; padding:0 .2rem; color:var(--ink-soft); opacity:1;
}
.chat-bubble-row.mine .chat-bubble.image-only .chat-bubble-time{ text-align:right; }

/* 選好但還沒送出的圖片預覽（可以一次選好幾張，橫向排一排） */
.chat-pending-row{
  display:flex; gap:.5rem; flex-wrap:wrap;
  padding:.8rem 1.4rem 0;
}
.chat-pending-image{
  position:relative; width:64px; height:64px;
  border-radius:8px; overflow:hidden;
  border:1px solid var(--hairline); flex-shrink:0;
}
.chat-pending-image img{ width:100%; height:100%; object-fit:cover; display:block; }
.chat-pending-remove{
  position:absolute; top:2px; right:2px;
  width:18px; height:18px; border-radius:50%;
  background:rgba(42,36,32,.75); color:#fff; border:none;
  font-size:.62rem; line-height:1; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background .18s ease;
}
.chat-pending-remove:hover{ background:var(--plum); }

.chat-input-row{
  display:flex; align-items:center; gap:.6rem;
  padding:1rem 1.4rem; border-top:1px solid var(--hairline); flex-shrink:0;
}
/* 圖片按鈕：一個包住隱藏 file input 的圓形按鈕，跟 UserProfileView.vue 編輯表單的
   縮圖上傳是同一套「label 包住看不見的 input[type=file]」寫法 */
.chat-image-btn{
  position:relative;
  width:38px; height:38px; border-radius:50%;
  background:var(--cream); flex-shrink:0; color:var(--plum);
  display:flex; align-items:center; justify-content:center;
  cursor:pointer;
  transition:background .18s ease;
}
.chat-image-btn:hover{ background:var(--hairline); }
.file-input-hidden{
  position:absolute; opacity:0; width:100%; height:100%;
  top:0; left:0; cursor:pointer;
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