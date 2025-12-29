# Image Debug Testing Guide

## Quick Debug Steps

### Step 1: Add Debug Panel (Temporary)
The debug panel has been added to the AnalysisResults page. Look for the red "🐛 Debug Images" button in the bottom-right corner.

### Step 2: Browser Console Testing
1. Navigate to the AnalysisResults page
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Load the debug script:
   ```javascript
   // Copy and paste this into console:
   fetch('/debug-images.js').then(r => r.text()).then(eval);
   ```
5. The script will automatically run all tests and show results

### Step 3: Manual Console Commands
If the debug script doesn't load, run these commands manually:

```javascript
// Check sessionStorage
console.log('SessionStorage image:', !!sessionStorage.getItem('currentAnalysisImage'));
console.log('Image length:', sessionStorage.getItem('currentAnalysisImage')?.length);

// Check navigation state
console.log('Location state:', window.location.state);
console.log('History state:', window.history.state);

// Test backend API (replace ANALYSIS_ID with actual ID)
fetch('/api/analysis/ANALYSIS_ID', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(data => {
  console.log('Backend response:', data);
  console.log('Has imageUrl:', !!data.imageUrl);
});

// Check current page images
document.querySelectorAll('img').forEach((img, i) => {
  console.log(`Image ${i}:`, {
    alt: img.alt,
    src: img.src.substring(0, 100),
    complete: img.complete,
    naturalSize: `${img.naturalWidth}x${img.naturalHeight}`
  });
});
```

## Expected Results

### ✅ Working Scenario
- SessionStorage contains base64 image data
- Backend API returns imageUrl in response
- Images display correctly on page
- Console shows successful image loading

### ❌ Broken Scenario
- SessionStorage is empty or contains invalid data
- Backend API doesn't return imageUrl
- Images show placeholder or fail to load
- Console shows image loading errors

## Common Issues and Fixes

### Issue 1: SessionStorage Empty
**Symptoms:** No image data in sessionStorage
**Causes:** 
- Navigation state not preserved
- Data cleared prematurely
- Race condition during page transitions

**Fix:** Check AnalysisProcessing.jsx navigation logic

### Issue 2: Backend Missing ImageUrl
**Symptoms:** API response doesn't include imageUrl
**Causes:**
- Backend not storing image properly
- Database field missing
- API response format incorrect

**Fix:** Check backend/routes/analysis.js response format

### Issue 3: CSP Blocking Images
**Symptoms:** Console shows CSP violations
**Causes:**
- Content Security Policy blocking data: URLs
- Missing blob: support in CSP

**Fix:** Update server.js CSP settings (already done)

### Issue 4: Image Format Issues
**Symptoms:** Images exist but don't display
**Causes:**
- Corrupted base64 data
- Missing data URL prefix
- Invalid MIME type

**Fix:** Validate base64 format in image loading logic

## Testing Workflow

### 1. Upload New Image
1. Go to Analysis page
2. Upload a blood smear image
3. Check browser console for base64 storage
4. Proceed through processing to results

### 2. Check Each Fallback Method
1. Open debug panel on results page
2. Click "Test All Image Loading Methods"
3. Check which methods succeed/fail
4. Look for specific error messages

### 3. Verify PDF Generation
1. Try generating PDF report
2. Check if images appear in PDF
3. Compare PDF images with web display

### 4. Test Different Browsers
1. Test in Chrome, Firefox, Safari
2. Check for browser-specific issues
3. Verify CSP compliance across browsers

## Debug Output Interpretation

### Console Messages to Look For:
- `🔍 Loading image data with enhanced debugging...`
- `✅ Image loaded successfully:`
- `❌ Image failed to load:`
- `🎉 SUCCESS with method:`
- `💾 Stored successful image in sessionStorage`

### Error Types:
- `SecurityError`: CSP or CORS issue
- `NetworkError`: Backend connectivity issue
- `Blob URL error`: File object issue
- `Timeout`: Image loading too slow

## Quick Fixes to Try

### Fix 1: Clear and Retry
```javascript
// Clear all image-related storage
sessionStorage.removeItem('currentAnalysisImage');
sessionStorage.removeItem('currentAnalysisImageName');
// Then upload new image
```

### Fix 2: Force Backend Fetch
```javascript
// Manually trigger backend image fetch
window.location.reload();
```

### Fix 3: Test Direct Image Load
```javascript
// Test if a known good image loads
const testImg = new Image();
testImg.onload = () => console.log('Test image OK');
testImg.onerror = () => console.log('Test image failed');
testImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
```

## Reporting Issues

When reporting image display issues, include:

1. **Browser and version**
2. **Console error messages**
3. **Debug panel results**
4. **Network tab screenshots**
5. **Steps to reproduce**

### Console Export Command:
```javascript
// Export debug info for reporting
console.log('=== DEBUG REPORT ===');
console.log('Browser:', navigator.userAgent);
console.log('SessionStorage keys:', Object.keys(sessionStorage));
console.log('Image data length:', sessionStorage.getItem('currentAnalysisImage')?.length);
console.log('Current images:', document.querySelectorAll('img').length);
```

## Cleanup

After debugging, remove the debug panel:
1. Remove `import ImageDebugPanel` from AnalysisResults.jsx
2. Remove `<ImageDebugPanel />` from the component
3. Delete the debug script from public folder

The enhanced logging in the image loading functions can remain for production debugging.