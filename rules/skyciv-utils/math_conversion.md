# SkyCiv Math + Unit Conversion

## Math Functions - `SKYCIV_UTILS.math`

**Math Functions**

| Function | Purpose |
|--|--|
| `SKYCIV_UTILS.math.rad2deg(angle)` | Converts radians to degrees |
| `SKYCIV_UTILS.math.deg2rad(angle)` | Converts degrees to radians |
| `SKYCIV_UTILS.math.properArcTan(num, den)` | Finds arctan (inverse of the tangent function) |
| `SKYCIV_UTILS.math.isEven(num)` | Checks if a number is even. |
| `SKYCIV_UTILS.math.eval(expression)` | Evaluates a `string` as a maths function. See examples below. |

**Examples - `SKYCIV_UTILS.math.eval(expression)`**

Your index.blade.php must include: `@include('inc/res/math-eval')`

```
SKYCIV_UTILS.math.eval("3*(2+1)") -> 9
SKYCIV_UTILS.math.eval("sin30") -> 0.5
SKYCIV_UTILS.math.eval("2e-3") -> 0.002
```

## Conversion Functions - `SKYCIV_UTILS.units`

| Function | Purpose |
|--|--|
| `SKYCIV_UTILS.units.print(unit)` | Prints units with proper casing e.g `kpa => kPa`|
| `SKYCIV_UTILS.units.getOptions()` | List all units available for conversion |
| `SKYCIV_UTILS.units.convert(value, convert_from, convert_to)` | Converts a value from one unit to another |

**Examples - `SKYCIV_UTILS.units.convert(value, convert_from, convert_to)`**

```
SKYCIV_UTILS.units.convert(10, 'mm', 'in') => 0.39370078740157477
SKYCIV_UTILS.units.convert(1, 'kip', 'kN') => 4.448221628250858
```