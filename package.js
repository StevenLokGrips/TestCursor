package.json
```
```json
{
  "name": "nextjs-calculator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.3",
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@types/react": "18.2.14",
    "@types/node": "20.11.30",
    "typescript": "5.4.4",
    "eslint": "8.56.0",
    "eslint-config-next": "14.2.3"
  }
}
```

```
tsconfig.json
```
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```
next.config.mjs
```
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

export default nextConfig;
```

```
app/layout.tsx
```
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculator",
  description: "A simple calculator built with Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```
app/globals.css
```
```css
html,
body {
  min-height: 100vh;
  min-width: 100vw;
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Fira Mono', 'Consolas', monospace, Arial, sans-serif;
  background: #f2f4f8;
  color: #121212;
  box-sizing: border-box;
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ece9f7 0%, #f5f7fa 100%);
}

* {
  box-sizing: inherit;
}

@media (max-width: 500px) {
  .calculator {
    min-width: unset !important;
    width: 100vw !important;
    max-width: 98vw !important;
    padding: 1rem 0.3rem 1rem 0.3rem !important;
  }
}
```

```
app/Calculator.module.css
```
```css
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.calculator {
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0px 6px 32px 0 rgba(52, 62, 102, 0.08);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  min-width: 340px;
  max-width: 94vw;
  width: 360px;
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.display {
  background: #f6f8fb;
  color: #20243a;
  border-radius: 0.75rem;
  min-height: 72px;
  font-size: 2.1rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding: 1rem 1rem 0.5rem 1rem;
  font-family: 'Fira Mono', 'Consolas', monospace, Arial, sans-serif;
  box-sizing: border-box;
  transition: background 0.16s;
  word-break: break-all;
}

.display .expression {
  font-size: 1.1rem;
  font-weight: 400;
  color: #555;
  min-height: 1.2em;
  width: 100%;
  text-align: right;
  margin-bottom: 0.35rem;
  letter-spacing: 1px;
  font-family: inherit;
}

.display .result {
  font-size: 2.1rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: right;
  color: #20243a;
  font-family: inherit;
}

.display.error .result {
  color: #d32f2f;
}

.buttonGrid {
  display: grid;
  grid-template-columns: repeat(4, 64px);
  grid-template-rows: repeat(5, 56px);
  gap: 0.55rem;
  justify-content: center;
}

.button {
  background: #f2f4f8;
  color: #20243a;
  border: none;
  outline: none;
  border-radius: 0.7rem;
  font-size: 1.28rem;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0px 1px 2px rgba(62, 72, 90, 0.04);
  transition: background 0.15s, color 0.13s, box-shadow 0.18s;
  user-select: none;
  font-weight: 500;
}

.button:hover,
.button:focus-visible {
  background: #e2e8f7;
}

.button:active {
  background: #d2d7e7;
}

.button.operator {
  background: #eae7fa;
  color: #7049d3;
}

.button.operator:hover,
.button.operator:focus-visible {
  background: #ded2f7;
}

.button.operator:active {
  background: #cfbbf5;
}

.button.equals {
  background: #7049d3;
  color: #fff;
}

.button.equals:hover,
.button.equals:focus-visible {
  background: #5e36b5;
}

.button.equals:active {
  background: #4c268f;
}

.button.clear {
  background: #ffe6e6;
  color: #d32f2f;
}

.button.clear:hover,
.button.clear:focus-visible {
  background: #ffd6d6;
}

.button.clear:active {
  background: #fbbcbc;
}

.button.backspace {
  background: #f6eafa;
  color: #ad36d1;
}

.button.backspace:hover,
.button.backspace:focus-visible {
  background: #ecd0f3;
}

.button.backspace:active {
  background: #e0b2ed;
}

@media (max-width: 500px) {
  .buttonGrid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(5, 42px);
    gap: 0.32rem;
  }
  .button {
    font-size: 1rem;
    border-radius: 0.4rem;
  }
}
