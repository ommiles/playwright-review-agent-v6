# ADR 001: GitHub Authentication Method for Claude Code Action

## Status

Accepted

## Context

The `anthropics/claude-code-action` GitHub Action supports two authentication methods for interacting with the GitHub API:

1. **OIDC (OpenID Connect)** - Uses GitHub's OIDC provider to exchange tokens with the Claude Code GitHub App
2. **GitHub Token** - Uses the standard `secrets.GITHUB_TOKEN` provided by GitHub Actions

We needed to choose which method to use for the Playwright Code Review workflow.

## Decision

We chose to use **`secrets.GITHUB_TOKEN`** instead of OIDC authentication.

## Rationale

### Why GITHUB_TOKEN was chosen

1. **Consistency with existing workflows** - All other workflows in `thunkable-for-ios` use `secrets.GITHUB_TOKEN` for GitHub API access. Using the same pattern reduces cognitive load and maintains consistency.

2. **Simpler setup** - No additional GitHub App installation required. The token is automatically available in every workflow run.

3. **Works immediately on PRs** - OIDC requires the workflow file to exist and match identically on the repository's default branch before it can authenticate on PR branches. This creates a chicken-and-egg problem when first adding or modifying the workflow.

4. **No external dependencies** - Does not require the Claude Code GitHub App to be installed on the repository.

### OIDC Advantages

1. **Fine-grained permissions** - OIDC tokens can be scoped more precisely through the Claude Code GitHub App
2. **Audit trail** - Token exchanges are logged through the GitHub App
3. **No secret management** - Tokens are generated on-demand, not stored as secrets

### OIDC Disadvantages

1. **Workflow file validation** - The workflow file must exist and be identical on the default branch. Error message: "Workflow validation failed. The workflow file must exist and have identical content to the version on the repository's default branch."

2. **Additional setup** - Requires installing the Claude Code GitHub App at https://github.com/apps/claude

3. **Requires `id-token: write` permission** - Adds another permission that needs to be understood and reviewed

4. **Debugging complexity** - Token exchange failures can be harder to diagnose than simple token authentication

## Consequences

- The workflow uses `github_token: ${{ secrets.GITHUB_TOKEN }}` in the action configuration
- No `id-token: write` permission is needed
- The Claude Code GitHub App does not need to be installed
- Future workflow modifications can be tested on PR branches without merging to main first

## References

- [Claude Code Action Documentation](https://github.com/anthropics/claude-code-action)
- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
