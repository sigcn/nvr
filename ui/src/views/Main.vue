<script setup>
import http from '@/http'
import { ref } from 'vue'

const profileMenu = ref()

function slideMenu() {
  profileMenu.value = !profileMenu.value
}

async function signout() {
  let sessionVal = window.localStorage.getItem('session')
  let session = JSON.parse(sessionVal)
  window.localStorage.removeItem('session')
  await http.delete('/v1/api/keys', { session: session })
  window.location.reload()
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
          <li><RouterLink to="/cameras">Cameras</RouterLink></li>
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
  height: 36px;
  background-color: #f6f8fa;
  border-bottom: var(--borderWidth-thin) solid #d1d9e0;
}
.header .logo {
  width: 136px;
  height: 36px;
  line-height: 36px;
  background-color: #083f39;
  color: #fff;
  font-size: 30px;
  text-align: center;
  user-select: none;
}
.header .user {
  float: right;
  height: 40px;
  line-height: 40px;
  margin: -38px 10px 0 0;
  width: 100px;
  z-index: 10000;
  position: relative;
  cursor: pointer;
  user-select: none;
}
.header .user .menu {
  width: 100px;
  list-style: none;
  z-index: 10000;
}
.header .user .menu li a {
  color: #2e90a0;
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
  width: 136px;
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
  max-height: calc(100vh - 36px);
  overflow-y: scroll;
}

@media screen and (max-width: 1024px) {
  nav {
    display: none;
  }
}
</style>
