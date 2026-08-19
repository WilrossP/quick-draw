# SkyCiv Grouping Library

## Library purpose

This library provides methods to retrieve particular model elements based on certain criteria.

## Nodes

### `byExtremes`

Get all nodes at the specified extreme of the model.

| Key              |    Type     | Accepts                        | Description                                             |
| :--------------- | :---------: | :----------------------------- | :------------------------------------------------------ |
| `structure`      |  `Object`   | The structure object.          | This can be obtained via `S3D.structure.get()`.         |
| `direction`      |  `string`   | `+x`,`-x`,`+y`,`-y`,`+z`,`-z`. | Direction of the extreme to get.                        |
| `unfiltered_ids` | `[integer]` | An array of Node IDs.          | If omitted, all nodes in the structure will be checked. |

Sample:

```js
const model = S3D.structure.get()
const xExtremeNodes = S3D.grouping.nodes.byExtremes({
	structure: model,
	direction: '+x',
})

const zxExtremeNodes = S3D.grouping.nodes.byExtremes({
	structure: model,
	direction: '+z',
	unfiltered_ids: xExtremeNodes,
})

// xExtremeNodes:  [3, 4, 7, 8]
// zxExtremeNodes: [3, 4]
```

### `byMemberProp`

Get all nodes that are attached to members that have the specified attribute.

| Key         |   Type   | Accepts               | Description                                     |
| :---------- | :------: | :-------------------- | :---------------------------------------------- |
| `structure` | `Object` | The structure object. | This can be obtained via `S3D.structure.get()`. |
| `prop`      | `string` | A member property.    | The member property to check.                   |
| `value`     |  `Any`   | Any value.            | The value that the member property should be.   |

Sample:

```js
const structure = S3D.structure.get()

S3D.grouping.nodes.byMemberProp({
	structure,
	prop: 'type',
	value: 'cable',
})

// [9, 2, 3, 5, 7]
```

---

## Members

### `byNodes`

Get all members that are attached to any of the given nodes.

| Key              |    Type     | Accepts                 | Description                                                 |
| :--------------- | :---------: | :---------------------- | :---------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.   | This can be obtained via `S3D.structure.get()`.             |
| `node_ids`       | `[integer]` | An array of node IDs.   | If the member uses one of these nodes, it will be included. |
| `unfiltered_ids` | `[integer]` | An array of member IDs. | Only return members if their ID is included in this array.  |

Sample:

```js
const model = S3D.structure.get()

// Get all members attached to node 4.
S3D.grouping.members.byNodes({
	structure: model,
	node_ids: [4],
	unfiltered_ids: null,
})
// [3, 8, 12]

// Get all members attached to either nodes 4 or 8.
S3D.grouping.members.byNodes({
	structure: model,
	node_ids: [4, 8],
	unfiltered_ids: null,
})
// [3, 8, 12, 7, 11]

// Only get member 12 if it is attached to nodes 4 or 8.
S3D.grouping.members.byNodes({
	structure: model,
	node_ids: [4, 8],
	unfiltered_ids: [12],
})
// [12]
```

### `bySecName`

Get all members that have the given section name.

| Key              |    Type     | Accepts                 | Description                                                |
| :--------------- | :---------: | :---------------------- | :--------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.   | This can be obtained via `S3D.structure.get()`.            |
| `section`        |  `string`   | The section name.       | All members using this section name will be returned.      |
| `unfiltered_ids` | `[integer]` | An array of member IDs. | Only return members if their ID is included in this array. |

Sample:

```js
const model = S3D.structure.get()

// Get all members with the section name "HSS3-1/2x1-1/2x1/8".
S3D.grouping.members.bySecName({
	structure: model,
	section: 'HSS3-1/2x1-1/2x1/8',
})
// [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// Get all members with the section name "0 x 0".
S3D.grouping.members.bySecName({
	structure: model,
	section: '0 x 0',
})
// [13, 14, 15, 16]

// Get members 5, 6 and 14 if the use the section name "HSS3-1/2x1-1/2x1/8".
S3D.grouping.members.bySecName({
	structure: model,
	section: 'HSS3-1/2x1-1/2x1/8',
	unfiltered_ids: [5, 6, 14],
})
// [5, 6]
```

### `byVector`

Get all members that conform to a specified vector.

| Key              |    Type     | Accepts                                                    | Description                                           |
| :--------------- | :---------: | :--------------------------------------------------------- | :---------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.                                      | This can be obtained via `S3D.structure.get()`.       |
| `vector`         |  `[float]`  | An X,Y and Z value to define a vector.                     | All members using this section name will be returned. |
| `unfiltered_ids` | `[integer]` | Only return members if their ID is included in this array. |

Sample:

```js
const model = S3D.structure.get()

// Get all members that extend in the X direction.
S3D.grouping.members.byVector({
	structure: model,
	unfiltered_ids: null,
	vector: [1, 0, 0],
})
// [2, 6, 11, 12]

// To get the inclined member 13.
// Node 2 coords are: [0, 0.9, 0].
// Node 9 coords are: [1.15, 3, -0.95].
S3D.grouping.members.byVector({
	structure: model,
	unfiltered_ids: null,
	vector: [1.15, 2.1, -0.95],
})
// [13]
```

---

## General

### `byAttr`

Get all elements that have the specified attribute.

| Key              |    Type     | Accepts                                           | Description                                                 |
| :--------------- | :---------: | :------------------------------------------------ | :---------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.                             | This can be obtained via `S3D.structure.get()`.             |
| `unfiltered_ids` | `[integer]` | An array of element IDs.                          | Only return elements if their ID is included in this array. |
| `type`           |  `string`   | `nodes`, `members`, `materials`, `supports`, etc. | The child array of the `structure` object to search.        |
| `key`            |  `string`   | Any key inside the iterable objects.              | The key to check of each object in the `type` array.        |
| `value`          |    `Any`    | Any value.                                        | The value to match to the key defined above.                |

Sample:

```js
const model = S3D.structure.get()

// Get all members that have a "type" attribute equal to cable.
S3D.grouping.general.byAttr({
	structure: model,
	unfiltered_ids: null,
	type: 'elements',
	key: 'type',
	value: 'cable',
})
// [13, 14, 15, 16]
```

### `byBounds`

Get all elements inside a 2D plane.

Polygon can be convex or concave. by default it is assumed convex unless specified otherwise.

If convex then extra processing is required to triangulate the polygon.

| Key              |    Type     | Accepts                                           | Description                                                 |
| :--------------- | :---------: | :------------------------------------------------ | :---------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.                             | This can be obtained via `S3D.structure.get()`.             |
| `unfiltered_ids` | `[integer]` | An array of element IDs.                          | Only return elements if their ID is included in this array. |
| `type`           |  `string`   | `nodes`, `members`, `materials`, `supports`, etc. | The child array of the `structure` object to search.        |
| `node_ids`       | `[integer]` | Nodes IDs to define a 2D polygon.                 | The key to check of each object in the `type` array.        |
| `tol`            |   `float`   | Any normal number.                                | The tolerance to include members outside the polygon.       |
| `concave`        |  `boolean`  | `true` or `false`.                                | Whether the polygon is concave or convex. Defaults `true`.  |

Sample:

```js
const model = S3D.structure.get()

// Get all members inside the 2D triangular polygon defined by nodes 1, 4 and 6.
S3D.grouping.general.byBounds({
	structure: model,
	unfiltered_ids: null,
	type: 'elements',
	node_ids: [1, 4, 6],
	tol: null,
	concave: true,
})
// [10, 12]
```

### `byCoord`

Get all elements that use a node that has a location that meets the specified criteria.

| Key              |    Type     | Accepts                                           | Description                                                 |
| :--------------- | :---------: | :------------------------------------------------ | :---------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.                             | This can be obtained via `S3D.structure.get()`.             |
| `unfiltered_ids` | `[integer]` | An array of element IDs.                          | Only return elements if their ID is included in this array. |
| `type`           |  `string`   | `nodes`, `members`, `materials`, `supports`, etc. | The child array of the `structure` object to search.        |
| `comparison`     |  `string`   | `less than`, `equals to`, `greater than`.         | The type of comparison to use when checking a node.         |
| `plane`          |  `string`   | `x`, `y` or `z`.                                  | The plane which to compare in.                              |
| `value`          |   `float`   | Any float.                                        | The coordinate to use in the comparison.                    |

Sample:

```js
const model = S3D.structure.get()

// Get all members that contain a node that has an x coordinate less than 1.
S3D.grouping.general.byCoord({
	structure: model,
	unfiltered_ids: null,
	type: 'elements',
	comparison: 'less than',
	plane: 'x',
	value: 1,
})
// [1, 2, 4, 5, 6, 10, 11, 12, 13, 15]

S3D.grouping.general.byCoord({
	structure: model,
	unfiltered_ids: null,
	type: 'elements',
	comparison: 'greater than',
	plane: 'y',
	value: 1,
})
// [13, 14, 15, 16]
```

### `byMaterial`

Get all members that have the given material name.

| Key              |    Type     | Accepts                                           | Description                                                 |
| :--------------- | :---------: | :------------------------------------------------ | :---------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.                             | This can be obtained via `S3D.structure.get()`.             |
| `type`           |  `string`   | `nodes`, `members`, `materials`, `supports`, etc. | The child array of the `structure` object to search.        |
| `unfiltered_ids` | `[integer]` | An array of element IDs.                          | Only return elements if their ID is included in this array. |
| `material_name`  |  `string`   | The material name.                                | All elements using this material will be returned.          |

Sample:

```js
const model = S3D.structure.get()

// Get all members that use the material named "cable material".
S3D.grouping.general.byMaterial({
	structure: model,
	unfiltered_ids: null,
	type: 'elements',
	material_name: 'cable material',
})
// [13, 14, 15, 16]
```

### `byPlane`

Get all elements that are in the specified plane.

| Key              |    Type     | Accepts                                           | Description                                                 |
| :--------------- | :---------: | :------------------------------------------------ | :---------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.                             | This can be obtained via `S3D.structure.get()`.             |
| `unfiltered_ids` | `[integer]` | An array of element IDs.                          | Only return elements if their ID is included in this array. |
| `type`           |  `string`   | `nodes`, `members`, `materials`, `supports`, etc. | The child array of the `structure` object to search.        |
| `node_ids`       | `[integer]` | Three node IDs that define a plane.               | If an element lies in this plane it will be returned.       |

Sample:

```js
const model = S3D.structure.get()

// Get all members that lie in the plane defined by nodes 1, 4, 6.
S3D.grouping.general.byPlane({
	structure: model,
	unfiltered_ids: null,
	type: 'members',
	node_ids: [1, 4, 6],
})

// [8, 10, 11, 12]
```

### `byPlaneDetailed`

An extension of the `byPlane` method which returns the element IDs and the perpendicular vector.

| Key              |    Type     | Accepts                                           | Description                                                 |
| :--------------- | :---------: | :------------------------------------------------ | :---------------------------------------------------------- |
| `structure`      |  `Object`   | The structure object.                             | This can be obtained via `S3D.structure.get()`.             |
| `unfiltered_ids` | `[integer]` | An array of element IDs.                          | Only return elements if their ID is included in this array. |
| `type`           |  `string`   | `nodes`, `members`, `materials`, `supports`, etc. | The child array of the `structure` object to search.        |
| `node_ids`       | `[integer]` | Three node IDs that define a plane.               | If an element lies in this plane it will be returned.       |

Sample:

```js
const model = S3D.structure.get()

// Get all members that lie in the plane defined
// by nodes 1, 4, 6 and the perpendicular vector.
S3D.grouping.general.byPlaneDetailed({
	structure: model,
	unfiltered_ids: null,
	type: 'members',
	node_ids: [1, 4, 6],
})

/*
{
  "ids": [8, 10, 11, 12],
  "perp_vec": [0, 1, 0]
}
*/
```

## Auto Grouping

### `members`

Members can be automatically grouped by similar attributes. The method takes two parameters - the first parameter is the `structure` object and the second is a settings object.

| Parameters  |   Type   | Accepts                                          | Description                                     |
| :---------- | :------: | :----------------------------------------------- | :---------------------------------------------- |
| `structure` | `Object` | The structure object.                            | This can be obtained via `S3D.structure.get()`. |
| `settings`  | `Object` | An object of key value pairs. See example below. | Attributes to group by.                         |

Sample input:

```js
S3D.grouping.autoGrouping.members(model, {
	material: false,
	direction: false,
	length: true,
	section: false,
	auto_update: true,
	group_single_member: false,
})
```

Sample output:

```json
{
  criterias: [
    {length: "0.90" },
    null,
    { length: "2.30" },
    { length: "1.90" },
    { length: "2.58" }],
  groups: [
    { name: "", IDs: [1, 3, 5, 7], type: "Members" },
    null,
    { name: "", IDs: [2, 6, 11, 12], type: "Members" },
    { name: "", IDs: [4, 8, 9, 10], type: "Members" },
    { name: "", IDs: [13, 14, 15, 16], type: "Members" },
  ],
};
```
