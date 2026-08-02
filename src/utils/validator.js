// 帳號：只能英數字，4～12 字元
export function isValidAccount(str) {
  const isValid = /^[a-zA-Z0-9]{4,12}$/.test(str)
  if (!isValid) return '帳號格式錯誤，只能英數字，4～12 字元'
}

// 密碼：只能英數字，至少 6 字元
export function isValidPassword(str) {
  const isValid = /^[a-zA-Z0-9]{6,}$/.test(str)
  if (!isValid) return '密碼格式錯誤，只能英數字，至少 6 字元'
}
