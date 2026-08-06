# Release Workflow Guide

This project uses [semantic-release](https://semantic-release.gitbook.io/) for automated versioning and publishing to GitHub Packages.

## How It Works

The release workflow is triggered automatically on every push to `main`, `beta`, or `alpha` branches. It can also be manually triggered from the GitHub Actions tab.

### Automatic Triggers

1. **Push to main** → Analyzes commits, bumps version, publishes
2. **Push to beta** → Creates pre-release (1.0.0-beta.1)
3. **Push to alpha** → Creates alpha pre-release (1.0.0-alpha.1)

### Manual Trigger

Go to https://github.com/just-ak/kiro-spec-handbook/actions and click "Run workflow".

## Commit Format

Releases are determined by commit messages following [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(scope): <description>

<body>

<footer>
```

### Release Rules

| Commit Type        | Version Bump      | Example                                        |
| ------------------ | ----------------- | ---------------------------------------------- |
| `feat(...)`        | **Minor** (0.1.0) | `feat: add PDF export`                         |
| `fix(...)`         | **Patch** (0.0.1) | `fix: resolve chunking bug`                    |
| `perf(...)`        | **Patch** (0.0.1) | `perf: optimize PDF rendering`                 |
| `refactor(...)`    | **Patch** (0.0.1) | `refactor: simplify indexer`                   |
| `feat(...)!`       | **Major** (1.0.0) | `feat!: remove old API`                        |
| `BREAKING CHANGE:` | **Major** (1.0.0) | Body: `BREAKING CHANGE: config format changed` |
| `docs(...)`        | **No bump**       | `docs: update README`                          |
| `chore(...)`       | **No bump**       | `chore: update dependencies`                   |

### Examples

**Feature (minor bump):**

```bash
git commit -m "feat(renderer): add custom LaTeX template support"
```

→ Version 0.1.0 → 0.2.0

**Bug Fix (patch bump):**

```bash
git commit -m "fix(pdf-chunker): correct page boundary calculation"
```

→ Version 0.2.0 → 0.2.1

**Breaking Change (major bump):**

```bash
git commit -m "feat(config)!: change YAML schema

BREAKING CHANGE: The old config format is no longer supported."
```

→ Version 0.2.1 → 1.0.0

## Workflow Steps

When a release is triggered, semantic-release:

1. **Analyzes commits** — Reads commit messages since last release
2. **Determines version** — Calculates next version (major/minor/patch)
3. **Builds package** — Runs `npm run build`
4. **Runs tests** — Runs `npm run test` (must pass)
5. **Updates files** — Modifies `package.json`, creates `CHANGELOG.md`
6. **Publishes** — Uploads to GitHub Packages
7. **Creates tag** — Creates git tag (e.g., `v1.0.0`)
8. **Creates release** — Creates GitHub release with notes
9. **Commits** — Commits version changes back to main

## Manual Release

To manually trigger a release:

1. Go to https://github.com/just-ak/kiro-spec-handbook/actions
2. Click the **Release** workflow
3. Click **Run workflow** button
4. Select branch (main)
5. Click **Run workflow**

The workflow will execute and create a release based on commits since the last version tag.

## Troubleshooting

### Actions not running on push

**Possible causes:**

- GitHub Actions not enabled (Settings → Actions)
- Workflow permissions not set (Settings → Actions → General → "Read and write permissions")
- Branch protection rules blocking status checks

**Solution:**

1. Visit repository settings
2. Go to Actions → General
3. Ensure "Read and write permissions" is selected
4. Manually trigger workflow via "Run workflow"

### Release not creating new version

**Possible causes:**

- No commits with `feat:`, `fix:`, or breaking change since last release
- Commits don't follow conventional format
- Tests failing

**Solution:**

1. Check recent commits: `git log --oneline | head -10`
2. Ensure commits start with `feat:`, `fix:`, `perf:`, or `refactor:`
3. Verify tests pass: `npm run test`

### Package not published to GitHub Packages

**Possible causes:**

- GITHUB_TOKEN doesn't have `write:packages` permission
- npmrc not configured for GitHub Packages

**Solution:**

- GitHub Actions automatically uses GITHUB_TOKEN with correct permissions
- No manual configuration needed in CI

## Version History

All releases are tracked in:

- **CHANGELOG.md** — Generated release notes
- **GitHub Releases** — https://github.com/just-ak/kiro-spec-handbook/releases
- **Git tags** — `git tag -l`

## Release Checklist

Before pushing to main:

- [ ] Code changes are complete
- [ ] Tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] Commits follow conventional format (`feat:`, `fix:`, etc.)
- [ ] No breaking changes (or intentionally breaking with `!`)

After release:

- [ ] GitHub Actions workflow completed successfully
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated with release notes
- [ ] Git tag created (e.g., `v0.1.0`)
- [ ] Package published to GitHub Packages

## FAQ

**Q: Do I need to manually update package.json version?**
A: No, semantic-release handles it automatically.

**Q: Does it create a PR or need one?**
A: No PR needed. It commits directly to main (which is fine for mono-repos).

**Q: Can I skip a release?**
A: Use `chore:` or `docs:` prefixes for non-releasing commits.

**Q: What if I made a mistake in the release?**
A: Create a new commit fixing the issue, then push. The next release will include the fix.

**Q: How do I publish pre-releases?**
A: Push to `beta` or `alpha` branches for pre-release versions.

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [semantic-release docs](https://semantic-release.gitbook.io/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
