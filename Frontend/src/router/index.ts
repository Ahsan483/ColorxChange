import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/edit',
      name: 'edit',
      component: () => import('../views/EditText.vue'),
    },
    {
      path: '/upload',
      name: 'file-upload',
      component: () => import('../views/FilePost.vue'),
    },
  ],
})

export default router
