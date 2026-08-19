# SkyCiv Utils Functions

## General Functions

#### SKYCIV_UTILS.copy(obj, faster_method)

Function to deep clone an object to avoid pointers

* `obj` <[Object]> object/array to copy to avoid pointers
* `faster_method` <[Boolean]> Use the faster method (Recommended to copy large objects)
* returns: <[Object]> copied object

#### SKYCIV_UTILS.isObjEmpty(obj)
* `obj` <[Object]> object (not array) to check if empty
* returns: <[boolean]> true if the object is empty ({})

#### SKYCIV_UTILS.isArrEmpty(arr)
* `arr` <[Array]> array to check if empty
* returns: <[boolean]> true if the array is empty ([])

#### SKYCIV_UTILS.objLength(obj)
* `obj` <[Array]> object (not array) to get the length of
* returns: <[number]> length of object (number of keys)

#### SKYCIV_UTILS.trueLength(arr)
* `arr` <[Array]> array to get the true length of
* returns: <[number]> length of the object, not including any null values in the array

#### SKYCIV_UTILS.isInt(num)
* `num` <[number]> number to check
* returns: <[boolean]> true if the number is an integer

#### SKYCIV_UTILS.getCleanIDs(arr)
* `arr` <[number]> array of IDs
* returns: <[string]> string of IDs (comma-separated and hyphen-separated for ranges)

#### SKYCIV_UTILS.replaceAll(str, find, replace)
* `str` <[string]> entire string we are searching
* `find` <[string]> what are we replacing in `str`?
* `replace` <[string]> what are we replacing `find` with in `str`?
* returns: <[string]> result string after replacements of `find` with `replace`

#### SKYCIV_UTILS.generateToken(len)
* `len` <[number]> number of characters in random token
* returns: <[string]> random string of alpha-numeric characters (a-z, A-Z, 1-9) useful for things like job ID

#### SKYCIV_UTILS.tableToCSV(table_id, file_name, auto_download, ignore_cols, separator)
* `table_id` - pass in html identifier, e.g. "#table-id", ".some-class-of-table"
* `file_name` - File name string
* `auto_download` - Boolean, false will return the csv data
* `ignore_cols` - array, ignores these columns. Index starts from 1, so if you want to ignore first column ignore_cols = [1]
* `separator` - Define the CSV separator to be used, defaults to ","

``` SKYCIV_UTILS.tableToCSV(".dc-member-design-ratios .table", des_code + " Design Results", true); ```

#### SKYCIV_UTILS.isMac()
* Returns a boolean of true/false if the device being used is a Mac

Example:
```js
	SKYCIV_UTILS.loading.show({ msg: "Combining PDF Reports..." });

	//do some stuff

	SKYCIV_UTILS.loading.hide();
```

## Clipboard Functions

#### SKYCIV_UTILS.copyTextToClipboard(str)
* `str` - String to be copied to the clipboard
Safe way to ensure string data is copied to user clipboards across multiple browser types. 

#### SKYCIV_UTILS.tableToClipboard(table_selector)
* `table_selector` - pass in html identifier, e.g. "#table-id", ".some-class-of-table"
Allows you to copy tables to clipboard so that users can then paste this data directly into spreadsheets like excel.

#### SKYCIV_UTILS.imageToClipboard(selector, callback)
* `selector` - pass in html identifier, e.g. "#img-id", ".some-class-of-img"
Allows you to copy images and div's (as images) to clipboard so that users can then paste this data directly into programs like word.
Note: ensure you have html2Canvas on the page to use this function.


## Reporting Functions

#### SKYCIV_UTILS.report.init(is_visible)
* `is_visible` - show preview popup?
SKYCIV_UTILS.report.init(false);

#### SKYCIV_UTILS.report.addHTML(html_content);
* `html_content` - string of HTML content to include in report

#### SKYCIV_UTILS.report.addObject(jquery_object);
Includes the contents of a jquery object
* `jquery_object` - the jquery object. e.g. jQuery("#some-div")

#### SKYCIV_UTILS.report.build(opts, callback)
Call this after you have initialised and included some content

#### Example
```js
		SKYCIV_UTILS.report.build({
		"name": "SkyCiv Wind Design Report",
	}, function (report_doc) {

		// If local we need some extra scripts for CSS
		if (SKYCIV_UTILS.getDevToken() != "") {
			report_doc.find("head").append(`
			<link href="https://dev.skyciv.com/assets/res/semantic/semantic.min.css" rel="stylesheet" type="text/css">
			<link href="https://dev.skyciv.com/assets/css/design/wind.css" rel="stylesheet" type="text/css">
			`);
		}

		report_doc.find('img').each(function () {//replaces images if lost
			var src = jQuery(this).attr('src');

			if (document.domain == "skyciv.test") { // local
				if (src.indexOf('/storage/') == 0) {
					jQuery(this).attr('src', SKYCIV_UTILS.replaceAll(src, '/storage/', 'https://dev.skyciv.com/storage/'));
				}
			} else if (SKYCIV_UTILS.getDevToken() != "") {
				if (src.indexOf('./figures/') == 0) { // local
					jQuery(this).attr('src', SKYCIV_UTILS.replaceAll(src, './figures/', 'https://dev.skyciv.com/storage/images/design/wind/'));
				}
			} else { // production (any relative links need to be made absolute)
				if (src.indexOf('/storage/') == 0) {
					jQuery(this).attr('src', SKYCIV_UTILS.replaceAll(src, '/storage/', window.location.origin + '/storage/'));
				}
			}
		});
	});
```
