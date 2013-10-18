var Animator = require('./animator')
  , Velocity = require('./velocity')
  , getPrefix = require('./prefix')
  , interpolators = require('./interpolators')
  , jsAnimation = require('./keyframer')
  , transformPrefix = getPrefix('transform')
  , Emitter = require('emitter')
  , stylesheet = jsAnimation.stylesheet

function page(axis, evt) {
  return evt.touches[0]['page' + axis] || evt['page' + axis]
}

function Menu(opts) {
  var that = this
  this.isOpen = false
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
  var maxDuration = 0.5

  var computedStyle = getComputedStyle(menu, null)
  this.size = parseInt((axis === 'X') ? computedStyle.width : computedStyle.height)

  var animatedEls = []

  if(mode === 'reveal' || mode === 'push') 
    animatedEls.push(container)
  if(mode === 'cover' || mode === 'push') 
    animatedEls.push(menu)

  this.animator = new Animator(animatedEls, 0, this.size, { axis: axis })

  handle.addEventListener('touchstart', function(evt) {
    var pageOffset = page(axis, evt)
      , fingerOffset = pageOffset - offset(container, axis)

    onStart(evt, pageOffset, fingerOffset)
  })

  // // if opts.edgeActivate
  // container.addEventListener('touchstart', function(evt) {
  //   if(container.classList.contains('open') || evt['page' + axis] < 15) {

  //     var pageOffset = evt['page' + axis]
  //       , fingerOffset = pageOffset - offset(container, axis)

  //     onStart(evt, pageOffset, fingerOffset)
  //   }
  // })
  // opts.menuSwipeClose
  // menu.addEventListener('touchstart', function() {
  //   menu.addEventListener('touchmove', function firstMove(evt) {
  //     menu.removeEventListener('touchmove', firstMove)

  //     var pageOffset = evt['page' + axis]

  //     onStart(evt, pageOffset, that.size + pageOffset)
  //   })
  // })

  function offset(el, axis) {
    var box = el.getBoundingClientRect()
    return (axis === 'X')
      ? box.left - document.body.clientLeft - pageXOffset
      : box.top - document.body.clientTop - pageYOffset
  }

  function getAngle(x1, y1, x2, y2) {
    return 180 + Math.atan2(y2 - y1, x1 - x2) * 180 / Math.PI
  }

  function acceptableAngle(angle) {
    var acceptableRange = 45
    if(axis === 'X') {
      return angle > 360 - acceptableRange || angle < 0 + acceptableRange ||
             (Math.abs(angle - 180) < acceptableRange)
    } else {
      return (Math.abs(angle - 90) < acceptableRange) ||
             (Math.abs(angle - 270) < acceptableRange)
    }
  }

  function onStart(evt, pageOffset, fingerOffset) {
    var initialOffset = pageOffset - fingerOffset
      , v = new Velocity()
      , startX = page('X', evt)
      , startY = page('Y', evt)
      , verifiedAngle = false

    v.pushPosition(initialOffset)

    function onMove(evt) {
      if(!verifiedAngle) {
        var angle = getAngle(startX, startY, page('X', evt), page('Y', evt))
        if(acceptableAngle(angle)) {
          verifiedAngle = true
        } else {
          document.removeEventListener('touchend', onEnd)
          document.removeEventListener('touchmove', onMove)
          return
        }
      }

      evt.preventDefault()

      var currentPosition = page(axis, evt) - fingerOffset
      var past = currentPosition - that.size
      v.pushPosition(currentPosition)

      if(past > 0)
        currentPosition = that.size + (past * .25)

      that.animator.updatePosition(currentPosition)
    }

    function onEnd(evt) {
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchmove', onMove)

      that.animator.launch(v.getVelocity(), function(openClose) {
        that.emit(openClose)
      })
    }

    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onEnd)
  }
}

Menu.prototype.open = function() {
  var that = this
  that.animator.launch(400, function(openClose) {
    that.emit('open')
  })
}

Menu.prototype.close = function() {
  var that = this
  that.animator.launch(-400, function(openClose) {
    that.emit('close')
  })
}
Emitter(Menu.prototype)

module.exports = Menu