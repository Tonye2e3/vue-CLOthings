// 「團購購物車」的 Pinia store。
import { defineStore } from 'pinia'

export const useGroupCartStore = defineStore('groupCart', {
  state: () => ({
    // 購物車品項
    items: [],
  }),

  // getters：根據 state 自動算出來的值
  getters: {
    // 購物車裡總共有幾「項」商品（不是總件數，是有幾種不同商品）
    count: (state) => state.items.length,
  },

  // actions：用來「修改」state 的方法
  actions: {
    // 取得某個品項目前應該用的單價：有解鎖團購價就用團購價，沒有就用原價
    unitPriceOf(item) {
      return item.unlockedPrice ?? item.listPrice
    },

    // 加入購物車。如果購物車裡已經有這個商品了，數量 +1 並更新最新解鎖到的團購價；
    // 如果還沒有，就新增一筆，預設數量為 1
    addItem(product) {
      const existing = this.items.find((i) => i.id === product.id)
      if (existing) {
        existing.qty += 1
        existing.unlockedPrice = product.unlockedPrice
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          listPrice: product.listPrice,
          unlockedPrice: product.unlockedPrice,
          qty: 1,
        })
      }
    },

    // 從購物車移除某個商品
    removeItem(id) {
      const idx = this.items.findIndex((i) => i.id === id)
      if (idx !== -1) this.items.splice(idx, 1)
    },

    // 清空購物車（結帳成功後會用到）
    clear() {
      this.items = []
    },
  },
})