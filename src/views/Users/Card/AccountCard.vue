<script setup>
import { ref, reactive } from 'vue'
import { initialUserData } from '../../../services/userFakeData'

const userData = reactive({ ...initialUserData })
const editForm = reactive({ ...initialUserData, password: '' })
const isEditing = ref(false)

const toggleEdit = () => {
  if (!isEditing.value) {
    Object.assign(editForm, { ...userData, password: '' })
  }
  isEditing.value = !isEditing.value
}
const save = () => {
  userData.password = editForm.password || userData.password
  Object.assign(userData, editForm)
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
      <p><strong>暱稱：</strong>{{ userData.nickname }}</p>
      <p><strong>密碼：</strong>{{ userData.password ? '••••••' : '未設定' }}</p>
      <p><strong>郵件：</strong>{{ userData.email }}</p>
      <p><strong>電話：</strong>{{ userData.phone }}</p>
    </div>

    <div v-else>
      <input v-model="editForm.account" class="form-control mb-2" placeholder="帳號" />
      <input v-model="editForm.nickname" class="form-control mb-2" placeholder="暱稱" />
      <input
        v-model="editForm.password"
        type="password"
        class="form-control mb-2"
        placeholder="密碼 (留空不修改)"
      />
      <input v-model="editForm.email" type="email" class="form-control mb-2" placeholder="郵件" />
      <input v-model="editForm.phone" class="form-control mb-2" placeholder="電話" />
      <div class="d-flex gap-2 mt-3">
        <button @click="isEditing = false" class="btn btn-secondary flex-grow-1">取消</button>
        <button @click="save" class="btn btn-primary flex-grow-1">確定</button>
      </div>
    </div>
  </div>
</template>
