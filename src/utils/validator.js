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

// 電話：只能數字，10 字元
export function isValidPhone(str) {
  // 先檢查是否都是數字
  if (!/^\d+$/.test(str)) {
    return '電話格式錯誤，只能輸入數字'
  }
  // 再檢查長度
  if (str.length !== 10) {
    return '電話長度必須是 10 位數'
  }

  return true
}
