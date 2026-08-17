<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const order = ref(null)   // 訂單詳情，先空的

// 日期格式化（跟訂單清單頁一樣）
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

onMounted(async () => {
  try {
    const id = route.params.id   // 從網址拿訂單 id
    const response = await api.get(`/order/${id}`)   // GET /api/order/{id}（帶 token）
    order.value = response.data
  } catch (error) {
    console.error('載入訂單詳情失敗：', error)
  }
})
</script>

<template>
  <!-- 資料還沒來 → 載入中 -->
  <div v-if="!order" class="order-detail-view">載入中...</div>

  <!-- 資料來了 → 顯示 -->
  <div v-else class="order-detail-view">
    <h1 class="page-title">訂單 #{{ order.orderId }}</h1>

    <!-- 訂單基本資訊 -->
    <section class="info-block">
      <h2 class="section-title">訂單資訊</h2>
      <div class="info-row"><span>狀態</span><span class="status">{{ order.status }}</span></div>
      <div class="info-row"><span>下單日期</span><span>{{ formatDate(order.orderDate) }}</span></div>
      <div class="info-row"><span>收件人</span><span>{{ order.shipName }}</span></div>
      <div class="info-row"><span>收件地址</span><span>{{ order.shipAddress }}</span></div>
      <div class="info-row"><span>聯絡電話</span><span>{{ order.shipPhone }}</span></div>
    </section>

    <!-- 商品明細 -->
    <section class="info-block">
      <h2 class="section-title">商品明細</h2>
      <div v-for="(item, index) in order.items" :key="index" class="item-row">
        <div class="item-name">
          {{ item.productName }}
          <span class="item-spec">{{ item.color }} / {{ item.size }}</span>
        </div>
        <div class="item-qty">× {{ item.quantity }}</div>
        <div class="item-price">NT$ {{ (item.price * item.quantity).toLocaleString() }}</div>
      </div>
    </section>

    <!-- 總計 -->
    <section class="total-block">
      <span>總計</span>
      <span class="total-amount">NT$ {{ order.total.toLocaleString() }}</span>
    </section>

    <button class="btn-back" @click="$router.push({ name: 'orders' })">← 回訂單列表</button>
  </div>
</template>

<style scoped>
.order-detail-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}
.page-title {
  font-size: 1.75rem;
  margin-bottom: 24px;
}
.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #111;
}
.info-block {
  margin-bottom: 32px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #444;
}
.status {
  color: #e60012;
  font-weight: 600;
}
.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.item-name {
  flex: 1;
  font-weight: 600;
}
.item-spec {
  color: #888;
  font-size: 0.85rem;
  font-weight: 400;
  margin-left: 8px;
}
.item-qty {
  color: #666;
  margin: 0 24px;
}
.item-price {
  font-weight: 700;
}
.total-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  font-size: 1.2rem;
  font-weight: 700;
}
.total-amount {
  color: #e60012;
}
.btn-back {
  margin-top: 24px;
  padding: 10px 20px;
  border: 1px solid #111;
  background: #fff;
  cursor: pointer;
  border-radius: 6px;
}
</style>