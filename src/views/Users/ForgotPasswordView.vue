<script setup>
import { ref } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const isLoading = ref(false)
const isSent = ref(false)
const errorMessage = ref('')

async function submitForgotPassword() {
    // 清除上一次錯誤
    errorMessage.value = ''

    if (!email.value.trim()) {
        errorMessage.value = '請輸入電子郵件'
        return
    }

    try {
        isLoading.value = true

        await api.post('/User/forgot-password', {
            email: email.value.trim(),
        })

        // 不管 Email 是否真的存在，都顯示相同結果
        isSent.value = true
    } catch (error) {
        console.error('忘記密碼失敗：', error)

        errorMessage.value = '系統暫時無法處理，請稍後再試'
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="forgot-page">
        <div class="forgot-card">

            <!-- 尚未送出 -->
            <template v-if="!isSent">
                <div class="forgot-header">
                    <p class="forgot-label">PASSWORD RECOVERY</p>

                    <h1>忘記密碼？</h1>

                    <p>
                        輸入你的會員電子郵件，
                        我們會寄送密碼重設連結給你。
                    </p>
                </div>

                <div class="form-group">
                    <label>電子郵件</label>

                    <input v-model="email" type="email" class="form-input" placeholder="請輸入電子郵件" autocomplete="email"
                        @keyup.enter="submitForgotPassword" />

                    <span class="error-text">
                        {{ errorMessage }}
                    </span>
                </div>

                <button type="button" class="submit-btn" :disabled="isLoading" @click="submitForgotPassword">
                    {{ isLoading ? '寄送中...' : '寄送重設連結' }}
                </button>

                <button type="button" class="back-btn" @click="router.push('/login')">
                    返回登入
                </button>
            </template>


            <!-- 已送出 -->
            <template v-else>
                <div class="success-area">

                    <div class="success-icon">
                        ✓
                    </div>

                    <p class="forgot-label">
                        EMAIL SENT
                    </p>

                    <h1>請檢查你的信箱</h1>

                    <p>
                        如果
                        <strong>{{ email }}</strong>
                        已註冊 CLOthings，
                        你將會收到密碼重設信件。
                    </p>

                    <p class="hint">
                        沒收到信件？請檢查垃圾郵件，
                        或稍後重新嘗試。
                    </p>

                    <button type="button" class="submit-btn" @click="router.push('/login')">
                        返回登入
                    </button>

                    <button type="button" class="back-btn" @click="isSent = false">
                        重新寄送
                    </button>

                </div>
            </template>

        </div>
    </div>
</template>

<style scoped>
.forgot-page {
    min-height: calc(100vh - 80px);

    display: flex;
    justify-content: center;
    align-items: flex-start;

    padding: 80px 20px;

    background: #f7f4f0;
}

.forgot-card {
    width: 100%;
    max-width: 520px;

    padding: 48px;

    background: #ffffff;

    border: 1px solid #eeeeee;
    border-radius: 16px;

    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.03),
        0 16px 40px rgba(0, 0, 0, 0.05);
}


/* Header */

.forgot-header {
    text-align: center;

    margin-bottom: 36px;
}

.forgot-label {
    margin-bottom: 8px;

    color: #999999;

    font-size: 11px;
    font-weight: 700;

    letter-spacing: 2px;
}

.forgot-header h1,
.success-area h1 {
    margin-bottom: 10px;

    color: #222222;

    font-size: 28px;
    font-weight: 700;
}

.forgot-header p,
.success-area p {
    color: #888888;

    font-size: 13px;

    line-height: 1.7;
}


/* Form */

.form-group {
    margin-bottom: 22px;
}

.form-group label {
    display: block;

    margin-bottom: 8px;

    color: #333333;

    font-size: 13px;
    font-weight: 600;
}

.form-input {
    width: 100%;
    height: 46px;

    padding: 0 14px;

    border: 1px solid #dddddd;
    border-radius: 8px;

    background: #ffffff;

    color: #222222;

    font-size: 14px;

    outline: none;

    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.form-input::placeholder {
    color: #bbbbbb;
}

.form-input:focus {
    border-color: #555555;

    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}


/* Error */

.error-text {
    display: block;

    min-height: 18px;

    margin-top: 5px;

    color: #d9534f;

    font-size: 11px;
}


/* Buttons */

.submit-btn {
    width: 100%;
    height: 48px;

    border: none;
    border-radius: 8px;

    background: #222222;

    color: #ffffff;

    font-size: 14px;
    font-weight: 600;

    cursor: pointer;

    transition:
        background 0.2s ease,
        opacity 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
    background: #000000;
}

.submit-btn:disabled {
    opacity: 0.6;

    cursor: not-allowed;
}

.back-btn {
    width: 100%;

    margin-top: 16px;

    border: none;

    background: transparent;

    color: #777777;

    font-size: 12px;

    cursor: pointer;
}

.back-btn:hover {
    color: #222222;

    text-decoration: underline;
}


/* Success */

.success-area {
    text-align: center;
}

.success-icon {
    width: 54px;
    height: 54px;

    display: flex;
    justify-content: center;
    align-items: center;

    margin: 0 auto 24px;

    border-radius: 50%;

    background: #222222;

    color: #ffffff;

    font-size: 22px;
    font-weight: 700;
}

.success-area strong {
    color: #333333;

    font-weight: 600;
}

.success-area .hint {
    margin: 22px 0 28px;

    padding: 14px;

    background: #f8f8f7;

    border-radius: 8px;

    color: #999999;

    font-size: 11px;
}


/* RWD */

@media (max-width: 600px) {
    .forgot-page {
        padding: 40px 16px;
    }

    .forgot-card {
        padding: 32px 24px;
    }
}
</style>