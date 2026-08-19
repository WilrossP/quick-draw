# SkyCiv Load Combination Helper

The SkyCiv Load Combination Helper allows you to fetch load combinations from the server to avoid having to manually update and test these combinations. 
This ensures that the load combinations for each design code used in the platform are consistent and accurate across all software modules and have a single source of truth.

## Installation

Please add this script to the `<head>` of your html page.

```
<!-- LOAD COMBINATION HELPER -->
<script src="https://dev.skyciv.com/assets/js/load-combinations-helper-c4gLQ5B4xGNcLcvu.min.js"></script>
```

### Currently Supported Codes

The load combination helper currently supports the following codes:

* AS/NZS 1170.0:2002
* NBCC 2010
* NBCC 2015
* EN 1990:2002
* IS 875
* ASCE 7-16 ASD
* ASCE 7-16 LRFD
* ASCE 7-10 ASD
* ASCE 7-10 LRFD
* ACI318 2011

### Example 1: No UI just return load combinations on callback

***NOTE***:
This option only takes 1 code in the first argument.

```
LOAD_COMBINATIONS_HELPER.generate("EN 1990:2002", function (data) {
    console.log(data);
});
```

### Example 2: Via UI with callback

***NOTE***:
This option can take multiple options as an array in the first argument.
Alternatively pass in `null` as the first option to return all options.

```
LOAD_COMBINATIONS_HELPER.openUI(["EN 1990:2002"], function(data) {
    console.log(data);
});
```