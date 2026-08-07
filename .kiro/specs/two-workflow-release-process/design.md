---
spec_id: SPEC-TWO-WORKFLOW-RELEASE
title: Two-Workflow Release Process
version: "1.0"
status: draft
---

# Design Document

## Overview

The two-workflow release process automates version management and npm package publication for kiro-spec-handbook through coordinated GitHub Actions workflows. This design ensures that every merge to a production branch (main, beta, or alpha) undergoes a deterministic, auditable release workflow that enforces code quality (build + test) before versioning, generates supporting artifacts (changelog, handbook PDF), and publishes packages to GitHub Packages.

The separation into two workflows—**Version & Handbook** and **Publish**—enforces a clear separation of concerns:

- **Version & Handbook** (triggered on push to main/beta/alpha) handles commit analysis, version determination, changelog generation, handbook PDF creation, and GitHub Release creation
- **Publish** (triggered by GitHub Release published event) handles npm package building and publication

This design prevents circular trigger loops, ensures that failed builds don't result in versioning errors, and maintains a reliable audit trail through git tags and GitHub Releases.

## Architecture

### Workflow Orchestration

```
Developer Workflow                  GitHub Actions Automation
─────────────────                  ────────────────────────
Feature work on branch      ──→     No workflows run
     │
     ↓
Create/merge PR             ──→     No workflows run (until merge)
     │
     ↓
Merge to main/beta/alpha    ──→     Version & Handbook Workflow
                                   ├─ Checkout (fetch-depth: 0)
                                   ├─ Build & Test
                                   ├─ semantic-release (analyze commits)
                                   ├─ Update files & commit [skip ci]
                                   ├─ Create git tag
                                   └─ Create GitHub Release
                                            │
                                            ↓
                                   Publish Workflow
                                   ├─ Checkout at tag
                                   ├─ Build package
                                   └─ npm publish to GitHub Packages
```

### Key Design Decisions

1. **Push-based (not tag-based) triggers**: The Version & Handbook workflow runs on push events to production branches, not on git tags. This allows the workflow to run semantic-release, which creates the tags. If we triggered on tags, we'd need a separate mechanism to create tags, creating unnecessary coupling.

2. **[skip ci] prevents circular triggers**: The commit created by semantic-release contains `[skip ci]` in its message, preventing GitHub Actions from re-running the Version & Handbook workflow. This is crucial for idempotency and cost control.

3. **Release event triggers Publish**: The Publish workflow uses the `release: [published]` event, not just `release: [created]`. This ensures that pre-releases and draft releases don't trigger publishing. The distinction between "created" and "published" allows maintainers to draft and review releases before they trigger automation.

4. **No circular dependency between workflows**: Because the Publish workflow is triggered by a GitHub Release event (not by the Version & Handbook workflow directly), there's no risk of infinite loops or cascading failures. Each workflow is independent and has a single, clear trigger.

5. **Full git history for semantic-release**: The Version & Handbook workflow uses `fetch-depth: 0` during checkout to ensure semantic-release has access to all commits and tags since the beginning of the repository. This is essential for accurate version determination and changelog generation.

## Data Models

### Commit Message Format

Commits follow the Conventional Commits specification:

```
type(scope): subject

body

footer
```

- **type**: `feat`, `fix`, `perf`, `refactor`, `chore`, `docs`
- **scope**: optional, e.g., `(scanner)`, `(renderer)`
- **subject**: concise description (imperative mood)
- **body**: optional detailed explanation
- **footer**: optional, e.g., `BREAKING CHANGE: description` or `Closes #123`

### Version Number Format

- **Production (main)**: `MAJOR.MINOR.PATCH` (e.g., `1.0.0`, `1.1.0`, `2.0.0`)
- **Pre-release (beta/alpha)**: `MAJOR.MINOR.PATCH-BRANCH.N` (e.g., `1.0.0-beta.1`, `1.0.0-alpha.2`)

### Release Notes Format

Release notes are generated in markdown with sections:

```markdown
## ✨ Features

- Add new endpoint (#123)
- Improve error messages (#124)

## 🐛 Bug Fixes

- Fix parsing error (#125)

## ⚡ Performance

- Optimize indexing

## ♻️ Refactoring

- Restructure scanner module
```

### Git Tag Format

- **Tag name**: `v<version>` (e.g., `v1.2.3`, `v1.0.0-beta.1`)
- **Tag message**: Full release notes
- **Tag author**: github-actions[bot]

### Workflow State

The release process maintains implicit state through:

- **Git history**: Commits record what happened
- **Git tags**: Mark releases and provide anchor points
- **GitHub Releases**: Formal release artifacts in GitHub UI
- **npm registry**: Published versions available for consumption
- **CHANGELOG.md**: Human-readable version history

## Components and Interfaces

### Version & Handbook Workflow

**Trigger Events:**

- Push to main, beta, or alpha branches
- Manual dispatch via `workflow_dispatch`

**Permissions:**

- `contents: write` — commit version changes, create tags, push commits
- `issues: write` — future support for issue linking
- `pull-requests: write` — future support for PR linking

**Steps:**

1. **Checkout**
   - Uses `actions/checkout@v4`
   - `fetch-depth: 0` — fetch full git history for semantic-release
   - Provides access to all commits and tags

2. **Setup Node.js**
   - Uses `actions/setup-node@v4`
   - Node.js v20 (LTS)
   - npm caching for faster builds

3. **Install Dependencies**
   - `npm ci` — clean, reproducible install
   - Uses package-lock.json to ensure determinism

4. **Build**
   - `npm run build` — TypeScript compilation
   - Produces dist/ output
   - Fails fast if TypeScript has errors

5. **Run Tests**
   - `npm run test` — vitest suite
   - All tests must pass before versioning
   - Failure prevents release creation

6. **Configure Git**
   - Sets user.email and user.name to github-actions[bot]
   - Required for semantic-release to commit

7. **Create Version & Generate Handbook**
   - Executes `npx semantic-release`
   - Analyzes commits, determines version, updates files
   - Creates git tag and GitHub Release
   - Handbook generation is configured in `.releaserc.json`

### Publish Workflow

**Trigger Event:**

- GitHub Release published event (via `release: [published]`)

**Permissions:**

- `packages: write` — publish to GitHub Packages
- `contents: read` — checkout source code

**Steps:**

1. **Checkout**
   - Uses `actions/checkout@v4`
   - No `fetch-depth` parameter (defaults to 1, sufficient for source code)
   - Automatically checks out the tag corresponding to the release

2. **Setup Node.js**
   - Uses `actions/setup-node@v4`
   - Node.js v20 (LTS)
   - `registry-url: https://npm.pkg.github.com` — configure npm registry
   - npm caching for faster builds

3. **Install Dependencies**
   - `npm ci` — clean install using package-lock.json

4. **Build**
   - `npm run build` — TypeScript compilation
   - Ensures code is buildable at release tag

5. **Publish**
   - `npm publish` to GitHub Packages
   - Uses `NODE_AUTH_TOKEN` environment variable (set from GITHUB_TOKEN)
   - Package published under scope `@just-ak/kiro-spec-handbook`

## Commit Analysis Engine

### Conventional Commits

The release process uses conventional commits to determine version bumps:

- **`feat:`** — Feature commit → minor version bump (1.0.0 → 1.1.0)
- **`fix:`** — Bug fix → patch version bump (1.0.0 → 1.0.1)
- **`perf:`** — Performance improvement → patch version bump
- **`refactor:`** — Code refactoring → patch version bump
- **`chore:`** — Tooling/dependencies → no release (unless breaking)
- **`docs:`** — Documentation only → no release
- **`BREAKING CHANGE:` footer or `!` suffix** (e.g., `feat!:`) → major version bump (1.0.0 → 2.0.0)

### Semantic-Release Configuration

The `.releaserc.json` file configures semantic-release with:

1. **Branch configuration** (`.branches`):

   ```json
   [
     "main",
     { "name": "beta", "prerelease": true },
     { "name": "alpha", "prerelease": true }
   ]
   ```

   - Main branch produces production releases (1.0.0, 1.1.0, 2.0.0)
   - Beta branch produces pre-releases (1.0.0-beta.1, 1.0.0-beta.2)
   - Alpha branch produces pre-releases (1.0.0-alpha.1, 1.0.0-alpha.2)

2. **Commit analyzer** (`@semantic-release/commit-analyzer`):
   - Parses conventional commits
   - Determines if version bump is needed and what type (major/minor/patch)
   - Recognizes BREAKING CHANGE keywords

3. **Release notes generator** (`@semantic-release/release-notes-generator`):
   - Formats release notes with sections: Features, Bug Fixes, Performance, Refactoring
   - Includes commit hashes and authors
   - Uses emoji for visual clarity (✨ Features, 🐛 Bug Fixes, ⚡ Performance, ♻️ Refactoring)

4. **Changelog plugin** (`@semantic-release/changelog`):
   - Generates or appends to CHANGELOG.md
   - Preserves all previous entries
   - Includes links to commits, pull requests, and issues

5. **npm plugin** (`@semantic-release/npm`):
   - Updates package.json and package-lock.json with new version
   - `pkgRoot: "."` — package is at repo root (not a monorepo)
   - `publish: false` — npm publishing is delegated to the Publish workflow

6. **Git plugin** (`@semantic-release/git`):
   - Commits version changes with message: `chore(release): ${version} [skip ci]`
   - Includes release notes in commit body
   - Assets committed: package.json, package-lock.json, CHANGELOG.md
   - `[skip ci]` flag prevents Version & Handbook workflow from re-triggering

7. **GitHub plugin** (`@semantic-release/github`):
   - Creates GitHub Release from git tag
   - Publishes release notes to GitHub UI
   - Marks pre-releases appropriately
   - Automatically triggers Publish workflow via `release: [published]` event

## Version Bumping Logic

### Production Branch (main)

Each push to main triggers version determination:

- **Only `feat:`, `fix:`, `perf:`, `refactor:`, or breaking commits** trigger a new release
- **`chore:` and `docs:` only** → no release
- **Version format**: MAJOR.MINOR.PATCH (e.g., 1.0.0, 1.1.0, 2.0.0)

Example sequence:

```
main:   1.0.0
        ├─ chore: update deps          → no release
        ├─ fix: clarify error message  → 1.0.1
        ├─ feat: add new option        → 1.1.0
        ├─ docs: update README         → no release
        ├─ feat!: remove deprecated API → 2.0.0
        └─ perf: optimize indexing     → 2.0.1
```

### Pre-release Branches (beta, alpha)

Commits to beta or alpha create pre-release versions:

- **Pre-release format**: MAJOR.MINOR.PATCH-BRANCH.N (e.g., 1.0.0-beta.1, 1.0.0-alpha.2)
- **Sequential counter** increments per branch and base version
- **Branch-specific**: beta releases are independent from alpha releases

Example sequence:

```
beta:   1.0.0-beta.1
        ├─ fix: improve logging       → 1.0.0-beta.2
        ├─ feat: add validation       → 1.0.0-beta.3
        └─ chore: deps                → (no release)

alpha:  1.0.0-alpha.1
        ├─ feat: experimental feature → 1.0.0-alpha.2
        ├─ fix: bugs                  → 1.0.0-alpha.3
        └─ etc.
```

### Three-Branch Merge Strategy

Merging pre-release branches to production branches produces the next production version:

```
alpha → beta:     v1.0.0-alpha.3 merged → creates v1.0.0-beta.1 (not alpha)
beta → main:      v1.0.0-beta.5 merged → creates v1.0.0 (not pre-release)
```

When beta is merged to main with commits that include `feat:` or breaking changes:

```
beta:   1.0.0-beta.5 (based on 1.0.0 without pre-release)
        ├─ feat: new feature          → main receives this
        └─ merge to main              → 1.1.0 (minor bump, production)
```

## GitHub Release Creation and Triggers

### Release Creation Process

1. **semantic-release creates git tag**
   - Tag name: `v<version>` (e.g., `v1.2.3`, `v1.0.0-beta.1`)
   - Tag message: Release notes with formatted changelog
   - Tag is signed by the github-actions[bot] user

2. **semantic-release creates GitHub Release**
   - Creates a formal GitHub Release from the git tag
   - Release page displays:
     - Title: "Version X.Y.Z" or "Version X.Y.Z-beta.N"
     - Formatted release notes (Features, Bug Fixes, Performance sections)
     - List of commits and authors
     - Links to pull requests and issues
     - "Pre-release" badge on beta/alpha releases
   - Release is immediately marked as published

3. **Publish workflow is triggered**
   - GitHub automatically fires the `release: [published]` event
   - All jobs in Publish workflow start immediately
   - No delay or manual intervention needed

### Why `release: [published]` Not `release: [created]`

Using `types: [published]` instead of `types: [created]` provides several benefits:

- **Draft support**: Maintainers can create draft releases for review before publishing
- **No automatic publishing**: Releases must be explicitly published (not auto-published as drafts)
- **Manual override capability**: A maintainer can choose not to publish a release, preventing automatic npm publishing
- **Clear signal**: "published" is an explicit human action, whereas "created" can happen automatically

## Safety Mechanisms

### Circular Trigger Prevention

**The Problem:** Without safeguards, the commit created by semantic-release could retrigger the Version & Handbook workflow, creating an infinite loop.

**The Solution:** The semantic-release git plugin includes `[skip ci]` in the commit message:

```
chore(release): 1.2.3 [skip ci]

✨ Features
- Add new feature

🐛 Bug Fixes
- Fix critical bug
```

When GitHub Actions sees `[skip ci]` in the commit message, it automatically skips all workflows for that commit. This is a GitHub Actions feature, not something we need to implement.

### Isolation Between Workflows

- **Version & Handbook** does not call the Publish workflow
- **Publish** is triggered only by the GitHub Release event, not by the Version & Handbook workflow
- **Failure isolation**: If the Publish workflow fails, it doesn't retrigger the Version & Handbook workflow

### Build and Test Gating

The Version & Handbook workflow includes build and test steps that must pass before any versioning:

1. `npm run build` — if this fails, workflow stops
2. `npm run test` — if this fails, workflow stops
3. Only if both pass does semantic-release run

This ensures no broken code is tagged or released.

## Permission Model

### Version & Handbook Workflow Permissions

```yaml
permissions:
  contents: write # Create commits, tags, push
  issues: write # Link issues (future)
  pull-requests: write # Link PRs (future)
```

- **contents: write** allows semantic-release to:
  - Push the version commit back to the branch
  - Create git tags
  - Create GitHub Releases

- **issues: write** and **pull-requests: write** are reserved for future enhancements (e.g., linking issues or PRs in release notes)

### Publish Workflow Permissions

```yaml
permissions:
  packages: write # Publish to GitHub Packages
  contents: read # Read source code
```

- **packages: write** allows npm publish to succeed
- **contents: read** is sufficient for checkout and build (no commits needed)

### GITHUB_TOKEN

Both workflows use `secrets.GITHUB_TOKEN` (Version & Handbook) or `GITHUB_TOKEN` env var (Publish):

- Automatically provided by GitHub Actions
- Scoped to the current repository
- Permissions limited to the `permissions:` block in each workflow
- Expires after workflow completes
- No manual secret management needed

## Error Handling and Retry Strategies

### Build or Test Failure

**If `npm run build` fails:**

- Version & Handbook workflow stops
- No versioning, no commit, no tag, no release
- Error output is visible in GitHub Actions UI
- Developer must fix the code and re-push to retry

**If `npm run test` fails:**

- Same as build failure
- Ensures no broken code is released

**No automatic retries:** The workflow fails once and stops. A developer must push a fix to retry.

### Semantic-Release Failure

**If semantic-release encounters an error:**

- Workflow logs the error
- No version commit is created
- No git tag is created
- No GitHub Release is created
- Publish workflow is not triggered

**Common causes:**

- Git configuration missing (resolved by "Configure Git" step)
- No commits since last tag (no release, workflow succeeds)
- GitHub API error (GitHub Actions automatically retries)

**Manual intervention:** Developer must investigate logs and potentially run semantic-release locally to diagnose.

### Publish Failure

**If npm publish fails:**

- Publish workflow stops
- Package is not published to GitHub Packages
- Error output is visible in GitHub Actions UI
- Version & Handbook workflow is not affected (already completed)

**Common causes:**

- Authentication failure (check GITHUB_TOKEN and permissions)
- Package already published (manually delete version from GitHub Packages and retry)
- npm registry unreachable (retry manually or wait for GitHub infrastructure recovery)

**Retry strategy:**

1. Fix the underlying issue (e.g., restore permissions)
2. Manually re-run the Publish workflow from the GitHub Actions UI
3. Or, create a new release from an existing tag to retrigger the workflow

## Integration with Handbook Generation

### Handbook Generation Timing

The handbook PDF is generated as part of the Version & Handbook workflow, **after** build and test but **before** semantic-release commits changes:

```
Build & Test
    ↓
Generate Handbook PDF
    ↓
semantic-release (analyzes commits)
    ↓
Update package.json, CHANGELOG.md, handbook.pdf
    ↓
Commit all changes [skip ci]
    ↓
Create git tag
    ↓
Create GitHub Release
```

### Handbook PDF Inclusion

The handbook PDF is included in the version commit:

1. `npm run handbook build` generates `kiro-spec-handbook.pdf` (or configured location)
2. Handbook PDF is added to the semantic-release git plugin's assets list
3. Handbook is committed alongside package.json and CHANGELOG.md
4. PDF is tagged and available in the git repository and GitHub Release

### Handbook and Versioning

- The handbook PDF reflects the current state of specs at release time
- PDF is versioned with the npm package (same version number)
- Handbook can be retrieved from any release tag: `git show v1.2.3:kiro-spec-handbook.pdf`
- GitHub Release assets include the handbook PDF (if configured)

## Correctness Properties

### Property 0: Workflow Automation Not Suitable for Property-Based Testing

This specification does not define formal correctness properties because it describes workflow automation (Infrastructure-as-Code), not a pure function with universal logical properties. Correctness is verified through integration testing and manual validation as described in Testing Strategy.

**Validates: Requirements 1.1 through 15.5 (N/A - PBT does not apply)**

Property-based testing is not applicable because:

1. **Infrastructure-as-Code**: The workflows are declarative automation, not pure functions with inputs/outputs
2. **No universal properties**: Release workflows have deterministic external effects (create tags, publish to npm) that don't benefit from randomization
3. **Deterministic external behavior**: Each release should happen exactly once per version; there's no property that holds "for all" arbitrary inputs

Correctness verification uses:

- **Smoke tests**: Verify workflow YAML is valid and jobs are defined
- **Integration tests**: Run workflows on test branches and verify artifacts
- **Example-based testing**: Feature releases, pre-releases, no-releases, breaking changes
- **Manual verification**: Confirm releases in GitHub UI and packages in GitHub Packages

## Testing Strategy

### Unit Testing

Unit tests are run as part of the Version & Handbook workflow before any versioning:

- All tests in `npm run test` must pass
- vitest is configured to run once (not watch mode)
- Tests cover:
  - Individual modules (scanner, metadata, indexer, etc.)
  - PDF rendering and chunking
  - Markdown parsing and linking
  - SVG discovery and figure numbering

### Integration Testing

Integration tests verify the full release workflow:

**Test scenarios:**

1. Push to main with `feat:` → version bump, release creation, publish triggers
2. Push to beta with `fix:` → pre-release version, correct beta counter
3. Push with `chore:` only → no release
4. Push with `feat!:` → major version bump
5. Merge beta to main → produces non-prerelease version

**Execution:** These are validated by running the actual workflows on a test branch or in a staging repository.

### Handbook Generation Testing

The handbook generation is tested as part of the project's normal build:

- `npm run handbook build` must succeed without errors
- Handbook PDF must be valid and readable
- Handbook must include all specs, requirements, tasks, and diagrams

**Note:** Handbook generation is run in the Version & Handbook workflow as a production step. Failures are logged but may not block the release if configured as non-critical.

## Error Handling

### Build Failures

**Detection:** `npm run build` returns non-zero exit code

**Response:**

- Version & Handbook workflow stops immediately
- No subsequent steps execute (semantic-release does not run)
- GitHub Actions UI displays red ✗ on the workflow run
- Error logs are captured and visible in the "Build" step output

**User Impact:** Developer sees failed workflow, reviews build error, must fix and re-push to retry

**Recovery:** Fix TypeScript compilation errors or build script issues, commit and push to trigger workflow again

### Test Failures

**Detection:** `npm run test` returns non-zero exit code

**Response:**

- Version & Handbook workflow stops immediately
- semantic-release never runs
- No versioning, commit, tag, or release is created
- GitHub Actions UI displays red ✗, test output visible

**User Impact:** Clear signal that code quality is insufficient for release; developer must fix failing tests

**Recovery:** Fix test failures locally, verify with `npm run test`, commit and push to retry

### Semantic-Release Failure

**Detection:** `npx semantic-release` command exits with error code

**Possible causes:**

- Git configuration missing (resolved by "Configure Git" step in normal cases)
- No commits since last tag (successful no-op, no release)
- Insufficient GitHub API permissions (check GITHUB_TOKEN and workflow permissions)
- Network error reaching GitHub API (GitHub Actions automatically retries)

**Response:**

- Workflow logs the error message
- No version commit is created
- No git tag is created
- No GitHub Release is created
- Publish workflow is not triggered

**User Impact:** Workflow shows red ✗, developer reviews semantic-release error logs

**Recovery:**

1. Review error in workflow logs
2. Fix underlying issue (permissions, git config, etc.)
3. Push a new commit or manually re-run workflow from GitHub Actions UI

### Publish Failure

**Detection:** `npm publish` returns non-zero exit code

**Possible causes:**

- Authentication failure (GITHUB_TOKEN not provided or insufficient permissions)
- Package already published at same version (version conflict)
- npm registry unreachable (temporary network issue)
- Disk full or other infrastructure issue

**Response:**

- Publish workflow stops
- Package is not published to GitHub Packages
- Error is logged and visible in GitHub Actions UI
- Version & Handbook workflow is not affected (already completed)

**User Impact:** npm package is not available, but git tag and GitHub Release exist

**Recovery:**

1. Fix underlying issue (restore permissions, delete existing version if needed, etc.)
2. Manually re-run Publish workflow from GitHub Actions UI
3. Alternatively, create a new release from the existing tag to retrigger Publish workflow

### Handbook Generation Failure

**Detection:** `npm run handbook build` exits with error code

**Possible causes:**

- Missing optional tools (Pandoc, LaTeX, SVG converters)
- Spec files have errors (invalid markdown, missing diagrams)
- Insufficient disk space for PDF generation

**Response:**

- If failure is **critical**: Workflow stops, no release created
- If failure is **non-critical** (e.g., missing optional tools): Workflow logs warning and continues (handbook skipped, release proceeds)

**User Impact:**

- Critical failure: Developers see failed workflow, must fix specs or install tools
- Non-critical failure: Warning in logs, release proceeds without handbook

**Recovery:**

- Critical: Fix spec errors or install missing tools, push again
- Non-critical: Install optional tools and regenerate handbook manually or re-run workflow

### Circular Trigger Prevention

**Safety mechanism:** The `[skip ci]` flag in semantic-release commit messages

**How it works:**

1. semantic-release creates commit: `chore(release): 1.2.3 [skip ci]`
2. Git pushes this commit to the branch
3. GitHub Actions sees `[skip ci]` in commit message
4. GitHub Actions skips all workflows for that commit
5. Version & Handbook workflow does not re-run

**Result:** No infinite loops, deterministic release process

**Failure mode:** If `[skip ci]` is accidentally removed from the commit message, the workflow could loop. This is prevented by semantic-release's built-in commit message generation.

## Example Release Scenarios

### Scenario 1: Feature Release to Production

```
Developer commits:
  - fix: resolve parsing error
  - feat: add batch endpoint
  - docs: update README

Push to main:
  1. Version & Handbook workflow triggers
  2. Build & test pass
  3. semantic-release analyzes commits
     - Sees "feat:" → minor bump (1.0.0 → 1.1.0)
  4. Updates:
     - package.json version → 1.1.0
     - CHANGELOG.md adds Features section with batch endpoint
     - Handbook PDF regenerated
  5. Commits: chore(release): 1.1.0 [skip ci]
  6. Creates tag: v1.1.0
  7. Creates GitHub Release with formatted notes

Result:
  - GitHub Release available at https://github.com/just-ak/.../releases/tag/v1.1.0
  - Publish workflow triggered
  - npm publish to GitHub Packages (@just-ak/kiro-spec-handbook@1.1.0)
```

### Scenario 2: Beta Pre-Release

```
Developer commits:
  - fix: improve error handling
  - feat: experimental async API (beta feature)

Push to beta:
  1. Version & Handbook workflow triggers (on beta branch)
  2. Build & test pass
  3. semantic-release analyzes commits
     - Sees "feat:" → minor bump in pre-release (1.0.0-beta.5 → 1.1.0-beta.1)
  4. Updates:
     - package.json version → 1.1.0-beta.1
     - CHANGELOG.md adds "Pre-release: 1.1.0-beta.1"
     - Handbook PDF regenerated
  5. Commits: chore(release): 1.1.0-beta.1 [skip ci]
  6. Creates tag: v1.1.0-beta.1
  7. Creates GitHub Release marked as "Pre-release"

Result:
  - GitHub Release available but marked "Pre-release"
  - Publish workflow triggered
  - npm publish to GitHub Packages (@just-ak/kiro-spec-handbook@1.1.0-beta.1)
  - Consumers can opt-in: npm install @just-ak/kiro-spec-handbook@latest --pre
```

### Scenario 3: Documentation Only (No Release)

```
Developer commits:
  - docs: clarify config option

Push to main:
  1. Version & Handbook workflow triggers
  2. Build & test pass
  3. semantic-release analyzes commits
     - Sees "docs:" only → no release
  4. Workflow completes successfully but creates no version/commit/tag/release

Result:
  - No GitHub Release created
  - Publish workflow is not triggered
  - No npm publish
  - Handbook PDF is not regenerated (unchanged)
```

### Scenario 4: Breaking Change

```
Developer commits:
  - feat!: remove deprecated config API

Push to main:
  1. Version & Handbook workflow triggers
  2. Build & test pass
  3. semantic-release analyzes commits
     - Sees "!" (breaking change) → major bump (1.1.0 → 2.0.0)
  4. Updates:
     - package.json version → 2.0.0
     - CHANGELOG.md adds "BREAKING CHANGE" section
     - Handbook PDF regenerated
  5. Commits: chore(release): 2.0.0 [skip ci]
  6. Creates tag: v2.0.0
  7. Creates GitHub Release with breaking change warning

Result:
  - GitHub Release available at v2.0.0
  - Publish workflow triggered
  - npm publish to GitHub Packages (@just-ak/kiro-spec-handbook@2.0.0)
  - Consumers see breaking change in release notes
```

## Diagram References

See the following diagrams for visual representations:

- **[FIG-workflow-overview]** — Complete process flow from developer push through npm publishing
- **[FIG-workflow-state-machine]** — State transitions and error paths during release automation
- **[FIG-branch-strategy]** — Three-branch (main/beta/alpha) versioning and merge strategy
