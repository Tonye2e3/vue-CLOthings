<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'

const profileData = reactive({
  firstName: '',
  lastName: '',
  avatar: '',
  gender: '',
  birthday: '',
  styleTag: '',
  intro: '',
})

async function getProfile() {
  try {
    const resp = await api.get('/UserProfile/me')

    Object.assign(profileData, resp.data)
  } catch (error) {
    console.error('取得個人資料失敗：', error)
  }
}

onMounted(() => {
  getProfile()
})

const backupData = reactive({}) // 暫存備份
const isEditing = ref(false)

// 進入編輯模式
const toggleEdit = () => {
  Object.assign(backupData, profileData) // 備份原始資料
  isEditing.value = true
}

// 儲存
const save = async () => {
  const data = {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    avatar: profileData.avatar || null,
    gender: profileData.gender || null,
    birthday: profileData.birthday || null,
    styleTag: profileData.styleTag || null,
    intro: profileData.intro || null,
  }

  try {
    await api.put('/UserProfile/me', data)

    alert('個人資料修改成功')

    isEditing.value = false
  } catch (error) {
    console.error('修改個人資料失敗：', error)
    alert('個人資料修改失敗')
  }
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
      <p>
        <strong>姓名：</strong>
        {{ profileData.lastName }}{{ profileData.firstName }}
      </p>

      <p><strong>性別：</strong>{{ profileData.gender }}</p>

      <p><strong>生日：</strong>{{ profileData.birthday }}</p>

      <p><strong>穿搭標籤：</strong>{{ profileData.styleTag }}</p>

      <p><strong>自我介紹：</strong>{{ profileData.intro }}</p>
      <div v-if="profileData.avatar" class="text-center mt-3">
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
      <input v-model="profileData.lastName" class="form-control mb-2" placeholder="姓" />

      <input v-model="profileData.firstName" class="form-control mb-2" placeholder="名" />

      <select v-model="profileData.gender" class="form-control mb-2">
        <option value="">請選擇性別</option>
        <option value="Male">男</option>
        <option value="Female">女</option>
      </select>

      <input v-model="profileData.birthday" type="date" class="form-control mb-2" />

      <input v-model="profileData.styleTag" class="form-control mb-2" placeholder="穿搭標籤" />

      <textarea
        v-model="profileData.intro"
        class="form-control mb-2"
        placeholder="自我介紹"
      ></textarea>
      <div class="text-center mt-3">
        <img
          v-if="profileData.avatar"
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
