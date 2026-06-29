# 🚀 GitHub Setup Guide - AI Driver Copilot

## ⚠️ CRITICAL: Before Pushing to GitHub

Follow these steps to secure your credentials before uploading to GitHub.

---

## ✅ Step 1: Verify Security Files

I've already created these files for you:

1. **`.gitignore`** - Prevents sensitive files from being committed
2. **`.env.example`** - Template for environment variables (safe to commit)
3. **`database.py`** - Updated to use environment variables

---

## 🔒 Step 2: Check What Will Be Committed

Run this command to see what Git will include:

```bash
cd d:\trailer_analytics
git status
```

**Make sure these are NOT listed:**
- ❌ `.env` (your actual credentials)
- ❌ `venv/` or `node_modules/` folders
- ❌ `__pycache__/` folders
- ❌ `.next/` folder

**These SHOULD be listed (safe to commit):**
- ✅ `.env.example` (template without real credentials)
- ✅ `.gitignore`
- ✅ All `.py`, `.js`, `.jsx`, `.ts`, `.tsx` files
- ✅ `requirements.txt`, `package.json`
- ✅ Documentation files (`.md`)

---

## 🛡️ Step 3: Verify .env is Ignored

Run this command:

```bash
git check-ignore .env
```

**Expected output:** `.env`

If it says `.env`, you're safe! ✅

If nothing appears, your `.env` might be tracked. Run:

```bash
git rm --cached .env
git add .gitignore
git commit -m "Remove .env from tracking"
```

---

## 📝 Step 4: Update Your .env File

Your current `.env` has real credentials. Keep it LOCAL ONLY.

1. Make sure `.env` contains your actual credentials
2. **NEVER commit this file to Git**
3. `.gitignore` will prevent it from being uploaded

---

## 🎯 Step 5: Initialize Git Repository

If you haven't initialized Git yet:

```bash
cd d:\trailer_analytics
git init
git add .
git commit -m "Initial commit: AI Driver Copilot project"
```

---

## 🌐 Step 6: Create GitHub Repository

### Option A: Via GitHub Website (Easiest)

1. Go to https://github.com/new
2. Repository name: `ai-driver-copilot` or `fleet-voice-assistant`
3. Description: "Voice-enabled AI assistant for truck drivers built with FastAPI, Next.js, and AWS Bedrock"
4. Choose **Public** (for portfolio) or **Private** (for security)
5. **DO NOT** check "Add README" or ".gitignore" (we already have them)
6. Click "Create repository"

### Option B: Via GitHub CLI

```bash
gh repo create ai-driver-copilot --public --source=. --remote=origin
```

---

## 📤 Step 7: Push to GitHub

After creating the repository on GitHub, you'll see instructions. Follow these:

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/ai-driver-copilot.git

# Verify .env is not being committed
git status

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🔍 Step 8: Verify on GitHub

1. Go to your repository on GitHub
2. **Check these files ARE present:**
   - ✅ `.gitignore`
   - ✅ `.env.example`
   - ✅ `README.md` (create one - see below)
   - ✅ Source code files

3. **Check these files ARE NOT present:**
   - ❌ `.env` (should be hidden)
   - ❌ `venv/` folder
   - ❌ `node_modules/` folder
   - ❌ API keys visible anywhere

---

## 📋 Step 9: Create a README.md

Create a professional README for GitHub visitors:

```bash
# I'll create this for you in the next step
```

---

## 🔐 Step 10: Rotate Your Credentials (Recommended)

Since you've been working with real credentials locally:

### **For Maximum Security:**

1. **AWS Bedrock API Key:**
   - Generate a new key in AWS Console
   - Update your local `.env`
   - Revoke the old key

2. **Deepgram API Key:**
   - Generate new key at https://console.deepgram.com
   - Update your local `.env`
   - Revoke old key

3. **Database Password:**
   - Change your MySQL root password
   - Update your local `.env`

### Why?
Even though `.env` won't be committed, it's best practice to rotate credentials after working on them locally, especially if:
- You've shared your screen
- You've copied code to other places
- You want maximum security

---

## ✅ Final Checklist

Before considering your GitHub repo secure:

- [ ] `.gitignore` is in place
- [ ] `.env` is listed in `.gitignore`
- [ ] `.env.example` exists (template only)
- [ ] `database.py` uses `os.getenv()` not hardcoded credentials
- [ ] Tested `git status` - no `.env` file shown
- [ ] Pushed to GitHub
- [ ] Verified `.env` is NOT visible on GitHub
- [ ] Created README.md with setup instructions
- [ ] (Optional) Rotated API keys and passwords

---

## 🆘 Emergency: If You Accidentally Committed .env

If you already pushed `.env` to GitHub:

### **Immediate Actions:**

1. **Remove from Git History:**
```bash
git rm --cached .env
git commit -m "Remove .env from repository"
git push
```

2. **Rotate ALL Credentials IMMEDIATELY:**
   - AWS Bedrock API Key
   - Deepgram API Key
   - ElevenLabs API Key
   - Database password
   - JWT secret

3. **Use git-filter-branch (Nuclear Option):**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

⚠️ **Warning:** This rewrites Git history. Coordinate with team if working with others.

---

## 📚 Additional Resources

**Git Security:**
- https://docs.github.com/en/code-security
- https://git-secret.io/

**Environment Variables:**
- https://github.com/motdotla/dotenv
- https://12factor.net/config

**API Key Management:**
- https://aws.amazon.com/secrets-manager/
- https://www.vaultproject.io/

---

## 🎓 Best Practices for Future Projects

1. **ALWAYS create `.gitignore` FIRST** before any commits
2. **ALWAYS use `.env.example`** to document required variables
3. **NEVER hardcode credentials** in source files
4. **Use environment variables** for ALL secrets
5. **Rotate credentials** regularly
6. **Enable GitHub secret scanning** (Settings → Security → Secret scanning)

---

## ✅ You're Ready!

Once you've completed all steps above, your code is secure and ready for GitHub! 🎉

Your credentials are safe, and anyone cloning your repo will:
1. See `.env.example` with instructions
2. Create their own `.env` file
3. Add their own API keys
4. Run the project successfully

---

**Questions?** Check if `.env` is in your `.gitignore` file and run `git status` to verify!
