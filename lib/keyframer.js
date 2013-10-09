var getPrefix = require('./prefix')
  , prefix = getPrefix('animation')
  , stylesheet = document.styleSheets[0]
  , animationCount = 0

module.exports = generateKeyframes

function generateKeyframes(from, to, velocity, animator, interpolator) {
  var reverse = to > from
    , top = (reverse) ? to - from : from - to
    //don't bounce if you've already pulled the menu past the end point
    , bounce = (to > from && velocity > 0) || (to < from && velocity < 0)
    , accel = interpolator(top, -velocity, bounce)
    , fn = accel.interpolator
    , duration = accel.duration
    , step = duration / 100

  // I'm assuming that animation and keyframe have the same prefix :3
  var keyframe = '@' + prefix + 'keyframes animate' + animationCount + ' {\n'

  for(var i = 0 ; i < 100 ; i++) {
    var val = (reverse) ? (to - fn(i * step)) : (to + fn(i * step))
    keyframe += i + '% { ' + animator.css(val) + ' }\n'
  }
  keyframe += i + '% { ' + animator.css(to) + ' }\n'
  keyframe += '}'

  stylesheet.insertRule(keyframe, 0)
  return 'animate' + (animationCount++) + ' ' + duration + 's 1'
}