# Playwright Code Review Workflow

Automated code review for Playwright test changes using Claude.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                         TRIGGERS                                 │
├─────────────────────────────────────────────────────────────────┤
│  PR Opened          → Check full PR diff                        │
│  New Commits        → Check only new commits                    │
│  Checkbox Checked   → Check full PR diff (manual re-run)        │
│  @claude Comment    → Run with comment context                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PLAYWRIGHT FILES CHANGED?                     │
├─────────────────────────────────────────────────────────────────┤
│  Path: apps/backend-e2e/playwright/**                           │
│  Excludes: README.md, CONVENTIONS.md                            │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
        YES: Run Review                 NO: Skip
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DYNAMIC MAX-TURNS                           │
├─────────────────────────────────────────────────────────────────┤
│  1-10 files  → 10 turns                                         │
│  11-20 files → 20 turns                                         │
│  21-30 files → 30 turns                                         │
│  31-40 files → 40 turns                                         │
│  41+ files   → 50 turns (cap)                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE REVIEW                           │
├─────────────────────────────────────────────────────────────────┤
│  Reviews against CONVENTIONS.md standards:                       │
│  • COB pattern compliance                                       │
│  • Selector strategy                                            │
│  • Auto-waiting assertions                                      │
│  • Code reuse                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Triggers

### Automatic
- **PR Opened**: Runs when a PR is opened with Playwright file changes
- **New Commits**: Runs when new commits modify Playwright files (checks only the new commits, not the full PR)

### Manual
- **Checkbox**: Check `[x] Run Playwright Code Review` in PR description and save
- **@claude mention**: Comment `@claude <your request>` for follow-up questions

## Configuration

### Bot Identity
- **Name**: `playwright-reviewer`
- Distinguishes this agent from other Claude agents in the organization

### Authentication
Uses `secrets.GITHUB_TOKEN` (not OIDC). See [ADR 001](../../docs/adr/001-github-auth-method.md) for rationale.

### Max Turns
Scales dynamically with file count. See [ADR 002](../../docs/adr/002-dynamic-max-turns.md).

### Diff Behavior
Only checks new commits on subsequent pushes. See [ADR 003](../../docs/adr/003-incremental-diff-checking.md).

## Files

| File | Purpose |
|------|---------|
| `playwright-code-review.yml` | Main workflow definition |
| `../pull_request_template.md` | PR template with review checkbox |

## Architecture Decision Records

- [ADR 001: GitHub Auth Method](../../docs/adr/001-github-auth-method.md)
- [ADR 002: Dynamic Max-Turns](../../docs/adr/002-dynamic-max-turns.md)
- [ADR 003: Incremental Diff Checking](../../docs/adr/003-incremental-diff-checking.md)
