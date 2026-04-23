# Deployment Guide

## Prerequisites

- Git repository (GitHub, GitLab, Bitbucket)
- Build output (dist folder)
- Environment configuration

## 📦 Build Process

### Development Build
```bash
pnpm install
pnpm dev
```

### Production Build
```bash
pnpm install
pnpm build
```

Output will be in the `dist/` folder.

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest option for deploying Next.js and Vite applications.

#### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your Git repository
   - Configure build settings:
     - Framework: Vite
     - Build Command: `pnpm build`
     - Output Directory: `dist`
     - Install Command: `pnpm install`

3. **Environment Variables**
   - Add `.env.local` variables in Vercel dashboard
   - Settings → Environment Variables

4. **Deploy**
   - Vercel will auto-deploy on git push
   - Preview deployments for PRs

### Option 2: Netlify

#### Steps:

1. **Build Locally**
   ```bash
   pnpm build
   ```

2. **Deploy to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Drag and drop `dist` folder
   - Or connect Git repo for auto-deploy

3. **Configuration File** (netlify.toml)
   ```toml
   [build]
   command = "pnpm build"
   publish = "dist"

   [build.environment]
   NODE_VERSION = "18"

   [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
   ```

### Option 3: Docker + Self-Hosted

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

# Runtime stage
FROM node:18-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Option 4: AWS S3 + CloudFront

#### Steps:

1. **Build**
   ```bash
   pnpm build
   ```

2. **Upload to S3**
   ```bash
   aws s3 sync dist/ s3://your-bucket-name/
   ```

3. **CloudFront Distribution**
   - Create distribution pointing to S3
   - Set index.html as default root
   - Configure error handling

### Option 5: GitHub Pages

#### Steps:

1. **Update vite.config.ts**
   ```typescript
   export default defineConfig({
     base: '/repository-name/',
     // ... rest of config
   })
   ```

2. **Add GitHub Actions** (.github/workflows/deploy.yml)
   ```yaml
   name: Deploy

   on:
     push:
       branches: [main]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: pnpm/action-setup@v2
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'pnpm'
         
         - run: pnpm install
         - run: pnpm build
         
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

## 🔧 Configuration

### Environment Variables

Create `.env.production` for production:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_VERSION=v1
VITE_ENABLE_ANALYTICS=true
```

### API Base URL

Update `vite.config.ts`:

```typescript
import.meta.env.VITE_API_BASE_URL
```

### Security Headers

For Vercel, add `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 📋 Pre-Deployment Checklist

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Build completes without errors
- [ ] No console warnings or errors
- [ ] Tested on production build: `pnpm preview`
- [ ] Updated API base URLs
- [ ] Reviewed security headers
- [ ] Tested responsive design
- [ ] Dark mode tested
- [ ] All routes accessible
- [ ] Forms validated
- [ ] Performance optimized

## 🧪 Testing Before Deployment

### Local Preview
```bash
pnpm build
pnpm preview
```

Visit `http://localhost:4173` to test production build locally.

### Checklist
1. ✅ All pages load correctly
2. ✅ Navigation works
3. ✅ Forms submit
4. ✅ Dark mode toggles
5. ✅ Responsive design works
6. ✅ No 404 errors
7. ✅ Performance is acceptable

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` for reference
   - Rotate keys regularly

2. **HTTPS**
   - Always use HTTPS in production
   - Configure SSL certificates
   - Set HSTS headers

3. **CORS**
   - Configure proper CORS headers
   - Whitelist allowed origins
   - Validate API requests

4. **Content Security Policy**
   - Set restrictive CSP headers
   - Allow only necessary resources
   - Monitor CSP violations

5. **Dependencies**
   - Keep dependencies updated
   - Run security audits
   - Monitor for vulnerabilities

## 📊 Monitoring

### Logging
- Use browser console for debugging
- Log to external service (Sentry, LogRocket)
- Monitor API errors

### Analytics
- Integrate Google Analytics
- Track user behavior
- Monitor performance metrics

### Uptime Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure alerts
- Monitor response times

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Test
        run: pnpm test # (if tests exist)
      
      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## 🚨 Troubleshooting

### Build Fails
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Routes Not Working
- Check React Router configuration
- Ensure `<BrowserRouter>` wraps app
- Configure server to serve `index.html` for all routes

### Styles Not Loading
- Clear build cache
- Check Tailwind configuration
- Verify CSS imports

### API Not Responding
- Check API URL in environment variables
- Verify CORS configuration
- Check network tab in DevTools

## 📈 Performance Optimization

### Code Splitting
- Already configured with React Router
- Lazy load pages with `React.lazy()`

### Image Optimization
- Compress images before upload
- Use modern formats (WebP)
- Implement lazy loading

### Bundle Analysis
```bash
npm install -g vite-bundle-visualizer
vite-bundle-visualizer
```

## 📞 Support

For deployment issues:
1. Check build logs
2. Review environment variables
3. Test locally with `pnpm preview`
4. Check service status pages
5. Contact hosting provider support

---

## Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

That's it! Your app will be live at a Vercel URL.
