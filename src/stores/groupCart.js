// ====================================================================
// 這是「團購購物車」的 Pinia store。
//
// 什麼是 store？
// 可以把它想成一個「全站共用的資料倉庫」。原本每個頁面各自用
// localStorage 讀寫購物車資料、還要自己處理 JSON.parse 失敗的狀況，
// 現在改成大家都跟同一個 store 拿資料、改資料，store 本身是響應式的，
// 資料一變，所有正在用它的頁面畫面都會自動更新。
//
// 跟課堂教的 useCartStore() 是同一套概念，只是這裡多了「團購價」
// （unlockedPrice）跟「原價」（listPrice）兩種價格要處理。
//
// 注意：這個 store 目前只把資料存在「瀏覽器記憶體」裡，不會存進
// localStorage。這代表：在同一次瀏覽（也就是頁面之間用 router-link
// 切換，沒有整頁重新整理）的情況下，購物車資料會一直都在；但如果使用者
// 按 F5 重新整理，或關掉分頁再打開，購物車就會被清空。這跟課堂範例的
// useCartStore() 行為是一致的，先求「觀念正確、程式碼乾淨」，之後如果
// 想要「重新整理也不會消失」，可以再另外加裝 persist 外掛，那是進階內容。
// ====================================================================

import { defineStore } from 'pinia'

export const useGroupCartStore = defineStore('groupCart', {
  // state：store 裡存放的資料本體
  state: () => ({
    // 購物車品項，每一項長這樣：
    // { id, name, imageUrl, listPrice, unlockedPrice, qty }
    items: [],
  }),

  // getters：根據 state 自動算出來的值，用法跟 computed 很像
  getters: {
    // 購物車裡總共有幾「項」商品（不是總件數，是有幾種不同商品）
    count: (state) => state.items.length,
  },

  // actions：用來「修改」state 的方法，畫面上的按鈕都呼叫這裡的方法，
  // 不要直接在元件裡用 push/splice 亂改 state，養成習慣會比較不容易出錯
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