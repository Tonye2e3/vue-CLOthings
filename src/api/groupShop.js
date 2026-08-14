// 團購（GroupShop）模組的 API 呼叫，對應後端 GroupProductController / GroupCartController / GroupOrderController
import http from '@/services/api'

// ---- 商品 ----
// 取得商品列表，keyword 選填（商品名稱模糊搜尋，對應商品列表頁的搜尋框）
export const getGroupProducts = (keyword = '') =>
  http.get('/GroupProduct', { params: keyword ? { keyword } : {} }).then(res => res.data)

// 取得單一商品詳情
export const getGroupProduct = (id) =>
  http.get(`/GroupProduct/${id}`).then(res => res.data)

// ---- 購物車 ----
// 取得「目前登入者」的購物車內容：UserId 後端從 JWT 取得，前端不用也不能指定
export const getGroupCart = () =>
  http.get('/GroupCart').then(res => res.data)

// 加入購物車（同商品已存在的話，後端會自動累加數量）
export const addToGroupCart = (payload) =>
  http.post('/GroupCart', payload).then(res => res.data)

// 修改購物車某一項的數量
export const updateGroupCartQty = (groupCartId, quantity) =>
  http.put(`/GroupCart/${groupCartId}`, { quantity })

// 從購物車移除單一品項
export const removeGroupCartItem = (groupCartId) =>
  http.delete(`/GroupCart/${groupCartId}`)

// 清空「目前登入者」的購物車
export const clearGroupCart = () =>
  http.delete('/GroupCart/me')

// ---- 訂單 ----
// 結帳：把購物車內容送出成一筆訂單
export const checkoutGroupOrder = (payload) =>
  http.post('/GroupOrder/checkout', payload).then(res => res.data)

// 取得「目前登入者」的所有團購訂單：UserId 後端從 JWT 取得
export const getGroupOrders = () =>
  http.get('/GroupOrder/mine').then(res => res.data)

// 取得單一訂單詳情（編輯訂單 Modal 用）
export const getGroupOrderDetail = (orderId) =>
  http.get(`/GroupOrder/detail/${orderId}`).then(res => res.data)

// 取消訂單
export const cancelGroupOrder = (orderId) =>
  http.put(`/GroupOrder/${orderId}/cancel`)

// 編輯訂單（收件人姓名 + 各品項數量）
export const editGroupOrder = (orderId, payload) =>
  http.put(`/GroupOrder/${orderId}`, payload).then(res => res.data)

// ---- 訂單客服 ----
// 買家針對某筆訂單提問
export const createCustomerService = (orderId, payload) =>
  http.post(`/GroupCustomerService/order/${orderId}`, payload).then(res => res.data)

// 買家查詢自己這筆訂單送出過的客服紀錄
export const getCustomerServiceByOrder = (orderId) =>
  http.get(`/GroupCustomerService/order/${orderId}`).then(res => res.data)

// ---- 模擬付款 ----
// 建立一筆待付款（還沒建立訂單），成功會拿到 paymentId 跟應付金額
export const createPayment = (payload) =>
  http.post('/GroupPayment/create', payload).then(res => res.data)

// 「模擬付款頁」打開時，查詢這筆待付款的金額、品項
export const getPendingPayment = (paymentId) =>
  http.get(`/GroupPayment/${paymentId}`).then(res => res.data)

// 確認付款結果：success 為 true 才會真的建立訂單
export const confirmPayment = (paymentId, success) =>
  http.post(`/GroupPayment/${paymentId}/confirm`, { success }).then(res => res.data)

// ---- LINE Pay（真的接 Sandbox，不是模擬付款）----
// 回傳 LINE Pay 的付款頁網址，前端拿到後要整頁導過去（window.location.href），不能用 AJAX 導頁
export const requestLinePay = (payload) =>
  http.post('/GroupPayment/linepay/request', payload).then(res => res.data)