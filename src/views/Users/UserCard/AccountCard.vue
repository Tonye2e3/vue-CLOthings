<script setup>
import { ref, reactive } from 'vue'
import { initialUserData } from '../../../services/userFakeData'
import { isValidAccount, isValidPassword, isValidPhone, isValidEmail } from '@/utils/UserValidator'

const userData = reactive({ ...initialUserData })
const backupData = reactive({}) // 用來暫存原始資料
const isEditing = ref(false)

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

const save = () => {
  // 直接使用雙向繫結的 userData，不需要再複製
  const passwordError = isValidPassword(userData.password)
  const phoneError = isValidPhone(userData.phone)
  const emailError = isValidEmail(userData.email)

  if (passwordError || phoneError || emailError) {
    alert('請修正錯誤後再儲存')
    return
  }

  isEditing.value = false
}
</script>

<template>
  <div class="card p-4 shadow mb-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold mb-0">帳戶資料</h3>
      <button v-if="!isEditing" @click="toggleEdit" class="btn btn-outline-primary">編輯</button>
    </div>

    <div v-if="!isEditing">
      <p><strong>帳號：</strong>{{ userData.account }}</p>
      <p><strong>暱稱：</strong>{{ userData.username }}</p>
      <p><strong>密碼：</strong>{{ userData.password ? '••••••' : '未設定' }}</p>
      <p><strong>郵件：</strong>{{ userData.email }}</p>
      <p><strong>電話：</strong>{{ userData.phone }}</p>
    </div>

    <div v-else>
      <input v-model="userData.account" class="form-control mb-2" placeholder="帳號" readonly />
      <input v-model="userData.username" class="form-control mb-2" placeholder="暱稱" />
      <input
        v-model="userData.password"
        type="password"
        class="form-control mb-2"
        placeholder="密碼"
      />
      <span v-if="isValidPassword(userData.password)" class="form text text-danger">
        {{ isValidPassword(userData.password) }}
      </span>
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
