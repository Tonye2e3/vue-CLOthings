<script setup>
import { ref } from 'vue'


// 使用者個人資料
const userProfile = ref({
  name: 'Emily 艾米莉',
  handle: '@emily_style',
  bioTag: '韓系 | 簡約 | 日常穿搭分享',
  bio: '喜歡分享每天的穿搭靈感 ✨ 點擊看板搭配同款單品，一起變美！',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
  bannerBg: '#EFE8E1', // 暖質感奶茶底色
  postsCount: '1,284',
  followersCount: '58.6K',
  followingCount: '342',
  isFollowing: false
})

// 當前頁籤 (穿搭作品, 收藏, 同款商品, 關於我)
const activeTab = ref('works')

// 穿搭作品列表 (改回帶有 # 的標籤格式)
const userPosts = ref([
  {
    id: 1,
    title: '春日約會穿搭 · 碎花洋裝',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    likes: '2,341',
    comments: '128',
    tags: ['#法式碎花洋裝', '#皮革側背包']
  },
  {
    id: 2,
    title: '秋冬層次感 · 大衣外套',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    likes: '1,876',
    comments: '94',
    tags: ['#羊毛長大衣', '#親膚針織衫']
  },
  {
    id: 3,
    title: '休閒日常 · 針織上衣',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&auto=format&fit=crop&q=80',
    likes: '3,102',
    comments: '210',
    tags: ['#V領軟糯針織', '#高腰休閒褲']
  },
  {
    id: 4,
    title: '通勤 OL 風 · 配件搭配',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
    likes: '1,542',
    comments: '76',
    tags: ['#質感西裝外套', '#真皮皮帶']
  }
])

const tabs = [
  { key: 'works', label: '穿搭作品' },
  { key: 'saved', label: '收藏' },
  { key: 'products', label: '同款商品' },
  { key: 'about', label: '關於我' }
]

const toggleFollow = () => {
  userProfile.value.isFollowing = !userProfile.value.isFollowing
}
</script>

<template>
  

  <div class="community-page min-vh-100 w-100">
    <!-- 暫時導覽列 -->
    <!-- <TempNavbar /> -->

    <div class="container-fluid container-lg pb-5">

      <!-- 個人檔案卡 -->
      <div class="profile-card mb-4">

        <!-- 封面橫幅：改用斜紋質感取代純色平塗 -->
        <div class="profile-banner"></div>

        <div class="profile-body">
          <div class="profile-top">

            <!-- 大頭貼 -->
            <div class="avatar-wrapper">
              <img :src="userProfile.avatar" class="avatar-img" alt="Avatar" />
            </div>

            <!-- 數據與動作 -->
            <div class="profile-meta">
              <div class="stat-group">
                <div class="stat-item">
                  <div class="stat-num">{{ userProfile.postsCount }}</div>
                  <div class="stat-label">貼文</div>
                </div>
                <div class="stat-item">
                  <div class="stat-num">{{ userProfile.followersCount }}</div>
                  <div class="stat-label">粉絲</div>
                </div>
                <div class="stat-item">
                  <div class="stat-num">{{ userProfile.followingCount }}</div>
                  <div class="stat-label">追蹤中</div>
                </div>
              </div>

              <div class="action-group">
                <button
                  class="btn-follow-main"
                  :class="{ following: userProfile.isFollowing }"
                  @click="toggleFollow"
                >
                  {{ userProfile.isFollowing ? '已追蹤' : '＋ 追蹤' }}
                </button>
                <button class="btn-message">✉ 訊息</button>
              </div>
            </div>
          </div>

          <!-- 姓名與簡介 -->
          <div class="profile-intro">
            <h1 class="profile-name">{{ userProfile.name }}</h1>
            <div class="profile-handle">
              <span>{{ userProfile.handle }}</span>
              <span class="dot">·</span>
              <span class="tagline">{{ userProfile.bioTag }}</span>
            </div>
            <p class="profile-bio">{{ userProfile.bio }}</p>
          </div>

          <!-- 頁籤 -->
          <div class="tab-row">
            <button
              v-for="t in tabs"
              :key="t.key"
              class="tab-btn"
              :class="{ active: activeTab === t.key }"
              @click="activeTab = t.key"
            >{{ t.label }}</button>
          </div>
        </div>
      </div>

      <!-- 穿搭作品牆 -->
      <div v-if="activeTab === 'works'" class="post-grid">
        <div v-for="post in userPosts" :key="post.id" class="post-card">

          <router-link :to="`/community/post/${post.id}`" class="post-media d-block text-decoration-none">
            <span class="tag-label" v-if="post.tags[0]">{{ post.tags[0].replace('#', '') }}</span>
            <img :src="post.image" :alt="post.title" />
          </router-link>

          <div class="post-body">
            <router-link :to="`/community/post/${post.id}`" class="text-decoration-none">
              <h6 class="post-title">{{ post.title }}</h6>
            </router-link>

            <div class="post-stats">
              <span>♥ {{ post.likes }}</span>
              <span>💬 {{ post.comments }}</span>
              <router-link :to="`/community/post/${post.id}`" class="ms-auto">查看同款</router-link>
            </div>

            <div class="tag-cloud">
              <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>
          </div>

        </div>
      </div>

      <!-- 其它頁籤未開啟時的預設狀態 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📁</div>
        <p class="empty-note">「這裡的故事，還在整理中。」</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
.community-page {
  width: 100%;
  min-height: 100vh;
  background-color: #F9F4F0 !important;
  box-sizing: border-box;
  --cream:#F9F4F0;
  --paper:#FFFDFB;
  --ink:#2A2420;
  --ink-soft:#7A6E63;
  --plum:#7A4B54;
  --plum-deep:#5E3941;
  --ochre:#B8862E;
  --hairline:#E4D8CC;
  color: var(--ink);
  font-family: 'Noto Sans TC', sans-serif;
}

/* ---------- 個人檔案卡 ---------- */
.profile-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:22px;
  overflow:hidden;
}

.profile-banner{
  height:150px;
  background:
    repeating-linear-gradient(
      135deg,
      var(--cream) 0px, var(--cream) 22px,
      #F1E6DC 22px, #F1E6DC 44px
    );
  position:relative;
}
.profile-banner::after{
  content:"";
  position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(122,75,84,.08), rgba(122,75,84,0) 60%);
}

.profile-body{ padding:0 2.2rem 1.6rem; position:relative; }

.profile-top{
  display:flex; align-items:flex-end; justify-content:space-between;
  flex-wrap:wrap; gap:1.2rem;
  margin-top:-58px;
}

.avatar-wrapper{
  width:112px; height:112px; border-radius:50%;
  background:var(--paper); padding:5px;
  box-shadow:0 0 0 2px var(--plum);
  flex-shrink:0;
}
.avatar-img{ width:100%; height:100%; border-radius:50%; object-fit:cover; display:block; }

.profile-meta{
  flex:1;
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:1rem;
  padding-bottom:.3rem;
}

.stat-group{ display:flex; gap:2.2rem; }
.stat-item{ text-align:center; }
.stat-num{
  font-family:'Noto Serif TC', serif;
  font-weight:900; font-size:1.25rem; color:var(--ink); line-height:1.1;
}
.stat-label{ font-size:.74rem; color:var(--ink-soft); margin-top:.15rem; }

.action-group{ display:flex; gap:.7rem; }
.btn-follow-main{
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.6rem 1.5rem; font-size:.88rem; font-weight:600;
  transition:background .18s ease, transform .18s ease;
}
.btn-follow-main:hover{ background:var(--plum-deep); transform:translateY(-1px); }
.btn-follow-main.following{ background:var(--hairline); color:var(--ink-soft); }
.btn-follow-main.following:hover{ background:var(--hairline); transform:none; }

.btn-message{
  background:transparent; color:var(--ink);
  border:1px solid var(--ink); border-radius:4px;
  padding:.6rem 1.4rem; font-size:.88rem; font-weight:500;
  transition:all .18s ease;
}
.btn-message:hover{ background:var(--ink); color:var(--paper); }

/* ---------- 姓名 / 簡介 ---------- */
.profile-intro{ margin-top:1rem; }
.profile-name{
  font-family:'Noto Serif TC', serif;
  font-weight:900; font-size:1.5rem;
  margin:0 0 .3rem;
  color:var(--ink);
}
.profile-handle{
  font-size:.86rem; color:var(--ink-soft);
  display:flex; align-items:center; gap:.4rem; margin-bottom:.6rem;
}
.profile-handle .dot{ color:var(--hairline); }
.profile-handle .tagline{ color:var(--ochre); font-weight:600; }
.profile-bio{
  font-size:.9rem; color:var(--ink-soft); line-height:1.7;
  max-width:640px; margin:0;
}

/* ---------- 頁籤 ---------- */
.tab-row{
  display:flex; gap:1.8rem;
  border-bottom:1px solid var(--hairline);
  margin-top:1.6rem;
}
.tab-btn{
  background:none; border:none; padding:.8rem 0;
  font-family:'Noto Serif TC', serif;
  font-size:1rem; color:var(--ink-soft);
  position:relative; cursor:pointer;
}
.tab-btn.active{ color:var(--ink); font-weight:700; }
.tab-btn.active::after{
  content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px;
  background:var(--plum);
}

/* ---------- 作品牆 ---------- */
.post-grid{
  display:grid;
  grid-template-columns:repeat(4, 1fr);
  gap:1.4rem;
  margin-top:2rem;
}
.post-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  overflow:hidden;
  transition:transform .25s ease, box-shadow .25s ease;
}
.post-card:hover{
  transform:translateY(-4px) rotate(-0.3deg);
  box-shadow:0 16px 30px -20px rgba(42,36,32,.4);
}

.post-media{ position:relative; aspect-ratio:4/5; overflow:hidden; display:block; background:var(--hairline); }
.post-media img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
.post-card:hover .post-media img{ transform:scale(1.06); }

.tag-label{
  position:absolute; top:12px; left:-6px; z-index:2;
  background:var(--plum); color:#fff;
  font-size:.66rem; letter-spacing:.04em; font-weight:600;
  padding:.26rem .65rem .26rem .9rem;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}
.tag-label::after{
  content:""; position:absolute; left:0; bottom:-6px;
  border-width:0 6px 6px 0; border-style:solid;
  border-color:transparent var(--plum-deep) transparent transparent;
}

.post-body{ padding:.95rem 1rem 1.1rem; }
.post-title{
  font-family:'Noto Serif TC', serif;
  font-weight:700; font-size:.92rem; color:var(--ink);
  margin:0 0 .55rem;
  display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;
}
.post-stats{
  display:flex; align-items:center; gap:.9rem;
  font-size:.76rem; color:var(--ink-soft);
}
.post-stats a{ color:var(--plum); text-decoration:none; font-weight:600; }

.tag-cloud{ display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.7rem; }
.tag-chip{
  font-size:.7rem; padding:.28rem .65rem; border-radius:4px;
  background:var(--cream); border:1px solid var(--hairline); color:var(--ink-soft);
}

/* ---------- 其他頁籤空狀態 ---------- */
.empty-state{
  background:var(--paper); border:1px solid var(--hairline); border-radius:22px;
  padding:3.5rem 2rem; text-align:center; margin-top:2rem;
}
.empty-icon{ font-size:2.2rem; margin-bottom:.8rem; opacity:.7; }
.empty-note{
  font-family:'Noto Serif TC', serif; font-style:italic;
  color:var(--ink-soft); font-size:.95rem; margin:0;
}

@media (max-width: 991px){
  .post-grid{ grid-template-columns:repeat(2, 1fr); }
}
@media (max-width: 640px){
  .profile-top{ flex-direction:column; align-items:flex-start; }
  .profile-meta{ width:100%; justify-content:space-between; }
  .post-grid{ grid-template-columns:1fr; }
}
</style>

<!--
  這個區塊「不加 scoped」：scoped 樣式只會作用在這個元件模板裡面的元素上，
  body 不在模板裡，寫在 scoped 區塊不會生效。不加 scoped 的話，
  這段 CSS 編譯出來就是全域樣式，不用改共用的 App.vue 也能讓 body 變成統一背景色。
-->
<style>
body {
  background-color: #F9F4F0 !important;
}
</style>