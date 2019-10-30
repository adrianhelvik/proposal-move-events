import clonableAttributes from './svgAttributes.js'
import svgTagNames from './svgTagNames.js'

var svgNamespace = 'http://www.w3.org/2000/svg'

export default function cloneNode(original) {
  switch (original.nodeType) {
    case Node.ELEMENT_NODE:
      var isSvg = false
      var clone

      for (var i = 0; i < svgTagNames.length; i++) {
        if (svgTagNames[i] === original.tagName) {
          isSvg = true
        }
      }

      if (isSvg) {
        clone = document.createElementNS(svgNamespace, original.tagName)
      } else {
        clone = document.createElement(original.tagName)
      }
      var computedStyle = getComputedStyle(original)

      for (var key in computedStyle) {
        if (computedStyle.hasOwnProperty(key)) {
          if (!/^[0-9]+$/.test(key)) clone.style[key] = computedStyle[key]
        }
      }

      if (isSvg) {
        for (var i = 0; i < clonableAttributes.length; i++) {
          if (original.hasAttribute(clonableAttributes[i])) {
            if (isSvg) {
              clone.setAttributeNS(
                null,
                clonableAttributes[i],
                original.getAttribute(clonableAttributes[i]),
              )
            } else {
              clone.setAttribute(
                clonableAttributes[i],
                original.getAttribute(clonableAttributes[i]),
              )
            }
          }
        }
      }

      for (var i = 0; i < original.childNodes.length; i++)
        clone.appendChild(cloneNode(original.childNodes[i]))

      return clone
    case Node.TEXT_NODE:
      return document.createTextNode(original.textContent)
    default:
      console.error('Unhandled node:', original, typeof original)
  }
}
