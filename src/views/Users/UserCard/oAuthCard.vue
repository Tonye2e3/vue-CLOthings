<script setup>
import IconGoogle from '@/components/icons/iconGoogle.vue'
import IconLine from '@/components/icons/IconLineColorful.vue'
import oAuthBindCard from '@/components/usersCard/oAuthBindCard.vue'
</script>

<template>
  <div class="user-card">
    <!-- 標題區 -->
    <div class="user-card-header">
      <div>
        <p class="user-section-label">CONNECTED ACCOUNTS</p>

        <h2 class="user-card-title">第三方帳號</h2>

        <p class="user-card-description">綁定第三方帳號後，可以使用其他登入方式快速登入。</p>
      </div>
    </div>

    <!-- 第三方帳號列表 -->
    <div class="oauth-list">
      <!-- Google -->
      <oAuthBindCard :icon="IconGoogle" name="Google" :initialBound="true" />

      <!-- LINE -->
      <oAuthBindCard :icon="IconLine" name="LINE" :initialBound="false" />
    </div>

    <!-- 提示 -->
    <div class="oauth-notice">
      <span class="notice-icon">i</span>

      <p>綁定第三方帳號不會變更原本的會員資料， 僅增加其他登入方式。</p>
    </div>
  </div>
</template>

<style scoped>
.oauth-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.oauth-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;

  margin-top: 22px;
  padding: 14px 16px;

  background: #f8f8f7;
  border-radius: 10px;

  color: #777777;
  font-size: 12px;
  line-height: 1.6;
}

.oauth-notice p {
  margin: 0;
}

.notice-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 18px;
  height: 18px;

  flex-shrink: 0;

  border: 1px solid #aaaaaa;
  border-radius: 50%;

  color: #777777;
  font-size: 11px;
  font-weight: 700;
}
</style>
