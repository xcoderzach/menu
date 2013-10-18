function quadratic(a, b, c) {
  if(a < 0)
    return (-b - Math.sqrt(b * b - 4 * a * c))/(2 * a)
  else
    return (-b + Math.sqrt(b * b - 4 * a * c))/(2 * a)
}

function vertex(a, b) {
  return -b / (2 * a) 
}

function height(a, b, c) {
  return parabola(a, b, c, vertex(a, b))
}

function parabola(a, b, c, x) {
  return a * x * x + b * x + c
}

function accelerate(from, start, end, velocity) {
  var to
    , gravity = 1000
    , to = (velocity < 0) ? start : end

  if(from > to)
    gravity = -gravity

  var fallDuration = quadratic(gravity, velocity, from - to)
    , finalVelocity = (velocity + (fallDuration * gravity))

  return {
    to: to,
    duration: fallDuration,
    gravity: gravity,
    finalVelocity: finalVelocity,
    fn: function(time) {
      return to + parabola(gravity, velocity, from - to, time)
    }
  }
}

function bounce(from, start, end, velocity) {
  var accel = accelerate(from, start, end, velocity)
    , dampening = 0.2
    , bounceDuration = quadratic(accel.gravity, -accel.finalVelocity * dampening, 0)
    , totalDuration = accel.duration + bounceDuration

  return {
    duration: totalDuration,
    to: accel.to,
    fn: function(time) {
      if(time < accel.duration) return accel.fn(time)
      time -= accel.duration
      return accel.to - parabola(-accel.gravity, accel.finalVelocity * dampening, 0, time)
    }
  }
}


function overshoot(from, start, end, velocity) {
  var accel = accelerate(from, start, end, velocity)
    , frequency = 2
    , decay = 20 
    , bounceDuration = 1/(2*frequency)
    , totalDuration = accel.duration + bounceDuration

  return {
    duration: totalDuration,
    to: accel.to,
    fn: function(time) {
      if(time < accel.duration) return accel.fn(time)
      time -= accel.duration

      w = frequency * Math.PI * 2
      return accel.to + (velocity * (Math.sin((time)*w) / Math.exp(decay*(time))/w))
    }
  }
}

var interpolators = module.exports = {
  bounce: bounce,
  overshoot: overshoot
}