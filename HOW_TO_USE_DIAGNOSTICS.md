# WebXR Diagnostic Panel - How to Use

## 🎯 Purpose
Since you can't access the browser console on mobile, I've added an on-screen diagnostic panel that shows all logs and lets you copy them.

## 📱 How to Use on Your Phone

### Step 1: Go to AR Page
1. Navigate to the Buddha object detail page
2. Click "Place on Surface" button
3. You'll see the AR start screen

### Step 2: Open Diagnostics
1. Click the **"Show Diagnostics"** button (below "Start AR Session")
2. A black panel will appear with:
   - **Device Info**: Your user agent, WebXR availability, Chrome version
   - **Live Logs**: All debug messages appear here in real-time
   - **Action Buttons**: "Copy Logs" and "Run AR Test"

### Step 3: Run the AR Test
1. Click **"Run AR Test"** button
2. Watch the logs appear showing each test step:
   - ✓ PASS = Test succeeded
   - ✗ FAIL = Test failed (shows why)
3. The test will:
   - Check if WebXR API exists
   - Check if immersive-ar is supported
   - Try to start an AR session (will ask for camera permission)

### Step 4: Copy Logs
1. After running the test, click **"Copy Logs"** button
2. Logs will be copied to clipboard
3. You can paste them in a message to me

### Step 5: Share Results
Send me the copied logs and I can tell you exactly what's wrong:
- If WebXR isn't available → Chrome version issue
- If immersive-ar not supported → ARCore issue
- If session request fails → Permission or compatibility issue

## 🔍 What the Diagnostics Show

### Device Information
```
User Agent: Your full browser string
WebXR Available: Yes ✓ or No ✗
AR Supported: Yes ✓ or No ✗
Chrome Version: The version number
```

### Common Scenarios

**Scenario 1: WebXR Not Available**
```
✗ FAIL: navigator.xr is undefined
→ WebXR not available in this browser
```
**Solution**: Update Chrome to version 79+

**Scenario 2: AR Not Supported**
```
✓ PASS: navigator.xr exists
✗ FAIL: immersive-ar not supported
→ Check ARCore installation
→ Check chrome://flags/#webxr
```
**Solution**: 
- Install Google Play Services for AR (ARCore)
- Enable WebXR in chrome://flags
- Make sure your device supports ARCore

**Scenario 3: Everything Works**
```
✓ PASS: navigator.xr exists
✓ PASS: immersive-ar is supported
✓ SUCCESS: AR session started!
```
**Result**: Camera permission prompt appears and AR works!

## 🛠️ Troubleshooting Steps

If you see "AR not supported":

1. **Check Chrome Version**
   - Open Chrome
   - Go to Settings → About Chrome
   - Should be version 79 or higher
   - Update if needed

2. **Check ARCore**
   - Go to Play Store
   - Search "Google Play Services for AR"
   - Make sure it's installed and updated

3. **Check Device Compatibility**
   - Not all Android devices support ARCore
   - Check: https://developers.google.com/ar/devices
   - Your device needs to be on the supported list

4. **Enable WebXR Flag** (if needed)
   - Open Chrome
   - Go to: chrome://flags
   - Search for "WebXR"
   - Enable "WebXR Incubations"
   - Restart Chrome

## 📋 What to Send Me

After clicking "Copy Logs", paste them here. They'll look like:

```
[11:38:52] Page loaded - initializing diagnostics
[11:38:52] User Agent: Mozilla/5.0...
[11:38:52] WebXR available: true
[11:38:52] Immersive AR supported: false
[11:38:53] === Running AR Compatibility Test ===
[11:38:53] Test 1: Checking WebXR API...
[11:38:53] ✓ PASS: navigator.xr exists
[11:38:53] Test 2: Checking immersive-ar support...
[11:38:53] ✗ FAIL: immersive-ar not supported
```

This tells me exactly what's wrong and how to fix it!

## 💡 Quick Actions

- **Show Diagnostics**: See device info and logs
- **Run AR Test**: Automated compatibility check
- **Copy Logs**: Get logs to share
- **Close (×)**: Go back to start screen
- **Start AR Session**: Try to launch AR anyway

The diagnostic panel stays open while you interact, so you can see what happens in real-time!
