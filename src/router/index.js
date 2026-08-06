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
      name: 'Shop',
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
      name: 'GroupCart',
      component: () => import('../views/GroupShop/GroupCartView.vue'),
    },
    {
      path: '/GroupShop/orders',
      name: 'GroupOrders',
      component: () => import('../views/GroupShop/GroupOrdersView.vue'),
    },
    {
      path: '/GroupShop/checkout/confirm',
      name: 'GroupCheckout',
      component: () => import('../views/GroupShop/GroupCheckoutView.vue'),
    },

    //Community 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/community/profile',
      name: 'CommunityUserProfile',
      component: () => import('@/views/Community/UserProfileView.vue'),
    },
    {
      path: '/community/create',
      name: 'CreatePost',
      component: () => import('@/views/Community/CreatePostView.vue'),
    },
    {
      path: '/community',
      name: 'Community',
      component: () => import('@/views/Community/CommunityView.vue'),
    },
    {
      path: '/community/post/:id',
      name: 'PostDetail',
      component: () => import('@/views/Community/PostDetailView.vue'),
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
          path: 'user',
          name: 'user',
          component: () => import('@/views/Users/User.vue'),
        },
      ],
    },
  ],
})

export default router
