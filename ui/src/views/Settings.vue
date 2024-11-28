<script setup>
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import http from '@/http'

const { locale } = useI18n()
const camerasHideAdd = ref()
const settings = ref({})

onMounted(() => {
  camerasHideAdd.value = window.localStorage.getItem('camerasHideAdd')
  loadSettings()
})

watch(locale, lang => {
  window.localStorage.setItem('lang', lang)
})

watch(camerasHideAdd, val => {
  window.localStorage.setItem('camerasHideAdd', val)
})

const loadSettings = async () => {
  let session = JSON.parse(window.localStorage.getItem('session'))
  let r = await http.get(`/v1/api/settings`, {
    session: session,
  })
  if (r.code != 0) {
    return
  }
  settings.value = r.data
}
</script>
<template>
  <div class="language">
    <div class="line">
      <div class="key">{{ $t('nav.lang') }}</div>
      <div class="value">
        <select v-model="$i18n.locale">
          <option value="zh">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
    <div class="line custom-checkbox">
      <input v-model="camerasHideAdd" type="checkbox" id="checkbox" />
      <label for="checkbox">{{ $t('settings.camerasHideAdd') }}</label>
    </div>
    <div class="line">
      <div class="key">{{ $t('settings.go_version') }}</div>
      <div class="value">{{ settings.go_version }}</div>
    </div>
    <div class="line">
      <div class="key">{{ $t('settings.version') }}</div>
      <div class="value">{{ settings.version }}</div>
    </div>
    <div class="line">
      <div class="key">{{ $t('settings.build_info') }}</div>
      <div class="value">
        {{ settings.vcs_revision }} {{ settings.vcs_time }}
      </div>
    </div>
  </div>
</template>
<style scoped>
.language {
  padding: 20px 10px;
}
.line {
  display: flex;
  line-height: 36px;
}
.key {
  margin-right: 10px;
}

select,
option {
  border: 1px solid #ccc;
  padding: 5px 10px;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.custom-checkbox input[type='checkbox'] {
  display: none;
}

.custom-checkbox label {
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  user-select: none;
}

.custom-checkbox label::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  background-color: #fff;
  border-radius: 4px;
  transition: 0.3s;
}

.custom-checkbox input[type='checkbox']:checked + label::before {
  background-color: #4caf50;
  border-color: #4caf50;
}

.custom-checkbox input[type='checkbox']:checked + label::after {
  content: '✔';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: white;
}

.custom-checkbox label:hover::before {
  border-color: #888;
}
</style>
