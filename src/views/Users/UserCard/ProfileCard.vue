<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'

//取得頭像位置
const apiBaseUrl = 'https://localhost:7255'
function getAvatarUrl() {
  if (!profileData.avatar) {
    return ''
  }

  return `${apiBaseUrl}${profileData.avatar}`
}

function getEditingAvatarUrl() {
  // 有選擇新頭像 → 顯示預覽
  if (avatarPreviewUrl.value) {
    return avatarPreviewUrl.value
  }

  // 沒有選新頭像 → 顯示原本頭像
  return getAvatarUrl()
}

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
// 暫存使用者新選擇的頭像檔案
const selectedAvatarFile = ref(null)

// 新頭像的前端預覽網址
const avatarPreviewUrl = ref('')

// 進入編輯模式
const toggleEdit = () => {
  Object.assign(backupData, profileData) // 備份原始資料
  isEditing.value = true
}

// 儲存
const save = async () => {
  try {
    // 1. 如果使用者有選擇新頭像
    if (selectedAvatarFile.value) {
      const formData = new FormData()

      formData.append('file', selectedAvatarFile.value)

      // 上傳頭像
      const resp = await api.post(
        '/UserProfile/me/avatar',
        formData
      )

      // 更新後端回傳的頭像路徑
      profileData.avatar = resp.data.avatar
    }

    // 2. 準備個人資料
    const data = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      avatar: profileData.avatar || null,
      gender: profileData.gender || null,
      birthday: profileData.birthday || null,
      styleTag: profileData.styleTag || null,
      intro: profileData.intro || null,
    }

    // 3. 更新個人資料
    await api.put('/UserProfile/me', data)

    // 4. 清除頭像暫存
    selectedAvatarFile.value = null

    if (avatarPreviewUrl.value) {
      URL.revokeObjectURL(avatarPreviewUrl.value)
      avatarPreviewUrl.value = ''
    }

    alert('個人資料修改成功')

    isEditing.value = false

  } catch (error) {
    console.error('修改個人資料失敗：', error)
    alert('個人資料修改失敗')
  }
}

// 取消 → 還原備份
const cancel = () => {
  // 還原進入編輯前的資料
  Object.assign(profileData, backupData)

  // 清除剛剛選擇但尚未上傳的圖片
  selectedAvatarFile.value = null

  // 清除瀏覽器產生的預覽網址
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
    avatarPreviewUrl.value = ''
  }

  isEditing.value = false
}

// 處理頭像上傳
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]

  if (!file) {
    return
  }

  // 暫存使用者選擇的檔案
  selectedAvatarFile.value = file

  // 如果之前已經產生過預覽 URL，先釋放
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }

  // 產生本機預覽網址
  avatarPreviewUrl.value = URL.createObjectURL(file)

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
        <img :src="getAvatarUrl()" alt="大頭貼" class="rounded-circle border" width="120" height="120" />
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

      <textarea v-model="profileData.intro" class="form-control mb-2" placeholder="自我介紹"></textarea>
      <div class="text-center mt-3">
        <img v-if="profileData.avatar || avatarPreviewUrl" :src="getEditingAvatarUrl()" alt="大頭貼"
          class="rounded-circle border mb-2" width="120" height="120" />
        <input type="file" class="form-control" @change="handleAvatarChange" />
      </div>
      <div class="d-flex gap-2 mt-3">
        <button @click="cancel" class="btn btn-secondary flex-grow-1">取消</button>
        <button @click="save" class="btn btn-primary flex-grow-1">確定</button>
      </div>
    </div>
  </div>
</template>
