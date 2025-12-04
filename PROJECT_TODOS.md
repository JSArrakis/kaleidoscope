# Project TODOs

## Holiday-Specific Media Selection

- [ ] Figure out how to make certain media explicit to only being picked during its respective tagged holiday
  - Context: Previously used `explicitlyHoliday` boolean field on Tag, which was removed. Need alternative approach.
  - Considerations:
    - Should media be restricted to specific holidays or holiday seasons?
    - How should this interact with the existing `holidayDates` and `seasonStartDate`/`seasonEndDate` fields on tags?
    - Should this be a media-level property or tag-level property?
    - Need to ensure holiday filtering logic in streamConstructor/bufferEngine respects this constraint

## Episode-Level Tag Signature Adjustment

- [ ] Handle shows with episode-specific tags that change the nature of the tag signature
  - Context: A show may be tagged with sci-fi/fantasy at show level, but a specific episode may also have horror tag, changing the overall signature
  - Impact: When this episode is selected as main content, the procedural algorithm should account for the modified tag signature when picking subsequent buffer/filler media
  - Implementation Notes:
    - Need to merge show-level tags with episode-level tags when evaluating media characteristics
    - The combined tag set should influence buffer media selection algorithm (e.g., bufferEngine)
    - Ensure downstream media selection respects the enriched tag signature

## Promo Duration Validation

- [ ] Ensure any promo added to the DB is 15 seconds long, plus or minus 500ms (14.5-15.5 seconds)
  - Context: Promos have strict duration requirements for broadcast compatibility
  - Implementation: Add validation in PromoRepository.create() and PromoRepository.update() methods
  - Error Handling: Reject promos outside the allowed duration range with a clear error message
  - Affected Files: src/electron/repositories/promoRepository.ts

## Age Group Sequence Validation

- [ ] Ensure age groups tags do not have a negative number or 0 for the sequence before entering them into the DB
  - Context: Age group sequences should be positive integers to properly order content restrictions
  - Implementation: Add validation in TagRepository.create() and TagRepository.update() methods for AgeGroup type tags
  - Error Handling: Reject age group tags with sequence <= 0 with a clear error message
  - Affected Files: src/electron/repositories/tagsRepository.ts

## Age Group Sequence Integrity

- [ ] All age group sequence numbers must be filled sequentially with no gaps
  - Context: Age group sequences define a strict ordering hierarchy. Gaps would break the ordering logic.
  - Constraints:
    - Sequence numbers must be continuous (1, 2, 3, ... n) with no gaps
    - New sequence numbers cannot be set independently
    - When editing a sequence, two age group sequences must be exchanged/swapped
    - This ensures the ordering remains intact and predictable
  - Implementation:
    - Add validation in TagRepository.update() to enforce swap-only updates for AgeGroup sequences
    - Prevent direct sequence number assignment; require specifying which two age groups to swap
    - Validate that the resulting sequence is still continuous after the swap
  - Affected Files: src/electron/repositories/tagsRepository.ts

## Media Duration Classification & Programmability Warnings

- [ ] Add UI warnings for buffer media management when entries exceed sensible duration limits for the 30-minute scheduling architecture
  - Context: The stream uses fixed 30-minute scheduling blocks. Filler content (shorts, music videos, commercials) must fit into variable leftover windows (1-29 minutes). Content exceeding certain limits becomes "unprogrammable" (can't fit into any gap).
  - **Optimized Media Duration Definitions** (for 30-minute block scheduling):
    - **Promos/Idents**: 5-15 seconds (micro-transitions and branding)
    - **Commercials**: 1 second - 2 minutes (fine-grained padding, can combine many)
    - **Music Videos**: 1.5-10 minutes (small filler chunks, most are 3-6 minutes)
    - **Shorts**: 2-20 minutes (medium filler chunks, MUST stay <20 min to fit any leftover gap)
    - **Show Episodes (half-hour)**: 20-35 minutes (anchor content: 1 block + variable filler)
    - **Show Episodes (hour)**: 40-65 minutes (anchor content: 2 blocks + variable filler)
    - **Movies**: 40 minutes - 4 hours (anchor content: multiple blocks + variable filler)
    - **Special Episodes**: 60-120 minutes (anchor content: 2-4 blocks)
  - **Why these limits matter**:
    - Any filler <20 minutes can fit into every leftover window (1-29 min range)
    - Shorts >20 minutes risk becoming unprogrammable (e.g., 21+ min shorts won't fit in gaps ≤20 min)
    - Music videos capped at 10 min prevents fragmenting filler windows
    - Commercials/promos handle micro-adjustments
  - **UI Warnings to implement**:
    - ⚠️ WARN when Music Video duration > 10 minutes (uncommon, may affect scheduling)
    - ⚠️ WARN when Short duration > 20 minutes (CRITICAL: unprogrammable in many gaps)
    - ⚠️ WARN when Movie duration < 40 minutes (may be miscategorized as episode)
    - ⚠️ WARN when Promo duration < 5 or > 15 seconds (outside broadcast standard)
    - ⚠️ WARN when Commercial duration > 2 minutes (may not fit optimal buffer padding)
  - **Implementation**:
    - Add validation in media creation/edit forms before saving
    - Display warnings but allow override (with confirmation)
    - Store a "duration_warning_acknowledged" flag if user overrides
    - Consider adding a "programmability score" UI indicator
  - **Affected Files**:
    - UI: All media management screens (shorts, music, commercials editors)
    - Repositories: May need to add optional warning flags to media types
    - Services: Consider validation service for duration rules
