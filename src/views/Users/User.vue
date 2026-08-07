<script setup>
import AccountCard from './UserCard/AccountCard.vue'
import AddressCard from './UserCard/AddressCard.vue'
import ProfileCard from './UserCard/ProfileCard.vue'
import oAuthCard from './UserCard/OAuthCard.vue'
</script>

<template>
  <div class="container mt-5" style="width: 800px; margin: auto">
    <AccountCard />
    <ProfileCard />
    <AddressCard />
    <oAuthCard />
  </div>
</template>
