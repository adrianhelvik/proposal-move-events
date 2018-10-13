export function polyfill() {
  document.createSnapshot = createSnapshot
}

function createSnapshot(element) {
  return new Snapshot(element)
}

class Snapshot {
  constructor(element) {
    this.element = element
    this.clone = this.element.cloneNode(true)
    this.clone.style.position = 'fixed'
    this.clone.style.left = 0
    this.clone.style.top = 0
  }

  place({ x, y }) {
    this.move({ x, y })
    document.body.appendChild(this.clone)
  }

  move({ x, y }) {
    this.clone.style.transform = `translateX(${x}px) translateY(${y}px)`
  }

  remove() {
    this.clone.remove()
  }
}
