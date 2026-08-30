<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/api'

const route = useRoute()
const order = ref(null) // 訂單詳情，先空的

// 日期格式化（跟訂單清單頁一樣）
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('zh-TW')
}

onMounted(async () => {
  try {
    const id = route.params.id // 從網址拿訂單 id
    const response = await api.get(`/order/${id}`) // GET /api/order/{id}（帶 token）
    order.value = response.data
  } catch (error) {
    console.error('載入訂單詳情失敗：', error)
  }
})
async function goPay() {
  try {
    const response = await api.post(`/payment/${order.value.orderId}`)
    // 開新視窗，寫入綠界 form（會自動送出跳綠界）
    const win = window.open('', '_self')
    win.document.write(response.data)
  } catch (error) {
    console.error('付款失敗：', error)
    alert('付款啟動失敗')
  }
}
async function confirmReceipt() {
  try {
    await api.put(`/order/${order.value.orderId}/complete`)
    order.value.status = '已完成' // 更新畫面
    alert('已確認收貨！')
  } catch (error) {
    console.error('確認收貨失敗：', error)
    alert(error.response?.data?.message || '操作失敗')
  }
}

// 評價彈窗狀態
const showReviewModal = ref(false)
const reviewTarget = ref(null) // 要評價哪筆明細
const reviewRating = ref(5)
const reviewComment = ref('')

// 打開評價視窗
function openReview(item) {
  console.log('openReview 被呼叫', item)
  reviewTarget.value = item
  reviewRating.value = 5
  reviewComment.value = ''
  showReviewModal.value = true
  console.log('showReviewModal 現在是', showReviewModal.value)
}

// 送出評價
async function submitReview() {
  try {
    await api.post('/review', {
      orderDetailId: reviewTarget.value.orderDetailId,
      rating: reviewRating.value,
      reviewComment: reviewComment.value,
    })
    alert('評價成功！')
    showReviewModal.value = false
  } catch (error) {
    alert(error.response?.data?.message || '評價失敗')
  }
}
</script>

<template>
  <!-- 資料還沒來 → 載入中 -->
  <div v-if="!order" class="order-detail-view">載入中...</div>

  <!-- 資料來了 → 顯示 -->
  <div v-else class="order-detail-view">
    <h1 class="page-title">訂單 #{{ order.orderId }}</h1>

    <!-- 訂單基本資訊 -->
    <section class="info-block">
      <h2 class="section-title">訂單資訊</h2>
      <div class="info-row">
        <span>狀態</span><span class="status">{{ order.status }}</span>
      </div>
      <div class="info-row">
        <span>下單日期</span><span>{{ formatDate(order.orderDate) }}</span>
      </div>
      <div class="info-row">
        <span>收件人</span><span>{{ order.shipName }}</span>
      </div>
      <div class="info-row">
        <span>收件地址</span><span>{{ order.shipAddress }}</span>
      </div>
      <div class="info-row">
        <span>聯絡電話</span><span>{{ order.shipPhone }}</span>
      </div>
    </section>

    <!-- 商品明細 -->
    <section class="info-block">
      <h2 class="section-title">商品明細</h2>
      <div v-for="(item, index) in order.items" :key="index" class="item-row">
        <div class="item-name">
          {{ item.productName }}
          <span class="item-spec">{{ item.color }} / {{ item.size }}</span>
        </div>
        <div class="item-qty">× {{ item.quantity }}</div>
        <div class="item-price">NT$ {{ (item.price * item.quantity).toLocaleString() }}</div>
        <p>　</p>
        <button v-if="order.status === '已完成'" @click="openReview(item)" class="btn-review">
          評價
        </button>
      </div>
    </section>

    <!-- 總計 -->
    <section class="total-block">
      <span>總計</span>
      <span class="total-amount">NT$ {{ order.total.toLocaleString() }}</span>
    </section>

    <button class="btn-back me-3" @click="$router.push({ name: 'orders' })">← 回訂單列表</button>
    <!-- 訂單詳情頁加這個按鈕 -->
    <button v-if="order.status === '待付款'" @click="goPay" class="btn-pay me-3">前往付款</button>
    <button v-if="order.status === '待出貨'" @click="confirmReceipt" class="btn-complete me-3">
      確認收貨
    </button>

    <button
      class="btn-back"
      @click="$router.push({ name: 'return', params: { id: order.orderId } })"
    >
      申請退貨
    </button>
    <Teleport to="body">
      <div
        v-if="showReviewModal"
        @click.self="showReviewModal = false"
        style="
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        "
      >
        <div
          style="background: #fff; padding: 24px; border-radius: 8px; width: 90%; max-width: 400px"
        >
          <h3>評價 - {{ reviewTarget.productName }}</h3>
          <div class="rating-row">
            <span>評分：</span>
            <span
              v-for="n in 5"
              :key="n"
              class="star"
              :class="{ active: n <= reviewRating }"
              @click="reviewRating = n"
              style="font-size: 1.5rem; cursor: pointer"
              :style="{ color: n <= reviewRating ? '#e6a817' : '#ddd' }"
              >★</span
            >
          </div>
          <textarea
            v-model="reviewComment"
            rows="4"
            placeholder="分享您的使用心得..."
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #ccc;
              border-radius: 6px;
              margin: 12px 0;
            "
          ></textarea>
          <div style="display: flex; gap: 12px; justify-content: flex-end">
            <button
              @click="showReviewModal = false"
              style="
                padding: 8px 20px;
                border: 1px solid #ccc;
                background: #fff;
                border-radius: 6px;
                cursor: pointer;
              "
            >
              取消
            </button>
            <button
              @click="submitReview"
              style="
                padding: 8px 20px;
                border: none;
                background: #111;
                color: #fff;
                border-radius: 6px;
                cursor: pointer;
              "
            >
              送出評價
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.btn-back {
  margin-top: 24px;
  padding: 10px 20px;
  border: 1px solid #111;
  background: #fff;
  cursor: pointer;
  border-radius: 6px;
}

.btn-pay {
  padding: 12px 32px;
  background: #f57c00;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

.btn-complete {
  padding: 12px 32px;
  background: #2a7a2a;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

.btn-review {
  padding: 4px 12px;
  background: #c9a063;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  position: relative; /* 加這行 */
  z-index: 1001; /* 加這行，比 overlay 高 */
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
}

.star {
  font-size: 1.5rem;
  color: #ddd;
  cursor: pointer;
}

.star.active {
  color: #e6a817;
}

.review-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn-cancel,
.btn-submit {
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-cancel {
  border: 1px solid #ccc;
  background: #fff;
}

.btn-submit {
  border: none;
  background: #111;
  color: #fff;
}

.order-detail-view {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #111;
}

.info-block {
  margin-bottom: 32px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  color: #444;
}

.status {
  color: #e60012;
  font-weight: 600;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.item-name {
  flex: 1;
  font-weight: 600;
}

.item-spec {
  color: #888;
  font-size: 0.85rem;
  font-weight: 400;
  margin-left: 8px;
}

.item-qty {
  color: #666;
  margin: 0 24px;
}

.item-price {
  font-weight: 700;
}

.total-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.total-amount {
  color: #e60012;
}
</style>
