# Move events proposal

Okay. Implementing drag'n'drop interfaces is tedious. There are
too many problems with how it is normally done for me to
list them here. So I'll fix them instead. 

# Usage as polyfill

```javascript
import { polyfill } from 'proposal-move-events'

polyfill()

element.moveHandler = class Move {
  onStart(event) {
    event.preventDefault()
    this.snapshot = document.createSnapshot(this.element)
    this.element.style.opacity = 0
    this.initialX = event.snapshotX
    this.initialY = event.snapshotY
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
    this.snapshot.move({
      x: this.initialX,
      y: this.initialY,
      transition: 300,
    })
    setTimeout(() => {
      this.element.style.opacity = 1
      this.snapshot.remove()
    }, 300)
  }
}
```

Live example:
https://adrianhelvik.github.io/proposal-move-events

# Usage as ponyfill

Use this in production, not the polyfill. The polyfill is
only intended as a demo of how this could be used if the
proposal is standardized.

```javascript
import { setMoveHandler, createSnapshot } from 'proposal-move-events'

setMoveHandler(element, class Move {
  onStart(event) {
    event.preventDefault()
    this.snapshot = createSnapshot(this.element)
    this.element.style.opacity = 0
    this.initialX = event.snapshotX
    this.initialY = event.snapshotY
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
    this.snapshot.move({
      x: this.initialX,
      y: this.initialY,
      transition: 300
    })
    setTimeout(() => {
      this.element.style.opacity = 1
      this.snapshot.remove()
    }, 300)
  }
})
```

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
