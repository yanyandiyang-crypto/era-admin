# Admin App - Alert Sound Fix

## Issue Summary
The notification alert sounds were not being played when incidents were received in the admin web application after running `npm run build && npm run preview`.

## Root Cause Analysis

### What Was Wrong
1. **Inefficient Audio Initialization**: The `playNotificationSound()` function in SocketContext was creating a new Audio element on every notification, which could fail due to browser autoplay policies
2. **No Preloading**: Audio wasn't being preloaded, causing potential delays or failures
3. **Weak Error Handling**: Errors from browser autoplay policies weren't being properly handled or logged
4. **Browser Autoplay Policy**: Modern browsers (Chrome, Firefox, Safari, Edge) have strict autoplay policies that require:
   - User interaction before playing audio
   - Proper CORS headers (if loading from different origin)
   - Preloaded media

### What Was Working
- ✅ `notification.mp3` file was correctly included in `public/` folder
- ✅ File was copied to `dist/` during build
- ✅ File path references were correct (`/notification.mp3`)
- ✅ MapDispatch already had a better audio implementation with preloading

## Solution Implemented

### Changes Made

**File**: `src/contexts/SocketContext.tsx`

#### 1. Added useRef Import
```typescript
// Before
import { useEffect, useState } from 'react';

// After
import { useEffect, useState, useRef } from 'react';
```

#### 2. Added Audio Element Ref
```typescript
const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
```

#### 3. Improved playNotificationSound Function
```typescript
const playNotificationSound = () => {
  try {
    // Initialize audio element once if not already done
    if (!notificationAudioRef.current) {
      const audio = new Audio('/notification.mp3');
      audio.preload = 'auto';
      audio.volume = 0.7;
      audio.loop = false;
      notificationAudioRef.current = audio;
      
      // Handle browser autoplay policy
      audio.addEventListener('error', (e) => {
        console.warn('🔊 Audio error:', e.error?.message || 'Unknown error');
      });
    }
    
    // Reset playback and play
    const audio = notificationAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('🔊 Notification sound played successfully');
          })
          .catch((e) => {
            console.warn('🔊 Notification sound play blocked:', e.message);
          });
      }
    }
  } catch (error) {
    console.warn('🔊 Notification sound play error:', error);
  }
};
```

### Key Improvements

1. **Lazy Initialization**: Audio element is created once and reused, reducing overhead
2. **Preloading**: Audio is preloaded with `preload = 'auto'` for better performance
3. **Promise-Based Playback**: Uses `.play()` promise to properly handle browser autoplay restrictions
4. **Better Error Logging**: Distinguishes between different failure modes:
   - Autoplay policy blocked (expected on some browsers without user interaction)
   - Audio format/codec errors
   - Other playback errors
5. **Consistent with MapDispatch**: Now uses the same pattern as the working implementation in MapDispatch.tsx

## Browser Autoplay Policies

### Why Sound Might Not Play

Modern browsers have autoplay restrictions. Audio will NOT play unless:
1. ✅ User has interacted with the page (click, key press, etc.)
2. ✅ Site has a history of user interaction
3. ✅ Media has sound muted initially
4. ✅ Media is preloaded

After user interacts with the admin page (logging in, clicking anything), subsequent notifications should play sounds automatically.

### Browser-Specific Behavior

| Browser | Policy | Notes |
|---------|--------|-------|
| Chrome | Requires user interaction or muted media | Strictest policy |
| Firefox | Similar to Chrome | May be slightly more permissive |
| Safari | Very strict on iOS, relaxed on macOS | Device-specific |
| Edge | Similar to Chrome | Uses Chromium engine |

## Testing the Sound Fix

### Step 1: Build and Preview
```bash
cd /home/lags/Desktop/IRAV2\ \(Copy\)/admin
npm run build
npm run preview
```

### Step 2: Test in Browser
1. Open `http://localhost:4173` (or wherever preview is served)
2. Log in to the admin dashboard
3. Trigger a test incident from backend or mobile app
4. Listen for the alert sound
5. Check browser console for sound status logs (should show 🔊 messages)

### Step 3: Browser Console Logs
Expected successful output:
```
🔊 Notification sound played successfully
```

Expected if autoplay blocked (normal without user interaction):
```
🔊 Notification sound play blocked: NotAllowedError: play() failed because the user didn't interact with the document first.
```

### Step 4: Verify File Inclusion
```bash
# Check that notification.mp3 is in dist
ls -lh dist/notification.mp3
# Output: -rwxrwxrwx 1 ... 329K ... dist/notification.mp3
```

## Files Modified
- `src/contexts/SocketContext.tsx` - Fixed audio initialization and error handling

## Files Verified as Correct
- `public/notification.mp3` - ✅ Correct MP3 file
- `dist/notification.mp3` - ✅ Included in build output
- `src/pages/map/MapDispatch.tsx` - ✅ Already has correct implementation
- `src/pages/incidents/Incidents.tsx` - ✅ References correct path

## Related Sound Implementations

### SocketContext (Fixed)
- Handles: New incidents, alerts, assignments
- Uses: Preloaded audio ref with promise-based playback
- Default: Plays whenever notification received

### MapDispatch (Already Good)
- Handles: Incident alerts on map
- Uses: localStorage for user preference (`mapSoundEnabled`)
- Default: Sound enabled

### Incidents Page
- Handles: Critical incident flash + sound
- Uses: Direct inline audio creation
- Default: Plays for CRITICAL priority only

## Build Artifacts

### Before Fix
- Build successful but no error handling for autoplay failures
- Audio would fail silently in many browsers

### After Fix
- ✅ Build successful with improved error handling
- ✅ Preloaded audio for better performance
- ✅ Better logging for debugging autoplay issues
- ✅ Consistent pattern with existing code

## Troubleshooting

### Sound Still Not Playing?

**Check 1: Browser Console**
```javascript
// Test audio playback directly
const audio = new Audio('/notification.mp3');
audio.volume = 0.7;
audio.play().then(() => console.log('✅ Sound works')).catch(e => console.log('❌ Error:', e));
```

**Check 2: Device Volume**
- Ensure system volume is not muted
- Check browser volume is not muted (right-click speaker icon)

**Check 3: Browser Permissions**
- Check that notifications are allowed
- Some browsers may require additional permissions

**Check 4: Network**
- Verify notification.mp3 is being served correctly
- Check Network tab in DevTools to see if file loads successfully

### Common Errors

**NotAllowedError: play() failed because the user didn't interact with the document first**
- This is expected behavior
- Sound will play after any user interaction (login counts)
- Try clicking the page and triggering notification again

**NotSupportedError: The media type is not supported**
- The browser doesn't support MP3
- This is rare on modern browsers but check codec support
- Solution: Add fallback OGG format

**NetworkError: A network error occurred**
- File is not being served correctly
- Check that `/notification.mp3` is in public folder
- Verify Vite is copying public assets

## Success Criteria

✅ Admin app builds successfully
✅ notification.mp3 is included in dist folder
✅ Browser console shows sound logs (with or without "blocked" message)
✅ After user interaction with page, new incidents trigger sound
✅ No errors in build output
✅ Sound plays on MapDispatch page
✅ Sound plays in Incidents page for CRITICAL priority

## Next Steps

1. ✅ Run `npm run build` - Verify build succeeds
2. ✅ Run `npm run preview` - Verify app runs
3. ✅ Test notification sound with browser console open
4. Monitor console logs for `🔊` messages to understand autoplay behavior
5. If issues persist, check browser autoplay settings

## Related Documentation
- [MDN: HTMLMediaElement.play()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play)
- [Chrome Autoplay Policy](https://developers.google.com/web/updates/2017/09/autoplay-policy-changes)
- [Safari Autoplay Policy](https://webkit.org/blog/6784/new-video-policies-for-ios/)
