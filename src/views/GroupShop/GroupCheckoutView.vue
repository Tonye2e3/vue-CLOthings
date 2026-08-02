<script>
export default {
  name: 'GroupCheckoutView',
  data() {
    return {
      qty: Number(this.$route.query.qty) || 1,
      unitPrice: 221,
      form: {
        paymentMethod: 'Apple Pay',
        shippingMethod: '宅配到府',
        recipientName: '',
        recipientPhone: '',
        recipientAddress: '',
        shippingFee: 60
      }
    }
  },
  computed: {
    subtotal() {
      return this.unitPrice * this.qty
    },
    totalAmount() {
      return this.subtotal + this.form.shippingFee
    }
  },
  methods: {
    submitOrder() {
      alert('團購訂單已送出成功！')
      this.$router.push('/GroupShop/orders')
    }
  }
}
</script>

<template>
  <div class="checkout-container">
    <h2>確認團購訂單資訊</h2>
    <p class="subtitle">請填寫正確收件資料以完成參團。</p>

    <form @submit.prevent="submitOrder" class="checkout-form">
      <div class="item-summary">
        <div>
          <strong>團購素T (10件起)</strong>
          <div class="sub-text">數量: {{ qty }} 件</div>
        </div>
        <div class="price-text">
          <small>單價: ${{ unitPrice }}</small>
          <div>${{ subtotal }}</div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>付款方式</label>
          <select v-model="form.paymentMethod">
            <option>Apple Pay</option>
            <option>Visa / 信用卡</option>
            <option>ATM 轉帳</option>
          </select>
        </div>
        <div class="form-group">
          <label>取貨方式</label>
          <select v-model="form.shippingMethod">
            <option>宅配到府</option>
            <option>超商取貨</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>收件人姓名</label>
        <input type="text" v-model="form.recipientName" placeholder="例如：蘇雅雯" required />
      </div>

      <div class="form-group">
        <label>收件人電話</label>
        <input type="tel" v-model="form.recipientPhone" placeholder="例如：09431872857" required />
      </div>

      <div class="form-group">
        <label>收件地址</label>
        <input type="text" v-model="form.recipientAddress" placeholder="請輸入完整配送地址" required />
      </div>

      <div class="fee-breakdown">
        <div class="row"><span>商品小計</span><span>${{ subtotal }}</span></div>
        <div class="row"><span>運費</span><span>${{ form.shippingFee }}</span></div>
        <div class="row total">
          <span>總計金額</span>
          <span>${{ totalAmount }}</span>
        </div>
      </div>

      <button type="submit" class="submit-btn">確認送出團購訂單</button>
    </form>
  </div>
</template>

<style scoped>
.checkout-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}
.subtitle {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 20px;
}
.checkout-form {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}
.item-summary {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
.sub-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
.price-text {
  text-align: right;
  font-weight: bold;
  color: #4f46e5;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 6px;
  color: #334155;
}
.form-group input, .form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  box-sizing: border-box;
}
.fee-breakdown {
  border-top: 1px dashed #cbd5e1;
  padding-top: 16px;
  margin-top: 16px;
}
.fee-breakdown .row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 8px;
}
.fee-breakdown .total {
  font-weight: bold;
  font-size: 18px;
  color: #4f46e5;
  border-top: 1px solid #e2e8f0;
  padding-top: 8px;
}
.submit-btn {
  width: 100%;
  background: #10b981;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 12px;
}
.submit-btn:hover {
  background: #059669;
}
</style>