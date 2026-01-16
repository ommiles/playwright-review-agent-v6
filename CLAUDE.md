# Claude Code Review Guidelines

This repository uses Claude Code for automated Playwright test code reviews.

## Review Focus

When reviewing Playwright test code in `apps/backend-e2e/playwright/`, follow the conventions defined in:
- `apps/backend-e2e/playwright/CONVENTIONS.md`

## Key Review Priorities

### Must Fix (Blocking)
- Raw locators in test files (must use COB pattern)
- Missing `await` on async operations
- `allTextContents()` without proper waiting
- New `waitForTimeout` calls
- Assertions inside COB methods
- Duplicate locators (should reuse from base.ts)
- `test.only` or `page.pause()` left in code

### Should Fix (Non-Blocking)
- Public methods that should be private
- Missing method extraction for repeated code (3+ occurrences)
- Unnecessary `as const` assertions
- Unnecessary `.clear()` before `.fill()`
- Commented-out code

### Suggestions (Advisory)
- File size approaching guidelines
- Methods that could be more reusable
- Selectors that could be more semantic

## Review Style

- Provide **inline comments** on specific lines where issues are found
- Be concise but specific about what needs to change
- Reference the relevant CONVENTIONS.md section when applicable
- Distinguish between blocking issues and suggestions
- Do NOT block merges - this review is advisory only
