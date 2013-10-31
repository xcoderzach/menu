var Animator = require('./animator')
  , Velocity = require('./velocity')
  , getPrefix = require('./prefix')
  , interpolators = require('./interpolators')
  , transformPrefix = getPrefix('transform')
  , Emitter = require('emitter')

function page(axis, evt) {
  return evt.touches[0]['page' + axis] || evt['page' + axis]
}

function getElement(el) {
  if(typeof el === 'string')
    return document.querySelector(el)

  return el
}
function Menu(opts) {
  var that = this
  this.isOpen = false

  var menu = getElement(opts.menu)
  var container = getElement(opts.container)
  var handle = getElement(opts.handle)
  var mode = opts.mode || 'reveal'
  var direction = opts.direction || 'left'
  this.axis = (direction === 'left' || direction === 'right') ? 'X' : 'Y'
  this.open = false
  this.reverse = direction === 'right' || direction === 'bottom'

  if(opts.pullPastMax) {
    this.pullPastMaxOpen = opts.pullPastMax.open || opts.pullPastMax
    this.pullPastMaxClosed = opts.pullPastMax.closed || opts.pullPastMax
  }
 
  if(opts.pullPastDampening) {
    this.pullPastDampeningOpen = opts.pullPastDampening.open || opts.pullPastDampening
    this.pullPastDampeningClosed = opts.pullPastDampening.closed || this.pullPastDampening
  }

  var computedStyle = getComputedStyle(menu, null)

  this.openPosition = parseInt((this.axis === 'X') ? menu.offsetWidth : menu.offsetHeight)

  if(this.reverse) {
    this.openPosition = -this.openPosition
  }

  var animatedEls = []

  if(mode === 'reveal' || mode === 'push') 
    animatedEls.push(container)
  if(mode === 'cover' || mode === 'push') 
    animatedEls.push(menu)

  this.animators = []
  if(!opts.animators)
    opts.animators = [{}]

  for(var i = 0 ; i < opts.animators.length ; i++) {
    this.animators.push(
      new Animator(opts.animators[i].els || animatedEls, 0, this.openPosition, this.axis, opts.animators[i])
    )
  }

  handle.addEventListener('touchstart', function(evt) {
    var pageOffset = page(that.axis, evt)
      , fingerOffset = pageOffset - offset(container, that.axis)

    that.start(evt, pageOffset, fingerOffset)
  })

  if(opts.edgeActivate || opts.containerSwipeClose) {
    container.addEventListener('touchstart', function(evt) {
      //TODO make edge activate work from the right
      if((opts.edgeActivate && !that.open && page(that.axis, evt) < 15)
      || (opts.containerSwipeClose && that.open)) {
        var pageOffset = page(that.axis, evt)
          , fingerOffset = pageOffset - that.openPosition

        that.start(evt, pageOffset, fingerOffset)
      }
    })
  }

  if(opts.menuSwipeClose) {
    menu.addEventListener('touchstart', function(evt) {
      var pageOffset = page(that.axis, evt)
        , fingerOffset = pageOffset - that.openPosition

      that.start(evt, pageOffset, fingerOffset)
    })
  }

  document.addEventListener('touchmove', this.move.bind(this))
  document.addEventListener('touchend', this.end.bind(this))
}

Menu.DefaultAnimator = Animator
Emitter(Menu.prototype)

function offset(el, axis) {
  var box = el.getBoundingClientRect()
  return (axis === 'X')
    ? box.left - document.body.clientLeft - pageXOffset
    : box.top - document.body.clientTop - pageYOffset
}

function getAngle(x1, y1, x2, y2) {
  return 180 + Math.atan2(y2 - y1, x1 - x2) * 180 / Math.PI
}

function acceptableAngle(axis, angle) {
  var acceptableRange = 45
  if(axis === 'X') {
    return angle > 360 - acceptableRange || angle < 0 + acceptableRange ||
           (Math.abs(angle - 180) < acceptableRange)
  } else {
    return (Math.abs(angle - 90) < acceptableRange) ||
           (Math.abs(angle - 270) < acceptableRange)
  }
}

Menu.prototype.start = function(evt, pageOffset, fingerOffset) {
  if(this.launching) return false

  initialOffset = pageOffset - fingerOffset
  this.velocity = new Velocity()
  this.fingerOffset = fingerOffset
  this.fingerDown = true
  this.moved = false

  this.startX = page('X', evt)
  this.startY = page('Y', evt)
  this.verifiedAngle = false

  this.velocity.pushPosition(initialOffset)
}

Menu.prototype.move = function(evt) {
  if(!this.fingerDown) return
  if(!this.verifiedAngle) {
    var angle = getAngle(this.startX, this.startY, page('X', evt), page('Y', evt))
    if(acceptableAngle(this.axis, angle)) {
      this.verifiedAngle = true
    } else {
      this.fingerDown = false
      return
    }
  }
  this.moved = true

  var currentPosition = page(this.axis, evt) - this.fingerOffset
    , openPast = currentPosition - this.openPosition

  if(this.pullPastDampeningOpen && 
    ( (!this.reverse && openPast > 0) || (this.reverse && openPast < 0) ) ) {
    currentPosition = this.openPosition + openPast * this.pullPastDampeningOpen
  }

  if(typeof this.pullPastMaxOpen !== 'undefined' && 
     currentPosition > this.openPosition + this.pullPastMaxOpen) {
    currentPosition = this.openPosition + this.pullPastMaxOpen 
  }

  evt.preventDefault()

  this.velocity.pushPosition(currentPosition)
  var length = this.animators.length
    , i

  for(var i = 0 ; i < length ; i++) {
    this.animators[i].updatePosition(currentPosition)
  }
}

Menu.prototype.end = function() {
  if(!this.fingerDown || !this.moved) {
    this.fingerDown = false
    return
  }

  var that = this
    , length = this.animators.length
    , i
  this.launching = true
  for(var i = 0 ; i < length ; i++) {
    console.log('launch')
    this.animators[i].launch(this.velocity.getVelocity(), function(openClose) {
      that.open = (openClose === 'open')
      that.emit(openClose)
      that.launching = false
    })
  }
}

Menu.prototype.open = function() {
  var that = this
    , length = this.animators.length
    , i

  this.launching = true
  for(var i = 0 ; i < length ; i++) {
    this.animators[i].launch(400, function() {
      that.launching = false
      that.open = true
      that.emit('open')
    })
  }
}

Menu.prototype.close = function() {
  var that = this
    , length = this.animators.length
    , i

  this.launching = true
  for(var i = 0 ; i < length ; i++) {
    this.animators[i].launch(-400, function() {
      that.open = false
      that.emit('close')
      that.launching = false
    })
  }
}

Menu.interpolators = interpolators

module.exports = Menu