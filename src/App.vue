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
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
  --gradient-primary: linear-gradient(135deg, #4f8ef7, #7c5cfc);
  --shadow-sm: 0 8px 24px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 14px 36px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 22px 56px rgba(15, 23, 42, 0.12);
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
  --color-text-muted: #94a3b8;
  --color-border: #334155;
  --gradient-primary: linear-gradient(135deg, #38bdf8, #a78bfa);
  --shadow-sm: 0 8px 24px rgba(0, 0, 0, 0.20);
  --shadow-md: 0 14px 36px rgba(0, 0, 0, 0.26);
  --shadow-lg: 0 22px 56px rgba(0, 0, 0, 0.34);
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
