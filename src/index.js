import { polyfill as polyfillMoveHandler, setMoveHandler, getMoveHandler } from './moveHandler.js'
import { polyfill as polyfillSnapshot, createSnapshot } from './snapshot.js'

export function polyfill(options) {
  polyfillMoveHandler(options)
  polyfillSnapshot(options)
}

export {
  createSnapshot,
  setMoveHandler,
  getMoveHandler
}
