# Pretty Print

SkyCiv Pretty Print is a library for formatting and printing `float` based decimal numbers to exact decimal points or using and exponential format. 

## Configuration

**Configuration Options**

| Key | Options | Default |
|--|--|--|
| precision | `integer` | 3 |
| method | "fixed" or "exponential" | "fixed" |

**Configuration Example**

```js
SKYCIV_UTILS.pretty_print.precision = 4
SKYCIV_UTILS.pretty_print.method = "exponential"
```

## SKYCIV_UTILS.pretty_print.print(value, options)

# Examples

**Simple**

```js
SKYCIV_UTILS.pretty_print.print(3.92314); => '3.923'
```

**Set Precision while Printing**

```js
SKYCIV_UTILS.pretty_print.print(3.92314, {
    "precision": 1,
}); 

=> '3.9'
```

**With Trailing Zeros**

```js
SKYCIV_UTILS.pretty_print.print(3.9, {
    "precision": 5,
    "trailing_zeros": true
});

=> '3.90000'
```

**With Exponential Notation**

```js
SKYCIV_UTILS.pretty_print.print(0.00006, {
    "method": "exponential",
    "auto_exp": true
})

=> '6.00000e-5'
```

## SKYCIV_UTILS.pretty_print.numberWithCommas(value)

**Examples**

```js
SKYCIV_UTILS.pretty_print.numberWithCommas(1000) => 1,000
```

## SKYCIV_UTILS.pretty_print.engineeringPrint(value, options) 

**Examples**

```js
PrettyPrint.pretty_print.print(50000) => '50e3';

PrettyPrint.pretty_print.print(50000, {
    "digits_after_decimal": 2
}) => '50.00e3';

PrettyPrint.pretty_print.print(10499000, {
    "significant_digits": 4
}) => '10.40e6';
```