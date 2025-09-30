# Democratic Accountability Platform (React + Vite + Tailwind)

A ready-to-deploy single-page app that renders the Democratic Accountability Platform UI.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel (two options)

### A) Git-based (recommended)
1. Push this folder to a GitHub/GitLab/Bitbucket repo.
2. In Vercel, **Add New → Project → Import** your repo.
3. Ensure settings:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output dir: `dist`
4. Deploy.

### B) Vercel CLI
```bash
npm i -g vercel
vercel
vercel deploy --prod
```

`vercel.json` is included for SPA-friendly rewrites.
"# p2025" 
