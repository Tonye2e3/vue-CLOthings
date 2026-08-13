<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import { isValidPassword, isValidPhone, isValidEmail } from '@/utils/UserValidator'

const userData = reactive({
  userId: null,
  username: '',
  account: '',
  email: '',
  phone: '',
  countryCode: '',
  twoFactorEnabled: false,
})

const backupData = reactive({})

const isEditing = ref(false)
const isChangingPassword = ref(false)

const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// ==============================
// 取得目前登入會員資料
// GET /api/User/me
// ==============================

async function getUserData() {
  try {
    const resp = await api.get('/User/me')

    Object.assign(userData, resp.data)
  } catch (error) {
    console.error('取得帳戶資料失敗：', error)
  }
}

// ==============================
// 頁面載入
// ==============================

onMounted(() => {
  getUserData()
})

// ==============================
// 進入編輯模式
// ==============================

const toggleEdit = () => {
  Object.assign(backupData, userData)

  isEditing.value = true
}

// ==============================
// 取消編輯
// ==============================

const cancel = () => {
  Object.assign(userData, backupData)

  isEditing.value = false
}

// ==============================
// 儲存帳戶資料
// PUT /api/User/me
// ==============================

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
// ==============================

const clearPasswordForm = () => {
  passwordData.currentPassword = ''
  passwordData.newPassword = ''
  passwordData.confirmPassword = ''
}

// ==============================
// 取消修改密碼
// ==============================

const cancelChangePassword = () => {
  clearPasswordForm()

  isChangingPassword.value = false
}

// ==============================
// 修改密碼
// PUT /api/User/me/password
// ==============================

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

    <div v-if="!isEditing">
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
          <span class="user-info-label"> Email </span>

          <span class="user-info-value">
            {{ userData.email || '未設定' }}
          </span>
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
    </div>

    <!-- ==============================
         編輯帳戶資料
    =============================== -->

    <div v-else>
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

@media (max-width: 576px) {
  .password-header {
    align-items: stretch;
    flex-direction: column;
  }

  .password-header .user-btn {
    width: 100%;
  }
}
</style>
