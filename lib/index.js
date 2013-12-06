var Animator = require('./animator')
  , Velocity = require('./velocity')
  , getPrefix = require('./prefix')
  , interpolators = require('./interpolators')
  , transformPrefix = getPrefix('transform')
  , Emitter = require('emitter')

function page(axis, evt) {
  return (evt.touches && event.touches[0]['page' + axis]) || evt['page' + axis]
}

function getElement(el) {
  if(typeof el === 'string')
    return document.querySelector(el)

  return el
}

function Menu(opts) {
  var that = this
  this.isOpen = false
  this.opts = opts

  var menu = this.menu = getElement(opts.menu)
  var container = getElement(opts.container)
  var handle = getElement(opts.handle)
  var mode = opts.mode || 'reveal'
  var direction = opts.direction || 'left'
  this.axis = (direction === 'left' || direction === 'right') ? 'X' : 'Y'
  this.isOpen = false
  this.reverse = direction === 'right' || direction === 'bottom'

  this.defaultVelocity = opts.defaultVelocity || 6000
  this.openPosition = this.opts.openPosition || parseInt((this.axis === 'X') ? this.menu.offsetWidth : this.menu.offsetHeight)

  if(opts.pullPastMax) {
    this.pullPastMaxOpen = opts.pullPastMax.open || opts.pullPastMax
    this.pullPastMaxClosed = opts.pullPastMax.closed || opts.pullPastMax
  }

  if(opts.pullPastDampening) {
    this.pullPastDampeningOpen = opts.pullPastDampening.open
    this.pullPastDampeningClose = opts.pullPastDampening.close
  }

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

  handle.addEventListener('touchstart', handleActivate)
  if(opts.mouseEvents)
    handle.addEventListener('mousedown', handleActivate)

  function handleActivate(evt) {
    that.start(evt)
  }

  handle.addEventListener('click', function(evt) {
    if(that.moveEvent || that.fingerDown) return
    that.toggle()
    evt.preventDefault()
  })
        
  if(opts.edgeActivate || opts.containerSwipeClose) {
    container.addEventListener('touchstart', edgeActivate)
    if(opts.mouseEvents)
      container.addEventListener('mousedown', edgeActivate)

    function edgeActivate(evt) {
      //TODO make edge activate work from the right
      if((opts.edgeActivate && !that.isOpen && page(that.axis, evt) < 15)
      || (opts.containerSwipeClose && that.isOpen)) {
        that.start(evt)
      }
    }
  }

  if(opts.menuSwipeClose) {
    menu.addEventListener('touchstart', handleActivate)
    if(opts.mouseEvents)
      menu.addEventListener('mousedown', handleActivate)
  }

  document.addEventListener('touchmove', this.move.bind(this))
  document.addEventListener('touchend', this.end.bind(this))
  if(opts.mouseEvents) {
    document.addEventListener('mousemove', this.move.bind(this))
    document.addEventListener('mouseup', this.end.bind(this))
  }
}

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

Menu.prototype.refresh = function() {
  this.openPosition = this.opts.openPosition || parseInt((this.axis === 'X') ? this.menu.offsetWidth : this.menu.offsetHeight)
  if(this.reverse)
    this.openPosition = -this.openPosition

  for(var i = 0 ; i < this.animators.length ; i++) {
    this.animators[i].setEnd(this.openPosition)
  }
}

Menu.prototype.start = function(evt) {
  if(this.launching) return false

  var pageOffset = page(this.axis, evt)
    , fingerOffset = pageOffset - ((this.isOpen) ? this.openPosition : 0)

  this.initialOffset = pageOffset - fingerOffset
  this.velocity = new Velocity()
  this.fingerOffset = fingerOffset
  this.fingerDown = true
  this.moved = false
  this.moveEvent = false

  this.startX = page('X', evt)
  this.startY = page('Y', evt)
  this.verifiedAngle = false

  this.velocity.pushPosition(this.initialOffset)
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
  this.moveEvent = true

  var currentPosition = page(this.axis, evt) - this.fingerOffset
    , openPast = currentPosition - this.openPosition
    , closePast = currentPosition

  if(typeof this.pullPastDampeningOpen !== 'undefined' &&
    ((!this.reverse && openPast > 0) || (this.reverse && openPast < 0))) {
    currentPosition = this.openPosition + openPast * this.pullPastDampeningOpen
  }
  if(typeof this.pullPastDampeningClose !== 'undefined' &&
    ( (!this.reverse && currentPosition < 0) || (this.reverse && currentPosition > 0) ) ) {
    currentPosition = currentPosition * this.pullPastDampeningClose
  }

  if(typeof this.pullPastMaxClose !== 'undefined' &&
     currentPosition > this.pullPastMaxClose) {
    currentPosition = this.openPosition + this.pullPastMaxOpen
  }

  if(typeof this.pullPastMaxOpen !== 'undefined' &&
     currentPosition > this.openPosition + this.pullPastMaxOpen) {
    currentPosition = this.openPosition + this.pullPastMaxOpen
  }
  this.moved = this.initialOffset !== currentPosition

  evt.preventDefault()


  this.velocity.pushPosition(currentPosition)
  var length = this.animators.length
    , i

  for(var i = 0 ; i < length ; i++) {
    this.animators[i].updatePosition(currentPosition)
  }
}

Menu.prototype.toggle = function() {
  if(this.launching || this.fingerDown) return
  if(this.isOpen) {
    this.close()
  } else {
    this.open()
  }
}

Menu.prototype.end = function() {
  if(!this.fingerDown) return
  this.fingerDown = false
  if(!this.moved) return

  var that = this
    , length = this.animators.length
    , i
  this.launching = true
  for(var i = 0 ; i < length ; i++) {
    this.animators[i].launch(this.velocity.getVelocity(), function(openClose) {
      that.isOpen = (openClose === 'open')
      that.emit(openClose)
      that.launching = false
    })
  }
}

Menu.prototype.open = function() {
  var that = this
    , length = this.animators.length
    , defaultVelocity = this.defaultVelocity
    , i

  if(this.reverse)
    defaultVelocity = -defaultVelocity

  this.launching = true
  for(var i = 0 ; i < length ; i++) {
    this.animators[i].open(defaultVelocity, function() {
      that.launching = false
      that.isOpen = true
      that.emit('open')
    })
  }
}

Menu.prototype.close = function() {
  var that = this
    , length = this.animators.length
    , defaultVelocity = -this.defaultVelocity
    , i

  if(this.reverse)
    defaultVelocity = -defaultVelocity

  this.launching = true
  for(var i = 0 ; i < length ; i++) {
    this.animators[i].close(defaultVelocity, function() {
      that.launching = false
      that.isOpen = false
      that.emit('close')
    })
  }
}

Menu.interpolators = interpolators

module.exports = Menu
