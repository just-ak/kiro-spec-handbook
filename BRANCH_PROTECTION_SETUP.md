# Branch Protection Setup

To enforce the PR-based workflow, you must configure branch protection rules in GitHub.

## Steps to Enable Branch Protection

1. Go to your repository: https://github.com/just-ak/kiro-spec-handbook
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**

## Configure for `main` Branch

**Branch name pattern:** `main`

### Required Settings:

- ✅ **Require a pull request before merging**
  - Check: "Require approvals" (set to 1 minimum)
  - Check: "Dismiss stale pull request approvals when new commits are pushed"
  - Check: "Require review from Code Owners"

- ✅ **Require status checks to pass before merging**
  - Check: "Require branches to be up to date before merging"
  - Select status checks:
    - `version` (the Version & Handbook workflow job)

- ✅ **Require branches to be up to date before merging**
  - This is checked above

- ✅ **Require code reviews before merging**
  - Require 1 approval minimum

- ✅ **Require signed commits** (optional but recommended)

- ✅ **Include administrators**
  - Check: "Include administrators" to ensure admins also follow the rule

## Configure for `beta` Branch

**Branch name pattern:** `beta`

Same settings as `main` to maintain consistency.

## Configure for `alpha` Branch

**Branch name pattern:** `alpha`

Can be less strict if you want faster iteration:

- Require 1 PR approval (less strict than main)
- Require status checks to pass

## Result

With these settings:

- ✅ Direct pushes to `main`, `beta`, `alpha` are **blocked**
- ✅ All changes must go through PR
- ✅ Status checks (Version & Handbook workflow) must pass
- ✅ Code must be reviewed before merging
- ✅ After merge, semantic-release automatically creates version/release
- ✅ Release triggers Publish workflow for npm publishing

## Verification

After setup, attempting to push directly to `main` will fail with:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: At least 1 approving review is required by reviewers with write access.
```

This confirms branch protection is working correctly.
