// chatHub.js：管理跟後端 ChatHub.cs 之間的 WebSocket 連線。
// 這個檔案只負責「連線本身」——建立連線、斷線、收訊息、送訊息——
// 不管畫面要長什麼樣子，畫面邏輯留給 ChatView.vue 自己處理，
// 這樣如果之後想在別的頁面（例如導覽列的訊息小鈴鐺）也用到即時收訊息的功能，
// 可以直接 import 這個檔案裡的函式，不用整份複製貼上。
import * as signalR from '@microsoft/signalr'
import { useAuthStore } from '@/stores/auth'

// HUB_BASE：ChatHub 掛在後端網域的 /hub/chat，不是走 /api 這條路徑
// （跟圖片、跟短網址 /s/{code} 是同樣的道理——這些都是後端網域上「/api 以外」的路徑）。
const HUB_BASE = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

// connection：整個 App 共用同一條 WebSocket 連線（不是每個元件各開一條），
// 模組頂層宣告的變數在整個前端專案裡是「唯一一份」，重複 import 這個檔案拿到的都是同一個。
let connection = null

// connectChat：建立（或重用已經建立好的）WebSocket 連線。
// accessTokenFactory：SignalR 用戶端沒辦法像一般 API 請求那樣夾帶 Authorization 標頭，
// 改成用這個函式，讓 SignalR 自己在需要驗證身分的時候，把目前的登入 Token
// 用查詢字串的方式帶到連線網址上（後端 Program.cs 裡有對應的設定去讀這個值）。
export const connectChat = async () => {
  if (connection && connection.state === signalR.HubConnectionState.Connected) {
    return connection
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hub/chat`, {
      accessTokenFactory: () => useAuthStore().token
    })
    // withAutomaticReconnect()：網路短暫斷線（例如切換 Wi-Fi、電腦睡眠喚醒）時，
    // SignalR 會自動嘗試重新連線，不用使用者自己重新整理網頁。
    .withAutomaticReconnect()
    .build()

  await connection.start()
  return connection
}

// disconnectChat：離開聊天室頁面時呼叫，把連線關掉，不要讓使用者離開頁面後
// 還一直佔著一條沒在用的 WebSocket 連線。
export const disconnectChat = async () => {
  if (connection) {
    await connection.stop()
    connection = null
  }
}

// onReceiveMessage：註冊「收到新訊息時要做什麼」的回呼函式，對應後端 ChatHub.cs 裡
// await Clients.User(...).SendAsync("ReceiveMessage", dto) 那一行——事件名稱
// "ReceiveMessage" 前後端要對得起來，這是 SignalR 用來配對「誰在監聽這個事件」的依據。
export const onReceiveMessage = (callback) => {
  if (!connection) return
  connection.on('ReceiveMessage', callback)
}

// offReceiveMessage：元件卸載時記得取消監聽，不然同一個 callback 可能被重複註冊好幾次
// （例如使用者切換好幾次對話對象、元件重新掛載），導致同一則訊息被處理好幾遍。
export const offReceiveMessage = (callback) => {
  if (!connection) return
  connection.off('ReceiveMessage', callback)
}

// sendChatMessage：呼叫後端 ChatHub.cs 的 SendMessage 方法，把訊息送出去。
// invoke 的第一個參數 "SendMessage" 要跟後端 Hub 裡的方法名稱一致（大小寫也要一致）。
export const sendChatMessage = async (receiverId, content) => {
  if (!connection) return
  await connection.invoke('SendMessage', { receiverId, content })
}