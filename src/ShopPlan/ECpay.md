# CLOthings 金流啟動 SOP

> 每次啟動專案、要測試/使用綠界金流時，照這份做。

---

## 每次要開的三個東西

### 1. 啟動後端
在 Visual Studio 按綠色播放 ▶
確認跑在 `https://localhost:7255`

### 2. 啟動前端
在前端專案資料夾的終端機：
```
npm run dev
```

### 3. 啟動 ngrok（cmd 步驟）
開「命令提示字元」(cmd)，打：
```
ngrok http https://localhost:7255 --url https://finite-murkiness-untimely.ngrok-free.dev
```

確認顯示：
- `Session Status: online`
- `Forwarding ... -> https://localhost:7255`（要指到 **7255**，不是 80）

⚠️ **ngrok 視窗要一直開著**，關掉付款通知就收不到。

---

## 重點提醒

- **token 不用每次設**：設過一次就記住了，直接打啟動指令即可。
  若真的報 token 錯，才重設：
  ```
  ngrok config add-authtoken 你的token
  ```

- **網址是固定的**：`finite-murkiness-untimely.ngrok-free.dev`
  所以後端 `PaymentController` 的 ReturnURL 設一次就好，不用每次改。

- **確認 ReturnURL 沒被改掉**（在 PaymentController 的 CreatePayment 裡）：
  ```
  https://finite-murkiness-untimely.ngrok-free.dev/api/payment/notify
  ```

---

## 常見錯誤對照表

| 症狀 | 原因 | 解法 |
|---|---|---|
| ngrok 顯示 502 Bad Gateway | Forwarding 指到 80 不是 7255 | 啟動指令要加 `https://localhost:7255` |
| 綠界通知沒進來 | ngrok 沒開 / 沒 online | 確認 ngrok 視窗 online |
| 付款後訂單沒更新 | ReturnURL 設錯 / 後端沒重啟 | 確認 ReturnURL 是 ngrok 網址，重啟後端 |
| CheckMacValue Error | HashKey/HashIV 錯或相反 | 確認 appsettings 的 ECPay 設定 |

---

## 完整測試流程

1. 三個都開好（後端 ▶、前端 npm run dev、ngrok online）
2. 前端登入 → 下一筆新訂單（狀態會是「待付款」）
3. 進訂單詳情 → 點「前往付款」→ 跳綠界
4. 綠界測試付款：
   - 測試信用卡卡號：`4311-9522-2222-2222`
   - 到期日：任意未來日期
   - 安全碼：任意 3 碼
5. 付完確認：
   - ngrok 視窗出現 `POST /api/payment/notify` → **200 OK**
   - 訂單狀態變「待出貨」

---

## 綠界測試環境資料（開發用）

| 項目 | 值 |
|---|---|
| MerchantID | 3002607 |
| HashKey | pwFHCqoQZGmho4w6 |
| HashIV | EkRm7iFT261dpevs |
| 付款網址 | https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5 |

> ⚠️ 這是測試值，可放 appsettings。
> 正式上線的 MerchantID/HashKey/HashIV 要放 secrets，**不能 commit 上 git**。

---

## 之後待辦（金流相關）

- [ ] 前端「付款完成頁」（綠界導回使用者的頁面，顯示付款結果）
- [ ] 申請正式綠界帳號（用公司統編）→ 換正式金鑰
- [ ] 正式環境的付款網址（把 payment-stage 改成 payment）