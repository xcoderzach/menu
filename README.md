# Menu

  Menu is a library for creating smooth touch enabled slide menus.

  First check out the examples to see the types of things that Menu is capable
of.

# Example

var menu = new Menu({
  menu: '.menu',
  container: '.container',
  handle: '.handle',
  mode: 'reveal'
})

##methods

###menu.open([callback])
  opens the menu.

###menu.close([callback])
  closes the menu.

###menu.toggle([callback])
  toggles the menu open or closed.

##options

###edgeActivate: Boolean
  Will pulling from the edge of the screen bring the menu in.

###menuSwipeClose: Boolean
  Will swiping the menu close the menu.

###containerSwipeClose: Boolean
  Will swiping the container close the menu.

###animator
  Pass in a custom animator, can also be an array of
animators.

###direction
  Menu opens from `top`, `right`, `left`, or `bottom`

###activationAngle
  Degrees from axis which will activate the menu 

  if the angle the users finger is moving at is between
180 - activationAngle and 180 + activationAngle, then
activate the menu.

###minVelocity
  Minimum velocity that the menu will launch at. This will prevent
  the menu from creeping along at a fraction of a pixel per second.

###maxVelocity
  Maximum velocity that the menu will launch at.

###pullPastDampening 
	Once a user has pulled the menu past it's open or closed state, 
percent to dampen pulling.  Value from 0 to 1.  This can also be 
an object like so:

```javascript
{ open: 1/3, closed: 0 }
```

###maxPullPast 
  Once a user has pulled the menu past it's open or closed state, 
percent to dampen pulling.  Value in pixels.  This can also be 
an object like so:

```javascript
{ open: 20, closed: 0 }
```

###mode
  The available options are `push`, `cover`, and `reveal`

  * push - Pushes the menu in and the container out.
  * cover - Pushes the menu in over top of the container.
  * reveal - Pushes the container out, revealing the menu underneath.

##events

open - emitted when the menu is opened
close - emitted when the menu is closed

overshoot
	* gravity - Gravity acceleration in pixels per second squared
	* frequency - Frequency of the sine wave used by the overshoot launch function
	* decay - Decay of the overshoot sine wave

accelerate
	* gravity - Gravity acceleration in pixels per second squared

bounceAnimationOptions
	* gravity - Gravity acceleration in pixels per second squared
	* dapening - Amount to dampen velocity on each bounce
	* minBounceHeight - Minimum height for a bounce

animationType
  This determines how the launch animation will be performed. 

  Can be `keyframe` or `js`, keyframe will generate a keyframe animation up front 
and apply it to the elements.  `js` will use requestAnimation frame to animate the
keyframe.  

  Keyframe may have a slight lag at the beginning of the launch but will be smoother
throughout.  `js` will transition from moving to launching more fluidly, but may
jank if something in the main thread gets in its way.

var animator = new Animator({
	open: {
	  type: 'overshoot',
	  opts: {}
	},
	close: {
	  type: 'bounce',
	  opts: {}
	}, 
})
