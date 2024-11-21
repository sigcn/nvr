<script setup>
import http from '@/http'
import { onMounted, ref } from 'vue'

const stat = ref({})

onMounted(loadStat)

async function loadStat() {
  let session = JSON.parse(window.localStorage.getItem('session'))
  let r = await http.get(`/v1/api/stat`, {
    session: session,
  })
  console.log(r)
  if (r.code != 0) {
    return
  }
  stat.value = r.data
}
</script>
<template>
  <div class="container">
    <div class="storage">{{ stat.volume_path || 'loadding' }}</div>

    <div class="storage-bar">
      <div class="type nvrd" :style="`flex: ${stat.volume_usage};`">
        nvrd ({{
          new Number(stat.volume_usage / 1024 / 1024 / 1024).toFixed(2)
        }}
        GiB)
      </div>
      <div
        class="type other"
        :style="`flex: ${stat.volume_total - stat.volume_free - stat.volume_usage};`"
      >
        other
      </div>
      <div class="type free" :style="`flex: ${stat.volume_free};`">
        free ({{ new Number(stat.volume_free / 1024 / 1024 / 1024).toFixed(2) }}
        GiB)
      </div>
    </div>
    <div class="legend">
      <span class="legend-item nvrd">NVRD</span>
      <span class="legend-item other">Other</span>
      <span class="legend-item free">Free</span>
    </div>
    <div class="tips">
      已录制 {{ stat.record_days }} 天，平均每天使用
      {{
        new Number(stat.day_bytes / 1024 / 1024 / 1024).toFixed(2)
      }}
      GiB，大约还可以录制
      {{ new Number(stat.volume_free / stat.day_bytes).toFixed(0) }} 天
    </div>
  </div>
</template>
<style scoped>
.container {
  padding: 20px;
  width: 100%;
  height: fit-content;
}
.storage {
  font-size: 30px;
  height: 30px;
  line-height: 30px;
  margin: 20px 0 40px 0;
  font-weight: bold;
}
.storage-bar {
  display: flex;
  height: 60px;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.type {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.nvrd {
  background-color: #007aff;
}

.other {
  background-color: #ff9500;
}

.free {
  background-color: #ccc;
}

.legend {
  display: flex;
  gap: 10px;
}

.legend-item {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 45px;
  vertical-align: middle;
  text-indent: 25px;
  font-size: 14px;
}

.legend-item.nvrd {
  background-color: #007aff;
}

.legend-item.other {
  background-color: #ff9500;
}

.legend-item.free {
  background-color: #ccc;
}
.tips {
  font-size: 16px;
  color: orange;
  margin-top: 50px;
  line-height: 30px;
}
</style>
