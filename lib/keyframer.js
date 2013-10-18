var getPrefix = require('./prefix')
  , prefix = getPrefix('animation')
  , animationCount = 0
  , stylesheetEl = document.createElement('style')
  , stylesheet

document.head.appendChild(stylesheetEl)

stylesheet = stylesheetEl.sheet

module.exports = jsAnimation
module.exports.stylesheet = stylesheet

function generateKeyframes(from, to, velocity, animator, interpolator) {

  var reverse = to > from
    , top = (reverse) ? to - from : from - to
    //don't bounce if you've already pulled the menu past the end point
    , bounce = (to > from && velocity > 0) || (to < from && velocity < 0)
  velocity = -Math.abs(velocity)
  
  var accel = interpolator(top, -velocity, bounce)
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
//try leaving the first 3 or so percent open

function jsAnimation(els, from, to, velocity, animator, interpolator) {
  var reverse = to > from
    , top = (reverse) ? to - from : from - to
    //don't bounce if you've already pulled the menu past the end point
    , bounce = (to > from && velocity > 0) || (to < from && velocity < 0)
  velocity = -Math.abs(velocity)
  
  var accel = interpolator(top, -velocity, bounce)
    , fn = accel.interpolator
    , duration = accel.duration
    , first = true
    , startTime

  animationLoop(function(time) {
    if(first) startTime = time
    first = false

    var i
      , length = els.length
      , currentTime = (time - startTime) / 1000

    if(currentTime > duration) {
      stopAnimationLoop()
      currentTime = duration
    }

    for(i = 0 ; i < length ; i++) {
      var val = (reverse) ? (to - fn(currentTime)) : (to + fn(currentTime))
      animator.applyToElement(els[i], val)
    }
  })  
}  

var cancelId

function stopAnimationLoop() {
  cancelAnimationFrame(cancelId)
}

function animationLoop(fn) {
  console.log('looping')
  cancelId = requestAnimationFrame(function(time) {
    animationLoop(fn)
    fn(time)
  })
}



  // I'm assuming that animation and keyframe have the same prefix :3
  // var keyframe = '@' + prefix + 'keyframes animate' + animationCount + ' {\n'

  // for(var i = 0 ; i < 100 ; i++) {
  //   var val = (reverse) ? (to - fn(i * step)) : (to + fn(i * step))
  //   keyframe += i + '% { ' + animator.css(val) + ' }\n'
  // }
  // keyframe += i + '% { ' + animator.css(to) + ' }\n'
  // keyframe += '}'

  // stylesheet.insertRule(keyframe, 0)
  // return 'animate' + (animationCount++) + ' ' + duration + 's 1'

