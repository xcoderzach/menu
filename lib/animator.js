var interpolators = require('./interpolators')
  , getPrefix = require('./prefix')
  , animationPrefix = getPrefix('animation')
  , transformPrefix = getPrefix('transform')
  , animationCount = 0
  , stylesheetEl = document.createElement('style')
  , stylesheet

document.head.appendChild(stylesheetEl)
stylesheet = stylesheetEl.sheet

module.exports = Animator
module.exports.stylesheet = stylesheet

function Animator(els, start, end, opts) {
	this.els = els
	this.axis = opts.axis
  this.start = start
  this.currentPosition = 0
  this.end = end
}

Animator.prototype.rules = function(position, launching) {
  var rules = {}
    , x = this.axis === 'X' 
  rules[transformPrefix + 'transform'] = 'translate3d(' + ((x) ? position : 0) + 'px, ' + ((x) ? 0 : position) + 'px, 0)'
  return rules
}

Animator.prototype.updatePosition = function(position) {
	this.currentPosition = position
	this.applyCss(position, false)
}

Animator.prototype.launch = function(velocity, cb) {
	var interpolator
	  , that = this
	if(velocity < 0) {
    interpolator = interpolators.bounce(this.currentPosition, this.start, this.end, velocity)
	} else {
	  interpolator = interpolators.overshoot(this.currentPosition, this.start, this.end, velocity)
	}
	this.jsAnimate(interpolator.duration, interpolator.fn, function() {
		var to = interpolator.to
		//always apply the final to value css
	  that.applyCss(to, true)
  	this.currentPosition = to
		cb((to === that.start) ? 'close' : 'open')
	})
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

Animator.prototype.keyframeAnimate = function(duration, fn) {
	var animationName = 'menu-animate-' + animationCount++
    , step = duration / 100
    , length = this.els.length
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
}

Animator.prototype.css = function(position, launch) {
	var cssStr = ''
	var rules = this.rules(position, launch)

	for(rule in rules) {
	  if(rules.hasOwnProperty(rule)) {
	    cssStr += rule + ':' + rules[rule] + ';'
	  }
	}
	return cssStr
}

Animator.prototype.applyCss = function(position, launch) {
	var rules = this.rules(position, launch)
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
