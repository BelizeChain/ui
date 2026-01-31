# 🚀 GitHub Setup Guide for BelizeChain UI Suite

**Repository**: `github.com/BelizeChain/ui`  
**Version**: v1.0.0  
**Extraction Date**: January 31, 2026

---

## 📋 Quick Start Checklist

### ✅ Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Fill in repository details:
   ```
   Repository name: ui
   Description: BelizeChain UI Suite - Maya Wallet & Blue Hole Portal (Next.js 14, Turborepo)
   Visibility: Public
   
   ⚠️ DO NOT initialize with:
   ❌ README (we already have one)
   ❌ .gitignore (we already have one)
   ❌ License (will add separately)
   ```
3. Click **"Create repository"**

---

### ✅ Step 2: Push Code to GitHub

```bash
# Navigate to extraction directory
cd /tmp/ui-extract

# Add GitHub remote
git remote add origin https://github.com/BelizeChain/ui.git

# Rename branch to main (GitHub default)
git branch -M main

# Push code and tags
git push -u origin main
git push origin v1.0.0

# Verify push
git remote -v
git log --oneline --all
```

**Expected Output**:
```
Enumerating objects: 476, done.
Counting objects: 100% (476/476), done.
Delta compression using up to 8 threads
Compressing objects: 100% (473/473), done.
Writing objects: 100% (476/476), 1.23 MiB | 1.50 MiB/s, done.
Total 476 (delta 185), reused 0 (delta 0)
To github.com:BelizeChain/ui.git
 * [new branch]      main -> main
 * [new tag]         v1.0.0 -> v1.0.0
```

---

### ✅ Step 3: Configure Repository Settings

#### **3.1 General Settings**
```
Settings → General:
  ✅ Description: "BelizeChain UI Suite - Maya Wallet & Blue Hole Portal"
  ✅ Website: https://belizechain.org
  ✅ Topics: blockchain, typescript, nextjs, turborepo, substrate, polkadot, belize
```

#### **3.2 Features**
```
Settings → Features:
  ✅ Issues
  ✅ Discussions
  ✅ Projects
  ❌ Wiki (use docs/ folder instead)
```

#### **3.3 Branches**
```
Settings → Branches:
  ✅ Default branch: main
  ✅ Branch protection rules for main:
     ✅ Require pull request reviews (1 reviewer)
     ✅ Require status checks (CI/CD workflows)
     ✅ Require conversation resolution
     ✅ Do not allow force pushes
```

---

### ✅ Step 4: Add GitHub Secrets (for CI/CD)

Go to: **Settings → Secrets and variables → Actions**

#### **4.1 npm Publishing** (for shared library)
```
Secret Name: NPM_TOKEN
Value: <your-npm-token>

# Get npm token:
npm login
npm token create --read-only=false
```

#### **4.2 Vercel Deployment** (for Maya Wallet & Blue Hole Portal)
```
# Install Vercel CLI
npm i -g vercel

# Link projects and get tokens
cd maya-wallet && vercel link
cd blue-hole-portal && vercel link

# Add secrets to GitHub:
Secret Name: VERCEL_TOKEN
Value: <from vercel token list>

Secret Name: VERCEL_ORG_ID
Value: <from .vercel/project.json>

Secret Name: VERCEL_PROJECT_ID_MAYA
Value: <from maya-wallet/.vercel/project.json>

Secret Name: VERCEL_PROJECT_ID_PORTAL
Value: <from blue-hole-portal/.vercel/project.json>
```

---

### ✅ Step 5: Enable GitHub Actions

1. Go to: **Actions** tab
2. Click **"I understand my workflows, go ahead and enable them"**
3. Verify workflows appear:
   - ✅ Maya Wallet CI/CD
   - ✅ Blue Hole Portal CI/CD
   - ✅ Shared Library Build & Publish
   - ✅ Security Audits

---

### ✅ Step 6: Verify CI/CD Pipelines

#### **6.1 Trigger First Workflow Run**
```bash
# Make a small change
echo "# BelizeChain UI Suite" >> README.md

# Commit and push
git add README.md
git commit -m "docs: Update README"
git push origin main
```

#### **6.2 Check Workflow Status**
1. Go to: **Actions** tab
2. You should see 4 workflows running:
   - 🟡 Maya Wallet CI/CD (in progress)
   - 🟡 Blue Hole Portal CI/CD (in progress)
   - 🟡 Shared Library Build (in progress)
   - 🟡 Security Audits (in progress)

3. Wait for completion (2-5 minutes):
   - ✅ Maya Wallet CI/CD (passed)
   - ✅ Blue Hole Portal CI/CD (passed)
   - ✅ Shared Library Build (passed)
   - ✅ Security Audits (passed)

---

### ✅ Step 7: Test Deployment Preview

#### **7.1 Create a Pull Request**
```bash
# Create feature branch
git checkout -b feature/test-deployment

# Make a change
echo "console.log('test');" >> maya-wallet/src/app/page.tsx

# Commit and push
git add .
git commit -m "test: Deployment preview"
git push origin feature/test-deployment
```

#### **7.2 Open Pull Request**
1. Go to GitHub repository
2. Click **"Compare & pull request"**
3. Fill in PR details and create
4. Wait for workflows to complete
5. Check for Vercel preview URL in PR comments

---

### ✅ Step 8: Publish Shared Library to npm (Optional)

#### **8.1 Update Shared Library Version**
```bash
cd /tmp/ui-extract

# Update version in shared/package.json
# Change from: "version": "1.0.0"
# To: "version": "1.0.1"

# Commit changes
git add shared/package.json
git commit -m "chore: Bump @belizechain/shared to v1.0.1"

# Create version tag
git tag shared-v1.0.1
git push origin main
git push origin shared-v1.0.1
```

#### **8.2 Verify npm Publish**
1. Go to: **Actions** tab
2. Find "Shared Library Build & Publish" workflow
3. Verify it completes successfully
4. Check npm: https://www.npmjs.com/package/@belizechain/shared

---

## 🔍 Verification Checklist

### **Repository Structure**
- ✅ README.md displays correctly on GitHub homepage
- ✅ All 14 documentation files present in root
- ✅ 3 workspaces visible: maya-wallet/, blue-hole-portal/, shared/
- ✅ .github/workflows/ contains 4 YAML files
- ✅ Configuration files (.editorconfig, .env.example, etc.) present

### **GitHub Actions**
- ✅ All 4 workflows enabled
- ✅ Workflows pass on initial run
- ✅ Vercel deployments successful (if secrets configured)
- ✅ npm publish successful (if NPM_TOKEN configured)

### **Branch Protection**
- ✅ main branch protected
- ✅ PR reviews required
- ✅ Status checks required

### **Repository Settings**
- ✅ Topics/tags added
- ✅ Description set
- ✅ Website URL set
- ✅ Discussions enabled

---

## 🐛 Troubleshooting

### **Issue: Workflows Don't Trigger**
**Solution**:
1. Check **Settings → Actions → General**
2. Verify "Allow all actions and reusable workflows" is selected
3. Push a new commit to trigger workflows

---

### **Issue: Vercel Deployment Fails**
**Solution**:
1. Verify secrets are set correctly:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID_MAYA`
   - `VERCEL_PROJECT_ID_PORTAL`
2. Check Vercel dashboard for project status
3. Review workflow logs for error details

---

### **Issue: npm Publish Fails**
**Solution**:
1. Verify `NPM_TOKEN` secret is valid
2. Check npm package name is available: `@belizechain/shared`
3. Ensure version number is incremented in package.json
4. Verify npm registry URL is correct

---

### **Issue: Large Files Warning**
**Solution**:
```bash
# If you see "remote: warning: Large files detected"
# Add Git LFS for files >100MB

git lfs install
git lfs track "*.webm"  # Video files from Playwright
git add .gitattributes
git commit -m "chore: Add Git LFS for video files"
git push
```

---

## 📊 Post-Setup Metrics

After successful setup, you should see:

| Metric | Expected Value |
|--------|----------------|
| **Total Commits** | 2+ (initial + extraction summary + any updates) |
| **Git Tags** | 1 (v1.0.0) |
| **Branches** | 1+ (main + feature branches) |
| **Workflows** | 4 (all passing) |
| **Contributors** | 1+ |
| **Open Issues** | 0 (initially) |
| **Pull Requests** | 0-1 (test PR optional) |
| **Stars** | 0+ (will grow) |

---

## 🔗 Useful Links

### **GitHub Repository**
- Repository: https://github.com/BelizeChain/ui
- Actions: https://github.com/BelizeChain/ui/actions
- Releases: https://github.com/BelizeChain/ui/releases
- Issues: https://github.com/BelizeChain/ui/issues

### **npm Package**
- Package: https://www.npmjs.com/package/@belizechain/shared

### **Vercel Deployments**
- Maya Wallet: https://maya-wallet.vercel.app (after deployment)
- Blue Hole Portal: https://blue-hole-portal.vercel.app (after deployment)

### **Documentation**
- Main README: [README.md](./README.md)
- Integration Guide: [INTEGRATION_ARCHITECTURE.md](./INTEGRATION_ARCHITECTURE.md)
- Extraction Summary: [EXTRACTION_SUMMARY.md](./EXTRACTION_SUMMARY.md)
- Testing Guide: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

## 🎉 Success!

Once all steps are complete, your BelizeChain UI Suite repository is:

- ✅ **Live on GitHub** with full version history
- ✅ **CI/CD enabled** with automated testing and deployment
- ✅ **Production-ready** with comprehensive documentation
- ✅ **Integration-ready** with environment variable configuration
- ✅ **Community-ready** with issues, discussions, and PRs enabled

---

**Next Steps**: See [INTEGRATION_ARCHITECTURE.md](./INTEGRATION_ARCHITECTURE.md) for local development setup and integration with BelizeChain ecosystem components.

---

_Last Updated: January 31, 2026_
