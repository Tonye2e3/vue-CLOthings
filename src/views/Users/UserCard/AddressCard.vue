<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/services/api'

// 從 API 取得的地址
const addresses = ref([])

const isEditing = ref(false)
const editingIndex = ref(null)
const isNew = ref(false)

// 編輯前的備份
const backupData = reactive({})

// ==========================
// 取得目前會員所有地址
// ==========================
async function getAddresses() {
  try {
    const resp = await api.get('/UserAddress/me')

    addresses.value = resp.data

    console.log('收件地址：', addresses.value)
  } catch (error) {
    console.error('取得收件地址失敗：', error)
  }
}

// 頁面載入時取得地址
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

      // 如果目前完全沒有地址
      // 第一筆直接預設
      isDefault: addresses.value.length === 0,
    }

    addresses.value.push(newAddress)

    editingIndex.value = addresses.value.length - 1

    isNew.value = true
  }

  // 編輯既有地址
  else {
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
    !address.recipientName ||
    !address.recipientPhone ||
    !address.postalCode ||
    !address.addressDetail
  ) {
    alert('請完整填寫收件資料')
    return
  }

  // 台灣手機基本驗證
  if (!/^09\d{8}$/.test(address.recipientPhone)) {
    alert('手機號碼格式錯誤')
    return
  }

  const data = {
    recipientName: address.recipientName,
    recipientPhone: address.recipientPhone,
    postalCode: address.postalCode,
    addressDetail: address.addressDetail,
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

    // 重新向資料庫取得最新資料
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
    // 新增到一半按取消
    if (isNew.value) {
      addresses.value.splice(editingIndex.value, 1)
    }

    // 修改到一半按取消
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

    // 重新取得最新排序及預設狀態
    await getAddresses()
  } catch (error) {
    console.error('設定預設地址失敗：', error)

    alert(error.response?.data || '設定預設地址失敗')
  }
}
</script>

<template>
  <div class="card p-4 shadow mb-4">
    <!-- 標題 -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold mb-0">收件資料</h3>

      <button
        v-if="!isEditing && addresses.length < 5"
        @click="toggleEdit(null)"
        class="btn btn-outline-dark"
      >
        新增收件資料
      </button>
    </div>

    <!-- 沒有地址 -->
    <div v-if="!isEditing && addresses.length === 0" class="text-muted">尚未建立收件地址</div>

    <!-- ==========================
         顯示模式
    =========================== -->
    <div v-if="!isEditing">
      <div
        v-for="(addr, index) in addresses"
        :key="addr.userAddressId"
        class="border rounded p-3 mb-3"
      >
        <div class="d-flex justify-content-between align-items-start">
          <p>
            <strong>收件人：</strong>
            {{ addr.recipientName }}
          </p>

          <span v-if="addr.isDefault" class="badge bg-dark"> 預設地址 </span>
        </div>

        <p>
          <strong>電話：</strong>
          {{ addr.recipientPhone }}
        </p>

        <p>
          <strong>郵遞區號：</strong>
          {{ addr.postalCode }}
        </p>

        <p>
          <strong>地址：</strong>
          {{ addr.addressDetail }}
        </p>

        <div class="d-flex gap-2 mt-3">
          <button @click="toggleEdit(index)" class="btn btn-sm btn-outline-secondary">編輯</button>

          <button
            v-if="!addr.isDefault"
            @click="setDefault(index)"
            class="btn btn-sm btn-outline-primary"
          >
            設為預設
          </button>

          <button @click="remove(index)" class="btn btn-sm btn-outline-danger">刪除</button>
        </div>
      </div>
    </div>

    <!-- ==========================
         新增 / 編輯模式
    =========================== -->
    <div v-else-if="editingIndex !== null">
      <label class="form-label">收件人姓名</label>

      <input
        v-model="addresses[editingIndex].recipientName"
        type="text"
        maxlength="50"
        class="form-control mb-3"
        placeholder="請輸入收件人姓名"
      />

      <label class="form-label">手機號碼</label>

      <input
        v-model="addresses[editingIndex].recipientPhone"
        type="text"
        maxlength="10"
        class="form-control mb-3"
        placeholder="例如：0912345678"
      />

      <label class="form-label">郵遞區號</label>

      <input
        v-model="addresses[editingIndex].postalCode"
        type="text"
        maxlength="6"
        class="form-control mb-3"
        placeholder="例如：700"
      />

      <label class="form-label">完整地址</label>

      <input
        v-model="addresses[editingIndex].addressDetail"
        type="text"
        class="form-control mb-3"
        placeholder="例如：台南市中西區..."
      />

      <div class="form-check mb-3">
        <input
          id="defaultCheck"
          v-model="addresses[editingIndex].isDefault"
          type="checkbox"
          class="form-check-input"
          :disabled="addresses[editingIndex].isDefault && !isNew"
        />

        <label class="form-check-label" for="defaultCheck"> 設為預設地址 </label>
        <small v-if="addresses[editingIndex].isDefault && !isNew" class="d-block text-muted mt-1">
          預設地址無法直接取消，請將其他地址設為預設。
        </small>
      </div>

      <div class="d-flex gap-2 mt-3">
        <button @click="cancel" class="btn btn-secondary flex-grow-1">取消</button>

        <button @click="save" class="btn btn-primary flex-grow-1">確定</button>
      </div>
    </div>
  </div>
</template>
