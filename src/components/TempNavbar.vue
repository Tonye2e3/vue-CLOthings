<!-- src/components/TempNavbar.vue -->
<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="temp-navbar bg-white border-bottom py-3 mb-4 w-100">
    <div class="container-fluid container-lg d-flex align-items-center justify-content-start gap-4">
      <RouterLink to="/" class="text-decoration-none text-dark fw-medium fs-6">Home</RouterLink>
      <RouterLink to="/about" class="text-decoration-none text-dark fw-medium fs-6">About</RouterLink>
      <RouterLink to="/login" class="text-decoration-none text-dark fw-medium fs-6">Login</RouterLink>
      <span class="text-black-50">|</span>
      <RouterLink :to="{ name: 'sampleShop' }" class="text-decoration-none text-dark fw-medium fs-6">商城</RouterLink>
      <RouterLink :to="{ name: 'sampleGroupShop' }" class="text-decoration-none text-dark fw-medium fs-6">團購</RouterLink>
      <RouterLink :to="{ name: 'Community' }" class="text-decoration-none text-dark fw-bold fs-6 border-bottom border-2 border-dark pb-1">社群</RouterLink>
      <RouterLink :to="{ name: 'login' }" class="text-decoration-none text-dark fw-medium fs-6">使用者</RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.temp-navbar {
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.temp-navbar a:hover {
  opacity: 0.7;
}
</style>