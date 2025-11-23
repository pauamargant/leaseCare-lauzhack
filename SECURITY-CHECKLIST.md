# 🔒 Security Checklist - Before Making Repository Public

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Protection

- [ ] `.env` is listed in `.gitignore`
- [ ] `.env.local` is listed in `.gitignore`
- [ ] `.env.production` is listed in `.gitignore`
- [ ] `.env.development` is listed in `.gitignore`
- [ ] Run `git status` and verify NO `.env` files appear
- [ ] `.env.example` contains NO actual API keys (only placeholders)

### 2. API Keys Verification

Check that NO API keys appear in these files:
- [ ] `src/**/*.ts`
- [ ] `src/**/*.vue`
- [ ] `README.md`
- [ ] `package.json`
- [ ] Any configuration files

### 3. Git History Check

```bash
# Search for potential API keys in git history
git log --all --full-history --source --all -- .env
git log --all --full-history --source --all -- .env.local

# If any results appear, you need to clean git history!
```

### 4. Code Review

Search codebase for hardcoded secrets:
```bash
# Search for potential API keys
grep -r "VITE_" src/
grep -r "API_KEY" src/
grep -r "tgp_" . --exclude-dir=node_modules
grep -r "nap_" . --exclude-dir=node_modules
```

**Expected**: Should only find references in `.env.example` and `DEPLOYMENT.md`

### 5. Vercel Configuration

- [ ] Environment variables configured in Vercel dashboard
- [ ] Production environment selected
- [ ] Preview environment configured (optional)
- [ ] All 11 environment variables added:
  - `VITE_TOGETHER_API_KEY`
  - `VITE_TOGETHER_BASE_URL`
  - `VITE_TOGETHER_CHAT_MODEL`
  - `VITE_TOGETHER_VISION_MODEL`
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_OPENJUSTICE_API_KEY`

### 6. Repository Settings

- [ ] Repository is currently PRIVATE
- [ ] `.gitignore` is committed
- [ ] `DEPLOYMENT.md` is committed
- [ ] `.env.example` is committed (with placeholders only)
- [ ] Production branch created (no commit history)

---

## 🚨 If API Keys Were Accidentally Committed

### Immediate Actions:

1. **Rotate ALL API keys immediately**:
   - Together AI: Generate new API key
   - Firebase: Regenerate credentials
   - OpenJustice: Request new API key

2. **Clean Git History**:
```bash
# Remove .env from all commits (DANGEROUS - backup first!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (if already pushed)
git push origin --force --all
```

3. **Verify Cleanup**:
```bash
git log --all --full-history --source --all -- .env
# Should return nothing
```

---

## ✅ Safe to Make Public When:

1. ✅ All items in checklist are checked
2. ✅ No API keys in git history
3. ✅ No API keys in source code
4. ✅ `.env` is in `.gitignore`
5. ✅ Vercel environment variables configured
6. ✅ Production branch created
7. ✅ Deployment tested and working

---

## 📝 Final Verification Commands

Run these before making repo public:

```bash
# 1. Check .gitignore
cat .gitignore | grep "\.env"

# 2. Check git status
git status

# 3. Search for API keys in code
grep -r "tgp_v1" . --exclude-dir=node_modules --exclude-dir=dist
grep -r "nap_f80" . --exclude-dir=node_modules --exclude-dir=dist

# 4. Verify .env is ignored
git check-ignore .env
# Should output: .env

# 5. Check what will be pushed
git ls-files | grep "\.env"
# Should return nothing (except .env.example)
```

---

## 🎯 Deployment Steps (Safe Order)

1. ✅ Complete this security checklist
2. ✅ Run `./create-production-branch.sh`
3. ✅ Push production branch to GitHub
4. ✅ Connect repository to Vercel
5. ✅ Configure environment variables in Vercel
6. ✅ Deploy on Vercel
7. ✅ Test deployed application
8. ✅ Make repository public (if desired)

---

## 🔐 Best Practices

### DO:
- ✅ Use environment variables for ALL secrets
- ✅ Keep `.env` in `.gitignore`
- ✅ Use `.env.example` with placeholders
- ✅ Rotate keys if exposed
- ✅ Use different keys for dev/prod
- ✅ Review code before committing

### DON'T:
- ❌ Commit `.env` files
- ❌ Hardcode API keys
- ❌ Share keys in comments
- ❌ Push secrets to public repos
- ❌ Use production keys in development
- ❌ Ignore security warnings

---

## 📞 Emergency Contacts

If API keys are exposed:

1. **Together AI**: https://api.together.xyz/settings/api-keys
2. **Firebase**: https://console.firebase.google.com
3. **OpenJustice**: Contact support for key rotation

---

## ✅ Sign-Off

- [ ] I have completed all items in this checklist
- [ ] I have verified no API keys are in the codebase
- [ ] I have configured Vercel environment variables
- [ ] I understand the security implications
- [ ] I am ready to deploy

**Date**: _______________
**Verified by**: _______________

---

**Remember**: Once code is public, assume it's compromised. Never commit secrets!
