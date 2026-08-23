<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({
  icon: Object,
  name: String,

  // 可以當畫面第一次 render 的預設值
  initialBound: {
    type: Boolean,
    default: false,
  },
})

const isBound = ref(props.initialBound)

// 綁定的第三方 Email
const boundEmail = ref('')

// 按鈕處理中狀態
const isLoading = ref(false)

// 取得第三方帳號綁定狀態
async function loadBindStatus() {
  // 目前先只串 Google
  if (props.name !== 'Google') {
    return
  }

  try {
    const response = await api.get('/User/google/status')

    console.log('Google 綁定狀態：', response.data) // 🟢【測試用】

    isBound.value = response.data.isBound
    boundEmail.value = response.data.email ?? ''
  } catch (error) {
    console.error('取得 Google 綁定狀態失敗：', error)
  }
}

// 綁定
async function bindAccount() {
  if (props.name !== 'Google') {
    return
  }

  try {
    isLoading.value = true

    // ① Axios 呼叫
    // Axios interceptor 會自動帶 JWT
    const response = await api.post('/User/google/bind/start')

    // ② 後端回傳真正的 OAuth 啟動網址
    const bindUrl = response.data.url

    console.log('Google Bind URL：', bindUrl)

    // ③ 現在才離開 Vue
    window.location.href = bindUrl
  } catch (error) {
    console.error('啟動 Google 綁定失敗：', error)

    alert(error.response?.data ?? '啟動 Google 綁定失敗')

    isLoading.value = false
  }
}

// 解除綁定
async function unbindAccount() {
  if (props.name !== 'Google') {
    return
  }

  if (!confirm('確定要解除 Google 帳號綁定嗎？')) {
    return
  }

  try {
    isLoading.value = true

    // 🟡【下一步後端要新增】
    await api.delete('/User/google/unbind')

    await loadBindStatus()

    alert('Google 帳號已解除綁定')
  } catch (error) {
    console.error('解除 Google 綁定失敗：', error)

    alert(error.response?.data || '解除 Google 綁定失敗')
  } finally {
    isLoading.value = false
  }
}

// 🟢按鈕統一入口
async function handleClick() {
  if (isBound.value) {
    await unbindAccount()
  } else {
    await bindAccount()
  }
}

// 🟢【新增】元件載入時取得真正綁定狀態
onMounted(() => {
  loadBindStatus()
})
</script>

<template>
  <div class="oauth-provider">
    <!-- 左側：Logo + 平台資訊 -->
    <div class="provider-info">
      <div class="provider-icon">
        <component :is="props.icon" />
      </div>

      <div>
        <div class="provider-name">
          {{ props.name }}
        </div>

        <div class="provider-status" :class="{ bound: isBound }">
          <span class="status-dot"></span>

          {{ isBound ? '已綁定' : '尚未綁定' }}

          <!-- 🟢【新增】已綁定時顯示 Email -->
          <small v-if="isBound && boundEmail" class="provider-email">
            {{ boundEmail }}
          </small>
        </div>
      </div>
    </div>

    <!-- 右側操作 -->
    <button
      type="button"
      class="user-btn"
      :class="isBound ? 'user-btn-secondary' : 'user-btn-primary'"
      @click="handleClick"
      :disabled="isLoading"
    >
      <!-- 🟡【修改】 -->
      {{ isLoading ? '處理中...' : isBound ? '解除綁定' : '立即綁定' }}
    </button>
  </div>
</template>

<style scoped>
.oauth-provider {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding: 18px 20px;

  background: #ffffff;

  border: 1px solid #e8e8e8;
  border-radius: 12px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.oauth-provider:hover {
  border-color: #cfcfcf;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
}

/* Provider */

.provider-info {
  display: flex;
  align-items: center;

  gap: 14px;
}

.provider-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 46px;
  height: 46px;

  flex-shrink: 0;

  background: #f8f8f8;

  border: 1px solid #eeeeee;
  border-radius: 10px;
}

/*
  避免 Google / LINE SVG 太大
*/
.provider-icon :deep(svg) {
  width: 25px;
  height: 25px;
}

.provider-name {
  margin-bottom: 4px;

  color: #222222;

  font-size: 15px;
  font-weight: 700;
}

/* Status */

.provider-status {
  display: flex;
  align-items: center;

  gap: 6px;

  color: #999999;

  font-size: 12px;
}

.status-dot {
  width: 7px;
  height: 7px;

  background: #bbbbbb;

  border-radius: 50%;
}

.provider-status.bound {
  color: #198754;
}

.provider-status.bound .status-dot {
  background: #198754;
}

/* RWD */

@media (max-width: 576px) {
  .oauth-provider {
    align-items: stretch;
    flex-direction: column;
  }

  .oauth-provider .user-btn {
    width: 100%;
  }
}

/* 🟢【新增】已綁定帳號 Email */
.provider-email {
  display: block;
  margin-top: 4px;

  color: #777777;

  font-size: 11px;
}
</style>
