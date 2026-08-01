---
name: motion-effect-web
description: >
  Expert cinematic motion effects for web builds — covering Image Reveal (cursor-driven CSS mask), Scroll-Triggered Video Playback, Mouse-Controlled Video Scrub, Scroll-Controlled Video Scrub, and Combined Multi-Module builds that chain all four in sequence. Use this skill whenever a user wants any cursor reveal, scroll-triggered animation, video scrub, mouse scrub, cinematic hero, immersive scroll experience, scroll-to-video, or combined Atoms-style build across React, Next.js, Vue, Svelte, vanilla HTML/CSS/JS, or any other web platform. Also triggers for "atoms build", "atoms guide", "image reveal hero", "scroll video section", "mouse scrub video", "scroll scrub", "combined build", or any request to wire video + scroll/mouse interaction on the web. Trigger even when the user only mentions one effect — the skill covers all variants and the combined build orchestration pattern.
compatibility: HTML/CSS/JS (vanilla), React, Next.js, Vue, Svelte — any web platform. No external libraries required for any effect.
---

# Motion Effect Web Skill

A complete implementation guide for five cinematic motion effects used in Atoms-style interactive web builds. Each effect is platform-agnostic: the core logic is vanilla JS/CSS; platform-specific adaptations are covered in the [Platform Adapters](#platform-adapters) section.

---

## Effect Catalogue

| # | Effect | Input | Interaction |
|---|--------|-------|-------------|
| 01 | [Image Reveal Hero](#01-image-reveal-hero) | 2 images (front + reveal) | Cursor reveals hidden image via CSS mask |
| 02 | [Scroll-Triggered Video](#02-scroll-triggered-video) | 1 video | One scroll gesture plays full video |
| 03 | [Mouse Video Scrub](#03-mouse-video-scrub) | 1 video | Mouse X maps to `video.currentTime` |
| 04 | [Scroll Video Scrub](#04-scroll-video-scrub) | 1 video | Scroll progress maps to `video.currentTime` |
| 05 | [Combined Build](#05-combined-build) | 2 images + 1–3 videos | All four effects sequenced |

---

## Pre-Flight Checklist (All Effects)

Run this before writing any code:

### Build Intent
Determine which of these applies:
- **standalone** — build only this effect from scratch.
- **add** — add to an existing project without touching other sections.
- **replace** — replace only the named section; leave everything else intact.
- **combined** — one piece of a multi-module build; confirm the order.

Infer from context when obvious. Ask one concise question only if truly ambiguous.

### Project Audit (if project exists)
Identify: existing sections, interactions, assets, navigation/state logic, input handlers, where the new section belongs. **Preserve working sections unless the intent is replacement. Use the smallest safe change.**

### Asset Preflight
- For images: confirm filename, path, size, decode. STOP if either role is missing.
- For videos: confirm filename, path, size, duration, dimensions via `loadedmetadata`. STOP if missing.
- Never use placeholders, stock assets, or external URLs.

---

## 01 Image Reveal Hero

**Stack two absolutely-positioned, `object-fit:cover` images. A `radial-gradient` mask-image on FRONT reveals REVEAL underneath as the cursor moves.**

### Core implementation

```html
<div class="reveal-hero">
  <img class="reveal-img" src="REVEAL.jpg" />   <!-- bottom layer -->
  <img class="front-img"  src="FRONT.jpg" />    <!-- top layer, masked -->
</div>
```

```css
.reveal-hero { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.reveal-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
/* contain option: replace object-fit: cover with object-fit: contain; */

.front-img {
  --reveal-x: 50%;
  --reveal-y: 50%;
  --radius: 0px;                /* 0 = closed (opaque) */
  mask-image: radial-gradient(circle var(--radius) at var(--reveal-x) var(--reveal-y), transparent 0%, black 100%);
  -webkit-mask-image: radial-gradient(circle var(--radius) at var(--reveal-x) var(--reveal-y), transparent 0%, black 100%);
}

@media (prefers-reduced-motion: reduce) {
  .front-img { mask-image: none; -webkit-mask-image: none; } /* show FRONT static */
}
```

```js
const hero  = document.querySelector('.reveal-hero');
const front = hero.querySelector('.front-img');

const RADIUS_OPEN   = 220; // px — tweak to taste
const RADIUS_CLOSED = 0;

let rafId = null;
let pendingX = null, pendingY = null;

hero.addEventListener('pointermove', e => {
  pendingX = e.clientX;
  pendingY = e.clientY;
  if (!rafId) rafId = requestAnimationFrame(updateMask);
});

hero.addEventListener('pointerleave', () => {
  cancelAnimationFrame(rafId);
  rafId = null;
  front.style.setProperty('--radius', RADIUS_CLOSED + 'px');
});

function updateMask() {
  rafId = null;
  const rect = hero.getBoundingClientRect();
  const x = pendingX - rect.left;
  const y = pendingY - rect.top;
  front.style.setProperty('--reveal-x', x + 'px');
  front.style.setProperty('--reveal-y', y + 'px');
  front.style.setProperty('--radius', RADIUS_OPEN + 'px');
}
```

### Rules
- CSS mask only — no WebGL, no canvas.
- Track cursor into CSS variables via **one rAF per move burst**, never on raw `pointermove`.
- Close mask (`--radius: 0px`) on `pointerleave`.
- Apply `prefers-reduced-motion` guard.

### Success criteria
- FRONT and REVEAL roles confirmed and wired correctly.
- Mask follows cursor smoothly.
- Mask closes on `pointerleave`.
- Existing sections and interactions remain intact.

---

## 02 Scroll-Triggered Video

**One downward scroll/wheel/touch gesture plays the full video from first to final frame. Input is locked during playback. Video freezes on the final frame.**

> ⚠️ This is **triggered playback** — NOT scroll scrub. Scroll progress must NOT be mapped to `video.currentTime`.

### Core implementation

```html
<section class="scroll-video-section">
  <video class="scroll-video" muted playsinline preload="auto"></video>
</section>
```

```css
.scroll-video-section { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.scroll-video { width: 100%; height: 100%; object-fit: cover; display: block; }
/* contain option: replace object-fit: cover with object-fit: contain; */
```

```js
const video   = document.querySelector('.scroll-video');
video.src     = 'YOUR_VIDEO.mp4';  // set to uploaded asset path

let playing   = false;
let done      = false;

const TRIGGERS = ['wheel', 'scroll', 'touchstart'];

function onTrigger(e) {
  // ignore upward scroll when done; only forward trigger is valid
  if (playing || done) return;
  const delta = e.deltaY ?? (e.type === 'touchstart' ? 1 : 0);
  if (delta <= 0) return;

  playing = true;
  // Lock input during playback
  TRIGGERS.forEach(t => window.addEventListener(t, swallow, { passive: false }));

  video.play().then(() => {}).catch(() => { playing = false; });
}

function swallow(e) { e.preventDefault(); }

video.addEventListener('ended', () => {
  video.pause();
  done    = true;
  playing = false;
  // Unlock input — page can now continue
  TRIGGERS.forEach(t => window.removeEventListener(t, swallow));
  // Signal next section here if in combined build
});

TRIGGERS.forEach(t => window.addEventListener(t, onTrigger, { passive: true }));
```

### Rules
- One gesture = full playback. No scrubbing, no restart.
- Lock all scroll/wheel/touch input **while playing**.
- Freeze on final frame (`video.pause()` in `ended`).
- Never call `play()` again after `done`.
- `prefers-reduced-motion`: skip the lock, let the video remain paused; or play once silently.

### Success criteria
- Video starts paused on frame 0.
- One downward gesture starts playback.
- Playback runs to completion.
- Video freezes on final frame.
- Extra gestures during playback are ignored.
- Scroll progress is never mapped to `currentTime`.

---

## 03 Mouse Video Scrub

**Mouse X maps horizontally to `video.currentTime`. Video stays paused. One rAF loop eases toward the target.**

```html
<section class="mouse-scrub-section">
  <video class="scrub-video" muted playsinline preload="auto"></video>
</section>
```

```css
.mouse-scrub-section { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
.scrub-video { width: 100%; height: 100%; object-fit: cover; display: block; }
/* contain option: replace object-fit: cover with object-fit: contain; */
```

```js
const video      = document.querySelector('.scrub-video');
video.src        = 'YOUR_VIDEO.mp4';

const EASE       = 0.12;   // 0 = instant, 1 = never moves
let targetTime   = 0;
let displayedTime = 0;
let rafRunning   = false;
let duration     = 0;

video.addEventListener('loadedmetadata', () => {
  duration = video.duration;
  video.currentTime = 0;
});
video.load();

document.addEventListener('mousemove', e => {
  const ratio = Math.max(0, Math.min(1, e.clientX / window.innerWidth));
  targetTime  = ratio * duration;
  if (!rafRunning) { rafRunning = true; requestAnimationFrame(tick); }
});

function tick() {
  const diff   = targetTime - displayedTime;
  if (Math.abs(diff) > 0.001) {
    displayedTime += diff * EASE;
    video.currentTime = displayedTime;      // one write per frame
    requestAnimationFrame(tick);
  } else {
    rafRunning = false;
  }
}
```

### Rules
- Mouse X → ratio → `targetTime`. Never write `currentTime` inside `mousemove`.
- Single rAF loop; start on first move, stop when settled.
- Video remains **paused throughout** — never call `play()`.
- Wait for `loadedmetadata` before reading `duration`.
- `object-fit: cover` to avoid black bars / flashes.
- For best results: source video encoded with short GOP (keyframe-every-frame) and `faststart`.

### Success criteria
- Mouse movement seeks the video horizontally.
- Video never autoplays.
- Scrub is smooth, no visible jitter.
- Existing sections intact.

---

## 04 Scroll Video Scrub

**Scroll progress maps continuously to `video.currentTime`. Scroll down → forward; scroll up → backward. Video stays paused.**

> ⚠️ This is **continuous scrub** — NOT triggered playback. See effect 02 for that.

```html
<div class="scroll-scrub-wrapper">
  <div class="scroll-scrub-track"></div>  <!-- tall scroll space -->
  <video class="scrub-video" muted playsinline preload="auto"></video>
</div>
```

```css
.scroll-scrub-wrapper {
  position: relative;
  height: 500vh;   /* scroll distance = scrub depth — adjust as needed */
}
.scroll-scrub-track { height: 100%; }
.scrub-video {
  position: sticky; top: 0;
  width: 100vw; height: 100vh;
  object-fit: cover; display: block;
}
/* contain option: replace object-fit: cover with object-fit: contain; */
```

```js
const wrapper  = document.querySelector('.scroll-scrub-wrapper');
const video    = wrapper.querySelector('.scrub-video');
video.src      = 'YOUR_VIDEO.mp4';

const EASE     = 0.12;
let targetTime = 0, displayedTime = 0;
let duration   = 0;
let rafRunning = false;

video.addEventListener('loadedmetadata', () => {
  duration = video.duration;
  video.currentTime = 0;
});
video.load();

window.addEventListener('scroll', () => {
  const rect     = wrapper.getBoundingClientRect();
  const scrollH  = wrapper.offsetHeight - window.innerHeight;
  const scrolled = -rect.top;  // how far we've scrolled into the wrapper
  const progress = Math.max(0, Math.min(1, scrolled / scrollH));
  targetTime     = progress * duration;
  if (!rafRunning) { rafRunning = true; requestAnimationFrame(tick); }
}, { passive: true });

function tick() {
  const diff = targetTime - displayedTime;
  if (Math.abs(diff) > 0.001) {
    displayedTime += diff * EASE;
    video.currentTime = displayedTime;
    requestAnimationFrame(tick);
  } else {
    rafRunning = false;
  }
}
```

### Rules
- Scroll progress → `targetTime`. Never write `currentTime` on raw scroll event.
- Backward scroll seeks backward.
- Video stays **paused** — never call `play()`.
- Wait for `loadedmetadata`.
- Keep separate from effect 02 (triggered playback).

### Success criteria
- Scrolling down seeks forward.
- Scrolling up seeks backward.
- Video never autoplays.
- Scrub is continuous and smooth, no beat-snapping.
- Existing sections intact.

---

## 05 Combined Build

**Assembles any combination of the four effects into a sequenced experience.**

### Default order (if user has no preference)
```
01 Image Reveal Hero → 02 Scroll-Triggered Video → 03 Mouse Scrub
```

### Asset-to-role mapping
| Role | Effect |
|------|--------|
| `hero-front` | 01 Image Reveal — front (top) image |
| `hero-reveal` | 01 Image Reveal — reveal (bottom) image |
| `scroll-video` | 02 Scroll-Triggered Video |
| `mouse-scrub-video` | 03 Mouse Scrub |
| `scroll-scrub-video` | 04 Scroll Scrub (only if included) |

Map uploaded files → roles **before writing code**. Report mapping. Stop if any required role has no file.

### Section sequencing

Use **fixed full-viewport sections stacked via z-index** or **sticky + scroll-driven reveal** depending on project structure. Preferred approach for vanilla:

```html
<body>
  <section id="reveal-hero">   <!-- 01 -->
  <section id="scroll-video">  <!-- 02 -->
  <section id="mouse-scrub">   <!-- 03 -->
  <section id="scroll-scrub">  <!-- 04, if included -->
  <footer id="finale">         <!-- final reveal layer -->
</body>
```

### State machine for transitions

Track `activeSection` globally. Unlock the next section's input handler only after the current section signals completion (e.g., `video.ended`, section exited). Pass a `onComplete` callback between modules.

### Finale / Transition layer

If the selected order needs a final reveal:
- Promote the `<footer>` to a fixed full-viewport layer (`position: fixed; z-index: 0`).
- Slide the previous section **up** to reveal the footer underneath.
- Apply only when it fits the selected order.
- Support **reverse navigation** through the assembled flow.
- Avoid document jump during transitions.

### Input isolation rules

When inside a scroll-triggered video (effect 02):
- Lock `wheel`, `scroll`, `touchstart` with `preventDefault`.
- Unlock after `ended`.

Mouse scrub and scroll scrub do not require locking.

### Reuse vs. rebuild

- **Existing modules that work** → connect and sequence; do not rewrite.
- **Missing modules** → build only what's missing, integrate into the flow.

### Success criteria
- Selected section order is implemented.
- All assets wired to correct roles.
- Effect 02 plays the full video on one gesture, freezes on final frame, never scrubs.
- Effect 03 seeks on mouse X; video never plays.
- Effect 04 (if included) seeks on scroll progress; video never plays.
- Forward navigation works.
- Reverse navigation works.
- No document jump during transitions.
- Existing sections and modules remain intact (unless intent is replacement).

---

## Platform Adapters

### Vanilla HTML / CSS / JS (default)
All code above runs as-is. Use `<script type="module">` for clean imports.

### React / Next.js

```jsx
import { useEffect, useRef } from 'react';

// 01 Image Reveal — React
function RevealHero({ frontSrc, revealSrc }) {
  const frontRef = useRef(null);
  const heroRef  = useRef(null);

  useEffect(() => {
    const hero  = heroRef.current;
    const front = frontRef.current;
    let rafId   = null;
    let px = 0, py = 0;

    const onMove = e => {
      px = e.clientX; py = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(update);
    };
    const onLeave = () => {
      cancelAnimationFrame(rafId); rafId = null;
      front.style.setProperty('--radius', '0px');
    };
    const update = () => {
      rafId = null;
      const r = hero.getBoundingClientRect();
      front.style.setProperty('--reveal-x', (px - r.left) + 'px');
      front.style.setProperty('--reveal-y', (py - r.top) + 'px');
      front.style.setProperty('--radius', '220px');
    };

    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section ref={heroRef} className="reveal-hero">
      <img className="reveal-img" src={revealSrc} alt="" />
      <img className="front-img"  src={frontSrc}  alt="" ref={frontRef} />
    </section>
  );
}
```

Apply the same `useEffect` + `useRef` pattern for effects 02–04.

**Next.js notes:**
- Use `'use client'` directive for all motion components.
- For video, add `<video ... suppressHydrationWarning />`.
- Video `src` must be in `/public` or use a dynamic import for the path.
- `object-fit: cover` may need `style={{ objectFit: 'cover' }}` inline.

### Vue 3

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
const heroRef = ref(null);
const frontRef = ref(null);
let rafId = null;

function onMove(e) {
  const px = e.clientX, py = e.clientY;
  if (!rafId) rafId = requestAnimationFrame(() => {
    rafId = null;
    const r = heroRef.value.getBoundingClientRect();
    frontRef.value.style.setProperty('--reveal-x', (px - r.left) + 'px');
    frontRef.value.style.setProperty('--reveal-y', (py - r.top) + 'px');
    frontRef.value.style.setProperty('--radius', '220px');
  });
}
function onLeave() {
  cancelAnimationFrame(rafId); rafId = null;
  frontRef.value?.style.setProperty('--radius', '0px');
}
onUnmounted(() => cancelAnimationFrame(rafId));
</script>
```

### Svelte

Use `on:pointermove` / `on:pointerleave` on the element and `bind:this` for refs. Apply the same rAF throttle. Use `onDestroy` to cancel pending animation frames.

### Framer Motion / GSAP

These libraries can drive the CSS variable updates if already in the project, but are **not required**. The native rAF approach performs identically. Avoid using GSAP `ScrollTrigger` for effect 04 scrubbing if `video.currentTime` accuracy is critical — drive from native scroll events + rAF for tightest control.

---

## Video Encoding Tips

For effects 03 and 04 (scrub), video encode quality directly affects seek accuracy:

| Setting | Recommended |
|---------|-------------|
| Keyframe interval (GOP) | Every frame (or 1s max) |
| Container | MP4 with `faststart` (`moov` atom at front) |
| Codec | H.264 or AV1 |
| `-movflags +faststart` | Required for browser seek performance |

FFmpeg command for scrub-optimised export:
```bash
ffmpeg -i input.mp4 -vcodec libx264 -crf 20 -g 1 -movflags +faststart output.mp4
```

---

## Quick Reference: Common Mistakes

| Mistake | Correct approach |
|---------|-----------------|
| Writing `video.currentTime` in raw `mousemove` / `scroll` handler | Update `targetTime`; write `currentTime` only in rAF tick |
| Multiple `requestAnimationFrame` calls per frame | Gate with a `rafRunning` boolean |
| Reading `video.duration` before `loadedmetadata` | Always wait for the `loadedmetadata` event |
| Using `play()` in a scrub effect | Never call `play()` — seek only |
| Using CSS `scroll-behavior: smooth` on the document | Disables scroll-controlled scrub precision |
| Effect 02 using continuous scroll-to-time mapping | Effect 02 is triggered playback only |
| Effect 04 using triggered playback | Effect 04 maps scroll progress continuously |

---

## Verification Checklist

After implementation, confirm each item before reporting success:

### All effects
- [ ] Asset files are correctly mapped (no placeholders, no external URLs)
- [ ] `object-fit: cover` is set (or `contain` per comment)
- [ ] `prefers-reduced-motion` handled

### Effect 01
- [ ] Mask follows cursor smoothly
- [ ] Mask closes on `pointerleave`
- [ ] FRONT and REVEAL roles confirmed

### Effect 02
- [ ] Video starts paused on frame 0
- [ ] One gesture plays full video
- [ ] Video freezes on final frame
- [ ] Extra gestures during playback are ignored
- [ ] `video.currentTime` is never mapped to scroll progress

### Effect 03
- [ ] Mouse X seeks video
- [ ] Video never autoplays
- [ ] No visible jitter

### Effect 04
- [ ] Scroll down seeks forward
- [ ] Scroll up seeks backward
- [ ] Video never autoplays
- [ ] Scrub is continuous (no beat snapping)

### Combined build
- [ ] All roles mapped
- [ ] Forward navigation works
- [ ] Reverse navigation works
- [ ] No document jump during transitions
- [ ] Existing modules unaffected
