<script setup>
// ═══════════════════════════════════════════════
// 訂單列表頁 Orders
// 路由：/shop/orders   name: 'orders'
// 用途：顯示「我的所有訂單」清單，每筆可點進去看詳情
// ═══════════════════════════════════════════════
//
// 【之後要串的 API】
//   GET /api/orders   取得目前使用者的所有訂單，顯示成清單
//
// 之後的資料流：
//   本頁 onMounted → GET /api/orders → 拿到訂單陣列 → v-for 列出每筆
//   點某一筆 → router.push 到 /shop/orders/:id（訂單詳情頁）
//
// 目前為骨架階段，尚無邏輯，script 先留空。
</script>

<template>
  <div class="orders-view">
    <h1 class="page-title">我的訂單</h1>

    <!-- 訂單清單：之後串 GET /api/orders，用 v-for 列出每一筆 -->
    <section class="placeholder-block">
      <p>（此區之後顯示訂單清單，串接 GET /api/orders）</p>
      <p>（每一筆訂單可點擊，導向 /shop/orders/:id 看詳情）</p>
    </section>
  </div>
</template>

<style scoped>
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
</style>