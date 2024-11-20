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
    {
      path: '/cameras/:id',
      name: 'camera',
      component: () => import('../views/Camera.vue'),
    },
    {
      path: '/storage',
      name: 'storage',
      component: () => import('../views/Storage.vue'),
    },
  ],
})

export default router
