import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/cameras',
    },
    {
      path: '/cameras',
      name: 'cameras',
      component: () => import('../views/Cameras.vue'),
    },
  ],
})

export default router
