<script setup>
// ═══════════════════════════════════════════════
// 客服頁 Service
// 路由：/shop/service   name: 'service'
// 用途：讓使用者透過 email 聯絡客服
// ═══════════════════════════════════════════════
//
// 【API】無需串接後端 ✅
//   本頁採 mailto，點擊後直接開啟使用者自己的信箱軟體，
//   資料不經過後端、不進資料庫，因此不需要任何 API。
//
// 目前為骨架階段。這頁邏輯極少，未來頂多微調 mailto 內容。
</script>

<template>
  <div class="service-view">
    <h1 class="page-title">聯絡客服</h1>

    <section class="placeholder-block">
      <p>如有任何問題，歡迎來信，我們會盡快回覆您。</p>

      <!--
        mailto 小技巧：可以用 ?subject= 和 &body= 幫使用者
        預先帶好「主旨」和「內文開頭」，讓他少打一點字。
        %20 是空格的編碼，換行可用 %0A（這些之後要調再說）。
      -->
      <a
        class="mail-btn"
        href="mailto:sandy881133@gmail.com?subject=CLO.things 客服詢問&body=您好，我想詢問："
      >
        寄信給客服
      </a>

      <p class="mail-hint">（點擊後將開啟您的信箱軟體）</p>
    </section>
  </div>
</template>

<style scoped>
.service-view {
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
.mail-btn {
  display: inline-block;
  margin-top: 12px;
  padding: 10px 20px;
  background: #111111;
  color: #ffffff;
  text-decoration: none;
  border-radius: 6px;
}
.mail-hint {
  margin-top: 8px;
  font-size: 0.85rem;
  color: #888;
}
</style>
