<script setup>
import { onMounted, ref } from 'vue'
import http from '../http'
import mpegts from 'mpegts.js'
import { onBeforeRouteLeave } from 'vue-router'

const cameras = ref([])
const videos = ref([])
const addr =ref()
const username =ref()
const password = ref()
const formOpened = ref()
const addrRef =ref()
const usernameRef = ref()
const passwordRef = ref()

onMounted(async () => {
  let sessionVal = window.localStorage.getItem('session')
  let session = JSON.parse(sessionVal)
  await loadCameras(session)
  loadVideos(session)
})

onBeforeRouteLeave(destroyVideos)

async function destroyVideos() {
  videos.value.forEach((v, i) => {
    v.player.destroy()
  })
}

async function loadVideos(session) {
  videos.value.forEach(async (v, i) => {
    if (mpegts.getFeatureList().mseLivePlayback) {
      var player = mpegts.createPlayer({
        type: 'mpegts',
        isLive: true,
        url: `${http.apiServer}${v.dataset.url}?api_key=${session.key}`,
      })
      player.attachMediaElement(v)
      player.on(mpegts.Events.MEDIA_INFO, function(mediaInfo) {
          console.log('Media Info:', mediaInfo)
          cameras.value[i].videoCodec = mediaInfo.videoCodec
          cameras.value[i].audioCodec = mediaInfo.audioCodec
          cameras.value[i].fps = mediaInfo.fps
      });
      v.player = player
      cameras.value[i].loading = true
      player.load()
      try {
        await player.play()
        cameras.value[i].playing = true
        cameras.value[i].loading = false
      } catch (_) {
        setTimeout(() => {
          player.unload()
          player.detachMediaElement()
          cameras.value[i].playing = false
          cameras.value[i].loading = false
        }, 100)
      }
    }
  })
}

async function loadCameras(session) {
  let r = await http.get('/v1/api/cameras', { session: session })
  console.log(r)
  if (r.code != 0) {
    return
  }
  cameras.value = r.data
}

async function play(i) {
  if (cameras.value[i].playing) {
    stop(i)
    return
  }
  let player = videos.value[i].player
  player.attachMediaElement(videos.value[i])
  player.load()
  cameras.value[i].loading = true
  await player.play()
  cameras.value[i].playing = true
  cameras.value[i].loading = false
}

function stop(i) {
  let player = videos.value[i].player
  player.unload()
  player.detachMediaElement()
  cameras.value[i].playing = false
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
  let sessionVal = window.localStorage.getItem("session")
  let session = JSON.parse(sessionVal)
  let r = await http.post('/v1/api/cameras', {body: {
    type: "onvif",
    addr: addr.value,
    username: username.value,
    password: password.value}, session})
  if(r.code!=0){
    alert(r.msg)
    return
  }
  formOpened.value=false
  await destroyVideos()
  await loadCameras(session)
  loadVideos(session)
}

function openForm() {
  formOpened.value = !formOpened.value
}
</script>
<template>
  <div class="operations">
    <div class="add" v-if="!formOpened"><a href="javascript:;" @click="openForm">+Add</a></div>
    <div class="form" v-if="formOpened">
      <label>Type</label>
      <select>
        <option>onvif</option>
      </select>
      <label>Addr</label>
      <input ref="addrRef" type="text" v-model="addr" @keydown.enter="saveForm" />
      <label>Username</label>
      <input ref="usernameRef" type="text" v-model="username" @keydown.enter="saveForm" />
      <label>Password</label>
      <input ref="passwordRef" type="password" v-model="password" @keydown.enter="saveForm" />
      <a class="btn-save" href="javascript:;" @click="saveForm">Save</a>
      <a class="btn-cancel" href="javascript:;" @click="openForm">Cancel</a>
    </div>
  </div>
  <ul>
    <li v-for="(cam, i) in cameras">
      <div class="bg" v-if="!cam.playing">
      no video signal
      </div>
      <video
        ref="videos"
        class="video"
        @mouseenter="cam.showmenu=true"
        :data-url="`/media/${cam.id}/live.ts`"
        :style="`display: ${cam.playing?'block':'none'}`"
      ></video>
      <div class="menu" v-if="!cam.playing || cam.showmenu" @mouseleave="cam.showmenu=false">
        <div class="play" @click="play(i)">
          {{ cam.playing ? 'Stop' : cam.loading ? '•' : 'Play' }}
        </div>
        <div class="media">
          <label>videoCodec</label>
          <span>{{ cam.videoCodec }}</span>
          <label>audioCodec</label>
          <span>{{ cam.audioCodec }}</span>
          <label>fps</label>
          <span>{{ cam.fps }}</span>
        </div>
      </div>
      <div class="desc">
        <div class="text">
          <div class="b remark">{{ cam.remark ? `${cam.remark}` : cam.meta.manufacturer }}</div>
        <div class="b model" v-if="cam.meta.manufacturer">{{ cam.meta.manufacturer }}</div>
        <div class="b model" v-if="cam.meta.model">{{ cam.meta.model }}</div>
        </div>
        <div class="enter"><a href="">Enter</a></div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.operations {
  height: 46px;
  line-height: 46px;
  display: flex;
}
.operations .add {
  color: #023630;
}

.operations .form label {
  font-size: 14px;
  margin:0 5px;
}
.operations .form select, .operations .form option,.operations .form input {
  border: 1px solid var(--control-borderColor-rest, var(--color-border-default));
  line-height: 22px;
  border-radius: 3px;
  padding: 0;
  margin: 0;
}

.operations .form .btn-save, .operations .form .btn-cancel {
  margin: 0 0 0 10px;
}

ul {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;
}
li {
  display: flex;
  width: 560px;
  flex-direction: column;
  position: relative;
  margin: 0 10px 10px 0;
}
li,.bg,
.video {
  color: #fff;
}
.video, .bg {
  aspect-ratio: 16/9;
  width: 560px;
  border-radius: 5px 5px 0 0;
  background-color: #333;
}
.bg {
  display: flex;
  justify-content: center;
  align-items: center;
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

li .desc .remark {font-weight: bold;}

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

li .menu {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 10px;
  position: absolute;
  bottom: 50px;
  z-index: 100;
  width: 100%;
}
li .menu .media {
  color: #ccc;
}
li .menu .media label {
  margin: 5px;
}
li .menu .media span {
  font-weight: bold;
}
li .menu .play {
  display: block;
  width: 60px;
  height: 30px;
  line-height: 30px;
  background-color: #044941;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid #023630;
  text-align: center;
}

li .menu .play:hover {
  background-color: #0f6157;
}
</style>
