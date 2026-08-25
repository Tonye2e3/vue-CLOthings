<script setup>

import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGroupCartStore } from '@/stores/groupCart'
import { getPendingPayment, confirmPayment } from '@/api/groupShop'

const route = useRoute()
const router = useRouter()
const cartStore = useGroupCartStore()

const paymentId = route.params.paymentId

// 這筆待付款的資訊：金額、品項、選擇的付款方式
const pending = ref(null)
const loading = ref(true)
const processing = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    pending.value = await getPendingPayment(paymentId)
  } catch (err) {
    errorMessage.value = err.response?.data || '找不到這筆付款，可能已經處理過或已過期'
  } finally {
    loading.value = false
  }
})

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW').format(val)

// 按下「模擬付款成功」：後端會真的建立訂單、清空購物車
const handleConfirmSuccess = async () => {
  processing.value = true
  try {
    await confirmPayment(paymentId, true)
    await cartStore.fetchCart() // 後端已經清空購物車了，這裡重新同步一次本地狀態
    alert('付款成功！訂單已成立，即將轉至訂單列表頁面。')
    router.push('/GroupShop/orders')
  } catch (err) {
    alert(err.response?.data || '確認付款時發生錯誤，請稍後再試')
  } finally {
    processing.value = false
  }
}

// 按下「模擬付款失敗」：不會建立訂單，購物車保留，導回購物車頁讓使用者可以重新結帳
const handleConfirmFailure = async () => {
  processing.value = true
  try {
    await confirmPayment(paymentId, false)
    alert('付款失敗，訂單未成立，您的購物車商品仍保留。')
    router.push('/GroupShop/checkout')
  } catch (err) {
    alert(err.response?.data || '確認付款時發生錯誤，請稍後再試')
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="pay-shell">
    <div class="pay-card go-scale-in">
      <div class="pay-badge">模擬付款頁（僅供測試展示，非真實金流）</div>

      <div v-if="loading" class="text-center py-5 text-muted">
        <span class="go-spinner go-spinner-dark"></span> 載入中...
      </div>

      <div v-else-if="errorMessage" class="text-center py-5 go-fade-in">
        <p class="text-danger mb-3">{{ errorMessage }}</p>
        <button class="btn btn-outline-secondary go-btn-tap" @click="router.push('/GroupShop/checkout')">返回購物車</button>
      </div>

      <div v-else class="go-fade-in">
        <h4 class="fw-bold mb-3">確認訂單</h4>

        <div class="pay-items mb-3">
          <div v-for="item in pending.items" :key="item.groupProductId" class="d-flex justify-content-between small mb-2">
            <span>{{ item.productName }} x {{ item.quantity }}</span>
            <span>${{ formatCurrency(item.unitPrice * item.quantity) }}</span>
          </div>
        </div>

        <hr />

        <div class="d-flex justify-content-between align-items-center mb-1">
          <span>付款方式</span>
          <span class="fw-bold">{{ pending.paymentMethod }}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-4">
          <span class="fw-bold fs-6">應付金額</span>
          <span class="fw-bold fs-4 text-accent">${{ formatCurrency(pending.amount) }}</span>
        </div>

        <button
          class="btn btn-success w-100 mb-2 go-btn-tap"
          :disabled="processing"
          @click="handleConfirmSuccess"
        >
          <span v-if="processing" class="go-spinner me-2"></span>
          確認訂單成立
        </button>
        <button
          class="btn btn-outline-danger w-100 go-btn-tap"
          :disabled="processing"
          @click="handleConfirmFailure"
        >
          取消，返回購物車
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pay-shell {
  min-height: 100vh;
  background-color: #f8f5f0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.pay-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 2px 10px rgba(74, 62, 61, 0.12);
}

.pay-badge {
  display: inline-block;
  background-color: #f1e7de;
  color: #6e5f5c;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 16px;
}

.text-accent {
  color: #b87352;
}

.pay-items {
  max-height: 200px;
  overflow-y: auto;
}

/* ============ 本頁用到的特效樣式（進場動畫／懸停／按鈕微動效／載入動畫），class 一律以 go- 開頭 ============ */
@keyframes goFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.go-fade-in { animation: goFadeIn 0.4s ease both; }

@keyframes goScaleIn {
  from { opacity: 0; transform: scale(0.94); }
  to   { opacity: 1; transform: scale(1); }
}

.go-scale-in { animation: goScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

.go-btn-tap { transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease; }
.go-btn-tap:hover:not(:disabled) {
  filter: brightness(1.06);
  box-shadow: 0 6px 14px rgba(74, 62, 61, 0.18);
}
.go-btn-tap:active:not(:disabled) {
  transform: scale(0.94);
  filter: brightness(0.97);
}

@keyframes goSpin {
  to { transform: rotate(360deg); }
}

.go-spinner {
  display: inline-block;
  width: 15px;
  height: 15px;
  vertical-align: -2px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: goSpin 0.7s linear infinite;
}

/* 淺底色（白底卡片）用的深色 spinner */
.go-spinner-dark {
  border: 2px solid rgba(74, 62, 61, 0.25);
  border-top-color: var(--color-text, #4a3e3d);
}

@media (prefers-reduced-motion: reduce) {
  .go-fade-in,
  .go-scale-in,
  .go-btn-tap,
  .go-spinner {
    animation-duration: 0.001s !important;
    transition-duration: 0.001s !important;
  }
}
</style>
