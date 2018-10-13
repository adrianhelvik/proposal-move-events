export default function cloneNode(original) {
  switch (original.nodeType) {
    case Node.ELEMENT_NODE:
      const clone = document.createElement(original.tagName)
      const computedStyle = getComputedStyle(original)

      for (let key in computedStyle) {
        if (computedStyle.hasOwnProperty(key)) {
          if (! /^[0-9]+$/.test(key))
            clone.style[key] = computedStyle[key]
        }
      }

      for (let i = 0; i < original.childNodes.length; i++)
        clone.appendChild(cloneNode(original.childNodes[i]))

      return clone
    case Node.TEXT_NODE:
      return document.createTextNode(original.textContent)
    default:
      console.error('Unhandled node:', original, typeof original)
  }
}
