// 這是「已成立訂單累計件數」的 Pinia store。


import { defineStore } from 'pinia'

const COMMITTED_KEY = 'cloCommitted'

// 從 localStorage 讀取目前的累計件數，格式是 { 商品id: 件數 }，例如 { 1: 5, 7: 6 }
function readCommitted() {
  try {
    const saved = JSON.parse(localStorage.getItem(COMMITTED_KEY) || '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    // 讀取失敗（例如資料被亂改過），就當作目前沒有任何已成立的件數
    return {}
  }
}

export const useGroupCommittedStore = defineStore('groupCommitted', {
  state: () => ({
    // quantities 長這樣：{ 1: 5, 7: 6 } ← key 是商品 id，value 是累計件數
    quantities: readCommitted(),
  }),

  actions: {
    // 取得某個商品目前累計的「已成立訂單」件數，沒有紀錄就是 0
    committedQtyOf(id) {
      return this.quantities[id] || 0
    },

    // 把目前的 quantities 存回 localStorage，每次修改完都要呼叫一次
    persist() {
      localStorage.setItem(COMMITTED_KEY, JSON.stringify(this.quantities))
    },

    // 訂單送出成功時呼叫：items 是 [{ id, qty }, ...]，把每一項的件數累加進去
    add(items) {
      items.forEach((i) => {
        this.quantities[i.id] = (this.quantities[i.id] || 0) + i.qty
      })
      this.persist()
    },

    // 取消訂單、或編輯訂單把數量調低時呼叫：把對應件數扣回去
    // Math.max是為了避免扣過頭變成負數
    subtract(items) {
      items.forEach((i) => {
        this.quantities[i.id] = Math.max(0, (this.quantities[i.id] || 0) - i.qty)
      })
      this.persist()
    },
  },
})