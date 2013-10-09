module.exports = Animator

function Animator(axis, rules) {
	this.axis = axis
  this.rules = rules
}

Animator.prototype.css = function(position) {
	var cssStr = ''
	var rules = this.rules(position)
	for(rule in rules) {
	  if(rules.hasOwnProperty(rule)) {
	    cssStr += rule + ':' + rules[rule] + ';'
	  }
	}
	return cssStr
}

Animator.prototype.applyToElement = function(el, position) {
	var rules = this.rules(position)
	for(rule in rules) {
	  if(rules.hasOwnProperty(rule)) {
	    el.style[rule] = rules[rule]
	  }
	}
}
