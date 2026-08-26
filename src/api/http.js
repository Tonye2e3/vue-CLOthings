// 共用的 axios 實例
// 之後其他模組（Shop、Community...）如果也要接後端，可以共用這支，不用每個 store 各自寫一次
import axios from 'axios'

// API 網址優先讀 .env 裡設定的 VITE_API_URL（對照你們之前建的 .env / .env.production / .env.sit）
// 沒設定的話，先預設成 ASP.NET Core 開發環境常見的 https port，記得改成你們實際的後端網址
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'https://localhost:7000/api'

export const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default http
