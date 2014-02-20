
function RafLoop() {
  this.start()  
  this.animationsToRun = {}
  this.runUntilQueue = []
}

RafLoop.prototype.once = function(name, fn) {
  this.animationsToRun[name] = fn
}

RafLoop.prototype.runUntil = function(end) {
  this.animationsToRun[name] = fn
}

RafLoop.prototype.run = function(time) {
  var animation, fn
  for(animation in this.animationsToRun) {
    if(this.animationsToRun.hasOwnProperty(animation)) {
      fn = this.animationsToRun[animation]
      delete this.animationsToRun[animation]
      fn(time)
    }
  }
}

RafLoop.prototype.start = function() {
  var that = this
  function getFrame() {
    that.cancel = requestAnimationFrame(function(time) {
      that.run(time)
      getFrame()
    })
  }
  getFrame()
}

module.exports = new RafLoop