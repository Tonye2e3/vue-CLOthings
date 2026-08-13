import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// axios.create() 創建一個新的axios實例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, //環境變數
  timeout: 30000, //連線逾時
})

//請求攔截器
api.interceptors.request.use(
  (config) => {
    //這是之後登入取得token放的地方
    const token = useAuthStore().token
    //如果token存在，則將token放入請求頭中
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

//回應攔截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url

    // 登入 API 自己的 401，交給 LoginView 處理
    if (status === 401 && requestUrl?.includes('/User/login')) {
      return Promise.reject(error)
    }

    if (status === 401) {
      const authStore = useAuthStore()

      // 清除 Pinia 裡的登入資料
      authStore.clearAuth()

      alert('登入已過期，請重新登入')

      // 回登入頁
      window.location.href = '/login'
    } else if (status == 403) {
      alert('您沒有執行此操作的權限')
    } else if (status >= 500) {
      alert('伺服器發生錯誤，請稍後再試')
    }
    return Promise.reject(error)
  },
)

export default api
