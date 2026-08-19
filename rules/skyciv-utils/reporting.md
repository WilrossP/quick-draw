
# SkyCiv Design Reporting
SkyCiv Design Reports

**Note**
Please only record core software events in the SkyCiv Database to avoid unnecessarily filling up the database. This includes things like successful solves, the user opening the software and other core software features.

## Basic Usage
| Option  | Notes | arguments |
|--|--|--|
| `init()`  | Initialises the report | Page size (`A4`) |
| `block.new()` | Creates new block |  |
| `block.addCalculation()`  | Label for the event |  |
| `block.finish()`| Finish the block |  |
| `section.break()` | Dunno? |  |
| `finish()`  | Finishes the report |  |


## Sample Code

```js
//import module from within design-developer-tools repo
let DES_REP = require('../../design-developer-tools/reporting/desrep_utils/desrep_utils.js')

//start new report
var REPORT = new DES_REP();
REPORT.init("A4");

//create a block
REPORT.block.new("SkyCiv Basic Math Caclulation", 2);
REPORT.block.new("Design Input: ", 4);
REPORT.block.addCalculation("A : " + A);
REPORT.block.addCalculation("B : " + B);
REPORT.block.finish();

REPORT.section.break();
REPORT.finish(false);
```

Once the report is defined, you can create a HTML. Takes in an argument of where you wish to export the HTML file:

```js
REPORT.createHTML(`${__dirname}/jobs/local/report.html`);
```


## Tables

Nice clean tables can be generated with ease, with formatting automatically handled.

```js
const ResultsTable = require('./../../design-developer-tools/calculator/table');

// sample data - should be an array
var static_table_data = [
    { name: "Monkey D. Luffy", age: 19, height: 1.74},
    { name: "Roronoa Zoro", age: 21, height: 1.81},
    { name: "Tony Tony Chopper", age: 17, height: 0.90},
    { name: "Nico Robin", age: 30, height: 1.88},
    { name: "Vinsmoke Sanji", age: 21, height: 1.80},
]

// Initialize table - arguments how many rows
var static_table = new ResultsTable(static_table_data.length); //number of rows


// Use addColumn method to define columns
static_table.addColumn({
    header: 'Name', // columb header
    width: "140px", // width of the column, can be omitted for default value
    merge_cells: false, //if true, same values for the column will merged
    data_function: function (i) {
        return static_table_data[i].name
    },
    text_align: 'left', //center, left, right
});

static_table.addColumn({
    header: 'Height',
    units: "m",
    width: "100px",
    merge_cells: false, //if true, same values for the column will merged
    data_function: function (i) {
        return (static_table_data[i].height + " m")
    },
    text_align: 'left'
});

static_table.addColumn({
    header: 'Age',
    merge_cells: false, //if true, same values for the column will merged
    data_function: function (i) {
        return static_table_data[i].age
    },
    text_align: 'left'
});

// After creating the table, add it to the report
static_table.report(REPORT);

```




## Variables

TODO: Don't really know how these work



```js

const VariableCollection = require("../../../design-developer-tools/calculator/VariableCollection.js");

// Set Unit System
let units_system = "metric";

// Set Reporting Options
let report_options = {
    units: {
        length: "m",
        section_length: "mm",
        pressure: "Pa",
        force: "kN",
        moment: "kN*m",
        material_strength: "MPa",
        density: "kg/m^3",
    },
    on: true,
    base_units: false,
    display_units: true,
    symbols: true,
    style: "extended", //one line, inline, centred, extended - check Formula Templater for output
};


// Initialize VARIABLES
var VARIABLES = new VariableCollection(report_options, units_system);


// Optional - if need to use Units other than defined in report_options
VARIABLES.fillSpecialUnits = function (units) {
    let report_units = {
        speed: speed_unit,
        frequency: "Hz",
        density: "kg/cu.m.",
        temperature: "°C",
        barometer: "Torr",
    };
    let report_units_list = Object.keys(report_units);
    if (Array.isArray(units)) {
        if (Array.isArray(units[0])) {
            for (let i = 0; i < units.length; i++) {
                if (report_units_list.indexOf(units[i][0]) > -1)
                    units[i][0] = report_units[units[i][0]];
            }
        } else {
            if (report_units_list.indexOf(units[0]) > -1)
                units[0] = report_units[units[0]];
        }
    } else if (typeof units == "string") {
        if (report_units_list.indexOf(units) > -1) units = report_units[units];
    }
    return units;
};



// To create a variable
VARIABLES.set(
    `V`, // Variable ID
    {
        value: 23,
        units: VARIABLES.fillSpecialUnits('speed'), //can be used from VARIABLES units
        symbols: `V`, // Can be used with mathjax - [mathin] V_{z} [mathin]
        name: "Basic Wind Speed",
        description: `For Risk Category ${input.site_data.risk_category}.`, 
        reference: "Section 26.5",
        // map: 'Vz'  // optional - if you want to use a formula (using VARIABLES.calculate method) with different variable id defined, this will set this variable (V) to (Vz) then you can use the formula
    }  
);


// To add the value of a variable in the report
VARIABLES.reportResult('V', REPORT) 

// To calculate a variable using the formula
// VARIABLES.calculate(variable_id, formula_id, formula_library, report)
VARIABLES.calculate('Kzt', 'Kzt', asce716_wind_formula, REPORT)


// To get the value of a variable
var Kzt = VARIABLES['Kzt'].value


```


