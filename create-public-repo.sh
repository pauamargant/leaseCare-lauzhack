#!/bin/bash

# LeaseCare - Create Public Repository
# This script creates a fresh git repository and pushes to GitHub

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 LeaseCare - Create Public Repository${NC}"
echo "================================================"
echo ""

# Step 1: Remove .env from git tracking (if tracked)
echo -e "${YELLOW}Step 1: Removing .env from Git Tracking${NC}"

if git ls-files | grep -q "^\.env$"; then
    echo ".env is currently tracked by git. Removing..."
    git rm --cached .env
    git commit -m "Remove .env from tracking"
    echo -e "${GREEN}✅ .env removed from git tracking${NC}"
else
    echo -e "${GREEN}✅ .env is not tracked by git${NC}"
fi

echo ""

# Step 2: Verify .env is in .gitignore
echo -e "${YELLOW}Step 2: Verifying .gitignore${NC}"

if grep -q "^\.env$" .gitignore; then
    echo -e "${GREEN}✅ .env is in .gitignore${NC}"
else
    echo -e "${RED}❌ ERROR: .env is NOT in .gitignore!${NC}"
    exit 1
fi

echo ""

# Step 3: Create backup
echo -e "${YELLOW}Step 3: Creating Backup${NC}"

BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP_BRANCH" 2>/dev/null || true
echo -e "${GREEN}✅ Backup created: $BACKUP_BRANCH${NC}"

echo ""

# Step 4: Remove git history
echo -e "${YELLOW}Step 4: Removing Git History${NC}"

# Remove .git directory
rm -rf .git

# Initialize new git repository
git init
echo -e "${GREEN}✅ New git repository initialized${NC}"

echo ""

# Step 5: Stage all files
echo -e "${YELLOW}Step 5: Staging Files${NC}"

git add .

# Show what will be committed
echo ""
echo "Files to be committed (first 30):"
git status --short | head -30
echo ""
TOTAL_FILES=$(git status --short | wc -l | tr -d ' ')
echo -e "${BLUE}Total files: $TOTAL_FILES${NC}"

echo ""

# Step 6: Final .env check
echo -e "${YELLOW}Step 6: Final .env Verification${NC}"

if git status --short | grep -q "\.env$"; then
    echo -e "${RED}❌ ERROR: .env is about to be committed!${NC}"
    echo "Aborting..."
    exit 1
else
    echo -e "${GREEN}✅ .env is NOT in staged files${NC}"
fi

echo ""

# Step 7: Create single commit
echo -e "${YELLOW}Step 7: Creating Single Commit${NC}"

git commit -m "🚀 LeaseCare v1.0 - AI-Powered Swiss Tenant Protection Platform

## Overview
Comprehensive tenant protection platform leveraging multi-agent AI systems, computer vision, and Swiss legal expertise to help tenants manage lease agreements, document property conditions, and defend against unfair damage claims.

## Key Features
- 🤖 Multi-Agent AI Pipeline (3-stage defense analysis)
- 📄 Smart Document Analysis (NLP-powered lease parsing)
- 🎯 Auto Asset Detection (property/vehicles/equipment)
- 📸 Guided Photo Documentation (timestamped evidence)
- 💬 Live Lease Chat (context-aware AI assistant)
- 🔍 Checkout Comparison (computer vision damage detection)
- ⚖️ Defense Report Generation (automated legal defense)
- 🇨🇭 Swiss Law Integration (OpenJustice API)

## Technology Stack
- **Frontend**: Vue 3.5+ | TypeScript 5.5+ | Vite 5.4+ | Tailwind CSS 3.4+
- **AI/ML**: Together AI (Llama-4-Maverick-17B) | OpenJustice (GPT-4o-mini)
- **Backend**: Firebase 11+ (Auth, Firestore, Storage)
- **Document**: PDF.js 4.8+ | Custom NLP parser
- **State**: Pinia 2.2+ | Vue Composables
- **UI**: Lucide Vue Next | SweetAlert2

## AI Pipelines
1. **Document Analysis**: PDF → Text extraction → AI analysis → Risk assessment
2. **Photo Documentation**: Guided wizard → Capture → Firebase upload → Metadata
3. **Live Chat**: Context assembly → AI completion → Citation detection → OpenJustice
4. **Checkout Comparison**: Photo pairs → Vision analysis → Damage detection
5. **Defense Report**: 3-Agent system (Evidence → Defense → Evaluation)
6. **Law Citations**: Detection → Click → Stream → Parse → Display

## Swiss Law Compliance
- Full Swiss Code of Obligations (Art. 253-274g CO) knowledge
- All 26 cantons supported with jurisdiction-specific advice
- Clickable law citations with real-time explanations
- Normal wear vs. damage classification per Swiss standards
- Burden of proof and tenant protection rules

## Deployment
- **Platform**: Vercel Edge Network (70+ global locations)
- **Security**: Environment variables, HTTPS, Firebase rules
- **Performance**: ~250KB initial load, streaming APIs, code splitting
- **Monitoring**: Vercel Analytics, Firebase Analytics

## Documentation
- README.md - Comprehensive technical documentation
- DEPLOYMENT.md - Step-by-step deployment guide
- SECURITY-CHECKLIST.md - Security verification

## License
Educational and demonstration purposes.

---
Built with ❤️ for Swiss tenants | LauzHack 2025"

echo -e "${GREEN}✅ Commit created${NC}"

echo ""

# Step 8: Add remote and push
echo -e "${YELLOW}Step 8: Pushing to GitHub${NC}"

NEW_REPO="https://github.com/ChenghengLi/leaseCare-Public.git"

git remote add origin "$NEW_REPO"

echo ""
echo -e "${BLUE}Ready to push to: $NEW_REPO${NC}"
echo ""
read -p "Push to GitHub? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Pushing to GitHub..."
    git branch -M main
    git push -u origin main --force
    
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo -e "${BLUE}🎉 Public repository ready at:${NC}"
    echo -e "${GREEN}$NEW_REPO${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Go to: https://github.com/ChenghengLi/leaseCare-Public"
    echo "2. Add repository description"
    echo "3. Add topics: vue, typescript, ai, swiss-law, tenant-protection, firebase"
    echo "4. Deploy on Vercel: https://vercel.com/new"
    echo "5. Add environment variables in Vercel dashboard (see .env.example)"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Configure environment variables in Vercel!${NC}"
    echo ""
else
    echo ""
    echo "Push cancelled. You can push manually later with:"
    echo "  git push -u origin main --force"
    echo ""
fi

echo -e "${GREEN}✅ Public repository creation complete!${NC}"
