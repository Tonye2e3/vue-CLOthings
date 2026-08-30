<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const orderId = route.query.orderId
const success = computed(() => route.query.success === '1')
</script>

<template>
  <div class="result-view container">
    <div v-if="success" class="result success">
      <div class="icon">✅</div>
      <h1>付款成功！</h1>
      <p>訂單編號 #{{ orderId }}</p>
      <p class="hint">我們已收到您的付款，將盡快為您出貨。</p>
    </div>

    <div v-else class="result fail">
      <div class="icon">❌</div>
      <h1>付款未完成</h1>
      <p>訂單編號 #{{ orderId }}</p>
      <p class="hint">您的付款未成功，可至訂單頁重新付款。</p>
    </div>

    <div class="actions">
      <button @click="router.push({ name: 'orderDetail', params: { id: orderId } })">
        查看訂單
      </button>
      <button @click="router.push({ name: 'orders' })">回訂單列表</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.result-view {
  max-width: 500px;
  margin: 60px auto;
  text-align: center;
  padding: 40px 24px;
}
.icon {
  font-size: 4rem;
  margin-bottom: 16px;
}
.result h1 {
  font-size: 1.5rem;
  margin-bottom: 12px;
}
.hint {
  color: #888;
  margin-top: 12px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
}
.actions button {
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #111;
  background: #fff;
}
.actions button:first-child {
  background: #111;
  color: #fff;
}
</style>
