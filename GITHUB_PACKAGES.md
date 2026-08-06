# Publishing to GitHub Packages

`@just-ak/kiro-handbook` is published to GitHub Packages, making it available to anyone with access to the just-ak organization on GitHub.

## Prerequisites

1. **GitHub account** with access to just-ak organization
2. **Personal Access Token (PAT)** with `read:packages` and `write:packages` scope
3. **Git** with credentials configured
4. **npm** authenticated to GitHub Packages

## Setup (One-time)

### 1. Create a Personal Access Token

1. Go to GitHub Settings → [Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "npm-packages"
4. Select scopes:
   - ✅ `read:packages` — read packages
   - ✅ `write:packages` — publish packages
   - ✅ `delete:packages` — delete if needed
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

### 2. Configure npm

Create or edit `~/.npmrc`:

```
@just-ak:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with your personal access token.

**Alternative:** Authenticate interactively:

```bash
npm login --registry=https://npm.pkg.github.com
# Username: your-github-username
# Password: paste your token here
# Email: your-email@example.com
```

### 3. Verify authentication

```bash
npm whoami --registry=https://npm.pkg.github.com
# Should output your GitHub username
```

## Publishing

### Build first

```bash
npm run build
npm run test
npm pack --dry-run
```

### Publish

```bash
npm publish
```

This publishes to GitHub Packages Registry at:

```
https://github.com/just-ak/kiro-handbooks/packages
```

## Using the Package

### Installation

Others can install with:

```bash
npm install @just-ak/kiro-handbook
```

**They'll need to authenticate too** (same PAT setup above).

### In package.json

```json
{
  "dependencies": {
    "@just-ak/kiro-handbook": "^0.1.0"
  }
}
```

### In code

```typescript
import {
  loadSpecifications,
  renderHandbook,
  generateIndexes,
} from "@just-ak/kiro-handbook";
```

## CI/CD Publishing (GitHub Actions)

To auto-publish on version tags:

```yaml
# .github/workflows/publish.yml
name: Publish to GitHub Packages

on:
  push:
    tags:
      - "v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://npm.pkg.github.com"
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Push a tag to trigger:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Troubleshooting

### "npm ERR! 403 Forbidden"

- Check your token has `write:packages` scope
- Verify you're authenticated: `npm whoami --registry=https://npm.pkg.github.com`
- Ensure token hasn't expired

### "npm ERR! 404 Not Found"

- Package name must be `@just-ak/kiro-handbook` (scoped to org)
- Verify `publishConfig.registry` in package.json is correct

### Authentication not working

Re-authenticate:

```bash
npm logout --registry=https://npm.pkg.github.com
npm login --registry=https://npm.pkg.github.com
```

Or regenerate your token and update `~/.npmrc`.

## Version Management

### Bump version

```bash
npm version patch    # 0.1.0 → 0.1.1
npm version minor    # 0.1.0 → 0.2.0
npm version major    # 0.1.0 → 1.0.0
```

This updates `package.json` and creates a git tag automatically.

### Publish

```bash
npm publish
git push
git push --tags
```

## References

- [GitHub Packages documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Authenticating with GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token)

## Team Access

For team members to install the package, they need:

1. A GitHub account in the just-ak organization
2. A personal access token with `read:packages` scope
3. npm configured with token (see Setup section above)

Then they can:

```bash
npm install @just-ak/kiro-handbook
```
