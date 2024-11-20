import './assets/main.css'

import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import lang from '@/i18n'
import App from './App.vue'
import router from './router'

const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en',
  locale: localStorage.getItem('lang') || 'en',
  messages: lang,
})
const app = createApp(App)

app.use(i18n)
app.use(router)

app.mount('#app')
