<script setup>
import { ref, computed } from 'vue'
// 1. 暫時導覽列元件（共用導覽列尚未合併，先註解掉，避免報錯）
// import TempNavbar from '@/components/TempNavbar.vue'

// 分頁 Tab 狀態
const currentTab = ref('hot')

// 熱門商品標籤
const popularProducts = ref([
  { id: 1, name: '經典圓領短T' },
  { id: 2, name: '法式碎花洋裝' },
  { id: 3, name: '羊毛混紡針織外套' },
  { id: 4, name: '修身牛仔褲' },
  { id: 5, name: '百褶及膝裙' }
])

// 穿搭達人資料
const creators = ref([
  { id: 1, name: 'Amy_穿搭日記', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy', meta: '2.1萬追蹤', isFollowing: false },
  { id: 2, name: 'Kevin.style', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin', meta: '1.6萬追蹤', isFollowing: false },
  { id: 3, name: '小雨 rainy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rainy', meta: '3.4萬追蹤', isFollowing: true }
])

// 穿搭貼文假資料（圖片改用穩定可顯示的穿搭情境圖，避免空白）
const posts = ref([
  {
    postId: 1,
    user: { name: 'Amy_穿搭日記', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amy' },
    title: '秋季奶茶色系穿搭，寬褲+針織的溫柔搭配',
    desc: '用奶茶色打底，寬褲修飾比例，針織外套增加層次，走在街上也很有電影感。',
    imageUrl: 'https://loremflickr.com/900/720/knitwear,sweater,fashion',
    likesCount: '1.2k',
    commentsCount: 89,
    taggedProducts: [{ id: 3, name: '羊毛混紡針織外套' }]
  },
  {
    postId: 2,
    user: { name: 'Kevin.style', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin' },
    title: '極簡工裝風 | 大地色機能外套通勤也好看',
    desc: '極簡工裝風，大地色機能外套通勤也好看，口袋設計實用又有型。',
    imageUrl: 'https://loremflickr.com/700/560/jacket,menswear,fashion',
    likesCount: '856',
    commentsCount: 42,
    taggedProducts: [{ id: 1, name: '經典圓領短T' }]
  },
  {
    postId: 3,
    user: { name: '小雨 rainy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rainy' },
    title: '約會小心機 | 法式碎花洋裝配藤編包 🌸',
    desc: '約會小心機，法式碎花洋裝配藤編包，甜而不膩剛剛好。',
    imageUrl: 'https://loremflickr.com/700/560/dress,floral,fashion',
    likesCount: '2.4k',
    commentsCount: 158,
    taggedProducts: [{ id: 2, name: '法式碎花洋裝' }]
  }
])

// 搜尋（可搜尋貼文標題、標籤商品、用戶名）
const searchQuery = ref('')

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return posts.value
  return posts.value.filter(post => {
    const inTitle = post.title.toLowerCase().includes(q)
    const inUser = post.user.name.toLowerCase().includes(q)
    const inTags = (post.taggedProducts || []).some(p => p.name.toLowerCase().includes(q))
    return inTitle || inUser || inTags
  })
})

const filteredCreators = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return creators.value
  return creators.value.filter(c => c.name.toLowerCase().includes(q))
})

const filteredTags = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return popularProducts.value
  return popularProducts.value.filter(p => p.name.toLowerCase().includes(q))
})

const isSearching = computed(() => searchQuery.value.trim() !== '')

// 未搜尋時：第一篇當作「封面故事」，其餘進入雙欄網格
// 搜尋時：不特別放大第一篇，全部以網格呈現
const featurePost = computed(() => (isSearching.value ? null : filteredPosts.value[0]))
const gridPosts = computed(() => (isSearching.value ? filteredPosts.value : filteredPosts.value.slice(1)))

const toggleFollow = (creator) => {
  creator.isFollowing = !creator.isFollowing
}
</script>

<template>
  <!-- 引入 Bootstrap CSS + 字體 -->
  <component is="style">
    @import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&amp;family=Noto+Sans+TC:wght@400;500;600;700&amp;display=swap');
  </component>

  <div class="community-page min-vh-100 w-100">

    

    <div class="container-fluid container-lg pb-5">

      <!-- 頁首：眉題 + 手繪底線標題 -->
      <div class="page-head">
        <div class="eyebrow">Style Journal</div>
        <h1 class="page-title">
          穿搭社群
          <svg viewBox="0 0 260 14" preserveAspectRatio="none">
            <path d="M2 8 C 40 2, 80 12, 120 6 S 200 2, 258 8" fill="none" stroke="#B8862E" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </h1>
        <p class="page-sub">Outfit Community — 紀錄每一天的穿著練習</p>

        <!-- 搜尋列：可搜尋穿搭標籤、單品或用戶 -->
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21l-4.3-4.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input
            type="text"
            v-model="searchQuery"
            class="search-input"
            placeholder="搜尋穿搭、關鍵字或用戶..."
          />
          <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''" aria-label="清除搜尋">✕</button>
        </div>
      </div>

      <!-- 分頁與分享按鈕 -->
      <div class="section-row mb-4">
        <div class="tab-group">
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'hot' }"
            @click="currentTab = 'hot'"
          >熱門</button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'new' }"
            @click="currentTab = 'new'"
          >最新</button>
          <button
            class="tab-btn"
            :class="{ active: currentTab === 'follow' }"
            @click="currentTab = 'follow'"
          >追蹤中</button>
        </div>

        <router-link to="/community/create" class="btn-share text-decoration-none">
          ＋ 分享我的穿搭
        </router-link>
      </div>

      <!-- 主要內容區 -->
      <div class="row g-4">

        <!-- 左側：貼文列表區 -->
        <div class="col-12 col-lg-9">

          <!-- 封面故事卡（取貼文第一筆） -->
          <div class="feature-card" v-if="featurePost">
            <router-link :to="`/community/post/${featurePost.postId}`" class="feature-media d-block text-decoration-none">
              <span class="tag-label">封面故事</span>
              <img :src="featurePost.imageUrl" :alt="featurePost.title" />
            </router-link>
            <div class="feature-body">
              <router-link to="/community/profile" class="author-row text-decoration-none">
                <img class="avatar" :src="featurePost.user.avatar" alt="avatar" />
                <div>
                  <div class="author-name">{{ featurePost.user.name }}</div>
                  <div class="author-role">本週封面 · 秋季選品</div>
                </div>
              </router-link>
              <router-link :to="`/community/post/${featurePost.postId}`" class="text-decoration-none text-dark">
                <h3>{{ featurePost.title }}</h3>
              </router-link>
              <p class="desc">{{ featurePost.desc }}</p>
              <div class="stat-row">
                <span>♥ {{ featurePost.likesCount }}</span>
                <span>💬 {{ featurePost.commentsCount }}</span>
                <a href="#" class="link-out">查看單品 →</a>
              </div>
            </div>
          </div>

          <!-- 搜尋無結果 -->
          <div class="empty-state" v-if="isSearching && filteredPosts.length === 0">
            找不到符合「{{ searchQuery }}」的穿搭、關鍵字或用戶，換個關鍵字試試。
          </div>

          <!-- 其餘貼文：雙欄網格 -->
          <div class="post-grid" v-if="gridPosts.length">
            <div v-for="post in gridPosts" :key="post.postId" class="post-card">

              <router-link :to="`/community/post/${post.postId}`" class="post-media d-block text-decoration-none">
                <span class="tag-label" v-if="post.taggedProducts && post.taggedProducts[0]">
                  {{ post.taggedProducts[0].name }}
                </span>
                <img :src="post.imageUrl" :alt="post.title" />
              </router-link>

              <div class="post-body">
                <router-link to="/community/profile" class="post-author text-decoration-none">
                  <img :src="post.user.avatar" alt="avatar" />
                  <span>{{ post.user.name }}</span>
                </router-link>

                <router-link :to="`/community/post/${post.postId}`" class="text-decoration-none">
                  <p class="post-desc line-clamp-2">{{ post.title }}</p>
                </router-link>

                <div class="post-foot">
                  <span>♥ {{ post.likesCount }}</span>
                  <span>💬 {{ post.commentsCount }}</span>
                  <a href="#">單品</a>
                </div>
              </div>
            </div>
          </div>

          <!-- 載入更多 -->
          <div class="load-more-wrap">
            <button class="btn-load">載入更多穿搭 ▾</button>
          </div>
        </div>

        <!-- 右側：側邊欄 -->
        <div class="col-12 col-lg-3">

          <div class="side-card">
            <div class="side-title"><span class="dot"></span>熱門穿搭達人</div>
            <div v-for="creator in filteredCreators" :key="creator.id" class="stylist-row">
              <router-link to="/community/profile" class="d-flex align-items-center text-decoration-none flex-grow-1 min-w-0">
                <img class="stylist-avatar" :src="creator.avatar" alt="avatar" />
                <div class="min-w-0">
                  <div class="stylist-name text-truncate">{{ creator.name }}</div>
                  <div class="stylist-meta">{{ creator.meta }}</div>
                </div>
              </router-link>
              <button
                class="btn-follow"
                :class="{ following: creator.isFollowing }"
                @click="toggleFollow(creator)"
              >
                {{ creator.isFollowing ? '已追蹤' : '追蹤' }}
              </button>
            </div>
          </div>

          <div class="side-card">
            <div class="side-title"><span class="dot"></span>熱門商品標籤</div>
            <div class="tag-cloud" v-if="filteredTags.length">
              <span
                v-for="product in filteredTags"
                :key="product.id"
                class="tag-chip"
                @click="searchQuery = product.name"
              >#{{ product.name }}</span>
            </div>
            <p class="empty-hint" v-else>沒有符合的標籤</p>
          </div>

          <div class="side-card">
            <p class="side-note">「穿搭不是規則，是每天寫給自己的一封短信。」</p>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.community-page {
  top: 0;
  left: 0;
  min-height: 100vh;
  background-color: #F9F4F0 !important;
  box-sizing: border-box;
  z-index: 10;
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

/* ---------- 頁首 ---------- */
.page-head{ padding:2.4rem 0 1.2rem; }
.eyebrow{
  font-size:.78rem; letter-spacing:.28em; text-transform:uppercase;
  color:var(--ochre); font-weight:700; margin-bottom:.6rem;
}
.page-title{
  font-family:'Noto Serif TC', serif;
  font-weight:900;
  font-size:clamp(2rem, 4.5vw, 3rem);
  line-height:1.05;
  margin:0;
  color: var(--ink);
}
.page-title svg{ display:block; width:220px; max-width:60%; height:14px; margin-top:2px; }
.page-sub{
  font-family:'Noto Serif TC', serif;
  font-style:italic;
  color:var(--ink-soft);
  font-size:1.02rem;
  margin-top:.6rem;
}

/* ---------- 搜尋列 ---------- */
.search-bar{
  position:relative;
  display:flex; align-items:center;
  max-width:420px;
  margin-top:1.4rem;
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:999px;
  padding:.55rem 1rem;
  transition:border-color .18s ease, box-shadow .18s ease;
}
.search-bar:focus-within{
  border-color:var(--plum);
  box-shadow:0 0 0 3px rgba(122,75,84,.12);
}
.search-icon{ width:17px; height:17px; color:var(--ink-soft); flex-shrink:0; }
.search-input{
  border:none; outline:none; background:transparent;
  flex:1; margin-left:.6rem;
  font-family:'Noto Sans TC', sans-serif;
  font-size:.88rem; color:var(--ink);
}
.search-input::placeholder{ color:var(--ink-soft); }
.search-clear{
  border:none; background:var(--hairline); color:var(--ink-soft);
  width:20px; height:20px; border-radius:50%; font-size:.7rem;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  cursor:pointer;
}
.search-clear:hover{ background:var(--plum); color:#fff; }

/* ---------- 分頁列 ---------- */
.section-row{
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:1rem;
  border-bottom:1px solid var(--hairline);
  padding-bottom:.2rem;
}
.tab-group{ display:flex; gap:1.8rem; }
.tab-btn{
  background:none; border:none; padding:.7rem 0;
  font-family:'Noto Serif TC', serif;
  font-size:1.02rem; color:var(--ink-soft);
  position:relative; cursor:pointer;
}
.tab-btn.active{ color:var(--ink); font-weight:700; }
.tab-btn.active::after{
  content:""; position:absolute; left:0; right:0; bottom:-1px; height:2px;
  background:var(--plum);
}
.btn-share{
  background:var(--ink); color:var(--paper) !important; border:none;
  border-radius:999px; padding:.6rem 1.4rem; font-size:.88rem; font-weight:600;
  display:inline-flex; align-items:center; gap:.4rem;
  transition:background .18s ease, transform .18s ease;
}
.btn-share:hover{ background:var(--plum-deep); transform:translateY(-1px); }

/* ---------- 封面故事卡 ---------- */
.feature-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:22px;
  overflow:hidden;
  display:grid;
  grid-template-columns:1.15fr 1fr;
  margin-bottom:1.6rem;
  transition:box-shadow .25s ease;
}
.feature-card:hover{ box-shadow:0 18px 34px -22px rgba(42,36,32,.35); }
.feature-media{ position:relative; overflow:hidden; min-height:320px; background:var(--hairline); }
.feature-media img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .6s ease; }
.feature-card:hover .feature-media img{ transform:scale(1.04); }

.tag-label{
  position:absolute; top:16px; left:16px; z-index:2;
  background:var(--plum); color:#fff;
  font-size:.72rem; letter-spacing:.05em; font-weight:600;
  padding:.32rem .85rem;
  border-radius:999px;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}

.feature-body{ padding:1.9rem 1.8rem; display:flex; flex-direction:column; }
.author-row{ display:flex; align-items:center; gap:.65rem; margin-bottom:1rem; color:var(--ink); }
.avatar{ width:40px; height:40px; border-radius:50%; object-fit:cover; box-shadow:0 0 0 1.5px var(--plum); background:#fff; }
.author-name{ font-weight:700; font-size:.95rem; }
.author-role{ font-size:.76rem; color:var(--ink-soft); }

.feature-body h3{
  font-family:'Noto Serif TC', serif;
  font-size:1.4rem; font-weight:700; line-height:1.35; margin-bottom:.6rem;
}
.feature-body p.desc{ color:var(--ink-soft); font-size:.92rem; line-height:1.7; flex:1; }

.stat-row{
  display:flex; align-items:center; gap:1.2rem;
  border-top:1px dashed var(--hairline); padding-top:1rem; margin-top:1rem;
  font-size:.85rem; color:var(--ink-soft);
}
.stat-row .link-out{ margin-left:auto; color:var(--plum); font-weight:600; text-decoration:none; border-bottom:1px solid var(--plum); }

/* ---------- 貼文網格 ---------- */
.post-grid{ display:grid; grid-template-columns:repeat(2, 1fr); gap:1.4rem; }
.post-card{
  background:var(--paper); border:1px solid var(--hairline);
  border-radius:16px;
  overflow:hidden; transition:transform .25s ease, box-shadow .25s ease;
}
.post-card:hover{ transform:translateY(-4px) rotate(-0.3deg); box-shadow:0 16px 30px -20px rgba(42,36,32,.4); }
.post-media{ position:relative; display:block; aspect-ratio:4/3; overflow:hidden; background:var(--hairline); }
.post-media img{ width:100%; height:100%; object-fit:cover; display:block; transition:transform .5s ease; }
.post-card:hover .post-media img{ transform:scale(1.06); }
.post-media .tag-label{ font-size:.66rem; padding:.24rem .7rem; top:12px; left:12px; }

.post-body{ padding:1rem 1.1rem 1.2rem; }
.post-author{ display:flex; align-items:center; gap:.5rem; margin-bottom:.6rem; color:var(--ink); }
.post-author img{ width:28px; height:28px; border-radius:50%; object-fit:cover; }
.post-author span{ font-size:.85rem; font-weight:700; }
.post-desc{ font-size:.85rem; color:var(--ink-soft); line-height:1.55; min-height:2.6em; margin:0; }
.post-foot{
  display:flex; align-items:center; gap:1rem; margin-top:.9rem;
  padding-top:.8rem; border-top:1px solid var(--hairline);
  font-size:.8rem; color:var(--ink-soft);
}
.post-foot a{ margin-left:auto; color:var(--plum); text-decoration:none; font-weight:600; }

.line-clamp-2{
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}

.empty-state{
  background:var(--paper); border:1px dashed var(--hairline); border-radius:16px;
  padding:2.2rem 1.5rem; text-align:center; color:var(--ink-soft);
  font-size:.92rem; margin-bottom:1.6rem;
}
.empty-hint{ font-size:.8rem; color:var(--ink-soft); margin:0; }

/* ---------- 載入更多 ---------- */
.load-more-wrap{ text-align:center; margin-top:2.2rem; }
.btn-load{
  background:transparent; border:1px solid var(--ink); color:var(--ink);
  border-radius:999px; padding:.6rem 2rem; font-size:.88rem; letter-spacing:.03em;
  transition:all .2s ease;
}
.btn-load:hover{ background:var(--ink); color:var(--cream); }

/* ---------- 側邊欄 ---------- */
.side-card{ background:var(--paper); border:1px solid var(--hairline); border-radius:16px; padding:1.4rem 1.3rem; margin-bottom:1.4rem; }
.side-title{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:1.02rem;
  margin-bottom:1.1rem; display:flex; align-items:center; gap:.5rem; color:var(--ink);
}
.side-title .dot{ width:6px; height:6px; border-radius:50%; background:var(--ochre); }

.stylist-row{ display:flex; align-items:center; gap:.7rem; padding:.65rem 0; border-bottom:1px solid var(--hairline); }
.stylist-row:last-child{ border-bottom:none; padding-bottom:0; }
.stylist-avatar{ width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.stylist-name{ font-weight:700; font-size:.88rem; color:var(--ink); }
.stylist-meta{ font-size:.72rem; color:var(--ink-soft); }
.min-w-0{ min-width:0; }
.btn-follow{
  margin-left:.5rem; font-size:.74rem; padding:.34rem .85rem; border-radius:999px;
  border:1px solid var(--plum); color:var(--plum); background:transparent;
  transition:all .18s ease; white-space:nowrap; flex-shrink:0;
}
.btn-follow.following{ background:var(--hairline); border-color:var(--hairline); color:var(--ink-soft); }
.btn-follow:not(.following):hover{ background:var(--plum); color:#fff; }

.tag-cloud{ display:flex; flex-wrap:wrap; gap:.5rem; }
.tag-chip{
  font-size:.76rem; padding:.38rem .85rem; border-radius:999px;
  background:var(--cream); border:1px solid var(--hairline); color:var(--ink);
  cursor:pointer; transition:all .18s ease;
}
.tag-chip:nth-child(3n+1){ transform:rotate(-1deg); }
.tag-chip:nth-child(3n+2){ transform:rotate(1deg); }
.tag-chip:hover{ border-color:var(--ochre); color:var(--ochre); }

.side-note{
  font-family:'Noto Serif TC', serif; font-style:italic;
  font-size:.84rem; color:var(--ink-soft); line-height:1.7;
  border-left:2px solid var(--plum); padding-left:.9rem; margin:0;
}

@media (max-width: 991px){
  .feature-card{ grid-template-columns:1fr; }
  .feature-media{ min-height:240px; }
}
@media (max-width: 767px){
  .post-grid{ grid-template-columns:1fr; }
  .section-row{ flex-direction:column; align-items:flex-start; }
  .search-bar{ max-width:100%; }
}
</style>