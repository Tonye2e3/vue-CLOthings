<script setup>
import { useCartStore } from '@/stores/ShopCart' // 引入購物車store
import { useRouter } from 'vue-router'
import { useFavoriteStore } from '@/stores/ShopFavorite'
import { onMounted } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL
function getImageUrl(fileName) {
  if (!fileName) return 'https://placehold.co/80x80?text=No+Image'
  return `${API_BASE}/images/product/${fileName}`
}

const cartStore = useCartStore() // 使用購物車store
const router = useRouter()
const favoriteStore = useFavoriteStore()

onMounted(() => {
  cartStore.loadCart() // 從後端拿購物車
})

function goShop() {
  router.push({ name: 'shop' })
}

async function moveToFavorite(item) {
  await favoriteStore.addFavorite(item.productId) // 傳 productId（不是整個 item）
  await cartStore.removeItem(item.productSpecificationId) // 從購物車移除（用規格 id）
}
</script>

<template>
  <div class="container">
    <h3 class="fw-bold mb-4">購物車</h3>

    <!-- 購物車空狀態 -->
    <div v-if="cartStore.items.length == 0" class="text-center py-5 text-body-secondary">
      <div class="mb-2 display-3">❤</div>
      <p class="mb-3 display-6">等待一場與美好的相遇</p>
      <br />
      <br />
      <button class="btn-go-shop" @click="goShop()">前往商品列表</button>
    </div>

    <div v-else class="row g-4">
      <!-- 購物車品項 -->
      <div class="col-md-8">
        <div class="card">
          <div class="card-body p-0">
            <table class="table mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th></th>
                  <th>商品</th>
                  <th class="text-center">單價</th>
                  <th class="text-center" style="width: 140px">數量</th>
                  <th class="text-end">小計</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in cartStore.items" :key="product.productSpecificationId">
                  <!-- 勾選框 -->
                  <td class="text-center">
                    <input
                      type="checkbox"
                      :checked="product.selected"
                      @change="cartStore.toggleSelect(product.productSpecificationId)"
                    />
                  </td>

                  <td>
                    <div class="d-flex align-items-center gap-3">
                      <img
                        :src="getImageUrl(product.image)"
                        :alt="product.productName"
                        style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px"
                      />
                      <div>
                        <div class="fw-semibold">{{ product.productName }}</div>
                        <div class="text-muted" style="font-size: 0.85rem">
                          顏色：{{ product.color }}　尺寸：{{ product.size }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="text-center">NT$ {{ product.price }}</td>
                  <td>
                    <div class="input-group input-group-sm">
                      <button
                        class="btn btn-secondary"
                        type="button"
                        @click="cartStore.changeQty(product.productSpecificationId, -1)"
                      >
                        －
                      </button>
                      <span class="input-group-text px-3">{{ product.quantity }}</span>
                      <button
                        class="btn btn-secondary"
                        type="button"
                        @click="cartStore.changeQty(product.productSpecificationId, +1)"
                      >
                        ＋
                      </button>
                    </div>
                  </td>
                  <td class="text-end fw-semibold">NT$ {{ product.price * product.quantity }}</td>
                  <td class="text-end">
                    <!-- 移至收藏 -->
                    <button
                      type="button"
                      class="btn btn-sm btn-link text-secondary p-0 me-3"
                      @click="moveToFavorite(product)"
                    >
                      💗
                    </button>
                    <!-- 移除 -->
                    <button
                      type="button"
                      class="btn btn-sm btn-link text-danger p-0"
                      @click="cartStore.removeItem(product.productSpecificationId)"
                    >
                      移除
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 訂單摘要 -->
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h6 class="fw-bold mb-3">訂單摘要</h6>
            <div class="d-flex justify-content-between mb-2">
              <span>已選商品</span>
              <span>{{ cartStore.selectedCount }} 件</span>
            </div>
            <div class="d-flex justify-content-between fw-bold fs-5 mb-3">
              <span>合計</span>
              <span class="text-primary">NT$ {{ cartStore.total }}</span>
            </div>
            <button
              type="button"
              class="btn btn-primary w-100"
              @click="router.push({ name: 'checkout' })"
            >
              前往結帳
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.btn-go-shop {
  padding: 14px 24px;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-go-shop {
  background: #111111;
  color: #ffffff;
  flex: 1; /* 讓這個按鈕佔用剩餘空間，視覺上更主要 */
}

.btn-go-shop {
  opacity: 0.8;
}
</style>
