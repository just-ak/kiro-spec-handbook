# Quick Start: Publishing to npm

## TL;DR

Your package is ready. Three steps to publish:

```bash
# 1. Authenticate (one-time)
npm login

# 2. Test & verify
npm run build && npm run test && npm pack --dry-run

# 3. Publish
npm publish
```

Then verify it works:

```bash
npm view kiro-handbook
npm install kiro-handbook
handbook --help
```

---

## Full Documentation

- **Using the package** → [USAGE.md](./USAGE.md)
- **Publishing updates** → [PUBLISHING.md](./PUBLISHING.md)
- **Pre-publication checklist** → [NPM_CHECKLIST.md](./NPM_CHECKLIST.md)
- **What changed** → [RELEASE_NOTES.md](./RELEASE_NOTES.md)
- **Setup complete** → [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)

---

## Package Info

|             |                      |
| ----------- | -------------------- |
| **Name**    | kiro-handbook |
| **Version** | 0.1.0                |
| **Size**    | 53.2 KB              |
| **Status**  | ✅ Ready to publish  |

---

## What Users Get

After `npm install kiro-handbook`:

### CLI Tools

```bash
handbook build      # Generate handbook from specs
handbook validate   # Validate spec references
handbook index      # Show specification indexes
handbook chunk      # Split PDF for upload
pdf-chunker         # Chunk any PDF
```

### Library API

```typescript
import {
  loadSpecifications,
  renderHandbook,
  generateIndexes,
  validateReferences,
  chunkPdf,
} from "kiro-handbook";
```

---

## After Publishing

Users can install and use immediately:

```bash
npm install kiro-handbook
handbook build
```

You can push updates anytime with `npm publish`.

---

**Need details?** See the full guides linked above. **Ready?** Run the three commands above.
