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
      path: '/sample',
      name: 'sampleShop',
      component: () => import('../views/Shop/SampleView.vue'),
    },

    //GroupShop 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/GroupShop',
      name: 'GroupProducts',
      component: () => import('../views/GroupShop/GroupProductsView.vue'),
    },
    {
      path: '/GroupShop/product/:id',
      name: 'GroupProductDetail',
      component: () => import('../views/GroupShop/GroupProductDetail.vue'),
    },
    {
      path: '/GroupShop/checkout',
      name: 'GroupCheckout',
      component: () => import('../views/GroupShop/GroupCheckoutView.vue'),
    },
    {
      path: '/GroupShop/orders',
      name: 'GroupOrders',
      component: () => import('../views/GroupShop/GroupOrdersView.vue'),
    },

    //Community 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/sample',
      name: 'sampleCommunity',
      component: () => import('../views/Community/SampleView.vue'),
    },

    //User 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/User/LoginView.vue'),
    },
    {
      path: '/User',
      meta: { requireMember: false },
      children: [
        {
          path: 'UserInfo',
          name: 'UserInfo',
          component: () => import('@/views/User/LoginView.vue'),
        },
        {
          path: 'UserProfile',
          name: 'UserProfile',
          component: () => import('@/views/User/LoginView.vue'),
        },
      ],
    },
  ],
})

export default router
