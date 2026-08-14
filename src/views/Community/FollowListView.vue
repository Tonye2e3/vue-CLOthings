<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

// mode：'followers'（粉絲名單）或 'following'（追蹤中名單），
// 從 router-index.js 裡路由的 props 直接傳進來（不是網址參數，是路由設定裡寫死的）。
const props = defineProps({ mode: String })

// IMAGE_BASE：圖片是靜態檔案，走的不是 /api 這條路徑，不能直接用 api 服務的
// baseURL（那個含 /api）。這裡把 VITE_API_URL 尾巴的 /api 拿掉，變成純網域。
const IMAGE_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

const route = useRoute()
const users = ref([])
const loading = ref(true)

// onAvatarError：大頭貼圖片載入失敗時執行（例如資料庫存的路徑指到 wwwroot 裡
// 實際上還沒有的檔案），失敗時把圖片來源換成 dicebear 產生的預設頭像，
// 跟 CommunityView.vue 的 onAvatarError 是同一套邏輯。
const onAvatarError = (event, name) => {
  // 加個保護：如果換成 dicebear 網址後還是失敗（例如完全沒有網路），
  // 就不要再觸發一次 @error，避免無限迴圈一直重新請求。
  if (event.target.dataset.fallback) return
  event.target.dataset.fallback = '1'
  event.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'guest'}`
}

// pageTitle：頁面標題文字，依 mode 決定顯示「粉絲」還是「追蹤中」。
const pageTitle = () => (props.mode === 'followers' ? '粉絲' : '追蹤中')

// fetchList：跟後端要名單，打的是 UserFollowController.cs 裡的
// GET api/UserFollow/followers/{userid} 或 GET api/UserFollow/following/{userid}，
// 用哪一支由 mode 決定。
const fetchList = async () => {
  loading.value = true
  try {
    const res = await api.get(`/UserFollow/${props.mode}/${route.params.userId}`)
    users.value = res.data
  } catch (err) {
    console.error('讀取名單失敗：', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)

// watch：網址上的 :userId 換人（例如從這篇個人頁的粉絲名單，點某個粉絲又跳去看他的粉絲名單）
// 時，重新打一次 API。
watch(() => route.params.userId, fetchList)
</script>

<template>
  <div class="follow-page">
    <div class="follow-container">

      <!-- 返回：回上一頁（通常就是回到剛剛那個人的個人頁），比寫死網址更符合使用者的操作直覺 -->
      <button class="back-pill" @click="$router.back()">← 返回</button>

      <h1 class="follow-page-title">{{ pageTitle() }}</h1>

      <div v-if="loading" class="follow-page-loading">載入中...</div>
      <div v-else-if="users.length === 0" class="follow-page-empty">
        {{ mode === 'followers' ? '目前還沒有粉絲。' : '目前還沒有追蹤任何人。' }}
      </div>
      <div v-else class="follow-list">
        <router-link
          v-for="u in users"
          :key="u.userId"
          :to="`/community/profile/${u.userId}`"
          class="follow-user-row"
        >
          <img
            :src="u.avatar ? `${IMAGE_BASE}${u.avatar}` : 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.username"
            class="follow-user-avatar"
            alt="avatar"
            @error="onAvatarError($event, u.username)"
          />
          <span class="follow-user-name">{{ u.username }}</span>
        </router-link>
      </div>

    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@700;900&family=Noto+Sans+TC:wght@400;500;600;700&display=swap');
.follow-page{
  width:100%; min-height:100vh;
  background-color:#F9F4F0 !important;
  padding:2rem 0;
  --cream:#F9F4F0; --paper:#FFFDFB; --ink:#2A2420; --ink-soft:#7A6E63;
  --plum:#7A4B54; --plum-deep:#5E3941; --hairline:#E4D8CC;
  font-family:'Noto Sans TC', sans-serif;
  color:var(--ink);
}
.follow-container{ max-width:480px; margin:0 auto; padding:0 1.5rem; }

.back-pill{
  display:inline-flex; align-items:center; gap:.3rem;
  border:1px solid var(--ink); border-radius:999px;
  padding:.35rem 1rem; font-size:.82rem; color:var(--ink);
  background:none; margin-bottom:1.2rem;
  transition:all .18s ease;
}
.back-pill:hover{ background:var(--ink); color:var(--cream); }

.follow-page-title{
  font-family:'Noto Serif TC', serif; font-weight:900; font-size:1.4rem;
  margin-bottom:1.2rem; color:var(--ink);
}

.follow-page-loading, .follow-page-empty{
  padding:3rem 1rem; text-align:center; color:var(--ink-soft); font-size:.88rem;
}

.follow-list{
  background:var(--paper); border:1px solid var(--hairline); border-radius:16px;
  padding:.5rem;
}
.follow-user-row{
  display:flex; align-items:center; gap:.8rem;
  padding:.7rem .8rem; border-radius:8px;
  text-decoration:none; color:var(--ink);
  transition:background .18s ease;
}
.follow-user-row:hover{ background:var(--cream); }
.follow-user-avatar{ width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.follow-user-name{ font-size:.92rem; font-weight:600; }
</style>