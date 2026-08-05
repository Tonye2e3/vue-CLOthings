<script setup>
import IconFacebook from '@/components/icons/IconFacebook.vue'
import IconInstagram from '@/components/icons/IconInstagram.vue'
import IconLine from '@/components/icons/IconLine.vue'
import IconYoutube from '@/components/icons/IconYoutube.vue'

const links = ['客服中心', '常見問題（FAQ）', '公司資訊', '隱私政策', '電子報訂閱']
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <nav class="footer-links">
        <a v-for="l in links" :key="l" href="#">{{ l }}</a>
      </nav>

      <div class="social-icons">
        <a href="#" aria-label="Facebook"><IconFacebook /></a>
        <a href="#" aria-label="Instagram"><IconInstagram /></a>
        <a href="#" aria-label="LINE"><IconLine /></a>
        <a href="#" aria-label="YouTube"><IconYoutube /></a>
      </div>

      <p class="copyright">© 2026 CLOthings. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--home-border);
  background: var(--home-bg-soft);
}

.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 24px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 24px;
}

.footer-links a {
  color: var(--home-text);
  text-decoration: none;
  font-size: 0.85rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}
.footer-links a:hover {
  opacity: 1;
  color: var(--home-accent);
}

.social-icons {
  display: flex;
  gap: 16px;
}

.social-icons a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--home-text);
  border: 1px solid var(--home-border);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
.social-icons a:hover {
  background: var(--home-accent);
  color: #fff;
  border-color: var(--home-accent);
}

.copyright {
  font-size: 0.75rem;
  color: #888;
}
</style>
