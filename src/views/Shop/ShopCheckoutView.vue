<script setup>
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
    <section class="placeholder-block">
      <h2>訂單明細</h2>
      <p>（此區之後顯示購物車商品，串接 GET /api/cart）</p>
    </section>

    <!-- 收件資訊：之後做成收件人 / 地址 / 付款方式表單 -->
    <section class="placeholder-block">
      <h2>收件資訊</h2>
      <p>（此區之後放收件人、地址、付款方式表單）</p>
    </section>

    <!-- 送出：之後串 POST /api/orders -->
    <section class="placeholder-block">
      <button type="button">送出訂單（尚未串接）</button>
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