# SkyCiv Module Upgrade

The SkyCiv Upgrade Prompt is designed to be used in modules with standalone upgrade options.

## Example

```js
	SKYCIV_UTILS.upgradeModule.show({
		module: "Quick Design",
		header: "Get full access to Quick Design",
		left_card: {
			title: "Quick Design Standalone",
			price: "$29",
			feature_msg: "Access all Quick Design features and our full calculation library.",
			feature_list: [
				"Steel, CFS & Timber Checks",
				"Concrete & Shear Wall Design",
				"Aluminum & Scaffolding Design",
				"Stiffness & Buckling Calculators",
				"Purlin, Lug & RC Fire Resistance",
			],
			link: "https://platform.skyciv.com/checkout?cr=qd_module_monthly",
			callback: null
		},
		right_card: {
			title: "SkyCiv Professional",
			price: "$109",
			feature_msg: "Unlock everything from Standalone, plus advanced analysis and exclusive features.",
			feature_list_1: [
				"Unlimited Storage",
				"Engineering Support",
				"Advanced Analysis",
				"Professional Reporting",
				"Custom Logos",
			],
			feature_list_2: [
				"SkyCiv Beam",
				"SkyCiv S3D",
				"Section Builder",
				"Mobile App",
				"Beam Shell FEA"
			],
			feature_list_3: [
				"Member & RC Design",
				"Wind/Snow Design",
				"Connection Design",
				"Foundation & Baseplate",
				"Retaining Wall Design"
			],
			link: "https://platform.skyciv.com/checkout?product=professional_ml",
			callback: null
		},
	});
```

## Supported Modules

By using one of the below modules we can track professional upgrades attributed to this module.

| Module       			  |
|-------------------------|
| Load Generator          |
| Foundation Design       |
| Quick Design            |
| Base Plate Design       |
| Connection Design       |
| Retaining Wall Design   |

## Callbacks

The callback can be used to run internal code when one of the options is clicked. 
The callback has 1 parameter which tells you which card was clicked. 



