<script setup>
import { ref } from 'vue'

const props = defineProps({
  icon: Object,
  name: String,
  initialBound: Boolean,
})

const isBound = ref(props.initialBound)

// 目前暫時只有前端切換
// 後續接 OAuth API 時再修改這裡
const toggleBind = () => {
  isBound.value = !isBound.value
}
</script>

<template>
  <div class="oauth-provider">
    <!-- 左側：Logo + 平台資訊 -->
    <div class="provider-info">
      <div class="provider-icon">
        <component :is="props.icon" />
      </div>

      <div>
        <div class="provider-name">
          {{ props.name }}
        </div>

        <div class="provider-status" :class="{ bound: isBound }">
          <span class="status-dot"></span>

          {{ isBound ? '已綁定' : '尚未綁定' }}
        </div>
      </div>
    </div>

    <!-- 右側操作 -->
    <button
      type="button"
      class="user-btn"
      :class="isBound ? 'user-btn-secondary' : 'user-btn-primary'"
      @click="toggleBind"
    >
      {{ isBound ? '解除綁定' : '立即綁定' }}
    </button>
  </div>
</template>

<style scoped>
.oauth-provider {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding: 18px 20px;

  background: #ffffff;

  border: 1px solid #e8e8e8;
  border-radius: 12px;

  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.oauth-provider:hover {
  border-color: #cfcfcf;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
}

/* Provider */

.provider-info {
  display: flex;
  align-items: center;

  gap: 14px;
}

.provider-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 46px;
  height: 46px;

  flex-shrink: 0;

  background: #f8f8f8;

  border: 1px solid #eeeeee;
  border-radius: 10px;
}

/*
  避免 Google / LINE SVG 太大
*/
.provider-icon :deep(svg) {
  width: 25px;
  height: 25px;
}

.provider-name {
  margin-bottom: 4px;

  color: #222222;

  font-size: 15px;
  font-weight: 700;
}

/* Status */

.provider-status {
  display: flex;
  align-items: center;

  gap: 6px;

  color: #999999;

  font-size: 12px;
}

.status-dot {
  width: 7px;
  height: 7px;

  background: #bbbbbb;

  border-radius: 50%;
}

.provider-status.bound {
  color: #198754;
}

.provider-status.bound .status-dot {
  background: #198754;
}

/* RWD */

@media (max-width: 576px) {
  .oauth-provider {
    align-items: stretch;
    flex-direction: column;
  }

  .oauth-provider .user-btn {
    width: 100%;
  }
}
</style>
