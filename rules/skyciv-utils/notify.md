# SkyCiv Utils - Dev Notify

The `notifyDev` function has been developed to help 

## Function `SKYCIV_UTILS.notifyDev(args)`

### Example

```js
SKYCIV_UTILS.notifyDev({
	subject: "Beam Unable to Solve",
    email: "jake.roeleven@skyciv.com", // USE YOUR OWN
	product: "SkyCiv Beam",
    data: SKYCIV_BEAM.data,
    slack_code: 'U01011P30GP' // USE YOUR OWN
});
```

### Args

| Name            | Required      | Data Type   | Description                                       |
| --------------- | ------------- | ----------- | ------------------------------------------------- |
| subject    	  | No            | String      | Subject of the notification (default: "SkyCiv - Bug Report"). |
| email      	  | No            | String      | Email address (default: "support@skyciv.com").     |
| data      	  | No            | Any         | File data; content to be included in the notification. |
| product   	  | No            | String      | Product name (default: "SkyCiv" or CURRENT_SOFTWARE if defined). |
| slack_code 	  | Conditional   | String      | Slack channel code for notification on Slack (optional). |

## Getting Your Slack Code

- Navigate to your Slack User Profile (Bottom Left)
- Click on Your Profile and Select Preferences
- On the Profile Panel on the Right Side Click the Three Vertical Dots
- Click Copy Member ID

![Slack ID](?file_real=images/notify/notify.png)

## Adding Dev Error Reporter to Slack

You may need to add the 'Dev Error Reporter' to Slack. To do this follow these steps. 

- Visit this page: https://api.slack.com/apps/A06BNQF7D18
- In "Basic Information" -> "Install your app". Click Install to Workspace
- Follow the prompts and choose your name from the dropdown list. 