<script setup>
import { onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

watch(locale, lang => {
  window.localStorage.setItem('lang', lang)
})
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
  </div>
</template>
<style scoped>
.language {
  padding: 20px;
}
.line {
  display: flex;
  line-height: 32px;
}
.key {
  margin-right: 10px;
}

select,
option {
  border: 1px solid #ccc;
  padding: 5px 10px;
}
</style>
