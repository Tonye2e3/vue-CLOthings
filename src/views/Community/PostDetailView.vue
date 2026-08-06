<script setup>
import { ref, computed } from 'vue'

// 收藏功能共用資料（跟 UserProfileView.vue 共用同一份收藏清單，直接 import 那個檔案）
// savedPosts：目前所有收藏的貼文清單（雖然這裡沒有直接用到它本身，
// 但 isPostSaved 內部會去讀它，所以還是要 import 進來）
// isPostSaved：檢查某篇貼文有沒有被收藏
// toggleSavePost：切換某篇貼文的收藏狀態（收藏／取消收藏）
import { isPostSaved, toggleSavePost } from '@/views/Community/CommunityView.vue'


// 使用 import 引入本地 src/assets 下的圖片
// 這種寫法叫做「靜態資源引入」：因為圖片放在專案的 src 資料夾裡面，
// 不是一個網路上的網址，要用 import 讓建置工具（Vite）知道
// 「這個檔案要打包進網站裡」，import 進來的 postImage 變數，
// 最後會變成一個瀏覽器看得懂的圖片網址，可以直接給 <img :src="..."> 用。
import postImage from '@/assets/Postimage/post2.jpg'

// 貼文詳細資料
// 這是一個很大的物件，裡面用「巢狀」的方式（物件裡面還有物件、陣列）
// 裝著這篇貼文需要的所有資訊。
const post = ref({
  id: 8842,
  user: {
    name: 'Emily_穿搭日記',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    time: '2 小時前',
    location: '台北'
  },
  isFollowing: false,
  // 指向剛才 import 的本地圖片變數
  imageUrl: postImage,
  content: '今天走簡約韓系風格 🤍 這套針織上衣與打褶寬褲質感超好，版型顯瘦又舒服，很適合秋天約會或上班～ 全身都可以直接再下方點擊購買！',
  commentsCount: 86,
  isLiked: false, // 「我」有沒有按讚
  // 這裡本來有個 isSaved 存「我」有沒有收藏，現在改成從共用的收藏清單
  // （savedPosts，在 CommunityView.vue 裡）即時判斷，不用自己在這裡另外存一份，
  // 這樣才不會發生「這裡顯示已收藏，但 UserProfileView 收藏頁籤卻沒有」這種兩邊資料兜不起來的情況。
  // taggedProducts：這篇貼文照片上標記的商品定位點，
  // x、y 是這個標記點在照片上的位置，用「百分比」表示
  // （例如 x: '65%' 代表「從照片左邊算起，65% 的地方」），
  // 這樣不管照片實際顯示的大小是多少，標記點都會固定跟著照片的相對位置走。
  taggedProducts: [
    { id: 101, name: '針織上衣', x: '65%', y: '35%' },
    { id: 102, name: '高腰寬褲', x: '55%', y: '70%' },
    { id: 103, name: '托特包', x: '41%', y: '90%' }
  ]
})

// 按讚數改用數字追蹤，方便按讚時 +1、取消時 -1；畫面顯示再轉成千分位字串
// likesNumber：存「真正的數字」，方便計算加減。
const likesNumber = ref(1248) // 對應原本的 '1,248'
// likesDisplay：一個 computed，把 likesNumber 這個純數字，
// 轉換成「1,248」這種每三位數加一個逗號的格式，給畫面顯示用。
// .toLocaleString()：JavaScript 數字內建的方法，會依照使用者瀏覽器的地區設定，
// 自動幫數字加上千分位逗號。
const likesDisplay = computed(() => likesNumber.value.toLocaleString())

// toggleLike：按下愛心按鈕時執行。
const toggleLike = () => {
  post.value.isLiked = !post.value.isLiked // 先把「有沒有按讚」的狀態反過來
  // 如果現在是「已按讚」狀態，就 +1；如果是「取消讚」，就 -1
  // 條件 ? A : B 這種寫法叫三元運算子：條件成立回傳 A，不成立回傳 B。
  likesNumber.value += post.value.isLiked ? 1 : -1
}

// isSaved：這篇貼文現在有沒有被收藏。
// 用 computed 從共用的收藏清單即時判斷（呼叫 CommunityView.vue 提供的 isPostSaved），
// 而不是自己在這裡存一份 true/false，這樣不管使用者是從哪個頁面把貼文收藏／取消收藏，
// 這裡都會自動顯示正確的狀態。
const isSaved = computed(() => isPostSaved(post.value.id))

// toggleSave：按下收藏按鈕時執行。
const toggleSave = () => {
  // 把這篇貼文整理成 UserProfileView.vue 收藏牆看得懂的格式
  // （欄位名稱要對得上：id、title、image、likes、comments、tags），
  // 再呼叫 toggleSavePost 去新增或移除。
  toggleSavePost({
    id: post.value.id,
    title: post.value.content,
    image: post.value.imageUrl,
    likes: likesDisplay.value,
    comments: post.value.commentsCount,
    // .map(...)：把 taggedProducts 陣列裡每個標記物件，轉換成 "#商品名" 這種字串格式
    tags: post.value.taggedProducts.map(t => `#${t.name}`)
  })
}

// 這套穿搭的商品清單（右側欄要顯示的可購買商品）
const products = ref([
  { id: 101, name: '奶油白V領針織上衣', price: '690', image: 'https://i.pinimg.com/1200x/dc/94/75/dc9475c6d350370bcf6c471e3ee6d6fb.jpg' },
  { id: 102, name: '高腰垂墜寬褲 (卡其)', price: '890', image: 'https://i.pinimg.com/1200x/f3/dd/f4/f3ddf4c34ff005240958bddb9a8080d0.jpg' },
  { id: 103, 
  name: '復古麻編單肩托特包', 
  price: '680', 
  image: 'https://i.pinimg.com/736x/f2/cf/7b/f2cf7b273ca7445dce8800f855051f93.jpg' }
])

// 相似穿搭推薦
const similarPosts = ref([
  { id: 1, image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80' },
  { id: 2, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&auto=format&fit=crop&q=80' },
  { id: 3, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80' }
])

// 留言列表：一開始先放兩筆假留言當範例
const comments = ref([
  { id: 1, user: '小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=May', text: '這套超好看！請問褲子是什麼顏色？' },
  { id: 2, user: '阿哲', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jerry', text: '已收藏~等發薪就下單 !!!' }
])

// newComment：跟留言輸入框做雙向綁定，存使用者「正在打字、還沒送出」的留言內容
const newComment = ref('')

const toggleFollow = () => {
  post.value.isFollowing = !post.value.isFollowing
}

// addComment：按下「送出」按鈕或在輸入框按 Enter 時執行。
const addComment = () => {
  // .trim()：去掉文字前後的空白。如果去掉空白後是空字串，代表使用者其實沒打字，
  // 直接 return（提早結束函式），不新增這則空白留言。
  if (!newComment.value.trim()) return
  // .unshift(...)：把一筆新留言加到 comments 陣列的「最前面」
  // （原本用的是 .push()，加到最後面；改成 .unshift() 之後，
  // 剛送出的留言就會排在留言列表最上方，最新的留言最先被看到）。
  comments.value.unshift({
    id: Date.now(), // 用目前時間當作這則留言的唯一編號
    user: '我', // 這裡先寫死成「我」，之後接上真正的登入系統可以換成真實使用者名稱
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
    text: newComment.value
  })
  newComment.value = '' // 送出後把輸入框清空，方便使用者繼續打下一則留言
}
</script>

<template>
  

  <div class="community-page min-vh-100 w-100">
    

    <div class="container-fluid container-lg pb-5 pt-4">
      <div class="row g-4">

        <!-- 左側：貼文主體區 (大圖、內文、互動、留言) -->
        <div class="col-12 col-lg-8">
          <div class="post-main-card">

           <!-- 發文者資訊列 -->
            <div class="author-bar">
              <!--
                把大頭貼跟名字包進 <router-link>，讓它可以點擊跳轉。
                to="/community/profile"：這是我們專案裡「個人檔案頁」(UserProfileView.vue) 對應的網址，
                跟 CommunityView.vue 側欄「熱門穿搭達人」點頭像時用的是同一個網址，
                點下去就會切換到 UserProfileView.vue 那個頁面。
                class="text-decoration-none"：Bootstrap 的工具 class，把 <a> 連結預設的底線拿掉。
              -->
              <router-link to="/community/profile" class="author-info text-decoration-none">
                <img :src="post.user.avatar" class="author-avatar" alt="avatar" />
                <div>
                  <h6 class="author-name">{{ post.user.name }}</h6>
                  <small class="author-meta">{{ post.user.time }} · {{ post.user.location }}</small>
                </div>
              </router-link>
              <button
                class="btn-follow-main"
                :class="{ following: post.isFollowing }"
                @click="toggleFollow"
              >
                {{ post.isFollowing ? '已追蹤' : '＋ 追蹤' }}
              </button>
            </div>

            <!-- 主圖 (附帶商品標籤) -->
            <div class="post-media">
              <span class="tag-label" v-if="post.taggedProducts[0]">封面故事</span>
              <img :src="post.imageUrl" class="post-image" alt="post image" />

              <!--
                商品定位標籤：改為圓點 + 展開標籤的穿搭釘選樣式
                v-for="tag in post.taggedProducts"：把每個標記點都畫成一個小圓點+標籤。
                :style="{ top: tag.y, left: tag.x }"：
                這是「動態綁定 style」的寫法，跟 :class 類似，
                差別是這裡直接綁定一個 CSS 樣式物件。意思是：
                「這個元素的 top（離頂端多遠）用 tag.y 的值、
                left（離左邊多遠）用 tag.x 的值」，
                因為 tag.y、tag.x 是像 '65%' 這樣的百分比字串，
                每個標記點就會依照資料裡設定的位置，出現在照片對應的地方。
              -->
              <span
                v-for="tag in post.taggedProducts"
                :key="tag.id"
                class="pin-tag"
                :style="{ top: tag.y, left: tag.x }"
              >
                <span class="pin-dot"></span>
                <span class="pin-label">{{ tag.name }}</span>
              </span>
            </div>

            <!-- 按讚/分享/收藏 動作列 -->
            <div class="action-bar">
              <div class="action-left">
                <!--
                  :class="{ liked: post.isLiked }"：
                  如果 isLiked 是 true，就加上 liked 這個 class（讓按鈕變成紅色強調的樣子）。
                  @click="toggleLike"：點下去執行上面 script 定義的 toggleLike 函式。
                -->
                <button class="action-btn" :class="{ liked: post.isLiked }" @click="toggleLike">
                  ♥ {{ likesDisplay }}
                </button>
                <button class="action-btn">
                  💬 {{ post.commentsCount }}
                </button>
                <button class="action-btn">
                  ↗ 分享
                </button>
              </div>
              <!--
                收藏按鈕：
                @click="toggleSave"：呼叫上面 script 定義的 toggleSave 函式，
                這個函式會去更新「共用的收藏清單」，而不是只改這個頁面自己的一個變數，
                這樣 UserProfileView.vue 的收藏頁籤才看得到剛剛收藏的貼文。
                :class="{ saved: isSaved }" 跟 <i> 裡的 isSaved，
                都是讀上面那個 computed，會自動反映「這篇貼文現在是不是在收藏清單裡」。
                <i :class="['fa-bookmark', isSaved ? 'fa-solid' : 'fa-regular']">：
                這裡的 :class 綁定的是一個「陣列」，陣列裡每一項都會變成一個 class。
                'fa-bookmark' 固定會加上；第二項用三元運算子決定，
                如果已收藏，用實心的 fa-solid 樣式圖示；還沒收藏，用空心的 fa-regular 樣式圖示，
                點一下就能明顯看到書籤圖示「被收起來」的視覺變化。
              -->
              <button class="action-btn" :class="{ saved: isSaved }" @click="toggleSave">
                <i :class="['fa-bookmark', isSaved ? 'fa-solid' : 'fa-regular']"></i>
                {{ isSaved ? '已收藏' : '收藏' }}
              </button>
            </div>

            <!-- 貼文文字描述 -->
            <p class="post-content">{{ post.content }}</p>

            <!-- 留言區塊 -->
            <div class="comment-block">
              <div class="comment-title">
                <span class="dot"></span>留言
              </div>

              <div class="comments-list">
                <div v-for="c in comments" :key="c.id" class="comment-row">
                  <img :src="c.avatar" class="comment-avatar" alt="avatar" />
                  <div class="comment-bubble">
                    <span class="comment-user">{{ c.user }}</span>
                    <span>{{ c.text }}</span>
                  </div>
                </div>
              </div>

              <!-- 輸入留言 -->
              <div class="comment-input-row">
                <!--
                  @keyup.enter="addComment"：
                  監聽「鍵盤按鍵放開」這個事件，.enter 是修飾符，
                  代表「只有放開的是 Enter 鍵才觸發」，
                  這樣使用者打完留言按 Enter 就能直接送出，不用一定要滑鼠點送出按鈕。
                -->
                <input
                  type="text"
                  v-model="newComment"
                  class="comment-input"
                  placeholder="留下你的想法..."
                  @keyup.enter="addComment"
                />
                <button class="btn-send" @click="addComment">送出</button>
              </div>
            </div>

          </div>
        </div>

        <!-- 右側：這套穿搭的商品與推薦區 -->
        <div class="col-12 col-lg-4">

          <!-- 穿搭商品清單 -->
          <div class="side-card">
            <div class="side-title"><span class="dot"></span>這套穿搭的商品</div>

            <div class="product-list">
              <div v-for="item in products" :key="item.id" class="product-row">
                <img :src="item.image" class="product-thumb" alt="product" />
                <div class="product-info">
                  <p class="product-name">{{ item.name }}</p>
                  <p class="product-price">NT$ {{ item.price }}</p>
                </div>
                <button class="btn-cart">加入購物車</button>
              </div>
            </div>

            <button class="btn-buy-all">
              一鍵購買全套穿搭 · NT$ 2,860
            </button>
          </div>

          <!-- 相似穿搭推薦 -->
          <div class="side-card">
            <div class="side-title"><span class="dot"></span>相似穿搭推薦</div>
            <div class="similar-grid">
              <div v-for="sim in similarPosts" :key="sim.id" class="similar-thumb">
                <img :src="sim.image" alt="similar look" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
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

/* ---------- 主卡片 ---------- */
.post-main-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  padding:1.6rem;
}

/* ---------- 發文者列 ---------- */
.author-bar{
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:1.2rem;
}
.author-info{ display:flex; align-items:center; gap:.8rem; }
.author-avatar{
  width:48px; height:48px; border-radius:50%; object-fit:cover;
  box-shadow:0 0 0 2px var(--plum);
}
.author-name{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:.98rem;
  margin:0; color:var(--ink);
}
.author-meta{ font-size:.78rem; color:var(--ink-soft); }

.btn-follow-main{
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.5rem 1.3rem; font-size:.84rem; font-weight:600;
  transition:background .18s ease, transform .18s ease;
}
.btn-follow-main:hover{ background:var(--plum-deep); transform:translateY(-1px); }
.btn-follow-main.following{ background:var(--hairline); color:var(--ink-soft); }
.btn-follow-main.following:hover{ background:var(--hairline); transform:none; }

/* ---------- 主圖 ---------- */
.post-media{
  position:relative;
  border-radius:8px;
  overflow:hidden;
  background:var(--cream);
  margin-bottom:1.1rem;
}
.post-image{
  width:100%; height:550px; object-fit:contain;
  display:block; background:var(--paper);
}

.tag-label{
  position:absolute; top:16px; left:-6px; z-index:2;
  background:var(--plum); color:#fff;
  font-size:.7rem; letter-spacing:.05em; font-weight:600;
  padding:.3rem .75rem .3rem 1rem;
  box-shadow:0 4px 10px rgba(0,0,0,.18);
}
.tag-label::after{
  content:""; position:absolute; left:0; bottom:-6px;
  border-width:0 6px 6px 0; border-style:solid;
  border-color:transparent var(--plum-deep) transparent transparent;
}

.pin-tag{
  position:absolute; transform:translate(-50%, -50%);
  display:flex; align-items:center; gap:.4rem;
  cursor:pointer;
}
.pin-dot{
  width:12px; height:12px; border-radius:50%;
  background:var(--ochre);
  box-shadow:0 0 0 4px rgba(184,134,46,.28);
  flex-shrink:0;
  animation:pulse 2.2s ease-in-out infinite;
}
@keyframes pulse{
  0%, 100%{ box-shadow:0 0 0 4px rgba(184,134,46,.28); }
  50%{ box-shadow:0 0 0 7px rgba(184,134,46,.14); }
}
.pin-label{
  background:var(--ink);
  color:#fff;
  font-size:.72rem; font-weight:600;
  padding:.28rem .7rem;
  border-radius:4px;
  white-space:nowrap;
  opacity:.94;
  transition:background .18s ease;
}
.pin-tag:hover .pin-label{ background:var(--plum); }

/* ---------- 互動列 ---------- */
.action-bar{
  display:flex; align-items:center; justify-content:space-between;
  padding:.7rem 0;
  border-top:1px solid var(--hairline);
  border-bottom:1px solid var(--hairline);
  margin-bottom:1.2rem;
}
.action-left{ display:flex; gap:1.6rem; }
.action-btn{
  background:none; border:none; padding:0;
  font-size:.88rem; color:var(--ink-soft);
  transition:color .18s ease;
  display:inline-flex; align-items:center; gap:.4rem;
}
.action-btn:hover{ color:var(--ink); }
.action-btn.liked{ color:#B4453A; font-weight:600; }
.action-btn.saved{ color:var(--ochre); font-weight:600; }

/* ---------- 內文 ---------- */
.post-content{
  font-size:.94rem; line-height:1.8; color:var(--ink);
  margin-bottom:1.6rem;
}

/* ---------- 留言區 ---------- */
.comment-block{
  background:var(--cream);
  border-radius:8px;
  padding:1.3rem;
}
.comment-title{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:.95rem;
  display:flex; align-items:center; gap:.5rem;
  margin-bottom:1rem; color:var(--ink);
}
.comment-title .dot, .side-title .dot{
  width:6px; height:6px; border-radius:50%; background:var(--ochre);
}

.comments-list{ display:flex; flex-direction:column; gap:.7rem; margin-bottom:1.1rem; }
.comment-row{ display:flex; align-items:flex-start; gap:.6rem; }
.comment-avatar{ width:28px; height:28px; border-radius:50%; object-fit:cover; flex-shrink:0; }
.comment-bubble{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:4px;
  padding:.55rem .9rem;
  font-size:.85rem; color:var(--ink);
  width:100%;
}
.comment-user{ font-weight:700; margin-right:.5rem; }

.comment-input-row{ display:flex; gap:.6rem; }
.comment-input{
  flex:1;
  border:1px solid var(--hairline);
  background:var(--paper);
  border-radius:4px;
  padding:.6rem 1rem;
  font-size:.86rem; color:var(--ink);
  outline:none;
  transition:border-color .18s ease;
}
.comment-input:focus{ border-color:var(--plum); }
.comment-input::placeholder{ color:var(--ink-soft); }
.btn-send{
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.6rem 1.4rem; font-size:.85rem; font-weight:600;
  white-space:nowrap;
  transition:background .18s ease;
}
.btn-send:hover{ background:var(--plum-deep); }

/* ---------- 側邊欄 ---------- */
.side-card{
  background:var(--paper);
  border:1px solid var(--hairline);
  border-radius:16px;
  padding:1.4rem 1.3rem;
  margin-bottom:1.5rem;
}
.side-title{
  font-family:'Noto Serif TC', serif; font-weight:700; font-size:1.02rem;
  display:flex; align-items:center; gap:.5rem;
  margin-bottom:1.1rem; color:var(--ink);
}

.product-list{ display:flex; flex-direction:column; gap:.8rem; margin-bottom:1.2rem; }
.product-row{
  display:flex; align-items:center; gap:.7rem;
  background:var(--cream);
  border-radius:8px;
  padding:.55rem;
}
.product-thumb{ width:56px; height:56px; border-radius:6px; object-fit:cover; flex-shrink:0; }
.product-info{ flex:1; min-width:0; }
.product-name{
  font-size:.83rem; font-weight:700; color:var(--ink);
  margin:0 0 .2rem;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.product-price{ font-size:.8rem; color:var(--ochre); font-weight:600; margin:0; }
.btn-cart{
  background:transparent; color:var(--ink);
  border:1px solid var(--ink); border-radius:4px;
  padding:.35rem .8rem; font-size:.74rem; white-space:nowrap;
  transition:all .18s ease;
}
.btn-cart:hover{ background:var(--ink); color:var(--paper); }

.btn-buy-all{
  width:100%;
  background:var(--ink); color:var(--paper);
  border:none; border-radius:4px;
  padding:.75rem; font-size:.88rem; font-weight:600;
  transition:background .18s ease;
}
.btn-buy-all:hover{ background:var(--plum-deep); }

.similar-grid{ display:grid; grid-template-columns:repeat(3, 1fr); gap:.6rem; }
.similar-thumb{
  aspect-ratio:3/4; border-radius:6px; overflow:hidden;
  background:var(--cream);
  cursor:pointer;
}
.similar-thumb img{
  width:100%; height:100%; object-fit:cover;
  transition:transform .3s ease;
}
.similar-thumb:hover img{ transform:scale(1.06); }

@media (max-width: 767px){
  .post-image{ height:380px; }
  .post-main-card{ padding:1.1rem; }
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