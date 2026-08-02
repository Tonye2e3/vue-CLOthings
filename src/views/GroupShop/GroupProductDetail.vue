<script>
export default {
  name: 'GroupProductDetail',
  data() {
    return {
      selectedQty: 1,
      product: {
        id: 1,
        name: '團購素T (10件起)',
        description: '100% 純棉舒適透氣，男女皆可穿，多色可選。',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
        priceTiers: [
          { minQty: 1, price: 340 },
          { minQty: 5, price: 306 },
          { minQty: 10, price: 221 }
        ]
      }
    }
  },
  computed: {
    currentUnitPrice() {
      const sortedTiers = [...this.product.priceTiers].reverse()
      const match = sortedTiers.find(tier => this.selectedQty >= tier.minQty)
      return match ? match.price : 340
    },
    totalAmount() {
      return this.currentUnitPrice * this.selectedQty
    }
  },
  methods: {
    decreaseQty() {
      if (this.selectedQty > 1) this.selectedQty--
    },
    increaseQty() {
      this.selectedQty++
    },
    goToCheckout() {
      this.$router.push({
        path: '/GroupShop/checkout',
        query: { productId: this.product.id, qty: this.selectedQty }
      })
    }
  }
}
</script>

<template>
  <div class="detail-container">
    <router-link to="/GroupShop" class="back-link">← 返回團購大廳</router-link>

    <div class="detail-card">
      <img :src="product.image" :alt="product.name" class="detail-image" />

      <div class="detail-content">
        <div>
          <span class="tag">團購進行中</span>
          <h2>{{ product.name }}</h2>
          <p class="desc">{{ product.description }}</p>

          <div class="tiers-box">
            <h4>階梯優惠價：</h4>
            <div
              v-for="tier in product.priceTiers"
              :key="tier.minQty"
              class="tier-item"
              :class="{ active: selectedQty >= tier.minQty }"
            >
              <span>滿 {{ tier.minQty }} 件</span>
              <span>${{ tier.price }} / 件</span>
            </div>
          </div>

          <div class="qty-selector">
            <label>購買數量：</label>
            <div class="qty-controls">
              <button @click="decreaseQty">-</button>
              <span>{{ selectedQty }}</span>
              <button @click="increaseQty">+</button>
            </div>
          </div>
        </div>

        <div class="summary-box">
          <div class="price-row">
            <span>預估單價：</span>
            <span class="unit-price">${{ currentUnitPrice }}</span>
          </div>
          <button @click="goToCheckout" class="checkout-btn">
            參加團購 (總額: ${{ totalAmount }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}
.back-link {
  color: #4f46e5;
  text-decoration: none;
  font-size: 14px;
  display: inline-block;
  margin-bottom: 16px;
}
.detail-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
.detail-image {
  width: 100%;
  height: 350px;
  object-fit: cover;
  border-radius: 12px;
}
.detail-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}
h2 {
  margin: 12px 0 8px 0;
}
.desc {
  color: #64748b;
  font-size: 14px;
}
.tiers-box {
  margin: 20px 0;
}
.tiers-box h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
}
.tier-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 6px;
  color: #64748b;
}
.tier-item.active {
  border-color: #10b981;
  background: #ecfdf5;
  color: #065f46;
  font-weight: bold;
}
.qty-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.qty-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qty-controls button {
  width: 32px;
  height: 32px;
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.qty-controls span {
  width: 24px;
  text-align: center;
  font-weight: bold;
}
.summary-box {
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
}
.unit-price {
  font-size: 24px;
  font-weight: bold;
  color: #4f46e5;
}
.checkout-btn {
  width: 100%;
  background: #4f46e5;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
.checkout-btn:hover {
  background: #4338ca;
}
</style>