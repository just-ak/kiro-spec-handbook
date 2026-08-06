# Release Notes: kiro-handbook v0.1.0

## Summary

`kiro-handbook` is now ready for publishing to npm as a standalone package.

This release transforms the handbook generator from a project-specific tool into a reusable,
well-documented npm package that other teams can install and use for their own specification
handbooks.

## What Changed

### 📦 Publishing Configuration

- Removed `"private": true` to allow npm publishing
- Added repository, bugs, homepage, keywords, author, and license metadata
- Created `.npmignore` to exclude development files from the published package
- Configured proper entry points (`"main"`, `"types"`, `"bin"`)

### 📖 Documentation

Created three new guides:

1. **USAGE.md** — How to use the package in other projects
   - Installation instructions
   - CLI tool reference (`handbook`, `pdf-chunker`)
   - Library API examples
   - Configuration guide
   - Troubleshooting

2. **PUBLISHING.md** — How to publish and manage versions
   - Authentication setup
   - Version bumping workflow
   - Publishing process
   - Pre-release management
   - GitHub Actions CI/CD template

3. **NPM_CHECKLIST.md** — Pre-publication verification
   - Complete checklist of requirements
   - Local verification steps
   - Post-publication verification
   - Common issues & solutions

### 🚀 Package Contents

The published package includes:

- **53.2 KB** compressed (205.6 KB unpacked)
- 60 files total
- All compiled JavaScript + TypeScript definitions
- LaTeX template for PDF generation
- 2 executable CLI commands

## Installation

Once published, users can install with:

```bash
npm install kiro-handbook
```

Then use via CLI:

```bash
handbook build
handbook validate
handbook chunk
```

Or import as a library:

```typescript
import { loadSpecifications, renderHandbook } from "kiro-handbook";
```

## Next Steps

### To Publish

1. **Authenticate to npm:**

   ```bash
   npm login
   ```

2. **Verify everything:**

   ```bash
   npm run build
   npm run test
   npm pack --dry-run
   ```

3. **Publish:**

   ```bash
   npm publish
   ```

4. **Verify on npm:**
   ```bash
   npm view kiro-handbook
   npm install kiro-handbook  # test in another dir
   ```

For detailed instructions, see [NPM_CHECKLIST.md](./NPM_CHECKLIST.md).

### After Publishing

Users can:

- Install the package: `npm install kiro-handbook`
- Read the usage guide: See [USAGE.md](./USAGE.md)
- File issues on GitHub
- Contribute improvements

## Compatibility

- **Node.js:** 20+ (specified in `engines`)
- **OS:** macOS, Linux, Windows
- **TypeScript:** Full type definitions included

## System Dependencies

Optional (handbook works without them, PDF generation is optional):

- **Pandoc** — for PDF generation
- **LibRSVG** / **Inkscape** / **CairoSVG** — for SVG rendering
- **XeLaTeX** (or MiKTeX, TinyTeX) — for PDF typography

Installation guides per OS are in [USAGE.md](./USAGE.md).

## Files Changed

```
✨ Created:
  - .npmignore
  - USAGE.md          (for package users)
  - PUBLISHING.md     (for contributors)
  - NPM_CHECKLIST.md  (pre-publication checklist)
  - RELEASE_NOTES.md  (this file)

🔄 Updated:
  - package.json      (added metadata, removed "private" flag)
  - README.md         (updated intro, added links to guides)
```

## Version

- **Current:** `0.1.0`
- **Package name:** `kiro-handbook`
- **npm URL:** https://www.npmjs.com/package/kiro-handbook (after publication)

## Questions?

- **How do I use this?** → [USAGE.md](./USAGE.md)
- **How do I publish updates?** → [PUBLISHING.md](./PUBLISHING.md)
- **Is everything ready?** → [NPM_CHECKLIST.md](./NPM_CHECKLIST.md)
- **Original docs** → [README.md](./README.md)
