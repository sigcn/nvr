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
      player.load()
      try {
        await player.play()
        cameras.value[i].playing = true
      } catch (_) {
        setTimeout(() => {
          player.unload()
          player.detachMediaElement()
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

function play(i) {
  if (cameras.value[i].playing) {
    stop(i)
    return
  }
  let player = videos.value[i].player
  player.attachMediaElement(videos.value[i])
  player.load()
  player.play()
  cameras.value[i].playing = true

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
      <video
        ref="videos"
        class="video"
        :data-url="`/media/${cam.id}/live.ts`"
      ></video>
      <div class="menu">
        <div class="play" @click="play(i)">
          {{ cam.playing ? 'Stop' : 'Play' }}
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
  flex-direction: column;
}
li,
.video {
  width: 800px;
  color: #fff;
}
.video {
  border-radius: 5px 5px 0 0;
  background-color: #333;
  height: 450px;
}

li .menu {
  display: flex;
  align-items: center;
  justify-content:space-between;
  height: 50px;
  padding: 10px;
  background-color: #f6f8fa;
}
li .menu .media {
  color: #023630;
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
