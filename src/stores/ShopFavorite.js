import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'   // 用組員的 api

export const useFavoriteStore = defineStore('favorite', () => {
  const favorites = ref([])

  // 從後端載入收藏
  async function loadFavorites() {
    try {
      const response = await api.get('/favorite')
      favorites.value = response.data
    } catch (error) {
      console.error('載入收藏失敗：', error)
    }
  }

  // 加入收藏（打 POST API）
  async function addFavorite(productId) {
    try {
      await api.post('/favorite', { productId })
      await loadFavorites()   // 重新載入（拿到含 customerFavoriteId 的最新資料）
    } catch (error) {
      console.error('加入收藏失敗：', error)
    }
  }

  // 移除收藏（打 DELETE API，用 customerFavoriteId）
  async function removeFavorite(customerFavoriteId) {
    try {
      await api.delete(`/favorite/${customerFavoriteId}`)
      // 前端也移除
      const index = favorites.value.findIndex(
        (f) => f.customerFavoriteId === customerFavoriteId,
      )
      if (index !== -1) favorites.value.splice(index, 1)
    } catch (error) {
      console.error('移除收藏失敗：', error)
    }
  }

      // 切換收藏狀態：沒收藏就加、已收藏就移除
    // 這就是你說的「再點一下愛心會取消收藏」的邏輯
    function toggleFavorite(product) {
      const exist = favorites.value.find(
        (p) => p.productSpecificationId === product.productSpecificationId,
      )
      if (exist) {
        // 已經收藏了 → 再點就取消（移除）
        removeFavorite(product.productSpecificationId)
      } else {
        // 還沒收藏 → 加入
        addFavorite(product)
      }
    }

  // 判斷某商品有沒有被收藏（用 productId）
  function isFavorite(productId) {
    return favorites.value.some((f) => f.productId === productId)
  }

  return { favorites, loadFavorites, addFavorite, removeFavorite, isFavorite }
}, /* 拿掉 persist */ )