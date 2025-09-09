# Instance Management Improvements

## Overview

This PR introduces critical improvements to the quill-table-better plugin to address issues with multi-instance Quill applications and memory management.

## Problem Statement

The current implementation has several issues when used in applications with multiple Quill instances:

1. **Global Event Listeners**: Document-level event listeners are attached immediately on import, affecting all Quill instances regardless of whether they use the table plugin
2. **Memory Leaks**: No cleanup mechanism for event listeners in SPA applications
3. **Format Registration Pollution**: Automatic format registration happens on import, affecting global Quill behavior
4. **Toolbar Compatibility**: Errors when toolbar methods are called on non-table Quill instances

## Solutions Implemented

### 1. Instance-Specific Event Management System

**File**: `src/ui/cell-selection.ts`

- Implemented `CellSelectionRegistry` pattern for smart global event management
- Event listeners are only attached when the first table instance is created
- Events are properly routed to the correct Quill instance
- Automatic cleanup when all table instances are destroyed

**Benefits**:
- No global side effects on plugin import
- Proper memory management for SPA applications
- Better isolation between Quill instances

### 2. Lazy Format Registration

**Files**: `src/formats/header.ts`, `src/formats/list.ts`

- Removed automatic `Quill.register()` calls on module import
- Formats are now registered automatically when the first table module is instantiated
- Prevents global Quill behavior modification until actually needed

**Benefits**:
- No global format pollution
- Better control over when formats are registered
- Maintains backward compatibility

### 3. Toolbar Null Safety

**File**: `src/modules/toolbar.ts`

- Added null safety checks for `getTableBetter()` method
- Graceful handling when toolbar methods are called on non-table instances
- Enhanced error prevention in mixed Quill environments

**Benefits**:
- Prevents runtime errors in applications with mixed Quill instances
- Better developer experience
- Improved robustness

## Technical Details

### CellSelectionRegistry Pattern

```typescript
class CellSelectionRegistry {
  private static instances = new Set<CellSelection>();
  private static listenersAttached = false;

  static register(instance: CellSelection): void {
    // Smart registration logic
  }

  static unregister(instance: CellSelection): void {
    // Cleanup logic
  }
}
```

This pattern ensures:
- Global event listeners are only attached when needed
- Proper cleanup prevents memory leaks
- Event routing to correct instances

### Backward Compatibility

All changes maintain full backward compatibility:
- Existing API remains unchanged
- Default behavior is preserved
- No breaking changes to user code

## Testing

The improvements have been tested with:
- Single Quill instance (original behavior preserved)
- Multiple Quill instances with mixed table/non-table configurations
- SPA scenarios with dynamic instance creation/destruction
- Memory leak testing in long-running applications

## Migration Guide

No migration is required - these are internal improvements that maintain the existing API contract.

## Files Changed

- `src/ui/cell-selection.ts` - Instance-specific event management
- `src/modules/toolbar.ts` - Null safety improvements  
- `src/formats/header.ts` - Lazy registration
- `src/formats/list.ts` - Lazy registration
- `src/quill-table-better.ts` - Integration and cleanup logic
