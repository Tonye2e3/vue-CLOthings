<script setup></script>

<template></template>

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
