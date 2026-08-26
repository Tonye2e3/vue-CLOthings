<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import IconChevronLeft from '@/components/icons/IconChevronLeft.vue'
import IconChevronRight from '@/components/icons/IconChevronRight.vue'
import hero1 from '@/assets/Shop/FangShaiYi.png'
import hero2 from '@/assets/Shop/LiangGanYi.png'
import hero3 from '@/assets/Shop/CLOthingsLianMing.png'

const slides = [
  {
    title: '輕便抗UV連帽外套',
    tagline: '一件抵擋整個夏天的紫外線',
    price: 'NT$1,290',
    badge: '限時優惠至 8/30',
    bg: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${hero1})`,
  },
  {
    title: 'CLO.things涼感系列',
    tagline: '透氣涼感，舒適一整天',
    price: 'NT$490 起',
    badge: '新品上市',
    bg: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${hero2})`,
  },
  {
    title: 'CLOthings 聯名 UT',
    tagline: '經典角色，穿出態度',
    price: 'NT$390',
    badge: '期間限定',
    bg: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${hero3})`,
  },
]

const current = ref(0)
let timer = null

function next() {
  current.value = (current.value + 1) % slides.length
}
function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
}
function goTo(i) {
  current.value = i
}
function startAutoplay() {
  stopAutoplay()
  timer = setInterval(next, 5000)
}
function stopAutoplay() {
  if (timer) clearInterval(timer)
}

onMounted(startAutoplay)
onUnmounted(stopAutoplay)
</script>

<template>
  <section class="hero" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
    <transition name="fade" mode="out-in">
      <div
  class="slide"
  :key="current"
  :style="{
    backgroundImage: slides[current].bg,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }"
>
        <div class="slide-overlay">
          <p class="slide-badge">{{ slides[current].badge }}</p>
          <h2 class="slide-title">{{ slides[current].title }}</h2>
          <p class="slide-tagline">{{ slides[current].tagline }}</p>
          <p class="slide-price">{{ slides[current].price }}</p>
        </div>
      </div>
    </transition>

    <button class="hero-nav prev" type="button" @click="prev" aria-label="上一張">
      <IconChevronLeft />
    </button>
    <button class="hero-nav next" type="button" @click="next" aria-label="下一張">
      <IconChevronRight />
    </button>

    <div class="hero-dots">
      <button
        v-for="(s, i) in slides"
        :key="i"
        type="button"
        class="dot"
        :class="{ active: i === current }"
        @click="goTo(i)"
        :aria-label="`前往第 ${i + 1} 張輪播圖`"
      />
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 420px;
  overflow: hidden;
}

.slide {
  width: 100%;
  height: 100%;
  display:flex;
  align-items: flex-end;
  background-size: cover;        
  background-position: center;   
  background-repeat: no-repeat;
}

.slide-overlay {
  color: #fff;
  padding: 48px;
  max-width: 480px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

.slide-badge {
  display: inline-block;
  background: var(--home-accent);
  padding: 4px 12px;
  font-size: 0.75rem;
  border-radius: 2px;
  margin-bottom: 12px;
}

.slide-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.slide-tagline {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 12px;
}

.slide-price {
  font-size: 1.5rem;
  font-weight: 700;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.hero-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: var(--home-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.hero-nav:hover {
  background: #fff;
}
.hero-nav.prev {
  left: 24px;
}
.hero-nav.next {
  right: 24px;
}

.hero-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}
.dot.active {
  background: #fff;
  transform: scale(1.3);
}

@media (max-width: 640px) {
  .slide-overlay {
    padding: 24px;
  }
  .slide-title {
    font-size: 1.4rem;
  }
}
</style>
