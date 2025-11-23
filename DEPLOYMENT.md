# LeaseCare Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- API keys ready (see below)

---

## Step 1: Prepare Repository

### Create Clean Branch (No Commit History)
```bash
# Create orphan branch (no history)
git checkout --orphan production

# Add all files
git add .

# Make initial commit
git commit -m "Initial production release"

# Force push to new branch
git push origin production --force
```

---

## Step 2: Push to GitHub

```bash
# If not already connected to GitHub
git remote add origin https://github.com/YOUR_USERNAME/leasecare-vue.git

# Push production branch
git push origin production
```

**⚠️ IMPORTANT**: The `.env` file is in `.gitignore` and will NOT be pushed to GitHub. This protects your API keys!

---

## Step 3: Deploy on Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Go to Vercel**: https://vercel.com
2. **Click "Add New Project"**
3. **Import from GitHub**: Select your `leasecare-vue` repository
4. **Configure Project**:
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variables** (CRITICAL):
   Click "Environment Variables" and add each one:

   ```
   VITE_TOGETHER_API_KEY=tgp_v1_4frIckCQMIHhiFt8tDJVEQmqmnSynVaTv7mQFKFFoMs
   VITE_TOGETHER_BASE_URL=https://api.together.xyz/v1
   VITE_TOGETHER_CHAT_MODEL=meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8
   VITE_TOGETHER_VISION_MODEL=meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8
   
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   VITE_OPENJUSTICE_API_KEY=nap_f80f5c2ff687f635e098b9d9bdb1893b11fa9e00597bcd3219376c93b388d522
   ```

6. **Deploy**: Click "Deploy"

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and add environment variables when asked
```

---

## Step 4: Configure Environment Variables in Vercel

### Via Dashboard:
1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable from `.env.example`
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**

### Via CLI:
```bash
# Add environment variable
vercel env add VITE_TOGETHER_API_KEY

# Pull environment variables locally (for testing)
vercel env pull
```

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep `.env` in `.gitignore`
- Use Vercel's environment variables dashboard
- Rotate API keys if accidentally exposed
- Use different keys for production/development
- Review `.env.example` before making repo public

### ❌ DON'T:
- Commit `.env` files to Git
- Share API keys in code comments
- Hardcode API keys in source files
- Push sensitive data to public repos

---

## 📝 Environment Variables Checklist

Before deploying, ensure you have:

- [ ] Together AI API Key (`VITE_TOGETHER_API_KEY`)
- [ ] Together AI Base URL (`VITE_TOGETHER_BASE_URL`)
- [ ] Together AI Chat Model (`VITE_TOGETHER_CHAT_MODEL`)
- [ ] Together AI Vision Model (`VITE_TOGETHER_VISION_MODEL`)
- [ ] Firebase API Key (`VITE_FIREBASE_API_KEY`)
- [ ] Firebase Auth Domain (`VITE_FIREBASE_AUTH_DOMAIN`)
- [ ] Firebase Project ID (`VITE_FIREBASE_PROJECT_ID`)
- [ ] Firebase Storage Bucket (`VITE_FIREBASE_STORAGE_BUCKET`)
- [ ] Firebase Messaging Sender ID (`VITE_FIREBASE_MESSAGING_SENDER_ID`)
- [ ] Firebase App ID (`VITE_FIREBASE_APP_ID`)
- [ ] OpenJustice API Key (`VITE_OPENJUSTICE_API_KEY`)

---

## 🔄 Redeployment

### Automatic Deployment:
Vercel automatically redeploys when you push to the connected branch:
```bash
git add .
git commit -m "Update feature"
git push origin production
```

### Manual Deployment:
```bash
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Fails
- Check environment variables are set in Vercel
- Verify all dependencies in `package.json`
- Check build logs in Vercel dashboard

### API Keys Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding new variables
- Check variable names match exactly

### Firebase Errors
- Verify Firebase config in Vercel environment variables
- Check Firebase project permissions
- Ensure Firebase Storage rules allow uploads

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Firebase Setup](https://firebase.google.com/docs/web/setup)

---

## 🎉 Success!

Your LeaseCare app should now be live at:
```
https://your-project-name.vercel.app
```

**Note**: First deployment may take 2-3 minutes. Subsequent deployments are faster.
