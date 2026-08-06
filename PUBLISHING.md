# Publishing @just-ak/kiro-handbook to GitHub Packages

This package is published to GitHub Packages. Follow these steps to publish new versions.

## Setup

See [GITHUB_PACKAGES.md](./GITHUB_PACKAGES.md) for detailed setup instructions including:

- Creating a Personal Access Token
- Configuring npm authentication
- Verifying your setup

## Before Publishing

1. **Update version** in `package.json`:

   ```bash
   npm version patch|minor|major  # automatically updates package.json and creates git tag
   ```

2. **Build the project**:

   ```bash
   npm run build
   ```

3. **Run tests** to ensure nothing is broken:

   ```bash
   npm run test
   ```

4. **Review distribution files**:
   ```bash
   npm pack --dry-run  # previews what will be published
   npm pack            # creates a .tgz for inspection
   ```

## Publishing to GitHub Packages

```bash
npm publish
```

This publishes to GitHub Packages Registry at:

```
https://github.com/just-ak/kiro-handbooks/packages
```

## Verifying Publication

After publishing, verify the package:

```bash
# Check GitHub Packages
npm view @just-ak/kiro-handbook

# Install in a test directory (with auth configured)
mkdir /tmp/test-handbook && cd /tmp/test-handbook
npm install @just-ak/kiro-handbook

# Try the CLI tools
handbook --help
pdf-chunker --help
```

## Using This Package

Once published, others can install:

```bash
npm install @just-ak/kiro-handbook
```

(They'll need GitHub Packages authentication set up - see [GITHUB_PACKAGES.md](./GITHUB_PACKAGES.md))

### As a CLI tool

```bash
handbook build
handbook validate
handbook index
handbook changes
handbook chunk
```

### As a library

````typescript
import {
  loadSpecifications,
  renderHandbook,
  generateIndexes,
  validateReferences,
} from '@just-ak/kiro-handbook';

1. **Update version** in `package.json`:

   ```bash
   npm version patch|minor|major  # automatically updates package.json and creates git tag
````

2. **Build the project**:

   ```bash
   npm run build
   ```

3. **Run tests** to ensure nothing is broken:

   ```bash
   npm run test
   ```

4. **Review distribution files**:
   ```bash
   npm pack --dry-run  # previews what will be published
   npm pack            # creates a .tgz for inspection
   ```

## Publishing

### First-time publishing

The package will be published to npm under the name `kiro-handbook`.

1. Create the package on npm if needed
2. Ensure you have npm account credentials set up
3. Optionally configure public access in package.json

### Publish to npm

```bash
npm publish
```

This will:

- Build the TypeScript to `dist/`
- Package only files in `dist/` and `templates/` (per `"files"` in package.json)
- Upload to npm with the version from `package.json`

### Publish a pre-release

```bash
npm version prerelease  # bumps to 0.1.1-0
npm publish --tag beta  # publishes as kiro-handbook@0.1.1-0 with beta tag
```

Users install pre-releases explicitly:

```bash
npm install kiro-handbook@beta
```

## Verifying Publication

After publishing, verify the package:

```bash
# Check npm registry
npm view kiro-handbook

# Install in a test project
npm install kiro-handbook@latest

# Try the CLI tools
handbook --help
pdf-chunker --help
```

## Using This Package

Once published, other projects can install and use it:

```bash
npm install kiro-handbook
```

### As a CLI tool

```bash
handbook build
handbook validate
handbook index
handbook changes
handbook chunk
```

### As a library

```javascript
import {
  loadSpecifications,
  renderHandbook,
  generateIndexes,
  validateReferences,
} from "kiro-handbook";

const specs = await loadSpecifications("./specs");
const handbook = await renderHandbook(specs);
const indexes = generateIndexes(specs);
```

## Troubleshooting

### "npm ERR! 403 Forbidden"

- Ensure you're authenticated: `npm whoami`
- Verify you have publish access to `kiro-handbook`
- Check that `publishConfig.access` is set to `"public"` if this is a public package

### "npm ERR! 404 Not Found"

- Ensure the package name matches: `kiro-handbook`
- Confirm the `just-ak` organization exists on npm

### "npm ERR! publish Failed"

- Run `npm pack` first to verify the package contents
- Check that `dist/` was built correctly: `ls -la dist/`
- Ensure all required files are in the `"files"` array in package.json

## Automation (GitHub Actions)

To automate publishing, create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

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
          registry-url: "https://registry.npmjs.org"
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## References

- [npm publish docs](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [scoped packages](https://docs.npmjs.com/about/scoped-packages)
- [package.json reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
