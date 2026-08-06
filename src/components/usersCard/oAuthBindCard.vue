<script setup>
import { ref } from 'vue'

// Props: icon、名稱、初始綁定狀態
const props = defineProps({
  icon: Object,
  name: String,
  initialBound: Boolean,
})

const isBound = ref(props.initialBound)

const toggleBind = () => {
  isBound.value = !isBound.value
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
    <div class="d-flex align-items-center">
      <component :is="props.icon" class="me-2" />
      <span>{{ props.name }}</span>
      <small class="ms-2 text-muted"> ({{ isBound ? '已綁定' : '未綁定' }}) </small>
    </div>
    <button
      class="btn btn-outline-light btn-sm"
      :class="isBound ? 'bg-secondary text-white' : 'bg-success text-white'"
      @click="toggleBind"
    >
      {{ isBound ? '解除綁定' : '綁定' }}
    </button>
  </div>
</template>
