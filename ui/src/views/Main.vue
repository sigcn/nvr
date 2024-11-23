<script setup>
import IconCamera from '@/components/icons/IconCamera.vue'
import IconSettings from '@/components/icons/IconSettings.vue'
import IconStorage from '@/components/icons/IconStorage.vue'
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
          <li @click="signout">
            <a href="javascript:;">{{ $t('signin.signout') }}</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="main">
      <nav>
        <ul>
          <li>
            <RouterLink to="/cameras"
              ><IconCamera class="icon" />{{ $t('nav.cameras') }}</RouterLink
            >
          </li>
          <li>
            <RouterLink to="/storage"
              ><IconStorage class="icon" />{{ $t('nav.storage') }}</RouterLink
            >
          </li>
          <li>
            <RouterLink to="/settings"
              ><IconSettings class="icon" />{{ $t('nav.settings') }}</RouterLink
            >
          </li>
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
  height: 38px;
  font-family:
    ui-monospace,
    SFMono-Regular,
    SF Mono,
    Menlo,
    Consolas,
    Liberation Mono,
    monospace;
}
.main nav ul li .icon {
  width: 22px;
  height: 22px;
  float: left;
  margin-top: 4px;
  margin-right: 2px;
  fill: #2e90a0;
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

<style>
.router-link-active {
  color: #000;
}

.main nav ul li .router-link-active .icon {
  fill: #000;
}
</style>
