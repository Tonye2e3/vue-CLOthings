<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <header>
    <!-- <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" /> -->

    <div class="wrapper">
      <!-- <HelloWorld msg="You did it!" /> -->

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        
        <RouterLink to="/login">Login</RouterLink>

        <RouterLink :to="{ name: 'sampleShop' }" class="nav-item nav-link link-body-emphasis"
          >商城2</RouterLink
        >
        <RouterLink :to="{ name: 'sampleGroupShop' }" class="nav-item nav-link link-body-emphasis"
          >團購</RouterLink
        >
        <RouterLink :to="{ name: 'Community' }" class="nav-item nav-link link-body-emphasis"
          >社群</RouterLink
        >
        <RouterLink :to="{ name: 'login' }" class="nav-item nav-link link-body-emphasis"
          >使用者</RouterLink
        >
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
body {
  margin: 0;
  padding: 0;
}
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

/* @media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
  }
} */
</style>
