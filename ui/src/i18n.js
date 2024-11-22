import Settings from './views/Settings.vue'

export default {
  en: {
    signin: {
      toconsole: 'Sign in to console',
      username: 'Username',
      password: 'Password',
      signin: 'Sign in',
      signningin: 'Signning in',
      signout: 'Sign out',
    },
    nav: {
      cameras: 'Cameras',
      storage: 'Storage',
      settings: 'Settings',
      lang: 'Language',
    },
    storage: {
      tips: 'Recorded for {days} days, averaging {daygib} GiB per day. Expected to record for another {days1} days.',
    },
  },
  zh: {
    signin: {
      username: '用户名',
      password: '密码',
      signin: '登录',
      signningin: '进入中...',
      signout: '登出',
    },
    nav: {
      cameras: '摄像头',
      storage: '存储',
      settings: '设置',
      lang: '语言',
    },
    storage: {
      tips: '已录制 {days} 天，平均每天使用 {daygib} GiB。预计还可以录制 {days1} 天。',
    },
  },
}
