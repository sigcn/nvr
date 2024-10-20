<script setup>
import { onMounted, ref } from 'vue'
import http from '../http'
import mpegts from 'mpegts.js'

const cameras = ref([])
const videos = ref([])

onMounted(async () => {
  let sessionVal = window.localStorage.getItem('session')
  let session = JSON.parse(sessionVal)
  await loadCameras(session)
  videos.value.forEach((v, i) => {
    initMpegts(v, `${http.apiServer}${v.dataset.url}?api_key=${session.key}`)
  })
})

async function loadCameras(session) {
  let r = await http.get('/v1/api/cameras', {session: session})
  console.log(r)
  if(r.code != 0) {
    return
  }
  console.log(r.data)
  cameras.value = r.data
}

function initMpegts(videoElement, streamURL) {
  if (mpegts.getFeatureList().mseLivePlayback) {
      var player = mpegts.createPlayer({
          type: 'mpegts',
          isLive: true,
          url: streamURL
      });
      player.attachMediaElement(videoElement);
      player.load()
      videoElement.addEventListener('click', () => {player.play()})
  }
}
</script>
<template>
    <ul v-for="(cam, i) in cameras">
        <li><video ref="videos" class="video" :data-url="`/media/${cam.id}/live.ts`"></video></li>
    </ul>

</template>

<style scoped>
ul {
    padding: 0;
    margin: 0;
    list-style: none;
}

li, .video {
    background-color: #333;
    width: 800px;
    height: 450px;
    border-radius: 5px;
    color: #fff;
}
</style>