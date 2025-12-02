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
