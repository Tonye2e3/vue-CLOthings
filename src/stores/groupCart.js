// 「團購購物車」的 Pinia store。
// UserId 不再由前端決定：登入狀態統一用 useAuthStore()，
// 購物車內容也一律由後端依 JWT 判斷是誰的，前端只需要呼叫 API、不用再自己組 userId。
import { defineStore } from 'pinia'
import { getGroupCart, addToGroupCart, updateGroupCartQty, removeGroupCartItem, clearGroupCart } from '@/api/groupShop'

export const useGroupCartStore = defineStore('groupCart', {
  state: () => ({
    // 購物車品項，每一項長這樣：
    // { groupCartId, id(=groupProductId), name, imageUrl, listPrice, unitPrice, unlocked, qty }
    items: [],
    loaded: false // 是否已經跟後端同步過，避免畫面一進來就是空的
  }),

  getters: {
    // 購物車裡總共有幾「項」商品（不是總件數，是有幾種不同商品）
    count: (state) => state.items.length
  },

  actions: {
    // 取得某個品項目前應該用的單價：後端已經算好 unitPrice 了，直接回傳即可
    unitPriceOf(item) {
      return item.unitPrice
    },

    // 從後端把目前登入者的購物車內容抓下來，蓋掉本地的 items
    async fetchCart() {
      const rows = await getGroupCart()
      this.items = rows.map(r => ({
        groupCartId: r.groupCartId,
        id: r.groupProductId,
        name: r.name,
        imageUrl: r.imageUrl,
        listPrice: r.listPrice,
        unitPrice: r.unitPrice,
        unlocked: r.unlocked,
        qty: r.quantity
      }))
      this.loaded = true
    },

    // 加入購物車。product 至少要有 id（GroupProductId）。
    // 後端會自動判斷購物車裡有沒有這個商品：有的話數量 +1，沒有的話新增一筆
    async addItem(product) {
      const saved = await addToGroupCart({
        groupProductId: product.id,
        quantity: 1
      })

      const existing = this.items.find(i => i.groupCartId === saved.groupCartId)
      const mapped = {
        groupCartId: saved.groupCartId,
        id: saved.groupProductId,
        name: saved.name,
        imageUrl: saved.imageUrl,
        listPrice: saved.listPrice,
        unitPrice: saved.unitPrice,
        unlocked: saved.unlocked,
        qty: saved.quantity
      }
      if (existing) {
        Object.assign(existing, mapped)
      } else {
        this.items.push(mapped)
      }
    },

    // 修改購物車某一項的數量（購物車頁的數量輸入框會用到）
    // 團購單價是「已成立訂單件數 + 購物車件數」一起算出來的，改自己的數量有可能連帶讓
    // 自己（甚至購物車裡同商品不同規格的其他品項）跨過門檻、單價跟著變，
    // 所以後端存檔成功後要整包重新 fetchCart()，不能只手動改本地這一項的 qty，
    // 不然畫面上顯示的單價／小計會是改之前的舊值，跟結帳頁最後算出來的金額對不上
    async updateQty(id, qty) {
      const item = this.items.find(i => i.id === id)
      if (!item) return
      const safeQty = Math.max(1, qty)
      await updateGroupCartQty(item.groupCartId, safeQty)
      await this.fetchCart()
    },

    // 從購物車移除某個商品
    async removeItem(id) {
      const idx = this.items.findIndex(i => i.id === id)
      if (idx === -1) return
      await removeGroupCartItem(this.items[idx].groupCartId)
      this.items.splice(idx, 1)
    },

    // 清空購物車（結帳成功後會用到）
    async clear() {
      await clearGroupCart()
      this.items = []
    }
  }
})
