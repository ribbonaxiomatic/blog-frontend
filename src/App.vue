<template>
  <router-view />
</template>

<script setup></script>

<style>
:root {
  --color-primary: #4f8ef7;
  --color-accent: #7c5cfc;
  --color-bg: #f6f8fc;
  --color-surface: #ffffff;
  --color-surface-soft: #f8fafc;
  --color-text: #1f2937;
  --color-muted: #64748b;
  --color-border: #e2e8f0;
  --shadow-card: 0 16px 40px rgba(15, 23, 42, 0.08);
  --shadow-hover: 0 22px 50px rgba(15, 23, 42, 0.14);
}

:root.dark {
  --color-primary: #38bdf8;
  --color-accent: #a78bfa;
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-surface-soft: #111827;
  --color-text: #e2e8f0;
  --color-muted: #94a3b8;
  --color-border: #334155;
  --shadow-card: 0 16px 40px rgba(0, 0, 0, 0.28);
  --shadow-hover: 0 22px 50px rgba(0, 0, 0, 0.36);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  transition: background 0.25s ease, color 0.25s ease;
}

a {
  text-decoration: none;
  color: inherit;
}

button {
  font-family: inherit;
}

#app {
  min-height: 100vh;
}
</style>
