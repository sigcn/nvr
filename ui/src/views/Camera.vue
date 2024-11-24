<script setup>
import http from '@/http'
import Calendar from 'vue3-slot-calendar'
import Video from '@/components/Video.vue'
import { useRoute } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'

const route = useRoute()
const filterDay = ref(new Date())
const duration = ref(24 * 3600)
const lastPlayOffet = ref(0)
const currentTime = ref(0)
const camera = ref({})
const video = ref()

onMounted(() => {
  loadCamera()
  prepareVideo()
  requestVideo()
  window.addEventListener('keydown', shortcutKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', shortcutKey)
})

const prepareVideo = () => {
  if (route.query.pos) {
    let posDate = new Date(new Number(route.query.pos) * 1000)
    let dayDate = new Date(
      posDate.getFullYear(),
      posDate.getMonth(),
      posDate.getDate(),
    )
    filterDay.value = dayDate
    currentTime.value = Math.floor((posDate - dayDate) / 1000)
  }
}

async function selectDay(day) {
  filterDay.value = day
  console.log('set filterDay', filterDay.value)
  currentTime.value = 0
  requestVideo()
}

async function requestVideo() {
  camera.value.disableTimeUpdate = false
  lastPlayOffet.value = Number(currentTime.value)
  let selectDate = new Date(filterDay.value)
  selectDate.setHours(0, 0, 0, 0)
  let pos = Math.floor(selectDate.getTime() / 1000) + Number(currentTime.value)
  let src = `${http.apiServer}/media/${route.params.id}/live.ts`
  video.value.init(src, pos)
}

function formatTime(time) {
  const hours = String(Math.floor(time / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0')
  const seconds = String(Math.floor(time % 60)).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function updateProgress(e) {
  let newTime = Number(lastPlayOffet.value) + Math.floor(e.currentTime)
  if (camera.value.disableTimeUpdate) {
    return
  }
  currentTime.value = newTime
  if (Number(currentTime.value) > 24 * 3600) {
    let date = new Date(filterDay.value)
    date.setDate(date.getDate() + 1)
    filterDay.value = date
    lastPlayOffet.value = Number(lastPlayOffet.value) - 24 * 3600
    currentTime.value = 0
  }
}

async function loadCamera() {
  let session = JSON.parse(window.localStorage.getItem('session'))
  let r = await http.get(`/v1/api/cameras/${route.params.id}`, {
    session: session,
  })
  console.log(r)
  if (r.code != 0) {
    return
  }
  camera.value = r.data
}

const seekProgress = v => {
  camera.value.disableTimeUpdate = true
  currentTime.value += v
  if (currentTime.value < 0) {
    currentTime.value = 0
  } else if (currentTime.value > 24 * 3600) {
    currentTime.value = 24 * 3600
  }
  requestVideo()
}

function shortcutKey(e) {
  console.log(e)
  if (e.key == 'ArrowRight') {
    seekProgress(15)
    return
  }
  if (e.key == 'ArrowLeft') {
    seekProgress(-15)
    return
  }
  if (e.key == ' ') {
    video.value.play()
    return
  }
}
</script>

<template>
  <div class="cameraContainer">
    <div class="videoArea">
      <div class="video">
        <Video ref="video" @timeupdate="updateProgress"></Video>
      </div>
      <div class="timeline">
        <input
          class="progress"
          type="range"
          min="0"
          :max="duration"
          step="1"
          v-model="currentTime"
          @input="camera.disableTimeUpdate = true"
          @change="requestVideo"
        />
        <div class="timer">{{ formatTime(currentTime) }}</div>
        <div class="op">
          <a href="javascript:;" @click="seekProgress(-15)">-15s</a>
          <a href="javascript:;" @click="seekProgress(15)">+15s</a>
        </div>
      </div>
    </div>
    <div class="operation">
      <div class="camera">
        <div class="title">
          {{
            camera.remark || camera.meta ? camera.meta.manufacturer : 'loading'
          }}
        </div>
        <div class="manufacturer">
          {{ camera.meta ? camera.meta.manufacturer : 'loading' }}
        </div>
        <div class="model">
          {{ camera.meta ? camera.meta.model : 'loading' }}
        </div>
      </div>
      <Calendar
        v-model="filterDay"
        :has-input="false"
        @day-click="selectDay"
        :show-date-only="true"
      ></Calendar>
    </div>
  </div>
</template>

<style scoped>
.cameraContainer {
  padding: 15px;
  display: flex;
}
.videoArea {
  border-radius: 3px 3px 0 0;
  overflow: hidden;
  flex: 1;
}
.videoArea .video {
  width: 100%;
}
.videoArea .progress {
  width: 100%;
}

.timeline .timer {
  display: inline-block;
  margin-right: 10px;
}
.timeline .op {
  float: right;
}
.timeline .op a {
  margin-left: 10px;
}
.operation {
  padding: 0 0 0 10px;
}

.camera {
  margin: 0 0 10px 0;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.camera .title {
  font-size: 18px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 5px;
}
.camera .manufacturer,
.camera .model {
  line-height: 26px;
  font-size: 13px;
  color: darkslategray;
}
@media screen and (max-width: 1024px) {
  .cameraContainer {
    padding: 0px 0 0 0;
    flex-direction: column;
    justify-content: center;
  }
  .videoArea {
    width: 100%;
    border-radius: 0;
  }
  .timeline {
    margin: 5px 10px;
  }
  .operation {
    margin-right: 10px;
  }
}
</style>

<style>
.datepicker-inner {
  width: 245px;
}
.datepicker-ctrl p,
.datepicker-ctrl span,
.datepicker-body span {
  width: 31px;
}
</style>
