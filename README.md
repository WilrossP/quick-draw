# Quick Draw

A drawing template library for the SkyCiv platform. Quick Draw scans a folder of
DXF drawing templates, renders a preview of each one, keeps a title and
categories against them, and hands any template over to SkyCiv CloudCAD.

## Running

To run frontend run `npm run build`
To run server run `npm run dev`

The frontend reaches the server on `http://localhost:4000` when it is opened
straight off disk, and same-origin once it is running on the platform.

## Configuration

All optional - Quick Draw runs without any of it. Set in `.env`:

| Variable | Purpose |
|---|---|
| `QUICKDRAW_TEMPLATE_DIR` | Folder scanned for `.dxf` templates. Defaults to the folder holding the project. |
| `SKYCIV_USERNAME` | SkyCiv API username, for one-click CloudCAD opening. |
| `SKYCIV_KEY` | SkyCiv API key. |

Without API credentials the drawing still converts, and the user is offered the
converted CloudCAD model and the original DXF to import by hand.

## How a drawing reaches CloudCAD

1. The DXF is parsed into `{ header, layers, blocks, entities }`.
2. Entities are flattened into plain primitives - blocks are resolved through
   their `INSERT` transforms, dimensions through their anonymous blocks, and
   curves are tessellated so mirrored and non-uniform scales stay correct.
3. Those primitives render two ways: to an SVG preview, and to a CloudCAD
   `cad_data` model.
4. `cad_data` goes to the SkyCiv API (`S3D.session.start` ->
   `cloudcad.model.create` -> `cloudcad.file.save`), which returns a link that
   opens the drawing in CloudCAD.

Two coordinate rules apply on the way into CloudCAD: y is negated, because
CloudCAD y points down where DXF y points up, and text colour is kept light,
because the CloudCAD canvas is dark.

## Supported DXF entities

`LINE`, `LWPOLYLINE`, `POLYLINE`/`VERTEX`, `CIRCLE`, `ARC`, `ELLIPSE`, `SPLINE`,
`TEXT`, `MTEXT`, `ATTRIB`, `SOLID`, `TRACE`, `POINT`, `LEADER`, `HATCH`,
`INSERT` (nested, arrayed, rotated and scaled) and `DIMENSION`.

Polyline bulges become true arcs. Splines are approximated by Chaikin
subdivision of their control polygon, with the number of rounds scaled back on
dense splines. Circles and arcs survive as real curves in the CloudCAD output
wherever the transform preserves them, rather than expanding into hundreds of
straight segments.

## Titles and categories

Both are derived from the file name on first scan - keyword rules map
`isolated-footing.dxf` to **Foundations**, `a3-template.dxf` to **Sheet
Templates**, and so on. Anything the user edits is written to
`quick-draw-library.json` as an override. Only overrides are stored, so deleting
that file resets the library to its derived state without touching a drawing.

## Structure

```
frontend/
  body.html            markup, mirrored by index.blade.php
  css/styles.css
  js/init.js           QUICKDRAW namespace
  js/settings.js       API base, preview sizes, default categories
  js/state.js          library state and filtering
  js/utils/ajax.js     request wrapper and response unwrapping
  js/thumbnail.js      THUMBNAIL_DATA for the platform file manager
  js/cloudcad.js       CloudCAD hand-off
  js/editor.js         title/category editing
  js/library.js        sidebar and card grid
  js/app.js            wiring
server/
  index.js             entry point
  endpoints.js         route registration
  functions.js         endpoint logic
  utils/config.js
  utils/dxf-parser.js      DXF to { header, layers, blocks, entities }
  utils/dxf-flatten.js     entities to flat primitives
  utils/aci-colors.js      AutoCAD colour index to hex
  utils/svg-preview.js     primitives to SVG
  utils/cloudcad-convert.js primitives to cad_data, and the API call
  utils/library.js         template scanning and metadata
```

## Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/library` | All templates plus the categories in use |
| `GET` | `/api/templates/:id` | One template with geometry stats |
| `POST` | `/api/templates/:id` | Edit title, categories, tags, notes, favourite |
| `GET` | `/api/templates/:id/preview.svg` | SVG preview (`width`, `height`, `text`) |
| `GET` | `/api/templates/:id/download` | The original DXF |
| `GET` | `/api/templates/:id/cad-data` | The converted CloudCAD model |
| `POST` | `/api/templates/:id/cloudcad` | Convert and hand off to CloudCAD |
