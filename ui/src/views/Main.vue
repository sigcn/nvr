<script setup>
import IconMenu from '@/components/icons/IconMenu.vue'
import IconCamera from '@/components/icons/IconCamera.vue'
import IconSettings from '@/components/icons/IconSettings.vue'
import IconStorage from '@/components/icons/IconStorage.vue'
import http from '@/http'
import { ref } from 'vue'

const profileMenu = ref()
const nav = ref()

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

function openNav() {
  if (window.screen.availWidth > 1024) {
    return
  }
  let navStyle = window.getComputedStyle(nav.value)
  if (navStyle.visibility == 'hidden') {
    nav.value.style.visibility = 'visible'
    nav.value.style.opacity = 0.9
    return
  }
  nav.value.style.visibility = 'hidden'
  nav.value.style.opacity = 0
}
</script>
<template>
  <div class="container">
    <div class="header">
      <div class="nav-btn" @click="openNav"><IconMenu /></div>
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
      <nav ref="nav" @click="openNav">
        <ul @click.stop="">
          <li>
            <RouterLink to="/cameras">
              <IconCamera class="icon" />{{ $t('nav.cameras') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/storage">
              <IconStorage class="icon" />{{ $t('nav.storage') }}
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/settings">
              <IconSettings class="icon" />{{ $t('nav.settings') }}
            </RouterLink>
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
.header .nav-btn {
  display: none;
}
.header .logo {
  width: 139px;
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
  margin: -38px 0 0 0;
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
  max-height: calc(100vh - 36px);
  width: 139px;
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
  .main nav {
    visibility: hidden;
    position: absolute;
    z-index: 100;
    opacity: 0;
    width: 100%;
    transition:
      opacity 0.5s ease,
      visibility 0.5s ease;
  }
  .main nav ul {
    background-color: #083f39;
    width: 139px;
  }
  nav a {
    color: #aaa;
  }
  nav a:hover {
    text-decoration: none;
  }
  .main nav ul li .icon {
    fill: #aaa;
  }
  .main nav ul li .router-link-active .icon {
    fill: #fff;
  }
  .router-link-active {
    color: #fff;
  }
  .header .nav-btn {
    fill: #fff;
    width: 36px;
    height: 36px;
    float: left;
    margin: 0 -37px 0 1px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .header .nav-btn svg {
    width: 16px;
    height: 16px;
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
