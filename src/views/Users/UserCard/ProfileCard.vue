<script setup>
import { ref, reactive } from 'vue'
import { initialProfileData } from '../../../services/userFakeData'

const profileData = reactive({ ...initialProfileData })
const backupData = reactive({}) // 暫存備份
const isEditing = ref(false)

// 進入編輯模式
const toggleEdit = () => {
  Object.assign(backupData, profileData) // 備份原始資料
  isEditing.value = true
}

// 儲存
const save = () => {
  isEditing.value = false
}

// 取消 → 還原備份
const cancel = () => {
  Object.assign(profileData, backupData)
  isEditing.value = false
}

// 處理頭像上傳
const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      profileData.avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
}
</script>

<template>
  <div class="card p-4 shadow mb-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold mb-0">個人資料</h3>
      <button v-if="!isEditing" @click="toggleEdit" class="btn btn-outline-primary">編輯</button>
    </div>

    <!-- 顯示模式 -->
    <div v-if="!isEditing">
      <p><strong>姓名：</strong>{{ profileData.fullname }}</p>
      <p><strong>性別：</strong>{{ profileData.gender }}</p>
      <p><strong>生日：</strong>{{ profileData.birthday }}</p>
      <p><strong>地址：</strong>{{ profileData.address }}</p>
      <div class="text-center mt-3">
        <img
          :src="profileData.avatar"
          alt="大頭貼"
          class="rounded-circle border"
          width="120"
          height="120"
        />
      </div>
    </div>

    <!-- 編輯模式 -->
    <div v-else>
      <input v-model="profileData.fullname" class="form-control mb-2" placeholder="姓名" />
      <select v-model="profileData.gender" class="form-control mb-2">
        <option value="男">男</option>
        <option value="女">女</option>
        <option value="其他">其他</option>
      </select>
      <input
        v-model="profileData.birthday"
        type="date"
        class="form-control mb-2"
        placeholder="生日"
      />
      <input v-model="profileData.address" class="form-control mb-2" placeholder="地址" />
      <div class="text-center mt-3">
        <img
          :src="profileData.avatar"
          alt="大頭貼"
          class="rounded-circle border mb-2"
          width="120"
          height="120"
        />
        <input type="file" class="form-control" @change="handleAvatarChange" />
      </div>
      <div class="d-flex gap-2 mt-3">
        <button @click="cancel" class="btn btn-secondary flex-grow-1">取消</button>
        <button @click="save" class="btn btn-primary flex-grow-1">確定</button>
      </div>
    </div>
  </div>
</template>
