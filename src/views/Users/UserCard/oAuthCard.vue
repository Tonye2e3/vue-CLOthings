<script setup>
import IconGoogle from '@/components/icons/iconGoogle.vue'
import IconLine from '@/components/icons/IconLineColorful.vue'
import oAuthBindCard from '@/components/usersCard/oAuthBindCard.vue'
</script>

<template>
  <div class="card p-4 shadow mb-4">
    <h3>
      第三方帳號綁定
      <small class="text-secondary">(綁定後可使用第三方帳號登入。)</small>
    </h3>

    <!-- Google -->
    <oAuthBindCard :icon="IconGoogle" name="Google" :initialBound="true" />

    <!-- Line -->
    <oAuthBindCard :icon="IconLine" name="Line" :initialBound="false" />
  </div>
</template>
