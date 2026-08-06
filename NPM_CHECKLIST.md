# npm Publishing Checklist

This checklist ensures `kiro-handbook` is ready for publishing to npm.

## ✅ Package Configuration

- [x] `"private": false` — allows npm publishing
- [x] `"name": "kiro-handbook"` — scoped package name
- [x] `"version": "0.1.0"` — semantic versioning
- [x] `"main": "dist/index.js"` — entry point is built code
- [x] `"types": "dist/index.d.ts"` — TypeScript support
- [x] `"bin"` configured for `handbook` and `pdf-chunker` CLI tools
- [x] `"files"` lists only production files (`dist/`, `templates/`)
- [x] `"repository"` points to GitHub
- [x] `"license": "MIT"` specified
- [x] `"author": "Ledgiventa"` specified
- [x] Keywords for discoverability

## ✅ Build Configuration

- [x] `tsconfig.json` properly configured
- [x] TypeScript compiles without errors
- [x] Declaration files (`*.d.ts`) generated for types
- [x] Source maps included for debugging
- [x] Node.js 20+ requirement specified

## ✅ Files & Directories

- [x] `.npmignore` excludes dev files (test, src, .github, etc.)
- [x] `dist/` directory builds successfully
- [x] `templates/` included for PDF generation
- [x] `package.json` included automatically
- [x] `README.md` included automatically

## ✅ Documentation

- [x] `README.md` updated with quick start & link to usage guide
- [x] `USAGE.md` created — comprehensive user guide
- [x] `PUBLISHING.md` created — contributor publishing guide
- [x] Inline code comments document key functions
- [x] TypeScript types exported and documented

## ✅ Dependencies

- [x] All dependencies pinned to specific versions (no `*`)
- [x] No security vulnerabilities in production dependencies
- [x] Dev dependencies properly separated
- [x] Peer dependencies documented (Pandoc, LaTeX optional)

## ✅ Tests

- [x] Test suite passes: `npm run test`
- [x] All tests in `test/` directory run successfully
- [x] No test files included in npm package (via `.npmignore`)

## ✅ CLI Tools

- [x] `handbook` CLI tool configured in `bin`
- [x] `pdf-chunker` CLI tool configured in `bin`
- [x] Executable scripts present in `dist/`
- [x] Tools work without installation (tested locally)

## Before Publishing

### 1. Verify locally

```bash
# Build
npm run build

# Test
npm run test

# Preview package contents
npm pack --dry-run

# Inspect specific files
npm pack
tar -tzf ledgiventa-handbook-0.1.0.tgz | head -20
```

### 2. Authenticate to npm

```bash
npm login

# Verify authentication
npm whoami
```

### 3. Check organization access

Ensure you have push access to `just-ak` organization on npm.com:

- Visit https://www.npmjs.com/org/ledgiventa
- Confirm your user is listed as a member/maintainer

### 4. Bump version (for releases after 0.1.0)

```bash
npm version patch    # 0.1.0 → 0.1.1
npm version minor    # 0.1.0 → 0.2.0
npm version major    # 0.1.0 → 1.0.0

# Creates a git tag automatically
```

### 5. Publish

```bash
npm publish
```

### 6. Verify publication

```bash
# Check npm registry
npm view kiro-handbook

# Install in a test directory
mkdir /tmp/test-handbook && cd /tmp/test-handbook
npm install kiro-handbook
npx handbook --help
npx pdf-chunker --help
```

## GitHub Setup (Optional)

For automated publishing on tag push:

1. Generate npm token: https://www.npmjs.com/settings/~/tokens
   - Select "Automation" token type
2. Add as GitHub secret: `NPM_TOKEN`
3. Create `.github/workflows/publish.yml` (template in `PUBLISHING.md`)

## Post-Publication

- [ ] Test installation in a real project
- [ ] Verify CLI tools work: `handbook --help`, `pdf-chunker --help`
- [ ] Check npm.com listing: https://www.npmjs.com/package/kiro-handbook
- [ ] Share with team/community
- [ ] Create GitHub release notes

## Common Issues

| Issue           | Solution                                                        |
| --------------- | --------------------------------------------------------------- |
| `403 Forbidden` | Check npm login status: `npm whoami`                            |
| `404 Not Found` | Ensure `just-ak` org exists on npm                          |
| Build fails     | Run `npm install` to fetch dependencies                         |
| Types missing   | Verify `dist/*.d.ts` files exist after build                    |
| CLI not working | Check shebangs in `dist/index.js` and `dist/pdf-chunker-cli.js` |

## References

- [npm publish documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Scoped packages guide](https://docs.npmjs.com/about/scoped-packages)
- [package.json reference](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)
- [npm CLI authentication](https://docs.npmjs.com/cli/v10/commands/npm-adduser)

---

**Ready to publish?** Follow steps in "Before Publishing" section above.
