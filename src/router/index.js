import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    //內建主頁暫不使用
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },

    //Shop 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/shop/sample',
      name: 'sampleShop',
      component: () => import('../views/Shop/SampleView.vue'),
    },

    //GroupShop 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/groupshop/sample',
      name: 'sampleGroupShop',
      component: () => import('../views/GroupShop/SampleView.vue'),
    },

    //Community 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/community/sample',
      name: 'sampleCommunity',
      component: () => import('../views/Community/SampleView.vue'),
    },

    //User 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Users/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/Users/RegisterView.vue'),
    },
    {
      path: '/user',
      meta: { requireMember: false },
      children: [
        {
          path: 'userinfo',
          name: 'userinfo',
          component: () => import('@/views/Users/UserInfo.vue'),
        },
        {
          path: 'userprofile',
          name: 'userprofile',
          component: () => import('@/views/Users/UserProfile.vue'),
        },
        {
          path: 'useraddress',
          name: 'useraddress',
          component: () => import('@/views/Users/UserAddresses.vue'),
        },
      ],
    },
  ],
})

export default router
