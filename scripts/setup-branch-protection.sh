# Branch Protection Setup via GitHub Web UI

Since the GitHub REST API for branch protection has limitations on certain account types, setting up branch protection via the web UI is the most reliable approach.

## Quick Setup (5 minutes)

### For `main` Branch

1. Go to: https://github.com/just-ak/kiro-spec-handbook/settings/branches
2. Click **Add rule** under "Branch protection rules"
3. In **Branch name pattern**, enter: `main`
4. Check these boxes:
   - ✅ **Require a pull request before merging**
     - Require 1 approving review
     - Dismiss stale pull request approvals
   - ✅ **Require status checks to pass before merging**
     - Require branches to be up to date before merging
     - Search for "version" (the workflow job name)
   - ✅ **Include administrators** 
5. Click **Create**

### For `beta` Branch

Repeat the same steps, but use `beta` as the branch name pattern.

### For `alpha` Branch

Repeat the same steps, but use `alpha` as the branch name pattern.

## What This Accomplishes

- ✅ Blocks direct pushes to protected branches
- ✅ Requires PR reviews before merge
- ✅ Requires status checks (Version & Handbook workflow) to pass
- ✅ Applies rules to administrators too
- ✅ Allows team to enforce development workflow

## Verification

After setup, try pushing to main:

```bash
git push origin main
```

You should see:
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: At least 1 approving review is required
```

## Why API Didn't Work

The GitHub REST API endpoint for branch protection returned 404. This can happen due to:
- Account tier limitations
- Repository specific settings
- API rate limits or temporary issues

Using the web UI is the most reliable alternative and takes just a few minutes.

