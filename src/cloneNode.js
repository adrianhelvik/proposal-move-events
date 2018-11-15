export default function cloneNode(original) {
  switch (original.nodeType) {
    case Node.ELEMENT_NODE:
      var clone = document.createElement(original.tagName)
      var computedStyle = getComputedStyle(original)

      for (var key in computedStyle) {
        if (computedStyle.hasOwnProperty(key)) {
          if (! /^[0-9]+$/.test(key))
            clone.style[key] = computedStyle[key]
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
