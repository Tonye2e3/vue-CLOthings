<script>
export default {
  name: 'GroupProductsView',
  data() {
    return {
      groupProducts: [
        {
          id: 1,
          name: '團購素T (10件起)',
          description: '100% 純棉舒適透氣，男女皆可穿，多色可選。',
          originalPrice: 340,
          lowestPrice: 221,
          currentCount: 8,
          targetCount: 10,
          status: '開團中',
          image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500'
        },
        {
          id: 2,
          name: '團購牛仔褲 (20件起)',
          description: '修身版型彈性修飾，四季百搭單品。',
          originalPrice: 430,
          lowestPrice: 324,
          currentCount: 15,
          targetCount: 20,
          status: '開團中',
          image: 'https://images.unsplash.com/photo-1542272604-780c36856842?w=500'
        },
        {
          id: 3,
          name: '團購長袖組 (30件起)',
          description: '保暖舒適質感上衣，團購限定特惠。',
          originalPrice: 1150,
          lowestPrice: 909,
          currentCount: 30,
          targetCount: 30,
          status: '已成團',
          image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500'
        }
      ]
    }
  },
  methods: {
    calculateProgress(current, target) {
      return Math.min((current / target) * 100, 100)
    }
  }
}
</script>

<template>
  <div class="group-products-container">
    <div class="banner">
      <div>
        <h1>🔥 限時團購專區</h1>
        <p>越多人買越便宜！邀請好友一起解鎖最低折扣。</p>
      </div>
      <router-link to="/GroupShop/orders" class="my-orders-btn">
        📦 我的團購訂單
      </router-link>
    </div>

    <div class="product-grid">
      <div v-for="item in groupProducts" :key="item.id" class="product-card">
        <img :src="item.image" :alt="item.name" class="product-image" />
        <div class="product-body">
          <div class="product-header">
            <h3>{{ item.name }}</h3>
            <span class="status-tag">{{ item.status }}</span>
          </div>
          <p class="description">{{ item.description }}</p>

          <div class="price-box">
            <div>原價: <span class="old-price">${{ item.originalPrice }}</span></div>
            <div class="lowest-price">最高優惠價: ${{ item.lowestPrice }}</div>
          </div>

          <div class="progress-section">
            <div class="progress-info">
              <span>目前數量: <b>{{ item.currentCount }}</b></span>
              <span>目標: {{ item.targetCount }}件</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: calculateProgress(item.currentCount, item.targetCount) + '%' }"></div>
            </div>
          </div>

          <router-link :to="`/GroupShop/product/${item.id}`" class="join-btn">
            立即參團
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 容器：寬度設為 100%，並設定最大寬度，隨視窗大小自適應 */
.group-products-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

/* Banner 區域：滿寬且彈性佈局 */
.banner {
  background-color: #1e1b4b;
  color: white;
  padding: 24px 32px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* 小螢幕時自動折行 */
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;
}

.banner h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
}

.banner p {
  margin: 0;
  color: #c7d2fe;
  font-size: 14px;
}

.my-orders-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  white-space: nowrap;
}

/* 卡片網格：利用 auto-fit 讓卡片數量隨螢幕寬度自動調整 (大螢幕3欄、中螢幕2欄、手機1欄) */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
}

.product-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.product-header h3 {
  margin: 0;
  font-size: 16px;
}

.status-tag {
  background: #ffe4e6;
  color: #e11d48;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.description {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 12px;
}

.price-box {
  background: #f8fafc;
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  margin-bottom: 12px;
}

.old-price {
  text-decoration: line-through;
  color: #94a3b8;
}

.lowest-price {
  color: #059669;
  font-weight: bold;
  margin-top: 4px;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4f46e5;
  transition: width 0.3s ease;
}

.join-btn {
  margin-top: auto;
  display: block;
  text-align: center;
  background: #4f46e5;
  color: white;
  padding: 10px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
}

.join-btn:hover {
  background: #4338ca;
}
</style>