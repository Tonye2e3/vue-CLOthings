<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import api from '@/api/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const message = ref('Google 登入處理中...')

onMounted(async () => {
  // ① 從網址取得 ticket
  const ticket = route.query.ticket

  // ② 沒有 ticket
  if (!ticket) {
    message.value = 'Google 登入失敗：缺少登入 Ticket'
    return
  }

  try {
    // ③ 用 ticket 向後端交換真正的登入資料
    const response = await api.post('/User/google/exchange', {
      ticket,
    })

    // ④ 寫入 Pinia
    authStore.setAuth(response.data)

    // ⑤ 登入成功，回首頁
    router.replace('/user')
  } catch (error) {
    console.error('Google 登入失敗：', error)

    message.value = 'Google 登入失敗，登入資訊可能已過期，請重新登入'
  }
})
</script>

<template>
  <div class="container py-5 text-center">
    <h4>{{ message }}</h4>
  </div>
</template>
