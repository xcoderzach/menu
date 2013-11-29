var getPrefix = require('./prefix')
  , animationPrefix = getPrefix('animation')
  , transformPrefix = getPrefix('transform')
  , interpolators = require('./interpolators')
  , animationCount = 0
  , stylesheetEl = document.createElement('style')
  , stylesheet

var defaultOvershoot = interpolators.overshoot(1000, 2, 20)
var defaultBounce = interpolators.bounce(1000, 0.2)

var defaultAnimator = {
  rules: function(position, start, end, axis, launching) {
    var rules = {}
      , x = axis === 'X'
    rules[transformPrefix + 'transform'] = 'translate3d(' + ((x) ? position : 0) + 'px, ' + ((x) ? 0 : position) + 'px, 0)'
    return rules
  },
  interpolator: function(currentPosition, start, end, velocity, thrown) {
    if(velocity < 0 && start > end || velocity > 0 && end > start) {
      return defaultOvershoot(currentPosition, start, end, velocity, thrown)
    } else {
      return defaultBounce(currentPosition, start, end, velocity, thrown)
    }
  }
}

document.head.appendChild(stylesheetEl)
stylesheet = stylesheetEl.sheet

module.exports = Animator
module.exports.stylesheet = stylesheet

function Animator(els, start, end, axis, opts) {
	this.els = els
	this.axis = axis
  this.start = start
  this.end = end
  this.rules = opts.rules || defaultAnimator.rules
  this.interpolator = opts.interpolator || defaultAnimator.interpolator

  this.currentPosition = this.start
}
Animator.prototype.updatePosition = function(position) {
	this.currentPosition = position
	this.applyCss(position, false)
}

Animator.prototype.open = function(velocity, cb) {
  this.currentPosition = this.start
  this.launch(velocity, cb, false)
}

Animator.prototype.close = function(velocity, cb) {
  this.currentPosition = this.end
  this.launch(velocity, cb, false)
}

Animator.prototype.launch = function(velocity, cb, thrown) {
	var interpolator
	  , that = this

  if(typeof thrown === 'undefined') thrown = true

	var interpolator = this.interpolator(this.currentPosition, this.start, this.end, velocity, thrown)

  function done() {
    var to = interpolator.to
    //always apply the final to value css
    that.applyCss(to, true)
    this.currentPosition = to
    cb((to === that.start) ? 'close' : 'open')
  }
  this.jsAnimate(interpolator.duration, interpolator.fn, done)
}

Animator.prototype.jsAnimate = function(duration, fn, cb) {
	var cancelAnimation
	  , first = true
	  , startTime
	  , that = this

	function animate(time) {
		//request the next one right away
    cancelAnimation = requestAnimationFrame(animate)

    if(first) startTime = time
    first = false

    var i
      , length = that.els.length
      , currentTime = (time - startTime) / 1000

    if(currentTime > duration) {
      cancelAnimationFrame(cancelAnimation)
      return cb()
    }

    for(i = 0 ; i < length ; i++) {
      that.applyCss(fn(currentTime), true)
    }
  }
  cancelAnimation = requestAnimationFrame(animate)
}

Animator.prototype.keyframeAnimate = function(duration, fn, cb) {
	var animationName = 'menu-animate-' + animationCount++
    , step = duration / 100
    , length = this.els.length
    , that = this
    , i

	var keyframe = '@' + animationPrefix + 'keyframes ' + animationName + ' {\n'

  for(var i = 0 ; i <= 100 ; i++) {
    keyframe += i + '% { ' + this.css(fn(i * step)) + ' }\n'
  }
  keyframe += '}'

  stylesheet.insertRule(keyframe, 0)
 	for(i = 0 ; i < length ; i++) {
    this.els[i].style[animationPrefix + 'animation'] = animationName + ' ' + duration + 's 1'
  }
  this.els[0].addEventListener('webkitAnimationEnd', function done() {
    stylesheet.deleteRule(0)
    that.els[0].removeEventListener('webkitAnimationEnd', done)
    cb()
  })
}

Animator.prototype.css = function(position, launch) {
	var cssStr = ''
	var rules = this.rules(position, this.start, this.end, this.axis, launch)

	for(rule in rules) {
	  if(rules.hasOwnProperty(rule)) {
	    cssStr += rule + ':' + rules[rule] + ';'
	  }
	}
	return cssStr
}

Animator.prototype.applyCss = function(position, launch) {
	var rules = this.rules(position, this.start, this.end, this.axis, launch)
	  , length = this.els.length
	  , i

	for(rule in rules) {
	  if(rules.hasOwnProperty(rule)) {
	  	for(i = 0 ; i < length ; i++) {
	      this.els[i].style[rule] = rules[rule]
	    }
	  }
	}
}
