
# SkyCiv Section SVG Graphics

A simple package that can be used to draw neat and easy SVG section graphics on front and backend development. The package is available at the following link and should be included on any page/backend tool using the package hosted on this link:
 
[https://platform.skyciv.com/assets/res/section-svg/section-svg.min.js](https://platform.skyciv.com/assets/res/section-svg/section-svg.min.js)
<style>
  img {
      max-width: 600px !important;
      background-color: transparent !important;
      margin-left: auto !important;
      margin-right: auto !important;
      display: block !important;
  }
</style>

## Getting Started

To get started with a section you first need to initialize a new `SECTION_SVG`.

```js
	let opts = { div_id: 'some_div_id', };
	let sec_name = new SECTION_SVG(opts);
```

The following options are available to configure the options for the section:

| Option          | Accepts      | Default     | Notes 									     	|
|-----------------|--------------| ----------- |------------------------------------------------|
| div_id          | `string`     |             |												|
| height          | `number`     |             |												|
| width           | `number`     |             |												|
| side_gaps       | `number`     | 0.2         | Padding on the side of the section.     		|
| font_size       | `number`     | 15     	   |												|
| text_hor_shift  | `number`     | 0.1    	   |												|
| text_vert_shift | `number`     | 0.18        |												|
| dashed_prop     | `string`     | '10 5'      | Must be two numbers space separated in string. |
| dim_arrow_prop  | `array`      | [0.05, 0.1] | Must be array of two numbers.   				|
| dim_ends_width  | `number`     | 0.3   	   |												|
| dim_ends_t      | `number`     | 2.0         |												|
| sec_edge_color  | `string`     | '#000000'   | Must be a hex code.  							|
| dimm_color      | `string`     | '#000000'   | Must be a hex code.  							|
| axis_color      | `string`     | '#ff0000'   | Must be a hex code.  							|

## Example Section 1: Standard Composite Column

![Section Example 1](?file_real=images/utils/sec_svg_graphics_1.png)

```js

        let concrete_shape = [[150, 150], [150, -150], [-150, -150], [-150, 150]];
        let steel_profile = [[0, 100], [100, 100], [100, 85], [22.5, 85], [17.84125718815463, 84.38666487320323], [13.499999999999998, 82.5884572681199], [9.772077938642143, 79.72792206135786], [6.911542731880104, 76], [5.11333512679677, 71.65874281184537], [4.5, 67], [4.5, 0], [4.5, -67], [5.11333512679677, -71.65874281184537], [6.911542731880104, -76], [9.772077938642143, -79.72792206135786], [13.499999999999998, -82.5884572681199], [17.84125718815463, -84.38666487320323], [22.5, -85], [100, -85], [100, -100], [0, -100], [0, -100], [-100, -100], [-100, -85], [-22.5, -85], [-17.84125718815463, -84.38666487320323], [-13.499999999999998, -82.5884572681199], [-9.772077938642143, -79.72792206135786], [-6.911542731880104, -76], [-5.11333512679677, -71.65874281184537], [-4.5, -67], [-4.5, 0], [-4.5, 67], [-5.11333512679677, 71.65874281184537], [-6.911542731880104, 76], [-9.772077938642143, 79.72792206135786], [-13.499999999999998, 82.5884572681199], [-17.84125718815463, 84.38666487320323], [-22.5, 85], [-100, 85], [-100, 100], [0, 100]];
        let rebar = [[120, 120, 20], [120, -120, 20], [-120, -120, 20], [-120, 120, 20]];
        let links = [[130, 130], [130, -130], [-130, -130], [-130, 130], 10, 6];
        let axis = [[[-75, 0], [75, 0]], [[0, 75], [0, -75]]];
        let dims = [["left", 1, 0, 300, '300.0'], ["bottom", -1, 0, 300, '300.0'], ["right", -1, 0, 30, '30.0'], ["right", 1, 30, 270, '240.0'], ["right", -1, 270, 300, '30.0'], ["top", 1, 0, 20, '20.0'], ["top", 1, 280, 300, '20.0']];
        let steel_profile_color = "#66b3ff";
        let concrete_color = "#d9d9d9";
        let rebar_color = "#ff471a";
        let links_color = "#248f24";

        let sec_1 = new SECTION_SVG({ div_id: 'div_1', });

        sec_1.drawData({
            type: "encased",
            concrete_shape: concrete_shape,
            steel_profile: steel_profile,
            links: links,
            rebar: rebar,
            concrete_color: concrete_color,
            steel_profile_color: steel_profile_color,
            rebar_color: rebar_color,
            links_color: links_color,
            axis: axis,
            dims: dims,
            reserve: true
        });

        //optional - auto resizes
        jQuery(window).on("resize", function () {
            sec_1.updateOnResize();
        })
```



## Example Section 2: Encased Section

![Section Example 2](?file_real=images/utils/sec_svg_graphics_2.png)

```js
        let sec_3 = new SECTION_SVG({ div_id: 'some_div_id', });

        sec_3.drawData({
            type: "circle hollow",
            concrete_D: 400,                // concrete part diameter
            outer_sheet_t: 10,              // outer steel tube thickness
            steel_profile: steel_profile,
            links: [336, 6],                // [inner liks ring diamater, rebar diameter]
            rebar: [320, 10, 16],           // [diamater of rebar ring, number of bars along ring, rebar diameter]
            concrete_color: concrete_color,
            steel_profile_color: steel_profile_color,
            rebar_color: rebar_color,
            links_color: links_color,
            outer_sheet_color: "#0080ff",
            axis: axis,
            dims: [["left", 1, 0, 420, '420.0'], ["bottom", 1, 0, 10, '10.0'], ["right", 1, 10, 410, '400.0']],
            reserve: true
        });

```

## Example Section 3: Composite Beam

![Section Example 3](?file_real=images/utils/sec_svg_graphics_3.png)


```js

    let my_section_canvas = new SECTION_SVG({ div_id: 'some_div_id', });

    my_section_canvas.drawData({
        type: "composite beam",
        deck_type: "perpendicular",
        deck_shape: [700, 100, 200, 30],        // [deck width, deck t, deck bot width, deck bot t]
        steel_profile: steel_profile,
        shear_studs: [[-50, 16, 32, 60, 10], [0, 16, 32, 60, 10], [50, 16, 32, 60, 10]], // [pos, d1, d2, H, h1]
        rebar: [16, 8, 35, 30], // [d, num, top shift, side shift]
        axis: [[[-200, 70], [200, 70]]],
        concrete_color: concrete_color,
        steel_stud_color: '#ff9933',
        steel_profile_color: steel_profile_color,
        rebar_color: rebar_color,
        links_color: links_color,
        dims: [["left", 1, 0, 100, '100'], ["left", 1, 130, 130 + 200, '200'], ["left", -1, 100, 130, '30'], ["right", 1, 0, 130 + 200, '330'], ["top", -1, 0, 700, '700']],

        reserve: true
    });
```


## Node Sample:

This package can also be used on NodeJS, here's a sample of how to draw a section on the backend using NodeJS:

```js 

    var SECTION_SVG = require(__dirname + '/section-svg.js');

    let concrete_shape = [[150, 150], [150, -150], [-150, -150], [-150, 150]];
    let steel_profile = [[0, 100], [100, 100], [100, 85], [22.5, 85], [17.84125718815463, 84.38666487320323], [13.499999999999998, 82.5884572681199], [9.772077938642143, 79.72792206135786], [6.911542731880104, 76], [5.11333512679677, 71.65874281184537], [4.5, 67], [4.5, 0], [4.5, -67], [5.11333512679677, -71.65874281184537], [6.911542731880104, -76], [9.772077938642143, -79.72792206135786], [13.499999999999998, -82.5884572681199], [17.84125718815463, -84.38666487320323], [22.5, -85], [100, -85], [100, -100], [0, -100], [0, -100], [-100, -100], [-100, -85], [-22.5, -85], [-17.84125718815463, -84.38666487320323], [-13.499999999999998, -82.5884572681199], [-9.772077938642143, -79.72792206135786], [-6.911542731880104, -76], [-5.11333512679677, -71.65874281184537], [-4.5, -67], [-4.5, 0], [-4.5, 67], [-5.11333512679677, 71.65874281184537], [-6.911542731880104, 76], [-9.772077938642143, 79.72792206135786], [-13.499999999999998, 82.5884572681199], [-17.84125718815463, 84.38666487320323], [-22.5, 85], [-100, 85], [-100, 100], [0, 100]];
    let rebar = [[120, 120, 20], [120, -120, 20], [-120, -120, 20], [-120, 120, 20]];
    let links = [[130, 130], [130, -130], [-130, -130], [-130, 130], 10, 6];
    let axis = [[[-75, 0], [75, 0]], [[0, 75], [0, -75]]];
    let dims = [["left", 1, 0, 300, '300.0'], ["bottom", -1, 0, 300, '300.0'], ["right", -1, 0, 30, '30.0'], ["right", 1, 30, 270, '240.0'], ["right", -1, 270, 300, '30.0'], ["top", 1, 0, 20, '20.0'], ["top", 1, 280, 300, '20.0']];
    let steel_profile_color = "#66b3ff";
    let concrete_color = "#d9d9d9";
    let rebar_color = "#ff471a";
    let links_color = "#248f24";

    let sec_1 = new SECTION_SVG({
        height: 300,
        width: 300,
    });

    sec_1.drawData({
        type: "encased",
        concrete_shape: concrete_shape,
        steel_profile: steel_profile,
        links: links,
        rebar: rebar,
        concrete_color: concrete_color,
        steel_profile_color: steel_profile_color,
        rebar_color: rebar_color,
        links_color: links_color,
        axis: axis,
        dims: dims,
        reserve: true
    });

    console.log(sec_1.getHTML());


```