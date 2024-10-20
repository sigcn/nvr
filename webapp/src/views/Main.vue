<script setup>

import { ref } from 'vue'

const profileMenu = ref()

function slideMenu() {
  profileMenu.value = !profileMenu.value
}

function signout() {
  window.localStorage.removeItem('session')
  window.location.href = '/'
}
</script>
<template>
  <div class="container">
    <div class="header">
      <div class="logo">NVR</div>
      <div class="user" @click="slideMenu">
        <span>Administrator</span>
        <ul class="menu" v-if="profileMenu">
          <li @click="signout"><a href="javascript:;">Sign out</a></li>
        </ul>
      </div>
    </div>
    <div class="main">
      <nav>
        <ul>
          <li><RouterLink to="/">Home</RouterLink></li>
          <li><RouterLink to="/cameras">Cameras</RouterLink></li>
          <li><RouterLink to="/settings">Settings</RouterLink></li>
        </ul>
      </nav>
      <div class="content"><RouterView /></div>
    </div>
  </div>
</template>

<script></script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
  width: 100vw;
  flex-direction: column;
}
.header {
  width: 100vw;
  height: 40px;
  background-color: #f6f8fa;
}
.header .logo {
  width: 120px;
  height: 40px;
  background-color: #083f39;
  color: #fff;
  font-size: 26px;
  line-height: 40px;
  text-align: center;
}
.header .user {
  float: right;
  height: 40px;
  line-height: 40px;
  margin: -40px 10px 0 0;
  width: 100px;
  z-index: 10000;
  position: relative;
  cursor: pointer;
}
.header .user .menu {
  width: 100px;
  list-style: none;
  z-index: 10000;
}
.header .user .menu li a {
  color: #2E90A0;
}
.header .user .menu li a:hover {
  color: #000;
}
.main {
  display: flex;
  flex: 1;
  flex-direction: row;
}
.main nav {
  height: 100%;
  width: 120px;
}
.main nav ul {
  height: 100%;
  display: flex;
  justify-content: center;
  justify-items: center;
  flex-direction: column;
}
.main nav ul li {
  font-size: 20px;
  height: 36px;
}
.main .content {
  flex: 1;
  padding: 20px;
}
</style>
