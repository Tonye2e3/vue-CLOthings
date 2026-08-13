import '../assets/main.css'
// console.log('🔥🔥🔥 Router index.js 被成功載入了！')
// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia() // 先建立 pinia
pinia.use(piniaPluginPersistedstate) // 讓 pinia 使用持久化套件
app.use(pinia) // 再把 pinia 給 app 用

pinia.use(piniaPluginPersistedstate)

app.use(pinia)

// app.use(createPinia())

app.use(router)

app.mount('#app')
