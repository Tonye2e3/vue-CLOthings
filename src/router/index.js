import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

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
      path: '/shop/shop',
      name: 'shop',
      component: () => import('../views/Shop/ShopView.vue'),
    },
    {
      path: '/shop/favorite',
      name: 'favorite',
      component: () => import('../views/Shop/ShopFavoriteView.vue'),
    },
    {
      path: '/shop/product',
      name: 'product',
      component: () => import('../views/Shop/ProductView.vue'),
    },
    {
      path: '/shop/cart',
      name: 'cart',
      component: () => import('../views/Shop/ShopCartView.vue'),
    },
    {
      path: '/shop/orders',
      name: 'orders',
      component: () => import('../views/Shop/ShopOrdersView.vue'),
    },
    {
      path: '/shop/orders/:id',
      name: 'orderDetail',
      component: () => import('../views/Shop/ShopOrderDetailView.vue'),
    },
    {
      path: '/shop/checkout',
      name: 'checkout',
      component: () => import('../views/Shop/ShopCheckoutView.vue'),
    },
    {
      path: '/shop/return/:id',
      name: 'return',
      component: () => import('../views/Shop/ShopReturnView.vue'),
    },
    {
      path: '/shop/service',
      name: 'service',
      component: () => import('../views/Shop/ShopServiceView.vue'),
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
      meta: { requiresAuth: true },
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

// 路由守衛
router.beforeEach((to) => {
  const authStore = useAuthStore()

  // 要進入的頁面需要登入，而且目前沒有登入
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    }
  }
})

export default router
