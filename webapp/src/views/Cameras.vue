<script setup>
import { onMounted, ref } from 'vue'
import http from '../http'
import mpegts from 'mpegts.js'
import { onBeforeRouteLeave } from 'vue-router'

const cameras = ref([])
const videos = ref([])

onMounted(async () => {
  let sessionVal = window.localStorage.getItem('session')
  let session = JSON.parse(sessionVal)
  await loadCameras(session)
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
})

onBeforeRouteLeave(() => {
  videos.value.forEach((v, i) => {
    v.player.destroy()
  })
})

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
</script>
<template>
  <ul v-for="(cam, i) in cameras">
    <li>
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
        <div class="enter">Enter</div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
ul {
  padding: 0;
  margin: 0;
  list-style: none;
}
li {
  display: flex;
  width: 600px;
  flex-direction: column;
  position: relative;
}
li,.bg,
.video {
  color: #fff;
}
.video, .bg {
  aspect-ratio: 16/9;
  width: 600px;
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
