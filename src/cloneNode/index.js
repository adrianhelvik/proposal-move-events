import clonableAttributes from './svgAttributes.js'
import svgTagNames from './svgTagNames.js'

const whiteListedAttributes = ['width', 'height', 'src', 'placeholder']
const isWhitelistedClassName = className => {
  /**
   * Always allow font-awesome.
   */
  return /^fa(-.+)?$/.test(className)
}

let svgNamespace = 'http://www.w3.org/2000/svg'

export default function cloneNode(original) {
  switch (original.nodeType) {
    case Node.ELEMENT_NODE:
      let isSvg = false
      let clone

      for (let i = 0; i < svgTagNames.length; i++) {
        if (svgTagNames[i] === original.tagName) {
          isSvg = true
        }
      }

      if (isSvg) {
        clone = document.createElementNS(svgNamespace, original.tagName)
      } else {
        clone = document.createElement(original.tagName)
      }
      let computedStyle = getComputedStyle(original)

      for (let key in computedStyle) {
        if (computedStyle.hasOwnProperty(key) && /^[0-9]+/.test(key)) {
          const property = computedStyle[key]
          const value = computedStyle.getPropertyValue(property)
          clone.style[property] = value
        }
      }

      if (isSvg) {
        for (var i = 0; i < clonableAttributes.length; i++) {
          if (original.hasAttribute(clonableAttributes[i])) {
            clone.setAttribute(
              clonableAttributes[i],
              original.getAttribute(clonableAttributes[i]),
            )
          }
        }
      } else {
        const classes = Array.from(original.classList).filter(
          isWhitelistedClassName,
        )
        for (const className of classes) {
          clone.classList.add(className)
        }
        for (const name of whiteListedAttributes) {
          if (original.hasAttribute(name)) {
            clone.setAttribute(name, original.getAttribute(name))
          }
        }
      }

      for (let i = 0; i < original.childNodes.length; i++) {
        clone.appendChild(cloneNode(original.childNodes[i]))
      }

      return clone
    case Node.TEXT_NODE:
      return document.createTextNode(original.textContent)
    default:
      console.error('Unhandled node:', original, typeof original)
  }
}
