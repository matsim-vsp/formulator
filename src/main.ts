import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'

import App from './App.vue'
import Chooser from '@/components/Chooser.vue'
import Formulator from '@/components/Formulator.vue'

const routes = [
  { path: '/', component: Chooser },
  { path: '/form/:form', component: Formulator },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

createApp(App).use(router).mount('#app')
