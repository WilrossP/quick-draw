# SkyCiv Events - `SKYCIV_UTILS.event(args)`
SkyCiv Events can be used for tracking software events in the SkyCiv Database and Google Analytics. Events are useful for tracking user interaction with the software to help determine which features, modules are receiving quality usage and helping to prioritize features and requirements for further development. 

**Note**
Please only record core software events in the SkyCiv Database to avoid unnecessarily filling up the database. This includes things life successful solves, the user opening the software and other core software features.

## Options
| Option  | Accepts | Notes |
|--|--|--|
| software | `string`  | Name of the software where the event occurred |
| action | `string`  | Action the event is recording e.g. 'Solve Successful' |
| label | `string`  | Label for the event |
| value | `string`  | Value of the event |
| exclude | `array`  | Options 'ga' (Google Analytics), 'db' (SkyCiv Database). Will not record this event in this database. |
| callback | `function`  | Callback function option once event recorded |
## Examples

***Simple Event Stored in Database + Google Analytics***
```
SKYCIV_UTILS.event({
	software:  calc_name,
	action:  "Solve Successful",
});
```

***Simple Event with Label Stored in Database + Google Analytics***
```
SKYCIV_UTILS.event({
	"software":  calc_name,
	"action":  "Open Member Design",
	"label":  module_code,
});
```

***Simple Event with Label Only Sent to Google Analytics***
```
SKYCIV_UTILS.event({
	software:  calc_name,
	action:  'Drag Complete',
	label:  object_to_drag.skyciv_name,
	exclude: ['db']
});
```
