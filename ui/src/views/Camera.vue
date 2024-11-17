<script setup>
import http from '@/http'
import { onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import Calendar from 'vue3-slot-calendar'
import mpegts from 'mpegts.js'
import { throttle } from 'lodash'

const route = useRoute()
const filterDay = ref(new Date())
const duration = ref(24 * 3600)
const lastPlayOffet = ref(0)
const currentTime = ref(0)
const video = ref()
const controls = ref({})

onMounted(requestVideo)
onBeforeRouteLeave(destroyVideo)

function destroyVideo() {
  if (!video.value.player) {
    return
  }
  try {
    video.value.player.destroy()
  } catch (_) {}
}

async function selectDay(day) {
  filterDay.value = day
  console.log('set filterDay', filterDay.value)
  currentTime.value = 0
  requestVideo()
}

async function requestVideo() {
  destroyVideo()
  lastPlayOffet.value = Number(currentTime.value)
  if (mpegts.getFeatureList().mseLivePlayback) {
    let sessionVal = window.localStorage.getItem('session')
    let session = JSON.parse(sessionVal)
    let selectDate = new Date(filterDay.value)
    selectDate.setHours(0, 0, 0, 0)
    let pos =
      Math.floor(selectDate.getTime() / 1000) + Number(currentTime.value)
    let player = mpegts.createPlayer({
      type: 'mpegts',
      isLive: true,
      url: `${http.apiServer}/media/${route.params.id}/live.ts?pos=${pos}&api_key=${session.key}`,
    })
    video.value.player = player
    player.attachMediaElement(video.value)
    player.on(mpegts.Events.MEDIA_INFO, function (mediaInfo) {
      console.log('Media Info:', mediaInfo)
    })
    controls.value.loading = true
    player.load()
    try {
      await player.play()
      controls.value.playing = true
      controls.value.loading = false
    } catch (err) {
      console.error(err)
      setTimeout(() => {
        player.unload()
        player.detachMediaElement()
        controls.value.playing = false
        controls.value.loading = false
      }, 100)
    }
  }
}

function formatTime(time) {
  const hours = String(Math.floor(time / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((time % 3600) / 60)).padStart(2, '0')
  const seconds = String(Math.floor(time % 60)).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function updateProgress() {
  throttle(() => {
    currentTime.value =
      Number(lastPlayOffet.value) + Math.floor(video.value.currentTime)
    if (Number(currentTime.value) > 24 * 3600) {
      let date = new Date(filterDay.value)
      date.setDate(date.getDate() + 1)
      filterDay.value = date
      lastPlayOffet.value = Number(lastPlayOffet.value) - 24 * 3600
      currentTime.value = 0
    }
  }, 1000)()
}

function seekVideo() {
  video.value.player.pause()
}

function changeDate(year, month, day) {
  //   console.log(year, month, day)
}

function drawDate(a) {
  console.log(a)
}
</script>

<template>
  <div class="cameraContainer">
    <div class="videoArea">
      <div class="bg" v-if="!controls || !controls.playing">
        no video signal
      </div>
      <video
        controls
        ref="video"
        @timeupdate="updateProgress"
        :style="`display: ${controls && controls.playing ? 'block' : 'none'}`"
      ></video>
      <div class="timeline">
        <input
          class="progress"
          type="range"
          min="0"
          :max="duration"
          step="1"
          v-model="currentTime"
          @input="seekVideo"
          @change="requestVideo"
        />
        <div class="">{{ formatTime(currentTime) }}</div>
      </div>
    </div>
    <div class="filter">
      <Calendar
        v-model="filterDay"
        :has-input="false"
        @day-click="selectDay"
        :show-date-only="true"
        @draw-date="drawDate"
        :change-pane="changeDate"
      >
      </Calendar>
    </div>
  </div>
</template>

<style scoped>
.cameraContainer {
  padding: 15px;
  display: flex;
}
.videoArea {
  width: 90%;
}
.videoArea .progress {
  width: 100%;
}
.filter {
  width: 20%;
  padding: 0 0 0 10px;
}
video,
.bg {
  color: #fff;
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 5px 5px 0 0;
  background-color: #333;
}
.bg {
  display: flex;
  justify-content: center;
  align-items: center;
}
@media screen and (max-width: 1024px) {
  .cameraContainer {
    padding: 0px 0 0 0;
    flex-direction: column;
    justify-content: center;
  }
  .videoArea {
    width: 100%;
  }
  .filter {
    width: 100%;
  }
  .bg,
  video {
    border-radius: 0;
  }
}
</style>
