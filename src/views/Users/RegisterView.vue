<script setup>
import { ref, reactive } from 'vue'
const title = ref('會員註冊')
const agree = ref(false)

const member = reactive({
  name: '',
  account: '',
  password: '',
  confirmPassword: '',
})

import { isValidAccount, isValidPassword } from '@/utils/validator'
</script>

<template>
  <div class="col-md-6 m-auto">
    <h3 class="mb-4 fw-bold">{{ title }}</h3>

    <!-- 表單區 -->
    <div class="mb-3">
      <label class="form-label">姓名</label>
      <input type="text" class="form-control" v-model="member.name" />
    </div>
    <div class="mb-3">
      <label class="form-label">帳號</label>
      <input type="text" class="form-control" v-model="member.account" />
      <span class="form-text text-danger">{{ isValidAccount(member.account) }}</span>
    </div>
    <div class="mb-3">
      <label class="form-label">密碼</label>
      <input type="password" class="form-control" v-model="member.password" />
      <span class="form-text text-danger">{{ isValidPassword(member.password) }}</span>
    </div>
    <div class="mb-3">
      <label class="form-label">確認密碼</label>
      <input type="password" class="form-control" v-model="member.confirmPassword" />
    </div>
    <div class="form-check mb-4">
      <input class="form-check-input" type="checkbox" id="agreeCheck" v-model="agree" />
      <label class="form-check-label" for="agreeCheck"> 我已閱讀並同意會員服務條款 </label>
    </div>

    <!-- 即時預覽 -->
    <div
      class="my-4 p-3 bg-body-secondary rounded"
      v-bind:class="{ 'bg-success-subtle': agree == true }"
    >
      <p class="fw-bold mb-2">📋 填寫預覽</p>
      <ul class="list-unstyled mb-0 small">
        <li>姓名：{{ member.name }}</li>
        <li>帳號：{{ member.account }}</li>
        <li>確認密碼：{{ member.confirmPassword }}</li>
        <li>同意條款：{{ agree }}</li>
      </ul>
    </div>

    <button class="btn btn-primary w-100 py-2" :disabled="agree == false">完成註冊</button>
  </div>
</template>

<style scoped></style>
