<script setup>
import { isValidAccount, isValidPassword, isValidPhone, isValidEmail } from '@/utils/UserValidator'
import { ref, reactive } from 'vue'
const title = ref('會員註冊')
const agree = ref(false)

const member = reactive({
  username: '',
  account: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
})
</script>

<template>
  <div class="col-md-6 m-auto card p-4 mt-5 shadow" style="width: 800px">
    <h3 class="mb-4 fw-bold text-center">{{ title }}</h3>

    <!-- 表單區 -->
    <div class="form-floating mb-3">
      <input type="text" class="form-control" placeholder="帳號" v-model="member.account" />
      <label class="form-label">帳號</label>
      <span class="form-text text-danger">{{ isValidAccount(member.account) }}</span>
    </div>
    <div class="form-floating mb-3">
      <input type="text" class="form-control" placeholder="暱稱" v-model="member.username" />
      <label class="form-label">暱稱</label>
    </div>
    <div class="form-floating mb-3">
      <input type="text" class="form-control" placeholder="郵件" v-model="member.email" />
      <label class="form-label">郵件</label>
      <span class="form-text text-danger">{{ isValidEmail(member.email) }}</span>
    </div>
    <div class="form-floating mb-3">
      <input type="password" class="form-control" placeholder="密碼" v-model="member.password" />
      <label class="form-label">密碼</label>
      <span class="form-text text-danger">{{ isValidPassword(member.password) }}</span>
    </div>
    <div class="form-floating mb-3">
      <input
        type="password"
        class="form-control"
        placeholder="確認密碼"
        v-model="member.confirmPassword"
      />
      <label class="form-label">確認密碼</label>
    </div>
    <div class="form-floating mb-3">
      <input
        type="text"
        maxlength="10"
        class="form-control"
        placeholder="電話"
        v-model="member.phone"
      />
      <label class="form-label">電話</label>
      <span class="form-text text-danger">{{ isValidPhone(member.phone) }}</span>
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
        <li>暱稱：{{ member.username }}</li>
        <li>帳號：{{ member.account }}</li>
        <li>確認密碼：{{ member.confirmPassword }}</li>
        <li>同意條款：{{ agree }}</li>
      </ul>
    </div>

    <button class="btn btn-primary w-100 py-2" :disabled="agree == false">完成註冊</button>
    <div></div>
  </div>
</template>

<style scoped></style>
