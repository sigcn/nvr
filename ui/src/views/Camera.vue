<script setup>
import http from '@/http'
import Calendar from 'vue3-slot-calendar'
import Video from '@/components/Video.vue'
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'

const route = useRoute()
const filterDay = ref(new Date())
const duration = ref(24 * 3600)
const lastPlayOffet = ref(0)
const currentTime = ref(0)
const video = ref()

onMounted(requestVideo)

async function selectDay(day) {
  filterDay.value = day
  console.log('set filterDay', filterDay.value)
  currentTime.value = 0
  requestVideo()
}

async function requestVideo() {
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
  if (newTime < currentTime.value) {
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
          @input="video.pause"
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
.filter {
  padding: 0 0 0 20px;
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
  .filter {
    width: 100%;
  }
}
</style>

<style>
.datepicker-inner {width: 238px;}
.datepicker-ctrl p, .datepicker-ctrl span, .datepicker-body span {width: 30px;}
</style>