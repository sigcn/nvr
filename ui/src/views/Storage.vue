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
    <div class="stat">
      <div class="storage">
        <div class="path">
          {{ stat.volume_path || 'loadding' }}
        </div>
        <div class="usage">
          {{
            new Number(
              (stat.volume_total - stat.volume_free) / 1024 / 1024 / 1024,
            ).toFixed(2)
          }}
          GiB/{{
            new Number(stat.volume_total / 1024 / 1024 / 1024).toFixed(2)
          }}
          GiB
        </div>
      </div>
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
        <div class="type free" :style="`flex: ${stat.volume_free || 1};`">
          free ({{
            new Number(stat.volume_free / 1024 / 1024 / 1024).toFixed(2)
          }}
          GiB)
        </div>
      </div>
      <div class="legend">
        <span class="legend-item nvrd">NVRD</span>
        <span class="legend-item other">Other</span>
        <span class="legend-item free">Free</span>
      </div>
    </div>
    <div class="tips" v-if="stat.record_days > 2">
      {{
        $t('storage.tips', {
          days: stat.record_days,
          daygib: new Number(stat.day_bytes / 1024 / 1024 / 1024).toFixed(2),
          days1: new Number(stat.volume_free / stat.day_bytes).toFixed(0),
        })
      }}
    </div>
  </div>
</template>
<style scoped>
.container {
  padding: 10px;
  width: 100%;
  height: fit-content;
}
.stat {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 20px;
  margin-top: 10px;
}
.storage {
  height: 50px;
  line-height: 25px;
  margin: 0;
  display: flex;
  justify-content: space-between;
}
.storage .path {
  font-size: 26px;
  font-weight: bold;
  flex: 1;
  overflow-wrap: break-word;
  overflow: hidden;
}
.storage .usage {
  color: #999;
  font-size: 16px;
}
.storage-bar {
  display: flex;
  height: 36px;
  width: 100%;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 20px;
  font-size: 12px;
  line-height: 12px;
}

.type {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}

.nvrd {
  background-color: #db1037;
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
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-right: 45px;
  vertical-align: middle;
  text-indent: 20px;
  line-height: 15px;
  font-size: 14px;
}

.legend-item.nvrd {
  background-color: #db1037;
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
  margin-top: 36px;
  line-height: 30px;
}
@media screen and (max-width: 1024px) {
  .stat {
    padding: 20px 10px;
    border-radius: 5px;
  }
}
</style>
