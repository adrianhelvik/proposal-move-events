import './checkEnvironment.js'
import { polyfill as polyfillMoveHandler, setMoveHandler, getMoveHandler } from './moveHandler.js'
import { polyfill as polyfillSnapshot, createSnapshot } from './snapshot.js'
import cloneNode from './cloneNode.js'

export function polyfill(options) {
  polyfillMoveHandler(options)
  polyfillSnapshot(options)
}

export {
  createSnapshot,
  setMoveHandler,
  getMoveHandler,
  cloneNode,
}
