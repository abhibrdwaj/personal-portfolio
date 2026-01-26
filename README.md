# Personal Portfolio Website

A modern, animated personal portfolio website built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Features

- 🎨 Modern dark theme with glassmorphism effects
- ✨ Smooth animations using Framer Motion
- 📱 Fully responsive design (mobile-first)
- 🤖 Integrated AI chatbot (mock responses)
- 🎯 Scroll-triggered animations
- ⚡ Fast performance with Vite

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

The site will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment to GitHub Pages

### Step 1: Install gh-pages

```bash
npm install
```

### Step 2: Update Base Path (if needed)

If your repository name is NOT `username.github.io`, you need to update the base path in `vite.config.ts`:

```typescript
base: '/your-repo-name/', // Replace 'your-repo-name' with your actual repo name
```

If your repository IS `username.github.io`, keep it as:
```typescript
base: '/',
```

### Step 3: Deploy

```bash
npm run deploy
```

This will:
1. Build your project
2. Deploy the `dist` folder to the `gh-pages` branch
3. Your site will be available at `https://username.github.io/repo-name/`

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select the `gh-pages` branch
4. Click **Save**

Your portfolio will be live in a few minutes!

### Custom Domain (Optional)

If you have a custom domain:
1. Add a `CNAME` file in the `public/` folder with your domain name
2. Update your DNS settings to point to GitHub Pages
3. In GitHub Pages settings, add your custom domain

## Project Structure

```
portfolio/
├── src/
│   ├── components/      # React components
│   ├── data/           # Data files (experience, projects, skills)
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
└── package.json
```

## Sections

1. **Hero** - Full viewport introduction with typing effect
2. **About** - Personal introduction and highlights
3. **Experience** - Timeline of work experience
4. **Projects** - Portfolio projects with modals
5. **Skills** - Filterable skills showcase
6. **Chatbot** - AI-powered chat interface
7. **Contact** - Footer with social links

## Customization

Update the data files in `src/data/` to customize:
- `experience.ts` - Work experience
- `projects.ts` - Portfolio projects
- `skills.ts` - Skills and technologies

## License

MIT
