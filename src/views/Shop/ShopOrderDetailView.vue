<script setup>
// ═══════════════════════════════════════════════
// 訂單詳情頁 Order Detail
// 路由：/shop/orders/:id   name: 'orderDetail'
// 用途：顯示「某一筆訂單」的完整內容（訂單資訊 + 商品明細）
// ═══════════════════════════════════════════════
//
// 【之後要串的 API】
//   GET /api/orders/:id   取得單一訂單的完整資料
//     後端會一次打包回傳：
//       - 訂單本身資訊（來自 Orders 表：訂單編號、時間、收件人…）
//       - 訂單商品明細（來自 OrderDetail 表：每個商品、數量、單價）
//
// 【怎麼拿到網址上的 :id】
//   之後用 useRoute() 取得 route.params.id，再帶進 API 網址
//   例：GET /api/orders/{route.params.id}
//
// 目前為骨架階段，尚無邏輯，script 先留空。
</script>

<template>
  <div class="order-detail-view">
    <h1 class="page-title">訂單詳情</h1>

    <!-- 訂單基本資訊：之後填入 Orders 表的資料 -->
    <section class="placeholder-block">
      <h2>訂單資訊</h2>
      <p>（訂單編號、下單時間、收件人、狀態，來自 Orders 表）</p>
    </section>

    <!-- 商品明細：之後填入 OrderDetail 表的資料，用 v-for 列出 -->
    <section class="placeholder-block">
      <h2>商品明細</h2>
      <p>（此訂單包含的每個商品、數量、單價，來自 OrderDetail 表）</p>
    </section>
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
.placeholder-block {
  border: 1px dashed #ccc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}
</style>