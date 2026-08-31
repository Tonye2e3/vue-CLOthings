<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/api'
import { isValidPassword, isValidPhone, isValidEmail } from '@/utils/UserValidator'
import QRCode from 'qrcode'

const userData = reactive({
  userId: null,
  username: '',
  account: '',
  email: '',
  emailVerified: false,
  phone: '',
  countryCode: '',
  twoFactorEnabled: false,
})

const backupData = reactive({})
// 編輯模式
const isEditing = ref(false)
// 修改密碼模式
const isChangingPassword = ref(false)

// 二階段驗證
const isSettingUpTwoFactor = ref(false)
// 二階段驗證資料
const twoFactorSetup = reactive({
  secret: '',
  otpAuthUrl: '',
  code: '',
})

// 是否正在進行停用 2FA
const isDisablingTwoFactor = ref(false)
// 停用 2FA 時輸入的驗證碼
const disableTwoFactorCode = ref('')

// QR Code 圖片
const twoFactorQrCode = ref('')

// 修改密碼表單資料
const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// ==============================
// 取得目前登入會員資料
// GET /api/User/me
async function getUserData() {
  try {
    const resp = await api.get('/User/me')

    Object.assign(userData, resp.data)
  } catch (error) {
    console.error('取得帳戶資料失敗：', error)
  }
}

// ==============================
// 取得二階段驗證狀態
// GET /api/User/2fa/status
async function getTwoFactorStatus() {
  try {
    const resp = await api.get('/User/2fa/status')

    userData.twoFactorEnabled = resp.data.twoFactorEnabled
  } catch (error) {
    console.error('取得二階段驗證狀態失敗：', error)
  }
}

// ==============================
// 開始設定二階段驗證
// GET /api/User/2fa/setup
async function setupTwoFactor() {
  try {
    const resp = await api.get('/User/2fa/setup')

     // 🟢 暫時新增
    console.log('2FA setup 回傳：', resp.data)

    twoFactorSetup.secret = resp.data.secret
    twoFactorSetup.otpAuthUrl = resp.data.otpAuthUrl
    twoFactorSetup.code = ''

     // 把後端提供的 otpAuthUrl 轉成 QR Code
    twoFactorQrCode.value = await QRCode.toDataURL(
      twoFactorSetup.otpAuthUrl
    )

    isSettingUpTwoFactor.value = true
  } catch (error) {
    console.error('建立二階段驗證設定失敗：', error)

    alert(error.response?.data || '建立二階段驗證設定失敗')
  }
}

// 確認並啟用二階段驗證
async function enableTwoFactor() {
  // 前端先檢查格式
  if (!/^\d{6}$/.test(twoFactorSetup.code)) {
    alert('請輸入 6 位數驗證碼')
    return
  } 
  try {
    const resp = await api.post('/User/2fa/enable', {
      code: twoFactorSetup.code,
    })

    // 更新畫面狀態
    userData.twoFactorEnabled = resp.data.twoFactorEnabled

    // 關閉設定區域
    isSettingUpTwoFactor.value = false

    // 清除設定資料
    twoFactorSetup.secret = ''
    twoFactorSetup.otpAuthUrl = ''
    twoFactorSetup.code = ''
    twoFactorQrCode.value = ''

    alert('二階段驗證啟用成功')
  } catch (error) {
    console.error('啟用二階段驗證失敗：', error)

    if (error.response?.status === 400) {
      alert(error.response?.data || '驗證碼錯誤，請重新輸入')
    } else {
      alert(error.response?.data || '啟用二階段驗證失敗')
    }
  }
}

// 顯示停用 2FA 驗證區
function showDisableTwoFactor() {
  disableTwoFactorCode.value = ''
  isDisablingTwoFactor.value = true
}

// 停用二階段驗證
async function disableTwoFactor() {
  // 前端先檢查格式
  if (!/^\d{6}$/.test(disableTwoFactorCode.value)) {
    alert('請輸入 6 位數驗證碼')
    return
  }

  try {
    const resp = await api.post('/User/2fa/disable', {
      code: disableTwoFactorCode.value,
    })

    // 更新目前狀態
    userData.twoFactorEnabled = resp.data.twoFactorEnabled

    // 收起停用驗證區
    isDisablingTwoFactor.value = false

    // 清除驗證碼
    disableTwoFactorCode.value = ''

    alert('二階段驗證已停用')
  } catch (error) {
    console.error('停用二階段驗證失敗：', error)

    if (error.response?.status === 400) {
      alert(error.response?.data || '驗證碼錯誤，請重新輸入')
    } else {
      alert(error.response?.data || '停用二階段驗證失敗')
    }
  }
}

// ==============================
// 重新寄送 Email 驗證信
// POST /api/User/resend-verification-email
async function resendVerificationEmail() {
  try {
    await api.post('/User/resend-verification-email')

    alert('驗證信已重新寄出，請至 Email 收件匣確認')
  } catch (error) {
    console.error('重新寄送驗證信失敗：', error)

    if (error.response?.status === 400) {
      alert(error.response.data || '此 Email 已完成驗證')
      return
    }

    alert('驗證信寄送失敗，請稍後再試')
  }
}

// ==============================
// 頁面載入
onMounted(() => {
  getUserData()
  getTwoFactorStatus()
})

// ==============================
// 進入編輯模式
const toggleEdit = () => {
  Object.assign(backupData, userData)

  isEditing.value = true
}

// ==============================
// 取消編輯
const cancel = () => {
  Object.assign(userData, backupData)

  isEditing.value = false
}

// ==============================
// 儲存帳戶資料
// PUT /api/User/me
const save = async () => {
  const phoneError = isValidPhone(userData.phone)
  const emailError = isValidEmail(userData.email)

  if (phoneError || emailError) {
    alert('請修正錯誤後再儲存')
    return
  }

  const data = {
    username: userData.username,
    email: userData.email,
    phone: userData.phone,
    countryCode: userData.countryCode,
  }

  try {
    await api.put('/User/me', data)

    await getUserData() // 重新取得最新資料，確保畫面顯示正確

    // 儲存成功後更新備份
    Object.assign(backupData, userData)

    alert('帳戶資料修改成功')

    isEditing.value = false
  } catch (error) {
    console.error('修改帳戶資料失敗：', error)
    console.error('後端錯誤內容：', error.response?.data)

    alert(error.response?.data || '帳戶資料修改失敗')
  }
}

// ==============================
// 清除密碼欄位
const clearPasswordForm = () => {
  passwordData.currentPassword = ''
  passwordData.newPassword = ''
  passwordData.confirmPassword = ''
}

// ==============================
// 取消修改密碼
const cancelChangePassword = () => {
  clearPasswordForm()

  isChangingPassword.value = false
}

// ==============================
// 修改密碼
// PUT /api/User/me/password
const changePassword = async () => {
  // 防止空白
  if (!passwordData.currentPassword) {
    alert('請輸入目前密碼')
    return
  }

  const passwordError = isValidPassword(passwordData.newPassword)

  if (passwordError) {
    alert(passwordError)
    return
  }

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    alert('兩次輸入的新密碼不一致')
    return
  }

  const data = {
    currentPassword: passwordData.currentPassword,
    newPassword: passwordData.newPassword,
  }

  try {
    await api.put('/User/me/password', data)

    alert('密碼修改成功')

    clearPasswordForm()

    isChangingPassword.value = false
  } catch (error) {
    console.error('修改密碼失敗：', error)

    if (error.response?.status === 400) {
      alert(error.response.data || '目前密碼錯誤')
      return
    }

    alert('密碼修改失敗')
  }
}
</script>

<template>
  <div class="user-card">
    <!-- ==============================
         Header
    =============================== -->

    <div class="user-card-header">
      <div>
        <p class="user-section-label">ACCOUNT</p>

        <h2 class="user-card-title">帳戶資料</h2>

        <p class="user-card-description">管理你的登入帳戶與基本聯絡資訊。</p>
      </div>

      <button v-if="!isEditing" type="button" class="user-btn user-btn-outline" @click="toggleEdit">
        編輯資料
      </button>
    </div>

    <!-- ==============================
         顯示模式
    =============================== -->

    <div class="user-info" v-if="!isEditing">
      <div class="user-info-grid">
        <!-- 帳號 -->

        <div class="user-info-item">
          <span class="user-info-label"> 帳號 </span>

          <span class="user-info-value">
            {{ userData.account || '未設定' }}
          </span>
        </div>

        <!-- 暱稱 -->

        <div class="user-info-item">
          <span class="user-info-label"> 暱稱 </span>

          <span class="user-info-value">
            {{ userData.username || '未設定' }}
          </span>
        </div>

        <!-- Email -->

        <div class="user-info-item">
          <span class="user-info-label">Email</span>

          <div class="email-info">
            <span class="user-info-value">
              {{ userData.email || '未設定' }}
            </span>

            <!-- 已驗證 -->
            <span
              v-if="userData.email && userData.emailVerified"
              class="email-status email-status-verified"
            >
              ✓ 已驗證
            </span>

            <!-- 尚未驗證 -->
            <template v-if="userData.email && !userData.emailVerified">
              <button
                type="button"
                class="email-resend-btn"
                title="點擊寄送驗證信"
                @click="resendVerificationEmail"
              >
                <span class="email-status email-status-unverified"> 立即驗證 </span>
              </button>
            </template>
          </div>
        </div>
        <!-- 電話 -->

        <div class="user-info-item">
          <span class="user-info-label"> 電話 </span>

          <span class="user-info-value">
            {{ userData.phone || '未設定' }}
          </span>
        </div>
      </div>

      <!-- ==============================
           修改密碼
      =============================== -->

      <div class="user-divider"></div>

      <div class="password-section">
        <div class="password-header">
          <div>
            <h3 class="password-title">登入密碼</h3>

            <p class="password-description">建議定期更新密碼以保護帳戶安全。</p>
          </div>

          <button
            v-if="!isChangingPassword"
            type="button"
            class="user-btn user-btn-secondary"
            @click="isChangingPassword = true"
          >
            修改密碼
          </button>
        </div>

        <!-- 密碼修改表單 -->

        <div v-if="isChangingPassword" class="password-form">
          <div class="user-form-group">
            <label class="user-form-label"> 目前密碼 </label>

            <input
              v-model="passwordData.currentPassword"
              type="password"
              class="form-control"
              placeholder="請輸入目前密碼"
            />
          </div>

          <div class="user-form-group">
            <label class="user-form-label"> 新密碼 </label>

            <input
              v-model="passwordData.newPassword"
              type="password"
              class="form-control"
              placeholder="請輸入新密碼"
            />

            <span v-if="passwordData.newPassword" class="validation-error">
              {{ isValidPassword(passwordData.newPassword) }}
            </span>
          </div>

          <div class="user-form-group">
            <label class="user-form-label"> 確認新密碼 </label>

            <input
              v-model="passwordData.confirmPassword"
              type="password"
              class="form-control"
              placeholder="請再次輸入新密碼"
            />

            <span
              v-if="
                passwordData.confirmPassword &&
                passwordData.newPassword !== passwordData.confirmPassword
              "
              class="validation-error"
            >
              兩次輸入的新密碼不一致
            </span>
          </div>

          <div class="user-actions">
            <button type="button" class="user-btn user-btn-secondary" @click="cancelChangePassword">
              取消
            </button>

            <button type="button" class="user-btn user-btn-primary" @click="changePassword">
              確定修改
            </button>
          </div>
        </div>
      </div>

      <!-- ==============================
     二階段驗證
=============================== -->

<div class="user-divider"></div>

<div class="two-factor-section">
  <div class="two-factor-header">
    <div>
      <h3 class="password-title">二階段驗證</h3>

      <p class="password-description">
        使用 Authenticator 驗證碼，加強帳戶登入安全性。
      </p>
    </div>

    <!-- 已啟用 -->
    <div v-if="userData.twoFactorEnabled" class="two-factor-action">
      <span class="two-factor-status two-factor-enabled">
        ✓ 已啟用
      </span>

      <button
        type="button"
        class="user-btn user-btn-secondary"
        @click="showDisableTwoFactor"
      >
        停用
      </button>
    </div>

    <!-- 未啟用 -->
    <div v-else class="two-factor-action">
      <span class="two-factor-status two-factor-disabled">
        未啟用
      </span>

      <button
        type="button"
        class="user-btn user-btn-primary"
        @click="setupTwoFactor"
      >
        啟用
      </button>
    </div>
  </div>

  <!-- 停用二階段驗證確認區 -->
<div
  v-if="userData.twoFactorEnabled && isDisablingTwoFactor"
  class="two-factor-setup"
>
  <p class="two-factor-setup-title">
    停用二階段驗證
  </p>

  <p>
    請輸入 Authenticator 目前顯示的 6 位數驗證碼。
  </p>

  <div class="two-factor-verify">
    <input
      v-model.trim="disableTwoFactorCode"
      type="text"
      inputmode="numeric"
      maxlength="6"
      autocomplete="one-time-code"
      placeholder="000000"
      class="two-factor-code-input"
    />

    <button
      type="button"
      class="user-btn user-btn-secondary"
      @click="disableTwoFactor"
    >
      確認停用
    </button>
  </div>
</div>

  <!-- 暫時確認 setup API 是否成功 -->
  <div
  v-if="isSettingUpTwoFactor"
  class="two-factor-setup"
>
  <p class="two-factor-setup-title">
    使用 Microsoft Authenticator 掃描 QR Code
  </p>

  <!-- 🟢 QR Code -->
  <div class="two-factor-qr">
    <img
      v-if="twoFactorQrCode"
      :src="twoFactorQrCode"
      alt="二階段驗證 QR Code"
    />
  </div>

  <!-- 🟢 手動輸入 Secret -->
  <p class="two-factor-manual-text">
    無法掃描？也可以手動輸入以下設定金鑰：
  </p>

  <code class="two-factor-secret">
    {{ twoFactorSetup.secret }}
  </code>

  <!-- 🟢 新增：TOTP 驗證碼 -->
<div class="two-factor-verify">
  <label for="twoFactorCode">
    輸入 Authenticator 顯示的 6 位數驗證碼
  </label>

  <input
    id="twoFactorCode"
    v-model.trim="twoFactorSetup.code"
    type="text"
    inputmode="numeric"
    maxlength="6"
    autocomplete="one-time-code"
    placeholder="000000"
    class="two-factor-code-input"
  />

  <button
    type="button"
    class="user-btn user-btn-primary"
    @click="enableTwoFactor"
  >
    確認啟用
  </button>
</div>

</div>
</div>
    </div>

    <!-- ==============================
         編輯帳戶資料
    =============================== -->

    <div class="user-info-edit" v-else>
      <div class="user-form-grid">
        <!-- 帳號 -->

        <div class="user-form-group">
          <label class="user-form-label"> 帳號 </label>

          <input v-model="userData.account" type="text" class="form-control" readonly />

          <p class="user-hint">帳號建立後無法修改</p>
        </div>

        <!-- 暱稱 -->

        <div class="user-form-group">
          <label class="user-form-label"> 暱稱 </label>

          <input
            v-model="userData.username"
            type="text"
            class="form-control"
            placeholder="請輸入暱稱"
          />
        </div>

        <!-- Email -->

        <div class="user-form-group">
          <label class="user-form-label"> Email </label>

          <input
            v-model="userData.email"
            type="email"
            class="form-control"
            placeholder="請輸入 Email"
          />

          <span v-if="userData.email" class="validation-error">
            {{ isValidEmail(userData.email) }}
          </span>
        </div>

        <!-- 電話 -->

        <div class="user-form-group">
          <label class="user-form-label"> 電話 </label>

          <input
            v-model="userData.phone"
            type="tel"
            maxlength="10"
            class="form-control"
            placeholder="例如：0912345678"
          />

          <span v-if="userData.phone" class="validation-error">
            {{ isValidPhone(userData.phone) }}
          </span>
        </div>
      </div>

      <!-- 編輯按鈕 -->

      <div class="user-actions">
        <button type="button" class="user-btn user-btn-secondary" @click="cancel">取消</button>

        <button type="button" class="user-btn user-btn-primary" @click="save">儲存變更</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  AccountCard 專屬樣式。
  Card / Form / Button / Info Grid
  已經交給 user-common.css。
*/

.password-section {
  width: 100%;
}

.password-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.password-title {
  margin: 0 0 5px;
  color: #222222;
  font-size: 16px;
  font-weight: 700;
}

.password-description {
  margin: 0;
  color: #888888;
  font-size: 13px;
}

.password-form {
  max-width: 600px;
  margin-top: 24px;

  display: flex;
  flex-direction: column;
  gap: 16px;
}

.validation-error {
  min-height: 16px;
  color: #dc3545;
  font-size: 12px;
}
.email-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.email-status {
  font-size: 12px;
  font-weight: 600;
}

.email-status-verified {
  color: #198754;
}

.email-status-unverified {
  color: #dc3545;
}

.email-resend-btn {
  padding: 0;
  border: 0;
  background: transparent;
  color: #555555;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
}

.email-resend-btn:hover {
  color: #000000;
}

/* =========================
   Two Factor Authentication
========================= */
.two-factor-section {
  width: 100%;
}

.two-factor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.two-factor-action {
  display: flex;
  align-items: center;
  gap: 14px;
}

.two-factor-status {
  font-size: 12px;
  font-weight: 600;
}

.two-factor-enabled {
  color: #198754;
}

.two-factor-disabled {
  color: #888888;
}

.two-factor-setup {
  max-width: 600px;
  margin-top: 24px;
  padding: 20px;

  border: 1px solid #eeeeee;
  border-radius: 8px;

  background: #fafafa;
}

.two-factor-setup p {
  margin: 0 0 12px;

  color: #666666;
  font-size: 13px;
}

.two-factor-secret {
  display: block;
  overflow-wrap: anywhere;

  color: #222222;
  font-size: 13px;
}

.two-factor-setup-title {
  font-weight: 600;
}

.two-factor-qr {
  margin: 16px 0;
}

.two-factor-qr img {
  display: block;
  width: 200px;
  height: 200px;

  border-radius: 8px;
}

.two-factor-manual-text {
  margin-top: 16px;
}

/*  2FA 驗證碼區域 */
.two-factor-verify {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.two-factor-verify label {
  font-size: 14px;
  font-weight: 600;
}

.two-factor-code-input {
  width: 200px;
  padding: 10px 12px;

  border: 1px solid #d8d8d8;
  border-radius: 6px;

  font-size: 18px;
  letter-spacing: 4px;
}

@media (max-width: 576px) {
  .password-header,
  .two-factor-header {
    align-items: stretch;
    flex-direction: column;
  }

  .password-header .user-btn,
  .two-factor-header .user-btn {
    width: 100%;
  }

  .two-factor-action {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
