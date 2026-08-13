import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 設定 pinia 的持久化儲存
export const useAuthStore = defineStore(
  'auth', //狀態名稱
  () => {
    const token = ref('')
    const name = ref('')
    const account = ref('')
    const role = ref('') // "member" | "admin"

    function setAuth(data) {
      token.value = data.token
      name.value = data.name
      account.value = data.account
      role.value = data.role
    }

    function clearAuth() {
      token.value = ''
      name.value = ''
      account.value = ''
      role.value = ''
    }

    const isLoggedIn = computed(() => token.value !== '')
    const isAdmin = computed(() => role.value === 'Admin' || role.value === 'SuperAdmin')

    return {
      token,
      name,
      account,
      role,
      isLoggedIn,
      isAdmin,
      setAuth,
      clearAuth,
    }
  },
  { persist: true },
)
