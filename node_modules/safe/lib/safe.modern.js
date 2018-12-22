/*!
 * safejs
 * https://github.com/sergeyksv/safejs
 *
 * Copyright 2012-2017 PushOk Software
 * Licensed under MIT
 */
!(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.safe = global.safe || {})));
}(this, (function (exports) {
"use strict";

const UNDEFINED = 'undefined',
	OBJECT = 'object',
	FUNCTION = 'function',
	root = typeof self === OBJECT && self.self === self && self || typeof global === OBJECT && global.global === global && global || this,
	_previous = root ? root.safe : void 0,
	_keys = Object.keys,
	_isArray = Array.isArray,
	_MAX = Infinity,
	_hop = Object.prototype.hasOwnProperty,
	_alreadyError = "Callback was already called.",
	_typedErrors = [
		"Array or Object are required",
		"Array is required",
		"Exactly two arguments are required",
		"Function is required"
	];

/* +++++++++++++++++++++++++ private functions +++++++++++++++++++++++++ */
const _isObject = (obj) => {
	if (obj === null)
		return false;

	const type = typeof obj;
	return type === OBJECT || type === FUNCTION;
};

const _isUndefined = (val) => {
	return typeof val === UNDEFINED;
};

const _isFunction = (fn) => {
	return typeof fn === FUNCTION;
};

const _isPromiseLike = (p) => {
	return p && _isFunction(p.then);
};

const _byData = (item) => {
	if (item)
		return item['data'];
};

const _isAsyncFunction = (f) => {
	return f && f.constructor && f.constructor.name === 'AsyncFunction';
};

const _throwError = (text, callback) => {
	const err = new TypeError(text);
	if (!_isFunction(callback) || callback === noop) {
		throw err;
	}

	callback(err);
};

const _iterator_array = (arr) => {
	let i = -1;

	return {
		next: () => {
			i++;
			return i < arr.length ? {
				value: arr[i],
				key: i,
				done: false
			} : {
				done: true
			};
		}
	};
};

const _iterator_symbol = (obj) => {
	let i = -1;
	const iterator = obj[Symbol.iterator]();

	return {
		next: () => {
			i++;
			const item = iterator.next();
			return item.done ? {
				done: true
			} : {
				value: item.value,
				key: i,
				done: false
			};
		}
	};
};

const _iterator_obj = (obj) => {
	const keys = _keys(obj),
		l = keys.length;
	let i = -1;

	return {
		next: () => {
			i++;
			const k = keys[i];
			return i < l ? {
				value: obj[k],
				key: k,
				done: false
			} : {
				done: true
			};
		}
	};
};

const _iterator = (obj) => {
	if (_isArray(obj)) {
		return _iterator_array(obj);
	}

	if (obj[typeof Symbol === FUNCTION && Symbol.iterator]) {
		return _iterator_symbol(obj);
	}

	return _iterator_obj(obj);
};

const _resolvePromise = (pr, callback) => {
	pr.then((result) => {
		back(callback, null, result);
	}, (err) => {
		back(callback, err);
	});
};

const _eachLimit = (obj, limit, fn, callback) => {
	let running = 0,
		stop = false,
		iterator = _iterator(obj),
		err = false;

	const _callback = _once(callback);

	const task = () => {
		if (stop || err)
			return;

		while (running < limit && err === false) {
			let item = iterator.next();

			if (item.done) {
				stop = true;
				if (running <= 0) {
					_callback();
				}
				break;
			}

			running++;
			fn(item.value, item.key, (_err) => {
				running--;

				if (_err) {
					err = true;
					_callback(_err);
				} else if (stop === false && running < limit) {
					task();
				} else if (stop && running <= 0) {
					_callback();
				}
			});
		}
	};

	task();
};

const _doPsevdoAsync = (fn) => {
	return (cb) => cb(null, fn());
};

const _once = (callback) => {
	let fired = false;

	return (...args) => {
		if (fired || callback == null)
			return;

		fired = true;

		return callback(...args);
	};
};

const _only_once = (callback) => {
	let fired = false;

	return (...args) => {
		if (fired) {
			throw new Error(_alreadyError);
		}

		fired = true;

		return callback(...args);
	};
};

const _map = (obj, limit, fn, callback) => {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	const result = [];
	let idx = 0;

	_eachLimit(obj, limit, (item, key, cb) => {
		const i = idx++;

		run((_cb) => fn(item, _cb), (err, res) => {
			result[i] = res;
			cb(err);
		});
	}, (err) => {
		callback(err, result);
	});
};

const _mapValues = (obj, limit, fn, callback) => {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	const result = {};

	_eachLimit(obj, limit, (item, key, cb) => {
		run((_cb) => fn(item, key, _cb), (err, res) => {
			result[key] = res;
			cb(err);
		});
	}, (err) => {
		callback(err, result);
	});
};

const _groupBy = (obj, limit, fn, callback) => {
	if (!_isObject(obj)) {
		return _throwError(_typedErrors[0], callback);
	}

	_map(obj, limit, (item, cb) => {
		run((_cb) => fn(item, _cb), (err, key) => {
			if (err)
				return cb(err);

			cb(err, {
				key: key,
				val: item
			});
		});
	}, (err, mapResults) => {
		const result = {};

		mapResults.forEach((data) => {
			if (_hop.call(result, data.key))
				result[data.key].push(data.val);
			else
				result[data.key] = [data.val];
		});

		callback(err, result);
	});
};

const _filter = (trust, arr, limit, fn, callback) => {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	const result = [];

	_eachLimit(arr, limit, (item, key, cb) => {
		run((_cb) => fn(item, _cb), (err, is) => {
			if ((trust && is) || !(trust || is)) {
				result.push({
					data: item,
					i: key
				});
			}
			cb(err);
		});
	}, (err) => {
		callback(err, result.sort((a, b) => a.i - b.i).map(_byData));
	});
};

const _test = (trust, arr, limit, fn, callback) => {
	let result = trust;

	_eachLimit(arr, limit, (item, key, cb) => {
		run((_cb) => fn(item, _cb), (is) => {
			if (trust) {
				if (!is) {
					result = false;
				}

				cb(!is);
			} else {
				if (is) {
					result = true;
				}

				cb(result);
			}
		});
	}, () => callback(result));
};

const _controlFlow = (obj, limit, callback) => {
	const result = _isArray(obj) ? [] : {};

	_eachLimit(obj, limit, (item, key, cb) => {
		run(item, (err, ...args) => {
			if (args.length) {
				result[key] = args.length === 1 ? args[0] : args;
			} else {
				result[key] = null;
			}

			cb(err);
		});
	}, (err) => {
		callback(err, result);
	});
};

const _times = (times, limit, fn, callback) => {
	const t = parseInt(times),
		arr = Array(t);

	for (let i = 0; i < t; i++) {
		arr[i] = i;
	}

	_map(arr, limit, fn, callback);
};

const _detect = (arr, limit, fn, callback) => {
	let result;

	_eachLimit(arr, limit, (item, key, cb) => {
		run((_cb) => fn(item, _cb), (is) => {
			if (is)
				result = item;

			cb(result || null);
		});
	}, () => callback(result));
};

const _concat = (arr, limit, fn, callback) => {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	_map(arr, limit, fn, (err, result) => {
		callback(err, [].concat(...result));
	});
};

const _swhile = (test, fn, dir, before, callback) => {
	const task = () => {
		run(fn, sure(callback, tester));
	};

	const tester = (result) => {
		run(test, sure(callback, (res) => {
			if (res == dir) {
				callback(null, result);
			} else {
				task();
			}
		}));
	};

	if (before) {
		tester();
	} else {
		task();
	}
};

const _reduce = (arr, memo, fn, callback = noop, direction) => {
	if (!_isArray(arr)) {
		return _throwError(_typedErrors[1], callback);
	}

	const iterator = _iterator(arr),
		len = arr.length;

	const task = (err, _memo) => {
		if (err) {
			callback(err);
			return;
		}

		const item = iterator.next();

		if (item.done) {
			callback(null, _memo);
		} else {
			run((cb) => fn(_memo, direction ? item.value : arr[len - 1 - item.key], cb), task);
		}
	};

	task(null, memo);
};

const _applyEach = (limit) => {
	/**
	 * @name applyEach
	 * @static
	 * @method
	 * @param {Object|Array|Iterable} fns
	 * @param {...any} [args]
	 * @param {Function} callback
	 * @return {any}
	 */
	return function applyEach(fns, ...args) {
		const task = function task(...args2) {
			const callback = args2.pop();

			_eachLimit(fns, limit, (fn, key, cb) => {
				run((_cb) => {
					return fn.apply(this, args2.concat(_cb));
				}, cb);
			}, callback);
		};

		if (args.length === 0) {
			return task;
		}

		return task.apply(this, args);
	};
};

/**
 * @class
 */
class _Queue {
	/**
	 * Create a queue.
	 * @param {Function} worker
	 * @param {number} concurrency
	 */
	constructor(worker, concurrency) {
		const _concurrency = parseInt(concurrency);

		if (!_concurrency) {
			throw new TypeError('Concurrency must not be zero');
		}

		Object.defineProperties(this, {
			'__worker': {
				enumerable: false,
				configurable: false,
				writable: false,
				value: worker
			},
			'__workers': {
				enumerable: false,
				configurable: false,
				writable: true,
				value: 0
			},
			'__workersList': {
				enumerable: false,
				configurable: false,
				writable: true,
				value: []
			},
			'__isProcessing': {
				enumerable: false,
				configurable: false,
				writable: true,
				value: false
			},
			'__processingScheduled': {
				enumerable: false,
				configurable: false,
				writable: true,
				value: false
			},
			'tasks': {
				enumerable: false,
				configurable: false,
				writable: false,
				value: []
			},
			'concurrency': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: _concurrency
			},
			'buffer': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: _concurrency / 4
			},
			'started': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: false
			},
			'paused': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: false
			}
		});
	}

	__insert(data, pos, callback) {
		if (callback != null && !_isFunction(callback)) {
			throw new TypeError(_typedErrors[3]);
		}

		this.started = true;

		const _data = _isArray(data) ? data : [data];

		if (_data.length === 0 && this.idle()) {
			return back(() => {
				this.drain();
			});
		}

		const arr = _data.map((task) => {
			return {
				data: task,
				callback: _only_once(callback || noop)
			};
		});

		if (pos) {
			this.tasks.unshift(...arr);
		} else {
			this.tasks.push(...arr);
		}

		if (!this.__processingScheduled) {
			this.__processingScheduled = true;
			back(() => {
				this.__processingScheduled = false;
				this.__execute();
			});
		}
	}

	__execute() {
		if (this.__isProcessing)
			return;

		this.__isProcessing = true;
		while (!this.paused && this.__workers < this.concurrency && this.tasks.length) {
			let task = this.tasks.shift();
			this.__workersList.push(task);

			if (this.tasks.length === 0)
				this.empty();

			let data = task.data;

			this.__workers++;

			if (this.__workers === this.concurrency)
				this.saturated();

			run((cb) => {
				return this.__worker(data, cb);
			}, (...args) => {
				this.__workers--;

				const index = this.__workersList.indexOf(task);
				if (index === 0) {
					this.__workersList.shift();
				} else if (index > 0) {
					this.__workersList.splice(index, 1);
				}

				task.callback(...args);

				if (args[0]) {
					this.error(args[0], data);
				}

				if (this.__workers <= this.concurrency - this.buffer) {
					this.unsaturated();
				}

				if (this.idle())
					this.drain();

				this.__execute();
			});
		}
		this.__isProcessing = false;
	}

	/**
	 * remove items from the queue that match a test function
	 * @param {Function} test function
	 */
	remove(test) {
		let tasks = this.tasks.filter((item) => !test(item.data));

		this.tasks.length = tasks.length;

		tasks.forEach((item, key) => {
			this.tasks[key] = item;
		});
	}

	/**
	 * add a new task to the queue
	 * @param {any} data
	 * @param {Function} callback
	 */
	push(data, callback) {
		this.__insert(data, false, callback);
	}

	/**
	 * callback that is called when the number of running workers
	 * hits the `concurrency` limit, and further tasks will be queued.
	 */
	saturated() {}

	/**
	 * a callback that is called when the number of running workers
	 * is less than the `concurrency` & `buffer` limits, and
	 * further tasks will not be queued.
	 */
	unsaturated() {}

	/**
	 * a callback that is called when the last item
	 * from the `queue` is given to a `worker`.
	*/
	empty() {}

	/**
	 * a callback that is called when the last item
	 * from the `queue` has returned from the `worker`.
	*/
	drain() {}

	/**
	 * a callback that is called when a task errors.
	 * @param {Error} err
	 * @param {any} task
	*/
	error() {}

	/**
	 * a function that removes the `drain` callback
	 * and empties remaining tasks from the queue
	 */
	kill() {
		delete this.drain;
		this.tasks.length = 0;
	}

	/**
	 * a function returning the number of items in the queue
	 * @return {number} length
	 */
	length() {
		return this.tasks.length;
	}

	/**
	 * a function returning the array of items of the queue
	 * @return {Array} workers
	 */
	running() {
		return this.__workers;
	}

	/**
	 * a function returning false if there are items
	 * waiting or being processed, or true if not
	 * @return {boolena} processed
	 */
	idle() {
		return this.tasks.length + this.__workers === 0;
	}

	/**
	 * a function that pauses the processing of tasks
	 */
	pause() {
		this.paused = true;
	}

	/**
	 * a function that resumes the processing of the queued tasks
	 */
	resume() {
		if (!this.paused)
			return;

		this.paused = false;
		back(() => this.__execute());
	}

	/**
	 * a function returning the array of items currently being processed
	 * @return {Array} an active workers
	 */
	workersList() {
		return this.__workersList;
	}
}

 /**
 * Creates a new priority queue.
 * @name PriorityQueue
 * @class
 * @extends _Queue
 */
class PriorityQueue extends _Queue {
	/**
	 * Create a queue.
	 * @param {Function} worker
	 * @param {number} concurrency
	 */
	constructor(worker, concurrency) {
		super(worker, concurrency, 'Priority Queue');
	}

	/**
	 * add a new task to the queue
	 * @param {any} data
	 * @param {number} priority
	 * @param {Function} callback
	 */
	push(data, priority, callback) {
		this.__insert(data, priority || 0, callback);
	}

	__insert(data, prior, callback) {
		if (callback != null && !_isFunction(callback)) {
			throw new TypeError(_typedErrors[3]);
		}

		this.started = true;

		const _data = _isArray(data) ? data : [data];

		if (_data.length === 0 && this.idle()) {
			return back(() => {
				this.drain();
			});
		}

		const arr = _data.map((task) => {
			return {
				data: task,
				priority: prior,
				callback: _only_once(callback || noop)
			};
		});

		let tlen = this.tasks.length,
			firstidx = tlen ? this.tasks[0].priority : 0,
			lastidx = tlen ? this.tasks[tlen - 1].priority : 0;

		if (prior > firstidx) {
			this.tasks.unshift(...arr);
		} else {
			this.tasks.push(...arr);
		}

		if (firstidx >= prior && prior < lastidx) {
			this.tasks.sort((b, a) => a.priority - b.priority); // reverse sort
		}

		if (!this.__processingScheduled) {
			this.__processingScheduled = true;
			back(() => {
				this.__processingScheduled = false;
				this.__execute();
			});
		}
	}
}

/**
 * Creates a new queue.
 * @name Queue
 * @class
 * @extends _Queue
 */
class Queue extends _Queue {
	/**
	 * Create a queue.
	 * @param {Function} worker
	 * @param {number} concurrency
	 */
	constructor(worker, concurrency) {
		super(worker, concurrency, 'Queue');
	}

	/**
	 * add a new task to the front of the queue
	 * @param {any} data
	 * @param {Function} callback
	 */
	unshift(data, callback) {
		this.__insert(data, true, callback);
	}
}

  /**
 * Creates a new cargo queue.
 * @name CargoQueue
 * @class
 * @extends _Queue
 */
class CargoQueue extends _Queue {
	/**
	 * Create a cargo queue.
	 * @param {Function} worker
	 * @param {number} payload
	 */
	constructor(worker, payload) {
		super(worker, 1, 'Cargo');

		const _payload = parseInt(payload);

		if (!_payload) {
			throw new TypeError('Payload must not be zero');
		}

		Object.defineProperties(this, {
			'payload': {
				enumerable: true,
				configurable: false,
				writable: true,
				value: _payload
			}
		});
	}

	__execute() {
		if (this.__isProcessing)
			return;

		this.__isProcessing = true;
		while (!this.paused && this.__workers < this.concurrency && this.tasks.length) {
			let tasks = this.tasks.splice(0, this.payload);
			this.__workersList.push(...tasks);

			if (this.tasks.length === 0)
				this.empty();

			let data = tasks.map(_byData);

			this.__workers++;

			if (this.__workers === this.concurrency)
				this.saturated();

			run((cb) => {
				return this.__worker(data, cb);
			}, (...args) => {
				this.__workers--;

				tasks.forEach((task) => {
					const index = this.__workersList.indexOf(task);
					if (index === 0) {
						this.__workersList.shift();
					} else if (index > 0) {
						this.__workersList.splice(index, 1);
					}

					task.callback(...args);
				});

				if (this.__workers <= this.concurrency - this.buffer) {
					this.unsaturated();
				}

				if (this.idle())
					this.drain();

				this.__execute();
			});
		}
		this.__isProcessing = false;
	}
}

/* +++++++++++++++++++++++++ public functions +++++++++++++++++++++++++ */
/**
 * @name back
 * @static
 * @method
 * @alias setImmediate
 * @alias yield
 * @param {Function} callback
 * @param {...any} [args]
 */
const back = (() => {
	if (typeof setImmediate === UNDEFINED) {
		if (typeof process === UNDEFINED) {
			if (typeof Image === FUNCTION) { // browser polyfill

				return (callback, ...args) => {
					if (!_isFunction(callback))
						throw new TypeError(_typedErrors[3]);

					const img = new Image;

					img.onerror = () => {
						callback(...args);
					};

					img.src = 'data:image/png,0';
				};
			}

			return (callback, ...args) => {
				if (!_isFunction(callback))
					throw new TypeError(_typedErrors[3]);

				setTimeout(callback, 0, ...args);
			};
		}

		return (callback, ...args) => {
			if (!_isFunction(callback))
				throw new TypeError(_typedErrors[3]);

			process.nextTick(() => {
				callback(...args);
			});
		};
	}

	return (...args) => {
		if (!_isFunction(args[0]))
			throw new TypeError(_typedErrors[3]);

		setImmediate(...args);
	};
})();

const noConflict = () => {
	root.safe = _previous;
	return this;
};

/**
 * @name nextTick
 * @static
 * @method
 * @param {Function} callback
 */
const nextTick = typeof process !== UNDEFINED && process.nextTick ? process.nextTick : back;

/**
 * @name noop
 * @static
 * @method
 */
const noop = () => {};

/**
 * @name apply
 * @static
 * @method
 * @param {Function} fn
 * @param {...ary} args
 * @return {Function} wrapped function
 */
const apply = (fn, ...args) => {
	/**
	 * @param {...any} args2
	 * @return {any}
	 */
	const _wrappedFn = (...args2) => fn(...args, ...args2);
	return _wrappedFn;
};

/**
 * @deprecated
 * @name args
 * @static
 * @method
 * @param {...any} args
 * @return {Array}
 */
const argToArr = function argToArr(...args) {
	const len = args.length,
		rest = parseInt(this);

	if (rest !== rest) // check for NaN
		throw new Error('Pass arguments to "safe.args" only through ".apply" method!');

	if (len === 0 || rest > len)
		return [];

	const arr = Array(len - rest);

	for (let i = rest; i < len; i++) {
		arr[i - rest] = i < 0 ? null : args[i];
	}

	return arr;
};

/**
 * @name constant
 * @static
 * @method
 * @param {...Array} args
 * @return {Function}
 */
const constant = (...args) => {
	/**
	 * @param {Function} callback
	 * @return {any}
	 */
	return (callback) => {
		return callback(null, ...args);
	};
};

/**
 * @name ensureAsync
 * @static
 * @method
 * @param {Function} fn
 * @return {Function} wrapped function
 */
const ensureAsync = (fn) => {
	/**
	 * {...any} args
	 * @param {Function} callback
	 * @return {any}
	 */
	return function _wrappedFn(...args) {
		let sync = true;
		const callback = args[args.length - 1];

		args[args.length - 1] = function _wrappedCallback(...args2) {
			if (sync)
				back(() => callback.apply(this, args2));
			else
				callback.apply(this, args2);
		};

		const r = fn.apply(this, args);
		sync = false;
		return r;
	};
};

/**
 * @name asyncify
 * @static
 * @method
 * @alias wrapSync
 * @param {AyncFunction} fn
 * @return {Function} wrapped function
 */
const asyncify = (fn) => {
	/**
	 * {...any} args
	 * @param {Function} callback
	 */
	return function _wrappedFn(...args) {
		const callback = args.pop();

		run((cb) => {
			const res = fn.apply(this, args);
			return (_isAsyncFunction(fn) || _isPromiseLike(res)) ? res : cb(null, res);
		}, callback);
	};
};

/**
 * @name run
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} callback
 */
const run = (fn, callback) => {
	if (_isAsyncFunction(fn)) {
		_resolvePromise(fn(), callback);
		return;
	}

	let getPromise, res, fired = false;

	const fin = (...args) => {
		if (fired) {
			throw args[0] || new Error(getPromise || _alreadyError);
		}

		fired = true;
		callback(...args);
	};

	try {
		res = fn(fin);
	} catch (err) {
		if (!err)
			throw err;

		back(fin, err);
	}

	if (_isPromiseLike(res)) {
		getPromise = "Resolution method is overspecified. Call a callback *or* return a Promise.";

		if (fired) {
			throw new Error(getPromise);
		}

		_resolvePromise(res, fin);
	}
};

/**
 * @name result
 * @static
 * @method
 * @param {Function} callback
 * @param {Function} fn
 * @return {Function} wrapped function
 */
const result = (callback, fn) => {
	if (!_isFunction(fn) || !_isFunction(callback))
		throw new TypeError(_typedErrors[2]);

	return function _wrappedFn(...args) {
		let res;

		try {
			res = fn.apply(this, args);
		} catch (err) {
			if (!err)
				throw err;

			callback(err);
			return;
		}

		if (!_isUndefined(res))
			back(callback, null, res);
		else
			back(callback, null);
	};
};

/**
 * @name sure_result
 * @static
 * @method
 * @alias trap_sure_result
 * @param {Function} callback
 * @param {Function} fn
 * @return {Function} wrapped function
 */
const sure_result = (callback, fn) => {
	if (!_isFunction(fn) || !_isFunction(callback))
		throw new TypeError(_typedErrors[2]);

	/**
	 * @param {Error} [err=null]
	 * @param {...any} args
	 */
	return function _wrappedFn(err, ...args) {
		if (err) {
			callback(err);
			return;
		}

		let res;

		try {
			res = fn.apply(this, args);
		} catch (_err) {
			if (!_err)
				throw _err;

			back(callback, _err);
			return;
		}

		if (!_isUndefined(res))
			back(callback, null, res);
		else
			back(callback, null);
	};
};

/**
 * @name sure
 * @static
 * @method
 * @alias trap_sure
 * @param {Function} callback
 * @param {Function|any} fn
 * @return {Function} wrapped function
 */
const sure = (callback, fn) => {
	if (_isUndefined(fn) || !_isFunction(callback))
		throw new TypeError(_typedErrors[2]);

	/**
	 * @param {Error} [err=null]
	 * @param {...any} args
	 * @return {any}
	 */
	return function _wrappedFn(err, ...args) {
		if (err) {
			callback(err);
		} else if (!_isFunction(fn)) {
			back(callback, null, fn);
		} else {
			try {
				return fn.apply(this, args);
			} catch (_err) {
				if (!_err)
					throw _err;

				back(callback, _err);
			}
		}
	};
};

/**
 * @name trap
 * @static
 * @method
 * @param {Function} callback
 * @param {Function} [fn]
 * @return {Function} wrapped function
 */
const trap = (callback, fn) => {
	if (_isUndefined(callback))
		throw new TypeError(_typedErrors[2]);

	/**
	 * @param {Error} [err=null]
	 * @param {...any} args
	 * @return {any}
	 */
	return function _wrappedFn(...args) {
		/*eslint-disable no-param-reassign*/
		if (_isUndefined(fn)) {
			fn = callback;
			callback = args[args.length - 1];
		}
		/*eslint-enable no-param-reassign*/

		try {
			return fn.apply(this, args);
		} catch (err) {
			if (!err)
				throw err;

			back(callback, err);
		}
	};
};

/**
 * @name wrap
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} callback
 * @return {Function} wrapped function
 */
const wrap = (fn, callback) => {
	if (!_isFunction(fn) || !_isFunction(callback))
		throw new TypeError(_typedErrors[2]);

	/**
	 * @param {...any} args
	 * @return {any}
	 */
	return function _wrappedFn(...args) {
		args.push(callback);

		try {
			return fn.apply(this, args);
		} catch (err) {
			if (!err)
				throw err;

			back(callback, err);
		}
	};
};

/**
 * @name sure_spread
 * @static
 * @method
 * @param {Function} callback
 * @param {Function} fn
 * @return {Function} wrapped function
 */
const sure_spread = (callback, fn) => {
	if (_isUndefined(fn) || !_isFunction(callback))
		throw new TypeError(_typedErrors[2]);

	/**
	 * @param {Error} [err=null]
	 * @param {...any} args
	 * @return {any}
	 */
	return function _wrappedFn(err, ...args) {
		if (err) {
			callback(err);
			return;
		}

		try {
			return fn.apply(this, args[0]);
		} catch (_err) {
			if (!_err)
				throw _err;

			back(callback, _err);
		}
	};
};

/**
 * @name spread
 * @static
 * @method
 * @param {Function} fn
 * @return {Function} wrapped function
 */
const spread = (fn) => {
	/**
	 * @param {Array} args
	 * @return {any}
	 */
	return function _wrappedFn(args) {
		return fn.apply(this, args);
	};
};

/**
 * @name inherits
 * @static
 * @method
 * @param {Function} ctor - class
 * @param {Function} superCtor - super class
 */
const inherits = (ctor, superCtor) => {
	ctor.prototype = Object.create(superCtor.prototype, {
		constructor: {
			value: ctor,
			enumerable: false
		}
	});
};

/**
 * @name async
 * @static
 * @method
 * @param {Object} _this - context object
 * @param {Function} fn
 * @param {...any} args
 * @return {Function} wrapped function
 */
const async = (_this, fn, ...args) => {
	/**
	 * @param {Function} callback
	 * @return {any}
	 */
	const _wrappedFn = (callback) => {
		try {
			return _this[fn].apply(_this, args.concat(callback));
		} catch (err) {
			if (!err)
				throw err;

			back(callback, err);
		}
	};

	return _wrappedFn;
};

/**
 * @name sortBy
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} fn
 * @param {Function} [callback]
 */
const sortBy = (arr, fn, callback = noop) => {
	if (!_isArray(arr)) {
		_throwError(_typedErrors[1], callback);
		return;
	}

	const _result = [];

	_eachLimit(arr, _MAX, (item, key, cb) => {
		run((_cb) => fn(item, _cb), (err, res) => {
			_result[key] = {
				data: item,
				i: res
			};
			cb(err);
		});
	}, (err) => {
		callback(err, _result.sort((a, b) => a.i - b.i).map(_byData));
	});
};

/**
 * @name waterfall
 * @static
 * @method
 * @param {Function[]} tasks
 * @param {Function} [callback]
 */
const waterfall = (tasks, callback = noop) => {
	if (!_isArray(tasks)) {
		_throwError(_typedErrors[1], callback);
		return;
	}

	const iterator = _iterator(tasks);

	const task = (err, ...args) => {
		if (err) {
			callback(err);
			return;
		}

		const item = iterator.next();

		if (item.done) {
			callback(null, ...args);
		} else {
			run((cb) => {
				return item.value(...args, cb);
			}, task);
		}
	};

	task();
};

/**
 * @name series
 * @static
 * @method
 * @param {Function[]|Object<string,Function>} tasks
 * @param {Function} [callback]
 */
const series = (tasks, callback = noop) => {
	_controlFlow(tasks, 1, callback);
};

/**
 * @name parallel
 * @static
 * @method
 * @param {Function[]|Object<string,Function>} tasks
 * @param {Function} [callback]
 */
const parallel = (tasks, callback = noop) => {
	_controlFlow(tasks, _MAX, callback);
};

/**
 * @name parallelLimit
 * @static
 * @method
 * @param {Function[]|Object<string,Function>} tasks
 * @param {number} limit
 * @param {Function} [callback]
 */
const parallelLimit = (tasks, limit, callback = noop) => {
	_controlFlow(tasks, limit, callback);
};

/**
 * @name reduce
 * @static
 * @method
 * @alias inject
 * @alias foldl
 * @param {Array} arr
 * @param {any} memo
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const reduce = (arr, memo, iterator, callback = noop) => {
	_reduce(arr, memo, iterator, callback, 1);
};

/**
 * @name reduceRight
 * @static
 * @method
 * @alias foldr
 * @param {Array} arr
 * @param {any} memo
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const reduceRight = (arr, memo, iterator, callback = noop) => {
	_reduce(arr, memo, iterator, callback, 0);
};

/**
 * @name each
 * @static
 * @method
 * @alias forEach
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const forEach = (arr, iterator, callback = noop) => {
	if (!_isArray(arr)) {
		_throwError(_typedErrors[1], callback);
		return;
	}

	_eachLimit(arr, _MAX, (item, key, cb) => {
		run((_cb) => iterator(item, _cb), cb);
	}, callback);
};

/**
 * @name eachLimit
 * @static
 * @method
 * @alias forEachLimit
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const eachLimit = (arr, limit, iterator, callback = noop) => {
	if (!_isArray(arr)) {
		_throwError(_typedErrors[1], callback);
		return;
	}

	_eachLimit(arr, limit, (item, key, cb) => {
		run((_cb) => iterator(item, _cb), cb);
	}, callback);
};

/**
 * @name eachSeries
 * @static
 * @method
 * @alias forEachSeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const eachSeries = (arr, iterator, callback = noop) => {
	if (!_isArray(arr)) {
		_throwError(_typedErrors[1], callback);
		return;
	}

	_eachLimit(arr, 1, (item, key, cb) => {
		run((_cb) => iterator(item, _cb), cb);
	}, callback);
};

/**
 * @name eachOf
 * @static
 * @method
 * @alias forEachOf
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const eachOf = (obj, iterator, callback = noop) => {
	if (!_isObject(obj, callback)) {
		_throwError(_typedErrors[0], callback);
		return;
	}

	_eachLimit(obj, _MAX, (item, key, cb) => {
		run((_cb) => iterator(item, key, _cb), cb);
	}, callback);
};

/**
 * @name eachOfLimit
 * @static
 * @method
 * @alias forEachOfLimit
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const eachOfLimit = (obj, limit, iterator, callback = noop) => {
	if (!_isObject(obj)) {
		_throwError(_typedErrors[0], callback);
		return;
	}

	_eachLimit(obj, limit, (item, key, cb) => {
		run((_cb) => iterator(item, key, _cb), cb);
	}, callback);
};

/**
 * @name eachOfSeries
 * @static
 * @method
 * @alias forEachOfSeries
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const eachOfSeries = (obj, iterator, callback = noop) => {
	if (!_isObject(obj)) {
		_throwError(_typedErrors[0], callback);
		return;
	}

	_eachLimit(obj, 1, (item, key, cb) => {
		run((_cb) => iterator(item, key, _cb), cb);
	}, callback);
};

/**
 * @name map
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const map = (obj, iterator, callback = noop) => {
	_map(obj, _MAX, iterator, callback);
};

/**
 * @name mapLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const mapLimit = (obj, limit, iterator, callback = noop) => {
	_map(obj, limit, iterator, callback);
};

/**
 * @name mapSeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const mapSeries = (obj, iterator, callback = noop) => {
	_map(obj, 1, iterator, callback);
};

/**
 * @name mapValues
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const mapValues = (obj, iterator, callback = noop) => {
	_mapValues(obj, _MAX, iterator, callback);
};

/**
 * @name mapValuesLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const mapValuesLimit = (obj, limit, iterator, callback = noop) => {
	_mapValues(obj, limit, iterator, callback);
};

/**
 * @name mapValuesSeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const mapValuesSeries = (obj, iterator, callback = noop) => {
	_mapValues(obj, 1, iterator, callback);
};

/**
 * @name concat
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const concat = (arr, iterator, callback = noop) => {
	_concat(arr, _MAX, iterator, callback);
};

/**
 * @name concatLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const concatLimit = (arr, limit, iterator, callback = noop) => {
	_concat(arr, limit, iterator, callback);
};

/**
 * @name concatSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const concatSeries = (arr, iterator, callback = noop) => {
	_concat(arr, 1, iterator, callback);
};

/**
 * @name groupBy
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const groupBy = (obj, iterator, callback = noop) => {
	_groupBy(obj, _MAX, iterator, callback);
};

/**
 * @name groupByLimit
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const groupByLimit = (obj, limit, iterator, callback = noop) => {
	_groupBy(obj, limit, iterator, callback);
};

/**
 * @name groupBySeries
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const groupBySeries = (obj, iterator, callback = noop) => {
	_groupBy(obj, 1, iterator, callback);
};

/**
 * @name filter
 * @static
 * @method
 * @alias select
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const filter = (arr, iterator, callback = noop) => {
	_filter(true, arr, _MAX, iterator, callback);
};

/**
 * @name filterLimit
 * @static
 * @method
 * @alias selectLimit
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const filterLimit = (arr, limit, iterator, callback = noop) => {
	_filter(true, arr, limit, iterator, callback);
};

/**
 * @name filterSeries
 * @static
 * @method
 * @alias selectSeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const filterSeries = (arr, iterator, callback = noop) => {
	_filter(true, arr, 1, iterator, callback);
};

/**
 * @name reject
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const reject = (arr, iterator, callback = noop) => {
	_filter(false, arr, _MAX, iterator, callback);
};

/**
 * @name rejectLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const rejectLimit = (arr, limit, iterator, callback = noop) => {
	_filter(false, arr, limit, iterator, callback);
};

/**
 * @name rejectSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const rejectSeries = (arr, iterator, callback = noop) => {
	_filter(false, arr, 1, iterator, callback);
};

/**
 * @name some
 * @static
 * @method
 * @alias any
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const some = (arr, iterator, callback = noop) => {
	_test(false, arr, _MAX, iterator, callback);
};

/**
 * @name someLimit
 * @static
 * @method
 * @alias anyLimit
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const someLimit = (arr, limit, iterator, callback = noop) => {
	_test(false, arr, limit, iterator, callback);
};

/**
 * @name someSeries
 * @static
 * @method
 * @alias anySeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const someSeries = (arr, iterator, callback = noop) => {
	_test(false, arr, 1, iterator, callback);
};

/**
 * @name every
 * @static
 * @method
 * @alias all
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const every = (arr, iterator, callback = noop) => {
	_test(true, arr, _MAX, iterator, callback);
};

/**
 * @name everyLimit
 * @static
 * @method
 * @alias allLimit
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const everyLimit = (arr, limit, iterator, callback = noop) => {
	_test(true, arr, limit, iterator, callback);
};

/**
 * @name everySeries
 * @static
 * @method
 * @alias allSeries
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const everySeries = (arr, iterator, callback = noop) => {
	_test(true, arr, 1, iterator, callback);
};

/**
 * @name auto
 * @static
 * @method
 * @param {Object.<string,Function|string[]>} tasks
 * @param {number} [limit=Infinity]
 * @param {Function} [callback]
 */
const auto = (tasks, limit, callback) => {
	const res = {},
		starter = Object.create(null),
		_tasks = _keys(tasks);

	let stop,
		qnt = _tasks.length,
		running = 0,
		unresolve = null;

	/*eslint-disable no-param-reassign*/
	if (_isFunction(limit)) {
		callback = limit;
		limit = _MAX;
	}
	/*eslint-enable no-param-reassign*/

	// check dependencies
	_tasks.forEach((key) => {
		if (unresolve)
			return;

		const target = tasks[key];

		if (_isArray(target)) {
			let dependencies = target.slice(0, target.length - 1);
			for (let i = 0; i < dependencies.length; i++) {
				let dep = _hop.call(tasks, target[i]) ? tasks[target[i]] : null;

				if (!dep) {
					unresolve = new Error(`safe.auto task \`${key}\` has a non-existent dependency \`${target[i]}\` in ${dependencies.join(', ')}`);
					break;
				}

				if ((dep === key) || (_isArray(dep) && dep.indexOf(key) !== -1)) {
					unresolve = new Error(`safe.auto cannot execute tasks due to a recursive dependency`);
					break;
				}
			}
		}
	});

	if (unresolve) {
		if (_isFunction(callback)) {
			callback(unresolve);
			return;
		}
		throw new Error(unresolve);
	}

	const _callback = _once(callback);

	const task = () => {
		_tasks.forEach((k) => {
			if (stop || running >= limit || starter[k]) {
				return;
			}

			let fn;
			const target = tasks[k];

			if (_isArray(target)) {
				let fin = target.length - 1;

				for (let i = 0; i < fin; i++) {
					if (!_hop.call(res, target[i])) {
						return;
					}
				}

				fn = target[fin];
			} else {
				fn = target;
			}

			starter[k] = true;
			running++;

			run((cb) => fn(cb, res), (err, ...args) => {
				qnt--;
				running--;

				if (stop) {
					return;
				}

				stop = err || qnt === 0;

				if (err) {
					_callback(err, res);
				} else {
					if (args.length) {
						res[k] = args.length === 1 ? args[0] : args;
					} else {
						res[k] = null;
					}

					if (stop) {
						_callback(err, res);
					} else {
						task();
					}
				}
			});
		});
	};

	task();
};

/**
 * @name whilst
 * @static
 * @method
 * @param {Function} test
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const whilst = (test, iterator, callback = noop) => {
	_swhile(_doPsevdoAsync(test), iterator, false, true, callback);
};

/**
 * @name doWhilst
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} test
 * @param {Function} [callback]
 */
const doWhilst = (iterator, test, callback = noop) => {
	_swhile(_doPsevdoAsync(test), iterator, false, false, callback);
};

/**
 * @name during
 * @static
 * @method
 * @param {Function} test
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const during = (test, iterator, callback = noop) => {
	_swhile(test, iterator, false, true, callback);
};

/**
 * @name doDuring
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} test
 * @param {Function} [callback]
 */
const doDuring = (iterator, test, callback = noop) => {
	_swhile(test, iterator, false, false, callback);
};

/**
 * @name until
 * @static
 * @method
 * @param {Function} test
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const until = (test, iterator, callback = noop) => {
	_swhile(_doPsevdoAsync(test), iterator, true, true, callback);
};

/**
 * @name doUntil
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} test
 * @param {Function} [callback]
 */
const doUntil = (iterator, test, callback = noop) => {
	_swhile(_doPsevdoAsync(test), iterator, true, false, callback);
};

/**
 * @name forever
 * @static
 * @method
 * @param {Function} iterator
 * @param {Function} callback
 */
const forever = (iterator, callback = noop) => {
	const _callback = _only_once(callback),
		_fn = ensureAsync(iterator);

	const task = () => {
		_fn(sure(_callback, task));
	};

	task();
};

/**
 * @name memoize
 * @static
 * @method
 * @param {Function} fn
 * @param {Function} hasher
 * @return {Function}
 */
const memoize = (fn, hasher = ((v) => v)) => {
	const memo = {};
	const queues = {};

	const memoized = (...args) => {
		const callback = args.pop(),
			key = hasher(...args);

		if (_hop.call(memo, key)) {
			back(() => callback(...memo[key]));
		} else if (_hop.call(queues, key)) {
			queues[key].push(callback);
		} else {
			queues[key] = [callback];
			fn(...args, (...args2) => {
				memo[key] = args2;
				const q = queues[key];
				delete queues[key];
				q.forEach((item) => {
					item(...args2);
				});
			});
		}
	};

	memoized.memo = memo;
	memoized.unmemoized = fn;
	return memoized;
};

/**
 * @name unmemoize
 * @static
 * @method
 * @param {Function} fn
 * @return {Function} wrapped function
 */
const unmemoize = (fn) => {
	/**
	 * @param {...any} args
	 * @return {any}
	 */
	const _wrappedFn = (...args) => (fn.unmemoized || fn)(...args);
	return _wrappedFn;
};

/**
 * @name retry
 * @static
 * @method
 * @alias retryable
 * @param {Object|Array|Iterable} obj
 * @param {Function} iterator
 * @param {Function} [callback]
 * @return {any}
 */
const retry = function (obj, iterator, callback) {
	if (arguments.length < 1 || arguments.length > 3) {
		throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
	}

	/*eslint-disable no-param-reassign*/
	let error,
		times,
		errorFilter,
		interval = 0,
		intervalFunc = () => interval;

	if (_isFunction(obj)) {
		callback = iterator;
		iterator = obj;
		times = 5;
	} else if (_isObject(obj)) {
		times = parseInt(obj.times) || 5;
		if (_isFunction(obj.interval))
			intervalFunc = obj.interval;
		else
			interval = parseInt(obj.interval) || interval;

		if (obj.errorFilter)
			errorFilter = obj.errorFilter;
	} else {
		times = parseInt(times) || 5;
	}
	/*eslint-enable no-param-reassign*/

	const task = (wcb, data) => {
		let _data = data;

		_eachLimit(Array(times), 1, (item, key, cb) => {
			run((_cb) => iterator(_cb, _data), (err, res) => {
				error = err || null;
				_data = {
					err: error,
					result: res
				};

				if (err && key < times - 1) {
					if (errorFilter && !errorFilter(err))
						cb(true);
					else {
						let int = intervalFunc(key + 1);

						if (int > 0) {
							setTimeout(cb, int);
						} else {
							cb();
						}
					}
				} else {
					cb(!err);
				}
			});
		}, () => {
			(wcb || callback || noop)(error, _data);
		});
	};

	return callback ? task() : task;
};

/**
 * @name transform
 * @static
 * @method
 * @param {Array} arr
 * @param {any} memo
 * @param {Function} task
 * @param {Function} [callback]
 */
const transform = function (arr, memo, task, callback) {
	/*eslint-disable no-param-reassign*/
	if (arguments.length <= 3) {
		callback = task;
		task = memo;
		memo = _isArray(arr) ? [] : {};
	}

	callback = _once(callback);
	/*eslint-enable no-param-reassign*/

	_eachLimit(arr, _MAX, (item, key, cb) => {
		run((_cb) => task(memo, item, key, _cb), cb);
	}, (err) => callback(err, memo));
};

/**
 * @name reflect
 * @static
 * @method
 * @param {Function} iterator
 * @return {Function}
 */
const reflect = (iterator) => {
	/**
	 * @param {...any} args
	 * @param {Function} callback
	 */
	return function _wrappedFn(...args) {
		const callback = args[args.length - 1];

		args[args.length - 1] = function _wrappedCallback(error, ...args2) {
			if (error) {
				callback(null, {
					error: error
				});
			} else {
				let value;

				if (args2.length) {
					value = args2.length === 1 ? args2[0] : args2;
				} else {
					value = null;
				}

				callback(null, {
					value: value
				});
			}
		};

		const res = iterator.apply(this, args);

		if (_isAsyncFunction(iterator) || _isPromiseLike(res)) {
			res.then((value) => {
				back(callback, null, {
					value: value
				});
			}, (error) => {
				back(callback, null, {
					error: error
				});
			});
		}
	};
};

/**
 * @name reflectAll
 * @static
 * @method
 * @param {Function[]} tasks
 * @return {Array}
 */
const reflectAll = (tasks) => {
	if (_isArray(tasks)) {
		return tasks.map(reflect);
	}

	let res = {};

	_keys(tasks).forEach((key) => {
		res[key] = reflect(tasks[key]);
	});

	return res;
};

/**
 * @name race
 * @static
 * @method
 * @param {Array} tasks
 * @param {Function} callback
 */
const race = (tasks, callback) => {
	if (!_isArray(tasks)) {
		_throwError(_typedErrors[0], callback);
		return;
	}

	if (!tasks.length) {
		callback();
	} else {
		const _callback = _once(callback);

		tasks.forEach((task) => {
			task(_callback);
		});
	}
};

/**
 * @name race
 * @static
 * @method
 * @param {Object|Array|Iterable} obj
 * @param {Function} [callback]
 */
const tryEach = (obj, callback = noop) => {
	if (!_isObject(obj, callback)) {
		_throwError(_typedErrors[0], callback);
		return;
	}

	let error = null,
		res;

	_eachLimit(obj, 1, (item, key, cb) => {
		run(item, (err, ...args) => {
			res = args.length <= 1 ? args[0] : args;
			error = err;
			cb(!err);
		});
	}, () => {
		callback(error, res);
	});
};

/**
 * @name queue
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [threads]
 * @return {Queue}
 */
const queue = (worker, threads) => {
	/**
	 * @property {Array} tasks
	 * @property {number} concurrency
	 * @property {number} buffer
	 * @property {boolean} started
	 * @property {boolean} paused
	 */
	return new Queue(worker, threads);
};

/**
 * @name priorityQueue
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [threads]
 * @return {PriorityQueue}
 */
const priorityQueue = (worker, threads) => {
	/**
	 * @property {Array} tasks
	 * @property {number} concurrency
	 * @property {number} buffer
	 * @property {boolean} started
	 * @property {boolean} paused
	 */
	return new PriorityQueue(worker, threads);
};

/**
 * @name cargo
 * @static
 * @method
 * @param {Function} worker
 * @param {number} [payload]
 * @return {CargoQueue}
 */
const cargo = (worker, payload) => {
	/**
	 * @property {Array} tasks
	 * @property {number} concurrency
	 * @property {number} buffer
	 * @property {boolean} started
	 * @property {boolean} paused
	 * @property {number} payload
	 */
	return new CargoQueue(worker, payload);
};

/**
 * @name times
 * @static
 * @method
 * @param {number} t - times
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const times = (t, iterator, callback) => {
	_times(t, _MAX, iterator, callback);
};

/**
 * @name timesLimit
 * @static
 * @method
 * @param {number} t - times
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const timesLimit = (t, limit, iterator, callback) => {
	_times(t, limit, iterator, callback);
};

/**
 * @name timesSeries
 * @static
 * @method
 * @param {number} t - times
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const timesSeries = (t, iterator, callback) => {
	_times(t, 1, iterator, callback);
};

/**
 * @name detect
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const detect = (arr, iterator, callback) => {
	_detect(arr, _MAX, iterator, callback);
};

/**
 * @name detectLimit
 * @static
 * @method
 * @param {Array} arr
 * @param {number} limit
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const detectLimit = (arr, limit, iterator, callback) => {
	_detect(arr, limit, iterator, callback);
};

/**
 * @name detectSeries
 * @static
 * @method
 * @param {Array} arr
 * @param {Function} iterator
 * @param {Function} [callback]
 */
const detectSeries = (arr, iterator, callback) => {
	_detect(arr, 1, iterator, callback);
};

const applyEach = _applyEach(_MAX);
const applyEachSeries = _applyEach(1);

const safe = {
	noConflict,
	noop,
	nextTick,
	back,
	setImmediate: back,
	yield: back,
	apply,
	async: async,
	inherits,
	args: argToArr,
	ensureAsync,
	constant,
	result,
	sure_result,
	trap_sure_result: sure_result,
	sure,
	trap_sure: sure,
	sure_spread,
	spread,
	trap,
	wrap,
	run,
	each: forEach,
	forEach,
	eachLimit,
	forEachLimit: eachLimit,
	eachSeries,
	forEachSeries: eachSeries,
	eachOf,
	forEachOf: eachOf,
	eachOfLimit,
	forEachOfLimit: eachOfLimit,
	eachOfSeries,
	forEachOfSeries: eachOfSeries,
	map,
	mapLimit,
	mapSeries,
	groupBy,
	groupByLimit,
	groupBySeries,
	mapValues,
	mapValuesLimit,
	mapValuesSeries,
	concat,
	concatLimit,
	concatSeries,
	sortBy,
	filter,
	select: filter,
	filterLimit,
	selectLimit: filterLimit,
	filterSeries,
	selectSeries: filterSeries,
	reject,
	rejectLimit,
	rejectSeries,
	waterfall,
	series,
	parallel,
	parallelLimit,
	auto,
	whilst,
	doWhilst,
	during,
	doDuring,
	until,
	doUntil,
	forever,
	reduce,
	inject: reduce,
	foldl: reduce,
	reduceRight,
	foldr: reduceRight,
	queue,
	priorityQueue,
	cargo,
	retry,
	retryable: retry,
	times,
	timesLimit,
	timesSeries,
	detect,
	detectLimit,
	detectSeries,
	some,
	any: some,
	someLimit,
	anyLimit: someLimit,
	someSeries,
	anySeries: someSeries,
	every,
	all: every,
	everyLimit,
	allLimit: everyLimit,
	everySeries,
	allSeries: everySeries,
	applyEach,
	applyEachSeries,
	asyncify,
	wrapSync: asyncify,
	memoize,
	unmemoize,
	transform,
	reflect,
	reflectAll,
	race,
	tryEach
};

exports['default'] = safe;
exports.noConflict = noConflict;
exports.noop = noop;
exports.nextTick = nextTick;
exports.back = back;
exports.setImmediate = back;
exports.yield = back;
exports.apply = apply;
exports.async = async;
exports.inherits = inherits;
exports.args = argToArr;
exports.ensureAsync = ensureAsync;
exports.constant = constant;
exports.result = result;
exports.sure_result = sure_result;
exports.trap_sure_result = sure_result;
exports.sure = sure;
exports.trap_sure = sure;
exports.sure_spread = sure_spread;
exports.spread = spread;
exports.trap = trap;
exports.wrap = wrap;
exports.run = run;
exports.each = forEach;
exports.forEach = forEach;
exports.eachLimit = eachLimit;
exports.forEachLimit = eachLimit;
exports.eachSeries = eachSeries;
exports.forEachSeries = eachSeries;
exports.eachOf = eachOf;
exports.forEachOf = eachOf;
exports.eachOfLimit = eachOfLimit;
exports.forEachOfLimit = eachOfLimit;
exports.eachOfSeries = eachOfSeries;
exports.forEachOfSeries = eachOfSeries;
exports.map = map;
exports.mapLimit = mapLimit;
exports.mapSeries = mapSeries;
exports.groupBy = groupBy;
exports.groupByLimit = groupByLimit;
exports.groupBySeries = groupBySeries;
exports.mapValues = mapValues;
exports.mapValuesLimit = mapValuesLimit;
exports.mapValuesSeries = mapValuesSeries;
exports.concat = concat;
exports.concatLimit = concatLimit;
exports.concatSeries = concatSeries;
exports.sortBy = sortBy;
exports.filter = filter;
exports.select = filter;
exports.filterLimit = filterLimit;
exports.selectLimit = filterLimit;
exports.filterSeries = filterSeries;
exports.selectSeries = filterSeries;
exports.reject = reject;
exports.rejectLimit = rejectLimit;
exports.rejectSeries = rejectSeries;
exports.waterfall = waterfall;
exports.series = series;
exports.parallel = parallel;
exports.parallelLimit = parallelLimit;
exports.auto = auto;
exports.whilst = whilst;
exports.doWhilst = doWhilst;
exports.during = during;
exports.doDuring = doDuring;
exports.until = until;
exports.doUntil = doUntil;
exports.forever = forever;
exports.reduce = reduce;
exports.inject = reduce;
exports.foldl = reduce;
exports.reduceRight = reduceRight;
exports.foldr = reduceRight;
exports.queue = queue;
exports.priorityQueue = priorityQueue;
exports.cargo = cargo;
exports.retry = retry;
exports.retryable = retry;
exports.times = times;
exports.timesLimit = timesLimit;
exports.timesSeries = timesSeries;
exports.detect = detect;
exports.detectLimit = detectLimit;
exports.detectSeries = detectSeries;
exports.some = some;
exports.any = some;
exports.someLimit = someLimit;
exports.anyLimit = someLimit;
exports.someSeries = someSeries;
exports.anySeries = someSeries;
exports.every = every;
exports.all = every;
exports.everyLimit = everyLimit;
exports.allLimit = everyLimit;
exports.everySeries = everySeries;
exports.allSeries = everySeries;
exports.applyEach = applyEach;
exports.applyEachSeries = applyEachSeries;
exports.asyncify = asyncify;
exports.wrapSync = asyncify;
exports.memoize = memoize;
exports.unmemoize = unmemoize;
exports.transform = transform;
exports.reflect = reflect;
exports.reflectAll = reflectAll;
exports.race = race;
exports.tryEach = tryEach;
Object.defineProperty(exports, "__esModule", {
	value: true
});
})));