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
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: system-ui, Arial, sans-serif;
  background: #f2f4f8;
  color: #121212;
  min-height: 100vh;
  min-width: 100vw;
}

body {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ece9f7 0%, #f5f7fa 100%);
}
```

```
app/page.tsx
```
```tsx
import Calculator from "./Calculator";

export default function Home() {
  return (
    <main>
      <Calculator />
    </main>
  );
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
}

.display {
  background: #f6f8fb;
  color: #20243a;
  border-radius: 0.75rem;
  min-height: 68px;
  font-size: 2.1rem;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 1rem 1rem 0.5rem 1rem;

