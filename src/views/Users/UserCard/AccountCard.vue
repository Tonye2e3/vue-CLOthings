<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
import { isValidAccount, isValidPassword, isValidPhone, isValidEmail } from '@/utils/UserValidator'

const userData = reactive({
  userId: null,
  username: '',
  account: '',
  email: '',
  phone: '',
  countryCode: '',
  twoFactorEnabled: false,
})
const backupData = reactive({}) // 用來暫存原始資料
const isEditing = ref(false)

// 是否顯示修改密碼區塊
const isChangingPassword = ref(false)

// 修改密碼表單
const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function getUserData() {
  try {
    const resp = await api.get('/User/me')

    Object.assign(userData, resp.data)

    console.log('帳戶資料：', userData)
  } catch (error) {
    console.error('取得帳戶資料失敗：', error)
  }
}

onMounted(() => {
  getUserData()
})

const toggleEdit = () => {
  // 進入編輯模式時，先備份原始資料
  Object.assign(backupData, userData)
  isEditing.value = true
}

const cancel = () => {
  // 還原原始資料
  Object.assign(userData, backupData)
  isEditing.value = false
}

const save = async () => {
  // 先檢查前端輸入格式
  const phoneError = isValidPhone(userData.phone)
  const emailError = isValidEmail(userData.email)

  if (phoneError || emailError) {
    alert('請修正錯誤後再儲存')
    return
  }

  // 準備要傳給後端的資料
  const data = {
    username: userData.username,
    email: userData.email,
    phone: userData.phone,
    countryCode: userData.countryCode,
  }

  try {
    // 呼叫後端 PUT /api/User/me
    await api.put('/User/me', data)

    alert('資料修改成功')

    isEditing.value = false
  } catch (error) {
    console.error('修改帳戶資料失敗：', error)
    console.log('後端錯誤內容：', error.response?.data)

    alert('資料修改失敗')
  }
}

const changePassword = async () => {
  // 驗證新密碼格式
  const passwordError = isValidPassword(passwordData.newPassword)

  if (passwordError) {
    alert(passwordError)
    return
  }

  // 確認兩次新密碼是否相同
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

    // 清空密碼欄位
    passwordData.currentPassword = ''
    passwordData.newPassword = ''
    passwordData.confirmPassword = ''

    // 關閉修改密碼區塊
    isChangingPassword.value = false
  } catch (error) {
    console.error('修改密碼失敗：', error)

    if (error.response?.status === 400) {
      alert(error.response.data || '目前密碼錯誤')
    } else {
      alert('密碼修改失敗')
    }
  }
}
</script>

<template>
  <div class="card p-4 shadow mb-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold mb-0">帳戶資料</h3>
    </div>

    <div v-if="!isEditing">
      <p><strong>帳號：</strong>{{ userData.account }}</p>
      <p><strong>暱稱：</strong>{{ userData.username }}</p>

      <p><strong>郵件：</strong>{{ userData.email }}</p>
      <p><strong>電話：</strong>{{ userData.phone }}</p>
      <button
        v-if="!isEditing"
        @click="toggleEdit"
        class="btn btn-outline-dark"
        style="border-radius: 0%"
      >
        編輯
      </button>

      <hr class="my-4" />

      <div>
        <button
          v-if="!isChangingPassword"
          class="btn btn-outline-dark"
          @click="isChangingPassword = true"
        >
          修改密碼
        </button>

        <div v-else>
          <h5 class="fw-bold mb-3">修改密碼</h5>

          <!-- 目前密碼 -->
          <input
            v-model="passwordData.currentPassword"
            type="password"
            class="form-control mb-2"
            placeholder="目前密碼"
          />

          <!-- 新密碼 -->
          <input
            v-model="passwordData.newPassword"
            type="password"
            class="form-control mb-2"
            placeholder="新密碼"
          />

          <span class="text-danger">
            {{ isValidPassword(passwordData.newPassword) }}
          </span>

          <!-- 確認新密碼 -->
          <input
            v-model="passwordData.confirmPassword"
            type="password"
            class="form-control mt-2 mb-2"
            placeholder="確認新密碼"
          />

          <span
            v-if="
              passwordData.confirmPassword &&
              passwordData.newPassword !== passwordData.confirmPassword
            "
            class="text-danger"
          >
            兩次輸入的新密碼不一致
          </span>

          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-secondary flex-grow-1" @click="isChangingPassword = false">
              取消
            </button>

            <button class="btn btn-primary flex-grow-1" @click="changePassword">確定修改</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <input v-model="userData.account" class="form-control mb-2" placeholder="帳號" readonly />
      <input v-model="userData.username" class="form-control mb-2" placeholder="暱稱" />

      <input v-model="userData.email" type="email" class="form-control mb-2" placeholder="郵件" />
      <span class="form text text-danger">{{ isValidEmail(userData.email) }}</span>
      <input
        v-model="userData.phone"
        type="text"
        maxlength="10"
        class="form-control mb-2"
        placeholder="電話"
      />
      <span class="form text text-danger">{{ isValidPhone(userData.phone) }}</span>
      <div class="d-flex gap-2 mt-3">
        <button @click="cancel" class="btn btn-secondary flex-grow-1">取消</button>
        <button @click="save" class="btn btn-primary flex-grow-1">確定</button>
      </div>
    </div>
  </div>
</template>
