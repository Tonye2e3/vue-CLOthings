<script setup>
import { onMounted } from 'vue'
import { useFavoriteStore } from '@/stores/ShopFavorite'
import { useCartStore } from '@/stores/ShopCart'

const favoriteStore = useFavoriteStore()
const cartStore = useCartStore()

const API_BASE = import.meta.env.VITE_API_URL
function getImageUrl(fileName) {
  if (!fileName) return 'https://placehold.co/300x400?text=No+Image'
  return `${API_BASE}/images/product/${fileName}`
}

// 載入收藏
onMounted(() => {
  favoriteStore.loadFavorites()
})
</script>

<template>
  <div class="container">
    <h3 class="fw-bold mb-4">我的收藏</h3>

    <!-- 空狀態：收藏是空的時候顯示 -->
    <div v-if="favoriteStore.favorites.length == 0" class="text-center py-5 text-body-secondary">
      <div class="mb-2 display-3">🤍</div>
      <p class="mb-3 display-6">還沒有收藏任何商品</p>
      <p class="text-muted">把喜歡的商品加入收藏，之後就能在這裡找到囉</p>
    </div>

    <!-- 收藏商品清單 -->

    <div v-else class="row g-4">
      <!-- 每一筆收藏商品 -->
      <div
        v-for="product in favoriteStore.favorites"
        :key="product.customerFavoriteId"
        class="col-md-4"
      >
        <div class="card h-100">
          <!-- 商品圖片 -->
          <img
            :src="getImageUrl(product.image)"
            :alt="product.productName"
            class="card-img-top"
            style="height: 200px; object-fit: cover"
          />
          <div class="card-body">
            <!-- 商品名稱 -->
            <h6 class="fw-semibold">{{ product.productName }}</h6>
            <!-- 價格 -->
            <div class="fw-bold text-primary mt-2">NT$ {{ product.price }}</div>
            <!-- 動作按鈕 -->
            <div class="d-flex gap-2 mt-3">
              <!-- 「查看商品」-->
              <button
                class="btn btn-primary btn-sm flex-fill"
                @click="$router.push({ name: 'product', params: { id: product.productId } })"
              >
                查看商品
              </button>
              <!-- 取消收藏 -->
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                @click="favoriteStore.removeFavorite(product.customerFavoriteId)"
              >
                取消💗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scope>
.container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
