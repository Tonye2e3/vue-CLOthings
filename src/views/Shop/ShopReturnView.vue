<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/api'

const route = useRoute()
const router = useRouter()

const order = ref(null) // 訂單資料
const reason = ref('') // 退貨原因
const returnItems = ref([]) // 每筆商品的「勾選 + 退貨數量」狀態
const order = ref(null) // 訂單資料
const reason = ref('') // 退貨原因
const returnItems = ref([]) // 每筆商品的「勾選 + 退貨數量」狀態

const API_BASE = import.meta.env.VITE_API_URL

onMounted(async () => {
  try {
    const id = route.params.id
    const response = await api.get(`/order/${id}`)
    order.value = response.data

    // 為每筆訂單商品，建立「退貨勾選狀態」
    returnItems.value = order.value.items.map((item) => ({
      orderDetailId: item.orderDetailId,
      productName: item.productName,
      color: item.color,
      size: item.size,
      maxQuantity: item.quantity, // 最多能退幾件（買的數量）
      selected: false, // 有沒有勾選要退
      returnQuantity: 1, // 要退幾件（預設 1）
      maxQuantity: item.quantity, // 最多能退幾件（買的數量）
      selected: false, // 有沒有勾選要退
      returnQuantity: 1, // 要退幾件（預設 1）
    }))
  } catch (error) {
    console.error('載入訂單失敗：', error)
  }
})

// 送出退貨
async function submitReturn() {
  // 挑出「有勾選」的商品
  const itemsToReturn = returnItems.value
    .filter((item) => item.selected)
    .map((item) => ({
      orderDetailId: item.orderDetailId,
      quantity: item.returnQuantity,
    }))

  // 驗證：至少要選一個
  if (itemsToReturn.length === 0) {
    alert('請選擇要退貨的商品')
    return
  }
  // 驗證：要填原因
  if (!reason.value.trim()) {
    alert('請填寫退貨原因')
    return
  }

  try {
    const response = await api.post('/productreturn', {
      orderId: order.value.orderId,
      reason: reason.value,
      items: itemsToReturn,
    })
    alert('退貨申請已送出！')
    router.push({ name: 'orders' })
  } catch (error) {
    console.error('退貨申請失敗：', error)
    alert(error.response?.data?.message || '退貨申請失敗')
  }
}
</script>

<template>
  <div class="container">
    <div v-if="!order" class="return-view">載入中...</div>

    <div v-else class="return-view">
      <h1 class="page-title">申請退貨 - 訂單 #{{ order.orderId }}</h1>

      <!-- 選擇要退的商品 -->
      <section class="block">
        <h2 class="block-title">選擇退貨商品</h2>
        <div v-for="item in returnItems" :key="item.orderDetailId" class="return-item">
          <input type="checkbox" v-model="item.selected" class="item-check" />
          <div class="item-info">
            <div class="item-name">{{ item.productName }}</div>
            <div class="item-spec">
              {{ item.color }} / {{ item.size }}（購買 {{ item.maxQuantity }} 件）
            </div>
          </div>
          <div class="item-qty" v-if="item.selected">
            退貨數量：
            <input
              type="number"
              v-model.number="item.returnQuantity"
              :min="1"
              :max="item.maxQuantity"
              class="qty-input"
            />
          </div>
        </div>
      </section>

      <!-- 退貨原因 -->
      <section class="block">
        <h2 class="block-title">退貨原因</h2>
        <textarea
          v-model="reason"
          rows="3"
          placeholder="請說明退貨原因..."
          class="reason-input"
        ></textarea>
      </section>

      <!-- 送出 -->
      <div class="actions">
        <button
          class="btn-cancel"
          @click="router.push({ name: 'orderDetail', params: { id: order.orderId } })"
        >
          取消
        </button>
        <button class="btn-submit" @click="submitReturn">送出退貨申請</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}
.return-view {
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
.block {
  margin-bottom: 32px;
}
.block {
  margin-bottom: 32px;
}
.block-title {
  font-size: 1.1rem;
  font-weight: 700;
  padding-bottom: 8px;
  border-bottom: 2px solid #111;
  margin-bottom: 16px;
}
.return-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}
.item-info {
  flex: 1;
}
.item-name {
  font-weight: 600;
}
.item-spec {
  color: #888;
  font-size: 0.85rem;
}
.item-info {
  flex: 1;
}
.item-name {
  font-weight: 600;
}
.item-spec {
  color: #888;
  font-size: 0.85rem;
}
.qty-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.reason-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.btn-cancel,
.btn-submit {
.btn-cancel,
.btn-submit {
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-cancel {
  border: 1px solid #ccc;
  background: #fff;
}
.btn-submit {
  border: none;
  background: #111;
  color: #fff;
}
.btn-cancel {
  border: 1px solid #ccc;
  background: #fff;
}
.btn-submit {
  border: none;
  background: #111;
  color: #fff;
}
</style>
