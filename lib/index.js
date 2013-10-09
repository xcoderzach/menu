var Animator = require('./animator')
  , Velocity = require('./velocity')
  , getPrefix = require('./prefix')
  , interpolators = require('./interpolators')
  , generateKeyframes = require('./keyframer')
  , transformPrefix = getPrefix('transform')
  , Emitter = require('emitter')
  , stylesheet = document.styleSheets[0]
  , timeToAnimationStart = 50

var animators = {
  translate: function(position) { 
    var rules = {}
      , x = this.axis === 'X' 
    rules[transformPrefix + 'transform'] = 'translate3d(' + ((x) ? position : 0) + 'px, ' + ((x) ? 0 : position) + 'px, 0)'
    return rules
  }
}

function Menu(opts) {
  var that = this
  //this is the data-attribute syntax.
  if(typeof opts === 'string') {
    var menu = this.menu = document.querySelector(opts)
    var container = this.container = document.querySelector(menu.dataset.container || '.container')
    var handle = this.handle = document.querySelector(menu.dataset.handle || '.handle')
    var direction = this.direction = menu.dataset.direction
    var mode = this.mode = menu.dataset.mode

    this.interpolator = interpolators[menu.dataset.interpolator || 'bounce']
  } else {
    var menu  = this.menu = opts.menu
    var container = this.container = opts.container
    var handle = this.handle = opts.handle
    var direction = this.direction = opts.direction
    var mode = this.mode = opts.mode || 'reveal'

    this.interpolator = interpolators[opts.interpolator || 'bounce']

    if(typeof container === 'string') {
      container = this.container = document.querySelector(container)
    }

    if(typeof menu === 'string') {
      menu = this.menu = document.querySelector(menu)
    }

    if(typeof handle === 'string') {
      handle = this.handle = document.querySelector(handle)
    }
  }
  var axis = this.axis = (direction === 'left' || direction === 'right') ? 'X' : 'Y'

  this.animator = new Animator(axis, animators.translate)

  var pullPast = 0.25
  var computedStyle = getComputedStyle(menu, null)

  this.size = parseInt((axis === 'X') ? computedStyle.width : computedStyle.height)

  handle.addEventListener('touchstart', function(evt) {
    var pageOffset = evt['page' + axis]
      , fingerOffset = pageOffset - offset(container, axis)

    onStart(pageOffset, fingerOffset)
  })

  // // if opts.edgeActivate
  // container.addEventListener('touchstart', function(evt) {
  //   if(container.classList.contains('open') || evt['page' + axis] < 15) {

  //     var pageOffset = evt['page' + axis]
  //       , fingerOffset = pageOffset - offset(container, axis)

  //     onStart(pageOffset, fingerOffset)
  //   }
  // })

  // menu.addEventListener('touchstart', function() {
  //   menu.addEventListener('touchmove', function firstMove(evt) {
  //     menu.removeEventListener('touchmove', firstMove)

  //     var pageOffset = evt['page' + axis]

  //     onStart(pageOffset, that.size + pageOffset)
  //   })
  // })

  function offset(el, axis) {
    var box = el.getBoundingClientRect()
    return (axis === 'X')
      ? box.left - document.body.clientLeft - pageXOffset
      : box.top - document.body.clientTop - pageYOffset
  }

  function onStart(pageOffset, fingerOffset) {
    var initialOffset = pageOffset - fingerOffset
      , v = new Velocity()

    v.pushPosition(initialOffset)

    function onMove(evt) {
      evt.preventDefault()

      var currentPosition = evt['page' + axis] - fingerOffset
      var past = currentPosition - that.size
      v.pushPosition(currentPosition)

      if(past > 0)
        currentPosition = that.size + (past * pullPast)

      if(mode === 'push' || mode === 'reveal') {
        that.animator.applyToElement(that.container, currentPosition)
      }
      if(mode === 'push' || mode === 'cover') {
        that.animator.applyToElement(that.menu, currentPosition)
      }
    }

    function onEnd(evt) {
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchmove', onMove)

      var velocity = v.getVelocity()
        , lastPosition = v.lastPosition()
        , lastTime = v.lastTime()

      if(velocity === 0) {
      } if(velocity < 0) {
        if(that.direction === 'right' || that.direction === 'bottom') {
          this.open = true
          that.animate(lastPosition, -that.size, velocity, function() {
            that.emit('open')
          })
        } else {
          this.open = false
          that.animate(lastPosition, 0, velocity, function() {
            that.emit('close')
          })
        }
      } else {
        if(that.direction === 'right' || that.direction === 'bottom') {
          this.open = false
          that.animate(lastPosition, 0, -velocity, function() {
            that.emit('close')
          })
        } else {
          this.open = true
          that.animate(lastPosition, that.size, -velocity, function() {
            that.emit('open')
          })
        }
      }
    }

    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onEnd)
  }
}
Emitter(Menu.prototype)

Menu.prototype.animate = function(from, to, velocity, cb) {
  var that = this
    , animation = generateKeyframes(from, to, velocity, this.animator, this.interpolator)
    , animationsRunning = 0

  if(this.mode === 'push' || this.mode === 'reveal') {
    that.container.style.webkitAnimation = animation
    animationsRunning++
  }
  if(this.mode === 'push' || this.mode === 'cover') {
    that.menu.style.webkitAnimation = animation
    animationsRunning++
  }

  this.container.addEventListener("webkitAnimationEnd", function menuEnded() {
    that.container.removeEventListener("webkitAnimationEnd", menuEnded)
    if(--animationsRunning === 0) that.animationEnd(to, cb)
  })

  this.menu.addEventListener("webkitAnimationEnd", function menuEnded() {
    that.menu.removeEventListener("webkitAnimationEnd", menuEnded)
    if(--animationsRunning === 0) that.animationEnd(to, cb)
  })
}

Menu.prototype.animationEnd = function(finalPosition, cb) {
  stylesheet.deleteRule(0)

  this.menu.style.display='none';
  this.menu.offsetHeight;
  this.menu.style.display='block';

  if(this.mode === 'push' || this.mode === 'cover') {
    this.animator.applyToElement(this.menu, finalPosition)
  }
  if(this.mode === 'push' || this.mode === 'reveal') {
    this.animator.applyToElement(this.container, finalPosition)
  }
  cb()
}

module.exports = Menu