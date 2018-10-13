import { polyfill as polyfillMoveHandler } from './moveHandler.js'
import { polyfill as polyfillSnapshot } from './snapshot.js'

export function polyfill(options) {
  polyfillMoveHandler(options)
  polyfillSnapshot(options)
}
