# SkyCiv Quick Forms

The quick forms package is a form builder package to help you quickly and easily generate an input form based on a json object. 

## Installation

To add the Quick Forms to your page please include the following script.

```js
<script src="https://platform.skyciv.com/assets/res/quick-forms/quick-forms.js"></script>
```

The following dependencies must also be on the page:

- [jQuery](https://jquery.com/)
- [Semantic UI](https://semantic-ui.com/)
- [SkyCiv Entry Tables](https://dev.skyciv.com/dev-docs/?=skyciv-utils/entry-tables.md)
- [SkyCiv Utils](https://dev.skyciv.com/dev-docs/?=skyciv-utils/utils.md)

## Getting Started

To get started initialize a new form by calling ```new QUICK_FORM({ options }); ```

```	
let form = new QUICK_FORM({
	input_json: input_json,
	html_container: "#configurator",
	mode: "table",
	runCallback: null,
	changeCallback: null,
	setInputCallback: null
});
```

A ```QUICK_FORM``` can be initialize with all the following options:

| Option               | Description                                                                                           							 |
|----------------------|---------------------------------------------------------------------------------------------------------------------------------|
| input_json           | The input JSON object containing the configuration data for the form. See the input_json section      							 |
| html_container       | The HTML container element (identified by its ID) where the form will be rendered.                    							 |
| mode                 | The mode in which the form will be displayed. Possible values are "table" || "none".                  							 |
| runCallback          | Callback function executed when the form is submitted by the user pressing the enter/return key.  								 |
| changeCallback       | Callback function executed when an input on the form is changed by the user.                     							     |
| setInputCallback     | Callback function executed getInput() is run on the form.                                        							     |
| load_url_inputs      | Allow the QUICK_FORM to load input values from url parameters. Default `false`. Note: Does not work if input_json uses a table. |
| update_url_inputs    | Append the values of inputs when changed to url parameters. Default `false`. Note: Does not work if input_json uses a table.    |

## Input JSON

The input json must have a ```"input_variables"``` key.

#### Sample

```js
let input_json = {
	"meta": {},
	"input_variables": {
		"a": {
			"type": "number",
			"label": "Side A",
			"units": "m",
			"default": 4,
			"min": 0,
			"max": 1000
		},
		"b": {
			"type": "number",
			"label": "Side B",
			"units": "m",
			"default": 3,
			"min": 0,
			"max": 1000,
			"nullable": true
		},
		"table": {
			"type": "table",
			"label": "My Table",
			"table": {
				'version': 2,
				'selector': '#my-entry-table', 
				'columns': [
					{
						"id": "number1",
						"title": "Number of Things",
						"tooltip": "Example tooltip",
						"default_value": 1.5,
						"minimum": 0,
						"exclusive_minimum": true,
						"type": "integer",
						"cell_type": "input_text",
						"cell_width": "auto",
						"disabled": false
					}
				]
			}
		}
	}
};
```

#### Available Form Types

For a full list of supported form types please see this [page](https://skyciv.com/api/v3/docs/quick-design-config).

## Available Methods

#### initForm()

Initializes the form with the provided ```input_json```. The form is auto-initialized when you proved an options json when call ```new QUICK_FORMS```.  

#### refreshForm()

Refreshes the form for any dynamic changes that need to be made. 

#### setInput(input_json)

Sets the input (updates the value of the inputs) for the form.

#### getInput()

Gets the input of the form and returns it a JSON object. 

#### updateDropdownValues(key, new_values)

Updates the list of values available in the dropdown

##### Example

```js
let new_values = [{ "name": "item", "value": "item" }, { "name": "item", "value": "item" }];
let key = "dropdown";
my_config.updateDropdownValues(key, v);
```

#### getConfig()

Returns the config JSON object. 

##### Example

```js
let config_json = my_config.getConfig();
```

#### getConfigKey(key)

Returns the config JSON object of a single `input_variables` key. 

##### Example

```js
let config_key_json = my_config.getConfigKey(key);
```

#### setInputState()

Disable/Enable a certain input row based the key of that row

##### Example

```js
// Disable key
my_config.setInputState('my_key', 'disabled');

// Enabled key
my_config.setInputState('my_key', 'enabled');
```

#### hasInputKey(key)

Check if the config JSON has an input key. Returns a boolean (`true`/`false`).

#### setInputKeyValue(key, value)

Adjust the value of a input based on a key.

##### Example

```js
my_config.setInputKeyValue('my_key', 2);
```

#### refreshAccordions()

Manually update the accordion dropdowns.

#### getFullInputURL()

Includes a current input parameters in the URL to create a shareable link. 

##### Example

```js
let shareable_url = my_config.getFullInputURL();
```

## Maintenance  

The Quick Forms package is maintained by `jake.roeleven@skyciv.com`.