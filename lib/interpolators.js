
var qf = function(a, b, c) {
  return (-b - Math.sqrt(b * b - 4 * a * c))/(2 * a)
}

var para = function(ih, iv, g, t) {
  return -g / 2 * t * t + iv * t + ih
}

function bounce(from, v0, bounce) {

  var g0 = 1000
  var g1 = 3000
  var g2 = 3000

  var df = 0.2

  var t0 = qf(-g0/2, -v0, from)
  var v1 = (v0 + (t0 * g0)) * df;
  var t1 = qf(-g1/2, v1, 0)

  var duration = t0

  if(v1 > 200 && bounce) {
    duration += t1
  }

  return {
    duration: duration,
    interpolator: function(t) {

      if(t < t0) return para(from, -v0, g0, t)

      t -= t0;

      if(t < t1) return para(0, v1, g1, t)

      t -= t1;
    }
  }
}

function overshoot(from, v0, bounce) {

  var df = 1;

  var g0 = 1000;
  var t0 = qf(-g0/2, -v0, from);

  var v1 = (v0 + (t0 * g0)) * df;
  var g1 = 9000;


  var freq = 1
  var decay = 15 

  var t1 = 1/(2*freq)

  var duration = t0

  //clamp
  if(v1 > 200 && bounce) {
    duration += t1
  }

  return {
    duration: duration,
    interpolator: function(t) {

      if(t < t0) return para(from, -v0, g0, t)

      t -= t0

      if(t < t1) {
        var w = freq * Math.PI * 2
        return - (v0 * (Math.sin((t)*w) / Math.exp(decay*(t))/w))
      }

      t -= t1;

      return 0;
    }
  }
}

var interpolators = module.exports = {
  bounce: bounce,
  overshoot: overshoot
}