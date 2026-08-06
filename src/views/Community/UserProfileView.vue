<script setup>
// ============================================================
// 這裡是「邏輯」的部分：資料存在哪裡、發生什麼事情要做什麼事
// ============================================================

// ref() 是 Vue 提供的功能，用來建立一個「會被畫面自動追蹤」的變數。
// 白話說：只要 ref() 包起來的資料改變了，畫面上有用到這個資料的地方
// 會自動跟著重新顯示，不用自己手動去更新 HTML。
import { ref } from 'vue'

// 收藏功能共用資料（跟 PostDetailView.vue 共用同一份收藏清單，直接 import 那個檔案）
// savedPosts：使用者收藏的所有貼文，格式是 { id, title, image, likes, comments, tags }，
// PostDetailView.vue 按收藏的時候會把貼文加進這份清單，這裡直接讀出來顯示。
import { savedPosts } from '@/views/Community/CommunityView.vue'


// 使用者個人資料
// 這是一個「物件」（用 { } 包起來、裡面很多 key: value 的資料），
// 存放這個使用者頁面要顯示的所有基本資訊。
// 外面包了 ref()，代表以後如果我們改了裡面任何一個值（例如按追蹤後
// isFollowing 從 false 變 true），畫面會自動更新，不用自己重畫。
const userProfile = ref({
  name: 'Emily 艾米莉',
  handle: '@emily_style',
  bioTag: '韓系 | 簡約 | 日常穿搭分享',
  bio: '喜歡分享每天的穿搭靈感，點擊看板搭配同款單品，一起變美！',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', // 大頭貼圖片網址
  bannerBg: '#EFE8E1', // 暖質感奶茶底色
  postsCount: '1,284',    // 貼文數（純文字顯示用，不是拿來計算的數字）
  followersCount: '58.6K',
  followingCount: '342',
  isFollowing: false // 「我」有沒有追蹤這個人，true/false 這種只有兩種狀態的值叫做布林值
})

// 當前頁籤 (穿搭作品, 收藏, 同款商品, 關於我)
// 這個 ref 只存一個字串，代表「現在使用者點的是哪一個分類頁籤」。
// 畫面會根據這個值，決定要顯示哪一塊內容（下面 template 會用到）。
const activeTab = ref('works')

// 穿搭作品列表 (改回帶有 # 的標籤格式)
// 這是一個「陣列」（用 [ ] 包起來、裡面放很多筆資料），每一筆都是一篇貼文的資訊。
// 之後畫面會用 v-for 把這個陣列「一筆一筆」畫成一張一張的卡片。
const userPosts = ref([
  {
    id: 1,
    title: '春日約會穿搭 · 碎花洋裝',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    likes: '2,341',
    comments: '128',
    tags: ['#法式碎花洋裝', '#皮革側背包'] // 這篇貼文的標籤，也是一個陣列（字串陣列）
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

// 這是頁籤按鈕要顯示的清單：每個頁籤有一個「代號」(key，程式判斷用)
// 跟一個「顯示文字」(label，給人看的)。
// 這裡沒有包 ref()，因為這份清單開頭到結束都不會被改變（不會新增/刪除頁籤），
// 只有純顯示用途，所以不需要讓 Vue 特別去「追蹤」它的變化。
const tabs = [
  { key: 'works', label: '穿搭作品' },
  { key: 'saved', label: '收藏' }
]

// 這是一個「函式」（function，可以想成一個按鈕按下去要執行的一段動作）。
// 按「追蹤」按鈕的時候會呼叫這個函式。
// userProfile.value：因為 userProfile 是用 ref() 包起來的，
// 在 <script> 裡面要拿裡面真正的資料，一定要加 .value。
// （在 <template> 裡面則不用加 .value，Vue 會自動幫你處理，等一下會看到）
// !userProfile.value.isFollowing：「!」代表「相反」，
// 所以這行的意思是「把 isFollowing 改成跟現在相反的值」（true 變 false，false 變 true）。
const toggleFollow = () => {
  userProfile.value.isFollowing = !userProfile.value.isFollowing
}
</script>

<template>
  

  <div class="community-page min-vh-100 w-100">
    

    <div class="container-fluid container-lg pb-5">

      <!-- 個人檔案卡 -->
      <div class="profile-card mb-4">

        <!-- 封面橫幅：改用斜紋質感取代純色平塗 -->
        <div class="profile-banner"></div>

        <div class="profile-body">
          <div class="profile-top">

            <!-- 大頭貼 -->
            <div class="avatar-wrapper">
              <!--
                :src="userProfile.avatar"
                前面加冒號的屬性（例如 :src）叫做「動態綁定」，
                意思是「這個屬性的值不是寫死的文字，而是綁定一個變數」。
                所以這裡的圖片網址會直接抓 userProfile 裡的 avatar 值。
                （在 template 裡面直接寫 userProfile.avatar，不用加 .value）
              -->
              <img :src="userProfile.avatar" class="avatar-img" alt="Avatar" />
            </div>

            <!-- 數據與動作 -->
            <div class="profile-meta">
              <div class="stat-group">
                <div class="stat-item">
                  <!-- {{ }} 雙大括號叫做「插值」，作用是把後面的變數值印到畫面上 -->
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
                  <!--
                    {{ 條件 ? A : B }} 叫做「三元運算子」，白話翻譯：
                    「如果條件成立，顯示 A；不成立的話，顯示 B」。
                    這裡的意思是：如果已經追蹤了，按鈕文字顯示「已追蹤」，
                    沒追蹤的話顯示「＋ 追蹤」。
                  -->
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
            <!--
              v-for="t in tabs"：這是「迴圈」，意思是「把 tabs 這個陣列
              裡的每一筆資料拿出來，重複畫一次下面這個 <button>」。
              t 就是「這一輪迴圈拿到的那一筆資料」，你可以想像成
              tabs 陣列裡有 4 筆，這個 <button> 就會被畫出 4 次，
              每一次的 t 分別是 tabs[0]、tabs[1]、tabs[2]、tabs[3]。

              :key="t.key"：Vue 規定用 v-for 畫重複元素時，
              一定要給每一個元素一個獨一無二的「身分證字號」(key)，
              這樣 Vue 才能準確知道「哪一個元素改變了、要更新哪一個」，
              不然畫面更新可能會出現奇怪的錯亂。

              :class="{ active: activeTab === t.key }"：
              這是「條件式加 class」的寫法。意思是：
              如果 activeTab（目前選的頁籤）等於這顆按鈕的 t.key，
              就幫這顆按鈕加上 class="active"（讓它顯示成「被選中」的樣子）；
              不符合的話就不加。

              @click="activeTab = t.key"：
              @click 代表「監聽點擊事件」，也就是「使用者點這個按鈕的時候要做什麼」。
              這裡點下去，就把 activeTab 改成這顆按鈕代表的 key，
              畫面下面就會跟著切換顯示對應的內容。
            -->
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

      <!--
        穿搭作品牆
        v-if="activeTab === 'works'"：「條件式顯示」，意思是
        「只有當 activeTab 剛好等於 'works' 的時候，才把這一整塊畫出來」，
        不符合條件的話，這塊 HTML 根本不會出現在畫面上（不是隱藏，是完全不畫）。
      -->
      <div v-if="activeTab === 'works'" class="post-grid">
        <!-- 一樣是 v-for 迴圈，把 userPosts 陣列裡每一篇貼文都畫成一張卡片 -->
        <div v-for="post in userPosts" :key="post.id" class="post-card">

          <!--
            <router-link> 是 Vue Router（負責網址切換的套件）提供的元件，
            功能跟 HTML 原生的 <a> 連結很像，差別是點下去不會整頁重新整理，
            而是在同一個網頁內「偷偷換內容」，速度比較快。
            :to="`/community/post/${post.id}`" 這種寫法叫做「樣板字串」，
            用反引號 ` ` 包起來，裡面的 ${...} 會被換成實際的變數值，
            例如 post.id 是 1，網址就會變成 /community/post/1。
          -->
          <router-link :to="`/community/post/${post.id}`" class="post-media d-block text-decoration-none">
            <!--
              v-if="post.tags[0]"：如果這篇貼文的標籤陣列第一筆存在（不是空的），
              才顯示這個標籤小方塊。
              .replace('#', '')：把字串裡的 '#' 符號換成空字串（也就是刪掉它），
              因為原始資料裡標籤是 "#法式碎花洋裝" 這樣帶 # 的格式，
              這裡顯示的時候想拿掉 #。
            -->
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
              <!-- 這篇貼文可能有好幾個標籤，所以再用一次 v-for 把每個標籤都畫出來 -->
              <span v-for="tag in post.tags" :key="tag" class="tag-chip">{{ tag }}</span>
            </div>
          </div>

        </div>
      </div>

      <!--
        收藏牆
        v-else-if="activeTab === 'saved'"：接在上面 v-if 後面的「再一個條件」，
        意思是「如果上面 works 那個條件不成立，再檢查看看是不是 'saved'，
        是的話就換畫這一塊」。
        裡面又分兩種情況：
        savedPosts.length（收藏清單裡有東西，長度大於 0）→ 顯示收藏牆（卡片排版跟上面作品牆幾乎一樣）；
        沒有收藏任何貼文 → 顯示一個「還沒收藏」的提示畫面。
      -->
      <div v-else-if="activeTab === 'saved'">
        <div v-if="savedPosts.length" class="post-grid">
          <!-- 這裡的卡片排版跟上面「穿搭作品牆」幾乎一模一樣，差別只是資料來源換成 savedPosts -->
          <div v-for="post in savedPosts" :key="post.id" class="post-card">
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

        <!-- v-else（搭配上面裡層的 v-if）：收藏清單是空的時候，顯示這個提示，而不是一片空白 -->
        <div v-else class="empty-state">
          <div class="empty-icon"></div>
          <p class="empty-note">「還沒有收藏任何穿搭，去社群逛逛按個收藏吧。」</p>
        </div>
      </div>

      <!--
        其它頁籤（同款商品 / 關於我）未開啟時的預設狀態
        這裡的 v-else 是接在最上面 works 那個 v-if、跟剛剛 saved 那個 v-else-if 後面，
        意思是「works 不是、saved 也不是」，才會走到這裡。
      -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="fa-solid fa-folder" style="color: rgb(122, 75, 84);"></i>
        </div>
        <p class="empty-note">「這裡的故事，還在整理中。」</p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/*
  這個 <style> 標籤有加 scoped，意思是「這裡面寫的 CSS 樣式，
  只會套用在這個檔案自己的 HTML 上」，不會不小心影響到其他頁面的元素。
  Vue 是怎麼做到的？它會偷偷幫這個檔案裡的每個 HTML 元素加上一個
  獨一無二的隱藏屬性（例如 data-v-xxxxx），
  然後把下面每一條 CSS 規則也自動加上同樣的屬性選擇器，
  這樣瀏覽器比對的時候就只會匹配到「這個檔案畫出來的元素」。
*/
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
.community-page {
  width: 100%;
  min-height: 100vh;
  background-color: #F9F4F0 !important;
  box-sizing: border-box;
  /*
    --cream、--paper 這種用兩個減號開頭的名稱，叫做「CSS 變數」。
    可以把它想成幫顏色取一個好記的名字，之後在其他樣式規則裡
    只要寫 var(--cream) 就能重複使用同一個顏色，
    以後想換色系，只要改這裡一個地方，全部套用到它的樣式都會一起變。
  */
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

/*
  @media (max-width: 991px) { ... } 這種寫法叫做「響應式設計 / RWD」，
  意思是「當瀏覽器視窗寬度小於等於 991px 時，才套用大括號裡的樣式」。
  這樣可以讓網頁在手機、平板、電腦上，自動切換成不同的排版方式。
*/
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