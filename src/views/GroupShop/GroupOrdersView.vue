<script>
export default {
  name: 'GroupOrdersView',
  data() {
    return {
      myOrders: [
        {
          id: 30,
          orderDate: '2026/07/29 13:50',
          status: '處理中',
          productName: '團購素T(10件起)',
          quantity: 1,
          shippingMethod: '宅配到府',
          recipientName: '蘇雅雯',
          recipientPhone: '09431872857',
          totalAmount: 400
        },
        {
          id: 12,
          orderDate: '2026/06/15 10:20',
          status: '已出貨',
          productName: '團購牛仔褲(20件起)',
          quantity: 2,
          shippingMethod: '超商取貨',
          recipientName: '蘇雅雯',
          recipientPhone: '09431872857',
          totalAmount: 708
        }
      ]
    }
  }
}
</script>

<template>
  <div class="orders-container">
    <h2>📦 我的團購訂單記錄</h2>

    <div class="orders-list">
      <div v-for="order in myOrders" :key="order.id" class="order-card">
        <div class="order-header">
          <div>
            <strong>訂單編號 #{{ order.id }}</strong>
            <span class="order-date">{{ order.orderDate }}</span>
          </div>
          <span class="status-badge">{{ order.status }}</span>
        </div>

        <div class="order-body">
          <div class="info">
            <div class="product-title">{{ order.productName }}</div>
            <div class="meta">數量：{{ order.quantity }} 件 | 取貨方式：{{ order.shippingMethod }}</div>
            <div class="meta">收件人：{{ order.recipientName }} ({{ order.recipientPhone }})</div>
          </div>
          <div class="price">
            <small>總金額 (含運費)</small>
            <div>${{ order.totalAmount }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}
.order-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 16px 20px;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 12px;
  margin-bottom: 12px;
}
.order-date {
  color: #94a3b8;
  font-size: 13px;
  margin-left: 12px;
}
.status-badge {
  background: #fef3c7;
  color: #d97706;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}
.order-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.product-title {
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 4px;
}
.meta {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}
.price {
  text-align: right;
}
.price small {
  font-size: 11px;
  color: #94a3b8;
}
.price div {
  font-size: 20px;
  font-weight: bold;
  color: #4f46e5;
}
</style>