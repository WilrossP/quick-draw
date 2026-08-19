# Entry Tables

## Installing

First, you'll need to install the Entry Tables Javascript and CSS files in your solution. Note, for security reasons these may only work on dev and platform domains:

```html
<script src="https://dev.skyciv.com/assets/res/entry-table/entry-table-c4gLQ5B4xGNcLcvu.min.js"></script>
<link rel="stylesheet" type="text/css" href="https://dev.skyciv.com/assets/res/entry-table/entry-table.css">
```

## Initialize a table

Create an empty table in your HTML view and give it an ID:
```html
<table id="my-entry-table"></table>
```

Then initialize the table in JS:

```js
jQuery(document).ready(function() {
	var table = new ENTRY_TABLE({
		'version': 3,
		'selector': '#my-entry-table', // target the table DOM element
		'onDelete': function(row_index) { ... }, // specify what to do when a row is deleted
		'columns': [ {...}, {...}, ... ]
	});
});
```

#### Versions

- Version 1: Version 1 never seemed to call the change event of text-based field
- Version 2: Version 2 overcame issue from v1 but might make the change events run too often. 
- Version 3:
	- Resolved a wrong index issue with setDropdownOptions and pulsateRow. 
	- Added the option for selectable dropdowns to be dragged the same way as they would in google sheets (must be >= v3 and have selectable as true)

Possible options are:

| Option                              | Type       | Description                                              | Default Value   |
|-------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `version`                           | [integer]  | Set version 1,2 or 3 | 1 	    |
| `selector`                          | [string]   | HTML selector of the table DOM element (e.g. '#my-entry-table').																										 | - 		|
| `onDelete`                          | [function] | Function called when a row is deleted.																																	 | - 		|
| `selectable`                        | [boolean]  | Enable selectable cells (like MS Excel). For selectable and draggable dropdowns must use version 3 or greater.		     | - 	|
| `copy_paste`                        | [boolean]  | Enable copy/paste functionality with MS Excel. If this is set to true, then the table will be forced to be selectable. 												 | - 		|
| `onPaste`                           | [function] | Function called when cells are pasted.																																	 | - 		|
| `keep_selections_on_external_click` | [boolean]  | Click out of table area will keep selections when the selectable property is used.																						 | - 		|
| `auto_new_row_on_enter_key`         | [boolean]  | Enable the Enter key to create a new row when pressed on the last row at the end of the table.																			 | - 		|
| `columns`                           | [Object]   | As specified below.																																					 | - 		|
| `alignment`                         | [string]   | General alignment of cells (`left`, `right`, `middle`).																												 | `middle` |	
| `sticky_headers`                    | [boolean]  | Sticky headers (i.e. when scrolling, are the headers fixed and always visible).																						 | - 		|
| `auto_update`                       | [boolean]  | [FormView Only] Updates data automatically on change action (otherwise a submit button will show).																	 	 | - 		|
| `two_rows`                          | [boolean]  | [FormView Only] Splits the form into two rows for better UX.																											 | - 		|
| `auto_validate`                     | [boolean]  | [FormView Only] Automatically runs validation checks on user input in real-time.																						 | - 		|
| `right_click_menu`                  | [boolean]  | Adds a right-click menu to the tbody for adding/deleting rows.																											 | - 		|
| `pagination`                        | [integer]  | Number of rows per page you want to be visible at one time (25, 50, 100, 250, 500, 750, 1000).																			 | - 		|


## Types of Columns

The columns key expects an array of objects: ```[ {...}, {...}, ... ]```

The columns object specifies the cell for each column in the row:

| Option                              | Type       | Description                                             																																											 | Default Value   |
|-------------------------------------|------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| `id`                                | [string]   | An ID for the column.																																																		         | - 			   |
| `use_id_as_row_key`                 | [boolean]  | (optional) When getting the data from the table, should each row use this column ID as its key? If no columns use this option, then the data will be an array instead of an object. Only one column can have this property as true. | - 			   |
| `auto_increment_id`                 | [boolean]  | (optional) Use this column as an ID column that auto-increments based on the last row ID.																																			 | - 			   |
| `title`                             | [string]   | The title for the column which is shown in the table header.																																										 | - 			   |
| `tooltip`                           | [string]   | Optional tooltip to display in the table header .                        																																							 | - 			   |
| `default_value`                     | [string]   | Optional default value for the cell.																																																 | - 			   |
| `type`                              | [string]   | Type of data for the cell (`string`, `number`, `integer`, `action`).																																								 | - 			   |
| `cell_type`                         | [string]   | How is the input taken? (`dropdown`, `input_text`, `text`, `static_html`, `checkbox`).																																				 | - 			   |
| `cell_width`                        | [string]   | Number of pixels or `auto`.																																																		 | - 			   |
| `cell_dropdown_values`              | [Array]    | Dropdown values to use for each dropdown option when `cell_type=dropdown`.                                                                      																					 | - 			   |
| `cell_dropdown_labels`              | [Array]    | Dropdown labels to use for each dropdown option when `cell_type=dropdown`. 																																						 | - 			   |
| `disabled`                          | [boolean]  | Can the user edit it?																																																				 | true			   |
| `onChange`                          | [function] | Change event to run when the cell is changed.																																														 | true			   |
| `onClick`                           | [function] | Click event for type == 'action'.																																																	 | - 			   |
| `onFocus`                           | [function] | Focus event to run when the cell INPUT field is focused (clicked into).																																							 | - 			   |
| `onCellFocus`                       | [function] | Cell focus event to run when the cell is focused (clicked into) for when an Excel-like table is used.																																 | - 			   |
| `bindings`                          | [function] | Used for `cell_type=static_html`. This function can be used to bind events to HTML (e.g., buttons).  																																 | - 			   |
| `nullable`                          | [boolean]  | Can it be left empty by the user (used for validation). 																																											 | - 			   |
| `minimum`                           | [number]   | Minimum value of number/integer type cell (used for validation).																																									 | - 			   |
| `maximum`                           | [number]   | Maximum value of number/integer type cell (used for validation).																																									 | - 			   |
| `exclusive_minimum`                 | [boolean]  | Is the minimum exclusive? i.e., less than and not less than or equal to (used for validation).																																		 | - 			   |
| `exclusive_maximum`                 | [boolean]  | Is the maximum exclusive? i.e., greater than and not greater than or equal to (used for validation).																																 | - 			   |
| `exclude_value`                     | [string]   | For dropdowns, define which value in a dropdown is considered a 'null' entry. For instance, if you want to consider the dropdown option "Please Select" as null, use `exclude_value: "Please Select"`. 							 | - 			   |
| `alignment`                         | [string]   | General alignment of cells in this column (`left`, `right`, `middle`																																								 | - 			   |
| `filterable`                        | [boolean]  | Allows the column to be filtered allows the column to be filtered (`true`/`false`)																																					 | false		   |

## A Column for Deleting the Row

Add a column with these properties:
```js
{
	"id": "delete",
	"title": "Delete",
	"default_value": '<div class="row-delete-btn"><i class="icon large red delete link"></i></div>',
	"cell_type": "text",
	"cell_width": 70,
}
```

## Methods

The methods are called on whatever the init (`new ENTRY_TABLE()`) returned. So you should store the table in a variable. We will call this variable `table`.

NOTE: If we refer to row index, remember that row indices **always start at 0**.

#### table.getTable()
* returns: <[jQueryObject]> the HTML table in jQuery

#### table.getSettings()
* returns: <[Object]> the original settings used to init the entry table

#### table.reset(no_new_row)
* `no_new_row` <[boolean]> create a new row after the table is cleared (true: no new row is created)
* returns: null

Clears the table body and all data

#### table.refresh()
* returns: null

Refreshes the render of the table (gets data in table and sets it again)

#### table.isEmpty()
* returns: <[boolean]> true: table is empty, false: table is not empty

#### table.getNumberOfRows()
* returns: <[number]> number of rows contained in the table body

#### table.getNumberOfCols()
* returns: <[number]> number of columns contained in the table body

### Add and delete rows

#### table.deleteRow(row_index)
* `row_index` <[number]> index of row to delete
* returns: null

#### table.addEmptyRow()
* returns: <[jQueryObject]> the newly added row

#### table.addRow(data, do_not_run_change_event)
* `data` <[Object]> data object of the new row data (key-value pairs where keys are the IDs of the columns)
* `do_not_run_change_event` <[boolean]> run change events when cell values are set (true: skip change events)
* returns: <[jQueryObject]> the newly added row

### Get and Set Data

#### table.getData(keyed)
* `keyed` <[boolean]> return each row as Object (true) or Arrays (false)
* returns: <[Array]> data of the table

#### table.setData(data, keyed, do_not_run_change_event)
* `data` <[Array]> data of the table
* `keyed` <[boolean]> is each row data an Object (true) or Arrays (false)
* `do_not_run_change_event` <[boolean]> run change events when cell values are set (true: skip change events)
* returns: null

#### table.getRowData(row_index, keyed)
* `row_index` <[number]> index of row to get
* `keyed` <[boolean]> return row data as Object (true) or Arrays (false)
* returns: <[Object]|[Array]> data of the row

#### table.setRowData(row_index, data, do_not_run_change_event)
* `row_index` <[number]> index of row to set
* `data` <[Object]|[Array]> data of the row (can be keyed or not)
* `do_not_run_change_event` <[boolean]> run change events when cell values are set (true: skip change events)
* returns: null

#### table.setRowDataWithRow(row, data, do_not_run_change_event)
* `row` <[jQueryObject]> row as jQuery object
* `data` <[Object]|[Array]> data of the row (can be keyed or not)
* `do_not_run_change_event` <[boolean]> run change events when cell values are set (true: skip change events)
* returns: null

#### table.getCellValue(row_index, col_index)
* `row_index` <[number]> index of row to get
* `col_index` <[number]> index of col to get
* returns: <[string]|[number]|[boolean]> value of cell

#### table.setCellValue(row_index, col_index, val, do_not_run_change_event)
* `row_index` <[number]> index of row of cell to set
* `col_index` <[number]> index of col of cell to set
* `val` <[string]|[number]|[boolean]> value of cell
* `do_not_run_change_event` <[boolean]> run change events when cell values are set (true: skip change events)
* returns: null

#### table.setCellValueWithRowAndKey(row, col_key, val, do_not_run_change_event)
* `row` <[jQueryObject]> row as jQuery object
* `col_key` <[string]> key of column
* `val` <[string]|[number]|[boolean]> value of cell
* `do_not_run_change_event` <[boolean]> run change events when cell values are set (true: skip change events)
* returns: null

#### table.setCellDropdownOptions(col_index, option_values, option_labels)
* `col_index` <[number]> column index
* `option_values` <[array]> array of values for dropdown
* `option_labels` <[array]> array of labels to be displayed in the dropdown
* `row_index` <[number]> (Optional) row index
* returns: null

#### table.setCellState(row_index, col_index, state)
* `row_index` <[number]> index of row of cell to set
* `col_index` <[number]> index of col of cell to set
* `state` <[string]> state to set the cell (`"focus", "disabled", "enabled"`)
* returns: null

#### table.getCell(row_index, col_index)
* `row_index` <[number]> index of row of cell
* `col_index` <[number]> index of col of cell
* returns: <[jQueryObject]> jQuery object of table cell

#### table.getColumnIndexFromKey(col_key)
* `col_key` <[string]> key of column
* returns: <[number]> column index of that column key

#### table.highlightRow(row_index, color)
* `row_index` <[number]> index of row to highlight
* `color` <[string]> (optional) hex code of color to use for highlight (e.g. '#289dcc')
* returns: <[jQueryObject]> jQuery object of table row

#### table.removeRowHighlight(row_index, remove_cell_highlights_too)
* `row_index` <[number]> (optional) index of row to remove the highlight. If this is not provided then every row's highlight is removed.
* `remove_cell_highlights_too` <[boolean]> remove the highlights of any individual cells
* returns: null

#### table.highlightCell(row_index, col_index, color)
* `row_index` <[number]> index of cell's row to highlight
* `col_index` <[number]> index of cell's column to highlight
* `color` <[string]> (optional) hex code of color to use for highlight (e.g. '#289dcc')
* returns: <[jQueryObject]> jQuery object of table cell

#### table.removeCellHighlight(row_index, col_index)
* `row_index` <[number]> index of cell's row to highlight
* `col_index` <[number]> index of cell's column to highlight
* returns: <[jQueryObject]> jQuery object of table cell

#### table.selectCells(row_index_start, col_index_start, row_index_end, col_index_end)
* `row_index_start` <[number]> top-left cell row index
* `col_index_start` <[number]> top-left cell column index
* `row_index_end` <[number]> bottom-right cell row index
* `col_index_end` <[number]> bottom-right cell column index
* returns: null

#### table.deselectAllCells()
* returns: null

#### table.setMode(mode_type)
* `mode_type` <[string]> "table" or "form" to toggle formview or table
* returns: null

#### table.pulsateRow(row_id)
* `row_id` <[number]> The row index you want to animate a color/pulsating effect to
* returns: null

### Validation

#### table.checkValid(do_not_highlight_errors)
* `do_not_highlight_errors` <[boolean]> highlight cells to red color if there's an issue (true: skip error highlight)
* returns: <[Array]> array of error messages

## Examples

```js
// Check if table is empty
var is_empty = table.isEmpty();

// Add new row with data (keyed)
table.addRow({
	member_id: 10,
	name: "test",
	length: 5,
}, true); // true = skip change events, false = run change events

// Add new row with data (array)
table.addRow([10, "test", 5], true); // true = skip change events, false = run change events

// Change existing row data (row index = 2)
table.setRowData(2, {
	member_id: 10,
	name: "test",
	length: 5,
}, true); // true = skip change events, false = run change events

// Change existing row data with array (row index = 2)
table.setRowData(2, [10, "test", 5], true); // true = skip change events, false = run change events

// Get row data using either the $row or the row index
table.getRowData(10, true); // true = keyed object, false = array
table.getRowDataWithRow($row, true); // true = keyed object, false = array

// Get data of the last row
var n_rows = table.getNumberOfRows;
var last_row_index = n_rows-1;
table.getRowData(last_row_index, true); // true = keyed object, false = array
```

## LIVE SAMPLES:

- https://dev.skyciv.com/assets/res/entry-table/example/1/index.html
- https://dev.skyciv.com/assets/res/entry-table/example/2/index.html
- https://dev.skyciv.com/assets/res/entry-table/example/3/index.html

[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[Buffer]: https://nodejs.org/api/buffer.html#buffer_class_buffer "Buffer"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[integer]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[Promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise "Promise"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
[jQueryObject]: http://api.jquery.com/jquery/ "jQueryObject"