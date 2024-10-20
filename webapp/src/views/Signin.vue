<script setup>
import { ref } from 'vue'
import http from '../http'

const errtips = ref('')
const btnText = ref('Sign in')
const idText = ref('')
const passwordText = ref('')

async function signIn() {
  errtips.value = ''
  btnText.value = 'Signning in'
  let r = await http.post('/v1/api/keys', {
    body: { id: idText.value, password: passwordText.value },
  })
  console.log(r)
  btnText.value = 'Sign in'
  if (r.code != 0) {
    errtips.value = r.msg
    return
  }
  window.localStorage.setItem('session', JSON.stringify(r.data))
  window.location.href = '/'
}
</script>

<template>
  <div class="container">
    <div class="left-side">
      <div class="logo">NVR</div>
      <div class="line"></div>
    </div>
    <div class="right-side">
      <div>
        <h2>Sign in</h2>
        <div class="login-form">
          <div>
            <label>Username</label>
            <input type="text" id="username" v-model="idText" />
          </div>
          <div>
            <label>Password</label>
            <input type="password" id="password" v-model="passwordText" />
          </div>
          <div class="errtips" v-if="errtips">{{ errtips }}</div>
          <button type="button" @click="signIn">{{ btnText }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.left-side {
  width: 70%;
  background-color: #fff;
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  position: relative; /* 使 line 定位在右边 */
}

.left-side .logo {
  width: 600px;
  height: 260px;
  background-color: #097165;
  color: #fff;
  font-size: 100px;
  line-height: 260px;
  text-align: center;
  border-radius: 4px;
}

.left-side .line {
  height: 100vh;
  width: 2px;
  position: absolute; /* 使用绝对定位 */
  right: 0; /* 贴右边 */
  top: 50%; /* 从顶部开始 50% */
  transform: translateY(-50%); /* 上下居中 */
  background-color: #f0f0f0;
}

/* 右侧部分，宽度为 40%，放置登录表单 */
.right-side {
  width: 30%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
}

.login-form {
  background: #f6f8fa;
  padding: 20px;
  width: 340px;
  border-radius: 5px;
  border: 1px solid #ccc;
  margin-bottom: 30px;
}

.right-side h2 {
  margin-bottom: 30px;
  text-align: center;
  width: 100%;
  display: block;
}

.login-form input {
  width: 100%;
  line-height: 32px;
  padding: 0 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  color: #59636e;
  background: #f6f8fa;
}

.login-form button {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background-color: #044941;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #023630;
}

.login-form button:hover {
  background-color: #0f6157;
}
</style>
