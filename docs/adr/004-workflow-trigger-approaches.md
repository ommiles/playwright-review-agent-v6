# ADR 004: Workflow Trigger Approaches

## Status

Accepted (Checkbox approach selected)

## Context

We needed to decide when the Playwright code review workflow should run. There are several approaches with different trade-offs between automation, cost, and control.

## Options Considered

### Option 1: Auto-trigger on File Changes (Rejected)

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - 'apps/backend-e2e/playwright/**'
```

**Pros:**
- Fully automatic - no manual action required
- Reviews every relevant change
- Immediate feedback

**Cons:**
- Higher costs - runs on every push to Playwright files
- May run on WIP code that isn't ready for review
- No opt-out for simple/trivial changes

### Option 2: Checkbox in PR Description (Selected)

```yaml
on:
  pull_request_target:
    types: [edited]
```

With checkbox: `- [x] Run Playwright Code Review`

**Pros:**
- Full cost control - only runs when explicitly requested
- Developers choose when code is ready for review
- Easy to re-trigger by unchecking/rechecking
- QA or non-code PRs can skip review entirely

**Cons:**
- Requires manual action
- Developers may forget to request review
- Checkbox buried in PR description

### Option 3: Label-based Trigger

```yaml
on:
  pull_request:
    types: [labeled]
```

With label: `needs-playwright-review`

**Pros:**
- More visible than checkbox (labels shown prominently)
- Can re-trigger by removing/re-adding label
- Easy to add via GitHub UI or CLI
- Can be added by reviewers, not just PR author

**Cons:**
- Requires creating and maintaining labels
- Still requires manual action
- Label clutter if not cleaned up

### Option 4: Comment Command Trigger

```yaml
on:
  issue_comment:
    types: [created]
```

With command: `/playwright-review`

**Pros:**
- Very explicit intent
- Easy to re-trigger with new comment
- Can include parameters (e.g., `/playwright-review --focus security`)

**Cons:**
- Requires knowing the command
- Comments add noise to PR
- Need to filter for specific command text

### Option 5: Draft → Ready for Review

```yaml
on:
  pull_request:
    types: [ready_for_review]
```

**Pros:**
- Natural workflow moment - developer signals "I'm done"
- Automatic when PR is marked ready
- Single trigger per PR lifecycle stage

**Cons:**
- Not all teams use draft PRs
- Some PRs marked ready may not want review (e.g., QA PRs)
- Cannot re-trigger without converting back to draft

### Option 6: Hybrid Approach

Combine multiple triggers:
- Auto-trigger on `opened` for new PRs
- Checkbox or label for re-runs
- Comment command for follow-up questions

**Pros:**
- Flexibility for different workflows
- Auto-review for new PRs, manual for re-runs

**Cons:**
- More complex workflow logic
- Multiple trigger paths to understand
- Higher potential costs

## Decision

We chose **Option 2: Checkbox in PR Description** for maximum cost control.

## Rationale

1. **Cost savings** - Only runs when explicitly requested, avoiding charges for WIP or trivial changes
2. **Developer control** - Authors decide when code is ready for review
3. **Selective usage** - QA PRs or non-Playwright changes can skip entirely
4. **Simple implementation** - Single trigger type, straightforward logic

## Consequences

- Developers must manually check the box to request review
- PR template should include the checkbox by default (unchecked)
- Reviews won't catch issues until explicitly requested
- Re-runs require unchecking then rechecking the box

## Future Considerations

If the team finds the checkbox approach too manual, consider:
- Adding label-based trigger as alternative
- Combining with `ready_for_review` for first-time auto-review
- Using comment commands for follow-up reviews
