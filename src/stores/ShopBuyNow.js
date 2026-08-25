import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBuyNowStore = defineStore('buyNow', () => {
  const item = ref(null)   // 立即購買的商品（一個）

  function setItem(product) {
    item.value = product
  }
  function clear() {
    item.value = null
  }

  return { item, setItem, clear }
})