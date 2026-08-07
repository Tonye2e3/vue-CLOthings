<script setup>
import AccountCard from './UserCard/AccountCard.vue'
import AddressCard from './UserCard/AddressCard.vue'
import ProfileCard from './UserCard/ProfileCard.vue'
import oAuthCard from './UserCard/OAuthCard.vue'
</script>

<template>
  <div class="row">
    <!-- 左側固定導覽列 -->
    <nav class="col-12 col-md-3 sidebar list-group mb-3 mb-md-0">
      <ul>
        <li><a href="#account">帳戶資料</a></li>
        <li><a href="#profile">個人資料</a></li>
        <li><a href="#address">收件資料</a></li>
        <li><a href="#oauth">第三方登入</a></li>
      </ul>
    </nav>

    <!-- 右側主要內容 -->
    <div class="col-12 col-md-9 content-area">
      <AccountCard id="account" />
      <ProfileCard id="profile" />
      <AddressCard id="address" />
      <oAuthCard id="oauth" />
    </div>
  </div>
</template>

<style scoped>
.content-area {
  margin-left: 510px; /* 350 + 160 */
  margin-top: 50px;
}

.sidebar {
  position: fixed;
  top: 100px; /* 可依實際 header 高度調整 */
  left: 350px;
  width: 160px;
  height: 50%; /* 設定高度為 100% 以填滿整個視窗高度 */
  padding: 20px;
  background-color: rgb(255, 255, 254);
  border: 1px solid #ccc;
  border-radius: 0.375rem;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin-bottom: 15px;
}

.sidebar a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

.sidebar a:hover {
  color: #007bff;
}

.content-area {
  margin-left: 220px; /* 須與 sidebar 寬度對齊 */
  width: 800px;
}
</style>
