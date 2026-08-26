<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute,useRouter } from 'vue-router'
import api from '@/services/api'
import Review from '@/components/Shop/ProductReview.vue'
import Post from '@/components/Shop/ProductPost.vue'
import { useCartStore } from '@/stores/ShopCart'
import { useFavoriteStore } from '@/stores/ShopFavorite'
import { useBuyNowStore } from '@/stores/ShopBuyNow'

const cartStore = useCartStore()
const favoriteStore = useFavoriteStore()
const route = useRoute()
const router = useRouter()
const API_BASE = 'https://localhost:7255'
const buyNowStore = useBuyNowStore()


function getImageUrl(fileName) {
  if (!fileName) {
    return 'https://placehold.co/300x400?text=No+Image'
  }
  return `${API_BASE}/images/product/${fileName}`
}

// 預覽圖區的假資料，之後用API抓
const product = ref(null)

// 按鈕區，user「目前選擇」的狀態
const currentImage = ref('') //主圖的啦
const selectedColor = ref(null) //預設沒選顏色
const selectedSize = ref(null) //預設沒選尺寸

//==== 按鈕區，收藏、加入購物車、立即結帳====
// 這個「商品」有沒有在收藏裡？（用 productId 判斷）
const isCurrentFavorite = computed(() => {
  if (!product.value) return false
  return favoriteStore.isFavorite(product.value.productId)
})

onMounted(async () => {
  try {
    const id = route.params.id // 從網址拿 id（例如 /shop/product/5 → "5"）
    const response = await api.get(`/product/${id}`)
    product.value = response.data
    // 資料來了之後，才設定主圖（用 images 的第一張）
    if (product.value.images && product.value.images.length > 0) {
      currentImage.value = getImageUrl(product.value.images[0])
    }
  } catch (error) {
    console.error('載入商品失敗：', error)
  }
  await favoriteStore.loadFavorites()
})

//切換收藏狀態
async function toggleFavorite() {
  const productId = product.value.productId

  if (favoriteStore.isFavorite(productId)) {
    // 已收藏 → 找出 customerFavoriteId 來移除
    const fav = favoriteStore.favorites.find((f) => f.productId === productId)
    if (fav) {
      await favoriteStore.removeFavorite(fav.customerFavoriteId)
    }
  } else {
    // 沒收藏 → 加入
    await favoriteStore.addFavorite(productId)
  }
}

// 加入購物車
async function addToCart() {
  if (!selectedColor.value || !selectedSize.value) {
    alert('請選擇顏色和尺寸')
    return
  }
  // 只需要送規格 id 和數量
  await cartStore.addItem({
    productSpecificationId: selectedSpec.value.productSpecificationId,
    quantity: 1,
  })
  alert('已加入購物車！')
}

//立即購買
function buyNow() {
  if (!selectedColor.value || !selectedSize.value) {
    alert('請選擇顏色和尺寸')
    return
  }
  // 把這一個商品存進 buyNow store
  buyNowStore.setItem({
    productSpecificationId: selectedSpec.value.productSpecificationId,
    productName: product.value.productName,
    price: product.value.price,
    color: selectedColor.value,
    size: selectedSize.value,
    image: getImageUrl(product.value.images[0]),
    quantity: 1,
  })
  // 跳結帳頁，用參數標記是立即購買
  router.push({ name: 'checkout', query: { buyNow: '1' } })
}

// 從規格組合中，取出所有「不重複的顏色」
const colorOptions = computed(() => {
  if (!product.value) return []
  const colors = product.value.specifications.map((spec) => spec.color)
  return [...new Set(colors)] // 去除重複
})

// 從規格組合中，取出所有「不重複的尺寸」
const sizeOptions = computed(() => {
  if (!product.value) return []
  const sizes = product.value.specifications.map((spec) => spec.size)
  return [...new Set(sizes)]
})

// 根據使用者選的顏色+尺寸，反查出對應的「完整規格」（含 id、庫存）
const selectedSpec = computed(() => {
  // 還沒選齊顏色和尺寸，就回傳 null
  if (!selectedColor.value || !selectedSize.value) {
    return null
  }
  // 從組合陣列裡，找出「顏色和尺寸都符合」的那一筆
  return product.value.specifications.find(
    (spec) => spec.color === selectedColor.value && spec.size === selectedSize.value,
  )
})


</script>

<!-- =========================================================== -->
<template>
  <!-- 資料還沒來 → 顯示載入中 -->
  <div v-if="!product" class="loading">載入中...</div>
  <!-- 資料來了 → 才顯示商品內容 -->
  <div v-else>
    <div class="product-page">
      <!-- 預覽圖區 -->
      <div class="product-gallery">
        <!-- 大圖 -->
        <div class="gallery-main">
          <img :src="currentImage" alt="商品圖片" />
        </div>

        <!-- 小圖列表，點擊切換大圖 -->
        <div class="gallery-smallpics">
          <button
            v-for="(img, index) in product.images"
            :key="index"
            class="smallpic-btn"
            :class="{ active: currentImage === getImageUrl(img) }"
            @click="currentImage = getImageUrl(img)"
          >
            <img :src="getImageUrl(img)" alt="商品縮圖" />
          </button>
        </div>
      </div>
      <!-- 商品資訊區 -->
      <div class="product-info">
        <h1 class="info-title">商品資訊</h1>

        <h2 class="info-name">{{ product.productName }}</h2>

        <p class="info-meta">
          顏色：{{ selectedColor ?? '尚未選擇' }} / 尺寸：{{ selectedSize ?? '尚未選擇' }}
        </p>

        <!-- <div class="info-tags">
          <span v-for="tag in product.tags" :key="tag" class="tag-badge">
            {{ tag }}
          </span>
        </div> -->
        <p class="info-price">價格：NT$ {{ product.price.toLocaleString() }}</p>

        <!-- 按鈕區域，選顏色 -->
        <div class="option-group">
          <p class="option-label">顏色</p>
          <div class="option-list">
            <button
              v-for="color in colorOptions"
              :key="color"
              class="option-btn"
              :class="{ selected: selectedColor === color }"
              @click="selectedColor = color"
            >
              {{ color }}
            </button>
          </div>
        </div>

        <!-- 按鈕區域，選尺寸 -->
        <div class="option-group">
          <p class="option-label">尺寸</p>
          <div class="option-list">
            <button
              v-for="size in sizeOptions"
              :key="size"
              class="option-btn"
              :class="{ selected: selectedSize === size }"
              @click="selectedSize = size"
            >
              {{ size }}
            </button>
          </div>
          <p class="option-hint">建議尺寸：M（依版型微修身）</p>
        </div>

        <!-- 按鈕區域，收藏、立即購買、加入購物車 -->
        <div class="action-buttons">
          <button class="btn-favorite" @click="toggleFavorite">
            收藏 <span v-if="isCurrentFavorite">❤️</span><span v-else>🤍</span>
          </button>

          <button class="btn-buy-now" @click="buyNow">立即購買</button>

          <button class="btn-add-cart" @click="addToCart">加入購物車</button>
        </div>
      </div>
    </div>

    <!-- 使用者評價 -->
    <div>
      <Review v-if="product" :product-id="product.productId" />
    </div>

    <!-- 跟商品有關的穿搭靈感 -->
    <div>
      <Post />
    </div>
  </div>
</template>

<!-- =========================================================== -->

<style scoped>
/* 左側商品照片的樣式 */
.product-gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 大圖容器 */
.gallery-main {
  width: 100%;
  aspect-ratio: 1 / 1; /* 保持正方形比例，不管圖片原始比例是什麼 */
  overflow: hidden;
  background: #f5f5f5;
}

.gallery-main img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 讓圖片填滿容器，多餘部分裁掉，不會變形 */
}

/* 小圖列表容器 */
.gallery-smallpics {
  display: grid;
  grid-template-columns: repeat(6, 1fr); /* 固定 6 欄，符合您的設計稿 */
  gap: 8px;
}

.smallpic-btn {
  aspect-ratio: 1 / 1;
  padding: 0;
  border: 1px solid #e5e5e5;
  background: #f5f5f5;
  cursor: pointer;
  overflow: hidden;
}

.smallpic-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block; /* 消除 img 預設的行內元素間隙 */
}

.smallpic-btn.active {
  border-color: #111111; /* 選中時邊框變深色，符合高對比風格 */
  border-width: 2px;
}

/* 右側商品資訊的樣式 */
.product-page {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 左右各佔一半 */
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.info-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 24px;
}

.info-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: #111111;
  margin-bottom: 8px;
}

.info-meta {
  font-size: 0.85rem;
  color: #666666;
  margin-bottom: 12px;
}

.info-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tag-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  border: 1px solid #ff6b7f;
  border-radius: 4px;
  color: #ff6b7f;
}

.info-price {
  font-size: 1.4rem;
  font-weight: 700;
  color: #111111;
  margin-bottom: 24px;
}

/* 按鈕區域 */
.option-group {
  margin-bottom: 20px;
}

.option-label {
  font-size: 0.85rem;
  color: #666666;
  margin-bottom: 8px;
}

.option-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap; /* 選項太多時自動換行 */
}

.option-btn {
  padding: 10px 20px;
  border: 1px solid #e5e5e5;
  background: #ffffff;
  color: #111111;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s ease;
}

.option-btn:hover {
  border-color: #111111;
}

.option-btn.selected {
  border-color: #111111;
  background: #111111;
  color: #ffffff;
}

.option-hint {
  font-size: 0.75rem;
  color: #999999;
  margin-top: 8px;
}
/* 按鈕區域，收藏、立即購買、加入購物車 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-favorite,
.btn-buy-now,
.btn-add-cart {
  padding: 14px 24px;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-favorite {
  background: #ffffff;
  border: 1px solid #111111;
  color: #111111;
}

.btn-buy-now {
  background: #ffffff;
  border: 1px solid #111111;
  color: #111111;
}

.btn-add-cart {
  background: #111111;
  color: #ffffff;
  flex: 1; /* 讓這個按鈕佔用剩餘空間，視覺上更主要 */
}

.btn-favorite:hover,
.btn-buy-now:hover,
.btn-add-cart:hover {
  opacity: 0.8;
}
</style>
