<script setup>
import { ref } from 'vue'
import api from '@/api/api'

const form = ref({ name: '', email: '', phone: '', title: '', content: '' })
const sent = ref(false)

async function submitForm() {
  if (!form.value.name || !form.value.email || !form.value.content) {
    alert('請填寫姓名、Email 和內容')
    return
  }
  try {
    await api.post('/customerservice', form.value)
    sent.value = true
    form.value = { name: '', email: '', phone: '', title: '', content: '' }
  } catch (error) {
    console.error('送出失敗：', error)
    alert('送出失敗，請稍後再試')
  }
}

// 取得客服郵箱地址
const email = ref('')

async function getContactEmail() {
  try {
    const response = await api.get('/contact/email')

    email.value = response.data.email
  } catch (error) {
    console.error('獲取郵箱地址失敗：', error)
  }
}
// 在組件掛載時獲取客服郵箱地址
getContactEmail()

function mailtoLink(subject) {
  const s = encodeURIComponent(subject)
  const body = encodeURIComponent('您好，我想詢問：')
  return `mailto:${email.value}?subject=${s}&body=${body}`
}
</script>

<template>
  <div class="service-view">
    <h1 class="page-title">客服中心</h1>
    <p class="subtitle">有任何問題嗎？我們很樂意為您服務</p>

    <!-- 聯絡資訊 -->
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

    <!-- 依主題寄信 -->
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
      <p class="mail-hint">點擊後將開啟您的信箱軟體，收件人與主旨已帶好</p>
    </section>

    <section class="form-block">
      <h2 class="block-title">或直接留言給我們</h2>

      <div v-if="sent" class="success-msg">✅ 已收到您的訊息，我們會盡快回覆！</div>

      <div v-else class="form">
        <input v-model="form.name" placeholder="姓名 *" class="input" />
        <input v-model="form.email" placeholder="Email *" class="input" />
        <input v-model="form.phone" placeholder="電話" class="input" />
        <input v-model="form.title" placeholder="主旨" class="input" />
        <textarea v-model="form.content" placeholder="問題內容 *" rows="4" class="input"></textarea>
        <button @click="submitForm" class="btn-submit">送出</button>
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

.mail-hint {
  margin-top: 16px;
  font-size: 0.85rem;
  color: #888;
  text-align: center;
}

.form-block {
  margin-top: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input {
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-family: inherit;
}

.btn-submit {
  padding: 12px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.success-msg {
  padding: 24px;
  background: #f0f9f0;
  border-radius: 8px;
  text-align: center;
  color: #2a7a2a;
}

@media (max-width: 480px) {
  .topic-grid {
    grid-template-columns: 1fr;
  }
}
</style>
