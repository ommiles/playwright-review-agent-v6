# ADR 003: Incremental Diff Checking for Synchronize Events

## Status

Accepted

## Context

When a pull request receives new commits (`synchronize` event), the workflow was previously checking the entire PR diff (base branch to head). This caused the review agent to run on every push, even if the new commits didn't touch any Playwright files.

Example scenario:
1. Commit 1: Modifies `apps/backend-e2e/playwright/tests/login.spec.ts` → Agent runs ✓
2. Commit 2: Modifies `src/components/Button.tsx` → Agent runs unnecessarily ✗
3. Commit 3: Modifies `README.md` → Agent runs unnecessarily ✗

This wasted API credits and added noise to the PR.

## Decision

Check different diffs based on the event action:

| Event Action | Diff Checked | Use Case |
|--------------|--------------|----------|
| `opened` | Full PR (base..head) | New PR with Playwright changes |
| `synchronize` | New commits only (before..after) | Subsequent pushes |
| `edited` | Full PR (base..head) | Manual re-run via checkbox |

## Implementation

```bash
if [[ "$EVENT_ACTION" == "synchronize" && -n "$BEFORE_SHA" ]]; then
  # Only check new commits
  git diff --name-only "$BEFORE_SHA" "$HEAD_SHA"
else
  # Check full PR diff
  git diff --name-only "$BASE_SHA" "$HEAD_SHA"
fi
```

GitHub provides these SHAs for `pull_request` events:
- `github.event.pull_request.base.sha` - PR base branch
- `github.event.pull_request.head.sha` - PR head (latest commit)
- `github.event.before` - Head SHA before the push (only for `synchronize`)

## Consequences

### Benefits
- Agent only runs when new commits actually touch Playwright files
- Reduces unnecessary API costs
- Less noise in PR activity

### Trade-offs
- If a developer wants to re-run the review after non-Playwright commits, they must use the checkbox
- The review won't automatically catch if new commits introduce conflicts with earlier Playwright changes

### Edge Cases
- **Force push**: `before` SHA may not exist in history; falls back to full PR diff if `BEFORE_SHA` is empty
- **Rebased commits**: Each rebased commit is technically "new," so the agent may run if any rebased commit touches Playwright files

## Related
- ADR 002: Dynamic Max-Turns Based on File Count
