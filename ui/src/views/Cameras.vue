<script setup>
import { onMounted, ref } from 'vue'
import http from '@/http'
import Video from '@/components/Video.vue'
import IconAdd from '@/components/icons/IconAdd.vue'

const cameras = ref([])
const addr = ref()
const username = ref()
const password = ref()
const formOpened = ref()
const addrRef = ref()
const usernameRef = ref()
const passwordRef = ref()
const saveBtnText = ref('Save')
const errTips = ref('')

onMounted(async () => {
  let sessionVal = window.localStorage.getItem('session')
  let session = JSON.parse(sessionVal)
  await loadCameras(session)
})

async function loadCameras(session) {
  let r = await http.get('/v1/api/cameras', { session: session })
  console.log(r)
  if (r.code != 0) {
    return
  }
  cameras.value = r.data
}

async function saveForm() {
  if (!addr.value) {
    addrRef.value.focus()
    return
  }
  if (!username.value) {
    usernameRef.value.focus()
    return
  }
  if (!password.value) {
    passwordRef.value.focus()
    return
  }
  saveBtnText.value = 'Committing'
  let sessionVal = window.localStorage.getItem('session')
  let session = JSON.parse(sessionVal)
  let r = await http.post('/v1/api/cameras', {
    body: {
      type: 'onvif',
      addr: addr.value,
      username: username.value,
      password: password.value,
    },
    session,
  })
  saveBtnText.value = 'Save'
  if (r.code != 0) {
    errTips.value = r.msg
    return
  }
  formOpened.value = false
  await destroyVideos()
  await loadCameras(session)
  loadVideos(session)
}

function openForm() {
  errTips.value = ''
  formOpened.value = !formOpened.value
}
</script>
<template>
  <ul>
    <li v-for="(cam, i) in cameras">
      <Video
        :src="`${http.apiServer}/media/${cam.id}/live.ts`"
        :muted="true"
      ></Video>
      <div class="desc">
        <div class="text">
          <div class="b remark">
            {{ cam.remark ? `${cam.remark}` : cam.meta.manufacturer }}
          </div>
          <div class="b model" v-if="cam.meta.manufacturer">
            {{ cam.meta.manufacturer }}
          </div>
          <div class="b model" v-if="cam.meta.model">{{ cam.meta.model }}</div>
        </div>
        <div class="enter">
          <RouterLink :to="`/cameras/${cam.id}`">Enter</RouterLink>
        </div>
      </div>
    </li>
    <li>
      <div class="addArea" v-if="!formOpened" @click="openForm">
        <IconAdd class="add" />
      </div>
      <div class="addForm" v-if="formOpened">
        <div class="form">
          <label>Type</label>
          <select>
            <option>onvif</option></select
          ><br />
          <label>Addr</label>
          <input
            ref="addrRef"
            type="text"
            v-model="addr"
            @keydown.enter="saveForm"
          />
          <label>Username</label>
          <input
            ref="usernameRef"
            type="text"
            v-model="username"
            @keydown.enter="saveForm"
          />
          <label>Password</label>
          <input
            ref="passwordRef"
            type="password"
            v-model="password"
            @keydown.enter="saveForm"
          />
          <div class="errTips">{{ errTips }}</div>
          <div class="btns">
            <a class="btn-save mainbtn" href="javascript:;" @click="saveForm">{{
              saveBtnText
            }}</a>
            <a class="btn-cancel mainbtn" href="javascript:;" @click="openForm"
              >Cancel</a
            >
          </div>
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
ul {
  display: flex;
  flex-wrap: wrap;
  padding: 15px;
  margin: 0;
  list-style: none;
}
li {
  display: flex;
  width: 560px;
  flex-direction: column;
  position: relative;
  margin: 0 15px 10px 0;
  border-radius: 3px 3px 0 0;
  overflow: hidden;
}

li .desc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 10px;
  background-color: #f6f8fa;
  color: #023630;
}

li .desc .text {
  display: flex;
  flex-direction: row;
  align-items: center;
}

li .desc .b {
  margin-right: 10px;
}

li .desc .remark {
  font-weight: bold;
}

li .desc .model {
  font-size: 12px;
  color: #0f6157;
}

li .desc .enter {
  width: 52px;
  height: 42px;
  line-height: 42px;
  cursor: pointer;
  color: #023630;
  border-radius: 5px;
  text-align: center;
}

li .desc .enter:hover {
  color: #0f6157;
}

.addArea {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  min-height: 346px;
}
.addArea:hover {
  background-color: var(--header-bg);
}

.addArea:hover .add {
  fill: #e6e6e6;
}

.addArea .add {
  fill: #f6f8fa;
  width: 120px;
  height: 120px;
}

.addForm {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.addForm .form {
  background: #f6f8fa;
  padding: 20px;
  border-radius: 5px;
  height: 100%;
}

.addForm .form label {
  color: #333;
  margin-right: 10px;
  font-size: 16px;
}
.addForm .form input {
  width: 100%;
  line-height: 32px;
  padding: 0 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  color: #59636e;
  background: #fff;
}

.addForm .form .btns {
  margin-top: 10px;
}

.btn-save,
.btn-cancel {
  width: 100px;
  margin-right: 10px;
  line-height: 32px;
  height: 32px;
}

.errTips {
  max-height: 26px;
  overflow-y: scroll;
  line-height: 26px;
  color: red;
}

.btn-cancel {
  opacity: 0.8;
}

@media screen and (max-width: 1024px) {
  li {
    width: 100%;
    margin: 0;
    margin-bottom: 15px;
    border-radius: 0;
  }
  ul {
    padding: 0;
  }
}
</style>
