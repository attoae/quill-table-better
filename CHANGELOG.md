# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2025-09-09 (Fork Release)

### 🚀 Fork Improvements
- **Instance-specific event management**: Implemented CellSelectionRegistry to only attach global event listeners when table-better instances exist
- **Automatic format registration**: Formats now register automatically when first table-better instance is created (lazy loading)
- **Toolbar compatibility fixes**: Fixed destructuring errors when using toolbar features in non-table Quill instances
- **Memory leak prevention**: Proper cleanup of global event listeners when instances are destroyed
- **Multiple instance support**: Applications can now safely mix Quill instances with and without table-better

### 🔧 Technical Changes
- Added `CellSelectionRegistry` class for managing global event listeners
- Updated `TableToolbar` to handle missing table-better module gracefully
- Implemented lazy format registration in `Table.ensureFormatsRegistered()`
- Added proper null checks in all toolbar event handlers
- Enhanced cleanup mechanisms in `Table.destroy()` and `CellSelection.cleanup()`

### 💔 Breaking Changes
None - This fork maintains full backward compatibility with the original package.

### 🙏 Credits
This is a fork of [attoae/quill-table-better](https://github.com/attoae/quill-table-better) v1.2.3.
Original work by [attoae](https://github.com/attoae).

---

## Original Package History
For the complete changelog of the original package (versions 1.0.0 - 1.2.3), please refer to:
https://github.com/attoae/quill-table-better/releases
