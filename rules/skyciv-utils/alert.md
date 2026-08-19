# SkyCiv Utils Alerts

SkyCiv Utils contains multiple alert/modal options. Documentation of each method can be found below the table. 

## Installing

First, you'll need to install the SKYCIV_UTILS Javascript and CSS files in your solution. Note, for security reasons these may only work on dev and platform domains:

```html
<script src="https://dev.skyciv.com/assets/js/skyciv_utils.js "></script>
```
The above is needed for all alerts and any other SKYCIV_UTILS functions to work correctly.

**Options**

| Function | Purpose |
|--|--|
| `SKYCIV_UTILS.alert(args)` | Standard "blocking" UI alert.  |
| `SKYCIV_UTILS.alert.sideNotify(args)` | "Non-blocking" UI alert that appears in the top left corner and hides itself if not clicked.  |
| `SKYCIV_UTILS.alert.contact(args)` | Creates a contact prompt with a feedback box that sends data to Intercom when completed. |
| `SKYCIV_UTILS.alert.feedback(args)` | Creates a feedback prompt with a star rating system and feedback box that sends data to Intercom when completed. |
| `SKYCIV_UTILS.messagePrompt(args)` | Show a message prompt. A floating version of the [Semantic UI message](https://semantic-ui.com/collections/message.html).  |
| `SKYCIV_UTILS.upgradePrompt(args)` | Show an upgrade prompt with checkout link. Useful when restricting features and access for free/student/professional users. |
| `SKYCIV_UTILS.alert.closeAll()` | Closes all the current open alerts/modals on the page.  |

## `SKYCIV_UTILS.alert(args)`

Standard "blocking" UI alert. Best used when you require a user to acknowledge or accept a message. Use for critical errors and warnings that shouldn't be ignored.

**Example**

```
SKYCIV_UTILS.alert({
	title: 'Unsaved Changes',
	content: 'Unsaved changes detected. Are you sure you want to exit?',
	showClose: false,
	buttons: {
		'Exit': function() { console.log("Exit button hit"); },
		'Save ': function() { console.log("Save button hit"); },
	},
});
```
**Arguments**

| Option | Accepts | Notes |
|--|--|--|
| title | `string`  ||
| content | `string` | HTML tags such as `<br>` accepted |
| id | `string` | The HTML id of the modal |
| buttons | `Object` | Key as button name, function as button callback |
| showClose |`Boolean` | Show a "Close" button with rest of modal buttons |
| closeName |`string` | Name of the "Close" button. e.g. "Exit" |
| hideX |`Boolean` | Show the "x" option at the top right of alert |
| hideTitleLogo |`Boolean` | Show/Hide the SkyCiv logo in the top left |
| hideTitle |`Boolean` | Show/Hide the modal title |
| resizable |`Boolean` | Allow the modal to be resizable |
| draggable |`Boolean` | Allow the modal to be draggable |
| helpFunction |`Function` | Adds a ? icon to the top left. Can be used to open documentation on callback  |
| openFunction |`Function` | Called when the alert is opened |
| closeFunction |`Function` | Called when the alert is closed |

## `SKYCIV_UTILS.alert.sideNotify(args)`

"Non-blocking" UI alert that appears in the top left corner and hides itself if not clicked. Use for non-critical errors and warnings that shouldn't block the user from completing further actions.

**Example**

```
SKYCIV_UTILS.alert.sideNotify({
	   title: "Some Area Loads are Invalid",
	   theme: "error",
	   icon: true,
	   content: '<p>Some area loads have become invalid.</p>',
	   width: 600,
	   auto_hide: false,
	   onClick: function() {
	       console.log("Clicked");
	   }
});
```

**Arguments**

| Option | Accepts | Notes |
|--|--|--|
| title | `string`  ||
| content | `string` | HTML tags such as `<br>` accepted |
| top, bottom, left, right | `Integer` | CSS positioning of the notification |
| auto_hide | `Boolean` | Should the modal hide itself automatically |
| hide_on_click | `Boolean` | Set to `true` to prevent the notification from closing when clicked |
| time | `Integer` | The milliseconds before auto hide takes place |
| theme | `string` | Choose from: dark, light, error, success, warning | 
| icon | `Boolean` | Use true/false, or alternatively the string of specific semantic icon `angle right icon`| 
| onHide |`Function` | Called when alert hides itself  |
| onClick |`Function` | Called when the alert is clicked |
| onOpen |`Function` | Called when the alert is opened |

**Closing**

The following will close an alert before it autohides or if autohide is false. 

```js
$alert =  SKYCIV_UTILS.alert.sideNotify(....)
$alert.close();
```

## `SKYCIV_UTILS.alert.contact(args)`

A general SkyCiv Contact alert. This sends a message to intercom when submitted. 

**Example**

```
SKYCIV_UTILS.alert.contact({
	title:  'Feedback',
	fields: {
		Subject:  'Load Combination Feedback',
	},
});
```

**Arguments**

| Option | Accepts | Notes |
|--|--|--|
| title | `string`  | The title of the contact form |
| faq | `Boolean`  | Show "Checkout our FAQ" message |
| fields | `Object`  | Key/Value pairs. Key is field title, value is default field message  |
| prompt_screenshot| `Boolean`  | Prompt the user to send a screenshot of the current screen |
| prompt_filesend | `Boolean`  | Prompt the user to send a screenshot of the current screen |
| hide_message_field| `Boolean`  | Hide the message field |

## `SKYCIV_UTILS.alert.feedback(args)`

Use to collect feedback about a product. Will send results to intercom. Only shows once per browser, per user. If testing you will need to clear you browser  `localStorage` to view it again. 

**Example**
```
SKYCIV_UTILS.alert.feedback({ 
	product:  "SkyCiv Beam V3", 
	specific_question:  "What can we do to improve SkyCiv Beam?" 
});
```

**Arguments**

| Option | Accepts | Notes |
|--|--|--|
| product | `string`  | The name of the current product e.g. "Base Plate" |
| additional_html | `string`  | Additonal HTML placed before the rating form |
| specific_question | `string`  | Specific question to ask for feedback |
| check_previous_feedback | `Boolean`  | Check the users `localstorage` for previous feedback  |
| required_comment | `Boolean`  | Is a comment required to submit feedback |

## `SKYCIV_UTILS.messagePrompt(args)`

Show a message prompt. A floating version of the [Semantic UI message](https://semantic-ui.com/collections/message.html). ***Please note this style UI is not widely used on the platform anymore `SKYCIV_UTILS.alert.sideNotify()` is preferred.*** 

**Example**

```
SKYCIV_UTILS.messagePrompt({
	"header":  "Congratulations!",
	"content":  "You've successfully completed the task",
	"status":  "positive"
});
```

**Arguments**

| Option | Accepts | Notes |
|--|--|--|
| header| `string`  | Header text |
| content| `string`  | Content text (HTML accepted) |
| status | `string`  | Options: warning, error, info, positive |
| timeout_time | `string`  |The  milliseconds till the alert disappears |
| is_mobile | `Boolean`  | Is prompt for mobile app |

## `SKYCIV_UTILS.upgradePrompt(args)`

Show an upgrade prompt with a checkout link. Useful when restricting features and access for free/student/professional users.

**Example**

```
SKYCIV_UTILS.upgradePrompt({ 
	id:  'beam' 
});
```

**Arguments**

| Option | Accepts | Notes |
|--|--|--|
| id | `string`  | Id of the upgrade prompt. Please ask to add an option for specific software. It is possible to override with the below options but ***it is preferable to create a specific id by reaching out to platform developers.*** |
| title | `string`  | Title of the upgrade prompt |
| img_url | `string`  | URL of the upgrade prompt image |
| description | `string`  | Description of the upgrade prompt |
| heading_main | `string`  | Main heading of the upgrade prompt |

## `SKYCIV_UTILS.alert.closeAll()`

Hides all current message prompts.

## `SKYCIV_UTILS.logger.add(args)`

Logs a message to the SkyCiv logger. It is useful for having a history of software messages/alerts for the user to review later.

By default, messages sent to the user via `SKYCIV_UTILS.alert.sideNotify()` are added to the log.

Alert messages sent via `SKYCIV_UTILS.alert()` can also be added to the log, by setting to `true` the `add_to_log` key. By default, it is false, so the message won't be added to the log unless the `add_to_log` key is passed.

**Examples**
```
// Add a message to the log
SKYCIV_UTILS.logger.add("Add some custom message to the log")

// Side notify the user -- Automatically added to the log
SKYCIV_UTILS.alert.sideNotify("Solved successfully")

// Send an alert to the user and log the message
SKYCIV_UTILS.alert({
    title: "No worries",
    content: "THIS IS FROM AN ALERT",
    add_to_log: true
})

```
## `SKYCIV_UTILS.logger.open()`

Opens the SkyCiv log to show all the messages added there up to that moment.

<script>

	SKYCIV_UTILS.alert.sideNotify({ title: "Quick Notifications!",theme: 'dark', content: 'These are really helpful and cool to display quick pieces of information!' });

</script>