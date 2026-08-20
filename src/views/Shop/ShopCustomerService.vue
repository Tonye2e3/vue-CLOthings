<script setup>
// 客服 email（換成你們真實的）
const email = 'sandy881133@gmail.com'

// 用 encodeURIComponent 避免中文亂碼
function mailtoLink(subject) {
  const s = encodeURIComponent(subject)
  const body = encodeURIComponent('您好，我想詢問：\n\n（請描述您的問題）')
  return `mailto:${email}?subject=${s}&body=${body}`
}
</script>

<template>
  <div class="service-view">
    <h1 class="page-title">客服中心</h1>
    <p class="subtitle">有任何問題嗎？我們很樂意為您服務</p>

    <!-- 聯絡方式 -->
    <section class="contact-block">
      <div class="contact-item">
        <span class="label">📧 電子郵件</span>
        <span class="value">{{ email }}</span>
      </div>
      <div class="contact-item">
        <span class="label">🕐 服務時間</span>
        <span class="value">週一至週五 09:00 - 18:00</span>
      </div>
    </section>

    <!-- 依主題寄信（帶不同主旨）-->
    <section class="topic-block">
      <h2 class="block-title">選擇諮詢主題</h2>
      <div class="topic-grid">
        <a :href="mailtoLink('訂單問題')" class="topic-btn">
          <span class="topic-icon">📦</span>
          <span>訂單問題</span>
        </a>
        <a :href="mailtoLink('退貨諮詢')" class="topic-btn">
          <span class="topic-icon">↩️</span>
          <span>退貨諮詢</span>
        </a>
        <a :href="mailtoLink('商品諮詢')" class="topic-btn">
          <span class="topic-icon">👕</span>
          <span>商品諮詢</span>
        </a>
        <a :href="mailtoLink('其他問題')" class="topic-btn">
          <span class="topic-icon">💬</span>
          <span>其他問題</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.service-view {
  max-width: 700px;
  margin: 0 auto;
  padding: 48px 24px;
}
.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 8px;
}
.subtitle {
  color: #888;
  margin-bottom: 32px;
}
.contact-block {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px 24px;
  margin-bottom: 32px;
}
.contact-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}
.contact-item:last-child {
  border-bottom: none;
}
.label {
  font-weight: 600;
  min-width: 130px;
}
.value {
  color: #444;
}
.block-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 16px;
}
.topic-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.topic-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  text-decoration: none;
  color: #111;
  transition: all 0.15s ease;
}
.topic-btn:hover {
  border-color: #111;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}
.topic-icon {
  font-size: 1.5rem;
}
@media (max-width: 480px) {
  .topic-grid {
    grid-template-columns: 1fr;
  }
}
</style>