<script setup>
import { onMounted, ref } from 'vue'
import { throttle } from 'lodash'
import mpegts from 'mpegts.js'
import IconPlay from './icons/IconPlay.vue'
import IconPause from './icons/IconPause.vue'
import IconLoad from './icons/IconLoad.vue'
import IconFullscreen from './icons/IconFullscreen.vue'
import IconMuted from './icons/IconMuted.vue'
import IconUnmuted from './icons/IconUnmuted.vue'
import { onBeforeRouteLeave } from 'vue-router'

const props = defineProps({
  src: {},
  muted: { type: Boolean, default: false },
  live: { type: Boolean, default: false },
})
const emit = defineEmits(['timeupdate'])

const player = ref()
const video = ref({})
const media = ref({})

onMounted(async () => {
  if (props.src) {
    init(props.src, undefined, props.live)
  }
  video.value.addEventListener('pause', () => {
    media.value.playing = false
  })
})

onBeforeRouteLeave(() => {
  player.value?.destroy()
})

defineExpose({ init, pause, mute, play })

async function init(src, pos, live) {
  src = src || media.value.src
  pos = pos || media.value.pos
  live = live || media.value.live
  media.value.src = src
  media.value.pos = pos
  media.value.live = live
  player.value?.destroy()
  let session = JSON.parse(window.localStorage.getItem('session') || '{}')
  if (mpegts.getFeatureList().mseLivePlayback) {
    let url = `${src}?api_key=${session.key}`
    if (pos) {
      url = `${url}&pos=${pos}`
      media.value.pos = pos
    }
    player.value = mpegts.createPlayer({
      type: 'mpegts',
      isLive: live,
      url: url,
    })
    player.value.attachMediaElement(video.value)
    player.value.on(mpegts.Events.MEDIA_INFO, function (mediaInfo) {
      console.log('Media Info:', mediaInfo)
      media.value.videoCodec = mediaInfo.videoCodec
      media.value.audioCodec = mediaInfo.audioCodec
      media.value.fps = mediaInfo.fps
    })
    media.value.playing = false
    media.value.loading = true
    player.value.load()
    try {
      if (props.muted) {
        mute()
      }
      await player.value.play()
      media.value.playing = true
      media.value.loading = false
    } catch (_) {
      setTimeout(() => {
        player.value.unload()
        player.value.detachMediaElement()
        media.value.playing = false
        media.value.loading = false
      }, 100)
    }
  }
}

async function play() {
  if (media.value.loading) {
    return
  }

  if (media.value.playing) {
    if (media.value.pos) {
      player.value.pause()
    } else {
      player.value.unload()
      player.value.detachMediaElement()
    }
    media.value.playing = false
    return
  }
  media.value.loading = true
  try {
    if (media.value.pos) {
      player.value.play()
    } else {
      player.value.attachMediaElement(video.value)
      player.value.load()
      await player.value.play()
    }
  } catch (_) {
    media.value.loading = false
    init()
    return
  }
  media.value.playing = true
  media.value.loading = false
}

async function mute() {
  video.value.muted = !video.value.muted
  media.value.muted = !media.value.muted
}

async function pause() {
  media.value.playing = false
  video.value.pause()
}

function fullscreen() {
  if (video.value.requestFullscreen) {
    video.value.requestFullscreen()
  } else if (video.value.webkitEnterFullScreen) {
    video.value.webkitEnterFullScreen()
  } else {
    alert('unsupport')
  }
  video.value.style.pointerEvents = 'none'
}

function timeupdate(e) {
  throttle(() => {
    emit('timeupdate', { event: e, currentTime: video.value?.currentTime })
  }, 1000)()
}

let hidemenuTimter = null
const showmenu = () => {
  if (window.screen.availWidth > 1024) {
    return
  }
  if (hidemenuTimter) {
    clearTimeout(hidemenuTimter)
  }
  media.value.showmenu = true
  hidemenuTimter = setTimeout(() => {
    media.value.showmenu = false
    hidemenuTimter = null
  }, 2000)
}
</script>
<template>
  <div
    @mouseenter="media.showmenu = true"
    @mouseleave="media.showmenu = false"
    @click="showmenu"
    class="container"
  >
    <div class="bg" v-if="!media.playing">no video signal</div>
    <video
      ref="video"
      :style="`display: ${media.playing ? 'block' : 'none'}`"
      @timeupdate="timeupdate"
      playsinline
    ></video>
    <div class="ops" v-if="media.showmenu || !media.playing">
      <div class="play" @click="play">
        <IconLoad v-if="media.loading" />
        <IconPause v-if="media.playing" />
        <IconPlay v-if="!media.playing && !media.loading" />
      </div>
      <div class="btns" v-if="media.playing">
        <div class="muted" @click="mute">
          <IconMuted v-if="media.muted" />
          <IconUnmuted v-if="!media.muted" />
        </div>
        <div class="fullscreen" @click="fullscreen">
          <IconFullscreen />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: inherit;
  aspect-ratio: 16/9;
  position: relative;
}

.ops {
  padding: 0 10px 0 10px;
  position: absolute;
  bottom: 0;
  background: #222;
  opacity: 0.6;
  width: 100%;
  height: 42px;
  color: #fff;
  z-index: 1000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ops svg {
  fill: #fff;
  width: 22px;
  height: 22px;
  cursor: pointer;
  float: left;
  margin-left: 15px;
}

.ops .btns {
  display: flex;
}

.play {
  opacity: 1;
}

.play svg {
  margin-left: 0;
  width: 32px;
  height: 32px;
}

video,
.bg {
  width: inherit;
  aspect-ratio: 16/9;
}
.bg {
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #333;
}

@media screen and (max-width: 1024px) {
  .ops {
    height: 36px;
  }
  .ops svg {
    width: 18px;
    height: 18px;
  }
  .play svg {
    width: 28px;
    height: 28px;
  }
}
</style>
