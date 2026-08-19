# SVG Creator

## Installation

In your blade.php

```php
@push('head_scripts')
	@include('inc/res/svg')
@endpush
```

As a script

```js
https://platform.skyciv.com/assets/res/svg/svg-creator.min.js
```

## Example

```js
	var svg = SVGExtended
	svg.initialize("container-id");

	// set up conceptual working space from (0,0) to (100,100) 
	// with a border of 0.05 (5%) of page size. 2.5% on each side.
	const W = 100;
	const H = 100;
	svg.setBoundary({
		x1 : 0, 
		y1 : 0, 
		x2 : W, 
		y2 : H, 
		border : 0.05
	}) 

	// update shape properties for all
	// every shape created after calling this function will now use these properties by default
	svg.updateShapeProps({
		fill_color: "green",          // green fill color
		fill_opacity: 0.8,            // slightly transparent
		stroke: "black",              // black border line
		stroke_width: 1,              // border thickness of 1
		stroke_opacity : 1,           // border fully opaque
		stroke_dasharray : "5,5",     // dashed border pattern
		stroke_linejoin : "miter"     // How corner between lines are connected. See https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin
	})

	// plotting rectangle
	// plots a rectangle from the center of the div (50,50) to the bottom right of the div (100,100)
	svg.addRect({
		x: W / 2, // left
		y: H / 2, // bottom
		rx : 0,  // corner radius 
		ry : 0,  // corner radius
		width : W /2,  
		height : H / 2, 
		fill_color : "red", // fill color overrides default of green
	})

	// lets use circles to mark the edges & center of the SVG working area
	// shape default properties will be used except stoke opacity set to 0 to remove border
	svg.addCircle({ x: 0, y: 0 , radius : 1, stroke_opacity : 0})
	svg.addCircle({ x: 0, y: H , radius : 1, stroke_opacity : 0})
	svg.addCircle({ x: W, y: 0 , radius : 1, stroke_opacity : 0})
	svg.addCircle({ x: W, y: H , radius : 1, stroke_opacity : 0})
	svg.addCircle({ x: W / 2, y: H / 2 , radius : 1, stroke_opacity : 0})

	// update the graph in the div
	svg.updateGraph();
```

## Full Documentation

[Visit here](https://skyciv.com/api/v3/docs/quick-design-svg-extended#sample-usage)
