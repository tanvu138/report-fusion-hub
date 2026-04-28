# PDF Export Filename Bug - MacOS Chrome/Brave Issue

## Problem Description

**Issue**: PDF exports download with generic filename "download.pdf" instead of using the proper report name, despite backend correctly setting the `Content-Disposition` header.

**Environment**: 
- MacOS
- Chrome/Brave browser
- React frontend with Express.js backend
- PDF export using Puppeteer

**Expected Behavior**: 
PDFs should download with filename like `Monthly_Business_Review_-_May_2025_2025-07-21.pdf`

**Actual Behavior**: 
PDFs download as `download.pdf`

## Root Cause Analysis

The issue was identified as a **browser-specific compatibility problem** where MacOS Chrome/Brave browsers have restrictions on programmatic `Content-Disposition` header processing. While the backend was correctly setting headers, the frontend JavaScript couldn't reliably extract the filename.

## Comprehensive Solution Implemented

### 1. Enhanced Frontend Download Logic (`src/lib/api.ts`)

**Multiple Fallback Strategy**: Implemented a 5-tier fallback system for filename extraction:

1. **Content-Disposition Header Parsing** (Primary)
   - Enhanced regex patterns for RFC 6266 compliance
   - Handles both `filename*=UTF-8''name` and `filename="name"` formats
   - Improved error handling and logging

2. **Custom X-Export-Filename Header** (New Fallback)
   - Backend provides filename via custom header
   - Bypasses Content-Disposition parsing issues

3. **Function Parameter Filename** (Manual Override)
   - Allows explicit filename specification
   - Useful for programmatic calls

4. **URL-based Filename Extraction** (Contextual)
   - Parses endpoint URLs for filename hints
   - Extracts from path segments with extensions

5. **Timestamp-based Generation** (Final Fallback)
   - Generates unique filenames with timestamps
   - Ensures downloads never fail with "download.pdf"

**Browser-Specific Handling**:
```typescript
// Browser detection and MacOS-specific sanitization
const browserInfo = detectBrowser();
if (browserInfo.isMacOSChrome || browserInfo.isMacOSBrave) {
  finalFilename = sanitizeFilenameForMacOS(finalFilename);
}
```

**Enhanced Debugging**:
- Comprehensive console logging for each fallback strategy
- Clear identification of which method succeeded
- Browser detection logging

### 2. Improved Backend Export Controller (`server/controllers/exportController.js`)

**Query Parameter Support**:
```javascript
// GET /api/reports/:id/export/pdf?filename=custom_name.pdf
const { filename: queryFilename } = req.query;
```

**Enhanced Header Strategy**:
```javascript
// Multiple encoding strategies for maximum browser compatibility
const contentDisposition = [
  'attachment',
  `filename="${asciiFileName}"`, // ASCII version for old browsers
  `filename*=UTF-8''${encodedFileName}` // UTF-8 encoded version (RFC 6266)
].join('; ');

// Custom headers for frontend debugging and fallback
res.setHeader('X-Export-Filename', fileName);
res.setHeader('X-Export-Source', 'puppeteer');
```

**Robust Filename Generation**:
- Priority system: Query parameter → Report title → Timestamp fallback
- Enhanced sanitization functions
- Windows reserved name checking
- Length limits and character filtering

### 3. Updated API Interface (`src/lib/api/reports.ts`)

**Flexible Export Function**:
```typescript
export const exportReportPdf = async (reportId: string, filename?: string): Promise<void> => {
  const endpoint = `/api/reports/${reportId}/export/pdf`;
  const finalEndpoint = filename ? `${endpoint}?filename=${encodeURIComponent(filename)}` : endpoint;
  await api.download(finalEndpoint, filename);
};
```

## Technical Implementation Details

### Browser Compatibility Enhancements

1. **Content-Disposition Parsing**:
   - Case-insensitive regex matching
   - Whitespace handling around equals signs
   - UTF-8 decoding with error handling
   - Multiple format support (quoted/unquoted/encoded)

2. **MacOS-Specific Sanitization**:
   - Removal of problematic characters
   - Dot and space trimming
   - Length restrictions (200 chars)
   - Underscore replacement for spaces

3. **Fallback Mechanisms**:
   - Custom headers bypass Content-Disposition issues
   - URL parsing for contextual filenames
   - Timestamp generation ensures unique names
   - Never defaults to generic "download.pdf"

### Backend Improvements

1. **Enhanced Logging**:
   - Step-by-step export process logging
   - Header setting confirmation
   - File size and validation reporting
   - Debug file creation for troubleshooting

2. **Multiple Encoding Strategies**:
   - ASCII-safe filenames for legacy browsers
   - UTF-8 encoded filenames for modern browsers
   - Custom headers for JavaScript access

3. **Query Parameter Support**:
   - Optional filename override via URL
   - Comprehensive sanitization and validation
   - Fallback to report title generation

## Testing and Validation

### Expected Behavior After Fix

1. **Primary Path**: Content-Disposition header extraction works
2. **Fallback Path**: X-Export-Filename header used if CD fails  
3. **Manual Override**: Query parameter filename respected
4. **Contextual**: URL-based filename extraction when applicable
5. **Final Safety**: Timestamp-based unique filename generation

### Browser-Specific Results Expected

- **MacOS Chrome/Brave**: Should now work via multiple fallback mechanisms
- **MacOS Safari**: Should work via Content-Disposition (if functional)
- **MacOS Firefox**: Should work via Content-Disposition
- **Windows/Linux**: Should work via primary Content-Disposition method

## Status: SOLUTION IMPLEMENTED ✅

**Fixed Issues**:
- ✅ Enhanced Content-Disposition header parsing with better browser compatibility
- ✅ Added URL-based filename fallback mechanism  
- ✅ Implemented browser-specific detection and handling
- ✅ Added enhanced debugging and logging for download process
- ✅ Multiple encoding strategies for headers
- ✅ Custom header fallback for problematic browsers
- ✅ Query parameter support for filename override
- ✅ Comprehensive sanitization and validation

**Next Steps**:
- 🔄 **TESTING REQUIRED**: Verify solution works on MacOS Chrome/Brave
- 📊 Monitor download success rates and filename accuracy
- 🔧 Fine-tune based on user feedback and browser behavior

---
*Last Updated: 2025-07-21*  
*Status: Solution Implemented - Testing Required*