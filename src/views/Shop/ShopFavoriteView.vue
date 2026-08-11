<script setup>
import { useFavoriteStore } from '@/stores/ShopFavorite'
const favoriteStore = useFavoriteStore()

import { useCartStore } from '@/stores/ShopCart'
const cartStore = useCartStore()

// 從收藏加入購物車（收藏保留）
function addToCart(product) {
  // 複製一份商品資料，並把數量重設為 1
  // （收藏商品可能帶著舊的 quantity，加入購物車時應該從 1 開始）
  const item = { ...product, quantity: 1, selected: true }
  cartStore.addItem(item)
}
</script>

<template>
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
      :key="product.productSpecificationId"
      class="col-md-4"
    >
      <div class="card h-100">
        <!-- 商品圖片 -->
        <img
          :src="product.image"
          :alt="product.productName"
          class="card-img-top"
          style="height: 200px; object-fit: cover"
        />
        <div class="card-body">
          <!-- 商品名稱 -->
          <h6 class="fw-semibold">{{ product.productName }}</h6>
          <!-- 規格 -->
          <div class="text-muted" style="font-size: 0.85rem">
            顏色：{{ product.color }}　尺寸：{{ product.size }}
          </div>
          <!-- 價格 -->
          <div class="fw-bold text-primary mt-2">NT$ {{ product.price }}</div>
          <!-- 動作按鈕 -->
          <div class="d-flex gap-2 mt-3">
            <!-- 加入購物車 -->
            <button
              type="button"
              class="btn btn-primary btn-sm flex-fill"
              @click="addToCart(product)"
            >
              加入購物車
            </button>
            <!-- 取消收藏 -->
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              @click="favoriteStore.removeFavorite(product.productSpecificationId)"
            >
              取消💗
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scope></style>
