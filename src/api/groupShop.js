// 團購（GroupShop）模組的 API 呼叫，對應後端 GroupProductController / GroupCartController / GroupOrderController
import http from './http'

// ---- 商品 ----
// 取得商品列表，keyword 選填（商品名稱模糊搜尋，對應商品列表頁的搜尋框）
export const getGroupProducts = (keyword = '') =>
  http.get('/GroupProduct', { params: keyword ? { keyword } : {} }).then(res => res.data)

// 取得單一商品詳情
export const getGroupProduct = (id) =>
  http.get(`/GroupProduct/${id}`).then(res => res.data)

// ---- 購物車 ----
// 取得某個會員的購物車內容
export const getGroupCart = (userId) =>
  http.get(`/GroupCart/${userId}`).then(res => res.data)

// 加入購物車（同商品已存在的話，後端會自動累加數量）
export const addToGroupCart = (payload) =>
  http.post('/GroupCart', payload).then(res => res.data)

// 修改購物車某一項的數量
export const updateGroupCartQty = (groupCartId, quantity) =>
  http.put(`/GroupCart/${groupCartId}`, { quantity })

// 從購物車移除單一品項
export const removeGroupCartItem = (groupCartId) =>
  http.delete(`/GroupCart/${groupCartId}`)

// 清空某會員的購物車
export const clearGroupCart = (userId) =>
  http.delete(`/GroupCart/user/${userId}`)

// ---- 訂單 ----
// 結帳：把購物車內容送出成一筆訂單
export const checkoutGroupOrder = (payload) =>
  http.post('/GroupOrder/checkout', payload).then(res => res.data)

// 取得某會員的所有團購訂單
export const getGroupOrders = (userId) =>
  http.get(`/GroupOrder/${userId}`).then(res => res.data)

// 取得單一訂單詳情（編輯訂單 Modal 用）
export const getGroupOrderDetail = (orderId) =>
  http.get(`/GroupOrder/detail/${orderId}`).then(res => res.data)

// 取消訂單
export const cancelGroupOrder = (orderId) =>
  http.put(`/GroupOrder/${orderId}/cancel`)

// 編輯訂單（收件人姓名 + 各品項數量）
export const editGroupOrder = (orderId, payload) =>
  http.put(`/GroupOrder/${orderId}`, payload).then(res => res.data)
