# Bootstrap UI Integration Guide

## Stream Start Button with Eligibility Check

The `checkStreamStartEligibility` IPC handler provides real-time status for enabling/disabling stream start buttons with helpful user feedback.

**Implementation Status:** ✅ Fully implemented in the Home screen (`src/ui/screens/Home`)

### API Usage

```typescript
// Poll for eligibility (e.g., every 2 seconds while on stream start screen)
const eligibility = await window.electron.checkStreamStartEligibilityHandler();

// Example response when ready:
{
  canStart: true,
  statusMessage: "Ready to start stream (3 pre-transcoded items available)",
  readyCount: 3,
  poolSize: 5
}

// Example response when no media:
{
  canStart: false,
  statusMessage: "No media available. Please add movies or TV shows to begin.",
  readyCount: 0,
  poolSize: 0
}

// Example response when transcoding in progress:
{
  canStart: false,
  statusMessage: "Transcoding 2 items. Please wait for at least one to complete.",
  readyCount: 0,
  poolSize: 2
}
```

### React Component Example

```tsx
import { useEffect, useState } from "react";

function StreamStartButton() {
  const [eligibility, setEligibility] = useState<StreamStartEligibility>({
    canStart: false,
    statusMessage: "Checking...",
    readyCount: 0,
    poolSize: 0,
  });

  useEffect(() => {
    // Initial check
    checkEligibility();

    // Poll every 2 seconds
    const interval = setInterval(checkEligibility, 2000);
    return () => clearInterval(interval);
  }, []);

  async function checkEligibility() {
    const result = await window.electron.checkStreamStartEligibilityHandler();
    setEligibility(result);
  }

  async function handleStartStream() {
    if (!eligibility.canStart) return;

    // Your existing stream start logic
    await window.electron.startAdhocStreamHandler({
      cadence: true,
      themed: false,
      durationMinutes: 120,
    });
  }

  return (
    <div>
      <button
        disabled={!eligibility.canStart}
        onClick={handleStartStream}
        title={eligibility.statusMessage}
        className={eligibility.canStart ? "enabled" : "disabled"}
      >
        Start Stream
      </button>
      <p className="status-text">{eligibility.statusMessage}</p>
    </div>
  );
}
```

### Status Message States

| Condition                | `canStart` | `statusMessage`                                                    |
| ------------------------ | ---------- | ------------------------------------------------------------------ |
| Feature flag off         | `true`     | "Ready to start stream"                                            |
| No media in DB           | `false`    | "No media available. Please add movies or TV shows to begin."      |
| Media added, transcoding | `false`    | "Transcoding N item(s). Please wait for at least one to complete." |
| Ready to stream          | `true`     | "Ready to start stream (N pre-transcoded item(s) available)"       |

### When to Poll

- **Stream start screen** - Poll every 1-2 seconds while visible
- **After adding media** - Poll every 1 second for ~30 seconds to show transcoding progress
- **Inactive screens** - Stop polling to save resources

### Feature Flag Behavior

When `ENABLE_BOOTSTRAP_SELECTOR=0` (default during rollout):

- Always returns `canStart: true`
- No validation enforced
- Backwards compatible with existing behavior
