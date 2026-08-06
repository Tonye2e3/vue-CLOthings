// ====================================================================
// 這是「已成立訂單累計件數」的 Pinia store。
//
// 這筆資料代表什麼？
// 使用者按下「確認送出訂單」之後，這筆訂單裡每個商品的件數，就要「永久」
// 算進該商品的團購進度裡——即使購物車被清空、使用者重新整理頁面，這個數字
// 也不能不見。取消訂單時，則要把當初算進去的件數扣回來。
//
// 為什麼要獨立成一個 store，而不是像 groupCart.js 一樣單純放在記憶體？
// 因為「已送出的訂單」邏輯上比購物車更接近「訂單紀錄」本身——使用者重新整理
// 頁面、關掉分頁再打開，這筆數字都應該還在，所以這個 store 內部會自己讀寫
// localStorage，但這件事對外是「隱形」的：其他頁面只需要呼叫
// committedQtyOf(id)、add(items)、subtract(items)，不用知道底層是怎麼存的。
//
// 之前這個邏輯分別複製在 GroupCheckoutView.vue（送出訂單時 +=）跟
// GroupOrdersView.vue（取消訂單時 -=）兩個檔案裡，首頁跟商品詳情頁完全沒有
// 讀到這筆資料，才會發生「送出訂單後，首頁已訂購件數沒有同步更新」的問題。
// 現在四個頁面都改成跟這個 store 拿資料，就不會再各自漏掉了。
// ====================================================================

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
    // 一開始就從 localStorage 讀進來，這樣重新整理頁面資料也不會不見
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
    // Math.max(0, ...) 是為了避免扣過頭變成負數
    subtract(items) {
      items.forEach((i) => {
        this.quantities[i.id] = Math.max(0, (this.quantities[i.id] || 0) - i.qty)
      })
      this.persist()
    },
  },
})