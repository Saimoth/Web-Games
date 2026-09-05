# Marble playground

Open `Marble.html` through GitHub Pages or a static web server. It keeps the
repository's existing `P5.js` dependency; no package installation or build is needed.
Ship `Marble.html`, `marble.js`, `marble-physics.js` and `P5.js` together.

## Playing

- **Line / Track:** draw a single wall or twin rails. Track endpoints snap together;
  returning to the starting point closes a loop.
- **Marbles:** tap or click for one, or hold and move to pour. Spawn positions are
  checked so adding a marble cannot create a severe overlap. Limit: 500 marbles.
- **Erase:** swipe an object to remove it. Undo and redo cover whole gestures,
  including a stream of marbles or an erasing stroke.
- **Speed:** maintain motion, as in the original game. **Boom:** explode a randomly
  selected marble and scatter its neighbours.
- **Pause:** freeze physics while drawing. More includes time scaling, starter
  scenes, clearing, the original per-type removal actions, device-local save/restore,
  and portable JSON scene export/import. Loading and clearing are undoable.
- Shortcuts: `1`–`4` tools, `Space` pause, `B` boom, `S` Speed,
  `Ctrl/Cmd Z` undo, `Ctrl/Cmd Shift Z` or `Ctrl/Cmd Y` redo.

The initial scene is a small bowl demonstration. Use **More → Empty canvas → Load
scene** for a blank playground. Saving is explicit; reopening does not overwrite
or automatically load your saved scene. Device-local storage does not sync between
computers or phones. Export/import transfers a scene.

## Why the old marbles leaked

The old loop integrated all its substeps before checking any collisions, handled
only the single deepest wall contact, applied partial separation, and blended with
an oriented segment normal even when it faced the wrong side. Ball separation could
move another marble through a thin wall. Its quadtree also held stale positions
while the solver moved objects. Physics speed depended on display frame rate.

`marble-physics.js` separates physics from the interface and fixes these mechanisms:

- A fixed 120 Hz clock with bounded catch-up and a reset on tab/background changes.
- Collision detection and solving inside every adaptive substep.
- Swept circle-versus-capsule collisions for wall faces **and endpoints**, including
  the movement caused by separating overlapping marbles. A corner contact budget
  discards unresolved motion rather than advancing it through a wall.
- Iterative contacts with support-impulse caching, low-speed restitution suppression,
  and full wall recovery. Both sides of a wall work independently of drawing direction.
- Spatial grids for nearby walls and marbles; the ball grid is rebuilt each iteration.
- Spawn checks and finite resource limits to avoid pathological user-created states.

Visible wall width and collision thickness are both 3 world pixels. Marbles retain
radius 12 and the track centre spacing remains 36. Screen sides still wrap and the
bottom remains open, preserving the original sandbox behaviour. Marbles can jump
out of an **open** bowl; that is different from tunnelling through its wall.

## Phone layout and geometry

The canvas occupies the space between the header and toolbar, including safe-area
padding. Canvas-only Pointer Events support mouse, touch and pen without synthetic
mouse/touch double firing. Pointer cancellation and rotation finish already-applied
edits as one undoable action and discard unfinished drawing previews.

Drawing uses fixed world coordinates. Resize, phone rotation and loading a scene
from another screen fit that world uniformly; they never rescale only the walls or
squeeze the marbles. A landscape scene on a narrow phone may be small. Loading a
new starter scene or clearing the canvas adopts the current viewport size.

Track objects own their centre geometry. Rails derive from it without independent
smoothing; joins combine the centres into one object and closed seams are explicit.
Deleting a separate line cannot invalidate track indices.

## Verification

Run with Node 22 or later:

```sh
node --check marble.js
node --check marble-physics.js
node --test tests/marble-*.test.cjs
```

The tests cover a sustained 300-marble deep pile, a curved segmented bowl containing
200 marbles under repeated impulses, thin-wall tunnelling in both directions,
endpoints and corners, overlap correction beside walls, coincident marbles,
frame-rate independence, bounded background catch-up, spawn checks, track joins and
closure, rotation coordinates, undo/redo, interrupted touch, and scene validation.
The curved impulse fixture has a lid so its containment assertion does not confuse
marbles jumping out of the opening with a wall failure.

The scene tests use a lightweight host to exercise JavaScript logic. They are **not**
real-browser visual tests. Desktop pointer behaviour and iPhone Safari layout still
need a hands-on playtest, especially narrow screens, orientation, modal scrolling,
and export/import. Actual frame rate depends on device, marble count, and geometry;
a 500-marble limit is a resource bound, not a guaranteed mobile performance target.

In a deterministic run of the original source, the same 300-marble rectangular
bowl first leaked at step 112 (about 0.93 simulated seconds); after 1,200 half-frame
steps only 168 remained. The regression fixture requires every marble to remain
inside the new solver's bowl through that full ten-second interval.
