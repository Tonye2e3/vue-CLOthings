<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api/api'

// 從 API 取得的地址
const addresses = ref([])

const isEditing = ref(false)
const editingIndex = ref(null)
const isNew = ref(false)

// 編輯前的備份
const backupData = reactive({})

// ==========================
// 取得目前會員所有地址
// GET /api/UserAddress/me
// ==========================
async function getAddresses() {
  try {
    const resp = await api.get('/UserAddress/me')
    addresses.value = resp.data
  } catch (error) {
    console.error('取得收件地址失敗：', error)
  }
}

onMounted(() => {
  getAddresses()
})

// ==========================
// 新增 / 編輯
// ==========================
const toggleEdit = (index) => {
  // 新增
  if (index === null) {
    if (addresses.value.length >= 5) {
      alert('最多只能新增 5 筆收件地址')
      return
    }

    const newAddress = {
      userAddressId: null,
      recipientName: '',
      recipientPhone: '',
      postalCode: '',
      addressDetail: '',

      // 第一筆地址直接成為預設
      isDefault: addresses.value.length === 0,
    }

    addresses.value.push(newAddress)

    editingIndex.value = addresses.value.length - 1
    isNew.value = true
  } else {
    // 編輯既有地址
    editingIndex.value = index

    Object.assign(backupData, addresses.value[index])

    isNew.value = false
  }

  isEditing.value = true
}

// ==========================
// 儲存
// ==========================
const save = async () => {
  const address = addresses.value[editingIndex.value]

  // 基本欄位驗證
  if (
    !address.recipientName?.trim() ||
    !address.recipientPhone?.trim() ||
    !address.postalCode?.trim() ||
    !address.addressDetail?.trim()
  ) {
    alert('請完整填寫收件資料')
    return
  }

  // 台灣手機格式
  if (!/^09\d{8}$/.test(address.recipientPhone)) {
    alert('手機號碼格式錯誤')
    return
  }

  // 郵遞區號基本驗證
  if (!/^\d{3,6}$/.test(address.postalCode)) {
    alert('郵遞區號格式錯誤')
    return
  }

  const data = {
    recipientName: address.recipientName.trim(),
    recipientPhone: address.recipientPhone.trim(),
    postalCode: address.postalCode.trim(),
    addressDetail: address.addressDetail.trim(),
    isDefault: address.isDefault,
  }

  try {
    // 新增
    if (isNew.value) {
      await api.post('/UserAddress/me', data)
      alert('新增收件資料成功')
    }

    // 修改
    else {
      await api.put(`/UserAddress/me/${address.userAddressId}`, data)

      alert('修改收件資料成功')
    }

    isEditing.value = false
    editingIndex.value = null
    isNew.value = false

    // 重新取得資料庫最新狀態
    await getAddresses()
  } catch (error) {
    console.error('儲存收件地址失敗：', error)

    alert(error.response?.data || '儲存收件地址失敗')
  }
}

// ==========================
// 取消
// ==========================
const cancel = () => {
  if (editingIndex.value !== null) {
    // 新增到一半取消
    if (isNew.value) {
      addresses.value.splice(editingIndex.value, 1)
    }

    // 編輯到一半取消
    else {
      Object.assign(addresses.value[editingIndex.value], backupData)
    }
  }

  isEditing.value = false
  editingIndex.value = null
  isNew.value = false
}

// ==========================
// 刪除
// ==========================
const remove = async (index) => {
  const address = addresses.value[index]

  if (!confirm('確定要刪除這筆收件資料嗎？')) {
    return
  }

  try {
    await api.delete(`/UserAddress/me/${address.userAddressId}`)

    alert('已刪除收件資料')

    await getAddresses()
  } catch (error) {
    console.error('刪除地址失敗：', error)

    alert(error.response?.data || '刪除地址失敗')
  }
}

// ==========================
// 設定預設地址
// ==========================
const setDefault = async (index) => {
  const address = addresses.value[index]

  try {
    await api.put(`/UserAddress/me/${address.userAddressId}/default`)

    await getAddresses()
  } catch (error) {
    console.error('設定預設地址失敗：', error)

    alert(error.response?.data || '設定預設地址失敗')
  }
}
</script>

<template>
  <div class="user-card">
    <!-- Header -->
    <div class="user-card-header">
      <div>
        <p class="user-section-label">ADDRESS</p>

        <h2 class="user-card-title">收件資料</h2>

        <p class="user-card-description">管理結帳時使用的收件人與配送地址，最多可建立 5 筆。</p>
      </div>

      <button
        v-if="!isEditing && addresses.length < 5"
        type="button"
        class="user-btn user-btn-outline"
        @click="toggleEdit(null)"
      >
        ＋ 新增地址
      </button>
    </div>

    <!-- ==========================
         沒有地址
    =========================== -->
    <div v-if="!isEditing && addresses.length === 0" class="user-empty">
      <div class="empty-icon">⌂</div>

      <div class="user-empty-title">尚未建立收件地址</div>

      <p class="user-empty-text">新增地址後，結帳時可以快速選擇配送資訊。</p>

      <button
        type="button"
        class="user-btn user-btn-primary empty-add-btn"
        @click="toggleEdit(null)"
      >
        新增第一筆地址
      </button>
    </div>

    <!-- ==========================
         顯示模式
    =========================== -->
    <div v-if="!isEditing && addresses.length > 0" class="address-list">
      <div
        v-for="(addr, index) in addresses"
        :key="addr.userAddressId"
        class="address-item"
        :class="{ 'address-default': addr.isDefault }"
      >
        <!-- 地址 Header -->
        <div class="address-header">
          <div class="recipient">
            <div class="recipient-avatar">
              {{ addr.recipientName?.charAt(0) || '收' }}
            </div>

            <div>
              <div class="recipient-name">
                {{ addr.recipientName }}

                <span v-if="addr.isDefault" class="user-badge user-badge-dark"> 預設地址 </span>
              </div>

              <div class="recipient-phone">
                {{ addr.recipientPhone }}
              </div>
            </div>
          </div>
        </div>

        <!-- 地址內容 -->
        <div class="address-content">
          <span class="postal-code">
            {{ addr.postalCode }}
          </span>

          <span>
            {{ addr.addressDetail }}
          </span>
        </div>

        <!-- 操作 -->
        <div class="address-actions">
          <button type="button" class="address-action-btn" @click="toggleEdit(index)">編輯</button>

          <button
            v-if="!addr.isDefault"
            type="button"
            class="address-action-btn"
            @click="setDefault(index)"
          >
            設為預設
          </button>

          <button type="button" class="address-action-btn danger" @click="remove(index)">
            刪除
          </button>
        </div>
      </div>

      <!-- 地址數量 -->
      <p class="address-count">已建立 {{ addresses.length }} / 5 筆收件地址</p>
    </div>

    <!-- ==========================
         新增 / 編輯模式
    =========================== -->
    <div v-else-if="editingIndex !== null" class="address-form">
      <div class="form-heading">
        <h3>
          {{ isNew ? '新增收件地址' : '編輯收件地址' }}
        </h3>

        <p>請確認收件資訊正確，以避免配送失敗。</p>
      </div>

      <div class="user-form-grid">
        <!-- 收件人 -->
        <div class="user-form-group">
          <label class="user-form-label"> 收件人姓名 </label>

          <input
            v-model="addresses[editingIndex].recipientName"
            type="text"
            maxlength="50"
            class="form-control"
            placeholder="請輸入收件人姓名"
          />
        </div>

        <!-- 手機 -->
        <div class="user-form-group">
          <label class="user-form-label"> 手機號碼 </label>

          <input
            v-model="addresses[editingIndex].recipientPhone"
            type="tel"
            maxlength="10"
            class="form-control"
            placeholder="例如：0912345678"
          />

          <p class="user-hint">請輸入 09 開頭的台灣手機號碼</p>
        </div>

        <!-- 郵遞區號 -->
        <div class="user-form-group">
          <label class="user-form-label"> 郵遞區號 </label>

          <input
            v-model="addresses[editingIndex].postalCode"
            type="text"
            inputmode="numeric"
            maxlength="6"
            class="form-control"
            placeholder="例如：700"
          />
        </div>

        <!-- 完整地址 -->
        <div class="user-form-group">
          <label class="user-form-label"> 完整地址 </label>

          <input
            v-model="addresses[editingIndex].addressDetail"
            type="text"
            class="form-control"
            placeholder="例如：台南市中西區..."
          />
        </div>

        <!-- 預設地址 -->
        <div class="user-form-group user-form-group-full">
          <div class="default-option">
            <div>
              <label class="user-form-label" for="defaultCheck"> 預設收件地址 </label>

              <p class="user-hint">結帳時會優先使用此地址。</p>
            </div>

            <div class="form-check form-switch">
              <input
                id="defaultCheck"
                v-model="addresses[editingIndex].isDefault"
                type="checkbox"
                class="form-check-input"
                :disabled="addresses[editingIndex].isDefault && !isNew"
              />
            </div>
          </div>

          <p v-if="addresses[editingIndex].isDefault && !isNew" class="default-hint">
            目前為預設地址。如需更換，請將其他地址設為預設。
          </p>
        </div>
      </div>

      <!-- Buttons -->
      <div class="user-actions">
        <button type="button" class="user-btn user-btn-secondary" @click="cancel">取消</button>

        <button type="button" class="user-btn user-btn-primary" @click="save">
          {{ isNew ? '新增地址' : '儲存變更' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  AddressCard 專屬 CSS
  通用 Card / Button / Form 都交給 user-common.css
*/

.address-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.address-item {
  position: relative;

  padding: 20px;

  border: 1px solid #e4e4e4;
  border-radius: 12px;

  background: #ffffff;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.address-item:hover {
  border-color: #bbbbbb;
}

.address-default {
  border-color: #555555;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.recipient {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recipient-avatar {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 42px;
  height: 42px;

  flex-shrink: 0;

  border-radius: 50%;

  background: #f1f1f1;

  color: #555555;

  font-size: 16px;
  font-weight: 700;
}

.recipient-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 8px;

  color: #222222;

  font-size: 15px;
  font-weight: 700;
}

.recipient-phone {
  margin-top: 3px;

  color: #888888;

  font-size: 13px;
}

.address-content {
  display: flex;
  align-items: flex-start;

  gap: 8px;

  margin-top: 18px;
  padding: 14px 16px;

  background: #f8f8f7;

  border-radius: 8px;

  color: #444444;

  font-size: 14px;
  line-height: 1.6;
}

.postal-code {
  flex-shrink: 0;

  color: #888888;

  font-size: 12px;
  font-weight: 600;
}

.address-actions {
  display: flex;
  align-items: center;

  gap: 16px;

  margin-top: 16px;
}

.address-action-btn {
  padding: 0;

  border: none;

  background: transparent;

  color: #555555;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.address-action-btn:hover {
  color: #000000;

  text-decoration: underline;
}

.address-action-btn.danger {
  color: #dc3545;
}

.address-action-btn.danger:hover {
  color: #b02a37;
}

.address-count {
  margin: 4px 0 0;

  text-align: right;

  color: #aaaaaa;

  font-size: 11px;
}

/* ==========================
   Form
========================== */

.address-form {
  width: 100%;
}

.form-heading {
  margin-bottom: 24px;
}

.form-heading h3 {
  margin: 0 0 5px;

  color: #222222;

  font-size: 17px;
  font-weight: 700;
}

.form-heading p {
  margin: 0;

  color: #888888;

  font-size: 13px;
}

.default-option {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 15px 16px;

  border: 1px solid #eeeeee;
  border-radius: 10px;

  background: #fafafa;
}

.default-option .user-hint {
  margin-top: 4px;
}

.default-hint {
  margin: 6px 0 0;

  color: #888888;

  font-size: 11px;
}

/* ==========================
   Empty
========================== */

.empty-icon {
  margin-bottom: 8px;

  color: #aaaaaa;

  font-size: 28px;
}

.empty-add-btn {
  margin-top: 18px;
}

/* ==========================
   RWD
========================== */

@media (max-width: 576px) {
  .address-content {
    flex-direction: column;
  }

  .address-actions {
    flex-wrap: wrap;
  }

  .default-option {
    align-items: flex-start;
  }
}
</style>
