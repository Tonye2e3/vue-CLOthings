import { defineStore } from 'pinia' //引入pinia的模組
import { computed, ref } from 'vue' //引入vue的內建模組
import api from '@/services/api'

export const useCartStore = defineStore(
  'cart',
  () => {
    // 內可放變數、方法、計算屬性

    // 存放商品的變數，其他元件可以透過此變數得知購物車內容
    const items = ref([]) // ref() 建立一個物件，並且可以監聽變化

    // 增加商品的方法，將商品加入購物車
    // 加入購物車（打後端 API）
    async function addItem(product) {
      try {
        // 打 POST /api/cart，送規格 id + 數量
        await api.post('/cart', {
          productSpecificationId: product.productSpecificationId,
          quantity: product.quantity,
        })
        // 加入成功後，重新從後端載入購物車（拿到含 cartId 的最新資料）
        await loadCart()
      } catch (error) {
        console.error('加入購物車失敗：', error)
        alert('加入購物車失敗，請稍後再試')
      }
    }

    // 移除商品的方法，將商品從購物車移除
    async function removeItem(productSpecificationId) {
      const item = items.value.find((p) => p.productSpecificationId === productSpecificationId)
      // 找到該商品的索引值，當前陣列當中，如果有相同id則傳到index，如果沒有則傳回-1
      if (!item) return
      try {
        // 打 DELETE API，用 cartId
        await api.delete(`/cart/${item.cartId}`)
        // 後端刪成功 → 前端也移除
        const index = items.value.findIndex(
          (p) => p.productSpecificationId === productSpecificationId,
        )
        items.value.splice(index, 1)
      } catch (error) {
        console.error('移除失敗：', error)
      }
    }

    // 增減商品數量的方法
    async function changeQty(productSpecificationId, delta) {
      const item = items.value.find((p) => p.productSpecificationId === productSpecificationId)
      if (!item) return

      const newQty = item.quantity + delta

      // 數量歸零或以下 → 改成移除
      if (newQty <= 0) {
        removeItem(productSpecificationId)
        return
      }

      try {
        // 打 PUT API，用 cartId + 新數量
        await api.put(`/cart/${item.cartId}`, { quantity: newQty })
        // 後端改成功 → 前端也更新
        item.quantity = newQty
      } catch (error) {
        console.error('改數量失敗：', error)
      }
    }

    // 切換某筆商品的勾選狀態
    function toggleSelect(productSpecificationId) {
      const item = items.value.find((p) => p.productSpecificationId === productSpecificationId)
      if (item) {
        item.selected = !item.selected // 把 true 變 false、false 變 true
      }
    }

    // 只包含「已勾選」的商品（結帳、送訂單都用這個）
    const selectedItems = computed(() => {
      return items.value.filter((p) => p.selected)
    })

    // 購物車已選件數
    const selectedCount = computed(() => {
      let count = 0
      items.value.forEach((p) => {
        if (p.selected) {
          count += p.quantity // 累加勾選商品的數量
        }
      })
      return count
    })

    // 從後端載入購物車
    async function loadCart() {
      try {
        const response = await api.get('/cart')
        items.value = response.data.map((item) => ({
          ...item,
          selected: true,
        }))
      } catch (error) {
        console.error('載入購物車失敗：', error)
      }
    }

    // 運費：滿 1000 免運，未滿收 60
    const shippingFee = computed(() => {
      if (total.value >= 1000) {
        return 0 // 滿 1000，免運
      } else {
        return 60 // 未滿，收 60
      }
    })

    // 購物車總金額的計算屬性
    const total = computed(() => {
      let totalAmount = 0
      items.value.forEach((p) => {
        if (p.selected) {
          totalAmount += p.price * p.quantity
        }
      })
      return totalAmount
    })

    // 最終應付金額 = 商品總額 + 運費
    const finalTotal = computed(() => {
      return total.value + shippingFee.value
    })

    return {
      items,
      addItem,
      removeItem,
      changeQty,
      toggleSelect,
      selectedCount,
      selectedItems,
      total,
      shippingFee,
      finalTotal,
      loadCart,
    } // 回傳模組內的變數、方法、計算屬性
  },
)
