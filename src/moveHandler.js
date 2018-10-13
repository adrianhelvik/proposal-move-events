function polyfill(options = {}) {
  if (! options.force && HTMLElement.prototype.hasOwnProperty('moveHandler'))
    return console.warn('moveHandler is already implemented. Not polyfilling. Call polyfill({ force: true }) to polyfill anyways.')

  Object.defineProperty(HTMLElement.prototype, 'moveHandler', {
    get() {
      return getMoveHandler(this)
    },
    set(moveHandler) {
      return setMoveHandler(this, moveHandler)
    }
  })
}

let supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true
    }
  })
  window.addEventListener("testPassive", null, opts)
  window.removeEventListener("testPassive", null, opts)
} catch (e) {}

const _touchstart_ = Symbol('move/touchstart')
const _touchmove_ = Symbol('move/touchmove')
const _touchend_ = Symbol('move/touchend')
const _mousedown_ = Symbol('move/mousedown')
const _mousemove_ = Symbol('move/mousemove')
const _mouseup_ = Symbol('move/mouseup')
const moveHandlers = new WeakMap()

function setMoveHandler(element, Move) {
  if (moveHandlers.has(element))
    unmountMoveHandler(element, Move)
  if (Move) {
    mountMoveHandler(element, Move)
    moveHandlers.set(element, Move)
  }
}

function getMoveHandler(element) {
  unmountMoveHandler(element)
  return moveHandlers.get(element)
}

function mountMoveHandler(element, Move) {
  element.addEventListener('touchstart', element[_touchstart_] = event => {
    const move = initializeTouchMove(Move, event, element)
    const touchIndex = event.touches.length - 1

    const { clientX: initialClientX, clientY: initialClientY } = event.touches[touchIndex]
    let previousEvent = event

    if (typeof move.onStart === 'function')
      move.onStart(MoveEvent.fromTouchStart(event, element, touchIndex, initialClientX, initialClientY))

    document.addEventListener('touchmove', element[_touchmove_] = event => {
      previousEvent = event
      if (typeof move.onMove === 'function')
        move.onMove(MoveEvent.fromTouchMove(event, element, touchIndex, initialClientX, initialClientY))
    })

    document.addEventListener('touchend', element[_touchend_] = event => {
      if (event.touches.length === touchIndex) {
        document.removeEventListener('touchmove', element[_touchmove_])
        element[_touchmove_] = null
        document.removeEventListener('touchend', element[_touchend_])
        element[_touchend_] = null
        if (typeof move.onEnd === 'function')
          move.onEnd(MoveEvent.fromTouchEnd(event, element, touchIndex, previousEvent, initialClientX, initialClientY))
      }
    })
  }, supportsPassive ? { passive: false } : false)

  element.addEventListener('mousedown', element[_mousedown_] = event => {
    const move = initializeMouseMove(Move, event, element)

    const { clientX: initialClientX, clientY: initialClientY } = event
    let previousEvent = event

    if (typeof move.onStart === 'function')
      move.onStart(MoveEvent.fromMouseDown(event, element, initialClientX, initialClientY))

    document.addEventListener('mousemove', element[_mousemove_] = event => {
      previousEvent = event
      if (typeof move.onMove === 'function')
        move.onMove(MoveEvent.fromMouseMove(event, element, initialClientX, initialClientY))
    })

    document.addEventListener('mouseup', element[_mouseup_] = event => {
      document.removeEventListener('mousemove', element[_mousemove_])
      element[_mousemove_] = null
      if (typeof move.onEnd === 'function')
        move.onEnd(MoveEvent.fromMouseUp(event, element, initialClientX, initialClientY))
    })
  })
}

function unmountMoveHandler(element) {
  if (element[_touchstart_]) {
    element.removeEventListener('touchstart', element[_touchstart_])
    element[_touchstart_] = null
  }
  if (element[_touchmove_]) {
    element.removeEventListener('touchstart', element[_touchmove_])
    element[_touchmove_] = null
  }
  if (element[_touchend_]) {
    element.removeEventListener('touchstart', element[_touchend_])
    element[_touchend_] = null
  }
  if (element[_mousedown_]) {
    element.removeEventListener('mousedown', element[_mousedown_])
    element[_mousedown_] = null
  }
  moveHandlers.delete(element)
}

function initializeTouchMove(Move, event, element) {
  const move = new Move()
  def(move, 'type', 'touch')
  def(move, 'touchIndex', event.touches.length - 1)
  def(move, 'element', element)
  return move
}

function initializeMouseMove(Move, event, element) {
  const move = new Move()
  def(move, 'type', 'mouse')
  def(move, 'touchIndex', null)
  def(move, 'element', element)
  return move
}

function def(object, property, value) {
  Object.defineProperty(object, property, {
    value,
    configurable: false,
    writable: false,
  })
}

class MoveEvent {
  static fromTouchStart(event, element, touchIndex, initialClientX, initialClientY) {
    const instance = new MoveEvent()
    instance.initialClientX = initialClientX
    instance.initialClientY = initialClientY
    instance.element = element
    const touch = event.touches[touchIndex]
    instance.extractInfoFromTouch(touch)
    instance.preventDefault = () =>
      event.preventDefault()
    instance.setDerivedProperties()
    return instance
    return instance
  }

  static fromTouchMove(event, element, touchIndex, initialClientX, initialClientY) {
    const instance = new MoveEvent()
    instance.initialClientX = initialClientX
    instance.initialClientY = initialClientY
    instance.element = element
    const touch = event.touches[touchIndex]
    instance.extractInfoFromTouch(touch)
    instance.setDerivedProperties()
    return instance
  }

  static fromTouchEnd(event, element, touchIndex, previousEvent, initialClientX, initialClientY) {
    const instance = new MoveEvent()
    instance.initialClientX = initialClientX
    instance.initialClientY = initialClientY
    instance.element = element
    const touch = previousEvent.touches[touchIndex]
    instance.extractInfoFromTouch(touch)
    instance.setDerivedProperties()
    return instance
  }

  static fromMouseDown(event, element, initialClientX, initialClientY) {
    const instance = new MoveEvent()
    instance.initialClientX = initialClientX
    instance.initialClientY = initialClientY
    instance.element = element
    instance.extractInfoFromMouseEvent(event)
    instance.preventDefault = () =>
      event.preventDefault()
    instance.setDerivedProperties()
    return instance
  }

  static fromMouseMove(event, element, initialClientX, initialClientY) {
    const instance = new MoveEvent()
    instance.initialClientX = initialClientX
    instance.initialClientY = initialClientY
    instance.element = element
    instance.extractInfoFromMouseEvent(event)
    instance.setDerivedProperties()
    return instance
  }

  static fromMouseUp(event, element, initialClientX, initialClientY) {
    const instance = new MoveEvent()
    instance.initialClientX = initialClientX
    instance.initialClientY = initialClientY
    instance.element = element
    instance.extractInfoFromMouseEvent(event)
    instance.setDerivedProperties()
    return instance
  }

  extractInfoFromTouch(touch) {
    this.clientX = touch.clientX
    this.clientY = touch.clientY
  }

  extractInfoFromMouseEvent(event) {
    this.clientX = event.clientX
    this.clientY = event.clientY
  }

  setDerivedProperties() {
    const rect = this.element.getBoundingClientRect()
    this.insetX = this.initialClientX - rect.left
    this.insetY = this.initialClientY - rect.top
    this.snapshotX = this.clientX - this.insetX
    this.snapshotY = this.clientY - this.insetY
  }
}

export {
  setMoveHandler,
  getMoveHandler,
  MoveEvent,
  polyfill
}
