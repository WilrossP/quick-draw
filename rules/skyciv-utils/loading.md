# Loading Spinner

A SkyCiv Style loading spinner like used in S3D. Useful while waiting for software to compute items and create reports ect. 

## Functions

| Function  | Notes |
|--|--|
| `SKYCIV_UTILS.loading.show(options, callback);` | Shows the loading spinner. For options see below. |
| `SKYCIV_UTILS.loading.hide();` | Hides the loading spinner. |


## Options
| Option  | Accepts | Notes |
|--|--|--|
| msg | `string`  | Message to show on the loading spinner |
| hide_spinner| `Boolean`  | Hide the loading spinner. Default `false` |
| no_esc| `Boolean`  | Allow user to press escape to hide spinner. Default `false` |
| dont_show_tip| `Boolean`  | Hide the tips/hints html. Default `false` |
| for_mobile | `Boolean`  | Set tghe loading spinner to 80vw for use with mobile applications. Default `false` |

## Example

```
SKYCIV_UTILS.loading.show({ msg:  "Loading" });
```