# ADR 002: Dynamic Max-Turns Based on File Count

## Status

Accepted

## Context

The Claude Code Action uses a `--max-turns` parameter to limit the number of API round-trips Claude can make during a review. Each "turn" is one cycle where Claude:

1. Analyzes the current state
2. Uses tools (read files, post comments, etc.)
3. Receives results

A fixed value (e.g., 10 turns) may be insufficient for large PRs with many file changes, causing the review to terminate before completion with an `error_max_turns` error.

## Decision

Implement dynamic max-turns based on the number of changed Playwright files using a tiered approach:

| Files Changed | Max Turns |
|---------------|-----------|
| 1-10          | 10        |
| 11-20         | 20        |
| 21-30         | 30        |
| 31-40         | 40        |
| 41+           | 50        |

## Rationale

### Why tiered instead of linear?

- **Predictable**: Easy to understand and reason about
- **Simple**: No complex formulas or coefficients to tune
- **Bounded**: Hard cap at 50 prevents runaway costs

### Why these specific tiers?

- **10 turns for 1-10 files**: Sufficient for typical small PRs based on observed successful runs (8 turns for a simple review)
- **10 additional turns per tier**: Provides headroom for reading more files and posting more comments
- **50 turn cap**: Prevents excessive API costs while still handling large PRs

### Formula

```bash
MAX_TURNS=$(( ((FILE_COUNT - 1) / 10 + 1) * 10 ))
```

This rounds up to the nearest 10 based on file count.

## Consequences

- Reviews scale appropriately with PR size
- Large PRs won't fail due to turn limits
- API costs scale with PR complexity (acceptable trade-off)
- Comment-triggered reviews (`@claude` mentions) default to 10 turns since file count isn't calculated for those events

## Future Considerations

- Monitor actual turn usage to validate tier boundaries
- Consider adjusting the base if 10 turns proves insufficient for single-file reviews
- Could add per-file complexity scoring if simple file count proves inadequate
