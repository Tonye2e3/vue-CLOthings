import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useFavoriteStore = defineStore(
  'favorite',
  () => {
    // ───────────────────────────────────────
    // 存放收藏商品的陣列
    // 【跟購物車一樣】都是一個 ref([]) 陣列
    // ───────────────────────────────────────
    const favorites = ref([])

    // ───────────────────────────────────────
    // 加入收藏
    // 【跟購物車的 addItem 幾乎一樣】：先檢查有沒有，沒有才加
    // 【不同】：不用疊加數量，因為收藏沒有數量概念，重複收藏就忽略
    // ───────────────────────────────────────
    function addFavorite(product) {
      const exist = favorites.value.find(
        (p) => p.productSpecificationId === product.productSpecificationId,
      )
      if (!exist) {
        // 只有「還沒收藏過」才加入（已收藏就什麼都不做）
        favorites.value.push(product)
      }
    }

    // ───────────────────────────────────────
    // 移除收藏
    // 【跟購物車的 removeItem 完全一樣】：找到位置、splice 刪掉
    // ───────────────────────────────────────
    function removeFavorite(productSpecificationId) {
      const index = favorites.value.findIndex(
        (p) => p.productSpecificationId === productSpecificationId,
      )
      if (index !== -1) {
        favorites.value.splice(index, 1)
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

    // ───────────────────────────────────────
    // 判斷某商品「有沒有被收藏」
    // 【收藏特有】：回傳 true / false，給愛心圖示判斷要不要變紅
    // ───────────────────────────────────────
    function isFavorite(productSpecificationId) {
      return favorites.value.some((p) => p.productSpecificationId === productSpecificationId)
    }

    return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }
    //       ↑ 記得 return！（你剛踩過這個坑，這次會記得了吧 😊）
  },
  { persist: true },
)
