import api from './api'

// Email 驗證
export const verifyEmail = (token) => {
  return api.post('/User/verify-email', {
    token,
  })
}

// 重新寄送 Email 驗證信
export const resendVerificationEmail = () => {
  return api.post('/User/resend-verification-email')
}
