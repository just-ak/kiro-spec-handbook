---
spec_id: SPEC-TWO-WORKFLOW-RELEASE
title: Two-Workflow Release Process
version: "1.0"
status: draft
---

# Implementation Plan: Two-Workflow Release Process

## Overview

This implementation plan converts the two-workflow release process design into a series of configuration, testing, and validation tasks. The existing workflows have been split into `version-and-handbook.yml` (renamed from `release.yml`) and `publish.yml`. Tasks focus on validating current configurations, integrating handbook generation, testing workflows locally and in CI, documenting the release process, and training the team on the new workflow.

Implementation follows a layered approach:

1. **Configuration validation** — Verify workflow YAML syntax and semantic-release configuration
2. **Git and permissions setup** — Configure git credentials and workflow permissions
3. **Handbook integration** — Wire handbook PDF generation into the release process
4. **Local testing** — Run workflows on test branches to validate automation
5. **CI testing** — Verify workflows in GitHub Actions environment
6. **Documentation** — Create comprehensive release process guides
7. **Team training** — Document branching strategy and common release scenarios

## Tasks

- [ ] 1. Validate workflow YAML configuration and syntax
  - [ ] 1.1 Validate version-and-handbook.yml YAML syntax and structure
    - Check workflow file is valid YAML with no parsing errors
    - Verify all top-level sections present (`name`, `on`, `permissions`, `jobs`)
    - Verify jobs and steps are properly nested and structured
    - _Requirements: 1.1, 13.1_

  - [ ] 1.2 Validate publish.yml YAML syntax and structure
    - Check workflow file is valid YAML with no parsing errors
    - Verify trigger event is `release: types: [published]`
    - Verify permissions are scoped correctly (packages: write, contents: read)
    - _Requirements: 8.1, 9.1, 13.2_

  - [ ] 1.3 Verify version-and-handbook.yml trigger events
    - Confirm push trigger includes branches: [main, beta, alpha]
    - Confirm workflow_dispatch trigger is present for manual execution
    - Test that push to feature branches does NOT trigger workflow
    - Test that push to main/beta/alpha DOES trigger workflow
    - _Requirements: 1.2, 12.1, 13.1_

  - [ ] 1.4 Verify publish.yml trigger event configuration
    - Confirm release: types: [published] is present (not [created])
    - Verify trigger only fires on published releases, not drafts
    - Document why [published] is used instead of [created]
    - _Requirements: 6.3, 8.1, 13.2_

- [ ] 2. Validate semantic-release configuration (.releaserc.json)
  - [ ] 2.1 Verify .releaserc.json syntax and structure
    - Parse JSON file and confirm no syntax errors
    - Verify all required plugin sections are present
    - Check plugin versions and dependencies are available
    - _Requirements: 2.1, 2.6_

  - [ ] 2.2 Validate commit analyzer configuration
    - Verify preset is "conventionalcommits"
    - Confirm release rules for feat, fix, perf, refactor, chore, docs
    - Verify BREAKING CHANGE keywords are recognized
    - Document version bump rules (feat → minor, fix → patch, etc.)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [ ] 2.3 Validate release notes generator configuration
    - Verify preset is "conventionalcommits"
    - Confirm section headers (✨ Features, 🐛 Bug Fixes, ⚡ Performance, ♻️ Refactoring)
    - Test generated release notes format with sample commits
    - _Requirements: 4.3_

  - [ ] 2.4 Validate changelog plugin configuration
    - Verify CHANGELOG.md file path is correct
    - Test that existing changelog entries are preserved
    - Confirm new entries are prepended with version header and date
    - _Requirements: 4.3, 4.4_

  - [ ] 2.5 Validate npm plugin configuration
    - Verify pkgRoot is "." (not monorepo)
    - Confirm publish: false (npm publishing delegated to Publish workflow)
    - Check that package.json and package-lock.json are updated
    - _Requirements: 4.1, 4.2_

  - [ ] 2.6 Validate git plugin configuration
    - Verify commit message includes [skip ci] flag to prevent circular triggers
    - Confirm assets list includes package.json, package-lock.json, CHANGELOG.md
    - Add handbook PDF to assets list if not present
    - _Requirements: 5.1, 5.4, 10.1_

  - [ ] 2.7 Validate GitHub plugin configuration
    - Verify GitHub Release creation is enabled
    - Confirm pre-release labels are set for beta/alpha releases
    - Test that releases appear in GitHub UI with proper formatting
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 2.8 Validate branch configuration
    - Verify main branch creates production releases (no pre-release tag)
    - Verify beta branch creates pre-releases with -beta.N suffix
    - Verify alpha branch creates pre-releases with -alpha.N suffix
    - _Requirements: 2.6, 15.1, 15.2, 15.3_

- [ ] 3. Configure Git credentials and permissions in workflows
  - [ ] 3.1 Verify git user configuration in version-and-handbook.yml
    - Confirm git config step sets user.email to github-actions[bot]
    - Confirm git config step sets user.name to github-actions[bot]
    - Verify these settings are needed for semantic-release to commit
    - _Requirements: 5.1_

  - [ ] 3.2 Verify workflow file permissions for Version & Handbook workflow
    - Confirm permissions block includes contents: write
    - Verify contents: write allows committing, tagging, and pushing
    - Confirm issues: write and pull-requests: write are present for future use
    - _Requirements: 11.1_

  - [ ] 3.3 Verify workflow file permissions for Publish workflow
    - Confirm permissions include packages: write (for GitHub Packages)
    - Confirm permissions include contents: read (for checkout)
    - Verify permissions are minimal and appropriate
    - _Requirements: 11.2_

  - [ ] 3.4 Verify GITHUB_TOKEN is used correctly in both workflows
    - Confirm Version & Handbook workflow passes GITHUB_TOKEN to semantic-release
    - Confirm Publish workflow sets NODE_AUTH_TOKEN from GITHUB_TOKEN
    - Verify GITHUB_TOKEN is scoped appropriately by workflow permissions
    - _Requirements: 11.3_

  - [ ] 3.5 Test git config and token authentication locally
    - Run git config commands and verify output
    - Test that semantic-release can authenticate with mocked GITHUB_TOKEN
    - Document any issues or permission gaps
    - _Requirements: 5.1, 11.3_

- [ ] 4. Wire handbook generation into release workflow
  - [ ] 4.1 Identify handbook generation script and location
    - Locate npm run handbook command or equivalent build step
    - Verify handbook build outputs to correct location
    - Document handbook output path and naming convention
    - _Requirements: 7.1, 7.2_

  - [ ] 4.2 Add handbook generation step to version-and-handbook.yml
    - Insert handbook generation step after tests but before semantic-release
    - Use `npm run handbook build` or configured command
    - Capture and log handbook generation output
    - _Requirements: 7.1_

  - [ ] 4.3 Add handbook PDF to semantic-release git plugin assets
    - Update .releaserc.json git plugin assets to include handbook PDF path
    - Verify handbook PDF will be committed alongside package.json and CHANGELOG.md
    - Test that handbook.pdf is included in version commit
    - _Requirements: 7.3_

  - [ ] 4.4 Configure handbook error handling (non-critical failures)
    - Determine if handbook generation failures should block release
    - If non-critical, add error handling to continue on handbook failure
    - If critical, ensure handbook failures prevent release
    - Document decision in workflow comments
    - _Requirements: 7.4_

  - [ ] 4.5 Test handbook inclusion in GitHub Release assets
    - Verify handbook PDF appears in GitHub Release downloads
    - Confirm handbook version matches release version
    - Test handbook PDF is readable and valid
    - _Requirements: 6.2, 7.2, 7.3_

- [ ] 5. Prevent circular trigger loops with [skip ci]
  - [ ] 5.1 Verify [skip ci] flag is in semantic-release commit message
    - Confirm .releaserc.json git plugin message includes [skip ci]
    - Test that commits with [skip ci] do NOT retrigger workflows
    - Document GitHub Actions behavior with [skip ci] flag
    - _Requirements: 10.1, 10.2_

  - [ ] 5.2 Test circular trigger prevention
    - Manually trigger version-and-handbook.yml on test branch
    - Verify semantic-release creates commit with [skip ci]
    - Confirm workflow does NOT retrigger on version commit
    - Check GitHub Actions run history for only one execution
    - _Requirements: 10.1, 10.2_

  - [ ] 5.3 Verify workflow isolation between Version & Handbook and Publish
    - Confirm Version & Handbook workflow does not directly call Publish workflow
    - Verify Publish workflow is triggered only by release: [published] event
    - Document that workflows are independent and event-driven
    - _Requirements: 10.3, 10.4_

- [ ] 6. Test workflows locally with act (GitHub Actions emulator)
  - [ ] 6.1 Set up act environment and test runner
    - Install act tool locally or document installation steps
    - Configure act to use ubuntu-latest image
    - Create test repository or use feature branch
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ] 6.2 Run version-and-handbook.yml locally with act on test branch
    - Create test commits with conventional commit messages (feat, fix, docs)
    - Run `act push -b test-branch` to simulate push to test branch
    - Verify build and test steps complete successfully
    - Check workflow logs for semantic-release output
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ] 6.3 Test feature release scenario locally
    - Create commit with `feat: add new feature` message
    - Run workflow with act
    - Verify semantic-release detects minor version bump
    - Confirm package.json version is updated in logs
    - _Requirements: 2.2, 4.1_

  - [ ] 6.4 Test bug fix release scenario locally
    - Create commit with `fix: resolve parsing error` message
    - Run workflow with act
    - Verify semantic-release detects patch version bump
    - Confirm version update in logs
    - _Requirements: 2.3, 4.1_

  - [ ] 6.5 Test documentation-only scenario locally
    - Create commit with `docs: update README` message
    - Run workflow with act
    - Verify semantic-release does NOT create release
    - Confirm no version bump occurs
    - _Requirements: 2.5_

  - [ ] 6.6 Test breaking change scenario locally
    - Create commit with `feat!: remove deprecated API` message
    - Run workflow with act
    - Verify semantic-release detects major version bump
    - Confirm major version increment in logs
    - _Requirements: 2.4_

  - [ ] 6.7 Test pre-release scenarios locally with beta and alpha branches
    - Create commits on beta branch with feat/fix messages
    - Run act for beta push
    - Verify pre-release version format (e.g., 1.0.0-beta.1)
    - Repeat for alpha branch
    - _Requirements: 2.6, 15.2, 15.3_

- [ ] 7. Validate workflows in GitHub Actions CI environment
  - [ ] 7.1 Create test branches in GitHub (test-main, test-beta, test-alpha)
    - Push empty commits or documentation changes to test branches
    - Verify workflows trigger correctly on each branch
    - Monitor GitHub Actions UI for workflow execution
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 7.2 Test version-and-handbook.yml trigger on push to test-main
    - Push commit with `feat: test feature` message to test-main
    - Monitor workflow execution in GitHub Actions
    - Verify build and test steps pass
    - Check semantic-release output in logs
    - _Requirements: 1.2, 3.1, 3.4, 3.5_

  - [ ] 7.3 Test [skip ci] prevents re-triggering version-and-handbook.yml
    - Let workflow complete on test-main
    - Verify GitHub Actions run history shows exactly one run
    - Confirm version commit with [skip ci] did NOT retrigger workflow
    - Document behavior for team
    - _Requirements: 5.1, 10.2_

  - [ ] 7.4 Test publish.yml is triggered by GitHub Release published event
    - Manually create draft release in GitHub UI (not published)
    - Verify Publish workflow does NOT trigger
    - Publish the release
    - Verify Publish workflow is triggered
    - Check GitHub Packages for published version
    - _Requirements: 6.3, 8.1_

  - [ ] 7.5 Test end-to-end release flow on test-main branch
    - Create feature branch with meaningful commits
    - Merge to test-main via PR
    - Verify Version & Handbook workflow runs
    - Verify version is incremented correctly
    - Verify GitHub Release is created
    - Verify Publish workflow runs and publishes to GitHub Packages
    - _Requirements: 1.1, 1.3, 1.4, 3.3, 3.4, 3.5, 6.3, 8.1, 9.1_

  - [ ] 7.6 Test manual workflow dispatch trigger
    - Go to GitHub Actions tab
    - Click "Run workflow" button on Version & Handbook workflow
    - Select test branch
    - Verify workflow runs manually
    - Check logs for successful execution
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 8. Test three-branch release strategy integration
  - [ ] 8.1 Test alpha branch pre-release creation and versioning
    - Push features to alpha branch
    - Verify alpha releases use -alpha.N format (e.g., 1.0.0-alpha.1)
    - Confirm alpha counter increments correctly
    - _Requirements: 15.3, 15.4_

  - [ ] 8.2 Test beta branch pre-release creation and versioning
    - Push features to beta branch
    - Verify beta releases use -beta.N format (e.g., 1.0.0-beta.1)
    - Confirm beta counter increments correctly
    - _Requirements: 15.2, 15.4_

  - [ ] 8.3 Test merge from alpha to beta produces beta release (not alpha)
    - Create release on alpha branch (e.g., 1.0.0-alpha.3)
    - Merge alpha to beta
    - Verify beta release is created and tagged correctly
    - Confirm version is not -alpha but -beta.1 (new pre-release type)
    - _Requirements: 15.5_

  - [ ] 8.4 Test merge from beta to main produces production release
    - Create release on beta branch (e.g., 1.0.0-beta.5)
    - Merge beta to main
    - Verify main creates production release (1.0.0 or higher, no pre-release suffix)
    - Confirm Publish workflow publishes production release
    - _Requirements: 15.1, 15.5_

- [ ] 9. Validate build and test gating in workflows
  - [ ] 9.1 Verify npm run build step is included and runs correctly
    - Confirm version-and-handbook.yml includes `npm run build` step
    - Test that build failures cause workflow to stop
    - Verify no versioning occurs if build fails
    - _Requirements: 3.2, 3.3, 3.5_

  - [ ] 9.2 Verify npm run test step is included and runs correctly
    - Confirm version-and-handbook.yml includes `npm run test` step
    - Test that test failures cause workflow to stop
    - Verify no versioning occurs if tests fail
    - _Requirements: 3.4, 3.5_

  - [ ] 9.3 Verify Publish workflow also builds before publishing
    - Confirm publish.yml includes `npm run build` step
    - Test that build failures prevent npm publish
    - _Requirements: 8.4_

  - [ ] 9.4 Verify full git history is available for semantic-release
    - Confirm version-and-handbook.yml uses fetch-depth: 0
    - Test that semantic-release has access to all commits and tags
    - Verify version determination works across entire git history
    - _Requirements: 3.1, 3.4_

- [ ] 10. Test error scenarios and error reporting
  - [ ] 10.1 Test workflow failure reporting for build errors
    - Create a commit that causes build failure (e.g., TypeScript error)
    - Push to test branch
    - Verify workflow fails with clear error message
    - Confirm no version is created
    - Check GitHub Actions UI shows red ✗
    - _Requirements: 3.5, 14.2, 14.4_

  - [ ] 10.2 Test workflow failure reporting for test errors
    - Create a commit that breaks a test
    - Push to test branch
    - Verify workflow fails after test step
    - Confirm no version is created
    - Check error logs are visible in GitHub Actions UI
    - _Requirements: 3.5, 14.2, 14.4_

  - [ ] 10.3 Test semantic-release failure logging
    - Simulate semantic-release failure or check existing error handling
    - Verify error message is logged to GitHub Actions
    - Confirm workflow stops gracefully
    - Document common semantic-release errors for team
    - _Requirements: 14.1, 14.3_

  - [ ] 10.4 Test publish failure scenario
    - Manually trigger publish to GitHub Packages and let it fail
    - Or simulate publish failure in GitHub Actions
    - Verify publish failure does not retrigger Version & Handbook workflow
    - Confirm error is logged but isolated from other workflows
    - _Requirements: 14.2, 14.4_

  - [ ] 10.5 Test workflow logs capture useful information
    - Run successful workflow and review logs
    - Verify logs show: commits analyzed, version determined, files modified, tag created, release created
    - Confirm logs are human-readable and actionable
    - _Requirements: 14.1, 14.3_

- [ ] 11. Checkpoint - Verify all workflow components are functional
  - Ensure all tests pass, workflows trigger correctly, and error handling works as expected.
  - Run one complete end-to-end release cycle and verify all stages complete successfully.
  - Ask the user if questions arise.

- [ ] 12. Create comprehensive release process documentation
  - [ ] 12.1 Create RELEASE_WORKFLOW.md with workflow overview and architecture
    - Document the two-workflow architecture (Version & Handbook + Publish)
    - Explain the push → version → publish flow
    - Include diagrams showing workflow triggers and data flow
    - Document trigger events and permissions
    - _Requirements: 1.1, 13.1, 13.2, 14.1_

  - [ ] 12.2 Create branching strategy guide
    - Document three-branch strategy (main, beta, alpha)
    - Explain when to use each branch
    - Show example merge flows (alpha → beta → main)
    - Document pre-release versioning format
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

  - [ ] 12.3 Create conventional commits guide for developers
    - Document commit message format and prefixes (feat, fix, perf, refactor, chore, docs)
    - Explain how each prefix affects versioning
    - Show examples of breaking changes (feat! or BREAKING CHANGE footer)
    - Include common commit message patterns
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 12.4 Create release scenarios documentation
    - Document 5+ common release scenarios with examples
    - Scenario 1: Feature release (feat commits)
    - Scenario 2: Bug fix release (fix commits)
    - Scenario 3: No release (docs/chore only)
    - Scenario 4: Breaking change release (feat!)
    - Scenario 5: Pre-release to beta
    - Scenario 6: Beta to production
    - _Requirements: 2.1 through 15.5_

  - [ ] 12.5 Create troubleshooting guide for common release issues
    - Document common failure scenarios and solutions
    - Include: build failures, test failures, GitHub API errors, authentication issues
    - Provide steps to manually retry or recover from failures
    - Include links to GitHub Actions logs and error messages
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ] 12.6 Create handbook PDF generation reference
    - Document how handbook PDF is generated as part of release
    - Explain handbook inclusion in version commit and GitHub Release assets
    - Document handbook generation failure handling
    - Show how to retrieve handbook PDF from releases
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 12.7 Create npm publishing and package distribution guide
    - Document GitHub Packages registry and scope (@just-ak/kiro-spec-handbook)
    - Show how to install published packages
    - Explain pre-release installation (npm install @just-ak/kiro-spec-handbook@latest --pre)
    - Document package versioning and retrieval
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 12.8 Create GitHub Release review and publishing guide
    - Document how maintainers review and publish releases
    - Explain publish vs. draft state and why it matters for Publish workflow
    - Show how to edit release notes before publishing
    - Document rollback procedures if needed
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2_

- [ ] 13. Create team training materials
  - [ ] 13.1 Create quick-start guide for developers
    - 1-page guide on how releases work automatically
    - Explain PR-based workflow and merge-triggered releases
    - Show conventional commit examples
    - Link to detailed documentation
    - _Requirements: 1.1, 1.2_

  - [ ] 13.2 Create maintainer release checklist
    - Step-by-step checklist for reviewing and publishing releases
    - Include pre-release validation steps
    - Document when to move code from alpha → beta → main
    - Include release notes review process
    - _Requirements: 6.1, 6.2, 8.1, 8.2, 8.3, 8.4_

  - [ ] 13.3 Create diagram showing complete release flow
    - Create visual diagram of developer workflow → push → workflows → release → publish
    - Show trigger events and data flow
    - Include branch strategy (main/beta/alpha)
    - Show version numbering examples
    - _Requirements: 1.1, 13.1, 13.2, 15.1_

  - [ ] 13.4 Record or document workflow execution examples
    - Walk through successful feature release flow
    - Show GitHub Actions UI during workflow execution
    - Document notifications and status checks
    - Show GitHub Release creation and GitHub Packages publishing
    - _Requirements: 1.3, 1.4, 6.1, 8.1, 9.1_

- [ ] 14. Final checkpoint - Validate documentation and training
  - Verify all documentation is accurate, complete, and accessible.
  - Confirm team members can understand and follow the release process.
  - Ask the user if questions or clarifications are needed.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for full traceability
- Workflows are already split into version-and-handbook.yml and publish.yml; tasks focus on validation and integration
- Handbook integration is critical for requirement 7.x
- Circular trigger prevention (requirement 10.x) is already built into semantic-release via [skip ci]
- Testing tasks validate automation locally and in CI
- Documentation tasks ensure team can understand and operate the release process
- Task dependency graph shows which tasks can run in parallel

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    {
      "id": 1,
      "tasks": ["1.3", "1.4", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8"]
    },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["3.5", "4.1", "5.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "5.2", "5.3"] },
    { "id": 5, "tasks": ["4.5", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "6.7"] },
    { "id": 7, "tasks": ["7.1", "9.1", "9.2"] },
    { "id": 8, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6", "9.3", "9.4"] },
    { "id": 9, "tasks": ["8.1", "8.2", "8.3", "8.4"] },
    { "id": 10, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5"] },
    {
      "id": 11,
      "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8"]
    },
    { "id": 12, "tasks": ["13.1", "13.2", "13.3", "13.4"] }
  ]
}
```
