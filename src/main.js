import '../assets/main.css'
// console.log('🔥🔥🔥 Router index.js 被成功載入了！')
// import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia =createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')
