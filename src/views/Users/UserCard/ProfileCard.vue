<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'

const apiBaseUrl = 'https://localhost:7255'

const profileData = reactive({
  firstName: '',
  lastName: '',
  avatar: '',
  gender: '',
  birthday: '',
  styleTag: '',
  intro: '',
})

const backupData = reactive({})
const isEditing = ref(false)

const selectedAvatarFile = ref(null)
const avatarPreviewUrl = ref('')

function getAvatarUrl() {
  if (!profileData.avatar) {
    return ''
  }

  return `${apiBaseUrl}${profileData.avatar}`
}

function getEditingAvatarUrl() {
  if (avatarPreviewUrl.value) {
    return avatarPreviewUrl.value
  }

  return getAvatarUrl()
}

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

const toggleEdit = () => {
  Object.assign(backupData, profileData)
  isEditing.value = true
}

const handleAvatarChange = (event) => {
  const file = event.target.files[0]

  if (!file) {
    return
  }

  selectedAvatarFile.value = file

  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }

  avatarPreviewUrl.value = URL.createObjectURL(file)
}

const save = async () => {
  try {
    // 有選新頭像才上傳
    if (selectedAvatarFile.value) {
      const formData = new FormData()

      formData.append('file', selectedAvatarFile.value)

      const avatarResp = await api.post('/UserProfile/me/avatar', formData)

      profileData.avatar = avatarResp.data.avatar
    }

    // Profile API 不再負責修改 Avatar
    const data = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      gender: profileData.gender || null,
      birthday: profileData.birthday || null,
      styleTag: profileData.styleTag || null,
      intro: profileData.intro || null,
    }

    await api.put('/UserProfile/me', data)

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

const cancel = () => {
  // 還原進入編輯前的資料
  Object.assign(profileData, backupData)

  selectedAvatarFile.value = null

  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
    avatarPreviewUrl.value = ''
  }

  isEditing.value = false
}
</script>

<template>
  <div class="user-card">
    <div class="user-card-header">
      <div>
        <p class="user-section-label">PROFILE</p>
        <h2 class="user-card-title">個人資料</h2>
        <p class="user-card-description">管理你的個人資訊、穿搭風格與會員頭像。</p>
      </div>

      <button v-if="!isEditing" type="button" class="user-btn user-btn-outline" @click="toggleEdit">
        編輯資料
      </button>
    </div>

    <!-- 顯示模式 -->
    <div v-if="!isEditing">
      <div class="profile-summary">
        <div class="avatar-wrapper">
          <img v-if="profileData.avatar" :src="getAvatarUrl()" alt="會員頭像" class="avatar" />

          <div v-else class="profile-avatar avatar-placeholder">
            {{ profileData.lastName?.charAt(0) || 'U' }}
          </div>
        </div>

        <div class="profile-intro">
          <h3>{{ profileData.lastName }}{{ profileData.firstName }}</h3>

          <span v-if="profileData.styleTag" class="user-badge user-badge-dark">
            {{ profileData.styleTag }}
          </span>

          <p class="intro-text">
            {{ profileData.intro || '尚未填寫自我介紹' }}
          </p>
        </div>
      </div>

      <div class="user-info-grid">
        <div class="user-info-item">
          <span class="user-info-label">姓名</span>
          <strong class="user-info-value">
            {{
              profileData.lastName || profileData.firstName
                ? `${profileData.lastName}${profileData.firstName}`
                : '未設定'
            }}
          </strong>
        </div>

        <div class="user-info-item">
          <span class="user-info-label">性別</span>
          <strong class="user-info-value">
            {{
              profileData.gender === 'Male'
                ? '男'
                : profileData.gender === 'Female'
                  ? '女'
                  : '未設定'
            }}
          </strong>
        </div>

        <div class="user-info-item">
          <span class="user-info-label">生日</span>
          <strong class="user-info-value">
            {{ profileData.birthday || '未設定' }}
          </strong>
        </div>
      </div>
    </div>

    <!-- 編輯模式 -->
    <div v-else>
      <div class="avatar-edit-area">
        <img v-if="profileData.avatar || avatarPreviewUrl" :src="getEditingAvatarUrl()" alt="會員頭像"
          class="avatar avatar-large" />

        <div v-else class="avatar avatar-large avatar-placeholder">U</div>

        <div>
          <label class="upload-btn">
            更換頭像

            <input type="file" accept=".jpg,.jpeg,.png,.webp" hidden @change="handleAvatarChange" />
          </label>

          <p class="upload-hint">JPG、PNG、WEBP，最大 5 MB</p>
        </div>
      </div>

      <div class="user-form-grid">
        <div class="user-form-group">
          <label>姓氏</label>
          <input v-model="profileData.lastName" type="text" class="form-control" placeholder="請輸入姓氏" />
        </div>

        <div class="user-form-group">
          <label>名字</label>
          <input v-model="profileData.firstName" type="text" class="form-control" placeholder="請輸入名字" />
        </div>

        <div class="user-form-group">
          <label>性別</label>
          <select v-model="profileData.gender" class="form-select">
            <option value="">請選擇性別</option>
            <option value="Male">男</option>
            <option value="Female">女</option>
          </select>
        </div>

        <div class="user-form-group">
          <label>生日</label>
          <input v-model="profileData.birthday" type="date" class="form-control" />
        </div>

        <div class="user-form-group user-form-group-full">
          <label>穿搭標籤</label>
          <input v-model="profileData.styleTag" type="text" maxlength="100" class="form-control"
            placeholder="例如：Cyberpunk、Streetwear" />
        </div>

        <div class="user-form-group user-form-group-full">
          <label>自我介紹</label>
          <textarea v-model="profileData.intro" rows="4" maxlength="500" class="form-control"
            placeholder="介紹一下你的風格..."></textarea>

          <small class="char-count"> {{ profileData.intro?.length || 0 }} / 500 </small>
        </div>
      </div>

      <div class="user-actions">
        <button type="button" class="user-btn user-btn-secondary" @click="cancel">取消</button>

        <button type="button" class="user-btn user-btn-primary" @click="save">儲存變更</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-summary {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-bottom: 26px;
  margin-bottom: 26px;
  border-bottom: 1px solid #eeeeee;
}

.profile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f3f3f3;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eeeeee;
  color: #888888;
  font-size: 32px;
  font-weight: 700;
}

.profile-intro h3 {
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 700;
}

.intro-text {
  max-width: 520px;
  margin: 12px 0 0;
  color: #777777;
  line-height: 1.7;
}

.avatar-edit-area {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  margin-bottom: 26px;
  background: #f8f8f7;
  border-radius: 12px;
}

.upload-btn {
  display: inline-block;
  padding: 9px 16px;
  border: 1px solid #cccccc;
  border-radius: 8px;
  background: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.upload-hint {
  margin: 7px 0 0;
  color: #999999;
  font-size: 11px;
}

.char-count {
  align-self: flex-end;
  color: #aaaaaa;
  font-size: 11px;
}

@media (max-width: 700px) {

  .profile-summary,
  .avatar-edit-area {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
