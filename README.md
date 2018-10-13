# Move events proposal

Okay. Implementing drag'n'drop interfaces is tedious. There are
too many problems with how it is normally done for me to
list them here. So I'll fix them instead. 

# Usage

```javascript
element.moveHandler = class Move {
  onStart(event) {
    event.preventDefault()
    this.snapshot = document.createSnapshot(this.element)
    this.element.style.opacity = 0
    this.snapshot.place({
      x: event.snapshotX,
      y: event.snapshotY
    })
  }

  onMove(event) {
    this.snapshot.move({
      x: event.snapshotX,
      y: event.snapshotY,
    })
  }

  onEnd(event) {
    this.element.style.opacity = 1
    this.snapshot.remove()
  }
}
```

Live example:
https://adrianhelvik.github.io/proposal-move-events

## No proper move events

HTML5 drag'n'drop events are not a pleasure to use, so we
tend to implement things using mose and touch events.
When doing this it is way too common to duplicate logic.

So I propose a new way to handle this...

## Moves

An important rationale behind moves is that a move has a
start, a duration and an end. For mouse events that is okay.
There is only one mouse, so you can easily add an event
for mousedown, mousemove and mouseup (using the APIs however...).

For touch events however, we can have multiple touches.
How should we handle that? We have to store the index of
the touchstart for use in touchmove (or as most people do,
just use event.touches[0]). Touches are stateful and the
current abstraction encourages abuse. Let's create a
better one!

Lets call the abstraction a move. A move has a start, a
beginning and an end and shares data between these three
states. What a perfect use case for classes.

```javascript
class Move {
  onStart(event) {}
  onMove(event) {}
  onEnd(event) {}
}
```

Perfect! We now need a way to attach a move to an element.
What should the API be for this? I am not 100% happy with
it. Naming things is hard! But here it goes.

```javascript
element.moveHandler = Move
```

## Element snapshots

Another issue with current drag'n'drop solutions is moving
a clone of or the dragged element.

### Problem 1 - Styling

CSS rules are finicky. You can't just place an element in
another location and expect it to look the same. Current
solutions include moving the item in place, CSS-in-JS and
inline styles. Those may work for one code base, but it's
hard to generalize.

I imagine you could extract the computed styles to style
a cloned subtree. (Which is what I am planning for this
implementation) But that is overkill to manually implement
for day to day styling needs and will not be the most
performant either. CSS-in-JS + deep cloning nodes is what
I usually use and it works very well. But when shadow DOM
starts being usable, we need something that works with CSS.

### Problem 2 - Position and overflow

As I mentioned, I usually use CSS-in-JS and clone dragged
elements and place them directly inside the body element.

This does not work well with nested CSS rules. When we have
nested CSS rules we want to position the original element.
This is nightmare fuel when it comes to apps with comples
layout. Positioning and overflow can make it impossible.

### Problem 3 - Cloned elements are not synchronized with the original element

...

### Problem 4 - It is cumbersome to access the element beneath the original element

...

### The solution

```javascript

// First we create a snapshot. This
// is a pixel perfect duplicate of
// the element. Snapshots are opaque.
// Meaning that you can't extract
// any information about the contents
// of the snapshot. Think of it as
// an image.
const snapshot = document.createSnapshot(element)

// Then we place it on the screen.
// This does not have too trigger
// a layout reflow, as it is merely
// a picture. It will also have
// the exact same dimensions as the
// original element.

// using place({ x, y })
snapshot.place({ x: 100, y: 200 })

// using place({ x, y, width, height })
snapshot.place({ x: 100, y: 200, width: 100, height: 400 })

// And assuming that the element
// has changed, we can simply update
// the snapshot to match the original
// element. This would probaly be a
// common way to do that.
element.style.opacity = 1
snapshot.update()
element.style.opacity = 0

// And when we want to remove the
// snapshot, that is simple as well.
snapshot.remove()
```

Snapshots do not interact with the user in any way.
A snapshot acts like an image with `pointer-events: none;`
except that it is not visible in the DOM.

## Snapshot coordinates in the move handler

...
