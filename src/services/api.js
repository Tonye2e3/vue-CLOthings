import axios from 'axios'
import {
  useAuthStore
} from '@/stores/auth'

// ======================================================
// Axios 實例
// ======================================================
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,

  // 讓瀏覽器可以攜帶 HttpOnly Cookie
  // Refresh Token 就是存在 Cookie 裡
  withCredentials: true,
})

// 確保同一時間只會有一個 refresh request
let refreshPromise = null

// ======================================================
// Request Interceptor
// 每次送 API 前，自動把 Access Token 放進 Header
// ======================================================
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },

  (error) => {
    return Promise.reject(error)
  },
)

// ======================================================
// Response Interceptor
// ======================================================
api.interceptors.response.use(
  // API 正常成功，直接把 response 傳回去
  (response) => response,

  // API 發生錯誤
  async (error) => {
    // 取得錯誤的狀態碼
    const status = error.response?.status
    // 取得原本發生錯誤的 request config
    const originalRequest = error.config
    // 取得原本發生錯誤的 request URL
    const requestUrl = originalRequest?.url

    // ==================================================
    // 1. Login 自己回 401
    // 帳密錯誤，不應該執行 Refresh Token
    // 登入失敗
    // ==================================================
    if (status === 401 && requestUrl?.includes('/User/login')) {
      return Promise.reject(error)
    }

    // ==================================================
    // 2. Refresh API 自己回 401
    // 代表 Refresh Token 也失效了
    // 絕對不能再次呼叫 refresh，否則會無限循環
    // ==================================================
    if (status === 401 && requestUrl?.includes('/User/refresh')) {
      const authStore = useAuthStore()

      authStore.clearAuth()

      alert('登入已過期，請重新登入')

      window.location.href = '/login'

      return Promise.reject(error)
    }

    // ==================================================
    // 3. 一般 API 發生 401
    // 嘗試使用 Refresh Token 取得新的 Access Token
    // ==================================================
    if (status === 401 && !originalRequest._retry) {
      const authStore = useAuthStore()

      // 如果原本就沒有登入
      // 不需要嘗試 refresh
      if (!authStore.isLoggedIn) {
        return Promise.reject(error)
      }

      // 標記這個 Request 已經 retry 過
      // 防止無限循環
      originalRequest._retry = true

      try {
        // ==============================================
        // Refresh Lock
        // ==============================================

        if (!refreshPromise) {
          refreshPromise = api
            .post('/User/refresh')
            .then((response) => {
              const newToken = response.data.token

              // 更新 Pinia Access Token
              authStore.setToken(newToken)

              return newToken
            })
            .finally(() => {
              // Refresh 完成，解除鎖定
              refreshPromise = null
            })
        }

        // ==============================================
        // 所有 401 都等待同一個 Refresh
        // ==============================================

        const newToken = await refreshPromise

        // ==============================================
        // 使用新的 Access Token
        // ==============================================

        originalRequest.headers.Authorization = `Bearer ${newToken}`

        // ==============================================
        // 重送原本失敗的 Request
        // ==============================================

        return api(originalRequest)

      } catch (refreshError) {
        authStore.clearAuth()

        alert('登入已過期，請重新登入')

        window.location.href = '/login'

        return Promise.reject(refreshError)
      }
    }

    // ==================================================
    
   
    // ==================================================
    // 5. Server Error
    // ==================================================
    else if (status >= 500) {
      alert('伺服器發生錯誤，請稍後再試')
    }

    return Promise.reject(error)
  },
)

export default api