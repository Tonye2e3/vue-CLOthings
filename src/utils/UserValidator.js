export function isValidAccount(str) {
  const isValid = /^[a-zA-Z0-9]{4,50}$/.test(str)
  return isValid ? '' : '帳號格式錯誤，只能英數字，4～50 字元'
}

export function isValidPassword(str) {
  // 至少一個大寫、一個小寫，僅限英數字，長度 ≥ 6
  const isValid = /^(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]{6,}$/.test(str)
  return isValid ? '' : '密碼格式錯誤，需包含至少一個大寫與一個小寫字母，只能英數字，至少 6 字元'
}

export function isValidPhone(str) {
  // 必須 09 開頭，後面再接 8 個數字，共 10 碼
  const isValid = /^09\d{8}$/.test(str)
  return isValid ? '' : '請填入正確的手機格式（需 09 開頭，共 10 碼）'
}

// 郵件：必須符合 Email 格式
export function isValidEmail(str) {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
  return isValid ? '' : 'Email 格式錯誤，請輸入有效的郵件地址'
}
