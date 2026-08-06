<script setup>
import { ref, reactive } from 'vue'
import { initialAddressData } from '../../../services/userFakeData'

const addresses = ref([...initialAddressData])
const isEditing = ref(false)
const editingIndex = ref(null)
const addressForm = reactive({
  recipient_name: '',
  recipient_phone: '',
  postal_code: '',
  address_detail: '',
  is_default: false,
})

const toggleEdit = (index) => {
  if (index === null && addresses.value.length >= 5) {
    alert('最多只能新增 5 筆收件地址')
    return
  }
  if (index !== null) {
    Object.assign(addressForm, addresses.value[index])
    editingIndex.value = index
  } else {
    Object.assign(addressForm, {
      recipient_name: '',
      recipient_phone: '',
      postal_code: '',
      address_detail: '',
      is_default: false,
    })
    editingIndex.value = null
  }
  isEditing.value = true
}

const save = () => {
  // 確保只有一筆預設地址
  if (addressForm.is_default) {
    addresses.value.forEach((addr, i) => {
      if (i !== editingIndex.value) addr.is_default = false
    })
  }
  if (editingIndex.value !== null) {
    Object.assign(addresses.value[editingIndex.value], addressForm)
  } else {
    addresses.value.push({ ...addressForm, address_id: Date.now() })
  }
  isEditing.value = false
}

const remove = (index) => {
  if (confirm('確定要刪除這筆收件資料嗎？')) {
    addresses.value.splice(index, 1)
    alert('已刪除收件資料')
  }
}
</script>

<template>
  <div class="card p-4 shadow mb-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h3 class="fw-bold mb-0">收件資料</h3>
      <button v-if="!isEditing" @click="toggleEdit(null)" class="btn btn-outline-primary">
        新增收件資料
      </button>
    </div>

    <!-- 顯示模式 -->
    <div v-if="!isEditing">
      <div
        v-for="(addr, index) in addresses"
        :key="addr.address_id"
        class="border rounded p-3 mb-3"
      >
        <p><strong>收件人：</strong>{{ addr.recipient_name }}</p>
        <p><strong>電話：</strong>{{ addr.recipient_phone }}</p>
        <p><strong>郵遞區號：</strong>{{ addr.postal_code }}</p>
        <p><strong>地址：</strong>{{ addr.address_detail }}</p>
        <p><strong>預設地址：</strong>{{ addr.is_default ? '是' : '否' }}</p>
        <div class="d-flex gap-2 mt-2">
          <button @click="toggleEdit(index)" class="btn btn-sm btn-outline-secondary">編輯</button>
          <button @click="remove(index)" class="btn btn-sm btn-outline-danger">刪除</button>
        </div>
      </div>
    </div>

    <!-- 編輯模式 -->
    <div v-else>
      <input
        v-model="addressForm.recipient_name"
        class="form-control mb-2"
        placeholder="收件人姓名"
      />
      <input v-model="addressForm.recipient_phone" class="form-control mb-2" placeholder="電話" />
      <input v-model="addressForm.postal_code" class="form-control mb-2" placeholder="郵遞區號" />
      <input v-model="addressForm.address_detail" class="form-control mb-2" placeholder="地址" />
      <div class="form-check mb-3">
        <input
          type="checkbox"
          class="form-check-input"
          v-model="addressForm.is_default"
          id="defaultCheck"
        />
        <label class="form-check-label" for="defaultCheck">設為預設地址</label>
      </div>
      <div class="d-flex gap-2 mt-3">
        <button @click="isEditing = false" class="btn btn-secondary flex-grow-1">取消</button>
        <button @click="save" class="btn btn-primary flex-grow-1">確定</button>
      </div>
    </div>
  </div>
</template>
