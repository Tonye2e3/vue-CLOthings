import { defineStore } from 'pinia' //引入pinia的模組
import { computed, ref } from 'vue' //引入vue的內建模組

//定義一個模組屬於狀態管理
// export const useCartStore = defineStore(狀態名稱, 可以用什麼變數、方法)

export const useCartStore = defineStore(
  'cart',
  () => {
    // 內可放變數、方法、計算屬性

    // 存放商品的變數，其他元件可以透過此變數得知購物車內容
    const items = ref([]) // ref() 建立一個物件，並且可以監聽變化

    // 增加商品的方法，將商品加入購物車
    function addItem(product) {
      const existItem = items.value.find(
        (p) => p.productSpecificationId === product.productSpecificationId,
      ) // 這個id是否跟我已存在的陣列中有相同的規格id，如果找不到就會是null

      if (existItem) {
        // 商品已存在item之中，如果有找到相同的id，就會執行這段
        existItem.quantity += product.quantity // 將該商品的數量加1
      } else {
        // 商品不存在item之中，如果沒有找到相同的id，就會執行這段
        items.value.push(product) // // 陣列塞一個物件，將商品加入購物車
      }
    }

    // 移除商品的方法，將商品從購物車移除
    function removeItem(productSpecificationId) {
      const index = items.value.findIndex(
        (i) => i.productSpecificationId === productSpecificationId,
      )
      // 找到該商品的索引值，當前陣列當中，如果有相同id則傳到index，如果沒有則傳回-1
      if (index == -1) {
        // 如果沒有找到相同的id，什麼都不用做
        return
      } else {
        // 如果找到相同的id
        items.value.splice(index, 1) // 將該商品從陣列中移除，從第index索引開始，刪除1個元素
        // 可加入二重確認是否刪除
      }
    }

    // 增減商品數量的方法
    function changeQty(productSpecificationId, qty) {
      const existItem = items.value.find((p) => p.productSpecificationId === productSpecificationId)
      if (existItem) {
        // 商品已存在item之中，如果有找到相同的id，就會執行這段
        existItem.quantity += qty // 將該商品的數量加傳入的qty
        if (existItem.quantity <= 0) {
          removeItem(productSpecificationId)
        }
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
      
    } // 回傳模組內的變數、方法、計算屬性
  },
  { persist: true },
  // 加上persist:true，代表這個狀態模組要持久化儲存，當頁面刷新時，資料不會消失
)
