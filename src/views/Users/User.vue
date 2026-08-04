<script setup>
import { ref, reactive } from 'vue'

// 模擬原始使用者資料
const initialUserData = {
  account: 'Tony',
  nickname: '菜tony',
  password: 'Ss39268989', // 模擬已有密碼
  email: 'Tony@example.com',
  phone: '0912-345-678',
}

const isEditing = ref(false)
const userData = reactive({ ...initialUserData })
const editForm = reactive({ ...initialUserData, password: '' })

const toggleEdit = () => {
  if (!isEditing.value) {
    // 進入編輯模式時，重置編輯表單，密碼清空（若不輸入則保留原密碼）
    Object.assign(editForm, { ...userData, password: '' })
  }
  isEditing.value = !isEditing.value
}

const handleCancel = () => {
  isEditing.value = false
}

const handleSave = () => {
  // 如果編輯模式下的密碼為空，則保留原密碼
  const finalPassword = editForm.password || userData.password

  // 更新顯示用的資料
  Object.assign(userData, {
    ...editForm,
    password: finalPassword,
  })

  console.log('修改後的內容：', { ...userData })

  isEditing.value = false
}
</script>

<template>
  <div class="col-md-6 m-auto card p-4 mt-5 shadow" style="width: 800px">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold mb-0">個人資料</h3>
      <button v-if="!isEditing" @click="toggleEdit" class="btn btn-outline-primary">
        編輯資料
      </button>
    </div>

    <div class="profile-content">
      <!-- 顯示模式 -->
      <div v-if="!isEditing">
        <div class="form-floating mb-3">
          <div class="form-control-plaintext border-bottom ps-2">{{ userData.account }}</div>
          <label class="text-muted small">帳號</label>
        </div>
        <div class="form-floating mb-3">
          <div class="form-control-plaintext border-bottom ps-2">{{ userData.nickname }}</div>
          <label class="text-muted small">暱稱</label>
        </div>
        <div class="form-floating mb-3">
          <div class="form-control-plaintext border-bottom ps-2">
            {{ userData.password ? '已設定' : '未設定' }}
          </div>
          <label class="text-muted small">密碼</label>
        </div>
        <div class="form-floating mb-3">
          <div class="form-control-plaintext border-bottom ps-2">{{ userData.email }}</div>
          <label class="text-muted small">郵件</label>
        </div>
        <div class="form-floating mb-3">
          <div class="form-control-plaintext border-bottom ps-2">{{ userData.phone }}</div>
          <label class="text-muted small">電話</label>
        </div>
      </div>

      <!-- 編輯模式 -->
      <div v-else>
        <div class="form-floating mb-3">
          <input type="text" class="form-control" placeholder="帳號" v-model="editForm.account" />
          <label>帳號</label>
        </div>
        <div class="form-floating mb-3">
          <input type="text" class="form-control" placeholder="暱稱" v-model="editForm.nickname" />
          <label>暱稱</label>
        </div>
        <div class="form-floating mb-3">
          <input
            type="password"
            class="form-control"
            placeholder="密碼"
            v-model="editForm.password"
          />
          <label>密碼 (若不修改請留空)</label>
        </div>
        <div class="form-floating mb-3">
          <input type="email" class="form-control" placeholder="郵件" v-model="editForm.email" />
          <label>郵件</label>
        </div>
        <div class="form-floating mb-3">
          <input type="text" class="form-control" placeholder="電話" v-model="editForm.phone" />
          <label>電話</label>
        </div>

        <div class="d-flex gap-2 mt-4">
          <button @click="handleCancel" class="btn btn-secondary flex-grow-1 py-2">取消</button>
          <button @click="handleSave" class="btn btn-primary flex-grow-1 py-2">確定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移除原本的手寫樣式，改用 Bootstrap */
.form-control-plaintext {
  min-height: calc(3.5rem + 2px);
  padding-top: 1.625rem;
  padding-bottom: 0.625rem;
}
</style>
