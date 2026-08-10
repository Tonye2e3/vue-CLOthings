<script setup>
// ═══════════════════════════════════════════════
// 退貨頁 Return
// 路由：/shop/return/:id   name: 'return'
// 用途：針對「某一筆訂單」申請退貨
//   :id 指的是 orderId（要退哪一筆訂單）
// ═══════════════════════════════════════════════
//
// 【之後要串的 API】
//   GET  /api/orders/:id   先讀取這筆訂單，顯示「你要退的是這筆」
//                          （讓使用者確認、勾選要退哪些商品）
//   POST /api/returns      送出退貨申請，建立一筆新的退貨資料
//
// 之後的資料流：
//   從訂單詳情頁帶 orderId 進來 → GET 顯示訂單 → 使用者填原因、選商品
//   → 按送出 → POST /api/returns → 成功後導向「退貨成功」或回訂單頁
//
// 目前為骨架階段，尚無邏輯，script 先留空。
</script>

<template>
  <div class="return-view">
    <h1 class="page-title">申請退貨</h1>

    <!-- 顯示要退的訂單：之後串 GET /api/orders/:id -->
    <section class="placeholder-block">
      <h2>退貨訂單</h2>
      <p>（顯示這筆訂單的商品，讓使用者確認並勾選要退的品項）</p>
      <p>（資料來自 GET /api/orders/:id）</p>
    </section>

    <!-- 退貨原因表單 -->
    <section class="placeholder-block">
      <h2>退貨原因</h2>
      <p>（之後放退貨原因、說明等輸入欄位）</p>
    </section>

    <!-- 送出申請：之後串 POST /api/returns -->
    <section class="placeholder-block">
      <button type="button">送出退貨申請（尚未串接）</button>
    </section>
  </div>
</template>

<style scoped>
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
</style>