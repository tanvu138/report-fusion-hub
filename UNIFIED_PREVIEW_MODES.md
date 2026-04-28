# Unified Preview Mode Differences

## Overview

The Unified Preview system provides three distinct modes for interacting with reports:

### 1. **View Mode** 👁️
- **Purpose**: Read-only preview of the report
- **Features**:
  - View all report sections and content
  - Export report to DOCX (secretary only)
  - Clean, distraction-free reading experience
- **Use Case**: When you want to review report content without making changes

### 2. **Edit Mode** ✏️
- **Purpose**: Inline editing of individual report sections
- **Features**:
  - Edit sections one at a time within the preview interface
  - Each section has Save/Cancel buttons when being edited
  - Uses a simple textarea for markdown editing
  - Auto-save functionality available
  - Changes are saved per section
- **UI Behavior**:
  - Click on a section to start editing
  - A textarea appears in place of the section content
  - Save or Cancel buttons appear at the top of the section
  - Other sections remain in read-only view
- **Best For**: Quick edits to specific sections without leaving the preview

### 3. **Full Edit Mode** 📝
- **Purpose**: Complete document editing experience
- **Features**:
  - Redirects to a dedicated full-screen editor (`/reports/:id/edit-full`)
  - Uses BlockNote rich text editor (not just markdown)
  - Edit the entire report as a unified document
  - Advanced formatting capabilities
  - Section markers and comprehensive editing tools
- **UI Behavior**:
  - Clicking "Full Edit" navigates to a completely different page
  - Provides a full-featured document editor interface
  - Secretary-only access (strict role control)
- **Best For**: Major content restructuring, comprehensive document review, or when you need advanced formatting

## Key Differences Summary

| Feature | Edit Mode | Full Edit Mode |
|---------|-----------|----------------|
| **Editing Scope** | Individual sections | Entire document |
| **Editor Type** | Simple textarea (markdown) | BlockNote rich text editor |
| **Interface** | Inline within preview | Dedicated full-screen page |
| **Navigation** | Stay on same page | Navigate to new page |
| **Access** | Secretary & Department users | Secretary only |
| **Save Behavior** | Save per section | Save entire document |
| **Best Use Case** | Quick section updates | Major document changes |

## Visual Flow

```
Unified Preview Page
├── View Mode → Read-only display
├── Edit Mode → Click section → Inline textarea → Save/Cancel
└── Full Edit → Navigate to /edit-full → BlockNote editor
```

## Implementation Details

- **Edit Mode**: Modifies sections in place using `UnifiedReportPreview` component's inline editing
- **Full Edit Mode**: Uses `ReportFullEditPage` component with complete BlockNote integration

This design allows users to choose the appropriate level of editing based on their needs - from quick fixes (Edit Mode) to comprehensive document work (Full Edit Mode).