<script setup>
import LoginView from './views/LoginView.vue'
import HomeView from './views/HomeView.vue'
import { ref, onMounted } from 'vue'

const session = ref()

onMounted(async () => {
  let sessionVal = window.localStorage.getItem('session')
  session.value = JSON.parse(sessionVal)
})
</script>

<template>
  <LoginView v-if="!session" />
  <HomeView v-else />
</template>
