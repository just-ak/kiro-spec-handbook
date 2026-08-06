# Contributing

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to ensure semantic versioning is applied automatically.

## Commit Format

All commits must follow this format:

```
type(scope): subject

body

footer
```

### Type

Required. One of:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build, CI, dependencies, etc.

### Scope

Optional. The part of the codebase affected (e.g., `pdf-chunker`, `renderer`, `indexer`).

### Subject

Required. Short description (50 chars max), imperative mood, no period.

**Good:**

- `feat(renderer): add LaTeX template customization`
- `fix(pdf-chunker): handle PDF with no pages`
- `docs: update README with examples`

**Bad:**

- `updated the renderer` (not imperative)
- `feat: add a new feature to the system that allows users to customize things` (too long)

### Body

Optional. Explain what and why, not how. Include any breaking changes.

### Footer

Optional. Reference issues: `Fixes #123`, `Closes #456`

## Examples

### Feature (triggers minor version bump)

```
feat(indexer): add cross-reference validation

Add validation to ensure all spec IDs referenced in requirements
and tasks exist in the spec tree. Emit warnings for broken references.

Fixes #42
```

**Result:** Version 1.0.0 → 1.1.0

### Bug Fix (triggers patch version bump)

```
fix(pdf-chunker): correct chunk size calculation

The chunk size calculation was off by one, causing the last chunk
to exceed the target size by 100 KB.
```

**Result:** Version 1.1.0 → 1.1.1

### Breaking Change (triggers major version bump)

```
feat(config)!: remove support for old config format

The old YAML format is no longer supported. Use the new format
in .kiro/handbook.yml (see README for examples).

BREAKING CHANGE: Projects using the old config format must migrate.
```

**Result:** Version 1.1.1 → 2.0.0

## Versioning

Releases are generated automatically using [semantic-release](https://semantic-release.gitbook.io/):

- **Major version** (1.0.0): Breaking changes
- **Minor version** (1.1.0): New features (backwards compatible)
- **Patch version** (1.1.1): Bug fixes

## Development Workflow

1. **Create a feature branch:**

   ```bash
   git checkout -b fix/pdf-chunker-off-by-one
   ```

2. **Make changes and commit with conventional format:**

   ```bash
   git add .
   git commit -m "fix(pdf-chunker): correct chunk size calculation"
   ```

3. **Push to GitHub:**

   ```bash
   git push origin fix/pdf-chunker-off-by-one
   ```

4. **Create a pull request**

5. **After merge to main:**
   - GitHub Actions automatically runs semantic-release
   - Version is bumped based on commit messages
   - Package is published to GitHub Packages
   - Release notes are generated
   - Git tag is created

## Pre-commit Checks

Before committing:

```bash
npm run build    # Ensure TypeScript compiles
npm run test     # Ensure tests pass
```

## Release Process

Releases happen automatically when commits are merged to `main`:

1. **Analyze commits** — semantic-release reads commit messages
2. **Determine version** — calculates next version (major, minor, or patch)
3. **Generate changelog** — adds to CHANGELOG.md
4. **Build package** — runs `npm run build`
5. **Publish** — uploads to GitHub Packages
6. **Create tag** — creates a git tag for the release
7. **Push updates** — commits version changes back to main

No manual versioning needed!

## Questions?

- See [Conventional Commits](https://www.conventionalcommits.org/) for the full spec
- See [semantic-release docs](https://semantic-release.gitbook.io/) for how releases work
