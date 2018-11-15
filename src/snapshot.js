import cloneNode from './cloneNode.js'

export function polyfill() {
  document.createSnapshot = createSnapshot
}

export function createSnapshot(element, containerElement = document.body) {
  return new Snapshot(element, containerElement)
}

function Snapshot (element, containerElement) {
  if (! (this instanceof Snapshot))
    throw Error("Constructor cannot be invoked without 'new'")

  this.containerElement = containerElement
  this.element = element
  this.clone = cloneNode(this.element)
  this.clone.style.position = 'fixed'
  this.clone.style.left = 0
  this.clone.style.top = 0
  this.clone.style.pointerEvents = 'none'

  // We use the largest z-index. Mount order should
  // determine the layering of snapshots. They should
  // overlay any other DOM element.
  //
  // Reference: http://softwareas.com/whats-the-maximum-z-index/
  this.clone.style.zIndex = 2147483647
}

Snapshot.prototype.place = function ({ x, y }) {
  this.move({ x, y })
  this.containerElement.appendChild(this.clone)
}

Snapshot.prototype.move = function ({ x, y, transition = 0 }) {
  this.clone.style.transition = `transform ${transition}ms`
  this.clone.style.transform = `translateX(${x}px) translateY(${y}px)`
}

Snapshot.prototype.remove = function () {
  this.clone.parentNode.removeChild(this.clone)
}
