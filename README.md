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

All optional - Quick Draw runs without any of it. Copy `.env.example` to `.env`
and fill in what you need:

| Variable | Purpose |
|---|---|
| `QUICKDRAW_TEMPLATE_DIR` | Folder scanned for the shared, curated `.dxf` templates. Defaults to the folder holding the project. |
| `QUICKDRAW_PERSONAL_DIR` | Root folder for per-user personal templates. Defaults to `personal-templates/` in the project. |
| `SKYCIV_USERNAME` | SkyCiv account email. Used for CloudCAD opening, and identifies the user for **My Templates**. |
| `SKYCIV_KEY` | SkyCiv API key, from https://platform.skyciv.com/api |

Without API credentials the drawing still converts, and the user is offered the
converted CloudCAD model and the original DXF to import by hand.

### Enabling "Open in CloudCAD"

1. Copy your username and key from https://platform.skyciv.com/api into `.env`.
2. Restart the server - `dotenv` only reads `.env` at startup, so a running
   server will not pick up new credentials and Rescan will not help.
3. The startup log confirms it. Without credentials it prints a line saying the
   hand-off will use the download fallback; with them, that line is absent.

Each hand-off spends API credits, since it runs a real
`session.start` -> `model.create` -> `file.save` call. Drawings land in the
`quick-draw/` path of your SkyCiv cloud storage, named after the template id, so
opening the same template twice overwrites rather than piling up copies.

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

## Shared library and My Templates

The library presents two scopes as one list:

| Scope | Folder | Behaviour |
|---|---|---|
| **Shared Library** | `QUICKDRAW_TEMPLATE_DIR` | The curated set everyone sees. Read-only - Quick Draw never writes or deletes a drawing here. |
| **My Templates** | `QUICKDRAW_PERSONAL_DIR/<user>/` | The current user's own drawings. They can add and delete freely. |

The current user is identified by `SKYCIV_USERNAME`, slugified into a folder
name. With no username set everything falls back to a single `local-user`
folder, which is fine for local testing but means one shared personal space.

Personal ids carry a `my~` prefix so they can never collide with a shared id -
the separator cannot occur in a generated slug, which strips everything outside
`a-z`, `0-9` and the hyphen.

### Creating a new template

1. **New Template in CloudCAD** opens CloudCAD to draw in.
2. Export the finished drawing as DXF.
3. **Add Template** uploads it into your personal folder.

Uploads are parsed before they are kept, so a file that is not a readable DXF, or
has no drawable geometry in it, is rejected rather than sitting in the library as
a broken card. File names are reduced to a bare safe name, so nothing can be
written outside your own folder, and an existing drawing is never overwritten -
a repeat name is numbered instead.

## Titles and categories

Both are derived from the file name on first scan - keyword rules map
`isolated-footing.dxf` to **Foundations**, `a3-template.dxf` to **Sheet
Templates**, and so on. Anything the user edits is stored as an override.

Each scope keeps its own overrides file, so nothing personal ever lands in the
shared one and two users cannot collide:

- shared: `quick-draw-library.json` beside the project
- personal: `library.json` inside the user's own folder

Only overrides are stored, so deleting one of those files resets that scope to
its derived state without touching a drawing.

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
| `GET` | `/api/library` | All templates (both scopes) plus the categories in use |
| `POST` | `/api/personal/templates` | Upload a DXF into the current user's personal folder |
| `DELETE` | `/api/templates/:id` | Delete one of the user's own drawings. Refuses shared templates |
| `GET` | `/api/templates/:id` | One template with geometry stats |
| `POST` | `/api/templates/:id` | Edit title, categories, tags, notes, favourite |
| `GET` | `/api/templates/:id/preview.svg` | SVG preview (`width`, `height`, `text`) |
| `GET` | `/api/templates/:id/download` | The original DXF |
| `GET` | `/api/templates/:id/cad-data` | The converted CloudCAD model |
| `POST` | `/api/templates/:id/cloudcad` | Convert and hand off to CloudCAD |
