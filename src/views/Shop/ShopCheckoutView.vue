<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/ShopCart'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useBuyNowStore } from '@/stores/ShopBuyNow'
import api from '@/api/api'
const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()
const buyNowStore = useBuyNowStore()

// 收件資訊表單資料
const form = ref({
  name: '', // 收件人姓名
  phone: '', // 電話
  address: '', // 地址
  payment: '貨到付款', // 付款方式，預設貨到付款
})
// 檢查必填欄位是否都填了
function validateForm() {
  if (!form.value.name) {
    alert('請填寫收件人姓名')
    return false // 沒填 → 回傳 false，擋下送出
  }
  if (!form.value.phone) {
    alert('請填寫聯絡電話')
    return false
  }
  if (!form.value.address) {
    alert('請填寫收件地址')
    return false
  }
  return true // 全部填了 → 回傳 true，可以送出
}

const API_BASE = import.meta.env.VITE_API_URL
function getImageUrl(image) {
  if (!image) return 'https://placehold.co/80x80?text=No+Image'
  // 已經是完整網址（立即購買）→ 直接用
  if (image.startsWith('http')) return image
  // 只是檔名（購物車）→ 組網址
  return `${API_BASE}/images/product/${image}`
}

// 送出訂單
async function submitOrder() {
  // ① 先驗證表單
  if (!validateForm()) {
    return
  }

  // ② 組合「後端需要的」資料格式
  const orderData = {
    shipName: form.value.name,
    shipAddress: form.value.address,
    shipPhone: form.value.phone,
    // 把購物車勾選的商品，轉成後端要的格式（只要規格 id + 數量）
    items: checkoutItems.value.map((item) => ({
      productSpecificationId: item.productSpecificationId,
      quantity: item.quantity,
    })),
  }

  // ③ 打 API 建立訂單
  try {
    const response = await api.post('/order', orderData)
    if (isBuyNow.value) {
      buyNowStore.clear() // 清立即購買暫存
      buyNowStore.clear() // 清立即購買暫存
    } else {
      await cartStore.loadCart() // 重新載入購物車（後端已清，前端同步）
      await cartStore.loadCart() // 重新載入購物車（後端已清，前端同步）
    }
    alert('訂單建立成功！訂單編號：' + response.data.orderId)
    // ④ 成功後：跳到訂單頁（或首頁）
    router.push({ name: 'orders' })
  } catch (error) {
    console.error('建立訂單失敗：', error)
    alert('建立訂單失敗，請稍後再試')
  }
}
// 是不是立即購買？
const isBuyNow = computed(() => route.query.buyNow === '1')

// 要結帳的商品（依來源）
const checkoutItems = computed(() => {
  if (isBuyNow.value) {
    return buyNowStore.item ? [buyNowStore.item] : []
  }
  return cartStore.selectedItems
})

// 總金額
const checkoutTotal = computed(() => {
  return checkoutItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})
// 運費（依商品小計判斷免運，門檻自己定，這裡用 1000）
const shippingFee = computed(() => {
  return checkoutTotal.value >= 1000 ? 0 : 60
})

// 最終總計 = 商品小計 + 運費
const finalTotal = computed(() => {
  return checkoutTotal.value + shippingFee.value
})
</script>

<template>
  <div class="container">
    <div class="checkout-view">
      <h1 class="page-title">結帳</h1>

      <!-- 訂單明細：之後串 GET /api/cart -->
      <section class="mb-4">
        <h2 class="h5 fw-bold mb-3">訂單明細</h2>

        <!-- 空狀態：沒有勾選任何商品 -->
        <div v-if="checkoutItems.length == 0" class="text-muted py-3">
          沒有要結帳的商品，請回購物車勾選商品。
        </div>

        <!-- 有商品：列出勾選的商品 -->
        <div v-else>
          <div
            v-for="product in checkoutItems"
            :key="product.productSpecificationId"
            class="d-flex align-items-center gap-3 border-bottom py-3"
          >
            <!-- 商品圖片 -->
            <img
              :src="getImageUrl(product.image)"
              :alt="product.productName"
              style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px"
            />
            <!-- 名稱 + 規格 -->
            <div class="flex-fill">
              <div class="fw-semibold">{{ product.productName }}</div>
              <div class="text-muted" style="font-size: 0.85rem">
                顏色：{{ product.color }}　尺寸：{{ product.size }}　× {{ product.quantity }}
              </div>
            </div>
            <!-- 小計 -->
            <div class="fw-semibold">NT$ {{ product.price * product.quantity }}</div>
          </div>
        </div>
      </section>

      <!-- 收件資訊：之後做成收件人 / 地址 / 付款方式表單 -->
      <section class="mb-4">
        <h2 class="h5 fw-bold mb-3">收件資訊</h2>

        <div class="mb-3">
          <label class="form-label">收件人姓名</label>
          <input v-model="form.name" type="text" class="form-control" placeholder="請輸入姓名" />
        </div>

        <div class="mb-3">
          <label class="form-label">聯絡電話</label>
          <input v-model="form.phone" type="tel" class="form-control" placeholder="請輸入電話" />
        </div>

        <div class="mb-3">
          <label class="form-label">收件地址</label>
          <input v-model="form.address" type="text" class="form-control" placeholder="請輸入地址" />
        </div>

        <div class="mb-3">
          <label class="form-label">付款方式</label>
          <select v-model="form.payment" class="form-select">
            <option>貨到付款</option>
            <option>信用卡</option>
            <option>ATM 轉帳</option>
          </select>
        </div>
      </section>

      <!-- 送出：之後串 POST /api/orders -->
      <section class="mb-4">
        <h2 class="h5 fw-bold mb-3">金額摘要</h2>
        <div class="d-flex justify-content-between mb-2">
          <span>商品小計</span>
          <span>NT$ {{ checkoutTotal }}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>運費</span>
          <span v-if="shippingFee == 0" class="text-success">免運費</span>
          <span v-else>NT$ {{ shippingFee }}</span>
        </div>
        <hr />
        <div class="d-flex justify-content-between fw-bold fs-5">
          <span>總計</span>
          <span class="text-primary">NT$ {{ finalTotal }}</span>
        </div>
      </section>
      <section class="mt-4">
        <button type="button" class="btn btn-primary btn-lg w-100" @click="submitOrder">
          送出訂單
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.checkout-view {
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
</style>
