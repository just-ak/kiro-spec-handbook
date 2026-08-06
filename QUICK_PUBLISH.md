# Quick GitHub Packages Publishing Guide

## TL;DR - First Time Setup

```bash
# 1. Create GitHub Personal Access Token
#    Go to: https://github.com/settings/tokens
#    Create new token with: read:packages, write:packages, delete:packages

# 2. Configure npm locally
npm login --registry=https://npm.pkg.github.com

# 3. Verify authentication
npm whoami --registry=https://npm.pkg.github.com
```

## Publishing

```bash
# Build & test
npm run build && npm run test

# Preview package
npm pack --dry-run

# Publish to GitHub Packages
npm publish

# Verify
npm view @just-ak/kiro-handbook
```

## For Updates

```bash
# Bump version
npm version patch   # 0.1.0 → 0.1.1

# Publish
npm publish

# Push to git
git push origin main
git push --tags
```

## For Users

Install with GitHub auth configured:

```bash
npm install @just-ak/kiro-handbook
```

Then use:

```bash
handbook build
handbook validate
handbook chunk
```

---

**Full guides:**

- [GitHub Packages Setup](./GITHUB_PACKAGES.md) — Complete authentication guide
- [Publishing Guide](./PUBLISHING.md) — Detailed publishing workflow
- [Usage Guide](./USAGE.md) — How to use the package

**Package Details:**

- Name: `@just-ak/kiro-handbook`
- Registry: GitHub Packages
- Repository: github.com/just-ak/kiro-handbooks
