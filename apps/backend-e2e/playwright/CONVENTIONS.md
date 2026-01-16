# Playwright Test Conventions

> Standards enforced by our automated code review agent. Derived from code review patterns and Playwright best practices.

---

## Selector Strategy

### Philosophy: Kent C. Dodds / React Testing Library

We follow the [Testing Library guiding principles](https://testing-library.com/docs/queries/about/#priority) for selector priority. The goal is to test your app the way users interact with it.

### Priority Order

| Priority | Selector Type | When to Use |
|----------|--------------|-------------|
| **1st (Preferred)** | `getByTestId()` / `data-testid` | Always acceptable. Our default strategy. |
| **2nd (Acceptable)** | `getByRole()` | For semantic HTML elements (buttons, links, headings) |
| **3rd (Acceptable)** | `getByText()` / `getByLabel()` | When text content is stable and meaningful |
| **Last Resort** | CSS classes / DOM structure | Only for Ant Design or when test-id cannot be added |

### Rules

```typescript
// GOOD - test-id is always preferred
await page.getByTestId('submit-button').click();

// GOOD - getByRole for semantic elements
await page.getByRole('button', { name: 'Submit' }).click();

// ACCEPTABLE - Ant Design components without test-id
await page.locator('.ant-select-selector').click();

// BAD - avoid arbitrary CSS classes
await page.locator('.my-custom-class').click();
```

### Ant Design Exception

Ant Design components often don't support data-testid. Using Ant Design class selectors is acceptable **only when**:
- The component doesn't accept a data-testid prop
- We've confirmed test-id cannot be added to the application code

---

## Component Object Base (COB) Pattern

### Core Principle: No Raw Locators in Test Files

**All locators must be defined in Component Object files, not in tests.**

```typescript
// BAD - raw locator in test file
test('button test', async ({ page }) => {
  await page.locator('[data-testid="submit-btn"]').click();
});

// GOOD - use COB method
test('button test', async ({ button }) => {
  await button.submitButton().click();
});
```

### COB Location Rules

| Pattern | Location | Example |
|---------|----------|---------|
| Element locators | Component-specific COB | `button.ts`, `text-input.ts` |
| Shared locators | `base.ts` | `buttonOnCompanion()`, `labelOnPhone()` |
| Page-level locators | Page Object | `project-page.ts`, `properties-panel.ts` |
| Assertions | Test files only | `expect(button.text()).toHaveText('Submit')` |

### Page Objects vs Component Objects

**Known issue:** Our codebase currently calls everything "component objects" but some are actually **page objects** (e.g., `project-page.ts`, `properties-panel.ts`).

- **Component Object** — Represents a reusable UI component (Button, TextInput, Navigator)
- **Page Object** — Represents a page or major UI section (ProjectPage, PropertiesPanel, DesignerPage)

The agent may suggest renaming files or classes to follow this distinction. These refactors are encouraged when they improve clarity.

### Reuse Existing Locators

Before creating new locators, check:
1. `component-objects/base.ts` - common element patterns
2. Existing component COBs - may already have what you need
3. `properties-panel.ts` - property-related interactions

```typescript
// BAD - duplicating existing locator
labelOnCompanion(): Locator {
  return this.getCompanion().locator('[data-testid="label"]');
}

// GOOD - reuse from base.ts
// base.ts already has: labelOnCompanion()
```

### Assertions Stay in Tests

COB = locators + actions only. Never assertions.

```typescript
// BAD - assertion hidden in COB
async verifyNavigatorState(activeTab: string, inactiveCount: number) {
  await expect(this.activeTab()).toHaveText(activeTab);
}

// GOOD - locators in COB, assertions in test
activeTab(): Locator { return this.locator('[data-testid="active-tab"]'); }
// In test: await expect(navigator.activeTab()).toHaveText('Home');
```

**Why?** Assertions in COBs hide failure context and make tests hard to debug.

---

## Auto-Waiting & Assertions

### Use Locator Assertions (Auto-Waiting)

Playwright's `expect(locator)` assertions automatically retry until the condition is met. **Never use manual snapshots for dynamic content.**

```typescript
// BAD - one-off snapshot, no auto-wait
const texts = await projectPage.componentNameText().allTextContents();
expect(texts).toEqual(['Screen1', 'Layout1', 'Container1']);

// GOOD - auto-waiting assertion
await expect(projectPage.componentNameText()).toHaveText([
  'Screen1',
  'Layout1',
  'Container1',
]);
```

### Banned Patterns

| Pattern | Problem | Solution |
|---------|---------|----------|
| `.allTextContents()` + `expect()` | No auto-wait, flaky | `expect(locator).toHaveText([...])` |
| `waitForLoadState('networkidle')` | Unreliable, slow | Use specific locator assertions |
| `waitForTimeout(n)` | Hard-coded delay, flaky | Use `waitFor` or locator assertions |
| `page.waitForTimeout(n)` | Same issue | Same solution |

### Acceptable Wait Patterns

```typescript
// GOOD - wait for specific condition
await button.waitFor({ state: 'visible' });

// GOOD - wait for network request
await projectPage.waitForProjectSave();

// GOOD - Playwright's built-in auto-retry
await expect(element).toBeVisible();
await expect(element).toHaveText('Expected');
await expect(element).toHaveCount(3);
```

### Grandfathered `waitForTimeout`

Existing `waitForTimeout` calls in quirky UI areas are **grandfathered**. Do not:
- Add new `waitForTimeout` calls
- Refactor existing grandfathered waits unless specifically requested

---

## Code Reuse & DRY Principles

### Create Methods for Repeated Patterns

If you see the same sequence 3+ times, create a method:

```typescript
// BAD - repeated inline
await propertiesPanel.propertyInputCol('Font').click();
await propertiesPanel.selectAntOption('Roboto');
await propertiesPanel.waitForProjectSave();

// GOOD - create reusable method
async setFont(fontName: string): Promise<void> {
  await this.propertyInputCol('Font').click();
  await this.selectAntOption(fontName);
  await this.waitForProjectSave();
}
```

### Consolidate Duplicate Selectors

When you find the same selector in multiple places:

```typescript
// BAD - duplicate selector
// In navigator-base.ts:
antDropdownMenuTitleContent(): Locator { return this.page.locator('.ant-dropdown-menu-title-content'); }

// In base.ts (already exists):
antDropdownMenuTitleContent(): Locator { return this.page.locator('.ant-dropdown-menu-title-content'); }

// GOOD - use the one from base.ts
```

### Check Existing Helpers Before Creating New Ones

1. **base.ts** - `buttonOnCompanion()`, `labelOnPhone()`, `textInputOnCompanion()`, etc.
2. **properties-panel.ts** - `setVisibility()`, `propertyRowByExactLabel()`, etc.
3. **expect.ts** - `expectRoughlyEqual()`, etc.
4. **fixture-ids.ts** - `EMPTY_PROJECT`, component fixture IDs

---

## Visibility & Access Modifiers

### Use `private` for Internal Helpers

Methods only used internally within a COB should be `private`:

```typescript
// GOOD - private helper
private tablistContainer(): Locator {
  return this.page.locator('[role="tablist"]');
}

// Public method uses private helper
activeTab(): Locator {
  return this.tablistContainer().locator('[aria-selected="true"]');
}
```

### When to Use `private`

| Visibility | Use Case |
|------------|----------|
| `public` (default) | Locators/methods used by tests |
| `private` | Internal helpers, intermediate locators |
| `protected` | Base class methods for inheritance |

---

## Unnecessary Code

### Question Everything

Always ask: "Is this really needed?"

```typescript
// BAD - unnecessary clear before fill
await input.click();
await input.clear();  // Not needed - fill() handles this
await input.fill('text');

// GOOD - fill() clears automatically
await input.fill('text');
```

### Common Unnecessary Patterns

| Pattern | Why Unnecessary |
|---------|-----------------|
| `.clear()` before `.fill()` | `fill()` clears input automatically |
| `toBeVisible()` after `filter({ visible: true })` | Filter already handles visibility |
| Redundant assertions after filtered locators | Filter guarantees condition |
| `as const` on object literals | Usually not needed in our patterns |
| Commented-out code | Remove it, use git history |

### Remove Dead Code

```typescript
// BAD - commented code left behind
// await oldMethod();
// const unusedVar = 'test';
await newMethod();

// GOOD - clean code only
await newMethod();
```

---

## TypeScript Patterns

### Avoid Unnecessary `as const`

```typescript
// BAD - unnecessary assertion
const eventProps = { type: 'click' } as const;

// GOOD - let TypeScript infer
const eventProps = { type: 'click' };
```

### Missing `await` Detection

Always `await` async operations:

```typescript
// BAD - missing await (silent failure)
expect(element).toBeVisible();
element.click();

// GOOD - properly awaited
await expect(element).toBeVisible();
await element.click();
```

### Promise-Returning Methods Must Be Awaited

```typescript
// BAD - lines 191-196 missing await
projectPage.addComponent('Button');
projectPage.setProperty('Text', 'Click me');

// GOOD
await projectPage.addComponent('Button');
await projectPage.setProperty('Text', 'Click me');
```

---

## Playwright Test Fixtures

Our test infrastructure uses Playwright's fixture system for dependency injection. Understanding when to create new fixtures vs. using existing ones is critical for maintainable tests.

### Fixture Categories

| Category | Location | Examples | Purpose |
|----------|----------|----------|---------|
| **API/External Service** | `test-fixtures/amplitude.ts`, `openai.ts` | `amplitude`, `setOpenAIMock` | Mock or intercept external service calls |
| **Database/Seed** | `test-fixtures/db.ts` | `seedUser`, `seedProject`, `signInAs` | Set up test data and authentication |
| **Shared State** | `test-fixtures/shared-state.ts` | `sharedPage`, `sharedContext` | Worker-scoped state for multi-test flows |
| **Component Objects** | `test-fixtures/component-objects.ts` | `button`, `projectPage`, `label` | Inject page/component object instances |

### When to Create a New Fixture

#### API/External Service Fixtures

Create when you need to **mock, intercept, or interact with an external service**:

```typescript
// Example: Creating an analytics fixture (like amplitude.ts)
export const analyticsFixture: TestFixture<AnalyticsHelper, PlaywrightTestArgs> =
  async ({ page }, use) => {
    const helper = new AnalyticsHelper(page);
    await use(helper);
    // Cleanup happens automatically when page closes
  };
```

**Create a new API fixture when:**
- Tests need to capture/assert on API calls (like Amplitude events)
- Tests need to mock responses from an external service (like OpenAI)
- Multiple test files would benefit from the same mock setup
- The service requires setup/teardown lifecycle management

**Don't create a new API fixture when:**
- Only one test file needs the mock — use `page.route()` directly
- The mock is trivial — inline it in the test

#### Shared State Fixtures

Create when tests need to **share browser state across multiple test cases**:

```typescript
// sharedStateTest provides worker-scoped page that persists across tests
test.describe('multi-step user flow', () => {
  test('step 1: login', async ({ page }) => { /* ... */ });
  test('step 2: create project', async ({ page }) => { /* same page instance */ });
  test('step 3: publish', async ({ page }) => { /* same page instance */ });
});
```

**Use `sharedStateTest` when:**
- Testing multi-step flows where each step is a separate test
- Tests are tightly coupled and must run in sequence
- Setup is expensive and shouldn't repeat between tests

**Don't use shared state when:**
- Tests can run independently — use regular `test` instead
- Test isolation is important for debugging

#### Database/Seed Fixtures

The `db.ts` fixtures handle test data. **Rarely need to add new ones** — extend existing patterns:

```typescript
// Existing fixtures cover most needs:
await seedProject('empty-project');           // Create project from fixture
await seedUser('free-user');                  // Create user
await signInAs('free');                       // Sign in as plan type
await seedCollections([{ collection: 'assets', ... }]);  // Seed arbitrary data
```

**Add to db.ts when:**
- New collection types need seeding
- New cleanup patterns are needed
- New authentication flows are required

### Fixture Composition Pattern

Fixtures build on each other. Understand the hierarchy:

```
baseTest (Playwright)
    └── dbTest (db.ts)
            └── componentObjectsTest (component-objects.ts)
                    └── test (index.ts) — includes OpenAI + Amplitude
```

When creating a new fixture, extend the appropriate level:

```typescript
// For a new external service mock:
export const myServiceTest = componentObjectsTest.extend<MyServiceFixtures>({
  myService: myServiceFixture,
});

// For component objects that need page:
myComponent: async ({ projectPage }, use) => {
  await use(new MyComponent(projectPage));
},
```

### Fixture Lifecycle & Cleanup

**Auto-cleanup pattern** (preferred):

```typescript
export const myFixture: TestFixture<MyHelper, PlaywrightTestArgs> =
  async ({ page }, use, testInfo) => {
    const helper = new MyHelper(page);
    await use(helper);

    // Cleanup after test (runs even on failure)
    if (testInfo.status !== 'skipped') {
      await helper.cleanup();
    }
  };
```

**Worker-scoped cleanup** (for shared state):

```typescript
sharedContext: [
  async ({ browser }, use) => {
    const context = await browser.newContext();
    try {
      await use(context);
    } finally {
      await context.close();  // Always cleanup
    }
  },
  { scope: 'worker' },
],
```

### Fixture Files Quick Reference

| File | What to Add |
|------|-------------|
| `amplitude.ts` | Analytics event capture helpers |
| `openai.ts` | AI/LLM mock responses |
| `shared-state.ts` | Worker-scoped page/context patterns |
| `db.ts` | Database seeding, user auth, cleanup |
| `component-objects.ts` | New component object fixtures |
| `index.ts` | Compose fixtures, export combined `test` |

---

## Playwright API Patterns: Agent vs Author Decisions

This section clarifies when the code review agent should recommend specific Playwright patterns versus when the decision belongs to the test author.

### Network Interception (`page.route()`)

| Scenario | Decision | Rationale |
|----------|----------|-----------|
| Test is flaky due to external API | **Agent recommends** mocking | Stabilizes test, reduces external dependencies |
| Choosing *what* to mock | **Author decides** | Requires domain knowledge of test intent |
| Mock already exists in fixture | **Agent recommends** using fixture | DRY, consistency |
| One-off mock for single test | **Author decides** | May not warrant fixture extraction |

```typescript
// Agent CAN recommend: "Consider mocking this external call to reduce flakiness"
await page.route('**/api.openai.com/**', route => route.fulfill({
  status: 200,
  body: JSON.stringify({ choices: [{ text: 'mocked' }] }),
}));

// Agent SHOULD recommend: "Use existing OpenAI fixture instead of inline mock"
// BAD - inline when fixture exists
await page.route('**/api.openai.com/**', ...);
// GOOD
await setOpenAIMock('completions', 'genai/completion-response.json');
```

### Test Annotations

| Annotation | Agent Can Recommend | Author Decides |
|------------|---------------------|----------------|
| `test.skip()` | Only if test is demonstrably broken in PR | Skipping for environment/platform reasons |
| `test.fixme()` | When test has known bug with ticket | Whether to fix now vs later |
| `test.slow()` | When test consistently exceeds timeout | Whether slowness is acceptable |
| `test.fail()` | Never — requires explicit author intent | All uses |
| `test.only()` | **Must flag for removal** before merge | N/A — never merge with `.only` |

```typescript
// Agent MUST flag: "Remove test.only before merging"
test.only('my test', async () => { /* ... */ });  // BLOCKING

// Agent CAN suggest: "Consider test.slow() — this test took 45s in CI"
test.slow();
test('complex multi-step flow', async () => { /* ... */ });

// Agent SHOULD NOT add skip without author context
// Only author knows: "Skip on Windows due to path handling"
test.skip(process.platform === 'win32', 'Windows paths not supported');
```

### Test Hooks

| Pattern | Agent Recommends | Author Decides |
|---------|------------------|----------------|
| Repeated setup in 3+ tests | Extract to `beforeEach` | Hook placement (describe level) |
| One-time expensive setup | Suggest `beforeAll` | Whether isolation matters more |
| Cleanup after mutations | Ensure `afterEach`/`afterAll` exists | Cleanup strategy |
| Shared state tests | Verify hooks don't break isolation | Whether to use shared state |

```typescript
// Agent CAN recommend: "Extract repeated signInAs to beforeEach"
// Before (repeated in each test):
test('test 1', async ({ signInAs }) => { await signInAs('free'); /* ... */ });
test('test 2', async ({ signInAs }) => { await signInAs('free'); /* ... */ });
test('test 3', async ({ signInAs }) => { await signInAs('free'); /* ... */ });

// After:
test.beforeEach(async ({ signInAs }) => {
  await signInAs('free');
});
```

### Soft Assertions (`expect.soft()`)

| Scenario | Agent Recommends | Author Decides |
|----------|------------------|----------------|
| Multiple independent visual checks | Can suggest `expect.soft()` | Whether checks are truly independent |
| Assertion that must pass for test to continue | **Must NOT be soft** | N/A |
| Gathering multiple validation errors | Can suggest soft assertions | Debugging strategy |

```typescript
// Agent CAN suggest: "These checks are independent — consider soft assertions"
await expect.soft(header).toHaveText('Dashboard');
await expect.soft(sidebar).toBeVisible();
await expect.soft(footer).toContainText('© 2026');

// Agent MUST NOT suggest soft for dependent operations
// BAD - navigation depends on this succeeding
await expect.soft(loginButton).toBeVisible();
await loginButton.click();  // Will fail if button not visible
```

### Request Fixture (Direct API Calls)

| Scenario | Agent Recommends | Author Decides |
|----------|------------------|----------------|
| Setup that doesn't need UI | Can suggest `request` fixture | Whether UI setup is part of test intent |
| Verifying backend state | Can suggest API verification | Whether UI verification is required |
| Creating test data | Suggest if faster than UI | Whether UI flow matters |

```typescript
// Agent CAN recommend: "Use request fixture for faster setup"
test('verify project creation', async ({ request, page }) => {
  // API setup (faster than clicking through UI)
  const response = await request.post('/api/projects', {
    data: { name: 'Test Project' },
  });
  const { id } = await response.json();

  // UI verification (what we're actually testing)
  await page.goto(`/projects/${id}`);
  await expect(page.getByTestId('project-name')).toHaveText('Test Project');
});
```

### Timeouts & Retries

| Setting | Agent Recommends | Author Decides |
|---------|------------------|----------------|
| Missing timeout on known slow operation | Suggest adding timeout | Timeout duration |
| Test using default timeout but failing | Flag for investigation | Whether to increase or fix root cause |
| Action timeout vs assertion timeout | Clarify which is appropriate | Specific values |
| Test-level retries | Generally discourage | Exception cases |

```typescript
// Agent CAN flag: "This click has no timeout but targets slow-loading element"
await slowElement.click({ timeout: 10000 });

// Agent SHOULD question: "Test has retries — is this masking flakiness?"
test('flaky test', { retries: 3 }, async () => { /* ... */ });  // Investigate root cause

// Agent CAN suggest: "Use actionTimeout in config instead of per-call timeouts"
// playwright.config.ts
use: {
  actionTimeout: 10000,
}
```

### Debugging Artifacts

| Artifact | Agent Must Flag | Author Decides |
|----------|-----------------|----------------|
| `page.pause()` | **Must remove** before merge | When to use during development |
| `console.log` in tests | Should remove | Whether logging aids debugging |
| `test.only` | **Must remove** before merge | N/A |
| Screenshots in test | Only if not test requirement | Whether visual verification needed |

```typescript
// Agent MUST flag for removal:
await page.pause();  // BLOCKING - remove before merge
test.only('my test', ...);  // BLOCKING - remove before merge
console.log(await element.textContent());  // SHOULD remove

// Agent SHOULD NOT flag (intentional test artifact):
await expect(page).toHaveScreenshot('dashboard.png');  // Visual regression test
```

### File Upload/Download

| Pattern | Agent Recommends | Author Decides |
|---------|------------------|----------------|
| Using `setInputFiles` | Correct pattern | File selection |
| Waiting for download | Ensure proper wait pattern | Download verification strategy |
| File path handling | Cross-platform patterns | Test data location |

```typescript
// Agent CAN recommend correct pattern:
// GOOD - proper file upload
await page.getByTestId('file-input').setInputFiles('test-data/image.png');

// GOOD - proper download handling
const downloadPromise = page.waitForEvent('download');
await page.getByTestId('download-btn').click();
const download = await downloadPromise;
await download.saveAs('downloads/' + download.suggestedFilename());
```

### Decision Summary Table

| Pattern | Agent Authority |
|---------|-----------------|
| Remove `test.only` / `page.pause()` | **Must recommend (blocking)** |
| Use existing fixture over inline code | **Should recommend** |
| Extract repeated code to hooks | **Can recommend** |
| Add `test.skip` / `test.fixme` | **Author decides** (agent can suggest with context) |
| Choose mock strategy | **Author decides** |
| Timeout values | **Author decides** (agent flags missing/suspicious) |
| Soft vs hard assertions | **Author decides** (agent can suggest) |
| Request fixture vs UI setup | **Author decides** |

---

## Migration-Specific Rules

### Match Cypress Behavior

When migrating tests from Cypress, ensure equivalent behavior:

```typescript
// If Cypress tested scroll verification:
// cy.get('#container').scrollTo('bottom').should('be.visible')

// Playwright must also verify scrolling:
await expect(container).toBeVisible();
await page.evaluate(/* scroll logic */);
await expect(elementAtBottom).toBeInViewport();
```

### Verify Assertions Are Equivalent

Watch for:
- Missing assertions that existed in Cypress
- Different assertion values (colors, counts, text)
- Renamed methods that change behavior

### Migration Comments

Remove comments explaining migration behavior once the test is stable:

```typescript
// BAD - lingering migration comment
// Changed from Cypress behavior to match Playwright - can be removed
await element.click();

// GOOD - clean production code
await element.click();
```

### Improving Specs to Align with Qase Test Cases

When migrating a spec, **don't just port 1:1** — use the opportunity to align the test with its corresponding Qase test case. This improves test quality and traceability.

#### When to Improve During Migration

| Situation | Action |
|-----------|--------|
| Cypress test has vague assertions | Strengthen to match Qase expected results |
| Qase has steps the Cypress test skipped | Add the missing verification steps |
| Test name doesn't match Qase case title | Rename to match (improves traceability) |
| Qase case has preconditions not in Cypress | Add setup steps or use appropriate fixture |
| Cypress test over-tests (not in Qase scope) | Consider splitting or simplifying |

#### Example: Aligning with Qase

```typescript
// ORIGINAL Cypress test - vague, doesn't match Qase
it('should work with visibility', () => {
  cy.get('[data-testid="button"]').should('exist');
});

// IMPROVED Playwright test - matches Qase case "TC-123: Verify component visibility toggle"
test('TC-123: Verify component visibility toggle', async ({ propertiesPanel, button }) => {
  // Qase Step 1: Set visibility to false
  await propertiesPanel.setVisibility(false);

  // Qase Step 2: Verify component is hidden on phone
  await expect(button.buttonOnPhone()).toBeHidden();

  // Qase Step 3: Set visibility to true
  await propertiesPanel.setVisibility(true);

  // Qase Step 4: Verify component is visible on phone
  await expect(button.buttonOnPhone()).toBeVisible();
});
```

#### Qase Alignment Checklist

When migrating, cross-reference the Qase test case:

- [ ] Test name includes Qase ID or matches case title
- [ ] All Qase preconditions are satisfied (fixture or setup)
- [ ] Each Qase step has corresponding code
- [ ] Assertions match Qase expected results
- [ ] Test covers the same scope (no more, no less)

### Qase API Integration (Future)

Qase provides a REST API that can be leveraged for automation tooling. Potential future integrations:

| Use Case | Qase API Capability |
|----------|---------------------|
| **Auto-generate test stubs** | Fetch test case steps and create Playwright skeleton |
| **Sync test results** | Report pass/fail directly to Qase runs |
| **Validate coverage** | Compare spec files against Qase cases |
| **Migration tracking** | Mark cases as "automated" when Playwright test exists |

API documentation: https://developers.qase.io/reference/introduction-to-the-qase-api

> **Note:** Qase API integration is planned for future versions of our agent tooling. When implemented, this will streamline the migration workflow and ensure ongoing sync between code and test management.

---

## File Size Guidelines

### Advisory Limits

These are **advisory**, not blocking:

| File Type | Guideline | Action |
|-----------|-----------|--------|
| Test files | < 500 lines | Consider splitting by feature |
| COB files | < 300 lines | Consider extracting to sub-COBs |
| Shared specs | < 400 lines | Extract shared setup to fixtures |

Large files (like `layout.spec.ts` at 1500 lines) are acceptable when:
- Tests are logically grouped
- Splitting would create artificial boundaries
- The file follows all other conventions

---

## DOM Manipulation

### Avoid Direct DOM Manipulation

```typescript
// BAD - direct DOM manipulation
await page.evaluate(() => {
  document.querySelector('.popover').remove();
});

// GOOD - use natural UI interactions
await page.keyboard.press('Escape');
await page.click('body'); // Click outside to close
```

**Exception:** DOM manipulation is acceptable for:
- Reading computed styles for assertions
- Scroll position verification
- Complex viewport calculations

---

## Quick Reference: Code Review Checklist

### Must Fix (Blocking)

- [ ] Raw locators in test files → Move to COB
- [ ] Missing `await` on async operations
- [ ] `allTextContents()` without proper waiting → Use `toHaveText()`
- [ ] New `waitForTimeout` calls → Use proper waits
- [ ] Assertions inside COB methods → Move to tests
- [ ] Duplicate locators → Reuse from base.ts

### Should Fix (Non-Blocking)

- [ ] Public methods that should be private
- [ ] Missing method extraction for repeated code
- [ ] Unnecessary `as const` assertions
- [ ] Unnecessary `.clear()` before `.fill()`
- [ ] Commented-out code
- [ ] Migration comments that can be removed

### Consider (Suggestions)

- [ ] File size approaching guidelines
- [ ] Method that could be more reusable
- [ ] Selector that could be more semantic

---

*v1.1 | Jan 2026 | QA Automation Team*
