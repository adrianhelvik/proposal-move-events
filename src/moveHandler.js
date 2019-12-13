function polyfill(options) {
  if (!options) options = {}
  if (!options.force && Node.prototype.hasOwnProperty('moveHandler'))
    return console.warn(
      'moveHandler is already implemented. Not polyfilling. Call polyfill({ force: true }) to polyfill anyways.',
    )

  Object.defineProperty(Node.prototype, 'moveHandler', {
    get: function() {
      return getMoveHandler(this)
    },
    set: function(moveHandler) {
      return setMoveHandler(this, moveHandler)
    },
  })
}

var supportsPassive = false
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true
    },
  })
  window.addEventListener('testPassive', null, opts)
  window.removeEventListener('testPassive', null, opts)
} catch (e) {}

var _touchstart_ = Symbol('move/touchstart')
var _touchmove_ = Symbol('move/touchmove')
var _touchend_ = Symbol('move/touchend')
var _mousedown_ = Symbol('move/mousedown')
var _mousemove_ = Symbol('move/mousemove')
var _mouseup_ = Symbol('move/mouseup')
var moveHandlers = new WeakMap()

function setMoveHandler(element, Move) {
  if (moveHandlers.has(element)) unmountMoveHandler(element, Move)
  if (Move) {
    mountMoveHandler(element, Move)
    moveHandlers.set(element, Move)
  }
}

function getMoveHandler(element) {
  return moveHandlers.get(element)
}

function getTouchFromIdentifier(event, identifier) {
  for (var i = 0; i < event.touches.length; i++) {
    if (event.touches[i].identifier === identifier) {
      return event.touches[i]
    }
  }
}

function mountMoveHandler(element, Move) {
  if (!element[_touchmove_]) {
    element[_touchmove_] = []
    element[_touchend_] = []
  }

  element.addEventListener(
    'touchstart',
    (element[_touchstart_] = function(event) {
      var move = initializeTouchMove(Move, event, element)
      var touch = event.touches[event.touches.length - 1]
      var identifier = touch.identifier

      var initialClientX = touch.clientX
      var initialClientY = touch.clientY
      var previousEvent = event

      if (typeof move.onStart === 'function')
        move.onStart(
          MoveEvent.fromTouchStart(
            event,
            element,
            identifier,
            initialClientX,
            initialClientY,
          ),
        )

      var touchmove
      document.addEventListener(
        'touchmove',
        (touchmove = function(event) {
          previousEvent = event
          if (typeof move.onMove === 'function')
            move.onMove(
              MoveEvent.fromTouchMove(
                event,
                element,
                identifier,
                initialClientX,
                initialClientY,
              ),
            )
        }),
      )
      element[_touchmove_].push(touchmove)

      var touchend
      document.addEventListener(
        'touchend',
        (touchend = function(event) {
          var touch = getTouchFromIdentifier(event, identifier)

          if (!touch) {
            document.removeEventListener('touchmove', touchmove)
            var index = element[_touchmove_].indexOf(touchmove)
            if (index !== -1) element[_touchmove_].splice(index, 1)
            document.removeEventListener('touchend', touchend)
            index = element[_touchend_].indexOf(touchend)
            if (index !== -1) element[_touchend_].splice(index, -1)
            if (typeof move.onEnd === 'function')
              move.onEnd(
                MoveEvent.fromTouchEnd(
                  event,
                  element,
                  identifier,
                  previousEvent,
                  initialClientX,
                  initialClientY,
                ),
              )
          }
        }),
      )
      element[_touchend_].push(touchend)
    }),
    supportsPassive ? { passive: false } : false,
  )

  element.addEventListener(
    'mousedown',
    (element[_mousedown_] = function(event) {
      var move = initializeMouseMove(Move, event, element)

      var initialClientX = event.clientX
      var initialClientY = event.clientY

      if (typeof move.onStart === 'function')
        move.onStart(
          MoveEvent.fromMouseDown(
            event,
            element,
            initialClientX,
            initialClientY,
          ),
        )

      document.addEventListener(
        'mousemove',
        (element[_mousemove_] = function(event) {
          if (typeof move.onMove === 'function')
            move.onMove(
              MoveEvent.fromMouseMove(
                event,
                element,
                initialClientX,
                initialClientY,
              ),
            )
        }),
      )

      document.addEventListener(
        'mouseup',
        (element[_mouseup_] = function(event) {
          document.removeEventListener('mousemove', element[_mousemove_])
          document.removeEventListener('mouseup', element[_mouseup_])
          element[_mousemove_] = null
          if (typeof move.onEnd === 'function')
            move.onEnd(
              MoveEvent.fromMouseUp(
                event,
                element,
                initialClientX,
                initialClientY,
              ),
            )
        }),
      )
    }),
  )
}

function unmountMoveHandler(element) {
  if (element[_touchstart_]) {
    element.removeEventListener('touchstart', element[_touchstart_])
    element[_touchstart_] = null
  }
  if (element[_touchmove_]) {
    element[_touchmove_].forEach(function(handler) {
      document.removeEventListener('touchmove', handler)
    })
    element[_touchmove_] = null
  }
  if (element[_touchend_]) {
    element[_touchend_].forEach(function(handler) {
      document.removeEventListener('touchend', handler)
    })
    element[_touchend_] = null
  }
  if (element[_mousedown_]) {
    element.removeEventListener('mousedown', element[_mousedown_])
    element[_mousedown_] = null
  }
  if (element[_mousemove_]) {
    document.removeEventListener('mousemove', element[_mousemove_])
    element[_mousemove_] = null
  }
  if (element[_mouseup_]) {
    document.removeEventListener('mouseup', element[_mouseup_])
    element[_mouseup_] = null
  }
  moveHandlers.delete(element)
}

function initializeTouchMove(Move, event, element) {
  var move = new Move()
  def(move, 'type', 'touch')
  def(move, 'identifier', event.touches.length - 1)
  def(move, 'element', element)
  return move
}

function initializeMouseMove(Move, event, element) {
  var move = new Move()
  def(move, 'type', 'mouse')
  def(move, 'identifier', null)
  def(move, 'element', element)
  return move
}

function def(object, property, value) {
  Object.defineProperty(object, property, {
    value: value,
    configurable: false,
    writable: false,
  })
}

function MoveEvent() {
  if (!(this instanceof MoveEvent))
    throw Error("Constructor cannot be invoked without 'new'")
}

MoveEvent.fromTouchStart = function(
  event,
  element,
  identifier,
  initialClientX,
  initialClientY,
) {
  var instance = new MoveEvent()
  instance.initialClientX = initialClientX
  instance.initialClientY = initialClientY
  instance.element = element
  var touch = getTouchFromIdentifier(event, identifier)
  instance.extractInfoFromTouch(touch)
  instance.preventDefault = function() {
    event.preventDefault()
  }
  instance.cancelable = event.cancelable !== false
  instance.setDerivedProperties()
  return instance
}

MoveEvent.fromTouchMove = function(
  event,
  element,
  identifier,
  initialClientX,
  initialClientY,
) {
  var instance = new MoveEvent()
  instance.initialClientX = initialClientX
  instance.initialClientY = initialClientY
  instance.element = element
  var touch = getTouchFromIdentifier(event, identifier)
  instance.extractInfoFromTouch(touch)
  instance.setDerivedProperties()
  return instance
}

MoveEvent.fromTouchEnd = function(
  event,
  element,
  identifier,
  previousEvent,
  initialClientX,
  initialClientY,
) {
  var instance = new MoveEvent()
  instance.initialClientX = initialClientX
  instance.initialClientY = initialClientY
  instance.element = element
  var touch = getTouchFromIdentifier(previousEvent, identifier)
  instance.extractInfoFromTouch(touch)
  instance.setDerivedProperties()
  return instance
}

MoveEvent.fromMouseDown = function(
  event,
  element,
  initialClientX,
  initialClientY,
) {
  var instance = new MoveEvent()
  instance.initialClientX = initialClientX
  instance.initialClientY = initialClientY
  instance.element = element
  instance.extractInfoFromMouseEvent(event)
  instance.preventDefault = function() {
    event.preventDefault()
  }
  instance.cancelable = event.cancelable !== false
  instance.setDerivedProperties()
  return instance
}

MoveEvent.fromMouseMove = function(
  event,
  element,
  initialClientX,
  initialClientY,
) {
  var instance = new MoveEvent()
  instance.initialClientX = initialClientX
  instance.initialClientY = initialClientY
  instance.element = element
  instance.extractInfoFromMouseEvent(event)
  instance.setDerivedProperties()
  return instance
}

MoveEvent.fromMouseUp = function(
  event,
  element,
  initialClientX,
  initialClientY,
) {
  var instance = new MoveEvent()
  instance.initialClientX = initialClientX
  instance.initialClientY = initialClientY
  instance.element = element
  instance.extractInfoFromMouseEvent(event)
  instance.setDerivedProperties()
  return instance
}

MoveEvent.prototype.extractInfoFromTouch = function(touch) {
  this.clientX = touch.clientX
  this.clientY = touch.clientY
}

MoveEvent.prototype.extractInfoFromMouseEvent = function(event) {
  this.clientX = event.clientX
  this.clientY = event.clientY
}

MoveEvent.prototype.setDerivedProperties = function() {
  var rect = this.element.getBoundingClientRect()
  this.insetX = this.initialClientX - rect.left
  this.insetY = this.initialClientY - rect.top
  this.snapshotX = this.clientX - this.insetX
  this.snapshotY = this.clientY - this.insetY
}

export { setMoveHandler, getMoveHandler, MoveEvent, polyfill }
