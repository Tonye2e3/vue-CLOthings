// 團購（GroupShop）模組「管理端」的 API 呼叫
// 買家端的 API 在 groupShop.js，這支是給店家/管理員後台頁面用的
import http from './http'

// ---- 商品管理 ----
export const getProductForEdit = (id) => http.get(`/GroupProduct/${id}/edit`).then(res => res.data)
export const createProduct = (payload) => http.post('/GroupProduct', payload).then(res => res.data)
export const updateProduct = (id, payload) => http.put(`/GroupProduct/${id}`, payload)
export const deleteProduct = (id) => http.delete(`/GroupProduct/${id}`)

// ---- 團購階層管理 ----
export const getTiers = (productId) => http.get(`/GroupProduct/${productId}/tiers`).then(res => res.data)
export const addTier = (productId, payload) => http.post(`/GroupProduct/${productId}/tiers`, payload).then(res => res.data)
export const updateTier = (tierId, payload) => http.put(`/GroupProduct/tiers/${tierId}`, payload)
export const deleteTier = (tierId) => http.delete(`/GroupProduct/tiers/${tierId}`)

// ---- 商品規格管理 ----
export const getSpecifications = (productId) => http.get(`/GroupProduct/${productId}/specifications`).then(res => res.data)
export const addSpecification = (productId, payload) => http.post(`/GroupProduct/${productId}/specifications`, payload).then(res => res.data)
export const deleteSpecification = (specId) => http.delete(`/GroupProduct/specifications/${specId}`)

// ---- 下拉選單 ----
export const getCategories = () => http.get('/GroupLookup/categories').then(res => res.data)
export const getSuppliers = () => http.get('/GroupLookup/suppliers').then(res => res.data)

// ---- 物流商 ----
export const getShippers = () => http.get('/GroupShipper').then(res => res.data)
export const createShipper = (payload) => http.post('/GroupShipper', payload).then(res => res.data)

// ---- 訂單管理 ----
// status 選填：帶了就只回傳該狀態的訂單
export const getAllOrders = (status = '') =>
  http.get('/GroupOrder/admin/all', { params: status ? { status } : {} }).then(res => res.data)
export const updateOrderStatus = (orderId, status) => http.put(`/GroupOrder/${orderId}/status`, { status })
export const assignShipper = (orderId, payload) => http.put(`/GroupOrder/${orderId}/shipper`, payload)
