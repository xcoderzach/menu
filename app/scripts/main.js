$(document).on('touchmove', function(e) {
  e.preventDefault()
})

var qf = function(a, b, c) {
  return (-b - Math.sqrt(b * b - 4 * a * c))/(2 * a);
};

var para = function(ih, iv, g, t) {
  return -g / 2 * t * t + iv * t + ih;
};

function generateAcceleration(from, v0) {
  var g0 = 1000;
  var g1 = 2000;
  var g2 = 2000;

  var df = 0.2;

  var t0 = qf(-g0/2, -v0, from);
  var v1 = v0 * df;
  var t1 = qf(-g1/2, v1, 0);
  var v2 = v1 * df;
  var t2 = qf(-g1/2, v2, 0);

  var duration = t0

  //clamp
  if(v1 > 200) {
    duration += t1
  }

  if(v2 > 100) {
    duration += t2
  }

  return {
    duration: duration,
    interpolator: function(t) {

      if(t < t0) return para(from, -v0, g0, t);

      t -= t0;

      if(t < t1) return para(0, v1, g1, t);

      t -= t1;

      if(t < t2) return para(0, v2, g2, t);

      return 0;
    }
  }
}

var animationCount = 0
  , stylesheet = document.styleSheets[0]


function generateKeyframes(el, from, to, acceleration, direction) {
  var reverse = to > from
    , top = (reverse) ? to - from : from - to
    , accel = generateAcceleration(top, -acceleration)
    , fn = accel.interpolator
    , duration = accel.duration
    , step = duration / 100

  var keyframe = '@-webkit-keyframes animate' + animationCount +' {\n'

  for(var i = 0 ; i < 100 ; i++) {
    var val = (reverse) ? (to - fn(i * step)) : (to + fn(i * step))
    if(direction === 'X')
      keyframe += i + '% { -webkit-transform: translate3d(' + val + 'px, 0px, 0); }\n'
    else
      keyframe += i + '% { -webkit-transform: translate3d(0px, ' + val + 'px, 0); }\n'
  }

  if(direction === 'X') {
    keyframe += '100% { -webkit-transform: translate3d(' + to + 'px, 0px, 0); }\n'
  } else {
    keyframe += '100% { -webkit-transform: translate3d(0px, ' + to + 'px, 0); }\n'
  }
  keyframe += '}'

  stylesheet.insertRule(keyframe, 0)
  el.style.webkitAnimation = 'animate' + animationCount + ' ' + duration + 's 1 forwards'
  animationCount++
}

function Menu(opts) {
  var that = this
  //this is the data-attribute syntax.
  if(typeof opts === 'string') {
    var menu = this.menu = document.querySelector(opts)
    var container = this.container = document.querySelector(menu.dataset.container || '.container')
    var handle = this.handle = document.querySelector(menu.dataset.handle || '.handle')
    var direction = this.direction = (menu.dataset.direction === 'vertical') ? 'Y' : 'X'
    var reveal = menu.dataset.reveal
  } else {
    var menu  = this.menu = opts.menu
    var container = this.container = opts.container
    var handle = this.handle = opts.handle
    var direction = this.direction = opts.direction
    var reveal = this.reveal = !opts.push

    //make a getElement method
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

  var pullPast = 0.25

  var computedStyle = getComputedStyle(menu, null)
  this.size = parseInt((direction === 'X') ? computedStyle.width : computedStyle.height)

  var maxDuration = 0.4
  var minDuration = 0.15

  handle.addEventListener('touchstart', onStart)
  container.addEventListener('touchstart', function(evt) {
    if(container.classList.contains('open') || evt['page' + direction] < 15) {
      onStart(evt)
    }
  })

  /* Use this for non-reveal menus. */
  // menu.addEventListener('touchstart', function(startEvent) {
  //   menu.addEventListener('touchmove', function firstMove() {
  //     menu.removeEventListener('touchmove', firstMove)
  //     onStart(startEvent)
  //   })

  // })
  function offset(el, direction) {
    var box = el.getBoundingClientRect()
    return (direction === 'X')
      ? box.left - document.body.clientLeft - pageXOffset
      : box.top - document.body.clientTop - pageYOffset
  }

  function onStart(startEvt) {
    startEvt.preventDefault()
    var pageOffset = startEvt['page' + direction]
      , fingerOffset = pageOffset - offset(container, direction)
      , initialOffset = pageOffset - fingerOffset
      , positionQueue = [initialOffset]
      , timeQueue = [Date.now()]
      , reveal = true

    function pruneQueue() {
      //pull old values off of the queue
      while(timeQueue.length && timeQueue[0] < (Date.now() - 200)) {
        timeQueue.shift()
        positionQueue.shift()
      }

      var length = positionQueue.length
      if(length > 2) {
        var direction = positionQueue[length - 1] - positionQueue[length - 2] > 0
          , toRemove = 0

        for(var i = length - 2 ; i >= 1 ; i--) {
          if(direction !== (positionQueue[i] - positionQueue[i - 1] > 0)) {
            toRemove = i
            break
          }
        }

        positionQueue.splice(0, toRemove)
        timeQueue.splice(0, toRemove)
      }
    }

    function getVelocity() {
      var length = timeQueue.length
      if(length === 1) return 0

      var distance = positionQueue[length-1] - positionQueue[0]
        , time = (timeQueue[length-1] - timeQueue[0]) / 1000

      return distance / time
    }

    function onMove(evt) {
      evt.preventDefault()
      var time = Date.now()

      var currentPosition = evt['page' + direction] - fingerOffset
      var past = currentPosition - that.size

      if(past > 0) {
        currentPosition = that.size + (past * pullPast)
      }

      positionQueue.push(currentPosition)
      timeQueue.push(time)

      pruneQueue()

      if(direction === 'X') {
        container.style.webkitTransform = 'translate3d(' + currentPosition + 'px, 0px, 0)'
        if(!reveal) {
          menu.style.webkitTransform = 'translate3d(' + currentPosition + 'px, 0px, 0)'
        }
      } else {
        container.style.webkitTransform = 'translate3d(0px, ' + currentPosition + 'px, 0)'
        if(!reveal) {
          menu.style.webkitTransform = 'translate3d(0px, ' + currentPosition + 'px, 0)'
        }
      }
    }

    function onEnd(evt) {
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchmove', onMove)

      pruneQueue()

      var velocity = getVelocity()
        , lastPosition = positionQueue[positionQueue.length - 1]

      if(velocity === 0) {

      } if(velocity > 0) {
        that.animate(lastPosition, that.size, -velocity)
        if(!reveal)
          menu.classList.add('open')
      } else {
        that.animate(lastPosition, 0, velocity)
      }
    }

    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onEnd)
  }
}

Menu.prototype.transition = function() {
  distanceRemaining = width - currentPosition
  timeToEnd = Math.max(Math.min((distanceRemaining / velocity), maxDuration), minDuration)

  container.style.webkitTransition = '-webkit-transform ' + timeToEnd + 's'
  if(!reveal)
    menu.style.webkitTransition = '-webkit-transform ' + timeToEnd + 's'
}

Menu.prototype.animate = function(from, to, velocity) {
  var that = this

  if(!this.reveal)
    this.menu.classList.remove('open')

  this.container.addEventListener("webkitAnimationEnd", function animEnd() {
    stylesheet.deleteRule(0)
    that.container.removeEventListener("webkitAnimationEnd", animEnd)

    //force a repaint for...whatever reason.
    //some sort of weird bug, lol
    that.container.style.display='none';
    that.container.offsetHeight;
    that.container.style.display='block';

    if(that.direction === 'X') {
      that.container.style.webkitTransform = 'translate3d(' + to + 'px, 0px, 0)'
    } else {
      that.container.style.webkitTransform = 'translate3d(0px, ' + to + 'px, 0)'
    }
  })

  generateKeyframes(this.container, from, to, velocity, this.direction)
}

var menu = new Menu('.grab-nav')
