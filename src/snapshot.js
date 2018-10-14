import cloneNode from './cloneNode.js'

export function polyfill() {
  document.createSnapshot = createSnapshot
}

function createSnapshot(element) {
  return new Snapshot(element)
}

class Snapshot {
  constructor(element) {
    this.element = element
    this.clone = cloneNode(this.element)
    this.clone.style.position = 'fixed'
    this.clone.style.left = 0
    this.clone.style.top = 0
    this.clone.style.pointerEvents = 'none'
  }

  place({ x, y }) {
    this.move({ x, y })
    document.body.appendChild(this.clone)
  }

  move({ x, y, transition = 0 }) {
    this.clone.style.transition = `transform ${transition}ms`
    this.clone.style.transform = `translateX(${x}px) translateY(${y}px)`
  }

  remove() {
    this.clone.remove()
  }
}
