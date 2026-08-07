---
spec_id: SPEC-TWO-WORKFLOW-RELEASE
title: Two-Workflow Release Process
version: "1.0"
status: draft
---

# Requirements Document

## Introduction

The release process for kiro-spec-handbook consists of two coordinated GitHub Actions workflows that enforce a PR-based development model while automating version management, changelog generation, and package publication. The Version & Handbook workflow runs on push to production branches (main, beta, alpha), performs semantic versioning, generates the handbook PDF, and creates a GitHub Release. The Publish workflow is automatically triggered by the GitHub Release, builds the npm package, and publishes it to GitHub Packages. This separation of concerns ensures that versioning decisions drive publication while maintaining a deterministic, auditable release trail.

## Glossary

- **Conventional Commits**: A commit message format (e.g., `feat:`, `fix:`, `perf:`, `refactor:`) that determines version bumps per semver rules
- **semantic-release**: Automated versioning tool that analyzes commits, determines next version, updates files, creates tags, and generates release notes
- **GitHub Release**: GitHub's formal release artifact (created from a git tag) that triggers the Publish workflow
- **Version & Handbook**: The first workflow that runs on push; manages versioning, changelog, and handbook generation
- **Publish**: The second workflow triggered by GitHub Release creation; handles npm package building and publication to GitHub Packages
- **Pre-release**: A non-production release (e.g., 1.0.0-beta.1, 1.0.0-alpha.1) for beta or alpha branches
- **PR-based workflow**: Development model where all changes are made in feature branches, merged via pull requests to main/beta/alpha, and release automation is triggered on that merge
- **GitHub Packages**: GitHub's npm registry for publishing private or scoped packages

## Requirements

### Requirement 1: Enforce PR-based development and merge-triggered releases

**User Story:** As a development team, I want all changes to flow through pull requests so that every merge to main/beta/alpha can trigger an automated, auditable release.

#### Acceptance Criteria

1. WHEN changes are pushed to a feature branch THEN the Version & Handbook workflow SHALL NOT run.
2. WHEN a PR is merged to main, beta, or alpha THEN the merge commit's push SHALL trigger the Version & Handbook workflow.
3. WHEN the Version & Handbook workflow completes successfully THEN a GitHub Release SHALL be created automatically.
4. WHEN the GitHub Release is created THEN the Publish workflow SHALL be triggered automatically.

### Requirement 2: Analyze commits and determine version bump with semantic-release

**User Story:** As a release automation system, I want to analyze commit messages since the last release and determine the appropriate version bump according to semver rules.

#### Acceptance Criteria

1. WHEN the Version & Handbook workflow runs THEN semantic-release SHALL analyze all commits since the last git tag.
2. WHEN commits contain `feat:` prefixes THEN semantic-release SHALL bump the minor version (e.g., 1.0.0 → 1.1.0).
3. WHEN commits contain `fix:`, `perf:`, or `refactor:` prefixes THEN semantic-release SHALL bump the patch version (e.g., 1.0.0 → 1.0.1).
4. WHEN a commit contains `!` (e.g., `feat!:` or `BREAKING CHANGE:` footer) THEN semantic-release SHALL bump the major version (e.g., 1.0.0 → 2.0.0).
5. WHEN commits are `chore:` or `docs:` only THEN semantic-release SHALL NOT create a new version or release.
6. WHERE a push is to beta or alpha branch THEN the version SHALL be tagged as a pre-release (e.g., 1.0.0-beta.1, 1.0.0-alpha.1).

### Requirement 3: Build and test before versioning

**User Story:** As a maintainer, I want to ensure the code is buildable and tests pass before any version or release artifacts are created.

#### Acceptance Criteria

1. WHEN the Version & Handbook workflow runs THEN it SHALL checkout the repository with full git history (fetch-depth: 0).
2. WHEN checkout completes THEN it SHALL install Node.js 20 and npm dependencies.
3. WHEN dependencies are installed THEN it SHALL run `npm run build` to compile TypeScript.
4. WHEN build completes THEN it SHALL run `npm run test` to execute all test suites.
5. IF the build or tests fail THEN the Version & Handbook workflow SHALL stop and NOT proceed to versioning or release creation.

### Requirement 4: Update version in package.json and generate changelog

**User Story:** As a release system, I want to update package metadata and generate a comprehensive changelog so that both the npm package and humans have accurate version information and release notes.

#### Acceptance Criteria

1. WHEN semantic-release determines a new version THEN it SHALL update `package.json` with the new version number.
2. WHEN semantic-release updates files THEN it SHALL also update `package-lock.json` to reflect any dependency changes.
3. WHEN semantic-release processes the release THEN it SHALL generate or append to `CHANGELOG.md` with:
   - A header for the new version and release date
   - Organized sections for Features, Bug Fixes, Performance, and Refactoring
   - Commit hashes and author information
   - Links to pull requests and issues
4. WHEN changelog is generated THEN all previous changelog entries SHALL be preserved.
5. WHEN a pre-release is created THEN the changelog SHALL be marked as a pre-release (e.g., "1.0.0-beta.1").

### Requirement 5: Commit version changes and create git tag

**User Story:** As the release system, I want to record the version bump as a git commit and tag so that the release is auditable and reproducible from version control.

#### Acceptance Criteria

1. WHEN version and changelog files are updated THEN semantic-release SHALL commit these changes with the message `chore(release): <version> [skip ci]` followed by the release notes.
2. WHEN the commit is created THEN it SHALL be pushed back to the branch that triggered the release (main, beta, or alpha).
3. WHEN the commit is pushed THEN semantic-release SHALL create a git tag named `v<version>` (e.g., `v1.2.3`).
4. WHEN the tag is created THEN the tag object SHALL include the release notes as the tag message.
5. WHERE the release is a pre-release THEN the tag SHALL be named `v<version>-<prerelease>` (e.g., `v1.0.0-beta.1`).

### Requirement 6: Generate GitHub Release and trigger Publish workflow

**User Story:** As the release system, I want to create a formal GitHub Release with formatted notes so that it appears in the GitHub UI and automatically triggers the Publish workflow.

#### Acceptance Criteria

1. WHEN the git tag is created THEN semantic-release SHALL create a GitHub Release for that tag.
2. WHEN the release is created THEN the release page SHALL display:
   - Release title with version number
   - Formatted release notes (Features, Bug Fixes, Performance, etc.)
   - Link to the git tag
   - Commit hashes and author information
3. WHEN the GitHub Release is published THEN the Publish workflow (`publish.yml`) SHALL be triggered automatically via the `release: [published]` event.
4. WHERE the release is a pre-release THEN it SHALL be marked as a pre-release in GitHub UI.

### Requirement 7: Generate handbook PDF as part of versioning

**User Story:** As a release system, I want to generate an updated handbook PDF from the current specs as part of the versioning workflow so that the handbook reflects all changes at release time.

#### Acceptance Criteria

1. WHEN semantic-release determines a new version THEN the handbook generation process SHALL run (e.g., `npm run handbook build` or equivalent).
2. WHEN handbook generation completes THEN the output PDF SHALL be placed in the repository's handbook output location (e.g., `docs/handbook/kiro-spec-handbook.pdf` or root `kiro-spec-handbook.pdf`).
3. WHEN the handbook PDF is generated THEN it SHALL be included in the git commit with the version changes.
4. IF handbook generation fails THEN the Version & Handbook workflow SHALL log the error but MAY proceed with release if the failure is non-critical (e.g., missing optional tools).

### Requirement 8: Publish workflow triggered by GitHub Release

**User Story:** As the automated release system, I want the Publish workflow to run when a GitHub Release is published so that the npm package is built and published without manual intervention.

#### Acceptance Criteria

1. WHEN a GitHub Release is published (not just created) THEN the Publish workflow (`publish.yml`) SHALL be triggered via the `release: [published]` event.
2. WHEN the Publish workflow is triggered THEN it SHALL checkout the repository at the tag corresponding to the release.
3. WHEN checkout completes THEN the workflow SHALL install Node.js 20 and npm dependencies.
4. WHEN dependencies are installed THEN the workflow SHALL run `npm run build` to compile the package.
5. WHEN build completes THEN the workflow SHALL run `npm publish` with npm registry-url set to GitHub Packages.
6. IF the publish step succeeds THEN the package SHALL be available in GitHub Packages under the namespace/scope configured in `package.json` (e.g., `@just-ak/kiro-spec-handbook`).

### Requirement 9: Configure GitHub Packages authentication and registry

**User Story:** As the Publish workflow, I want to authenticate to GitHub Packages and publish the scoped package so that the npm package is available to users.

#### Acceptance Criteria

1. WHEN the Publish workflow runs THEN it SHALL set the npm registry-url to `https://npm.pkg.github.com`.
2. WHEN registry-url is set THEN the workflow SHALL use the `GITHUB_TOKEN` secret as the authentication token (NODE_AUTH_TOKEN).
3. WHEN npm publish runs THEN the package SHALL be published under the scope and name specified in `package.json` (`@just-ak/kiro-spec-handbook`).
4. WHEN publish succeeds THEN the new version SHALL be queryable from GitHub Packages (e.g., via `npm view @just-ak/kiro-spec-handbook` or the GitHub UI).

### Requirement 10: Ensure workflow isolation and no circular triggers

**User Story:** As the release system, I want to prevent the version commit created by semantic-release from re-triggering the Version & Handbook workflow so that release automation runs exactly once per push.

#### Acceptance Criteria

1. WHEN semantic-release commits version changes THEN the commit message SHALL include the `[skip ci]` flag (e.g., `chore(release): 1.0.0 [skip ci]`).
2. WHEN GitHub Actions reads the commit message with `[skip ci]` THEN the Version & Handbook workflow SHALL NOT be triggered by that commit.
3. WHEN the Publish workflow is triggered by a GitHub Release THEN it SHALL NOT trigger the Version & Handbook workflow.
4. WHEN the Version & Handbook workflow completes THEN only the Publish workflow SHALL be triggered via the GitHub Release event.

### Requirement 11: Grant necessary workflow permissions

**User Story:** As the release system, I want both workflows to have appropriate permissions so that they can read code, write releases, and publish packages without manual secret management.

#### Acceptance Criteria

1. WHEN the Version & Handbook workflow runs THEN it SHALL have permissions to:
   - `contents: write` (to commit version changes and create tags)
   - `issues: write` (to create issue comments if needed)
   - `pull-requests: write` (to create PR comments if needed)
2. WHEN the Publish workflow runs THEN it SHALL have permissions to:
   - `packages: write` (to publish to GitHub Packages)
   - `contents: read` (to checkout and read source code)
3. WHEN workflows use these permissions THEN they SHALL obtain credentials from the `GITHUB_TOKEN` secret (provided automatically by GitHub Actions).

### Requirement 12: Support manual workflow dispatch

**User Story:** As a developer, I want to manually trigger the Version & Handbook workflow from the GitHub Actions tab so that I can perform a release outside of the normal push-to-branch flow if needed.

#### Acceptance Criteria

1. WHEN viewing the repository's Actions tab THEN the Version & Handbook workflow SHALL have a "Run workflow" button.
2. WHEN "Run workflow" is clicked THEN it SHALL allow selection of the branch (main, beta, or alpha).
3. WHEN the workflow is manually dispatched THEN it SHALL follow the same steps as a push-triggered release (build, test, version, commit, tag, release).

### Requirement 13: Verify workflow configuration and trigger events

**User Story:** As a DevOps engineer, I want to confirm that both workflows have correct trigger events so that they execute at the right time.

#### Acceptance Criteria

1. WHEN the Version & Handbook workflow is configured THEN its `on` section SHALL include:
   - `push: branches: [main, beta, alpha]` to trigger on push to those branches
   - `workflow_dispatch: {}` to allow manual triggering
2. WHEN the Publish workflow is configured THEN its `on` section SHALL include:
   - `release: types: [published]` to trigger when a release is published
3. WHEN a workflow has multiple triggers THEN all triggers SHALL be mutually exclusive or designed to avoid redundant execution.

### Requirement 14: Provide clear logging and error reporting

**User Story:** As a developer debugging a release failure, I want clear logs and error messages so that I can quickly identify and fix issues.

#### Acceptance Criteria

1. WHEN either workflow runs THEN each step SHALL display its name and purpose in the GitHub Actions UI.
2. WHEN a build, test, or publish step fails THEN the logs SHALL capture and display the full error output.
3. WHEN semantic-release runs THEN it SHALL log:
   - Commits analyzed since the last release
   - Determined version bump (major/minor/patch/pre-release)
   - Files modified (package.json, CHANGELOG.md)
   - Git tag created
   - GitHub Release created
4. IF a workflow step fails THEN subsequent steps SHALL be skipped and the workflow run SHALL be marked as failed in the GitHub Actions UI.

### Requirement 15: Support three-branch release strategy

**User Story:** As a project maintainer, I want to manage production (main), beta, and alpha releases from separate branches so that I can stage releases progressively.

#### Acceptance Criteria

1. WHEN code is pushed to main THEN semantic-release SHALL create a production release (e.g., 1.0.0).
2. WHEN code is pushed to beta THEN semantic-release SHALL create a pre-release tagged beta (e.g., 1.0.0-beta.1, 1.0.0-beta.2).
3. WHEN code is pushed to alpha THEN semantic-release SHALL create a pre-release tagged alpha (e.g., 1.0.0-alpha.1, 1.0.0-alpha.2).
4. WHEN releases are created on different branches THEN the version numbering on beta and alpha SHALL be sequential (beta.1, beta.2, etc.) and distinct from main.
5. WHERE a merge from beta to main occurs THEN the main release SHALL be the next production version (not a pre-release).
