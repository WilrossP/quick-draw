# SkyCiv Platform Rules

Please read this before building any solution or prototype. These are the rules required to follow when building a software or product for SkyCiv. This ensures the everything is written to be work with existingg sydtems as easily as possible.

## Frontend Rules

- **Avoid the global namespace**
	- Keep code inside namespaces or modules so it can be safely reused elsewhere.
- **Reuse code**
	- Do not define the same function multiple times.
	- Create shared utilities and reuse them.
- **Use existing utilities**
	- Prefer Semantic UI functions.
	- Prefer SkyCiv UTILS.
	- Use existing SkyCiv packages and project components where possible.
- **Use jQuery**
	- Use jQuery for DOM manipulation and events instead of vanilla JavaScript where practical.
- **Separate concerns**
	- Keep business logic separate from UI manipulation.
	- Keep utilities and configuration in separate files or modules.
- **Keep code human readable**
	- Prefer simple and obvious code over clever or unnecessarily complex implementations.
- **Avoid unnecessary modern JS features**
	- Do not use ?? or .. anywhere 
- **Keep HTML and Blade consistent**
	- `index.html` should closely match `index.blade.php`.
	- Avoid differences in structure, classes, and styling when moving the project into the platform.
- **Set up the project properly from the start**
	- Use a consistent project structure and build setup.
	- Avoid adding workarounds later because of an unsuitable initial setup.

### Example Code Structure

```js
    const PROJECT = {}; //main namespace containing all functions, definted in an init.js file
    PROJECT.annotate = function() {

        let functions ={};

        functions.init = function() {}

        functions.openAnnotationTool = function() {}

        const getDefaultColour = () => { }

        return function;

    }();

```

### Adding Scripts

- Add to file_pack.json (in root), do the same for new css
- This automtomatically packs in the tempalte
- Frontend can be run with `npm run build`

### Use SKYCIV_UTILS where needed

- This should be default for all alerts, loading, tables, reporting, unit conversion and the like
- For local coding alreaduy included in template.html
- Read inside rules/skyciv-utils

## File Manager Integration and Setup

You should have the following global variables to make integration into the platform's file manager easier.
- Create a function that creates a thumbnail and stores it as a global variable `THUMBNAIL_DATA` in base64 format.

## Appearance

Some common appearance rules we have, to ensure the software feels consistent with the rest of the platform.

Remember! We always use the Semantic UI is installed on the platform (you may need to load in a local version since we're testing locally) but we rely a lot on this for core UI features and styling. These should be used for all inputs, dropdowns, radio buttons, buttons.

Sometimes, semantic inputs can be too big so in those cases we resort to custom CSS and try to make things like similar in way of appearances and colours. DEfault colurs have been added to frontend/css/styles.css

- Side bar colour #1C2533
- Buttons on the side bar: #2A364D
- Action buttons: #2185D0, uses "ui buttons" as per semantic UI
- Delete button colour: #B14D4D!
- Back/secondary buttons, we use grey based on default semantic colours: for example a class may be "ui labeled icon button tiny"
- We use semantic class "tiny" or "mini" a fair bit to keep things tight and smaller
- Tertiary colour if you want to highlight something, you can consider using built in Semantic UI teal
- Pass colour: based on semantic "green" class name

## Backend

- Keep things simple as possible
- Avoid writing data to the server without consulting first
- Make sure to write generic middleware (already template in server)
- Follow the strucutre in server template
    - index.js (entry point)
    - endpoints.js (where every endpoint is registered)
    - functions.js (where logic is called)
    - Put logic in its own files/utils

