# Branch Protection Setup via CLI

This guide shows how to set up branch protection rules using the command line instead of the GitHub web UI.

## Prerequisites

- `curl` installed (standard on macOS and Linux)
- A GitHub personal access token with `repo` and `admin:repo_hook` scopes

## Creating a GitHub Token

1. Go to https://github.com/settings/tokens/new
2. Select scopes:
   - ✅ `repo` — Full control of private repositories
   - ✅ `admin:repo_hook` — Full control of repository hooks and webhooks
3. Click **Generate token**
4. Copy the token (you won't see it again)

## Running the Script

```bash
# Set your GitHub token
export GITHUB_TOKEN="ghp_..."

# Run the setup script
./scripts/setup-branch-protection.sh
```

## What Gets Configured

The script sets up branch protection for `main`, `beta`, and `alpha` branches with:

- ✅ **Require 1 pull request review** before merging
- ✅ **Dismiss stale reviews** when new commits are pushed
- ✅ **Require branches to be up to date** before merging (strict mode)
- ✅ **Require status checks to pass**: `version` (the Version & Handbook workflow job)
- ✅ **Enforce for administrators** — Rules apply to everyone, including admins
- ✅ **Block force pushes** — No `git push --force` to protected branches
- ✅ **Block deletions** — Cannot delete protected branches

## Verification

After running, you can verify the rules are applied:

```bash
# Check main branch protection
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/just-ak/kiro-spec-handbook/branches/main/protection

# Check beta branch protection
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/just-ak/kiro-spec-handbook/branches/beta/protection

# Check alpha branch protection
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/just-ak/kiro-spec-handbook/branches/alpha/protection
```

## Testing

Try pushing directly to main:

```bash
git push origin main
```

You should see an error:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: At least 1 approving review is required by reviewers with write access.
```

This confirms branch protection is working.

## Removing Branch Protection (if needed)

To remove protection from a branch:

```bash
curl -X DELETE \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/just-ak/kiro-spec-handbook/branches/main/protection
```

## Troubleshooting

### "Validation Failed" or "422" error

This usually means:

- The branch doesn't exist yet, or
- The GITHUB_TOKEN doesn't have admin access

### "401 Unauthorized"

Your GITHUB_TOKEN is invalid or expired. Generate a new one.

### Status check "version" not recognized

This error means the workflow hasn't run yet, so the status check doesn't exist in GitHub's system. The rule will still work once the workflow runs.

## References

- [GitHub API: Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
- [GitHub CLI: Repository Protection](https://cli.github.com/manual/gh_api)
