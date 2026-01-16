# Playwright Code Review Agent v5

Automated code review for Playwright tests using the official [Claude Code GitHub Action](https://github.com/anthropics/claude-code-action).

## Features

- **Auto-trigger**: Runs automatically when Playwright files in `apps/backend-e2e/playwright/` are modified
- **Manual re-run**: Check `[x] Run Playwright Code Review` in PR description to trigger a review
- **Interactive follow-ups**: Use `@claude` mentions in PR comments to ask questions or request changes
- **Inline comments**: Provides specific feedback on individual lines (not just a summary comment)
- **Advisory only**: Does not block merges

## How It Works

### Triggers

| Trigger | When |
|---------|------|
| Auto | PR modifies files in `apps/backend-e2e/playwright/**` |
| Manual | PR description contains `[x] Run Playwright Code Review` |
| Interactive | Comment contains `@claude` mention |

### What Gets Reviewed

The agent reviews Playwright test code against our [CONVENTIONS.md](apps/backend-e2e/playwright/CONVENTIONS.md), focusing on:

- COB (Component Object Base) pattern compliance
- Selector strategy (test-ids, roles, Ant Design exceptions)
- Auto-waiting assertions (no `allTextContents()` anti-patterns)
- Code reuse and DRY principles
- TypeScript best practices (await, visibility modifiers)

## Setup

### Prerequisites

1. Install the [Claude GitHub App](https://github.com/apps/claude) on your repository
2. Add `ANTHROPIC_API_KEY` to repository secrets

### Installation

Copy `.github/workflows/playwright-code-review.yml` to your repository.

## Usage

### Automatic Reviews

Simply open a PR that modifies Playwright files. The review will run automatically.

### Manual Re-run

Add this to your PR description:
```
- [x] Run Playwright Code Review
```

### Interactive Follow-ups

Comment on the PR with `@claude` to ask questions or request changes:
```
@claude can you explain why this selector is problematic?
@claude please suggest a better way to handle this wait
```

## Configuration

### Customizing the Review

Edit `CLAUDE.md` in the repository root to adjust review priorities and style.

### Adjusting Conventions

Update `apps/backend-e2e/playwright/CONVENTIONS.md` to change the coding standards enforced.

## Architecture

This is a **v3-v4 hybrid** approach:
- **From v3**: Path-based auto-triggering
- **From v4**: Checkbox mechanism for manual re-runs
- **New in v5**: Official Claude Code GitHub Action (replaces custom agent code)

## Comparison with Previous Versions

| Version | Trigger | Agent | Comments |
|---------|---------|-------|----------|
| v2/v3 | Path-based only | Custom SDK | Single summary |
| v4 | Checkbox only | Custom SDK | Single summary |
| **v5** | Path + Checkbox + @claude | Official Action | Inline comments |
