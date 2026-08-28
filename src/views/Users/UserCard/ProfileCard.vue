<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'
// 圖片裁切套件
import { Cropper, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const apiBaseUrl = import.meta.env.VITE_API_URL

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
// 裁切視窗
const showAvatarCropper = ref(false)
// 裁切器
const cropper = ref(null)

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

// 🟡【修改】選擇圖片後先進入裁切模式
const handleAvatarChange = (event) => {
  const file = event.target.files[0]

  if (!file) {
    return
  }

  // 限制 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert('圖片大小不能超過 5 MB')
    event.target.value = ''
    return
  }

  // 限制圖片格式
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ]

  if (!allowedTypes.includes(file.type)) {
    alert('只允許 JPG、PNG、WEBP')
    event.target.value = ''
    return
  }

  // 清除上一張預覽圖
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }

  // 原始圖片先拿來給裁切器使用
  avatarPreviewUrl.value = URL.createObjectURL(file)

  // 開啟裁切視窗
  showAvatarCropper.value = true

  // 允許再次選擇同一張圖片
  event.target.value = ''
}

// 🟢【新增】套用裁切結果
const applyAvatarCrop = () => {
  if (!cropper.value) {
    return
  }

  const { canvas } = cropper.value.getResult()

  if (!canvas) {
    return
  }

  // 統一輸出 512 × 512
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = 512
  outputCanvas.height = 512

  const context = outputCanvas.getContext('2d')

  context.drawImage(
    canvas,
    0,
    0,
    512,
    512
  )

  // Canvas → Blob
  outputCanvas.toBlob(
    (blob) => {
      if (!blob) {
        return
      }

      // Blob → File
      const file = new File(
        [blob],
        'avatar.webp',
        {
          type: 'image/webp'
        }
      )

      // 這才是真正準備上傳的圖片
      selectedAvatarFile.value = file

      // 清除原始圖片網址
      if (avatarPreviewUrl.value) {
        URL.revokeObjectURL(avatarPreviewUrl.value)
      }

      // 使用裁切完成的圖片當預覽
      avatarPreviewUrl.value = URL.createObjectURL(file)

      // 關閉裁切器
      showAvatarCropper.value = false
    },
    'image/webp',
    0.9
  )
}

// 🟢【新增】取消裁切
const cancelAvatarCrop = () => {
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
    avatarPreviewUrl.value = ''
  }

  showAvatarCropper.value = false
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
          <img v-if="profileData.avatar" :src="getAvatarUrl()" alt="會員頭像" class="profile-avatar" />

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
          class="profile-avatar avatar-large" />

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

  <!-- 🟢【新增】頭像裁切視窗 -->
  <div v-if="showAvatarCropper" class="cropper-overlay">
    <div class="cropper-modal">

      <div class="cropper-header">
        <h3>調整頭像</h3>

        <button type="button" class="cropper-close" @click="cancelAvatarCrop">
          ×
        </button>
      </div>

      <p class="cropper-description">
        拖曳圖片調整位置，滾輪或手勢可以調整大小。
      </p>

      <div class="cropper-container">
        <Cropper ref="cropper" :src="avatarPreviewUrl" :stencil-component="CircleStencil" :stencil-props="{
          aspectRatio: 1
        }" :resize-image="{
          adjustStencil: false
        }" image-restriction="stencil" />
      </div>

      <div class="cropper-actions">
        <button type="button" class="user-btn user-btn-secondary" @click="cancelAvatarCrop">
          取消
        </button>

        <button type="button" class="user-btn user-btn-primary" @click="applyAvatarCrop">
          套用頭像
        </button>
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

  /* 圓形 */
  border-radius: 50%;

  /* 圖片維持比例並裁切 */
  object-fit: cover;

  /* 防止 flex 把頭像壓縮 */
  flex-shrink: 0;

  display: block;

  border: 4px solid #f3f3f3;
}

/* 🟢編輯模式使用稍大的頭像 */
.avatar-large {
  width: 200px;
  height: 200px;
  flex-shrink: 0;
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

/* ============================= */
/* 頭像裁切器 */
/* ============================= */

.cropper-overlay {
  position: fixed;
  inset: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(0, 0, 0, 0.55);

  z-index: 9999;
}

.cropper-modal {
  width: 100%;
  max-width: 520px;

  padding: 24px;

  background: #ffffff;
  border-radius: 16px;

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.2);
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 6px;
}

.cropper-header h3 {
  margin: 0;

  font-size: 20px;
  font-weight: 700;
}

.cropper-close {
  border: 0;
  background: transparent;

  font-size: 28px;
  line-height: 1;

  cursor: pointer;
}

.cropper-description {
  margin: 0 0 18px;

  color: #888888;
  font-size: 13px;
}

.cropper-container {
  width: 100%;
  height: 400px;

  overflow: hidden;

  background: #111111;
  border-radius: 12px;
}

.cropper-container :deep(.vue-advanced-cropper) {
  width: 100%;
  height: 100%;
}

.cropper-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  margin-top: 20px;
}

@media (max-width: 700px) {

  .profile-summary,
  .avatar-edit-area {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
