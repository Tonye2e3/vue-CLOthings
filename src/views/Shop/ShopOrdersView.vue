<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/api' // 組員的 api（自動帶 token）

const router = useRouter()
const orders = ref([]) // 存訂單清單

// 頁面載入 → 打 API 拿我的訂單
onMounted(async () => {
  try {
    const response = await api.get('/order') // GET /api/order（帶 token）
    orders.value = response.data
  } catch (error) {
    console.error('載入訂單失敗：', error)
  }
})

// 日期格式化：把長長的日期變好讀
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW') // 變成 2026/8/17
}

// 點訂單 → 進詳情頁
function goDetail(orderId) {
  router.push({ name: 'orderDetail', params: { id: orderId } })
}
</script>

<template>
  <div class="orders-view container">
    <h1 class="page-title">我的訂單</h1>

    <!-- 沒有訂單 -->
    <div v-if="orders.length === 0" class="text-muted py-5 text-center">
      還沒有訂單，快去逛逛吧！
    </div>

    <!-- 訂單清單 -->
    <div v-else>
      <div
        v-for="order in orders"
        :key="order.orderId"
        class="order-card"
        @click="goDetail(order.orderId)"
      >
        <div class="order-header">
          <span class="order-id">訂單 #{{ order.orderId }}</span>
          <span class="order-status">{{ order.status }}</span>
        </div>
        <div class="order-body">
          <span class="order-date">{{ formatDate(order.orderDate) }}</span>
          <span class="order-total">NT$ {{ order.total.toLocaleString() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.orders-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 24px;
}

.placeholder-block {
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
.order-card {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
  background-color: #fff;
}
.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.order-id {
  font-weight: 700;
}
.order-status {
  color: #e60012;
  font-size: 0.9rem;
}
.order-body {
  display: flex;
  justify-content: space-between;
  color: #666;
}
.order-total {
  font-weight: 700;
  color: #111;
}
</style>
