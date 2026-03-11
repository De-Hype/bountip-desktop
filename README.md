# Bountip Desktop

Bountip is an offline-first desktop application built with Electron, React, and SQLite.

---

## 🚀 Development Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🛠 How to Build the App (Step-by-Step)

There are two ways to build the app: **Locally** (on your computer) or **Automated** (via GitHub Actions).

### Option A: Build Locally (On your Mac)

Use this if you want to test the installers immediately without pushing to GitHub.

1. **Get a GitHub Personal Access Token (PAT)**:
   - Go to [GitHub Settings > Developer settings > Tokens (classic)](https://github.com/settings/tokens).
   - Generate a new token with the `repo` scope.
   - Copy the token.

2. **Set the Token in your Terminal**:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

3. **Run the Build Command**:
   - **For all platforms (Mac, Windows, Linux)**:
     ```bash
     npm run dist:all
     ```
   - **For Mac only**:
     ```bash
     npm run dist:mac
     ```
   - **For Windows only**:
     ```bash
     npm run dist:win
     ```

4. **Find your installers**:
   The builds will be in the `dist_electron` or `release` folder in your project.

---

### Option B: Automated Build (Recommended for Distribution)

Use this to officially release a new version. This is the only way to ensure Windows/Linux builds are generated correctly and auto-updates are triggered for users.

### 1. One-Time Setup (GitHub Settings)
To allow the automated build to publish releases to GitHub, you must add a Personal Access Token (PAT) as a secret:
1. **Generate a PAT**:
   - Go to [GitHub Settings > Developer settings > Tokens (classic)](https://github.com/settings/tokens).
   - Generate a new token with the `repo` scope.
   - Copy the token.
2. **Add as a Secret**:
   - Go to your repo on GitHub: **Settings** > **Secrets and variables** > **Actions**.
   - Click **New repository secret**.
   - Name: `RELEASE_TOKEN`.
   - Value: Paste the PAT you just copied.
   - Click **Add secret**.

### 2. Releasing a New Version
The build is automatically triggered whenever you push to the **`dev`** branch.

1. **Bump the Version**: Update the `"version"` field in your `package.json"` (e.g., from `0.1.0` to `0.1.1`).
2. **Commit and Push**:
   ```bash
   git add package.json
   git commit -m "Release v0.1.1"
   git push origin dev
   ```
3. **Automated Build**: GitHub Actions will automatically detect the push to `dev` and start building the application for macOS and Windows.

---

## 📜 Distribution

To give the app to new people, send them to:
[https://github.com/De-Hype/bountip-desktop/releases/latest](https://github.com/De-Hype/bountip-desktop/releases/latest)

---

## 🛠 Tech Stack
- **Framework**: React (Vite)
- **Desktop**: Electron
- **Database**: SQLite (better-sqlite3)
- **CI/CD**: GitHub Actions & Electron Builder
- **Updates**: electron-updater
