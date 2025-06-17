# Changelog

## [Unreleased]

### Added
- Full SheetDB CRUD (Create, Read, Update, Delete) integration for gym items:
  - Add, update, and delete gym items sync with Google Sheets via SheetDB.
  - All SheetDB requests use robust, case-sensitive tab and column names.
  - Tab name is now a constant for easy maintenance.
- Logging for all SheetDB requests (POST, PATCH, DELETE) for easier debugging.
- UI: Gym panel and tabs alignment fixes for a cleaner, more consistent look.
- New CSS for gym tabs and gym panel for better layout and spacing.

### Changed
- Product catalog and gym management logic refactored for clarity and maintainability.
- All references to sheet columns and tab names are now case- and space-accurate.
- Removed extra UI messaging and streamlined the product grid.
- Cleaned up unused imports, state variables, and functions (fixed ESLint warnings).

### Fixed
- SheetDB DELETE and PATCH now work by matching the exact column and tab names.
- Gym tabs and gym items box are now perfectly aligned.
- Fallback to mock data if SheetDB fetch fails.
- Bug where deleting an item did not remove it from the Google Sheet (caused by column/tab name mismatch).

### Notes
- To change the Google Sheet tab name, update the `SHEETDB_TAB_NAME` constant in `App.js`.
- All SheetDB operations are logged to the browser console for transparency.
- Ensure your Google Sheet is set to "Anyone with the link can edit" for full functionality.

--- 