<template>
  <header class="navbar">
    <div class="nav-left">
      <img src="@/assets/CLOthingsLogo.svg" alt="CLO.things logo" class="logo" />
      <span class="brand">CLO.things</span>
    </div>

    <nav class="nav-center">
      <RouterLink to="/">首頁</RouterLink>
      <RouterLink to="/categories">分類</RouterLink>
      <RouterLink :to="{ name: 'sampleCommunity' }">社群</RouterLink>
      <RouterLink :to="{ name: 'sampleGroupShop' }">團購</RouterLink>
      <RouterLink :to="{ name: 'login' }">會員</RouterLink>
      <RouterLink :to="{ name: 'sampleShop' }">購物車</RouterLink>
    </nav>

    <div class="nav-right">
      <input type="text" placeholder="Search in site" />
      <i class="fa fa-search"></i>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #000000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  height: 32px;
  margin-right: 0.5rem;
}

.brand {
  font-weight: 600;
  font-size: 1.1rem;
}

.nav-center a {
  margin: 0 0.8rem;
  color: #333;
  text-decoration: none;
}

.nav-center a:hover {
  color: #000;
}

.nav-right {
  display: flex;
  align-items: center;
}

.nav-right input {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
}

.nav-right i {
  margin-left: 0.4rem;
  color: #666;
}
</style>
