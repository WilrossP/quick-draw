
PROJECT.state = (function () {

	let funcs = {};

	let state = {};
	
	const get = (key) => {
		return state[key];
	};

	const set = (key, value) => {
		state[key] = value;
	}

	const reset = () => {
		state = {};
	};

	funcs.get = get;
	funcs.set = set;
	funcs.reset = reset;

	
	return funcs;
	
})();
