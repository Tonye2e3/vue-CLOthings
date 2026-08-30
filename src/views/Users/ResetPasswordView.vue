<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/api'

const route = useRoute()
const router = useRouter()

// 從網址 ?token=xxx 取得 Token
const token = route.query.token?.toString() || ''

const newPassword = ref('')
const confirmPassword = ref('')

const isSubmitting = ref(false)
const message = ref('')
const errorMessage = ref('')

const passwordMismatch = computed(() => {
  if (!confirmPassword.value) {
    return false
  }

  return newPassword.value !== confirmPassword.value
})

async function resetPassword() {
  errorMessage.value = ''
  message.value = ''

  // 沒有 Token
  if (!token) {
    errorMessage.value = '密碼重設連結無效'
    return
  }

  // 沒輸入密碼
  if (!newPassword.value) {
    errorMessage.value = '請輸入新密碼'
    return
  }

  // 兩次密碼不同
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的密碼不一致'
    return
  }

  try {
    isSubmitting.value = true

    await api.post('/User/reset-password', {
      token: token,
      newPassword: newPassword.value,
    })

    message.value = '密碼重設成功，即將返回登入頁'

    // 1.5 秒後回登入頁
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    console.error('重設密碼失敗：', error)

    if (error.response?.data) {
      errorMessage.value =
        typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data.message || '密碼重設失敗'
    } else {
      errorMessage.value = '伺服器錯誤，請稍後再試'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="reset-page">
    <div class="reset-card">
      <p class="section-label">PASSWORD RESET</p>

      <h1>設定新密碼</h1>

      <p class="description">請輸入你的新密碼，完成後即可使用新密碼登入。</p>

      <!-- Token 不存在 -->
      <div v-if="!token" class="alert error">密碼重設連結無效，請重新申請。</div>

      <template v-else>
        <div class="form-group">
          <label>新密碼</label>

          <input
            v-model="newPassword"
            type="password"
            placeholder="請輸入新密碼"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label>確認新密碼</label>

          <input
            v-model="confirmPassword"
            type="password"
            placeholder="請再次輸入新密碼"
            autocomplete="new-password"
          />

          <small v-if="passwordMismatch" class="field-error"> 兩次輸入的密碼不一致 </small>
        </div>

        <div v-if="errorMessage" class="alert error">
          {{ errorMessage }}
        </div>

        <div v-if="message" class="alert success">
          {{ message }}
        </div>

        <button
          type="button"
          class="submit-btn"
          :disabled="isSubmitting || passwordMismatch"
          @click="resetPassword"
        >
          {{ isSubmitting ? '處理中...' : '重設密碼' }}
        </button>
      </template>

      <button type="button" class="back-btn" @click="router.push('/login')">返回登入</button>
    </div>
  </div>
</template>

<style scoped>
.reset-page {
  min-height: calc(100vh - 80px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background: #f7f7f7;
}

.reset-card {
  width: 100%;
  max-width: 520px;
  padding: 42px;
  background: #ffffff;
  border-radius: 18px;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.08);
}

.section-label {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #999999;
}

h1 {
  margin-bottom: 12px;
  font-size: 30px;
  font-weight: 700;
}

.description {
  margin-bottom: 30px;
  color: #777777;
  line-height: 1.7;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #dddddd;
  border-radius: 9px;
  outline: none;
  transition: 0.2s;
}

.form-group input:focus {
  border-color: #333333;
}

.field-error {
  display: block;
  margin-top: 7px;
  color: #dc3545;
}

.alert {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 14px;
}

.alert.error {
  background: #fff1f1;
  color: #b42318;
}

.alert.success {
  background: #ecfdf3;
  color: #067647;
}

.submit-btn {
  width: 100%;
  padding: 13px;
  border: 0;
  border-radius: 9px;
  background: #111111;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-btn {
  width: 100%;
  margin-top: 12px;
  padding: 11px;
  border: 0;
  background: transparent;
  color: #777777;
  cursor: pointer;
}
</style>
