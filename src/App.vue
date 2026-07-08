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
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-danger: #ef4444;
  --color-info: #64748b;
  --gradient-primary: linear-gradient(135deg, #4f8ef7, #7c5cfc);
  --gradient-page: linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent 360px),
    var(--color-bg);
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --shadow-sm: 0 8px 24px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 14px 36px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 22px 56px rgba(15, 23, 42, 0.12);
  --shadow-card: 0 16px 40px rgba(15, 23, 42, 0.08);
  --shadow-hover: 0 22px 50px rgba(15, 23, 42, 0.14);
  --focus-ring: 0 0 0 4px rgba(79, 142, 247, 0.14);
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
  --color-success: #86efac;
  --color-warning: #fcd34d;
  --color-danger: #fca5a5;
  --color-info: #94a3b8;
  --gradient-primary: linear-gradient(135deg, #38bdf8, #a78bfa);
  --gradient-page: linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 10%, transparent), transparent 360px),
    var(--color-bg);
  --shadow-sm: 0 8px 24px rgba(0, 0, 0, 0.20);
  --shadow-md: 0 14px 36px rgba(0, 0, 0, 0.26);
  --shadow-lg: 0 22px 56px rgba(0, 0, 0, 0.34);
  --shadow-card: 0 16px 40px rgba(0, 0, 0, 0.28);
  --shadow-hover: 0 22px 50px rgba(0, 0, 0, 0.36);
  --focus-ring: 0 0 0 4px rgba(56, 189, 248, 0.18);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
  background: var(--gradient-page);
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

button,
input,
select,
textarea {
  font: inherit;
}

button {
  transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease,
    background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

::selection {
  background: color-mix(in srgb, var(--color-primary) 28%, transparent);
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--color-muted) 38%, transparent);
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--color-primary) 55%, transparent);
  border: 3px solid transparent;
  background-clip: content-box;
}

#app {
  min-height: 100vh;
}
</style>
