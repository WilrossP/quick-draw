# Quick Design SB Integration

## `SectionBuilderAPI.solveShapeTemplate(shape, dims, unit_system)`

Get section properties for a custom shape from Section Builder

### Supported Shapes and Dimensions

| Shape                 | Required Dimensions                                                                  |
|-----------------------|--------------------------------------------------------------------------------------|
| `rectangular`         | `h` (height), `b` (base width)                                                       |
| `hollow_rectangular`  | `h` (height), `b` (base width), `t` (thickness), `r` (corner radius), `tb` (thickness base) |
| `circular`            | `D` (diameter)                                                                       |
| `hollow_circular`     | `D` (diameter), `t` (thickness)                                                      |
| `i_section`           | `TFw` (top flange width), `TFt` (top flange thickness), `BFw` (bottom flange width), `BFt` (bottom flange thickness), `h` (height), `Wt` (web thickness), `r` (corner radius) |
| `t_section`           | `TFw` (top flange width), `TFt` (top flange thickness), `h` (height), `Wt` (web thickness), `r` (corner radius) |
| `angle`               | `BFw` (bottom flange width), `BFt` (bottom flange thickness), `h` (height), `LFt` (leg flange thickness), `r` (corner radius) |


### Example

```js
let props = await SectionBuilderAPI.solveShapeTemplate('hollow_rectangular', { h: 9.842, b: 5.905, t: 0.63, r: 0.945, tb: 0.63 }, 'imperial');
let props_2 = await SectionBuilderAPI.solveShapeTemplate('i_section', { TFw: 8, TFt: 0.43, BFw: 8, BFt: 0.43, h: 8, Wt: 0.29, r: 0.4 }, 'imperial');
```

## `SectionBuilderAPI.solveCustomShapeFromLines(points, thickness, units)`

Creates and solves custom shapes from line points in SkyCiv Section Builder.

Note: This runs slow at first but caches all data for future runs
It is recommended that in the settings object you set `show_analysis_loader: true` to let the user know this will take a minute.

### Example

```js
let points_array = [[0, 40.06, 0], [20.85, 40.06, 0], [40.06, 20.85, 0], [40.06, 0, 0]];
let res = await SectionBuilderAPI.solveCustomShapeFromLines(points_array, 6, metric);
```

## `SectionBuilderAPI.solveCustomShapeFromMultipleLines(points_arr, thickness_arr, units)`

Creates and solve multiple custom shapes from line points in SkyCiv Section Builder.

```js
let array = [
	[0, 40.06, 0],
	[20.85, 40.06, 0],
	[40.06, 20.85, 0],
	[40.06, 0, 0],
];

let array2 = [
	[0, 40.06, 0],
	[-20.85, 40.06, 0],
	[-40.06, 20.85, 0],
	[-40.06, 0, 0],
];

let res = await SectionBuilderAPI.solveCustomShapeFromMultipleLines([array, array2], [5, 5]);
```

## `SectionBuilderAPI.runGSD(shape, dims, gsd_data, unit_system)`

Run the SkyCiv GSD in Section builder 
Note: Currently only supports `circular` and `rectangular` shapes

| Shape                 | Required Dimensions                                                                  |
|-----------------------|--------------------------------------------------------------------------------------|
| `rectangular`         | `h` (height), `b` (base width)                                                       |
| `circular`            | `D` (diameter)                                                                       |

### `gsd_data`

As per the [SkyCiv API Documentation](https://skyciv.com/api/v3/docs/S3D.SB#s3dsbrungsd)

```js
let gsd_data = {
	"design_code": "AS 3600",
	"concrete_class": "C50",
	"steel_grade": "R250N",
	"return_stress_results": false,
	"reinforcement": [
		{ "z": -500, "y": 500, "diam": 16 },
		{ "z": 0, "y": 500, "diam": 16 },
		{ "z": 500, "y": 500, "diam": 16 }
	],
	"loads": [
		{ "N": 120, "Mz": 20, "My": 25 },
		{ "N": 150, "Mz": -20, "My": -25 }
	]
};

let GSD_data = await SectionBuilderAPI.runGSD('rectangular', { h: 200, b: 200 }, gsd_data, 'metric');
```


