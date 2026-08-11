<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/ShopCart'
const cartStore = useCartStore()
const router = useRouter()

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
// 送出訂單
function submitOrder() {
  // ① 先驗證表單，沒填完整就停在這裡
  if (!validateForm()) {
    return // 驗證沒過，直接結束，不往下送
  }

  // ② 把所有資料組合成一張訂單
  const order = {
    // 收件資訊（來自表單）
    recipient: form.value.name,
    phone: form.value.phone,
    address: form.value.address,
    payment: form.value.payment,
    // 訂購商品（勾選的那些）
    items: cartStore.selectedItems,
    // 金額
    subtotal: cartStore.total,
    shippingFee: cartStore.shippingFee,
    total: cartStore.finalTotal,
  }

  console.log('準備送出的訂單：', order) // 暫時印出來看，之後刪

  // ③ 送到後端建立訂單（之後串 API）
  // 【之後要做】POST /api/orders，把 order 送給後端
  // await axios.post('/api/orders', order)

  // ④ 送出成功後的善後（目前先做前端部分）
  alert('訂單已送出！（測試階段，尚未真正存入後端）')
  // 之後串好 API，這裡會：清空購物車 + 跳轉到訂單頁
  // cartStore.clearCart()
  // router.push({ name: 'orders' })
}
// ═══════════════════════════════════════════════
// 結帳頁 Checkout
// 路由：/shop/checkout   name: 'checkout'
// 用途：顯示待結帳商品明細、填收件/付款資訊、送出訂單
// ═══════════════════════════════════════════════
//
// 【之後要串的 API】
//   GET  /api/cart     取得購物車內容（要結帳的商品）
//   POST /api/orders   建立訂單（送出成功後導向訂單詳情或完成頁）
//
// 目前為骨架階段，尚無邏輯，script 先留空。
</script>

<template>
  <div class="checkout-view">
    <h1 class="page-title">結帳</h1>

    <!-- 訂單明細：之後串 GET /api/cart -->
    <section class="mb-4">
      <h2 class="h5 fw-bold mb-3">訂單明細</h2>

      <!-- 空狀態：沒有勾選任何商品 -->
      <div v-if="cartStore.selectedItems.length == 0" class="text-muted py-3">
        沒有要結帳的商品，請回購物車勾選商品。
      </div>

      <!-- 有商品：列出勾選的商品 -->
      <div v-else>
        <div
          v-for="product in cartStore.selectedItems"
          :key="product.productSpecificationId"
          class="d-flex align-items-center gap-3 border-bottom py-3"
        >
          <!-- 商品圖片 -->
          <img
            :src="product.image"
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
      <!-- ⚠️ 測試用，看 v-model 有沒有生效，測完刪 -->
      <div class="border p-2 mb-3 text-muted" style="font-size: 0.8rem">
        🧪 目前表單資料：{{ form }}
      </div>
    </section>

    <!-- 送出：之後串 POST /api/orders -->
    <section class="mb-4">
      <h2 class="h5 fw-bold mb-3">金額摘要</h2>
      <div class="d-flex justify-content-between mb-2">
        <span>商品小計</span>
        <span>NT$ {{ cartStore.total }}</span>
      </div>
      <div class="d-flex justify-content-between mb-2">
        <span>運費</span>
        <!-- 免運時顯示「免運費」，否則顯示金額 -->
        <span v-if="cartStore.shippingFee == 0" class="text-success">免運費</span>
        <span v-else>NT$ {{ cartStore.shippingFee }}</span>
      </div>
      <hr />
      <div class="d-flex justify-content-between fw-bold fs-5">
        <span>總計</span>
        <span class="text-primary">NT$ {{ cartStore.finalTotal }}</span>
      </div>
    </section>
    <section class="mt-4">
      <button type="button" class="btn btn-primary btn-lg w-100" @click="submitOrder">
        送出訂單
      </button>
    </section>
  </div>
</template>

<style scoped>
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
