import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 設定 pinia 的持久化儲存
export const useAuthStore = defineStore(
  'auth',
  () => {
    // =========================
    // 登入狀態
    // =========================
    const token = ref('')
    const userId = ref(null)
    const name = ref('')
    const account = ref('')
    const role = ref('')

    // =========================
    // 登入成功
    // =========================
    function setAuth(data) {
      token.value = data.token
      userId.value = data.userId
      name.value = data.name
      account.value = data.account
      role.value = data.role
    }

    // =========================
    // Refresh Token 成功
    // 只更新新的 Access Token
    // =========================
    function setToken(newToken) {
      token.value = newToken
    }

    // =========================
    // 清除登入資料
    // =========================
    function clearAuth() {
      token.value = ''
      userId.value = null
      name.value = ''
      account.value = ''
      role.value = ''
    }

    // =========================
    // Computed
    // =========================
    const isLoggedIn = computed(() => token.value !== '')

    const isAdmin = computed(() => role.value === 'Admin' || role.value === 'SuperAdmin')

    const isSuperAdmin = computed(() => role.value === 'SuperAdmin')

    return {
      token,
      userId,
      name,
      account,
      role,

      isLoggedIn,
      isAdmin,
      isSuperAdmin,

      setAuth,
      setToken,
      clearAuth,
    }
  },

  {
    persist: true,
  },
)
