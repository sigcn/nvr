<script setup>
import http from '@/http'
import Calendar from 'vue3-slot-calendar'
import Video from '@/components/Video.vue'
import { useRoute } from 'vue-router'
import { onMounted, onUnmounted, ref } from 'vue'
import IconLeft from '@/components/icons/IconLeft.vue'
import IconTop from '@/components/icons/IconTop.vue'
import IconRight from '@/components/icons/IconRight.vue'
import IconDown from '@/components/icons/IconDown.vue'

const route = useRoute()
const filterDay = ref(new Date())
const duration = ref(24 * 3600)
const lastPlayOffet = ref(0)
const currentTime = ref(0)
const camera = ref({})
const video = ref()
const progress = ref()
const live = ref(true)
const toLiveTab = ref()
const toSeekTab = ref()

onMounted(() => {
  loadCamera()
  prepareVideo()
  requestVideo()
  window.addEventListener('keydown', shortcutKey)
})

onUnmounted(() => {
  window.removeEventListener('key ref="moveLeft" down', shortcutKey)
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
  if (live.value) {
    pos = null
  }
  video.value.init(src, pos, live.value)
}

function formatTime(time) {
  const hours = String(Math.floor(time / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0')
  const seconds = String(Math.floor(time % 60)).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function updateProgress(e) {
  let newTime = Number(lastPlayOffet.value) + Math.floor(e.currentTime)
  if (camera.value && camera.value.disableTimeUpdate) {
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

const moveCamera = async (x, y) => {
  let session = JSON.parse(window.localStorage.getItem('session'))
  let r = await http.post(`/v1/api/cameras/${route.params.id}/move`, {
    session: session,
    body: {
      x: x,
      y: y,
    },
  })
  console.log(r)
}

const showprogress = e => {
  console.log(e, progress.value.getBoundingClientRect().width)
  camera.value.progress = formatTime(
    ((24 * 3600) / progress.value.getBoundingClientRect().width) * e.offsetX,
  )
}

const disableArrowKeys = event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
  }
}

const toLive = e => {
  if (live.value) {
    return
  }
  toLiveTab.value.classList.add('selected')
  toSeekTab.value.classList.remove('selected')
  live.value = true
  requestVideo()
}
const toSeek = e => {
  if (!live.value) {
    return
  }
  toLiveTab.value.classList.remove('selected')
  toSeekTab.value.classList.add('selected')
  live.value = false
  requestVideo()
}
</script>

<template>
  <div class="cameraContainer">
    <div class="videoArea">
      <div class="video">
        <Video ref="video" @timeupdate="updateProgress"></Video>
      </div>
      <div class="timeline" v-if="!live">
        <input
          ref="progress"
          class="progress"
          type="range"
          min="0"
          :max="duration"
          step="1"
          v-model="currentTime"
          @input="camera.disableTimeUpdate = true"
          @mousemove="showprogress"
          @change="requestVideo"
          @keydown="disableArrowKeys"
          :title="`${camera.progress}`"
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
      <div class="change-mode">
        <div class="tab tab1 selected" @click="toLive" ref="toLiveTab">
          Live
        </div>
        <div class="tab tab2" @click="toSeek" ref="toSeekTab">Seek</div>
      </div>
      <div v-if="live" class="ptz">
        <div class="btns">
          <div
            class="btn"
            @click="moveCamera(-0.1, 0)"
            style="left: 0; top: 60px"
          >
            <IconLeft />
          </div>
          <div
            class="btn"
            @click="moveCamera(0, 0.2)"
            style="left: 60px; top: 0px"
          >
            <IconTop />
          </div>
          <div
            class="btn"
            @click="moveCamera(0.1, 0)"
            style="right: 0; top: 60px"
          >
            <IconRight />
          </div>
          <div
            class="btn"
            @click="moveCamera(0, -0.2)"
            style="right: 60px; bottom: 0px"
          >
            <IconDown />
          </div>
        </div>
      </div>
      <Calendar
        v-else
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
.change-mode {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  line-height: 32px;
  margin-bottom: 10px;
}
.change-mode .tab {
  height: 32px;
  line-height: 32px;
  cursor: pointer;
  flex: 1;
  text-align: center;
  background-color: #d1d9e0;
  user-select: none;
}
.change-mode .tab1 {
  border-radius: 5px 0 0 5px;
}
.change-mode .tab2 {
  border-radius: 0 5px 5px 0;
}
.change-mode .selected {
  background-color: #083f39;
  color: #fff;
}
.ptz {
  width: 247px;
  display: flex;
  justify-content: center;
}
.ptz .btns {
  display: block;
  margin-top: 20px;
  width: 180px;
  height: 180px;
  position: absolute;
}
.ptz .btns .btn {
  display: flex;
  width: 60px;
  height: 60px;
  position: absolute;
  cursor: pointer;
  justify-content: center;
  align-items: center;
  user-select: none;
}
.ptz .btns .btn:hover {
  background-color: #d1d9e0;
}
.ptz .btns .btn svg {
  width: 32px;
  height: 32px;
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
  .ptz {
    margin: 0 auto;
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
