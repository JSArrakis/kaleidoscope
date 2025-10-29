# Stream Constructor Redesign - TODO Tracking

## Overview

Complete redesign of the stream constructor to implement the new continuous stream endpoint flow with proper sequencing and timing.

## Implementation Sequence

### Phase 1: Initial Tag Selection

- [ ] **Task 1.1**: Extract intelligent tag selection from old constructor
- [ ] **Task 1.2**: Ensure tag selection returns appropriate starting tags
- [ ] **Task 1.3**: Validate selected tags have available media

### Phase 2: Initial Buffer Creation

- [ ] **Task 2.1**: Calculate buffer duration (current time → first media block start)
- [ ] **Task 2.2**: Generate buffer media for calculated duration
- [ ] **Task 2.3**: Load initial buffer immediately into VLC

### Phase 3: First Two Media Blocks

- [ ] **Task 3.1**: Create first media block using initially selected tags
- [ ] **Task 3.2**: Implement tag walking mechanism for next selection
- [ ] **Task 3.3**: Create second media block using walked tags
- [ ] **Task 3.4**: Ensure proper timing/scheduling for both blocks

### Phase 4: Rest of Day Stream Generation

- [ ] **Task 4.1**: Continue tag walking for remaining day duration
- [ ] **Task 4.2**: Generate all remaining media blocks until end of day
- [ ] **Task 4.3**: Ensure proper buffer media between main blocks

### Phase 5: Stream Loading & Integration

- [ ] **Task 5.1**: Load first 2 blocks into ondeck stream
- [ ] **Task 5.2**: Load remaining blocks into upcoming stream
- [ ] **Task 5.3**: Integrate with existing background service cycle
- [ ] **Task 5.4**: Update continuous stream endpoint to use new constructor

### Phase 6: Testing & Validation

- [ ] **Task 6.1**: Test initial buffer creation and VLC loading
- [ ] **Task 6.2**: Validate ondeck/upcoming stream population
- [ ] **Task 6.3**: Test tag walking and media block creation
- [ ] **Task 6.4**: End-to-end continuous stream testing

## Notes

- Old constructor preserved as `constructStreamOLD` for reference
- New constructor currently delegates to old for maintaining functionality
- Background service time management working correctly - do not modify
- Focus on the specific sequence: tags → initial buffer → first 2 blocks → rest of day

## Dependencies

- Intelligent tag selection system (implemented)
- Buffer engine for creating buffer media
- Media service for tag validation and media retrieval
- VLC integration for immediate buffer loading
