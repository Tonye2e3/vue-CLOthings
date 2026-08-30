import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

import GoogleOAuthCallback from '@/views/Users/GoogleOAuthCallback.vue'

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
      path: '/shop/search',
      name: 'search',
      component: () => import('../views/Shop/ShopSearchView.vue'),
    },
    {
      path: '/shop/product/:id',
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
    {
      path: '/shop/payment-result',
      name: 'paymentResult',
      component: () => import('../views/Shop/ShopPaymentResult.vue'),
    },

    //GroupShop 在註解之間新增個人使用的路由 名字自行修改
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
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/GroupShop/orders',
      name: 'GroupOrders',
      component: () => import('../views/GroupShop/GroupOrdersView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/GroupShop/checkout/confirm',
      name: 'GroupCheckout',
      component: () => import('../views/GroupShop/GroupCheckoutView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    // 模擬付款頁：結帳送出後會先跳到這裡，付款結果確認後才會真的建立訂單
    {
      path: '/GroupShop/pay/:paymentId',
      name: 'GroupFakePayment',
      component: () => import('../views/GroupShop/GroupFakePaymentView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    // 管理端：商品管理、訂單管理（僅 Admin / SuperAdmin 可進入）
    {
      path: '/GroupShop/admin/products',
      name: 'GroupProductAdmin',
      component: () => import('../views/GroupShop/GroupProductAdminView.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/GroupShop/admin/orders',
      name: 'GroupOrderAdmin',
      component: () => import('../views/GroupShop/GroupOrderAdminView.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },

    //Community 在註解之間新增個人使用的路由 名字自行修改
    {
      path: '/community/profile/:userId',
      name: 'CommunityUserProfile',
      component: () => import('@/views/Community/UserProfileView.vue'),
    },
    // 粉絲／追蹤中名單：獨立頁面（跟 IG app 一樣是切到新畫面，不是彈出視窗），
    // 兩條路由共用同一個元件 FollowListView.vue，用 props: { mode: '...' } 這種寫法
    // 直接把 mode 這個字串當成 props 傳進元件，不是網址參數，元件裡用 defineProps 接。
    {
      path: '/community/profile/:userId/followers',
      name: 'CommunityFollowers',
      component: () => import('@/views/Community/FollowListView.vue'),
      props: {
        mode: 'followers',
      },
    },
    {
      path: '/community/profile/:userId/following',
      name: 'CommunityFollowing',
      component: () => import('@/views/Community/FollowListView.vue'),
      props: {
        mode: 'following',
      },
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
    // 聊天室：/community/messages 是「打開訊息頁但還沒選任何對話」，
    // /community/messages/:userId 是「打開訊息頁，直接跳到跟某個人的對話」——
    // 例如從 UserProfileView.vue 的「訊息」按鈕點過來就是走這條、帶著對方的 userId。
    // 兩條路由共用同一個元件 ChatView.vue，元件自己用 route.params.userId 判斷要不要
    // 自動開啟某段對話。
    {
      path: '/community/messages',
      name: 'CommunityMessages',
      component: () => import('@/views/Community/ChatView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/community/messages/:userId',
      name: 'CommunityMessagesWith',
      component: () => import('@/views/Community/ChatView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    // 社群後台管理（管理者用，不是給一般使用者看的）
    {
      path: '/admin/community/posts',
      name: 'AdminCommunityPostList',
      component: () => import('@/views/Community/AdminCommunityPostListView.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/admin/community/posts/:id',
      name: 'AdminCommunityPostDetail',
      component: () => import('@/views/Community/AdminCommunityPostDetailView.vue'),
      meta: {
        requiresAuth: true,
        requiresAdmin: true,
      },
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
      path: '/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/Users/ForgotPasswordView.vue'),
    },
    {
      path: '/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/Users/ResetPasswordView.vue'),
    },
    {
      path: '/user',
      // 🟢 新增：User.vue 本身成為會員中心 Layout
      component: () => import('@/views/Users/User.vue'),

      meta: {
        requiresAuth: true,
      },

      children: [
        {
          // /user
          path: '',
          name: 'user',

          // 🟢 AccountCard.vue 變成會員中心首頁
          component: () => import('@/views/Users/UserCard/AccountCard.vue'),
        },

        // 商城訂單
        {
          path: 'orders',
          name: 'UserShopOrders',
          component: () => import('@/views/Shop/ShopOrdersView.vue'),
        },

        // 團購訂單
        {
          path: 'group-orders',
          name: 'UserGroupOrders',
          component: () => import('@/views/GroupShop/GroupOrdersView.vue'),
        },

        // 社群個人頁
        {
          path: 'community/:userId',
          name: 'UserCommunityProfile',
          component: () => import('@/views/Community/UserProfileView.vue'),
        },

        // 訊息
        {
          path: 'messages/:userId?',
          name: 'UserMessages',
          component: () => import('@/views/Community/ChatView.vue'),
        },
        // 社群後台管理（管理者用，不是給一般使用者看的）
        {
          path: 'admin/community/posts',
          name: 'UserAdminCommunityPostList',
          component: () => import('@/views/Community/AdminCommunityPostListView.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          },
        },
        // 社群貼文詳情
        {
          path: 'admin/community/posts/:id',
          name: 'UserAdminCommunityPostDetail',
          component: () => import('@/views/Community/AdminCommunityPostDetailView.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          },
        },

        // 團購商品管理
        {
          path: 'admin/group-products',
          name: 'UserGroupProductAdmin',
          component: () => import('../views/GroupShop/GroupProductAdminView.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          },
        },

        // 團購訂單管理
        {
          path: 'admin/group-orders',
          name: 'UserGroupOrderAdmin',
          component: () => import('../views/GroupShop/GroupOrderAdminView.vue'),
          meta: {
            requiresAuth: true,
            requiresAdmin: true,
          },
        },
      ],
    },
    {
      path: '/oauth/google',
      name: 'google-oauth-callback',
      component: GoogleOAuthCallback,
    },
    {
      path: '/verify-email',
      name: 'VerifyEmail',
      component: () => import('../views/Users/VerifyEmailView.vue'),
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

  // 要進入的頁面需要管理員權限，而目前登入的角色不是 Admin / SuperAdmin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return {
      name: 'home',
    }
  }

  // 要進入的頁面需要超級管理員權限，而目前登入的角色不是 SuperAdmin
  if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
    return {
      name: 'home',
    }
  }
})

export default router
