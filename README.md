# Museum AR Experience

A professional, multi-page browser-based museum AR experience using MindAR (image tracking), WebXR (plane detection), and Three.js with elegant museum aesthetics inspired by the Crow Museum of Asian Art.

## 🎯 Features

### Dual AR Modes
- **Marker AR (MindAR)**: Point camera at exhibit markers for tracked AR (works on all devices)
- **Surface AR (WebXR)**: Tap to place objects on any surface - Android Chrome only (experimental)

### Multi-Page Architecture
- **Home Page**: Museum-inspired 40/60 split hero layout with elegant typography
- **Museum Map**: Interactive SVG floor plan with museum green accents
- **Art Collection**: Editorial grid with generous whitespace and museum styling
- **Object Detail**: 3D preview with OrbitControls and dual AR options
- **AR Viewers**: Full immersive AR experiences (marker-based and plane detection)

### Museum Design System
- **Color Palette**: Museum green (#1E5A43) with gold accents (#C8A96A)
- **Typography**: Inter (sans-serif) + Playfair Display (serif) for elegant hierarchy
- **Layout**: Editorial spacing with 80px-120px padding, calm transitions
- **Aesthetics**: Minimal borders, generous whitespace, sophisticated museum feel

### Key Highlights
- ✨ **Dual AR Options**: Choose between marker tracking or surface placement
- 🔋 **Battery Conscious**: No WebGL on landing pages, camera only when needed
- 📱 **Mobile First**: Touch gestures, responsive design, 48px minimum targets
- 🎮 **Interactive 3D**: Orbit controls for model preview before AR
- 🧹 **Proper Cleanup**: Memory leak prevention with complete resource disposal
- 🎨 **Museum Aesthetic**: Crow Museum-inspired elegant design system

## 📁 Project Structure

```
Museum/
├── index.html                    # Single-page shell with Google Fonts
├── js/
│   ├── main.js                  # App entry point
│   ├── router.js                # Hash-based router
│   ├── pages/
│   │   ├── home.js              # Museum-style home page (40/60 split)
│   │   ├── map.js               # Museum map with green accents
│   │   ├── collection.js        # Editorial art collection grid
│   │   ├── object-detail.js     # 3D preview + dual AR buttons
│   │   ├── ar-viewer.js         # MindAR marker tracking
│   │   └── ar-plane.js          # WebXR surface placement (NEW)
│   ├── data/
│   │   ├── collection.js        # Object data (4 objects)
│   │   └── thumbnails.js        # Placeholder thumbnails
│   └── utils/
│       ├── three-viewer.js      # OrbitControls 3D viewer
│       ├── ar-controller.js     # MindAR session manager
│       ├── webxr-controller.js  # WebXR session manager (NEW)
│       └── device-detection.js  # Android Chrome detection (NEW)
├── styles/
│   ├── global.css               # Museum design system
│   ├── home.css                 # Hero split layout
│   ├── collection.css           # Editorial grid
│   ├── map.css                  # Museum green accents
│   ├── detail.css               # Elegant object layout
│   ├── ar.css                   # Marker AR styles
│   └── ar-plane.css             # Surface AR styles (NEW)
└── assets/
    ├── buddha.glb               # 3D Buddha model
    └── targets.mind             # MindAR tracking targets
```

## 🚀 Running the App

**IMPORTANT**: Use a local web server (not `file://`)

```bash
# From the repo root:
npx serve

# Then open the URL shown (e.g., http://localhost:3000)
```

**Requirements:**
- HTTPS or localhost (for camera permissions)
- Modern browser with WebGL support
- Physical or digital exhibit markers for AR

## 🎮 User Flow

1. **Home Page** → Museum-inspired split layout
   - Left: Museum green brand panel with elegant typography
   - Right: Animated gradient background
   - Two action buttons with museum styling

2. **Collection Page** → Editorial grid (350px+ cards)
   - Buddha Statue (full AR + 3D + WebXR)
   - Ancient Vase (placeholder)
   - Marble Bust (placeholder)
   - Golden Relic (placeholder)

3. **Object Detail** → 3D preview with museum layout
   - OrbitControls viewer (rotate, zoom)
   - Elegant metadata display with serif subtitles
   - **Dual AR Options:**
     - "Launch Marker AR" - Point at exhibit marker (all devices)
     - "Place on Surface" - Tap to place (Android Chrome only)

4. **Marker AR** → MindAR tracking
   - Camera activates
   - Point at exhibit marker
   - Model appears fixed to marker
   - Touch gestures: rotate, scale, move

5. **Surface AR** → WebXR plane detection (NEW)
   - Camera scans environment
   - Reticle appears on detected surfaces
   - Tap screen to place model
   - Place multiple instances
   - Exit returns to detail page

## 🛠️ Technical Architecture

### Dual AR System

**1. Marker AR (MindAR) - Universal**
- Image marker tracking
- Works on all devices with camera
- Compiled `.mind` target files
- Fixed position relative to marker

**2. Surface AR (WebXR) - Android Chrome Only**
- Plane detection (floor/tables)
- Tap-to-place functionality
- Multiple object placement
- ⚠️ Experimental feature - requires ARCore

### Museum Design System

**Color Palette:**
- Museum Green: `#1E5A43` (primary)
- Gold Accent: `#C8A96A` (highlights)
- Cream Background: `#F3F3F3`
- Text Primary: `#111111`

**Typography:**
- Headings: Inter (modern sans-serif, 500 weight)
- Subtitles: Playfair Display (elegant serif, italic)
- Body: 16px, 1.8 line-height

**Design Principles:**
- Generous whitespace (80-120px sections)
- Editorial layouts (40/60 split, large imagery)
- Minimal 1px borders with subtle gold accents
- Calm 300-400ms transitions
- Museum-quality aesthetic

### Client-Side Routing
Hash-based routing (`#/route`) for static deployment:
- `#/` - Home (museum 40/60 split)
- `#/map` - Museum Map (green accents)
- `#/collection` - Art Collection (editorial grid)
- `#/object/:id` - Object Detail (3D + dual AR)
- `#/object/:id/ar` - Marker AR (MindAR)
- `#/object/:id/ar-plane` - Surface AR (WebXR - Android only)

### Memory Management
- **Three.js Cleanup**: Dispose geometries, materials, textures on page change
- **Camera Stream Cleanup**: Stop all MediaStream tracks when exiting AR
- **Event Listeners**: Proper removal on route changes
- **Page Visibility API**: Pause rendering when tab hidden

### Touch Gestures (AR Mode)
- **One finger drag**: Rotate model on world axes
- **Two finger pinch**: Scale up/down
- **Two finger drag**: Move position (pan)

### 3D Viewer Features
- OrbitControls with damping
- Auto-rotation toggle
- Reset camera button
- Proper lighting (ambient + directional + hemisphere)
- Material optimization

## 🎨 Design System

### Colors
- Primary: `#2a5298` (Museum blue)
- Accent: `#f59e42` (Warm gold)
- Background: `#0a0e1a` (Deep navy)
- Surface: `rgba(255,255,255,0.05)` (Glassmorphism)

### Typography
- System fonts for performance
- Mobile-first sizing
- Clear hierarchy

### Animations
- CSS-only on landing pages (no WebGL)
- Subtle gradient shifts
- Smooth page transitions
- Micro-interactions on buttons

## 📱 Mobile Optimization

- Minimum 48x48px touch targets
- Prevent zoom on double-tap
- Smooth scrolling with momentum
- Prevent pull-to-refresh on AR page
- Hardware acceleration for animations
- Responsive breakpoints: 640px, 768px, 1024px

## 🔒 Battery & Privacy

- **No Auto-Start**: Camera never activates automatically
- **Clear Disclaimers**: Users informed about battery usage
- **Easy Exit**: Always-visible exit button in AR mode
- **Complete Cleanup**: Camera fully released on exit
- **Lightweight Home**: No WebGL on landing pages

## 🧪 Testing Checklist

- [x] Navigate between all pages
- [x] Back button works correctly
- [x] Camera only starts on AR page
- [x] Camera stops when exiting AR
- [x] 3D viewer cleanup on page exit
- [x] Touch gestures work on mobile
- [x] Responsive design on all breakpoints

## 📝 Object Collection

### Buddha Statue (Full AR + 3D)
- 12th Century Khmer sculpture
- Full 3D model with OrbitControls preview
- AR tracking available
- Touch gesture controls

### Placeholder Objects
Three additional objects with descriptions:
- **Ancient Vase** (Ming Dynasty)
- **Marble Bust** (Roman Empire)
- **Golden Relic** (Byzantine Empire)

## 🔮 Future Enhancements

- PWA support (offline mode)
- Multi-language support
- Social sharing (screenshot AR)
- Admin CMS for adding objects
- Advanced AR (occlusion, lighting estimation)
- Audio descriptions for accessibility
- Analytics integration

## 🎓 Learning Resources

- [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebXR Best Practices](https://www.w3.org/TR/webxr/)

## 📄 License

This project demonstrates professional WebAR implementation patterns.

---

**Built with**: MindAR 1.2.5 | Three.js 0.160.0 | Vanilla JavaScript ES6+
