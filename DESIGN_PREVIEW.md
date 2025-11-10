# Visual Design Preview 👀

## Homepage Layout

```
┌──────────────────────────────────────────────────────────┐
│ 🎤 QUESTION THE DAY        [EPISODES] [ADMIN] ★SUBSCRIBE★│
│ (Black header, white borders, yellow text)               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                                                          │
│        QUESTION THE DAY                                  │
│        (Huge yellow text with shadow)                    │
│                                                          │
│        >> DAILY STREET INTERVIEWS <<                     │
│                                                          │
│   ─────────────────────────────────────                 │
│   ⚠️ YOU'RE IN THE NEXT EPISODE! ⚠️                     │
│   Watch previous episodes below.                        │
│   Yours drops in 24 hours.                              │
│   ─────────────────────────────────────                 │
│                                                          │
└──────────────────────────────────────────────────────────┘

┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ [VIDEO] │  │ [VIDEO] │  │ [VIDEO] │  │ [VIDEO] │
│ THUMB   │  │ THUMB   │  │ THUMB   │  │ THUMB   │
│         │  │         │  │         │  │         │
│   ▶     │  │   ▶     │  │   ▶     │  │   ▶     │
│ CLICK   │  │ CLICK   │  │ CLICK   │  │ CLICK   │
│ TO      │  │ TO      │  │ TO      │  │ TO      │
│ WATCH   │  │ WATCH   │  │ WATCH   │  │ WATCH   │
└─────────┘  └─────────┘  └─────────┘  └─────────┘

┌──────────────────────────────────────────────────────────┐
│ © 2025 QUESTION THE DAY // ALL RIGHTS RESERVED          │
└──────────────────────────────────────────────────────────┘
```

## Color Palette

```
████ Black (#000000)    - Main background
████ White (#ffffff)    - Text & borders
████ Yellow (#ffff00)   - Primary accent, titles
████ Green (#00ff00)    - Secondary accent, success
████ Red (#ff0000)      - Warnings, subscribe button
```

## Video Card Design

### Default State
```
┌─────────────────────────┐
│ [CLICK TO WATCH]       │← Red badge, white border
│                         │
│    [Thumbnail]          │
│                         │
│        ▶                │← Yellow square, black play icon
│                         │
│─────────────────────────│← White border
│ Video Title Here        │← White text
│ Nov 10, 2025           │← Yellow monospace
└─────────────────────────┘
  White border
```

### Hover State
```
┌─────────────────────────┐
│ [CLICK TO WATCH]       │← Red badge
│                         │
│    [Thumbnail]          │
│    (slightly faded)     │
│        ▶                │← GREEN square (changes from yellow)
│                         │
│─────────────────────────│← YELLOW border (changes from white)
│ Video Title Here        │← Yellow text (changes from white)
│ Nov 10, 2025           │← Yellow monospace
└─────────────────────────┘
  Yellow border
```

## Video Modal

```
                                    [X CLOSE]
┌───────────────────────────────────────────────────┐
│                                                   │
│                                                   │
│                                                   │
│              [YouTube Embed]                      │
│                                                   │
│                                                   │
│                                                   │
├───────────────────────────────────────────────────┤
│ Video Title (yellow)                             │
│ Description text (white)...                      │
│                                                   │
│ Nov 10, 2025        [WATCH ON YOUTUBE] ★SUBSCRIBE★│
│ (green)             (yellow)           (red)     │
└───────────────────────────────────────────────────┘
      Yellow border around entire modal
```

## Button Styles

### Primary Button (Subscribe)
```
┌───────────────────┐
│ ★ SUBSCRIBE ★    │ ← White text, bold
│                   │   Red background
│                   │   White 4px border
└───────────────────┘   Pulsing animation
```

### Secondary Button
```
┌─────────────────┐
│ [BUTTON TEXT]   │ ← Black text, bold
│                 │   Yellow background
└─────────────────┘   White 2-4px border
```

### Link Button
```
┌─────────────────┐
│ [EPISODES]      │ ← White text, bold
│                 │   Black background
└─────────────────┘   White 2px border
```

## Admin Dashboard

```
┌──────────────────────────────────────────────────┐
│ [← BACK TO HOME]                                 │
│                                                  │
│ ADMIN DASHBOARD                                  │
│ >> MANAGE YOUR SITE                             │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ CONFIGURATION                                    │
│ ┌──────────────────────────────────────────────┐│
│ │ YouTube API Status: ✓ CONFIGURED            ││
│ └──────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────┐│
│ │ Auto-Refresh: EVERY 5 MINUTES               ││
│ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ MANUAL REFRESH                                   │
│ >> Click to fetch the latest videos             │
│                                                  │
│ [REFRESH VIDEOS NOW]                            │
└──────────────────────────────────────────────────┘
```

## Loading State

```
┌──────────────────────────────────┐
│                                  │
│        ┌────────────┐           │
│        │    ┌──┐    │           │ Yellow outer box
│        │    │▢▢│    │           │ Green spinning inner box
│        │    └──┘    │           │
│        └────────────┘           │
│                                  │
│    LOADING VIDEOS...             │ Blinking text
│    Please wait...                │
│                                  │
└──────────────────────────────────┘
```

## 404 Page

```
┌──────────────────────────────────┐
│                                  │
│           404                    │ Huge yellow text
│                                  │ Red shadow
│   ERROR: PAGE NOT FOUND          │
│                                  │
│   ─────────────────────         │
│   ⚠️ This page doesn't exist.   │
│   Check out our episodes!       │
│   ─────────────────────         │
│                                  │
│      [GO HOME]                  │ Green button
│                                  │
└──────────────────────────────────┘
```

## Typography Examples

### Headers
```
QUESTION THE DAY          (text-5xl, yellow, bold)
>> SUBTITLE <<            (text-xl, white, bold)
SECTION HEADER            (text-2xl, yellow, bold)
```

### Body Text
```
Regular text              (white, normal weight)
Important text            (yellow, bold)
Success message           (green, bold)
Error message             (red, bold)
```

### Code/Technical
```
.env.local                (monospace, yellow bg, black text)
/api/videos              (monospace, green text)
Nov 10, 2025             (monospace, yellow text)
```

## Spacing & Borders

```
Major sections:  border-4 (4px)
Minor sections:  border-2 (2px)
Padding:        p-4, p-6 (16px, 24px)
Gaps:           gap-3, gap-6 (12px, 24px)
```

## Animations

### 1. Fade In
- Used on page load
- 0.3s duration
- All major sections

### 2. Slide Up
- Used on hero title
- 0.3s duration
- Slides up 10px

### 3. Pulse (Subscribe Button)
- Continuous animation
- Fades in/out
- Draws attention

### 4. Blink (Loading Text)
- Old-school terminal effect
- 1s interval
- Text appears/disappears

### 5. Spin (Loading Box)
- Inner box rotates
- 1s duration
- Continuous

## Scrollbar Design

```
│█│  ← Yellow thumb with black border
│ │  ← Black track with yellow border
│█│
│ │
│ │
└─┘
```

## Hover Effects

```
Video Card:    white → yellow border
Play Button:   yellow → green background
Subscribe:     red → white background (text becomes red)
Links:         white → yellow text
Buttons:       slight color shift
```

## Mobile Responsive

### Desktop (>768px)
- All nav items visible
- 4-column video grid
- Full-width sections

### Tablet (768px - 1024px)
- Nav items visible
- 3-column video grid
- Adjusted padding

### Mobile (<768px)
- Hidden menu items (Episodes, Admin)
- Subscribe button always visible
- 1-column video grid
- Stacked buttons in modal

---

## Design Inspiration

**Feels Like:**
- Early YouTube (2005-2007)
- Geocities websites
- Windows 95/98 dialog boxes
- DOS programs
- Hacker terminals
- Classic web forums
- MySpace layouts

**NOT Like:**
- Modern minimalism
- Neumorphism
- Glassmorphism  
- Gradient everything
- Smooth animations
- Subtle shadows

---

## Quick Start Preview

Run the site and visit:
```
Homepage:     http://localhost:3000
Admin:        http://localhost:3000/admin
API:          http://localhost:3000/api/videos
404:          http://localhost:3000/any-wrong-page
```

**First Impression:**
"Whoa, this looks like a retro computer interface!"

**Desired Reaction:**
"This is so different and cool, I have to check it out!"

---

Ready to see it live? Run `npm run dev`! 🚀

