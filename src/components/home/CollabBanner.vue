<script setup>
const collabs = [
  {
    title: 'CLOthings 聯名系列',
    desc: '限定選色，數量有限',
    bg: 'linear-gradient(135deg, #1a1a1a, #3d3d3d)',
  },
  {
    title: '設計師系列',
    desc: '職人工藝，質感升級',
    bg: 'linear-gradient(135deg, #7a1f1f, #b23a3a)',
  },
]
</script>

<template>
  <section class="collab">
    <article v-for="c in collabs" :key="c.title" class="collab-panel" :style="{ background: c.bg }">
      <div class="collab-text">
        <h3>{{ c.title }}</h3>
        <p>{{ c.desc }}</p>
      </div>
    </article>
  </section>
</template>

<style scoped>
.collab {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.collab-panel {
  min-height: 320px;
  display: flex;
  align-items: flex-end;
  padding: 32px;
  color: #fff;
  transition: filter 0.3s ease;
}
.collab-panel:hover {
  filter: brightness(1.1);
}

.collab-text h3 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 6px;
}
.collab-text p {
  opacity: 0.85;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .collab {
    grid-template-columns: 1fr;
  }
}
</style>
