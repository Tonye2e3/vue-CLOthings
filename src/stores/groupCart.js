// 「團購購物車」的 Pinia store。
// 跟原本的版本差別：原本是直接把 items 存在 localStorage，現在改成呼叫後端 API，
// items 裡的內容（包含團購價 unitPrice）都是後端算好回傳的，前端不用再自己算一次。
import { defineStore } from 'pinia'
import { getGroupCart, addToGroupCart, updateGroupCartQty, removeGroupCartItem, clearGroupCart } from '@/api/groupShop'

// 目前登入會員的 userId：先沿用你們登入後存 memberName 的做法，
// 這裡假設登入時也會把 userId 存進 localStorage（'userId'）。
// TODO：如果你們登入流程還沒有存 userId，記得在登入成功那一步加上
// localStorage.setItem('userId', 回傳的會員 id)
const getUserId = () => Number(localStorage.getItem('userId')) || 1

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

    // 從後端把目前購物車內容抓下來，蓋掉本地的 items
    async fetchCart() {
      const rows = await getGroupCart(getUserId())
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
        userId: getUserId(),
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
    async updateQty(id, qty) {
      const item = this.items.find(i => i.id === id)
      if (!item) return
      const safeQty = Math.max(1, qty)
      await updateGroupCartQty(item.groupCartId, safeQty)
      item.qty = safeQty
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
      await clearGroupCart(getUserId())
      this.items = []
    }
  }
})
