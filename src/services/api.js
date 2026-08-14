import axios from 'axios'
import {
  useAuthStore
} from '@/stores/auth'

// axios.create() 創建一個新的axios實例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, //環境變數
  timeout: 30000, //連線逾時

  withCredentials: true
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

      // 先記住「呼叫這支 API 之前是不是已經登入」，清除登入資料之前判斷才準確
      const wasLoggedIn = authStore.isLoggedIn

      // 清除 Pinia 裡的登入資料
      authStore.clearAuth()

      // 本來就沒登入（例如訪客瀏覽商品列表時背景呼叫購物車 API）不用跳「登入已過期」，
      // 那句話是給「本來有登入、但 token 過期/失效」的人看的，兩種情況不一樣。
      // 沒登入的情況交給呼叫端自己處理（例如各頁面的 try/catch，或按鈕點擊前的登入判斷）。
      if (wasLoggedIn) {
        alert('登入已過期，請重新登入')
        window.location.href = '/login'
      }
    } else if (status == 403) {
      alert('您沒有執行此操作的權限')
    } else if (status >= 500) {
      alert('伺服器發生錯誤，請稍後再試')
    }
    return Promise.reject(error)
  },
)

export default api