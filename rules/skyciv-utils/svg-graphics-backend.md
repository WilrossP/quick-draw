
# SVG Graph Diagrams

This graphing tool was designed for SkyCiv design reports so that the scale of the text, axis, legend; plot elements like lines, points and, polygons: look good on a full page width. However, it could be used front end in the browser if desired with light modification; this is one of the main reasons why svg as a technology was chosen rather than using existing packages as we're primarily making software for the web. Svg also has the advantage of scalable without aliasing unlike png or jpeg files which are produced from Matplotlib in Python, or Chart.js.

<style>
  img {
      max-width: 750px !important;
      background-color: transparent !important;
      margin-left: auto !important;
      margin-right: auto !important;
      display: block !important;
  }
</style>

## Sample:
![Example ouput](https://bytebucket.org/skyciv/svg-graph/raw/aad68bc68698068338162a6b5cf5774d679389be/example.svg?token=0ffbafb235be1cc527a396cb96c1f26b333e7ccb)


### Installation
This module is still in development so it will occassionally be updated. Therefore, it is recommended that it is installed as a *git submodule* rather than simply copying the code manually. This is similar to cloning the repo: ```git submodule add https://bitbucket.org/skyciv/svg-graph <path-to-submodule>```; if you leave out ```<path-to-submodue>``` git will install it in the root directory under the folder ```svg-graph```.

After that, you should run ```git submodule update --init``` to initialise the submodule; this has to be done every time the repo is cloned so it's also recommended that a build script be added to the repo to make it easier for other developers. Git submodules can be tricky, especially if you need to remove them, so be careful; it's best to commit all your changes and push to origin before you try, so you can reclone your repo if you need to. If you're not confident ask for help.

Doing all this will ensure that code can be updated easily by ```cd <path-to-submodule> && git pull origin master```.

### Use
To use the graph see ```example.js```.
For a list of colours that are supported by svg check out [this link](https://www.december.com/html/spec/colorsvg.html)

### Development
* [ ] Graph
    * [x] Title
    * [x] Axis
        * [x] Labels
        * [ ] Markers
            * [ ] Display user options
                * [x] auto tick marks and tick values (Heckbert's Algorithm)
                * [ ] use data coordinates for markers (requests: 0)
            * [ ] format number as exponential for large values (requests: 0)
            * [ ] shift plot area right based on maxium length of y-axis-values text (Priority #1)
    * [x] Legends
    * [x] Plot Area
        * [x] Plot type user options
            * [x] Points
            * [x] Lines
            * [x] Polygons
        * [x] Aspect ratio user options
            * [x] flexible (scales axes individually) allowable range of 0.8-1.2
            * [x] equal (scales plot)
        * [ ] Borders (requests: 0)
    * [ ] Border (requests: 0)

Priorities are listed in rank order as #X, where X is rank.


## example.js

```js
const Graph = require(__dirname + '/graph.js');
let graph_data = {
        scale: 1, // default to 1, 1 is the max width of the centre column in the calculation reports
        x_axis: {
          title: 'x-axis', // OPTIONAL 
          markers: 'auto', // OPTIONAL "auto" | "data" | "extremes"
          include_0: false, // OPTIONAL by default it is false, but some graphs will want to see the axis line as a reference point
        },
        y_axis: {
          title: 'y-axis', // OPTIONAL 
          markers: 'auto', // OPTIONAL "auto" | "data" | "extremes"
          include_0: true, // OPTIONAL by default it is false, but some graphs will want to see the axis line as a reference point
        },
        title: 'Graph Title', // OPTIONAL
        aspect_ratio: 0.5, // OPTIONAL "equal" or "flexible" or ratio as "number". Default is equal which doesn't scale the graph coordinates
        legend: 'top', // OPTIONAL "top" or "bottom"
        chart_grid: true, // OPTIONAL defaut false
        to_precision: 3, // OPTIONAL
        // to_fixed: 3, // OPTIONAL
        data: [
          {
            type: 'line', // points, line, or polygon
            coordinates: [
              [0, 0], [100, 50], [200, 50], [300, 0]
            ],
            colour: 'red',
            name: 'points', // OPTIONAL
            data_labels: { // OPTIONAL
              text_anchor: "start",
              text_color: "blue",
              circle_color: "#BE2525"
            },
            projection: {
              point: [0, 30],
              projection_color: ['orange'],// OPTIONAL. if not given green is the default
              projection_labels_x: ['Mry'],
              projection_labels_y: ['N*']
            }
          },
          {
            type: 'line', // points, line, or polygon
            coordinates: [
              [0, 0], [200, 150], [250, 150], [350, 0]
            ],
            colour: 'orange',
            name: 'straight line', // OPTIONAL
            data_labels: { // OPTIONAL
              text_anchor: "start",
              text_color: "black",
              circle_color: "#BE2525"
            },
          },
          {
            type: 'line',
            spline: true, // OPTIONAL
            colour: 'darkred',
            name: 'spline line', // OPTIONAL
            coordinates: [
              [0, 0], [100, 30], [200, 60], [300, 120]
            ],
          },
      
          {
            type: 'polygon',
            colour: 'green',
            name: 'polygon', // OPTIONAL
            coordinates: [
              [100, 100], [200, 100], [200, 200], [100, 200]
            ],
          }
        ]
    }

let my_graph = new Graph(graph_data)
let figure = my_graph.saveFig(__dirname + '/example.svg');
let figure_html = my_graph.output();

```

# Output
![Example ouput](https://bytebucket.org/skyciv/svg-graph/raw/aad68bc68698068338162a6b5cf5774d679389be/example.svg?token=0ffbafb235be1cc527a396cb96c1f26b333e7ccb)
