# ADR 005: Review Output Methods

## Status

Accepted (MCP Server with inline comments selected)

## Context

When Claude completes a code review, the results need to be communicated back to the developer. There are several approaches with different trade-offs in terms of integration quality and implementation complexity.

## Options Considered

### Option 1: GitHub Action Logs Only (Rejected)

Output review to the GitHub Action job summary/logs.

**Pros:**
- Simplest implementation
- No additional API calls needed

**Cons:**
- Developer must navigate to Actions tab to see results
- Not visible in PR conversation
- Easy to miss

### Option 2: Single PR Comment (Previously Used)

Post review as a single comment on the PR using `gh pr comment`.

```bash
claude -p "$PROMPT" > review-output.md
gh pr comment "$PR_NUMBER" --body-file pr-comment.md
```

**Pros:**
- Simple implementation
- Review visible in PR conversation
- Easy to set up

**Cons:**
- All issues in one comment, not linked to specific code lines
- Developer must cross-reference line numbers manually
- Less integrated with GitHub's review UX

### Option 3: GitHub Review with Inline Comments via `gh api`

Have Claude output structured JSON, then use `gh api` to create a proper review.

```bash
gh api repos/{owner}/{repo}/pulls/{pr}/reviews \
  --method POST \
  -f event="COMMENT" \
  -f body="Summary" \
  -f 'comments[][path]=file.ts' \
  -f 'comments[][line]=42' \
  -f 'comments[][body]=Issue here'
```

**Pros:**
- Native GitHub review experience
- Inline comments on specific lines
- Appears in "Files changed" tab

**Cons:**
- Complex JSON parsing required
- Claude must output exact line numbers correctly
- Brittle if output format varies

### Option 4: MCP Server with GitHub Tools (Selected)

Use the GitHub MCP server to give Claude direct access to GitHub's review API.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "..." }
    }
  }
}
```

**Pros:**
- Claude directly creates reviews with inline comments
- Native GitHub review experience
- Most accurate line-by-line commenting
- Claude can read diffs, understand context, and place comments precisely
- Single tool call creates entire review

**Cons:**
- Requires MCP server setup
- Additional dependency (@modelcontextprotocol/server-github)
- Need to allow the MCP tools via `--allowedTools`

### Option 5: `anthropics/claude-code-action` Built-in

The official GitHub Action has built-in PR commenting capabilities.

**Pros:**
- Official Anthropic solution
- Handles GitHub integration automatically
- No custom implementation needed

**Cons:**
- Less control over output format
- May include verbose output in logs vs PR
- Tied to action's release cycle

## Decision

We chose **Option 4: MCP Server with GitHub Tools** for native inline review comments.

## Rationale

1. **Best UX** - Inline comments appear directly on the relevant code lines
2. **Native integration** - Uses GitHub's review system properly
3. **Accuracy** - Claude reads the actual diff and places comments precisely
4. **Professional output** - Looks like a human code review

## Implementation

1. Create `.mcp.json` in repo root with GitHub server config
2. Update workflow to use `--allowedTools` for GitHub MCP tools
3. Modify prompt to instruct Claude to use `create_pull_request_review`

## Consequences

- Reviews appear as proper GitHub reviews with inline comments
- Developers see issues directly on the lines of code
- MCP server dependency must be available in CI
- GitHub token must be passed to MCP server

## Future Considerations

- Could add ability to request changes vs just comment
- Could track which comments have been addressed
- Could support review threads and replies
