<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { verifyEmail } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const status = ref('loading')
const message = ref('正在驗證您的 Email...')

onMounted(async () => {
  // 1. 從網址取得 Email 驗證 Token
  const token = route.query.token

  // 2. 沒有 Token
  if (!token) {
    status.value = 'error'
    message.value = '驗證連結無效'
    return
  }

  try {
    // 3. 呼叫後端 Email 驗證 API
    const response = await verifyEmail(token)

    // 4. 驗證成功
    status.value = 'success'
    message.value = response.data.message || 'Email 驗證成功'
  } catch (error) {
    // 5. 驗證失敗
    status.value = 'error'

    if (typeof error.response?.data === 'string') {
      message.value = error.response.data
    } else {
      message.value = error.response?.data?.message || 'Email 驗證失敗，請重新取得驗證信'
    }
  }
})

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <main class="verify-email">
    <div class="verify-card">
      <h1>Email 驗證</h1>

      <p>{{ message }}</p>

      <button v-if="status === 'success'" type="button" @click="goToLogin">前往登入</button>
    </div>
  </main>
</template>
