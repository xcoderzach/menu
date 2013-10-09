var animationPrefix = ''

var prefixes = ['-webkit-', '-moz-', '-ms-', '-o-']

function getPrefix(prop) {
  for(var i = 0 ; i < prefixes.length ; i++) {
    if(typeof document.body.style[prefixes[i] + prop] !== 'undefined') {
      return prefixes[i] 
    }
  }
  return ''
}

module.exports = getPrefix