<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/api'

const route = useRoute()

const status = ref('loading')
const message = ref('正在驗證您的 Email...')

onMounted(async () => {
  // 從網址取得 ?token=xxxxx
  const token = route.query.token

  // 網址沒有 Token
  if (!token) {
    status.value = 'error'
    message.value = '驗證連結無效，缺少驗證 Token'
    return
  }

  try {
    // 傳給後端驗證
    const response = await api.post('/User/verify-email', {
      token,
    })

    status.value = 'success'
    message.value = response.data.message || 'Email 驗證成功'
  } catch (error) {
    status.value = 'error'

    message.value = error.response?.data || 'Email 驗證失敗，請稍後再試'
  }
})
</script>

<template>
  <main>
    <h1>Email 驗證</h1>

    <p>{{ message }}</p>
  </main>
</template>
