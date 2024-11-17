<script setup>
import { ref } from 'vue'
import http from '../http'

const errtips = ref('')
const btnText = ref('Sign in')
const idText = ref('')
const passwordText = ref('')
const idInput = ref()
const passwordInput = ref()

async function signIn() {
  if (!idText.value) {
    idInput.value.focus()
    return
  }
  if (!passwordText.value) {
    passwordInput.value.focus()
    return
  }
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
        <h2>Sign in to console</h2>
        <div class="login-form">
          <div>
            <label>Username</label>
            <input
              ref="idInput"
              @keydown.enter="signIn"
              type="text"
              id="username"
              v-model="idText"
            />
          </div>
          <div>
            <label>Password</label>
            <input
              ref="passwordInput"
              @keydown.enter="signIn"
              type="password"
              id="password"
              v-model="passwordText"
            />
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
  justify-content: center;
  align-items: center;
  position: relative;
}

.left-side .logo {
  width: 520px;
  height: 200px;
  background-color: #097165;
  color: #fff;
  font-size: 100px;
  line-height: 200px;
  text-align: center;
  border-radius: 2px;
  box-shadow: 0 0 5px #ccc;
}

.left-side .line {
  height: 100vh;
  width: 2px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background-color: #f0f0f0;
}

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
  width: 300px;
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
  background: #fff;
}

.login-form button {
  width: 100%;
  padding: 0px;
  height: 32px;
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

@media screen and (max-width: 1024px) {
  .left-side {
    display: none;
  }
  .right-side {
    width: 100%;
  }
}
</style>
