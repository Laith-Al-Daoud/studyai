# How to Push StudyAI to GitHub

This guide will walk you through pushing your StudyAI application to GitHub.

## ✅ Step 1: Create a GitHub Repository

1. **Go to GitHub.com** and sign in to your account

2. **Click the "+" icon** in the top right corner
   - Select "New repository"

3. **Fill in the repository details:**
   - **Repository name:** `studyai` (or any name you prefer)
   - **Description:** "StudyAI - Lightweight Studying Assistant with RAG"
   - **Visibility:** 
     - Choose **Public** (if you want to share it)
     - Choose **Private** (if you want to keep it private)
   - ⚠️ **DO NOT** check "Add a README file" (we already have one)
   - ⚠️ **DO NOT** add .gitignore or license (we already have them)

4. **Click "Create repository"**

5. **Copy the repository URL** that GitHub shows you
   - It will look like: `https://github.com/yourusername/studyai.git`
   - Or SSH: `git@github.com:yourusername/studyai.git`

## 🔗 Step 2: Connect Your Local Repository to GitHub

Open your terminal and run these commands:

```bash
# Make sure you're in the studai folder
cd /home/laith/code/reposo/studai

# Add the GitHub repository as a remote (replace with YOUR repository URL)
git remote add origin https://github.com/yourusername/studyai.git

# Verify the remote was added
git remote -v
```

**If you're using SSH instead of HTTPS:**
```bash
git remote add origin git@github.com:yourusername/studyai.git
```

## 🚀 Step 3: Push Your Code to GitHub

```bash
# Push your code to GitHub (this uploads all your files)
git push -u origin master
```

**Note:** If your default branch is `main` instead of `master`:
```bash
# First, rename your branch
git branch -M main

# Then push
git push -u origin main
```

## 📝 What These Commands Do

### `git remote add origin <URL>`
- **What it does:** Tells git where your GitHub repository is located
- **`origin`:** This is just a nickname for your GitHub repository
- **`<URL>`:** The GitHub repository URL you copied

### `git push -u origin master`
- **`git push`:** Uploads your commits to GitHub
- **`-u origin master`:** 
  - Sets up tracking so future pushes are easier
  - `origin` = your GitHub repository
  - `master` = your branch name (might be `main`)

## ✅ Step 4: Verify It Worked

1. **Refresh your GitHub repository page**
2. **You should see all your files!**
   - README.md
   - package.json
   - src/ folder
   - All your code!

## 🔄 Future Updates: How to Push Changes

After making changes to your code, push them with:

```bash
# 1. Check what files changed
git status

# 2. Add all changed files
git add .

# 3. Commit with a message
git commit -m "Description of your changes"

# 4. Push to GitHub
git push
```

## 🔐 Authentication: GitHub Personal Access Token

If you're using HTTPS and GitHub asks for authentication:

1. **GitHub no longer accepts passwords** for git operations
2. You need to use a **Personal Access Token**

### How to Create a Personal Access Token:

1. Go to GitHub.com → **Settings** → **Developer settings**
2. Click **Personal access tokens** → **Tokens (classic)**
3. Click **Generate new token (classic)**
4. Give it a name: "StudyAI Development"
5. Select scopes:
   - ✅ **repo** (full control of private repositories)
6. Click **Generate token**
7. **Copy the token immediately** (you won't see it again!)
8. When git asks for password, **paste the token instead**

## 🎯 Quick Reference Commands

```bash
# Navigate to your project
cd /home/laith/code/reposo/studai

# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes from GitHub
git pull

# View commit history
git log --oneline

# Check remote repository
git remote -v
```

## 🆘 Troubleshooting

### "remote origin already exists"
```bash
# Remove the existing remote
git remote remove origin

# Add it again with correct URL
git remote add origin https://github.com/yourusername/studyai.git
```

### "failed to push some refs"
```bash
# If GitHub has files you don't have locally, pull first:
git pull origin master --allow-unrelated-histories

# Then push again
git push -u origin master
```

### "authentication failed"
- Make sure you're using a Personal Access Token (not password)
- Check that your token has `repo` scope enabled

### Wrong branch name
```bash
# Check your current branch
git branch

# If it's 'master' but GitHub uses 'main':
git branch -M main
git push -u origin main
```

## 🎉 Success!

Once you've pushed successfully, your StudyAI application will be on GitHub and you can:
- Share it with others
- Collaborate with team members
- Deploy it to Vercel/other platforms
- Track issues and features
- Keep a backup of your code

---

**Need help?** Check the [Git Documentation](https://git-scm.com/doc) or [GitHub Docs](https://docs.github.com)

