(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
(function() {

    const package = require('../package.json');
    window.ChatEngineCore.plugin[package.name] = require('../src/plugin.js');

})();

},{"../package.json":70,"../src/plugin.js":71}],3:[function(require,module,exports){
//
// Dotty makes it easy to programmatically access arbitrarily nested objects and
// their properties.
//

//
// `object` is an object, `path` is the path to the property you want to check
// for existence of.
//
// `path` can be provided as either a `"string.separated.with.dots"` or as
// `["an", "array"]`.
//
// Returns `true` if the path can be completely resolved, `false` otherwise.
//

var exists = module.exports.exists = function exists(object, path) {
  if (typeof path === "string") {
    path = path.split(".");
  }

  if (!(path instanceof Array) || path.length === 0) {
    return false;
  }

  path = path.slice();

  var key = path.shift();

  if (typeof object !== "object" || object === null) {
    return false;
  }

  if (path.length === 0) {
    return Object.hasOwnProperty.apply(object, [key]);
  } else {
    return exists(object[key], path);
  }
};

//
// These arguments are the same as those for `exists`.
//
// The return value, however, is the property you're trying to access, or
// `undefined` if it can't be found. This means you won't be able to tell
// the difference between an unresolved path and an undefined property, so you 
// should not use `get` to check for the existence of a property. Use `exists`
// instead.
//

var get = module.exports.get = function get(object, path) {
  if (typeof path === "string") {
    path = path.split(".");
  }

  if (!(path instanceof Array) || path.length === 0) {
    return;
  }

  path = path.slice();

  var key = path.shift();

  if (typeof object !== "object" || object === null) {
    return;
  }

  if (path.length === 0) {
    return object[key];
  }

  if (path.length) {
    return get(object[key], path);
  }
};

//
// Arguments are similar to `exists` and `get`, with the exception that path
// components are regexes with some special cases. If a path component is `"*"`
// on its own, it'll be converted to `/.*/`.
//
// The return value is an array of values where the key path matches the
// specified criterion. If none match, an empty array will be returned.
//

var search = module.exports.search = function search(object, path) {
  if (typeof path === "string") {
    path = path.split(".");
  }

  if (!(path instanceof Array) || path.length === 0) {
    return;
  }

  path = path.slice();

  var key = path.shift();

  if (typeof object !== "object" || object === null) {
    return;
  }

  if (key === "*") {
    key = ".*";
  }

  if (typeof key === "string") {
    key = new RegExp(key);
  }

  if (path.length === 0) {
    return Object.keys(object).filter(key.test.bind(key)).map(function(k) { return object[k]; });
  } else {
    return Array.prototype.concat.apply([], Object.keys(object).filter(key.test.bind(key)).map(function(k) { return search(object[k], path); }));
  }
};

//
// The first two arguments for `put` are the same as `exists` and `get`.
//
// The third argument is a value to `put` at the `path` of the `object`.
// Objects in the middle will be created if they don't exist, or added to if
// they do. If a value is encountered in the middle of the path that is *not*
// an object, it will not be overwritten.
//
// The return value is `true` in the case that the value was `put`
// successfully, or `false` otherwise.
//

var put = module.exports.put = function put(object, path, value) {
  if (typeof path === "string") {
    path = path.split(".");
  }

  if (!(path instanceof Array) || path.length === 0) {
    return false;
  }
  
  path = path.slice();

  var key = path.shift();

  if (typeof object !== "object" || object === null) {
    return false;
  }

  if (path.length === 0) {
    object[key] = value;
  } else {
    if (typeof object[key] === "undefined") {
      object[key] = {};
    }

    if (typeof object[key] !== "object" || object[key] === null) {
      return false;
    }

    return put(object[key], path, value);
  }
};

//
// `remove` is like `put` in reverse!
//
// The return value is `true` in the case that the value existed and was removed
// successfully, or `false` otherwise.
//

var remove = module.exports.remove = function remove(object, path, value) {
  if (typeof path === "string") {
    path = path.split(".");
  }

  if (!(path instanceof Array) || path.length === 0) {
    return false;
  }
  
  path = path.slice();

  var key = path.shift();

  if (typeof object !== "object" || object === null) {
    return false;
  }

  if (path.length === 0) {
    if (!Object.hasOwnProperty.call(object, key)) {
      return false;
    }

    delete object[key];

    return true;
  } else {
    return remove(object[key], path, value);
  }
};

//
// `deepKeys` creates a list of all possible key paths for a given object.
//
// The return value is always an array, the members of which are paths in array
// format. If you want them in dot-notation format, do something like this:
//
// ```js
// dotty.deepKeys(obj).map(function(e) {
//   return e.join(".");
// });
// ```
//
// *Note: this will probably explode on recursive objects. Be careful.*
//

var deepKeys = module.exports.deepKeys = function deepKeys(object, prefix) {
  if (typeof prefix === "undefined") {
    prefix = [];
  }

  var keys = [];

  for (var k in object) {
    if (!Object.hasOwnProperty.call(object, k)) {
      continue;
    }

    keys.push(prefix.concat([k]));

    if (typeof object[k] === "object" && object[k] !== null) {
      keys = keys.concat(deepKeys(object[k], prefix.concat([k])));
    }
  }

  return keys;
};

},{}],4:[function(require,module,exports){
module.exports={"Aacute":"\u00C1","aacute":"\u00E1","Abreve":"\u0102","abreve":"\u0103","ac":"\u223E","acd":"\u223F","acE":"\u223E\u0333","Acirc":"\u00C2","acirc":"\u00E2","acute":"\u00B4","Acy":"\u0410","acy":"\u0430","AElig":"\u00C6","aelig":"\u00E6","af":"\u2061","Afr":"\uD835\uDD04","afr":"\uD835\uDD1E","Agrave":"\u00C0","agrave":"\u00E0","alefsym":"\u2135","aleph":"\u2135","Alpha":"\u0391","alpha":"\u03B1","Amacr":"\u0100","amacr":"\u0101","amalg":"\u2A3F","amp":"&","AMP":"&","andand":"\u2A55","And":"\u2A53","and":"\u2227","andd":"\u2A5C","andslope":"\u2A58","andv":"\u2A5A","ang":"\u2220","ange":"\u29A4","angle":"\u2220","angmsdaa":"\u29A8","angmsdab":"\u29A9","angmsdac":"\u29AA","angmsdad":"\u29AB","angmsdae":"\u29AC","angmsdaf":"\u29AD","angmsdag":"\u29AE","angmsdah":"\u29AF","angmsd":"\u2221","angrt":"\u221F","angrtvb":"\u22BE","angrtvbd":"\u299D","angsph":"\u2222","angst":"\u00C5","angzarr":"\u237C","Aogon":"\u0104","aogon":"\u0105","Aopf":"\uD835\uDD38","aopf":"\uD835\uDD52","apacir":"\u2A6F","ap":"\u2248","apE":"\u2A70","ape":"\u224A","apid":"\u224B","apos":"'","ApplyFunction":"\u2061","approx":"\u2248","approxeq":"\u224A","Aring":"\u00C5","aring":"\u00E5","Ascr":"\uD835\uDC9C","ascr":"\uD835\uDCB6","Assign":"\u2254","ast":"*","asymp":"\u2248","asympeq":"\u224D","Atilde":"\u00C3","atilde":"\u00E3","Auml":"\u00C4","auml":"\u00E4","awconint":"\u2233","awint":"\u2A11","backcong":"\u224C","backepsilon":"\u03F6","backprime":"\u2035","backsim":"\u223D","backsimeq":"\u22CD","Backslash":"\u2216","Barv":"\u2AE7","barvee":"\u22BD","barwed":"\u2305","Barwed":"\u2306","barwedge":"\u2305","bbrk":"\u23B5","bbrktbrk":"\u23B6","bcong":"\u224C","Bcy":"\u0411","bcy":"\u0431","bdquo":"\u201E","becaus":"\u2235","because":"\u2235","Because":"\u2235","bemptyv":"\u29B0","bepsi":"\u03F6","bernou":"\u212C","Bernoullis":"\u212C","Beta":"\u0392","beta":"\u03B2","beth":"\u2136","between":"\u226C","Bfr":"\uD835\uDD05","bfr":"\uD835\uDD1F","bigcap":"\u22C2","bigcirc":"\u25EF","bigcup":"\u22C3","bigodot":"\u2A00","bigoplus":"\u2A01","bigotimes":"\u2A02","bigsqcup":"\u2A06","bigstar":"\u2605","bigtriangledown":"\u25BD","bigtriangleup":"\u25B3","biguplus":"\u2A04","bigvee":"\u22C1","bigwedge":"\u22C0","bkarow":"\u290D","blacklozenge":"\u29EB","blacksquare":"\u25AA","blacktriangle":"\u25B4","blacktriangledown":"\u25BE","blacktriangleleft":"\u25C2","blacktriangleright":"\u25B8","blank":"\u2423","blk12":"\u2592","blk14":"\u2591","blk34":"\u2593","block":"\u2588","bne":"=\u20E5","bnequiv":"\u2261\u20E5","bNot":"\u2AED","bnot":"\u2310","Bopf":"\uD835\uDD39","bopf":"\uD835\uDD53","bot":"\u22A5","bottom":"\u22A5","bowtie":"\u22C8","boxbox":"\u29C9","boxdl":"\u2510","boxdL":"\u2555","boxDl":"\u2556","boxDL":"\u2557","boxdr":"\u250C","boxdR":"\u2552","boxDr":"\u2553","boxDR":"\u2554","boxh":"\u2500","boxH":"\u2550","boxhd":"\u252C","boxHd":"\u2564","boxhD":"\u2565","boxHD":"\u2566","boxhu":"\u2534","boxHu":"\u2567","boxhU":"\u2568","boxHU":"\u2569","boxminus":"\u229F","boxplus":"\u229E","boxtimes":"\u22A0","boxul":"\u2518","boxuL":"\u255B","boxUl":"\u255C","boxUL":"\u255D","boxur":"\u2514","boxuR":"\u2558","boxUr":"\u2559","boxUR":"\u255A","boxv":"\u2502","boxV":"\u2551","boxvh":"\u253C","boxvH":"\u256A","boxVh":"\u256B","boxVH":"\u256C","boxvl":"\u2524","boxvL":"\u2561","boxVl":"\u2562","boxVL":"\u2563","boxvr":"\u251C","boxvR":"\u255E","boxVr":"\u255F","boxVR":"\u2560","bprime":"\u2035","breve":"\u02D8","Breve":"\u02D8","brvbar":"\u00A6","bscr":"\uD835\uDCB7","Bscr":"\u212C","bsemi":"\u204F","bsim":"\u223D","bsime":"\u22CD","bsolb":"\u29C5","bsol":"\\","bsolhsub":"\u27C8","bull":"\u2022","bullet":"\u2022","bump":"\u224E","bumpE":"\u2AAE","bumpe":"\u224F","Bumpeq":"\u224E","bumpeq":"\u224F","Cacute":"\u0106","cacute":"\u0107","capand":"\u2A44","capbrcup":"\u2A49","capcap":"\u2A4B","cap":"\u2229","Cap":"\u22D2","capcup":"\u2A47","capdot":"\u2A40","CapitalDifferentialD":"\u2145","caps":"\u2229\uFE00","caret":"\u2041","caron":"\u02C7","Cayleys":"\u212D","ccaps":"\u2A4D","Ccaron":"\u010C","ccaron":"\u010D","Ccedil":"\u00C7","ccedil":"\u00E7","Ccirc":"\u0108","ccirc":"\u0109","Cconint":"\u2230","ccups":"\u2A4C","ccupssm":"\u2A50","Cdot":"\u010A","cdot":"\u010B","cedil":"\u00B8","Cedilla":"\u00B8","cemptyv":"\u29B2","cent":"\u00A2","centerdot":"\u00B7","CenterDot":"\u00B7","cfr":"\uD835\uDD20","Cfr":"\u212D","CHcy":"\u0427","chcy":"\u0447","check":"\u2713","checkmark":"\u2713","Chi":"\u03A7","chi":"\u03C7","circ":"\u02C6","circeq":"\u2257","circlearrowleft":"\u21BA","circlearrowright":"\u21BB","circledast":"\u229B","circledcirc":"\u229A","circleddash":"\u229D","CircleDot":"\u2299","circledR":"\u00AE","circledS":"\u24C8","CircleMinus":"\u2296","CirclePlus":"\u2295","CircleTimes":"\u2297","cir":"\u25CB","cirE":"\u29C3","cire":"\u2257","cirfnint":"\u2A10","cirmid":"\u2AEF","cirscir":"\u29C2","ClockwiseContourIntegral":"\u2232","CloseCurlyDoubleQuote":"\u201D","CloseCurlyQuote":"\u2019","clubs":"\u2663","clubsuit":"\u2663","colon":":","Colon":"\u2237","Colone":"\u2A74","colone":"\u2254","coloneq":"\u2254","comma":",","commat":"@","comp":"\u2201","compfn":"\u2218","complement":"\u2201","complexes":"\u2102","cong":"\u2245","congdot":"\u2A6D","Congruent":"\u2261","conint":"\u222E","Conint":"\u222F","ContourIntegral":"\u222E","copf":"\uD835\uDD54","Copf":"\u2102","coprod":"\u2210","Coproduct":"\u2210","copy":"\u00A9","COPY":"\u00A9","copysr":"\u2117","CounterClockwiseContourIntegral":"\u2233","crarr":"\u21B5","cross":"\u2717","Cross":"\u2A2F","Cscr":"\uD835\uDC9E","cscr":"\uD835\uDCB8","csub":"\u2ACF","csube":"\u2AD1","csup":"\u2AD0","csupe":"\u2AD2","ctdot":"\u22EF","cudarrl":"\u2938","cudarrr":"\u2935","cuepr":"\u22DE","cuesc":"\u22DF","cularr":"\u21B6","cularrp":"\u293D","cupbrcap":"\u2A48","cupcap":"\u2A46","CupCap":"\u224D","cup":"\u222A","Cup":"\u22D3","cupcup":"\u2A4A","cupdot":"\u228D","cupor":"\u2A45","cups":"\u222A\uFE00","curarr":"\u21B7","curarrm":"\u293C","curlyeqprec":"\u22DE","curlyeqsucc":"\u22DF","curlyvee":"\u22CE","curlywedge":"\u22CF","curren":"\u00A4","curvearrowleft":"\u21B6","curvearrowright":"\u21B7","cuvee":"\u22CE","cuwed":"\u22CF","cwconint":"\u2232","cwint":"\u2231","cylcty":"\u232D","dagger":"\u2020","Dagger":"\u2021","daleth":"\u2138","darr":"\u2193","Darr":"\u21A1","dArr":"\u21D3","dash":"\u2010","Dashv":"\u2AE4","dashv":"\u22A3","dbkarow":"\u290F","dblac":"\u02DD","Dcaron":"\u010E","dcaron":"\u010F","Dcy":"\u0414","dcy":"\u0434","ddagger":"\u2021","ddarr":"\u21CA","DD":"\u2145","dd":"\u2146","DDotrahd":"\u2911","ddotseq":"\u2A77","deg":"\u00B0","Del":"\u2207","Delta":"\u0394","delta":"\u03B4","demptyv":"\u29B1","dfisht":"\u297F","Dfr":"\uD835\uDD07","dfr":"\uD835\uDD21","dHar":"\u2965","dharl":"\u21C3","dharr":"\u21C2","DiacriticalAcute":"\u00B4","DiacriticalDot":"\u02D9","DiacriticalDoubleAcute":"\u02DD","DiacriticalGrave":"`","DiacriticalTilde":"\u02DC","diam":"\u22C4","diamond":"\u22C4","Diamond":"\u22C4","diamondsuit":"\u2666","diams":"\u2666","die":"\u00A8","DifferentialD":"\u2146","digamma":"\u03DD","disin":"\u22F2","div":"\u00F7","divide":"\u00F7","divideontimes":"\u22C7","divonx":"\u22C7","DJcy":"\u0402","djcy":"\u0452","dlcorn":"\u231E","dlcrop":"\u230D","dollar":"$","Dopf":"\uD835\uDD3B","dopf":"\uD835\uDD55","Dot":"\u00A8","dot":"\u02D9","DotDot":"\u20DC","doteq":"\u2250","doteqdot":"\u2251","DotEqual":"\u2250","dotminus":"\u2238","dotplus":"\u2214","dotsquare":"\u22A1","doublebarwedge":"\u2306","DoubleContourIntegral":"\u222F","DoubleDot":"\u00A8","DoubleDownArrow":"\u21D3","DoubleLeftArrow":"\u21D0","DoubleLeftRightArrow":"\u21D4","DoubleLeftTee":"\u2AE4","DoubleLongLeftArrow":"\u27F8","DoubleLongLeftRightArrow":"\u27FA","DoubleLongRightArrow":"\u27F9","DoubleRightArrow":"\u21D2","DoubleRightTee":"\u22A8","DoubleUpArrow":"\u21D1","DoubleUpDownArrow":"\u21D5","DoubleVerticalBar":"\u2225","DownArrowBar":"\u2913","downarrow":"\u2193","DownArrow":"\u2193","Downarrow":"\u21D3","DownArrowUpArrow":"\u21F5","DownBreve":"\u0311","downdownarrows":"\u21CA","downharpoonleft":"\u21C3","downharpoonright":"\u21C2","DownLeftRightVector":"\u2950","DownLeftTeeVector":"\u295E","DownLeftVectorBar":"\u2956","DownLeftVector":"\u21BD","DownRightTeeVector":"\u295F","DownRightVectorBar":"\u2957","DownRightVector":"\u21C1","DownTeeArrow":"\u21A7","DownTee":"\u22A4","drbkarow":"\u2910","drcorn":"\u231F","drcrop":"\u230C","Dscr":"\uD835\uDC9F","dscr":"\uD835\uDCB9","DScy":"\u0405","dscy":"\u0455","dsol":"\u29F6","Dstrok":"\u0110","dstrok":"\u0111","dtdot":"\u22F1","dtri":"\u25BF","dtrif":"\u25BE","duarr":"\u21F5","duhar":"\u296F","dwangle":"\u29A6","DZcy":"\u040F","dzcy":"\u045F","dzigrarr":"\u27FF","Eacute":"\u00C9","eacute":"\u00E9","easter":"\u2A6E","Ecaron":"\u011A","ecaron":"\u011B","Ecirc":"\u00CA","ecirc":"\u00EA","ecir":"\u2256","ecolon":"\u2255","Ecy":"\u042D","ecy":"\u044D","eDDot":"\u2A77","Edot":"\u0116","edot":"\u0117","eDot":"\u2251","ee":"\u2147","efDot":"\u2252","Efr":"\uD835\uDD08","efr":"\uD835\uDD22","eg":"\u2A9A","Egrave":"\u00C8","egrave":"\u00E8","egs":"\u2A96","egsdot":"\u2A98","el":"\u2A99","Element":"\u2208","elinters":"\u23E7","ell":"\u2113","els":"\u2A95","elsdot":"\u2A97","Emacr":"\u0112","emacr":"\u0113","empty":"\u2205","emptyset":"\u2205","EmptySmallSquare":"\u25FB","emptyv":"\u2205","EmptyVerySmallSquare":"\u25AB","emsp13":"\u2004","emsp14":"\u2005","emsp":"\u2003","ENG":"\u014A","eng":"\u014B","ensp":"\u2002","Eogon":"\u0118","eogon":"\u0119","Eopf":"\uD835\uDD3C","eopf":"\uD835\uDD56","epar":"\u22D5","eparsl":"\u29E3","eplus":"\u2A71","epsi":"\u03B5","Epsilon":"\u0395","epsilon":"\u03B5","epsiv":"\u03F5","eqcirc":"\u2256","eqcolon":"\u2255","eqsim":"\u2242","eqslantgtr":"\u2A96","eqslantless":"\u2A95","Equal":"\u2A75","equals":"=","EqualTilde":"\u2242","equest":"\u225F","Equilibrium":"\u21CC","equiv":"\u2261","equivDD":"\u2A78","eqvparsl":"\u29E5","erarr":"\u2971","erDot":"\u2253","escr":"\u212F","Escr":"\u2130","esdot":"\u2250","Esim":"\u2A73","esim":"\u2242","Eta":"\u0397","eta":"\u03B7","ETH":"\u00D0","eth":"\u00F0","Euml":"\u00CB","euml":"\u00EB","euro":"\u20AC","excl":"!","exist":"\u2203","Exists":"\u2203","expectation":"\u2130","exponentiale":"\u2147","ExponentialE":"\u2147","fallingdotseq":"\u2252","Fcy":"\u0424","fcy":"\u0444","female":"\u2640","ffilig":"\uFB03","fflig":"\uFB00","ffllig":"\uFB04","Ffr":"\uD835\uDD09","ffr":"\uD835\uDD23","filig":"\uFB01","FilledSmallSquare":"\u25FC","FilledVerySmallSquare":"\u25AA","fjlig":"fj","flat":"\u266D","fllig":"\uFB02","fltns":"\u25B1","fnof":"\u0192","Fopf":"\uD835\uDD3D","fopf":"\uD835\uDD57","forall":"\u2200","ForAll":"\u2200","fork":"\u22D4","forkv":"\u2AD9","Fouriertrf":"\u2131","fpartint":"\u2A0D","frac12":"\u00BD","frac13":"\u2153","frac14":"\u00BC","frac15":"\u2155","frac16":"\u2159","frac18":"\u215B","frac23":"\u2154","frac25":"\u2156","frac34":"\u00BE","frac35":"\u2157","frac38":"\u215C","frac45":"\u2158","frac56":"\u215A","frac58":"\u215D","frac78":"\u215E","frasl":"\u2044","frown":"\u2322","fscr":"\uD835\uDCBB","Fscr":"\u2131","gacute":"\u01F5","Gamma":"\u0393","gamma":"\u03B3","Gammad":"\u03DC","gammad":"\u03DD","gap":"\u2A86","Gbreve":"\u011E","gbreve":"\u011F","Gcedil":"\u0122","Gcirc":"\u011C","gcirc":"\u011D","Gcy":"\u0413","gcy":"\u0433","Gdot":"\u0120","gdot":"\u0121","ge":"\u2265","gE":"\u2267","gEl":"\u2A8C","gel":"\u22DB","geq":"\u2265","geqq":"\u2267","geqslant":"\u2A7E","gescc":"\u2AA9","ges":"\u2A7E","gesdot":"\u2A80","gesdoto":"\u2A82","gesdotol":"\u2A84","gesl":"\u22DB\uFE00","gesles":"\u2A94","Gfr":"\uD835\uDD0A","gfr":"\uD835\uDD24","gg":"\u226B","Gg":"\u22D9","ggg":"\u22D9","gimel":"\u2137","GJcy":"\u0403","gjcy":"\u0453","gla":"\u2AA5","gl":"\u2277","glE":"\u2A92","glj":"\u2AA4","gnap":"\u2A8A","gnapprox":"\u2A8A","gne":"\u2A88","gnE":"\u2269","gneq":"\u2A88","gneqq":"\u2269","gnsim":"\u22E7","Gopf":"\uD835\uDD3E","gopf":"\uD835\uDD58","grave":"`","GreaterEqual":"\u2265","GreaterEqualLess":"\u22DB","GreaterFullEqual":"\u2267","GreaterGreater":"\u2AA2","GreaterLess":"\u2277","GreaterSlantEqual":"\u2A7E","GreaterTilde":"\u2273","Gscr":"\uD835\uDCA2","gscr":"\u210A","gsim":"\u2273","gsime":"\u2A8E","gsiml":"\u2A90","gtcc":"\u2AA7","gtcir":"\u2A7A","gt":">","GT":">","Gt":"\u226B","gtdot":"\u22D7","gtlPar":"\u2995","gtquest":"\u2A7C","gtrapprox":"\u2A86","gtrarr":"\u2978","gtrdot":"\u22D7","gtreqless":"\u22DB","gtreqqless":"\u2A8C","gtrless":"\u2277","gtrsim":"\u2273","gvertneqq":"\u2269\uFE00","gvnE":"\u2269\uFE00","Hacek":"\u02C7","hairsp":"\u200A","half":"\u00BD","hamilt":"\u210B","HARDcy":"\u042A","hardcy":"\u044A","harrcir":"\u2948","harr":"\u2194","hArr":"\u21D4","harrw":"\u21AD","Hat":"^","hbar":"\u210F","Hcirc":"\u0124","hcirc":"\u0125","hearts":"\u2665","heartsuit":"\u2665","hellip":"\u2026","hercon":"\u22B9","hfr":"\uD835\uDD25","Hfr":"\u210C","HilbertSpace":"\u210B","hksearow":"\u2925","hkswarow":"\u2926","hoarr":"\u21FF","homtht":"\u223B","hookleftarrow":"\u21A9","hookrightarrow":"\u21AA","hopf":"\uD835\uDD59","Hopf":"\u210D","horbar":"\u2015","HorizontalLine":"\u2500","hscr":"\uD835\uDCBD","Hscr":"\u210B","hslash":"\u210F","Hstrok":"\u0126","hstrok":"\u0127","HumpDownHump":"\u224E","HumpEqual":"\u224F","hybull":"\u2043","hyphen":"\u2010","Iacute":"\u00CD","iacute":"\u00ED","ic":"\u2063","Icirc":"\u00CE","icirc":"\u00EE","Icy":"\u0418","icy":"\u0438","Idot":"\u0130","IEcy":"\u0415","iecy":"\u0435","iexcl":"\u00A1","iff":"\u21D4","ifr":"\uD835\uDD26","Ifr":"\u2111","Igrave":"\u00CC","igrave":"\u00EC","ii":"\u2148","iiiint":"\u2A0C","iiint":"\u222D","iinfin":"\u29DC","iiota":"\u2129","IJlig":"\u0132","ijlig":"\u0133","Imacr":"\u012A","imacr":"\u012B","image":"\u2111","ImaginaryI":"\u2148","imagline":"\u2110","imagpart":"\u2111","imath":"\u0131","Im":"\u2111","imof":"\u22B7","imped":"\u01B5","Implies":"\u21D2","incare":"\u2105","in":"\u2208","infin":"\u221E","infintie":"\u29DD","inodot":"\u0131","intcal":"\u22BA","int":"\u222B","Int":"\u222C","integers":"\u2124","Integral":"\u222B","intercal":"\u22BA","Intersection":"\u22C2","intlarhk":"\u2A17","intprod":"\u2A3C","InvisibleComma":"\u2063","InvisibleTimes":"\u2062","IOcy":"\u0401","iocy":"\u0451","Iogon":"\u012E","iogon":"\u012F","Iopf":"\uD835\uDD40","iopf":"\uD835\uDD5A","Iota":"\u0399","iota":"\u03B9","iprod":"\u2A3C","iquest":"\u00BF","iscr":"\uD835\uDCBE","Iscr":"\u2110","isin":"\u2208","isindot":"\u22F5","isinE":"\u22F9","isins":"\u22F4","isinsv":"\u22F3","isinv":"\u2208","it":"\u2062","Itilde":"\u0128","itilde":"\u0129","Iukcy":"\u0406","iukcy":"\u0456","Iuml":"\u00CF","iuml":"\u00EF","Jcirc":"\u0134","jcirc":"\u0135","Jcy":"\u0419","jcy":"\u0439","Jfr":"\uD835\uDD0D","jfr":"\uD835\uDD27","jmath":"\u0237","Jopf":"\uD835\uDD41","jopf":"\uD835\uDD5B","Jscr":"\uD835\uDCA5","jscr":"\uD835\uDCBF","Jsercy":"\u0408","jsercy":"\u0458","Jukcy":"\u0404","jukcy":"\u0454","Kappa":"\u039A","kappa":"\u03BA","kappav":"\u03F0","Kcedil":"\u0136","kcedil":"\u0137","Kcy":"\u041A","kcy":"\u043A","Kfr":"\uD835\uDD0E","kfr":"\uD835\uDD28","kgreen":"\u0138","KHcy":"\u0425","khcy":"\u0445","KJcy":"\u040C","kjcy":"\u045C","Kopf":"\uD835\uDD42","kopf":"\uD835\uDD5C","Kscr":"\uD835\uDCA6","kscr":"\uD835\uDCC0","lAarr":"\u21DA","Lacute":"\u0139","lacute":"\u013A","laemptyv":"\u29B4","lagran":"\u2112","Lambda":"\u039B","lambda":"\u03BB","lang":"\u27E8","Lang":"\u27EA","langd":"\u2991","langle":"\u27E8","lap":"\u2A85","Laplacetrf":"\u2112","laquo":"\u00AB","larrb":"\u21E4","larrbfs":"\u291F","larr":"\u2190","Larr":"\u219E","lArr":"\u21D0","larrfs":"\u291D","larrhk":"\u21A9","larrlp":"\u21AB","larrpl":"\u2939","larrsim":"\u2973","larrtl":"\u21A2","latail":"\u2919","lAtail":"\u291B","lat":"\u2AAB","late":"\u2AAD","lates":"\u2AAD\uFE00","lbarr":"\u290C","lBarr":"\u290E","lbbrk":"\u2772","lbrace":"{","lbrack":"[","lbrke":"\u298B","lbrksld":"\u298F","lbrkslu":"\u298D","Lcaron":"\u013D","lcaron":"\u013E","Lcedil":"\u013B","lcedil":"\u013C","lceil":"\u2308","lcub":"{","Lcy":"\u041B","lcy":"\u043B","ldca":"\u2936","ldquo":"\u201C","ldquor":"\u201E","ldrdhar":"\u2967","ldrushar":"\u294B","ldsh":"\u21B2","le":"\u2264","lE":"\u2266","LeftAngleBracket":"\u27E8","LeftArrowBar":"\u21E4","leftarrow":"\u2190","LeftArrow":"\u2190","Leftarrow":"\u21D0","LeftArrowRightArrow":"\u21C6","leftarrowtail":"\u21A2","LeftCeiling":"\u2308","LeftDoubleBracket":"\u27E6","LeftDownTeeVector":"\u2961","LeftDownVectorBar":"\u2959","LeftDownVector":"\u21C3","LeftFloor":"\u230A","leftharpoondown":"\u21BD","leftharpoonup":"\u21BC","leftleftarrows":"\u21C7","leftrightarrow":"\u2194","LeftRightArrow":"\u2194","Leftrightarrow":"\u21D4","leftrightarrows":"\u21C6","leftrightharpoons":"\u21CB","leftrightsquigarrow":"\u21AD","LeftRightVector":"\u294E","LeftTeeArrow":"\u21A4","LeftTee":"\u22A3","LeftTeeVector":"\u295A","leftthreetimes":"\u22CB","LeftTriangleBar":"\u29CF","LeftTriangle":"\u22B2","LeftTriangleEqual":"\u22B4","LeftUpDownVector":"\u2951","LeftUpTeeVector":"\u2960","LeftUpVectorBar":"\u2958","LeftUpVector":"\u21BF","LeftVectorBar":"\u2952","LeftVector":"\u21BC","lEg":"\u2A8B","leg":"\u22DA","leq":"\u2264","leqq":"\u2266","leqslant":"\u2A7D","lescc":"\u2AA8","les":"\u2A7D","lesdot":"\u2A7F","lesdoto":"\u2A81","lesdotor":"\u2A83","lesg":"\u22DA\uFE00","lesges":"\u2A93","lessapprox":"\u2A85","lessdot":"\u22D6","lesseqgtr":"\u22DA","lesseqqgtr":"\u2A8B","LessEqualGreater":"\u22DA","LessFullEqual":"\u2266","LessGreater":"\u2276","lessgtr":"\u2276","LessLess":"\u2AA1","lesssim":"\u2272","LessSlantEqual":"\u2A7D","LessTilde":"\u2272","lfisht":"\u297C","lfloor":"\u230A","Lfr":"\uD835\uDD0F","lfr":"\uD835\uDD29","lg":"\u2276","lgE":"\u2A91","lHar":"\u2962","lhard":"\u21BD","lharu":"\u21BC","lharul":"\u296A","lhblk":"\u2584","LJcy":"\u0409","ljcy":"\u0459","llarr":"\u21C7","ll":"\u226A","Ll":"\u22D8","llcorner":"\u231E","Lleftarrow":"\u21DA","llhard":"\u296B","lltri":"\u25FA","Lmidot":"\u013F","lmidot":"\u0140","lmoustache":"\u23B0","lmoust":"\u23B0","lnap":"\u2A89","lnapprox":"\u2A89","lne":"\u2A87","lnE":"\u2268","lneq":"\u2A87","lneqq":"\u2268","lnsim":"\u22E6","loang":"\u27EC","loarr":"\u21FD","lobrk":"\u27E6","longleftarrow":"\u27F5","LongLeftArrow":"\u27F5","Longleftarrow":"\u27F8","longleftrightarrow":"\u27F7","LongLeftRightArrow":"\u27F7","Longleftrightarrow":"\u27FA","longmapsto":"\u27FC","longrightarrow":"\u27F6","LongRightArrow":"\u27F6","Longrightarrow":"\u27F9","looparrowleft":"\u21AB","looparrowright":"\u21AC","lopar":"\u2985","Lopf":"\uD835\uDD43","lopf":"\uD835\uDD5D","loplus":"\u2A2D","lotimes":"\u2A34","lowast":"\u2217","lowbar":"_","LowerLeftArrow":"\u2199","LowerRightArrow":"\u2198","loz":"\u25CA","lozenge":"\u25CA","lozf":"\u29EB","lpar":"(","lparlt":"\u2993","lrarr":"\u21C6","lrcorner":"\u231F","lrhar":"\u21CB","lrhard":"\u296D","lrm":"\u200E","lrtri":"\u22BF","lsaquo":"\u2039","lscr":"\uD835\uDCC1","Lscr":"\u2112","lsh":"\u21B0","Lsh":"\u21B0","lsim":"\u2272","lsime":"\u2A8D","lsimg":"\u2A8F","lsqb":"[","lsquo":"\u2018","lsquor":"\u201A","Lstrok":"\u0141","lstrok":"\u0142","ltcc":"\u2AA6","ltcir":"\u2A79","lt":"<","LT":"<","Lt":"\u226A","ltdot":"\u22D6","lthree":"\u22CB","ltimes":"\u22C9","ltlarr":"\u2976","ltquest":"\u2A7B","ltri":"\u25C3","ltrie":"\u22B4","ltrif":"\u25C2","ltrPar":"\u2996","lurdshar":"\u294A","luruhar":"\u2966","lvertneqq":"\u2268\uFE00","lvnE":"\u2268\uFE00","macr":"\u00AF","male":"\u2642","malt":"\u2720","maltese":"\u2720","Map":"\u2905","map":"\u21A6","mapsto":"\u21A6","mapstodown":"\u21A7","mapstoleft":"\u21A4","mapstoup":"\u21A5","marker":"\u25AE","mcomma":"\u2A29","Mcy":"\u041C","mcy":"\u043C","mdash":"\u2014","mDDot":"\u223A","measuredangle":"\u2221","MediumSpace":"\u205F","Mellintrf":"\u2133","Mfr":"\uD835\uDD10","mfr":"\uD835\uDD2A","mho":"\u2127","micro":"\u00B5","midast":"*","midcir":"\u2AF0","mid":"\u2223","middot":"\u00B7","minusb":"\u229F","minus":"\u2212","minusd":"\u2238","minusdu":"\u2A2A","MinusPlus":"\u2213","mlcp":"\u2ADB","mldr":"\u2026","mnplus":"\u2213","models":"\u22A7","Mopf":"\uD835\uDD44","mopf":"\uD835\uDD5E","mp":"\u2213","mscr":"\uD835\uDCC2","Mscr":"\u2133","mstpos":"\u223E","Mu":"\u039C","mu":"\u03BC","multimap":"\u22B8","mumap":"\u22B8","nabla":"\u2207","Nacute":"\u0143","nacute":"\u0144","nang":"\u2220\u20D2","nap":"\u2249","napE":"\u2A70\u0338","napid":"\u224B\u0338","napos":"\u0149","napprox":"\u2249","natural":"\u266E","naturals":"\u2115","natur":"\u266E","nbsp":"\u00A0","nbump":"\u224E\u0338","nbumpe":"\u224F\u0338","ncap":"\u2A43","Ncaron":"\u0147","ncaron":"\u0148","Ncedil":"\u0145","ncedil":"\u0146","ncong":"\u2247","ncongdot":"\u2A6D\u0338","ncup":"\u2A42","Ncy":"\u041D","ncy":"\u043D","ndash":"\u2013","nearhk":"\u2924","nearr":"\u2197","neArr":"\u21D7","nearrow":"\u2197","ne":"\u2260","nedot":"\u2250\u0338","NegativeMediumSpace":"\u200B","NegativeThickSpace":"\u200B","NegativeThinSpace":"\u200B","NegativeVeryThinSpace":"\u200B","nequiv":"\u2262","nesear":"\u2928","nesim":"\u2242\u0338","NestedGreaterGreater":"\u226B","NestedLessLess":"\u226A","NewLine":"\n","nexist":"\u2204","nexists":"\u2204","Nfr":"\uD835\uDD11","nfr":"\uD835\uDD2B","ngE":"\u2267\u0338","nge":"\u2271","ngeq":"\u2271","ngeqq":"\u2267\u0338","ngeqslant":"\u2A7E\u0338","nges":"\u2A7E\u0338","nGg":"\u22D9\u0338","ngsim":"\u2275","nGt":"\u226B\u20D2","ngt":"\u226F","ngtr":"\u226F","nGtv":"\u226B\u0338","nharr":"\u21AE","nhArr":"\u21CE","nhpar":"\u2AF2","ni":"\u220B","nis":"\u22FC","nisd":"\u22FA","niv":"\u220B","NJcy":"\u040A","njcy":"\u045A","nlarr":"\u219A","nlArr":"\u21CD","nldr":"\u2025","nlE":"\u2266\u0338","nle":"\u2270","nleftarrow":"\u219A","nLeftarrow":"\u21CD","nleftrightarrow":"\u21AE","nLeftrightarrow":"\u21CE","nleq":"\u2270","nleqq":"\u2266\u0338","nleqslant":"\u2A7D\u0338","nles":"\u2A7D\u0338","nless":"\u226E","nLl":"\u22D8\u0338","nlsim":"\u2274","nLt":"\u226A\u20D2","nlt":"\u226E","nltri":"\u22EA","nltrie":"\u22EC","nLtv":"\u226A\u0338","nmid":"\u2224","NoBreak":"\u2060","NonBreakingSpace":"\u00A0","nopf":"\uD835\uDD5F","Nopf":"\u2115","Not":"\u2AEC","not":"\u00AC","NotCongruent":"\u2262","NotCupCap":"\u226D","NotDoubleVerticalBar":"\u2226","NotElement":"\u2209","NotEqual":"\u2260","NotEqualTilde":"\u2242\u0338","NotExists":"\u2204","NotGreater":"\u226F","NotGreaterEqual":"\u2271","NotGreaterFullEqual":"\u2267\u0338","NotGreaterGreater":"\u226B\u0338","NotGreaterLess":"\u2279","NotGreaterSlantEqual":"\u2A7E\u0338","NotGreaterTilde":"\u2275","NotHumpDownHump":"\u224E\u0338","NotHumpEqual":"\u224F\u0338","notin":"\u2209","notindot":"\u22F5\u0338","notinE":"\u22F9\u0338","notinva":"\u2209","notinvb":"\u22F7","notinvc":"\u22F6","NotLeftTriangleBar":"\u29CF\u0338","NotLeftTriangle":"\u22EA","NotLeftTriangleEqual":"\u22EC","NotLess":"\u226E","NotLessEqual":"\u2270","NotLessGreater":"\u2278","NotLessLess":"\u226A\u0338","NotLessSlantEqual":"\u2A7D\u0338","NotLessTilde":"\u2274","NotNestedGreaterGreater":"\u2AA2\u0338","NotNestedLessLess":"\u2AA1\u0338","notni":"\u220C","notniva":"\u220C","notnivb":"\u22FE","notnivc":"\u22FD","NotPrecedes":"\u2280","NotPrecedesEqual":"\u2AAF\u0338","NotPrecedesSlantEqual":"\u22E0","NotReverseElement":"\u220C","NotRightTriangleBar":"\u29D0\u0338","NotRightTriangle":"\u22EB","NotRightTriangleEqual":"\u22ED","NotSquareSubset":"\u228F\u0338","NotSquareSubsetEqual":"\u22E2","NotSquareSuperset":"\u2290\u0338","NotSquareSupersetEqual":"\u22E3","NotSubset":"\u2282\u20D2","NotSubsetEqual":"\u2288","NotSucceeds":"\u2281","NotSucceedsEqual":"\u2AB0\u0338","NotSucceedsSlantEqual":"\u22E1","NotSucceedsTilde":"\u227F\u0338","NotSuperset":"\u2283\u20D2","NotSupersetEqual":"\u2289","NotTilde":"\u2241","NotTildeEqual":"\u2244","NotTildeFullEqual":"\u2247","NotTildeTilde":"\u2249","NotVerticalBar":"\u2224","nparallel":"\u2226","npar":"\u2226","nparsl":"\u2AFD\u20E5","npart":"\u2202\u0338","npolint":"\u2A14","npr":"\u2280","nprcue":"\u22E0","nprec":"\u2280","npreceq":"\u2AAF\u0338","npre":"\u2AAF\u0338","nrarrc":"\u2933\u0338","nrarr":"\u219B","nrArr":"\u21CF","nrarrw":"\u219D\u0338","nrightarrow":"\u219B","nRightarrow":"\u21CF","nrtri":"\u22EB","nrtrie":"\u22ED","nsc":"\u2281","nsccue":"\u22E1","nsce":"\u2AB0\u0338","Nscr":"\uD835\uDCA9","nscr":"\uD835\uDCC3","nshortmid":"\u2224","nshortparallel":"\u2226","nsim":"\u2241","nsime":"\u2244","nsimeq":"\u2244","nsmid":"\u2224","nspar":"\u2226","nsqsube":"\u22E2","nsqsupe":"\u22E3","nsub":"\u2284","nsubE":"\u2AC5\u0338","nsube":"\u2288","nsubset":"\u2282\u20D2","nsubseteq":"\u2288","nsubseteqq":"\u2AC5\u0338","nsucc":"\u2281","nsucceq":"\u2AB0\u0338","nsup":"\u2285","nsupE":"\u2AC6\u0338","nsupe":"\u2289","nsupset":"\u2283\u20D2","nsupseteq":"\u2289","nsupseteqq":"\u2AC6\u0338","ntgl":"\u2279","Ntilde":"\u00D1","ntilde":"\u00F1","ntlg":"\u2278","ntriangleleft":"\u22EA","ntrianglelefteq":"\u22EC","ntriangleright":"\u22EB","ntrianglerighteq":"\u22ED","Nu":"\u039D","nu":"\u03BD","num":"#","numero":"\u2116","numsp":"\u2007","nvap":"\u224D\u20D2","nvdash":"\u22AC","nvDash":"\u22AD","nVdash":"\u22AE","nVDash":"\u22AF","nvge":"\u2265\u20D2","nvgt":">\u20D2","nvHarr":"\u2904","nvinfin":"\u29DE","nvlArr":"\u2902","nvle":"\u2264\u20D2","nvlt":"<\u20D2","nvltrie":"\u22B4\u20D2","nvrArr":"\u2903","nvrtrie":"\u22B5\u20D2","nvsim":"\u223C\u20D2","nwarhk":"\u2923","nwarr":"\u2196","nwArr":"\u21D6","nwarrow":"\u2196","nwnear":"\u2927","Oacute":"\u00D3","oacute":"\u00F3","oast":"\u229B","Ocirc":"\u00D4","ocirc":"\u00F4","ocir":"\u229A","Ocy":"\u041E","ocy":"\u043E","odash":"\u229D","Odblac":"\u0150","odblac":"\u0151","odiv":"\u2A38","odot":"\u2299","odsold":"\u29BC","OElig":"\u0152","oelig":"\u0153","ofcir":"\u29BF","Ofr":"\uD835\uDD12","ofr":"\uD835\uDD2C","ogon":"\u02DB","Ograve":"\u00D2","ograve":"\u00F2","ogt":"\u29C1","ohbar":"\u29B5","ohm":"\u03A9","oint":"\u222E","olarr":"\u21BA","olcir":"\u29BE","olcross":"\u29BB","oline":"\u203E","olt":"\u29C0","Omacr":"\u014C","omacr":"\u014D","Omega":"\u03A9","omega":"\u03C9","Omicron":"\u039F","omicron":"\u03BF","omid":"\u29B6","ominus":"\u2296","Oopf":"\uD835\uDD46","oopf":"\uD835\uDD60","opar":"\u29B7","OpenCurlyDoubleQuote":"\u201C","OpenCurlyQuote":"\u2018","operp":"\u29B9","oplus":"\u2295","orarr":"\u21BB","Or":"\u2A54","or":"\u2228","ord":"\u2A5D","order":"\u2134","orderof":"\u2134","ordf":"\u00AA","ordm":"\u00BA","origof":"\u22B6","oror":"\u2A56","orslope":"\u2A57","orv":"\u2A5B","oS":"\u24C8","Oscr":"\uD835\uDCAA","oscr":"\u2134","Oslash":"\u00D8","oslash":"\u00F8","osol":"\u2298","Otilde":"\u00D5","otilde":"\u00F5","otimesas":"\u2A36","Otimes":"\u2A37","otimes":"\u2297","Ouml":"\u00D6","ouml":"\u00F6","ovbar":"\u233D","OverBar":"\u203E","OverBrace":"\u23DE","OverBracket":"\u23B4","OverParenthesis":"\u23DC","para":"\u00B6","parallel":"\u2225","par":"\u2225","parsim":"\u2AF3","parsl":"\u2AFD","part":"\u2202","PartialD":"\u2202","Pcy":"\u041F","pcy":"\u043F","percnt":"%","period":".","permil":"\u2030","perp":"\u22A5","pertenk":"\u2031","Pfr":"\uD835\uDD13","pfr":"\uD835\uDD2D","Phi":"\u03A6","phi":"\u03C6","phiv":"\u03D5","phmmat":"\u2133","phone":"\u260E","Pi":"\u03A0","pi":"\u03C0","pitchfork":"\u22D4","piv":"\u03D6","planck":"\u210F","planckh":"\u210E","plankv":"\u210F","plusacir":"\u2A23","plusb":"\u229E","pluscir":"\u2A22","plus":"+","plusdo":"\u2214","plusdu":"\u2A25","pluse":"\u2A72","PlusMinus":"\u00B1","plusmn":"\u00B1","plussim":"\u2A26","plustwo":"\u2A27","pm":"\u00B1","Poincareplane":"\u210C","pointint":"\u2A15","popf":"\uD835\uDD61","Popf":"\u2119","pound":"\u00A3","prap":"\u2AB7","Pr":"\u2ABB","pr":"\u227A","prcue":"\u227C","precapprox":"\u2AB7","prec":"\u227A","preccurlyeq":"\u227C","Precedes":"\u227A","PrecedesEqual":"\u2AAF","PrecedesSlantEqual":"\u227C","PrecedesTilde":"\u227E","preceq":"\u2AAF","precnapprox":"\u2AB9","precneqq":"\u2AB5","precnsim":"\u22E8","pre":"\u2AAF","prE":"\u2AB3","precsim":"\u227E","prime":"\u2032","Prime":"\u2033","primes":"\u2119","prnap":"\u2AB9","prnE":"\u2AB5","prnsim":"\u22E8","prod":"\u220F","Product":"\u220F","profalar":"\u232E","profline":"\u2312","profsurf":"\u2313","prop":"\u221D","Proportional":"\u221D","Proportion":"\u2237","propto":"\u221D","prsim":"\u227E","prurel":"\u22B0","Pscr":"\uD835\uDCAB","pscr":"\uD835\uDCC5","Psi":"\u03A8","psi":"\u03C8","puncsp":"\u2008","Qfr":"\uD835\uDD14","qfr":"\uD835\uDD2E","qint":"\u2A0C","qopf":"\uD835\uDD62","Qopf":"\u211A","qprime":"\u2057","Qscr":"\uD835\uDCAC","qscr":"\uD835\uDCC6","quaternions":"\u210D","quatint":"\u2A16","quest":"?","questeq":"\u225F","quot":"\"","QUOT":"\"","rAarr":"\u21DB","race":"\u223D\u0331","Racute":"\u0154","racute":"\u0155","radic":"\u221A","raemptyv":"\u29B3","rang":"\u27E9","Rang":"\u27EB","rangd":"\u2992","range":"\u29A5","rangle":"\u27E9","raquo":"\u00BB","rarrap":"\u2975","rarrb":"\u21E5","rarrbfs":"\u2920","rarrc":"\u2933","rarr":"\u2192","Rarr":"\u21A0","rArr":"\u21D2","rarrfs":"\u291E","rarrhk":"\u21AA","rarrlp":"\u21AC","rarrpl":"\u2945","rarrsim":"\u2974","Rarrtl":"\u2916","rarrtl":"\u21A3","rarrw":"\u219D","ratail":"\u291A","rAtail":"\u291C","ratio":"\u2236","rationals":"\u211A","rbarr":"\u290D","rBarr":"\u290F","RBarr":"\u2910","rbbrk":"\u2773","rbrace":"}","rbrack":"]","rbrke":"\u298C","rbrksld":"\u298E","rbrkslu":"\u2990","Rcaron":"\u0158","rcaron":"\u0159","Rcedil":"\u0156","rcedil":"\u0157","rceil":"\u2309","rcub":"}","Rcy":"\u0420","rcy":"\u0440","rdca":"\u2937","rdldhar":"\u2969","rdquo":"\u201D","rdquor":"\u201D","rdsh":"\u21B3","real":"\u211C","realine":"\u211B","realpart":"\u211C","reals":"\u211D","Re":"\u211C","rect":"\u25AD","reg":"\u00AE","REG":"\u00AE","ReverseElement":"\u220B","ReverseEquilibrium":"\u21CB","ReverseUpEquilibrium":"\u296F","rfisht":"\u297D","rfloor":"\u230B","rfr":"\uD835\uDD2F","Rfr":"\u211C","rHar":"\u2964","rhard":"\u21C1","rharu":"\u21C0","rharul":"\u296C","Rho":"\u03A1","rho":"\u03C1","rhov":"\u03F1","RightAngleBracket":"\u27E9","RightArrowBar":"\u21E5","rightarrow":"\u2192","RightArrow":"\u2192","Rightarrow":"\u21D2","RightArrowLeftArrow":"\u21C4","rightarrowtail":"\u21A3","RightCeiling":"\u2309","RightDoubleBracket":"\u27E7","RightDownTeeVector":"\u295D","RightDownVectorBar":"\u2955","RightDownVector":"\u21C2","RightFloor":"\u230B","rightharpoondown":"\u21C1","rightharpoonup":"\u21C0","rightleftarrows":"\u21C4","rightleftharpoons":"\u21CC","rightrightarrows":"\u21C9","rightsquigarrow":"\u219D","RightTeeArrow":"\u21A6","RightTee":"\u22A2","RightTeeVector":"\u295B","rightthreetimes":"\u22CC","RightTriangleBar":"\u29D0","RightTriangle":"\u22B3","RightTriangleEqual":"\u22B5","RightUpDownVector":"\u294F","RightUpTeeVector":"\u295C","RightUpVectorBar":"\u2954","RightUpVector":"\u21BE","RightVectorBar":"\u2953","RightVector":"\u21C0","ring":"\u02DA","risingdotseq":"\u2253","rlarr":"\u21C4","rlhar":"\u21CC","rlm":"\u200F","rmoustache":"\u23B1","rmoust":"\u23B1","rnmid":"\u2AEE","roang":"\u27ED","roarr":"\u21FE","robrk":"\u27E7","ropar":"\u2986","ropf":"\uD835\uDD63","Ropf":"\u211D","roplus":"\u2A2E","rotimes":"\u2A35","RoundImplies":"\u2970","rpar":")","rpargt":"\u2994","rppolint":"\u2A12","rrarr":"\u21C9","Rrightarrow":"\u21DB","rsaquo":"\u203A","rscr":"\uD835\uDCC7","Rscr":"\u211B","rsh":"\u21B1","Rsh":"\u21B1","rsqb":"]","rsquo":"\u2019","rsquor":"\u2019","rthree":"\u22CC","rtimes":"\u22CA","rtri":"\u25B9","rtrie":"\u22B5","rtrif":"\u25B8","rtriltri":"\u29CE","RuleDelayed":"\u29F4","ruluhar":"\u2968","rx":"\u211E","Sacute":"\u015A","sacute":"\u015B","sbquo":"\u201A","scap":"\u2AB8","Scaron":"\u0160","scaron":"\u0161","Sc":"\u2ABC","sc":"\u227B","sccue":"\u227D","sce":"\u2AB0","scE":"\u2AB4","Scedil":"\u015E","scedil":"\u015F","Scirc":"\u015C","scirc":"\u015D","scnap":"\u2ABA","scnE":"\u2AB6","scnsim":"\u22E9","scpolint":"\u2A13","scsim":"\u227F","Scy":"\u0421","scy":"\u0441","sdotb":"\u22A1","sdot":"\u22C5","sdote":"\u2A66","searhk":"\u2925","searr":"\u2198","seArr":"\u21D8","searrow":"\u2198","sect":"\u00A7","semi":";","seswar":"\u2929","setminus":"\u2216","setmn":"\u2216","sext":"\u2736","Sfr":"\uD835\uDD16","sfr":"\uD835\uDD30","sfrown":"\u2322","sharp":"\u266F","SHCHcy":"\u0429","shchcy":"\u0449","SHcy":"\u0428","shcy":"\u0448","ShortDownArrow":"\u2193","ShortLeftArrow":"\u2190","shortmid":"\u2223","shortparallel":"\u2225","ShortRightArrow":"\u2192","ShortUpArrow":"\u2191","shy":"\u00AD","Sigma":"\u03A3","sigma":"\u03C3","sigmaf":"\u03C2","sigmav":"\u03C2","sim":"\u223C","simdot":"\u2A6A","sime":"\u2243","simeq":"\u2243","simg":"\u2A9E","simgE":"\u2AA0","siml":"\u2A9D","simlE":"\u2A9F","simne":"\u2246","simplus":"\u2A24","simrarr":"\u2972","slarr":"\u2190","SmallCircle":"\u2218","smallsetminus":"\u2216","smashp":"\u2A33","smeparsl":"\u29E4","smid":"\u2223","smile":"\u2323","smt":"\u2AAA","smte":"\u2AAC","smtes":"\u2AAC\uFE00","SOFTcy":"\u042C","softcy":"\u044C","solbar":"\u233F","solb":"\u29C4","sol":"/","Sopf":"\uD835\uDD4A","sopf":"\uD835\uDD64","spades":"\u2660","spadesuit":"\u2660","spar":"\u2225","sqcap":"\u2293","sqcaps":"\u2293\uFE00","sqcup":"\u2294","sqcups":"\u2294\uFE00","Sqrt":"\u221A","sqsub":"\u228F","sqsube":"\u2291","sqsubset":"\u228F","sqsubseteq":"\u2291","sqsup":"\u2290","sqsupe":"\u2292","sqsupset":"\u2290","sqsupseteq":"\u2292","square":"\u25A1","Square":"\u25A1","SquareIntersection":"\u2293","SquareSubset":"\u228F","SquareSubsetEqual":"\u2291","SquareSuperset":"\u2290","SquareSupersetEqual":"\u2292","SquareUnion":"\u2294","squarf":"\u25AA","squ":"\u25A1","squf":"\u25AA","srarr":"\u2192","Sscr":"\uD835\uDCAE","sscr":"\uD835\uDCC8","ssetmn":"\u2216","ssmile":"\u2323","sstarf":"\u22C6","Star":"\u22C6","star":"\u2606","starf":"\u2605","straightepsilon":"\u03F5","straightphi":"\u03D5","strns":"\u00AF","sub":"\u2282","Sub":"\u22D0","subdot":"\u2ABD","subE":"\u2AC5","sube":"\u2286","subedot":"\u2AC3","submult":"\u2AC1","subnE":"\u2ACB","subne":"\u228A","subplus":"\u2ABF","subrarr":"\u2979","subset":"\u2282","Subset":"\u22D0","subseteq":"\u2286","subseteqq":"\u2AC5","SubsetEqual":"\u2286","subsetneq":"\u228A","subsetneqq":"\u2ACB","subsim":"\u2AC7","subsub":"\u2AD5","subsup":"\u2AD3","succapprox":"\u2AB8","succ":"\u227B","succcurlyeq":"\u227D","Succeeds":"\u227B","SucceedsEqual":"\u2AB0","SucceedsSlantEqual":"\u227D","SucceedsTilde":"\u227F","succeq":"\u2AB0","succnapprox":"\u2ABA","succneqq":"\u2AB6","succnsim":"\u22E9","succsim":"\u227F","SuchThat":"\u220B","sum":"\u2211","Sum":"\u2211","sung":"\u266A","sup1":"\u00B9","sup2":"\u00B2","sup3":"\u00B3","sup":"\u2283","Sup":"\u22D1","supdot":"\u2ABE","supdsub":"\u2AD8","supE":"\u2AC6","supe":"\u2287","supedot":"\u2AC4","Superset":"\u2283","SupersetEqual":"\u2287","suphsol":"\u27C9","suphsub":"\u2AD7","suplarr":"\u297B","supmult":"\u2AC2","supnE":"\u2ACC","supne":"\u228B","supplus":"\u2AC0","supset":"\u2283","Supset":"\u22D1","supseteq":"\u2287","supseteqq":"\u2AC6","supsetneq":"\u228B","supsetneqq":"\u2ACC","supsim":"\u2AC8","supsub":"\u2AD4","supsup":"\u2AD6","swarhk":"\u2926","swarr":"\u2199","swArr":"\u21D9","swarrow":"\u2199","swnwar":"\u292A","szlig":"\u00DF","Tab":"\t","target":"\u2316","Tau":"\u03A4","tau":"\u03C4","tbrk":"\u23B4","Tcaron":"\u0164","tcaron":"\u0165","Tcedil":"\u0162","tcedil":"\u0163","Tcy":"\u0422","tcy":"\u0442","tdot":"\u20DB","telrec":"\u2315","Tfr":"\uD835\uDD17","tfr":"\uD835\uDD31","there4":"\u2234","therefore":"\u2234","Therefore":"\u2234","Theta":"\u0398","theta":"\u03B8","thetasym":"\u03D1","thetav":"\u03D1","thickapprox":"\u2248","thicksim":"\u223C","ThickSpace":"\u205F\u200A","ThinSpace":"\u2009","thinsp":"\u2009","thkap":"\u2248","thksim":"\u223C","THORN":"\u00DE","thorn":"\u00FE","tilde":"\u02DC","Tilde":"\u223C","TildeEqual":"\u2243","TildeFullEqual":"\u2245","TildeTilde":"\u2248","timesbar":"\u2A31","timesb":"\u22A0","times":"\u00D7","timesd":"\u2A30","tint":"\u222D","toea":"\u2928","topbot":"\u2336","topcir":"\u2AF1","top":"\u22A4","Topf":"\uD835\uDD4B","topf":"\uD835\uDD65","topfork":"\u2ADA","tosa":"\u2929","tprime":"\u2034","trade":"\u2122","TRADE":"\u2122","triangle":"\u25B5","triangledown":"\u25BF","triangleleft":"\u25C3","trianglelefteq":"\u22B4","triangleq":"\u225C","triangleright":"\u25B9","trianglerighteq":"\u22B5","tridot":"\u25EC","trie":"\u225C","triminus":"\u2A3A","TripleDot":"\u20DB","triplus":"\u2A39","trisb":"\u29CD","tritime":"\u2A3B","trpezium":"\u23E2","Tscr":"\uD835\uDCAF","tscr":"\uD835\uDCC9","TScy":"\u0426","tscy":"\u0446","TSHcy":"\u040B","tshcy":"\u045B","Tstrok":"\u0166","tstrok":"\u0167","twixt":"\u226C","twoheadleftarrow":"\u219E","twoheadrightarrow":"\u21A0","Uacute":"\u00DA","uacute":"\u00FA","uarr":"\u2191","Uarr":"\u219F","uArr":"\u21D1","Uarrocir":"\u2949","Ubrcy":"\u040E","ubrcy":"\u045E","Ubreve":"\u016C","ubreve":"\u016D","Ucirc":"\u00DB","ucirc":"\u00FB","Ucy":"\u0423","ucy":"\u0443","udarr":"\u21C5","Udblac":"\u0170","udblac":"\u0171","udhar":"\u296E","ufisht":"\u297E","Ufr":"\uD835\uDD18","ufr":"\uD835\uDD32","Ugrave":"\u00D9","ugrave":"\u00F9","uHar":"\u2963","uharl":"\u21BF","uharr":"\u21BE","uhblk":"\u2580","ulcorn":"\u231C","ulcorner":"\u231C","ulcrop":"\u230F","ultri":"\u25F8","Umacr":"\u016A","umacr":"\u016B","uml":"\u00A8","UnderBar":"_","UnderBrace":"\u23DF","UnderBracket":"\u23B5","UnderParenthesis":"\u23DD","Union":"\u22C3","UnionPlus":"\u228E","Uogon":"\u0172","uogon":"\u0173","Uopf":"\uD835\uDD4C","uopf":"\uD835\uDD66","UpArrowBar":"\u2912","uparrow":"\u2191","UpArrow":"\u2191","Uparrow":"\u21D1","UpArrowDownArrow":"\u21C5","updownarrow":"\u2195","UpDownArrow":"\u2195","Updownarrow":"\u21D5","UpEquilibrium":"\u296E","upharpoonleft":"\u21BF","upharpoonright":"\u21BE","uplus":"\u228E","UpperLeftArrow":"\u2196","UpperRightArrow":"\u2197","upsi":"\u03C5","Upsi":"\u03D2","upsih":"\u03D2","Upsilon":"\u03A5","upsilon":"\u03C5","UpTeeArrow":"\u21A5","UpTee":"\u22A5","upuparrows":"\u21C8","urcorn":"\u231D","urcorner":"\u231D","urcrop":"\u230E","Uring":"\u016E","uring":"\u016F","urtri":"\u25F9","Uscr":"\uD835\uDCB0","uscr":"\uD835\uDCCA","utdot":"\u22F0","Utilde":"\u0168","utilde":"\u0169","utri":"\u25B5","utrif":"\u25B4","uuarr":"\u21C8","Uuml":"\u00DC","uuml":"\u00FC","uwangle":"\u29A7","vangrt":"\u299C","varepsilon":"\u03F5","varkappa":"\u03F0","varnothing":"\u2205","varphi":"\u03D5","varpi":"\u03D6","varpropto":"\u221D","varr":"\u2195","vArr":"\u21D5","varrho":"\u03F1","varsigma":"\u03C2","varsubsetneq":"\u228A\uFE00","varsubsetneqq":"\u2ACB\uFE00","varsupsetneq":"\u228B\uFE00","varsupsetneqq":"\u2ACC\uFE00","vartheta":"\u03D1","vartriangleleft":"\u22B2","vartriangleright":"\u22B3","vBar":"\u2AE8","Vbar":"\u2AEB","vBarv":"\u2AE9","Vcy":"\u0412","vcy":"\u0432","vdash":"\u22A2","vDash":"\u22A8","Vdash":"\u22A9","VDash":"\u22AB","Vdashl":"\u2AE6","veebar":"\u22BB","vee":"\u2228","Vee":"\u22C1","veeeq":"\u225A","vellip":"\u22EE","verbar":"|","Verbar":"\u2016","vert":"|","Vert":"\u2016","VerticalBar":"\u2223","VerticalLine":"|","VerticalSeparator":"\u2758","VerticalTilde":"\u2240","VeryThinSpace":"\u200A","Vfr":"\uD835\uDD19","vfr":"\uD835\uDD33","vltri":"\u22B2","vnsub":"\u2282\u20D2","vnsup":"\u2283\u20D2","Vopf":"\uD835\uDD4D","vopf":"\uD835\uDD67","vprop":"\u221D","vrtri":"\u22B3","Vscr":"\uD835\uDCB1","vscr":"\uD835\uDCCB","vsubnE":"\u2ACB\uFE00","vsubne":"\u228A\uFE00","vsupnE":"\u2ACC\uFE00","vsupne":"\u228B\uFE00","Vvdash":"\u22AA","vzigzag":"\u299A","Wcirc":"\u0174","wcirc":"\u0175","wedbar":"\u2A5F","wedge":"\u2227","Wedge":"\u22C0","wedgeq":"\u2259","weierp":"\u2118","Wfr":"\uD835\uDD1A","wfr":"\uD835\uDD34","Wopf":"\uD835\uDD4E","wopf":"\uD835\uDD68","wp":"\u2118","wr":"\u2240","wreath":"\u2240","Wscr":"\uD835\uDCB2","wscr":"\uD835\uDCCC","xcap":"\u22C2","xcirc":"\u25EF","xcup":"\u22C3","xdtri":"\u25BD","Xfr":"\uD835\uDD1B","xfr":"\uD835\uDD35","xharr":"\u27F7","xhArr":"\u27FA","Xi":"\u039E","xi":"\u03BE","xlarr":"\u27F5","xlArr":"\u27F8","xmap":"\u27FC","xnis":"\u22FB","xodot":"\u2A00","Xopf":"\uD835\uDD4F","xopf":"\uD835\uDD69","xoplus":"\u2A01","xotime":"\u2A02","xrarr":"\u27F6","xrArr":"\u27F9","Xscr":"\uD835\uDCB3","xscr":"\uD835\uDCCD","xsqcup":"\u2A06","xuplus":"\u2A04","xutri":"\u25B3","xvee":"\u22C1","xwedge":"\u22C0","Yacute":"\u00DD","yacute":"\u00FD","YAcy":"\u042F","yacy":"\u044F","Ycirc":"\u0176","ycirc":"\u0177","Ycy":"\u042B","ycy":"\u044B","yen":"\u00A5","Yfr":"\uD835\uDD1C","yfr":"\uD835\uDD36","YIcy":"\u0407","yicy":"\u0457","Yopf":"\uD835\uDD50","yopf":"\uD835\uDD6A","Yscr":"\uD835\uDCB4","yscr":"\uD835\uDCCE","YUcy":"\u042E","yucy":"\u044E","yuml":"\u00FF","Yuml":"\u0178","Zacute":"\u0179","zacute":"\u017A","Zcaron":"\u017D","zcaron":"\u017E","Zcy":"\u0417","zcy":"\u0437","Zdot":"\u017B","zdot":"\u017C","zeetrf":"\u2128","ZeroWidthSpace":"\u200B","Zeta":"\u0396","zeta":"\u03B6","zfr":"\uD835\uDD37","Zfr":"\u2128","ZHcy":"\u0416","zhcy":"\u0436","zigrarr":"\u21DD","zopf":"\uD835\uDD6B","Zopf":"\u2124","Zscr":"\uD835\uDCB5","zscr":"\uD835\uDCCF","zwj":"\u200D","zwnj":"\u200C"}
},{}],5:[function(require,module,exports){
'use strict';


////////////////////////////////////////////////////////////////////////////////
// Helpers

// Merge objects
//
function assign(obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);

  sources.forEach(function (source) {
    if (!source) { return; }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });

  return obj;
}

function _class(obj) { return Object.prototype.toString.call(obj); }
function isString(obj) { return _class(obj) === '[object String]'; }
function isObject(obj) { return _class(obj) === '[object Object]'; }
function isRegExp(obj) { return _class(obj) === '[object RegExp]'; }
function isFunction(obj) { return _class(obj) === '[object Function]'; }


function escapeRE(str) { return str.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'); }

////////////////////////////////////////////////////////////////////////////////


var defaultOptions = {
  fuzzyLink: true,
  fuzzyEmail: true,
  fuzzyIP: false
};


function isOptionsObj(obj) {
  return Object.keys(obj || {}).reduce(function (acc, k) {
    return acc || defaultOptions.hasOwnProperty(k);
  }, false);
}


var defaultSchemas = {
  'http:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.http) {
        // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.http =  new RegExp(
          '^\\/\\/' + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path, 'i'
        );
      }
      if (self.re.http.test(tail)) {
        return tail.match(self.re.http)[0].length;
      }
      return 0;
    }
  },
  'https:':  'http:',
  'ftp:':    'http:',
  '//':      {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.no_http) {
      // compile lazily, because "host"-containing variables can change on tlds update.
        self.re.no_http =  new RegExp(
          '^' +
          self.re.src_auth +
          // Don't allow single-level domains, because of false positives like '//test'
          // with code comments
          '(?:localhost|(?:(?:' + self.re.src_domain + ')\\.)+' + self.re.src_domain_root + ')' +
          self.re.src_port +
          self.re.src_host_terminator +
          self.re.src_path,

          'i'
        );
      }

      if (self.re.no_http.test(tail)) {
        // should not be `://` & `///`, that protects from errors in protocol name
        if (pos >= 3 && text[pos - 3] === ':') { return 0; }
        if (pos >= 3 && text[pos - 3] === '/') { return 0; }
        return tail.match(self.re.no_http)[0].length;
      }
      return 0;
    }
  },
  'mailto:': {
    validate: function (text, pos, self) {
      var tail = text.slice(pos);

      if (!self.re.mailto) {
        self.re.mailto =  new RegExp(
          '^' + self.re.src_email_name + '@' + self.re.src_host_strict, 'i'
        );
      }
      if (self.re.mailto.test(tail)) {
        return tail.match(self.re.mailto)[0].length;
      }
      return 0;
    }
  }
};

/*eslint-disable max-len*/

// RE pattern for 2-character tlds (autogenerated by ./support/tlds_2char_gen.js)
var tlds_2ch_src_re = 'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]';

// DON'T try to make PRs with changes. Extend TLDs with LinkifyIt.tlds() instead
var tlds_default = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф'.split('|');

/*eslint-enable max-len*/

////////////////////////////////////////////////////////////////////////////////

function resetScanCache(self) {
  self.__index__ = -1;
  self.__text_cache__   = '';
}

function createValidator(re) {
  return function (text, pos) {
    var tail = text.slice(pos);

    if (re.test(tail)) {
      return tail.match(re)[0].length;
    }
    return 0;
  };
}

function createNormalizer() {
  return function (match, self) {
    self.normalize(match);
  };
}

// Schemas compiler. Build regexps.
//
function compile(self) {

  // Load & clone RE patterns.
  var re = self.re = require('./lib/re')(self.__opts__);

  // Define dynamic patterns
  var tlds = self.__tlds__.slice();

  self.onCompile();

  if (!self.__tlds_replaced__) {
    tlds.push(tlds_2ch_src_re);
  }
  tlds.push(re.src_xn);

  re.src_tlds = tlds.join('|');

  function untpl(tpl) { return tpl.replace('%TLDS%', re.src_tlds); }

  re.email_fuzzy      = RegExp(untpl(re.tpl_email_fuzzy), 'i');
  re.link_fuzzy       = RegExp(untpl(re.tpl_link_fuzzy), 'i');
  re.link_no_ip_fuzzy = RegExp(untpl(re.tpl_link_no_ip_fuzzy), 'i');
  re.host_fuzzy_test  = RegExp(untpl(re.tpl_host_fuzzy_test), 'i');

  //
  // Compile each schema
  //

  var aliases = [];

  self.__compiled__ = {}; // Reset compiled data

  function schemaError(name, val) {
    throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
  }

  Object.keys(self.__schemas__).forEach(function (name) {
    var val = self.__schemas__[name];

    // skip disabled methods
    if (val === null) { return; }

    var compiled = { validate: null, link: null };

    self.__compiled__[name] = compiled;

    if (isObject(val)) {
      if (isRegExp(val.validate)) {
        compiled.validate = createValidator(val.validate);
      } else if (isFunction(val.validate)) {
        compiled.validate = val.validate;
      } else {
        schemaError(name, val);
      }

      if (isFunction(val.normalize)) {
        compiled.normalize = val.normalize;
      } else if (!val.normalize) {
        compiled.normalize = createNormalizer();
      } else {
        schemaError(name, val);
      }

      return;
    }

    if (isString(val)) {
      aliases.push(name);
      return;
    }

    schemaError(name, val);
  });

  //
  // Compile postponed aliases
  //

  aliases.forEach(function (alias) {
    if (!self.__compiled__[self.__schemas__[alias]]) {
      // Silently fail on missed schemas to avoid errons on disable.
      // schemaError(alias, self.__schemas__[alias]);
      return;
    }

    self.__compiled__[alias].validate =
      self.__compiled__[self.__schemas__[alias]].validate;
    self.__compiled__[alias].normalize =
      self.__compiled__[self.__schemas__[alias]].normalize;
  });

  //
  // Fake record for guessed links
  //
  self.__compiled__[''] = { validate: null, normalize: createNormalizer() };

  //
  // Build schema condition
  //
  var slist = Object.keys(self.__compiled__)
                      .filter(function (name) {
                        // Filter disabled & fake schemas
                        return name.length > 0 && self.__compiled__[name];
                      })
                      .map(escapeRE)
                      .join('|');
  // (?!_) cause 1.5x slowdown
  self.re.schema_test   = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'i');
  self.re.schema_search = RegExp('(^|(?!_)(?:[><\uff5c]|' + re.src_ZPCc + '))(' + slist + ')', 'ig');

  self.re.pretest       = RegExp(
                            '(' + self.re.schema_test.source + ')|' +
                            '(' + self.re.host_fuzzy_test.source + ')|' +
                            '@',
                            'i');

  //
  // Cleanup
  //

  resetScanCache(self);
}

/**
 * class Match
 *
 * Match result. Single element of array, returned by [[LinkifyIt#match]]
 **/
function Match(self, shift) {
  var start = self.__index__,
      end   = self.__last_index__,
      text  = self.__text_cache__.slice(start, end);

  /**
   * Match#schema -> String
   *
   * Prefix (protocol) for matched string.
   **/
  this.schema    = self.__schema__.toLowerCase();
  /**
   * Match#index -> Number
   *
   * First position of matched string.
   **/
  this.index     = start + shift;
  /**
   * Match#lastIndex -> Number
   *
   * Next position after matched string.
   **/
  this.lastIndex = end + shift;
  /**
   * Match#raw -> String
   *
   * Matched string.
   **/
  this.raw       = text;
  /**
   * Match#text -> String
   *
   * Notmalized text of matched string.
   **/
  this.text      = text;
  /**
   * Match#url -> String
   *
   * Normalized url of matched string.
   **/
  this.url       = text;
}

function createMatch(self, shift) {
  var match = new Match(self, shift);

  self.__compiled__[match.schema].normalize(match, self);

  return match;
}


/**
 * class LinkifyIt
 **/

/**
 * new LinkifyIt(schemas, options)
 * - schemas (Object): Optional. Additional schemas to validate (prefix/validator)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Creates new linkifier instance with optional additional schemas.
 * Can be called without `new` keyword for convenience.
 *
 * By default understands:
 *
 * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
 * - "fuzzy" links and emails (example.com, foo@bar.com).
 *
 * `schemas` is an object, where each key/value describes protocol/rule:
 *
 * - __key__ - link prefix (usually, protocol name with `:` at the end, `skype:`
 *   for example). `linkify-it` makes shure that prefix is not preceeded with
 *   alphanumeric char and symbols. Only whitespaces and punctuation allowed.
 * - __value__ - rule to check tail after link prefix
 *   - _String_ - just alias to existing rule
 *   - _Object_
 *     - _validate_ - validator function (should return matched length on success),
 *       or `RegExp`.
 *     - _normalize_ - optional function to normalize text & url of matched result
 *       (for example, for @twitter mentions).
 *
 * `options`:
 *
 * - __fuzzyLink__ - recognige URL-s without `http(s):` prefix. Default `true`.
 * - __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
 *   like version numbers. Default `false`.
 * - __fuzzyEmail__ - recognize emails without `mailto:` prefix.
 *
 **/
function LinkifyIt(schemas, options) {
  if (!(this instanceof LinkifyIt)) {
    return new LinkifyIt(schemas, options);
  }

  if (!options) {
    if (isOptionsObj(schemas)) {
      options = schemas;
      schemas = {};
    }
  }

  this.__opts__           = assign({}, defaultOptions, options);

  // Cache last tested result. Used to skip repeating steps on next `match` call.
  this.__index__          = -1;
  this.__last_index__     = -1; // Next scan position
  this.__schema__         = '';
  this.__text_cache__     = '';

  this.__schemas__        = assign({}, defaultSchemas, schemas);
  this.__compiled__       = {};

  this.__tlds__           = tlds_default;
  this.__tlds_replaced__  = false;

  this.re = {};

  compile(this);
}


/** chainable
 * LinkifyIt#add(schema, definition)
 * - schema (String): rule name (fixed pattern prefix)
 * - definition (String|RegExp|Object): schema definition
 *
 * Add new rule definition. See constructor description for details.
 **/
LinkifyIt.prototype.add = function add(schema, definition) {
  this.__schemas__[schema] = definition;
  compile(this);
  return this;
};


/** chainable
 * LinkifyIt#set(options)
 * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
 *
 * Set recognition options for links without schema.
 **/
LinkifyIt.prototype.set = function set(options) {
  this.__opts__ = assign(this.__opts__, options);
  return this;
};


/**
 * LinkifyIt#test(text) -> Boolean
 *
 * Searches linkifiable pattern and returns `true` on success or `false` on fail.
 **/
LinkifyIt.prototype.test = function test(text) {
  // Reset scan cache
  this.__text_cache__ = text;
  this.__index__      = -1;

  if (!text.length) { return false; }

  var m, ml, me, len, shift, next, re, tld_pos, at_pos;

  // try to scan for link with schema - that's the most simple rule
  if (this.re.schema_test.test(text)) {
    re = this.re.schema_search;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      len = this.testSchemaAt(text, m[2], re.lastIndex);
      if (len) {
        this.__schema__     = m[2];
        this.__index__      = m.index + m[1].length;
        this.__last_index__ = m.index + m[0].length + len;
        break;
      }
    }
  }

  if (this.__opts__.fuzzyLink && this.__compiled__['http:']) {
    // guess schemaless links
    tld_pos = text.search(this.re.host_fuzzy_test);
    if (tld_pos >= 0) {
      // if tld is located after found link - no need to check fuzzy pattern
      if (this.__index__ < 0 || tld_pos < this.__index__) {
        if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {

          shift = ml.index + ml[1].length;

          if (this.__index__ < 0 || shift < this.__index__) {
            this.__schema__     = '';
            this.__index__      = shift;
            this.__last_index__ = ml.index + ml[0].length;
          }
        }
      }
    }
  }

  if (this.__opts__.fuzzyEmail && this.__compiled__['mailto:']) {
    // guess schemaless emails
    at_pos = text.indexOf('@');
    if (at_pos >= 0) {
      // We can't skip this check, because this cases are possible:
      // 192.168.1.1@gmail.com, my.in@example.com
      if ((me = text.match(this.re.email_fuzzy)) !== null) {

        shift = me.index + me[1].length;
        next  = me.index + me[0].length;

        if (this.__index__ < 0 || shift < this.__index__ ||
            (shift === this.__index__ && next > this.__last_index__)) {
          this.__schema__     = 'mailto:';
          this.__index__      = shift;
          this.__last_index__ = next;
        }
      }
    }
  }

  return this.__index__ >= 0;
};


/**
 * LinkifyIt#pretest(text) -> Boolean
 *
 * Very quick check, that can give false positives. Returns true if link MAY BE
 * can exists. Can be used for speed optimization, when you need to check that
 * link NOT exists.
 **/
LinkifyIt.prototype.pretest = function pretest(text) {
  return this.re.pretest.test(text);
};


/**
 * LinkifyIt#testSchemaAt(text, name, position) -> Number
 * - text (String): text to scan
 * - name (String): rule (schema) name
 * - position (Number): text offset to check from
 *
 * Similar to [[LinkifyIt#test]] but checks only specific protocol tail exactly
 * at given position. Returns length of found pattern (0 on fail).
 **/
LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
  // If not supported schema check requested - terminate
  if (!this.__compiled__[schema.toLowerCase()]) {
    return 0;
  }
  return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
};


/**
 * LinkifyIt#match(text) -> Array|null
 *
 * Returns array of found link descriptions or `null` on fail. We strongly
 * recommend to use [[LinkifyIt#test]] first, for best speed.
 *
 * ##### Result match description
 *
 * - __schema__ - link schema, can be empty for fuzzy links, or `//` for
 *   protocol-neutral  links.
 * - __index__ - offset of matched text
 * - __lastIndex__ - index of next char after mathch end
 * - __raw__ - matched text
 * - __text__ - normalized text
 * - __url__ - link, generated from matched text
 **/
LinkifyIt.prototype.match = function match(text) {
  var shift = 0, result = [];

  // Try to take previous element from cache, if .test() called before
  if (this.__index__ >= 0 && this.__text_cache__ === text) {
    result.push(createMatch(this, shift));
    shift = this.__last_index__;
  }

  // Cut head if cache was used
  var tail = shift ? text.slice(shift) : text;

  // Scan string until end reached
  while (this.test(tail)) {
    result.push(createMatch(this, shift));

    tail = tail.slice(this.__last_index__);
    shift += this.__last_index__;
  }

  if (result.length) {
    return result;
  }

  return null;
};


/** chainable
 * LinkifyIt#tlds(list [, keepOld]) -> this
 * - list (Array): list of tlds
 * - keepOld (Boolean): merge with current list if `true` (`false` by default)
 *
 * Load (or merge) new tlds list. Those are user for fuzzy links (without prefix)
 * to avoid false positives. By default this algorythm used:
 *
 * - hostname with any 2-letter root zones are ok.
 * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
 *   are ok.
 * - encoded (`xn--...`) root zones are ok.
 *
 * If list is replaced, then exact match for 2-chars root zones will be checked.
 **/
LinkifyIt.prototype.tlds = function tlds(list, keepOld) {
  list = Array.isArray(list) ? list : [ list ];

  if (!keepOld) {
    this.__tlds__ = list.slice();
    this.__tlds_replaced__ = true;
    compile(this);
    return this;
  }

  this.__tlds__ = this.__tlds__.concat(list)
                                  .sort()
                                  .filter(function (el, idx, arr) {
                                    return el !== arr[idx - 1];
                                  })
                                  .reverse();

  compile(this);
  return this;
};

/**
 * LinkifyIt#normalize(match)
 *
 * Default normalizer (if schema does not define it's own).
 **/
LinkifyIt.prototype.normalize = function normalize(match) {

  // Do minimal possible changes by default. Need to collect feedback prior
  // to move forward https://github.com/markdown-it/linkify-it/issues/1

  if (!match.schema) { match.url = 'http://' + match.url; }

  if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
    match.url = 'mailto:' + match.url;
  }
};


/**
 * LinkifyIt#onCompile()
 *
 * Override to modify basic RegExp-s.
 **/
LinkifyIt.prototype.onCompile = function onCompile() {
};


module.exports = LinkifyIt;

},{"./lib/re":6}],6:[function(require,module,exports){
'use strict';


module.exports = function (opts) {
  var re = {};

  // Use direct extract instead of `regenerate` to reduse browserified size
  re.src_Any = require('uc.micro/properties/Any/regex').source;
  re.src_Cc  = require('uc.micro/categories/Cc/regex').source;
  re.src_Z   = require('uc.micro/categories/Z/regex').source;
  re.src_P   = require('uc.micro/categories/P/regex').source;

  // \p{\Z\P\Cc\CF} (white spaces + control + format + punctuation)
  re.src_ZPCc = [ re.src_Z, re.src_P, re.src_Cc ].join('|');

  // \p{\Z\Cc} (white spaces + control)
  re.src_ZCc = [ re.src_Z, re.src_Cc ].join('|');

  // Experimental. List of chars, completely prohibited in links
  // because can separate it from other part of text
  var text_separators = '[><\uff5c]';

  // All possible word characters (everything without punctuation, spaces & controls)
  // Defined via punctuation & spaces to save space
  // Should be something like \p{\L\N\S\M} (\w but without `_`)
  re.src_pseudo_letter       = '(?:(?!' + text_separators + '|' + re.src_ZPCc + ')' + re.src_Any + ')';
  // The same as abothe but without [0-9]
  // var src_pseudo_letter_non_d = '(?:(?![0-9]|' + src_ZPCc + ')' + src_Any + ')';

  ////////////////////////////////////////////////////////////////////////////////

  re.src_ip4 =

    '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';

  // Prohibit any of "@/[]()" in user/pass to avoid wrong domain fetch.
  re.src_auth    = '(?:(?:(?!' + re.src_ZCc + '|[@/\\[\\]()]).)+@)?';

  re.src_port =

    '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?';

  re.src_host_terminator =

    '(?=$|' + text_separators + '|' + re.src_ZPCc + ')(?!-|_|:\\d|\\.-|\\.(?!$|' + re.src_ZPCc + '))';

  re.src_path =

    '(?:' +
      '[/?#]' +
        '(?:' +
          '(?!' + re.src_ZCc + '|' + text_separators + '|[()[\\]{}.,"\'?!\\-]).|' +
          '\\[(?:(?!' + re.src_ZCc + '|\\]).)*\\]|' +
          '\\((?:(?!' + re.src_ZCc + '|[)]).)*\\)|' +
          '\\{(?:(?!' + re.src_ZCc + '|[}]).)*\\}|' +
          '\\"(?:(?!' + re.src_ZCc + '|["]).)+\\"|' +
          "\\'(?:(?!" + re.src_ZCc + "|[']).)+\\'|" +
          "\\'(?=" + re.src_pseudo_letter + '|[-]).|' +  // allow `I'm_king` if no pair found
          '\\.{2,3}[a-zA-Z0-9%/]|' + // github has ... in commit range links. Restrict to
                                     // - english
                                     // - percent-encoded
                                     // - parts of file path
                                     // until more examples found.
          '\\.(?!' + re.src_ZCc + '|[.]).|' +
          (opts && opts['---'] ?
            '\\-(?!--(?:[^-]|$))(?:-*)|' // `---` => long dash, terminate
          :
            '\\-+|'
          ) +
          '\\,(?!' + re.src_ZCc + ').|' +      // allow `,,,` in paths
          '\\!(?!' + re.src_ZCc + '|[!]).|' +
          '\\?(?!' + re.src_ZCc + '|[?]).' +
        ')+' +
      '|\\/' +
    ')?';

  re.src_email_name =

    '[\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]+';

  re.src_xn =

    'xn--[a-z0-9\\-]{1,59}';

  // More to read about domain names
  // http://serverfault.com/questions/638260/

  re.src_domain_root =

    // Allow letters & digits (http://test1)
    '(?:' +
      re.src_xn +
      '|' +
      re.src_pseudo_letter + '{1,63}' +
    ')';

  re.src_domain =

    '(?:' +
      re.src_xn +
      '|' +
      '(?:' + re.src_pseudo_letter + ')' +
      '|' +
      // don't allow `--` in domain names, because:
      // - that can conflict with markdown &mdash; / &ndash;
      // - nobody use those anyway
      '(?:' + re.src_pseudo_letter + '(?:-(?!-)|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' +
    ')';

  re.src_host =

    '(?:' +
    // Don't need IP check, because digits are already allowed in normal domain names
    //   src_ip4 +
    // '|' +
      '(?:(?:(?:' + re.src_domain + ')\\.)*' + re.src_domain/*_root*/ + ')' +
    ')';

  re.tpl_host_fuzzy =

    '(?:' +
      re.src_ip4 +
    '|' +
      '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))' +
    ')';

  re.tpl_host_no_ip_fuzzy =

    '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))';

  re.src_host_strict =

    re.src_host + re.src_host_terminator;

  re.tpl_host_fuzzy_strict =

    re.tpl_host_fuzzy + re.src_host_terminator;

  re.src_host_port_strict =

    re.src_host + re.src_port + re.src_host_terminator;

  re.tpl_host_port_fuzzy_strict =

    re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;

  re.tpl_host_port_no_ip_fuzzy_strict =

    re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;


  ////////////////////////////////////////////////////////////////////////////////
  // Main rules

  // Rude test fuzzy links by host, for quick deny
  re.tpl_host_fuzzy_test =

    'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + re.src_ZPCc + '|>|$))';

  re.tpl_email_fuzzy =

      '(^|' + text_separators + '|\\(|' + re.src_ZCc + ')(' + re.src_email_name + '@' + re.tpl_host_fuzzy_strict + ')';

  re.tpl_link_fuzzy =
      // Fuzzy link can't be prepended with .:/\- and non punctuation.
      // but can start with > (markdown blockquote)
      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_fuzzy_strict + re.src_path + ')';

  re.tpl_link_no_ip_fuzzy =
      // Fuzzy link can't be prepended with .:/\- and non punctuation.
      // but can start with > (markdown blockquote)
      '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
      '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ')';

  return re;
};

},{"uc.micro/categories/Cc/regex":64,"uc.micro/categories/P/regex":66,"uc.micro/categories/Z/regex":67,"uc.micro/properties/Any/regex":69}],7:[function(require,module,exports){
'use strict';


module.exports = require('./lib/');

},{"./lib/":16}],8:[function(require,module,exports){
// HTML5 entities map: { name -> utf16string }
//
'use strict';

/*eslint quotes:0*/
module.exports = require('entities/maps/entities.json');

},{"entities/maps/entities.json":4}],9:[function(require,module,exports){
// List of valid html blocks names, accorting to commonmark spec
// http://jgm.github.io/CommonMark/spec.html#html-blocks

'use strict';


module.exports = [
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'meta',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'section',
  'source',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul'
];

},{}],10:[function(require,module,exports){
// Regexps to match html elements

'use strict';

var attr_name     = '[a-zA-Z_:][a-zA-Z0-9:._-]*';

var unquoted      = '[^"\'=<>`\\x00-\\x20]+';
var single_quoted = "'[^']*'";
var double_quoted = '"[^"]*"';

var attr_value  = '(?:' + unquoted + '|' + single_quoted + '|' + double_quoted + ')';

var attribute   = '(?:\\s+' + attr_name + '(?:\\s*=\\s*' + attr_value + ')?)';

var open_tag    = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>';

var close_tag   = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>';
var comment     = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
var processing  = '<[?].*?[?]>';
var declaration = '<![A-Z]+\\s+[^>]*>';
var cdata       = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';

var HTML_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + '|' + comment +
                        '|' + processing + '|' + declaration + '|' + cdata + ')');
var HTML_OPEN_CLOSE_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + ')');

module.exports.HTML_TAG_RE = HTML_TAG_RE;
module.exports.HTML_OPEN_CLOSE_TAG_RE = HTML_OPEN_CLOSE_TAG_RE;

},{}],11:[function(require,module,exports){
// Utilities
//
'use strict';


function _class(obj) { return Object.prototype.toString.call(obj); }

function isString(obj) { return _class(obj) === '[object String]'; }

var _hasOwnProperty = Object.prototype.hasOwnProperty;

function has(object, key) {
  return _hasOwnProperty.call(object, key);
}

// Merge objects
//
function assign(obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);

  sources.forEach(function (source) {
    if (!source) { return; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be object');
    }

    Object.keys(source).forEach(function (key) {
      obj[key] = source[key];
    });
  });

  return obj;
}

// Remove element from array and put another array at those position.
// Useful for some operations with tokens
function arrayReplaceAt(src, pos, newElements) {
  return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
}

////////////////////////////////////////////////////////////////////////////////

function isValidEntityCode(c) {
  /*eslint no-bitwise:0*/
  // broken sequence
  if (c >= 0xD800 && c <= 0xDFFF) { return false; }
  // never used
  if (c >= 0xFDD0 && c <= 0xFDEF) { return false; }
  if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) { return false; }
  // control codes
  if (c >= 0x00 && c <= 0x08) { return false; }
  if (c === 0x0B) { return false; }
  if (c >= 0x0E && c <= 0x1F) { return false; }
  if (c >= 0x7F && c <= 0x9F) { return false; }
  // out of range
  if (c > 0x10FFFF) { return false; }
  return true;
}

function fromCodePoint(c) {
  /*eslint no-bitwise:0*/
  if (c > 0xffff) {
    c -= 0x10000;
    var surrogate1 = 0xd800 + (c >> 10),
        surrogate2 = 0xdc00 + (c & 0x3ff);

    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(c);
}


var UNESCAPE_MD_RE  = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g;
var ENTITY_RE       = /&([a-z#][a-z0-9]{1,31});/gi;
var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + '|' + ENTITY_RE.source, 'gi');

var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i;

var entities = require('./entities');

function replaceEntityPattern(match, name) {
  var code = 0;

  if (has(entities, name)) {
    return entities[name];
  }

  if (name.charCodeAt(0) === 0x23/* # */ && DIGITAL_ENTITY_TEST_RE.test(name)) {
    code = name[1].toLowerCase() === 'x' ?
      parseInt(name.slice(2), 16)
    :
      parseInt(name.slice(1), 10);
    if (isValidEntityCode(code)) {
      return fromCodePoint(code);
    }
  }

  return match;
}

/*function replaceEntities(str) {
  if (str.indexOf('&') < 0) { return str; }

  return str.replace(ENTITY_RE, replaceEntityPattern);
}*/

function unescapeMd(str) {
  if (str.indexOf('\\') < 0) { return str; }
  return str.replace(UNESCAPE_MD_RE, '$1');
}

function unescapeAll(str) {
  if (str.indexOf('\\') < 0 && str.indexOf('&') < 0) { return str; }

  return str.replace(UNESCAPE_ALL_RE, function (match, escaped, entity) {
    if (escaped) { return escaped; }
    return replaceEntityPattern(match, entity);
  });
}

////////////////////////////////////////////////////////////////////////////////

var HTML_ESCAPE_TEST_RE = /[&<>"]/;
var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
var HTML_REPLACEMENTS = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};

function replaceUnsafeChar(ch) {
  return HTML_REPLACEMENTS[ch];
}

function escapeHtml(str) {
  if (HTML_ESCAPE_TEST_RE.test(str)) {
    return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
  }
  return str;
}

////////////////////////////////////////////////////////////////////////////////

var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;

function escapeRE(str) {
  return str.replace(REGEXP_ESCAPE_RE, '\\$&');
}

////////////////////////////////////////////////////////////////////////////////

function isSpace(code) {
  switch (code) {
    case 0x09:
    case 0x20:
      return true;
  }
  return false;
}

// Zs (unicode class) || [\t\f\v\r\n]
function isWhiteSpace(code) {
  if (code >= 0x2000 && code <= 0x200A) { return true; }
  switch (code) {
    case 0x09: // \t
    case 0x0A: // \n
    case 0x0B: // \v
    case 0x0C: // \f
    case 0x0D: // \r
    case 0x20:
    case 0xA0:
    case 0x1680:
    case 0x202F:
    case 0x205F:
    case 0x3000:
      return true;
  }
  return false;
}

////////////////////////////////////////////////////////////////////////////////

/*eslint-disable max-len*/
var UNICODE_PUNCT_RE = require('uc.micro/categories/P/regex');

// Currently without astral characters support.
function isPunctChar(ch) {
  return UNICODE_PUNCT_RE.test(ch);
}


// Markdown ASCII punctuation characters.
//
// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
// http://spec.commonmark.org/0.15/#ascii-punctuation-character
//
// Don't confuse with unicode punctuation !!! It lacks some chars in ascii range.
//
function isMdAsciiPunct(ch) {
  switch (ch) {
    case 0x21/* ! */:
    case 0x22/* " */:
    case 0x23/* # */:
    case 0x24/* $ */:
    case 0x25/* % */:
    case 0x26/* & */:
    case 0x27/* ' */:
    case 0x28/* ( */:
    case 0x29/* ) */:
    case 0x2A/* * */:
    case 0x2B/* + */:
    case 0x2C/* , */:
    case 0x2D/* - */:
    case 0x2E/* . */:
    case 0x2F/* / */:
    case 0x3A/* : */:
    case 0x3B/* ; */:
    case 0x3C/* < */:
    case 0x3D/* = */:
    case 0x3E/* > */:
    case 0x3F/* ? */:
    case 0x40/* @ */:
    case 0x5B/* [ */:
    case 0x5C/* \ */:
    case 0x5D/* ] */:
    case 0x5E/* ^ */:
    case 0x5F/* _ */:
    case 0x60/* ` */:
    case 0x7B/* { */:
    case 0x7C/* | */:
    case 0x7D/* } */:
    case 0x7E/* ~ */:
      return true;
    default:
      return false;
  }
}

// Hepler to unify [reference labels].
//
function normalizeReference(str) {
  // use .toUpperCase() instead of .toLowerCase()
  // here to avoid a conflict with Object.prototype
  // members (most notably, `__proto__`)
  return str.trim().replace(/\s+/g, ' ').toUpperCase();
}

////////////////////////////////////////////////////////////////////////////////

// Re-export libraries commonly used in both markdown-it and its plugins,
// so plugins won't have to depend on them explicitly, which reduces their
// bundled size (e.g. a browser build).
//
exports.lib                 = {};
exports.lib.mdurl           = require('mdurl');
exports.lib.ucmicro         = require('uc.micro');

exports.assign              = assign;
exports.isString            = isString;
exports.has                 = has;
exports.unescapeMd          = unescapeMd;
exports.unescapeAll         = unescapeAll;
exports.isValidEntityCode   = isValidEntityCode;
exports.fromCodePoint       = fromCodePoint;
// exports.replaceEntities     = replaceEntities;
exports.escapeHtml          = escapeHtml;
exports.arrayReplaceAt      = arrayReplaceAt;
exports.isSpace             = isSpace;
exports.isWhiteSpace        = isWhiteSpace;
exports.isMdAsciiPunct      = isMdAsciiPunct;
exports.isPunctChar         = isPunctChar;
exports.escapeRE            = escapeRE;
exports.normalizeReference  = normalizeReference;

},{"./entities":8,"mdurl":62,"uc.micro":68,"uc.micro/categories/P/regex":66}],12:[function(require,module,exports){
// Just a shortcut for bulk export
'use strict';


exports.parseLinkLabel       = require('./parse_link_label');
exports.parseLinkDestination = require('./parse_link_destination');
exports.parseLinkTitle       = require('./parse_link_title');

},{"./parse_link_destination":13,"./parse_link_label":14,"./parse_link_title":15}],13:[function(require,module,exports){
// Parse link destination
//
'use strict';


var isSpace     = require('../common/utils').isSpace;
var unescapeAll = require('../common/utils').unescapeAll;


module.exports = function parseLinkDestination(str, pos, max) {
  var code, level,
      lines = 0,
      start = pos,
      result = {
        ok: false,
        pos: 0,
        lines: 0,
        str: ''
      };

  if (str.charCodeAt(pos) === 0x3C /* < */) {
    pos++;
    while (pos < max) {
      code = str.charCodeAt(pos);
      if (code === 0x0A /* \n */ || isSpace(code)) { return result; }
      if (code === 0x3E /* > */) {
        result.pos = pos + 1;
        result.str = unescapeAll(str.slice(start + 1, pos));
        result.ok = true;
        return result;
      }
      if (code === 0x5C /* \ */ && pos + 1 < max) {
        pos += 2;
        continue;
      }

      pos++;
    }

    // no closing '>'
    return result;
  }

  // this should be ... } else { ... branch

  level = 0;
  while (pos < max) {
    code = str.charCodeAt(pos);

    if (code === 0x20) { break; }

    // ascii control characters
    if (code < 0x20 || code === 0x7F) { break; }

    if (code === 0x5C /* \ */ && pos + 1 < max) {
      pos += 2;
      continue;
    }

    if (code === 0x28 /* ( */) {
      level++;
    }

    if (code === 0x29 /* ) */) {
      if (level === 0) { break; }
      level--;
    }

    pos++;
  }

  if (start === pos) { return result; }
  if (level !== 0) { return result; }

  result.str = unescapeAll(str.slice(start, pos));
  result.lines = lines;
  result.pos = pos;
  result.ok = true;
  return result;
};

},{"../common/utils":11}],14:[function(require,module,exports){
// Parse link label
//
// this function assumes that first character ("[") already matches;
// returns the end of the label
//
'use strict';

module.exports = function parseLinkLabel(state, start, disableNested) {
  var level, found, marker, prevPos,
      labelEnd = -1,
      max = state.posMax,
      oldPos = state.pos;

  state.pos = start + 1;
  level = 1;

  while (state.pos < max) {
    marker = state.src.charCodeAt(state.pos);
    if (marker === 0x5D /* ] */) {
      level--;
      if (level === 0) {
        found = true;
        break;
      }
    }

    prevPos = state.pos;
    state.md.inline.skipToken(state);
    if (marker === 0x5B /* [ */) {
      if (prevPos === state.pos - 1) {
        // increase level if we find text `[`, which is not a part of any token
        level++;
      } else if (disableNested) {
        state.pos = oldPos;
        return -1;
      }
    }
  }

  if (found) {
    labelEnd = state.pos;
  }

  // restore old state
  state.pos = oldPos;

  return labelEnd;
};

},{}],15:[function(require,module,exports){
// Parse link title
//
'use strict';


var unescapeAll = require('../common/utils').unescapeAll;


module.exports = function parseLinkTitle(str, pos, max) {
  var code,
      marker,
      lines = 0,
      start = pos,
      result = {
        ok: false,
        pos: 0,
        lines: 0,
        str: ''
      };

  if (pos >= max) { return result; }

  marker = str.charCodeAt(pos);

  if (marker !== 0x22 /* " */ && marker !== 0x27 /* ' */ && marker !== 0x28 /* ( */) { return result; }

  pos++;

  // if opening marker is "(", switch it to closing marker ")"
  if (marker === 0x28) { marker = 0x29; }

  while (pos < max) {
    code = str.charCodeAt(pos);
    if (code === marker) {
      result.pos = pos + 1;
      result.lines = lines;
      result.str = unescapeAll(str.slice(start + 1, pos));
      result.ok = true;
      return result;
    } else if (code === 0x0A) {
      lines++;
    } else if (code === 0x5C /* \ */ && pos + 1 < max) {
      pos++;
      if (str.charCodeAt(pos) === 0x0A) {
        lines++;
      }
    }

    pos++;
  }

  return result;
};

},{"../common/utils":11}],16:[function(require,module,exports){
// Main parser class

'use strict';


var utils        = require('./common/utils');
var helpers      = require('./helpers');
var Renderer     = require('./renderer');
var ParserCore   = require('./parser_core');
var ParserBlock  = require('./parser_block');
var ParserInline = require('./parser_inline');
var LinkifyIt    = require('linkify-it');
var mdurl        = require('mdurl');
var punycode     = require('punycode');


var config = {
  'default': require('./presets/default'),
  zero: require('./presets/zero'),
  commonmark: require('./presets/commonmark')
};

////////////////////////////////////////////////////////////////////////////////
//
// This validator can prohibit more than really needed to prevent XSS. It's a
// tradeoff to keep code simple and to be secure by default.
//
// If you need different setup - override validator method as you wish. Or
// replace it with dummy function and use external sanitizer.
//

var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

function validateLink(url) {
  // url should be normalized at this point, and existing entities are decoded
  var str = url.trim().toLowerCase();

  return BAD_PROTO_RE.test(str) ? (GOOD_DATA_RE.test(str) ? true : false) : true;
}

////////////////////////////////////////////////////////////////////////////////


var RECODE_HOSTNAME_FOR = [ 'http:', 'https:', 'mailto:' ];

function normalizeLink(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toASCII(parsed.hostname);
      } catch (er) { /**/ }
    }
  }

  return mdurl.encode(mdurl.format(parsed));
}

function normalizeLinkText(url) {
  var parsed = mdurl.parse(url, true);

  if (parsed.hostname) {
    // Encode hostnames in urls like:
    // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
    //
    // We don't encode unknown schemas, because it's likely that we encode
    // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
    //
    if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
      try {
        parsed.hostname = punycode.toUnicode(parsed.hostname);
      } catch (er) { /**/ }
    }
  }

  return mdurl.decode(mdurl.format(parsed));
}


/**
 * class MarkdownIt
 *
 * Main parser/renderer class.
 *
 * ##### Usage
 *
 * ```javascript
 * // node.js, "classic" way:
 * var MarkdownIt = require('markdown-it'),
 *     md = new MarkdownIt();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // node.js, the same, but with sugar:
 * var md = require('markdown-it')();
 * var result = md.render('# markdown-it rulezz!');
 *
 * // browser without AMD, added to "window" on script load
 * // Note, there are no dash.
 * var md = window.markdownit();
 * var result = md.render('# markdown-it rulezz!');
 * ```
 *
 * Single line rendering, without paragraph wrap:
 *
 * ```javascript
 * var md = require('markdown-it')();
 * var result = md.renderInline('__markdown-it__ rulezz!');
 * ```
 **/

/**
 * new MarkdownIt([presetName, options])
 * - presetName (String): optional, `commonmark` / `zero`
 * - options (Object)
 *
 * Creates parser instanse with given config. Can be called without `new`.
 *
 * ##### presetName
 *
 * MarkdownIt provides named presets as a convenience to quickly
 * enable/disable active syntax rules and options for common use cases.
 *
 * - ["commonmark"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/commonmark.js) -
 *   configures parser to strict [CommonMark](http://commonmark.org/) mode.
 * - [default](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/default.js) -
 *   similar to GFM, used when no preset name given. Enables all available rules,
 *   but still without html, typographer & autolinker.
 * - ["zero"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/zero.js) -
 *   all rules disabled. Useful to quickly setup your config via `.enable()`.
 *   For example, when you need only `bold` and `italic` markup and nothing else.
 *
 * ##### options:
 *
 * - __html__ - `false`. Set `true` to enable HTML tags in source. Be careful!
 *   That's not safe! You may need external sanitizer to protect output from XSS.
 *   It's better to extend features via plugins, instead of enabling HTML.
 * - __xhtmlOut__ - `false`. Set `true` to add '/' when closing single tags
 *   (`<br />`). This is needed only for full CommonMark compatibility. In real
 *   world you will need HTML output.
 * - __breaks__ - `false`. Set `true` to convert `\n` in paragraphs into `<br>`.
 * - __langPrefix__ - `language-`. CSS language class prefix for fenced blocks.
 *   Can be useful for external highlighters.
 * - __linkify__ - `false`. Set `true` to autoconvert URL-like text to links.
 * - __typographer__  - `false`. Set `true` to enable [some language-neutral
 *   replacement](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js) +
 *   quotes beautification (smartquotes).
 * - __quotes__ - `“”‘’`, String or Array. Double + single quotes replacement
 *   pairs, when typographer enabled and smartquotes on. For example, you can
 *   use `'«»„“'` for Russian, `'„“‚‘'` for German, and
 *   `['«\xA0', '\xA0»', '‹\xA0', '\xA0›']` for French (including nbsp).
 * - __highlight__ - `null`. Highlighter function for fenced code blocks.
 *   Highlighter `function (str, lang)` should return escaped HTML. It can also
 *   return empty string if the source was not changed and should be escaped
 *   externaly. If result starts with <pre... internal wrapper is skipped.
 *
 * ##### Example
 *
 * ```javascript
 * // commonmark mode
 * var md = require('markdown-it')('commonmark');
 *
 * // default mode
 * var md = require('markdown-it')();
 *
 * // enable everything
 * var md = require('markdown-it')({
 *   html: true,
 *   linkify: true,
 *   typographer: true
 * });
 * ```
 *
 * ##### Syntax highlighting
 *
 * ```js
 * var hljs = require('highlight.js') // https://highlightjs.org/
 *
 * var md = require('markdown-it')({
 *   highlight: function (str, lang) {
 *     if (lang && hljs.getLanguage(lang)) {
 *       try {
 *         return hljs.highlight(lang, str, true).value;
 *       } catch (__) {}
 *     }
 *
 *     return ''; // use external default escaping
 *   }
 * });
 * ```
 *
 * Or with full wrapper override (if you need assign class to `<pre>`):
 *
 * ```javascript
 * var hljs = require('highlight.js') // https://highlightjs.org/
 *
 * // Actual default values
 * var md = require('markdown-it')({
 *   highlight: function (str, lang) {
 *     if (lang && hljs.getLanguage(lang)) {
 *       try {
 *         return '<pre class="hljs"><code>' +
 *                hljs.highlight(lang, str, true).value +
 *                '</code></pre>';
 *       } catch (__) {}
 *     }
 *
 *     return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
 *   }
 * });
 * ```
 *
 **/
function MarkdownIt(presetName, options) {
  if (!(this instanceof MarkdownIt)) {
    return new MarkdownIt(presetName, options);
  }

  if (!options) {
    if (!utils.isString(presetName)) {
      options = presetName || {};
      presetName = 'default';
    }
  }

  /**
   * MarkdownIt#inline -> ParserInline
   *
   * Instance of [[ParserInline]]. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/
  this.inline = new ParserInline();

  /**
   * MarkdownIt#block -> ParserBlock
   *
   * Instance of [[ParserBlock]]. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/
  this.block = new ParserBlock();

  /**
   * MarkdownIt#core -> Core
   *
   * Instance of [[Core]] chain executor. You may need it to add new rules when
   * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
   * [[MarkdownIt.enable]].
   **/
  this.core = new ParserCore();

  /**
   * MarkdownIt#renderer -> Renderer
   *
   * Instance of [[Renderer]]. Use it to modify output look. Or to add rendering
   * rules for new token types, generated by plugins.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * function myToken(tokens, idx, options, env, self) {
   *   //...
   *   return result;
   * };
   *
   * md.renderer.rules['my_token'] = myToken
   * ```
   *
   * See [[Renderer]] docs and [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js).
   **/
  this.renderer = new Renderer();

  /**
   * MarkdownIt#linkify -> LinkifyIt
   *
   * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
   * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/linkify.js)
   * rule.
   **/
  this.linkify = new LinkifyIt();

  /**
   * MarkdownIt#validateLink(url) -> Boolean
   *
   * Link validation function. CommonMark allows too much in links. By default
   * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
   * except some embedded image types.
   *
   * You can change this behaviour:
   *
   * ```javascript
   * var md = require('markdown-it')();
   * // enable everything
   * md.validateLink = function () { return true; }
   * ```
   **/
  this.validateLink = validateLink;

  /**
   * MarkdownIt#normalizeLink(url) -> String
   *
   * Function used to encode link url to a machine-readable format,
   * which includes url-encoding, punycode, etc.
   **/
  this.normalizeLink = normalizeLink;

  /**
   * MarkdownIt#normalizeLinkText(url) -> String
   *
   * Function used to decode link url to a human-readable format`
   **/
  this.normalizeLinkText = normalizeLinkText;


  // Expose utils & helpers for easy acces from plugins

  /**
   * MarkdownIt#utils -> utils
   *
   * Assorted utility functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js).
   **/
  this.utils = utils;

  /**
   * MarkdownIt#helpers -> helpers
   *
   * Link components parser functions, useful to write plugins. See details
   * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/helpers).
   **/
  this.helpers = utils.assign({}, helpers);


  this.options = {};
  this.configure(presetName);

  if (options) { this.set(options); }
}


/** chainable
 * MarkdownIt.set(options)
 *
 * Set parser options (in the same format as in constructor). Probably, you
 * will never need it, but you can change options after constructor call.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')()
 *             .set({ html: true, breaks: true })
 *             .set({ typographer, true });
 * ```
 *
 * __Note:__ To achieve the best possible performance, don't modify a
 * `markdown-it` instance options on the fly. If you need multiple configurations
 * it's best to create multiple instances and initialize each with separate
 * config.
 **/
MarkdownIt.prototype.set = function (options) {
  utils.assign(this.options, options);
  return this;
};


/** chainable, internal
 * MarkdownIt.configure(presets)
 *
 * Batch load of all options and compenent settings. This is internal method,
 * and you probably will not need it. But if you with - see available presets
 * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/lib/presets)
 *
 * We strongly recommend to use presets instead of direct config loads. That
 * will give better compatibility with next versions.
 **/
MarkdownIt.prototype.configure = function (presets) {
  var self = this, presetName;

  if (utils.isString(presets)) {
    presetName = presets;
    presets = config[presetName];
    if (!presets) { throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name'); }
  }

  if (!presets) { throw new Error('Wrong `markdown-it` preset, can\'t be empty'); }

  if (presets.options) { self.set(presets.options); }

  if (presets.components) {
    Object.keys(presets.components).forEach(function (name) {
      if (presets.components[name].rules) {
        self[name].ruler.enableOnly(presets.components[name].rules);
      }
      if (presets.components[name].rules2) {
        self[name].ruler2.enableOnly(presets.components[name].rules2);
      }
    });
  }
  return this;
};


/** chainable
 * MarkdownIt.enable(list, ignoreInvalid)
 * - list (String|Array): rule name or list of rule names to enable
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable list or rules. It will automatically find appropriate components,
 * containing rules with given names. If rule not found, and `ignoreInvalid`
 * not set - throws exception.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')()
 *             .enable(['sub', 'sup'])
 *             .disable('smartquotes');
 * ```
 **/
MarkdownIt.prototype.enable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) { list = [ list ]; }

  [ 'core', 'block', 'inline' ].forEach(function (chain) {
    result = result.concat(this[chain].ruler.enable(list, true));
  }, this);

  result = result.concat(this.inline.ruler2.enable(list, true));

  var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to enable unknown rule(s): ' + missed);
  }

  return this;
};


/** chainable
 * MarkdownIt.disable(list, ignoreInvalid)
 * - list (String|Array): rule name or list of rule names to disable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * The same as [[MarkdownIt.enable]], but turn specified rules off.
 **/
MarkdownIt.prototype.disable = function (list, ignoreInvalid) {
  var result = [];

  if (!Array.isArray(list)) { list = [ list ]; }

  [ 'core', 'block', 'inline' ].forEach(function (chain) {
    result = result.concat(this[chain].ruler.disable(list, true));
  }, this);

  result = result.concat(this.inline.ruler2.disable(list, true));

  var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

  if (missed.length && !ignoreInvalid) {
    throw new Error('MarkdownIt. Failed to disable unknown rule(s): ' + missed);
  }
  return this;
};


/** chainable
 * MarkdownIt.use(plugin, params)
 *
 * Load specified plugin with given params into current parser instance.
 * It's just a sugar to call `plugin(md, params)` with curring.
 *
 * ##### Example
 *
 * ```javascript
 * var iterator = require('markdown-it-for-inline');
 * var md = require('markdown-it')()
 *             .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
 *               tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar');
 *             });
 * ```
 **/
MarkdownIt.prototype.use = function (plugin /*, params, ... */) {
  var args = [ this ].concat(Array.prototype.slice.call(arguments, 1));
  plugin.apply(plugin, args);
  return this;
};


/** internal
 * MarkdownIt.parse(src, env) -> Array
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Parse input string and returns list of block tokens (special token type
 * "inline" will contain list of inline tokens). You should not call this
 * method directly, until you write custom renderer (for example, to produce
 * AST).
 *
 * `env` is used to pass data between "distributed" rules and return additional
 * metadata like reference info, needed for the renderer. It also can be used to
 * inject data in specific cases. Usually, you will be ok to pass `{}`,
 * and then pass updated object to renderer.
 **/
MarkdownIt.prototype.parse = function (src, env) {
  if (typeof src !== 'string') {
    throw new Error('Input data should be a String');
  }

  var state = new this.core.State(src, this, env);

  this.core.process(state);

  return state.tokens;
};


/**
 * MarkdownIt.render(src [, env]) -> String
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Render markdown string into html. It does all magic for you :).
 *
 * `env` can be used to inject additional metadata (`{}` by default).
 * But you will not need it with high probability. See also comment
 * in [[MarkdownIt.parse]].
 **/
MarkdownIt.prototype.render = function (src, env) {
  env = env || {};

  return this.renderer.render(this.parse(src, env), this.options, env);
};


/** internal
 * MarkdownIt.parseInline(src, env) -> Array
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * The same as [[MarkdownIt.parse]] but skip all block rules. It returns the
 * block tokens list with the single `inline` element, containing parsed inline
 * tokens in `children` property. Also updates `env` object.
 **/
MarkdownIt.prototype.parseInline = function (src, env) {
  var state = new this.core.State(src, this, env);

  state.inlineMode = true;
  this.core.process(state);

  return state.tokens;
};


/**
 * MarkdownIt.renderInline(src [, env]) -> String
 * - src (String): source string
 * - env (Object): environment sandbox
 *
 * Similar to [[MarkdownIt.render]] but for single paragraph content. Result
 * will NOT be wrapped into `<p>` tags.
 **/
MarkdownIt.prototype.renderInline = function (src, env) {
  env = env || {};

  return this.renderer.render(this.parseInline(src, env), this.options, env);
};


module.exports = MarkdownIt;

},{"./common/utils":11,"./helpers":12,"./parser_block":17,"./parser_core":18,"./parser_inline":19,"./presets/commonmark":20,"./presets/default":21,"./presets/zero":22,"./renderer":23,"linkify-it":5,"mdurl":62,"punycode":1}],17:[function(require,module,exports){
/** internal
 * class ParserBlock
 *
 * Block-level tokenizer.
 **/
'use strict';


var Ruler           = require('./ruler');


var _rules = [
  // First 2 params - rule name & source. Secondary array - list of rules,
  // which can be terminated by this one.
  [ 'table',      require('./rules_block/table'),      [ 'paragraph', 'reference' ] ],
  [ 'code',       require('./rules_block/code') ],
  [ 'fence',      require('./rules_block/fence'),      [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
  [ 'blockquote', require('./rules_block/blockquote'), [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
  [ 'hr',         require('./rules_block/hr'),         [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
  [ 'list',       require('./rules_block/list'),       [ 'paragraph', 'reference', 'blockquote' ] ],
  [ 'reference',  require('./rules_block/reference') ],
  [ 'heading',    require('./rules_block/heading'),    [ 'paragraph', 'reference', 'blockquote' ] ],
  [ 'lheading',   require('./rules_block/lheading') ],
  [ 'html_block', require('./rules_block/html_block'), [ 'paragraph', 'reference', 'blockquote' ] ],
  [ 'paragraph',  require('./rules_block/paragraph') ]
];


/**
 * new ParserBlock()
 **/
function ParserBlock() {
  /**
   * ParserBlock#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of block rules.
   **/
  this.ruler = new Ruler();

  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1], { alt: (_rules[i][2] || []).slice() });
  }
}


// Generate tokens for input range
//
ParserBlock.prototype.tokenize = function (state, startLine, endLine) {
  var ok, i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      line = startLine,
      hasEmptyLines = false,
      maxNesting = state.md.options.maxNesting;

  while (line < endLine) {
    state.line = line = state.skipEmptyLines(line);
    if (line >= endLine) { break; }

    // Termination condition for nested calls.
    // Nested calls currently used for blockquotes & lists
    if (state.sCount[line] < state.blkIndent) { break; }

    // If nesting level exceeded - skip tail to the end. That's not ordinary
    // situation and we should not care about content.
    if (state.level >= maxNesting) {
      state.line = endLine;
      break;
    }

    // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.line`
    // - update `state.tokens`
    // - return true

    for (i = 0; i < len; i++) {
      ok = rules[i](state, line, endLine, false);
      if (ok) { break; }
    }

    // set state.tight if we had an empty line before current tag
    // i.e. latest empty line should not count
    state.tight = !hasEmptyLines;

    // paragraph might "eat" one newline after it in nested lists
    if (state.isEmpty(state.line - 1)) {
      hasEmptyLines = true;
    }

    line = state.line;

    if (line < endLine && state.isEmpty(line)) {
      hasEmptyLines = true;
      line++;
      state.line = line;
    }
  }
};


/**
 * ParserBlock.parse(str, md, env, outTokens)
 *
 * Process input string and push block tokens into `outTokens`
 **/
ParserBlock.prototype.parse = function (src, md, env, outTokens) {
  var state;

  if (!src) { return; }

  state = new this.State(src, md, env, outTokens);

  this.tokenize(state, state.line, state.lineMax);
};


ParserBlock.prototype.State = require('./rules_block/state_block');


module.exports = ParserBlock;

},{"./ruler":24,"./rules_block/blockquote":25,"./rules_block/code":26,"./rules_block/fence":27,"./rules_block/heading":28,"./rules_block/hr":29,"./rules_block/html_block":30,"./rules_block/lheading":31,"./rules_block/list":32,"./rules_block/paragraph":33,"./rules_block/reference":34,"./rules_block/state_block":35,"./rules_block/table":36}],18:[function(require,module,exports){
/** internal
 * class Core
 *
 * Top-level rules executor. Glues block/inline parsers and does intermediate
 * transformations.
 **/
'use strict';


var Ruler  = require('./ruler');


var _rules = [
  [ 'normalize',      require('./rules_core/normalize')      ],
  [ 'block',          require('./rules_core/block')          ],
  [ 'inline',         require('./rules_core/inline')         ],
  [ 'linkify',        require('./rules_core/linkify')        ],
  [ 'replacements',   require('./rules_core/replacements')   ],
  [ 'smartquotes',    require('./rules_core/smartquotes')    ]
];


/**
 * new Core()
 **/
function Core() {
  /**
   * Core#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of core rules.
   **/
  this.ruler = new Ruler();

  for (var i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }
}


/**
 * Core.process(state)
 *
 * Executes core chain rules.
 **/
Core.prototype.process = function (state) {
  var i, l, rules;

  rules = this.ruler.getRules('');

  for (i = 0, l = rules.length; i < l; i++) {
    rules[i](state);
  }
};

Core.prototype.State = require('./rules_core/state_core');


module.exports = Core;

},{"./ruler":24,"./rules_core/block":37,"./rules_core/inline":38,"./rules_core/linkify":39,"./rules_core/normalize":40,"./rules_core/replacements":41,"./rules_core/smartquotes":42,"./rules_core/state_core":43}],19:[function(require,module,exports){
/** internal
 * class ParserInline
 *
 * Tokenizes paragraph content.
 **/
'use strict';


var Ruler           = require('./ruler');


////////////////////////////////////////////////////////////////////////////////
// Parser rules

var _rules = [
  [ 'text',            require('./rules_inline/text') ],
  [ 'newline',         require('./rules_inline/newline') ],
  [ 'escape',          require('./rules_inline/escape') ],
  [ 'backticks',       require('./rules_inline/backticks') ],
  [ 'strikethrough',   require('./rules_inline/strikethrough').tokenize ],
  [ 'emphasis',        require('./rules_inline/emphasis').tokenize ],
  [ 'link',            require('./rules_inline/link') ],
  [ 'image',           require('./rules_inline/image') ],
  [ 'autolink',        require('./rules_inline/autolink') ],
  [ 'html_inline',     require('./rules_inline/html_inline') ],
  [ 'entity',          require('./rules_inline/entity') ]
];

var _rules2 = [
  [ 'balance_pairs',   require('./rules_inline/balance_pairs') ],
  [ 'strikethrough',   require('./rules_inline/strikethrough').postProcess ],
  [ 'emphasis',        require('./rules_inline/emphasis').postProcess ],
  [ 'text_collapse',   require('./rules_inline/text_collapse') ]
];


/**
 * new ParserInline()
 **/
function ParserInline() {
  var i;

  /**
   * ParserInline#ruler -> Ruler
   *
   * [[Ruler]] instance. Keep configuration of inline rules.
   **/
  this.ruler = new Ruler();

  for (i = 0; i < _rules.length; i++) {
    this.ruler.push(_rules[i][0], _rules[i][1]);
  }

  /**
   * ParserInline#ruler2 -> Ruler
   *
   * [[Ruler]] instance. Second ruler used for post-processing
   * (e.g. in emphasis-like rules).
   **/
  this.ruler2 = new Ruler();

  for (i = 0; i < _rules2.length; i++) {
    this.ruler2.push(_rules2[i][0], _rules2[i][1]);
  }
}


// Skip single token by running all rules in validation mode;
// returns `true` if any rule reported success
//
ParserInline.prototype.skipToken = function (state) {
  var ok, i, pos = state.pos,
      rules = this.ruler.getRules(''),
      len = rules.length,
      maxNesting = state.md.options.maxNesting,
      cache = state.cache;


  if (typeof cache[pos] !== 'undefined') {
    state.pos = cache[pos];
    return;
  }

  if (state.level < maxNesting) {
    for (i = 0; i < len; i++) {
      // Increment state.level and decrement it later to limit recursion.
      // It's harmless to do here, because no tokens are created. But ideally,
      // we'd need a separate private state variable for this purpose.
      //
      state.level++;
      ok = rules[i](state, true);
      state.level--;

      if (ok) { break; }
    }
  } else {
    // Too much nesting, just skip until the end of the paragraph.
    //
    // NOTE: this will cause links to behave incorrectly in the following case,
    //       when an amount of `[` is exactly equal to `maxNesting + 1`:
    //
    //       [[[[[[[[[[[[[[[[[[[[[foo]()
    //
    // TODO: remove this workaround when CM standard will allow nested links
    //       (we can replace it by preventing links from being parsed in
    //       validation mode)
    //
    state.pos = state.posMax;
  }

  if (!ok) { state.pos++; }
  cache[pos] = state.pos;
};


// Generate tokens for input range
//
ParserInline.prototype.tokenize = function (state) {
  var ok, i,
      rules = this.ruler.getRules(''),
      len = rules.length,
      end = state.posMax,
      maxNesting = state.md.options.maxNesting;

  while (state.pos < end) {
    // Try all possible rules.
    // On success, rule should:
    //
    // - update `state.pos`
    // - update `state.tokens`
    // - return true

    if (state.level < maxNesting) {
      for (i = 0; i < len; i++) {
        ok = rules[i](state, false);
        if (ok) { break; }
      }
    }

    if (ok) {
      if (state.pos >= end) { break; }
      continue;
    }

    state.pending += state.src[state.pos++];
  }

  if (state.pending) {
    state.pushPending();
  }
};


/**
 * ParserInline.parse(str, md, env, outTokens)
 *
 * Process input string and push inline tokens into `outTokens`
 **/
ParserInline.prototype.parse = function (str, md, env, outTokens) {
  var i, rules, len;
  var state = new this.State(str, md, env, outTokens);

  this.tokenize(state);

  rules = this.ruler2.getRules('');
  len = rules.length;

  for (i = 0; i < len; i++) {
    rules[i](state);
  }
};


ParserInline.prototype.State = require('./rules_inline/state_inline');


module.exports = ParserInline;

},{"./ruler":24,"./rules_inline/autolink":44,"./rules_inline/backticks":45,"./rules_inline/balance_pairs":46,"./rules_inline/emphasis":47,"./rules_inline/entity":48,"./rules_inline/escape":49,"./rules_inline/html_inline":50,"./rules_inline/image":51,"./rules_inline/link":52,"./rules_inline/newline":53,"./rules_inline/state_inline":54,"./rules_inline/strikethrough":55,"./rules_inline/text":56,"./rules_inline/text_collapse":57}],20:[function(require,module,exports){
// Commonmark default options

'use strict';


module.exports = {
  options: {
    html:         true,         // Enable HTML tags in source
    xhtmlOut:     true,         // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      false,        // autoconvert URL-like texts to links

    // Enable some language-neutral replacements + quotes beautification
    typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,

    maxNesting:   20            // Internal protection, recursion limit
  },

  components: {

    core: {
      rules: [
        'normalize',
        'block',
        'inline'
      ]
    },

    block: {
      rules: [
        'blockquote',
        'code',
        'fence',
        'heading',
        'hr',
        'html_block',
        'lheading',
        'list',
        'reference',
        'paragraph'
      ]
    },

    inline: {
      rules: [
        'autolink',
        'backticks',
        'emphasis',
        'entity',
        'escape',
        'html_inline',
        'image',
        'link',
        'newline',
        'text'
      ],
      rules2: [
        'balance_pairs',
        'emphasis',
        'text_collapse'
      ]
    }
  }
};

},{}],21:[function(require,module,exports){
// markdown-it default options

'use strict';


module.exports = {
  options: {
    html:         false,        // Enable HTML tags in source
    xhtmlOut:     false,        // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      false,        // autoconvert URL-like texts to links

    // Enable some language-neutral replacements + quotes beautification
    typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,

    maxNesting:   100            // Internal protection, recursion limit
  },

  components: {

    core: {},
    block: {},
    inline: {}
  }
};

},{}],22:[function(require,module,exports){
// "Zero" preset, with nothing enabled. Useful for manual configuring of simple
// modes. For example, to parse bold/italic only.

'use strict';


module.exports = {
  options: {
    html:         false,        // Enable HTML tags in source
    xhtmlOut:     false,        // Use '/' to close single tags (<br />)
    breaks:       false,        // Convert '\n' in paragraphs into <br>
    langPrefix:   'language-',  // CSS language prefix for fenced blocks
    linkify:      false,        // autoconvert URL-like texts to links

    // Enable some language-neutral replacements + quotes beautification
    typographer:  false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externaly.
    // If result starts with <pre... internal wrapper is skipped.
    //
    // function (/*str, lang*/) { return ''; }
    //
    highlight: null,

    maxNesting:   20            // Internal protection, recursion limit
  },

  components: {

    core: {
      rules: [
        'normalize',
        'block',
        'inline'
      ]
    },

    block: {
      rules: [
        'paragraph'
      ]
    },

    inline: {
      rules: [
        'text'
      ],
      rules2: [
        'balance_pairs',
        'text_collapse'
      ]
    }
  }
};

},{}],23:[function(require,module,exports){
/**
 * class Renderer
 *
 * Generates HTML from parsed token stream. Each instance has independent
 * copy of rules. Those can be rewritten with ease. Also, you can add new
 * rules if you create plugin and adds new token types.
 **/
'use strict';


var assign          = require('./common/utils').assign;
var unescapeAll     = require('./common/utils').unescapeAll;
var escapeHtml      = require('./common/utils').escapeHtml;


////////////////////////////////////////////////////////////////////////////////

var default_rules = {};


default_rules.code_inline = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];

  return  '<code' + slf.renderAttrs(token) + '>' +
          escapeHtml(tokens[idx].content) +
          '</code>';
};


default_rules.code_block = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];

  return  '<pre' + slf.renderAttrs(token) + '><code>' +
          escapeHtml(tokens[idx].content) +
          '</code></pre>\n';
};


default_rules.fence = function (tokens, idx, options, env, slf) {
  var token = tokens[idx],
      info = token.info ? unescapeAll(token.info).trim() : '',
      langName = '',
      highlighted, i, tmpAttrs, tmpToken;

  if (info) {
    langName = info.split(/\s+/g)[0];
  }

  if (options.highlight) {
    highlighted = options.highlight(token.content, langName) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.indexOf('<pre') === 0) {
    return highlighted + '\n';
  }

  // If language exists, inject class gently, without modifying original token.
  // May be, one day we will add .clone() for token and simplify this part, but
  // now we prefer to keep things local.
  if (info) {
    i        = token.attrIndex('class');
    tmpAttrs = token.attrs ? token.attrs.slice() : [];

    if (i < 0) {
      tmpAttrs.push([ 'class', options.langPrefix + langName ]);
    } else {
      tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
    }

    // Fake token just to render attributes
    tmpToken = {
      attrs: tmpAttrs
    };

    return  '<pre><code' + slf.renderAttrs(tmpToken) + '>'
          + highlighted
          + '</code></pre>\n';
  }


  return  '<pre><code' + slf.renderAttrs(token) + '>'
        + highlighted
        + '</code></pre>\n';
};


default_rules.image = function (tokens, idx, options, env, slf) {
  var token = tokens[idx];

  // "alt" attr MUST be set, even if empty. Because it's mandatory and
  // should be placed on proper position for tests.
  //
  // Replace content with actual value

  token.attrs[token.attrIndex('alt')][1] =
    slf.renderInlineAsText(token.children, options, env);

  return slf.renderToken(tokens, idx, options);
};


default_rules.hardbreak = function (tokens, idx, options /*, env */) {
  return options.xhtmlOut ? '<br />\n' : '<br>\n';
};
default_rules.softbreak = function (tokens, idx, options /*, env */) {
  return options.breaks ? (options.xhtmlOut ? '<br />\n' : '<br>\n') : '\n';
};


default_rules.text = function (tokens, idx /*, options, env */) {
  return escapeHtml(tokens[idx].content);
};


default_rules.html_block = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};
default_rules.html_inline = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};


/**
 * new Renderer()
 *
 * Creates new [[Renderer]] instance and fill [[Renderer#rules]] with defaults.
 **/
function Renderer() {

  /**
   * Renderer#rules -> Object
   *
   * Contains render rules for tokens. Can be updated and extended.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.renderer.rules.strong_open  = function () { return '<b>'; };
   * md.renderer.rules.strong_close = function () { return '</b>'; };
   *
   * var result = md.renderInline(...);
   * ```
   *
   * Each rule is called as independed static function with fixed signature:
   *
   * ```javascript
   * function my_token_render(tokens, idx, options, env, renderer) {
   *   // ...
   *   return renderedHTML;
   * }
   * ```
   *
   * See [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js)
   * for more details and examples.
   **/
  this.rules = assign({}, default_rules);
}


/**
 * Renderer.renderAttrs(token) -> String
 *
 * Render token attributes to string.
 **/
Renderer.prototype.renderAttrs = function renderAttrs(token) {
  var i, l, result;

  if (!token.attrs) { return ''; }

  result = '';

  for (i = 0, l = token.attrs.length; i < l; i++) {
    result += ' ' + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
  }

  return result;
};


/**
 * Renderer.renderToken(tokens, idx, options) -> String
 * - tokens (Array): list of tokens
 * - idx (Numbed): token index to render
 * - options (Object): params of parser instance
 *
 * Default token renderer. Can be overriden by custom function
 * in [[Renderer#rules]].
 **/
Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
  var nextToken,
      result = '',
      needLf = false,
      token = tokens[idx];

  // Tight list paragraphs
  if (token.hidden) {
    return '';
  }

  // Insert a newline between hidden paragraph and subsequent opening
  // block-level tag.
  //
  // For example, here we should insert a newline before blockquote:
  //  - a
  //    >
  //
  if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
    result += '\n';
  }

  // Add token name, e.g. `<img`
  result += (token.nesting === -1 ? '</' : '<') + token.tag;

  // Encode attributes, e.g. `<img src="foo"`
  result += this.renderAttrs(token);

  // Add a slash for self-closing tags, e.g. `<img src="foo" /`
  if (token.nesting === 0 && options.xhtmlOut) {
    result += ' /';
  }

  // Check if we need to add a newline after this tag
  if (token.block) {
    needLf = true;

    if (token.nesting === 1) {
      if (idx + 1 < tokens.length) {
        nextToken = tokens[idx + 1];

        if (nextToken.type === 'inline' || nextToken.hidden) {
          // Block-level tag containing an inline tag.
          //
          needLf = false;

        } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
          // Opening tag + closing tag of the same type. E.g. `<li></li>`.
          //
          needLf = false;
        }
      }
    }
  }

  result += needLf ? '>\n' : '>';

  return result;
};


/**
 * Renderer.renderInline(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * The same as [[Renderer.render]], but for single token of `inline` type.
 **/
Renderer.prototype.renderInline = function (tokens, options, env) {
  var type,
      result = '',
      rules = this.rules;

  for (var i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (typeof rules[type] !== 'undefined') {
      result += rules[type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options);
    }
  }

  return result;
};


/** internal
 * Renderer.renderInlineAsText(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Special kludge for image `alt` attributes to conform CommonMark spec.
 * Don't try to use it! Spec requires to show `alt` content with stripped markup,
 * instead of simple escaping.
 **/
Renderer.prototype.renderInlineAsText = function (tokens, options, env) {
  var result = '';

  for (var i = 0, len = tokens.length; i < len; i++) {
    if (tokens[i].type === 'text') {
      result += tokens[i].content;
    } else if (tokens[i].type === 'image') {
      result += this.renderInlineAsText(tokens[i].children, options, env);
    }
  }

  return result;
};


/**
 * Renderer.render(tokens, options, env) -> String
 * - tokens (Array): list on block tokens to renter
 * - options (Object): params of parser instance
 * - env (Object): additional data from parsed input (references, for example)
 *
 * Takes token stream and generates HTML. Probably, you will never need to call
 * this method directly.
 **/
Renderer.prototype.render = function (tokens, options, env) {
  var i, len, type,
      result = '',
      rules = this.rules;

  for (i = 0, len = tokens.length; i < len; i++) {
    type = tokens[i].type;

    if (type === 'inline') {
      result += this.renderInline(tokens[i].children, options, env);
    } else if (typeof rules[type] !== 'undefined') {
      result += rules[tokens[i].type](tokens, i, options, env, this);
    } else {
      result += this.renderToken(tokens, i, options, env);
    }
  }

  return result;
};

module.exports = Renderer;

},{"./common/utils":11}],24:[function(require,module,exports){
/**
 * class Ruler
 *
 * Helper class, used by [[MarkdownIt#core]], [[MarkdownIt#block]] and
 * [[MarkdownIt#inline]] to manage sequences of functions (rules):
 *
 * - keep rules in defined order
 * - assign the name to each rule
 * - enable/disable rules
 * - add/replace rules
 * - allow assign rules to additional named chains (in the same)
 * - cacheing lists of active rules
 *
 * You will not need use this class directly until write plugins. For simple
 * rules control use [[MarkdownIt.disable]], [[MarkdownIt.enable]] and
 * [[MarkdownIt.use]].
 **/
'use strict';


/**
 * new Ruler()
 **/
function Ruler() {
  // List of added rules. Each element is:
  //
  // {
  //   name: XXX,
  //   enabled: Boolean,
  //   fn: Function(),
  //   alt: [ name2, name3 ]
  // }
  //
  this.__rules__ = [];

  // Cached rule chains.
  //
  // First level - chain name, '' for default.
  // Second level - diginal anchor for fast filtering by charcodes.
  //
  this.__cache__ = null;
}

////////////////////////////////////////////////////////////////////////////////
// Helper methods, should not be used directly


// Find rule index by name
//
Ruler.prototype.__find__ = function (name) {
  for (var i = 0; i < this.__rules__.length; i++) {
    if (this.__rules__[i].name === name) {
      return i;
    }
  }
  return -1;
};


// Build rules lookup cache
//
Ruler.prototype.__compile__ = function () {
  var self = this;
  var chains = [ '' ];

  // collect unique names
  self.__rules__.forEach(function (rule) {
    if (!rule.enabled) { return; }

    rule.alt.forEach(function (altName) {
      if (chains.indexOf(altName) < 0) {
        chains.push(altName);
      }
    });
  });

  self.__cache__ = {};

  chains.forEach(function (chain) {
    self.__cache__[chain] = [];
    self.__rules__.forEach(function (rule) {
      if (!rule.enabled) { return; }

      if (chain && rule.alt.indexOf(chain) < 0) { return; }

      self.__cache__[chain].push(rule.fn);
    });
  });
};


/**
 * Ruler.at(name, fn [, options])
 * - name (String): rule name to replace.
 * - fn (Function): new rule function.
 * - options (Object): new rule options (not mandatory).
 *
 * Replace rule by name with new function & options. Throws error if name not
 * found.
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * Replace existing typorgapher replacement rule with new one:
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.core.ruler.at('replacements', function replace(state) {
 *   //...
 * });
 * ```
 **/
Ruler.prototype.at = function (name, fn, options) {
  var index = this.__find__(name);
  var opt = options || {};

  if (index === -1) { throw new Error('Parser rule not found: ' + name); }

  this.__rules__[index].fn = fn;
  this.__rules__[index].alt = opt.alt || [];
  this.__cache__ = null;
};


/**
 * Ruler.before(beforeName, ruleName, fn [, options])
 * - beforeName (String): new rule will be added before this one.
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Add new rule to chain before one with given name. See also
 * [[Ruler.after]], [[Ruler.push]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/
Ruler.prototype.before = function (beforeName, ruleName, fn, options) {
  var index = this.__find__(beforeName);
  var opt = options || {};

  if (index === -1) { throw new Error('Parser rule not found: ' + beforeName); }

  this.__rules__.splice(index, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};


/**
 * Ruler.after(afterName, ruleName, fn [, options])
 * - afterName (String): new rule will be added after this one.
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Add new rule to chain after one with given name. See also
 * [[Ruler.before]], [[Ruler.push]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.inline.ruler.after('text', 'my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/
Ruler.prototype.after = function (afterName, ruleName, fn, options) {
  var index = this.__find__(afterName);
  var opt = options || {};

  if (index === -1) { throw new Error('Parser rule not found: ' + afterName); }

  this.__rules__.splice(index + 1, 0, {
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};

/**
 * Ruler.push(ruleName, fn [, options])
 * - ruleName (String): name of added rule.
 * - fn (Function): rule function.
 * - options (Object): rule options (not mandatory).
 *
 * Push new rule to the end of chain. See also
 * [[Ruler.before]], [[Ruler.after]].
 *
 * ##### Options:
 *
 * - __alt__ - array with names of "alternate" chains.
 *
 * ##### Example
 *
 * ```javascript
 * var md = require('markdown-it')();
 *
 * md.core.ruler.push('my_rule', function replace(state) {
 *   //...
 * });
 * ```
 **/
Ruler.prototype.push = function (ruleName, fn, options) {
  var opt = options || {};

  this.__rules__.push({
    name: ruleName,
    enabled: true,
    fn: fn,
    alt: opt.alt || []
  });

  this.__cache__ = null;
};


/**
 * Ruler.enable(list [, ignoreInvalid]) -> Array
 * - list (String|Array): list of rule names to enable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable rules with given names. If any rule name not found - throw Error.
 * Errors can be disabled by second param.
 *
 * Returns list of found rule names (if no exception happened).
 *
 * See also [[Ruler.disable]], [[Ruler.enableOnly]].
 **/
Ruler.prototype.enable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) { list = [ list ]; }

  var result = [];

  // Search by name and enable
  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) { return; }
      throw new Error('Rules manager: invalid rule name ' + name);
    }
    this.__rules__[idx].enabled = true;
    result.push(name);
  }, this);

  this.__cache__ = null;
  return result;
};


/**
 * Ruler.enableOnly(list [, ignoreInvalid])
 * - list (String|Array): list of rule names to enable (whitelist).
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Enable rules with given names, and disable everything else. If any rule name
 * not found - throw Error. Errors can be disabled by second param.
 *
 * See also [[Ruler.disable]], [[Ruler.enable]].
 **/
Ruler.prototype.enableOnly = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) { list = [ list ]; }

  this.__rules__.forEach(function (rule) { rule.enabled = false; });

  this.enable(list, ignoreInvalid);
};


/**
 * Ruler.disable(list [, ignoreInvalid]) -> Array
 * - list (String|Array): list of rule names to disable.
 * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
 *
 * Disable rules with given names. If any rule name not found - throw Error.
 * Errors can be disabled by second param.
 *
 * Returns list of found rule names (if no exception happened).
 *
 * See also [[Ruler.enable]], [[Ruler.enableOnly]].
 **/
Ruler.prototype.disable = function (list, ignoreInvalid) {
  if (!Array.isArray(list)) { list = [ list ]; }

  var result = [];

  // Search by name and disable
  list.forEach(function (name) {
    var idx = this.__find__(name);

    if (idx < 0) {
      if (ignoreInvalid) { return; }
      throw new Error('Rules manager: invalid rule name ' + name);
    }
    this.__rules__[idx].enabled = false;
    result.push(name);
  }, this);

  this.__cache__ = null;
  return result;
};


/**
 * Ruler.getRules(chainName) -> Array
 *
 * Return array of active functions (rules) for given chain name. It analyzes
 * rules configuration, compiles caches if not exists and returns result.
 *
 * Default chain name is `''` (empty string). It can't be skipped. That's
 * done intentionally, to keep signature monomorphic for high speed.
 **/
Ruler.prototype.getRules = function (chainName) {
  if (this.__cache__ === null) {
    this.__compile__();
  }

  // Chain can be empty, if rules disabled. But we still have to return Array.
  return this.__cache__[chainName] || [];
};

module.exports = Ruler;

},{}],25:[function(require,module,exports){
// Block quotes

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function blockquote(state, startLine, endLine, silent) {
  var adjustTab,
      ch,
      i,
      initial,
      l,
      lastLineEmpty,
      lines,
      nextLine,
      offset,
      oldBMarks,
      oldBSCount,
      oldIndent,
      oldParentType,
      oldSCount,
      oldTShift,
      spaceAfterMarker,
      terminate,
      terminatorRules,
      token,
      wasOutdented,
      oldLineMax = state.lineMax,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  // check the block quote marker
  if (state.src.charCodeAt(pos++) !== 0x3E/* > */) { return false; }

  // we know that it's going to be a valid blockquote,
  // so no point trying to find the end of it in silent mode
  if (silent) { return true; }

  // skip spaces after ">" and re-calculate offset
  initial = offset = state.sCount[startLine] + pos - (state.bMarks[startLine] + state.tShift[startLine]);

  // skip one optional space after '>'
  if (state.src.charCodeAt(pos) === 0x20 /* space */) {
    // ' >   test '
    //     ^ -- position start of line here:
    pos++;
    initial++;
    offset++;
    adjustTab = false;
    spaceAfterMarker = true;
  } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
    spaceAfterMarker = true;

    if ((state.bsCount[startLine] + offset) % 4 === 3) {
      // '  >\t  test '
      //       ^ -- position start of line here (tab has width===1)
      pos++;
      initial++;
      offset++;
      adjustTab = false;
    } else {
      // ' >\t  test '
      //    ^ -- position start of line here + shift bsCount slightly
      //         to make extra space appear
      adjustTab = true;
    }
  } else {
    spaceAfterMarker = false;
  }

  oldBMarks = [ state.bMarks[startLine] ];
  state.bMarks[startLine] = pos;

  while (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (isSpace(ch)) {
      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[startLine] + (adjustTab ? 1 : 0)) % 4;
      } else {
        offset++;
      }
    } else {
      break;
    }

    pos++;
  }

  oldBSCount = [ state.bsCount[startLine] ];
  state.bsCount[startLine] = state.sCount[startLine] + 1 + (spaceAfterMarker ? 1 : 0);

  lastLineEmpty = pos >= max;

  oldSCount = [ state.sCount[startLine] ];
  state.sCount[startLine] = offset - initial;

  oldTShift = [ state.tShift[startLine] ];
  state.tShift[startLine] = pos - state.bMarks[startLine];

  terminatorRules = state.md.block.ruler.getRules('blockquote');

  oldParentType = state.parentType;
  state.parentType = 'blockquote';
  wasOutdented = false;

  // Search the end of the block
  //
  // Block ends with either:
  //  1. an empty line outside:
  //     ```
  //     > test
  //
  //     ```
  //  2. an empty line inside:
  //     ```
  //     >
  //     test
  //     ```
  //  3. another tag:
  //     ```
  //     > test
  //      - - -
  //     ```
  for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
    // check if it's outdented, i.e. it's inside list item and indented
    // less than said list item:
    //
    // ```
    // 1. anything
    //    > current blockquote
    // 2. checking this line
    // ```
    if (state.sCount[nextLine] < state.blkIndent) wasOutdented = true;

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos >= max) {
      // Case 1: line is not inside the blockquote, and this line is empty.
      break;
    }

    if (state.src.charCodeAt(pos++) === 0x3E/* > */ && !wasOutdented) {
      // This line is inside the blockquote.

      // skip spaces after ">" and re-calculate offset
      initial = offset = state.sCount[nextLine] + pos - (state.bMarks[nextLine] + state.tShift[nextLine]);

      // skip one optional space after '>'
      if (state.src.charCodeAt(pos) === 0x20 /* space */) {
        // ' >   test '
        //     ^ -- position start of line here:
        pos++;
        initial++;
        offset++;
        adjustTab = false;
        spaceAfterMarker = true;
      } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
        spaceAfterMarker = true;

        if ((state.bsCount[nextLine] + offset) % 4 === 3) {
          // '  >\t  test '
          //       ^ -- position start of line here (tab has width===1)
          pos++;
          initial++;
          offset++;
          adjustTab = false;
        } else {
          // ' >\t  test '
          //    ^ -- position start of line here + shift bsCount slightly
          //         to make extra space appear
          adjustTab = true;
        }
      } else {
        spaceAfterMarker = false;
      }

      oldBMarks.push(state.bMarks[nextLine]);
      state.bMarks[nextLine] = pos;

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (isSpace(ch)) {
          if (ch === 0x09) {
            offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
          } else {
            offset++;
          }
        } else {
          break;
        }

        pos++;
      }

      lastLineEmpty = pos >= max;

      oldBSCount.push(state.bsCount[nextLine]);
      state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);

      oldSCount.push(state.sCount[nextLine]);
      state.sCount[nextLine] = offset - initial;

      oldTShift.push(state.tShift[nextLine]);
      state.tShift[nextLine] = pos - state.bMarks[nextLine];
      continue;
    }

    // Case 2: line is not inside the blockquote, and the last line was empty.
    if (lastLineEmpty) { break; }

    // Case 3: another tag found.
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }

    if (terminate) {
      // Quirk to enforce "hard termination mode" for paragraphs;
      // normally if you call `tokenize(state, startLine, nextLine)`,
      // paragraphs will look below nextLine for paragraph continuation,
      // but if blockquote is terminated by another tag, they shouldn't
      state.lineMax = nextLine;

      if (state.blkIndent !== 0) {
        // state.blkIndent was non-zero, we now set it to zero,
        // so we need to re-calculate all offsets to appear as
        // if indent wasn't changed
        oldBMarks.push(state.bMarks[nextLine]);
        oldBSCount.push(state.bsCount[nextLine]);
        oldTShift.push(state.tShift[nextLine]);
        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] -= state.blkIndent;
      }

      break;
    }

    oldBMarks.push(state.bMarks[nextLine]);
    oldBSCount.push(state.bsCount[nextLine]);
    oldTShift.push(state.tShift[nextLine]);
    oldSCount.push(state.sCount[nextLine]);

    // A negative indentation means that this is a paragraph continuation
    //
    state.sCount[nextLine] = -1;
  }

  oldIndent = state.blkIndent;
  state.blkIndent = 0;

  token        = state.push('blockquote_open', 'blockquote', 1);
  token.markup = '>';
  token.map    = lines = [ startLine, 0 ];

  state.md.block.tokenize(state, startLine, nextLine);

  token        = state.push('blockquote_close', 'blockquote', -1);
  token.markup = '>';

  state.lineMax = oldLineMax;
  state.parentType = oldParentType;
  lines[1] = state.line;

  // Restore original tShift; this might not be necessary since the parser
  // has already been here, but just to make sure we can do that.
  for (i = 0; i < oldTShift.length; i++) {
    state.bMarks[i + startLine] = oldBMarks[i];
    state.tShift[i + startLine] = oldTShift[i];
    state.sCount[i + startLine] = oldSCount[i];
    state.bsCount[i + startLine] = oldBSCount[i];
  }
  state.blkIndent = oldIndent;

  return true;
};

},{"../common/utils":11}],26:[function(require,module,exports){
// Code block (4 spaces padded)

'use strict';


module.exports = function code(state, startLine, endLine/*, silent*/) {
  var nextLine, last, token;

  if (state.sCount[startLine] - state.blkIndent < 4) { return false; }

  last = nextLine = startLine + 1;

  while (nextLine < endLine) {
    if (state.isEmpty(nextLine)) {
      nextLine++;
      continue;
    }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      nextLine++;
      last = nextLine;
      continue;
    }
    break;
  }

  state.line = last;

  token         = state.push('code_block', 'code', 0);
  token.content = state.getLines(startLine, last, 4 + state.blkIndent, true);
  token.map     = [ startLine, state.line ];

  return true;
};

},{}],27:[function(require,module,exports){
// fences (``` lang, ~~~ lang)

'use strict';


module.exports = function fence(state, startLine, endLine, silent) {
  var marker, len, params, nextLine, mem, token, markup,
      haveEndMarker = false,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  if (pos + 3 > max) { return false; }

  marker = state.src.charCodeAt(pos);

  if (marker !== 0x7E/* ~ */ && marker !== 0x60 /* ` */) {
    return false;
  }

  // scan marker length
  mem = pos;
  pos = state.skipChars(pos, marker);

  len = pos - mem;

  if (len < 3) { return false; }

  markup = state.src.slice(mem, pos);
  params = state.src.slice(pos, max);

  if (params.indexOf(String.fromCharCode(marker)) >= 0) { return false; }

  // Since start is found, we can report success here in validation mode
  if (silent) { return true; }

  // search end of block
  nextLine = startLine;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      // unclosed block should be autoclosed by end of document.
      // also block seems to be autoclosed by end of parent
      break;
    }

    pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
    max = state.eMarks[nextLine];

    if (pos < max && state.sCount[nextLine] < state.blkIndent) {
      // non-empty line with negative indent should stop the list:
      // - ```
      //  test
      break;
    }

    if (state.src.charCodeAt(pos) !== marker) { continue; }

    if (state.sCount[nextLine] - state.blkIndent >= 4) {
      // closing fence should be indented less than 4 spaces
      continue;
    }

    pos = state.skipChars(pos, marker);

    // closing code fence must be at least as long as the opening one
    if (pos - mem < len) { continue; }

    // make sure tail has spaces only
    pos = state.skipSpaces(pos);

    if (pos < max) { continue; }

    haveEndMarker = true;
    // found!
    break;
  }

  // If a fence has heading spaces, they should be removed from its inner block
  len = state.sCount[startLine];

  state.line = nextLine + (haveEndMarker ? 1 : 0);

  token         = state.push('fence', 'code', 0);
  token.info    = params;
  token.content = state.getLines(startLine + 1, nextLine, len, true);
  token.markup  = markup;
  token.map     = [ startLine, state.line ];

  return true;
};

},{}],28:[function(require,module,exports){
// heading (#, ##, ...)

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function heading(state, startLine, endLine, silent) {
  var ch, level, tmp, token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  ch  = state.src.charCodeAt(pos);

  if (ch !== 0x23/* # */ || pos >= max) { return false; }

  // count heading level
  level = 1;
  ch = state.src.charCodeAt(++pos);
  while (ch === 0x23/* # */ && pos < max && level <= 6) {
    level++;
    ch = state.src.charCodeAt(++pos);
  }

  if (level > 6 || (pos < max && !isSpace(ch))) { return false; }

  if (silent) { return true; }

  // Let's cut tails like '    ###  ' from the end of string

  max = state.skipSpacesBack(max, pos);
  tmp = state.skipCharsBack(max, 0x23, pos); // #
  if (tmp > pos && isSpace(state.src.charCodeAt(tmp - 1))) {
    max = tmp;
  }

  state.line = startLine + 1;

  token        = state.push('heading_open', 'h' + String(level), 1);
  token.markup = '########'.slice(0, level);
  token.map    = [ startLine, state.line ];

  token          = state.push('inline', '', 0);
  token.content  = state.src.slice(pos, max).trim();
  token.map      = [ startLine, state.line ];
  token.children = [];

  token        = state.push('heading_close', 'h' + String(level), -1);
  token.markup = '########'.slice(0, level);

  return true;
};

},{"../common/utils":11}],29:[function(require,module,exports){
// Horizontal rule

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function hr(state, startLine, endLine, silent) {
  var marker, cnt, ch, token,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  marker = state.src.charCodeAt(pos++);

  // Check hr marker
  if (marker !== 0x2A/* * */ &&
      marker !== 0x2D/* - */ &&
      marker !== 0x5F/* _ */) {
    return false;
  }

  // markers can be mixed with spaces, but there should be at least 3 of them

  cnt = 1;
  while (pos < max) {
    ch = state.src.charCodeAt(pos++);
    if (ch !== marker && !isSpace(ch)) { return false; }
    if (ch === marker) { cnt++; }
  }

  if (cnt < 3) { return false; }

  if (silent) { return true; }

  state.line = startLine + 1;

  token        = state.push('hr', 'hr', 0);
  token.map    = [ startLine, state.line ];
  token.markup = Array(cnt + 1).join(String.fromCharCode(marker));

  return true;
};

},{"../common/utils":11}],30:[function(require,module,exports){
// HTML block

'use strict';


var block_names = require('../common/html_blocks');
var HTML_OPEN_CLOSE_TAG_RE = require('../common/html_re').HTML_OPEN_CLOSE_TAG_RE;

// An array of opening and corresponding closing sequences for html tags,
// last argument defines whether it can terminate a paragraph or not
//
var HTML_SEQUENCES = [
  [ /^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, true ],
  [ /^<!--/,        /-->/,   true ],
  [ /^<\?/,         /\?>/,   true ],
  [ /^<![A-Z]/,     />/,     true ],
  [ /^<!\[CDATA\[/, /\]\]>/, true ],
  [ new RegExp('^</?(' + block_names.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true ],
  [ new RegExp(HTML_OPEN_CLOSE_TAG_RE.source + '\\s*$'),  /^$/, false ]
];


module.exports = function html_block(state, startLine, endLine, silent) {
  var i, nextLine, token, lineText,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine];

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  if (!state.md.options.html) { return false; }

  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

  lineText = state.src.slice(pos, max);

  for (i = 0; i < HTML_SEQUENCES.length; i++) {
    if (HTML_SEQUENCES[i][0].test(lineText)) { break; }
  }

  if (i === HTML_SEQUENCES.length) { return false; }

  if (silent) {
    // true if this sequence can be a terminator, false otherwise
    return HTML_SEQUENCES[i][2];
  }

  nextLine = startLine + 1;

  // If we are here - we detected HTML block.
  // Let's roll down till block end.
  if (!HTML_SEQUENCES[i][1].test(lineText)) {
    for (; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) { break; }

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      lineText = state.src.slice(pos, max);

      if (HTML_SEQUENCES[i][1].test(lineText)) {
        if (lineText.length !== 0) { nextLine++; }
        break;
      }
    }
  }

  state.line = nextLine;

  token         = state.push('html_block', '', 0);
  token.map     = [ startLine, nextLine ];
  token.content = state.getLines(startLine, nextLine, state.blkIndent, true);

  return true;
};

},{"../common/html_blocks":9,"../common/html_re":10}],31:[function(require,module,exports){
// lheading (---, ===)

'use strict';


module.exports = function lheading(state, startLine, endLine/*, silent*/) {
  var content, terminate, i, l, token, pos, max, level, marker,
      nextLine = startLine + 1, oldParentType,
      terminatorRules = state.md.block.ruler.getRules('paragraph');

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  oldParentType = state.parentType;
  state.parentType = 'paragraph'; // use paragraph to match terminatorRules

  // jump line-by-line until empty one or EOF
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

    //
    // Check for underline in setext header
    //
    if (state.sCount[nextLine] >= state.blkIndent) {
      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max) {
        marker = state.src.charCodeAt(pos);

        if (marker === 0x2D/* - */ || marker === 0x3D/* = */) {
          pos = state.skipChars(pos, marker);
          pos = state.skipSpaces(pos);

          if (pos >= max) {
            level = (marker === 0x3D/* = */ ? 1 : 2);
            break;
          }
        }
      }
    }

    // quirk for blockquotes, this line should already be checked by that rule
    if (state.sCount[nextLine] < 0) { continue; }

    // Some tags can terminate paragraph without empty line.
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
  }

  if (!level) {
    // Didn't find valid underline
    return false;
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

  state.line = nextLine + 1;

  token          = state.push('heading_open', 'h' + String(level), 1);
  token.markup   = String.fromCharCode(marker);
  token.map      = [ startLine, state.line ];

  token          = state.push('inline', '', 0);
  token.content  = content;
  token.map      = [ startLine, state.line - 1 ];
  token.children = [];

  token          = state.push('heading_close', 'h' + String(level), -1);
  token.markup   = String.fromCharCode(marker);

  state.parentType = oldParentType;

  return true;
};

},{}],32:[function(require,module,exports){
// Lists

'use strict';

var isSpace = require('../common/utils').isSpace;


// Search `[-+*][\n ]`, returns next pos after marker on success
// or -1 on fail.
function skipBulletListMarker(state, startLine) {
  var marker, pos, max, ch;

  pos = state.bMarks[startLine] + state.tShift[startLine];
  max = state.eMarks[startLine];

  marker = state.src.charCodeAt(pos++);
  // Check bullet
  if (marker !== 0x2A/* * */ &&
      marker !== 0x2D/* - */ &&
      marker !== 0x2B/* + */) {
    return -1;
  }

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace(ch)) {
      // " -test " - is not a list item
      return -1;
    }
  }

  return pos;
}

// Search `\d+[.)][\n ]`, returns next pos after marker on success
// or -1 on fail.
function skipOrderedListMarker(state, startLine) {
  var ch,
      start = state.bMarks[startLine] + state.tShift[startLine],
      pos = start,
      max = state.eMarks[startLine];

  // List marker should have at least 2 chars (digit + dot)
  if (pos + 1 >= max) { return -1; }

  ch = state.src.charCodeAt(pos++);

  if (ch < 0x30/* 0 */ || ch > 0x39/* 9 */) { return -1; }

  for (;;) {
    // EOL -> fail
    if (pos >= max) { return -1; }

    ch = state.src.charCodeAt(pos++);

    if (ch >= 0x30/* 0 */ && ch <= 0x39/* 9 */) {

      // List marker should have no more than 9 digits
      // (prevents integer overflow in browsers)
      if (pos - start >= 10) { return -1; }

      continue;
    }

    // found valid marker
    if (ch === 0x29/* ) */ || ch === 0x2e/* . */) {
      break;
    }

    return -1;
  }


  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (!isSpace(ch)) {
      // " 1.test " - is not a list item
      return -1;
    }
  }
  return pos;
}

function markTightParagraphs(state, idx) {
  var i, l,
      level = state.level + 2;

  for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
    if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
      state.tokens[i + 2].hidden = true;
      state.tokens[i].hidden = true;
      i += 2;
    }
  }
}


module.exports = function list(state, startLine, endLine, silent) {
  var ch,
      contentStart,
      i,
      indent,
      indentAfterMarker,
      initial,
      isOrdered,
      itemLines,
      l,
      listLines,
      listTokIdx,
      markerCharCode,
      markerValue,
      max,
      nextLine,
      offset,
      oldIndent,
      oldLIndent,
      oldParentType,
      oldTShift,
      oldTight,
      pos,
      posAfterMarker,
      prevEmptyEnd,
      start,
      terminate,
      terminatorRules,
      token,
      isTerminatingParagraph = false,
      tight = true;

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  // limit conditions when list can interrupt
  // a paragraph (validation mode only)
  if (silent && state.parentType === 'paragraph') {
    // Next list item should still terminate previous list item;
    //
    // This code can fail if plugins use blkIndent as well as lists,
    // but I hope the spec gets fixed long before that happens.
    //
    if (state.tShift[startLine] >= state.blkIndent) {
      isTerminatingParagraph = true;
    }
  }

  // Detect list type and position after marker
  if ((posAfterMarker = skipOrderedListMarker(state, startLine)) >= 0) {
    isOrdered = true;
    start = state.bMarks[startLine] + state.tShift[startLine];
    markerValue = Number(state.src.substr(start, posAfterMarker - start - 1));

    // If we're starting a new ordered list right after
    // a paragraph, it should start with 1.
    if (isTerminatingParagraph && markerValue !== 1) return false;

  } else if ((posAfterMarker = skipBulletListMarker(state, startLine)) >= 0) {
    isOrdered = false;

  } else {
    return false;
  }

  // If we're starting a new unordered list right after
  // a paragraph, first line should not be empty.
  if (isTerminatingParagraph) {
    if (state.skipSpaces(posAfterMarker) >= state.eMarks[startLine]) return false;
  }

  // We should terminate list on style change. Remember first one to compare.
  markerCharCode = state.src.charCodeAt(posAfterMarker - 1);

  // For validation mode we can terminate immediately
  if (silent) { return true; }

  // Start list
  listTokIdx = state.tokens.length;

  if (isOrdered) {
    token       = state.push('ordered_list_open', 'ol', 1);
    if (markerValue !== 1) {
      token.attrs = [ [ 'start', markerValue ] ];
    }

  } else {
    token       = state.push('bullet_list_open', 'ul', 1);
  }

  token.map    = listLines = [ startLine, 0 ];
  token.markup = String.fromCharCode(markerCharCode);

  //
  // Iterate list items
  //

  nextLine = startLine;
  prevEmptyEnd = false;
  terminatorRules = state.md.block.ruler.getRules('list');

  oldParentType = state.parentType;
  state.parentType = 'list';

  while (nextLine < endLine) {
    pos = posAfterMarker;
    max = state.eMarks[nextLine];

    initial = offset = state.sCount[nextLine] + posAfterMarker - (state.bMarks[startLine] + state.tShift[startLine]);

    while (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (ch === 0x09) {
        offset += 4 - (offset + state.bsCount[nextLine]) % 4;
      } else if (ch === 0x20) {
        offset++;
      } else {
        break;
      }

      pos++;
    }

    contentStart = pos;

    if (contentStart >= max) {
      // trimming space in "-    \n  3" case, indent is 1 here
      indentAfterMarker = 1;
    } else {
      indentAfterMarker = offset - initial;
    }

    // If we have more than 4 spaces, the indent is 1
    // (the rest is just indented code block)
    if (indentAfterMarker > 4) { indentAfterMarker = 1; }

    // "  -  test"
    //  ^^^^^ - calculating total length of this thing
    indent = initial + indentAfterMarker;

    // Run subparser & write tokens
    token        = state.push('list_item_open', 'li', 1);
    token.markup = String.fromCharCode(markerCharCode);
    token.map    = itemLines = [ startLine, 0 ];

    oldIndent = state.blkIndent;
    oldTight = state.tight;
    oldTShift = state.tShift[startLine];
    oldLIndent = state.sCount[startLine];
    state.blkIndent = indent;
    state.tight = true;
    state.tShift[startLine] = contentStart - state.bMarks[startLine];
    state.sCount[startLine] = offset;

    if (contentStart >= max && state.isEmpty(startLine + 1)) {
      // workaround for this case
      // (list item is empty, list terminates before "foo"):
      // ~~~~~~~~
      //   -
      //
      //     foo
      // ~~~~~~~~
      state.line = Math.min(state.line + 2, endLine);
    } else {
      state.md.block.tokenize(state, startLine, endLine, true);
    }

    // If any of list item is tight, mark list as tight
    if (!state.tight || prevEmptyEnd) {
      tight = false;
    }
    // Item become loose if finish with empty line,
    // but we should filter last element, because it means list finish
    prevEmptyEnd = (state.line - startLine) > 1 && state.isEmpty(state.line - 1);

    state.blkIndent = oldIndent;
    state.tShift[startLine] = oldTShift;
    state.sCount[startLine] = oldLIndent;
    state.tight = oldTight;

    token        = state.push('list_item_close', 'li', -1);
    token.markup = String.fromCharCode(markerCharCode);

    nextLine = startLine = state.line;
    itemLines[1] = nextLine;
    contentStart = state.bMarks[startLine];

    if (nextLine >= endLine) { break; }

    //
    // Try to check if list is terminated or continued.
    //
    if (state.sCount[nextLine] < state.blkIndent) { break; }

    // fail if terminating block found
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }

    // fail if list has another type
    if (isOrdered) {
      posAfterMarker = skipOrderedListMarker(state, nextLine);
      if (posAfterMarker < 0) { break; }
    } else {
      posAfterMarker = skipBulletListMarker(state, nextLine);
      if (posAfterMarker < 0) { break; }
    }

    if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) { break; }
  }

  // Finalize list
  if (isOrdered) {
    token = state.push('ordered_list_close', 'ol', -1);
  } else {
    token = state.push('bullet_list_close', 'ul', -1);
  }
  token.markup = String.fromCharCode(markerCharCode);

  listLines[1] = nextLine;
  state.line = nextLine;

  state.parentType = oldParentType;

  // mark paragraphs tight if needed
  if (tight) {
    markTightParagraphs(state, listTokIdx);
  }

  return true;
};

},{"../common/utils":11}],33:[function(require,module,exports){
// Paragraph

'use strict';


module.exports = function paragraph(state, startLine/*, endLine*/) {
  var content, terminate, i, l, token, oldParentType,
      nextLine = startLine + 1,
      terminatorRules = state.md.block.ruler.getRules('paragraph'),
      endLine = state.lineMax;

  oldParentType = state.parentType;
  state.parentType = 'paragraph';

  // jump line-by-line until empty one or EOF
  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

    // quirk for blockquotes, this line should already be checked by that rule
    if (state.sCount[nextLine] < 0) { continue; }

    // Some tags can terminate paragraph without empty line.
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
  }

  content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

  state.line = nextLine;

  token          = state.push('paragraph_open', 'p', 1);
  token.map      = [ startLine, state.line ];

  token          = state.push('inline', '', 0);
  token.content  = content;
  token.map      = [ startLine, state.line ];
  token.children = [];

  token          = state.push('paragraph_close', 'p', -1);

  state.parentType = oldParentType;

  return true;
};

},{}],34:[function(require,module,exports){
'use strict';


var normalizeReference   = require('../common/utils').normalizeReference;
var isSpace              = require('../common/utils').isSpace;


module.exports = function reference(state, startLine, _endLine, silent) {
  var ch,
      destEndPos,
      destEndLineNo,
      endLine,
      href,
      i,
      l,
      label,
      labelEnd,
      oldParentType,
      res,
      start,
      str,
      terminate,
      terminatorRules,
      title,
      lines = 0,
      pos = state.bMarks[startLine] + state.tShift[startLine],
      max = state.eMarks[startLine],
      nextLine = startLine + 1;

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

  if (state.src.charCodeAt(pos) !== 0x5B/* [ */) { return false; }

  // Simple check to quickly interrupt scan on [link](url) at the start of line.
  // Can be useful on practice: https://github.com/markdown-it/markdown-it/issues/54
  while (++pos < max) {
    if (state.src.charCodeAt(pos) === 0x5D /* ] */ &&
        state.src.charCodeAt(pos - 1) !== 0x5C/* \ */) {
      if (pos + 1 === max) { return false; }
      if (state.src.charCodeAt(pos + 1) !== 0x3A/* : */) { return false; }
      break;
    }
  }

  endLine = state.lineMax;

  // jump line-by-line until empty one or EOF
  terminatorRules = state.md.block.ruler.getRules('reference');

  oldParentType = state.parentType;
  state.parentType = 'reference';

  for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
    // this would be a code block normally, but after paragraph
    // it's considered a lazy continuation regardless of what's there
    if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

    // quirk for blockquotes, this line should already be checked by that rule
    if (state.sCount[nextLine] < 0) { continue; }

    // Some tags can terminate paragraph without empty line.
    terminate = false;
    for (i = 0, l = terminatorRules.length; i < l; i++) {
      if (terminatorRules[i](state, nextLine, endLine, true)) {
        terminate = true;
        break;
      }
    }
    if (terminate) { break; }
  }

  str = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
  max = str.length;

  for (pos = 1; pos < max; pos++) {
    ch = str.charCodeAt(pos);
    if (ch === 0x5B /* [ */) {
      return false;
    } else if (ch === 0x5D /* ] */) {
      labelEnd = pos;
      break;
    } else if (ch === 0x0A /* \n */) {
      lines++;
    } else if (ch === 0x5C /* \ */) {
      pos++;
      if (pos < max && str.charCodeAt(pos) === 0x0A) {
        lines++;
      }
    }
  }

  if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A/* : */) { return false; }

  // [label]:   destination   'title'
  //         ^^^ skip optional whitespace here
  for (pos = labelEnd + 2; pos < max; pos++) {
    ch = str.charCodeAt(pos);
    if (ch === 0x0A) {
      lines++;
    } else if (isSpace(ch)) {
      /*eslint no-empty:0*/
    } else {
      break;
    }
  }

  // [label]:   destination   'title'
  //            ^^^^^^^^^^^ parse this
  res = state.md.helpers.parseLinkDestination(str, pos, max);
  if (!res.ok) { return false; }

  href = state.md.normalizeLink(res.str);
  if (!state.md.validateLink(href)) { return false; }

  pos = res.pos;
  lines += res.lines;

  // save cursor state, we could require to rollback later
  destEndPos = pos;
  destEndLineNo = lines;

  // [label]:   destination   'title'
  //                       ^^^ skipping those spaces
  start = pos;
  for (; pos < max; pos++) {
    ch = str.charCodeAt(pos);
    if (ch === 0x0A) {
      lines++;
    } else if (isSpace(ch)) {
      /*eslint no-empty:0*/
    } else {
      break;
    }
  }

  // [label]:   destination   'title'
  //                          ^^^^^^^ parse this
  res = state.md.helpers.parseLinkTitle(str, pos, max);
  if (pos < max && start !== pos && res.ok) {
    title = res.str;
    pos = res.pos;
    lines += res.lines;
  } else {
    title = '';
    pos = destEndPos;
    lines = destEndLineNo;
  }

  // skip trailing spaces until the rest of the line
  while (pos < max) {
    ch = str.charCodeAt(pos);
    if (!isSpace(ch)) { break; }
    pos++;
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    if (title) {
      // garbage at the end of the line after title,
      // but it could still be a valid reference if we roll back
      title = '';
      pos = destEndPos;
      lines = destEndLineNo;
      while (pos < max) {
        ch = str.charCodeAt(pos);
        if (!isSpace(ch)) { break; }
        pos++;
      }
    }
  }

  if (pos < max && str.charCodeAt(pos) !== 0x0A) {
    // garbage at the end of the line
    return false;
  }

  label = normalizeReference(str.slice(1, labelEnd));
  if (!label) {
    // CommonMark 0.20 disallows empty labels
    return false;
  }

  // Reference can not terminate anything. This check is for safety only.
  /*istanbul ignore if*/
  if (silent) { return true; }

  if (typeof state.env.references === 'undefined') {
    state.env.references = {};
  }
  if (typeof state.env.references[label] === 'undefined') {
    state.env.references[label] = { title: title, href: href };
  }

  state.parentType = oldParentType;

  state.line = startLine + lines + 1;
  return true;
};

},{"../common/utils":11}],35:[function(require,module,exports){
// Parser state class

'use strict';

var Token = require('../token');
var isSpace = require('../common/utils').isSpace;


function StateBlock(src, md, env, tokens) {
  var ch, s, start, pos, len, indent, offset, indent_found;

  this.src = src;

  // link to parser instance
  this.md     = md;

  this.env = env;

  //
  // Internal state vartiables
  //

  this.tokens = tokens;

  this.bMarks = [];  // line begin offsets for fast jumps
  this.eMarks = [];  // line end offsets for fast jumps
  this.tShift = [];  // offsets of the first non-space characters (tabs not expanded)
  this.sCount = [];  // indents for each line (tabs expanded)

  // An amount of virtual spaces (tabs expanded) between beginning
  // of each line (bMarks) and real beginning of that line.
  //
  // It exists only as a hack because blockquotes override bMarks
  // losing information in the process.
  //
  // It's used only when expanding tabs, you can think about it as
  // an initial tab length, e.g. bsCount=21 applied to string `\t123`
  // means first tab should be expanded to 4-21%4 === 3 spaces.
  //
  this.bsCount = [];

  // block parser variables
  this.blkIndent  = 0; // required block content indent
                       // (for example, if we are in list)
  this.line       = 0; // line index in src
  this.lineMax    = 0; // lines count
  this.tight      = false;  // loose/tight mode for lists
  this.ddIndent   = -1; // indent of the current dd block (-1 if there isn't any)

  // can be 'blockquote', 'list', 'root', 'paragraph' or 'reference'
  // used in lists to determine if they interrupt a paragraph
  this.parentType = 'root';

  this.level = 0;

  // renderer
  this.result = '';

  // Create caches
  // Generate markers.
  s = this.src;
  indent_found = false;

  for (start = pos = indent = offset = 0, len = s.length; pos < len; pos++) {
    ch = s.charCodeAt(pos);

    if (!indent_found) {
      if (isSpace(ch)) {
        indent++;

        if (ch === 0x09) {
          offset += 4 - offset % 4;
        } else {
          offset++;
        }
        continue;
      } else {
        indent_found = true;
      }
    }

    if (ch === 0x0A || pos === len - 1) {
      if (ch !== 0x0A) { pos++; }
      this.bMarks.push(start);
      this.eMarks.push(pos);
      this.tShift.push(indent);
      this.sCount.push(offset);
      this.bsCount.push(0);

      indent_found = false;
      indent = 0;
      offset = 0;
      start = pos + 1;
    }
  }

  // Push fake entry to simplify cache bounds checks
  this.bMarks.push(s.length);
  this.eMarks.push(s.length);
  this.tShift.push(0);
  this.sCount.push(0);
  this.bsCount.push(0);

  this.lineMax = this.bMarks.length - 1; // don't count last fake line
}

// Push new token to "stream".
//
StateBlock.prototype.push = function (type, tag, nesting) {
  var token = new Token(type, tag, nesting);
  token.block = true;

  if (nesting < 0) { this.level--; }
  token.level = this.level;
  if (nesting > 0) { this.level++; }

  this.tokens.push(token);
  return token;
};

StateBlock.prototype.isEmpty = function isEmpty(line) {
  return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
};

StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
  for (var max = this.lineMax; from < max; from++) {
    if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
      break;
    }
  }
  return from;
};

// Skip spaces from given position.
StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
  var ch;

  for (var max = this.src.length; pos < max; pos++) {
    ch = this.src.charCodeAt(pos);
    if (!isSpace(ch)) { break; }
  }
  return pos;
};

// Skip spaces from given position in reverse.
StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
  if (pos <= min) { return pos; }

  while (pos > min) {
    if (!isSpace(this.src.charCodeAt(--pos))) { return pos + 1; }
  }
  return pos;
};

// Skip char codes from given position
StateBlock.prototype.skipChars = function skipChars(pos, code) {
  for (var max = this.src.length; pos < max; pos++) {
    if (this.src.charCodeAt(pos) !== code) { break; }
  }
  return pos;
};

// Skip char codes reverse from given position - 1
StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code, min) {
  if (pos <= min) { return pos; }

  while (pos > min) {
    if (code !== this.src.charCodeAt(--pos)) { return pos + 1; }
  }
  return pos;
};

// cut lines range from source.
StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
  var i, lineIndent, ch, first, last, queue, lineStart,
      line = begin;

  if (begin >= end) {
    return '';
  }

  queue = new Array(end - begin);

  for (i = 0; line < end; line++, i++) {
    lineIndent = 0;
    lineStart = first = this.bMarks[line];

    if (line + 1 < end || keepLastLF) {
      // No need for bounds check because we have fake entry on tail.
      last = this.eMarks[line] + 1;
    } else {
      last = this.eMarks[line];
    }

    while (first < last && lineIndent < indent) {
      ch = this.src.charCodeAt(first);

      if (isSpace(ch)) {
        if (ch === 0x09) {
          lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
        } else {
          lineIndent++;
        }
      } else if (first - lineStart < this.tShift[line]) {
        // patched tShift masked characters to look like spaces (blockquotes, list markers)
        lineIndent++;
      } else {
        break;
      }

      first++;
    }

    if (lineIndent > indent) {
      // partially expanding tabs in code blocks, e.g '\t\tfoobar'
      // with indent=2 becomes '  \tfoobar'
      queue[i] = new Array(lineIndent - indent + 1).join(' ') + this.src.slice(first, last);
    } else {
      queue[i] = this.src.slice(first, last);
    }
  }

  return queue.join('');
};

// re-export Token class to use in block rules
StateBlock.prototype.Token = Token;


module.exports = StateBlock;

},{"../common/utils":11,"../token":58}],36:[function(require,module,exports){
// GFM table, non-standard

'use strict';

var isSpace = require('../common/utils').isSpace;


function getLine(state, line) {
  var pos = state.bMarks[line] + state.blkIndent,
      max = state.eMarks[line];

  return state.src.substr(pos, max - pos);
}

function escapedSplit(str) {
  var result = [],
      pos = 0,
      max = str.length,
      ch,
      escapes = 0,
      lastPos = 0,
      backTicked = false,
      lastBackTick = 0;

  ch  = str.charCodeAt(pos);

  while (pos < max) {
    if (ch === 0x60/* ` */) {
      if (backTicked) {
        // make \` close code sequence, but not open it;
        // the reason is: `\` is correct code block
        backTicked = false;
        lastBackTick = pos;
      } else if (escapes % 2 === 0) {
        backTicked = true;
        lastBackTick = pos;
      }
    } else if (ch === 0x7c/* | */ && (escapes % 2 === 0) && !backTicked) {
      result.push(str.substring(lastPos, pos));
      lastPos = pos + 1;
    }

    if (ch === 0x5c/* \ */) {
      escapes++;
    } else {
      escapes = 0;
    }

    pos++;

    // If there was an un-closed backtick, go back to just after
    // the last backtick, but as if it was a normal character
    if (pos === max && backTicked) {
      backTicked = false;
      pos = lastBackTick + 1;
    }

    ch = str.charCodeAt(pos);
  }

  result.push(str.substring(lastPos));

  return result;
}


module.exports = function table(state, startLine, endLine, silent) {
  var ch, lineText, pos, i, nextLine, columns, columnCount, token,
      aligns, t, tableLines, tbodyLines;

  // should have at least two lines
  if (startLine + 2 > endLine) { return false; }

  nextLine = startLine + 1;

  if (state.sCount[nextLine] < state.blkIndent) { return false; }

  // if it's indented more than 3 spaces, it should be a code block
  if (state.sCount[nextLine] - state.blkIndent >= 4) { return false; }

  // first character of the second line should be '|', '-', ':',
  // and no other characters are allowed but spaces;
  // basically, this is the equivalent of /^[-:|][-:|\s]*$/ regexp

  pos = state.bMarks[nextLine] + state.tShift[nextLine];
  if (pos >= state.eMarks[nextLine]) { return false; }

  ch = state.src.charCodeAt(pos++);
  if (ch !== 0x7C/* | */ && ch !== 0x2D/* - */ && ch !== 0x3A/* : */) { return false; }

  while (pos < state.eMarks[nextLine]) {
    ch = state.src.charCodeAt(pos);

    if (ch !== 0x7C/* | */ && ch !== 0x2D/* - */ && ch !== 0x3A/* : */ && !isSpace(ch)) { return false; }

    pos++;
  }

  lineText = getLine(state, startLine + 1);

  columns = lineText.split('|');
  aligns = [];
  for (i = 0; i < columns.length; i++) {
    t = columns[i].trim();
    if (!t) {
      // allow empty columns before and after table, but not in between columns;
      // e.g. allow ` |---| `, disallow ` ---||--- `
      if (i === 0 || i === columns.length - 1) {
        continue;
      } else {
        return false;
      }
    }

    if (!/^:?-+:?$/.test(t)) { return false; }
    if (t.charCodeAt(t.length - 1) === 0x3A/* : */) {
      aligns.push(t.charCodeAt(0) === 0x3A/* : */ ? 'center' : 'right');
    } else if (t.charCodeAt(0) === 0x3A/* : */) {
      aligns.push('left');
    } else {
      aligns.push('');
    }
  }

  lineText = getLine(state, startLine).trim();
  if (lineText.indexOf('|') === -1) { return false; }
  if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }
  columns = escapedSplit(lineText.replace(/^\||\|$/g, ''));

  // header row will define an amount of columns in the entire table,
  // and align row shouldn't be smaller than that (the rest of the rows can)
  columnCount = columns.length;
  if (columnCount > aligns.length) { return false; }

  if (silent) { return true; }

  token     = state.push('table_open', 'table', 1);
  token.map = tableLines = [ startLine, 0 ];

  token     = state.push('thead_open', 'thead', 1);
  token.map = [ startLine, startLine + 1 ];

  token     = state.push('tr_open', 'tr', 1);
  token.map = [ startLine, startLine + 1 ];

  for (i = 0; i < columns.length; i++) {
    token          = state.push('th_open', 'th', 1);
    token.map      = [ startLine, startLine + 1 ];
    if (aligns[i]) {
      token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
    }

    token          = state.push('inline', '', 0);
    token.content  = columns[i].trim();
    token.map      = [ startLine, startLine + 1 ];
    token.children = [];

    token          = state.push('th_close', 'th', -1);
  }

  token     = state.push('tr_close', 'tr', -1);
  token     = state.push('thead_close', 'thead', -1);

  token     = state.push('tbody_open', 'tbody', 1);
  token.map = tbodyLines = [ startLine + 2, 0 ];

  for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
    if (state.sCount[nextLine] < state.blkIndent) { break; }

    lineText = getLine(state, nextLine).trim();
    if (lineText.indexOf('|') === -1) { break; }
    if (state.sCount[nextLine] - state.blkIndent >= 4) { break; }
    columns = escapedSplit(lineText.replace(/^\||\|$/g, ''));

    token = state.push('tr_open', 'tr', 1);
    for (i = 0; i < columnCount; i++) {
      token          = state.push('td_open', 'td', 1);
      if (aligns[i]) {
        token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
      }

      token          = state.push('inline', '', 0);
      token.content  = columns[i] ? columns[i].trim() : '';
      token.children = [];

      token          = state.push('td_close', 'td', -1);
    }
    token = state.push('tr_close', 'tr', -1);
  }
  token = state.push('tbody_close', 'tbody', -1);
  token = state.push('table_close', 'table', -1);

  tableLines[1] = tbodyLines[1] = nextLine;
  state.line = nextLine;
  return true;
};

},{"../common/utils":11}],37:[function(require,module,exports){
'use strict';


module.exports = function block(state) {
  var token;

  if (state.inlineMode) {
    token          = new state.Token('inline', '', 0);
    token.content  = state.src;
    token.map      = [ 0, 1 ];
    token.children = [];
    state.tokens.push(token);
  } else {
    state.md.block.parse(state.src, state.md, state.env, state.tokens);
  }
};

},{}],38:[function(require,module,exports){
'use strict';

module.exports = function inline(state) {
  var tokens = state.tokens, tok, i, l;

  // Parse inlines
  for (i = 0, l = tokens.length; i < l; i++) {
    tok = tokens[i];
    if (tok.type === 'inline') {
      state.md.inline.parse(tok.content, state.md, state.env, tok.children);
    }
  }
};

},{}],39:[function(require,module,exports){
// Replace link-like texts with link nodes.
//
// Currently restricted by `md.validateLink()` to http/https/ftp
//
'use strict';


var arrayReplaceAt = require('../common/utils').arrayReplaceAt;


function isLinkOpen(str) {
  return /^<a[>\s]/i.test(str);
}
function isLinkClose(str) {
  return /^<\/a\s*>/i.test(str);
}


module.exports = function linkify(state) {
  var i, j, l, tokens, token, currentToken, nodes, ln, text, pos, lastPos,
      level, htmlLinkLevel, url, fullUrl, urlText,
      blockTokens = state.tokens,
      links;

  if (!state.md.options.linkify) { return; }

  for (j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== 'inline' ||
        !state.md.linkify.pretest(blockTokens[j].content)) {
      continue;
    }

    tokens = blockTokens[j].children;

    htmlLinkLevel = 0;

    // We scan from the end, to keep position when new tags added.
    // Use reversed logic in links start/end match
    for (i = tokens.length - 1; i >= 0; i--) {
      currentToken = tokens[i];

      // Skip content of markdown links
      if (currentToken.type === 'link_close') {
        i--;
        while (tokens[i].level !== currentToken.level && tokens[i].type !== 'link_open') {
          i--;
        }
        continue;
      }

      // Skip content of html tag links
      if (currentToken.type === 'html_inline') {
        if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
          htmlLinkLevel--;
        }
        if (isLinkClose(currentToken.content)) {
          htmlLinkLevel++;
        }
      }
      if (htmlLinkLevel > 0) { continue; }

      if (currentToken.type === 'text' && state.md.linkify.test(currentToken.content)) {

        text = currentToken.content;
        links = state.md.linkify.match(text);

        // Now split string to nodes
        nodes = [];
        level = currentToken.level;
        lastPos = 0;

        for (ln = 0; ln < links.length; ln++) {

          url = links[ln].url;
          fullUrl = state.md.normalizeLink(url);
          if (!state.md.validateLink(fullUrl)) { continue; }

          urlText = links[ln].text;

          // Linkifier might send raw hostnames like "example.com", where url
          // starts with domain name. So we prepend http:// in those cases,
          // and remove it afterwards.
          //
          if (!links[ln].schema) {
            urlText = state.md.normalizeLinkText('http://' + urlText).replace(/^http:\/\//, '');
          } else if (links[ln].schema === 'mailto:' && !/^mailto:/i.test(urlText)) {
            urlText = state.md.normalizeLinkText('mailto:' + urlText).replace(/^mailto:/, '');
          } else {
            urlText = state.md.normalizeLinkText(urlText);
          }

          pos = links[ln].index;

          if (pos > lastPos) {
            token         = new state.Token('text', '', 0);
            token.content = text.slice(lastPos, pos);
            token.level   = level;
            nodes.push(token);
          }

          token         = new state.Token('link_open', 'a', 1);
          token.attrs   = [ [ 'href', fullUrl ] ];
          token.level   = level++;
          token.markup  = 'linkify';
          token.info    = 'auto';
          nodes.push(token);

          token         = new state.Token('text', '', 0);
          token.content = urlText;
          token.level   = level;
          nodes.push(token);

          token         = new state.Token('link_close', 'a', -1);
          token.level   = --level;
          token.markup  = 'linkify';
          token.info    = 'auto';
          nodes.push(token);

          lastPos = links[ln].lastIndex;
        }
        if (lastPos < text.length) {
          token         = new state.Token('text', '', 0);
          token.content = text.slice(lastPos);
          token.level   = level;
          nodes.push(token);
        }

        // replace current node
        blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
      }
    }
  }
};

},{"../common/utils":11}],40:[function(require,module,exports){
// Normalize input string

'use strict';


var NEWLINES_RE  = /\r[\n\u0085]?|[\u2424\u2028\u0085]/g;
var NULL_RE      = /\u0000/g;


module.exports = function inline(state) {
  var str;

  // Normalize newlines
  str = state.src.replace(NEWLINES_RE, '\n');

  // Replace NULL characters
  str = str.replace(NULL_RE, '\uFFFD');

  state.src = str;
};

},{}],41:[function(require,module,exports){
// Simple typographyc replacements
//
// (c) (C) → ©
// (tm) (TM) → ™
// (r) (R) → ®
// +- → ±
// (p) (P) -> §
// ... → … (also ?.... → ?.., !.... → !..)
// ???????? → ???, !!!!! → !!!, `,,` → `,`
// -- → &ndash;, --- → &mdash;
//
'use strict';

// TODO:
// - fractionals 1/2, 1/4, 3/4 -> ½, ¼, ¾
// - miltiplication 2 x 4 -> 2 × 4

var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;

// Workaround for phantomjs - need regex without /g flag,
// or root check will fail every second time
var SCOPED_ABBR_TEST_RE = /\((c|tm|r|p)\)/i;

var SCOPED_ABBR_RE = /\((c|tm|r|p)\)/ig;
var SCOPED_ABBR = {
  c: '©',
  r: '®',
  p: '§',
  tm: '™'
};

function replaceFn(match, name) {
  return SCOPED_ABBR[name.toLowerCase()];
}

function replace_scoped(inlineTokens) {
  var i, token, inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}

function replace_rare(inlineTokens) {
  var i, token, inside_autolink = 0;

  for (i = inlineTokens.length - 1; i >= 0; i--) {
    token = inlineTokens[i];

    if (token.type === 'text' && !inside_autolink) {
      if (RARE_RE.test(token.content)) {
        token.content = token.content
                    .replace(/\+-/g, '±')
                    // .., ..., ....... -> …
                    // but ?..... & !..... -> ?.. & !..
                    .replace(/\.{2,}/g, '…').replace(/([?!])…/g, '$1..')
                    .replace(/([?!]){4,}/g, '$1$1$1').replace(/,{2,}/g, ',')
                    // em-dash
                    .replace(/(^|[^-])---([^-]|$)/mg, '$1\u2014$2')
                    // en-dash
                    .replace(/(^|\s)--(\s|$)/mg, '$1\u2013$2')
                    .replace(/(^|[^-\s])--([^-\s]|$)/mg, '$1\u2013$2');
      }
    }

    if (token.type === 'link_open' && token.info === 'auto') {
      inside_autolink--;
    }

    if (token.type === 'link_close' && token.info === 'auto') {
      inside_autolink++;
    }
  }
}


module.exports = function replace(state) {
  var blkIdx;

  if (!state.md.options.typographer) { return; }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

    if (state.tokens[blkIdx].type !== 'inline') { continue; }

    if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
      replace_scoped(state.tokens[blkIdx].children);
    }

    if (RARE_RE.test(state.tokens[blkIdx].content)) {
      replace_rare(state.tokens[blkIdx].children);
    }

  }
};

},{}],42:[function(require,module,exports){
// Convert straight quotation marks to typographic ones
//
'use strict';


var isWhiteSpace   = require('../common/utils').isWhiteSpace;
var isPunctChar    = require('../common/utils').isPunctChar;
var isMdAsciiPunct = require('../common/utils').isMdAsciiPunct;

var QUOTE_TEST_RE = /['"]/;
var QUOTE_RE = /['"]/g;
var APOSTROPHE = '\u2019'; /* ’ */


function replaceAt(str, index, ch) {
  return str.substr(0, index) + ch + str.substr(index + 1);
}

function process_inlines(tokens, state) {
  var i, token, text, t, pos, max, thisLevel, item, lastChar, nextChar,
      isLastPunctChar, isNextPunctChar, isLastWhiteSpace, isNextWhiteSpace,
      canOpen, canClose, j, isSingle, stack, openQuote, closeQuote;

  stack = [];

  for (i = 0; i < tokens.length; i++) {
    token = tokens[i];

    thisLevel = tokens[i].level;

    for (j = stack.length - 1; j >= 0; j--) {
      if (stack[j].level <= thisLevel) { break; }
    }
    stack.length = j + 1;

    if (token.type !== 'text') { continue; }

    text = token.content;
    pos = 0;
    max = text.length;

    /*eslint no-labels:0,block-scoped-var:0*/
    OUTER:
    while (pos < max) {
      QUOTE_RE.lastIndex = pos;
      t = QUOTE_RE.exec(text);
      if (!t) { break; }

      canOpen = canClose = true;
      pos = t.index + 1;
      isSingle = (t[0] === "'");

      // Find previous character,
      // default to space if it's the beginning of the line
      //
      lastChar = 0x20;

      if (t.index - 1 >= 0) {
        lastChar = text.charCodeAt(t.index - 1);
      } else {
        for (j = i - 1; j >= 0; j--) {
          if (tokens[j].type !== 'text') { continue; }

          lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
          break;
        }
      }

      // Find next character,
      // default to space if it's the end of the line
      //
      nextChar = 0x20;

      if (pos < max) {
        nextChar = text.charCodeAt(pos);
      } else {
        for (j = i + 1; j < tokens.length; j++) {
          if (tokens[j].type !== 'text') { continue; }

          nextChar = tokens[j].content.charCodeAt(0);
          break;
        }
      }

      isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
      isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

      isLastWhiteSpace = isWhiteSpace(lastChar);
      isNextWhiteSpace = isWhiteSpace(nextChar);

      if (isNextWhiteSpace) {
        canOpen = false;
      } else if (isNextPunctChar) {
        if (!(isLastWhiteSpace || isLastPunctChar)) {
          canOpen = false;
        }
      }

      if (isLastWhiteSpace) {
        canClose = false;
      } else if (isLastPunctChar) {
        if (!(isNextWhiteSpace || isNextPunctChar)) {
          canClose = false;
        }
      }

      if (nextChar === 0x22 /* " */ && t[0] === '"') {
        if (lastChar >= 0x30 /* 0 */ && lastChar <= 0x39 /* 9 */) {
          // special case: 1"" - count first quote as an inch
          canClose = canOpen = false;
        }
      }

      if (canOpen && canClose) {
        // treat this as the middle of the word
        canOpen = false;
        canClose = isNextPunctChar;
      }

      if (!canOpen && !canClose) {
        // middle of word
        if (isSingle) {
          token.content = replaceAt(token.content, t.index, APOSTROPHE);
        }
        continue;
      }

      if (canClose) {
        // this could be a closing quote, rewind the stack to get a match
        for (j = stack.length - 1; j >= 0; j--) {
          item = stack[j];
          if (stack[j].level < thisLevel) { break; }
          if (item.single === isSingle && stack[j].level === thisLevel) {
            item = stack[j];

            if (isSingle) {
              openQuote = state.md.options.quotes[2];
              closeQuote = state.md.options.quotes[3];
            } else {
              openQuote = state.md.options.quotes[0];
              closeQuote = state.md.options.quotes[1];
            }

            // replace token.content *before* tokens[item.token].content,
            // because, if they are pointing at the same token, replaceAt
            // could mess up indices when quote length != 1
            token.content = replaceAt(token.content, t.index, closeQuote);
            tokens[item.token].content = replaceAt(
              tokens[item.token].content, item.pos, openQuote);

            pos += closeQuote.length - 1;
            if (item.token === i) { pos += openQuote.length - 1; }

            text = token.content;
            max = text.length;

            stack.length = j;
            continue OUTER;
          }
        }
      }

      if (canOpen) {
        stack.push({
          token: i,
          pos: t.index,
          single: isSingle,
          level: thisLevel
        });
      } else if (canClose && isSingle) {
        token.content = replaceAt(token.content, t.index, APOSTROPHE);
      }
    }
  }
}


module.exports = function smartquotes(state) {
  /*eslint max-depth:0*/
  var blkIdx;

  if (!state.md.options.typographer) { return; }

  for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

    if (state.tokens[blkIdx].type !== 'inline' ||
        !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
      continue;
    }

    process_inlines(state.tokens[blkIdx].children, state);
  }
};

},{"../common/utils":11}],43:[function(require,module,exports){
// Core state object
//
'use strict';

var Token = require('../token');


function StateCore(src, md, env) {
  this.src = src;
  this.env = env;
  this.tokens = [];
  this.inlineMode = false;
  this.md = md; // link to parser instance
}

// re-export Token class to use in core rules
StateCore.prototype.Token = Token;


module.exports = StateCore;

},{"../token":58}],44:[function(require,module,exports){
// Process autolinks '<protocol:...>'

'use strict';


/*eslint max-len:0*/
var EMAIL_RE    = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;
var AUTOLINK_RE = /^<([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)>/;


module.exports = function autolink(state, silent) {
  var tail, linkMatch, emailMatch, url, fullUrl, token,
      pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

  tail = state.src.slice(pos);

  if (tail.indexOf('>') < 0) { return false; }

  if (AUTOLINK_RE.test(tail)) {
    linkMatch = tail.match(AUTOLINK_RE);

    url = linkMatch[0].slice(1, -1);
    fullUrl = state.md.normalizeLink(url);
    if (!state.md.validateLink(fullUrl)) { return false; }

    if (!silent) {
      token         = state.push('link_open', 'a', 1);
      token.attrs   = [ [ 'href', fullUrl ] ];
      token.markup  = 'autolink';
      token.info    = 'auto';

      token         = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);

      token         = state.push('link_close', 'a', -1);
      token.markup  = 'autolink';
      token.info    = 'auto';
    }

    state.pos += linkMatch[0].length;
    return true;
  }

  if (EMAIL_RE.test(tail)) {
    emailMatch = tail.match(EMAIL_RE);

    url = emailMatch[0].slice(1, -1);
    fullUrl = state.md.normalizeLink('mailto:' + url);
    if (!state.md.validateLink(fullUrl)) { return false; }

    if (!silent) {
      token         = state.push('link_open', 'a', 1);
      token.attrs   = [ [ 'href', fullUrl ] ];
      token.markup  = 'autolink';
      token.info    = 'auto';

      token         = state.push('text', '', 0);
      token.content = state.md.normalizeLinkText(url);

      token         = state.push('link_close', 'a', -1);
      token.markup  = 'autolink';
      token.info    = 'auto';
    }

    state.pos += emailMatch[0].length;
    return true;
  }

  return false;
};

},{}],45:[function(require,module,exports){
// Parse backticks

'use strict';

module.exports = function backtick(state, silent) {
  var start, max, marker, matchStart, matchEnd, token,
      pos = state.pos,
      ch = state.src.charCodeAt(pos);

  if (ch !== 0x60/* ` */) { return false; }

  start = pos;
  pos++;
  max = state.posMax;

  while (pos < max && state.src.charCodeAt(pos) === 0x60/* ` */) { pos++; }

  marker = state.src.slice(start, pos);

  matchStart = matchEnd = pos;

  while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
    matchEnd = matchStart + 1;

    while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60/* ` */) { matchEnd++; }

    if (matchEnd - matchStart === marker.length) {
      if (!silent) {
        token         = state.push('code_inline', 'code', 0);
        token.markup  = marker;
        token.content = state.src.slice(pos, matchStart)
                                 .replace(/[ \n]+/g, ' ')
                                 .trim();
      }
      state.pos = matchEnd;
      return true;
    }
  }

  if (!silent) { state.pending += marker; }
  state.pos += marker.length;
  return true;
};

},{}],46:[function(require,module,exports){
// For each opening emphasis-like marker find a matching closing one
//
'use strict';


module.exports = function link_pairs(state) {
  var i, j, lastDelim, currDelim,
      delimiters = state.delimiters,
      max = state.delimiters.length;

  for (i = 0; i < max; i++) {
    lastDelim = delimiters[i];

    if (!lastDelim.close) { continue; }

    j = i - lastDelim.jump - 1;

    while (j >= 0) {
      currDelim = delimiters[j];

      if (currDelim.open &&
          currDelim.marker === lastDelim.marker &&
          currDelim.end < 0 &&
          currDelim.level === lastDelim.level) {

        // typeofs are for backward compatibility with plugins
        var odd_match = (currDelim.close || lastDelim.open) &&
                        typeof currDelim.length !== 'undefined' &&
                        typeof lastDelim.length !== 'undefined' &&
                        (currDelim.length + lastDelim.length) % 3 === 0;

        if (!odd_match) {
          lastDelim.jump = i - j;
          lastDelim.open = false;
          currDelim.end  = i;
          currDelim.jump = 0;
          break;
        }
      }

      j -= currDelim.jump + 1;
    }
  }
};

},{}],47:[function(require,module,exports){
// Process *this* and _that_
//
'use strict';


// Insert each marker as a separate text token, and add it to delimiter list
//
module.exports.tokenize = function emphasis(state, silent) {
  var i, scanned, token,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) { return false; }

  if (marker !== 0x5F /* _ */ && marker !== 0x2A /* * */) { return false; }

  scanned = state.scanDelims(state.pos, marker === 0x2A);

  for (i = 0; i < scanned.length; i++) {
    token         = state.push('text', '', 0);
    token.content = String.fromCharCode(marker);

    state.delimiters.push({
      // Char code of the starting marker (number).
      //
      marker: marker,

      // Total length of these series of delimiters.
      //
      length: scanned.length,

      // An amount of characters before this one that's equivalent to
      // current one. In plain English: if this delimiter does not open
      // an emphasis, neither do previous `jump` characters.
      //
      // Used to skip sequences like "*****" in one step, for 1st asterisk
      // value will be 0, for 2nd it's 1 and so on.
      //
      jump:   i,

      // A position of the token this delimiter corresponds to.
      //
      token:  state.tokens.length - 1,

      // Token level.
      //
      level:  state.level,

      // If this delimiter is matched as a valid opener, `end` will be
      // equal to its position, otherwise it's `-1`.
      //
      end:    -1,

      // Boolean flags that determine if this delimiter could open or close
      // an emphasis.
      //
      open:   scanned.can_open,
      close:  scanned.can_close
    });
  }

  state.pos += scanned.length;

  return true;
};


// Walk through delimiter list and replace text tokens with tags
//
module.exports.postProcess = function emphasis(state) {
  var i,
      startDelim,
      endDelim,
      token,
      ch,
      isStrong,
      delimiters = state.delimiters,
      max = state.delimiters.length;

  for (i = max - 1; i >= 0; i--) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x5F/* _ */ && startDelim.marker !== 0x2A/* * */) {
      continue;
    }

    // Process only opening markers
    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];

    // If the previous delimiter has the same marker and is adjacent to this one,
    // merge those into one strong delimiter.
    //
    // `<em><em>whatever</em></em>` -> `<strong>whatever</strong>`
    //
    isStrong = i > 0 &&
               delimiters[i - 1].end === startDelim.end + 1 &&
               delimiters[i - 1].token === startDelim.token - 1 &&
               delimiters[startDelim.end + 1].token === endDelim.token + 1 &&
               delimiters[i - 1].marker === startDelim.marker;

    ch = String.fromCharCode(startDelim.marker);

    token         = state.tokens[startDelim.token];
    token.type    = isStrong ? 'strong_open' : 'em_open';
    token.tag     = isStrong ? 'strong' : 'em';
    token.nesting = 1;
    token.markup  = isStrong ? ch + ch : ch;
    token.content = '';

    token         = state.tokens[endDelim.token];
    token.type    = isStrong ? 'strong_close' : 'em_close';
    token.tag     = isStrong ? 'strong' : 'em';
    token.nesting = -1;
    token.markup  = isStrong ? ch + ch : ch;
    token.content = '';

    if (isStrong) {
      state.tokens[delimiters[i - 1].token].content = '';
      state.tokens[delimiters[startDelim.end + 1].token].content = '';
      i--;
    }
  }
};

},{}],48:[function(require,module,exports){
// Process html entity - &#123;, &#xAF;, &quot;, ...

'use strict';

var entities          = require('../common/entities');
var has               = require('../common/utils').has;
var isValidEntityCode = require('../common/utils').isValidEntityCode;
var fromCodePoint     = require('../common/utils').fromCodePoint;


var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,8}|[0-9]{1,8}));/i;
var NAMED_RE   = /^&([a-z][a-z0-9]{1,31});/i;


module.exports = function entity(state, silent) {
  var ch, code, match, pos = state.pos, max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x26/* & */) { return false; }

  if (pos + 1 < max) {
    ch = state.src.charCodeAt(pos + 1);

    if (ch === 0x23 /* # */) {
      match = state.src.slice(pos).match(DIGITAL_RE);
      if (match) {
        if (!silent) {
          code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
          state.pending += isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xFFFD);
        }
        state.pos += match[0].length;
        return true;
      }
    } else {
      match = state.src.slice(pos).match(NAMED_RE);
      if (match) {
        if (has(entities, match[1])) {
          if (!silent) { state.pending += entities[match[1]]; }
          state.pos += match[0].length;
          return true;
        }
      }
    }
  }

  if (!silent) { state.pending += '&'; }
  state.pos++;
  return true;
};

},{"../common/entities":8,"../common/utils":11}],49:[function(require,module,exports){
// Process escaped chars and hardbreaks

'use strict';

var isSpace = require('../common/utils').isSpace;

var ESCAPED = [];

for (var i = 0; i < 256; i++) { ESCAPED.push(0); }

'\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'
  .split('').forEach(function (ch) { ESCAPED[ch.charCodeAt(0)] = 1; });


module.exports = function escape(state, silent) {
  var ch, pos = state.pos, max = state.posMax;

  if (state.src.charCodeAt(pos) !== 0x5C/* \ */) { return false; }

  pos++;

  if (pos < max) {
    ch = state.src.charCodeAt(pos);

    if (ch < 256 && ESCAPED[ch] !== 0) {
      if (!silent) { state.pending += state.src[pos]; }
      state.pos += 2;
      return true;
    }

    if (ch === 0x0A) {
      if (!silent) {
        state.push('hardbreak', 'br', 0);
      }

      pos++;
      // skip leading whitespaces from next line
      while (pos < max) {
        ch = state.src.charCodeAt(pos);
        if (!isSpace(ch)) { break; }
        pos++;
      }

      state.pos = pos;
      return true;
    }
  }

  if (!silent) { state.pending += '\\'; }
  state.pos++;
  return true;
};

},{"../common/utils":11}],50:[function(require,module,exports){
// Process html tags

'use strict';


var HTML_TAG_RE = require('../common/html_re').HTML_TAG_RE;


function isLetter(ch) {
  /*eslint no-bitwise:0*/
  var lc = ch | 0x20; // to lower case
  return (lc >= 0x61/* a */) && (lc <= 0x7a/* z */);
}


module.exports = function html_inline(state, silent) {
  var ch, match, max, token,
      pos = state.pos;

  if (!state.md.options.html) { return false; }

  // Check start
  max = state.posMax;
  if (state.src.charCodeAt(pos) !== 0x3C/* < */ ||
      pos + 2 >= max) {
    return false;
  }

  // Quick fail on second char
  ch = state.src.charCodeAt(pos + 1);
  if (ch !== 0x21/* ! */ &&
      ch !== 0x3F/* ? */ &&
      ch !== 0x2F/* / */ &&
      !isLetter(ch)) {
    return false;
  }

  match = state.src.slice(pos).match(HTML_TAG_RE);
  if (!match) { return false; }

  if (!silent) {
    token         = state.push('html_inline', '', 0);
    token.content = state.src.slice(pos, pos + match[0].length);
  }
  state.pos += match[0].length;
  return true;
};

},{"../common/html_re":10}],51:[function(require,module,exports){
// Process ![image](<src> "title")

'use strict';

var normalizeReference   = require('../common/utils').normalizeReference;
var isSpace              = require('../common/utils').isSpace;


module.exports = function image(state, silent) {
  var attrs,
      code,
      content,
      label,
      labelEnd,
      labelStart,
      pos,
      ref,
      res,
      title,
      token,
      tokens,
      start,
      href = '',
      oldPos = state.pos,
      max = state.posMax;

  if (state.src.charCodeAt(state.pos) !== 0x21/* ! */) { return false; }
  if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) { return false; }

  labelStart = state.pos + 2;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);

  // parser failed to find ']', so it's not a valid link
  if (labelEnd < 0) { return false; }

  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
    //
    // Inline link
    //

    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }
    if (pos >= max) { return false; }

    // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    }

    // [link](  <href>  "title"  )
    //                ^^ skipping these spaces
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }

    // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;

      // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0A) { break; }
      }
    } else {
      title = '';
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
      state.pos = oldPos;
      return false;
    }
    pos++;
  } else {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') { return false; }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }

    // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)
    if (!label) { label = state.src.slice(labelStart, labelEnd); }

    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }

  //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    content = state.src.slice(labelStart, labelEnd);

    state.md.inline.parse(
      content,
      state.md,
      state.env,
      tokens = []
    );

    token          = state.push('image', 'img', 0);
    token.attrs    = attrs = [ [ 'src', href ], [ 'alt', '' ] ];
    token.children = tokens;
    token.content  = content;

    if (title) {
      attrs.push([ 'title', title ]);
    }
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

},{"../common/utils":11}],52:[function(require,module,exports){
// Process [link](<to> "stuff")

'use strict';

var normalizeReference   = require('../common/utils').normalizeReference;
var isSpace              = require('../common/utils').isSpace;


module.exports = function link(state, silent) {
  var attrs,
      code,
      label,
      labelEnd,
      labelStart,
      pos,
      res,
      ref,
      title,
      token,
      href = '',
      oldPos = state.pos,
      max = state.posMax,
      start = state.pos,
      parseReference = true;

  if (state.src.charCodeAt(state.pos) !== 0x5B/* [ */) { return false; }

  labelStart = state.pos + 1;
  labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);

  // parser failed to find ']', so it's not a valid link
  if (labelEnd < 0) { return false; }

  pos = labelEnd + 1;
  if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
    //
    // Inline link
    //

    // might have found a valid shortcut link, disable reference parsing
    parseReference = false;

    // [link](  <href>  "title"  )
    //        ^^ skipping these spaces
    pos++;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }
    if (pos >= max) { return false; }

    // [link](  <href>  "title"  )
    //          ^^^^^^ parsing link destination
    start = pos;
    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
    if (res.ok) {
      href = state.md.normalizeLink(res.str);
      if (state.md.validateLink(href)) {
        pos = res.pos;
      } else {
        href = '';
      }
    }

    // [link](  <href>  "title"  )
    //                ^^ skipping these spaces
    start = pos;
    for (; pos < max; pos++) {
      code = state.src.charCodeAt(pos);
      if (!isSpace(code) && code !== 0x0A) { break; }
    }

    // [link](  <href>  "title"  )
    //                  ^^^^^^^ parsing link title
    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;

      // [link](  <href>  "title"  )
      //                         ^^ skipping these spaces
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace(code) && code !== 0x0A) { break; }
      }
    } else {
      title = '';
    }

    if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
      // parsing a valid shortcut link failed, fallback to reference
      parseReference = true;
    }
    pos++;
  }

  if (parseReference) {
    //
    // Link reference
    //
    if (typeof state.env.references === 'undefined') { return false; }

    if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
      start = pos + 1;
      pos = state.md.helpers.parseLinkLabel(state, pos);
      if (pos >= 0) {
        label = state.src.slice(start, pos++);
      } else {
        pos = labelEnd + 1;
      }
    } else {
      pos = labelEnd + 1;
    }

    // covers label === '' and label === undefined
    // (collapsed reference link and shortcut reference link respectively)
    if (!label) { label = state.src.slice(labelStart, labelEnd); }

    ref = state.env.references[normalizeReference(label)];
    if (!ref) {
      state.pos = oldPos;
      return false;
    }
    href = ref.href;
    title = ref.title;
  }

  //
  // We found the end of the link, and know for a fact it's a valid link;
  // so all that's left to do is to call tokenizer.
  //
  if (!silent) {
    state.pos = labelStart;
    state.posMax = labelEnd;

    token        = state.push('link_open', 'a', 1);
    token.attrs  = attrs = [ [ 'href', href ] ];
    if (title) {
      attrs.push([ 'title', title ]);
    }

    state.md.inline.tokenize(state);

    token        = state.push('link_close', 'a', -1);
  }

  state.pos = pos;
  state.posMax = max;
  return true;
};

},{"../common/utils":11}],53:[function(require,module,exports){
// Proceess '\n'

'use strict';

var isSpace = require('../common/utils').isSpace;


module.exports = function newline(state, silent) {
  var pmax, max, pos = state.pos;

  if (state.src.charCodeAt(pos) !== 0x0A/* \n */) { return false; }

  pmax = state.pending.length - 1;
  max = state.posMax;

  // '  \n' -> hardbreak
  // Lookup in pending chars is bad practice! Don't copy to other rules!
  // Pending string is stored in concat mode, indexed lookups will cause
  // convertion to flat mode.
  if (!silent) {
    if (pmax >= 0 && state.pending.charCodeAt(pmax) === 0x20) {
      if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 0x20) {
        state.pending = state.pending.replace(/ +$/, '');
        state.push('hardbreak', 'br', 0);
      } else {
        state.pending = state.pending.slice(0, -1);
        state.push('softbreak', 'br', 0);
      }

    } else {
      state.push('softbreak', 'br', 0);
    }
  }

  pos++;

  // skip heading spaces for next line
  while (pos < max && isSpace(state.src.charCodeAt(pos))) { pos++; }

  state.pos = pos;
  return true;
};

},{"../common/utils":11}],54:[function(require,module,exports){
// Inline parser state

'use strict';


var Token          = require('../token');
var isWhiteSpace   = require('../common/utils').isWhiteSpace;
var isPunctChar    = require('../common/utils').isPunctChar;
var isMdAsciiPunct = require('../common/utils').isMdAsciiPunct;


function StateInline(src, md, env, outTokens) {
  this.src = src;
  this.env = env;
  this.md = md;
  this.tokens = outTokens;

  this.pos = 0;
  this.posMax = this.src.length;
  this.level = 0;
  this.pending = '';
  this.pendingLevel = 0;

  this.cache = {};        // Stores { start: end } pairs. Useful for backtrack
                          // optimization of pairs parse (emphasis, strikes).

  this.delimiters = [];   // Emphasis-like delimiters
}


// Flush pending text
//
StateInline.prototype.pushPending = function () {
  var token = new Token('text', '', 0);
  token.content = this.pending;
  token.level = this.pendingLevel;
  this.tokens.push(token);
  this.pending = '';
  return token;
};


// Push new token to "stream".
// If pending text exists - flush it as text token
//
StateInline.prototype.push = function (type, tag, nesting) {
  if (this.pending) {
    this.pushPending();
  }

  var token = new Token(type, tag, nesting);

  if (nesting < 0) { this.level--; }
  token.level = this.level;
  if (nesting > 0) { this.level++; }

  this.pendingLevel = this.level;
  this.tokens.push(token);
  return token;
};


// Scan a sequence of emphasis-like markers, and determine whether
// it can start an emphasis sequence or end an emphasis sequence.
//
//  - start - position to scan from (it should point at a valid marker);
//  - canSplitWord - determine if these markers can be found inside a word
//
StateInline.prototype.scanDelims = function (start, canSplitWord) {
  var pos = start, lastChar, nextChar, count, can_open, can_close,
      isLastWhiteSpace, isLastPunctChar,
      isNextWhiteSpace, isNextPunctChar,
      left_flanking = true,
      right_flanking = true,
      max = this.posMax,
      marker = this.src.charCodeAt(start);

  // treat beginning of the line as a whitespace
  lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

  while (pos < max && this.src.charCodeAt(pos) === marker) { pos++; }

  count = pos - start;

  // treat end of the line as a whitespace
  nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;

  isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
  isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

  isLastWhiteSpace = isWhiteSpace(lastChar);
  isNextWhiteSpace = isWhiteSpace(nextChar);

  if (isNextWhiteSpace) {
    left_flanking = false;
  } else if (isNextPunctChar) {
    if (!(isLastWhiteSpace || isLastPunctChar)) {
      left_flanking = false;
    }
  }

  if (isLastWhiteSpace) {
    right_flanking = false;
  } else if (isLastPunctChar) {
    if (!(isNextWhiteSpace || isNextPunctChar)) {
      right_flanking = false;
    }
  }

  if (!canSplitWord) {
    can_open  = left_flanking  && (!right_flanking || isLastPunctChar);
    can_close = right_flanking && (!left_flanking  || isNextPunctChar);
  } else {
    can_open  = left_flanking;
    can_close = right_flanking;
  }

  return {
    can_open:  can_open,
    can_close: can_close,
    length:    count
  };
};


// re-export Token class to use in block rules
StateInline.prototype.Token = Token;


module.exports = StateInline;

},{"../common/utils":11,"../token":58}],55:[function(require,module,exports){
// ~~strike through~~
//
'use strict';


// Insert each marker as a separate text token, and add it to delimiter list
//
module.exports.tokenize = function strikethrough(state, silent) {
  var i, scanned, token, len, ch,
      start = state.pos,
      marker = state.src.charCodeAt(start);

  if (silent) { return false; }

  if (marker !== 0x7E/* ~ */) { return false; }

  scanned = state.scanDelims(state.pos, true);
  len = scanned.length;
  ch = String.fromCharCode(marker);

  if (len < 2) { return false; }

  if (len % 2) {
    token         = state.push('text', '', 0);
    token.content = ch;
    len--;
  }

  for (i = 0; i < len; i += 2) {
    token         = state.push('text', '', 0);
    token.content = ch + ch;

    state.delimiters.push({
      marker: marker,
      jump:   i,
      token:  state.tokens.length - 1,
      level:  state.level,
      end:    -1,
      open:   scanned.can_open,
      close:  scanned.can_close
    });
  }

  state.pos += scanned.length;

  return true;
};


// Walk through delimiter list and replace text tokens with tags
//
module.exports.postProcess = function strikethrough(state) {
  var i, j,
      startDelim,
      endDelim,
      token,
      loneMarkers = [],
      delimiters = state.delimiters,
      max = state.delimiters.length;

  for (i = 0; i < max; i++) {
    startDelim = delimiters[i];

    if (startDelim.marker !== 0x7E/* ~ */) {
      continue;
    }

    if (startDelim.end === -1) {
      continue;
    }

    endDelim = delimiters[startDelim.end];

    token         = state.tokens[startDelim.token];
    token.type    = 's_open';
    token.tag     = 's';
    token.nesting = 1;
    token.markup  = '~~';
    token.content = '';

    token         = state.tokens[endDelim.token];
    token.type    = 's_close';
    token.tag     = 's';
    token.nesting = -1;
    token.markup  = '~~';
    token.content = '';

    if (state.tokens[endDelim.token - 1].type === 'text' &&
        state.tokens[endDelim.token - 1].content === '~') {

      loneMarkers.push(endDelim.token - 1);
    }
  }

  // If a marker sequence has an odd number of characters, it's splitted
  // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
  // start of the sequence.
  //
  // So, we have to move all those markers after subsequent s_close tags.
  //
  while (loneMarkers.length) {
    i = loneMarkers.pop();
    j = i + 1;

    while (j < state.tokens.length && state.tokens[j].type === 's_close') {
      j++;
    }

    j--;

    if (i !== j) {
      token = state.tokens[j];
      state.tokens[j] = state.tokens[i];
      state.tokens[i] = token;
    }
  }
};

},{}],56:[function(require,module,exports){
// Skip text characters for text token, place those to pending buffer
// and increment current pos

'use strict';


// Rule to skip pure text
// '{}$%@~+=:' reserved for extentions

// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~

// !!!! Don't confuse with "Markdown ASCII Punctuation" chars
// http://spec.commonmark.org/0.15/#ascii-punctuation-character
function isTerminatorChar(ch) {
  switch (ch) {
    case 0x0A/* \n */:
    case 0x21/* ! */:
    case 0x23/* # */:
    case 0x24/* $ */:
    case 0x25/* % */:
    case 0x26/* & */:
    case 0x2A/* * */:
    case 0x2B/* + */:
    case 0x2D/* - */:
    case 0x3A/* : */:
    case 0x3C/* < */:
    case 0x3D/* = */:
    case 0x3E/* > */:
    case 0x40/* @ */:
    case 0x5B/* [ */:
    case 0x5C/* \ */:
    case 0x5D/* ] */:
    case 0x5E/* ^ */:
    case 0x5F/* _ */:
    case 0x60/* ` */:
    case 0x7B/* { */:
    case 0x7D/* } */:
    case 0x7E/* ~ */:
      return true;
    default:
      return false;
  }
}

module.exports = function text(state, silent) {
  var pos = state.pos;

  while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
    pos++;
  }

  if (pos === state.pos) { return false; }

  if (!silent) { state.pending += state.src.slice(state.pos, pos); }

  state.pos = pos;

  return true;
};

// Alternative implementation, for memory.
//
// It costs 10% of performance, but allows extend terminators list, if place it
// to `ParcerInline` property. Probably, will switch to it sometime, such
// flexibility required.

/*
var TERMINATOR_RE = /[\n!#$%&*+\-:<=>@[\\\]^_`{}~]/;

module.exports = function text(state, silent) {
  var pos = state.pos,
      idx = state.src.slice(pos).search(TERMINATOR_RE);

  // first char is terminator -> empty text
  if (idx === 0) { return false; }

  // no terminator -> text till end of string
  if (idx < 0) {
    if (!silent) { state.pending += state.src.slice(pos); }
    state.pos = state.src.length;
    return true;
  }

  if (!silent) { state.pending += state.src.slice(pos, pos + idx); }

  state.pos += idx;

  return true;
};*/

},{}],57:[function(require,module,exports){
// Merge adjacent text nodes into one, and re-calculate all token levels
//
'use strict';


module.exports = function text_collapse(state) {
  var curr, last,
      level = 0,
      tokens = state.tokens,
      max = state.tokens.length;

  for (curr = last = 0; curr < max; curr++) {
    // re-calculate levels
    level += tokens[curr].nesting;
    tokens[curr].level = level;

    if (tokens[curr].type === 'text' &&
        curr + 1 < max &&
        tokens[curr + 1].type === 'text') {

      // collapse two adjacent text nodes
      tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
    } else {
      if (curr !== last) { tokens[last] = tokens[curr]; }

      last++;
    }
  }

  if (curr !== last) {
    tokens.length = last;
  }
};

},{}],58:[function(require,module,exports){
// Token class

'use strict';


/**
 * class Token
 **/

/**
 * new Token(type, tag, nesting)
 *
 * Create new token and fill passed properties.
 **/
function Token(type, tag, nesting) {
  /**
   * Token#type -> String
   *
   * Type of the token (string, e.g. "paragraph_open")
   **/
  this.type     = type;

  /**
   * Token#tag -> String
   *
   * html tag name, e.g. "p"
   **/
  this.tag      = tag;

  /**
   * Token#attrs -> Array
   *
   * Html attributes. Format: `[ [ name1, value1 ], [ name2, value2 ] ]`
   **/
  this.attrs    = null;

  /**
   * Token#map -> Array
   *
   * Source map info. Format: `[ line_begin, line_end ]`
   **/
  this.map      = null;

  /**
   * Token#nesting -> Number
   *
   * Level change (number in {-1, 0, 1} set), where:
   *
   * -  `1` means the tag is opening
   * -  `0` means the tag is self-closing
   * - `-1` means the tag is closing
   **/
  this.nesting  = nesting;

  /**
   * Token#level -> Number
   *
   * nesting level, the same as `state.level`
   **/
  this.level    = 0;

  /**
   * Token#children -> Array
   *
   * An array of child nodes (inline and img tokens)
   **/
  this.children = null;

  /**
   * Token#content -> String
   *
   * In a case of self-closing tag (code, html, fence, etc.),
   * it has contents of this tag.
   **/
  this.content  = '';

  /**
   * Token#markup -> String
   *
   * '*' or '_' for emphasis, fence string for fence, etc.
   **/
  this.markup   = '';

  /**
   * Token#info -> String
   *
   * fence infostring
   **/
  this.info     = '';

  /**
   * Token#meta -> Object
   *
   * A place for plugins to store an arbitrary data
   **/
  this.meta     = null;

  /**
   * Token#block -> Boolean
   *
   * True for block-level tokens, false for inline tokens.
   * Used in renderer to calculate line breaks
   **/
  this.block    = false;

  /**
   * Token#hidden -> Boolean
   *
   * If it's true, ignore this element when rendering. Used for tight lists
   * to hide paragraphs.
   **/
  this.hidden   = false;
}


/**
 * Token.attrIndex(name) -> Number
 *
 * Search attribute index by name.
 **/
Token.prototype.attrIndex = function attrIndex(name) {
  var attrs, i, len;

  if (!this.attrs) { return -1; }

  attrs = this.attrs;

  for (i = 0, len = attrs.length; i < len; i++) {
    if (attrs[i][0] === name) { return i; }
  }
  return -1;
};


/**
 * Token.attrPush(attrData)
 *
 * Add `[ name, value ]` attribute to list. Init attrs if necessary
 **/
Token.prototype.attrPush = function attrPush(attrData) {
  if (this.attrs) {
    this.attrs.push(attrData);
  } else {
    this.attrs = [ attrData ];
  }
};


/**
 * Token.attrSet(name, value)
 *
 * Set `name` attribute to `value`. Override old value if exists.
 **/
Token.prototype.attrSet = function attrSet(name, value) {
  var idx = this.attrIndex(name),
      attrData = [ name, value ];

  if (idx < 0) {
    this.attrPush(attrData);
  } else {
    this.attrs[idx] = attrData;
  }
};


/**
 * Token.attrGet(name)
 *
 * Get the value of attribute `name`, or null if it does not exist.
 **/
Token.prototype.attrGet = function attrGet(name) {
  var idx = this.attrIndex(name), value = null;
  if (idx >= 0) {
    value = this.attrs[idx][1];
  }
  return value;
};


/**
 * Token.attrJoin(name, value)
 *
 * Join value to existing attribute via space. Or create new attribute if not
 * exists. Useful to operate with token classes.
 **/
Token.prototype.attrJoin = function attrJoin(name, value) {
  var idx = this.attrIndex(name);

  if (idx < 0) {
    this.attrPush([ name, value ]);
  } else {
    this.attrs[idx][1] = this.attrs[idx][1] + ' ' + value;
  }
};


module.exports = Token;

},{}],59:[function(require,module,exports){

'use strict';


/* eslint-disable no-bitwise */

var decodeCache = {};

function getDecodeCache(exclude) {
  var i, ch, cache = decodeCache[exclude];
  if (cache) { return cache; }

  cache = decodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);
    cache.push(ch);
  }

  for (i = 0; i < exclude.length; i++) {
    ch = exclude.charCodeAt(i);
    cache[ch] = '%' + ('0' + ch.toString(16).toUpperCase()).slice(-2);
  }

  return cache;
}


// Decode percent-encoded string.
//
function decode(string, exclude) {
  var cache;

  if (typeof exclude !== 'string') {
    exclude = decode.defaultChars;
  }

  cache = getDecodeCache(exclude);

  return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
    var i, l, b1, b2, b3, b4, chr,
        result = '';

    for (i = 0, l = seq.length; i < l; i += 3) {
      b1 = parseInt(seq.slice(i + 1, i + 3), 16);

      if (b1 < 0x80) {
        result += cache[b1];
        continue;
      }

      if ((b1 & 0xE0) === 0xC0 && (i + 3 < l)) {
        // 110xxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);

        if ((b2 & 0xC0) === 0x80) {
          chr = ((b1 << 6) & 0x7C0) | (b2 & 0x3F);

          if (chr < 0x80) {
            result += '\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 3;
          continue;
        }
      }

      if ((b1 & 0xF0) === 0xE0 && (i + 6 < l)) {
        // 1110xxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
          chr = ((b1 << 12) & 0xF000) | ((b2 << 6) & 0xFC0) | (b3 & 0x3F);

          if (chr < 0x800 || (chr >= 0xD800 && chr <= 0xDFFF)) {
            result += '\ufffd\ufffd\ufffd';
          } else {
            result += String.fromCharCode(chr);
          }

          i += 6;
          continue;
        }
      }

      if ((b1 & 0xF8) === 0xF0 && (i + 9 < l)) {
        // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx
        b2 = parseInt(seq.slice(i + 4, i + 6), 16);
        b3 = parseInt(seq.slice(i + 7, i + 9), 16);
        b4 = parseInt(seq.slice(i + 10, i + 12), 16);

        if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
          chr = ((b1 << 18) & 0x1C0000) | ((b2 << 12) & 0x3F000) | ((b3 << 6) & 0xFC0) | (b4 & 0x3F);

          if (chr < 0x10000 || chr > 0x10FFFF) {
            result += '\ufffd\ufffd\ufffd\ufffd';
          } else {
            chr -= 0x10000;
            result += String.fromCharCode(0xD800 + (chr >> 10), 0xDC00 + (chr & 0x3FF));
          }

          i += 9;
          continue;
        }
      }

      result += '\ufffd';
    }

    return result;
  });
}


decode.defaultChars   = ';/?:@&=+$,#';
decode.componentChars = '';


module.exports = decode;

},{}],60:[function(require,module,exports){

'use strict';


var encodeCache = {};


// Create a lookup array where anything but characters in `chars` string
// and alphanumeric chars is percent-encoded.
//
function getEncodeCache(exclude) {
  var i, ch, cache = encodeCache[exclude];
  if (cache) { return cache; }

  cache = encodeCache[exclude] = [];

  for (i = 0; i < 128; i++) {
    ch = String.fromCharCode(i);

    if (/^[0-9a-z]$/i.test(ch)) {
      // always allow unencoded alphanumeric characters
      cache.push(ch);
    } else {
      cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
    }
  }

  for (i = 0; i < exclude.length; i++) {
    cache[exclude.charCodeAt(i)] = exclude[i];
  }

  return cache;
}


// Encode unsafe characters with percent-encoding, skipping already
// encoded sequences.
//
//  - string       - string to encode
//  - exclude      - list of characters to ignore (in addition to a-zA-Z0-9)
//  - keepEscaped  - don't encode '%' in a correct escape sequence (default: true)
//
function encode(string, exclude, keepEscaped) {
  var i, l, code, nextCode, cache,
      result = '';

  if (typeof exclude !== 'string') {
    // encode(string, keepEscaped)
    keepEscaped  = exclude;
    exclude = encode.defaultChars;
  }

  if (typeof keepEscaped === 'undefined') {
    keepEscaped = true;
  }

  cache = getEncodeCache(exclude);

  for (i = 0, l = string.length; i < l; i++) {
    code = string.charCodeAt(i);

    if (keepEscaped && code === 0x25 /* % */ && i + 2 < l) {
      if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
        result += string.slice(i, i + 3);
        i += 2;
        continue;
      }
    }

    if (code < 128) {
      result += cache[code];
      continue;
    }

    if (code >= 0xD800 && code <= 0xDFFF) {
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
        nextCode = string.charCodeAt(i + 1);
        if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
          result += encodeURIComponent(string[i] + string[i + 1]);
          i++;
          continue;
        }
      }
      result += '%EF%BF%BD';
      continue;
    }

    result += encodeURIComponent(string[i]);
  }

  return result;
}

encode.defaultChars   = ";/?:@&=+$,-_.!~*'()#";
encode.componentChars = "-_.!~*'()";


module.exports = encode;

},{}],61:[function(require,module,exports){

'use strict';


module.exports = function format(url) {
  var result = '';

  result += url.protocol || '';
  result += url.slashes ? '//' : '';
  result += url.auth ? url.auth + '@' : '';

  if (url.hostname && url.hostname.indexOf(':') !== -1) {
    // ipv6 address
    result += '[' + url.hostname + ']';
  } else {
    result += url.hostname || '';
  }

  result += url.port ? ':' + url.port : '';
  result += url.pathname || '';
  result += url.search || '';
  result += url.hash || '';

  return result;
};

},{}],62:[function(require,module,exports){
'use strict';


module.exports.encode = require('./encode');
module.exports.decode = require('./decode');
module.exports.format = require('./format');
module.exports.parse  = require('./parse');

},{"./decode":59,"./encode":60,"./format":61,"./parse":63}],63:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

//
// Changes from joyent/node:
//
// 1. No leading slash in paths,
//    e.g. in `url.parse('http://foo?bar')` pathname is ``, not `/`
//
// 2. Backslashes are not replaced with slashes,
//    so `http:\\example.org\` is treated like a relative path
//
// 3. Trailing colon is treated like a part of the path,
//    i.e. in `http://example.org:foo` pathname is `:foo`
//
// 4. Nothing is URL-encoded in the resulting object,
//    (in joyent/node some chars in auth and paths are encoded)
//
// 5. `url.parse()` does not have `parseQueryString` argument
//
// 6. Removed extraneous result properties: `host`, `path`, `query`, etc.,
//    which can be constructed using other parts of the url.
//


function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.pathname = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = [ '<', '>', '"', '`', ' ', '\r', '\n', '\t' ],

    // RFC 2396: characters not allowed for various reasons.
    unwise = [ '{', '}', '|', '\\', '^', '`' ].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = [ '\'' ].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = [ '%', '/', '?', ';', '#' ].concat(autoEscape),
    hostEndingChars = [ '/', '?', '#' ],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    /* eslint-disable no-script-url */
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    };
    /* eslint-enable no-script-url */

function urlParse(url, slashesDenoteHost) {
  if (url && url instanceof Url) { return url; }

  var u = new Url();
  u.parse(url, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, slashesDenoteHost) {
  var i, l, lowerProto, hec, slashes,
      rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    lowerProto = proto.toLowerCase();
    this.protocol = proto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (i = 0; i < hostEndingChars.length; i++) {
      hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = auth;
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (i = 0; i < nonHostChars.length; i++) {
      hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
        hostEnd = hec;
      }
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1) {
      hostEnd = rest.length;
    }

    if (rest[hostEnd - 1] === ':') { hostEnd--; }
    var host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost(host);

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) { continue; }
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    }

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
    }
  }

  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    rest = rest.slice(0, qm);
  }
  if (rest) { this.pathname = rest; }
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '';
  }

  return this;
};

Url.prototype.parseHost = function(host) {
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) { this.hostname = host; }
};

module.exports = urlParse;

},{}],64:[function(require,module,exports){
module.exports=/[\0-\x1F\x7F-\x9F]/
},{}],65:[function(require,module,exports){
module.exports=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804\uDCBD|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/
},{}],66:[function(require,module,exports){
module.exports=/[!-#%-\*,-/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E44\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD807[\uDC41-\uDC45\uDC70\uDC71]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/
},{}],67:[function(require,module,exports){
module.exports=/[ \xA0\u1680\u2000-\u200A\u202F\u205F\u3000]/
},{}],68:[function(require,module,exports){
'use strict';

exports.Any = require('./properties/Any/regex');
exports.Cc  = require('./categories/Cc/regex');
exports.Cf  = require('./categories/Cf/regex');
exports.P   = require('./categories/P/regex');
exports.Z   = require('./categories/Z/regex');

},{"./categories/Cc/regex":64,"./categories/Cf/regex":65,"./categories/P/regex":66,"./categories/Z/regex":67,"./properties/Any/regex":69}],69:[function(require,module,exports){
module.exports=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/
},{}],70:[function(require,module,exports){
module.exports={
  "name": "chat-engine-markdown",
  "author": "Ian Jennings",
  "version": "0.0.8",
  "main": "src/plugin.js",
  "dependencies": {
    "chat-engine": "^0.8.3",
    "dotty": "0.0.2",
    "markdown-it": "^8.4.0"
  },
  "devDependencies": {
    "chai": "^3.5.0",
    "mocha": "^3.3.0"
  }
}

},{}],71:[function(require,module,exports){
/**
* Renders markdown from the ```message``` event.
* @module chat-engine-markdown
* @requires {@link ChatEngine}
* @requires {@link snarkdown}
* @requires {@link dotty}
*/
const markdown = require('markdown-it')({
    linkify: true
});
const dotty = require('dotty');

/**
* @function
* @example
* chat.plugin(ChatEngineCore.plugin['chat-engine-markdown']());

* chat.on('message', (payload) => {
*    console.log(payload.data.text);
* });
*
* chat.emit('message', {
*    text: 'This is some *markdown* **for sure**.'
* });
* // 'This is some <em>markdown</em> <strong>for sure</strong>.
*
* @param {Object} [config] The config object
* @param {String} [event="message"] The ChatEngine event where markdown will be parsed
* @param {String} [prop="data.text"] The event property value where markdown should be parsed.
*/
module.exports = (config = {}) => {

    config.prop = config.prop || 'data.text';
    config.event = config.event || 'message'

    let parseMarkdown = function(payload, next) {

        let text = dotty.get(payload, config.prop);

        if(text) {
            dotty.put(payload, config.prop, markdown.render(text));
        }

        // continue along middleware
        next(null, payload);

    };

    // define both the extended methods and the middleware in our plugin
    let result = {
        namespace: 'markdown',
        middleware: {
            on: {}
        },
    };


    result.middleware.on[config.event] = parseMarkdown;

    return result;

}

},{"dotty":3,"markdown-it":7}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4xMS40L2xpYi9ub2RlX21vZHVsZXMvY2hhdC1lbmdpbmUtcGx1Z2luL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjYuMTEuNC9saWIvbm9kZV9tb2R1bGVzL2NoYXQtZW5naW5lLXBsdWdpbi9ub2RlX21vZHVsZXMvcHVueWNvZGUvcHVueWNvZGUuanMiLCIudG1wL3dyYXAuanMiLCJub2RlX21vZHVsZXMvZG90dHkvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VudGl0aWVzL21hcHMvZW50aXRpZXMuanNvbiIsIm5vZGVfbW9kdWxlcy9saW5raWZ5LWl0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2xpbmtpZnktaXQvbGliL3JlLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9jb21tb24vZW50aXRpZXMuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2NvbW1vbi9odG1sX2Jsb2Nrcy5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvY29tbW9uL2h0bWxfcmUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2NvbW1vbi91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvaGVscGVycy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvaGVscGVycy9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL3BhcnNlX2xpbmtfbGFiZWwuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2hlbHBlcnMvcGFyc2VfbGlua190aXRsZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3BhcnNlcl9ibG9jay5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcGFyc2VyX2NvcmUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3BhcnNlcl9pbmxpbmUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3ByZXNldHMvY29tbW9ubWFyay5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcHJlc2V0cy9kZWZhdWx0LmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9wcmVzZXRzL3plcm8uanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3JlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlci5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svYmxvY2txdW90ZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svZmVuY2UuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2hlYWRpbmcuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2hyLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9odG1sX2Jsb2NrLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9saGVhZGluZy5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svbGlzdC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svcGFyYWdyYXBoLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9yZWZlcmVuY2UuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL3N0YXRlX2Jsb2NrLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay90YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9ibG9jay5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9pbmxpbmUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvbGlua2lmeS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9ub3JtYWxpemUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvcmVwbGFjZW1lbnRzLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL3NtYXJ0cXVvdGVzLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL3N0YXRlX2NvcmUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9hdXRvbGluay5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2JhY2t0aWNrcy5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2JhbGFuY2VfcGFpcnMuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9lbXBoYXNpcy5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2VudGl0eS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2VzY2FwZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2h0bWxfaW5saW5lLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvaW1hZ2UuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9saW5rLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvbmV3bGluZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL3N0YXRlX2lubGluZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL3N0cmlrZXRocm91Z2guanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS90ZXh0LmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvdGV4dF9jb2xsYXBzZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvdG9rZW4uanMiLCJub2RlX21vZHVsZXMvbWR1cmwvZGVjb2RlLmpzIiwibm9kZV9tb2R1bGVzL21kdXJsL2VuY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9tZHVybC9mb3JtYXQuanMiLCJub2RlX21vZHVsZXMvbWR1cmwvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWR1cmwvcGFyc2UuanMiLCJub2RlX21vZHVsZXMvdWMubWljcm8vY2F0ZWdvcmllcy9DYy9yZWdleC5qcyIsIm5vZGVfbW9kdWxlcy91Yy5taWNyby9jYXRlZ29yaWVzL0NmL3JlZ2V4LmpzIiwibm9kZV9tb2R1bGVzL3VjLm1pY3JvL2NhdGVnb3JpZXMvUC9yZWdleC5qcyIsIm5vZGVfbW9kdWxlcy91Yy5taWNyby9jYXRlZ29yaWVzL1ovcmVnZXguanMiLCJub2RlX21vZHVsZXMvdWMubWljcm8vaW5kZXguanMiLCJub2RlX21vZHVsZXMvdWMubWljcm8vcHJvcGVydGllcy9BbnkvcmVnZXguanMiLCJwYWNrYWdlLmpzb24iLCJzcmMvcGx1Z2luLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3JoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pPQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzduQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4VEE7O0FDQUE7O0FDQUE7O0FDQUE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohIGh0dHBzOi8vbXRocy5iZS9wdW55Y29kZSB2MS40LjEgYnkgQG1hdGhpYXMgKi9cbjsoZnVuY3Rpb24ocm9vdCkge1xuXG5cdC8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZXMgKi9cblx0dmFyIGZyZWVFeHBvcnRzID0gdHlwZW9mIGV4cG9ydHMgPT0gJ29iamVjdCcgJiYgZXhwb3J0cyAmJlxuXHRcdCFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XG5cdHZhciBmcmVlTW9kdWxlID0gdHlwZW9mIG1vZHVsZSA9PSAnb2JqZWN0JyAmJiBtb2R1bGUgJiZcblx0XHQhbW9kdWxlLm5vZGVUeXBlICYmIG1vZHVsZTtcblx0dmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbDtcblx0aWYgKFxuXHRcdGZyZWVHbG9iYWwuZ2xvYmFsID09PSBmcmVlR2xvYmFsIHx8XG5cdFx0ZnJlZUdsb2JhbC53aW5kb3cgPT09IGZyZWVHbG9iYWwgfHxcblx0XHRmcmVlR2xvYmFsLnNlbGYgPT09IGZyZWVHbG9iYWxcblx0KSB7XG5cdFx0cm9vdCA9IGZyZWVHbG9iYWw7XG5cdH1cblxuXHQvKipcblx0ICogVGhlIGBwdW55Y29kZWAgb2JqZWN0LlxuXHQgKiBAbmFtZSBwdW55Y29kZVxuXHQgKiBAdHlwZSBPYmplY3Rcblx0ICovXG5cdHZhciBwdW55Y29kZSxcblxuXHQvKiogSGlnaGVzdCBwb3NpdGl2ZSBzaWduZWQgMzItYml0IGZsb2F0IHZhbHVlICovXG5cdG1heEludCA9IDIxNDc0ODM2NDcsIC8vIGFrYS4gMHg3RkZGRkZGRiBvciAyXjMxLTFcblxuXHQvKiogQm9vdHN0cmluZyBwYXJhbWV0ZXJzICovXG5cdGJhc2UgPSAzNixcblx0dE1pbiA9IDEsXG5cdHRNYXggPSAyNixcblx0c2tldyA9IDM4LFxuXHRkYW1wID0gNzAwLFxuXHRpbml0aWFsQmlhcyA9IDcyLFxuXHRpbml0aWFsTiA9IDEyOCwgLy8gMHg4MFxuXHRkZWxpbWl0ZXIgPSAnLScsIC8vICdcXHgyRCdcblxuXHQvKiogUmVndWxhciBleHByZXNzaW9ucyAqL1xuXHRyZWdleFB1bnljb2RlID0gL154bi0tLyxcblx0cmVnZXhOb25BU0NJSSA9IC9bXlxceDIwLVxceDdFXS8sIC8vIHVucHJpbnRhYmxlIEFTQ0lJIGNoYXJzICsgbm9uLUFTQ0lJIGNoYXJzXG5cdHJlZ2V4U2VwYXJhdG9ycyA9IC9bXFx4MkVcXHUzMDAyXFx1RkYwRVxcdUZGNjFdL2csIC8vIFJGQyAzNDkwIHNlcGFyYXRvcnNcblxuXHQvKiogRXJyb3IgbWVzc2FnZXMgKi9cblx0ZXJyb3JzID0ge1xuXHRcdCdvdmVyZmxvdyc6ICdPdmVyZmxvdzogaW5wdXQgbmVlZHMgd2lkZXIgaW50ZWdlcnMgdG8gcHJvY2VzcycsXG5cdFx0J25vdC1iYXNpYyc6ICdJbGxlZ2FsIGlucHV0ID49IDB4ODAgKG5vdCBhIGJhc2ljIGNvZGUgcG9pbnQpJyxcblx0XHQnaW52YWxpZC1pbnB1dCc6ICdJbnZhbGlkIGlucHV0J1xuXHR9LFxuXG5cdC8qKiBDb252ZW5pZW5jZSBzaG9ydGN1dHMgKi9cblx0YmFzZU1pbnVzVE1pbiA9IGJhc2UgLSB0TWluLFxuXHRmbG9vciA9IE1hdGguZmxvb3IsXG5cdHN0cmluZ0Zyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUsXG5cblx0LyoqIFRlbXBvcmFyeSB2YXJpYWJsZSAqL1xuXHRrZXk7XG5cblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblx0LyoqXG5cdCAqIEEgZ2VuZXJpYyBlcnJvciB1dGlsaXR5IGZ1bmN0aW9uLlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdHlwZSBUaGUgZXJyb3IgdHlwZS5cblx0ICogQHJldHVybnMge0Vycm9yfSBUaHJvd3MgYSBgUmFuZ2VFcnJvcmAgd2l0aCB0aGUgYXBwbGljYWJsZSBlcnJvciBtZXNzYWdlLlxuXHQgKi9cblx0ZnVuY3Rpb24gZXJyb3IodHlwZSkge1xuXHRcdHRocm93IG5ldyBSYW5nZUVycm9yKGVycm9yc1t0eXBlXSk7XG5cdH1cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGBBcnJheSNtYXBgIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBpdGVyYXRlIG92ZXIuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeSBhcnJheVxuXHQgKiBpdGVtLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IEEgbmV3IGFycmF5IG9mIHZhbHVlcyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2sgZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXAoYXJyYXksIGZuKSB7XG5cdFx0dmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcblx0XHR2YXIgcmVzdWx0ID0gW107XG5cdFx0d2hpbGUgKGxlbmd0aC0tKSB7XG5cdFx0XHRyZXN1bHRbbGVuZ3RoXSA9IGZuKGFycmF5W2xlbmd0aF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0LyoqXG5cdCAqIEEgc2ltcGxlIGBBcnJheSNtYXBgLWxpa2Ugd3JhcHBlciB0byB3b3JrIHdpdGggZG9tYWluIG5hbWUgc3RyaW5ncyBvciBlbWFpbFxuXHQgKiBhZGRyZXNzZXMuXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBkb21haW4gVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MuXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0aGF0IGdldHMgY2FsbGVkIGZvciBldmVyeVxuXHQgKiBjaGFyYWN0ZXIuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgc3RyaW5nIG9mIGNoYXJhY3RlcnMgcmV0dXJuZWQgYnkgdGhlIGNhbGxiYWNrXG5cdCAqIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZnVuY3Rpb24gbWFwRG9tYWluKHN0cmluZywgZm4pIHtcblx0XHR2YXIgcGFydHMgPSBzdHJpbmcuc3BsaXQoJ0AnKTtcblx0XHR2YXIgcmVzdWx0ID0gJyc7XG5cdFx0aWYgKHBhcnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdC8vIEluIGVtYWlsIGFkZHJlc3Nlcywgb25seSB0aGUgZG9tYWluIG5hbWUgc2hvdWxkIGJlIHB1bnljb2RlZC4gTGVhdmVcblx0XHRcdC8vIHRoZSBsb2NhbCBwYXJ0IChpLmUuIGV2ZXJ5dGhpbmcgdXAgdG8gYEBgKSBpbnRhY3QuXG5cdFx0XHRyZXN1bHQgPSBwYXJ0c1swXSArICdAJztcblx0XHRcdHN0cmluZyA9IHBhcnRzWzFdO1xuXHRcdH1cblx0XHQvLyBBdm9pZCBgc3BsaXQocmVnZXgpYCBmb3IgSUU4IGNvbXBhdGliaWxpdHkuIFNlZSAjMTcuXG5cdFx0c3RyaW5nID0gc3RyaW5nLnJlcGxhY2UocmVnZXhTZXBhcmF0b3JzLCAnXFx4MkUnKTtcblx0XHR2YXIgbGFiZWxzID0gc3RyaW5nLnNwbGl0KCcuJyk7XG5cdFx0dmFyIGVuY29kZWQgPSBtYXAobGFiZWxzLCBmbikuam9pbignLicpO1xuXHRcdHJldHVybiByZXN1bHQgKyBlbmNvZGVkO1xuXHR9XG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYW4gYXJyYXkgY29udGFpbmluZyB0aGUgbnVtZXJpYyBjb2RlIHBvaW50cyBvZiBlYWNoIFVuaWNvZGVcblx0ICogY2hhcmFjdGVyIGluIHRoZSBzdHJpbmcuIFdoaWxlIEphdmFTY3JpcHQgdXNlcyBVQ1MtMiBpbnRlcm5hbGx5LFxuXHQgKiB0aGlzIGZ1bmN0aW9uIHdpbGwgY29udmVydCBhIHBhaXIgb2Ygc3Vycm9nYXRlIGhhbHZlcyAoZWFjaCBvZiB3aGljaFxuXHQgKiBVQ1MtMiBleHBvc2VzIGFzIHNlcGFyYXRlIGNoYXJhY3RlcnMpIGludG8gYSBzaW5nbGUgY29kZSBwb2ludCxcblx0ICogbWF0Y2hpbmcgVVRGLTE2LlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmVuY29kZWBcblx0ICogQHNlZSA8aHR0cHM6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtZW5jb2Rpbmc+XG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZS51Y3MyXG5cdCAqIEBuYW1lIGRlY29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyaW5nIFRoZSBVbmljb2RlIGlucHV0IHN0cmluZyAoVUNTLTIpLlxuXHQgKiBAcmV0dXJucyB7QXJyYXl9IFRoZSBuZXcgYXJyYXkgb2YgY29kZSBwb2ludHMuXG5cdCAqL1xuXHRmdW5jdGlvbiB1Y3MyZGVjb2RlKHN0cmluZykge1xuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgY291bnRlciA9IDAsXG5cdFx0ICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGgsXG5cdFx0ICAgIHZhbHVlLFxuXHRcdCAgICBleHRyYTtcblx0XHR3aGlsZSAoY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0dmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0aWYgKHZhbHVlID49IDB4RDgwMCAmJiB2YWx1ZSA8PSAweERCRkYgJiYgY291bnRlciA8IGxlbmd0aCkge1xuXHRcdFx0XHQvLyBoaWdoIHN1cnJvZ2F0ZSwgYW5kIHRoZXJlIGlzIGEgbmV4dCBjaGFyYWN0ZXJcblx0XHRcdFx0ZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xuXHRcdFx0XHRpZiAoKGV4dHJhICYgMHhGQzAwKSA9PSAweERDMDApIHsgLy8gbG93IHN1cnJvZ2F0ZVxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKCgodmFsdWUgJiAweDNGRikgPDwgMTApICsgKGV4dHJhICYgMHgzRkYpICsgMHgxMDAwMCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gdW5tYXRjaGVkIHN1cnJvZ2F0ZTsgb25seSBhcHBlbmQgdGhpcyBjb2RlIHVuaXQsIGluIGNhc2UgdGhlIG5leHRcblx0XHRcdFx0XHQvLyBjb2RlIHVuaXQgaXMgdGhlIGhpZ2ggc3Vycm9nYXRlIG9mIGEgc3Vycm9nYXRlIHBhaXJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0Y291bnRlci0tO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIHN0cmluZyBiYXNlZCBvbiBhbiBhcnJheSBvZiBudW1lcmljIGNvZGUgcG9pbnRzLlxuXHQgKiBAc2VlIGBwdW55Y29kZS51Y3MyLmRlY29kZWBcblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZW5jb2RlXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGNvZGVQb2ludHMgVGhlIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBuZXcgVW5pY29kZSBzdHJpbmcgKFVDUy0yKS5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJlbmNvZGUoYXJyYXkpIHtcblx0XHRyZXR1cm4gbWFwKGFycmF5LCBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdFx0dmFyIG91dHB1dCA9ICcnO1xuXHRcdFx0aWYgKHZhbHVlID4gMHhGRkZGKSB7XG5cdFx0XHRcdHZhbHVlIC09IDB4MTAwMDA7XG5cdFx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApO1xuXHRcdFx0XHR2YWx1ZSA9IDB4REMwMCB8IHZhbHVlICYgMHgzRkY7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlKTtcblx0XHRcdHJldHVybiBvdXRwdXQ7XG5cdFx0fSkuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBiYXNpYyBjb2RlIHBvaW50IGludG8gYSBkaWdpdC9pbnRlZ2VyLlxuXHQgKiBAc2VlIGBkaWdpdFRvQmFzaWMoKWBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IGNvZGVQb2ludCBUaGUgYmFzaWMgbnVtZXJpYyBjb2RlIHBvaW50IHZhbHVlLlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQgKGZvciB1c2UgaW5cblx0ICogcmVwcmVzZW50aW5nIGludGVnZXJzKSBpbiB0aGUgcmFuZ2UgYDBgIHRvIGBiYXNlIC0gMWAsIG9yIGBiYXNlYCBpZlxuXHQgKiB0aGUgY29kZSBwb2ludCBkb2VzIG5vdCByZXByZXNlbnQgYSB2YWx1ZS5cblx0ICovXG5cdGZ1bmN0aW9uIGJhc2ljVG9EaWdpdChjb2RlUG9pbnQpIHtcblx0XHRpZiAoY29kZVBvaW50IC0gNDggPCAxMCkge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDIyO1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gNjUgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDY1O1xuXHRcdH1cblx0XHRpZiAoY29kZVBvaW50IC0gOTcgPCAyNikge1xuXHRcdFx0cmV0dXJuIGNvZGVQb2ludCAtIDk3O1xuXHRcdH1cblx0XHRyZXR1cm4gYmFzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGRpZ2l0L2ludGVnZXIgaW50byBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEBzZWUgYGJhc2ljVG9EaWdpdCgpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gZGlnaXQgVGhlIG51bWVyaWMgdmFsdWUgb2YgYSBiYXNpYyBjb2RlIHBvaW50LlxuXHQgKiBAcmV0dXJucyB7TnVtYmVyfSBUaGUgYmFzaWMgY29kZSBwb2ludCB3aG9zZSB2YWx1ZSAod2hlbiB1c2VkIGZvclxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGlzIGBkaWdpdGAsIHdoaWNoIG5lZWRzIHRvIGJlIGluIHRoZSByYW5nZVxuXHQgKiBgMGAgdG8gYGJhc2UgLSAxYC4gSWYgYGZsYWdgIGlzIG5vbi16ZXJvLCB0aGUgdXBwZXJjYXNlIGZvcm0gaXNcblx0ICogdXNlZDsgZWxzZSwgdGhlIGxvd2VyY2FzZSBmb3JtIGlzIHVzZWQuIFRoZSBiZWhhdmlvciBpcyB1bmRlZmluZWRcblx0ICogaWYgYGZsYWdgIGlzIG5vbi16ZXJvIGFuZCBgZGlnaXRgIGhhcyBubyB1cHBlcmNhc2UgZm9ybS5cblx0ICovXG5cdGZ1bmN0aW9uIGRpZ2l0VG9CYXNpYyhkaWdpdCwgZmxhZykge1xuXHRcdC8vICAwLi4yNSBtYXAgdG8gQVNDSUkgYS4ueiBvciBBLi5aXG5cdFx0Ly8gMjYuLjM1IG1hcCB0byBBU0NJSSAwLi45XG5cdFx0cmV0dXJuIGRpZ2l0ICsgMjIgKyA3NSAqIChkaWdpdCA8IDI2KSAtICgoZmxhZyAhPSAwKSA8PCA1KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBCaWFzIGFkYXB0YXRpb24gZnVuY3Rpb24gYXMgcGVyIHNlY3Rpb24gMy40IG9mIFJGQyAzNDkyLlxuXHQgKiBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjMzQ5MiNzZWN0aW9uLTMuNFxuXHQgKiBAcHJpdmF0ZVxuXHQgKi9cblx0ZnVuY3Rpb24gYWRhcHQoZGVsdGEsIG51bVBvaW50cywgZmlyc3RUaW1lKSB7XG5cdFx0dmFyIGsgPSAwO1xuXHRcdGRlbHRhID0gZmlyc3RUaW1lID8gZmxvb3IoZGVsdGEgLyBkYW1wKSA6IGRlbHRhID4+IDE7XG5cdFx0ZGVsdGEgKz0gZmxvb3IoZGVsdGEgLyBudW1Qb2ludHMpO1xuXHRcdGZvciAoLyogbm8gaW5pdGlhbGl6YXRpb24gKi87IGRlbHRhID4gYmFzZU1pbnVzVE1pbiAqIHRNYXggPj4gMTsgayArPSBiYXNlKSB7XG5cdFx0XHRkZWx0YSA9IGZsb29yKGRlbHRhIC8gYmFzZU1pbnVzVE1pbik7XG5cdFx0fVxuXHRcdHJldHVybiBmbG9vcihrICsgKGJhc2VNaW51c1RNaW4gKyAxKSAqIGRlbHRhIC8gKGRlbHRhICsgc2tldykpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scyB0byBhIHN0cmluZyBvZiBVbmljb2RlXG5cdCAqIHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGRlY29kZShpbnB1dCkge1xuXHRcdC8vIERvbid0IHVzZSBVQ1MtMlxuXHRcdHZhciBvdXRwdXQgPSBbXSxcblx0XHQgICAgaW5wdXRMZW5ndGggPSBpbnB1dC5sZW5ndGgsXG5cdFx0ICAgIG91dCxcblx0XHQgICAgaSA9IDAsXG5cdFx0ICAgIG4gPSBpbml0aWFsTixcblx0XHQgICAgYmlhcyA9IGluaXRpYWxCaWFzLFxuXHRcdCAgICBiYXNpYyxcblx0XHQgICAgaixcblx0XHQgICAgaW5kZXgsXG5cdFx0ICAgIG9sZGksXG5cdFx0ICAgIHcsXG5cdFx0ICAgIGssXG5cdFx0ICAgIGRpZ2l0LFxuXHRcdCAgICB0LFxuXHRcdCAgICAvKiogQ2FjaGVkIGNhbGN1bGF0aW9uIHJlc3VsdHMgKi9cblx0XHQgICAgYmFzZU1pbnVzVDtcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHM6IGxldCBgYmFzaWNgIGJlIHRoZSBudW1iZXIgb2YgaW5wdXQgY29kZVxuXHRcdC8vIHBvaW50cyBiZWZvcmUgdGhlIGxhc3QgZGVsaW1pdGVyLCBvciBgMGAgaWYgdGhlcmUgaXMgbm9uZSwgdGhlbiBjb3B5XG5cdFx0Ly8gdGhlIGZpcnN0IGJhc2ljIGNvZGUgcG9pbnRzIHRvIHRoZSBvdXRwdXQuXG5cblx0XHRiYXNpYyA9IGlucHV0Lmxhc3RJbmRleE9mKGRlbGltaXRlcik7XG5cdFx0aWYgKGJhc2ljIDwgMCkge1xuXHRcdFx0YmFzaWMgPSAwO1xuXHRcdH1cblxuXHRcdGZvciAoaiA9IDA7IGogPCBiYXNpYzsgKytqKSB7XG5cdFx0XHQvLyBpZiBpdCdzIG5vdCBhIGJhc2ljIGNvZGUgcG9pbnRcblx0XHRcdGlmIChpbnB1dC5jaGFyQ29kZUF0KGopID49IDB4ODApIHtcblx0XHRcdFx0ZXJyb3IoJ25vdC1iYXNpYycpO1xuXHRcdFx0fVxuXHRcdFx0b3V0cHV0LnB1c2goaW5wdXQuY2hhckNvZGVBdChqKSk7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBkZWNvZGluZyBsb29wOiBzdGFydCBqdXN0IGFmdGVyIHRoZSBsYXN0IGRlbGltaXRlciBpZiBhbnkgYmFzaWMgY29kZVxuXHRcdC8vIHBvaW50cyB3ZXJlIGNvcGllZDsgc3RhcnQgYXQgdGhlIGJlZ2lubmluZyBvdGhlcndpc2UuXG5cblx0XHRmb3IgKGluZGV4ID0gYmFzaWMgPiAwID8gYmFzaWMgKyAxIDogMDsgaW5kZXggPCBpbnB1dExlbmd0aDsgLyogbm8gZmluYWwgZXhwcmVzc2lvbiAqLykge1xuXG5cdFx0XHQvLyBgaW5kZXhgIGlzIHRoZSBpbmRleCBvZiB0aGUgbmV4dCBjaGFyYWN0ZXIgdG8gYmUgY29uc3VtZWQuXG5cdFx0XHQvLyBEZWNvZGUgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlciBpbnRvIGBkZWx0YWAsXG5cdFx0XHQvLyB3aGljaCBnZXRzIGFkZGVkIHRvIGBpYC4gVGhlIG92ZXJmbG93IGNoZWNraW5nIGlzIGVhc2llclxuXHRcdFx0Ly8gaWYgd2UgaW5jcmVhc2UgYGlgIGFzIHdlIGdvLCB0aGVuIHN1YnRyYWN0IG9mZiBpdHMgc3RhcnRpbmdcblx0XHRcdC8vIHZhbHVlIGF0IHRoZSBlbmQgdG8gb2J0YWluIGBkZWx0YWAuXG5cdFx0XHRmb3IgKG9sZGkgPSBpLCB3ID0gMSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cblx0XHRcdFx0aWYgKGluZGV4ID49IGlucHV0TGVuZ3RoKSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ2ludmFsaWQtaW5wdXQnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGRpZ2l0ID0gYmFzaWNUb0RpZ2l0KGlucHV0LmNoYXJDb2RlQXQoaW5kZXgrKykpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA+PSBiYXNlIHx8IGRpZ2l0ID4gZmxvb3IoKG1heEludCAtIGkpIC8gdykpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGkgKz0gZGlnaXQgKiB3O1xuXHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblxuXHRcdFx0XHRpZiAoZGlnaXQgPCB0KSB7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRiYXNlTWludXNUID0gYmFzZSAtIHQ7XG5cdFx0XHRcdGlmICh3ID4gZmxvb3IobWF4SW50IC8gYmFzZU1pbnVzVCkpIHtcblx0XHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHcgKj0gYmFzZU1pbnVzVDtcblxuXHRcdFx0fVxuXG5cdFx0XHRvdXQgPSBvdXRwdXQubGVuZ3RoICsgMTtcblx0XHRcdGJpYXMgPSBhZGFwdChpIC0gb2xkaSwgb3V0LCBvbGRpID09IDApO1xuXG5cdFx0XHQvLyBgaWAgd2FzIHN1cHBvc2VkIHRvIHdyYXAgYXJvdW5kIGZyb20gYG91dGAgdG8gYDBgLFxuXHRcdFx0Ly8gaW5jcmVtZW50aW5nIGBuYCBlYWNoIHRpbWUsIHNvIHdlJ2xsIGZpeCB0aGF0IG5vdzpcblx0XHRcdGlmIChmbG9vcihpIC8gb3V0KSA+IG1heEludCAtIG4pIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdG4gKz0gZmxvb3IoaSAvIG91dCk7XG5cdFx0XHRpICU9IG91dDtcblxuXHRcdFx0Ly8gSW5zZXJ0IGBuYCBhdCBwb3NpdGlvbiBgaWAgb2YgdGhlIG91dHB1dFxuXHRcdFx0b3V0cHV0LnNwbGljZShpKyssIDAsIG4pO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVjczJlbmNvZGUob3V0cHV0KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMgKGUuZy4gYSBkb21haW4gbmFtZSBsYWJlbCkgdG8gYVxuXHQgKiBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgcmVzdWx0aW5nIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqL1xuXHRmdW5jdGlvbiBlbmNvZGUoaW5wdXQpIHtcblx0XHR2YXIgbixcblx0XHQgICAgZGVsdGEsXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50LFxuXHRcdCAgICBiYXNpY0xlbmd0aCxcblx0XHQgICAgYmlhcyxcblx0XHQgICAgaixcblx0XHQgICAgbSxcblx0XHQgICAgcSxcblx0XHQgICAgayxcblx0XHQgICAgdCxcblx0XHQgICAgY3VycmVudFZhbHVlLFxuXHRcdCAgICBvdXRwdXQgPSBbXSxcblx0XHQgICAgLyoqIGBpbnB1dExlbmd0aGAgd2lsbCBob2xkIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgaW4gYGlucHV0YC4gKi9cblx0XHQgICAgaW5wdXRMZW5ndGgsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsXG5cdFx0ICAgIGJhc2VNaW51c1QsXG5cdFx0ICAgIHFNaW51c1Q7XG5cblx0XHQvLyBDb252ZXJ0IHRoZSBpbnB1dCBpbiBVQ1MtMiB0byBVbmljb2RlXG5cdFx0aW5wdXQgPSB1Y3MyZGVjb2RlKGlucHV0KTtcblxuXHRcdC8vIENhY2hlIHRoZSBsZW5ndGhcblx0XHRpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aDtcblxuXHRcdC8vIEluaXRpYWxpemUgdGhlIHN0YXRlXG5cdFx0biA9IGluaXRpYWxOO1xuXHRcdGRlbHRhID0gMDtcblx0XHRiaWFzID0gaW5pdGlhbEJpYXM7XG5cblx0XHQvLyBIYW5kbGUgdGhlIGJhc2ljIGNvZGUgcG9pbnRzXG5cdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdGN1cnJlbnRWYWx1ZSA9IGlucHV0W2pdO1xuXHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IDB4ODApIHtcblx0XHRcdFx0b3V0cHV0LnB1c2goc3RyaW5nRnJvbUNoYXJDb2RlKGN1cnJlbnRWYWx1ZSkpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGhhbmRsZWRDUENvdW50ID0gYmFzaWNMZW5ndGggPSBvdXRwdXQubGVuZ3RoO1xuXG5cdFx0Ly8gYGhhbmRsZWRDUENvdW50YCBpcyB0aGUgbnVtYmVyIG9mIGNvZGUgcG9pbnRzIHRoYXQgaGF2ZSBiZWVuIGhhbmRsZWQ7XG5cdFx0Ly8gYGJhc2ljTGVuZ3RoYCBpcyB0aGUgbnVtYmVyIG9mIGJhc2ljIGNvZGUgcG9pbnRzLlxuXG5cdFx0Ly8gRmluaXNoIHRoZSBiYXNpYyBzdHJpbmcgLSBpZiBpdCBpcyBub3QgZW1wdHkgLSB3aXRoIGEgZGVsaW1pdGVyXG5cdFx0aWYgKGJhc2ljTGVuZ3RoKSB7XG5cdFx0XHRvdXRwdXQucHVzaChkZWxpbWl0ZXIpO1xuXHRcdH1cblxuXHRcdC8vIE1haW4gZW5jb2RpbmcgbG9vcDpcblx0XHR3aGlsZSAoaGFuZGxlZENQQ291bnQgPCBpbnB1dExlbmd0aCkge1xuXG5cdFx0XHQvLyBBbGwgbm9uLWJhc2ljIGNvZGUgcG9pbnRzIDwgbiBoYXZlIGJlZW4gaGFuZGxlZCBhbHJlYWR5LiBGaW5kIHRoZSBuZXh0XG5cdFx0XHQvLyBsYXJnZXIgb25lOlxuXHRcdFx0Zm9yIChtID0gbWF4SW50LCBqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRcdGlmIChjdXJyZW50VmFsdWUgPj0gbiAmJiBjdXJyZW50VmFsdWUgPCBtKSB7XG5cdFx0XHRcdFx0bSA9IGN1cnJlbnRWYWx1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQvLyBJbmNyZWFzZSBgZGVsdGFgIGVub3VnaCB0byBhZHZhbmNlIHRoZSBkZWNvZGVyJ3MgPG4saT4gc3RhdGUgdG8gPG0sMD4sXG5cdFx0XHQvLyBidXQgZ3VhcmQgYWdhaW5zdCBvdmVyZmxvd1xuXHRcdFx0aGFuZGxlZENQQ291bnRQbHVzT25lID0gaGFuZGxlZENQQ291bnQgKyAxO1xuXHRcdFx0aWYgKG0gLSBuID4gZmxvb3IoKG1heEludCAtIGRlbHRhKSAvIGhhbmRsZWRDUENvdW50UGx1c09uZSkpIHtcblx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHR9XG5cblx0XHRcdGRlbHRhICs9IChtIC0gbikgKiBoYW5kbGVkQ1BDb3VudFBsdXNPbmU7XG5cdFx0XHRuID0gbTtcblxuXHRcdFx0Zm9yIChqID0gMDsgaiA8IGlucHV0TGVuZ3RoOyArK2opIHtcblx0XHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA8IG4gJiYgKytkZWx0YSA+IG1heEludCkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA9PSBuKSB7XG5cdFx0XHRcdFx0Ly8gUmVwcmVzZW50IGRlbHRhIGFzIGEgZ2VuZXJhbGl6ZWQgdmFyaWFibGUtbGVuZ3RoIGludGVnZXJcblx0XHRcdFx0XHRmb3IgKHEgPSBkZWx0YSwgayA9IGJhc2U7IC8qIG5vIGNvbmRpdGlvbiAqLzsgayArPSBiYXNlKSB7XG5cdFx0XHRcdFx0XHR0ID0gayA8PSBiaWFzID8gdE1pbiA6IChrID49IGJpYXMgKyB0TWF4ID8gdE1heCA6IGsgLSBiaWFzKTtcblx0XHRcdFx0XHRcdGlmIChxIDwgdCkge1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdHFNaW51c1QgPSBxIC0gdDtcblx0XHRcdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0XHRcdG91dHB1dC5wdXNoKFxuXHRcdFx0XHRcdFx0XHRzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHQgKyBxTWludXNUICUgYmFzZU1pbnVzVCwgMCkpXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdFx0cSA9IGZsb29yKHFNaW51c1QgLyBiYXNlTWludXNUKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoZGlnaXRUb0Jhc2ljKHEsIDApKSk7XG5cdFx0XHRcdFx0YmlhcyA9IGFkYXB0KGRlbHRhLCBoYW5kbGVkQ1BDb3VudFBsdXNPbmUsIGhhbmRsZWRDUENvdW50ID09IGJhc2ljTGVuZ3RoKTtcblx0XHRcdFx0XHRkZWx0YSA9IDA7XG5cdFx0XHRcdFx0KytoYW5kbGVkQ1BDb3VudDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHQrK2RlbHRhO1xuXHRcdFx0KytuO1xuXG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQuam9pbignJyk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgb3IgYW4gZW1haWwgYWRkcmVzc1xuXHQgKiB0byBVbmljb2RlLiBPbmx5IHRoZSBQdW55Y29kZWQgcGFydHMgb2YgdGhlIGlucHV0IHdpbGwgYmUgY29udmVydGVkLCBpLmUuXG5cdCAqIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHlvdSBjYWxsIGl0IG9uIGEgc3RyaW5nIHRoYXQgaGFzIGFscmVhZHkgYmVlblxuXHQgKiBjb252ZXJ0ZWQgdG8gVW5pY29kZS5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGVkIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MgdG9cblx0ICogY29udmVydCB0byBVbmljb2RlLlxuXHQgKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgVW5pY29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gUHVueWNvZGVcblx0ICogc3RyaW5nLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9Vbmljb2RlKGlucHV0KSB7XG5cdFx0cmV0dXJuIG1hcERvbWFpbihpbnB1dCwgZnVuY3Rpb24oc3RyaW5nKSB7XG5cdFx0XHRyZXR1cm4gcmVnZXhQdW55Y29kZS50ZXN0KHN0cmluZylcblx0XHRcdFx0PyBkZWNvZGUoc3RyaW5nLnNsaWNlKDQpLnRvTG93ZXJDYXNlKCkpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgVW5pY29kZSBzdHJpbmcgcmVwcmVzZW50aW5nIGEgZG9tYWluIG5hbWUgb3IgYW4gZW1haWwgYWRkcmVzcyB0b1xuXHQgKiBQdW55Y29kZS4gT25seSB0aGUgbm9uLUFTQ0lJIHBhcnRzIG9mIHRoZSBkb21haW4gbmFtZSB3aWxsIGJlIGNvbnZlcnRlZCxcblx0ICogaS5lLiBpdCBkb2Vzbid0IG1hdHRlciBpZiB5b3UgY2FsbCBpdCB3aXRoIGEgZG9tYWluIHRoYXQncyBhbHJlYWR5IGluXG5cdCAqIEFTQ0lJLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBkb21haW4gbmFtZSBvciBlbWFpbCBhZGRyZXNzIHRvIGNvbnZlcnQsIGFzIGFcblx0ICogVW5pY29kZSBzdHJpbmcuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBQdW55Y29kZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gZG9tYWluIG5hbWUgb3Jcblx0ICogZW1haWwgYWRkcmVzcy5cblx0ICovXG5cdGZ1bmN0aW9uIHRvQVNDSUkoaW5wdXQpIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleE5vbkFTQ0lJLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/ICd4bi0tJyArIGVuY29kZShzdHJpbmcpXG5cdFx0XHRcdDogc3RyaW5nO1xuXHRcdH0pO1xuXHR9XG5cblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXG5cblx0LyoqIERlZmluZSB0aGUgcHVibGljIEFQSSAqL1xuXHRwdW55Y29kZSA9IHtcblx0XHQvKipcblx0XHQgKiBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgUHVueWNvZGUuanMgdmVyc2lvbiBudW1iZXIuXG5cdFx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdFx0ICogQHR5cGUgU3RyaW5nXG5cdFx0ICovXG5cdFx0J3ZlcnNpb24nOiAnMS40LjEnLFxuXHRcdC8qKlxuXHRcdCAqIEFuIG9iamVjdCBvZiBtZXRob2RzIHRvIGNvbnZlcnQgZnJvbSBKYXZhU2NyaXB0J3MgaW50ZXJuYWwgY2hhcmFjdGVyXG5cdFx0ICogcmVwcmVzZW50YXRpb24gKFVDUy0yKSB0byBVbmljb2RlIGNvZGUgcG9pbnRzLCBhbmQgYmFjay5cblx0XHQgKiBAc2VlIDxodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBPYmplY3Rcblx0XHQgKi9cblx0XHQndWNzMic6IHtcblx0XHRcdCdkZWNvZGUnOiB1Y3MyZGVjb2RlLFxuXHRcdFx0J2VuY29kZSc6IHVjczJlbmNvZGVcblx0XHR9LFxuXHRcdCdkZWNvZGUnOiBkZWNvZGUsXG5cdFx0J2VuY29kZSc6IGVuY29kZSxcblx0XHQndG9BU0NJSSc6IHRvQVNDSUksXG5cdFx0J3RvVW5pY29kZSc6IHRvVW5pY29kZVxuXHR9O1xuXG5cdC8qKiBFeHBvc2UgYHB1bnljb2RlYCAqL1xuXHQvLyBTb21lIEFNRCBidWlsZCBvcHRpbWl6ZXJzLCBsaWtlIHIuanMsIGNoZWNrIGZvciBzcGVjaWZpYyBjb25kaXRpb24gcGF0dGVybnNcblx0Ly8gbGlrZSB0aGUgZm9sbG93aW5nOlxuXHRpZiAoXG5cdFx0dHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmXG5cdFx0dHlwZW9mIGRlZmluZS5hbWQgPT0gJ29iamVjdCcgJiZcblx0XHRkZWZpbmUuYW1kXG5cdCkge1xuXHRcdGRlZmluZSgncHVueWNvZGUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBwdW55Y29kZTtcblx0XHR9KTtcblx0fSBlbHNlIGlmIChmcmVlRXhwb3J0cyAmJiBmcmVlTW9kdWxlKSB7XG5cdFx0aWYgKG1vZHVsZS5leHBvcnRzID09IGZyZWVFeHBvcnRzKSB7XG5cdFx0XHQvLyBpbiBOb2RlLmpzLCBpby5qcywgb3IgUmluZ29KUyB2MC44LjArXG5cdFx0XHRmcmVlTW9kdWxlLmV4cG9ydHMgPSBwdW55Y29kZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gaW4gTmFyd2hhbCBvciBSaW5nb0pTIHYwLjcuMC1cblx0XHRcdGZvciAoa2V5IGluIHB1bnljb2RlKSB7XG5cdFx0XHRcdHB1bnljb2RlLmhhc093blByb3BlcnR5KGtleSkgJiYgKGZyZWVFeHBvcnRzW2tleV0gPSBwdW55Y29kZVtrZXldKTtcblx0XHRcdH1cblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gaW4gUmhpbm8gb3IgYSB3ZWIgYnJvd3NlclxuXHRcdHJvb3QucHVueWNvZGUgPSBwdW55Y29kZTtcblx0fVxuXG59KHRoaXMpKTtcbiIsIihmdW5jdGlvbigpIHtcblxuICAgIGNvbnN0IHBhY2thZ2UgPSByZXF1aXJlKCcuLi9wYWNrYWdlLmpzb24nKTtcbiAgICB3aW5kb3cuQ2hhdEVuZ2luZUNvcmUucGx1Z2luW3BhY2thZ2UubmFtZV0gPSByZXF1aXJlKCcuLi9zcmMvcGx1Z2luLmpzJyk7XG5cbn0pKCk7XG4iLCIvL1xuLy8gRG90dHkgbWFrZXMgaXQgZWFzeSB0byBwcm9ncmFtbWF0aWNhbGx5IGFjY2VzcyBhcmJpdHJhcmlseSBuZXN0ZWQgb2JqZWN0cyBhbmRcbi8vIHRoZWlyIHByb3BlcnRpZXMuXG4vL1xuXG4vL1xuLy8gYG9iamVjdGAgaXMgYW4gb2JqZWN0LCBgcGF0aGAgaXMgdGhlIHBhdGggdG8gdGhlIHByb3BlcnR5IHlvdSB3YW50IHRvIGNoZWNrXG4vLyBmb3IgZXhpc3RlbmNlIG9mLlxuLy9cbi8vIGBwYXRoYCBjYW4gYmUgcHJvdmlkZWQgYXMgZWl0aGVyIGEgYFwic3RyaW5nLnNlcGFyYXRlZC53aXRoLmRvdHNcImAgb3IgYXNcbi8vIGBbXCJhblwiLCBcImFycmF5XCJdYC5cbi8vXG4vLyBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgcGF0aCBjYW4gYmUgY29tcGxldGVseSByZXNvbHZlZCwgYGZhbHNlYCBvdGhlcndpc2UuXG4vL1xuXG52YXIgZXhpc3RzID0gbW9kdWxlLmV4cG9ydHMuZXhpc3RzID0gZnVuY3Rpb24gZXhpc3RzKG9iamVjdCwgcGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIpIHtcbiAgICBwYXRoID0gcGF0aC5zcGxpdChcIi5cIik7XG4gIH1cblxuICBpZiAoIShwYXRoIGluc3RhbmNlb2YgQXJyYXkpIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGF0aCA9IHBhdGguc2xpY2UoKTtcblxuICB2YXIga2V5ID0gcGF0aC5zaGlmdCgpO1xuXG4gIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBPYmplY3QuaGFzT3duUHJvcGVydHkuYXBwbHkob2JqZWN0LCBba2V5XSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGV4aXN0cyhvYmplY3Rba2V5XSwgcGF0aCk7XG4gIH1cbn07XG5cbi8vXG4vLyBUaGVzZSBhcmd1bWVudHMgYXJlIHRoZSBzYW1lIGFzIHRob3NlIGZvciBgZXhpc3RzYC5cbi8vXG4vLyBUaGUgcmV0dXJuIHZhbHVlLCBob3dldmVyLCBpcyB0aGUgcHJvcGVydHkgeW91J3JlIHRyeWluZyB0byBhY2Nlc3MsIG9yXG4vLyBgdW5kZWZpbmVkYCBpZiBpdCBjYW4ndCBiZSBmb3VuZC4gVGhpcyBtZWFucyB5b3Ugd29uJ3QgYmUgYWJsZSB0byB0ZWxsXG4vLyB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIGFuIHVucmVzb2x2ZWQgcGF0aCBhbmQgYW4gdW5kZWZpbmVkIHByb3BlcnR5LCBzbyB5b3UgXG4vLyBzaG91bGQgbm90IHVzZSBgZ2V0YCB0byBjaGVjayBmb3IgdGhlIGV4aXN0ZW5jZSBvZiBhIHByb3BlcnR5LiBVc2UgYGV4aXN0c2Bcbi8vIGluc3RlYWQuXG4vL1xuXG52YXIgZ2V0ID0gbW9kdWxlLmV4cG9ydHMuZ2V0ID0gZnVuY3Rpb24gZ2V0KG9iamVjdCwgcGF0aCkge1xuICBpZiAodHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIpIHtcbiAgICBwYXRoID0gcGF0aC5zcGxpdChcIi5cIik7XG4gIH1cblxuICBpZiAoIShwYXRoIGluc3RhbmNlb2YgQXJyYXkpIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcGF0aCA9IHBhdGguc2xpY2UoKTtcblxuICB2YXIga2V5ID0gcGF0aC5zaGlmdCgpO1xuXG4gIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBvYmplY3Rba2V5XTtcbiAgfVxuXG4gIGlmIChwYXRoLmxlbmd0aCkge1xuICAgIHJldHVybiBnZXQob2JqZWN0W2tleV0sIHBhdGgpO1xuICB9XG59O1xuXG4vL1xuLy8gQXJndW1lbnRzIGFyZSBzaW1pbGFyIHRvIGBleGlzdHNgIGFuZCBgZ2V0YCwgd2l0aCB0aGUgZXhjZXB0aW9uIHRoYXQgcGF0aFxuLy8gY29tcG9uZW50cyBhcmUgcmVnZXhlcyB3aXRoIHNvbWUgc3BlY2lhbCBjYXNlcy4gSWYgYSBwYXRoIGNvbXBvbmVudCBpcyBgXCIqXCJgXG4vLyBvbiBpdHMgb3duLCBpdCdsbCBiZSBjb252ZXJ0ZWQgdG8gYC8uKi9gLlxuLy9cbi8vIFRoZSByZXR1cm4gdmFsdWUgaXMgYW4gYXJyYXkgb2YgdmFsdWVzIHdoZXJlIHRoZSBrZXkgcGF0aCBtYXRjaGVzIHRoZVxuLy8gc3BlY2lmaWVkIGNyaXRlcmlvbi4gSWYgbm9uZSBtYXRjaCwgYW4gZW1wdHkgYXJyYXkgd2lsbCBiZSByZXR1cm5lZC5cbi8vXG5cbnZhciBzZWFyY2ggPSBtb2R1bGUuZXhwb3J0cy5zZWFyY2ggPSBmdW5jdGlvbiBzZWFyY2gob2JqZWN0LCBwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHBhdGggPSBwYXRoLnNwbGl0KFwiLlwiKTtcbiAgfVxuXG4gIGlmICghKHBhdGggaW5zdGFuY2VvZiBBcnJheSkgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwYXRoID0gcGF0aC5zbGljZSgpO1xuXG4gIHZhciBrZXkgPSBwYXRoLnNoaWZ0KCk7XG5cbiAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKGtleSA9PT0gXCIqXCIpIHtcbiAgICBrZXkgPSBcIi4qXCI7XG4gIH1cblxuICBpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGtleSA9IG5ldyBSZWdFeHAoa2V5KTtcbiAgfVxuXG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLmZpbHRlcihrZXkudGVzdC5iaW5kKGtleSkpLm1hcChmdW5jdGlvbihrKSB7IHJldHVybiBvYmplY3Rba107IH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBPYmplY3Qua2V5cyhvYmplY3QpLmZpbHRlcihrZXkudGVzdC5iaW5kKGtleSkpLm1hcChmdW5jdGlvbihrKSB7IHJldHVybiBzZWFyY2gob2JqZWN0W2tdLCBwYXRoKTsgfSkpO1xuICB9XG59O1xuXG4vL1xuLy8gVGhlIGZpcnN0IHR3byBhcmd1bWVudHMgZm9yIGBwdXRgIGFyZSB0aGUgc2FtZSBhcyBgZXhpc3RzYCBhbmQgYGdldGAuXG4vL1xuLy8gVGhlIHRoaXJkIGFyZ3VtZW50IGlzIGEgdmFsdWUgdG8gYHB1dGAgYXQgdGhlIGBwYXRoYCBvZiB0aGUgYG9iamVjdGAuXG4vLyBPYmplY3RzIGluIHRoZSBtaWRkbGUgd2lsbCBiZSBjcmVhdGVkIGlmIHRoZXkgZG9uJ3QgZXhpc3QsIG9yIGFkZGVkIHRvIGlmXG4vLyB0aGV5IGRvLiBJZiBhIHZhbHVlIGlzIGVuY291bnRlcmVkIGluIHRoZSBtaWRkbGUgb2YgdGhlIHBhdGggdGhhdCBpcyAqbm90KlxuLy8gYW4gb2JqZWN0LCBpdCB3aWxsIG5vdCBiZSBvdmVyd3JpdHRlbi5cbi8vXG4vLyBUaGUgcmV0dXJuIHZhbHVlIGlzIGB0cnVlYCBpbiB0aGUgY2FzZSB0aGF0IHRoZSB2YWx1ZSB3YXMgYHB1dGBcbi8vIHN1Y2Nlc3NmdWxseSwgb3IgYGZhbHNlYCBvdGhlcndpc2UuXG4vL1xuXG52YXIgcHV0ID0gbW9kdWxlLmV4cG9ydHMucHV0ID0gZnVuY3Rpb24gcHV0KG9iamVjdCwgcGF0aCwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiKSB7XG4gICAgcGF0aCA9IHBhdGguc3BsaXQoXCIuXCIpO1xuICB9XG5cbiAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgcGF0aCA9IHBhdGguc2xpY2UoKTtcblxuICB2YXIga2V5ID0gcGF0aC5zaGlmdCgpO1xuXG4gIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIG9iamVjdFtrZXldID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgb2JqZWN0W2tleV0gPSB7fTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdFtrZXldID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHB1dChvYmplY3Rba2V5XSwgcGF0aCwgdmFsdWUpO1xuICB9XG59O1xuXG4vL1xuLy8gYHJlbW92ZWAgaXMgbGlrZSBgcHV0YCBpbiByZXZlcnNlIVxuLy9cbi8vIFRoZSByZXR1cm4gdmFsdWUgaXMgYHRydWVgIGluIHRoZSBjYXNlIHRoYXQgdGhlIHZhbHVlIGV4aXN0ZWQgYW5kIHdhcyByZW1vdmVkXG4vLyBzdWNjZXNzZnVsbHksIG9yIGBmYWxzZWAgb3RoZXJ3aXNlLlxuLy9cblxudmFyIHJlbW92ZSA9IG1vZHVsZS5leHBvcnRzLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZShvYmplY3QsIHBhdGgsIHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHBhdGggPSBwYXRoLnNwbGl0KFwiLlwiKTtcbiAgfVxuXG4gIGlmICghKHBhdGggaW5zdGFuY2VvZiBBcnJheSkgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgXG4gIHBhdGggPSBwYXRoLnNsaWNlKCk7XG5cbiAgdmFyIGtleSA9IHBhdGguc2hpZnQoKTtcblxuICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoIU9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwga2V5KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGRlbGV0ZSBvYmplY3Rba2V5XTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiByZW1vdmUob2JqZWN0W2tleV0sIHBhdGgsIHZhbHVlKTtcbiAgfVxufTtcblxuLy9cbi8vIGBkZWVwS2V5c2AgY3JlYXRlcyBhIGxpc3Qgb2YgYWxsIHBvc3NpYmxlIGtleSBwYXRocyBmb3IgYSBnaXZlbiBvYmplY3QuXG4vL1xuLy8gVGhlIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgYW4gYXJyYXksIHRoZSBtZW1iZXJzIG9mIHdoaWNoIGFyZSBwYXRocyBpbiBhcnJheVxuLy8gZm9ybWF0LiBJZiB5b3Ugd2FudCB0aGVtIGluIGRvdC1ub3RhdGlvbiBmb3JtYXQsIGRvIHNvbWV0aGluZyBsaWtlIHRoaXM6XG4vL1xuLy8gYGBganNcbi8vIGRvdHR5LmRlZXBLZXlzKG9iaikubWFwKGZ1bmN0aW9uKGUpIHtcbi8vICAgcmV0dXJuIGUuam9pbihcIi5cIik7XG4vLyB9KTtcbi8vIGBgYFxuLy9cbi8vICpOb3RlOiB0aGlzIHdpbGwgcHJvYmFibHkgZXhwbG9kZSBvbiByZWN1cnNpdmUgb2JqZWN0cy4gQmUgY2FyZWZ1bC4qXG4vL1xuXG52YXIgZGVlcEtleXMgPSBtb2R1bGUuZXhwb3J0cy5kZWVwS2V5cyA9IGZ1bmN0aW9uIGRlZXBLZXlzKG9iamVjdCwgcHJlZml4KSB7XG4gIGlmICh0eXBlb2YgcHJlZml4ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgcHJlZml4ID0gW107XG4gIH1cblxuICB2YXIga2V5cyA9IFtdO1xuXG4gIGZvciAodmFyIGsgaW4gb2JqZWN0KSB7XG4gICAgaWYgKCFPYmplY3QuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGspKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBrZXlzLnB1c2gocHJlZml4LmNvbmNhdChba10pKTtcblxuICAgIGlmICh0eXBlb2Ygb2JqZWN0W2tdID09PSBcIm9iamVjdFwiICYmIG9iamVjdFtrXSAhPT0gbnVsbCkge1xuICAgICAga2V5cyA9IGtleXMuY29uY2F0KGRlZXBLZXlzKG9iamVjdFtrXSwgcHJlZml4LmNvbmNhdChba10pKSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwibW9kdWxlLmV4cG9ydHM9e1wiQWFjdXRlXCI6XCJcXHUwMEMxXCIsXCJhYWN1dGVcIjpcIlxcdTAwRTFcIixcIkFicmV2ZVwiOlwiXFx1MDEwMlwiLFwiYWJyZXZlXCI6XCJcXHUwMTAzXCIsXCJhY1wiOlwiXFx1MjIzRVwiLFwiYWNkXCI6XCJcXHUyMjNGXCIsXCJhY0VcIjpcIlxcdTIyM0VcXHUwMzMzXCIsXCJBY2lyY1wiOlwiXFx1MDBDMlwiLFwiYWNpcmNcIjpcIlxcdTAwRTJcIixcImFjdXRlXCI6XCJcXHUwMEI0XCIsXCJBY3lcIjpcIlxcdTA0MTBcIixcImFjeVwiOlwiXFx1MDQzMFwiLFwiQUVsaWdcIjpcIlxcdTAwQzZcIixcImFlbGlnXCI6XCJcXHUwMEU2XCIsXCJhZlwiOlwiXFx1MjA2MVwiLFwiQWZyXCI6XCJcXHVEODM1XFx1REQwNFwiLFwiYWZyXCI6XCJcXHVEODM1XFx1REQxRVwiLFwiQWdyYXZlXCI6XCJcXHUwMEMwXCIsXCJhZ3JhdmVcIjpcIlxcdTAwRTBcIixcImFsZWZzeW1cIjpcIlxcdTIxMzVcIixcImFsZXBoXCI6XCJcXHUyMTM1XCIsXCJBbHBoYVwiOlwiXFx1MDM5MVwiLFwiYWxwaGFcIjpcIlxcdTAzQjFcIixcIkFtYWNyXCI6XCJcXHUwMTAwXCIsXCJhbWFjclwiOlwiXFx1MDEwMVwiLFwiYW1hbGdcIjpcIlxcdTJBM0ZcIixcImFtcFwiOlwiJlwiLFwiQU1QXCI6XCImXCIsXCJhbmRhbmRcIjpcIlxcdTJBNTVcIixcIkFuZFwiOlwiXFx1MkE1M1wiLFwiYW5kXCI6XCJcXHUyMjI3XCIsXCJhbmRkXCI6XCJcXHUyQTVDXCIsXCJhbmRzbG9wZVwiOlwiXFx1MkE1OFwiLFwiYW5kdlwiOlwiXFx1MkE1QVwiLFwiYW5nXCI6XCJcXHUyMjIwXCIsXCJhbmdlXCI6XCJcXHUyOUE0XCIsXCJhbmdsZVwiOlwiXFx1MjIyMFwiLFwiYW5nbXNkYWFcIjpcIlxcdTI5QThcIixcImFuZ21zZGFiXCI6XCJcXHUyOUE5XCIsXCJhbmdtc2RhY1wiOlwiXFx1MjlBQVwiLFwiYW5nbXNkYWRcIjpcIlxcdTI5QUJcIixcImFuZ21zZGFlXCI6XCJcXHUyOUFDXCIsXCJhbmdtc2RhZlwiOlwiXFx1MjlBRFwiLFwiYW5nbXNkYWdcIjpcIlxcdTI5QUVcIixcImFuZ21zZGFoXCI6XCJcXHUyOUFGXCIsXCJhbmdtc2RcIjpcIlxcdTIyMjFcIixcImFuZ3J0XCI6XCJcXHUyMjFGXCIsXCJhbmdydHZiXCI6XCJcXHUyMkJFXCIsXCJhbmdydHZiZFwiOlwiXFx1Mjk5RFwiLFwiYW5nc3BoXCI6XCJcXHUyMjIyXCIsXCJhbmdzdFwiOlwiXFx1MDBDNVwiLFwiYW5nemFyclwiOlwiXFx1MjM3Q1wiLFwiQW9nb25cIjpcIlxcdTAxMDRcIixcImFvZ29uXCI6XCJcXHUwMTA1XCIsXCJBb3BmXCI6XCJcXHVEODM1XFx1REQzOFwiLFwiYW9wZlwiOlwiXFx1RDgzNVxcdURENTJcIixcImFwYWNpclwiOlwiXFx1MkE2RlwiLFwiYXBcIjpcIlxcdTIyNDhcIixcImFwRVwiOlwiXFx1MkE3MFwiLFwiYXBlXCI6XCJcXHUyMjRBXCIsXCJhcGlkXCI6XCJcXHUyMjRCXCIsXCJhcG9zXCI6XCInXCIsXCJBcHBseUZ1bmN0aW9uXCI6XCJcXHUyMDYxXCIsXCJhcHByb3hcIjpcIlxcdTIyNDhcIixcImFwcHJveGVxXCI6XCJcXHUyMjRBXCIsXCJBcmluZ1wiOlwiXFx1MDBDNVwiLFwiYXJpbmdcIjpcIlxcdTAwRTVcIixcIkFzY3JcIjpcIlxcdUQ4MzVcXHVEQzlDXCIsXCJhc2NyXCI6XCJcXHVEODM1XFx1RENCNlwiLFwiQXNzaWduXCI6XCJcXHUyMjU0XCIsXCJhc3RcIjpcIipcIixcImFzeW1wXCI6XCJcXHUyMjQ4XCIsXCJhc3ltcGVxXCI6XCJcXHUyMjREXCIsXCJBdGlsZGVcIjpcIlxcdTAwQzNcIixcImF0aWxkZVwiOlwiXFx1MDBFM1wiLFwiQXVtbFwiOlwiXFx1MDBDNFwiLFwiYXVtbFwiOlwiXFx1MDBFNFwiLFwiYXdjb25pbnRcIjpcIlxcdTIyMzNcIixcImF3aW50XCI6XCJcXHUyQTExXCIsXCJiYWNrY29uZ1wiOlwiXFx1MjI0Q1wiLFwiYmFja2Vwc2lsb25cIjpcIlxcdTAzRjZcIixcImJhY2twcmltZVwiOlwiXFx1MjAzNVwiLFwiYmFja3NpbVwiOlwiXFx1MjIzRFwiLFwiYmFja3NpbWVxXCI6XCJcXHUyMkNEXCIsXCJCYWNrc2xhc2hcIjpcIlxcdTIyMTZcIixcIkJhcnZcIjpcIlxcdTJBRTdcIixcImJhcnZlZVwiOlwiXFx1MjJCRFwiLFwiYmFyd2VkXCI6XCJcXHUyMzA1XCIsXCJCYXJ3ZWRcIjpcIlxcdTIzMDZcIixcImJhcndlZGdlXCI6XCJcXHUyMzA1XCIsXCJiYnJrXCI6XCJcXHUyM0I1XCIsXCJiYnJrdGJya1wiOlwiXFx1MjNCNlwiLFwiYmNvbmdcIjpcIlxcdTIyNENcIixcIkJjeVwiOlwiXFx1MDQxMVwiLFwiYmN5XCI6XCJcXHUwNDMxXCIsXCJiZHF1b1wiOlwiXFx1MjAxRVwiLFwiYmVjYXVzXCI6XCJcXHUyMjM1XCIsXCJiZWNhdXNlXCI6XCJcXHUyMjM1XCIsXCJCZWNhdXNlXCI6XCJcXHUyMjM1XCIsXCJiZW1wdHl2XCI6XCJcXHUyOUIwXCIsXCJiZXBzaVwiOlwiXFx1MDNGNlwiLFwiYmVybm91XCI6XCJcXHUyMTJDXCIsXCJCZXJub3VsbGlzXCI6XCJcXHUyMTJDXCIsXCJCZXRhXCI6XCJcXHUwMzkyXCIsXCJiZXRhXCI6XCJcXHUwM0IyXCIsXCJiZXRoXCI6XCJcXHUyMTM2XCIsXCJiZXR3ZWVuXCI6XCJcXHUyMjZDXCIsXCJCZnJcIjpcIlxcdUQ4MzVcXHVERDA1XCIsXCJiZnJcIjpcIlxcdUQ4MzVcXHVERDFGXCIsXCJiaWdjYXBcIjpcIlxcdTIyQzJcIixcImJpZ2NpcmNcIjpcIlxcdTI1RUZcIixcImJpZ2N1cFwiOlwiXFx1MjJDM1wiLFwiYmlnb2RvdFwiOlwiXFx1MkEwMFwiLFwiYmlnb3BsdXNcIjpcIlxcdTJBMDFcIixcImJpZ290aW1lc1wiOlwiXFx1MkEwMlwiLFwiYmlnc3FjdXBcIjpcIlxcdTJBMDZcIixcImJpZ3N0YXJcIjpcIlxcdTI2MDVcIixcImJpZ3RyaWFuZ2xlZG93blwiOlwiXFx1MjVCRFwiLFwiYmlndHJpYW5nbGV1cFwiOlwiXFx1MjVCM1wiLFwiYmlndXBsdXNcIjpcIlxcdTJBMDRcIixcImJpZ3ZlZVwiOlwiXFx1MjJDMVwiLFwiYmlnd2VkZ2VcIjpcIlxcdTIyQzBcIixcImJrYXJvd1wiOlwiXFx1MjkwRFwiLFwiYmxhY2tsb3plbmdlXCI6XCJcXHUyOUVCXCIsXCJibGFja3NxdWFyZVwiOlwiXFx1MjVBQVwiLFwiYmxhY2t0cmlhbmdsZVwiOlwiXFx1MjVCNFwiLFwiYmxhY2t0cmlhbmdsZWRvd25cIjpcIlxcdTI1QkVcIixcImJsYWNrdHJpYW5nbGVsZWZ0XCI6XCJcXHUyNUMyXCIsXCJibGFja3RyaWFuZ2xlcmlnaHRcIjpcIlxcdTI1QjhcIixcImJsYW5rXCI6XCJcXHUyNDIzXCIsXCJibGsxMlwiOlwiXFx1MjU5MlwiLFwiYmxrMTRcIjpcIlxcdTI1OTFcIixcImJsazM0XCI6XCJcXHUyNTkzXCIsXCJibG9ja1wiOlwiXFx1MjU4OFwiLFwiYm5lXCI6XCI9XFx1MjBFNVwiLFwiYm5lcXVpdlwiOlwiXFx1MjI2MVxcdTIwRTVcIixcImJOb3RcIjpcIlxcdTJBRURcIixcImJub3RcIjpcIlxcdTIzMTBcIixcIkJvcGZcIjpcIlxcdUQ4MzVcXHVERDM5XCIsXCJib3BmXCI6XCJcXHVEODM1XFx1REQ1M1wiLFwiYm90XCI6XCJcXHUyMkE1XCIsXCJib3R0b21cIjpcIlxcdTIyQTVcIixcImJvd3RpZVwiOlwiXFx1MjJDOFwiLFwiYm94Ym94XCI6XCJcXHUyOUM5XCIsXCJib3hkbFwiOlwiXFx1MjUxMFwiLFwiYm94ZExcIjpcIlxcdTI1NTVcIixcImJveERsXCI6XCJcXHUyNTU2XCIsXCJib3hETFwiOlwiXFx1MjU1N1wiLFwiYm94ZHJcIjpcIlxcdTI1MENcIixcImJveGRSXCI6XCJcXHUyNTUyXCIsXCJib3hEclwiOlwiXFx1MjU1M1wiLFwiYm94RFJcIjpcIlxcdTI1NTRcIixcImJveGhcIjpcIlxcdTI1MDBcIixcImJveEhcIjpcIlxcdTI1NTBcIixcImJveGhkXCI6XCJcXHUyNTJDXCIsXCJib3hIZFwiOlwiXFx1MjU2NFwiLFwiYm94aERcIjpcIlxcdTI1NjVcIixcImJveEhEXCI6XCJcXHUyNTY2XCIsXCJib3hodVwiOlwiXFx1MjUzNFwiLFwiYm94SHVcIjpcIlxcdTI1NjdcIixcImJveGhVXCI6XCJcXHUyNTY4XCIsXCJib3hIVVwiOlwiXFx1MjU2OVwiLFwiYm94bWludXNcIjpcIlxcdTIyOUZcIixcImJveHBsdXNcIjpcIlxcdTIyOUVcIixcImJveHRpbWVzXCI6XCJcXHUyMkEwXCIsXCJib3h1bFwiOlwiXFx1MjUxOFwiLFwiYm94dUxcIjpcIlxcdTI1NUJcIixcImJveFVsXCI6XCJcXHUyNTVDXCIsXCJib3hVTFwiOlwiXFx1MjU1RFwiLFwiYm94dXJcIjpcIlxcdTI1MTRcIixcImJveHVSXCI6XCJcXHUyNTU4XCIsXCJib3hVclwiOlwiXFx1MjU1OVwiLFwiYm94VVJcIjpcIlxcdTI1NUFcIixcImJveHZcIjpcIlxcdTI1MDJcIixcImJveFZcIjpcIlxcdTI1NTFcIixcImJveHZoXCI6XCJcXHUyNTNDXCIsXCJib3h2SFwiOlwiXFx1MjU2QVwiLFwiYm94VmhcIjpcIlxcdTI1NkJcIixcImJveFZIXCI6XCJcXHUyNTZDXCIsXCJib3h2bFwiOlwiXFx1MjUyNFwiLFwiYm94dkxcIjpcIlxcdTI1NjFcIixcImJveFZsXCI6XCJcXHUyNTYyXCIsXCJib3hWTFwiOlwiXFx1MjU2M1wiLFwiYm94dnJcIjpcIlxcdTI1MUNcIixcImJveHZSXCI6XCJcXHUyNTVFXCIsXCJib3hWclwiOlwiXFx1MjU1RlwiLFwiYm94VlJcIjpcIlxcdTI1NjBcIixcImJwcmltZVwiOlwiXFx1MjAzNVwiLFwiYnJldmVcIjpcIlxcdTAyRDhcIixcIkJyZXZlXCI6XCJcXHUwMkQ4XCIsXCJicnZiYXJcIjpcIlxcdTAwQTZcIixcImJzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I3XCIsXCJCc2NyXCI6XCJcXHUyMTJDXCIsXCJic2VtaVwiOlwiXFx1MjA0RlwiLFwiYnNpbVwiOlwiXFx1MjIzRFwiLFwiYnNpbWVcIjpcIlxcdTIyQ0RcIixcImJzb2xiXCI6XCJcXHUyOUM1XCIsXCJic29sXCI6XCJcXFxcXCIsXCJic29saHN1YlwiOlwiXFx1MjdDOFwiLFwiYnVsbFwiOlwiXFx1MjAyMlwiLFwiYnVsbGV0XCI6XCJcXHUyMDIyXCIsXCJidW1wXCI6XCJcXHUyMjRFXCIsXCJidW1wRVwiOlwiXFx1MkFBRVwiLFwiYnVtcGVcIjpcIlxcdTIyNEZcIixcIkJ1bXBlcVwiOlwiXFx1MjI0RVwiLFwiYnVtcGVxXCI6XCJcXHUyMjRGXCIsXCJDYWN1dGVcIjpcIlxcdTAxMDZcIixcImNhY3V0ZVwiOlwiXFx1MDEwN1wiLFwiY2FwYW5kXCI6XCJcXHUyQTQ0XCIsXCJjYXBicmN1cFwiOlwiXFx1MkE0OVwiLFwiY2FwY2FwXCI6XCJcXHUyQTRCXCIsXCJjYXBcIjpcIlxcdTIyMjlcIixcIkNhcFwiOlwiXFx1MjJEMlwiLFwiY2FwY3VwXCI6XCJcXHUyQTQ3XCIsXCJjYXBkb3RcIjpcIlxcdTJBNDBcIixcIkNhcGl0YWxEaWZmZXJlbnRpYWxEXCI6XCJcXHUyMTQ1XCIsXCJjYXBzXCI6XCJcXHUyMjI5XFx1RkUwMFwiLFwiY2FyZXRcIjpcIlxcdTIwNDFcIixcImNhcm9uXCI6XCJcXHUwMkM3XCIsXCJDYXlsZXlzXCI6XCJcXHUyMTJEXCIsXCJjY2Fwc1wiOlwiXFx1MkE0RFwiLFwiQ2Nhcm9uXCI6XCJcXHUwMTBDXCIsXCJjY2Fyb25cIjpcIlxcdTAxMERcIixcIkNjZWRpbFwiOlwiXFx1MDBDN1wiLFwiY2NlZGlsXCI6XCJcXHUwMEU3XCIsXCJDY2lyY1wiOlwiXFx1MDEwOFwiLFwiY2NpcmNcIjpcIlxcdTAxMDlcIixcIkNjb25pbnRcIjpcIlxcdTIyMzBcIixcImNjdXBzXCI6XCJcXHUyQTRDXCIsXCJjY3Vwc3NtXCI6XCJcXHUyQTUwXCIsXCJDZG90XCI6XCJcXHUwMTBBXCIsXCJjZG90XCI6XCJcXHUwMTBCXCIsXCJjZWRpbFwiOlwiXFx1MDBCOFwiLFwiQ2VkaWxsYVwiOlwiXFx1MDBCOFwiLFwiY2VtcHR5dlwiOlwiXFx1MjlCMlwiLFwiY2VudFwiOlwiXFx1MDBBMlwiLFwiY2VudGVyZG90XCI6XCJcXHUwMEI3XCIsXCJDZW50ZXJEb3RcIjpcIlxcdTAwQjdcIixcImNmclwiOlwiXFx1RDgzNVxcdUREMjBcIixcIkNmclwiOlwiXFx1MjEyRFwiLFwiQ0hjeVwiOlwiXFx1MDQyN1wiLFwiY2hjeVwiOlwiXFx1MDQ0N1wiLFwiY2hlY2tcIjpcIlxcdTI3MTNcIixcImNoZWNrbWFya1wiOlwiXFx1MjcxM1wiLFwiQ2hpXCI6XCJcXHUwM0E3XCIsXCJjaGlcIjpcIlxcdTAzQzdcIixcImNpcmNcIjpcIlxcdTAyQzZcIixcImNpcmNlcVwiOlwiXFx1MjI1N1wiLFwiY2lyY2xlYXJyb3dsZWZ0XCI6XCJcXHUyMUJBXCIsXCJjaXJjbGVhcnJvd3JpZ2h0XCI6XCJcXHUyMUJCXCIsXCJjaXJjbGVkYXN0XCI6XCJcXHUyMjlCXCIsXCJjaXJjbGVkY2lyY1wiOlwiXFx1MjI5QVwiLFwiY2lyY2xlZGRhc2hcIjpcIlxcdTIyOURcIixcIkNpcmNsZURvdFwiOlwiXFx1MjI5OVwiLFwiY2lyY2xlZFJcIjpcIlxcdTAwQUVcIixcImNpcmNsZWRTXCI6XCJcXHUyNEM4XCIsXCJDaXJjbGVNaW51c1wiOlwiXFx1MjI5NlwiLFwiQ2lyY2xlUGx1c1wiOlwiXFx1MjI5NVwiLFwiQ2lyY2xlVGltZXNcIjpcIlxcdTIyOTdcIixcImNpclwiOlwiXFx1MjVDQlwiLFwiY2lyRVwiOlwiXFx1MjlDM1wiLFwiY2lyZVwiOlwiXFx1MjI1N1wiLFwiY2lyZm5pbnRcIjpcIlxcdTJBMTBcIixcImNpcm1pZFwiOlwiXFx1MkFFRlwiLFwiY2lyc2NpclwiOlwiXFx1MjlDMlwiLFwiQ2xvY2t3aXNlQ29udG91ckludGVncmFsXCI6XCJcXHUyMjMyXCIsXCJDbG9zZUN1cmx5RG91YmxlUXVvdGVcIjpcIlxcdTIwMURcIixcIkNsb3NlQ3VybHlRdW90ZVwiOlwiXFx1MjAxOVwiLFwiY2x1YnNcIjpcIlxcdTI2NjNcIixcImNsdWJzdWl0XCI6XCJcXHUyNjYzXCIsXCJjb2xvblwiOlwiOlwiLFwiQ29sb25cIjpcIlxcdTIyMzdcIixcIkNvbG9uZVwiOlwiXFx1MkE3NFwiLFwiY29sb25lXCI6XCJcXHUyMjU0XCIsXCJjb2xvbmVxXCI6XCJcXHUyMjU0XCIsXCJjb21tYVwiOlwiLFwiLFwiY29tbWF0XCI6XCJAXCIsXCJjb21wXCI6XCJcXHUyMjAxXCIsXCJjb21wZm5cIjpcIlxcdTIyMThcIixcImNvbXBsZW1lbnRcIjpcIlxcdTIyMDFcIixcImNvbXBsZXhlc1wiOlwiXFx1MjEwMlwiLFwiY29uZ1wiOlwiXFx1MjI0NVwiLFwiY29uZ2RvdFwiOlwiXFx1MkE2RFwiLFwiQ29uZ3J1ZW50XCI6XCJcXHUyMjYxXCIsXCJjb25pbnRcIjpcIlxcdTIyMkVcIixcIkNvbmludFwiOlwiXFx1MjIyRlwiLFwiQ29udG91ckludGVncmFsXCI6XCJcXHUyMjJFXCIsXCJjb3BmXCI6XCJcXHVEODM1XFx1REQ1NFwiLFwiQ29wZlwiOlwiXFx1MjEwMlwiLFwiY29wcm9kXCI6XCJcXHUyMjEwXCIsXCJDb3Byb2R1Y3RcIjpcIlxcdTIyMTBcIixcImNvcHlcIjpcIlxcdTAwQTlcIixcIkNPUFlcIjpcIlxcdTAwQTlcIixcImNvcHlzclwiOlwiXFx1MjExN1wiLFwiQ291bnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbFwiOlwiXFx1MjIzM1wiLFwiY3JhcnJcIjpcIlxcdTIxQjVcIixcImNyb3NzXCI6XCJcXHUyNzE3XCIsXCJDcm9zc1wiOlwiXFx1MkEyRlwiLFwiQ3NjclwiOlwiXFx1RDgzNVxcdURDOUVcIixcImNzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I4XCIsXCJjc3ViXCI6XCJcXHUyQUNGXCIsXCJjc3ViZVwiOlwiXFx1MkFEMVwiLFwiY3N1cFwiOlwiXFx1MkFEMFwiLFwiY3N1cGVcIjpcIlxcdTJBRDJcIixcImN0ZG90XCI6XCJcXHUyMkVGXCIsXCJjdWRhcnJsXCI6XCJcXHUyOTM4XCIsXCJjdWRhcnJyXCI6XCJcXHUyOTM1XCIsXCJjdWVwclwiOlwiXFx1MjJERVwiLFwiY3Vlc2NcIjpcIlxcdTIyREZcIixcImN1bGFyclwiOlwiXFx1MjFCNlwiLFwiY3VsYXJycFwiOlwiXFx1MjkzRFwiLFwiY3VwYnJjYXBcIjpcIlxcdTJBNDhcIixcImN1cGNhcFwiOlwiXFx1MkE0NlwiLFwiQ3VwQ2FwXCI6XCJcXHUyMjREXCIsXCJjdXBcIjpcIlxcdTIyMkFcIixcIkN1cFwiOlwiXFx1MjJEM1wiLFwiY3VwY3VwXCI6XCJcXHUyQTRBXCIsXCJjdXBkb3RcIjpcIlxcdTIyOERcIixcImN1cG9yXCI6XCJcXHUyQTQ1XCIsXCJjdXBzXCI6XCJcXHUyMjJBXFx1RkUwMFwiLFwiY3VyYXJyXCI6XCJcXHUyMUI3XCIsXCJjdXJhcnJtXCI6XCJcXHUyOTNDXCIsXCJjdXJseWVxcHJlY1wiOlwiXFx1MjJERVwiLFwiY3VybHllcXN1Y2NcIjpcIlxcdTIyREZcIixcImN1cmx5dmVlXCI6XCJcXHUyMkNFXCIsXCJjdXJseXdlZGdlXCI6XCJcXHUyMkNGXCIsXCJjdXJyZW5cIjpcIlxcdTAwQTRcIixcImN1cnZlYXJyb3dsZWZ0XCI6XCJcXHUyMUI2XCIsXCJjdXJ2ZWFycm93cmlnaHRcIjpcIlxcdTIxQjdcIixcImN1dmVlXCI6XCJcXHUyMkNFXCIsXCJjdXdlZFwiOlwiXFx1MjJDRlwiLFwiY3djb25pbnRcIjpcIlxcdTIyMzJcIixcImN3aW50XCI6XCJcXHUyMjMxXCIsXCJjeWxjdHlcIjpcIlxcdTIzMkRcIixcImRhZ2dlclwiOlwiXFx1MjAyMFwiLFwiRGFnZ2VyXCI6XCJcXHUyMDIxXCIsXCJkYWxldGhcIjpcIlxcdTIxMzhcIixcImRhcnJcIjpcIlxcdTIxOTNcIixcIkRhcnJcIjpcIlxcdTIxQTFcIixcImRBcnJcIjpcIlxcdTIxRDNcIixcImRhc2hcIjpcIlxcdTIwMTBcIixcIkRhc2h2XCI6XCJcXHUyQUU0XCIsXCJkYXNodlwiOlwiXFx1MjJBM1wiLFwiZGJrYXJvd1wiOlwiXFx1MjkwRlwiLFwiZGJsYWNcIjpcIlxcdTAyRERcIixcIkRjYXJvblwiOlwiXFx1MDEwRVwiLFwiZGNhcm9uXCI6XCJcXHUwMTBGXCIsXCJEY3lcIjpcIlxcdTA0MTRcIixcImRjeVwiOlwiXFx1MDQzNFwiLFwiZGRhZ2dlclwiOlwiXFx1MjAyMVwiLFwiZGRhcnJcIjpcIlxcdTIxQ0FcIixcIkREXCI6XCJcXHUyMTQ1XCIsXCJkZFwiOlwiXFx1MjE0NlwiLFwiRERvdHJhaGRcIjpcIlxcdTI5MTFcIixcImRkb3RzZXFcIjpcIlxcdTJBNzdcIixcImRlZ1wiOlwiXFx1MDBCMFwiLFwiRGVsXCI6XCJcXHUyMjA3XCIsXCJEZWx0YVwiOlwiXFx1MDM5NFwiLFwiZGVsdGFcIjpcIlxcdTAzQjRcIixcImRlbXB0eXZcIjpcIlxcdTI5QjFcIixcImRmaXNodFwiOlwiXFx1Mjk3RlwiLFwiRGZyXCI6XCJcXHVEODM1XFx1REQwN1wiLFwiZGZyXCI6XCJcXHVEODM1XFx1REQyMVwiLFwiZEhhclwiOlwiXFx1Mjk2NVwiLFwiZGhhcmxcIjpcIlxcdTIxQzNcIixcImRoYXJyXCI6XCJcXHUyMUMyXCIsXCJEaWFjcml0aWNhbEFjdXRlXCI6XCJcXHUwMEI0XCIsXCJEaWFjcml0aWNhbERvdFwiOlwiXFx1MDJEOVwiLFwiRGlhY3JpdGljYWxEb3VibGVBY3V0ZVwiOlwiXFx1MDJERFwiLFwiRGlhY3JpdGljYWxHcmF2ZVwiOlwiYFwiLFwiRGlhY3JpdGljYWxUaWxkZVwiOlwiXFx1MDJEQ1wiLFwiZGlhbVwiOlwiXFx1MjJDNFwiLFwiZGlhbW9uZFwiOlwiXFx1MjJDNFwiLFwiRGlhbW9uZFwiOlwiXFx1MjJDNFwiLFwiZGlhbW9uZHN1aXRcIjpcIlxcdTI2NjZcIixcImRpYW1zXCI6XCJcXHUyNjY2XCIsXCJkaWVcIjpcIlxcdTAwQThcIixcIkRpZmZlcmVudGlhbERcIjpcIlxcdTIxNDZcIixcImRpZ2FtbWFcIjpcIlxcdTAzRERcIixcImRpc2luXCI6XCJcXHUyMkYyXCIsXCJkaXZcIjpcIlxcdTAwRjdcIixcImRpdmlkZVwiOlwiXFx1MDBGN1wiLFwiZGl2aWRlb250aW1lc1wiOlwiXFx1MjJDN1wiLFwiZGl2b254XCI6XCJcXHUyMkM3XCIsXCJESmN5XCI6XCJcXHUwNDAyXCIsXCJkamN5XCI6XCJcXHUwNDUyXCIsXCJkbGNvcm5cIjpcIlxcdTIzMUVcIixcImRsY3JvcFwiOlwiXFx1MjMwRFwiLFwiZG9sbGFyXCI6XCIkXCIsXCJEb3BmXCI6XCJcXHVEODM1XFx1REQzQlwiLFwiZG9wZlwiOlwiXFx1RDgzNVxcdURENTVcIixcIkRvdFwiOlwiXFx1MDBBOFwiLFwiZG90XCI6XCJcXHUwMkQ5XCIsXCJEb3REb3RcIjpcIlxcdTIwRENcIixcImRvdGVxXCI6XCJcXHUyMjUwXCIsXCJkb3RlcWRvdFwiOlwiXFx1MjI1MVwiLFwiRG90RXF1YWxcIjpcIlxcdTIyNTBcIixcImRvdG1pbnVzXCI6XCJcXHUyMjM4XCIsXCJkb3RwbHVzXCI6XCJcXHUyMjE0XCIsXCJkb3RzcXVhcmVcIjpcIlxcdTIyQTFcIixcImRvdWJsZWJhcndlZGdlXCI6XCJcXHUyMzA2XCIsXCJEb3VibGVDb250b3VySW50ZWdyYWxcIjpcIlxcdTIyMkZcIixcIkRvdWJsZURvdFwiOlwiXFx1MDBBOFwiLFwiRG91YmxlRG93bkFycm93XCI6XCJcXHUyMUQzXCIsXCJEb3VibGVMZWZ0QXJyb3dcIjpcIlxcdTIxRDBcIixcIkRvdWJsZUxlZnRSaWdodEFycm93XCI6XCJcXHUyMUQ0XCIsXCJEb3VibGVMZWZ0VGVlXCI6XCJcXHUyQUU0XCIsXCJEb3VibGVMb25nTGVmdEFycm93XCI6XCJcXHUyN0Y4XCIsXCJEb3VibGVMb25nTGVmdFJpZ2h0QXJyb3dcIjpcIlxcdTI3RkFcIixcIkRvdWJsZUxvbmdSaWdodEFycm93XCI6XCJcXHUyN0Y5XCIsXCJEb3VibGVSaWdodEFycm93XCI6XCJcXHUyMUQyXCIsXCJEb3VibGVSaWdodFRlZVwiOlwiXFx1MjJBOFwiLFwiRG91YmxlVXBBcnJvd1wiOlwiXFx1MjFEMVwiLFwiRG91YmxlVXBEb3duQXJyb3dcIjpcIlxcdTIxRDVcIixcIkRvdWJsZVZlcnRpY2FsQmFyXCI6XCJcXHUyMjI1XCIsXCJEb3duQXJyb3dCYXJcIjpcIlxcdTI5MTNcIixcImRvd25hcnJvd1wiOlwiXFx1MjE5M1wiLFwiRG93bkFycm93XCI6XCJcXHUyMTkzXCIsXCJEb3duYXJyb3dcIjpcIlxcdTIxRDNcIixcIkRvd25BcnJvd1VwQXJyb3dcIjpcIlxcdTIxRjVcIixcIkRvd25CcmV2ZVwiOlwiXFx1MDMxMVwiLFwiZG93bmRvd25hcnJvd3NcIjpcIlxcdTIxQ0FcIixcImRvd25oYXJwb29ubGVmdFwiOlwiXFx1MjFDM1wiLFwiZG93bmhhcnBvb25yaWdodFwiOlwiXFx1MjFDMlwiLFwiRG93bkxlZnRSaWdodFZlY3RvclwiOlwiXFx1Mjk1MFwiLFwiRG93bkxlZnRUZWVWZWN0b3JcIjpcIlxcdTI5NUVcIixcIkRvd25MZWZ0VmVjdG9yQmFyXCI6XCJcXHUyOTU2XCIsXCJEb3duTGVmdFZlY3RvclwiOlwiXFx1MjFCRFwiLFwiRG93blJpZ2h0VGVlVmVjdG9yXCI6XCJcXHUyOTVGXCIsXCJEb3duUmlnaHRWZWN0b3JCYXJcIjpcIlxcdTI5NTdcIixcIkRvd25SaWdodFZlY3RvclwiOlwiXFx1MjFDMVwiLFwiRG93blRlZUFycm93XCI6XCJcXHUyMUE3XCIsXCJEb3duVGVlXCI6XCJcXHUyMkE0XCIsXCJkcmJrYXJvd1wiOlwiXFx1MjkxMFwiLFwiZHJjb3JuXCI6XCJcXHUyMzFGXCIsXCJkcmNyb3BcIjpcIlxcdTIzMENcIixcIkRzY3JcIjpcIlxcdUQ4MzVcXHVEQzlGXCIsXCJkc2NyXCI6XCJcXHVEODM1XFx1RENCOVwiLFwiRFNjeVwiOlwiXFx1MDQwNVwiLFwiZHNjeVwiOlwiXFx1MDQ1NVwiLFwiZHNvbFwiOlwiXFx1MjlGNlwiLFwiRHN0cm9rXCI6XCJcXHUwMTEwXCIsXCJkc3Ryb2tcIjpcIlxcdTAxMTFcIixcImR0ZG90XCI6XCJcXHUyMkYxXCIsXCJkdHJpXCI6XCJcXHUyNUJGXCIsXCJkdHJpZlwiOlwiXFx1MjVCRVwiLFwiZHVhcnJcIjpcIlxcdTIxRjVcIixcImR1aGFyXCI6XCJcXHUyOTZGXCIsXCJkd2FuZ2xlXCI6XCJcXHUyOUE2XCIsXCJEWmN5XCI6XCJcXHUwNDBGXCIsXCJkemN5XCI6XCJcXHUwNDVGXCIsXCJkemlncmFyclwiOlwiXFx1MjdGRlwiLFwiRWFjdXRlXCI6XCJcXHUwMEM5XCIsXCJlYWN1dGVcIjpcIlxcdTAwRTlcIixcImVhc3RlclwiOlwiXFx1MkE2RVwiLFwiRWNhcm9uXCI6XCJcXHUwMTFBXCIsXCJlY2Fyb25cIjpcIlxcdTAxMUJcIixcIkVjaXJjXCI6XCJcXHUwMENBXCIsXCJlY2lyY1wiOlwiXFx1MDBFQVwiLFwiZWNpclwiOlwiXFx1MjI1NlwiLFwiZWNvbG9uXCI6XCJcXHUyMjU1XCIsXCJFY3lcIjpcIlxcdTA0MkRcIixcImVjeVwiOlwiXFx1MDQ0RFwiLFwiZUREb3RcIjpcIlxcdTJBNzdcIixcIkVkb3RcIjpcIlxcdTAxMTZcIixcImVkb3RcIjpcIlxcdTAxMTdcIixcImVEb3RcIjpcIlxcdTIyNTFcIixcImVlXCI6XCJcXHUyMTQ3XCIsXCJlZkRvdFwiOlwiXFx1MjI1MlwiLFwiRWZyXCI6XCJcXHVEODM1XFx1REQwOFwiLFwiZWZyXCI6XCJcXHVEODM1XFx1REQyMlwiLFwiZWdcIjpcIlxcdTJBOUFcIixcIkVncmF2ZVwiOlwiXFx1MDBDOFwiLFwiZWdyYXZlXCI6XCJcXHUwMEU4XCIsXCJlZ3NcIjpcIlxcdTJBOTZcIixcImVnc2RvdFwiOlwiXFx1MkE5OFwiLFwiZWxcIjpcIlxcdTJBOTlcIixcIkVsZW1lbnRcIjpcIlxcdTIyMDhcIixcImVsaW50ZXJzXCI6XCJcXHUyM0U3XCIsXCJlbGxcIjpcIlxcdTIxMTNcIixcImVsc1wiOlwiXFx1MkE5NVwiLFwiZWxzZG90XCI6XCJcXHUyQTk3XCIsXCJFbWFjclwiOlwiXFx1MDExMlwiLFwiZW1hY3JcIjpcIlxcdTAxMTNcIixcImVtcHR5XCI6XCJcXHUyMjA1XCIsXCJlbXB0eXNldFwiOlwiXFx1MjIwNVwiLFwiRW1wdHlTbWFsbFNxdWFyZVwiOlwiXFx1MjVGQlwiLFwiZW1wdHl2XCI6XCJcXHUyMjA1XCIsXCJFbXB0eVZlcnlTbWFsbFNxdWFyZVwiOlwiXFx1MjVBQlwiLFwiZW1zcDEzXCI6XCJcXHUyMDA0XCIsXCJlbXNwMTRcIjpcIlxcdTIwMDVcIixcImVtc3BcIjpcIlxcdTIwMDNcIixcIkVOR1wiOlwiXFx1MDE0QVwiLFwiZW5nXCI6XCJcXHUwMTRCXCIsXCJlbnNwXCI6XCJcXHUyMDAyXCIsXCJFb2dvblwiOlwiXFx1MDExOFwiLFwiZW9nb25cIjpcIlxcdTAxMTlcIixcIkVvcGZcIjpcIlxcdUQ4MzVcXHVERDNDXCIsXCJlb3BmXCI6XCJcXHVEODM1XFx1REQ1NlwiLFwiZXBhclwiOlwiXFx1MjJENVwiLFwiZXBhcnNsXCI6XCJcXHUyOUUzXCIsXCJlcGx1c1wiOlwiXFx1MkE3MVwiLFwiZXBzaVwiOlwiXFx1MDNCNVwiLFwiRXBzaWxvblwiOlwiXFx1MDM5NVwiLFwiZXBzaWxvblwiOlwiXFx1MDNCNVwiLFwiZXBzaXZcIjpcIlxcdTAzRjVcIixcImVxY2lyY1wiOlwiXFx1MjI1NlwiLFwiZXFjb2xvblwiOlwiXFx1MjI1NVwiLFwiZXFzaW1cIjpcIlxcdTIyNDJcIixcImVxc2xhbnRndHJcIjpcIlxcdTJBOTZcIixcImVxc2xhbnRsZXNzXCI6XCJcXHUyQTk1XCIsXCJFcXVhbFwiOlwiXFx1MkE3NVwiLFwiZXF1YWxzXCI6XCI9XCIsXCJFcXVhbFRpbGRlXCI6XCJcXHUyMjQyXCIsXCJlcXVlc3RcIjpcIlxcdTIyNUZcIixcIkVxdWlsaWJyaXVtXCI6XCJcXHUyMUNDXCIsXCJlcXVpdlwiOlwiXFx1MjI2MVwiLFwiZXF1aXZERFwiOlwiXFx1MkE3OFwiLFwiZXF2cGFyc2xcIjpcIlxcdTI5RTVcIixcImVyYXJyXCI6XCJcXHUyOTcxXCIsXCJlckRvdFwiOlwiXFx1MjI1M1wiLFwiZXNjclwiOlwiXFx1MjEyRlwiLFwiRXNjclwiOlwiXFx1MjEzMFwiLFwiZXNkb3RcIjpcIlxcdTIyNTBcIixcIkVzaW1cIjpcIlxcdTJBNzNcIixcImVzaW1cIjpcIlxcdTIyNDJcIixcIkV0YVwiOlwiXFx1MDM5N1wiLFwiZXRhXCI6XCJcXHUwM0I3XCIsXCJFVEhcIjpcIlxcdTAwRDBcIixcImV0aFwiOlwiXFx1MDBGMFwiLFwiRXVtbFwiOlwiXFx1MDBDQlwiLFwiZXVtbFwiOlwiXFx1MDBFQlwiLFwiZXVyb1wiOlwiXFx1MjBBQ1wiLFwiZXhjbFwiOlwiIVwiLFwiZXhpc3RcIjpcIlxcdTIyMDNcIixcIkV4aXN0c1wiOlwiXFx1MjIwM1wiLFwiZXhwZWN0YXRpb25cIjpcIlxcdTIxMzBcIixcImV4cG9uZW50aWFsZVwiOlwiXFx1MjE0N1wiLFwiRXhwb25lbnRpYWxFXCI6XCJcXHUyMTQ3XCIsXCJmYWxsaW5nZG90c2VxXCI6XCJcXHUyMjUyXCIsXCJGY3lcIjpcIlxcdTA0MjRcIixcImZjeVwiOlwiXFx1MDQ0NFwiLFwiZmVtYWxlXCI6XCJcXHUyNjQwXCIsXCJmZmlsaWdcIjpcIlxcdUZCMDNcIixcImZmbGlnXCI6XCJcXHVGQjAwXCIsXCJmZmxsaWdcIjpcIlxcdUZCMDRcIixcIkZmclwiOlwiXFx1RDgzNVxcdUREMDlcIixcImZmclwiOlwiXFx1RDgzNVxcdUREMjNcIixcImZpbGlnXCI6XCJcXHVGQjAxXCIsXCJGaWxsZWRTbWFsbFNxdWFyZVwiOlwiXFx1MjVGQ1wiLFwiRmlsbGVkVmVyeVNtYWxsU3F1YXJlXCI6XCJcXHUyNUFBXCIsXCJmamxpZ1wiOlwiZmpcIixcImZsYXRcIjpcIlxcdTI2NkRcIixcImZsbGlnXCI6XCJcXHVGQjAyXCIsXCJmbHRuc1wiOlwiXFx1MjVCMVwiLFwiZm5vZlwiOlwiXFx1MDE5MlwiLFwiRm9wZlwiOlwiXFx1RDgzNVxcdUREM0RcIixcImZvcGZcIjpcIlxcdUQ4MzVcXHVERDU3XCIsXCJmb3JhbGxcIjpcIlxcdTIyMDBcIixcIkZvckFsbFwiOlwiXFx1MjIwMFwiLFwiZm9ya1wiOlwiXFx1MjJENFwiLFwiZm9ya3ZcIjpcIlxcdTJBRDlcIixcIkZvdXJpZXJ0cmZcIjpcIlxcdTIxMzFcIixcImZwYXJ0aW50XCI6XCJcXHUyQTBEXCIsXCJmcmFjMTJcIjpcIlxcdTAwQkRcIixcImZyYWMxM1wiOlwiXFx1MjE1M1wiLFwiZnJhYzE0XCI6XCJcXHUwMEJDXCIsXCJmcmFjMTVcIjpcIlxcdTIxNTVcIixcImZyYWMxNlwiOlwiXFx1MjE1OVwiLFwiZnJhYzE4XCI6XCJcXHUyMTVCXCIsXCJmcmFjMjNcIjpcIlxcdTIxNTRcIixcImZyYWMyNVwiOlwiXFx1MjE1NlwiLFwiZnJhYzM0XCI6XCJcXHUwMEJFXCIsXCJmcmFjMzVcIjpcIlxcdTIxNTdcIixcImZyYWMzOFwiOlwiXFx1MjE1Q1wiLFwiZnJhYzQ1XCI6XCJcXHUyMTU4XCIsXCJmcmFjNTZcIjpcIlxcdTIxNUFcIixcImZyYWM1OFwiOlwiXFx1MjE1RFwiLFwiZnJhYzc4XCI6XCJcXHUyMTVFXCIsXCJmcmFzbFwiOlwiXFx1MjA0NFwiLFwiZnJvd25cIjpcIlxcdTIzMjJcIixcImZzY3JcIjpcIlxcdUQ4MzVcXHVEQ0JCXCIsXCJGc2NyXCI6XCJcXHUyMTMxXCIsXCJnYWN1dGVcIjpcIlxcdTAxRjVcIixcIkdhbW1hXCI6XCJcXHUwMzkzXCIsXCJnYW1tYVwiOlwiXFx1MDNCM1wiLFwiR2FtbWFkXCI6XCJcXHUwM0RDXCIsXCJnYW1tYWRcIjpcIlxcdTAzRERcIixcImdhcFwiOlwiXFx1MkE4NlwiLFwiR2JyZXZlXCI6XCJcXHUwMTFFXCIsXCJnYnJldmVcIjpcIlxcdTAxMUZcIixcIkdjZWRpbFwiOlwiXFx1MDEyMlwiLFwiR2NpcmNcIjpcIlxcdTAxMUNcIixcImdjaXJjXCI6XCJcXHUwMTFEXCIsXCJHY3lcIjpcIlxcdTA0MTNcIixcImdjeVwiOlwiXFx1MDQzM1wiLFwiR2RvdFwiOlwiXFx1MDEyMFwiLFwiZ2RvdFwiOlwiXFx1MDEyMVwiLFwiZ2VcIjpcIlxcdTIyNjVcIixcImdFXCI6XCJcXHUyMjY3XCIsXCJnRWxcIjpcIlxcdTJBOENcIixcImdlbFwiOlwiXFx1MjJEQlwiLFwiZ2VxXCI6XCJcXHUyMjY1XCIsXCJnZXFxXCI6XCJcXHUyMjY3XCIsXCJnZXFzbGFudFwiOlwiXFx1MkE3RVwiLFwiZ2VzY2NcIjpcIlxcdTJBQTlcIixcImdlc1wiOlwiXFx1MkE3RVwiLFwiZ2VzZG90XCI6XCJcXHUyQTgwXCIsXCJnZXNkb3RvXCI6XCJcXHUyQTgyXCIsXCJnZXNkb3RvbFwiOlwiXFx1MkE4NFwiLFwiZ2VzbFwiOlwiXFx1MjJEQlxcdUZFMDBcIixcImdlc2xlc1wiOlwiXFx1MkE5NFwiLFwiR2ZyXCI6XCJcXHVEODM1XFx1REQwQVwiLFwiZ2ZyXCI6XCJcXHVEODM1XFx1REQyNFwiLFwiZ2dcIjpcIlxcdTIyNkJcIixcIkdnXCI6XCJcXHUyMkQ5XCIsXCJnZ2dcIjpcIlxcdTIyRDlcIixcImdpbWVsXCI6XCJcXHUyMTM3XCIsXCJHSmN5XCI6XCJcXHUwNDAzXCIsXCJnamN5XCI6XCJcXHUwNDUzXCIsXCJnbGFcIjpcIlxcdTJBQTVcIixcImdsXCI6XCJcXHUyMjc3XCIsXCJnbEVcIjpcIlxcdTJBOTJcIixcImdsalwiOlwiXFx1MkFBNFwiLFwiZ25hcFwiOlwiXFx1MkE4QVwiLFwiZ25hcHByb3hcIjpcIlxcdTJBOEFcIixcImduZVwiOlwiXFx1MkE4OFwiLFwiZ25FXCI6XCJcXHUyMjY5XCIsXCJnbmVxXCI6XCJcXHUyQTg4XCIsXCJnbmVxcVwiOlwiXFx1MjI2OVwiLFwiZ25zaW1cIjpcIlxcdTIyRTdcIixcIkdvcGZcIjpcIlxcdUQ4MzVcXHVERDNFXCIsXCJnb3BmXCI6XCJcXHVEODM1XFx1REQ1OFwiLFwiZ3JhdmVcIjpcImBcIixcIkdyZWF0ZXJFcXVhbFwiOlwiXFx1MjI2NVwiLFwiR3JlYXRlckVxdWFsTGVzc1wiOlwiXFx1MjJEQlwiLFwiR3JlYXRlckZ1bGxFcXVhbFwiOlwiXFx1MjI2N1wiLFwiR3JlYXRlckdyZWF0ZXJcIjpcIlxcdTJBQTJcIixcIkdyZWF0ZXJMZXNzXCI6XCJcXHUyMjc3XCIsXCJHcmVhdGVyU2xhbnRFcXVhbFwiOlwiXFx1MkE3RVwiLFwiR3JlYXRlclRpbGRlXCI6XCJcXHUyMjczXCIsXCJHc2NyXCI6XCJcXHVEODM1XFx1RENBMlwiLFwiZ3NjclwiOlwiXFx1MjEwQVwiLFwiZ3NpbVwiOlwiXFx1MjI3M1wiLFwiZ3NpbWVcIjpcIlxcdTJBOEVcIixcImdzaW1sXCI6XCJcXHUyQTkwXCIsXCJndGNjXCI6XCJcXHUyQUE3XCIsXCJndGNpclwiOlwiXFx1MkE3QVwiLFwiZ3RcIjpcIj5cIixcIkdUXCI6XCI+XCIsXCJHdFwiOlwiXFx1MjI2QlwiLFwiZ3Rkb3RcIjpcIlxcdTIyRDdcIixcImd0bFBhclwiOlwiXFx1Mjk5NVwiLFwiZ3RxdWVzdFwiOlwiXFx1MkE3Q1wiLFwiZ3RyYXBwcm94XCI6XCJcXHUyQTg2XCIsXCJndHJhcnJcIjpcIlxcdTI5NzhcIixcImd0cmRvdFwiOlwiXFx1MjJEN1wiLFwiZ3RyZXFsZXNzXCI6XCJcXHUyMkRCXCIsXCJndHJlcXFsZXNzXCI6XCJcXHUyQThDXCIsXCJndHJsZXNzXCI6XCJcXHUyMjc3XCIsXCJndHJzaW1cIjpcIlxcdTIyNzNcIixcImd2ZXJ0bmVxcVwiOlwiXFx1MjI2OVxcdUZFMDBcIixcImd2bkVcIjpcIlxcdTIyNjlcXHVGRTAwXCIsXCJIYWNla1wiOlwiXFx1MDJDN1wiLFwiaGFpcnNwXCI6XCJcXHUyMDBBXCIsXCJoYWxmXCI6XCJcXHUwMEJEXCIsXCJoYW1pbHRcIjpcIlxcdTIxMEJcIixcIkhBUkRjeVwiOlwiXFx1MDQyQVwiLFwiaGFyZGN5XCI6XCJcXHUwNDRBXCIsXCJoYXJyY2lyXCI6XCJcXHUyOTQ4XCIsXCJoYXJyXCI6XCJcXHUyMTk0XCIsXCJoQXJyXCI6XCJcXHUyMUQ0XCIsXCJoYXJyd1wiOlwiXFx1MjFBRFwiLFwiSGF0XCI6XCJeXCIsXCJoYmFyXCI6XCJcXHUyMTBGXCIsXCJIY2lyY1wiOlwiXFx1MDEyNFwiLFwiaGNpcmNcIjpcIlxcdTAxMjVcIixcImhlYXJ0c1wiOlwiXFx1MjY2NVwiLFwiaGVhcnRzdWl0XCI6XCJcXHUyNjY1XCIsXCJoZWxsaXBcIjpcIlxcdTIwMjZcIixcImhlcmNvblwiOlwiXFx1MjJCOVwiLFwiaGZyXCI6XCJcXHVEODM1XFx1REQyNVwiLFwiSGZyXCI6XCJcXHUyMTBDXCIsXCJIaWxiZXJ0U3BhY2VcIjpcIlxcdTIxMEJcIixcImhrc2Vhcm93XCI6XCJcXHUyOTI1XCIsXCJoa3N3YXJvd1wiOlwiXFx1MjkyNlwiLFwiaG9hcnJcIjpcIlxcdTIxRkZcIixcImhvbXRodFwiOlwiXFx1MjIzQlwiLFwiaG9va2xlZnRhcnJvd1wiOlwiXFx1MjFBOVwiLFwiaG9va3JpZ2h0YXJyb3dcIjpcIlxcdTIxQUFcIixcImhvcGZcIjpcIlxcdUQ4MzVcXHVERDU5XCIsXCJIb3BmXCI6XCJcXHUyMTBEXCIsXCJob3JiYXJcIjpcIlxcdTIwMTVcIixcIkhvcml6b250YWxMaW5lXCI6XCJcXHUyNTAwXCIsXCJoc2NyXCI6XCJcXHVEODM1XFx1RENCRFwiLFwiSHNjclwiOlwiXFx1MjEwQlwiLFwiaHNsYXNoXCI6XCJcXHUyMTBGXCIsXCJIc3Ryb2tcIjpcIlxcdTAxMjZcIixcImhzdHJva1wiOlwiXFx1MDEyN1wiLFwiSHVtcERvd25IdW1wXCI6XCJcXHUyMjRFXCIsXCJIdW1wRXF1YWxcIjpcIlxcdTIyNEZcIixcImh5YnVsbFwiOlwiXFx1MjA0M1wiLFwiaHlwaGVuXCI6XCJcXHUyMDEwXCIsXCJJYWN1dGVcIjpcIlxcdTAwQ0RcIixcImlhY3V0ZVwiOlwiXFx1MDBFRFwiLFwiaWNcIjpcIlxcdTIwNjNcIixcIkljaXJjXCI6XCJcXHUwMENFXCIsXCJpY2lyY1wiOlwiXFx1MDBFRVwiLFwiSWN5XCI6XCJcXHUwNDE4XCIsXCJpY3lcIjpcIlxcdTA0MzhcIixcIklkb3RcIjpcIlxcdTAxMzBcIixcIklFY3lcIjpcIlxcdTA0MTVcIixcImllY3lcIjpcIlxcdTA0MzVcIixcImlleGNsXCI6XCJcXHUwMEExXCIsXCJpZmZcIjpcIlxcdTIxRDRcIixcImlmclwiOlwiXFx1RDgzNVxcdUREMjZcIixcIklmclwiOlwiXFx1MjExMVwiLFwiSWdyYXZlXCI6XCJcXHUwMENDXCIsXCJpZ3JhdmVcIjpcIlxcdTAwRUNcIixcImlpXCI6XCJcXHUyMTQ4XCIsXCJpaWlpbnRcIjpcIlxcdTJBMENcIixcImlpaW50XCI6XCJcXHUyMjJEXCIsXCJpaW5maW5cIjpcIlxcdTI5RENcIixcImlpb3RhXCI6XCJcXHUyMTI5XCIsXCJJSmxpZ1wiOlwiXFx1MDEzMlwiLFwiaWpsaWdcIjpcIlxcdTAxMzNcIixcIkltYWNyXCI6XCJcXHUwMTJBXCIsXCJpbWFjclwiOlwiXFx1MDEyQlwiLFwiaW1hZ2VcIjpcIlxcdTIxMTFcIixcIkltYWdpbmFyeUlcIjpcIlxcdTIxNDhcIixcImltYWdsaW5lXCI6XCJcXHUyMTEwXCIsXCJpbWFncGFydFwiOlwiXFx1MjExMVwiLFwiaW1hdGhcIjpcIlxcdTAxMzFcIixcIkltXCI6XCJcXHUyMTExXCIsXCJpbW9mXCI6XCJcXHUyMkI3XCIsXCJpbXBlZFwiOlwiXFx1MDFCNVwiLFwiSW1wbGllc1wiOlwiXFx1MjFEMlwiLFwiaW5jYXJlXCI6XCJcXHUyMTA1XCIsXCJpblwiOlwiXFx1MjIwOFwiLFwiaW5maW5cIjpcIlxcdTIyMUVcIixcImluZmludGllXCI6XCJcXHUyOUREXCIsXCJpbm9kb3RcIjpcIlxcdTAxMzFcIixcImludGNhbFwiOlwiXFx1MjJCQVwiLFwiaW50XCI6XCJcXHUyMjJCXCIsXCJJbnRcIjpcIlxcdTIyMkNcIixcImludGVnZXJzXCI6XCJcXHUyMTI0XCIsXCJJbnRlZ3JhbFwiOlwiXFx1MjIyQlwiLFwiaW50ZXJjYWxcIjpcIlxcdTIyQkFcIixcIkludGVyc2VjdGlvblwiOlwiXFx1MjJDMlwiLFwiaW50bGFyaGtcIjpcIlxcdTJBMTdcIixcImludHByb2RcIjpcIlxcdTJBM0NcIixcIkludmlzaWJsZUNvbW1hXCI6XCJcXHUyMDYzXCIsXCJJbnZpc2libGVUaW1lc1wiOlwiXFx1MjA2MlwiLFwiSU9jeVwiOlwiXFx1MDQwMVwiLFwiaW9jeVwiOlwiXFx1MDQ1MVwiLFwiSW9nb25cIjpcIlxcdTAxMkVcIixcImlvZ29uXCI6XCJcXHUwMTJGXCIsXCJJb3BmXCI6XCJcXHVEODM1XFx1REQ0MFwiLFwiaW9wZlwiOlwiXFx1RDgzNVxcdURENUFcIixcIklvdGFcIjpcIlxcdTAzOTlcIixcImlvdGFcIjpcIlxcdTAzQjlcIixcImlwcm9kXCI6XCJcXHUyQTNDXCIsXCJpcXVlc3RcIjpcIlxcdTAwQkZcIixcImlzY3JcIjpcIlxcdUQ4MzVcXHVEQ0JFXCIsXCJJc2NyXCI6XCJcXHUyMTEwXCIsXCJpc2luXCI6XCJcXHUyMjA4XCIsXCJpc2luZG90XCI6XCJcXHUyMkY1XCIsXCJpc2luRVwiOlwiXFx1MjJGOVwiLFwiaXNpbnNcIjpcIlxcdTIyRjRcIixcImlzaW5zdlwiOlwiXFx1MjJGM1wiLFwiaXNpbnZcIjpcIlxcdTIyMDhcIixcIml0XCI6XCJcXHUyMDYyXCIsXCJJdGlsZGVcIjpcIlxcdTAxMjhcIixcIml0aWxkZVwiOlwiXFx1MDEyOVwiLFwiSXVrY3lcIjpcIlxcdTA0MDZcIixcIml1a2N5XCI6XCJcXHUwNDU2XCIsXCJJdW1sXCI6XCJcXHUwMENGXCIsXCJpdW1sXCI6XCJcXHUwMEVGXCIsXCJKY2lyY1wiOlwiXFx1MDEzNFwiLFwiamNpcmNcIjpcIlxcdTAxMzVcIixcIkpjeVwiOlwiXFx1MDQxOVwiLFwiamN5XCI6XCJcXHUwNDM5XCIsXCJKZnJcIjpcIlxcdUQ4MzVcXHVERDBEXCIsXCJqZnJcIjpcIlxcdUQ4MzVcXHVERDI3XCIsXCJqbWF0aFwiOlwiXFx1MDIzN1wiLFwiSm9wZlwiOlwiXFx1RDgzNVxcdURENDFcIixcImpvcGZcIjpcIlxcdUQ4MzVcXHVERDVCXCIsXCJKc2NyXCI6XCJcXHVEODM1XFx1RENBNVwiLFwianNjclwiOlwiXFx1RDgzNVxcdURDQkZcIixcIkpzZXJjeVwiOlwiXFx1MDQwOFwiLFwianNlcmN5XCI6XCJcXHUwNDU4XCIsXCJKdWtjeVwiOlwiXFx1MDQwNFwiLFwianVrY3lcIjpcIlxcdTA0NTRcIixcIkthcHBhXCI6XCJcXHUwMzlBXCIsXCJrYXBwYVwiOlwiXFx1MDNCQVwiLFwia2FwcGF2XCI6XCJcXHUwM0YwXCIsXCJLY2VkaWxcIjpcIlxcdTAxMzZcIixcImtjZWRpbFwiOlwiXFx1MDEzN1wiLFwiS2N5XCI6XCJcXHUwNDFBXCIsXCJrY3lcIjpcIlxcdTA0M0FcIixcIktmclwiOlwiXFx1RDgzNVxcdUREMEVcIixcImtmclwiOlwiXFx1RDgzNVxcdUREMjhcIixcImtncmVlblwiOlwiXFx1MDEzOFwiLFwiS0hjeVwiOlwiXFx1MDQyNVwiLFwia2hjeVwiOlwiXFx1MDQ0NVwiLFwiS0pjeVwiOlwiXFx1MDQwQ1wiLFwia2pjeVwiOlwiXFx1MDQ1Q1wiLFwiS29wZlwiOlwiXFx1RDgzNVxcdURENDJcIixcImtvcGZcIjpcIlxcdUQ4MzVcXHVERDVDXCIsXCJLc2NyXCI6XCJcXHVEODM1XFx1RENBNlwiLFwia3NjclwiOlwiXFx1RDgzNVxcdURDQzBcIixcImxBYXJyXCI6XCJcXHUyMURBXCIsXCJMYWN1dGVcIjpcIlxcdTAxMzlcIixcImxhY3V0ZVwiOlwiXFx1MDEzQVwiLFwibGFlbXB0eXZcIjpcIlxcdTI5QjRcIixcImxhZ3JhblwiOlwiXFx1MjExMlwiLFwiTGFtYmRhXCI6XCJcXHUwMzlCXCIsXCJsYW1iZGFcIjpcIlxcdTAzQkJcIixcImxhbmdcIjpcIlxcdTI3RThcIixcIkxhbmdcIjpcIlxcdTI3RUFcIixcImxhbmdkXCI6XCJcXHUyOTkxXCIsXCJsYW5nbGVcIjpcIlxcdTI3RThcIixcImxhcFwiOlwiXFx1MkE4NVwiLFwiTGFwbGFjZXRyZlwiOlwiXFx1MjExMlwiLFwibGFxdW9cIjpcIlxcdTAwQUJcIixcImxhcnJiXCI6XCJcXHUyMUU0XCIsXCJsYXJyYmZzXCI6XCJcXHUyOTFGXCIsXCJsYXJyXCI6XCJcXHUyMTkwXCIsXCJMYXJyXCI6XCJcXHUyMTlFXCIsXCJsQXJyXCI6XCJcXHUyMUQwXCIsXCJsYXJyZnNcIjpcIlxcdTI5MURcIixcImxhcnJoa1wiOlwiXFx1MjFBOVwiLFwibGFycmxwXCI6XCJcXHUyMUFCXCIsXCJsYXJycGxcIjpcIlxcdTI5MzlcIixcImxhcnJzaW1cIjpcIlxcdTI5NzNcIixcImxhcnJ0bFwiOlwiXFx1MjFBMlwiLFwibGF0YWlsXCI6XCJcXHUyOTE5XCIsXCJsQXRhaWxcIjpcIlxcdTI5MUJcIixcImxhdFwiOlwiXFx1MkFBQlwiLFwibGF0ZVwiOlwiXFx1MkFBRFwiLFwibGF0ZXNcIjpcIlxcdTJBQURcXHVGRTAwXCIsXCJsYmFyclwiOlwiXFx1MjkwQ1wiLFwibEJhcnJcIjpcIlxcdTI5MEVcIixcImxiYnJrXCI6XCJcXHUyNzcyXCIsXCJsYnJhY2VcIjpcIntcIixcImxicmFja1wiOlwiW1wiLFwibGJya2VcIjpcIlxcdTI5OEJcIixcImxicmtzbGRcIjpcIlxcdTI5OEZcIixcImxicmtzbHVcIjpcIlxcdTI5OERcIixcIkxjYXJvblwiOlwiXFx1MDEzRFwiLFwibGNhcm9uXCI6XCJcXHUwMTNFXCIsXCJMY2VkaWxcIjpcIlxcdTAxM0JcIixcImxjZWRpbFwiOlwiXFx1MDEzQ1wiLFwibGNlaWxcIjpcIlxcdTIzMDhcIixcImxjdWJcIjpcIntcIixcIkxjeVwiOlwiXFx1MDQxQlwiLFwibGN5XCI6XCJcXHUwNDNCXCIsXCJsZGNhXCI6XCJcXHUyOTM2XCIsXCJsZHF1b1wiOlwiXFx1MjAxQ1wiLFwibGRxdW9yXCI6XCJcXHUyMDFFXCIsXCJsZHJkaGFyXCI6XCJcXHUyOTY3XCIsXCJsZHJ1c2hhclwiOlwiXFx1Mjk0QlwiLFwibGRzaFwiOlwiXFx1MjFCMlwiLFwibGVcIjpcIlxcdTIyNjRcIixcImxFXCI6XCJcXHUyMjY2XCIsXCJMZWZ0QW5nbGVCcmFja2V0XCI6XCJcXHUyN0U4XCIsXCJMZWZ0QXJyb3dCYXJcIjpcIlxcdTIxRTRcIixcImxlZnRhcnJvd1wiOlwiXFx1MjE5MFwiLFwiTGVmdEFycm93XCI6XCJcXHUyMTkwXCIsXCJMZWZ0YXJyb3dcIjpcIlxcdTIxRDBcIixcIkxlZnRBcnJvd1JpZ2h0QXJyb3dcIjpcIlxcdTIxQzZcIixcImxlZnRhcnJvd3RhaWxcIjpcIlxcdTIxQTJcIixcIkxlZnRDZWlsaW5nXCI6XCJcXHUyMzA4XCIsXCJMZWZ0RG91YmxlQnJhY2tldFwiOlwiXFx1MjdFNlwiLFwiTGVmdERvd25UZWVWZWN0b3JcIjpcIlxcdTI5NjFcIixcIkxlZnREb3duVmVjdG9yQmFyXCI6XCJcXHUyOTU5XCIsXCJMZWZ0RG93blZlY3RvclwiOlwiXFx1MjFDM1wiLFwiTGVmdEZsb29yXCI6XCJcXHUyMzBBXCIsXCJsZWZ0aGFycG9vbmRvd25cIjpcIlxcdTIxQkRcIixcImxlZnRoYXJwb29udXBcIjpcIlxcdTIxQkNcIixcImxlZnRsZWZ0YXJyb3dzXCI6XCJcXHUyMUM3XCIsXCJsZWZ0cmlnaHRhcnJvd1wiOlwiXFx1MjE5NFwiLFwiTGVmdFJpZ2h0QXJyb3dcIjpcIlxcdTIxOTRcIixcIkxlZnRyaWdodGFycm93XCI6XCJcXHUyMUQ0XCIsXCJsZWZ0cmlnaHRhcnJvd3NcIjpcIlxcdTIxQzZcIixcImxlZnRyaWdodGhhcnBvb25zXCI6XCJcXHUyMUNCXCIsXCJsZWZ0cmlnaHRzcXVpZ2Fycm93XCI6XCJcXHUyMUFEXCIsXCJMZWZ0UmlnaHRWZWN0b3JcIjpcIlxcdTI5NEVcIixcIkxlZnRUZWVBcnJvd1wiOlwiXFx1MjFBNFwiLFwiTGVmdFRlZVwiOlwiXFx1MjJBM1wiLFwiTGVmdFRlZVZlY3RvclwiOlwiXFx1Mjk1QVwiLFwibGVmdHRocmVldGltZXNcIjpcIlxcdTIyQ0JcIixcIkxlZnRUcmlhbmdsZUJhclwiOlwiXFx1MjlDRlwiLFwiTGVmdFRyaWFuZ2xlXCI6XCJcXHUyMkIyXCIsXCJMZWZ0VHJpYW5nbGVFcXVhbFwiOlwiXFx1MjJCNFwiLFwiTGVmdFVwRG93blZlY3RvclwiOlwiXFx1Mjk1MVwiLFwiTGVmdFVwVGVlVmVjdG9yXCI6XCJcXHUyOTYwXCIsXCJMZWZ0VXBWZWN0b3JCYXJcIjpcIlxcdTI5NThcIixcIkxlZnRVcFZlY3RvclwiOlwiXFx1MjFCRlwiLFwiTGVmdFZlY3RvckJhclwiOlwiXFx1Mjk1MlwiLFwiTGVmdFZlY3RvclwiOlwiXFx1MjFCQ1wiLFwibEVnXCI6XCJcXHUyQThCXCIsXCJsZWdcIjpcIlxcdTIyREFcIixcImxlcVwiOlwiXFx1MjI2NFwiLFwibGVxcVwiOlwiXFx1MjI2NlwiLFwibGVxc2xhbnRcIjpcIlxcdTJBN0RcIixcImxlc2NjXCI6XCJcXHUyQUE4XCIsXCJsZXNcIjpcIlxcdTJBN0RcIixcImxlc2RvdFwiOlwiXFx1MkE3RlwiLFwibGVzZG90b1wiOlwiXFx1MkE4MVwiLFwibGVzZG90b3JcIjpcIlxcdTJBODNcIixcImxlc2dcIjpcIlxcdTIyREFcXHVGRTAwXCIsXCJsZXNnZXNcIjpcIlxcdTJBOTNcIixcImxlc3NhcHByb3hcIjpcIlxcdTJBODVcIixcImxlc3Nkb3RcIjpcIlxcdTIyRDZcIixcImxlc3NlcWd0clwiOlwiXFx1MjJEQVwiLFwibGVzc2VxcWd0clwiOlwiXFx1MkE4QlwiLFwiTGVzc0VxdWFsR3JlYXRlclwiOlwiXFx1MjJEQVwiLFwiTGVzc0Z1bGxFcXVhbFwiOlwiXFx1MjI2NlwiLFwiTGVzc0dyZWF0ZXJcIjpcIlxcdTIyNzZcIixcImxlc3NndHJcIjpcIlxcdTIyNzZcIixcIkxlc3NMZXNzXCI6XCJcXHUyQUExXCIsXCJsZXNzc2ltXCI6XCJcXHUyMjcyXCIsXCJMZXNzU2xhbnRFcXVhbFwiOlwiXFx1MkE3RFwiLFwiTGVzc1RpbGRlXCI6XCJcXHUyMjcyXCIsXCJsZmlzaHRcIjpcIlxcdTI5N0NcIixcImxmbG9vclwiOlwiXFx1MjMwQVwiLFwiTGZyXCI6XCJcXHVEODM1XFx1REQwRlwiLFwibGZyXCI6XCJcXHVEODM1XFx1REQyOVwiLFwibGdcIjpcIlxcdTIyNzZcIixcImxnRVwiOlwiXFx1MkE5MVwiLFwibEhhclwiOlwiXFx1Mjk2MlwiLFwibGhhcmRcIjpcIlxcdTIxQkRcIixcImxoYXJ1XCI6XCJcXHUyMUJDXCIsXCJsaGFydWxcIjpcIlxcdTI5NkFcIixcImxoYmxrXCI6XCJcXHUyNTg0XCIsXCJMSmN5XCI6XCJcXHUwNDA5XCIsXCJsamN5XCI6XCJcXHUwNDU5XCIsXCJsbGFyclwiOlwiXFx1MjFDN1wiLFwibGxcIjpcIlxcdTIyNkFcIixcIkxsXCI6XCJcXHUyMkQ4XCIsXCJsbGNvcm5lclwiOlwiXFx1MjMxRVwiLFwiTGxlZnRhcnJvd1wiOlwiXFx1MjFEQVwiLFwibGxoYXJkXCI6XCJcXHUyOTZCXCIsXCJsbHRyaVwiOlwiXFx1MjVGQVwiLFwiTG1pZG90XCI6XCJcXHUwMTNGXCIsXCJsbWlkb3RcIjpcIlxcdTAxNDBcIixcImxtb3VzdGFjaGVcIjpcIlxcdTIzQjBcIixcImxtb3VzdFwiOlwiXFx1MjNCMFwiLFwibG5hcFwiOlwiXFx1MkE4OVwiLFwibG5hcHByb3hcIjpcIlxcdTJBODlcIixcImxuZVwiOlwiXFx1MkE4N1wiLFwibG5FXCI6XCJcXHUyMjY4XCIsXCJsbmVxXCI6XCJcXHUyQTg3XCIsXCJsbmVxcVwiOlwiXFx1MjI2OFwiLFwibG5zaW1cIjpcIlxcdTIyRTZcIixcImxvYW5nXCI6XCJcXHUyN0VDXCIsXCJsb2FyclwiOlwiXFx1MjFGRFwiLFwibG9icmtcIjpcIlxcdTI3RTZcIixcImxvbmdsZWZ0YXJyb3dcIjpcIlxcdTI3RjVcIixcIkxvbmdMZWZ0QXJyb3dcIjpcIlxcdTI3RjVcIixcIkxvbmdsZWZ0YXJyb3dcIjpcIlxcdTI3RjhcIixcImxvbmdsZWZ0cmlnaHRhcnJvd1wiOlwiXFx1MjdGN1wiLFwiTG9uZ0xlZnRSaWdodEFycm93XCI6XCJcXHUyN0Y3XCIsXCJMb25nbGVmdHJpZ2h0YXJyb3dcIjpcIlxcdTI3RkFcIixcImxvbmdtYXBzdG9cIjpcIlxcdTI3RkNcIixcImxvbmdyaWdodGFycm93XCI6XCJcXHUyN0Y2XCIsXCJMb25nUmlnaHRBcnJvd1wiOlwiXFx1MjdGNlwiLFwiTG9uZ3JpZ2h0YXJyb3dcIjpcIlxcdTI3RjlcIixcImxvb3BhcnJvd2xlZnRcIjpcIlxcdTIxQUJcIixcImxvb3BhcnJvd3JpZ2h0XCI6XCJcXHUyMUFDXCIsXCJsb3BhclwiOlwiXFx1Mjk4NVwiLFwiTG9wZlwiOlwiXFx1RDgzNVxcdURENDNcIixcImxvcGZcIjpcIlxcdUQ4MzVcXHVERDVEXCIsXCJsb3BsdXNcIjpcIlxcdTJBMkRcIixcImxvdGltZXNcIjpcIlxcdTJBMzRcIixcImxvd2FzdFwiOlwiXFx1MjIxN1wiLFwibG93YmFyXCI6XCJfXCIsXCJMb3dlckxlZnRBcnJvd1wiOlwiXFx1MjE5OVwiLFwiTG93ZXJSaWdodEFycm93XCI6XCJcXHUyMTk4XCIsXCJsb3pcIjpcIlxcdTI1Q0FcIixcImxvemVuZ2VcIjpcIlxcdTI1Q0FcIixcImxvemZcIjpcIlxcdTI5RUJcIixcImxwYXJcIjpcIihcIixcImxwYXJsdFwiOlwiXFx1Mjk5M1wiLFwibHJhcnJcIjpcIlxcdTIxQzZcIixcImxyY29ybmVyXCI6XCJcXHUyMzFGXCIsXCJscmhhclwiOlwiXFx1MjFDQlwiLFwibHJoYXJkXCI6XCJcXHUyOTZEXCIsXCJscm1cIjpcIlxcdTIwMEVcIixcImxydHJpXCI6XCJcXHUyMkJGXCIsXCJsc2FxdW9cIjpcIlxcdTIwMzlcIixcImxzY3JcIjpcIlxcdUQ4MzVcXHVEQ0MxXCIsXCJMc2NyXCI6XCJcXHUyMTEyXCIsXCJsc2hcIjpcIlxcdTIxQjBcIixcIkxzaFwiOlwiXFx1MjFCMFwiLFwibHNpbVwiOlwiXFx1MjI3MlwiLFwibHNpbWVcIjpcIlxcdTJBOERcIixcImxzaW1nXCI6XCJcXHUyQThGXCIsXCJsc3FiXCI6XCJbXCIsXCJsc3F1b1wiOlwiXFx1MjAxOFwiLFwibHNxdW9yXCI6XCJcXHUyMDFBXCIsXCJMc3Ryb2tcIjpcIlxcdTAxNDFcIixcImxzdHJva1wiOlwiXFx1MDE0MlwiLFwibHRjY1wiOlwiXFx1MkFBNlwiLFwibHRjaXJcIjpcIlxcdTJBNzlcIixcImx0XCI6XCI8XCIsXCJMVFwiOlwiPFwiLFwiTHRcIjpcIlxcdTIyNkFcIixcImx0ZG90XCI6XCJcXHUyMkQ2XCIsXCJsdGhyZWVcIjpcIlxcdTIyQ0JcIixcImx0aW1lc1wiOlwiXFx1MjJDOVwiLFwibHRsYXJyXCI6XCJcXHUyOTc2XCIsXCJsdHF1ZXN0XCI6XCJcXHUyQTdCXCIsXCJsdHJpXCI6XCJcXHUyNUMzXCIsXCJsdHJpZVwiOlwiXFx1MjJCNFwiLFwibHRyaWZcIjpcIlxcdTI1QzJcIixcImx0clBhclwiOlwiXFx1Mjk5NlwiLFwibHVyZHNoYXJcIjpcIlxcdTI5NEFcIixcImx1cnVoYXJcIjpcIlxcdTI5NjZcIixcImx2ZXJ0bmVxcVwiOlwiXFx1MjI2OFxcdUZFMDBcIixcImx2bkVcIjpcIlxcdTIyNjhcXHVGRTAwXCIsXCJtYWNyXCI6XCJcXHUwMEFGXCIsXCJtYWxlXCI6XCJcXHUyNjQyXCIsXCJtYWx0XCI6XCJcXHUyNzIwXCIsXCJtYWx0ZXNlXCI6XCJcXHUyNzIwXCIsXCJNYXBcIjpcIlxcdTI5MDVcIixcIm1hcFwiOlwiXFx1MjFBNlwiLFwibWFwc3RvXCI6XCJcXHUyMUE2XCIsXCJtYXBzdG9kb3duXCI6XCJcXHUyMUE3XCIsXCJtYXBzdG9sZWZ0XCI6XCJcXHUyMUE0XCIsXCJtYXBzdG91cFwiOlwiXFx1MjFBNVwiLFwibWFya2VyXCI6XCJcXHUyNUFFXCIsXCJtY29tbWFcIjpcIlxcdTJBMjlcIixcIk1jeVwiOlwiXFx1MDQxQ1wiLFwibWN5XCI6XCJcXHUwNDNDXCIsXCJtZGFzaFwiOlwiXFx1MjAxNFwiLFwibUREb3RcIjpcIlxcdTIyM0FcIixcIm1lYXN1cmVkYW5nbGVcIjpcIlxcdTIyMjFcIixcIk1lZGl1bVNwYWNlXCI6XCJcXHUyMDVGXCIsXCJNZWxsaW50cmZcIjpcIlxcdTIxMzNcIixcIk1mclwiOlwiXFx1RDgzNVxcdUREMTBcIixcIm1mclwiOlwiXFx1RDgzNVxcdUREMkFcIixcIm1ob1wiOlwiXFx1MjEyN1wiLFwibWljcm9cIjpcIlxcdTAwQjVcIixcIm1pZGFzdFwiOlwiKlwiLFwibWlkY2lyXCI6XCJcXHUyQUYwXCIsXCJtaWRcIjpcIlxcdTIyMjNcIixcIm1pZGRvdFwiOlwiXFx1MDBCN1wiLFwibWludXNiXCI6XCJcXHUyMjlGXCIsXCJtaW51c1wiOlwiXFx1MjIxMlwiLFwibWludXNkXCI6XCJcXHUyMjM4XCIsXCJtaW51c2R1XCI6XCJcXHUyQTJBXCIsXCJNaW51c1BsdXNcIjpcIlxcdTIyMTNcIixcIm1sY3BcIjpcIlxcdTJBREJcIixcIm1sZHJcIjpcIlxcdTIwMjZcIixcIm1ucGx1c1wiOlwiXFx1MjIxM1wiLFwibW9kZWxzXCI6XCJcXHUyMkE3XCIsXCJNb3BmXCI6XCJcXHVEODM1XFx1REQ0NFwiLFwibW9wZlwiOlwiXFx1RDgzNVxcdURENUVcIixcIm1wXCI6XCJcXHUyMjEzXCIsXCJtc2NyXCI6XCJcXHVEODM1XFx1RENDMlwiLFwiTXNjclwiOlwiXFx1MjEzM1wiLFwibXN0cG9zXCI6XCJcXHUyMjNFXCIsXCJNdVwiOlwiXFx1MDM5Q1wiLFwibXVcIjpcIlxcdTAzQkNcIixcIm11bHRpbWFwXCI6XCJcXHUyMkI4XCIsXCJtdW1hcFwiOlwiXFx1MjJCOFwiLFwibmFibGFcIjpcIlxcdTIyMDdcIixcIk5hY3V0ZVwiOlwiXFx1MDE0M1wiLFwibmFjdXRlXCI6XCJcXHUwMTQ0XCIsXCJuYW5nXCI6XCJcXHUyMjIwXFx1MjBEMlwiLFwibmFwXCI6XCJcXHUyMjQ5XCIsXCJuYXBFXCI6XCJcXHUyQTcwXFx1MDMzOFwiLFwibmFwaWRcIjpcIlxcdTIyNEJcXHUwMzM4XCIsXCJuYXBvc1wiOlwiXFx1MDE0OVwiLFwibmFwcHJveFwiOlwiXFx1MjI0OVwiLFwibmF0dXJhbFwiOlwiXFx1MjY2RVwiLFwibmF0dXJhbHNcIjpcIlxcdTIxMTVcIixcIm5hdHVyXCI6XCJcXHUyNjZFXCIsXCJuYnNwXCI6XCJcXHUwMEEwXCIsXCJuYnVtcFwiOlwiXFx1MjI0RVxcdTAzMzhcIixcIm5idW1wZVwiOlwiXFx1MjI0RlxcdTAzMzhcIixcIm5jYXBcIjpcIlxcdTJBNDNcIixcIk5jYXJvblwiOlwiXFx1MDE0N1wiLFwibmNhcm9uXCI6XCJcXHUwMTQ4XCIsXCJOY2VkaWxcIjpcIlxcdTAxNDVcIixcIm5jZWRpbFwiOlwiXFx1MDE0NlwiLFwibmNvbmdcIjpcIlxcdTIyNDdcIixcIm5jb25nZG90XCI6XCJcXHUyQTZEXFx1MDMzOFwiLFwibmN1cFwiOlwiXFx1MkE0MlwiLFwiTmN5XCI6XCJcXHUwNDFEXCIsXCJuY3lcIjpcIlxcdTA0M0RcIixcIm5kYXNoXCI6XCJcXHUyMDEzXCIsXCJuZWFyaGtcIjpcIlxcdTI5MjRcIixcIm5lYXJyXCI6XCJcXHUyMTk3XCIsXCJuZUFyclwiOlwiXFx1MjFEN1wiLFwibmVhcnJvd1wiOlwiXFx1MjE5N1wiLFwibmVcIjpcIlxcdTIyNjBcIixcIm5lZG90XCI6XCJcXHUyMjUwXFx1MDMzOFwiLFwiTmVnYXRpdmVNZWRpdW1TcGFjZVwiOlwiXFx1MjAwQlwiLFwiTmVnYXRpdmVUaGlja1NwYWNlXCI6XCJcXHUyMDBCXCIsXCJOZWdhdGl2ZVRoaW5TcGFjZVwiOlwiXFx1MjAwQlwiLFwiTmVnYXRpdmVWZXJ5VGhpblNwYWNlXCI6XCJcXHUyMDBCXCIsXCJuZXF1aXZcIjpcIlxcdTIyNjJcIixcIm5lc2VhclwiOlwiXFx1MjkyOFwiLFwibmVzaW1cIjpcIlxcdTIyNDJcXHUwMzM4XCIsXCJOZXN0ZWRHcmVhdGVyR3JlYXRlclwiOlwiXFx1MjI2QlwiLFwiTmVzdGVkTGVzc0xlc3NcIjpcIlxcdTIyNkFcIixcIk5ld0xpbmVcIjpcIlxcblwiLFwibmV4aXN0XCI6XCJcXHUyMjA0XCIsXCJuZXhpc3RzXCI6XCJcXHUyMjA0XCIsXCJOZnJcIjpcIlxcdUQ4MzVcXHVERDExXCIsXCJuZnJcIjpcIlxcdUQ4MzVcXHVERDJCXCIsXCJuZ0VcIjpcIlxcdTIyNjdcXHUwMzM4XCIsXCJuZ2VcIjpcIlxcdTIyNzFcIixcIm5nZXFcIjpcIlxcdTIyNzFcIixcIm5nZXFxXCI6XCJcXHUyMjY3XFx1MDMzOFwiLFwibmdlcXNsYW50XCI6XCJcXHUyQTdFXFx1MDMzOFwiLFwibmdlc1wiOlwiXFx1MkE3RVxcdTAzMzhcIixcIm5HZ1wiOlwiXFx1MjJEOVxcdTAzMzhcIixcIm5nc2ltXCI6XCJcXHUyMjc1XCIsXCJuR3RcIjpcIlxcdTIyNkJcXHUyMEQyXCIsXCJuZ3RcIjpcIlxcdTIyNkZcIixcIm5ndHJcIjpcIlxcdTIyNkZcIixcIm5HdHZcIjpcIlxcdTIyNkJcXHUwMzM4XCIsXCJuaGFyclwiOlwiXFx1MjFBRVwiLFwibmhBcnJcIjpcIlxcdTIxQ0VcIixcIm5ocGFyXCI6XCJcXHUyQUYyXCIsXCJuaVwiOlwiXFx1MjIwQlwiLFwibmlzXCI6XCJcXHUyMkZDXCIsXCJuaXNkXCI6XCJcXHUyMkZBXCIsXCJuaXZcIjpcIlxcdTIyMEJcIixcIk5KY3lcIjpcIlxcdTA0MEFcIixcIm5qY3lcIjpcIlxcdTA0NUFcIixcIm5sYXJyXCI6XCJcXHUyMTlBXCIsXCJubEFyclwiOlwiXFx1MjFDRFwiLFwibmxkclwiOlwiXFx1MjAyNVwiLFwibmxFXCI6XCJcXHUyMjY2XFx1MDMzOFwiLFwibmxlXCI6XCJcXHUyMjcwXCIsXCJubGVmdGFycm93XCI6XCJcXHUyMTlBXCIsXCJuTGVmdGFycm93XCI6XCJcXHUyMUNEXCIsXCJubGVmdHJpZ2h0YXJyb3dcIjpcIlxcdTIxQUVcIixcIm5MZWZ0cmlnaHRhcnJvd1wiOlwiXFx1MjFDRVwiLFwibmxlcVwiOlwiXFx1MjI3MFwiLFwibmxlcXFcIjpcIlxcdTIyNjZcXHUwMzM4XCIsXCJubGVxc2xhbnRcIjpcIlxcdTJBN0RcXHUwMzM4XCIsXCJubGVzXCI6XCJcXHUyQTdEXFx1MDMzOFwiLFwibmxlc3NcIjpcIlxcdTIyNkVcIixcIm5MbFwiOlwiXFx1MjJEOFxcdTAzMzhcIixcIm5sc2ltXCI6XCJcXHUyMjc0XCIsXCJuTHRcIjpcIlxcdTIyNkFcXHUyMEQyXCIsXCJubHRcIjpcIlxcdTIyNkVcIixcIm5sdHJpXCI6XCJcXHUyMkVBXCIsXCJubHRyaWVcIjpcIlxcdTIyRUNcIixcIm5MdHZcIjpcIlxcdTIyNkFcXHUwMzM4XCIsXCJubWlkXCI6XCJcXHUyMjI0XCIsXCJOb0JyZWFrXCI6XCJcXHUyMDYwXCIsXCJOb25CcmVha2luZ1NwYWNlXCI6XCJcXHUwMEEwXCIsXCJub3BmXCI6XCJcXHVEODM1XFx1REQ1RlwiLFwiTm9wZlwiOlwiXFx1MjExNVwiLFwiTm90XCI6XCJcXHUyQUVDXCIsXCJub3RcIjpcIlxcdTAwQUNcIixcIk5vdENvbmdydWVudFwiOlwiXFx1MjI2MlwiLFwiTm90Q3VwQ2FwXCI6XCJcXHUyMjZEXCIsXCJOb3REb3VibGVWZXJ0aWNhbEJhclwiOlwiXFx1MjIyNlwiLFwiTm90RWxlbWVudFwiOlwiXFx1MjIwOVwiLFwiTm90RXF1YWxcIjpcIlxcdTIyNjBcIixcIk5vdEVxdWFsVGlsZGVcIjpcIlxcdTIyNDJcXHUwMzM4XCIsXCJOb3RFeGlzdHNcIjpcIlxcdTIyMDRcIixcIk5vdEdyZWF0ZXJcIjpcIlxcdTIyNkZcIixcIk5vdEdyZWF0ZXJFcXVhbFwiOlwiXFx1MjI3MVwiLFwiTm90R3JlYXRlckZ1bGxFcXVhbFwiOlwiXFx1MjI2N1xcdTAzMzhcIixcIk5vdEdyZWF0ZXJHcmVhdGVyXCI6XCJcXHUyMjZCXFx1MDMzOFwiLFwiTm90R3JlYXRlckxlc3NcIjpcIlxcdTIyNzlcIixcIk5vdEdyZWF0ZXJTbGFudEVxdWFsXCI6XCJcXHUyQTdFXFx1MDMzOFwiLFwiTm90R3JlYXRlclRpbGRlXCI6XCJcXHUyMjc1XCIsXCJOb3RIdW1wRG93bkh1bXBcIjpcIlxcdTIyNEVcXHUwMzM4XCIsXCJOb3RIdW1wRXF1YWxcIjpcIlxcdTIyNEZcXHUwMzM4XCIsXCJub3RpblwiOlwiXFx1MjIwOVwiLFwibm90aW5kb3RcIjpcIlxcdTIyRjVcXHUwMzM4XCIsXCJub3RpbkVcIjpcIlxcdTIyRjlcXHUwMzM4XCIsXCJub3RpbnZhXCI6XCJcXHUyMjA5XCIsXCJub3RpbnZiXCI6XCJcXHUyMkY3XCIsXCJub3RpbnZjXCI6XCJcXHUyMkY2XCIsXCJOb3RMZWZ0VHJpYW5nbGVCYXJcIjpcIlxcdTI5Q0ZcXHUwMzM4XCIsXCJOb3RMZWZ0VHJpYW5nbGVcIjpcIlxcdTIyRUFcIixcIk5vdExlZnRUcmlhbmdsZUVxdWFsXCI6XCJcXHUyMkVDXCIsXCJOb3RMZXNzXCI6XCJcXHUyMjZFXCIsXCJOb3RMZXNzRXF1YWxcIjpcIlxcdTIyNzBcIixcIk5vdExlc3NHcmVhdGVyXCI6XCJcXHUyMjc4XCIsXCJOb3RMZXNzTGVzc1wiOlwiXFx1MjI2QVxcdTAzMzhcIixcIk5vdExlc3NTbGFudEVxdWFsXCI6XCJcXHUyQTdEXFx1MDMzOFwiLFwiTm90TGVzc1RpbGRlXCI6XCJcXHUyMjc0XCIsXCJOb3ROZXN0ZWRHcmVhdGVyR3JlYXRlclwiOlwiXFx1MkFBMlxcdTAzMzhcIixcIk5vdE5lc3RlZExlc3NMZXNzXCI6XCJcXHUyQUExXFx1MDMzOFwiLFwibm90bmlcIjpcIlxcdTIyMENcIixcIm5vdG5pdmFcIjpcIlxcdTIyMENcIixcIm5vdG5pdmJcIjpcIlxcdTIyRkVcIixcIm5vdG5pdmNcIjpcIlxcdTIyRkRcIixcIk5vdFByZWNlZGVzXCI6XCJcXHUyMjgwXCIsXCJOb3RQcmVjZWRlc0VxdWFsXCI6XCJcXHUyQUFGXFx1MDMzOFwiLFwiTm90UHJlY2VkZXNTbGFudEVxdWFsXCI6XCJcXHUyMkUwXCIsXCJOb3RSZXZlcnNlRWxlbWVudFwiOlwiXFx1MjIwQ1wiLFwiTm90UmlnaHRUcmlhbmdsZUJhclwiOlwiXFx1MjlEMFxcdTAzMzhcIixcIk5vdFJpZ2h0VHJpYW5nbGVcIjpcIlxcdTIyRUJcIixcIk5vdFJpZ2h0VHJpYW5nbGVFcXVhbFwiOlwiXFx1MjJFRFwiLFwiTm90U3F1YXJlU3Vic2V0XCI6XCJcXHUyMjhGXFx1MDMzOFwiLFwiTm90U3F1YXJlU3Vic2V0RXF1YWxcIjpcIlxcdTIyRTJcIixcIk5vdFNxdWFyZVN1cGVyc2V0XCI6XCJcXHUyMjkwXFx1MDMzOFwiLFwiTm90U3F1YXJlU3VwZXJzZXRFcXVhbFwiOlwiXFx1MjJFM1wiLFwiTm90U3Vic2V0XCI6XCJcXHUyMjgyXFx1MjBEMlwiLFwiTm90U3Vic2V0RXF1YWxcIjpcIlxcdTIyODhcIixcIk5vdFN1Y2NlZWRzXCI6XCJcXHUyMjgxXCIsXCJOb3RTdWNjZWVkc0VxdWFsXCI6XCJcXHUyQUIwXFx1MDMzOFwiLFwiTm90U3VjY2VlZHNTbGFudEVxdWFsXCI6XCJcXHUyMkUxXCIsXCJOb3RTdWNjZWVkc1RpbGRlXCI6XCJcXHUyMjdGXFx1MDMzOFwiLFwiTm90U3VwZXJzZXRcIjpcIlxcdTIyODNcXHUyMEQyXCIsXCJOb3RTdXBlcnNldEVxdWFsXCI6XCJcXHUyMjg5XCIsXCJOb3RUaWxkZVwiOlwiXFx1MjI0MVwiLFwiTm90VGlsZGVFcXVhbFwiOlwiXFx1MjI0NFwiLFwiTm90VGlsZGVGdWxsRXF1YWxcIjpcIlxcdTIyNDdcIixcIk5vdFRpbGRlVGlsZGVcIjpcIlxcdTIyNDlcIixcIk5vdFZlcnRpY2FsQmFyXCI6XCJcXHUyMjI0XCIsXCJucGFyYWxsZWxcIjpcIlxcdTIyMjZcIixcIm5wYXJcIjpcIlxcdTIyMjZcIixcIm5wYXJzbFwiOlwiXFx1MkFGRFxcdTIwRTVcIixcIm5wYXJ0XCI6XCJcXHUyMjAyXFx1MDMzOFwiLFwibnBvbGludFwiOlwiXFx1MkExNFwiLFwibnByXCI6XCJcXHUyMjgwXCIsXCJucHJjdWVcIjpcIlxcdTIyRTBcIixcIm5wcmVjXCI6XCJcXHUyMjgwXCIsXCJucHJlY2VxXCI6XCJcXHUyQUFGXFx1MDMzOFwiLFwibnByZVwiOlwiXFx1MkFBRlxcdTAzMzhcIixcIm5yYXJyY1wiOlwiXFx1MjkzM1xcdTAzMzhcIixcIm5yYXJyXCI6XCJcXHUyMTlCXCIsXCJuckFyclwiOlwiXFx1MjFDRlwiLFwibnJhcnJ3XCI6XCJcXHUyMTlEXFx1MDMzOFwiLFwibnJpZ2h0YXJyb3dcIjpcIlxcdTIxOUJcIixcIm5SaWdodGFycm93XCI6XCJcXHUyMUNGXCIsXCJucnRyaVwiOlwiXFx1MjJFQlwiLFwibnJ0cmllXCI6XCJcXHUyMkVEXCIsXCJuc2NcIjpcIlxcdTIyODFcIixcIm5zY2N1ZVwiOlwiXFx1MjJFMVwiLFwibnNjZVwiOlwiXFx1MkFCMFxcdTAzMzhcIixcIk5zY3JcIjpcIlxcdUQ4MzVcXHVEQ0E5XCIsXCJuc2NyXCI6XCJcXHVEODM1XFx1RENDM1wiLFwibnNob3J0bWlkXCI6XCJcXHUyMjI0XCIsXCJuc2hvcnRwYXJhbGxlbFwiOlwiXFx1MjIyNlwiLFwibnNpbVwiOlwiXFx1MjI0MVwiLFwibnNpbWVcIjpcIlxcdTIyNDRcIixcIm5zaW1lcVwiOlwiXFx1MjI0NFwiLFwibnNtaWRcIjpcIlxcdTIyMjRcIixcIm5zcGFyXCI6XCJcXHUyMjI2XCIsXCJuc3FzdWJlXCI6XCJcXHUyMkUyXCIsXCJuc3FzdXBlXCI6XCJcXHUyMkUzXCIsXCJuc3ViXCI6XCJcXHUyMjg0XCIsXCJuc3ViRVwiOlwiXFx1MkFDNVxcdTAzMzhcIixcIm5zdWJlXCI6XCJcXHUyMjg4XCIsXCJuc3Vic2V0XCI6XCJcXHUyMjgyXFx1MjBEMlwiLFwibnN1YnNldGVxXCI6XCJcXHUyMjg4XCIsXCJuc3Vic2V0ZXFxXCI6XCJcXHUyQUM1XFx1MDMzOFwiLFwibnN1Y2NcIjpcIlxcdTIyODFcIixcIm5zdWNjZXFcIjpcIlxcdTJBQjBcXHUwMzM4XCIsXCJuc3VwXCI6XCJcXHUyMjg1XCIsXCJuc3VwRVwiOlwiXFx1MkFDNlxcdTAzMzhcIixcIm5zdXBlXCI6XCJcXHUyMjg5XCIsXCJuc3Vwc2V0XCI6XCJcXHUyMjgzXFx1MjBEMlwiLFwibnN1cHNldGVxXCI6XCJcXHUyMjg5XCIsXCJuc3Vwc2V0ZXFxXCI6XCJcXHUyQUM2XFx1MDMzOFwiLFwibnRnbFwiOlwiXFx1MjI3OVwiLFwiTnRpbGRlXCI6XCJcXHUwMEQxXCIsXCJudGlsZGVcIjpcIlxcdTAwRjFcIixcIm50bGdcIjpcIlxcdTIyNzhcIixcIm50cmlhbmdsZWxlZnRcIjpcIlxcdTIyRUFcIixcIm50cmlhbmdsZWxlZnRlcVwiOlwiXFx1MjJFQ1wiLFwibnRyaWFuZ2xlcmlnaHRcIjpcIlxcdTIyRUJcIixcIm50cmlhbmdsZXJpZ2h0ZXFcIjpcIlxcdTIyRURcIixcIk51XCI6XCJcXHUwMzlEXCIsXCJudVwiOlwiXFx1MDNCRFwiLFwibnVtXCI6XCIjXCIsXCJudW1lcm9cIjpcIlxcdTIxMTZcIixcIm51bXNwXCI6XCJcXHUyMDA3XCIsXCJudmFwXCI6XCJcXHUyMjREXFx1MjBEMlwiLFwibnZkYXNoXCI6XCJcXHUyMkFDXCIsXCJudkRhc2hcIjpcIlxcdTIyQURcIixcIm5WZGFzaFwiOlwiXFx1MjJBRVwiLFwiblZEYXNoXCI6XCJcXHUyMkFGXCIsXCJudmdlXCI6XCJcXHUyMjY1XFx1MjBEMlwiLFwibnZndFwiOlwiPlxcdTIwRDJcIixcIm52SGFyclwiOlwiXFx1MjkwNFwiLFwibnZpbmZpblwiOlwiXFx1MjlERVwiLFwibnZsQXJyXCI6XCJcXHUyOTAyXCIsXCJudmxlXCI6XCJcXHUyMjY0XFx1MjBEMlwiLFwibnZsdFwiOlwiPFxcdTIwRDJcIixcIm52bHRyaWVcIjpcIlxcdTIyQjRcXHUyMEQyXCIsXCJudnJBcnJcIjpcIlxcdTI5MDNcIixcIm52cnRyaWVcIjpcIlxcdTIyQjVcXHUyMEQyXCIsXCJudnNpbVwiOlwiXFx1MjIzQ1xcdTIwRDJcIixcIm53YXJoa1wiOlwiXFx1MjkyM1wiLFwibndhcnJcIjpcIlxcdTIxOTZcIixcIm53QXJyXCI6XCJcXHUyMUQ2XCIsXCJud2Fycm93XCI6XCJcXHUyMTk2XCIsXCJud25lYXJcIjpcIlxcdTI5MjdcIixcIk9hY3V0ZVwiOlwiXFx1MDBEM1wiLFwib2FjdXRlXCI6XCJcXHUwMEYzXCIsXCJvYXN0XCI6XCJcXHUyMjlCXCIsXCJPY2lyY1wiOlwiXFx1MDBENFwiLFwib2NpcmNcIjpcIlxcdTAwRjRcIixcIm9jaXJcIjpcIlxcdTIyOUFcIixcIk9jeVwiOlwiXFx1MDQxRVwiLFwib2N5XCI6XCJcXHUwNDNFXCIsXCJvZGFzaFwiOlwiXFx1MjI5RFwiLFwiT2RibGFjXCI6XCJcXHUwMTUwXCIsXCJvZGJsYWNcIjpcIlxcdTAxNTFcIixcIm9kaXZcIjpcIlxcdTJBMzhcIixcIm9kb3RcIjpcIlxcdTIyOTlcIixcIm9kc29sZFwiOlwiXFx1MjlCQ1wiLFwiT0VsaWdcIjpcIlxcdTAxNTJcIixcIm9lbGlnXCI6XCJcXHUwMTUzXCIsXCJvZmNpclwiOlwiXFx1MjlCRlwiLFwiT2ZyXCI6XCJcXHVEODM1XFx1REQxMlwiLFwib2ZyXCI6XCJcXHVEODM1XFx1REQyQ1wiLFwib2dvblwiOlwiXFx1MDJEQlwiLFwiT2dyYXZlXCI6XCJcXHUwMEQyXCIsXCJvZ3JhdmVcIjpcIlxcdTAwRjJcIixcIm9ndFwiOlwiXFx1MjlDMVwiLFwib2hiYXJcIjpcIlxcdTI5QjVcIixcIm9obVwiOlwiXFx1MDNBOVwiLFwib2ludFwiOlwiXFx1MjIyRVwiLFwib2xhcnJcIjpcIlxcdTIxQkFcIixcIm9sY2lyXCI6XCJcXHUyOUJFXCIsXCJvbGNyb3NzXCI6XCJcXHUyOUJCXCIsXCJvbGluZVwiOlwiXFx1MjAzRVwiLFwib2x0XCI6XCJcXHUyOUMwXCIsXCJPbWFjclwiOlwiXFx1MDE0Q1wiLFwib21hY3JcIjpcIlxcdTAxNERcIixcIk9tZWdhXCI6XCJcXHUwM0E5XCIsXCJvbWVnYVwiOlwiXFx1MDNDOVwiLFwiT21pY3JvblwiOlwiXFx1MDM5RlwiLFwib21pY3JvblwiOlwiXFx1MDNCRlwiLFwib21pZFwiOlwiXFx1MjlCNlwiLFwib21pbnVzXCI6XCJcXHUyMjk2XCIsXCJPb3BmXCI6XCJcXHVEODM1XFx1REQ0NlwiLFwib29wZlwiOlwiXFx1RDgzNVxcdURENjBcIixcIm9wYXJcIjpcIlxcdTI5QjdcIixcIk9wZW5DdXJseURvdWJsZVF1b3RlXCI6XCJcXHUyMDFDXCIsXCJPcGVuQ3VybHlRdW90ZVwiOlwiXFx1MjAxOFwiLFwib3BlcnBcIjpcIlxcdTI5QjlcIixcIm9wbHVzXCI6XCJcXHUyMjk1XCIsXCJvcmFyclwiOlwiXFx1MjFCQlwiLFwiT3JcIjpcIlxcdTJBNTRcIixcIm9yXCI6XCJcXHUyMjI4XCIsXCJvcmRcIjpcIlxcdTJBNURcIixcIm9yZGVyXCI6XCJcXHUyMTM0XCIsXCJvcmRlcm9mXCI6XCJcXHUyMTM0XCIsXCJvcmRmXCI6XCJcXHUwMEFBXCIsXCJvcmRtXCI6XCJcXHUwMEJBXCIsXCJvcmlnb2ZcIjpcIlxcdTIyQjZcIixcIm9yb3JcIjpcIlxcdTJBNTZcIixcIm9yc2xvcGVcIjpcIlxcdTJBNTdcIixcIm9ydlwiOlwiXFx1MkE1QlwiLFwib1NcIjpcIlxcdTI0QzhcIixcIk9zY3JcIjpcIlxcdUQ4MzVcXHVEQ0FBXCIsXCJvc2NyXCI6XCJcXHUyMTM0XCIsXCJPc2xhc2hcIjpcIlxcdTAwRDhcIixcIm9zbGFzaFwiOlwiXFx1MDBGOFwiLFwib3NvbFwiOlwiXFx1MjI5OFwiLFwiT3RpbGRlXCI6XCJcXHUwMEQ1XCIsXCJvdGlsZGVcIjpcIlxcdTAwRjVcIixcIm90aW1lc2FzXCI6XCJcXHUyQTM2XCIsXCJPdGltZXNcIjpcIlxcdTJBMzdcIixcIm90aW1lc1wiOlwiXFx1MjI5N1wiLFwiT3VtbFwiOlwiXFx1MDBENlwiLFwib3VtbFwiOlwiXFx1MDBGNlwiLFwib3ZiYXJcIjpcIlxcdTIzM0RcIixcIk92ZXJCYXJcIjpcIlxcdTIwM0VcIixcIk92ZXJCcmFjZVwiOlwiXFx1MjNERVwiLFwiT3ZlckJyYWNrZXRcIjpcIlxcdTIzQjRcIixcIk92ZXJQYXJlbnRoZXNpc1wiOlwiXFx1MjNEQ1wiLFwicGFyYVwiOlwiXFx1MDBCNlwiLFwicGFyYWxsZWxcIjpcIlxcdTIyMjVcIixcInBhclwiOlwiXFx1MjIyNVwiLFwicGFyc2ltXCI6XCJcXHUyQUYzXCIsXCJwYXJzbFwiOlwiXFx1MkFGRFwiLFwicGFydFwiOlwiXFx1MjIwMlwiLFwiUGFydGlhbERcIjpcIlxcdTIyMDJcIixcIlBjeVwiOlwiXFx1MDQxRlwiLFwicGN5XCI6XCJcXHUwNDNGXCIsXCJwZXJjbnRcIjpcIiVcIixcInBlcmlvZFwiOlwiLlwiLFwicGVybWlsXCI6XCJcXHUyMDMwXCIsXCJwZXJwXCI6XCJcXHUyMkE1XCIsXCJwZXJ0ZW5rXCI6XCJcXHUyMDMxXCIsXCJQZnJcIjpcIlxcdUQ4MzVcXHVERDEzXCIsXCJwZnJcIjpcIlxcdUQ4MzVcXHVERDJEXCIsXCJQaGlcIjpcIlxcdTAzQTZcIixcInBoaVwiOlwiXFx1MDNDNlwiLFwicGhpdlwiOlwiXFx1MDNENVwiLFwicGhtbWF0XCI6XCJcXHUyMTMzXCIsXCJwaG9uZVwiOlwiXFx1MjYwRVwiLFwiUGlcIjpcIlxcdTAzQTBcIixcInBpXCI6XCJcXHUwM0MwXCIsXCJwaXRjaGZvcmtcIjpcIlxcdTIyRDRcIixcInBpdlwiOlwiXFx1MDNENlwiLFwicGxhbmNrXCI6XCJcXHUyMTBGXCIsXCJwbGFuY2toXCI6XCJcXHUyMTBFXCIsXCJwbGFua3ZcIjpcIlxcdTIxMEZcIixcInBsdXNhY2lyXCI6XCJcXHUyQTIzXCIsXCJwbHVzYlwiOlwiXFx1MjI5RVwiLFwicGx1c2NpclwiOlwiXFx1MkEyMlwiLFwicGx1c1wiOlwiK1wiLFwicGx1c2RvXCI6XCJcXHUyMjE0XCIsXCJwbHVzZHVcIjpcIlxcdTJBMjVcIixcInBsdXNlXCI6XCJcXHUyQTcyXCIsXCJQbHVzTWludXNcIjpcIlxcdTAwQjFcIixcInBsdXNtblwiOlwiXFx1MDBCMVwiLFwicGx1c3NpbVwiOlwiXFx1MkEyNlwiLFwicGx1c3R3b1wiOlwiXFx1MkEyN1wiLFwicG1cIjpcIlxcdTAwQjFcIixcIlBvaW5jYXJlcGxhbmVcIjpcIlxcdTIxMENcIixcInBvaW50aW50XCI6XCJcXHUyQTE1XCIsXCJwb3BmXCI6XCJcXHVEODM1XFx1REQ2MVwiLFwiUG9wZlwiOlwiXFx1MjExOVwiLFwicG91bmRcIjpcIlxcdTAwQTNcIixcInByYXBcIjpcIlxcdTJBQjdcIixcIlByXCI6XCJcXHUyQUJCXCIsXCJwclwiOlwiXFx1MjI3QVwiLFwicHJjdWVcIjpcIlxcdTIyN0NcIixcInByZWNhcHByb3hcIjpcIlxcdTJBQjdcIixcInByZWNcIjpcIlxcdTIyN0FcIixcInByZWNjdXJseWVxXCI6XCJcXHUyMjdDXCIsXCJQcmVjZWRlc1wiOlwiXFx1MjI3QVwiLFwiUHJlY2VkZXNFcXVhbFwiOlwiXFx1MkFBRlwiLFwiUHJlY2VkZXNTbGFudEVxdWFsXCI6XCJcXHUyMjdDXCIsXCJQcmVjZWRlc1RpbGRlXCI6XCJcXHUyMjdFXCIsXCJwcmVjZXFcIjpcIlxcdTJBQUZcIixcInByZWNuYXBwcm94XCI6XCJcXHUyQUI5XCIsXCJwcmVjbmVxcVwiOlwiXFx1MkFCNVwiLFwicHJlY25zaW1cIjpcIlxcdTIyRThcIixcInByZVwiOlwiXFx1MkFBRlwiLFwicHJFXCI6XCJcXHUyQUIzXCIsXCJwcmVjc2ltXCI6XCJcXHUyMjdFXCIsXCJwcmltZVwiOlwiXFx1MjAzMlwiLFwiUHJpbWVcIjpcIlxcdTIwMzNcIixcInByaW1lc1wiOlwiXFx1MjExOVwiLFwicHJuYXBcIjpcIlxcdTJBQjlcIixcInBybkVcIjpcIlxcdTJBQjVcIixcInBybnNpbVwiOlwiXFx1MjJFOFwiLFwicHJvZFwiOlwiXFx1MjIwRlwiLFwiUHJvZHVjdFwiOlwiXFx1MjIwRlwiLFwicHJvZmFsYXJcIjpcIlxcdTIzMkVcIixcInByb2ZsaW5lXCI6XCJcXHUyMzEyXCIsXCJwcm9mc3VyZlwiOlwiXFx1MjMxM1wiLFwicHJvcFwiOlwiXFx1MjIxRFwiLFwiUHJvcG9ydGlvbmFsXCI6XCJcXHUyMjFEXCIsXCJQcm9wb3J0aW9uXCI6XCJcXHUyMjM3XCIsXCJwcm9wdG9cIjpcIlxcdTIyMURcIixcInByc2ltXCI6XCJcXHUyMjdFXCIsXCJwcnVyZWxcIjpcIlxcdTIyQjBcIixcIlBzY3JcIjpcIlxcdUQ4MzVcXHVEQ0FCXCIsXCJwc2NyXCI6XCJcXHVEODM1XFx1RENDNVwiLFwiUHNpXCI6XCJcXHUwM0E4XCIsXCJwc2lcIjpcIlxcdTAzQzhcIixcInB1bmNzcFwiOlwiXFx1MjAwOFwiLFwiUWZyXCI6XCJcXHVEODM1XFx1REQxNFwiLFwicWZyXCI6XCJcXHVEODM1XFx1REQyRVwiLFwicWludFwiOlwiXFx1MkEwQ1wiLFwicW9wZlwiOlwiXFx1RDgzNVxcdURENjJcIixcIlFvcGZcIjpcIlxcdTIxMUFcIixcInFwcmltZVwiOlwiXFx1MjA1N1wiLFwiUXNjclwiOlwiXFx1RDgzNVxcdURDQUNcIixcInFzY3JcIjpcIlxcdUQ4MzVcXHVEQ0M2XCIsXCJxdWF0ZXJuaW9uc1wiOlwiXFx1MjEwRFwiLFwicXVhdGludFwiOlwiXFx1MkExNlwiLFwicXVlc3RcIjpcIj9cIixcInF1ZXN0ZXFcIjpcIlxcdTIyNUZcIixcInF1b3RcIjpcIlxcXCJcIixcIlFVT1RcIjpcIlxcXCJcIixcInJBYXJyXCI6XCJcXHUyMURCXCIsXCJyYWNlXCI6XCJcXHUyMjNEXFx1MDMzMVwiLFwiUmFjdXRlXCI6XCJcXHUwMTU0XCIsXCJyYWN1dGVcIjpcIlxcdTAxNTVcIixcInJhZGljXCI6XCJcXHUyMjFBXCIsXCJyYWVtcHR5dlwiOlwiXFx1MjlCM1wiLFwicmFuZ1wiOlwiXFx1MjdFOVwiLFwiUmFuZ1wiOlwiXFx1MjdFQlwiLFwicmFuZ2RcIjpcIlxcdTI5OTJcIixcInJhbmdlXCI6XCJcXHUyOUE1XCIsXCJyYW5nbGVcIjpcIlxcdTI3RTlcIixcInJhcXVvXCI6XCJcXHUwMEJCXCIsXCJyYXJyYXBcIjpcIlxcdTI5NzVcIixcInJhcnJiXCI6XCJcXHUyMUU1XCIsXCJyYXJyYmZzXCI6XCJcXHUyOTIwXCIsXCJyYXJyY1wiOlwiXFx1MjkzM1wiLFwicmFyclwiOlwiXFx1MjE5MlwiLFwiUmFyclwiOlwiXFx1MjFBMFwiLFwickFyclwiOlwiXFx1MjFEMlwiLFwicmFycmZzXCI6XCJcXHUyOTFFXCIsXCJyYXJyaGtcIjpcIlxcdTIxQUFcIixcInJhcnJscFwiOlwiXFx1MjFBQ1wiLFwicmFycnBsXCI6XCJcXHUyOTQ1XCIsXCJyYXJyc2ltXCI6XCJcXHUyOTc0XCIsXCJSYXJydGxcIjpcIlxcdTI5MTZcIixcInJhcnJ0bFwiOlwiXFx1MjFBM1wiLFwicmFycndcIjpcIlxcdTIxOURcIixcInJhdGFpbFwiOlwiXFx1MjkxQVwiLFwickF0YWlsXCI6XCJcXHUyOTFDXCIsXCJyYXRpb1wiOlwiXFx1MjIzNlwiLFwicmF0aW9uYWxzXCI6XCJcXHUyMTFBXCIsXCJyYmFyclwiOlwiXFx1MjkwRFwiLFwickJhcnJcIjpcIlxcdTI5MEZcIixcIlJCYXJyXCI6XCJcXHUyOTEwXCIsXCJyYmJya1wiOlwiXFx1Mjc3M1wiLFwicmJyYWNlXCI6XCJ9XCIsXCJyYnJhY2tcIjpcIl1cIixcInJicmtlXCI6XCJcXHUyOThDXCIsXCJyYnJrc2xkXCI6XCJcXHUyOThFXCIsXCJyYnJrc2x1XCI6XCJcXHUyOTkwXCIsXCJSY2Fyb25cIjpcIlxcdTAxNThcIixcInJjYXJvblwiOlwiXFx1MDE1OVwiLFwiUmNlZGlsXCI6XCJcXHUwMTU2XCIsXCJyY2VkaWxcIjpcIlxcdTAxNTdcIixcInJjZWlsXCI6XCJcXHUyMzA5XCIsXCJyY3ViXCI6XCJ9XCIsXCJSY3lcIjpcIlxcdTA0MjBcIixcInJjeVwiOlwiXFx1MDQ0MFwiLFwicmRjYVwiOlwiXFx1MjkzN1wiLFwicmRsZGhhclwiOlwiXFx1Mjk2OVwiLFwicmRxdW9cIjpcIlxcdTIwMURcIixcInJkcXVvclwiOlwiXFx1MjAxRFwiLFwicmRzaFwiOlwiXFx1MjFCM1wiLFwicmVhbFwiOlwiXFx1MjExQ1wiLFwicmVhbGluZVwiOlwiXFx1MjExQlwiLFwicmVhbHBhcnRcIjpcIlxcdTIxMUNcIixcInJlYWxzXCI6XCJcXHUyMTFEXCIsXCJSZVwiOlwiXFx1MjExQ1wiLFwicmVjdFwiOlwiXFx1MjVBRFwiLFwicmVnXCI6XCJcXHUwMEFFXCIsXCJSRUdcIjpcIlxcdTAwQUVcIixcIlJldmVyc2VFbGVtZW50XCI6XCJcXHUyMjBCXCIsXCJSZXZlcnNlRXF1aWxpYnJpdW1cIjpcIlxcdTIxQ0JcIixcIlJldmVyc2VVcEVxdWlsaWJyaXVtXCI6XCJcXHUyOTZGXCIsXCJyZmlzaHRcIjpcIlxcdTI5N0RcIixcInJmbG9vclwiOlwiXFx1MjMwQlwiLFwicmZyXCI6XCJcXHVEODM1XFx1REQyRlwiLFwiUmZyXCI6XCJcXHUyMTFDXCIsXCJySGFyXCI6XCJcXHUyOTY0XCIsXCJyaGFyZFwiOlwiXFx1MjFDMVwiLFwicmhhcnVcIjpcIlxcdTIxQzBcIixcInJoYXJ1bFwiOlwiXFx1Mjk2Q1wiLFwiUmhvXCI6XCJcXHUwM0ExXCIsXCJyaG9cIjpcIlxcdTAzQzFcIixcInJob3ZcIjpcIlxcdTAzRjFcIixcIlJpZ2h0QW5nbGVCcmFja2V0XCI6XCJcXHUyN0U5XCIsXCJSaWdodEFycm93QmFyXCI6XCJcXHUyMUU1XCIsXCJyaWdodGFycm93XCI6XCJcXHUyMTkyXCIsXCJSaWdodEFycm93XCI6XCJcXHUyMTkyXCIsXCJSaWdodGFycm93XCI6XCJcXHUyMUQyXCIsXCJSaWdodEFycm93TGVmdEFycm93XCI6XCJcXHUyMUM0XCIsXCJyaWdodGFycm93dGFpbFwiOlwiXFx1MjFBM1wiLFwiUmlnaHRDZWlsaW5nXCI6XCJcXHUyMzA5XCIsXCJSaWdodERvdWJsZUJyYWNrZXRcIjpcIlxcdTI3RTdcIixcIlJpZ2h0RG93blRlZVZlY3RvclwiOlwiXFx1Mjk1RFwiLFwiUmlnaHREb3duVmVjdG9yQmFyXCI6XCJcXHUyOTU1XCIsXCJSaWdodERvd25WZWN0b3JcIjpcIlxcdTIxQzJcIixcIlJpZ2h0Rmxvb3JcIjpcIlxcdTIzMEJcIixcInJpZ2h0aGFycG9vbmRvd25cIjpcIlxcdTIxQzFcIixcInJpZ2h0aGFycG9vbnVwXCI6XCJcXHUyMUMwXCIsXCJyaWdodGxlZnRhcnJvd3NcIjpcIlxcdTIxQzRcIixcInJpZ2h0bGVmdGhhcnBvb25zXCI6XCJcXHUyMUNDXCIsXCJyaWdodHJpZ2h0YXJyb3dzXCI6XCJcXHUyMUM5XCIsXCJyaWdodHNxdWlnYXJyb3dcIjpcIlxcdTIxOURcIixcIlJpZ2h0VGVlQXJyb3dcIjpcIlxcdTIxQTZcIixcIlJpZ2h0VGVlXCI6XCJcXHUyMkEyXCIsXCJSaWdodFRlZVZlY3RvclwiOlwiXFx1Mjk1QlwiLFwicmlnaHR0aHJlZXRpbWVzXCI6XCJcXHUyMkNDXCIsXCJSaWdodFRyaWFuZ2xlQmFyXCI6XCJcXHUyOUQwXCIsXCJSaWdodFRyaWFuZ2xlXCI6XCJcXHUyMkIzXCIsXCJSaWdodFRyaWFuZ2xlRXF1YWxcIjpcIlxcdTIyQjVcIixcIlJpZ2h0VXBEb3duVmVjdG9yXCI6XCJcXHUyOTRGXCIsXCJSaWdodFVwVGVlVmVjdG9yXCI6XCJcXHUyOTVDXCIsXCJSaWdodFVwVmVjdG9yQmFyXCI6XCJcXHUyOTU0XCIsXCJSaWdodFVwVmVjdG9yXCI6XCJcXHUyMUJFXCIsXCJSaWdodFZlY3RvckJhclwiOlwiXFx1Mjk1M1wiLFwiUmlnaHRWZWN0b3JcIjpcIlxcdTIxQzBcIixcInJpbmdcIjpcIlxcdTAyREFcIixcInJpc2luZ2RvdHNlcVwiOlwiXFx1MjI1M1wiLFwicmxhcnJcIjpcIlxcdTIxQzRcIixcInJsaGFyXCI6XCJcXHUyMUNDXCIsXCJybG1cIjpcIlxcdTIwMEZcIixcInJtb3VzdGFjaGVcIjpcIlxcdTIzQjFcIixcInJtb3VzdFwiOlwiXFx1MjNCMVwiLFwicm5taWRcIjpcIlxcdTJBRUVcIixcInJvYW5nXCI6XCJcXHUyN0VEXCIsXCJyb2FyclwiOlwiXFx1MjFGRVwiLFwicm9icmtcIjpcIlxcdTI3RTdcIixcInJvcGFyXCI6XCJcXHUyOTg2XCIsXCJyb3BmXCI6XCJcXHVEODM1XFx1REQ2M1wiLFwiUm9wZlwiOlwiXFx1MjExRFwiLFwicm9wbHVzXCI6XCJcXHUyQTJFXCIsXCJyb3RpbWVzXCI6XCJcXHUyQTM1XCIsXCJSb3VuZEltcGxpZXNcIjpcIlxcdTI5NzBcIixcInJwYXJcIjpcIilcIixcInJwYXJndFwiOlwiXFx1Mjk5NFwiLFwicnBwb2xpbnRcIjpcIlxcdTJBMTJcIixcInJyYXJyXCI6XCJcXHUyMUM5XCIsXCJScmlnaHRhcnJvd1wiOlwiXFx1MjFEQlwiLFwicnNhcXVvXCI6XCJcXHUyMDNBXCIsXCJyc2NyXCI6XCJcXHVEODM1XFx1RENDN1wiLFwiUnNjclwiOlwiXFx1MjExQlwiLFwicnNoXCI6XCJcXHUyMUIxXCIsXCJSc2hcIjpcIlxcdTIxQjFcIixcInJzcWJcIjpcIl1cIixcInJzcXVvXCI6XCJcXHUyMDE5XCIsXCJyc3F1b3JcIjpcIlxcdTIwMTlcIixcInJ0aHJlZVwiOlwiXFx1MjJDQ1wiLFwicnRpbWVzXCI6XCJcXHUyMkNBXCIsXCJydHJpXCI6XCJcXHUyNUI5XCIsXCJydHJpZVwiOlwiXFx1MjJCNVwiLFwicnRyaWZcIjpcIlxcdTI1QjhcIixcInJ0cmlsdHJpXCI6XCJcXHUyOUNFXCIsXCJSdWxlRGVsYXllZFwiOlwiXFx1MjlGNFwiLFwicnVsdWhhclwiOlwiXFx1Mjk2OFwiLFwicnhcIjpcIlxcdTIxMUVcIixcIlNhY3V0ZVwiOlwiXFx1MDE1QVwiLFwic2FjdXRlXCI6XCJcXHUwMTVCXCIsXCJzYnF1b1wiOlwiXFx1MjAxQVwiLFwic2NhcFwiOlwiXFx1MkFCOFwiLFwiU2Nhcm9uXCI6XCJcXHUwMTYwXCIsXCJzY2Fyb25cIjpcIlxcdTAxNjFcIixcIlNjXCI6XCJcXHUyQUJDXCIsXCJzY1wiOlwiXFx1MjI3QlwiLFwic2NjdWVcIjpcIlxcdTIyN0RcIixcInNjZVwiOlwiXFx1MkFCMFwiLFwic2NFXCI6XCJcXHUyQUI0XCIsXCJTY2VkaWxcIjpcIlxcdTAxNUVcIixcInNjZWRpbFwiOlwiXFx1MDE1RlwiLFwiU2NpcmNcIjpcIlxcdTAxNUNcIixcInNjaXJjXCI6XCJcXHUwMTVEXCIsXCJzY25hcFwiOlwiXFx1MkFCQVwiLFwic2NuRVwiOlwiXFx1MkFCNlwiLFwic2Nuc2ltXCI6XCJcXHUyMkU5XCIsXCJzY3BvbGludFwiOlwiXFx1MkExM1wiLFwic2NzaW1cIjpcIlxcdTIyN0ZcIixcIlNjeVwiOlwiXFx1MDQyMVwiLFwic2N5XCI6XCJcXHUwNDQxXCIsXCJzZG90YlwiOlwiXFx1MjJBMVwiLFwic2RvdFwiOlwiXFx1MjJDNVwiLFwic2RvdGVcIjpcIlxcdTJBNjZcIixcInNlYXJoa1wiOlwiXFx1MjkyNVwiLFwic2VhcnJcIjpcIlxcdTIxOThcIixcInNlQXJyXCI6XCJcXHUyMUQ4XCIsXCJzZWFycm93XCI6XCJcXHUyMTk4XCIsXCJzZWN0XCI6XCJcXHUwMEE3XCIsXCJzZW1pXCI6XCI7XCIsXCJzZXN3YXJcIjpcIlxcdTI5MjlcIixcInNldG1pbnVzXCI6XCJcXHUyMjE2XCIsXCJzZXRtblwiOlwiXFx1MjIxNlwiLFwic2V4dFwiOlwiXFx1MjczNlwiLFwiU2ZyXCI6XCJcXHVEODM1XFx1REQxNlwiLFwic2ZyXCI6XCJcXHVEODM1XFx1REQzMFwiLFwic2Zyb3duXCI6XCJcXHUyMzIyXCIsXCJzaGFycFwiOlwiXFx1MjY2RlwiLFwiU0hDSGN5XCI6XCJcXHUwNDI5XCIsXCJzaGNoY3lcIjpcIlxcdTA0NDlcIixcIlNIY3lcIjpcIlxcdTA0MjhcIixcInNoY3lcIjpcIlxcdTA0NDhcIixcIlNob3J0RG93bkFycm93XCI6XCJcXHUyMTkzXCIsXCJTaG9ydExlZnRBcnJvd1wiOlwiXFx1MjE5MFwiLFwic2hvcnRtaWRcIjpcIlxcdTIyMjNcIixcInNob3J0cGFyYWxsZWxcIjpcIlxcdTIyMjVcIixcIlNob3J0UmlnaHRBcnJvd1wiOlwiXFx1MjE5MlwiLFwiU2hvcnRVcEFycm93XCI6XCJcXHUyMTkxXCIsXCJzaHlcIjpcIlxcdTAwQURcIixcIlNpZ21hXCI6XCJcXHUwM0EzXCIsXCJzaWdtYVwiOlwiXFx1MDNDM1wiLFwic2lnbWFmXCI6XCJcXHUwM0MyXCIsXCJzaWdtYXZcIjpcIlxcdTAzQzJcIixcInNpbVwiOlwiXFx1MjIzQ1wiLFwic2ltZG90XCI6XCJcXHUyQTZBXCIsXCJzaW1lXCI6XCJcXHUyMjQzXCIsXCJzaW1lcVwiOlwiXFx1MjI0M1wiLFwic2ltZ1wiOlwiXFx1MkE5RVwiLFwic2ltZ0VcIjpcIlxcdTJBQTBcIixcInNpbWxcIjpcIlxcdTJBOURcIixcInNpbWxFXCI6XCJcXHUyQTlGXCIsXCJzaW1uZVwiOlwiXFx1MjI0NlwiLFwic2ltcGx1c1wiOlwiXFx1MkEyNFwiLFwic2ltcmFyclwiOlwiXFx1Mjk3MlwiLFwic2xhcnJcIjpcIlxcdTIxOTBcIixcIlNtYWxsQ2lyY2xlXCI6XCJcXHUyMjE4XCIsXCJzbWFsbHNldG1pbnVzXCI6XCJcXHUyMjE2XCIsXCJzbWFzaHBcIjpcIlxcdTJBMzNcIixcInNtZXBhcnNsXCI6XCJcXHUyOUU0XCIsXCJzbWlkXCI6XCJcXHUyMjIzXCIsXCJzbWlsZVwiOlwiXFx1MjMyM1wiLFwic210XCI6XCJcXHUyQUFBXCIsXCJzbXRlXCI6XCJcXHUyQUFDXCIsXCJzbXRlc1wiOlwiXFx1MkFBQ1xcdUZFMDBcIixcIlNPRlRjeVwiOlwiXFx1MDQyQ1wiLFwic29mdGN5XCI6XCJcXHUwNDRDXCIsXCJzb2xiYXJcIjpcIlxcdTIzM0ZcIixcInNvbGJcIjpcIlxcdTI5QzRcIixcInNvbFwiOlwiL1wiLFwiU29wZlwiOlwiXFx1RDgzNVxcdURENEFcIixcInNvcGZcIjpcIlxcdUQ4MzVcXHVERDY0XCIsXCJzcGFkZXNcIjpcIlxcdTI2NjBcIixcInNwYWRlc3VpdFwiOlwiXFx1MjY2MFwiLFwic3BhclwiOlwiXFx1MjIyNVwiLFwic3FjYXBcIjpcIlxcdTIyOTNcIixcInNxY2Fwc1wiOlwiXFx1MjI5M1xcdUZFMDBcIixcInNxY3VwXCI6XCJcXHUyMjk0XCIsXCJzcWN1cHNcIjpcIlxcdTIyOTRcXHVGRTAwXCIsXCJTcXJ0XCI6XCJcXHUyMjFBXCIsXCJzcXN1YlwiOlwiXFx1MjI4RlwiLFwic3FzdWJlXCI6XCJcXHUyMjkxXCIsXCJzcXN1YnNldFwiOlwiXFx1MjI4RlwiLFwic3FzdWJzZXRlcVwiOlwiXFx1MjI5MVwiLFwic3FzdXBcIjpcIlxcdTIyOTBcIixcInNxc3VwZVwiOlwiXFx1MjI5MlwiLFwic3FzdXBzZXRcIjpcIlxcdTIyOTBcIixcInNxc3Vwc2V0ZXFcIjpcIlxcdTIyOTJcIixcInNxdWFyZVwiOlwiXFx1MjVBMVwiLFwiU3F1YXJlXCI6XCJcXHUyNUExXCIsXCJTcXVhcmVJbnRlcnNlY3Rpb25cIjpcIlxcdTIyOTNcIixcIlNxdWFyZVN1YnNldFwiOlwiXFx1MjI4RlwiLFwiU3F1YXJlU3Vic2V0RXF1YWxcIjpcIlxcdTIyOTFcIixcIlNxdWFyZVN1cGVyc2V0XCI6XCJcXHUyMjkwXCIsXCJTcXVhcmVTdXBlcnNldEVxdWFsXCI6XCJcXHUyMjkyXCIsXCJTcXVhcmVVbmlvblwiOlwiXFx1MjI5NFwiLFwic3F1YXJmXCI6XCJcXHUyNUFBXCIsXCJzcXVcIjpcIlxcdTI1QTFcIixcInNxdWZcIjpcIlxcdTI1QUFcIixcInNyYXJyXCI6XCJcXHUyMTkyXCIsXCJTc2NyXCI6XCJcXHVEODM1XFx1RENBRVwiLFwic3NjclwiOlwiXFx1RDgzNVxcdURDQzhcIixcInNzZXRtblwiOlwiXFx1MjIxNlwiLFwic3NtaWxlXCI6XCJcXHUyMzIzXCIsXCJzc3RhcmZcIjpcIlxcdTIyQzZcIixcIlN0YXJcIjpcIlxcdTIyQzZcIixcInN0YXJcIjpcIlxcdTI2MDZcIixcInN0YXJmXCI6XCJcXHUyNjA1XCIsXCJzdHJhaWdodGVwc2lsb25cIjpcIlxcdTAzRjVcIixcInN0cmFpZ2h0cGhpXCI6XCJcXHUwM0Q1XCIsXCJzdHJuc1wiOlwiXFx1MDBBRlwiLFwic3ViXCI6XCJcXHUyMjgyXCIsXCJTdWJcIjpcIlxcdTIyRDBcIixcInN1YmRvdFwiOlwiXFx1MkFCRFwiLFwic3ViRVwiOlwiXFx1MkFDNVwiLFwic3ViZVwiOlwiXFx1MjI4NlwiLFwic3ViZWRvdFwiOlwiXFx1MkFDM1wiLFwic3VibXVsdFwiOlwiXFx1MkFDMVwiLFwic3VibkVcIjpcIlxcdTJBQ0JcIixcInN1Ym5lXCI6XCJcXHUyMjhBXCIsXCJzdWJwbHVzXCI6XCJcXHUyQUJGXCIsXCJzdWJyYXJyXCI6XCJcXHUyOTc5XCIsXCJzdWJzZXRcIjpcIlxcdTIyODJcIixcIlN1YnNldFwiOlwiXFx1MjJEMFwiLFwic3Vic2V0ZXFcIjpcIlxcdTIyODZcIixcInN1YnNldGVxcVwiOlwiXFx1MkFDNVwiLFwiU3Vic2V0RXF1YWxcIjpcIlxcdTIyODZcIixcInN1YnNldG5lcVwiOlwiXFx1MjI4QVwiLFwic3Vic2V0bmVxcVwiOlwiXFx1MkFDQlwiLFwic3Vic2ltXCI6XCJcXHUyQUM3XCIsXCJzdWJzdWJcIjpcIlxcdTJBRDVcIixcInN1YnN1cFwiOlwiXFx1MkFEM1wiLFwic3VjY2FwcHJveFwiOlwiXFx1MkFCOFwiLFwic3VjY1wiOlwiXFx1MjI3QlwiLFwic3VjY2N1cmx5ZXFcIjpcIlxcdTIyN0RcIixcIlN1Y2NlZWRzXCI6XCJcXHUyMjdCXCIsXCJTdWNjZWVkc0VxdWFsXCI6XCJcXHUyQUIwXCIsXCJTdWNjZWVkc1NsYW50RXF1YWxcIjpcIlxcdTIyN0RcIixcIlN1Y2NlZWRzVGlsZGVcIjpcIlxcdTIyN0ZcIixcInN1Y2NlcVwiOlwiXFx1MkFCMFwiLFwic3VjY25hcHByb3hcIjpcIlxcdTJBQkFcIixcInN1Y2NuZXFxXCI6XCJcXHUyQUI2XCIsXCJzdWNjbnNpbVwiOlwiXFx1MjJFOVwiLFwic3VjY3NpbVwiOlwiXFx1MjI3RlwiLFwiU3VjaFRoYXRcIjpcIlxcdTIyMEJcIixcInN1bVwiOlwiXFx1MjIxMVwiLFwiU3VtXCI6XCJcXHUyMjExXCIsXCJzdW5nXCI6XCJcXHUyNjZBXCIsXCJzdXAxXCI6XCJcXHUwMEI5XCIsXCJzdXAyXCI6XCJcXHUwMEIyXCIsXCJzdXAzXCI6XCJcXHUwMEIzXCIsXCJzdXBcIjpcIlxcdTIyODNcIixcIlN1cFwiOlwiXFx1MjJEMVwiLFwic3VwZG90XCI6XCJcXHUyQUJFXCIsXCJzdXBkc3ViXCI6XCJcXHUyQUQ4XCIsXCJzdXBFXCI6XCJcXHUyQUM2XCIsXCJzdXBlXCI6XCJcXHUyMjg3XCIsXCJzdXBlZG90XCI6XCJcXHUyQUM0XCIsXCJTdXBlcnNldFwiOlwiXFx1MjI4M1wiLFwiU3VwZXJzZXRFcXVhbFwiOlwiXFx1MjI4N1wiLFwic3VwaHNvbFwiOlwiXFx1MjdDOVwiLFwic3VwaHN1YlwiOlwiXFx1MkFEN1wiLFwic3VwbGFyclwiOlwiXFx1Mjk3QlwiLFwic3VwbXVsdFwiOlwiXFx1MkFDMlwiLFwic3VwbkVcIjpcIlxcdTJBQ0NcIixcInN1cG5lXCI6XCJcXHUyMjhCXCIsXCJzdXBwbHVzXCI6XCJcXHUyQUMwXCIsXCJzdXBzZXRcIjpcIlxcdTIyODNcIixcIlN1cHNldFwiOlwiXFx1MjJEMVwiLFwic3Vwc2V0ZXFcIjpcIlxcdTIyODdcIixcInN1cHNldGVxcVwiOlwiXFx1MkFDNlwiLFwic3Vwc2V0bmVxXCI6XCJcXHUyMjhCXCIsXCJzdXBzZXRuZXFxXCI6XCJcXHUyQUNDXCIsXCJzdXBzaW1cIjpcIlxcdTJBQzhcIixcInN1cHN1YlwiOlwiXFx1MkFENFwiLFwic3Vwc3VwXCI6XCJcXHUyQUQ2XCIsXCJzd2FyaGtcIjpcIlxcdTI5MjZcIixcInN3YXJyXCI6XCJcXHUyMTk5XCIsXCJzd0FyclwiOlwiXFx1MjFEOVwiLFwic3dhcnJvd1wiOlwiXFx1MjE5OVwiLFwic3dud2FyXCI6XCJcXHUyOTJBXCIsXCJzemxpZ1wiOlwiXFx1MDBERlwiLFwiVGFiXCI6XCJcXHRcIixcInRhcmdldFwiOlwiXFx1MjMxNlwiLFwiVGF1XCI6XCJcXHUwM0E0XCIsXCJ0YXVcIjpcIlxcdTAzQzRcIixcInRicmtcIjpcIlxcdTIzQjRcIixcIlRjYXJvblwiOlwiXFx1MDE2NFwiLFwidGNhcm9uXCI6XCJcXHUwMTY1XCIsXCJUY2VkaWxcIjpcIlxcdTAxNjJcIixcInRjZWRpbFwiOlwiXFx1MDE2M1wiLFwiVGN5XCI6XCJcXHUwNDIyXCIsXCJ0Y3lcIjpcIlxcdTA0NDJcIixcInRkb3RcIjpcIlxcdTIwREJcIixcInRlbHJlY1wiOlwiXFx1MjMxNVwiLFwiVGZyXCI6XCJcXHVEODM1XFx1REQxN1wiLFwidGZyXCI6XCJcXHVEODM1XFx1REQzMVwiLFwidGhlcmU0XCI6XCJcXHUyMjM0XCIsXCJ0aGVyZWZvcmVcIjpcIlxcdTIyMzRcIixcIlRoZXJlZm9yZVwiOlwiXFx1MjIzNFwiLFwiVGhldGFcIjpcIlxcdTAzOThcIixcInRoZXRhXCI6XCJcXHUwM0I4XCIsXCJ0aGV0YXN5bVwiOlwiXFx1MDNEMVwiLFwidGhldGF2XCI6XCJcXHUwM0QxXCIsXCJ0aGlja2FwcHJveFwiOlwiXFx1MjI0OFwiLFwidGhpY2tzaW1cIjpcIlxcdTIyM0NcIixcIlRoaWNrU3BhY2VcIjpcIlxcdTIwNUZcXHUyMDBBXCIsXCJUaGluU3BhY2VcIjpcIlxcdTIwMDlcIixcInRoaW5zcFwiOlwiXFx1MjAwOVwiLFwidGhrYXBcIjpcIlxcdTIyNDhcIixcInRoa3NpbVwiOlwiXFx1MjIzQ1wiLFwiVEhPUk5cIjpcIlxcdTAwREVcIixcInRob3JuXCI6XCJcXHUwMEZFXCIsXCJ0aWxkZVwiOlwiXFx1MDJEQ1wiLFwiVGlsZGVcIjpcIlxcdTIyM0NcIixcIlRpbGRlRXF1YWxcIjpcIlxcdTIyNDNcIixcIlRpbGRlRnVsbEVxdWFsXCI6XCJcXHUyMjQ1XCIsXCJUaWxkZVRpbGRlXCI6XCJcXHUyMjQ4XCIsXCJ0aW1lc2JhclwiOlwiXFx1MkEzMVwiLFwidGltZXNiXCI6XCJcXHUyMkEwXCIsXCJ0aW1lc1wiOlwiXFx1MDBEN1wiLFwidGltZXNkXCI6XCJcXHUyQTMwXCIsXCJ0aW50XCI6XCJcXHUyMjJEXCIsXCJ0b2VhXCI6XCJcXHUyOTI4XCIsXCJ0b3Bib3RcIjpcIlxcdTIzMzZcIixcInRvcGNpclwiOlwiXFx1MkFGMVwiLFwidG9wXCI6XCJcXHUyMkE0XCIsXCJUb3BmXCI6XCJcXHVEODM1XFx1REQ0QlwiLFwidG9wZlwiOlwiXFx1RDgzNVxcdURENjVcIixcInRvcGZvcmtcIjpcIlxcdTJBREFcIixcInRvc2FcIjpcIlxcdTI5MjlcIixcInRwcmltZVwiOlwiXFx1MjAzNFwiLFwidHJhZGVcIjpcIlxcdTIxMjJcIixcIlRSQURFXCI6XCJcXHUyMTIyXCIsXCJ0cmlhbmdsZVwiOlwiXFx1MjVCNVwiLFwidHJpYW5nbGVkb3duXCI6XCJcXHUyNUJGXCIsXCJ0cmlhbmdsZWxlZnRcIjpcIlxcdTI1QzNcIixcInRyaWFuZ2xlbGVmdGVxXCI6XCJcXHUyMkI0XCIsXCJ0cmlhbmdsZXFcIjpcIlxcdTIyNUNcIixcInRyaWFuZ2xlcmlnaHRcIjpcIlxcdTI1QjlcIixcInRyaWFuZ2xlcmlnaHRlcVwiOlwiXFx1MjJCNVwiLFwidHJpZG90XCI6XCJcXHUyNUVDXCIsXCJ0cmllXCI6XCJcXHUyMjVDXCIsXCJ0cmltaW51c1wiOlwiXFx1MkEzQVwiLFwiVHJpcGxlRG90XCI6XCJcXHUyMERCXCIsXCJ0cmlwbHVzXCI6XCJcXHUyQTM5XCIsXCJ0cmlzYlwiOlwiXFx1MjlDRFwiLFwidHJpdGltZVwiOlwiXFx1MkEzQlwiLFwidHJwZXppdW1cIjpcIlxcdTIzRTJcIixcIlRzY3JcIjpcIlxcdUQ4MzVcXHVEQ0FGXCIsXCJ0c2NyXCI6XCJcXHVEODM1XFx1RENDOVwiLFwiVFNjeVwiOlwiXFx1MDQyNlwiLFwidHNjeVwiOlwiXFx1MDQ0NlwiLFwiVFNIY3lcIjpcIlxcdTA0MEJcIixcInRzaGN5XCI6XCJcXHUwNDVCXCIsXCJUc3Ryb2tcIjpcIlxcdTAxNjZcIixcInRzdHJva1wiOlwiXFx1MDE2N1wiLFwidHdpeHRcIjpcIlxcdTIyNkNcIixcInR3b2hlYWRsZWZ0YXJyb3dcIjpcIlxcdTIxOUVcIixcInR3b2hlYWRyaWdodGFycm93XCI6XCJcXHUyMUEwXCIsXCJVYWN1dGVcIjpcIlxcdTAwREFcIixcInVhY3V0ZVwiOlwiXFx1MDBGQVwiLFwidWFyclwiOlwiXFx1MjE5MVwiLFwiVWFyclwiOlwiXFx1MjE5RlwiLFwidUFyclwiOlwiXFx1MjFEMVwiLFwiVWFycm9jaXJcIjpcIlxcdTI5NDlcIixcIlVicmN5XCI6XCJcXHUwNDBFXCIsXCJ1YnJjeVwiOlwiXFx1MDQ1RVwiLFwiVWJyZXZlXCI6XCJcXHUwMTZDXCIsXCJ1YnJldmVcIjpcIlxcdTAxNkRcIixcIlVjaXJjXCI6XCJcXHUwMERCXCIsXCJ1Y2lyY1wiOlwiXFx1MDBGQlwiLFwiVWN5XCI6XCJcXHUwNDIzXCIsXCJ1Y3lcIjpcIlxcdTA0NDNcIixcInVkYXJyXCI6XCJcXHUyMUM1XCIsXCJVZGJsYWNcIjpcIlxcdTAxNzBcIixcInVkYmxhY1wiOlwiXFx1MDE3MVwiLFwidWRoYXJcIjpcIlxcdTI5NkVcIixcInVmaXNodFwiOlwiXFx1Mjk3RVwiLFwiVWZyXCI6XCJcXHVEODM1XFx1REQxOFwiLFwidWZyXCI6XCJcXHVEODM1XFx1REQzMlwiLFwiVWdyYXZlXCI6XCJcXHUwMEQ5XCIsXCJ1Z3JhdmVcIjpcIlxcdTAwRjlcIixcInVIYXJcIjpcIlxcdTI5NjNcIixcInVoYXJsXCI6XCJcXHUyMUJGXCIsXCJ1aGFyclwiOlwiXFx1MjFCRVwiLFwidWhibGtcIjpcIlxcdTI1ODBcIixcInVsY29yblwiOlwiXFx1MjMxQ1wiLFwidWxjb3JuZXJcIjpcIlxcdTIzMUNcIixcInVsY3JvcFwiOlwiXFx1MjMwRlwiLFwidWx0cmlcIjpcIlxcdTI1RjhcIixcIlVtYWNyXCI6XCJcXHUwMTZBXCIsXCJ1bWFjclwiOlwiXFx1MDE2QlwiLFwidW1sXCI6XCJcXHUwMEE4XCIsXCJVbmRlckJhclwiOlwiX1wiLFwiVW5kZXJCcmFjZVwiOlwiXFx1MjNERlwiLFwiVW5kZXJCcmFja2V0XCI6XCJcXHUyM0I1XCIsXCJVbmRlclBhcmVudGhlc2lzXCI6XCJcXHUyM0REXCIsXCJVbmlvblwiOlwiXFx1MjJDM1wiLFwiVW5pb25QbHVzXCI6XCJcXHUyMjhFXCIsXCJVb2dvblwiOlwiXFx1MDE3MlwiLFwidW9nb25cIjpcIlxcdTAxNzNcIixcIlVvcGZcIjpcIlxcdUQ4MzVcXHVERDRDXCIsXCJ1b3BmXCI6XCJcXHVEODM1XFx1REQ2NlwiLFwiVXBBcnJvd0JhclwiOlwiXFx1MjkxMlwiLFwidXBhcnJvd1wiOlwiXFx1MjE5MVwiLFwiVXBBcnJvd1wiOlwiXFx1MjE5MVwiLFwiVXBhcnJvd1wiOlwiXFx1MjFEMVwiLFwiVXBBcnJvd0Rvd25BcnJvd1wiOlwiXFx1MjFDNVwiLFwidXBkb3duYXJyb3dcIjpcIlxcdTIxOTVcIixcIlVwRG93bkFycm93XCI6XCJcXHUyMTk1XCIsXCJVcGRvd25hcnJvd1wiOlwiXFx1MjFENVwiLFwiVXBFcXVpbGlicml1bVwiOlwiXFx1Mjk2RVwiLFwidXBoYXJwb29ubGVmdFwiOlwiXFx1MjFCRlwiLFwidXBoYXJwb29ucmlnaHRcIjpcIlxcdTIxQkVcIixcInVwbHVzXCI6XCJcXHUyMjhFXCIsXCJVcHBlckxlZnRBcnJvd1wiOlwiXFx1MjE5NlwiLFwiVXBwZXJSaWdodEFycm93XCI6XCJcXHUyMTk3XCIsXCJ1cHNpXCI6XCJcXHUwM0M1XCIsXCJVcHNpXCI6XCJcXHUwM0QyXCIsXCJ1cHNpaFwiOlwiXFx1MDNEMlwiLFwiVXBzaWxvblwiOlwiXFx1MDNBNVwiLFwidXBzaWxvblwiOlwiXFx1MDNDNVwiLFwiVXBUZWVBcnJvd1wiOlwiXFx1MjFBNVwiLFwiVXBUZWVcIjpcIlxcdTIyQTVcIixcInVwdXBhcnJvd3NcIjpcIlxcdTIxQzhcIixcInVyY29yblwiOlwiXFx1MjMxRFwiLFwidXJjb3JuZXJcIjpcIlxcdTIzMURcIixcInVyY3JvcFwiOlwiXFx1MjMwRVwiLFwiVXJpbmdcIjpcIlxcdTAxNkVcIixcInVyaW5nXCI6XCJcXHUwMTZGXCIsXCJ1cnRyaVwiOlwiXFx1MjVGOVwiLFwiVXNjclwiOlwiXFx1RDgzNVxcdURDQjBcIixcInVzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NBXCIsXCJ1dGRvdFwiOlwiXFx1MjJGMFwiLFwiVXRpbGRlXCI6XCJcXHUwMTY4XCIsXCJ1dGlsZGVcIjpcIlxcdTAxNjlcIixcInV0cmlcIjpcIlxcdTI1QjVcIixcInV0cmlmXCI6XCJcXHUyNUI0XCIsXCJ1dWFyclwiOlwiXFx1MjFDOFwiLFwiVXVtbFwiOlwiXFx1MDBEQ1wiLFwidXVtbFwiOlwiXFx1MDBGQ1wiLFwidXdhbmdsZVwiOlwiXFx1MjlBN1wiLFwidmFuZ3J0XCI6XCJcXHUyOTlDXCIsXCJ2YXJlcHNpbG9uXCI6XCJcXHUwM0Y1XCIsXCJ2YXJrYXBwYVwiOlwiXFx1MDNGMFwiLFwidmFybm90aGluZ1wiOlwiXFx1MjIwNVwiLFwidmFycGhpXCI6XCJcXHUwM0Q1XCIsXCJ2YXJwaVwiOlwiXFx1MDNENlwiLFwidmFycHJvcHRvXCI6XCJcXHUyMjFEXCIsXCJ2YXJyXCI6XCJcXHUyMTk1XCIsXCJ2QXJyXCI6XCJcXHUyMUQ1XCIsXCJ2YXJyaG9cIjpcIlxcdTAzRjFcIixcInZhcnNpZ21hXCI6XCJcXHUwM0MyXCIsXCJ2YXJzdWJzZXRuZXFcIjpcIlxcdTIyOEFcXHVGRTAwXCIsXCJ2YXJzdWJzZXRuZXFxXCI6XCJcXHUyQUNCXFx1RkUwMFwiLFwidmFyc3Vwc2V0bmVxXCI6XCJcXHUyMjhCXFx1RkUwMFwiLFwidmFyc3Vwc2V0bmVxcVwiOlwiXFx1MkFDQ1xcdUZFMDBcIixcInZhcnRoZXRhXCI6XCJcXHUwM0QxXCIsXCJ2YXJ0cmlhbmdsZWxlZnRcIjpcIlxcdTIyQjJcIixcInZhcnRyaWFuZ2xlcmlnaHRcIjpcIlxcdTIyQjNcIixcInZCYXJcIjpcIlxcdTJBRThcIixcIlZiYXJcIjpcIlxcdTJBRUJcIixcInZCYXJ2XCI6XCJcXHUyQUU5XCIsXCJWY3lcIjpcIlxcdTA0MTJcIixcInZjeVwiOlwiXFx1MDQzMlwiLFwidmRhc2hcIjpcIlxcdTIyQTJcIixcInZEYXNoXCI6XCJcXHUyMkE4XCIsXCJWZGFzaFwiOlwiXFx1MjJBOVwiLFwiVkRhc2hcIjpcIlxcdTIyQUJcIixcIlZkYXNobFwiOlwiXFx1MkFFNlwiLFwidmVlYmFyXCI6XCJcXHUyMkJCXCIsXCJ2ZWVcIjpcIlxcdTIyMjhcIixcIlZlZVwiOlwiXFx1MjJDMVwiLFwidmVlZXFcIjpcIlxcdTIyNUFcIixcInZlbGxpcFwiOlwiXFx1MjJFRVwiLFwidmVyYmFyXCI6XCJ8XCIsXCJWZXJiYXJcIjpcIlxcdTIwMTZcIixcInZlcnRcIjpcInxcIixcIlZlcnRcIjpcIlxcdTIwMTZcIixcIlZlcnRpY2FsQmFyXCI6XCJcXHUyMjIzXCIsXCJWZXJ0aWNhbExpbmVcIjpcInxcIixcIlZlcnRpY2FsU2VwYXJhdG9yXCI6XCJcXHUyNzU4XCIsXCJWZXJ0aWNhbFRpbGRlXCI6XCJcXHUyMjQwXCIsXCJWZXJ5VGhpblNwYWNlXCI6XCJcXHUyMDBBXCIsXCJWZnJcIjpcIlxcdUQ4MzVcXHVERDE5XCIsXCJ2ZnJcIjpcIlxcdUQ4MzVcXHVERDMzXCIsXCJ2bHRyaVwiOlwiXFx1MjJCMlwiLFwidm5zdWJcIjpcIlxcdTIyODJcXHUyMEQyXCIsXCJ2bnN1cFwiOlwiXFx1MjI4M1xcdTIwRDJcIixcIlZvcGZcIjpcIlxcdUQ4MzVcXHVERDREXCIsXCJ2b3BmXCI6XCJcXHVEODM1XFx1REQ2N1wiLFwidnByb3BcIjpcIlxcdTIyMURcIixcInZydHJpXCI6XCJcXHUyMkIzXCIsXCJWc2NyXCI6XCJcXHVEODM1XFx1RENCMVwiLFwidnNjclwiOlwiXFx1RDgzNVxcdURDQ0JcIixcInZzdWJuRVwiOlwiXFx1MkFDQlxcdUZFMDBcIixcInZzdWJuZVwiOlwiXFx1MjI4QVxcdUZFMDBcIixcInZzdXBuRVwiOlwiXFx1MkFDQ1xcdUZFMDBcIixcInZzdXBuZVwiOlwiXFx1MjI4QlxcdUZFMDBcIixcIlZ2ZGFzaFwiOlwiXFx1MjJBQVwiLFwidnppZ3phZ1wiOlwiXFx1Mjk5QVwiLFwiV2NpcmNcIjpcIlxcdTAxNzRcIixcIndjaXJjXCI6XCJcXHUwMTc1XCIsXCJ3ZWRiYXJcIjpcIlxcdTJBNUZcIixcIndlZGdlXCI6XCJcXHUyMjI3XCIsXCJXZWRnZVwiOlwiXFx1MjJDMFwiLFwid2VkZ2VxXCI6XCJcXHUyMjU5XCIsXCJ3ZWllcnBcIjpcIlxcdTIxMThcIixcIldmclwiOlwiXFx1RDgzNVxcdUREMUFcIixcIndmclwiOlwiXFx1RDgzNVxcdUREMzRcIixcIldvcGZcIjpcIlxcdUQ4MzVcXHVERDRFXCIsXCJ3b3BmXCI6XCJcXHVEODM1XFx1REQ2OFwiLFwid3BcIjpcIlxcdTIxMThcIixcIndyXCI6XCJcXHUyMjQwXCIsXCJ3cmVhdGhcIjpcIlxcdTIyNDBcIixcIldzY3JcIjpcIlxcdUQ4MzVcXHVEQ0IyXCIsXCJ3c2NyXCI6XCJcXHVEODM1XFx1RENDQ1wiLFwieGNhcFwiOlwiXFx1MjJDMlwiLFwieGNpcmNcIjpcIlxcdTI1RUZcIixcInhjdXBcIjpcIlxcdTIyQzNcIixcInhkdHJpXCI6XCJcXHUyNUJEXCIsXCJYZnJcIjpcIlxcdUQ4MzVcXHVERDFCXCIsXCJ4ZnJcIjpcIlxcdUQ4MzVcXHVERDM1XCIsXCJ4aGFyclwiOlwiXFx1MjdGN1wiLFwieGhBcnJcIjpcIlxcdTI3RkFcIixcIlhpXCI6XCJcXHUwMzlFXCIsXCJ4aVwiOlwiXFx1MDNCRVwiLFwieGxhcnJcIjpcIlxcdTI3RjVcIixcInhsQXJyXCI6XCJcXHUyN0Y4XCIsXCJ4bWFwXCI6XCJcXHUyN0ZDXCIsXCJ4bmlzXCI6XCJcXHUyMkZCXCIsXCJ4b2RvdFwiOlwiXFx1MkEwMFwiLFwiWG9wZlwiOlwiXFx1RDgzNVxcdURENEZcIixcInhvcGZcIjpcIlxcdUQ4MzVcXHVERDY5XCIsXCJ4b3BsdXNcIjpcIlxcdTJBMDFcIixcInhvdGltZVwiOlwiXFx1MkEwMlwiLFwieHJhcnJcIjpcIlxcdTI3RjZcIixcInhyQXJyXCI6XCJcXHUyN0Y5XCIsXCJYc2NyXCI6XCJcXHVEODM1XFx1RENCM1wiLFwieHNjclwiOlwiXFx1RDgzNVxcdURDQ0RcIixcInhzcWN1cFwiOlwiXFx1MkEwNlwiLFwieHVwbHVzXCI6XCJcXHUyQTA0XCIsXCJ4dXRyaVwiOlwiXFx1MjVCM1wiLFwieHZlZVwiOlwiXFx1MjJDMVwiLFwieHdlZGdlXCI6XCJcXHUyMkMwXCIsXCJZYWN1dGVcIjpcIlxcdTAwRERcIixcInlhY3V0ZVwiOlwiXFx1MDBGRFwiLFwiWUFjeVwiOlwiXFx1MDQyRlwiLFwieWFjeVwiOlwiXFx1MDQ0RlwiLFwiWWNpcmNcIjpcIlxcdTAxNzZcIixcInljaXJjXCI6XCJcXHUwMTc3XCIsXCJZY3lcIjpcIlxcdTA0MkJcIixcInljeVwiOlwiXFx1MDQ0QlwiLFwieWVuXCI6XCJcXHUwMEE1XCIsXCJZZnJcIjpcIlxcdUQ4MzVcXHVERDFDXCIsXCJ5ZnJcIjpcIlxcdUQ4MzVcXHVERDM2XCIsXCJZSWN5XCI6XCJcXHUwNDA3XCIsXCJ5aWN5XCI6XCJcXHUwNDU3XCIsXCJZb3BmXCI6XCJcXHVEODM1XFx1REQ1MFwiLFwieW9wZlwiOlwiXFx1RDgzNVxcdURENkFcIixcIllzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I0XCIsXCJ5c2NyXCI6XCJcXHVEODM1XFx1RENDRVwiLFwiWVVjeVwiOlwiXFx1MDQyRVwiLFwieXVjeVwiOlwiXFx1MDQ0RVwiLFwieXVtbFwiOlwiXFx1MDBGRlwiLFwiWXVtbFwiOlwiXFx1MDE3OFwiLFwiWmFjdXRlXCI6XCJcXHUwMTc5XCIsXCJ6YWN1dGVcIjpcIlxcdTAxN0FcIixcIlpjYXJvblwiOlwiXFx1MDE3RFwiLFwiemNhcm9uXCI6XCJcXHUwMTdFXCIsXCJaY3lcIjpcIlxcdTA0MTdcIixcInpjeVwiOlwiXFx1MDQzN1wiLFwiWmRvdFwiOlwiXFx1MDE3QlwiLFwiemRvdFwiOlwiXFx1MDE3Q1wiLFwiemVldHJmXCI6XCJcXHUyMTI4XCIsXCJaZXJvV2lkdGhTcGFjZVwiOlwiXFx1MjAwQlwiLFwiWmV0YVwiOlwiXFx1MDM5NlwiLFwiemV0YVwiOlwiXFx1MDNCNlwiLFwiemZyXCI6XCJcXHVEODM1XFx1REQzN1wiLFwiWmZyXCI6XCJcXHUyMTI4XCIsXCJaSGN5XCI6XCJcXHUwNDE2XCIsXCJ6aGN5XCI6XCJcXHUwNDM2XCIsXCJ6aWdyYXJyXCI6XCJcXHUyMUREXCIsXCJ6b3BmXCI6XCJcXHVEODM1XFx1REQ2QlwiLFwiWm9wZlwiOlwiXFx1MjEyNFwiLFwiWnNjclwiOlwiXFx1RDgzNVxcdURDQjVcIixcInpzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NGXCIsXCJ6d2pcIjpcIlxcdTIwMERcIixcInp3bmpcIjpcIlxcdTIwMENcIn0iLCIndXNlIHN0cmljdCc7XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEhlbHBlcnNcblxuLy8gTWVyZ2Ugb2JqZWN0c1xuLy9cbmZ1bmN0aW9uIGFzc2lnbihvYmogLypmcm9tMSwgZnJvbTIsIGZyb20zLCAuLi4qLykge1xuICB2YXIgc291cmNlcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgc291cmNlcy5mb3JFYWNoKGZ1bmN0aW9uIChzb3VyY2UpIHtcbiAgICBpZiAoIXNvdXJjZSkgeyByZXR1cm47IH1cblxuICAgIE9iamVjdC5rZXlzKHNvdXJjZSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICBvYmpba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBfY2xhc3Mob2JqKSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTsgfVxuZnVuY3Rpb24gaXNTdHJpbmcob2JqKSB7IHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7IH1cbmZ1bmN0aW9uIGlzT2JqZWN0KG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nOyB9XG5mdW5jdGlvbiBpc1JlZ0V4cChvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBSZWdFeHBdJzsgfVxuZnVuY3Rpb24gaXNGdW5jdGlvbihvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBGdW5jdGlvbl0nOyB9XG5cblxuZnVuY3Rpb24gZXNjYXBlUkUoc3RyKSB7IHJldHVybiBzdHIucmVwbGFjZSgvWy4/KiteJFtcXF1cXFxcKCl7fXwtXS9nLCAnXFxcXCQmJyk7IH1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG52YXIgZGVmYXVsdE9wdGlvbnMgPSB7XG4gIGZ1enp5TGluazogdHJ1ZSxcbiAgZnV6enlFbWFpbDogdHJ1ZSxcbiAgZnV6enlJUDogZmFsc2Vcbn07XG5cblxuZnVuY3Rpb24gaXNPcHRpb25zT2JqKG9iaikge1xuICByZXR1cm4gT2JqZWN0LmtleXMob2JqIHx8IHt9KS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgaykge1xuICAgIHJldHVybiBhY2MgfHwgZGVmYXVsdE9wdGlvbnMuaGFzT3duUHJvcGVydHkoayk7XG4gIH0sIGZhbHNlKTtcbn1cblxuXG52YXIgZGVmYXVsdFNjaGVtYXMgPSB7XG4gICdodHRwOic6IHtcbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHRleHQsIHBvcywgc2VsZikge1xuICAgICAgdmFyIHRhaWwgPSB0ZXh0LnNsaWNlKHBvcyk7XG5cbiAgICAgIGlmICghc2VsZi5yZS5odHRwKSB7XG4gICAgICAgIC8vIGNvbXBpbGUgbGF6aWx5LCBiZWNhdXNlIFwiaG9zdFwiLWNvbnRhaW5pbmcgdmFyaWFibGVzIGNhbiBjaGFuZ2Ugb24gdGxkcyB1cGRhdGUuXG4gICAgICAgIHNlbGYucmUuaHR0cCA9ICBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeXFxcXC9cXFxcLycgKyBzZWxmLnJlLnNyY19hdXRoICsgc2VsZi5yZS5zcmNfaG9zdF9wb3J0X3N0cmljdCArIHNlbGYucmUuc3JjX3BhdGgsICdpJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGYucmUuaHR0cC50ZXN0KHRhaWwpKSB7XG4gICAgICAgIHJldHVybiB0YWlsLm1hdGNoKHNlbGYucmUuaHR0cClbMF0ubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICB9LFxuICAnaHR0cHM6JzogICdodHRwOicsXG4gICdmdHA6JzogICAgJ2h0dHA6JyxcbiAgJy8vJzogICAgICB7XG4gICAgdmFsaWRhdGU6IGZ1bmN0aW9uICh0ZXh0LCBwb3MsIHNlbGYpIHtcbiAgICAgIHZhciB0YWlsID0gdGV4dC5zbGljZShwb3MpO1xuXG4gICAgICBpZiAoIXNlbGYucmUubm9faHR0cCkge1xuICAgICAgLy8gY29tcGlsZSBsYXppbHksIGJlY2F1c2UgXCJob3N0XCItY29udGFpbmluZyB2YXJpYWJsZXMgY2FuIGNoYW5nZSBvbiB0bGRzIHVwZGF0ZS5cbiAgICAgICAgc2VsZi5yZS5ub19odHRwID0gIG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14nICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19hdXRoICtcbiAgICAgICAgICAvLyBEb24ndCBhbGxvdyBzaW5nbGUtbGV2ZWwgZG9tYWlucywgYmVjYXVzZSBvZiBmYWxzZSBwb3NpdGl2ZXMgbGlrZSAnLy90ZXN0J1xuICAgICAgICAgIC8vIHdpdGggY29kZSBjb21tZW50c1xuICAgICAgICAgICcoPzpsb2NhbGhvc3R8KD86KD86JyArIHNlbGYucmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKycgKyBzZWxmLnJlLnNyY19kb21haW5fcm9vdCArICcpJyArXG4gICAgICAgICAgc2VsZi5yZS5zcmNfcG9ydCArXG4gICAgICAgICAgc2VsZi5yZS5zcmNfaG9zdF90ZXJtaW5hdG9yICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19wYXRoLFxuXG4gICAgICAgICAgJ2knXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzZWxmLnJlLm5vX2h0dHAudGVzdCh0YWlsKSkge1xuICAgICAgICAvLyBzaG91bGQgbm90IGJlIGA6Ly9gICYgYC8vL2AsIHRoYXQgcHJvdGVjdHMgZnJvbSBlcnJvcnMgaW4gcHJvdG9jb2wgbmFtZVxuICAgICAgICBpZiAocG9zID49IDMgJiYgdGV4dFtwb3MgLSAzXSA9PT0gJzonKSB7IHJldHVybiAwOyB9XG4gICAgICAgIGlmIChwb3MgPj0gMyAmJiB0ZXh0W3BvcyAtIDNdID09PSAnLycpIHsgcmV0dXJuIDA7IH1cbiAgICAgICAgcmV0dXJuIHRhaWwubWF0Y2goc2VsZi5yZS5ub19odHRwKVswXS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH0sXG4gICdtYWlsdG86Jzoge1xuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAodGV4dCwgcG9zLCBzZWxmKSB7XG4gICAgICB2YXIgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgICAgaWYgKCFzZWxmLnJlLm1haWx0bykge1xuICAgICAgICBzZWxmLnJlLm1haWx0byA9ICBuZXcgUmVnRXhwKFxuICAgICAgICAgICdeJyArIHNlbGYucmUuc3JjX2VtYWlsX25hbWUgKyAnQCcgKyBzZWxmLnJlLnNyY19ob3N0X3N0cmljdCwgJ2knXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5yZS5tYWlsdG8udGVzdCh0YWlsKSkge1xuICAgICAgICByZXR1cm4gdGFpbC5tYXRjaChzZWxmLnJlLm1haWx0bylbMF0ubGVuZ3RoO1xuICAgICAgfVxuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICB9XG59O1xuXG4vKmVzbGludC1kaXNhYmxlIG1heC1sZW4qL1xuXG4vLyBSRSBwYXR0ZXJuIGZvciAyLWNoYXJhY3RlciB0bGRzIChhdXRvZ2VuZXJhdGVkIGJ5IC4vc3VwcG9ydC90bGRzXzJjaGFyX2dlbi5qcylcbnZhciB0bGRzXzJjaF9zcmNfcmUgPSAnYVtjZGVmZ2lsbW5vcXJzdHV3eHpdfGJbYWJkZWZnaGlqbW5vcnN0dnd5el18Y1thY2RmZ2hpa2xtbm9ydXZ3eHl6XXxkW2Vqa21vel18ZVtjZWdyc3R1XXxmW2lqa21vcl18Z1thYmRlZmdoaWxtbnBxcnN0dXd5XXxoW2ttbnJ0dV18aVtkZWxtbm9xcnN0XXxqW2Vtb3BdfGtbZWdoaW1ucHJ3eXpdfGxbYWJjaWtyc3R1dnldfG1bYWNkZWdoa2xtbm9wcXJzdHV2d3h5el18blthY2VmZ2lsb3BydXpdfG9tfHBbYWVmZ2hrbG1ucnN0d3ldfHFhfHJbZW9zdXddfHNbYWJjZGVnaGlqa2xtbm9ydHV2eHl6XXx0W2NkZmdoamtsbW5vcnR2d3pdfHVbYWdrc3l6XXx2W2FjZWdpbnVdfHdbZnNdfHlbZXRdfHpbYW13XSc7XG5cbi8vIERPTidUIHRyeSB0byBtYWtlIFBScyB3aXRoIGNoYW5nZXMuIEV4dGVuZCBUTERzIHdpdGggTGlua2lmeUl0LnRsZHMoKSBpbnN0ZWFkXG52YXIgdGxkc19kZWZhdWx0ID0gJ2Jpenxjb218ZWR1fGdvdnxuZXR8b3JnfHByb3x3ZWJ8eHh4fGFlcm98YXNpYXxjb29wfGluZm98bXVzZXVtfG5hbWV8c2hvcHzRgNGEJy5zcGxpdCgnfCcpO1xuXG4vKmVzbGludC1lbmFibGUgbWF4LWxlbiovXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIHJlc2V0U2NhbkNhY2hlKHNlbGYpIHtcbiAgc2VsZi5fX2luZGV4X18gPSAtMTtcbiAgc2VsZi5fX3RleHRfY2FjaGVfXyAgID0gJyc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZhbGlkYXRvcihyZSkge1xuICByZXR1cm4gZnVuY3Rpb24gKHRleHQsIHBvcykge1xuICAgIHZhciB0YWlsID0gdGV4dC5zbGljZShwb3MpO1xuXG4gICAgaWYgKHJlLnRlc3QodGFpbCkpIHtcbiAgICAgIHJldHVybiB0YWlsLm1hdGNoKHJlKVswXS5sZW5ndGg7XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVOb3JtYWxpemVyKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKG1hdGNoLCBzZWxmKSB7XG4gICAgc2VsZi5ub3JtYWxpemUobWF0Y2gpO1xuICB9O1xufVxuXG4vLyBTY2hlbWFzIGNvbXBpbGVyLiBCdWlsZCByZWdleHBzLlxuLy9cbmZ1bmN0aW9uIGNvbXBpbGUoc2VsZikge1xuXG4gIC8vIExvYWQgJiBjbG9uZSBSRSBwYXR0ZXJucy5cbiAgdmFyIHJlID0gc2VsZi5yZSA9IHJlcXVpcmUoJy4vbGliL3JlJykoc2VsZi5fX29wdHNfXyk7XG5cbiAgLy8gRGVmaW5lIGR5bmFtaWMgcGF0dGVybnNcbiAgdmFyIHRsZHMgPSBzZWxmLl9fdGxkc19fLnNsaWNlKCk7XG5cbiAgc2VsZi5vbkNvbXBpbGUoKTtcblxuICBpZiAoIXNlbGYuX190bGRzX3JlcGxhY2VkX18pIHtcbiAgICB0bGRzLnB1c2godGxkc18yY2hfc3JjX3JlKTtcbiAgfVxuICB0bGRzLnB1c2gocmUuc3JjX3huKTtcblxuICByZS5zcmNfdGxkcyA9IHRsZHMuam9pbignfCcpO1xuXG4gIGZ1bmN0aW9uIHVudHBsKHRwbCkgeyByZXR1cm4gdHBsLnJlcGxhY2UoJyVUTERTJScsIHJlLnNyY190bGRzKTsgfVxuXG4gIHJlLmVtYWlsX2Z1enp5ICAgICAgPSBSZWdFeHAodW50cGwocmUudHBsX2VtYWlsX2Z1enp5KSwgJ2knKTtcbiAgcmUubGlua19mdXp6eSAgICAgICA9IFJlZ0V4cCh1bnRwbChyZS50cGxfbGlua19mdXp6eSksICdpJyk7XG4gIHJlLmxpbmtfbm9faXBfZnV6enkgPSBSZWdFeHAodW50cGwocmUudHBsX2xpbmtfbm9faXBfZnV6enkpLCAnaScpO1xuICByZS5ob3N0X2Z1enp5X3Rlc3QgID0gUmVnRXhwKHVudHBsKHJlLnRwbF9ob3N0X2Z1enp5X3Rlc3QpLCAnaScpO1xuXG4gIC8vXG4gIC8vIENvbXBpbGUgZWFjaCBzY2hlbWFcbiAgLy9cblxuICB2YXIgYWxpYXNlcyA9IFtdO1xuXG4gIHNlbGYuX19jb21waWxlZF9fID0ge307IC8vIFJlc2V0IGNvbXBpbGVkIGRhdGFcblxuICBmdW5jdGlvbiBzY2hlbWFFcnJvcihuYW1lLCB2YWwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJyhMaW5raWZ5SXQpIEludmFsaWQgc2NoZW1hIFwiJyArIG5hbWUgKyAnXCI6ICcgKyB2YWwpO1xuICB9XG5cbiAgT2JqZWN0LmtleXMoc2VsZi5fX3NjaGVtYXNfXykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciB2YWwgPSBzZWxmLl9fc2NoZW1hc19fW25hbWVdO1xuXG4gICAgLy8gc2tpcCBkaXNhYmxlZCBtZXRob2RzXG4gICAgaWYgKHZhbCA9PT0gbnVsbCkgeyByZXR1cm47IH1cblxuICAgIHZhciBjb21waWxlZCA9IHsgdmFsaWRhdGU6IG51bGwsIGxpbms6IG51bGwgfTtcblxuICAgIHNlbGYuX19jb21waWxlZF9fW25hbWVdID0gY29tcGlsZWQ7XG5cbiAgICBpZiAoaXNPYmplY3QodmFsKSkge1xuICAgICAgaWYgKGlzUmVnRXhwKHZhbC52YWxpZGF0ZSkpIHtcbiAgICAgICAgY29tcGlsZWQudmFsaWRhdGUgPSBjcmVhdGVWYWxpZGF0b3IodmFsLnZhbGlkYXRlKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNGdW5jdGlvbih2YWwudmFsaWRhdGUpKSB7XG4gICAgICAgIGNvbXBpbGVkLnZhbGlkYXRlID0gdmFsLnZhbGlkYXRlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGlzRnVuY3Rpb24odmFsLm5vcm1hbGl6ZSkpIHtcbiAgICAgICAgY29tcGlsZWQubm9ybWFsaXplID0gdmFsLm5vcm1hbGl6ZTtcbiAgICAgIH0gZWxzZSBpZiAoIXZhbC5ub3JtYWxpemUpIHtcbiAgICAgICAgY29tcGlsZWQubm9ybWFsaXplID0gY3JlYXRlTm9ybWFsaXplcigpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChpc1N0cmluZyh2YWwpKSB7XG4gICAgICBhbGlhc2VzLnB1c2gobmFtZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2NoZW1hRXJyb3IobmFtZSwgdmFsKTtcbiAgfSk7XG5cbiAgLy9cbiAgLy8gQ29tcGlsZSBwb3N0cG9uZWQgYWxpYXNlc1xuICAvL1xuXG4gIGFsaWFzZXMuZm9yRWFjaChmdW5jdGlvbiAoYWxpYXMpIHtcbiAgICBpZiAoIXNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXSkge1xuICAgICAgLy8gU2lsZW50bHkgZmFpbCBvbiBtaXNzZWQgc2NoZW1hcyB0byBhdm9pZCBlcnJvbnMgb24gZGlzYWJsZS5cbiAgICAgIC8vIHNjaGVtYUVycm9yKGFsaWFzLCBzZWxmLl9fc2NoZW1hc19fW2FsaWFzXSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2VsZi5fX2NvbXBpbGVkX19bYWxpYXNdLnZhbGlkYXRlID1cbiAgICAgIHNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXS52YWxpZGF0ZTtcbiAgICBzZWxmLl9fY29tcGlsZWRfX1thbGlhc10ubm9ybWFsaXplID1cbiAgICAgIHNlbGYuX19jb21waWxlZF9fW3NlbGYuX19zY2hlbWFzX19bYWxpYXNdXS5ub3JtYWxpemU7XG4gIH0pO1xuXG4gIC8vXG4gIC8vIEZha2UgcmVjb3JkIGZvciBndWVzc2VkIGxpbmtzXG4gIC8vXG4gIHNlbGYuX19jb21waWxlZF9fWycnXSA9IHsgdmFsaWRhdGU6IG51bGwsIG5vcm1hbGl6ZTogY3JlYXRlTm9ybWFsaXplcigpIH07XG5cbiAgLy9cbiAgLy8gQnVpbGQgc2NoZW1hIGNvbmRpdGlvblxuICAvL1xuICB2YXIgc2xpc3QgPSBPYmplY3Qua2V5cyhzZWxmLl9fY29tcGlsZWRfXylcbiAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBGaWx0ZXIgZGlzYWJsZWQgJiBmYWtlIHNjaGVtYXNcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuYW1lLmxlbmd0aCA+IDAgJiYgc2VsZi5fX2NvbXBpbGVkX19bbmFtZV07XG4gICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAubWFwKGVzY2FwZVJFKVxuICAgICAgICAgICAgICAgICAgICAgIC5qb2luKCd8Jyk7XG4gIC8vICg/IV8pIGNhdXNlIDEuNXggc2xvd2Rvd25cbiAgc2VsZi5yZS5zY2hlbWFfdGVzdCAgID0gUmVnRXhwKCcoXnwoPyFfKSg/Ols+PFxcdWZmNWNdfCcgKyByZS5zcmNfWlBDYyArICcpKSgnICsgc2xpc3QgKyAnKScsICdpJyk7XG4gIHNlbGYucmUuc2NoZW1hX3NlYXJjaCA9IFJlZ0V4cCgnKF58KD8hXykoPzpbPjxcXHVmZjVjXXwnICsgcmUuc3JjX1pQQ2MgKyAnKSkoJyArIHNsaXN0ICsgJyknLCAnaWcnKTtcblxuICBzZWxmLnJlLnByZXRlc3QgICAgICAgPSBSZWdFeHAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJygnICsgc2VsZi5yZS5zY2hlbWFfdGVzdC5zb3VyY2UgKyAnKXwnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnKCcgKyBzZWxmLnJlLmhvc3RfZnV6enlfdGVzdC5zb3VyY2UgKyAnKXwnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2knKTtcblxuICAvL1xuICAvLyBDbGVhbnVwXG4gIC8vXG5cbiAgcmVzZXRTY2FuQ2FjaGUoc2VsZik7XG59XG5cbi8qKlxuICogY2xhc3MgTWF0Y2hcbiAqXG4gKiBNYXRjaCByZXN1bHQuIFNpbmdsZSBlbGVtZW50IG9mIGFycmF5LCByZXR1cm5lZCBieSBbW0xpbmtpZnlJdCNtYXRjaF1dXG4gKiovXG5mdW5jdGlvbiBNYXRjaChzZWxmLCBzaGlmdCkge1xuICB2YXIgc3RhcnQgPSBzZWxmLl9faW5kZXhfXyxcbiAgICAgIGVuZCAgID0gc2VsZi5fX2xhc3RfaW5kZXhfXyxcbiAgICAgIHRleHQgID0gc2VsZi5fX3RleHRfY2FjaGVfXy5zbGljZShzdGFydCwgZW5kKTtcblxuICAvKipcbiAgICogTWF0Y2gjc2NoZW1hIC0+IFN0cmluZ1xuICAgKlxuICAgKiBQcmVmaXggKHByb3RvY29sKSBmb3IgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy5zY2hlbWEgICAgPSBzZWxmLl9fc2NoZW1hX18udG9Mb3dlckNhc2UoKTtcbiAgLyoqXG4gICAqIE1hdGNoI2luZGV4IC0+IE51bWJlclxuICAgKlxuICAgKiBGaXJzdCBwb3NpdGlvbiBvZiBtYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLmluZGV4ICAgICA9IHN0YXJ0ICsgc2hpZnQ7XG4gIC8qKlxuICAgKiBNYXRjaCNsYXN0SW5kZXggLT4gTnVtYmVyXG4gICAqXG4gICAqIE5leHQgcG9zaXRpb24gYWZ0ZXIgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy5sYXN0SW5kZXggPSBlbmQgKyBzaGlmdDtcbiAgLyoqXG4gICAqIE1hdGNoI3JhdyAtPiBTdHJpbmdcbiAgICpcbiAgICogTWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy5yYXcgICAgICAgPSB0ZXh0O1xuICAvKipcbiAgICogTWF0Y2gjdGV4dCAtPiBTdHJpbmdcbiAgICpcbiAgICogTm90bWFsaXplZCB0ZXh0IG9mIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMudGV4dCAgICAgID0gdGV4dDtcbiAgLyoqXG4gICAqIE1hdGNoI3VybCAtPiBTdHJpbmdcbiAgICpcbiAgICogTm9ybWFsaXplZCB1cmwgb2YgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy51cmwgICAgICAgPSB0ZXh0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVNYXRjaChzZWxmLCBzaGlmdCkge1xuICB2YXIgbWF0Y2ggPSBuZXcgTWF0Y2goc2VsZiwgc2hpZnQpO1xuXG4gIHNlbGYuX19jb21waWxlZF9fW21hdGNoLnNjaGVtYV0ubm9ybWFsaXplKG1hdGNoLCBzZWxmKTtcblxuICByZXR1cm4gbWF0Y2g7XG59XG5cblxuLyoqXG4gKiBjbGFzcyBMaW5raWZ5SXRcbiAqKi9cblxuLyoqXG4gKiBuZXcgTGlua2lmeUl0KHNjaGVtYXMsIG9wdGlvbnMpXG4gKiAtIHNjaGVtYXMgKE9iamVjdCk6IE9wdGlvbmFsLiBBZGRpdGlvbmFsIHNjaGVtYXMgdG8gdmFsaWRhdGUgKHByZWZpeC92YWxpZGF0b3IpXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHsgZnV6enlMaW5rfGZ1enp5RW1haWx8ZnV6enlJUDogdHJ1ZXxmYWxzZSB9XG4gKlxuICogQ3JlYXRlcyBuZXcgbGlua2lmaWVyIGluc3RhbmNlIHdpdGggb3B0aW9uYWwgYWRkaXRpb25hbCBzY2hlbWFzLlxuICogQ2FuIGJlIGNhbGxlZCB3aXRob3V0IGBuZXdgIGtleXdvcmQgZm9yIGNvbnZlbmllbmNlLlxuICpcbiAqIEJ5IGRlZmF1bHQgdW5kZXJzdGFuZHM6XG4gKlxuICogLSBgaHR0cChzKTovLy4uLmAgLCBgZnRwOi8vLi4uYCwgYG1haWx0bzouLi5gICYgYC8vLi4uYCBsaW5rc1xuICogLSBcImZ1enp5XCIgbGlua3MgYW5kIGVtYWlscyAoZXhhbXBsZS5jb20sIGZvb0BiYXIuY29tKS5cbiAqXG4gKiBgc2NoZW1hc2AgaXMgYW4gb2JqZWN0LCB3aGVyZSBlYWNoIGtleS92YWx1ZSBkZXNjcmliZXMgcHJvdG9jb2wvcnVsZTpcbiAqXG4gKiAtIF9fa2V5X18gLSBsaW5rIHByZWZpeCAodXN1YWxseSwgcHJvdG9jb2wgbmFtZSB3aXRoIGA6YCBhdCB0aGUgZW5kLCBgc2t5cGU6YFxuICogICBmb3IgZXhhbXBsZSkuIGBsaW5raWZ5LWl0YCBtYWtlcyBzaHVyZSB0aGF0IHByZWZpeCBpcyBub3QgcHJlY2VlZGVkIHdpdGhcbiAqICAgYWxwaGFudW1lcmljIGNoYXIgYW5kIHN5bWJvbHMuIE9ubHkgd2hpdGVzcGFjZXMgYW5kIHB1bmN0dWF0aW9uIGFsbG93ZWQuXG4gKiAtIF9fdmFsdWVfXyAtIHJ1bGUgdG8gY2hlY2sgdGFpbCBhZnRlciBsaW5rIHByZWZpeFxuICogICAtIF9TdHJpbmdfIC0ganVzdCBhbGlhcyB0byBleGlzdGluZyBydWxlXG4gKiAgIC0gX09iamVjdF9cbiAqICAgICAtIF92YWxpZGF0ZV8gLSB2YWxpZGF0b3IgZnVuY3Rpb24gKHNob3VsZCByZXR1cm4gbWF0Y2hlZCBsZW5ndGggb24gc3VjY2VzcyksXG4gKiAgICAgICBvciBgUmVnRXhwYC5cbiAqICAgICAtIF9ub3JtYWxpemVfIC0gb3B0aW9uYWwgZnVuY3Rpb24gdG8gbm9ybWFsaXplIHRleHQgJiB1cmwgb2YgbWF0Y2hlZCByZXN1bHRcbiAqICAgICAgIChmb3IgZXhhbXBsZSwgZm9yIEB0d2l0dGVyIG1lbnRpb25zKS5cbiAqXG4gKiBgb3B0aW9uc2A6XG4gKlxuICogLSBfX2Z1enp5TGlua19fIC0gcmVjb2duaWdlIFVSTC1zIHdpdGhvdXQgYGh0dHAocyk6YCBwcmVmaXguIERlZmF1bHQgYHRydWVgLlxuICogLSBfX2Z1enp5SVBfXyAtIGFsbG93IElQcyBpbiBmdXp6eSBsaW5rcyBhYm92ZS4gQ2FuIGNvbmZsaWN0IHdpdGggc29tZSB0ZXh0c1xuICogICBsaWtlIHZlcnNpb24gbnVtYmVycy4gRGVmYXVsdCBgZmFsc2VgLlxuICogLSBfX2Z1enp5RW1haWxfXyAtIHJlY29nbml6ZSBlbWFpbHMgd2l0aG91dCBgbWFpbHRvOmAgcHJlZml4LlxuICpcbiAqKi9cbmZ1bmN0aW9uIExpbmtpZnlJdChzY2hlbWFzLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBMaW5raWZ5SXQpKSB7XG4gICAgcmV0dXJuIG5ldyBMaW5raWZ5SXQoc2NoZW1hcywgb3B0aW9ucyk7XG4gIH1cblxuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBpZiAoaXNPcHRpb25zT2JqKHNjaGVtYXMpKSB7XG4gICAgICBvcHRpb25zID0gc2NoZW1hcztcbiAgICAgIHNjaGVtYXMgPSB7fTtcbiAgICB9XG4gIH1cblxuICB0aGlzLl9fb3B0c19fICAgICAgICAgICA9IGFzc2lnbih7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gIC8vIENhY2hlIGxhc3QgdGVzdGVkIHJlc3VsdC4gVXNlZCB0byBza2lwIHJlcGVhdGluZyBzdGVwcyBvbiBuZXh0IGBtYXRjaGAgY2FsbC5cbiAgdGhpcy5fX2luZGV4X18gICAgICAgICAgPSAtMTtcbiAgdGhpcy5fX2xhc3RfaW5kZXhfXyAgICAgPSAtMTsgLy8gTmV4dCBzY2FuIHBvc2l0aW9uXG4gIHRoaXMuX19zY2hlbWFfXyAgICAgICAgID0gJyc7XG4gIHRoaXMuX190ZXh0X2NhY2hlX18gICAgID0gJyc7XG5cbiAgdGhpcy5fX3NjaGVtYXNfXyAgICAgICAgPSBhc3NpZ24oe30sIGRlZmF1bHRTY2hlbWFzLCBzY2hlbWFzKTtcbiAgdGhpcy5fX2NvbXBpbGVkX18gICAgICAgPSB7fTtcblxuICB0aGlzLl9fdGxkc19fICAgICAgICAgICA9IHRsZHNfZGVmYXVsdDtcbiAgdGhpcy5fX3RsZHNfcmVwbGFjZWRfXyAgPSBmYWxzZTtcblxuICB0aGlzLnJlID0ge307XG5cbiAgY29tcGlsZSh0aGlzKTtcbn1cblxuXG4vKiogY2hhaW5hYmxlXG4gKiBMaW5raWZ5SXQjYWRkKHNjaGVtYSwgZGVmaW5pdGlvbilcbiAqIC0gc2NoZW1hIChTdHJpbmcpOiBydWxlIG5hbWUgKGZpeGVkIHBhdHRlcm4gcHJlZml4KVxuICogLSBkZWZpbml0aW9uIChTdHJpbmd8UmVnRXhwfE9iamVjdCk6IHNjaGVtYSBkZWZpbml0aW9uXG4gKlxuICogQWRkIG5ldyBydWxlIGRlZmluaXRpb24uIFNlZSBjb25zdHJ1Y3RvciBkZXNjcmlwdGlvbiBmb3IgZGV0YWlscy5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHNjaGVtYSwgZGVmaW5pdGlvbikge1xuICB0aGlzLl9fc2NoZW1hc19fW3NjaGVtYV0gPSBkZWZpbml0aW9uO1xuICBjb21waWxlKHRoaXMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqIGNoYWluYWJsZVxuICogTGlua2lmeUl0I3NldChvcHRpb25zKVxuICogLSBvcHRpb25zIChPYmplY3QpOiB7IGZ1enp5TGlua3xmdXp6eUVtYWlsfGZ1enp5SVA6IHRydWV8ZmFsc2UgfVxuICpcbiAqIFNldCByZWNvZ25pdGlvbiBvcHRpb25zIGZvciBsaW5rcyB3aXRob3V0IHNjaGVtYS5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gc2V0KG9wdGlvbnMpIHtcbiAgdGhpcy5fX29wdHNfXyA9IGFzc2lnbih0aGlzLl9fb3B0c19fLCBvcHRpb25zKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogTGlua2lmeUl0I3Rlc3QodGV4dCkgLT4gQm9vbGVhblxuICpcbiAqIFNlYXJjaGVzIGxpbmtpZmlhYmxlIHBhdHRlcm4gYW5kIHJldHVybnMgYHRydWVgIG9uIHN1Y2Nlc3Mgb3IgYGZhbHNlYCBvbiBmYWlsLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24gdGVzdCh0ZXh0KSB7XG4gIC8vIFJlc2V0IHNjYW4gY2FjaGVcbiAgdGhpcy5fX3RleHRfY2FjaGVfXyA9IHRleHQ7XG4gIHRoaXMuX19pbmRleF9fICAgICAgPSAtMTtcblxuICBpZiAoIXRleHQubGVuZ3RoKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHZhciBtLCBtbCwgbWUsIGxlbiwgc2hpZnQsIG5leHQsIHJlLCB0bGRfcG9zLCBhdF9wb3M7XG5cbiAgLy8gdHJ5IHRvIHNjYW4gZm9yIGxpbmsgd2l0aCBzY2hlbWEgLSB0aGF0J3MgdGhlIG1vc3Qgc2ltcGxlIHJ1bGVcbiAgaWYgKHRoaXMucmUuc2NoZW1hX3Rlc3QudGVzdCh0ZXh0KSkge1xuICAgIHJlID0gdGhpcy5yZS5zY2hlbWFfc2VhcmNoO1xuICAgIHJlLmxhc3RJbmRleCA9IDA7XG4gICAgd2hpbGUgKChtID0gcmUuZXhlYyh0ZXh0KSkgIT09IG51bGwpIHtcbiAgICAgIGxlbiA9IHRoaXMudGVzdFNjaGVtYUF0KHRleHQsIG1bMl0sIHJlLmxhc3RJbmRleCk7XG4gICAgICBpZiAobGVuKSB7XG4gICAgICAgIHRoaXMuX19zY2hlbWFfXyAgICAgPSBtWzJdO1xuICAgICAgICB0aGlzLl9faW5kZXhfXyAgICAgID0gbS5pbmRleCArIG1bMV0ubGVuZ3RoO1xuICAgICAgICB0aGlzLl9fbGFzdF9pbmRleF9fID0gbS5pbmRleCArIG1bMF0ubGVuZ3RoICsgbGVuO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fX29wdHNfXy5mdXp6eUxpbmsgJiYgdGhpcy5fX2NvbXBpbGVkX19bJ2h0dHA6J10pIHtcbiAgICAvLyBndWVzcyBzY2hlbWFsZXNzIGxpbmtzXG4gICAgdGxkX3BvcyA9IHRleHQuc2VhcmNoKHRoaXMucmUuaG9zdF9mdXp6eV90ZXN0KTtcbiAgICBpZiAodGxkX3BvcyA+PSAwKSB7XG4gICAgICAvLyBpZiB0bGQgaXMgbG9jYXRlZCBhZnRlciBmb3VuZCBsaW5rIC0gbm8gbmVlZCB0byBjaGVjayBmdXp6eSBwYXR0ZXJuXG4gICAgICBpZiAodGhpcy5fX2luZGV4X18gPCAwIHx8IHRsZF9wb3MgPCB0aGlzLl9faW5kZXhfXykge1xuICAgICAgICBpZiAoKG1sID0gdGV4dC5tYXRjaCh0aGlzLl9fb3B0c19fLmZ1enp5SVAgPyB0aGlzLnJlLmxpbmtfZnV6enkgOiB0aGlzLnJlLmxpbmtfbm9faXBfZnV6enkpKSAhPT0gbnVsbCkge1xuXG4gICAgICAgICAgc2hpZnQgPSBtbC5pbmRleCArIG1sWzFdLmxlbmd0aDtcblxuICAgICAgICAgIGlmICh0aGlzLl9faW5kZXhfXyA8IDAgfHwgc2hpZnQgPCB0aGlzLl9faW5kZXhfXykge1xuICAgICAgICAgICAgdGhpcy5fX3NjaGVtYV9fICAgICA9ICcnO1xuICAgICAgICAgICAgdGhpcy5fX2luZGV4X18gICAgICA9IHNoaWZ0O1xuICAgICAgICAgICAgdGhpcy5fX2xhc3RfaW5kZXhfXyA9IG1sLmluZGV4ICsgbWxbMF0ubGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICh0aGlzLl9fb3B0c19fLmZ1enp5RW1haWwgJiYgdGhpcy5fX2NvbXBpbGVkX19bJ21haWx0bzonXSkge1xuICAgIC8vIGd1ZXNzIHNjaGVtYWxlc3MgZW1haWxzXG4gICAgYXRfcG9zID0gdGV4dC5pbmRleE9mKCdAJyk7XG4gICAgaWYgKGF0X3BvcyA+PSAwKSB7XG4gICAgICAvLyBXZSBjYW4ndCBza2lwIHRoaXMgY2hlY2ssIGJlY2F1c2UgdGhpcyBjYXNlcyBhcmUgcG9zc2libGU6XG4gICAgICAvLyAxOTIuMTY4LjEuMUBnbWFpbC5jb20sIG15LmluQGV4YW1wbGUuY29tXG4gICAgICBpZiAoKG1lID0gdGV4dC5tYXRjaCh0aGlzLnJlLmVtYWlsX2Z1enp5KSkgIT09IG51bGwpIHtcblxuICAgICAgICBzaGlmdCA9IG1lLmluZGV4ICsgbWVbMV0ubGVuZ3RoO1xuICAgICAgICBuZXh0ICA9IG1lLmluZGV4ICsgbWVbMF0ubGVuZ3RoO1xuXG4gICAgICAgIGlmICh0aGlzLl9faW5kZXhfXyA8IDAgfHwgc2hpZnQgPCB0aGlzLl9faW5kZXhfXyB8fFxuICAgICAgICAgICAgKHNoaWZ0ID09PSB0aGlzLl9faW5kZXhfXyAmJiBuZXh0ID4gdGhpcy5fX2xhc3RfaW5kZXhfXykpIHtcbiAgICAgICAgICB0aGlzLl9fc2NoZW1hX18gICAgID0gJ21haWx0bzonO1xuICAgICAgICAgIHRoaXMuX19pbmRleF9fICAgICAgPSBzaGlmdDtcbiAgICAgICAgICB0aGlzLl9fbGFzdF9pbmRleF9fID0gbmV4dDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzLl9faW5kZXhfXyA+PSAwO1xufTtcblxuXG4vKipcbiAqIExpbmtpZnlJdCNwcmV0ZXN0KHRleHQpIC0+IEJvb2xlYW5cbiAqXG4gKiBWZXJ5IHF1aWNrIGNoZWNrLCB0aGF0IGNhbiBnaXZlIGZhbHNlIHBvc2l0aXZlcy4gUmV0dXJucyB0cnVlIGlmIGxpbmsgTUFZIEJFXG4gKiBjYW4gZXhpc3RzLiBDYW4gYmUgdXNlZCBmb3Igc3BlZWQgb3B0aW1pemF0aW9uLCB3aGVuIHlvdSBuZWVkIHRvIGNoZWNrIHRoYXRcbiAqIGxpbmsgTk9UIGV4aXN0cy5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUucHJldGVzdCA9IGZ1bmN0aW9uIHByZXRlc3QodGV4dCkge1xuICByZXR1cm4gdGhpcy5yZS5wcmV0ZXN0LnRlc3QodGV4dCk7XG59O1xuXG5cbi8qKlxuICogTGlua2lmeUl0I3Rlc3RTY2hlbWFBdCh0ZXh0LCBuYW1lLCBwb3NpdGlvbikgLT4gTnVtYmVyXG4gKiAtIHRleHQgKFN0cmluZyk6IHRleHQgdG8gc2NhblxuICogLSBuYW1lIChTdHJpbmcpOiBydWxlIChzY2hlbWEpIG5hbWVcbiAqIC0gcG9zaXRpb24gKE51bWJlcik6IHRleHQgb2Zmc2V0IHRvIGNoZWNrIGZyb21cbiAqXG4gKiBTaW1pbGFyIHRvIFtbTGlua2lmeUl0I3Rlc3RdXSBidXQgY2hlY2tzIG9ubHkgc3BlY2lmaWMgcHJvdG9jb2wgdGFpbCBleGFjdGx5XG4gKiBhdCBnaXZlbiBwb3NpdGlvbi4gUmV0dXJucyBsZW5ndGggb2YgZm91bmQgcGF0dGVybiAoMCBvbiBmYWlsKS5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUudGVzdFNjaGVtYUF0ID0gZnVuY3Rpb24gdGVzdFNjaGVtYUF0KHRleHQsIHNjaGVtYSwgcG9zKSB7XG4gIC8vIElmIG5vdCBzdXBwb3J0ZWQgc2NoZW1hIGNoZWNrIHJlcXVlc3RlZCAtIHRlcm1pbmF0ZVxuICBpZiAoIXRoaXMuX19jb21waWxlZF9fW3NjaGVtYS50b0xvd2VyQ2FzZSgpXSkge1xuICAgIHJldHVybiAwO1xuICB9XG4gIHJldHVybiB0aGlzLl9fY29tcGlsZWRfX1tzY2hlbWEudG9Mb3dlckNhc2UoKV0udmFsaWRhdGUodGV4dCwgcG9zLCB0aGlzKTtcbn07XG5cblxuLyoqXG4gKiBMaW5raWZ5SXQjbWF0Y2godGV4dCkgLT4gQXJyYXl8bnVsbFxuICpcbiAqIFJldHVybnMgYXJyYXkgb2YgZm91bmQgbGluayBkZXNjcmlwdGlvbnMgb3IgYG51bGxgIG9uIGZhaWwuIFdlIHN0cm9uZ2x5XG4gKiByZWNvbW1lbmQgdG8gdXNlIFtbTGlua2lmeUl0I3Rlc3RdXSBmaXJzdCwgZm9yIGJlc3Qgc3BlZWQuXG4gKlxuICogIyMjIyMgUmVzdWx0IG1hdGNoIGRlc2NyaXB0aW9uXG4gKlxuICogLSBfX3NjaGVtYV9fIC0gbGluayBzY2hlbWEsIGNhbiBiZSBlbXB0eSBmb3IgZnV6enkgbGlua3MsIG9yIGAvL2AgZm9yXG4gKiAgIHByb3RvY29sLW5ldXRyYWwgIGxpbmtzLlxuICogLSBfX2luZGV4X18gLSBvZmZzZXQgb2YgbWF0Y2hlZCB0ZXh0XG4gKiAtIF9fbGFzdEluZGV4X18gLSBpbmRleCBvZiBuZXh0IGNoYXIgYWZ0ZXIgbWF0aGNoIGVuZFxuICogLSBfX3Jhd19fIC0gbWF0Y2hlZCB0ZXh0XG4gKiAtIF9fdGV4dF9fIC0gbm9ybWFsaXplZCB0ZXh0XG4gKiAtIF9fdXJsX18gLSBsaW5rLCBnZW5lcmF0ZWQgZnJvbSBtYXRjaGVkIHRleHRcbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbiBtYXRjaCh0ZXh0KSB7XG4gIHZhciBzaGlmdCA9IDAsIHJlc3VsdCA9IFtdO1xuXG4gIC8vIFRyeSB0byB0YWtlIHByZXZpb3VzIGVsZW1lbnQgZnJvbSBjYWNoZSwgaWYgLnRlc3QoKSBjYWxsZWQgYmVmb3JlXG4gIGlmICh0aGlzLl9faW5kZXhfXyA+PSAwICYmIHRoaXMuX190ZXh0X2NhY2hlX18gPT09IHRleHQpIHtcbiAgICByZXN1bHQucHVzaChjcmVhdGVNYXRjaCh0aGlzLCBzaGlmdCkpO1xuICAgIHNoaWZ0ID0gdGhpcy5fX2xhc3RfaW5kZXhfXztcbiAgfVxuXG4gIC8vIEN1dCBoZWFkIGlmIGNhY2hlIHdhcyB1c2VkXG4gIHZhciB0YWlsID0gc2hpZnQgPyB0ZXh0LnNsaWNlKHNoaWZ0KSA6IHRleHQ7XG5cbiAgLy8gU2NhbiBzdHJpbmcgdW50aWwgZW5kIHJlYWNoZWRcbiAgd2hpbGUgKHRoaXMudGVzdCh0YWlsKSkge1xuICAgIHJlc3VsdC5wdXNoKGNyZWF0ZU1hdGNoKHRoaXMsIHNoaWZ0KSk7XG5cbiAgICB0YWlsID0gdGFpbC5zbGljZSh0aGlzLl9fbGFzdF9pbmRleF9fKTtcbiAgICBzaGlmdCArPSB0aGlzLl9fbGFzdF9pbmRleF9fO1xuICB9XG5cbiAgaWYgKHJlc3VsdC5sZW5ndGgpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5cbi8qKiBjaGFpbmFibGVcbiAqIExpbmtpZnlJdCN0bGRzKGxpc3QgWywga2VlcE9sZF0pIC0+IHRoaXNcbiAqIC0gbGlzdCAoQXJyYXkpOiBsaXN0IG9mIHRsZHNcbiAqIC0ga2VlcE9sZCAoQm9vbGVhbik6IG1lcmdlIHdpdGggY3VycmVudCBsaXN0IGlmIGB0cnVlYCAoYGZhbHNlYCBieSBkZWZhdWx0KVxuICpcbiAqIExvYWQgKG9yIG1lcmdlKSBuZXcgdGxkcyBsaXN0LiBUaG9zZSBhcmUgdXNlciBmb3IgZnV6enkgbGlua3MgKHdpdGhvdXQgcHJlZml4KVxuICogdG8gYXZvaWQgZmFsc2UgcG9zaXRpdmVzLiBCeSBkZWZhdWx0IHRoaXMgYWxnb3J5dGhtIHVzZWQ6XG4gKlxuICogLSBob3N0bmFtZSB3aXRoIGFueSAyLWxldHRlciByb290IHpvbmVzIGFyZSBvay5cbiAqIC0gYml6fGNvbXxlZHV8Z292fG5ldHxvcmd8cHJvfHdlYnx4eHh8YWVyb3xhc2lhfGNvb3B8aW5mb3xtdXNldW18bmFtZXxzaG9wfNGA0YRcbiAqICAgYXJlIG9rLlxuICogLSBlbmNvZGVkIChgeG4tLS4uLmApIHJvb3Qgem9uZXMgYXJlIG9rLlxuICpcbiAqIElmIGxpc3QgaXMgcmVwbGFjZWQsIHRoZW4gZXhhY3QgbWF0Y2ggZm9yIDItY2hhcnMgcm9vdCB6b25lcyB3aWxsIGJlIGNoZWNrZWQuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnRsZHMgPSBmdW5jdGlvbiB0bGRzKGxpc3QsIGtlZXBPbGQpIHtcbiAgbGlzdCA9IEFycmF5LmlzQXJyYXkobGlzdCkgPyBsaXN0IDogWyBsaXN0IF07XG5cbiAgaWYgKCFrZWVwT2xkKSB7XG4gICAgdGhpcy5fX3RsZHNfXyA9IGxpc3Quc2xpY2UoKTtcbiAgICB0aGlzLl9fdGxkc19yZXBsYWNlZF9fID0gdHJ1ZTtcbiAgICBjb21waWxlKHRoaXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdGhpcy5fX3RsZHNfXyA9IHRoaXMuX190bGRzX18uY29uY2F0KGxpc3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGVsLCBpZHgsIGFycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsICE9PSBhcnJbaWR4IC0gMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmV2ZXJzZSgpO1xuXG4gIGNvbXBpbGUodGhpcyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBMaW5raWZ5SXQjbm9ybWFsaXplKG1hdGNoKVxuICpcbiAqIERlZmF1bHQgbm9ybWFsaXplciAoaWYgc2NoZW1hIGRvZXMgbm90IGRlZmluZSBpdCdzIG93bikuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZShtYXRjaCkge1xuXG4gIC8vIERvIG1pbmltYWwgcG9zc2libGUgY2hhbmdlcyBieSBkZWZhdWx0LiBOZWVkIHRvIGNvbGxlY3QgZmVlZGJhY2sgcHJpb3JcbiAgLy8gdG8gbW92ZSBmb3J3YXJkIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9saW5raWZ5LWl0L2lzc3Vlcy8xXG5cbiAgaWYgKCFtYXRjaC5zY2hlbWEpIHsgbWF0Y2gudXJsID0gJ2h0dHA6Ly8nICsgbWF0Y2gudXJsOyB9XG5cbiAgaWYgKG1hdGNoLnNjaGVtYSA9PT0gJ21haWx0bzonICYmICEvXm1haWx0bzovaS50ZXN0KG1hdGNoLnVybCkpIHtcbiAgICBtYXRjaC51cmwgPSAnbWFpbHRvOicgKyBtYXRjaC51cmw7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBMaW5raWZ5SXQjb25Db21waWxlKClcbiAqXG4gKiBPdmVycmlkZSB0byBtb2RpZnkgYmFzaWMgUmVnRXhwLXMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm9uQ29tcGlsZSA9IGZ1bmN0aW9uIG9uQ29tcGlsZSgpIHtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBMaW5raWZ5SXQ7XG4iLCIndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0cykge1xuICB2YXIgcmUgPSB7fTtcblxuICAvLyBVc2UgZGlyZWN0IGV4dHJhY3QgaW5zdGVhZCBvZiBgcmVnZW5lcmF0ZWAgdG8gcmVkdXNlIGJyb3dzZXJpZmllZCBzaXplXG4gIHJlLnNyY19BbnkgPSByZXF1aXJlKCd1Yy5taWNyby9wcm9wZXJ0aWVzL0FueS9yZWdleCcpLnNvdXJjZTtcbiAgcmUuc3JjX0NjICA9IHJlcXVpcmUoJ3VjLm1pY3JvL2NhdGVnb3JpZXMvQ2MvcmVnZXgnKS5zb3VyY2U7XG4gIHJlLnNyY19aICAgPSByZXF1aXJlKCd1Yy5taWNyby9jYXRlZ29yaWVzL1ovcmVnZXgnKS5zb3VyY2U7XG4gIHJlLnNyY19QICAgPSByZXF1aXJlKCd1Yy5taWNyby9jYXRlZ29yaWVzL1AvcmVnZXgnKS5zb3VyY2U7XG5cbiAgLy8gXFxwe1xcWlxcUFxcQ2NcXENGfSAod2hpdGUgc3BhY2VzICsgY29udHJvbCArIGZvcm1hdCArIHB1bmN0dWF0aW9uKVxuICByZS5zcmNfWlBDYyA9IFsgcmUuc3JjX1osIHJlLnNyY19QLCByZS5zcmNfQ2MgXS5qb2luKCd8Jyk7XG5cbiAgLy8gXFxwe1xcWlxcQ2N9ICh3aGl0ZSBzcGFjZXMgKyBjb250cm9sKVxuICByZS5zcmNfWkNjID0gWyByZS5zcmNfWiwgcmUuc3JjX0NjIF0uam9pbignfCcpO1xuXG4gIC8vIEV4cGVyaW1lbnRhbC4gTGlzdCBvZiBjaGFycywgY29tcGxldGVseSBwcm9oaWJpdGVkIGluIGxpbmtzXG4gIC8vIGJlY2F1c2UgY2FuIHNlcGFyYXRlIGl0IGZyb20gb3RoZXIgcGFydCBvZiB0ZXh0XG4gIHZhciB0ZXh0X3NlcGFyYXRvcnMgPSAnWz48XFx1ZmY1Y10nO1xuXG4gIC8vIEFsbCBwb3NzaWJsZSB3b3JkIGNoYXJhY3RlcnMgKGV2ZXJ5dGhpbmcgd2l0aG91dCBwdW5jdHVhdGlvbiwgc3BhY2VzICYgY29udHJvbHMpXG4gIC8vIERlZmluZWQgdmlhIHB1bmN0dWF0aW9uICYgc3BhY2VzIHRvIHNhdmUgc3BhY2VcbiAgLy8gU2hvdWxkIGJlIHNvbWV0aGluZyBsaWtlIFxccHtcXExcXE5cXFNcXE19IChcXHcgYnV0IHdpdGhvdXQgYF9gKVxuICByZS5zcmNfcHNldWRvX2xldHRlciAgICAgICA9ICcoPzooPyEnICsgdGV4dF9zZXBhcmF0b3JzICsgJ3wnICsgcmUuc3JjX1pQQ2MgKyAnKScgKyByZS5zcmNfQW55ICsgJyknO1xuICAvLyBUaGUgc2FtZSBhcyBhYm90aGUgYnV0IHdpdGhvdXQgWzAtOV1cbiAgLy8gdmFyIHNyY19wc2V1ZG9fbGV0dGVyX25vbl9kID0gJyg/Oig/IVswLTldfCcgKyBzcmNfWlBDYyArICcpJyArIHNyY19BbnkgKyAnKSc7XG5cbiAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICByZS5zcmNfaXA0ID1cblxuICAgICcoPzooMjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KVxcXFwuKXszfSgyNVswLTVdfDJbMC00XVswLTldfFswMV0/WzAtOV1bMC05XT8pJztcblxuICAvLyBQcm9oaWJpdCBhbnkgb2YgXCJAL1tdKClcIiBpbiB1c2VyL3Bhc3MgdG8gYXZvaWQgd3JvbmcgZG9tYWluIGZldGNoLlxuICByZS5zcmNfYXV0aCAgICA9ICcoPzooPzooPyEnICsgcmUuc3JjX1pDYyArICd8W0AvXFxcXFtcXFxcXSgpXSkuKStAKT8nO1xuXG4gIHJlLnNyY19wb3J0ID1cblxuICAgICcoPzo6KD86Nig/OlswLTRdXFxcXGR7M318NSg/OlswLTRdXFxcXGR7Mn18NSg/OlswLTJdXFxcXGR8M1swLTVdKSkpfFsxLTVdP1xcXFxkezEsNH0pKT8nO1xuXG4gIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3IgPVxuXG4gICAgJyg/PSR8JyArIHRleHRfc2VwYXJhdG9ycyArICd8JyArIHJlLnNyY19aUENjICsgJykoPyEtfF98OlxcXFxkfFxcXFwuLXxcXFxcLig/ISR8JyArIHJlLnNyY19aUENjICsgJykpJztcblxuICByZS5zcmNfcGF0aCA9XG5cbiAgICAnKD86JyArXG4gICAgICAnWy8/I10nICtcbiAgICAgICAgJyg/OicgK1xuICAgICAgICAgICcoPyEnICsgcmUuc3JjX1pDYyArICd8JyArIHRleHRfc2VwYXJhdG9ycyArICd8WygpW1xcXFxde30uLFwiXFwnPyFcXFxcLV0pLnwnICtcbiAgICAgICAgICAnXFxcXFsoPzooPyEnICsgcmUuc3JjX1pDYyArICd8XFxcXF0pLikqXFxcXF18JyArXG4gICAgICAgICAgJ1xcXFwoKD86KD8hJyArIHJlLnNyY19aQ2MgKyAnfFspXSkuKSpcXFxcKXwnICtcbiAgICAgICAgICAnXFxcXHsoPzooPyEnICsgcmUuc3JjX1pDYyArICd8W31dKS4pKlxcXFx9fCcgK1xuICAgICAgICAgICdcXFxcXCIoPzooPyEnICsgcmUuc3JjX1pDYyArICd8W1wiXSkuKStcXFxcXCJ8JyArXG4gICAgICAgICAgXCJcXFxcJyg/Oig/IVwiICsgcmUuc3JjX1pDYyArIFwifFsnXSkuKStcXFxcJ3xcIiArXG4gICAgICAgICAgXCJcXFxcJyg/PVwiICsgcmUuc3JjX3BzZXVkb19sZXR0ZXIgKyAnfFstXSkufCcgKyAgLy8gYWxsb3cgYEknbV9raW5nYCBpZiBubyBwYWlyIGZvdW5kXG4gICAgICAgICAgJ1xcXFwuezIsM31bYS16QS1aMC05JS9dfCcgKyAvLyBnaXRodWIgaGFzIC4uLiBpbiBjb21taXQgcmFuZ2UgbGlua3MuIFJlc3RyaWN0IHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLSBlbmdsaXNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLSBwZXJjZW50LWVuY29kZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAtIHBhcnRzIG9mIGZpbGUgcGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVudGlsIG1vcmUgZXhhbXBsZXMgZm91bmQuXG4gICAgICAgICAgJ1xcXFwuKD8hJyArIHJlLnNyY19aQ2MgKyAnfFsuXSkufCcgK1xuICAgICAgICAgIChvcHRzICYmIG9wdHNbJy0tLSddID9cbiAgICAgICAgICAgICdcXFxcLSg/IS0tKD86W14tXXwkKSkoPzotKil8JyAvLyBgLS0tYCA9PiBsb25nIGRhc2gsIHRlcm1pbmF0ZVxuICAgICAgICAgIDpcbiAgICAgICAgICAgICdcXFxcLSt8J1xuICAgICAgICAgICkgK1xuICAgICAgICAgICdcXFxcLCg/IScgKyByZS5zcmNfWkNjICsgJykufCcgKyAgICAgIC8vIGFsbG93IGAsLCxgIGluIHBhdGhzXG4gICAgICAgICAgJ1xcXFwhKD8hJyArIHJlLnNyY19aQ2MgKyAnfFshXSkufCcgK1xuICAgICAgICAgICdcXFxcPyg/IScgKyByZS5zcmNfWkNjICsgJ3xbP10pLicgK1xuICAgICAgICAnKSsnICtcbiAgICAgICd8XFxcXC8nICtcbiAgICAnKT8nO1xuXG4gIHJlLnNyY19lbWFpbF9uYW1lID1cblxuICAgICdbXFxcXC07OiY9XFxcXCtcXFxcJCxcXFxcXCJcXFxcLmEtekEtWjAtOV9dKyc7XG5cbiAgcmUuc3JjX3huID1cblxuICAgICd4bi0tW2EtejAtOVxcXFwtXXsxLDU5fSc7XG5cbiAgLy8gTW9yZSB0byByZWFkIGFib3V0IGRvbWFpbiBuYW1lc1xuICAvLyBodHRwOi8vc2VydmVyZmF1bHQuY29tL3F1ZXN0aW9ucy82MzgyNjAvXG5cbiAgcmUuc3JjX2RvbWFpbl9yb290ID1cblxuICAgIC8vIEFsbG93IGxldHRlcnMgJiBkaWdpdHMgKGh0dHA6Ly90ZXN0MSlcbiAgICAnKD86JyArXG4gICAgICByZS5zcmNfeG4gK1xuICAgICAgJ3wnICtcbiAgICAgIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJ3sxLDYzfScgK1xuICAgICcpJztcblxuICByZS5zcmNfZG9tYWluID1cblxuICAgICcoPzonICtcbiAgICAgIHJlLnNyY194biArXG4gICAgICAnfCcgK1xuICAgICAgJyg/OicgKyByZS5zcmNfcHNldWRvX2xldHRlciArICcpJyArXG4gICAgICAnfCcgK1xuICAgICAgLy8gZG9uJ3QgYWxsb3cgYC0tYCBpbiBkb21haW4gbmFtZXMsIGJlY2F1c2U6XG4gICAgICAvLyAtIHRoYXQgY2FuIGNvbmZsaWN0IHdpdGggbWFya2Rvd24gJm1kYXNoOyAvICZuZGFzaDtcbiAgICAgIC8vIC0gbm9ib2R5IHVzZSB0aG9zZSBhbnl3YXlcbiAgICAgICcoPzonICsgcmUuc3JjX3BzZXVkb19sZXR0ZXIgKyAnKD86LSg/IS0pfCcgKyByZS5zcmNfcHNldWRvX2xldHRlciArICcpezAsNjF9JyArIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJyknICtcbiAgICAnKSc7XG5cbiAgcmUuc3JjX2hvc3QgPVxuXG4gICAgJyg/OicgK1xuICAgIC8vIERvbid0IG5lZWQgSVAgY2hlY2ssIGJlY2F1c2UgZGlnaXRzIGFyZSBhbHJlYWR5IGFsbG93ZWQgaW4gbm9ybWFsIGRvbWFpbiBuYW1lc1xuICAgIC8vICAgc3JjX2lwNCArXG4gICAgLy8gJ3wnICtcbiAgICAgICcoPzooPzooPzonICsgcmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKicgKyByZS5zcmNfZG9tYWluLypfcm9vdCovICsgJyknICtcbiAgICAnKSc7XG5cbiAgcmUudHBsX2hvc3RfZnV6enkgPVxuXG4gICAgJyg/OicgK1xuICAgICAgcmUuc3JjX2lwNCArXG4gICAgJ3wnICtcbiAgICAgICcoPzooPzooPzonICsgcmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKyg/OiVUTERTJSkpJyArXG4gICAgJyknO1xuXG4gIHJlLnRwbF9ob3N0X25vX2lwX2Z1enp5ID1cblxuICAgICcoPzooPzooPzonICsgcmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKyg/OiVUTERTJSkpJztcblxuICByZS5zcmNfaG9zdF9zdHJpY3QgPVxuXG4gICAgcmUuc3JjX2hvc3QgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnRwbF9ob3N0X2Z1enp5X3N0cmljdCA9XG5cbiAgICByZS50cGxfaG9zdF9mdXp6eSArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cbiAgcmUuc3JjX2hvc3RfcG9ydF9zdHJpY3QgPVxuXG4gICAgcmUuc3JjX2hvc3QgKyByZS5zcmNfcG9ydCArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cbiAgcmUudHBsX2hvc3RfcG9ydF9mdXp6eV9zdHJpY3QgPVxuXG4gICAgcmUudHBsX2hvc3RfZnV6enkgKyByZS5zcmNfcG9ydCArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cbiAgcmUudHBsX2hvc3RfcG9ydF9ub19pcF9mdXp6eV9zdHJpY3QgPVxuXG4gICAgcmUudHBsX2hvc3Rfbm9faXBfZnV6enkgKyByZS5zcmNfcG9ydCArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBNYWluIHJ1bGVzXG5cbiAgLy8gUnVkZSB0ZXN0IGZ1enp5IGxpbmtzIGJ5IGhvc3QsIGZvciBxdWljayBkZW55XG4gIHJlLnRwbF9ob3N0X2Z1enp5X3Rlc3QgPVxuXG4gICAgJ2xvY2FsaG9zdHx3d3dcXFxcLnxcXFxcLlxcXFxkezEsM31cXFxcLnwoPzpcXFxcLig/OiVUTERTJSkoPzonICsgcmUuc3JjX1pQQ2MgKyAnfD58JCkpJztcblxuICByZS50cGxfZW1haWxfZnV6enkgPVxuXG4gICAgICAnKF58JyArIHRleHRfc2VwYXJhdG9ycyArICd8XFxcXCh8JyArIHJlLnNyY19aQ2MgKyAnKSgnICsgcmUuc3JjX2VtYWlsX25hbWUgKyAnQCcgKyByZS50cGxfaG9zdF9mdXp6eV9zdHJpY3QgKyAnKSc7XG5cbiAgcmUudHBsX2xpbmtfZnV6enkgPVxuICAgICAgLy8gRnV6enkgbGluayBjYW4ndCBiZSBwcmVwZW5kZWQgd2l0aCAuOi9cXC0gYW5kIG5vbiBwdW5jdHVhdGlvbi5cbiAgICAgIC8vIGJ1dCBjYW4gc3RhcnQgd2l0aCA+IChtYXJrZG93biBibG9ja3F1b3RlKVxuICAgICAgJyhefCg/IVsuOi9cXFxcLV9AXSkoPzpbJCs8PT5eYHxcXHVmZjVjXXwnICsgcmUuc3JjX1pQQ2MgKyAnKSknICtcbiAgICAgICcoKD8hWyQrPD0+XmB8XFx1ZmY1Y10pJyArIHJlLnRwbF9ob3N0X3BvcnRfZnV6enlfc3RyaWN0ICsgcmUuc3JjX3BhdGggKyAnKSc7XG5cbiAgcmUudHBsX2xpbmtfbm9faXBfZnV6enkgPVxuICAgICAgLy8gRnV6enkgbGluayBjYW4ndCBiZSBwcmVwZW5kZWQgd2l0aCAuOi9cXC0gYW5kIG5vbiBwdW5jdHVhdGlvbi5cbiAgICAgIC8vIGJ1dCBjYW4gc3RhcnQgd2l0aCA+IChtYXJrZG93biBibG9ja3F1b3RlKVxuICAgICAgJyhefCg/IVsuOi9cXFxcLV9AXSkoPzpbJCs8PT5eYHxcXHVmZjVjXXwnICsgcmUuc3JjX1pQQ2MgKyAnKSknICtcbiAgICAgICcoKD8hWyQrPD0+XmB8XFx1ZmY1Y10pJyArIHJlLnRwbF9ob3N0X3BvcnRfbm9faXBfZnV6enlfc3RyaWN0ICsgcmUuc3JjX3BhdGggKyAnKSc7XG5cbiAgcmV0dXJuIHJlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliLycpO1xuIiwiLy8gSFRNTDUgZW50aXRpZXMgbWFwOiB7IG5hbWUgLT4gdXRmMTZzdHJpbmcgfVxuLy9cbid1c2Ugc3RyaWN0JztcblxuLyplc2xpbnQgcXVvdGVzOjAqL1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdlbnRpdGllcy9tYXBzL2VudGl0aWVzLmpzb24nKTtcbiIsIi8vIExpc3Qgb2YgdmFsaWQgaHRtbCBibG9ja3MgbmFtZXMsIGFjY29ydGluZyB0byBjb21tb25tYXJrIHNwZWNcbi8vIGh0dHA6Ly9qZ20uZ2l0aHViLmlvL0NvbW1vbk1hcmsvc3BlYy5odG1sI2h0bWwtYmxvY2tzXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFtcbiAgJ2FkZHJlc3MnLFxuICAnYXJ0aWNsZScsXG4gICdhc2lkZScsXG4gICdiYXNlJyxcbiAgJ2Jhc2Vmb250JyxcbiAgJ2Jsb2NrcXVvdGUnLFxuICAnYm9keScsXG4gICdjYXB0aW9uJyxcbiAgJ2NlbnRlcicsXG4gICdjb2wnLFxuICAnY29sZ3JvdXAnLFxuICAnZGQnLFxuICAnZGV0YWlscycsXG4gICdkaWFsb2cnLFxuICAnZGlyJyxcbiAgJ2RpdicsXG4gICdkbCcsXG4gICdkdCcsXG4gICdmaWVsZHNldCcsXG4gICdmaWdjYXB0aW9uJyxcbiAgJ2ZpZ3VyZScsXG4gICdmb290ZXInLFxuICAnZm9ybScsXG4gICdmcmFtZScsXG4gICdmcmFtZXNldCcsXG4gICdoMScsXG4gICdoMicsXG4gICdoMycsXG4gICdoNCcsXG4gICdoNScsXG4gICdoNicsXG4gICdoZWFkJyxcbiAgJ2hlYWRlcicsXG4gICdocicsXG4gICdodG1sJyxcbiAgJ2lmcmFtZScsXG4gICdsZWdlbmQnLFxuICAnbGknLFxuICAnbGluaycsXG4gICdtYWluJyxcbiAgJ21lbnUnLFxuICAnbWVudWl0ZW0nLFxuICAnbWV0YScsXG4gICduYXYnLFxuICAnbm9mcmFtZXMnLFxuICAnb2wnLFxuICAnb3B0Z3JvdXAnLFxuICAnb3B0aW9uJyxcbiAgJ3AnLFxuICAncGFyYW0nLFxuICAnc2VjdGlvbicsXG4gICdzb3VyY2UnLFxuICAnc3VtbWFyeScsXG4gICd0YWJsZScsXG4gICd0Ym9keScsXG4gICd0ZCcsXG4gICd0Zm9vdCcsXG4gICd0aCcsXG4gICd0aGVhZCcsXG4gICd0aXRsZScsXG4gICd0cicsXG4gICd0cmFjaycsXG4gICd1bCdcbl07XG4iLCIvLyBSZWdleHBzIHRvIG1hdGNoIGh0bWwgZWxlbWVudHNcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXR0cl9uYW1lICAgICA9ICdbYS16QS1aXzpdW2EtekEtWjAtOTouXy1dKic7XG5cbnZhciB1bnF1b3RlZCAgICAgID0gJ1teXCJcXCc9PD5gXFxcXHgwMC1cXFxceDIwXSsnO1xudmFyIHNpbmdsZV9xdW90ZWQgPSBcIidbXiddKidcIjtcbnZhciBkb3VibGVfcXVvdGVkID0gJ1wiW15cIl0qXCInO1xuXG52YXIgYXR0cl92YWx1ZSAgPSAnKD86JyArIHVucXVvdGVkICsgJ3wnICsgc2luZ2xlX3F1b3RlZCArICd8JyArIGRvdWJsZV9xdW90ZWQgKyAnKSc7XG5cbnZhciBhdHRyaWJ1dGUgICA9ICcoPzpcXFxccysnICsgYXR0cl9uYW1lICsgJyg/OlxcXFxzKj1cXFxccyonICsgYXR0cl92YWx1ZSArICcpPyknO1xuXG52YXIgb3Blbl90YWcgICAgPSAnPFtBLVphLXpdW0EtWmEtejAtOVxcXFwtXSonICsgYXR0cmlidXRlICsgJypcXFxccypcXFxcLz8+JztcblxudmFyIGNsb3NlX3RhZyAgID0gJzxcXFxcL1tBLVphLXpdW0EtWmEtejAtOVxcXFwtXSpcXFxccyo+JztcbnZhciBjb21tZW50ICAgICA9ICc8IS0tLS0+fDwhLS0oPzotP1tePi1dKSg/Oi0/W14tXSkqLS0+JztcbnZhciBwcm9jZXNzaW5nICA9ICc8Wz9dLio/Wz9dPic7XG52YXIgZGVjbGFyYXRpb24gPSAnPCFbQS1aXStcXFxccytbXj5dKj4nO1xudmFyIGNkYXRhICAgICAgID0gJzwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj9cXFxcXVxcXFxdPic7XG5cbnZhciBIVE1MX1RBR19SRSA9IG5ldyBSZWdFeHAoJ14oPzonICsgb3Blbl90YWcgKyAnfCcgKyBjbG9zZV90YWcgKyAnfCcgKyBjb21tZW50ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd8JyArIHByb2Nlc3NpbmcgKyAnfCcgKyBkZWNsYXJhdGlvbiArICd8JyArIGNkYXRhICsgJyknKTtcbnZhciBIVE1MX09QRU5fQ0xPU0VfVEFHX1JFID0gbmV3IFJlZ0V4cCgnXig/OicgKyBvcGVuX3RhZyArICd8JyArIGNsb3NlX3RhZyArICcpJyk7XG5cbm1vZHVsZS5leHBvcnRzLkhUTUxfVEFHX1JFID0gSFRNTF9UQUdfUkU7XG5tb2R1bGUuZXhwb3J0cy5IVE1MX09QRU5fQ0xPU0VfVEFHX1JFID0gSFRNTF9PUEVOX0NMT1NFX1RBR19SRTtcbiIsIi8vIFV0aWxpdGllc1xuLy9cbid1c2Ugc3RyaWN0JztcblxuXG5mdW5jdGlvbiBfY2xhc3Mob2JqKSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTsgfVxuXG5mdW5jdGlvbiBpc1N0cmluZyhvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBTdHJpbmddJzsgfVxuXG52YXIgX2hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gaGFzKG9iamVjdCwga2V5KSB7XG4gIHJldHVybiBfaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSk7XG59XG5cbi8vIE1lcmdlIG9iamVjdHNcbi8vXG5mdW5jdGlvbiBhc3NpZ24ob2JqIC8qZnJvbTEsIGZyb20yLCBmcm9tMywgLi4uKi8pIHtcbiAgdmFyIHNvdXJjZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKCFzb3VyY2UpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc291cmNlICsgJ211c3QgYmUgb2JqZWN0Jyk7XG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbi8vIFJlbW92ZSBlbGVtZW50IGZyb20gYXJyYXkgYW5kIHB1dCBhbm90aGVyIGFycmF5IGF0IHRob3NlIHBvc2l0aW9uLlxuLy8gVXNlZnVsIGZvciBzb21lIG9wZXJhdGlvbnMgd2l0aCB0b2tlbnNcbmZ1bmN0aW9uIGFycmF5UmVwbGFjZUF0KHNyYywgcG9zLCBuZXdFbGVtZW50cykge1xuICByZXR1cm4gW10uY29uY2F0KHNyYy5zbGljZSgwLCBwb3MpLCBuZXdFbGVtZW50cywgc3JjLnNsaWNlKHBvcyArIDEpKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gaXNWYWxpZEVudGl0eUNvZGUoYykge1xuICAvKmVzbGludCBuby1iaXR3aXNlOjAqL1xuICAvLyBicm9rZW4gc2VxdWVuY2VcbiAgaWYgKGMgPj0gMHhEODAwICYmIGMgPD0gMHhERkZGKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBuZXZlciB1c2VkXG4gIGlmIChjID49IDB4RkREMCAmJiBjIDw9IDB4RkRFRikgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKChjICYgMHhGRkZGKSA9PT0gMHhGRkZGIHx8IChjICYgMHhGRkZGKSA9PT0gMHhGRkZFKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBjb250cm9sIGNvZGVzXG4gIGlmIChjID49IDB4MDAgJiYgYyA8PSAweDA4KSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoYyA9PT0gMHgwQikgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKGMgPj0gMHgwRSAmJiBjIDw9IDB4MUYpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChjID49IDB4N0YgJiYgYyA8PSAweDlGKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBvdXQgb2YgcmFuZ2VcbiAgaWYgKGMgPiAweDEwRkZGRikgeyByZXR1cm4gZmFsc2U7IH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGZyb21Db2RlUG9pbnQoYykge1xuICAvKmVzbGludCBuby1iaXR3aXNlOjAqL1xuICBpZiAoYyA+IDB4ZmZmZikge1xuICAgIGMgLT0gMHgxMDAwMDtcbiAgICB2YXIgc3Vycm9nYXRlMSA9IDB4ZDgwMCArIChjID4+IDEwKSxcbiAgICAgICAgc3Vycm9nYXRlMiA9IDB4ZGMwMCArIChjICYgMHgzZmYpO1xuXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoc3Vycm9nYXRlMSwgc3Vycm9nYXRlMik7XG4gIH1cbiAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoYyk7XG59XG5cblxudmFyIFVORVNDQVBFX01EX1JFICA9IC9cXFxcKFshXCIjJCUmJygpKissXFwtLlxcLzo7PD0+P0BbXFxcXFxcXV5fYHt8fX5dKS9nO1xudmFyIEVOVElUWV9SRSAgICAgICA9IC8mKFthLXojXVthLXowLTldezEsMzF9KTsvZ2k7XG52YXIgVU5FU0NBUEVfQUxMX1JFID0gbmV3IFJlZ0V4cChVTkVTQ0FQRV9NRF9SRS5zb3VyY2UgKyAnfCcgKyBFTlRJVFlfUkUuc291cmNlLCAnZ2knKTtcblxudmFyIERJR0lUQUxfRU5USVRZX1RFU1RfUkUgPSAvXiMoKD86eFthLWYwLTldezEsOH18WzAtOV17MSw4fSkpL2k7XG5cbnZhciBlbnRpdGllcyA9IHJlcXVpcmUoJy4vZW50aXRpZXMnKTtcblxuZnVuY3Rpb24gcmVwbGFjZUVudGl0eVBhdHRlcm4obWF0Y2gsIG5hbWUpIHtcbiAgdmFyIGNvZGUgPSAwO1xuXG4gIGlmIChoYXMoZW50aXRpZXMsIG5hbWUpKSB7XG4gICAgcmV0dXJuIGVudGl0aWVzW25hbWVdO1xuICB9XG5cbiAgaWYgKG5hbWUuY2hhckNvZGVBdCgwKSA9PT0gMHgyMy8qICMgKi8gJiYgRElHSVRBTF9FTlRJVFlfVEVTVF9SRS50ZXN0KG5hbWUpKSB7XG4gICAgY29kZSA9IG5hbWVbMV0udG9Mb3dlckNhc2UoKSA9PT0gJ3gnID9cbiAgICAgIHBhcnNlSW50KG5hbWUuc2xpY2UoMiksIDE2KVxuICAgIDpcbiAgICAgIHBhcnNlSW50KG5hbWUuc2xpY2UoMSksIDEwKTtcbiAgICBpZiAoaXNWYWxpZEVudGl0eUNvZGUoY29kZSkpIHtcbiAgICAgIHJldHVybiBmcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXRjaDtcbn1cblxuLypmdW5jdGlvbiByZXBsYWNlRW50aXRpZXMoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignJicpIDwgMCkgeyByZXR1cm4gc3RyOyB9XG5cbiAgcmV0dXJuIHN0ci5yZXBsYWNlKEVOVElUWV9SRSwgcmVwbGFjZUVudGl0eVBhdHRlcm4pO1xufSovXG5cbmZ1bmN0aW9uIHVuZXNjYXBlTWQoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignXFxcXCcpIDwgMCkgeyByZXR1cm4gc3RyOyB9XG4gIHJldHVybiBzdHIucmVwbGFjZShVTkVTQ0FQRV9NRF9SRSwgJyQxJyk7XG59XG5cbmZ1bmN0aW9uIHVuZXNjYXBlQWxsKHN0cikge1xuICBpZiAoc3RyLmluZGV4T2YoJ1xcXFwnKSA8IDAgJiYgc3RyLmluZGV4T2YoJyYnKSA8IDApIHsgcmV0dXJuIHN0cjsgfVxuXG4gIHJldHVybiBzdHIucmVwbGFjZShVTkVTQ0FQRV9BTExfUkUsIGZ1bmN0aW9uIChtYXRjaCwgZXNjYXBlZCwgZW50aXR5KSB7XG4gICAgaWYgKGVzY2FwZWQpIHsgcmV0dXJuIGVzY2FwZWQ7IH1cbiAgICByZXR1cm4gcmVwbGFjZUVudGl0eVBhdHRlcm4obWF0Y2gsIGVudGl0eSk7XG4gIH0pO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG52YXIgSFRNTF9FU0NBUEVfVEVTVF9SRSA9IC9bJjw+XCJdLztcbnZhciBIVE1MX0VTQ0FQRV9SRVBMQUNFX1JFID0gL1smPD5cIl0vZztcbnZhciBIVE1MX1JFUExBQ0VNRU5UUyA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnXG59O1xuXG5mdW5jdGlvbiByZXBsYWNlVW5zYWZlQ2hhcihjaCkge1xuICByZXR1cm4gSFRNTF9SRVBMQUNFTUVOVFNbY2hdO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVIdG1sKHN0cikge1xuICBpZiAoSFRNTF9FU0NBUEVfVEVTVF9SRS50ZXN0KHN0cikpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoSFRNTF9FU0NBUEVfUkVQTEFDRV9SRSwgcmVwbGFjZVVuc2FmZUNoYXIpO1xuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnZhciBSRUdFWFBfRVNDQVBFX1JFID0gL1suPyorXiRbXFxdXFxcXCgpe318LV0vZztcblxuZnVuY3Rpb24gZXNjYXBlUkUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZShSRUdFWFBfRVNDQVBFX1JFLCAnXFxcXCQmJyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIGlzU3BhY2UoY29kZSkge1xuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDk6XG4gICAgY2FzZSAweDIwOlxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBacyAodW5pY29kZSBjbGFzcykgfHwgW1xcdFxcZlxcdlxcclxcbl1cbmZ1bmN0aW9uIGlzV2hpdGVTcGFjZShjb2RlKSB7XG4gIGlmIChjb2RlID49IDB4MjAwMCAmJiBjb2RlIDw9IDB4MjAwQSkgeyByZXR1cm4gdHJ1ZTsgfVxuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDk6IC8vIFxcdFxuICAgIGNhc2UgMHgwQTogLy8gXFxuXG4gICAgY2FzZSAweDBCOiAvLyBcXHZcbiAgICBjYXNlIDB4MEM6IC8vIFxcZlxuICAgIGNhc2UgMHgwRDogLy8gXFxyXG4gICAgY2FzZSAweDIwOlxuICAgIGNhc2UgMHhBMDpcbiAgICBjYXNlIDB4MTY4MDpcbiAgICBjYXNlIDB4MjAyRjpcbiAgICBjYXNlIDB4MjA1RjpcbiAgICBjYXNlIDB4MzAwMDpcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyplc2xpbnQtZGlzYWJsZSBtYXgtbGVuKi9cbnZhciBVTklDT0RFX1BVTkNUX1JFID0gcmVxdWlyZSgndWMubWljcm8vY2F0ZWdvcmllcy9QL3JlZ2V4Jyk7XG5cbi8vIEN1cnJlbnRseSB3aXRob3V0IGFzdHJhbCBjaGFyYWN0ZXJzIHN1cHBvcnQuXG5mdW5jdGlvbiBpc1B1bmN0Q2hhcihjaCkge1xuICByZXR1cm4gVU5JQ09ERV9QVU5DVF9SRS50ZXN0KGNoKTtcbn1cblxuXG4vLyBNYXJrZG93biBBU0NJSSBwdW5jdHVhdGlvbiBjaGFyYWN0ZXJzLlxuLy9cbi8vICEsIFwiLCAjLCAkLCAlLCAmLCAnLCAoLCApLCAqLCArLCAsLCAtLCAuLCAvLCA6LCA7LCA8LCA9LCA+LCA/LCBALCBbLCBcXCwgXSwgXiwgXywgYCwgeywgfCwgfSwgb3IgflxuLy8gaHR0cDovL3NwZWMuY29tbW9ubWFyay5vcmcvMC4xNS8jYXNjaWktcHVuY3R1YXRpb24tY2hhcmFjdGVyXG4vL1xuLy8gRG9uJ3QgY29uZnVzZSB3aXRoIHVuaWNvZGUgcHVuY3R1YXRpb24gISEhIEl0IGxhY2tzIHNvbWUgY2hhcnMgaW4gYXNjaWkgcmFuZ2UuXG4vL1xuZnVuY3Rpb24gaXNNZEFzY2lpUHVuY3QoY2gpIHtcbiAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgMHgyMS8qICEgKi86XG4gICAgY2FzZSAweDIyLyogXCIgKi86XG4gICAgY2FzZSAweDIzLyogIyAqLzpcbiAgICBjYXNlIDB4MjQvKiAkICovOlxuICAgIGNhc2UgMHgyNS8qICUgKi86XG4gICAgY2FzZSAweDI2LyogJiAqLzpcbiAgICBjYXNlIDB4MjcvKiAnICovOlxuICAgIGNhc2UgMHgyOC8qICggKi86XG4gICAgY2FzZSAweDI5LyogKSAqLzpcbiAgICBjYXNlIDB4MkEvKiAqICovOlxuICAgIGNhc2UgMHgyQi8qICsgKi86XG4gICAgY2FzZSAweDJDLyogLCAqLzpcbiAgICBjYXNlIDB4MkQvKiAtICovOlxuICAgIGNhc2UgMHgyRS8qIC4gKi86XG4gICAgY2FzZSAweDJGLyogLyAqLzpcbiAgICBjYXNlIDB4M0EvKiA6ICovOlxuICAgIGNhc2UgMHgzQi8qIDsgKi86XG4gICAgY2FzZSAweDNDLyogPCAqLzpcbiAgICBjYXNlIDB4M0QvKiA9ICovOlxuICAgIGNhc2UgMHgzRS8qID4gKi86XG4gICAgY2FzZSAweDNGLyogPyAqLzpcbiAgICBjYXNlIDB4NDAvKiBAICovOlxuICAgIGNhc2UgMHg1Qi8qIFsgKi86XG4gICAgY2FzZSAweDVDLyogXFwgKi86XG4gICAgY2FzZSAweDVELyogXSAqLzpcbiAgICBjYXNlIDB4NUUvKiBeICovOlxuICAgIGNhc2UgMHg1Ri8qIF8gKi86XG4gICAgY2FzZSAweDYwLyogYCAqLzpcbiAgICBjYXNlIDB4N0IvKiB7ICovOlxuICAgIGNhc2UgMHg3Qy8qIHwgKi86XG4gICAgY2FzZSAweDdELyogfSAqLzpcbiAgICBjYXNlIDB4N0UvKiB+ICovOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vLyBIZXBsZXIgdG8gdW5pZnkgW3JlZmVyZW5jZSBsYWJlbHNdLlxuLy9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlZmVyZW5jZShzdHIpIHtcbiAgLy8gdXNlIC50b1VwcGVyQ2FzZSgpIGluc3RlYWQgb2YgLnRvTG93ZXJDYXNlKClcbiAgLy8gaGVyZSB0byBhdm9pZCBhIGNvbmZsaWN0IHdpdGggT2JqZWN0LnByb3RvdHlwZVxuICAvLyBtZW1iZXJzIChtb3N0IG5vdGFibHksIGBfX3Byb3RvX19gKVxuICByZXR1cm4gc3RyLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJykudG9VcHBlckNhc2UoKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gUmUtZXhwb3J0IGxpYnJhcmllcyBjb21tb25seSB1c2VkIGluIGJvdGggbWFya2Rvd24taXQgYW5kIGl0cyBwbHVnaW5zLFxuLy8gc28gcGx1Z2lucyB3b24ndCBoYXZlIHRvIGRlcGVuZCBvbiB0aGVtIGV4cGxpY2l0bHksIHdoaWNoIHJlZHVjZXMgdGhlaXJcbi8vIGJ1bmRsZWQgc2l6ZSAoZS5nLiBhIGJyb3dzZXIgYnVpbGQpLlxuLy9cbmV4cG9ydHMubGliICAgICAgICAgICAgICAgICA9IHt9O1xuZXhwb3J0cy5saWIubWR1cmwgICAgICAgICAgID0gcmVxdWlyZSgnbWR1cmwnKTtcbmV4cG9ydHMubGliLnVjbWljcm8gICAgICAgICA9IHJlcXVpcmUoJ3VjLm1pY3JvJyk7XG5cbmV4cG9ydHMuYXNzaWduICAgICAgICAgICAgICA9IGFzc2lnbjtcbmV4cG9ydHMuaXNTdHJpbmcgICAgICAgICAgICA9IGlzU3RyaW5nO1xuZXhwb3J0cy5oYXMgICAgICAgICAgICAgICAgID0gaGFzO1xuZXhwb3J0cy51bmVzY2FwZU1kICAgICAgICAgID0gdW5lc2NhcGVNZDtcbmV4cG9ydHMudW5lc2NhcGVBbGwgICAgICAgICA9IHVuZXNjYXBlQWxsO1xuZXhwb3J0cy5pc1ZhbGlkRW50aXR5Q29kZSAgID0gaXNWYWxpZEVudGl0eUNvZGU7XG5leHBvcnRzLmZyb21Db2RlUG9pbnQgICAgICAgPSBmcm9tQ29kZVBvaW50O1xuLy8gZXhwb3J0cy5yZXBsYWNlRW50aXRpZXMgICAgID0gcmVwbGFjZUVudGl0aWVzO1xuZXhwb3J0cy5lc2NhcGVIdG1sICAgICAgICAgID0gZXNjYXBlSHRtbDtcbmV4cG9ydHMuYXJyYXlSZXBsYWNlQXQgICAgICA9IGFycmF5UmVwbGFjZUF0O1xuZXhwb3J0cy5pc1NwYWNlICAgICAgICAgICAgID0gaXNTcGFjZTtcbmV4cG9ydHMuaXNXaGl0ZVNwYWNlICAgICAgICA9IGlzV2hpdGVTcGFjZTtcbmV4cG9ydHMuaXNNZEFzY2lpUHVuY3QgICAgICA9IGlzTWRBc2NpaVB1bmN0O1xuZXhwb3J0cy5pc1B1bmN0Q2hhciAgICAgICAgID0gaXNQdW5jdENoYXI7XG5leHBvcnRzLmVzY2FwZVJFICAgICAgICAgICAgPSBlc2NhcGVSRTtcbmV4cG9ydHMubm9ybWFsaXplUmVmZXJlbmNlICA9IG5vcm1hbGl6ZVJlZmVyZW5jZTtcbiIsIi8vIEp1c3QgYSBzaG9ydGN1dCBmb3IgYnVsayBleHBvcnRcbid1c2Ugc3RyaWN0JztcblxuXG5leHBvcnRzLnBhcnNlTGlua0xhYmVsICAgICAgID0gcmVxdWlyZSgnLi9wYXJzZV9saW5rX2xhYmVsJyk7XG5leHBvcnRzLnBhcnNlTGlua0Rlc3RpbmF0aW9uID0gcmVxdWlyZSgnLi9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uJyk7XG5leHBvcnRzLnBhcnNlTGlua1RpdGxlICAgICAgID0gcmVxdWlyZSgnLi9wYXJzZV9saW5rX3RpdGxlJyk7XG4iLCIvLyBQYXJzZSBsaW5rIGRlc3RpbmF0aW9uXG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBpc1NwYWNlICAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG52YXIgdW5lc2NhcGVBbGwgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS51bmVzY2FwZUFsbDtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlTGlua0Rlc3RpbmF0aW9uKHN0ciwgcG9zLCBtYXgpIHtcbiAgdmFyIGNvZGUsIGxldmVsLFxuICAgICAgbGluZXMgPSAwLFxuICAgICAgc3RhcnQgPSBwb3MsXG4gICAgICByZXN1bHQgPSB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgcG9zOiAwLFxuICAgICAgICBsaW5lczogMCxcbiAgICAgICAgc3RyOiAnJ1xuICAgICAgfTtcblxuICBpZiAoc3RyLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgzQyAvKiA8ICovKSB7XG4gICAgcG9zKys7XG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgY29kZSA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICBpZiAoY29kZSA9PT0gMHgwQSAvKiBcXG4gKi8gfHwgaXNTcGFjZShjb2RlKSkgeyByZXR1cm4gcmVzdWx0OyB9XG4gICAgICBpZiAoY29kZSA9PT0gMHgzRSAvKiA+ICovKSB7XG4gICAgICAgIHJlc3VsdC5wb3MgPSBwb3MgKyAxO1xuICAgICAgICByZXN1bHQuc3RyID0gdW5lc2NhcGVBbGwoc3RyLnNsaWNlKHN0YXJ0ICsgMSwgcG9zKSk7XG4gICAgICAgIHJlc3VsdC5vayA9IHRydWU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gMHg1QyAvKiBcXCAqLyAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgICAgIHBvcyArPSAyO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcG9zKys7XG4gICAgfVxuXG4gICAgLy8gbm8gY2xvc2luZyAnPidcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gdGhpcyBzaG91bGQgYmUgLi4uIH0gZWxzZSB7IC4uLiBicmFuY2hcblxuICBsZXZlbCA9IDA7XG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmIChjb2RlID09PSAweDIwKSB7IGJyZWFrOyB9XG5cbiAgICAvLyBhc2NpaSBjb250cm9sIGNoYXJhY3RlcnNcbiAgICBpZiAoY29kZSA8IDB4MjAgfHwgY29kZSA9PT0gMHg3RikgeyBicmVhazsgfVxuXG4gICAgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gMHgyOCAvKiAoICovKSB7XG4gICAgICBsZXZlbCsrO1xuICAgIH1cblxuICAgIGlmIChjb2RlID09PSAweDI5IC8qICkgKi8pIHtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkgeyBicmVhazsgfVxuICAgICAgbGV2ZWwtLTtcbiAgICB9XG5cbiAgICBwb3MrKztcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gcG9zKSB7IHJldHVybiByZXN1bHQ7IH1cbiAgaWYgKGxldmVsICE9PSAwKSB7IHJldHVybiByZXN1bHQ7IH1cblxuICByZXN1bHQuc3RyID0gdW5lc2NhcGVBbGwoc3RyLnNsaWNlKHN0YXJ0LCBwb3MpKTtcbiAgcmVzdWx0LmxpbmVzID0gbGluZXM7XG4gIHJlc3VsdC5wb3MgPSBwb3M7XG4gIHJlc3VsdC5vayA9IHRydWU7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiLy8gUGFyc2UgbGluayBsYWJlbFxuLy9cbi8vIHRoaXMgZnVuY3Rpb24gYXNzdW1lcyB0aGF0IGZpcnN0IGNoYXJhY3RlciAoXCJbXCIpIGFscmVhZHkgbWF0Y2hlcztcbi8vIHJldHVybnMgdGhlIGVuZCBvZiB0aGUgbGFiZWxcbi8vXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VMaW5rTGFiZWwoc3RhdGUsIHN0YXJ0LCBkaXNhYmxlTmVzdGVkKSB7XG4gIHZhciBsZXZlbCwgZm91bmQsIG1hcmtlciwgcHJldlBvcyxcbiAgICAgIGxhYmVsRW5kID0gLTEsXG4gICAgICBtYXggPSBzdGF0ZS5wb3NNYXgsXG4gICAgICBvbGRQb3MgPSBzdGF0ZS5wb3M7XG5cbiAgc3RhdGUucG9zID0gc3RhcnQgKyAxO1xuICBsZXZlbCA9IDE7XG5cbiAgd2hpbGUgKHN0YXRlLnBvcyA8IG1heCkge1xuICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyk7XG4gICAgaWYgKG1hcmtlciA9PT0gMHg1RCAvKiBdICovKSB7XG4gICAgICBsZXZlbC0tO1xuICAgICAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJldlBvcyA9IHN0YXRlLnBvcztcbiAgICBzdGF0ZS5tZC5pbmxpbmUuc2tpcFRva2VuKHN0YXRlKTtcbiAgICBpZiAobWFya2VyID09PSAweDVCIC8qIFsgKi8pIHtcbiAgICAgIGlmIChwcmV2UG9zID09PSBzdGF0ZS5wb3MgLSAxKSB7XG4gICAgICAgIC8vIGluY3JlYXNlIGxldmVsIGlmIHdlIGZpbmQgdGV4dCBgW2AsIHdoaWNoIGlzIG5vdCBhIHBhcnQgb2YgYW55IHRva2VuXG4gICAgICAgIGxldmVsKys7XG4gICAgICB9IGVsc2UgaWYgKGRpc2FibGVOZXN0ZWQpIHtcbiAgICAgICAgc3RhdGUucG9zID0gb2xkUG9zO1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGZvdW5kKSB7XG4gICAgbGFiZWxFbmQgPSBzdGF0ZS5wb3M7XG4gIH1cblxuICAvLyByZXN0b3JlIG9sZCBzdGF0ZVxuICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG5cbiAgcmV0dXJuIGxhYmVsRW5kO1xufTtcbiIsIi8vIFBhcnNlIGxpbmsgdGl0bGVcbi8vXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIHVuZXNjYXBlQWxsID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykudW5lc2NhcGVBbGw7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZUxpbmtUaXRsZShzdHIsIHBvcywgbWF4KSB7XG4gIHZhciBjb2RlLFxuICAgICAgbWFya2VyLFxuICAgICAgbGluZXMgPSAwLFxuICAgICAgc3RhcnQgPSBwb3MsXG4gICAgICByZXN1bHQgPSB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgcG9zOiAwLFxuICAgICAgICBsaW5lczogMCxcbiAgICAgICAgc3RyOiAnJ1xuICAgICAgfTtcblxuICBpZiAocG9zID49IG1heCkgeyByZXR1cm4gcmVzdWx0OyB9XG5cbiAgbWFya2VyID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcblxuICBpZiAobWFya2VyICE9PSAweDIyIC8qIFwiICovICYmIG1hcmtlciAhPT0gMHgyNyAvKiAnICovICYmIG1hcmtlciAhPT0gMHgyOCAvKiAoICovKSB7IHJldHVybiByZXN1bHQ7IH1cblxuICBwb3MrKztcblxuICAvLyBpZiBvcGVuaW5nIG1hcmtlciBpcyBcIihcIiwgc3dpdGNoIGl0IHRvIGNsb3NpbmcgbWFya2VyIFwiKVwiXG4gIGlmIChtYXJrZXIgPT09IDB4MjgpIHsgbWFya2VyID0gMHgyOTsgfVxuXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY29kZSA9PT0gbWFya2VyKSB7XG4gICAgICByZXN1bHQucG9zID0gcG9zICsgMTtcbiAgICAgIHJlc3VsdC5saW5lcyA9IGxpbmVzO1xuICAgICAgcmVzdWx0LnN0ciA9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCArIDEsIHBvcykpO1xuICAgICAgcmVzdWx0Lm9rID0gdHJ1ZTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSAweDBBKSB7XG4gICAgICBsaW5lcysrO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMHg1QyAvKiBcXCAqLyAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgICBwb3MrKztcbiAgICAgIGlmIChzdHIuY2hhckNvZGVBdChwb3MpID09PSAweDBBKSB7XG4gICAgICAgIGxpbmVzKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcG9zKys7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIi8vIE1haW4gcGFyc2VyIGNsYXNzXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgdXRpbHMgICAgICAgID0gcmVxdWlyZSgnLi9jb21tb24vdXRpbHMnKTtcbnZhciBoZWxwZXJzICAgICAgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcbnZhciBSZW5kZXJlciAgICAgPSByZXF1aXJlKCcuL3JlbmRlcmVyJyk7XG52YXIgUGFyc2VyQ29yZSAgID0gcmVxdWlyZSgnLi9wYXJzZXJfY29yZScpO1xudmFyIFBhcnNlckJsb2NrICA9IHJlcXVpcmUoJy4vcGFyc2VyX2Jsb2NrJyk7XG52YXIgUGFyc2VySW5saW5lID0gcmVxdWlyZSgnLi9wYXJzZXJfaW5saW5lJyk7XG52YXIgTGlua2lmeUl0ICAgID0gcmVxdWlyZSgnbGlua2lmeS1pdCcpO1xudmFyIG1kdXJsICAgICAgICA9IHJlcXVpcmUoJ21kdXJsJyk7XG52YXIgcHVueWNvZGUgICAgID0gcmVxdWlyZSgncHVueWNvZGUnKTtcblxuXG52YXIgY29uZmlnID0ge1xuICAnZGVmYXVsdCc6IHJlcXVpcmUoJy4vcHJlc2V0cy9kZWZhdWx0JyksXG4gIHplcm86IHJlcXVpcmUoJy4vcHJlc2V0cy96ZXJvJyksXG4gIGNvbW1vbm1hcms6IHJlcXVpcmUoJy4vcHJlc2V0cy9jb21tb25tYXJrJylcbn07XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gVGhpcyB2YWxpZGF0b3IgY2FuIHByb2hpYml0IG1vcmUgdGhhbiByZWFsbHkgbmVlZGVkIHRvIHByZXZlbnQgWFNTLiBJdCdzIGFcbi8vIHRyYWRlb2ZmIHRvIGtlZXAgY29kZSBzaW1wbGUgYW5kIHRvIGJlIHNlY3VyZSBieSBkZWZhdWx0LlxuLy9cbi8vIElmIHlvdSBuZWVkIGRpZmZlcmVudCBzZXR1cCAtIG92ZXJyaWRlIHZhbGlkYXRvciBtZXRob2QgYXMgeW91IHdpc2guIE9yXG4vLyByZXBsYWNlIGl0IHdpdGggZHVtbXkgZnVuY3Rpb24gYW5kIHVzZSBleHRlcm5hbCBzYW5pdGl6ZXIuXG4vL1xuXG52YXIgQkFEX1BST1RPX1JFID0gL14odmJzY3JpcHR8amF2YXNjcmlwdHxmaWxlfGRhdGEpOi87XG52YXIgR09PRF9EQVRBX1JFID0gL15kYXRhOmltYWdlXFwvKGdpZnxwbmd8anBlZ3x3ZWJwKTsvO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZUxpbmsodXJsKSB7XG4gIC8vIHVybCBzaG91bGQgYmUgbm9ybWFsaXplZCBhdCB0aGlzIHBvaW50LCBhbmQgZXhpc3RpbmcgZW50aXRpZXMgYXJlIGRlY29kZWRcbiAgdmFyIHN0ciA9IHVybC50cmltKCkudG9Mb3dlckNhc2UoKTtcblxuICByZXR1cm4gQkFEX1BST1RPX1JFLnRlc3Qoc3RyKSA/IChHT09EX0RBVEFfUkUudGVzdChzdHIpID8gdHJ1ZSA6IGZhbHNlKSA6IHRydWU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxudmFyIFJFQ09ERV9IT1NUTkFNRV9GT1IgPSBbICdodHRwOicsICdodHRwczonLCAnbWFpbHRvOicgXTtcblxuZnVuY3Rpb24gbm9ybWFsaXplTGluayh1cmwpIHtcbiAgdmFyIHBhcnNlZCA9IG1kdXJsLnBhcnNlKHVybCwgdHJ1ZSk7XG5cbiAgaWYgKHBhcnNlZC5ob3N0bmFtZSkge1xuICAgIC8vIEVuY29kZSBob3N0bmFtZXMgaW4gdXJscyBsaWtlOlxuICAgIC8vIGBodHRwOi8vaG9zdC9gLCBgaHR0cHM6Ly9ob3N0L2AsIGBtYWlsdG86dXNlckBob3N0YCwgYC8vaG9zdC9gXG4gICAgLy9cbiAgICAvLyBXZSBkb24ndCBlbmNvZGUgdW5rbm93biBzY2hlbWFzLCBiZWNhdXNlIGl0J3MgbGlrZWx5IHRoYXQgd2UgZW5jb2RlXG4gICAgLy8gc29tZXRoaW5nIHdlIHNob3VsZG4ndCAoZS5nLiBgc2t5cGU6bmFtZWAgdHJlYXRlZCBhcyBgc2t5cGU6aG9zdGApXG4gICAgLy9cbiAgICBpZiAoIXBhcnNlZC5wcm90b2NvbCB8fCBSRUNPREVfSE9TVE5BTUVfRk9SLmluZGV4T2YocGFyc2VkLnByb3RvY29sKSA+PSAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICBwYXJzZWQuaG9zdG5hbWUgPSBwdW55Y29kZS50b0FTQ0lJKHBhcnNlZC5ob3N0bmFtZSk7XG4gICAgICB9IGNhdGNoIChlcikgeyAvKiovIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWR1cmwuZW5jb2RlKG1kdXJsLmZvcm1hdChwYXJzZWQpKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGlua1RleHQodXJsKSB7XG4gIHZhciBwYXJzZWQgPSBtZHVybC5wYXJzZSh1cmwsIHRydWUpO1xuXG4gIGlmIChwYXJzZWQuaG9zdG5hbWUpIHtcbiAgICAvLyBFbmNvZGUgaG9zdG5hbWVzIGluIHVybHMgbGlrZTpcbiAgICAvLyBgaHR0cDovL2hvc3QvYCwgYGh0dHBzOi8vaG9zdC9gLCBgbWFpbHRvOnVzZXJAaG9zdGAsIGAvL2hvc3QvYFxuICAgIC8vXG4gICAgLy8gV2UgZG9uJ3QgZW5jb2RlIHVua25vd24gc2NoZW1hcywgYmVjYXVzZSBpdCdzIGxpa2VseSB0aGF0IHdlIGVuY29kZVxuICAgIC8vIHNvbWV0aGluZyB3ZSBzaG91bGRuJ3QgKGUuZy4gYHNreXBlOm5hbWVgIHRyZWF0ZWQgYXMgYHNreXBlOmhvc3RgKVxuICAgIC8vXG4gICAgaWYgKCFwYXJzZWQucHJvdG9jb2wgfHwgUkVDT0RFX0hPU1ROQU1FX0ZPUi5pbmRleE9mKHBhcnNlZC5wcm90b2NvbCkgPj0gMCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFyc2VkLmhvc3RuYW1lID0gcHVueWNvZGUudG9Vbmljb2RlKHBhcnNlZC5ob3N0bmFtZSk7XG4gICAgICB9IGNhdGNoIChlcikgeyAvKiovIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWR1cmwuZGVjb2RlKG1kdXJsLmZvcm1hdChwYXJzZWQpKTtcbn1cblxuXG4vKipcbiAqIGNsYXNzIE1hcmtkb3duSXRcbiAqXG4gKiBNYWluIHBhcnNlci9yZW5kZXJlciBjbGFzcy5cbiAqXG4gKiAjIyMjIyBVc2FnZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIC8vIG5vZGUuanMsIFwiY2xhc3NpY1wiIHdheTpcbiAqIHZhciBNYXJrZG93bkl0ID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSxcbiAqICAgICBtZCA9IG5ldyBNYXJrZG93bkl0KCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqXG4gKiAvLyBub2RlLmpzLCB0aGUgc2FtZSwgYnV0IHdpdGggc3VnYXI6XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqXG4gKiAvLyBicm93c2VyIHdpdGhvdXQgQU1ELCBhZGRlZCB0byBcIndpbmRvd1wiIG9uIHNjcmlwdCBsb2FkXG4gKiAvLyBOb3RlLCB0aGVyZSBhcmUgbm8gZGFzaC5cbiAqIHZhciBtZCA9IHdpbmRvdy5tYXJrZG93bml0KCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqIGBgYFxuICpcbiAqIFNpbmdsZSBsaW5lIHJlbmRlcmluZywgd2l0aG91dCBwYXJhZ3JhcGggd3JhcDpcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVySW5saW5lKCdfX21hcmtkb3duLWl0X18gcnVsZXp6IScpO1xuICogYGBgXG4gKiovXG5cbi8qKlxuICogbmV3IE1hcmtkb3duSXQoW3ByZXNldE5hbWUsIG9wdGlvbnNdKVxuICogLSBwcmVzZXROYW1lIChTdHJpbmcpOiBvcHRpb25hbCwgYGNvbW1vbm1hcmtgIC8gYHplcm9gXG4gKiAtIG9wdGlvbnMgKE9iamVjdClcbiAqXG4gKiBDcmVhdGVzIHBhcnNlciBpbnN0YW5zZSB3aXRoIGdpdmVuIGNvbmZpZy4gQ2FuIGJlIGNhbGxlZCB3aXRob3V0IGBuZXdgLlxuICpcbiAqICMjIyMjIHByZXNldE5hbWVcbiAqXG4gKiBNYXJrZG93bkl0IHByb3ZpZGVzIG5hbWVkIHByZXNldHMgYXMgYSBjb252ZW5pZW5jZSB0byBxdWlja2x5XG4gKiBlbmFibGUvZGlzYWJsZSBhY3RpdmUgc3ludGF4IHJ1bGVzIGFuZCBvcHRpb25zIGZvciBjb21tb24gdXNlIGNhc2VzLlxuICpcbiAqIC0gW1wiY29tbW9ubWFya1wiXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvY29tbW9ubWFyay5qcykgLVxuICogICBjb25maWd1cmVzIHBhcnNlciB0byBzdHJpY3QgW0NvbW1vbk1hcmtdKGh0dHA6Ly9jb21tb25tYXJrLm9yZy8pIG1vZGUuXG4gKiAtIFtkZWZhdWx0XShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvZGVmYXVsdC5qcykgLVxuICogICBzaW1pbGFyIHRvIEdGTSwgdXNlZCB3aGVuIG5vIHByZXNldCBuYW1lIGdpdmVuLiBFbmFibGVzIGFsbCBhdmFpbGFibGUgcnVsZXMsXG4gKiAgIGJ1dCBzdGlsbCB3aXRob3V0IGh0bWwsIHR5cG9ncmFwaGVyICYgYXV0b2xpbmtlci5cbiAqIC0gW1wiemVyb1wiXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvemVyby5qcykgLVxuICogICBhbGwgcnVsZXMgZGlzYWJsZWQuIFVzZWZ1bCB0byBxdWlja2x5IHNldHVwIHlvdXIgY29uZmlnIHZpYSBgLmVuYWJsZSgpYC5cbiAqICAgRm9yIGV4YW1wbGUsIHdoZW4geW91IG5lZWQgb25seSBgYm9sZGAgYW5kIGBpdGFsaWNgIG1hcmt1cCBhbmQgbm90aGluZyBlbHNlLlxuICpcbiAqICMjIyMjIG9wdGlvbnM6XG4gKlxuICogLSBfX2h0bWxfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gZW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2UuIEJlIGNhcmVmdWwhXG4gKiAgIFRoYXQncyBub3Qgc2FmZSEgWW91IG1heSBuZWVkIGV4dGVybmFsIHNhbml0aXplciB0byBwcm90ZWN0IG91dHB1dCBmcm9tIFhTUy5cbiAqICAgSXQncyBiZXR0ZXIgdG8gZXh0ZW5kIGZlYXR1cmVzIHZpYSBwbHVnaW5zLCBpbnN0ZWFkIG9mIGVuYWJsaW5nIEhUTUwuXG4gKiAtIF9feGh0bWxPdXRfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gYWRkICcvJyB3aGVuIGNsb3Npbmcgc2luZ2xlIHRhZ3NcbiAqICAgKGA8YnIgLz5gKS4gVGhpcyBpcyBuZWVkZWQgb25seSBmb3IgZnVsbCBDb21tb25NYXJrIGNvbXBhdGliaWxpdHkuIEluIHJlYWxcbiAqICAgd29ybGQgeW91IHdpbGwgbmVlZCBIVE1MIG91dHB1dC5cbiAqIC0gX19icmVha3NfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gY29udmVydCBgXFxuYCBpbiBwYXJhZ3JhcGhzIGludG8gYDxicj5gLlxuICogLSBfX2xhbmdQcmVmaXhfXyAtIGBsYW5ndWFnZS1gLiBDU1MgbGFuZ3VhZ2UgY2xhc3MgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzLlxuICogICBDYW4gYmUgdXNlZnVsIGZvciBleHRlcm5hbCBoaWdobGlnaHRlcnMuXG4gKiAtIF9fbGlua2lmeV9fIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0IHRvIGxpbmtzLlxuICogLSBfX3R5cG9ncmFwaGVyX18gIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBlbmFibGUgW3NvbWUgbGFuZ3VhZ2UtbmV1dHJhbFxuICogICByZXBsYWNlbWVudF0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cy5qcykgK1xuICogICBxdW90ZXMgYmVhdXRpZmljYXRpb24gKHNtYXJ0cXVvdGVzKS5cbiAqIC0gX19xdW90ZXNfXyAtIGDigJzigJ3igJjigJlgLCBTdHJpbmcgb3IgQXJyYXkuIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnRcbiAqICAgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCBhbmQgc21hcnRxdW90ZXMgb24uIEZvciBleGFtcGxlLCB5b3UgY2FuXG4gKiAgIHVzZSBgJ8KrwrvigJ7igJwnYCBmb3IgUnVzc2lhbiwgYCfigJ7igJzigJrigJgnYCBmb3IgR2VybWFuLCBhbmRcbiAqICAgYFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J11gIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAqIC0gX19oaWdobGlnaHRfXyAtIGBudWxsYC4gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24gZm9yIGZlbmNlZCBjb2RlIGJsb2Nrcy5cbiAqICAgSGlnaGxpZ2h0ZXIgYGZ1bmN0aW9uIChzdHIsIGxhbmcpYCBzaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTC4gSXQgY2FuIGFsc29cbiAqICAgcmV0dXJuIGVtcHR5IHN0cmluZyBpZiB0aGUgc291cmNlIHdhcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWRcbiAqICAgZXh0ZXJuYWx5LiBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIC8vIGNvbW1vbm1hcmsgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgnY29tbW9ubWFyaycpO1xuICpcbiAqIC8vIGRlZmF1bHQgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIC8vIGVuYWJsZSBldmVyeXRoaW5nXG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKHtcbiAqICAgaHRtbDogdHJ1ZSxcbiAqICAgbGlua2lmeTogdHJ1ZSxcbiAqICAgdHlwb2dyYXBoZXI6IHRydWVcbiAqIH0pO1xuICogYGBgXG4gKlxuICogIyMjIyMgU3ludGF4IGhpZ2hsaWdodGluZ1xuICpcbiAqIGBgYGpzXG4gKiB2YXIgaGxqcyA9IHJlcXVpcmUoJ2hpZ2hsaWdodC5qcycpIC8vIGh0dHBzOi8vaGlnaGxpZ2h0anMub3JnL1xuICpcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQobGFuZywgc3RyLCB0cnVlKS52YWx1ZTtcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICcnOyAvLyB1c2UgZXh0ZXJuYWwgZGVmYXVsdCBlc2NhcGluZ1xuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIE9yIHdpdGggZnVsbCB3cmFwcGVyIG92ZXJyaWRlIChpZiB5b3UgbmVlZCBhc3NpZ24gY2xhc3MgdG8gYDxwcmU+YCk6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIGhsanMgPSByZXF1aXJlKCdoaWdobGlnaHQuanMnKSAvLyBodHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiAqXG4gKiAvLyBBY3R1YWwgZGVmYXVsdCB2YWx1ZXNcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gJzxwcmUgY2xhc3M9XCJobGpzXCI+PGNvZGU+JyArXG4gKiAgICAgICAgICAgICAgICBobGpzLmhpZ2hsaWdodChsYW5nLCBzdHIsIHRydWUpLnZhbHVlICtcbiAqICAgICAgICAgICAgICAgICc8L2NvZGU+PC9wcmU+JztcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICc8cHJlIGNsYXNzPVwiaGxqc1wiPjxjb2RlPicgKyBtZC51dGlscy5lc2NhcGVIdG1sKHN0cikgKyAnPC9jb2RlPjwvcHJlPic7XG4gKiAgIH1cbiAqIH0pO1xuICogYGBgXG4gKlxuICoqL1xuZnVuY3Rpb24gTWFya2Rvd25JdChwcmVzZXROYW1lLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNYXJrZG93bkl0KSkge1xuICAgIHJldHVybiBuZXcgTWFya2Rvd25JdChwcmVzZXROYW1lLCBvcHRpb25zKTtcbiAgfVxuXG4gIGlmICghb3B0aW9ucykge1xuICAgIGlmICghdXRpbHMuaXNTdHJpbmcocHJlc2V0TmFtZSkpIHtcbiAgICAgIG9wdGlvbnMgPSBwcmVzZXROYW1lIHx8IHt9O1xuICAgICAgcHJlc2V0TmFtZSA9ICdkZWZhdWx0JztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFya2Rvd25JdCNpbmxpbmUgLT4gUGFyc2VySW5saW5lXG4gICAqXG4gICAqIEluc3RhbmNlIG9mIFtbUGFyc2VySW5saW5lXV0uIFlvdSBtYXkgbmVlZCBpdCB0byBhZGQgbmV3IHJ1bGVzIHdoZW5cbiAgICogd3JpdGluZyBwbHVnaW5zLiBGb3Igc2ltcGxlIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0gYW5kXG4gICAqIFtbTWFya2Rvd25JdC5lbmFibGVdXS5cbiAgICoqL1xuICB0aGlzLmlubGluZSA9IG5ldyBQYXJzZXJJbmxpbmUoKTtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNibG9jayAtPiBQYXJzZXJCbG9ja1xuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW1BhcnNlckJsb2NrXV0uIFlvdSBtYXkgbmVlZCBpdCB0byBhZGQgbmV3IHJ1bGVzIHdoZW5cbiAgICogd3JpdGluZyBwbHVnaW5zLiBGb3Igc2ltcGxlIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0gYW5kXG4gICAqIFtbTWFya2Rvd25JdC5lbmFibGVdXS5cbiAgICoqL1xuICB0aGlzLmJsb2NrID0gbmV3IFBhcnNlckJsb2NrKCk7XG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjY29yZSAtPiBDb3JlXG4gICAqXG4gICAqIEluc3RhbmNlIG9mIFtbQ29yZV1dIGNoYWluIGV4ZWN1dG9yLiBZb3UgbWF5IG5lZWQgaXQgdG8gYWRkIG5ldyBydWxlcyB3aGVuXG4gICAqIHdyaXRpbmcgcGx1Z2lucy4gRm9yIHNpbXBsZSBydWxlcyBjb250cm9sIHVzZSBbW01hcmtkb3duSXQuZGlzYWJsZV1dIGFuZFxuICAgKiBbW01hcmtkb3duSXQuZW5hYmxlXV0uXG4gICAqKi9cbiAgdGhpcy5jb3JlID0gbmV3IFBhcnNlckNvcmUoKTtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNyZW5kZXJlciAtPiBSZW5kZXJlclxuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW1JlbmRlcmVyXV0uIFVzZSBpdCB0byBtb2RpZnkgb3V0cHV0IGxvb2suIE9yIHRvIGFkZCByZW5kZXJpbmdcbiAgICogcnVsZXMgZm9yIG5ldyB0b2tlbiB0eXBlcywgZ2VuZXJhdGVkIGJ5IHBsdWdpbnMuXG4gICAqXG4gICAqICMjIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gICAqXG4gICAqIGZ1bmN0aW9uIG15VG9rZW4odG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2VsZikge1xuICAgKiAgIC8vLi4uXG4gICAqICAgcmV0dXJuIHJlc3VsdDtcbiAgICogfTtcbiAgICpcbiAgICogbWQucmVuZGVyZXIucnVsZXNbJ215X3Rva2VuJ10gPSBteVRva2VuXG4gICAqIGBgYFxuICAgKlxuICAgKiBTZWUgW1tSZW5kZXJlcl1dIGRvY3MgYW5kIFtzb3VyY2UgY29kZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9yZW5kZXJlci5qcykuXG4gICAqKi9cbiAgdGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcigpO1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I2xpbmtpZnkgLT4gTGlua2lmeUl0XG4gICAqXG4gICAqIFtsaW5raWZ5LWl0XShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbGlua2lmeS1pdCkgaW5zdGFuY2UuXG4gICAqIFVzZWQgYnkgW2xpbmtpZnldKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcnVsZXNfY29yZS9saW5raWZ5LmpzKVxuICAgKiBydWxlLlxuICAgKiovXG4gIHRoaXMubGlua2lmeSA9IG5ldyBMaW5raWZ5SXQoKTtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCN2YWxpZGF0ZUxpbmsodXJsKSAtPiBCb29sZWFuXG4gICAqXG4gICAqIExpbmsgdmFsaWRhdGlvbiBmdW5jdGlvbi4gQ29tbW9uTWFyayBhbGxvd3MgdG9vIG11Y2ggaW4gbGlua3MuIEJ5IGRlZmF1bHRcbiAgICogd2UgZGlzYWJsZSBgamF2YXNjcmlwdDpgLCBgdmJzY3JpcHQ6YCwgYGZpbGU6YCBzY2hlbWFzLCBhbmQgYWxtb3N0IGFsbCBgZGF0YTouLi5gIHNjaGVtYXNcbiAgICogZXhjZXB0IHNvbWUgZW1iZWRkZWQgaW1hZ2UgdHlwZXMuXG4gICAqXG4gICAqIFlvdSBjYW4gY2hhbmdlIHRoaXMgYmVoYXZpb3VyOlxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAgICogLy8gZW5hYmxlIGV2ZXJ5dGhpbmdcbiAgICogbWQudmFsaWRhdGVMaW5rID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgKiBgYGBcbiAgICoqL1xuICB0aGlzLnZhbGlkYXRlTGluayA9IHZhbGlkYXRlTGluaztcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNub3JtYWxpemVMaW5rKHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZW5jb2RlIGxpbmsgdXJsIHRvIGEgbWFjaGluZS1yZWFkYWJsZSBmb3JtYXQsXG4gICAqIHdoaWNoIGluY2x1ZGVzIHVybC1lbmNvZGluZywgcHVueWNvZGUsIGV0Yy5cbiAgICoqL1xuICB0aGlzLm5vcm1hbGl6ZUxpbmsgPSBub3JtYWxpemVMaW5rO1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I25vcm1hbGl6ZUxpbmtUZXh0KHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZGVjb2RlIGxpbmsgdXJsIHRvIGEgaHVtYW4tcmVhZGFibGUgZm9ybWF0YFxuICAgKiovXG4gIHRoaXMubm9ybWFsaXplTGlua1RleHQgPSBub3JtYWxpemVMaW5rVGV4dDtcblxuXG4gIC8vIEV4cG9zZSB1dGlscyAmIGhlbHBlcnMgZm9yIGVhc3kgYWNjZXMgZnJvbSBwbHVnaW5zXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjdXRpbHMgLT4gdXRpbHNcbiAgICpcbiAgICogQXNzb3J0ZWQgdXRpbGl0eSBmdW5jdGlvbnMsIHVzZWZ1bCB0byB3cml0ZSBwbHVnaW5zLiBTZWUgZGV0YWlsc1xuICAgKiBbaGVyZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9jb21tb24vdXRpbHMuanMpLlxuICAgKiovXG4gIHRoaXMudXRpbHMgPSB1dGlscztcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNoZWxwZXJzIC0+IGhlbHBlcnNcbiAgICpcbiAgICogTGluayBjb21wb25lbnRzIHBhcnNlciBmdW5jdGlvbnMsIHVzZWZ1bCB0byB3cml0ZSBwbHVnaW5zLiBTZWUgZGV0YWlsc1xuICAgKiBbaGVyZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9oZWxwZXJzKS5cbiAgICoqL1xuICB0aGlzLmhlbHBlcnMgPSB1dGlscy5hc3NpZ24oe30sIGhlbHBlcnMpO1xuXG5cbiAgdGhpcy5vcHRpb25zID0ge307XG4gIHRoaXMuY29uZmlndXJlKHByZXNldE5hbWUpO1xuXG4gIGlmIChvcHRpb25zKSB7IHRoaXMuc2V0KG9wdGlvbnMpOyB9XG59XG5cblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC5zZXQob3B0aW9ucylcbiAqXG4gKiBTZXQgcGFyc2VyIG9wdGlvbnMgKGluIHRoZSBzYW1lIGZvcm1hdCBhcyBpbiBjb25zdHJ1Y3RvcikuIFByb2JhYmx5LCB5b3VcbiAqIHdpbGwgbmV2ZXIgbmVlZCBpdCwgYnV0IHlvdSBjYW4gY2hhbmdlIG9wdGlvbnMgYWZ0ZXIgY29uc3RydWN0b3IgY2FsbC5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAuc2V0KHsgaHRtbDogdHJ1ZSwgYnJlYWtzOiB0cnVlIH0pXG4gKiAgICAgICAgICAgICAuc2V0KHsgdHlwb2dyYXBoZXIsIHRydWUgfSk7XG4gKiBgYGBcbiAqXG4gKiBfX05vdGU6X18gVG8gYWNoaWV2ZSB0aGUgYmVzdCBwb3NzaWJsZSBwZXJmb3JtYW5jZSwgZG9uJ3QgbW9kaWZ5IGFcbiAqIGBtYXJrZG93bi1pdGAgaW5zdGFuY2Ugb3B0aW9ucyBvbiB0aGUgZmx5LiBJZiB5b3UgbmVlZCBtdWx0aXBsZSBjb25maWd1cmF0aW9uc1xuICogaXQncyBiZXN0IHRvIGNyZWF0ZSBtdWx0aXBsZSBpbnN0YW5jZXMgYW5kIGluaXRpYWxpemUgZWFjaCB3aXRoIHNlcGFyYXRlXG4gKiBjb25maWcuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB1dGlscy5hc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKiBjaGFpbmFibGUsIGludGVybmFsXG4gKiBNYXJrZG93bkl0LmNvbmZpZ3VyZShwcmVzZXRzKVxuICpcbiAqIEJhdGNoIGxvYWQgb2YgYWxsIG9wdGlvbnMgYW5kIGNvbXBlbmVudCBzZXR0aW5ncy4gVGhpcyBpcyBpbnRlcm5hbCBtZXRob2QsXG4gKiBhbmQgeW91IHByb2JhYmx5IHdpbGwgbm90IG5lZWQgaXQuIEJ1dCBpZiB5b3Ugd2l0aCAtIHNlZSBhdmFpbGFibGUgcHJlc2V0c1xuICogYW5kIGRhdGEgc3RydWN0dXJlIFtoZXJlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvdHJlZS9tYXN0ZXIvbGliL3ByZXNldHMpXG4gKlxuICogV2Ugc3Ryb25nbHkgcmVjb21tZW5kIHRvIHVzZSBwcmVzZXRzIGluc3RlYWQgb2YgZGlyZWN0IGNvbmZpZyBsb2Fkcy4gVGhhdFxuICogd2lsbCBnaXZlIGJldHRlciBjb21wYXRpYmlsaXR5IHdpdGggbmV4dCB2ZXJzaW9ucy5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChwcmVzZXRzKSB7XG4gIHZhciBzZWxmID0gdGhpcywgcHJlc2V0TmFtZTtcblxuICBpZiAodXRpbHMuaXNTdHJpbmcocHJlc2V0cykpIHtcbiAgICBwcmVzZXROYW1lID0gcHJlc2V0cztcbiAgICBwcmVzZXRzID0gY29uZmlnW3ByZXNldE5hbWVdO1xuICAgIGlmICghcHJlc2V0cykgeyB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGBtYXJrZG93bi1pdGAgcHJlc2V0IFwiJyArIHByZXNldE5hbWUgKyAnXCIsIGNoZWNrIG5hbWUnKTsgfVxuICB9XG5cbiAgaWYgKCFwcmVzZXRzKSB7IHRocm93IG5ldyBFcnJvcignV3JvbmcgYG1hcmtkb3duLWl0YCBwcmVzZXQsIGNhblxcJ3QgYmUgZW1wdHknKTsgfVxuXG4gIGlmIChwcmVzZXRzLm9wdGlvbnMpIHsgc2VsZi5zZXQocHJlc2V0cy5vcHRpb25zKTsgfVxuXG4gIGlmIChwcmVzZXRzLmNvbXBvbmVudHMpIHtcbiAgICBPYmplY3Qua2V5cyhwcmVzZXRzLmNvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIGlmIChwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMpIHtcbiAgICAgICAgc2VsZltuYW1lXS5ydWxlci5lbmFibGVPbmx5KHByZXNldHMuY29tcG9uZW50c1tuYW1lXS5ydWxlcyk7XG4gICAgICB9XG4gICAgICBpZiAocHJlc2V0cy5jb21wb25lbnRzW25hbWVdLnJ1bGVzMikge1xuICAgICAgICBzZWxmW25hbWVdLnJ1bGVyMi5lbmFibGVPbmx5KHByZXNldHMuY29tcG9uZW50c1tuYW1lXS5ydWxlczIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKiogY2hhaW5hYmxlXG4gKiBNYXJrZG93bkl0LmVuYWJsZShsaXN0LCBpZ25vcmVJbnZhbGlkKVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBydWxlIG5hbWUgb3IgbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZVxuICogLSBpZ25vcmVJbnZhbGlkIChCb29sZWFuKTogc2V0IGB0cnVlYCB0byBpZ25vcmUgZXJyb3JzIHdoZW4gcnVsZSBub3QgZm91bmQuXG4gKlxuICogRW5hYmxlIGxpc3Qgb3IgcnVsZXMuIEl0IHdpbGwgYXV0b21hdGljYWxseSBmaW5kIGFwcHJvcHJpYXRlIGNvbXBvbmVudHMsXG4gKiBjb250YWluaW5nIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMuIElmIHJ1bGUgbm90IGZvdW5kLCBhbmQgYGlnbm9yZUludmFsaWRgXG4gKiBub3Qgc2V0IC0gdGhyb3dzIGV4Y2VwdGlvbi5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAuZW5hYmxlKFsnc3ViJywgJ3N1cCddKVxuICogICAgICAgICAgICAgLmRpc2FibGUoJ3NtYXJ0cXVvdGVzJyk7XG4gKiBgYGBcbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBpZ25vcmVJbnZhbGlkKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFsgbGlzdCBdOyB9XG5cbiAgWyAnY29yZScsICdibG9jaycsICdpbmxpbmUnIF0uZm9yRWFjaChmdW5jdGlvbiAoY2hhaW4pIHtcbiAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHRoaXNbY2hhaW5dLnJ1bGVyLmVuYWJsZShsaXN0LCB0cnVlKSk7XG4gIH0sIHRoaXMpO1xuXG4gIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpcy5pbmxpbmUucnVsZXIyLmVuYWJsZShsaXN0LCB0cnVlKSk7XG5cbiAgdmFyIG1pc3NlZCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiByZXN1bHQuaW5kZXhPZihuYW1lKSA8IDA7IH0pO1xuXG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZW5hYmxlIHVua25vd24gcnVsZShzKTogJyArIG1pc3NlZCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC5kaXNhYmxlKGxpc3QsIGlnbm9yZUludmFsaWQpXG4gKiAtIGxpc3QgKFN0cmluZ3xBcnJheSk6IHJ1bGUgbmFtZSBvciBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZGlzYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIFRoZSBzYW1lIGFzIFtbTWFya2Rvd25JdC5lbmFibGVdXSwgYnV0IHR1cm4gc3BlY2lmaWVkIHJ1bGVzIG9mZi5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbIGxpc3QgXTsgfVxuXG4gIFsgJ2NvcmUnLCAnYmxvY2snLCAnaW5saW5lJyBdLmZvckVhY2goZnVuY3Rpb24gKGNoYWluKSB7XG4gICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh0aGlzW2NoYWluXS5ydWxlci5kaXNhYmxlKGxpc3QsIHRydWUpKTtcbiAgfSwgdGhpcyk7XG5cbiAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh0aGlzLmlubGluZS5ydWxlcjIuZGlzYWJsZShsaXN0LCB0cnVlKSk7XG5cbiAgdmFyIG1pc3NlZCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiByZXN1bHQuaW5kZXhPZihuYW1lKSA8IDA7IH0pO1xuXG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZGlzYWJsZSB1bmtub3duIHJ1bGUocyk6ICcgKyBtaXNzZWQpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKiogY2hhaW5hYmxlXG4gKiBNYXJrZG93bkl0LnVzZShwbHVnaW4sIHBhcmFtcylcbiAqXG4gKiBMb2FkIHNwZWNpZmllZCBwbHVnaW4gd2l0aCBnaXZlbiBwYXJhbXMgaW50byBjdXJyZW50IHBhcnNlciBpbnN0YW5jZS5cbiAqIEl0J3MganVzdCBhIHN1Z2FyIHRvIGNhbGwgYHBsdWdpbihtZCwgcGFyYW1zKWAgd2l0aCBjdXJyaW5nLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgaXRlcmF0b3IgPSByZXF1aXJlKCdtYXJrZG93bi1pdC1mb3ItaW5saW5lJyk7XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKClcbiAqICAgICAgICAgICAgIC51c2UoaXRlcmF0b3IsICdmb29fcmVwbGFjZScsICd0ZXh0JywgZnVuY3Rpb24gKHRva2VucywgaWR4KSB7XG4gKiAgICAgICAgICAgICAgIHRva2Vuc1tpZHhdLmNvbnRlbnQgPSB0b2tlbnNbaWR4XS5jb250ZW50LnJlcGxhY2UoL2Zvby9nLCAnYmFyJyk7XG4gKiAgICAgICAgICAgICB9KTtcbiAqIGBgYFxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gKHBsdWdpbiAvKiwgcGFyYW1zLCAuLi4gKi8pIHtcbiAgdmFyIGFyZ3MgPSBbIHRoaXMgXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIHBsdWdpbi5hcHBseShwbHVnaW4sIGFyZ3MpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqIGludGVybmFsXG4gKiBNYXJrZG93bkl0LnBhcnNlKHNyYywgZW52KSAtPiBBcnJheVxuICogLSBzcmMgKFN0cmluZyk6IHNvdXJjZSBzdHJpbmdcbiAqIC0gZW52IChPYmplY3QpOiBlbnZpcm9ubWVudCBzYW5kYm94XG4gKlxuICogUGFyc2UgaW5wdXQgc3RyaW5nIGFuZCByZXR1cm5zIGxpc3Qgb2YgYmxvY2sgdG9rZW5zIChzcGVjaWFsIHRva2VuIHR5cGVcbiAqIFwiaW5saW5lXCIgd2lsbCBjb250YWluIGxpc3Qgb2YgaW5saW5lIHRva2VucykuIFlvdSBzaG91bGQgbm90IGNhbGwgdGhpc1xuICogbWV0aG9kIGRpcmVjdGx5LCB1bnRpbCB5b3Ugd3JpdGUgY3VzdG9tIHJlbmRlcmVyIChmb3IgZXhhbXBsZSwgdG8gcHJvZHVjZVxuICogQVNUKS5cbiAqXG4gKiBgZW52YCBpcyB1c2VkIHRvIHBhc3MgZGF0YSBiZXR3ZWVuIFwiZGlzdHJpYnV0ZWRcIiBydWxlcyBhbmQgcmV0dXJuIGFkZGl0aW9uYWxcbiAqIG1ldGFkYXRhIGxpa2UgcmVmZXJlbmNlIGluZm8sIG5lZWRlZCBmb3IgdGhlIHJlbmRlcmVyLiBJdCBhbHNvIGNhbiBiZSB1c2VkIHRvXG4gKiBpbmplY3QgZGF0YSBpbiBzcGVjaWZpYyBjYXNlcy4gVXN1YWxseSwgeW91IHdpbGwgYmUgb2sgdG8gcGFzcyBge31gLFxuICogYW5kIHRoZW4gcGFzcyB1cGRhdGVkIG9iamVjdCB0byByZW5kZXJlci5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGlmICh0eXBlb2Ygc3JjICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW5wdXQgZGF0YSBzaG91bGQgYmUgYSBTdHJpbmcnKTtcbiAgfVxuXG4gIHZhciBzdGF0ZSA9IG5ldyB0aGlzLmNvcmUuU3RhdGUoc3JjLCB0aGlzLCBlbnYpO1xuXG4gIHRoaXMuY29yZS5wcm9jZXNzKHN0YXRlKTtcblxuICByZXR1cm4gc3RhdGUudG9rZW5zO1xufTtcblxuXG4vKipcbiAqIE1hcmtkb3duSXQucmVuZGVyKHNyYyBbLCBlbnZdKSAtPiBTdHJpbmdcbiAqIC0gc3JjIChTdHJpbmcpOiBzb3VyY2Ugc3RyaW5nXG4gKiAtIGVudiAoT2JqZWN0KTogZW52aXJvbm1lbnQgc2FuZGJveFxuICpcbiAqIFJlbmRlciBtYXJrZG93biBzdHJpbmcgaW50byBodG1sLiBJdCBkb2VzIGFsbCBtYWdpYyBmb3IgeW91IDopLlxuICpcbiAqIGBlbnZgIGNhbiBiZSB1c2VkIHRvIGluamVjdCBhZGRpdGlvbmFsIG1ldGFkYXRhIChge31gIGJ5IGRlZmF1bHQpLlxuICogQnV0IHlvdSB3aWxsIG5vdCBuZWVkIGl0IHdpdGggaGlnaCBwcm9iYWJpbGl0eS4gU2VlIGFsc28gY29tbWVudFxuICogaW4gW1tNYXJrZG93bkl0LnBhcnNlXV0uXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoc3JjLCBlbnYpIHtcbiAgZW52ID0gZW52IHx8IHt9O1xuXG4gIHJldHVybiB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnBhcnNlKHNyYywgZW52KSwgdGhpcy5vcHRpb25zLCBlbnYpO1xufTtcblxuXG4vKiogaW50ZXJuYWxcbiAqIE1hcmtkb3duSXQucGFyc2VJbmxpbmUoc3JjLCBlbnYpIC0+IEFycmF5XG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBUaGUgc2FtZSBhcyBbW01hcmtkb3duSXQucGFyc2VdXSBidXQgc2tpcCBhbGwgYmxvY2sgcnVsZXMuIEl0IHJldHVybnMgdGhlXG4gKiBibG9jayB0b2tlbnMgbGlzdCB3aXRoIHRoZSBzaW5nbGUgYGlubGluZWAgZWxlbWVudCwgY29udGFpbmluZyBwYXJzZWQgaW5saW5lXG4gKiB0b2tlbnMgaW4gYGNoaWxkcmVuYCBwcm9wZXJ0eS4gQWxzbyB1cGRhdGVzIGBlbnZgIG9iamVjdC5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIHZhciBzdGF0ZSA9IG5ldyB0aGlzLmNvcmUuU3RhdGUoc3JjLCB0aGlzLCBlbnYpO1xuXG4gIHN0YXRlLmlubGluZU1vZGUgPSB0cnVlO1xuICB0aGlzLmNvcmUucHJvY2VzcyhzdGF0ZSk7XG5cbiAgcmV0dXJuIHN0YXRlLnRva2Vucztcbn07XG5cblxuLyoqXG4gKiBNYXJrZG93bkl0LnJlbmRlcklubGluZShzcmMgWywgZW52XSkgLT4gU3RyaW5nXG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBTaW1pbGFyIHRvIFtbTWFya2Rvd25JdC5yZW5kZXJdXSBidXQgZm9yIHNpbmdsZSBwYXJhZ3JhcGggY29udGVudC4gUmVzdWx0XG4gKiB3aWxsIE5PVCBiZSB3cmFwcGVkIGludG8gYDxwPmAgdGFncy5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnJlbmRlcklubGluZSA9IGZ1bmN0aW9uIChzcmMsIGVudikge1xuICBlbnYgPSBlbnYgfHwge307XG5cbiAgcmV0dXJuIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMucGFyc2VJbmxpbmUoc3JjLCBlbnYpLCB0aGlzLm9wdGlvbnMsIGVudik7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTWFya2Rvd25JdDtcbiIsIi8qKiBpbnRlcm5hbFxuICogY2xhc3MgUGFyc2VyQmxvY2tcbiAqXG4gKiBCbG9jay1sZXZlbCB0b2tlbml6ZXIuXG4gKiovXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFJ1bGVyICAgICAgICAgICA9IHJlcXVpcmUoJy4vcnVsZXInKTtcblxuXG52YXIgX3J1bGVzID0gW1xuICAvLyBGaXJzdCAyIHBhcmFtcyAtIHJ1bGUgbmFtZSAmIHNvdXJjZS4gU2Vjb25kYXJ5IGFycmF5IC0gbGlzdCBvZiBydWxlcyxcbiAgLy8gd2hpY2ggY2FuIGJlIHRlcm1pbmF0ZWQgYnkgdGhpcyBvbmUuXG4gIFsgJ3RhYmxlJywgICAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL3RhYmxlJyksICAgICAgWyAncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScgXSBdLFxuICBbICdjb2RlJywgICAgICAgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9jb2RlJykgXSxcbiAgWyAnZmVuY2UnLCAgICAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svZmVuY2UnKSwgICAgICBbICdwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnLCAnbGlzdCcgXSBdLFxuICBbICdibG9ja3F1b3RlJywgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9ibG9ja3F1b3RlJyksIFsgJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScsICdsaXN0JyBdIF0sXG4gIFsgJ2hyJywgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL2hyJyksICAgICAgICAgWyAncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJywgJ2xpc3QnIF0gXSxcbiAgWyAnbGlzdCcsICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svbGlzdCcpLCAgICAgICBbICdwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnIF0gXSxcbiAgWyAncmVmZXJlbmNlJywgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svcmVmZXJlbmNlJykgXSxcbiAgWyAnaGVhZGluZycsICAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svaGVhZGluZycpLCAgICBbICdwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnIF0gXSxcbiAgWyAnbGhlYWRpbmcnLCAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svbGhlYWRpbmcnKSBdLFxuICBbICdodG1sX2Jsb2NrJywgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9odG1sX2Jsb2NrJyksIFsgJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScgXSBdLFxuICBbICdwYXJhZ3JhcGgnLCAgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9wYXJhZ3JhcGgnKSBdXG5dO1xuXG5cbi8qKlxuICogbmV3IFBhcnNlckJsb2NrKClcbiAqKi9cbmZ1bmN0aW9uIFBhcnNlckJsb2NrKCkge1xuICAvKipcbiAgICogUGFyc2VyQmxvY2sjcnVsZXIgLT4gUnVsZXJcbiAgICpcbiAgICogW1tSdWxlcl1dIGluc3RhbmNlLiBLZWVwIGNvbmZpZ3VyYXRpb24gb2YgYmxvY2sgcnVsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgX3J1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5ydWxlci5wdXNoKF9ydWxlc1tpXVswXSwgX3J1bGVzW2ldWzFdLCB7IGFsdDogKF9ydWxlc1tpXVsyXSB8fCBbXSkuc2xpY2UoKSB9KTtcbiAgfVxufVxuXG5cbi8vIEdlbmVyYXRlIHRva2VucyBmb3IgaW5wdXQgcmFuZ2Vcbi8vXG5QYXJzZXJCbG9jay5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSkge1xuICB2YXIgb2ssIGksXG4gICAgICBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpLFxuICAgICAgbGVuID0gcnVsZXMubGVuZ3RoLFxuICAgICAgbGluZSA9IHN0YXJ0TGluZSxcbiAgICAgIGhhc0VtcHR5TGluZXMgPSBmYWxzZSxcbiAgICAgIG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3Rpbmc7XG5cbiAgd2hpbGUgKGxpbmUgPCBlbmRMaW5lKSB7XG4gICAgc3RhdGUubGluZSA9IGxpbmUgPSBzdGF0ZS5za2lwRW1wdHlMaW5lcyhsaW5lKTtcbiAgICBpZiAobGluZSA+PSBlbmRMaW5lKSB7IGJyZWFrOyB9XG5cbiAgICAvLyBUZXJtaW5hdGlvbiBjb25kaXRpb24gZm9yIG5lc3RlZCBjYWxscy5cbiAgICAvLyBOZXN0ZWQgY2FsbHMgY3VycmVudGx5IHVzZWQgZm9yIGJsb2NrcXVvdGVzICYgbGlzdHNcbiAgICBpZiAoc3RhdGUuc0NvdW50W2xpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IGJyZWFrOyB9XG5cbiAgICAvLyBJZiBuZXN0aW5nIGxldmVsIGV4Y2VlZGVkIC0gc2tpcCB0YWlsIHRvIHRoZSBlbmQuIFRoYXQncyBub3Qgb3JkaW5hcnlcbiAgICAvLyBzaXR1YXRpb24gYW5kIHdlIHNob3VsZCBub3QgY2FyZSBhYm91dCBjb250ZW50LlxuICAgIGlmIChzdGF0ZS5sZXZlbCA+PSBtYXhOZXN0aW5nKSB7XG4gICAgICBzdGF0ZS5saW5lID0gZW5kTGluZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIFRyeSBhbGwgcG9zc2libGUgcnVsZXMuXG4gICAgLy8gT24gc3VjY2VzcywgcnVsZSBzaG91bGQ6XG4gICAgLy9cbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUubGluZWBcbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUudG9rZW5zYFxuICAgIC8vIC0gcmV0dXJuIHRydWVcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgb2sgPSBydWxlc1tpXShzdGF0ZSwgbGluZSwgZW5kTGluZSwgZmFsc2UpO1xuICAgICAgaWYgKG9rKSB7IGJyZWFrOyB9XG4gICAgfVxuXG4gICAgLy8gc2V0IHN0YXRlLnRpZ2h0IGlmIHdlIGhhZCBhbiBlbXB0eSBsaW5lIGJlZm9yZSBjdXJyZW50IHRhZ1xuICAgIC8vIGkuZS4gbGF0ZXN0IGVtcHR5IGxpbmUgc2hvdWxkIG5vdCBjb3VudFxuICAgIHN0YXRlLnRpZ2h0ID0gIWhhc0VtcHR5TGluZXM7XG5cbiAgICAvLyBwYXJhZ3JhcGggbWlnaHQgXCJlYXRcIiBvbmUgbmV3bGluZSBhZnRlciBpdCBpbiBuZXN0ZWQgbGlzdHNcbiAgICBpZiAoc3RhdGUuaXNFbXB0eShzdGF0ZS5saW5lIC0gMSkpIHtcbiAgICAgIGhhc0VtcHR5TGluZXMgPSB0cnVlO1xuICAgIH1cblxuICAgIGxpbmUgPSBzdGF0ZS5saW5lO1xuXG4gICAgaWYgKGxpbmUgPCBlbmRMaW5lICYmIHN0YXRlLmlzRW1wdHkobGluZSkpIHtcbiAgICAgIGhhc0VtcHR5TGluZXMgPSB0cnVlO1xuICAgICAgbGluZSsrO1xuICAgICAgc3RhdGUubGluZSA9IGxpbmU7XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogUGFyc2VyQmxvY2sucGFyc2Uoc3RyLCBtZCwgZW52LCBvdXRUb2tlbnMpXG4gKlxuICogUHJvY2VzcyBpbnB1dCBzdHJpbmcgYW5kIHB1c2ggYmxvY2sgdG9rZW5zIGludG8gYG91dFRva2Vuc2BcbiAqKi9cblBhcnNlckJsb2NrLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzcmMsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICB2YXIgc3RhdGU7XG5cbiAgaWYgKCFzcmMpIHsgcmV0dXJuOyB9XG5cbiAgc3RhdGUgPSBuZXcgdGhpcy5TdGF0ZShzcmMsIG1kLCBlbnYsIG91dFRva2Vucyk7XG5cbiAgdGhpcy50b2tlbml6ZShzdGF0ZSwgc3RhdGUubGluZSwgc3RhdGUubGluZU1heCk7XG59O1xuXG5cblBhcnNlckJsb2NrLnByb3RvdHlwZS5TdGF0ZSA9IHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svc3RhdGVfYmxvY2snKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnNlckJsb2NrO1xuIiwiLyoqIGludGVybmFsXG4gKiBjbGFzcyBDb3JlXG4gKlxuICogVG9wLWxldmVsIHJ1bGVzIGV4ZWN1dG9yLiBHbHVlcyBibG9jay9pbmxpbmUgcGFyc2VycyBhbmQgZG9lcyBpbnRlcm1lZGlhdGVcbiAqIHRyYW5zZm9ybWF0aW9ucy5cbiAqKi9cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgUnVsZXIgID0gcmVxdWlyZSgnLi9ydWxlcicpO1xuXG5cbnZhciBfcnVsZXMgPSBbXG4gIFsgJ25vcm1hbGl6ZScsICAgICAgcmVxdWlyZSgnLi9ydWxlc19jb3JlL25vcm1hbGl6ZScpICAgICAgXSxcbiAgWyAnYmxvY2snLCAgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2NvcmUvYmxvY2snKSAgICAgICAgICBdLFxuICBbICdpbmxpbmUnLCAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfY29yZS9pbmxpbmUnKSAgICAgICAgIF0sXG4gIFsgJ2xpbmtpZnknLCAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19jb3JlL2xpbmtpZnknKSAgICAgICAgXSxcbiAgWyAncmVwbGFjZW1lbnRzJywgICByZXF1aXJlKCcuL3J1bGVzX2NvcmUvcmVwbGFjZW1lbnRzJykgICBdLFxuICBbICdzbWFydHF1b3RlcycsICAgIHJlcXVpcmUoJy4vcnVsZXNfY29yZS9zbWFydHF1b3RlcycpICAgIF1cbl07XG5cblxuLyoqXG4gKiBuZXcgQ29yZSgpXG4gKiovXG5mdW5jdGlvbiBDb3JlKCkge1xuICAvKipcbiAgICogQ29yZSNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBjb3JlIHJ1bGVzLlxuICAgKiovXG4gIHRoaXMucnVsZXIgPSBuZXcgUnVsZXIoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIENvcmUucHJvY2VzcyhzdGF0ZSlcbiAqXG4gKiBFeGVjdXRlcyBjb3JlIGNoYWluIHJ1bGVzLlxuICoqL1xuQ29yZS5wcm90b3R5cGUucHJvY2VzcyA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICB2YXIgaSwgbCwgcnVsZXM7XG5cbiAgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKTtcblxuICBmb3IgKGkgPSAwLCBsID0gcnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcnVsZXNbaV0oc3RhdGUpO1xuICB9XG59O1xuXG5Db3JlLnByb3RvdHlwZS5TdGF0ZSA9IHJlcXVpcmUoJy4vcnVsZXNfY29yZS9zdGF0ZV9jb3JlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb3JlO1xuIiwiLyoqIGludGVybmFsXG4gKiBjbGFzcyBQYXJzZXJJbmxpbmVcbiAqXG4gKiBUb2tlbml6ZXMgcGFyYWdyYXBoIGNvbnRlbnQuXG4gKiovXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFJ1bGVyICAgICAgICAgICA9IHJlcXVpcmUoJy4vcnVsZXInKTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gUGFyc2VyIHJ1bGVzXG5cbnZhciBfcnVsZXMgPSBbXG4gIFsgJ3RleHQnLCAgICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL3RleHQnKSBdLFxuICBbICduZXdsaW5lJywgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9uZXdsaW5lJykgXSxcbiAgWyAnZXNjYXBlJywgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvZXNjYXBlJykgXSxcbiAgWyAnYmFja3RpY2tzJywgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvYmFja3RpY2tzJykgXSxcbiAgWyAnc3RyaWtldGhyb3VnaCcsICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvc3RyaWtldGhyb3VnaCcpLnRva2VuaXplIF0sXG4gIFsgJ2VtcGhhc2lzJywgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2VtcGhhc2lzJykudG9rZW5pemUgXSxcbiAgWyAnbGluaycsICAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvbGluaycpIF0sXG4gIFsgJ2ltYWdlJywgICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2ltYWdlJykgXSxcbiAgWyAnYXV0b2xpbmsnLCAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvYXV0b2xpbmsnKSBdLFxuICBbICdodG1sX2lubGluZScsICAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9odG1sX2lubGluZScpIF0sXG4gIFsgJ2VudGl0eScsICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2VudGl0eScpIF1cbl07XG5cbnZhciBfcnVsZXMyID0gW1xuICBbICdiYWxhbmNlX3BhaXJzJywgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9iYWxhbmNlX3BhaXJzJykgXSxcbiAgWyAnc3RyaWtldGhyb3VnaCcsICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvc3RyaWtldGhyb3VnaCcpLnBvc3RQcm9jZXNzIF0sXG4gIFsgJ2VtcGhhc2lzJywgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2VtcGhhc2lzJykucG9zdFByb2Nlc3MgXSxcbiAgWyAndGV4dF9jb2xsYXBzZScsICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvdGV4dF9jb2xsYXBzZScpIF1cbl07XG5cblxuLyoqXG4gKiBuZXcgUGFyc2VySW5saW5lKClcbiAqKi9cbmZ1bmN0aW9uIFBhcnNlcklubGluZSgpIHtcbiAgdmFyIGk7XG5cbiAgLyoqXG4gICAqIFBhcnNlcklubGluZSNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBpbmxpbmUgcnVsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBfcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyLnB1c2goX3J1bGVzW2ldWzBdLCBfcnVsZXNbaV1bMV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcklubGluZSNydWxlcjIgLT4gUnVsZXJcbiAgICpcbiAgICogW1tSdWxlcl1dIGluc3RhbmNlLiBTZWNvbmQgcnVsZXIgdXNlZCBmb3IgcG9zdC1wcm9jZXNzaW5nXG4gICAqIChlLmcuIGluIGVtcGhhc2lzLWxpa2UgcnVsZXMpLlxuICAgKiovXG4gIHRoaXMucnVsZXIyID0gbmV3IFJ1bGVyKCk7XG5cbiAgZm9yIChpID0gMDsgaSA8IF9ydWxlczIubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyMi5wdXNoKF9ydWxlczJbaV1bMF0sIF9ydWxlczJbaV1bMV0pO1xuICB9XG59XG5cblxuLy8gU2tpcCBzaW5nbGUgdG9rZW4gYnkgcnVubmluZyBhbGwgcnVsZXMgaW4gdmFsaWRhdGlvbiBtb2RlO1xuLy8gcmV0dXJucyBgdHJ1ZWAgaWYgYW55IHJ1bGUgcmVwb3J0ZWQgc3VjY2Vzc1xuLy9cblBhcnNlcklubGluZS5wcm90b3R5cGUuc2tpcFRva2VuID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gIHZhciBvaywgaSwgcG9zID0gc3RhdGUucG9zLFxuICAgICAgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKSxcbiAgICAgIGxlbiA9IHJ1bGVzLmxlbmd0aCxcbiAgICAgIG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3RpbmcsXG4gICAgICBjYWNoZSA9IHN0YXRlLmNhY2hlO1xuXG5cbiAgaWYgKHR5cGVvZiBjYWNoZVtwb3NdICE9PSAndW5kZWZpbmVkJykge1xuICAgIHN0YXRlLnBvcyA9IGNhY2hlW3Bvc107XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0YXRlLmxldmVsIDwgbWF4TmVzdGluZykge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgLy8gSW5jcmVtZW50IHN0YXRlLmxldmVsIGFuZCBkZWNyZW1lbnQgaXQgbGF0ZXIgdG8gbGltaXQgcmVjdXJzaW9uLlxuICAgICAgLy8gSXQncyBoYXJtbGVzcyB0byBkbyBoZXJlLCBiZWNhdXNlIG5vIHRva2VucyBhcmUgY3JlYXRlZC4gQnV0IGlkZWFsbHksXG4gICAgICAvLyB3ZSdkIG5lZWQgYSBzZXBhcmF0ZSBwcml2YXRlIHN0YXRlIHZhcmlhYmxlIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgICAvL1xuICAgICAgc3RhdGUubGV2ZWwrKztcbiAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIHRydWUpO1xuICAgICAgc3RhdGUubGV2ZWwtLTtcblxuICAgICAgaWYgKG9rKSB7IGJyZWFrOyB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFRvbyBtdWNoIG5lc3RpbmcsIGp1c3Qgc2tpcCB1bnRpbCB0aGUgZW5kIG9mIHRoZSBwYXJhZ3JhcGguXG4gICAgLy9cbiAgICAvLyBOT1RFOiB0aGlzIHdpbGwgY2F1c2UgbGlua3MgdG8gYmVoYXZlIGluY29ycmVjdGx5IGluIHRoZSBmb2xsb3dpbmcgY2FzZSxcbiAgICAvLyAgICAgICB3aGVuIGFuIGFtb3VudCBvZiBgW2AgaXMgZXhhY3RseSBlcXVhbCB0byBgbWF4TmVzdGluZyArIDFgOlxuICAgIC8vXG4gICAgLy8gICAgICAgW1tbW1tbW1tbW1tbW1tbW1tbW1tbZm9vXSgpXG4gICAgLy9cbiAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyB3b3JrYXJvdW5kIHdoZW4gQ00gc3RhbmRhcmQgd2lsbCBhbGxvdyBuZXN0ZWQgbGlua3NcbiAgICAvLyAgICAgICAod2UgY2FuIHJlcGxhY2UgaXQgYnkgcHJldmVudGluZyBsaW5rcyBmcm9tIGJlaW5nIHBhcnNlZCBpblxuICAgIC8vICAgICAgIHZhbGlkYXRpb24gbW9kZSlcbiAgICAvL1xuICAgIHN0YXRlLnBvcyA9IHN0YXRlLnBvc01heDtcbiAgfVxuXG4gIGlmICghb2spIHsgc3RhdGUucG9zKys7IH1cbiAgY2FjaGVbcG9zXSA9IHN0YXRlLnBvcztcbn07XG5cblxuLy8gR2VuZXJhdGUgdG9rZW5zIGZvciBpbnB1dCByYW5nZVxuLy9cblBhcnNlcklubGluZS5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgdmFyIG9rLCBpLFxuICAgICAgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKSxcbiAgICAgIGxlbiA9IHJ1bGVzLmxlbmd0aCxcbiAgICAgIGVuZCA9IHN0YXRlLnBvc01heCxcbiAgICAgIG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3Rpbmc7XG5cbiAgd2hpbGUgKHN0YXRlLnBvcyA8IGVuZCkge1xuICAgIC8vIFRyeSBhbGwgcG9zc2libGUgcnVsZXMuXG4gICAgLy8gT24gc3VjY2VzcywgcnVsZSBzaG91bGQ6XG4gICAgLy9cbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUucG9zYFxuICAgIC8vIC0gdXBkYXRlIGBzdGF0ZS50b2tlbnNgXG4gICAgLy8gLSByZXR1cm4gdHJ1ZVxuXG4gICAgaWYgKHN0YXRlLmxldmVsIDwgbWF4TmVzdGluZykge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIGZhbHNlKTtcbiAgICAgICAgaWYgKG9rKSB7IGJyZWFrOyB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9rKSB7XG4gICAgICBpZiAoc3RhdGUucG9zID49IGVuZCkgeyBicmVhazsgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmNbc3RhdGUucG9zKytdO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBlbmRpbmcpIHtcbiAgICBzdGF0ZS5wdXNoUGVuZGluZygpO1xuICB9XG59O1xuXG5cbi8qKlxuICogUGFyc2VySW5saW5lLnBhcnNlKHN0ciwgbWQsIGVudiwgb3V0VG9rZW5zKVxuICpcbiAqIFByb2Nlc3MgaW5wdXQgc3RyaW5nIGFuZCBwdXNoIGlubGluZSB0b2tlbnMgaW50byBgb3V0VG9rZW5zYFxuICoqL1xuUGFyc2VySW5saW5lLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICB2YXIgaSwgcnVsZXMsIGxlbjtcbiAgdmFyIHN0YXRlID0gbmV3IHRoaXMuU3RhdGUoc3RyLCBtZCwgZW52LCBvdXRUb2tlbnMpO1xuXG4gIHRoaXMudG9rZW5pemUoc3RhdGUpO1xuXG4gIHJ1bGVzID0gdGhpcy5ydWxlcjIuZ2V0UnVsZXMoJycpO1xuICBsZW4gPSBydWxlcy5sZW5ndGg7XG5cbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgcnVsZXNbaV0oc3RhdGUpO1xuICB9XG59O1xuXG5cblBhcnNlcklubGluZS5wcm90b3R5cGUuU3RhdGUgPSByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9zdGF0ZV9pbmxpbmUnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnNlcklubGluZTtcbiIsIi8vIENvbW1vbm1hcmsgZGVmYXVsdCBvcHRpb25zXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb3B0aW9uczoge1xuICAgIGh0bWw6ICAgICAgICAgdHJ1ZSwgICAgICAgICAvLyBFbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZVxuICAgIHhodG1sT3V0OiAgICAgdHJ1ZSwgICAgICAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgYnJlYWtzOiAgICAgICBmYWxzZSwgICAgICAgIC8vIENvbnZlcnQgJ1xcbicgaW4gcGFyYWdyYXBocyBpbnRvIDxicj5cbiAgICBsYW5nUHJlZml4OiAgICdsYW5ndWFnZS0nLCAgLy8gQ1NTIGxhbmd1YWdlIHByZWZpeCBmb3IgZmVuY2VkIGJsb2Nrc1xuICAgIGxpbmtpZnk6ICAgICAgZmFsc2UsICAgICAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogIGZhbHNlLFxuXG4gICAgLy8gRG91YmxlICsgc2luZ2xlIHF1b3RlcyByZXBsYWNlbWVudCBwYWlycywgd2hlbiB0eXBvZ3JhcGhlciBlbmFibGVkLFxuICAgIC8vIGFuZCBzbWFydHF1b3RlcyBvbi4gQ291bGQgYmUgZWl0aGVyIGEgU3RyaW5nIG9yIGFuIEFycmF5LlxuICAgIC8vXG4gICAgLy8gRm9yIGV4YW1wbGUsIHlvdSBjYW4gdXNlICfCq8K74oCe4oCcJyBmb3IgUnVzc2lhbiwgJ+KAnuKAnOKAmuKAmCcgZm9yIEdlcm1hbixcbiAgICAvLyBhbmQgWyfCq1xceEEwJywgJ1xceEEwwrsnLCAn4oC5XFx4QTAnLCAnXFx4QTDigLonXSBmb3IgRnJlbmNoIChpbmNsdWRpbmcgbmJzcCkuXG4gICAgcXVvdGVzOiAnXFx1MjAxY1xcdTIwMWRcXHUyMDE4XFx1MjAxOScsIC8qIOKAnOKAneKAmOKAmSAqL1xuXG4gICAgLy8gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24uIFNob3VsZCByZXR1cm4gZXNjYXBlZCBIVE1MLFxuICAgIC8vIG9yICcnIGlmIHRoZSBzb3VyY2Ugc3RyaW5nIGlzIG5vdCBjaGFuZ2VkIGFuZCBzaG91bGQgYmUgZXNjYXBlZCBleHRlcm5hbHkuXG4gICAgLy8gSWYgcmVzdWx0IHN0YXJ0cyB3aXRoIDxwcmUuLi4gaW50ZXJuYWwgd3JhcHBlciBpcyBza2lwcGVkLlxuICAgIC8vXG4gICAgLy8gZnVuY3Rpb24gKC8qc3RyLCBsYW5nKi8pIHsgcmV0dXJuICcnOyB9XG4gICAgLy9cbiAgICBoaWdobGlnaHQ6IG51bGwsXG5cbiAgICBtYXhOZXN0aW5nOiAgIDIwICAgICAgICAgICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuXG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ25vcm1hbGl6ZScsXG4gICAgICAgICdibG9jaycsXG4gICAgICAgICdpbmxpbmUnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAnYmxvY2txdW90ZScsXG4gICAgICAgICdjb2RlJyxcbiAgICAgICAgJ2ZlbmNlJyxcbiAgICAgICAgJ2hlYWRpbmcnLFxuICAgICAgICAnaHInLFxuICAgICAgICAnaHRtbF9ibG9jaycsXG4gICAgICAgICdsaGVhZGluZycsXG4gICAgICAgICdsaXN0JyxcbiAgICAgICAgJ3JlZmVyZW5jZScsXG4gICAgICAgICdwYXJhZ3JhcGgnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGlubGluZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ2F1dG9saW5rJyxcbiAgICAgICAgJ2JhY2t0aWNrcycsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICdlbnRpdHknLFxuICAgICAgICAnZXNjYXBlJyxcbiAgICAgICAgJ2h0bWxfaW5saW5lJyxcbiAgICAgICAgJ2ltYWdlJyxcbiAgICAgICAgJ2xpbmsnLFxuICAgICAgICAnbmV3bGluZScsXG4gICAgICAgICd0ZXh0J1xuICAgICAgXSxcbiAgICAgIHJ1bGVzMjogW1xuICAgICAgICAnYmFsYW5jZV9wYWlycycsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICd0ZXh0X2NvbGxhcHNlJ1xuICAgICAgXVxuICAgIH1cbiAgfVxufTtcbiIsIi8vIG1hcmtkb3duLWl0IGRlZmF1bHQgb3B0aW9uc1xuXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG9wdGlvbnM6IHtcbiAgICBodG1sOiAgICAgICAgIGZhbHNlLCAgICAgICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICB4aHRtbE91dDogICAgIGZhbHNlLCAgICAgICAgLy8gVXNlICcvJyB0byBjbG9zZSBzaW5nbGUgdGFncyAoPGJyIC8+KVxuICAgIGJyZWFrczogICAgICAgZmFsc2UsICAgICAgICAvLyBDb252ZXJ0ICdcXG4nIGluIHBhcmFncmFwaHMgaW50byA8YnI+XG4gICAgbGFuZ1ByZWZpeDogICAnbGFuZ3VhZ2UtJywgIC8vIENTUyBsYW5ndWFnZSBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3NcbiAgICBsaW5raWZ5OiAgICAgIGZhbHNlLCAgICAgICAgLy8gYXV0b2NvbnZlcnQgVVJMLWxpa2UgdGV4dHMgdG8gbGlua3NcblxuICAgIC8vIEVuYWJsZSBzb21lIGxhbmd1YWdlLW5ldXRyYWwgcmVwbGFjZW1lbnRzICsgcXVvdGVzIGJlYXV0aWZpY2F0aW9uXG4gICAgdHlwb2dyYXBoZXI6ICBmYWxzZSxcblxuICAgIC8vIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnQgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCxcbiAgICAvLyBhbmQgc21hcnRxdW90ZXMgb24uIENvdWxkIGJlIGVpdGhlciBhIFN0cmluZyBvciBhbiBBcnJheS5cbiAgICAvL1xuICAgIC8vIEZvciBleGFtcGxlLCB5b3UgY2FuIHVzZSAnwqvCu+KAnuKAnCcgZm9yIFJ1c3NpYW4sICfigJ7igJzigJrigJgnIGZvciBHZXJtYW4sXG4gICAgLy8gYW5kIFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J10gZm9yIEZyZW5jaCAoaW5jbHVkaW5nIG5ic3ApLlxuICAgIHF1b3RlczogJ1xcdTIwMWNcXHUyMDFkXFx1MjAxOFxcdTIwMTknLCAvKiDigJzigJ3igJjigJkgKi9cblxuICAgIC8vIEhpZ2hsaWdodGVyIGZ1bmN0aW9uLiBTaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTCxcbiAgICAvLyBvciAnJyBpZiB0aGUgc291cmNlIHN0cmluZyBpcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWQgZXh0ZXJuYWx5LlxuICAgIC8vIElmIHJlc3VsdCBzdGFydHMgd2l0aCA8cHJlLi4uIGludGVybmFsIHdyYXBwZXIgaXMgc2tpcHBlZC5cbiAgICAvL1xuICAgIC8vIGZ1bmN0aW9uICgvKnN0ciwgbGFuZyovKSB7IHJldHVybiAnJzsgfVxuICAgIC8vXG4gICAgaGlnaGxpZ2h0OiBudWxsLFxuXG4gICAgbWF4TmVzdGluZzogICAxMDAgICAgICAgICAgICAvLyBJbnRlcm5hbCBwcm90ZWN0aW9uLCByZWN1cnNpb24gbGltaXRcbiAgfSxcblxuICBjb21wb25lbnRzOiB7XG5cbiAgICBjb3JlOiB7fSxcbiAgICBibG9jazoge30sXG4gICAgaW5saW5lOiB7fVxuICB9XG59O1xuIiwiLy8gXCJaZXJvXCIgcHJlc2V0LCB3aXRoIG5vdGhpbmcgZW5hYmxlZC4gVXNlZnVsIGZvciBtYW51YWwgY29uZmlndXJpbmcgb2Ygc2ltcGxlXG4vLyBtb2Rlcy4gRm9yIGV4YW1wbGUsIHRvIHBhcnNlIGJvbGQvaXRhbGljIG9ubHkuXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb3B0aW9uczoge1xuICAgIGh0bWw6ICAgICAgICAgZmFsc2UsICAgICAgICAvLyBFbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZVxuICAgIHhodG1sT3V0OiAgICAgZmFsc2UsICAgICAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgYnJlYWtzOiAgICAgICBmYWxzZSwgICAgICAgIC8vIENvbnZlcnQgJ1xcbicgaW4gcGFyYWdyYXBocyBpbnRvIDxicj5cbiAgICBsYW5nUHJlZml4OiAgICdsYW5ndWFnZS0nLCAgLy8gQ1NTIGxhbmd1YWdlIHByZWZpeCBmb3IgZmVuY2VkIGJsb2Nrc1xuICAgIGxpbmtpZnk6ICAgICAgZmFsc2UsICAgICAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogIGZhbHNlLFxuXG4gICAgLy8gRG91YmxlICsgc2luZ2xlIHF1b3RlcyByZXBsYWNlbWVudCBwYWlycywgd2hlbiB0eXBvZ3JhcGhlciBlbmFibGVkLFxuICAgIC8vIGFuZCBzbWFydHF1b3RlcyBvbi4gQ291bGQgYmUgZWl0aGVyIGEgU3RyaW5nIG9yIGFuIEFycmF5LlxuICAgIC8vXG4gICAgLy8gRm9yIGV4YW1wbGUsIHlvdSBjYW4gdXNlICfCq8K74oCe4oCcJyBmb3IgUnVzc2lhbiwgJ+KAnuKAnOKAmuKAmCcgZm9yIEdlcm1hbixcbiAgICAvLyBhbmQgWyfCq1xceEEwJywgJ1xceEEwwrsnLCAn4oC5XFx4QTAnLCAnXFx4QTDigLonXSBmb3IgRnJlbmNoIChpbmNsdWRpbmcgbmJzcCkuXG4gICAgcXVvdGVzOiAnXFx1MjAxY1xcdTIwMWRcXHUyMDE4XFx1MjAxOScsIC8qIOKAnOKAneKAmOKAmSAqL1xuXG4gICAgLy8gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24uIFNob3VsZCByZXR1cm4gZXNjYXBlZCBIVE1MLFxuICAgIC8vIG9yICcnIGlmIHRoZSBzb3VyY2Ugc3RyaW5nIGlzIG5vdCBjaGFuZ2VkIGFuZCBzaG91bGQgYmUgZXNjYXBlZCBleHRlcm5hbHkuXG4gICAgLy8gSWYgcmVzdWx0IHN0YXJ0cyB3aXRoIDxwcmUuLi4gaW50ZXJuYWwgd3JhcHBlciBpcyBza2lwcGVkLlxuICAgIC8vXG4gICAgLy8gZnVuY3Rpb24gKC8qc3RyLCBsYW5nKi8pIHsgcmV0dXJuICcnOyB9XG4gICAgLy9cbiAgICBoaWdobGlnaHQ6IG51bGwsXG5cbiAgICBtYXhOZXN0aW5nOiAgIDIwICAgICAgICAgICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuXG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ25vcm1hbGl6ZScsXG4gICAgICAgICdibG9jaycsXG4gICAgICAgICdpbmxpbmUnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAncGFyYWdyYXBoJ1xuICAgICAgXVxuICAgIH0sXG5cbiAgICBpbmxpbmU6IHtcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgICd0ZXh0J1xuICAgICAgXSxcbiAgICAgIHJ1bGVzMjogW1xuICAgICAgICAnYmFsYW5jZV9wYWlycycsXG4gICAgICAgICd0ZXh0X2NvbGxhcHNlJ1xuICAgICAgXVxuICAgIH1cbiAgfVxufTtcbiIsIi8qKlxuICogY2xhc3MgUmVuZGVyZXJcbiAqXG4gKiBHZW5lcmF0ZXMgSFRNTCBmcm9tIHBhcnNlZCB0b2tlbiBzdHJlYW0uIEVhY2ggaW5zdGFuY2UgaGFzIGluZGVwZW5kZW50XG4gKiBjb3B5IG9mIHJ1bGVzLiBUaG9zZSBjYW4gYmUgcmV3cml0dGVuIHdpdGggZWFzZS4gQWxzbywgeW91IGNhbiBhZGQgbmV3XG4gKiBydWxlcyBpZiB5b3UgY3JlYXRlIHBsdWdpbiBhbmQgYWRkcyBuZXcgdG9rZW4gdHlwZXMuXG4gKiovXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIGFzc2lnbiAgICAgICAgICA9IHJlcXVpcmUoJy4vY29tbW9uL3V0aWxzJykuYXNzaWduO1xudmFyIHVuZXNjYXBlQWxsICAgICA9IHJlcXVpcmUoJy4vY29tbW9uL3V0aWxzJykudW5lc2NhcGVBbGw7XG52YXIgZXNjYXBlSHRtbCAgICAgID0gcmVxdWlyZSgnLi9jb21tb24vdXRpbHMnKS5lc2NhcGVIdG1sO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnZhciBkZWZhdWx0X3J1bGVzID0ge307XG5cblxuZGVmYXVsdF9ydWxlcy5jb2RlX2lubGluZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgdmFyIHRva2VuID0gdG9rZW5zW2lkeF07XG5cbiAgcmV0dXJuICAnPGNvZGUnICsgc2xmLnJlbmRlckF0dHJzKHRva2VuKSArICc+JyArXG4gICAgICAgICAgZXNjYXBlSHRtbCh0b2tlbnNbaWR4XS5jb250ZW50KSArXG4gICAgICAgICAgJzwvY29kZT4nO1xufTtcblxuXG5kZWZhdWx0X3J1bGVzLmNvZGVfYmxvY2sgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIHZhciB0b2tlbiA9IHRva2Vuc1tpZHhdO1xuXG4gIHJldHVybiAgJzxwcmUnICsgc2xmLnJlbmRlckF0dHJzKHRva2VuKSArICc+PGNvZGU+JyArXG4gICAgICAgICAgZXNjYXBlSHRtbCh0b2tlbnNbaWR4XS5jb250ZW50KSArXG4gICAgICAgICAgJzwvY29kZT48L3ByZT5cXG4nO1xufTtcblxuXG5kZWZhdWx0X3J1bGVzLmZlbmNlID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNsZikge1xuICB2YXIgdG9rZW4gPSB0b2tlbnNbaWR4XSxcbiAgICAgIGluZm8gPSB0b2tlbi5pbmZvID8gdW5lc2NhcGVBbGwodG9rZW4uaW5mbykudHJpbSgpIDogJycsXG4gICAgICBsYW5nTmFtZSA9ICcnLFxuICAgICAgaGlnaGxpZ2h0ZWQsIGksIHRtcEF0dHJzLCB0bXBUb2tlbjtcblxuICBpZiAoaW5mbykge1xuICAgIGxhbmdOYW1lID0gaW5mby5zcGxpdCgvXFxzKy9nKVswXTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmhpZ2hsaWdodCkge1xuICAgIGhpZ2hsaWdodGVkID0gb3B0aW9ucy5oaWdobGlnaHQodG9rZW4uY29udGVudCwgbGFuZ05hbWUpIHx8IGVzY2FwZUh0bWwodG9rZW4uY29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgaGlnaGxpZ2h0ZWQgPSBlc2NhcGVIdG1sKHRva2VuLmNvbnRlbnQpO1xuICB9XG5cbiAgaWYgKGhpZ2hsaWdodGVkLmluZGV4T2YoJzxwcmUnKSA9PT0gMCkge1xuICAgIHJldHVybiBoaWdobGlnaHRlZCArICdcXG4nO1xuICB9XG5cbiAgLy8gSWYgbGFuZ3VhZ2UgZXhpc3RzLCBpbmplY3QgY2xhc3MgZ2VudGx5LCB3aXRob3V0IG1vZGlmeWluZyBvcmlnaW5hbCB0b2tlbi5cbiAgLy8gTWF5IGJlLCBvbmUgZGF5IHdlIHdpbGwgYWRkIC5jbG9uZSgpIGZvciB0b2tlbiBhbmQgc2ltcGxpZnkgdGhpcyBwYXJ0LCBidXRcbiAgLy8gbm93IHdlIHByZWZlciB0byBrZWVwIHRoaW5ncyBsb2NhbC5cbiAgaWYgKGluZm8pIHtcbiAgICBpICAgICAgICA9IHRva2VuLmF0dHJJbmRleCgnY2xhc3MnKTtcbiAgICB0bXBBdHRycyA9IHRva2VuLmF0dHJzID8gdG9rZW4uYXR0cnMuc2xpY2UoKSA6IFtdO1xuXG4gICAgaWYgKGkgPCAwKSB7XG4gICAgICB0bXBBdHRycy5wdXNoKFsgJ2NsYXNzJywgb3B0aW9ucy5sYW5nUHJlZml4ICsgbGFuZ05hbWUgXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcEF0dHJzW2ldWzFdICs9ICcgJyArIG9wdGlvbnMubGFuZ1ByZWZpeCArIGxhbmdOYW1lO1xuICAgIH1cblxuICAgIC8vIEZha2UgdG9rZW4ganVzdCB0byByZW5kZXIgYXR0cmlidXRlc1xuICAgIHRtcFRva2VuID0ge1xuICAgICAgYXR0cnM6IHRtcEF0dHJzXG4gICAgfTtcblxuICAgIHJldHVybiAgJzxwcmU+PGNvZGUnICsgc2xmLnJlbmRlckF0dHJzKHRtcFRva2VuKSArICc+J1xuICAgICAgICAgICsgaGlnaGxpZ2h0ZWRcbiAgICAgICAgICArICc8L2NvZGU+PC9wcmU+XFxuJztcbiAgfVxuXG5cbiAgcmV0dXJuICAnPHByZT48Y29kZScgKyBzbGYucmVuZGVyQXR0cnModG9rZW4pICsgJz4nXG4gICAgICAgICsgaGlnaGxpZ2h0ZWRcbiAgICAgICAgKyAnPC9jb2RlPjwvcHJlPlxcbic7XG59O1xuXG5cbmRlZmF1bHRfcnVsZXMuaW1hZ2UgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIHZhciB0b2tlbiA9IHRva2Vuc1tpZHhdO1xuXG4gIC8vIFwiYWx0XCIgYXR0ciBNVVNUIGJlIHNldCwgZXZlbiBpZiBlbXB0eS4gQmVjYXVzZSBpdCdzIG1hbmRhdG9yeSBhbmRcbiAgLy8gc2hvdWxkIGJlIHBsYWNlZCBvbiBwcm9wZXIgcG9zaXRpb24gZm9yIHRlc3RzLlxuICAvL1xuICAvLyBSZXBsYWNlIGNvbnRlbnQgd2l0aCBhY3R1YWwgdmFsdWVcblxuICB0b2tlbi5hdHRyc1t0b2tlbi5hdHRySW5kZXgoJ2FsdCcpXVsxXSA9XG4gICAgc2xmLnJlbmRlcklubGluZUFzVGV4dCh0b2tlbi5jaGlsZHJlbiwgb3B0aW9ucywgZW52KTtcblxuICByZXR1cm4gc2xmLnJlbmRlclRva2VuKHRva2VucywgaWR4LCBvcHRpb25zKTtcbn07XG5cblxuZGVmYXVsdF9ydWxlcy5oYXJkYnJlYWsgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyosIGVudiAqLykge1xuICByZXR1cm4gb3B0aW9ucy54aHRtbE91dCA/ICc8YnIgLz5cXG4nIDogJzxicj5cXG4nO1xufTtcbmRlZmF1bHRfcnVsZXMuc29mdGJyZWFrID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zIC8qLCBlbnYgKi8pIHtcbiAgcmV0dXJuIG9wdGlvbnMuYnJlYWtzID8gKG9wdGlvbnMueGh0bWxPdXQgPyAnPGJyIC8+XFxuJyA6ICc8YnI+XFxuJykgOiAnXFxuJztcbn07XG5cblxuZGVmYXVsdF9ydWxlcy50ZXh0ID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIGVzY2FwZUh0bWwodG9rZW5zW2lkeF0uY29udGVudCk7XG59O1xuXG5cbmRlZmF1bHRfcnVsZXMuaHRtbF9ibG9jayA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiB0b2tlbnNbaWR4XS5jb250ZW50O1xufTtcbmRlZmF1bHRfcnVsZXMuaHRtbF9pbmxpbmUgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gdG9rZW5zW2lkeF0uY29udGVudDtcbn07XG5cblxuLyoqXG4gKiBuZXcgUmVuZGVyZXIoKVxuICpcbiAqIENyZWF0ZXMgbmV3IFtbUmVuZGVyZXJdXSBpbnN0YW5jZSBhbmQgZmlsbCBbW1JlbmRlcmVyI3J1bGVzXV0gd2l0aCBkZWZhdWx0cy5cbiAqKi9cbmZ1bmN0aW9uIFJlbmRlcmVyKCkge1xuXG4gIC8qKlxuICAgKiBSZW5kZXJlciNydWxlcyAtPiBPYmplY3RcbiAgICpcbiAgICogQ29udGFpbnMgcmVuZGVyIHJ1bGVzIGZvciB0b2tlbnMuIENhbiBiZSB1cGRhdGVkIGFuZCBleHRlbmRlZC5cbiAgICpcbiAgICogIyMjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAgICpcbiAgICogbWQucmVuZGVyZXIucnVsZXMuc3Ryb25nX29wZW4gID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJzxiPic7IH07XG4gICAqIG1kLnJlbmRlcmVyLnJ1bGVzLnN0cm9uZ19jbG9zZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICc8L2I+JzsgfTtcbiAgICpcbiAgICogdmFyIHJlc3VsdCA9IG1kLnJlbmRlcklubGluZSguLi4pO1xuICAgKiBgYGBcbiAgICpcbiAgICogRWFjaCBydWxlIGlzIGNhbGxlZCBhcyBpbmRlcGVuZGVkIHN0YXRpYyBmdW5jdGlvbiB3aXRoIGZpeGVkIHNpZ25hdHVyZTpcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiBmdW5jdGlvbiBteV90b2tlbl9yZW5kZXIodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgcmVuZGVyZXIpIHtcbiAgICogICAvLyAuLi5cbiAgICogICByZXR1cm4gcmVuZGVyZWRIVE1MO1xuICAgKiB9XG4gICAqIGBgYFxuICAgKlxuICAgKiBTZWUgW3NvdXJjZSBjb2RlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3JlbmRlcmVyLmpzKVxuICAgKiBmb3IgbW9yZSBkZXRhaWxzIGFuZCBleGFtcGxlcy5cbiAgICoqL1xuICB0aGlzLnJ1bGVzID0gYXNzaWduKHt9LCBkZWZhdWx0X3J1bGVzKTtcbn1cblxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlckF0dHJzKHRva2VuKSAtPiBTdHJpbmdcbiAqXG4gKiBSZW5kZXIgdG9rZW4gYXR0cmlidXRlcyB0byBzdHJpbmcuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyQXR0cnMgPSBmdW5jdGlvbiByZW5kZXJBdHRycyh0b2tlbikge1xuICB2YXIgaSwgbCwgcmVzdWx0O1xuXG4gIGlmICghdG9rZW4uYXR0cnMpIHsgcmV0dXJuICcnOyB9XG5cbiAgcmVzdWx0ID0gJyc7XG5cbiAgZm9yIChpID0gMCwgbCA9IHRva2VuLmF0dHJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHJlc3VsdCArPSAnICcgKyBlc2NhcGVIdG1sKHRva2VuLmF0dHJzW2ldWzBdKSArICc9XCInICsgZXNjYXBlSHRtbCh0b2tlbi5hdHRyc1tpXVsxXSkgKyAnXCInO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuLyoqXG4gKiBSZW5kZXJlci5yZW5kZXJUb2tlbih0b2tlbnMsIGlkeCwgb3B0aW9ucykgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9mIHRva2Vuc1xuICogLSBpZHggKE51bWJlZCk6IHRva2VuIGluZGV4IHRvIHJlbmRlclxuICogLSBvcHRpb25zIChPYmplY3QpOiBwYXJhbXMgb2YgcGFyc2VyIGluc3RhbmNlXG4gKlxuICogRGVmYXVsdCB0b2tlbiByZW5kZXJlci4gQ2FuIGJlIG92ZXJyaWRlbiBieSBjdXN0b20gZnVuY3Rpb25cbiAqIGluIFtbUmVuZGVyZXIjcnVsZXNdXS5cbiAqKi9cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXJUb2tlbiA9IGZ1bmN0aW9uIHJlbmRlclRva2VuKHRva2VucywgaWR4LCBvcHRpb25zKSB7XG4gIHZhciBuZXh0VG9rZW4sXG4gICAgICByZXN1bHQgPSAnJyxcbiAgICAgIG5lZWRMZiA9IGZhbHNlLFxuICAgICAgdG9rZW4gPSB0b2tlbnNbaWR4XTtcblxuICAvLyBUaWdodCBsaXN0IHBhcmFncmFwaHNcbiAgaWYgKHRva2VuLmhpZGRlbikge1xuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIC8vIEluc2VydCBhIG5ld2xpbmUgYmV0d2VlbiBoaWRkZW4gcGFyYWdyYXBoIGFuZCBzdWJzZXF1ZW50IG9wZW5pbmdcbiAgLy8gYmxvY2stbGV2ZWwgdGFnLlxuICAvL1xuICAvLyBGb3IgZXhhbXBsZSwgaGVyZSB3ZSBzaG91bGQgaW5zZXJ0IGEgbmV3bGluZSBiZWZvcmUgYmxvY2txdW90ZTpcbiAgLy8gIC0gYVxuICAvLyAgICA+XG4gIC8vXG4gIGlmICh0b2tlbi5ibG9jayAmJiB0b2tlbi5uZXN0aW5nICE9PSAtMSAmJiBpZHggJiYgdG9rZW5zW2lkeCAtIDFdLmhpZGRlbikge1xuICAgIHJlc3VsdCArPSAnXFxuJztcbiAgfVxuXG4gIC8vIEFkZCB0b2tlbiBuYW1lLCBlLmcuIGA8aW1nYFxuICByZXN1bHQgKz0gKHRva2VuLm5lc3RpbmcgPT09IC0xID8gJzwvJyA6ICc8JykgKyB0b2tlbi50YWc7XG5cbiAgLy8gRW5jb2RlIGF0dHJpYnV0ZXMsIGUuZy4gYDxpbWcgc3JjPVwiZm9vXCJgXG4gIHJlc3VsdCArPSB0aGlzLnJlbmRlckF0dHJzKHRva2VuKTtcblxuICAvLyBBZGQgYSBzbGFzaCBmb3Igc2VsZi1jbG9zaW5nIHRhZ3MsIGUuZy4gYDxpbWcgc3JjPVwiZm9vXCIgL2BcbiAgaWYgKHRva2VuLm5lc3RpbmcgPT09IDAgJiYgb3B0aW9ucy54aHRtbE91dCkge1xuICAgIHJlc3VsdCArPSAnIC8nO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgd2UgbmVlZCB0byBhZGQgYSBuZXdsaW5lIGFmdGVyIHRoaXMgdGFnXG4gIGlmICh0b2tlbi5ibG9jaykge1xuICAgIG5lZWRMZiA9IHRydWU7XG5cbiAgICBpZiAodG9rZW4ubmVzdGluZyA9PT0gMSkge1xuICAgICAgaWYgKGlkeCArIDEgPCB0b2tlbnMubGVuZ3RoKSB7XG4gICAgICAgIG5leHRUb2tlbiA9IHRva2Vuc1tpZHggKyAxXTtcblxuICAgICAgICBpZiAobmV4dFRva2VuLnR5cGUgPT09ICdpbmxpbmUnIHx8IG5leHRUb2tlbi5oaWRkZW4pIHtcbiAgICAgICAgICAvLyBCbG9jay1sZXZlbCB0YWcgY29udGFpbmluZyBhbiBpbmxpbmUgdGFnLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgbmVlZExmID0gZmFsc2U7XG5cbiAgICAgICAgfSBlbHNlIGlmIChuZXh0VG9rZW4ubmVzdGluZyA9PT0gLTEgJiYgbmV4dFRva2VuLnRhZyA9PT0gdG9rZW4udGFnKSB7XG4gICAgICAgICAgLy8gT3BlbmluZyB0YWcgKyBjbG9zaW5nIHRhZyBvZiB0aGUgc2FtZSB0eXBlLiBFLmcuIGA8bGk+PC9saT5gLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgbmVlZExmID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXN1bHQgKz0gbmVlZExmID8gJz5cXG4nIDogJz4nO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5cbi8qKlxuICogUmVuZGVyZXIucmVuZGVySW5saW5lKHRva2Vucywgb3B0aW9ucywgZW52KSAtPiBTdHJpbmdcbiAqIC0gdG9rZW5zIChBcnJheSk6IGxpc3Qgb24gYmxvY2sgdG9rZW5zIHRvIHJlbnRlclxuICogLSBvcHRpb25zIChPYmplY3QpOiBwYXJhbXMgb2YgcGFyc2VyIGluc3RhbmNlXG4gKiAtIGVudiAoT2JqZWN0KTogYWRkaXRpb25hbCBkYXRhIGZyb20gcGFyc2VkIGlucHV0IChyZWZlcmVuY2VzLCBmb3IgZXhhbXBsZSlcbiAqXG4gKiBUaGUgc2FtZSBhcyBbW1JlbmRlcmVyLnJlbmRlcl1dLCBidXQgZm9yIHNpbmdsZSB0b2tlbiBvZiBgaW5saW5lYCB0eXBlLlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlcklubGluZSA9IGZ1bmN0aW9uICh0b2tlbnMsIG9wdGlvbnMsIGVudikge1xuICB2YXIgdHlwZSxcbiAgICAgIHJlc3VsdCA9ICcnLFxuICAgICAgcnVsZXMgPSB0aGlzLnJ1bGVzO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB0eXBlID0gdG9rZW5zW2ldLnR5cGU7XG5cbiAgICBpZiAodHlwZW9mIHJ1bGVzW3R5cGVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmVzdWx0ICs9IHJ1bGVzW3R5cGVdKHRva2VucywgaSwgb3B0aW9ucywgZW52LCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyVG9rZW4odG9rZW5zLCBpLCBvcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG4vKiogaW50ZXJuYWxcbiAqIFJlbmRlcmVyLnJlbmRlcklubGluZUFzVGV4dCh0b2tlbnMsIG9wdGlvbnMsIGVudikgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9uIGJsb2NrIHRva2VucyB0byByZW50ZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICogLSBlbnYgKE9iamVjdCk6IGFkZGl0aW9uYWwgZGF0YSBmcm9tIHBhcnNlZCBpbnB1dCAocmVmZXJlbmNlcywgZm9yIGV4YW1wbGUpXG4gKlxuICogU3BlY2lhbCBrbHVkZ2UgZm9yIGltYWdlIGBhbHRgIGF0dHJpYnV0ZXMgdG8gY29uZm9ybSBDb21tb25NYXJrIHNwZWMuXG4gKiBEb24ndCB0cnkgdG8gdXNlIGl0ISBTcGVjIHJlcXVpcmVzIHRvIHNob3cgYGFsdGAgY29udGVudCB3aXRoIHN0cmlwcGVkIG1hcmt1cCxcbiAqIGluc3RlYWQgb2Ygc2ltcGxlIGVzY2FwaW5nLlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlcklubGluZUFzVGV4dCA9IGZ1bmN0aW9uICh0b2tlbnMsIG9wdGlvbnMsIGVudikge1xuICB2YXIgcmVzdWx0ID0gJyc7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHRva2Vucy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICh0b2tlbnNbaV0udHlwZSA9PT0gJ3RleHQnKSB7XG4gICAgICByZXN1bHQgKz0gdG9rZW5zW2ldLmNvbnRlbnQ7XG4gICAgfSBlbHNlIGlmICh0b2tlbnNbaV0udHlwZSA9PT0gJ2ltYWdlJykge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVySW5saW5lQXNUZXh0KHRva2Vuc1tpXS5jaGlsZHJlbiwgb3B0aW9ucywgZW52KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlcih0b2tlbnMsIG9wdGlvbnMsIGVudikgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9uIGJsb2NrIHRva2VucyB0byByZW50ZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICogLSBlbnYgKE9iamVjdCk6IGFkZGl0aW9uYWwgZGF0YSBmcm9tIHBhcnNlZCBpbnB1dCAocmVmZXJlbmNlcywgZm9yIGV4YW1wbGUpXG4gKlxuICogVGFrZXMgdG9rZW4gc3RyZWFtIGFuZCBnZW5lcmF0ZXMgSFRNTC4gUHJvYmFibHksIHlvdSB3aWxsIG5ldmVyIG5lZWQgdG8gY2FsbFxuICogdGhpcyBtZXRob2QgZGlyZWN0bHkuXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKHRva2Vucywgb3B0aW9ucywgZW52KSB7XG4gIHZhciBpLCBsZW4sIHR5cGUsXG4gICAgICByZXN1bHQgPSAnJyxcbiAgICAgIHJ1bGVzID0gdGhpcy5ydWxlcztcblxuICBmb3IgKGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICB0eXBlID0gdG9rZW5zW2ldLnR5cGU7XG5cbiAgICBpZiAodHlwZSA9PT0gJ2lubGluZScpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlcklubGluZSh0b2tlbnNbaV0uY2hpbGRyZW4sIG9wdGlvbnMsIGVudik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcnVsZXNbdHlwZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXN1bHQgKz0gcnVsZXNbdG9rZW5zW2ldLnR5cGVdKHRva2VucywgaSwgb3B0aW9ucywgZW52LCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ICs9IHRoaXMucmVuZGVyVG9rZW4odG9rZW5zLCBpLCBvcHRpb25zLCBlbnYpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyO1xuIiwiLyoqXG4gKiBjbGFzcyBSdWxlclxuICpcbiAqIEhlbHBlciBjbGFzcywgdXNlZCBieSBbW01hcmtkb3duSXQjY29yZV1dLCBbW01hcmtkb3duSXQjYmxvY2tdXSBhbmRcbiAqIFtbTWFya2Rvd25JdCNpbmxpbmVdXSB0byBtYW5hZ2Ugc2VxdWVuY2VzIG9mIGZ1bmN0aW9ucyAocnVsZXMpOlxuICpcbiAqIC0ga2VlcCBydWxlcyBpbiBkZWZpbmVkIG9yZGVyXG4gKiAtIGFzc2lnbiB0aGUgbmFtZSB0byBlYWNoIHJ1bGVcbiAqIC0gZW5hYmxlL2Rpc2FibGUgcnVsZXNcbiAqIC0gYWRkL3JlcGxhY2UgcnVsZXNcbiAqIC0gYWxsb3cgYXNzaWduIHJ1bGVzIHRvIGFkZGl0aW9uYWwgbmFtZWQgY2hhaW5zIChpbiB0aGUgc2FtZSlcbiAqIC0gY2FjaGVpbmcgbGlzdHMgb2YgYWN0aXZlIHJ1bGVzXG4gKlxuICogWW91IHdpbGwgbm90IG5lZWQgdXNlIHRoaXMgY2xhc3MgZGlyZWN0bHkgdW50aWwgd3JpdGUgcGx1Z2lucy4gRm9yIHNpbXBsZVxuICogcnVsZXMgY29udHJvbCB1c2UgW1tNYXJrZG93bkl0LmRpc2FibGVdXSwgW1tNYXJrZG93bkl0LmVuYWJsZV1dIGFuZFxuICogW1tNYXJrZG93bkl0LnVzZV1dLlxuICoqL1xuJ3VzZSBzdHJpY3QnO1xuXG5cbi8qKlxuICogbmV3IFJ1bGVyKClcbiAqKi9cbmZ1bmN0aW9uIFJ1bGVyKCkge1xuICAvLyBMaXN0IG9mIGFkZGVkIHJ1bGVzLiBFYWNoIGVsZW1lbnQgaXM6XG4gIC8vXG4gIC8vIHtcbiAgLy8gICBuYW1lOiBYWFgsXG4gIC8vICAgZW5hYmxlZDogQm9vbGVhbixcbiAgLy8gICBmbjogRnVuY3Rpb24oKSxcbiAgLy8gICBhbHQ6IFsgbmFtZTIsIG5hbWUzIF1cbiAgLy8gfVxuICAvL1xuICB0aGlzLl9fcnVsZXNfXyA9IFtdO1xuXG4gIC8vIENhY2hlZCBydWxlIGNoYWlucy5cbiAgLy9cbiAgLy8gRmlyc3QgbGV2ZWwgLSBjaGFpbiBuYW1lLCAnJyBmb3IgZGVmYXVsdC5cbiAgLy8gU2Vjb25kIGxldmVsIC0gZGlnaW5hbCBhbmNob3IgZm9yIGZhc3QgZmlsdGVyaW5nIGJ5IGNoYXJjb2Rlcy5cbiAgLy9cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gSGVscGVyIG1ldGhvZHMsIHNob3VsZCBub3QgYmUgdXNlZCBkaXJlY3RseVxuXG5cbi8vIEZpbmQgcnVsZSBpbmRleCBieSBuYW1lXG4vL1xuUnVsZXIucHJvdG90eXBlLl9fZmluZF9fID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLl9fcnVsZXNfXy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0aGlzLl9fcnVsZXNfX1tpXS5uYW1lID09PSBuYW1lKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufTtcblxuXG4vLyBCdWlsZCBydWxlcyBsb29rdXAgY2FjaGVcbi8vXG5SdWxlci5wcm90b3R5cGUuX19jb21waWxlX18gPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdmFyIGNoYWlucyA9IFsgJycgXTtcblxuICAvLyBjb2xsZWN0IHVuaXF1ZSBuYW1lc1xuICBzZWxmLl9fcnVsZXNfXy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgaWYgKCFydWxlLmVuYWJsZWQpIHsgcmV0dXJuOyB9XG5cbiAgICBydWxlLmFsdC5mb3JFYWNoKGZ1bmN0aW9uIChhbHROYW1lKSB7XG4gICAgICBpZiAoY2hhaW5zLmluZGV4T2YoYWx0TmFtZSkgPCAwKSB7XG4gICAgICAgIGNoYWlucy5wdXNoKGFsdE5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICBzZWxmLl9fY2FjaGVfXyA9IHt9O1xuXG4gIGNoYWlucy5mb3JFYWNoKGZ1bmN0aW9uIChjaGFpbikge1xuICAgIHNlbGYuX19jYWNoZV9fW2NoYWluXSA9IFtdO1xuICAgIHNlbGYuX19ydWxlc19fLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHtcbiAgICAgIGlmICghcnVsZS5lbmFibGVkKSB7IHJldHVybjsgfVxuXG4gICAgICBpZiAoY2hhaW4gJiYgcnVsZS5hbHQuaW5kZXhPZihjaGFpbikgPCAwKSB7IHJldHVybjsgfVxuXG4gICAgICBzZWxmLl9fY2FjaGVfX1tjaGFpbl0ucHVzaChydWxlLmZuKTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG5cbi8qKlxuICogUnVsZXIuYXQobmFtZSwgZm4gWywgb3B0aW9uc10pXG4gKiAtIG5hbWUgKFN0cmluZyk6IHJ1bGUgbmFtZSB0byByZXBsYWNlLlxuICogLSBmbiAoRnVuY3Rpb24pOiBuZXcgcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogbmV3IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogUmVwbGFjZSBydWxlIGJ5IG5hbWUgd2l0aCBuZXcgZnVuY3Rpb24gJiBvcHRpb25zLiBUaHJvd3MgZXJyb3IgaWYgbmFtZSBub3RcbiAqIGZvdW5kLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogUmVwbGFjZSBleGlzdGluZyB0eXBvcmdhcGhlciByZXBsYWNlbWVudCBydWxlIHdpdGggbmV3IG9uZTpcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKlxuICogbWQuY29yZS5ydWxlci5hdCgncmVwbGFjZW1lbnRzJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChuYW1lLCBmbiwgb3B0aW9ucykge1xuICB2YXIgaW5kZXggPSB0aGlzLl9fZmluZF9fKG5hbWUpO1xuICB2YXIgb3B0ID0gb3B0aW9ucyB8fCB7fTtcblxuICBpZiAoaW5kZXggPT09IC0xKSB7IHRocm93IG5ldyBFcnJvcignUGFyc2VyIHJ1bGUgbm90IGZvdW5kOiAnICsgbmFtZSk7IH1cblxuICB0aGlzLl9fcnVsZXNfX1tpbmRleF0uZm4gPSBmbjtcbiAgdGhpcy5fX3J1bGVzX19baW5kZXhdLmFsdCA9IG9wdC5hbHQgfHwgW107XG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cblxuLyoqXG4gKiBSdWxlci5iZWZvcmUoYmVmb3JlTmFtZSwgcnVsZU5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICogLSBiZWZvcmVOYW1lIChTdHJpbmcpOiBuZXcgcnVsZSB3aWxsIGJlIGFkZGVkIGJlZm9yZSB0aGlzIG9uZS5cbiAqIC0gcnVsZU5hbWUgKFN0cmluZyk6IG5hbWUgb2YgYWRkZWQgcnVsZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcnVsZSBvcHRpb25zIChub3QgbWFuZGF0b3J5KS5cbiAqXG4gKiBBZGQgbmV3IHJ1bGUgdG8gY2hhaW4gYmVmb3JlIG9uZSB3aXRoIGdpdmVuIG5hbWUuIFNlZSBhbHNvXG4gKiBbW1J1bGVyLmFmdGVyXV0sIFtbUnVsZXIucHVzaF1dLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmJsb2NrLnJ1bGVyLmJlZm9yZSgncGFyYWdyYXBoJywgJ215X3J1bGUnLCBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XG4gKiAgIC8vLi4uXG4gKiB9KTtcbiAqIGBgYFxuICoqL1xuUnVsZXIucHJvdG90eXBlLmJlZm9yZSA9IGZ1bmN0aW9uIChiZWZvcmVOYW1lLCBydWxlTmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgdmFyIGluZGV4ID0gdGhpcy5fX2ZpbmRfXyhiZWZvcmVOYW1lKTtcbiAgdmFyIG9wdCA9IG9wdGlvbnMgfHwge307XG5cbiAgaWYgKGluZGV4ID09PSAtMSkgeyB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlciBydWxlIG5vdCBmb3VuZDogJyArIGJlZm9yZU5hbWUpOyB9XG5cbiAgdGhpcy5fX3J1bGVzX18uc3BsaWNlKGluZGV4LCAwLCB7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbjogZm4sXG4gICAgYWx0OiBvcHQuYWx0IHx8IFtdXG4gIH0pO1xuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cblxuLyoqXG4gKiBSdWxlci5hZnRlcihhZnRlck5hbWUsIHJ1bGVOYW1lLCBmbiBbLCBvcHRpb25zXSlcbiAqIC0gYWZ0ZXJOYW1lIChTdHJpbmcpOiBuZXcgcnVsZSB3aWxsIGJlIGFkZGVkIGFmdGVyIHRoaXMgb25lLlxuICogLSBydWxlTmFtZSAoU3RyaW5nKTogbmFtZSBvZiBhZGRlZCBydWxlLlxuICogLSBmbiAoRnVuY3Rpb24pOiBydWxlIGZ1bmN0aW9uLlxuICogLSBvcHRpb25zIChPYmplY3QpOiBydWxlIG9wdGlvbnMgKG5vdCBtYW5kYXRvcnkpLlxuICpcbiAqIEFkZCBuZXcgcnVsZSB0byBjaGFpbiBhZnRlciBvbmUgd2l0aCBnaXZlbiBuYW1lLiBTZWUgYWxzb1xuICogW1tSdWxlci5iZWZvcmVdXSwgW1tSdWxlci5wdXNoXV0uXG4gKlxuICogIyMjIyMgT3B0aW9uczpcbiAqXG4gKiAtIF9fYWx0X18gLSBhcnJheSB3aXRoIG5hbWVzIG9mIFwiYWx0ZXJuYXRlXCIgY2hhaW5zLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKlxuICogbWQuaW5saW5lLnJ1bGVyLmFmdGVyKCd0ZXh0JywgJ215X3J1bGUnLCBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XG4gKiAgIC8vLi4uXG4gKiB9KTtcbiAqIGBgYFxuICoqL1xuUnVsZXIucHJvdG90eXBlLmFmdGVyID0gZnVuY3Rpb24gKGFmdGVyTmFtZSwgcnVsZU5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIHZhciBpbmRleCA9IHRoaXMuX19maW5kX18oYWZ0ZXJOYW1lKTtcbiAgdmFyIG9wdCA9IG9wdGlvbnMgfHwge307XG5cbiAgaWYgKGluZGV4ID09PSAtMSkgeyB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlciBydWxlIG5vdCBmb3VuZDogJyArIGFmdGVyTmFtZSk7IH1cblxuICB0aGlzLl9fcnVsZXNfXy5zcGxpY2UoaW5kZXggKyAxLCAwLCB7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbjogZm4sXG4gICAgYWx0OiBvcHQuYWx0IHx8IFtdXG4gIH0pO1xuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cbi8qKlxuICogUnVsZXIucHVzaChydWxlTmFtZSwgZm4gWywgb3B0aW9uc10pXG4gKiAtIHJ1bGVOYW1lIChTdHJpbmcpOiBuYW1lIG9mIGFkZGVkIHJ1bGUuXG4gKiAtIGZuIChGdW5jdGlvbik6IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogUHVzaCBuZXcgcnVsZSB0byB0aGUgZW5kIG9mIGNoYWluLiBTZWUgYWxzb1xuICogW1tSdWxlci5iZWZvcmVdXSwgW1tSdWxlci5hZnRlcl1dLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmNvcmUucnVsZXIucHVzaCgnbXlfcnVsZScsIGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAqICAgLy8uLi5cbiAqIH0pO1xuICogYGBgXG4gKiovXG5SdWxlci5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uIChydWxlTmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgdmFyIG9wdCA9IG9wdGlvbnMgfHwge307XG5cbiAgdGhpcy5fX3J1bGVzX18ucHVzaCh7XG4gICAgbmFtZTogcnVsZU5hbWUsXG4gICAgZW5hYmxlZDogdHJ1ZSxcbiAgICBmbjogZm4sXG4gICAgYWx0OiBvcHQuYWx0IHx8IFtdXG4gIH0pO1xuXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn07XG5cblxuLyoqXG4gKiBSdWxlci5lbmFibGUobGlzdCBbLCBpZ25vcmVJbnZhbGlkXSkgLT4gQXJyYXlcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIEVuYWJsZSBydWxlcyB3aXRoIGdpdmVuIG5hbWVzLiBJZiBhbnkgcnVsZSBuYW1lIG5vdCBmb3VuZCAtIHRocm93IEVycm9yLlxuICogRXJyb3JzIGNhbiBiZSBkaXNhYmxlZCBieSBzZWNvbmQgcGFyYW0uXG4gKlxuICogUmV0dXJucyBsaXN0IG9mIGZvdW5kIHJ1bGUgbmFtZXMgKGlmIG5vIGV4Y2VwdGlvbiBoYXBwZW5lZCkuXG4gKlxuICogU2VlIGFsc28gW1tSdWxlci5kaXNhYmxlXV0sIFtbUnVsZXIuZW5hYmxlT25seV1dLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBpZ25vcmVJbnZhbGlkKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkgeyBsaXN0ID0gWyBsaXN0IF07IH1cblxuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgLy8gU2VhcmNoIGJ5IG5hbWUgYW5kIGVuYWJsZVxuICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgaWR4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKTtcblxuICAgIGlmIChpZHggPCAwKSB7XG4gICAgICBpZiAoaWdub3JlSW52YWxpZCkgeyByZXR1cm47IH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignUnVsZXMgbWFuYWdlcjogaW52YWxpZCBydWxlIG5hbWUgJyArIG5hbWUpO1xuICAgIH1cbiAgICB0aGlzLl9fcnVsZXNfX1tpZHhdLmVuYWJsZWQgPSB0cnVlO1xuICAgIHJlc3VsdC5wdXNoKG5hbWUpO1xuICB9LCB0aGlzKTtcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5cbi8qKlxuICogUnVsZXIuZW5hYmxlT25seShsaXN0IFssIGlnbm9yZUludmFsaWRdKVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZW5hYmxlICh3aGl0ZWxpc3QpLlxuICogLSBpZ25vcmVJbnZhbGlkIChCb29sZWFuKTogc2V0IGB0cnVlYCB0byBpZ25vcmUgZXJyb3JzIHdoZW4gcnVsZSBub3QgZm91bmQuXG4gKlxuICogRW5hYmxlIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMsIGFuZCBkaXNhYmxlIGV2ZXJ5dGhpbmcgZWxzZS4gSWYgYW55IHJ1bGUgbmFtZVxuICogbm90IGZvdW5kIC0gdGhyb3cgRXJyb3IuIEVycm9ycyBjYW4gYmUgZGlzYWJsZWQgYnkgc2Vjb25kIHBhcmFtLlxuICpcbiAqIFNlZSBhbHNvIFtbUnVsZXIuZGlzYWJsZV1dLCBbW1J1bGVyLmVuYWJsZV1dLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmVuYWJsZU9ubHkgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFsgbGlzdCBdOyB9XG5cbiAgdGhpcy5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkgeyBydWxlLmVuYWJsZWQgPSBmYWxzZTsgfSk7XG5cbiAgdGhpcy5lbmFibGUobGlzdCwgaWdub3JlSW52YWxpZCk7XG59O1xuXG5cbi8qKlxuICogUnVsZXIuZGlzYWJsZShsaXN0IFssIGlnbm9yZUludmFsaWRdKSAtPiBBcnJheVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZGlzYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIERpc2FibGUgcnVsZXMgd2l0aCBnaXZlbiBuYW1lcy4gSWYgYW55IHJ1bGUgbmFtZSBub3QgZm91bmQgLSB0aHJvdyBFcnJvci5cbiAqIEVycm9ycyBjYW4gYmUgZGlzYWJsZWQgYnkgc2Vjb25kIHBhcmFtLlxuICpcbiAqIFJldHVybnMgbGlzdCBvZiBmb3VuZCBydWxlIG5hbWVzIChpZiBubyBleGNlcHRpb24gaGFwcGVuZWQpLlxuICpcbiAqIFNlZSBhbHNvIFtbUnVsZXIuZW5hYmxlXV0sIFtbUnVsZXIuZW5hYmxlT25seV1dLlxuICoqL1xuUnVsZXIucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFsgbGlzdCBdOyB9XG5cbiAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gIC8vIFNlYXJjaCBieSBuYW1lIGFuZCBkaXNhYmxlXG4gIGxpc3QuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgIHZhciBpZHggPSB0aGlzLl9fZmluZF9fKG5hbWUpO1xuXG4gICAgaWYgKGlkeCA8IDApIHtcbiAgICAgIGlmIChpZ25vcmVJbnZhbGlkKSB7IHJldHVybjsgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdSdWxlcyBtYW5hZ2VyOiBpbnZhbGlkIHJ1bGUgbmFtZSAnICsgbmFtZSk7XG4gICAgfVxuICAgIHRoaXMuX19ydWxlc19fW2lkeF0uZW5hYmxlZCA9IGZhbHNlO1xuICAgIHJlc3VsdC5wdXNoKG5hbWUpO1xuICB9LCB0aGlzKTtcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5cbi8qKlxuICogUnVsZXIuZ2V0UnVsZXMoY2hhaW5OYW1lKSAtPiBBcnJheVxuICpcbiAqIFJldHVybiBhcnJheSBvZiBhY3RpdmUgZnVuY3Rpb25zIChydWxlcykgZm9yIGdpdmVuIGNoYWluIG5hbWUuIEl0IGFuYWx5emVzXG4gKiBydWxlcyBjb25maWd1cmF0aW9uLCBjb21waWxlcyBjYWNoZXMgaWYgbm90IGV4aXN0cyBhbmQgcmV0dXJucyByZXN1bHQuXG4gKlxuICogRGVmYXVsdCBjaGFpbiBuYW1lIGlzIGAnJ2AgKGVtcHR5IHN0cmluZykuIEl0IGNhbid0IGJlIHNraXBwZWQuIFRoYXQnc1xuICogZG9uZSBpbnRlbnRpb25hbGx5LCB0byBrZWVwIHNpZ25hdHVyZSBtb25vbW9ycGhpYyBmb3IgaGlnaCBzcGVlZC5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5nZXRSdWxlcyA9IGZ1bmN0aW9uIChjaGFpbk5hbWUpIHtcbiAgaWYgKHRoaXMuX19jYWNoZV9fID09PSBudWxsKSB7XG4gICAgdGhpcy5fX2NvbXBpbGVfXygpO1xuICB9XG5cbiAgLy8gQ2hhaW4gY2FuIGJlIGVtcHR5LCBpZiBydWxlcyBkaXNhYmxlZC4gQnV0IHdlIHN0aWxsIGhhdmUgdG8gcmV0dXJuIEFycmF5LlxuICByZXR1cm4gdGhpcy5fX2NhY2hlX19bY2hhaW5OYW1lXSB8fCBbXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUnVsZXI7XG4iLCIvLyBCbG9jayBxdW90ZXNcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNTcGFjZSA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBibG9ja3F1b3RlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgYWRqdXN0VGFiLFxuICAgICAgY2gsXG4gICAgICBpLFxuICAgICAgaW5pdGlhbCxcbiAgICAgIGwsXG4gICAgICBsYXN0TGluZUVtcHR5LFxuICAgICAgbGluZXMsXG4gICAgICBuZXh0TGluZSxcbiAgICAgIG9mZnNldCxcbiAgICAgIG9sZEJNYXJrcyxcbiAgICAgIG9sZEJTQ291bnQsXG4gICAgICBvbGRJbmRlbnQsXG4gICAgICBvbGRQYXJlbnRUeXBlLFxuICAgICAgb2xkU0NvdW50LFxuICAgICAgb2xkVFNoaWZ0LFxuICAgICAgc3BhY2VBZnRlck1hcmtlcixcbiAgICAgIHRlcm1pbmF0ZSxcbiAgICAgIHRlcm1pbmF0b3JSdWxlcyxcbiAgICAgIHRva2VuLFxuICAgICAgd2FzT3V0ZGVudGVkLFxuICAgICAgb2xkTGluZU1heCA9IHN0YXRlLmxpbmVNYXgsXG4gICAgICBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdLFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gY2hlY2sgdGhlIGJsb2NrIHF1b3RlIG1hcmtlclxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspICE9PSAweDNFLyogPiAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICAvLyB3ZSBrbm93IHRoYXQgaXQncyBnb2luZyB0byBiZSBhIHZhbGlkIGJsb2NrcXVvdGUsXG4gIC8vIHNvIG5vIHBvaW50IHRyeWluZyB0byBmaW5kIHRoZSBlbmQgb2YgaXQgaW4gc2lsZW50IG1vZGVcbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIC8vIHNraXAgc3BhY2VzIGFmdGVyIFwiPlwiIGFuZCByZS1jYWxjdWxhdGUgb2Zmc2V0XG4gIGluaXRpYWwgPSBvZmZzZXQgPSBzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSArIHBvcyAtIChzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdKTtcblxuICAvLyBza2lwIG9uZSBvcHRpb25hbCBzcGFjZSBhZnRlciAnPidcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjAgLyogc3BhY2UgKi8pIHtcbiAgICAvLyAnID4gICB0ZXN0ICdcbiAgICAvLyAgICAgXiAtLSBwb3NpdGlvbiBzdGFydCBvZiBsaW5lIGhlcmU6XG4gICAgcG9zKys7XG4gICAgaW5pdGlhbCsrO1xuICAgIG9mZnNldCsrO1xuICAgIGFkanVzdFRhYiA9IGZhbHNlO1xuICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MDkgLyogdGFiICovKSB7XG4gICAgc3BhY2VBZnRlck1hcmtlciA9IHRydWU7XG5cbiAgICBpZiAoKHN0YXRlLmJzQ291bnRbc3RhcnRMaW5lXSArIG9mZnNldCkgJSA0ID09PSAzKSB7XG4gICAgICAvLyAnICA+XFx0ICB0ZXN0ICdcbiAgICAgIC8vICAgICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlICh0YWIgaGFzIHdpZHRoPT09MSlcbiAgICAgIHBvcysrO1xuICAgICAgaW5pdGlhbCsrO1xuICAgICAgb2Zmc2V0Kys7XG4gICAgICBhZGp1c3RUYWIgPSBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gJyA+XFx0ICB0ZXN0ICdcbiAgICAgIC8vICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlICsgc2hpZnQgYnNDb3VudCBzbGlnaHRseVxuICAgICAgLy8gICAgICAgICB0byBtYWtlIGV4dHJhIHNwYWNlIGFwcGVhclxuICAgICAgYWRqdXN0VGFiID0gdHJ1ZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc3BhY2VBZnRlck1hcmtlciA9IGZhbHNlO1xuICB9XG5cbiAgb2xkQk1hcmtzID0gWyBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSBdO1xuICBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSA9IHBvcztcblxuICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICBpZiAoY2ggPT09IDB4MDkpIHtcbiAgICAgICAgb2Zmc2V0ICs9IDQgLSAob2Zmc2V0ICsgc3RhdGUuYnNDb3VudFtzdGFydExpbmVdICsgKGFkanVzdFRhYiA/IDEgOiAwKSkgJSA0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2Zmc2V0Kys7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHBvcysrO1xuICB9XG5cbiAgb2xkQlNDb3VudCA9IFsgc3RhdGUuYnNDb3VudFtzdGFydExpbmVdIF07XG4gIHN0YXRlLmJzQ291bnRbc3RhcnRMaW5lXSA9IHN0YXRlLnNDb3VudFtzdGFydExpbmVdICsgMSArIChzcGFjZUFmdGVyTWFya2VyID8gMSA6IDApO1xuXG4gIGxhc3RMaW5lRW1wdHkgPSBwb3MgPj0gbWF4O1xuXG4gIG9sZFNDb3VudCA9IFsgc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gXTtcbiAgc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gPSBvZmZzZXQgLSBpbml0aWFsO1xuXG4gIG9sZFRTaGlmdCA9IFsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0gXTtcbiAgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0gPSBwb3MgLSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXTtcblxuICB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygnYmxvY2txdW90ZScpO1xuXG4gIG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlO1xuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ2Jsb2NrcXVvdGUnO1xuICB3YXNPdXRkZW50ZWQgPSBmYWxzZTtcblxuICAvLyBTZWFyY2ggdGhlIGVuZCBvZiB0aGUgYmxvY2tcbiAgLy9cbiAgLy8gQmxvY2sgZW5kcyB3aXRoIGVpdGhlcjpcbiAgLy8gIDEuIGFuIGVtcHR5IGxpbmUgb3V0c2lkZTpcbiAgLy8gICAgIGBgYFxuICAvLyAgICAgPiB0ZXN0XG4gIC8vXG4gIC8vICAgICBgYGBcbiAgLy8gIDIuIGFuIGVtcHR5IGxpbmUgaW5zaWRlOlxuICAvLyAgICAgYGBgXG4gIC8vICAgICA+XG4gIC8vICAgICB0ZXN0XG4gIC8vICAgICBgYGBcbiAgLy8gIDMuIGFub3RoZXIgdGFnOlxuICAvLyAgICAgYGBgXG4gIC8vICAgICA+IHRlc3RcbiAgLy8gICAgICAtIC0gLVxuICAvLyAgICAgYGBgXG4gIGZvciAobmV4dExpbmUgPSBzdGFydExpbmUgKyAxOyBuZXh0TGluZSA8IGVuZExpbmU7IG5leHRMaW5lKyspIHtcbiAgICAvLyBjaGVjayBpZiBpdCdzIG91dGRlbnRlZCwgaS5lLiBpdCdzIGluc2lkZSBsaXN0IGl0ZW0gYW5kIGluZGVudGVkXG4gICAgLy8gbGVzcyB0aGFuIHNhaWQgbGlzdCBpdGVtOlxuICAgIC8vXG4gICAgLy8gYGBgXG4gICAgLy8gMS4gYW55dGhpbmdcbiAgICAvLyAgICA+IGN1cnJlbnQgYmxvY2txdW90ZVxuICAgIC8vIDIuIGNoZWNraW5nIHRoaXMgbGluZVxuICAgIC8vIGBgYFxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB3YXNPdXRkZW50ZWQgPSB0cnVlO1xuXG4gICAgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgbWF4ID0gc3RhdGUuZU1hcmtzW25leHRMaW5lXTtcblxuICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICAvLyBDYXNlIDE6IGxpbmUgaXMgbm90IGluc2lkZSB0aGUgYmxvY2txdW90ZSwgYW5kIHRoaXMgbGluZSBpcyBlbXB0eS5cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKykgPT09IDB4M0UvKiA+ICovICYmICF3YXNPdXRkZW50ZWQpIHtcbiAgICAgIC8vIFRoaXMgbGluZSBpcyBpbnNpZGUgdGhlIGJsb2NrcXVvdGUuXG5cbiAgICAgIC8vIHNraXAgc3BhY2VzIGFmdGVyIFwiPlwiIGFuZCByZS1jYWxjdWxhdGUgb2Zmc2V0XG4gICAgICBpbml0aWFsID0gb2Zmc2V0ID0gc3RhdGUuc0NvdW50W25leHRMaW5lXSArIHBvcyAtIChzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXSk7XG5cbiAgICAgIC8vIHNraXAgb25lIG9wdGlvbmFsIHNwYWNlIGFmdGVyICc+J1xuICAgICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjAgLyogc3BhY2UgKi8pIHtcbiAgICAgICAgLy8gJyA+ICAgdGVzdCAnXG4gICAgICAgIC8vICAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZTpcbiAgICAgICAgcG9zKys7XG4gICAgICAgIGluaXRpYWwrKztcbiAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgIGFkanVzdFRhYiA9IGZhbHNlO1xuICAgICAgICBzcGFjZUFmdGVyTWFya2VyID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgwOSAvKiB0YWIgKi8pIHtcbiAgICAgICAgc3BhY2VBZnRlck1hcmtlciA9IHRydWU7XG5cbiAgICAgICAgaWYgKChzdGF0ZS5ic0NvdW50W25leHRMaW5lXSArIG9mZnNldCkgJSA0ID09PSAzKSB7XG4gICAgICAgICAgLy8gJyAgPlxcdCAgdGVzdCAnXG4gICAgICAgICAgLy8gICAgICAgXiAtLSBwb3NpdGlvbiBzdGFydCBvZiBsaW5lIGhlcmUgKHRhYiBoYXMgd2lkdGg9PT0xKVxuICAgICAgICAgIHBvcysrO1xuICAgICAgICAgIGluaXRpYWwrKztcbiAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgICBhZGp1c3RUYWIgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyAnID5cXHQgIHRlc3QgJ1xuICAgICAgICAgIC8vICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlICsgc2hpZnQgYnNDb3VudCBzbGlnaHRseVxuICAgICAgICAgIC8vICAgICAgICAgdG8gbWFrZSBleHRyYSBzcGFjZSBhcHBlYXJcbiAgICAgICAgICBhZGp1c3RUYWIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzcGFjZUFmdGVyTWFya2VyID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIG9sZEJNYXJrcy5wdXNoKHN0YXRlLmJNYXJrc1tuZXh0TGluZV0pO1xuICAgICAgc3RhdGUuYk1hcmtzW25leHRMaW5lXSA9IHBvcztcblxuICAgICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgICAgICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgICAgICBvZmZzZXQgKz0gNCAtIChvZmZzZXQgKyBzdGF0ZS5ic0NvdW50W25leHRMaW5lXSArIChhZGp1c3RUYWIgPyAxIDogMCkpICUgNDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcG9zKys7XG4gICAgICB9XG5cbiAgICAgIGxhc3RMaW5lRW1wdHkgPSBwb3MgPj0gbWF4O1xuXG4gICAgICBvbGRCU0NvdW50LnB1c2goc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pO1xuICAgICAgc3RhdGUuYnNDb3VudFtuZXh0TGluZV0gPSBzdGF0ZS5zQ291bnRbbmV4dExpbmVdICsgMSArIChzcGFjZUFmdGVyTWFya2VyID8gMSA6IDApO1xuXG4gICAgICBvbGRTQ291bnQucHVzaChzdGF0ZS5zQ291bnRbbmV4dExpbmVdKTtcbiAgICAgIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPSBvZmZzZXQgLSBpbml0aWFsO1xuXG4gICAgICBvbGRUU2hpZnQucHVzaChzdGF0ZS50U2hpZnRbbmV4dExpbmVdKTtcbiAgICAgIHN0YXRlLnRTaGlmdFtuZXh0TGluZV0gPSBwb3MgLSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gQ2FzZSAyOiBsaW5lIGlzIG5vdCBpbnNpZGUgdGhlIGJsb2NrcXVvdGUsIGFuZCB0aGUgbGFzdCBsaW5lIHdhcyBlbXB0eS5cbiAgICBpZiAobGFzdExpbmVFbXB0eSkgeyBicmVhazsgfVxuXG4gICAgLy8gQ2FzZSAzOiBhbm90aGVyIHRhZyBmb3VuZC5cbiAgICB0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0ZXJtaW5hdGUpIHtcbiAgICAgIC8vIFF1aXJrIHRvIGVuZm9yY2UgXCJoYXJkIHRlcm1pbmF0aW9uIG1vZGVcIiBmb3IgcGFyYWdyYXBocztcbiAgICAgIC8vIG5vcm1hbGx5IGlmIHlvdSBjYWxsIGB0b2tlbml6ZShzdGF0ZSwgc3RhcnRMaW5lLCBuZXh0TGluZSlgLFxuICAgICAgLy8gcGFyYWdyYXBocyB3aWxsIGxvb2sgYmVsb3cgbmV4dExpbmUgZm9yIHBhcmFncmFwaCBjb250aW51YXRpb24sXG4gICAgICAvLyBidXQgaWYgYmxvY2txdW90ZSBpcyB0ZXJtaW5hdGVkIGJ5IGFub3RoZXIgdGFnLCB0aGV5IHNob3VsZG4ndFxuICAgICAgc3RhdGUubGluZU1heCA9IG5leHRMaW5lO1xuXG4gICAgICBpZiAoc3RhdGUuYmxrSW5kZW50ICE9PSAwKSB7XG4gICAgICAgIC8vIHN0YXRlLmJsa0luZGVudCB3YXMgbm9uLXplcm8sIHdlIG5vdyBzZXQgaXQgdG8gemVybyxcbiAgICAgICAgLy8gc28gd2UgbmVlZCB0byByZS1jYWxjdWxhdGUgYWxsIG9mZnNldHMgdG8gYXBwZWFyIGFzXG4gICAgICAgIC8vIGlmIGluZGVudCB3YXNuJ3QgY2hhbmdlZFxuICAgICAgICBvbGRCTWFya3MucHVzaChzdGF0ZS5iTWFya3NbbmV4dExpbmVdKTtcbiAgICAgICAgb2xkQlNDb3VudC5wdXNoKHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKTtcbiAgICAgICAgb2xkVFNoaWZ0LnB1c2goc3RhdGUudFNoaWZ0W25leHRMaW5lXSk7XG4gICAgICAgIG9sZFNDb3VudC5wdXNoKHN0YXRlLnNDb3VudFtuZXh0TGluZV0pO1xuICAgICAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC09IHN0YXRlLmJsa0luZGVudDtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgb2xkQk1hcmtzLnB1c2goc3RhdGUuYk1hcmtzW25leHRMaW5lXSk7XG4gICAgb2xkQlNDb3VudC5wdXNoKHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKTtcbiAgICBvbGRUU2hpZnQucHVzaChzdGF0ZS50U2hpZnRbbmV4dExpbmVdKTtcbiAgICBvbGRTQ291bnQucHVzaChzdGF0ZS5zQ291bnRbbmV4dExpbmVdKTtcblxuICAgIC8vIEEgbmVnYXRpdmUgaW5kZW50YXRpb24gbWVhbnMgdGhhdCB0aGlzIGlzIGEgcGFyYWdyYXBoIGNvbnRpbnVhdGlvblxuICAgIC8vXG4gICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSA9IC0xO1xuICB9XG5cbiAgb2xkSW5kZW50ID0gc3RhdGUuYmxrSW5kZW50O1xuICBzdGF0ZS5ibGtJbmRlbnQgPSAwO1xuXG4gIHRva2VuICAgICAgICA9IHN0YXRlLnB1c2goJ2Jsb2NrcXVvdGVfb3BlbicsICdibG9ja3F1b3RlJywgMSk7XG4gIHRva2VuLm1hcmt1cCA9ICc+JztcbiAgdG9rZW4ubWFwICAgID0gbGluZXMgPSBbIHN0YXJ0TGluZSwgMCBdO1xuXG4gIHN0YXRlLm1kLmJsb2NrLnRva2VuaXplKHN0YXRlLCBzdGFydExpbmUsIG5leHRMaW5lKTtcblxuICB0b2tlbiAgICAgICAgPSBzdGF0ZS5wdXNoKCdibG9ja3F1b3RlX2Nsb3NlJywgJ2Jsb2NrcXVvdGUnLCAtMSk7XG4gIHRva2VuLm1hcmt1cCA9ICc+JztcblxuICBzdGF0ZS5saW5lTWF4ID0gb2xkTGluZU1heDtcbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG4gIGxpbmVzWzFdID0gc3RhdGUubGluZTtcblxuICAvLyBSZXN0b3JlIG9yaWdpbmFsIHRTaGlmdDsgdGhpcyBtaWdodCBub3QgYmUgbmVjZXNzYXJ5IHNpbmNlIHRoZSBwYXJzZXJcbiAgLy8gaGFzIGFscmVhZHkgYmVlbiBoZXJlLCBidXQganVzdCB0byBtYWtlIHN1cmUgd2UgY2FuIGRvIHRoYXQuXG4gIGZvciAoaSA9IDA7IGkgPCBvbGRUU2hpZnQubGVuZ3RoOyBpKyspIHtcbiAgICBzdGF0ZS5iTWFya3NbaSArIHN0YXJ0TGluZV0gPSBvbGRCTWFya3NbaV07XG4gICAgc3RhdGUudFNoaWZ0W2kgKyBzdGFydExpbmVdID0gb2xkVFNoaWZ0W2ldO1xuICAgIHN0YXRlLnNDb3VudFtpICsgc3RhcnRMaW5lXSA9IG9sZFNDb3VudFtpXTtcbiAgICBzdGF0ZS5ic0NvdW50W2kgKyBzdGFydExpbmVdID0gb2xkQlNDb3VudFtpXTtcbiAgfVxuICBzdGF0ZS5ibGtJbmRlbnQgPSBvbGRJbmRlbnQ7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gQ29kZSBibG9jayAoNCBzcGFjZXMgcGFkZGVkKVxuXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjb2RlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUvKiwgc2lsZW50Ki8pIHtcbiAgdmFyIG5leHRMaW5lLCBsYXN0LCB0b2tlbjtcblxuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPCA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxhc3QgPSBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDE7XG5cbiAgd2hpbGUgKG5leHRMaW5lIDwgZW5kTGluZSkge1xuICAgIGlmIChzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKSkge1xuICAgICAgbmV4dExpbmUrKztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHtcbiAgICAgIG5leHRMaW5lKys7XG4gICAgICBsYXN0ID0gbmV4dExpbmU7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgYnJlYWs7XG4gIH1cblxuICBzdGF0ZS5saW5lID0gbGFzdDtcblxuICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgnY29kZV9ibG9jaycsICdjb2RlJywgMCk7XG4gIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIGxhc3QsIDQgKyBzdGF0ZS5ibGtJbmRlbnQsIHRydWUpO1xuICB0b2tlbi5tYXAgICAgID0gWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgXTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBmZW5jZXMgKGBgYCBsYW5nLCB+fn4gbGFuZylcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZmVuY2Uoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIHZhciBtYXJrZXIsIGxlbiwgcGFyYW1zLCBuZXh0TGluZSwgbWVtLCB0b2tlbiwgbWFya3VwLFxuICAgICAgaGF2ZUVuZE1hcmtlciA9IGZhbHNlLFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChwb3MgKyAzID4gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgaWYgKG1hcmtlciAhPT0gMHg3RS8qIH4gKi8gJiYgbWFya2VyICE9PSAweDYwIC8qIGAgKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBzY2FuIG1hcmtlciBsZW5ndGhcbiAgbWVtID0gcG9zO1xuICBwb3MgPSBzdGF0ZS5za2lwQ2hhcnMocG9zLCBtYXJrZXIpO1xuXG4gIGxlbiA9IHBvcyAtIG1lbTtcblxuICBpZiAobGVuIDwgMykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBtYXJrdXAgPSBzdGF0ZS5zcmMuc2xpY2UobWVtLCBwb3MpO1xuICBwYXJhbXMgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpO1xuXG4gIGlmIChwYXJhbXMuaW5kZXhPZihTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcikpID49IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gU2luY2Ugc3RhcnQgaXMgZm91bmQsIHdlIGNhbiByZXBvcnQgc3VjY2VzcyBoZXJlIGluIHZhbGlkYXRpb24gbW9kZVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgLy8gc2VhcmNoIGVuZCBvZiBibG9ja1xuICBuZXh0TGluZSA9IHN0YXJ0TGluZTtcblxuICBmb3IgKDs7KSB7XG4gICAgbmV4dExpbmUrKztcbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkge1xuICAgICAgLy8gdW5jbG9zZWQgYmxvY2sgc2hvdWxkIGJlIGF1dG9jbG9zZWQgYnkgZW5kIG9mIGRvY3VtZW50LlxuICAgICAgLy8gYWxzbyBibG9jayBzZWVtcyB0byBiZSBhdXRvY2xvc2VkIGJ5IGVuZCBvZiBwYXJlbnRcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHBvcyA9IG1lbSA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV07XG5cbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIC8vIG5vbi1lbXB0eSBsaW5lIHdpdGggbmVnYXRpdmUgaW5kZW50IHNob3VsZCBzdG9wIHRoZSBsaXN0OlxuICAgICAgLy8gLSBgYGBcbiAgICAgIC8vICB0ZXN0XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gbWFya2VyKSB7IGNvbnRpbnVlOyB9XG5cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7XG4gICAgICAvLyBjbG9zaW5nIGZlbmNlIHNob3VsZCBiZSBpbmRlbnRlZCBsZXNzIHRoYW4gNCBzcGFjZXNcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcik7XG5cbiAgICAvLyBjbG9zaW5nIGNvZGUgZmVuY2UgbXVzdCBiZSBhdCBsZWFzdCBhcyBsb25nIGFzIHRoZSBvcGVuaW5nIG9uZVxuICAgIGlmIChwb3MgLSBtZW0gPCBsZW4pIHsgY29udGludWU7IH1cblxuICAgIC8vIG1ha2Ugc3VyZSB0YWlsIGhhcyBzcGFjZXMgb25seVxuICAgIHBvcyA9IHN0YXRlLnNraXBTcGFjZXMocG9zKTtcblxuICAgIGlmIChwb3MgPCBtYXgpIHsgY29udGludWU7IH1cblxuICAgIGhhdmVFbmRNYXJrZXIgPSB0cnVlO1xuICAgIC8vIGZvdW5kIVxuICAgIGJyZWFrO1xuICB9XG5cbiAgLy8gSWYgYSBmZW5jZSBoYXMgaGVhZGluZyBzcGFjZXMsIHRoZXkgc2hvdWxkIGJlIHJlbW92ZWQgZnJvbSBpdHMgaW5uZXIgYmxvY2tcbiAgbGVuID0gc3RhdGUuc0NvdW50W3N0YXJ0TGluZV07XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lICsgKGhhdmVFbmRNYXJrZXIgPyAxIDogMCk7XG5cbiAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ2ZlbmNlJywgJ2NvZGUnLCAwKTtcbiAgdG9rZW4uaW5mbyAgICA9IHBhcmFtcztcbiAgdG9rZW4uY29udGVudCA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSArIDEsIG5leHRMaW5lLCBsZW4sIHRydWUpO1xuICB0b2tlbi5tYXJrdXAgID0gbWFya3VwO1xuICB0b2tlbi5tYXAgICAgID0gWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgXTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBoZWFkaW5nICgjLCAjIywgLi4uKVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGhlYWRpbmcoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIHZhciBjaCwgbGV2ZWwsIHRtcCwgdG9rZW4sXG4gICAgICBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdLFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgY2ggID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICBpZiAoY2ggIT09IDB4MjMvKiAjICovIHx8IHBvcyA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gY291bnQgaGVhZGluZyBsZXZlbFxuICBsZXZlbCA9IDE7XG4gIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoKytwb3MpO1xuICB3aGlsZSAoY2ggPT09IDB4MjMvKiAjICovICYmIHBvcyA8IG1heCAmJiBsZXZlbCA8PSA2KSB7XG4gICAgbGV2ZWwrKztcbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KCsrcG9zKTtcbiAgfVxuXG4gIGlmIChsZXZlbCA+IDYgfHwgKHBvcyA8IG1heCAmJiAhaXNTcGFjZShjaCkpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWU7IH1cblxuICAvLyBMZXQncyBjdXQgdGFpbHMgbGlrZSAnICAgICMjIyAgJyBmcm9tIHRoZSBlbmQgb2Ygc3RyaW5nXG5cbiAgbWF4ID0gc3RhdGUuc2tpcFNwYWNlc0JhY2sobWF4LCBwb3MpO1xuICB0bXAgPSBzdGF0ZS5za2lwQ2hhcnNCYWNrKG1heCwgMHgyMywgcG9zKTsgLy8gI1xuICBpZiAodG1wID4gcG9zICYmIGlzU3BhY2Uoc3RhdGUuc3JjLmNoYXJDb2RlQXQodG1wIC0gMSkpKSB7XG4gICAgbWF4ID0gdG1wO1xuICB9XG5cbiAgc3RhdGUubGluZSA9IHN0YXJ0TGluZSArIDE7XG5cbiAgdG9rZW4gICAgICAgID0gc3RhdGUucHVzaCgnaGVhZGluZ19vcGVuJywgJ2gnICsgU3RyaW5nKGxldmVsKSwgMSk7XG4gIHRva2VuLm1hcmt1cCA9ICcjIyMjIyMjIycuc2xpY2UoMCwgbGV2ZWwpO1xuICB0b2tlbi5tYXAgICAgPSBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdO1xuXG4gIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApO1xuICB0b2tlbi5jb250ZW50ICA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCkudHJpbSgpO1xuICB0b2tlbi5tYXAgICAgICA9IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF07XG4gIHRva2VuLmNoaWxkcmVuID0gW107XG5cbiAgdG9rZW4gICAgICAgID0gc3RhdGUucHVzaCgnaGVhZGluZ19jbG9zZScsICdoJyArIFN0cmluZyhsZXZlbCksIC0xKTtcbiAgdG9rZW4ubWFya3VwID0gJyMjIyMjIyMjJy5zbGljZSgwLCBsZXZlbCk7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gSG9yaXpvbnRhbCBydWxlXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzU3BhY2UgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaHIoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIHZhciBtYXJrZXIsIGNudCwgY2gsIHRva2VuLFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcblxuICAvLyBDaGVjayBociBtYXJrZXJcbiAgaWYgKG1hcmtlciAhPT0gMHgyQS8qICogKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHgyRC8qIC0gKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHg1Ri8qIF8gKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBtYXJrZXJzIGNhbiBiZSBtaXhlZCB3aXRoIHNwYWNlcywgYnV0IHRoZXJlIHNob3VsZCBiZSBhdCBsZWFzdCAzIG9mIHRoZW1cblxuICBjbnQgPSAxO1xuICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKyk7XG4gICAgaWYgKGNoICE9PSBtYXJrZXIgJiYgIWlzU3BhY2UoY2gpKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIGlmIChjaCA9PT0gbWFya2VyKSB7IGNudCsrOyB9XG4gIH1cblxuICBpZiAoY250IDwgMykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgc3RhdGUubGluZSA9IHN0YXJ0TGluZSArIDE7XG5cbiAgdG9rZW4gICAgICAgID0gc3RhdGUucHVzaCgnaHInLCAnaHInLCAwKTtcbiAgdG9rZW4ubWFwICAgID0gWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgXTtcbiAgdG9rZW4ubWFya3VwID0gQXJyYXkoY250ICsgMSkuam9pbihTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcikpO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIEhUTUwgYmxvY2tcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBibG9ja19uYW1lcyA9IHJlcXVpcmUoJy4uL2NvbW1vbi9odG1sX2Jsb2NrcycpO1xudmFyIEhUTUxfT1BFTl9DTE9TRV9UQUdfUkUgPSByZXF1aXJlKCcuLi9jb21tb24vaHRtbF9yZScpLkhUTUxfT1BFTl9DTE9TRV9UQUdfUkU7XG5cbi8vIEFuIGFycmF5IG9mIG9wZW5pbmcgYW5kIGNvcnJlc3BvbmRpbmcgY2xvc2luZyBzZXF1ZW5jZXMgZm9yIGh0bWwgdGFncyxcbi8vIGxhc3QgYXJndW1lbnQgZGVmaW5lcyB3aGV0aGVyIGl0IGNhbiB0ZXJtaW5hdGUgYSBwYXJhZ3JhcGggb3Igbm90XG4vL1xudmFyIEhUTUxfU0VRVUVOQ0VTID0gW1xuICBbIC9ePChzY3JpcHR8cHJlfHN0eWxlKSg/PShcXHN8PnwkKSkvaSwgLzxcXC8oc2NyaXB0fHByZXxzdHlsZSk+L2ksIHRydWUgXSxcbiAgWyAvXjwhLS0vLCAgICAgICAgLy0tPi8sICAgdHJ1ZSBdLFxuICBbIC9ePFxcPy8sICAgICAgICAgL1xcPz4vLCAgIHRydWUgXSxcbiAgWyAvXjwhW0EtWl0vLCAgICAgLz4vLCAgICAgdHJ1ZSBdLFxuICBbIC9ePCFcXFtDREFUQVxcWy8sIC9cXF1cXF0+LywgdHJ1ZSBdLFxuICBbIG5ldyBSZWdFeHAoJ148Lz8oJyArIGJsb2NrX25hbWVzLmpvaW4oJ3wnKSArICcpKD89KFxcXFxzfC8/PnwkKSknLCAnaScpLCAvXiQvLCB0cnVlIF0sXG4gIFsgbmV3IFJlZ0V4cChIVE1MX09QRU5fQ0xPU0VfVEFHX1JFLnNvdXJjZSArICdcXFxccyokJyksICAvXiQvLCBmYWxzZSBdXG5dO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaHRtbF9ibG9jayhzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIGksIG5leHRMaW5lLCB0b2tlbiwgbGluZVRleHQsXG4gICAgICBwb3MgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdLFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLmh0bWwpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MvKiA8ICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxpbmVUZXh0ID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4KTtcblxuICBmb3IgKGkgPSAwOyBpIDwgSFRNTF9TRVFVRU5DRVMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoSFRNTF9TRVFVRU5DRVNbaV1bMF0udGVzdChsaW5lVGV4dCkpIHsgYnJlYWs7IH1cbiAgfVxuXG4gIGlmIChpID09PSBIVE1MX1NFUVVFTkNFUy5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKHNpbGVudCkge1xuICAgIC8vIHRydWUgaWYgdGhpcyBzZXF1ZW5jZSBjYW4gYmUgYSB0ZXJtaW5hdG9yLCBmYWxzZSBvdGhlcndpc2VcbiAgICByZXR1cm4gSFRNTF9TRVFVRU5DRVNbaV1bMl07XG4gIH1cblxuICBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDE7XG5cbiAgLy8gSWYgd2UgYXJlIGhlcmUgLSB3ZSBkZXRlY3RlZCBIVE1MIGJsb2NrLlxuICAvLyBMZXQncyByb2xsIGRvd24gdGlsbCBibG9jayBlbmQuXG4gIGlmICghSFRNTF9TRVFVRU5DRVNbaV1bMV0udGVzdChsaW5lVGV4dCkpIHtcbiAgICBmb3IgKDsgbmV4dExpbmUgPCBlbmRMaW5lOyBuZXh0TGluZSsrKSB7XG4gICAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgeyBicmVhazsgfVxuXG4gICAgICBwb3MgPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXTtcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV07XG4gICAgICBsaW5lVGV4dCA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCk7XG5cbiAgICAgIGlmIChIVE1MX1NFUVVFTkNFU1tpXVsxXS50ZXN0KGxpbmVUZXh0KSkge1xuICAgICAgICBpZiAobGluZVRleHQubGVuZ3RoICE9PSAwKSB7IG5leHRMaW5lKys7IH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lO1xuXG4gIHRva2VuICAgICAgICAgPSBzdGF0ZS5wdXNoKCdodG1sX2Jsb2NrJywgJycsIDApO1xuICB0b2tlbi5tYXAgICAgID0gWyBzdGFydExpbmUsIG5leHRMaW5lIF07XG4gIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIG5leHRMaW5lLCBzdGF0ZS5ibGtJbmRlbnQsIHRydWUpO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIGxoZWFkaW5nICgtLS0sID09PSlcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGhlYWRpbmcoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZS8qLCBzaWxlbnQqLykge1xuICB2YXIgY29udGVudCwgdGVybWluYXRlLCBpLCBsLCB0b2tlbiwgcG9zLCBtYXgsIGxldmVsLCBtYXJrZXIsXG4gICAgICBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDEsIG9sZFBhcmVudFR5cGUsXG4gICAgICB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygncGFyYWdyYXBoJyk7XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSAncGFyYWdyYXBoJzsgLy8gdXNlIHBhcmFncmFwaCB0byBtYXRjaCB0ZXJtaW5hdG9yUnVsZXNcblxuICAvLyBqdW1wIGxpbmUtYnktbGluZSB1bnRpbCBlbXB0eSBvbmUgb3IgRU9GXG4gIGZvciAoOyBuZXh0TGluZSA8IGVuZExpbmUgJiYgIXN0YXRlLmlzRW1wdHkobmV4dExpbmUpOyBuZXh0TGluZSsrKSB7XG4gICAgLy8gdGhpcyB3b3VsZCBiZSBhIGNvZGUgYmxvY2sgbm9ybWFsbHksIGJ1dCBhZnRlciBwYXJhZ3JhcGhcbiAgICAvLyBpdCdzIGNvbnNpZGVyZWQgYSBsYXp5IGNvbnRpbnVhdGlvbiByZWdhcmRsZXNzIG9mIHdoYXQncyB0aGVyZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID4gMykgeyBjb250aW51ZTsgfVxuXG4gICAgLy9cbiAgICAvLyBDaGVjayBmb3IgdW5kZXJsaW5lIGluIHNldGV4dCBoZWFkZXJcbiAgICAvL1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdID49IHN0YXRlLmJsa0luZGVudCkge1xuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdO1xuXG4gICAgICBpZiAocG9zIDwgbWF4KSB7XG4gICAgICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgICAgICAgaWYgKG1hcmtlciA9PT0gMHgyRC8qIC0gKi8gfHwgbWFya2VyID09PSAweDNELyogPSAqLykge1xuICAgICAgICAgIHBvcyA9IHN0YXRlLnNraXBDaGFycyhwb3MsIG1hcmtlcik7XG4gICAgICAgICAgcG9zID0gc3RhdGUuc2tpcFNwYWNlcyhwb3MpO1xuXG4gICAgICAgICAgaWYgKHBvcyA+PSBtYXgpIHtcbiAgICAgICAgICAgIGxldmVsID0gKG1hcmtlciA9PT0gMHgzRC8qID0gKi8gPyAxIDogMik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBxdWlyayBmb3IgYmxvY2txdW90ZXMsIHRoaXMgbGluZSBzaG91bGQgYWxyZWFkeSBiZSBjaGVja2VkIGJ5IHRoYXQgcnVsZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgMCkgeyBjb250aW51ZTsgfVxuXG4gICAgLy8gU29tZSB0YWdzIGNhbiB0ZXJtaW5hdGUgcGFyYWdyYXBoIHdpdGhvdXQgZW1wdHkgbGluZS5cbiAgICB0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7IGJyZWFrOyB9XG4gIH1cblxuICBpZiAoIWxldmVsKSB7XG4gICAgLy8gRGlkbid0IGZpbmQgdmFsaWQgdW5kZXJsaW5lXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgY29udGVudCA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbmV4dExpbmUsIHN0YXRlLmJsa0luZGVudCwgZmFsc2UpLnRyaW0oKTtcblxuICBzdGF0ZS5saW5lID0gbmV4dExpbmUgKyAxO1xuXG4gIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgnaGVhZGluZ19vcGVuJywgJ2gnICsgU3RyaW5nKGxldmVsKSwgMSk7XG4gIHRva2VuLm1hcmt1cCAgID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpO1xuICB0b2tlbi5tYXAgICAgICA9IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF07XG5cbiAgdG9rZW4gICAgICAgICAgPSBzdGF0ZS5wdXNoKCdpbmxpbmUnLCAnJywgMCk7XG4gIHRva2VuLmNvbnRlbnQgID0gY29udGVudDtcbiAgdG9rZW4ubWFwICAgICAgPSBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSAtIDEgXTtcbiAgdG9rZW4uY2hpbGRyZW4gPSBbXTtcblxuICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ2hlYWRpbmdfY2xvc2UnLCAnaCcgKyBTdHJpbmcobGV2ZWwpLCAtMSk7XG4gIHRva2VuLm1hcmt1cCAgID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpO1xuXG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIExpc3RzXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzU3BhY2UgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG5cbi8vIFNlYXJjaCBgWy0rKl1bXFxuIF1gLCByZXR1cm5zIG5leHQgcG9zIGFmdGVyIG1hcmtlciBvbiBzdWNjZXNzXG4vLyBvciAtMSBvbiBmYWlsLlxuZnVuY3Rpb24gc2tpcEJ1bGxldExpc3RNYXJrZXIoc3RhdGUsIHN0YXJ0TGluZSkge1xuICB2YXIgbWFya2VyLCBwb3MsIG1heCwgY2g7XG5cbiAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXTtcbiAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuICAvLyBDaGVjayBidWxsZXRcbiAgaWYgKG1hcmtlciAhPT0gMHgyQS8qICogKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHgyRC8qIC0gKi8gJiZcbiAgICAgIG1hcmtlciAhPT0gMHgyQi8qICsgKi8pIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cblxuICBpZiAocG9zIDwgbWF4KSB7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gICAgaWYgKCFpc1NwYWNlKGNoKSkge1xuICAgICAgLy8gXCIgLXRlc3QgXCIgLSBpcyBub3QgYSBsaXN0IGl0ZW1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcG9zO1xufVxuXG4vLyBTZWFyY2ggYFxcZCtbLildW1xcbiBdYCwgcmV0dXJucyBuZXh0IHBvcyBhZnRlciBtYXJrZXIgb24gc3VjY2Vzc1xuLy8gb3IgLTEgb24gZmFpbC5cbmZ1bmN0aW9uIHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgc3RhcnRMaW5lKSB7XG4gIHZhciBjaCxcbiAgICAgIHN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIHBvcyA9IHN0YXJ0LFxuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV07XG5cbiAgLy8gTGlzdCBtYXJrZXIgc2hvdWxkIGhhdmUgYXQgbGVhc3QgMiBjaGFycyAoZGlnaXQgKyBkb3QpXG4gIGlmIChwb3MgKyAxID49IG1heCkgeyByZXR1cm4gLTE7IH1cblxuICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcblxuICBpZiAoY2ggPCAweDMwLyogMCAqLyB8fCBjaCA+IDB4MzkvKiA5ICovKSB7IHJldHVybiAtMTsgfVxuXG4gIGZvciAoOzspIHtcbiAgICAvLyBFT0wgLT4gZmFpbFxuICAgIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiAtMTsgfVxuXG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKyk7XG5cbiAgICBpZiAoY2ggPj0gMHgzMC8qIDAgKi8gJiYgY2ggPD0gMHgzOS8qIDkgKi8pIHtcblxuICAgICAgLy8gTGlzdCBtYXJrZXIgc2hvdWxkIGhhdmUgbm8gbW9yZSB0aGFuIDkgZGlnaXRzXG4gICAgICAvLyAocHJldmVudHMgaW50ZWdlciBvdmVyZmxvdyBpbiBicm93c2VycylcbiAgICAgIGlmIChwb3MgLSBzdGFydCA+PSAxMCkgeyByZXR1cm4gLTE7IH1cblxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gZm91bmQgdmFsaWQgbWFya2VyXG4gICAgaWYgKGNoID09PSAweDI5LyogKSAqLyB8fCBjaCA9PT0gMHgyZS8qIC4gKi8pIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiAtMTtcbiAgfVxuXG5cbiAgaWYgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmICghaXNTcGFjZShjaCkpIHtcbiAgICAgIC8vIFwiIDEudGVzdCBcIiAtIGlzIG5vdCBhIGxpc3QgaXRlbVxuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcG9zO1xufVxuXG5mdW5jdGlvbiBtYXJrVGlnaHRQYXJhZ3JhcGhzKHN0YXRlLCBpZHgpIHtcbiAgdmFyIGksIGwsXG4gICAgICBsZXZlbCA9IHN0YXRlLmxldmVsICsgMjtcblxuICBmb3IgKGkgPSBpZHggKyAyLCBsID0gc3RhdGUudG9rZW5zLmxlbmd0aCAtIDI7IGkgPCBsOyBpKyspIHtcbiAgICBpZiAoc3RhdGUudG9rZW5zW2ldLmxldmVsID09PSBsZXZlbCAmJiBzdGF0ZS50b2tlbnNbaV0udHlwZSA9PT0gJ3BhcmFncmFwaF9vcGVuJykge1xuICAgICAgc3RhdGUudG9rZW5zW2kgKyAyXS5oaWRkZW4gPSB0cnVlO1xuICAgICAgc3RhdGUudG9rZW5zW2ldLmhpZGRlbiA9IHRydWU7XG4gICAgICBpICs9IDI7XG4gICAgfVxuICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsaXN0KHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgY2gsXG4gICAgICBjb250ZW50U3RhcnQsXG4gICAgICBpLFxuICAgICAgaW5kZW50LFxuICAgICAgaW5kZW50QWZ0ZXJNYXJrZXIsXG4gICAgICBpbml0aWFsLFxuICAgICAgaXNPcmRlcmVkLFxuICAgICAgaXRlbUxpbmVzLFxuICAgICAgbCxcbiAgICAgIGxpc3RMaW5lcyxcbiAgICAgIGxpc3RUb2tJZHgsXG4gICAgICBtYXJrZXJDaGFyQ29kZSxcbiAgICAgIG1hcmtlclZhbHVlLFxuICAgICAgbWF4LFxuICAgICAgbmV4dExpbmUsXG4gICAgICBvZmZzZXQsXG4gICAgICBvbGRJbmRlbnQsXG4gICAgICBvbGRMSW5kZW50LFxuICAgICAgb2xkUGFyZW50VHlwZSxcbiAgICAgIG9sZFRTaGlmdCxcbiAgICAgIG9sZFRpZ2h0LFxuICAgICAgcG9zLFxuICAgICAgcG9zQWZ0ZXJNYXJrZXIsXG4gICAgICBwcmV2RW1wdHlFbmQsXG4gICAgICBzdGFydCxcbiAgICAgIHRlcm1pbmF0ZSxcbiAgICAgIHRlcm1pbmF0b3JSdWxlcyxcbiAgICAgIHRva2VuLFxuICAgICAgaXNUZXJtaW5hdGluZ1BhcmFncmFwaCA9IGZhbHNlLFxuICAgICAgdGlnaHQgPSB0cnVlO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIGxpbWl0IGNvbmRpdGlvbnMgd2hlbiBsaXN0IGNhbiBpbnRlcnJ1cHRcbiAgLy8gYSBwYXJhZ3JhcGggKHZhbGlkYXRpb24gbW9kZSBvbmx5KVxuICBpZiAoc2lsZW50ICYmIHN0YXRlLnBhcmVudFR5cGUgPT09ICdwYXJhZ3JhcGgnKSB7XG4gICAgLy8gTmV4dCBsaXN0IGl0ZW0gc2hvdWxkIHN0aWxsIHRlcm1pbmF0ZSBwcmV2aW91cyBsaXN0IGl0ZW07XG4gICAgLy9cbiAgICAvLyBUaGlzIGNvZGUgY2FuIGZhaWwgaWYgcGx1Z2lucyB1c2UgYmxrSW5kZW50IGFzIHdlbGwgYXMgbGlzdHMsXG4gICAgLy8gYnV0IEkgaG9wZSB0aGUgc3BlYyBnZXRzIGZpeGVkIGxvbmcgYmVmb3JlIHRoYXQgaGFwcGVucy5cbiAgICAvL1xuICAgIGlmIChzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSA+PSBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIGlzVGVybWluYXRpbmdQYXJhZ3JhcGggPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIC8vIERldGVjdCBsaXN0IHR5cGUgYW5kIHBvc2l0aW9uIGFmdGVyIG1hcmtlclxuICBpZiAoKHBvc0FmdGVyTWFya2VyID0gc2tpcE9yZGVyZWRMaXN0TWFya2VyKHN0YXRlLCBzdGFydExpbmUpKSA+PSAwKSB7XG4gICAgaXNPcmRlcmVkID0gdHJ1ZTtcbiAgICBzdGFydCA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV07XG4gICAgbWFya2VyVmFsdWUgPSBOdW1iZXIoc3RhdGUuc3JjLnN1YnN0cihzdGFydCwgcG9zQWZ0ZXJNYXJrZXIgLSBzdGFydCAtIDEpKTtcblxuICAgIC8vIElmIHdlJ3JlIHN0YXJ0aW5nIGEgbmV3IG9yZGVyZWQgbGlzdCByaWdodCBhZnRlclxuICAgIC8vIGEgcGFyYWdyYXBoLCBpdCBzaG91bGQgc3RhcnQgd2l0aCAxLlxuICAgIGlmIChpc1Rlcm1pbmF0aW5nUGFyYWdyYXBoICYmIG1hcmtlclZhbHVlICE9PSAxKSByZXR1cm4gZmFsc2U7XG5cbiAgfSBlbHNlIGlmICgocG9zQWZ0ZXJNYXJrZXIgPSBza2lwQnVsbGV0TGlzdE1hcmtlcihzdGF0ZSwgc3RhcnRMaW5lKSkgPj0gMCkge1xuICAgIGlzT3JkZXJlZCA9IGZhbHNlO1xuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gSWYgd2UncmUgc3RhcnRpbmcgYSBuZXcgdW5vcmRlcmVkIGxpc3QgcmlnaHQgYWZ0ZXJcbiAgLy8gYSBwYXJhZ3JhcGgsIGZpcnN0IGxpbmUgc2hvdWxkIG5vdCBiZSBlbXB0eS5cbiAgaWYgKGlzVGVybWluYXRpbmdQYXJhZ3JhcGgpIHtcbiAgICBpZiAoc3RhdGUuc2tpcFNwYWNlcyhwb3NBZnRlck1hcmtlcikgPj0gc3RhdGUuZU1hcmtzW3N0YXJ0TGluZV0pIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFdlIHNob3VsZCB0ZXJtaW5hdGUgbGlzdCBvbiBzdHlsZSBjaGFuZ2UuIFJlbWVtYmVyIGZpcnN0IG9uZSB0byBjb21wYXJlLlxuICBtYXJrZXJDaGFyQ29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvc0FmdGVyTWFya2VyIC0gMSk7XG5cbiAgLy8gRm9yIHZhbGlkYXRpb24gbW9kZSB3ZSBjYW4gdGVybWluYXRlIGltbWVkaWF0ZWx5XG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWU7IH1cblxuICAvLyBTdGFydCBsaXN0XG4gIGxpc3RUb2tJZHggPSBzdGF0ZS50b2tlbnMubGVuZ3RoO1xuXG4gIGlmIChpc09yZGVyZWQpIHtcbiAgICB0b2tlbiAgICAgICA9IHN0YXRlLnB1c2goJ29yZGVyZWRfbGlzdF9vcGVuJywgJ29sJywgMSk7XG4gICAgaWYgKG1hcmtlclZhbHVlICE9PSAxKSB7XG4gICAgICB0b2tlbi5hdHRycyA9IFsgWyAnc3RhcnQnLCBtYXJrZXJWYWx1ZSBdIF07XG4gICAgfVxuXG4gIH0gZWxzZSB7XG4gICAgdG9rZW4gICAgICAgPSBzdGF0ZS5wdXNoKCdidWxsZXRfbGlzdF9vcGVuJywgJ3VsJywgMSk7XG4gIH1cblxuICB0b2tlbi5tYXAgICAgPSBsaXN0TGluZXMgPSBbIHN0YXJ0TGluZSwgMCBdO1xuICB0b2tlbi5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlckNoYXJDb2RlKTtcblxuICAvL1xuICAvLyBJdGVyYXRlIGxpc3QgaXRlbXNcbiAgLy9cblxuICBuZXh0TGluZSA9IHN0YXJ0TGluZTtcbiAgcHJldkVtcHR5RW5kID0gZmFsc2U7XG4gIHRlcm1pbmF0b3JSdWxlcyA9IHN0YXRlLm1kLmJsb2NrLnJ1bGVyLmdldFJ1bGVzKCdsaXN0Jyk7XG5cbiAgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSAnbGlzdCc7XG5cbiAgd2hpbGUgKG5leHRMaW5lIDwgZW5kTGluZSkge1xuICAgIHBvcyA9IHBvc0FmdGVyTWFya2VyO1xuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV07XG5cbiAgICBpbml0aWFsID0gb2Zmc2V0ID0gc3RhdGUuc0NvdW50W25leHRMaW5lXSArIHBvc0FmdGVyTWFya2VyIC0gKHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0pO1xuXG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gICAgICBpZiAoY2ggPT09IDB4MDkpIHtcbiAgICAgICAgb2Zmc2V0ICs9IDQgLSAob2Zmc2V0ICsgc3RhdGUuYnNDb3VudFtuZXh0TGluZV0pICUgNDtcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MjApIHtcbiAgICAgICAgb2Zmc2V0Kys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcG9zKys7XG4gICAgfVxuXG4gICAgY29udGVudFN0YXJ0ID0gcG9zO1xuXG4gICAgaWYgKGNvbnRlbnRTdGFydCA+PSBtYXgpIHtcbiAgICAgIC8vIHRyaW1taW5nIHNwYWNlIGluIFwiLSAgICBcXG4gIDNcIiBjYXNlLCBpbmRlbnQgaXMgMSBoZXJlXG4gICAgICBpbmRlbnRBZnRlck1hcmtlciA9IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluZGVudEFmdGVyTWFya2VyID0gb2Zmc2V0IC0gaW5pdGlhbDtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoYXZlIG1vcmUgdGhhbiA0IHNwYWNlcywgdGhlIGluZGVudCBpcyAxXG4gICAgLy8gKHRoZSByZXN0IGlzIGp1c3QgaW5kZW50ZWQgY29kZSBibG9jaylcbiAgICBpZiAoaW5kZW50QWZ0ZXJNYXJrZXIgPiA0KSB7IGluZGVudEFmdGVyTWFya2VyID0gMTsgfVxuXG4gICAgLy8gXCIgIC0gIHRlc3RcIlxuICAgIC8vICBeXl5eXiAtIGNhbGN1bGF0aW5nIHRvdGFsIGxlbmd0aCBvZiB0aGlzIHRoaW5nXG4gICAgaW5kZW50ID0gaW5pdGlhbCArIGluZGVudEFmdGVyTWFya2VyO1xuXG4gICAgLy8gUnVuIHN1YnBhcnNlciAmIHdyaXRlIHRva2Vuc1xuICAgIHRva2VuICAgICAgICA9IHN0YXRlLnB1c2goJ2xpc3RfaXRlbV9vcGVuJywgJ2xpJywgMSk7XG4gICAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSk7XG4gICAgdG9rZW4ubWFwICAgID0gaXRlbUxpbmVzID0gWyBzdGFydExpbmUsIDAgXTtcblxuICAgIG9sZEluZGVudCA9IHN0YXRlLmJsa0luZGVudDtcbiAgICBvbGRUaWdodCA9IHN0YXRlLnRpZ2h0O1xuICAgIG9sZFRTaGlmdCA9IHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuICAgIG9sZExJbmRlbnQgPSBzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXTtcbiAgICBzdGF0ZS5ibGtJbmRlbnQgPSBpbmRlbnQ7XG4gICAgc3RhdGUudGlnaHQgPSB0cnVlO1xuICAgIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdID0gY29udGVudFN0YXJ0IC0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV07XG4gICAgc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gPSBvZmZzZXQ7XG5cbiAgICBpZiAoY29udGVudFN0YXJ0ID49IG1heCAmJiBzdGF0ZS5pc0VtcHR5KHN0YXJ0TGluZSArIDEpKSB7XG4gICAgICAvLyB3b3JrYXJvdW5kIGZvciB0aGlzIGNhc2VcbiAgICAgIC8vIChsaXN0IGl0ZW0gaXMgZW1wdHksIGxpc3QgdGVybWluYXRlcyBiZWZvcmUgXCJmb29cIik6XG4gICAgICAvLyB+fn5+fn5+flxuICAgICAgLy8gICAtXG4gICAgICAvL1xuICAgICAgLy8gICAgIGZvb1xuICAgICAgLy8gfn5+fn5+fn5cbiAgICAgIHN0YXRlLmxpbmUgPSBNYXRoLm1pbihzdGF0ZS5saW5lICsgMiwgZW5kTGluZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLm1kLmJsb2NrLnRva2VuaXplKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHRydWUpO1xuICAgIH1cblxuICAgIC8vIElmIGFueSBvZiBsaXN0IGl0ZW0gaXMgdGlnaHQsIG1hcmsgbGlzdCBhcyB0aWdodFxuICAgIGlmICghc3RhdGUudGlnaHQgfHwgcHJldkVtcHR5RW5kKSB7XG4gICAgICB0aWdodCA9IGZhbHNlO1xuICAgIH1cbiAgICAvLyBJdGVtIGJlY29tZSBsb29zZSBpZiBmaW5pc2ggd2l0aCBlbXB0eSBsaW5lLFxuICAgIC8vIGJ1dCB3ZSBzaG91bGQgZmlsdGVyIGxhc3QgZWxlbWVudCwgYmVjYXVzZSBpdCBtZWFucyBsaXN0IGZpbmlzaFxuICAgIHByZXZFbXB0eUVuZCA9IChzdGF0ZS5saW5lIC0gc3RhcnRMaW5lKSA+IDEgJiYgc3RhdGUuaXNFbXB0eShzdGF0ZS5saW5lIC0gMSk7XG5cbiAgICBzdGF0ZS5ibGtJbmRlbnQgPSBvbGRJbmRlbnQ7XG4gICAgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0gPSBvbGRUU2hpZnQ7XG4gICAgc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gPSBvbGRMSW5kZW50O1xuICAgIHN0YXRlLnRpZ2h0ID0gb2xkVGlnaHQ7XG5cbiAgICB0b2tlbiAgICAgICAgPSBzdGF0ZS5wdXNoKCdsaXN0X2l0ZW1fY2xvc2UnLCAnbGknLCAtMSk7XG4gICAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSk7XG5cbiAgICBuZXh0TGluZSA9IHN0YXJ0TGluZSA9IHN0YXRlLmxpbmU7XG4gICAgaXRlbUxpbmVzWzFdID0gbmV4dExpbmU7XG4gICAgY29udGVudFN0YXJ0ID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV07XG5cbiAgICBpZiAobmV4dExpbmUgPj0gZW5kTGluZSkgeyBicmVhazsgfVxuXG4gICAgLy9cbiAgICAvLyBUcnkgdG8gY2hlY2sgaWYgbGlzdCBpcyB0ZXJtaW5hdGVkIG9yIGNvbnRpbnVlZC5cbiAgICAvL1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IGJyZWFrOyB9XG5cbiAgICAvLyBmYWlsIGlmIHRlcm1pbmF0aW5nIGJsb2NrIGZvdW5kXG4gICAgdGVybWluYXRlID0gZmFsc2U7XG4gICAgZm9yIChpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhazsgfVxuXG4gICAgLy8gZmFpbCBpZiBsaXN0IGhhcyBhbm90aGVyIHR5cGVcbiAgICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgICBwb3NBZnRlck1hcmtlciA9IHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpO1xuICAgICAgaWYgKHBvc0FmdGVyTWFya2VyIDwgMCkgeyBicmVhazsgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwb3NBZnRlck1hcmtlciA9IHNraXBCdWxsZXRMaXN0TWFya2VyKHN0YXRlLCBuZXh0TGluZSk7XG4gICAgICBpZiAocG9zQWZ0ZXJNYXJrZXIgPCAwKSB7IGJyZWFrOyB9XG4gICAgfVxuXG4gICAgaWYgKG1hcmtlckNoYXJDb2RlICE9PSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3NBZnRlck1hcmtlciAtIDEpKSB7IGJyZWFrOyB9XG4gIH1cblxuICAvLyBGaW5hbGl6ZSBsaXN0XG4gIGlmIChpc09yZGVyZWQpIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ29yZGVyZWRfbGlzdF9jbG9zZScsICdvbCcsIC0xKTtcbiAgfSBlbHNlIHtcbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ2J1bGxldF9saXN0X2Nsb3NlJywgJ3VsJywgLTEpO1xuICB9XG4gIHRva2VuLm1hcmt1cCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyQ2hhckNvZGUpO1xuXG4gIGxpc3RMaW5lc1sxXSA9IG5leHRMaW5lO1xuICBzdGF0ZS5saW5lID0gbmV4dExpbmU7XG5cbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG5cbiAgLy8gbWFyayBwYXJhZ3JhcGhzIHRpZ2h0IGlmIG5lZWRlZFxuICBpZiAodGlnaHQpIHtcbiAgICBtYXJrVGlnaHRQYXJhZ3JhcGhzKHN0YXRlLCBsaXN0VG9rSWR4KTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFBhcmFncmFwaFxuXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJhZ3JhcGgoc3RhdGUsIHN0YXJ0TGluZS8qLCBlbmRMaW5lKi8pIHtcbiAgdmFyIGNvbnRlbnQsIHRlcm1pbmF0ZSwgaSwgbCwgdG9rZW4sIG9sZFBhcmVudFR5cGUsXG4gICAgICBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDEsXG4gICAgICB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygncGFyYWdyYXBoJyksXG4gICAgICBlbmRMaW5lID0gc3RhdGUubGluZU1heDtcblxuICBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZTtcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdwYXJhZ3JhcGgnO1xuXG4gIC8vIGp1bXAgbGluZS1ieS1saW5lIHVudGlsIGVtcHR5IG9uZSBvciBFT0ZcbiAgZm9yICg7IG5leHRMaW5lIDwgZW5kTGluZSAmJiAhc3RhdGUuaXNFbXB0eShuZXh0TGluZSk7IG5leHRMaW5lKyspIHtcbiAgICAvLyB0aGlzIHdvdWxkIGJlIGEgY29kZSBibG9jayBub3JtYWxseSwgYnV0IGFmdGVyIHBhcmFncmFwaFxuICAgIC8vIGl0J3MgY29uc2lkZXJlZCBhIGxhenkgY29udGludWF0aW9uIHJlZ2FyZGxlc3Mgb2Ygd2hhdCdzIHRoZXJlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPiAzKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAvLyBxdWlyayBmb3IgYmxvY2txdW90ZXMsIHRoaXMgbGluZSBzaG91bGQgYWxyZWFkeSBiZSBjaGVja2VkIGJ5IHRoYXQgcnVsZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgMCkgeyBjb250aW51ZTsgfVxuXG4gICAgLy8gU29tZSB0YWdzIGNhbiB0ZXJtaW5hdGUgcGFyYWdyYXBoIHdpdGhvdXQgZW1wdHkgbGluZS5cbiAgICB0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7IGJyZWFrOyB9XG4gIH1cblxuICBjb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBuZXh0TGluZSwgc3RhdGUuYmxrSW5kZW50LCBmYWxzZSkudHJpbSgpO1xuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZTtcblxuICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ3BhcmFncmFwaF9vcGVuJywgJ3AnLCAxKTtcbiAgdG9rZW4ubWFwICAgICAgPSBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdO1xuXG4gIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApO1xuICB0b2tlbi5jb250ZW50ICA9IGNvbnRlbnQ7XG4gIHRva2VuLm1hcCAgICAgID0gWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgXTtcbiAgdG9rZW4uY2hpbGRyZW4gPSBbXTtcblxuICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ3BhcmFncmFwaF9jbG9zZScsICdwJywgLTEpO1xuXG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgbm9ybWFsaXplUmVmZXJlbmNlICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5ub3JtYWxpemVSZWZlcmVuY2U7XG52YXIgaXNTcGFjZSAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVmZXJlbmNlKHN0YXRlLCBzdGFydExpbmUsIF9lbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIGNoLFxuICAgICAgZGVzdEVuZFBvcyxcbiAgICAgIGRlc3RFbmRMaW5lTm8sXG4gICAgICBlbmRMaW5lLFxuICAgICAgaHJlZixcbiAgICAgIGksXG4gICAgICBsLFxuICAgICAgbGFiZWwsXG4gICAgICBsYWJlbEVuZCxcbiAgICAgIG9sZFBhcmVudFR5cGUsXG4gICAgICByZXMsXG4gICAgICBzdGFydCxcbiAgICAgIHN0cixcbiAgICAgIHRlcm1pbmF0ZSxcbiAgICAgIHRlcm1pbmF0b3JSdWxlcyxcbiAgICAgIHRpdGxlLFxuICAgICAgbGluZXMgPSAwLFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdLFxuICAgICAgbmV4dExpbmUgPSBzdGFydExpbmUgKyAxO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICAvLyBTaW1wbGUgY2hlY2sgdG8gcXVpY2tseSBpbnRlcnJ1cHQgc2NhbiBvbiBbbGlua10odXJsKSBhdCB0aGUgc3RhcnQgb2YgbGluZS5cbiAgLy8gQ2FuIGJlIHVzZWZ1bCBvbiBwcmFjdGljZTogaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2lzc3Vlcy81NFxuICB3aGlsZSAoKytwb3MgPCBtYXgpIHtcbiAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg1RCAvKiBdICovICYmXG4gICAgICAgIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyAtIDEpICE9PSAweDVDLyogXFwgKi8pIHtcbiAgICAgIGlmIChwb3MgKyAxID09PSBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSkgIT09IDB4M0EvKiA6ICovKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZW5kTGluZSA9IHN0YXRlLmxpbmVNYXg7XG5cbiAgLy8ganVtcCBsaW5lLWJ5LWxpbmUgdW50aWwgZW1wdHkgb25lIG9yIEVPRlxuICB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygncmVmZXJlbmNlJyk7XG5cbiAgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSAncmVmZXJlbmNlJztcblxuICBmb3IgKDsgbmV4dExpbmUgPCBlbmRMaW5lICYmICFzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKTsgbmV4dExpbmUrKykge1xuICAgIC8vIHRoaXMgd291bGQgYmUgYSBjb2RlIGJsb2NrIG5vcm1hbGx5LCBidXQgYWZ0ZXIgcGFyYWdyYXBoXG4gICAgLy8gaXQncyBjb25zaWRlcmVkIGEgbGF6eSBjb250aW51YXRpb24gcmVnYXJkbGVzcyBvZiB3aGF0J3MgdGhlcmVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+IDMpIHsgY29udGludWU7IH1cblxuICAgIC8vIHF1aXJrIGZvciBibG9ja3F1b3RlcywgdGhpcyBsaW5lIHNob3VsZCBhbHJlYWR5IGJlIGNoZWNrZWQgYnkgdGhhdCBydWxlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCAwKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAvLyBTb21lIHRhZ3MgY2FuIHRlcm1pbmF0ZSBwYXJhZ3JhcGggd2l0aG91dCBlbXB0eSBsaW5lLlxuICAgIHRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIGZvciAoaSA9IDAsIGwgPSB0ZXJtaW5hdG9yUnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGVybWluYXRvclJ1bGVzW2ldKHN0YXRlLCBuZXh0TGluZSwgZW5kTGluZSwgdHJ1ZSkpIHtcbiAgICAgICAgdGVybWluYXRlID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0ZXJtaW5hdGUpIHsgYnJlYWs7IH1cbiAgfVxuXG4gIHN0ciA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbmV4dExpbmUsIHN0YXRlLmJsa0luZGVudCwgZmFsc2UpLnRyaW0oKTtcbiAgbWF4ID0gc3RyLmxlbmd0aDtcblxuICBmb3IgKHBvcyA9IDE7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgaWYgKGNoID09PSAweDVCIC8qIFsgKi8pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2UgaWYgKGNoID09PSAweDVEIC8qIF0gKi8pIHtcbiAgICAgIGxhYmVsRW5kID0gcG9zO1xuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHgwQSAvKiBcXG4gKi8pIHtcbiAgICAgIGxpbmVzKys7XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHg1QyAvKiBcXCAqLykge1xuICAgICAgcG9zKys7XG4gICAgICBpZiAocG9zIDwgbWF4ICYmIHN0ci5jaGFyQ29kZUF0KHBvcykgPT09IDB4MEEpIHtcbiAgICAgICAgbGluZXMrKztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAobGFiZWxFbmQgPCAwIHx8IHN0ci5jaGFyQ29kZUF0KGxhYmVsRW5kICsgMSkgIT09IDB4M0EvKiA6ICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgXl5eIHNraXAgb3B0aW9uYWwgd2hpdGVzcGFjZSBoZXJlXG4gIGZvciAocG9zID0gbGFiZWxFbmQgKyAyOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuICAgIGlmIChjaCA9PT0gMHgwQSkge1xuICAgICAgbGluZXMrKztcbiAgICB9IGVsc2UgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAvKmVzbGludCBuby1lbXB0eTowKi9cbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy8gW2xhYmVsXTogICBkZXN0aW5hdGlvbiAgICd0aXRsZSdcbiAgLy8gICAgICAgICAgICBeXl5eXl5eXl5eXiBwYXJzZSB0aGlzXG4gIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rRGVzdGluYXRpb24oc3RyLCBwb3MsIG1heCk7XG4gIGlmICghcmVzLm9rKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGhyZWYgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHJlcy5zdHIpO1xuICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhocmVmKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MgPSByZXMucG9zO1xuICBsaW5lcyArPSByZXMubGluZXM7XG5cbiAgLy8gc2F2ZSBjdXJzb3Igc3RhdGUsIHdlIGNvdWxkIHJlcXVpcmUgdG8gcm9sbGJhY2sgbGF0ZXJcbiAgZGVzdEVuZFBvcyA9IHBvcztcbiAgZGVzdEVuZExpbmVObyA9IGxpbmVzO1xuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICBeXl4gc2tpcHBpbmcgdGhvc2Ugc3BhY2VzXG4gIHN0YXJ0ID0gcG9zO1xuICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY2ggPT09IDB4MEEpIHtcbiAgICAgIGxpbmVzKys7XG4gICAgfSBlbHNlIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgLyplc2xpbnQgbm8tZW1wdHk6MCovXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNlIHRoaXNcbiAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdHIsIHBvcywgbWF4KTtcbiAgaWYgKHBvcyA8IG1heCAmJiBzdGFydCAhPT0gcG9zICYmIHJlcy5vaykge1xuICAgIHRpdGxlID0gcmVzLnN0cjtcbiAgICBwb3MgPSByZXMucG9zO1xuICAgIGxpbmVzICs9IHJlcy5saW5lcztcbiAgfSBlbHNlIHtcbiAgICB0aXRsZSA9ICcnO1xuICAgIHBvcyA9IGRlc3RFbmRQb3M7XG4gICAgbGluZXMgPSBkZXN0RW5kTGluZU5vO1xuICB9XG5cbiAgLy8gc2tpcCB0cmFpbGluZyBzcGFjZXMgdW50aWwgdGhlIHJlc3Qgb2YgdGhlIGxpbmVcbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7IGJyZWFrOyB9XG4gICAgcG9zKys7XG4gIH1cblxuICBpZiAocG9zIDwgbWF4ICYmIHN0ci5jaGFyQ29kZUF0KHBvcykgIT09IDB4MEEpIHtcbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIC8vIGdhcmJhZ2UgYXQgdGhlIGVuZCBvZiB0aGUgbGluZSBhZnRlciB0aXRsZSxcbiAgICAgIC8vIGJ1dCBpdCBjb3VsZCBzdGlsbCBiZSBhIHZhbGlkIHJlZmVyZW5jZSBpZiB3ZSByb2xsIGJhY2tcbiAgICAgIHRpdGxlID0gJyc7XG4gICAgICBwb3MgPSBkZXN0RW5kUG9zO1xuICAgICAgbGluZXMgPSBkZXN0RW5kTGluZU5vO1xuICAgICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgICBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmICghaXNTcGFjZShjaCkpIHsgYnJlYWs7IH1cbiAgICAgICAgcG9zKys7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHBvcyA8IG1heCAmJiBzdHIuY2hhckNvZGVBdChwb3MpICE9PSAweDBBKSB7XG4gICAgLy8gZ2FyYmFnZSBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbGFiZWwgPSBub3JtYWxpemVSZWZlcmVuY2Uoc3RyLnNsaWNlKDEsIGxhYmVsRW5kKSk7XG4gIGlmICghbGFiZWwpIHtcbiAgICAvLyBDb21tb25NYXJrIDAuMjAgZGlzYWxsb3dzIGVtcHR5IGxhYmVsc1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFJlZmVyZW5jZSBjYW4gbm90IHRlcm1pbmF0ZSBhbnl0aGluZy4gVGhpcyBjaGVjayBpcyBmb3Igc2FmZXR5IG9ubHkuXG4gIC8qaXN0YW5idWwgaWdub3JlIGlmKi9cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIGlmICh0eXBlb2Ygc3RhdGUuZW52LnJlZmVyZW5jZXMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgc3RhdGUuZW52LnJlZmVyZW5jZXMgPSB7fTtcbiAgfVxuICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzW2xhYmVsXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBzdGF0ZS5lbnYucmVmZXJlbmNlc1tsYWJlbF0gPSB7IHRpdGxlOiB0aXRsZSwgaHJlZjogaHJlZiB9O1xuICB9XG5cbiAgc3RhdGUucGFyZW50VHlwZSA9IG9sZFBhcmVudFR5cGU7XG5cbiAgc3RhdGUubGluZSA9IHN0YXJ0TGluZSArIGxpbmVzICsgMTtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUGFyc2VyIHN0YXRlIGNsYXNzXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi4vdG9rZW4nKTtcbnZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxuXG5mdW5jdGlvbiBTdGF0ZUJsb2NrKHNyYywgbWQsIGVudiwgdG9rZW5zKSB7XG4gIHZhciBjaCwgcywgc3RhcnQsIHBvcywgbGVuLCBpbmRlbnQsIG9mZnNldCwgaW5kZW50X2ZvdW5kO1xuXG4gIHRoaXMuc3JjID0gc3JjO1xuXG4gIC8vIGxpbmsgdG8gcGFyc2VyIGluc3RhbmNlXG4gIHRoaXMubWQgICAgID0gbWQ7XG5cbiAgdGhpcy5lbnYgPSBlbnY7XG5cbiAgLy9cbiAgLy8gSW50ZXJuYWwgc3RhdGUgdmFydGlhYmxlc1xuICAvL1xuXG4gIHRoaXMudG9rZW5zID0gdG9rZW5zO1xuXG4gIHRoaXMuYk1hcmtzID0gW107ICAvLyBsaW5lIGJlZ2luIG9mZnNldHMgZm9yIGZhc3QganVtcHNcbiAgdGhpcy5lTWFya3MgPSBbXTsgIC8vIGxpbmUgZW5kIG9mZnNldHMgZm9yIGZhc3QganVtcHNcbiAgdGhpcy50U2hpZnQgPSBbXTsgIC8vIG9mZnNldHMgb2YgdGhlIGZpcnN0IG5vbi1zcGFjZSBjaGFyYWN0ZXJzICh0YWJzIG5vdCBleHBhbmRlZClcbiAgdGhpcy5zQ291bnQgPSBbXTsgIC8vIGluZGVudHMgZm9yIGVhY2ggbGluZSAodGFicyBleHBhbmRlZClcblxuICAvLyBBbiBhbW91bnQgb2YgdmlydHVhbCBzcGFjZXMgKHRhYnMgZXhwYW5kZWQpIGJldHdlZW4gYmVnaW5uaW5nXG4gIC8vIG9mIGVhY2ggbGluZSAoYk1hcmtzKSBhbmQgcmVhbCBiZWdpbm5pbmcgb2YgdGhhdCBsaW5lLlxuICAvL1xuICAvLyBJdCBleGlzdHMgb25seSBhcyBhIGhhY2sgYmVjYXVzZSBibG9ja3F1b3RlcyBvdmVycmlkZSBiTWFya3NcbiAgLy8gbG9zaW5nIGluZm9ybWF0aW9uIGluIHRoZSBwcm9jZXNzLlxuICAvL1xuICAvLyBJdCdzIHVzZWQgb25seSB3aGVuIGV4cGFuZGluZyB0YWJzLCB5b3UgY2FuIHRoaW5rIGFib3V0IGl0IGFzXG4gIC8vIGFuIGluaXRpYWwgdGFiIGxlbmd0aCwgZS5nLiBic0NvdW50PTIxIGFwcGxpZWQgdG8gc3RyaW5nIGBcXHQxMjNgXG4gIC8vIG1lYW5zIGZpcnN0IHRhYiBzaG91bGQgYmUgZXhwYW5kZWQgdG8gNC0yMSU0ID09PSAzIHNwYWNlcy5cbiAgLy9cbiAgdGhpcy5ic0NvdW50ID0gW107XG5cbiAgLy8gYmxvY2sgcGFyc2VyIHZhcmlhYmxlc1xuICB0aGlzLmJsa0luZGVudCAgPSAwOyAvLyByZXF1aXJlZCBibG9jayBjb250ZW50IGluZGVudFxuICAgICAgICAgICAgICAgICAgICAgICAvLyAoZm9yIGV4YW1wbGUsIGlmIHdlIGFyZSBpbiBsaXN0KVxuICB0aGlzLmxpbmUgICAgICAgPSAwOyAvLyBsaW5lIGluZGV4IGluIHNyY1xuICB0aGlzLmxpbmVNYXggICAgPSAwOyAvLyBsaW5lcyBjb3VudFxuICB0aGlzLnRpZ2h0ICAgICAgPSBmYWxzZTsgIC8vIGxvb3NlL3RpZ2h0IG1vZGUgZm9yIGxpc3RzXG4gIHRoaXMuZGRJbmRlbnQgICA9IC0xOyAvLyBpbmRlbnQgb2YgdGhlIGN1cnJlbnQgZGQgYmxvY2sgKC0xIGlmIHRoZXJlIGlzbid0IGFueSlcblxuICAvLyBjYW4gYmUgJ2Jsb2NrcXVvdGUnLCAnbGlzdCcsICdyb290JywgJ3BhcmFncmFwaCcgb3IgJ3JlZmVyZW5jZSdcbiAgLy8gdXNlZCBpbiBsaXN0cyB0byBkZXRlcm1pbmUgaWYgdGhleSBpbnRlcnJ1cHQgYSBwYXJhZ3JhcGhcbiAgdGhpcy5wYXJlbnRUeXBlID0gJ3Jvb3QnO1xuXG4gIHRoaXMubGV2ZWwgPSAwO1xuXG4gIC8vIHJlbmRlcmVyXG4gIHRoaXMucmVzdWx0ID0gJyc7XG5cbiAgLy8gQ3JlYXRlIGNhY2hlc1xuICAvLyBHZW5lcmF0ZSBtYXJrZXJzLlxuICBzID0gdGhpcy5zcmM7XG4gIGluZGVudF9mb3VuZCA9IGZhbHNlO1xuXG4gIGZvciAoc3RhcnQgPSBwb3MgPSBpbmRlbnQgPSBvZmZzZXQgPSAwLCBsZW4gPSBzLmxlbmd0aDsgcG9zIDwgbGVuOyBwb3MrKykge1xuICAgIGNoID0gcy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgICBpZiAoIWluZGVudF9mb3VuZCkge1xuICAgICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAgIGluZGVudCsrO1xuXG4gICAgICAgIGlmIChjaCA9PT0gMHgwOSkge1xuICAgICAgICAgIG9mZnNldCArPSA0IC0gb2Zmc2V0ICUgNDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGVudF9mb3VuZCA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNoID09PSAweDBBIHx8IHBvcyA9PT0gbGVuIC0gMSkge1xuICAgICAgaWYgKGNoICE9PSAweDBBKSB7IHBvcysrOyB9XG4gICAgICB0aGlzLmJNYXJrcy5wdXNoKHN0YXJ0KTtcbiAgICAgIHRoaXMuZU1hcmtzLnB1c2gocG9zKTtcbiAgICAgIHRoaXMudFNoaWZ0LnB1c2goaW5kZW50KTtcbiAgICAgIHRoaXMuc0NvdW50LnB1c2gob2Zmc2V0KTtcbiAgICAgIHRoaXMuYnNDb3VudC5wdXNoKDApO1xuXG4gICAgICBpbmRlbnRfZm91bmQgPSBmYWxzZTtcbiAgICAgIGluZGVudCA9IDA7XG4gICAgICBvZmZzZXQgPSAwO1xuICAgICAgc3RhcnQgPSBwb3MgKyAxO1xuICAgIH1cbiAgfVxuXG4gIC8vIFB1c2ggZmFrZSBlbnRyeSB0byBzaW1wbGlmeSBjYWNoZSBib3VuZHMgY2hlY2tzXG4gIHRoaXMuYk1hcmtzLnB1c2gocy5sZW5ndGgpO1xuICB0aGlzLmVNYXJrcy5wdXNoKHMubGVuZ3RoKTtcbiAgdGhpcy50U2hpZnQucHVzaCgwKTtcbiAgdGhpcy5zQ291bnQucHVzaCgwKTtcbiAgdGhpcy5ic0NvdW50LnB1c2goMCk7XG5cbiAgdGhpcy5saW5lTWF4ID0gdGhpcy5iTWFya3MubGVuZ3RoIC0gMTsgLy8gZG9uJ3QgY291bnQgbGFzdCBmYWtlIGxpbmVcbn1cblxuLy8gUHVzaCBuZXcgdG9rZW4gdG8gXCJzdHJlYW1cIi5cbi8vXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHR5cGUsIHRhZywgbmVzdGluZykge1xuICB2YXIgdG9rZW4gPSBuZXcgVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKTtcbiAgdG9rZW4uYmxvY2sgPSB0cnVlO1xuXG4gIGlmIChuZXN0aW5nIDwgMCkgeyB0aGlzLmxldmVsLS07IH1cbiAgdG9rZW4ubGV2ZWwgPSB0aGlzLmxldmVsO1xuICBpZiAobmVzdGluZyA+IDApIHsgdGhpcy5sZXZlbCsrOyB9XG5cbiAgdGhpcy50b2tlbnMucHVzaCh0b2tlbik7XG4gIHJldHVybiB0b2tlbjtcbn07XG5cblN0YXRlQmxvY2sucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiBpc0VtcHR5KGxpbmUpIHtcbiAgcmV0dXJuIHRoaXMuYk1hcmtzW2xpbmVdICsgdGhpcy50U2hpZnRbbGluZV0gPj0gdGhpcy5lTWFya3NbbGluZV07XG59O1xuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwRW1wdHlMaW5lcyA9IGZ1bmN0aW9uIHNraXBFbXB0eUxpbmVzKGZyb20pIHtcbiAgZm9yICh2YXIgbWF4ID0gdGhpcy5saW5lTWF4OyBmcm9tIDwgbWF4OyBmcm9tKyspIHtcbiAgICBpZiAodGhpcy5iTWFya3NbZnJvbV0gKyB0aGlzLnRTaGlmdFtmcm9tXSA8IHRoaXMuZU1hcmtzW2Zyb21dKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZyb207XG59O1xuXG4vLyBTa2lwIHNwYWNlcyBmcm9tIGdpdmVuIHBvc2l0aW9uLlxuU3RhdGVCbG9jay5wcm90b3R5cGUuc2tpcFNwYWNlcyA9IGZ1bmN0aW9uIHNraXBTcGFjZXMocG9zKSB7XG4gIHZhciBjaDtcblxuICBmb3IgKHZhciBtYXggPSB0aGlzLnNyYy5sZW5ndGg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjaCA9IHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7IGJyZWFrOyB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIFNraXAgc3BhY2VzIGZyb20gZ2l2ZW4gcG9zaXRpb24gaW4gcmV2ZXJzZS5cblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBTcGFjZXNCYWNrID0gZnVuY3Rpb24gc2tpcFNwYWNlc0JhY2socG9zLCBtaW4pIHtcbiAgaWYgKHBvcyA8PSBtaW4pIHsgcmV0dXJuIHBvczsgfVxuXG4gIHdoaWxlIChwb3MgPiBtaW4pIHtcbiAgICBpZiAoIWlzU3BhY2UodGhpcy5zcmMuY2hhckNvZGVBdCgtLXBvcykpKSB7IHJldHVybiBwb3MgKyAxOyB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIFNraXAgY2hhciBjb2RlcyBmcm9tIGdpdmVuIHBvc2l0aW9uXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwQ2hhcnMgPSBmdW5jdGlvbiBza2lwQ2hhcnMocG9zLCBjb2RlKSB7XG4gIGZvciAodmFyIG1heCA9IHRoaXMuc3JjLmxlbmd0aDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGlmICh0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IGNvZGUpIHsgYnJlYWs7IH1cbiAgfVxuICByZXR1cm4gcG9zO1xufTtcblxuLy8gU2tpcCBjaGFyIGNvZGVzIHJldmVyc2UgZnJvbSBnaXZlbiBwb3NpdGlvbiAtIDFcblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBDaGFyc0JhY2sgPSBmdW5jdGlvbiBza2lwQ2hhcnNCYWNrKHBvcywgY29kZSwgbWluKSB7XG4gIGlmIChwb3MgPD0gbWluKSB7IHJldHVybiBwb3M7IH1cblxuICB3aGlsZSAocG9zID4gbWluKSB7XG4gICAgaWYgKGNvZGUgIT09IHRoaXMuc3JjLmNoYXJDb2RlQXQoLS1wb3MpKSB7IHJldHVybiBwb3MgKyAxOyB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIGN1dCBsaW5lcyByYW5nZSBmcm9tIHNvdXJjZS5cblN0YXRlQmxvY2sucHJvdG90eXBlLmdldExpbmVzID0gZnVuY3Rpb24gZ2V0TGluZXMoYmVnaW4sIGVuZCwgaW5kZW50LCBrZWVwTGFzdExGKSB7XG4gIHZhciBpLCBsaW5lSW5kZW50LCBjaCwgZmlyc3QsIGxhc3QsIHF1ZXVlLCBsaW5lU3RhcnQsXG4gICAgICBsaW5lID0gYmVnaW47XG5cbiAgaWYgKGJlZ2luID49IGVuZCkge1xuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIHF1ZXVlID0gbmV3IEFycmF5KGVuZCAtIGJlZ2luKTtcblxuICBmb3IgKGkgPSAwOyBsaW5lIDwgZW5kOyBsaW5lKyssIGkrKykge1xuICAgIGxpbmVJbmRlbnQgPSAwO1xuICAgIGxpbmVTdGFydCA9IGZpcnN0ID0gdGhpcy5iTWFya3NbbGluZV07XG5cbiAgICBpZiAobGluZSArIDEgPCBlbmQgfHwga2VlcExhc3RMRikge1xuICAgICAgLy8gTm8gbmVlZCBmb3IgYm91bmRzIGNoZWNrIGJlY2F1c2Ugd2UgaGF2ZSBmYWtlIGVudHJ5IG9uIHRhaWwuXG4gICAgICBsYXN0ID0gdGhpcy5lTWFya3NbbGluZV0gKyAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYXN0ID0gdGhpcy5lTWFya3NbbGluZV07XG4gICAgfVxuXG4gICAgd2hpbGUgKGZpcnN0IDwgbGFzdCAmJiBsaW5lSW5kZW50IDwgaW5kZW50KSB7XG4gICAgICBjaCA9IHRoaXMuc3JjLmNoYXJDb2RlQXQoZmlyc3QpO1xuXG4gICAgICBpZiAoaXNTcGFjZShjaCkpIHtcbiAgICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgICAgbGluZUluZGVudCArPSA0IC0gKGxpbmVJbmRlbnQgKyB0aGlzLmJzQ291bnRbbGluZV0pICUgNDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaW5lSW5kZW50Kys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZmlyc3QgLSBsaW5lU3RhcnQgPCB0aGlzLnRTaGlmdFtsaW5lXSkge1xuICAgICAgICAvLyBwYXRjaGVkIHRTaGlmdCBtYXNrZWQgY2hhcmFjdGVycyB0byBsb29rIGxpa2Ugc3BhY2VzIChibG9ja3F1b3RlcywgbGlzdCBtYXJrZXJzKVxuICAgICAgICBsaW5lSW5kZW50Kys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgZmlyc3QrKztcbiAgICB9XG5cbiAgICBpZiAobGluZUluZGVudCA+IGluZGVudCkge1xuICAgICAgLy8gcGFydGlhbGx5IGV4cGFuZGluZyB0YWJzIGluIGNvZGUgYmxvY2tzLCBlLmcgJ1xcdFxcdGZvb2JhcidcbiAgICAgIC8vIHdpdGggaW5kZW50PTIgYmVjb21lcyAnICBcXHRmb29iYXInXG4gICAgICBxdWV1ZVtpXSA9IG5ldyBBcnJheShsaW5lSW5kZW50IC0gaW5kZW50ICsgMSkuam9pbignICcpICsgdGhpcy5zcmMuc2xpY2UoZmlyc3QsIGxhc3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICBxdWV1ZVtpXSA9IHRoaXMuc3JjLnNsaWNlKGZpcnN0LCBsYXN0KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcXVldWUuam9pbignJyk7XG59O1xuXG4vLyByZS1leHBvcnQgVG9rZW4gY2xhc3MgdG8gdXNlIGluIGJsb2NrIHJ1bGVzXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5Ub2tlbiA9IFRva2VuO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVCbG9jaztcbiIsIi8vIEdGTSB0YWJsZSwgbm9uLXN0YW5kYXJkXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzU3BhY2UgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG5cbmZ1bmN0aW9uIGdldExpbmUoc3RhdGUsIGxpbmUpIHtcbiAgdmFyIHBvcyA9IHN0YXRlLmJNYXJrc1tsaW5lXSArIHN0YXRlLmJsa0luZGVudCxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tsaW5lXTtcblxuICByZXR1cm4gc3RhdGUuc3JjLnN1YnN0cihwb3MsIG1heCAtIHBvcyk7XG59XG5cbmZ1bmN0aW9uIGVzY2FwZWRTcGxpdChzdHIpIHtcbiAgdmFyIHJlc3VsdCA9IFtdLFxuICAgICAgcG9zID0gMCxcbiAgICAgIG1heCA9IHN0ci5sZW5ndGgsXG4gICAgICBjaCxcbiAgICAgIGVzY2FwZXMgPSAwLFxuICAgICAgbGFzdFBvcyA9IDAsXG4gICAgICBiYWNrVGlja2VkID0gZmFsc2UsXG4gICAgICBsYXN0QmFja1RpY2sgPSAwO1xuXG4gIGNoICA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGlmIChjaCA9PT0gMHg2MC8qIGAgKi8pIHtcbiAgICAgIGlmIChiYWNrVGlja2VkKSB7XG4gICAgICAgIC8vIG1ha2UgXFxgIGNsb3NlIGNvZGUgc2VxdWVuY2UsIGJ1dCBub3Qgb3BlbiBpdDtcbiAgICAgICAgLy8gdGhlIHJlYXNvbiBpczogYFxcYCBpcyBjb3JyZWN0IGNvZGUgYmxvY2tcbiAgICAgICAgYmFja1RpY2tlZCA9IGZhbHNlO1xuICAgICAgICBsYXN0QmFja1RpY2sgPSBwb3M7XG4gICAgICB9IGVsc2UgaWYgKGVzY2FwZXMgJSAyID09PSAwKSB7XG4gICAgICAgIGJhY2tUaWNrZWQgPSB0cnVlO1xuICAgICAgICBsYXN0QmFja1RpY2sgPSBwb3M7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHg3Yy8qIHwgKi8gJiYgKGVzY2FwZXMgJSAyID09PSAwKSAmJiAhYmFja1RpY2tlZCkge1xuICAgICAgcmVzdWx0LnB1c2goc3RyLnN1YnN0cmluZyhsYXN0UG9zLCBwb3MpKTtcbiAgICAgIGxhc3RQb3MgPSBwb3MgKyAxO1xuICAgIH1cblxuICAgIGlmIChjaCA9PT0gMHg1Yy8qIFxcICovKSB7XG4gICAgICBlc2NhcGVzKys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVzY2FwZXMgPSAwO1xuICAgIH1cblxuICAgIHBvcysrO1xuXG4gICAgLy8gSWYgdGhlcmUgd2FzIGFuIHVuLWNsb3NlZCBiYWNrdGljaywgZ28gYmFjayB0byBqdXN0IGFmdGVyXG4gICAgLy8gdGhlIGxhc3QgYmFja3RpY2ssIGJ1dCBhcyBpZiBpdCB3YXMgYSBub3JtYWwgY2hhcmFjdGVyXG4gICAgaWYgKHBvcyA9PT0gbWF4ICYmIGJhY2tUaWNrZWQpIHtcbiAgICAgIGJhY2tUaWNrZWQgPSBmYWxzZTtcbiAgICAgIHBvcyA9IGxhc3RCYWNrVGljayArIDE7XG4gICAgfVxuXG4gICAgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuICB9XG5cbiAgcmVzdWx0LnB1c2goc3RyLnN1YnN0cmluZyhsYXN0UG9zKSk7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRhYmxlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgY2gsIGxpbmVUZXh0LCBwb3MsIGksIG5leHRMaW5lLCBjb2x1bW5zLCBjb2x1bW5Db3VudCwgdG9rZW4sXG4gICAgICBhbGlnbnMsIHQsIHRhYmxlTGluZXMsIHRib2R5TGluZXM7XG5cbiAgLy8gc2hvdWxkIGhhdmUgYXQgbGVhc3QgdHdvIGxpbmVzXG4gIGlmIChzdGFydExpbmUgKyAyID4gZW5kTGluZSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBuZXh0TGluZSA9IHN0YXJ0TGluZSArIDE7XG5cbiAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gaWYgaXQncyBpbmRlbnRlZCBtb3JlIHRoYW4gMyBzcGFjZXMsIGl0IHNob3VsZCBiZSBhIGNvZGUgYmxvY2tcbiAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAvLyBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIHNlY29uZCBsaW5lIHNob3VsZCBiZSAnfCcsICctJywgJzonLFxuICAvLyBhbmQgbm8gb3RoZXIgY2hhcmFjdGVycyBhcmUgYWxsb3dlZCBidXQgc3BhY2VzO1xuICAvLyBiYXNpY2FsbHksIHRoaXMgaXMgdGhlIGVxdWl2YWxlbnQgb2YgL15bLTp8XVstOnxcXHNdKiQvIHJlZ2V4cFxuXG4gIHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICBpZiAocG9zID49IHN0YXRlLmVNYXJrc1tuZXh0TGluZV0pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKyk7XG4gIGlmIChjaCAhPT0gMHg3Qy8qIHwgKi8gJiYgY2ggIT09IDB4MkQvKiAtICovICYmIGNoICE9PSAweDNBLyogOiAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICB3aGlsZSAocG9zIDwgc3RhdGUuZU1hcmtzW25leHRMaW5lXSkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmIChjaCAhPT0gMHg3Qy8qIHwgKi8gJiYgY2ggIT09IDB4MkQvKiAtICovICYmIGNoICE9PSAweDNBLyogOiAqLyAmJiAhaXNTcGFjZShjaCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICBwb3MrKztcbiAgfVxuXG4gIGxpbmVUZXh0ID0gZ2V0TGluZShzdGF0ZSwgc3RhcnRMaW5lICsgMSk7XG5cbiAgY29sdW1ucyA9IGxpbmVUZXh0LnNwbGl0KCd8Jyk7XG4gIGFsaWducyA9IFtdO1xuICBmb3IgKGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgIHQgPSBjb2x1bW5zW2ldLnRyaW0oKTtcbiAgICBpZiAoIXQpIHtcbiAgICAgIC8vIGFsbG93IGVtcHR5IGNvbHVtbnMgYmVmb3JlIGFuZCBhZnRlciB0YWJsZSwgYnV0IG5vdCBpbiBiZXR3ZWVuIGNvbHVtbnM7XG4gICAgICAvLyBlLmcuIGFsbG93IGAgfC0tLXwgYCwgZGlzYWxsb3cgYCAtLS18fC0tLSBgXG4gICAgICBpZiAoaSA9PT0gMCB8fCBpID09PSBjb2x1bW5zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCEvXjo/LSs6PyQvLnRlc3QodCkpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgaWYgKHQuY2hhckNvZGVBdCh0Lmxlbmd0aCAtIDEpID09PSAweDNBLyogOiAqLykge1xuICAgICAgYWxpZ25zLnB1c2godC5jaGFyQ29kZUF0KDApID09PSAweDNBLyogOiAqLyA/ICdjZW50ZXInIDogJ3JpZ2h0Jyk7XG4gICAgfSBlbHNlIGlmICh0LmNoYXJDb2RlQXQoMCkgPT09IDB4M0EvKiA6ICovKSB7XG4gICAgICBhbGlnbnMucHVzaCgnbGVmdCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhbGlnbnMucHVzaCgnJyk7XG4gICAgfVxuICB9XG5cbiAgbGluZVRleHQgPSBnZXRMaW5lKHN0YXRlLCBzdGFydExpbmUpLnRyaW0oKTtcbiAgaWYgKGxpbmVUZXh0LmluZGV4T2YoJ3wnKSA9PT0gLTEpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuICBjb2x1bW5zID0gZXNjYXBlZFNwbGl0KGxpbmVUZXh0LnJlcGxhY2UoL15cXHx8XFx8JC9nLCAnJykpO1xuXG4gIC8vIGhlYWRlciByb3cgd2lsbCBkZWZpbmUgYW4gYW1vdW50IG9mIGNvbHVtbnMgaW4gdGhlIGVudGlyZSB0YWJsZSxcbiAgLy8gYW5kIGFsaWduIHJvdyBzaG91bGRuJ3QgYmUgc21hbGxlciB0aGFuIHRoYXQgKHRoZSByZXN0IG9mIHRoZSByb3dzIGNhbilcbiAgY29sdW1uQ291bnQgPSBjb2x1bW5zLmxlbmd0aDtcbiAgaWYgKGNvbHVtbkNvdW50ID4gYWxpZ25zLmxlbmd0aCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgdG9rZW4gICAgID0gc3RhdGUucHVzaCgndGFibGVfb3BlbicsICd0YWJsZScsIDEpO1xuICB0b2tlbi5tYXAgPSB0YWJsZUxpbmVzID0gWyBzdGFydExpbmUsIDAgXTtcblxuICB0b2tlbiAgICAgPSBzdGF0ZS5wdXNoKCd0aGVhZF9vcGVuJywgJ3RoZWFkJywgMSk7XG4gIHRva2VuLm1hcCA9IFsgc3RhcnRMaW5lLCBzdGFydExpbmUgKyAxIF07XG5cbiAgdG9rZW4gICAgID0gc3RhdGUucHVzaCgndHJfb3BlbicsICd0cicsIDEpO1xuICB0b2tlbi5tYXAgPSBbIHN0YXJ0TGluZSwgc3RhcnRMaW5lICsgMSBdO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBjb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdG9rZW4gICAgICAgICAgPSBzdGF0ZS5wdXNoKCd0aF9vcGVuJywgJ3RoJywgMSk7XG4gICAgdG9rZW4ubWFwICAgICAgPSBbIHN0YXJ0TGluZSwgc3RhcnRMaW5lICsgMSBdO1xuICAgIGlmIChhbGlnbnNbaV0pIHtcbiAgICAgIHRva2VuLmF0dHJzICA9IFsgWyAnc3R5bGUnLCAndGV4dC1hbGlnbjonICsgYWxpZ25zW2ldIF0gXTtcbiAgICB9XG5cbiAgICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ2lubGluZScsICcnLCAwKTtcbiAgICB0b2tlbi5jb250ZW50ICA9IGNvbHVtbnNbaV0udHJpbSgpO1xuICAgIHRva2VuLm1hcCAgICAgID0gWyBzdGFydExpbmUsIHN0YXJ0TGluZSArIDEgXTtcbiAgICB0b2tlbi5jaGlsZHJlbiA9IFtdO1xuXG4gICAgdG9rZW4gICAgICAgICAgPSBzdGF0ZS5wdXNoKCd0aF9jbG9zZScsICd0aCcsIC0xKTtcbiAgfVxuXG4gIHRva2VuICAgICA9IHN0YXRlLnB1c2goJ3RyX2Nsb3NlJywgJ3RyJywgLTEpO1xuICB0b2tlbiAgICAgPSBzdGF0ZS5wdXNoKCd0aGVhZF9jbG9zZScsICd0aGVhZCcsIC0xKTtcblxuICB0b2tlbiAgICAgPSBzdGF0ZS5wdXNoKCd0Ym9keV9vcGVuJywgJ3Rib2R5JywgMSk7XG4gIHRva2VuLm1hcCA9IHRib2R5TGluZXMgPSBbIHN0YXJ0TGluZSArIDIsIDAgXTtcblxuICBmb3IgKG5leHRMaW5lID0gc3RhcnRMaW5lICsgMjsgbmV4dExpbmUgPCBlbmRMaW5lOyBuZXh0TGluZSsrKSB7XG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgYnJlYWs7IH1cblxuICAgIGxpbmVUZXh0ID0gZ2V0TGluZShzdGF0ZSwgbmV4dExpbmUpLnRyaW0oKTtcbiAgICBpZiAobGluZVRleHQuaW5kZXhPZignfCcpID09PSAtMSkgeyBicmVhazsgfVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgYnJlYWs7IH1cbiAgICBjb2x1bW5zID0gZXNjYXBlZFNwbGl0KGxpbmVUZXh0LnJlcGxhY2UoL15cXHx8XFx8JC9nLCAnJykpO1xuXG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0cl9vcGVuJywgJ3RyJywgMSk7XG4gICAgZm9yIChpID0gMDsgaSA8IGNvbHVtbkNvdW50OyBpKyspIHtcbiAgICAgIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgndGRfb3BlbicsICd0ZCcsIDEpO1xuICAgICAgaWYgKGFsaWduc1tpXSkge1xuICAgICAgICB0b2tlbi5hdHRycyAgPSBbIFsgJ3N0eWxlJywgJ3RleHQtYWxpZ246JyArIGFsaWduc1tpXSBdIF07XG4gICAgICB9XG5cbiAgICAgIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApO1xuICAgICAgdG9rZW4uY29udGVudCAgPSBjb2x1bW5zW2ldID8gY29sdW1uc1tpXS50cmltKCkgOiAnJztcbiAgICAgIHRva2VuLmNoaWxkcmVuID0gW107XG5cbiAgICAgIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgndGRfY2xvc2UnLCAndGQnLCAtMSk7XG4gICAgfVxuICAgIHRva2VuID0gc3RhdGUucHVzaCgndHJfY2xvc2UnLCAndHInLCAtMSk7XG4gIH1cbiAgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0Ym9keV9jbG9zZScsICd0Ym9keScsIC0xKTtcbiAgdG9rZW4gPSBzdGF0ZS5wdXNoKCd0YWJsZV9jbG9zZScsICd0YWJsZScsIC0xKTtcblxuICB0YWJsZUxpbmVzWzFdID0gdGJvZHlMaW5lc1sxXSA9IG5leHRMaW5lO1xuICBzdGF0ZS5saW5lID0gbmV4dExpbmU7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJsb2NrKHN0YXRlKSB7XG4gIHZhciB0b2tlbjtcblxuICBpZiAoc3RhdGUuaW5saW5lTW9kZSkge1xuICAgIHRva2VuICAgICAgICAgID0gbmV3IHN0YXRlLlRva2VuKCdpbmxpbmUnLCAnJywgMCk7XG4gICAgdG9rZW4uY29udGVudCAgPSBzdGF0ZS5zcmM7XG4gICAgdG9rZW4ubWFwICAgICAgPSBbIDAsIDEgXTtcbiAgICB0b2tlbi5jaGlsZHJlbiA9IFtdO1xuICAgIHN0YXRlLnRva2Vucy5wdXNoKHRva2VuKTtcbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5tZC5ibG9jay5wYXJzZShzdGF0ZS5zcmMsIHN0YXRlLm1kLCBzdGF0ZS5lbnYsIHN0YXRlLnRva2Vucyk7XG4gIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5saW5lKHN0YXRlKSB7XG4gIHZhciB0b2tlbnMgPSBzdGF0ZS50b2tlbnMsIHRvaywgaSwgbDtcblxuICAvLyBQYXJzZSBpbmxpbmVzXG4gIGZvciAoaSA9IDAsIGwgPSB0b2tlbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgdG9rID0gdG9rZW5zW2ldO1xuICAgIGlmICh0b2sudHlwZSA9PT0gJ2lubGluZScpIHtcbiAgICAgIHN0YXRlLm1kLmlubGluZS5wYXJzZSh0b2suY29udGVudCwgc3RhdGUubWQsIHN0YXRlLmVudiwgdG9rLmNoaWxkcmVuKTtcbiAgICB9XG4gIH1cbn07XG4iLCIvLyBSZXBsYWNlIGxpbmstbGlrZSB0ZXh0cyB3aXRoIGxpbmsgbm9kZXMuXG4vL1xuLy8gQ3VycmVudGx5IHJlc3RyaWN0ZWQgYnkgYG1kLnZhbGlkYXRlTGluaygpYCB0byBodHRwL2h0dHBzL2Z0cFxuLy9cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgYXJyYXlSZXBsYWNlQXQgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5hcnJheVJlcGxhY2VBdDtcblxuXG5mdW5jdGlvbiBpc0xpbmtPcGVuKHN0cikge1xuICByZXR1cm4gL148YVs+XFxzXS9pLnRlc3Qoc3RyKTtcbn1cbmZ1bmN0aW9uIGlzTGlua0Nsb3NlKHN0cikge1xuICByZXR1cm4gL148XFwvYVxccyo+L2kudGVzdChzdHIpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGlua2lmeShzdGF0ZSkge1xuICB2YXIgaSwgaiwgbCwgdG9rZW5zLCB0b2tlbiwgY3VycmVudFRva2VuLCBub2RlcywgbG4sIHRleHQsIHBvcywgbGFzdFBvcyxcbiAgICAgIGxldmVsLCBodG1sTGlua0xldmVsLCB1cmwsIGZ1bGxVcmwsIHVybFRleHQsXG4gICAgICBibG9ja1Rva2VucyA9IHN0YXRlLnRva2VucyxcbiAgICAgIGxpbmtzO1xuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy5saW5raWZ5KSB7IHJldHVybjsgfVxuXG4gIGZvciAoaiA9IDAsIGwgPSBibG9ja1Rva2Vucy5sZW5ndGg7IGogPCBsOyBqKyspIHtcbiAgICBpZiAoYmxvY2tUb2tlbnNbal0udHlwZSAhPT0gJ2lubGluZScgfHxcbiAgICAgICAgIXN0YXRlLm1kLmxpbmtpZnkucHJldGVzdChibG9ja1Rva2Vuc1tqXS5jb250ZW50KSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgdG9rZW5zID0gYmxvY2tUb2tlbnNbal0uY2hpbGRyZW47XG5cbiAgICBodG1sTGlua0xldmVsID0gMDtcblxuICAgIC8vIFdlIHNjYW4gZnJvbSB0aGUgZW5kLCB0byBrZWVwIHBvc2l0aW9uIHdoZW4gbmV3IHRhZ3MgYWRkZWQuXG4gICAgLy8gVXNlIHJldmVyc2VkIGxvZ2ljIGluIGxpbmtzIHN0YXJ0L2VuZCBtYXRjaFxuICAgIGZvciAoaSA9IHRva2Vucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY3VycmVudFRva2VuID0gdG9rZW5zW2ldO1xuXG4gICAgICAvLyBTa2lwIGNvbnRlbnQgb2YgbWFya2Rvd24gbGlua3NcbiAgICAgIGlmIChjdXJyZW50VG9rZW4udHlwZSA9PT0gJ2xpbmtfY2xvc2UnKSB7XG4gICAgICAgIGktLTtcbiAgICAgICAgd2hpbGUgKHRva2Vuc1tpXS5sZXZlbCAhPT0gY3VycmVudFRva2VuLmxldmVsICYmIHRva2Vuc1tpXS50eXBlICE9PSAnbGlua19vcGVuJykge1xuICAgICAgICAgIGktLTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2tpcCBjb250ZW50IG9mIGh0bWwgdGFnIGxpbmtzXG4gICAgICBpZiAoY3VycmVudFRva2VuLnR5cGUgPT09ICdodG1sX2lubGluZScpIHtcbiAgICAgICAgaWYgKGlzTGlua09wZW4oY3VycmVudFRva2VuLmNvbnRlbnQpICYmIGh0bWxMaW5rTGV2ZWwgPiAwKSB7XG4gICAgICAgICAgaHRtbExpbmtMZXZlbC0tO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0xpbmtDbG9zZShjdXJyZW50VG9rZW4uY29udGVudCkpIHtcbiAgICAgICAgICBodG1sTGlua0xldmVsKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChodG1sTGlua0xldmVsID4gMCkgeyBjb250aW51ZTsgfVxuXG4gICAgICBpZiAoY3VycmVudFRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiBzdGF0ZS5tZC5saW5raWZ5LnRlc3QoY3VycmVudFRva2VuLmNvbnRlbnQpKSB7XG5cbiAgICAgICAgdGV4dCA9IGN1cnJlbnRUb2tlbi5jb250ZW50O1xuICAgICAgICBsaW5rcyA9IHN0YXRlLm1kLmxpbmtpZnkubWF0Y2godGV4dCk7XG5cbiAgICAgICAgLy8gTm93IHNwbGl0IHN0cmluZyB0byBub2Rlc1xuICAgICAgICBub2RlcyA9IFtdO1xuICAgICAgICBsZXZlbCA9IGN1cnJlbnRUb2tlbi5sZXZlbDtcbiAgICAgICAgbGFzdFBvcyA9IDA7XG5cbiAgICAgICAgZm9yIChsbiA9IDA7IGxuIDwgbGlua3MubGVuZ3RoOyBsbisrKSB7XG5cbiAgICAgICAgICB1cmwgPSBsaW5rc1tsbl0udXJsO1xuICAgICAgICAgIGZ1bGxVcmwgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHVybCk7XG4gICAgICAgICAgaWYgKCFzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoZnVsbFVybCkpIHsgY29udGludWU7IH1cblxuICAgICAgICAgIHVybFRleHQgPSBsaW5rc1tsbl0udGV4dDtcblxuICAgICAgICAgIC8vIExpbmtpZmllciBtaWdodCBzZW5kIHJhdyBob3N0bmFtZXMgbGlrZSBcImV4YW1wbGUuY29tXCIsIHdoZXJlIHVybFxuICAgICAgICAgIC8vIHN0YXJ0cyB3aXRoIGRvbWFpbiBuYW1lLiBTbyB3ZSBwcmVwZW5kIGh0dHA6Ly8gaW4gdGhvc2UgY2FzZXMsXG4gICAgICAgICAgLy8gYW5kIHJlbW92ZSBpdCBhZnRlcndhcmRzLlxuICAgICAgICAgIC8vXG4gICAgICAgICAgaWYgKCFsaW5rc1tsbl0uc2NoZW1hKSB7XG4gICAgICAgICAgICB1cmxUZXh0ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQoJ2h0dHA6Ly8nICsgdXJsVGV4dCkucmVwbGFjZSgvXmh0dHA6XFwvXFwvLywgJycpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobGlua3NbbG5dLnNjaGVtYSA9PT0gJ21haWx0bzonICYmICEvXm1haWx0bzovaS50ZXN0KHVybFRleHQpKSB7XG4gICAgICAgICAgICB1cmxUZXh0ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQoJ21haWx0bzonICsgdXJsVGV4dCkucmVwbGFjZSgvXm1haWx0bzovLCAnJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVybFRleHQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCh1cmxUZXh0KTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwb3MgPSBsaW5rc1tsbl0uaW5kZXg7XG5cbiAgICAgICAgICBpZiAocG9zID4gbGFzdFBvcykge1xuICAgICAgICAgICAgdG9rZW4gICAgICAgICA9IG5ldyBzdGF0ZS5Ub2tlbigndGV4dCcsICcnLCAwKTtcbiAgICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSB0ZXh0LnNsaWNlKGxhc3RQb3MsIHBvcyk7XG4gICAgICAgICAgICB0b2tlbi5sZXZlbCAgID0gbGV2ZWw7XG4gICAgICAgICAgICBub2Rlcy5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0b2tlbiAgICAgICAgID0gbmV3IHN0YXRlLlRva2VuKCdsaW5rX29wZW4nLCAnYScsIDEpO1xuICAgICAgICAgIHRva2VuLmF0dHJzICAgPSBbIFsgJ2hyZWYnLCBmdWxsVXJsIF0gXTtcbiAgICAgICAgICB0b2tlbi5sZXZlbCAgID0gbGV2ZWwrKztcbiAgICAgICAgICB0b2tlbi5tYXJrdXAgID0gJ2xpbmtpZnknO1xuICAgICAgICAgIHRva2VuLmluZm8gICAgPSAnYXV0byc7XG4gICAgICAgICAgbm9kZXMucHVzaCh0b2tlbik7XG5cbiAgICAgICAgICB0b2tlbiAgICAgICAgID0gbmV3IHN0YXRlLlRva2VuKCd0ZXh0JywgJycsIDApO1xuICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSB1cmxUZXh0O1xuICAgICAgICAgIHRva2VuLmxldmVsICAgPSBsZXZlbDtcbiAgICAgICAgICBub2Rlcy5wdXNoKHRva2VuKTtcblxuICAgICAgICAgIHRva2VuICAgICAgICAgPSBuZXcgc3RhdGUuVG9rZW4oJ2xpbmtfY2xvc2UnLCAnYScsIC0xKTtcbiAgICAgICAgICB0b2tlbi5sZXZlbCAgID0gLS1sZXZlbDtcbiAgICAgICAgICB0b2tlbi5tYXJrdXAgID0gJ2xpbmtpZnknO1xuICAgICAgICAgIHRva2VuLmluZm8gICAgPSAnYXV0byc7XG4gICAgICAgICAgbm9kZXMucHVzaCh0b2tlbik7XG5cbiAgICAgICAgICBsYXN0UG9zID0gbGlua3NbbG5dLmxhc3RJbmRleDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGFzdFBvcyA8IHRleHQubGVuZ3RoKSB7XG4gICAgICAgICAgdG9rZW4gICAgICAgICA9IG5ldyBzdGF0ZS5Ub2tlbigndGV4dCcsICcnLCAwKTtcbiAgICAgICAgICB0b2tlbi5jb250ZW50ID0gdGV4dC5zbGljZShsYXN0UG9zKTtcbiAgICAgICAgICB0b2tlbi5sZXZlbCAgID0gbGV2ZWw7XG4gICAgICAgICAgbm9kZXMucHVzaCh0b2tlbik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXBsYWNlIGN1cnJlbnQgbm9kZVxuICAgICAgICBibG9ja1Rva2Vuc1tqXS5jaGlsZHJlbiA9IHRva2VucyA9IGFycmF5UmVwbGFjZUF0KHRva2VucywgaSwgbm9kZXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiIsIi8vIE5vcm1hbGl6ZSBpbnB1dCBzdHJpbmdcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBORVdMSU5FU19SRSAgPSAvXFxyW1xcblxcdTAwODVdP3xbXFx1MjQyNFxcdTIwMjhcXHUwMDg1XS9nO1xudmFyIE5VTExfUkUgICAgICA9IC9cXHUwMDAwL2c7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmxpbmUoc3RhdGUpIHtcbiAgdmFyIHN0cjtcblxuICAvLyBOb3JtYWxpemUgbmV3bGluZXNcbiAgc3RyID0gc3RhdGUuc3JjLnJlcGxhY2UoTkVXTElORVNfUkUsICdcXG4nKTtcblxuICAvLyBSZXBsYWNlIE5VTEwgY2hhcmFjdGVyc1xuICBzdHIgPSBzdHIucmVwbGFjZShOVUxMX1JFLCAnXFx1RkZGRCcpO1xuXG4gIHN0YXRlLnNyYyA9IHN0cjtcbn07XG4iLCIvLyBTaW1wbGUgdHlwb2dyYXBoeWMgcmVwbGFjZW1lbnRzXG4vL1xuLy8gKGMpIChDKSDihpIgwqlcbi8vICh0bSkgKFRNKSDihpIg4oSiXG4vLyAocikgKFIpIOKGkiDCrlxuLy8gKy0g4oaSIMKxXG4vLyAocCkgKFApIC0+IMKnXG4vLyAuLi4g4oaSIOKApiAoYWxzbyA/Li4uLiDihpIgPy4uLCAhLi4uLiDihpIgIS4uKVxuLy8gPz8/Pz8/Pz8g4oaSID8/PywgISEhISEg4oaSICEhISwgYCwsYCDihpIgYCxgXG4vLyAtLSDihpIgJm5kYXNoOywgLS0tIOKGkiAmbWRhc2g7XG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG4vLyBUT0RPOlxuLy8gLSBmcmFjdGlvbmFscyAxLzIsIDEvNCwgMy80IC0+IMK9LCDCvCwgwr5cbi8vIC0gbWlsdGlwbGljYXRpb24gMiB4IDQgLT4gMiDDlyA0XG5cbnZhciBSQVJFX1JFID0gL1xcKy18XFwuXFwufFxcP1xcP1xcP1xcP3whISEhfCwsfC0tLztcblxuLy8gV29ya2Fyb3VuZCBmb3IgcGhhbnRvbWpzIC0gbmVlZCByZWdleCB3aXRob3V0IC9nIGZsYWcsXG4vLyBvciByb290IGNoZWNrIHdpbGwgZmFpbCBldmVyeSBzZWNvbmQgdGltZVxudmFyIFNDT1BFRF9BQkJSX1RFU1RfUkUgPSAvXFwoKGN8dG18cnxwKVxcKS9pO1xuXG52YXIgU0NPUEVEX0FCQlJfUkUgPSAvXFwoKGN8dG18cnxwKVxcKS9pZztcbnZhciBTQ09QRURfQUJCUiA9IHtcbiAgYzogJ8KpJyxcbiAgcjogJ8KuJyxcbiAgcDogJ8KnJyxcbiAgdG06ICfihKInXG59O1xuXG5mdW5jdGlvbiByZXBsYWNlRm4obWF0Y2gsIG5hbWUpIHtcbiAgcmV0dXJuIFNDT1BFRF9BQkJSW25hbWUudG9Mb3dlckNhc2UoKV07XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2Vfc2NvcGVkKGlubGluZVRva2Vucykge1xuICB2YXIgaSwgdG9rZW4sIGluc2lkZV9hdXRvbGluayA9IDA7XG5cbiAgZm9yIChpID0gaW5saW5lVG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdG9rZW4gPSBpbmxpbmVUb2tlbnNbaV07XG5cbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ3RleHQnICYmICFpbnNpZGVfYXV0b2xpbmspIHtcbiAgICAgIHRva2VuLmNvbnRlbnQgPSB0b2tlbi5jb250ZW50LnJlcGxhY2UoU0NPUEVEX0FCQlJfUkUsIHJlcGxhY2VGbik7XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX29wZW4nICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rLS07XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX2Nsb3NlJyAmJiB0b2tlbi5pbmZvID09PSAnYXV0bycpIHtcbiAgICAgIGluc2lkZV9hdXRvbGluaysrO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZXBsYWNlX3JhcmUoaW5saW5lVG9rZW5zKSB7XG4gIHZhciBpLCB0b2tlbiwgaW5zaWRlX2F1dG9saW5rID0gMDtcblxuICBmb3IgKGkgPSBpbmxpbmVUb2tlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB0b2tlbiA9IGlubGluZVRva2Vuc1tpXTtcblxuICAgIGlmICh0b2tlbi50eXBlID09PSAndGV4dCcgJiYgIWluc2lkZV9hdXRvbGluaykge1xuICAgICAgaWYgKFJBUkVfUkUudGVzdCh0b2tlbi5jb250ZW50KSkge1xuICAgICAgICB0b2tlbi5jb250ZW50ID0gdG9rZW4uY29udGVudFxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwrLS9nLCAnwrEnKVxuICAgICAgICAgICAgICAgICAgICAvLyAuLiwgLi4uLCAuLi4uLi4uIC0+IOKAplxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgPy4uLi4uICYgIS4uLi4uIC0+ID8uLiAmICEuLlxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFwuezIsfS9nLCAn4oCmJykucmVwbGFjZSgvKFs/IV0p4oCmL2csICckMS4uJylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhbPyFdKXs0LH0vZywgJyQxJDEkMScpLnJlcGxhY2UoLyx7Mix9L2csICcsJylcbiAgICAgICAgICAgICAgICAgICAgLy8gZW0tZGFzaFxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF58W14tXSktLS0oW14tXXwkKS9tZywgJyQxXFx1MjAxNCQyJylcbiAgICAgICAgICAgICAgICAgICAgLy8gZW4tZGFzaFxuICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF58XFxzKS0tKFxcc3wkKS9tZywgJyQxXFx1MjAxMyQyJylcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhefFteLVxcc10pLS0oW14tXFxzXXwkKS9tZywgJyQxXFx1MjAxMyQyJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX29wZW4nICYmIHRva2VuLmluZm8gPT09ICdhdXRvJykge1xuICAgICAgaW5zaWRlX2F1dG9saW5rLS07XG4gICAgfVxuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICdsaW5rX2Nsb3NlJyAmJiB0b2tlbi5pbmZvID09PSAnYXV0bycpIHtcbiAgICAgIGluc2lkZV9hdXRvbGluaysrO1xuICAgIH1cbiAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICB2YXIgYmxrSWR4O1xuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy50eXBvZ3JhcGhlcikgeyByZXR1cm47IH1cblxuICBmb3IgKGJsa0lkeCA9IHN0YXRlLnRva2Vucy5sZW5ndGggLSAxOyBibGtJZHggPj0gMDsgYmxrSWR4LS0pIHtcblxuICAgIGlmIChzdGF0ZS50b2tlbnNbYmxrSWR4XS50eXBlICE9PSAnaW5saW5lJykgeyBjb250aW51ZTsgfVxuXG4gICAgaWYgKFNDT1BFRF9BQkJSX1RFU1RfUkUudGVzdChzdGF0ZS50b2tlbnNbYmxrSWR4XS5jb250ZW50KSkge1xuICAgICAgcmVwbGFjZV9zY29wZWQoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY2hpbGRyZW4pO1xuICAgIH1cblxuICAgIGlmIChSQVJFX1JFLnRlc3Qoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY29udGVudCkpIHtcbiAgICAgIHJlcGxhY2VfcmFyZShzdGF0ZS50b2tlbnNbYmxrSWR4XS5jaGlsZHJlbik7XG4gICAgfVxuXG4gIH1cbn07XG4iLCIvLyBDb252ZXJ0IHN0cmFpZ2h0IHF1b3RhdGlvbiBtYXJrcyB0byB0eXBvZ3JhcGhpYyBvbmVzXG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBpc1doaXRlU3BhY2UgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzV2hpdGVTcGFjZTtcbnZhciBpc1B1bmN0Q2hhciAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzUHVuY3RDaGFyO1xudmFyIGlzTWRBc2NpaVB1bmN0ID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNNZEFzY2lpUHVuY3Q7XG5cbnZhciBRVU9URV9URVNUX1JFID0gL1snXCJdLztcbnZhciBRVU9URV9SRSA9IC9bJ1wiXS9nO1xudmFyIEFQT1NUUk9QSEUgPSAnXFx1MjAxOSc7IC8qIOKAmSAqL1xuXG5cbmZ1bmN0aW9uIHJlcGxhY2VBdChzdHIsIGluZGV4LCBjaCkge1xuICByZXR1cm4gc3RyLnN1YnN0cigwLCBpbmRleCkgKyBjaCArIHN0ci5zdWJzdHIoaW5kZXggKyAxKTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc19pbmxpbmVzKHRva2Vucywgc3RhdGUpIHtcbiAgdmFyIGksIHRva2VuLCB0ZXh0LCB0LCBwb3MsIG1heCwgdGhpc0xldmVsLCBpdGVtLCBsYXN0Q2hhciwgbmV4dENoYXIsXG4gICAgICBpc0xhc3RQdW5jdENoYXIsIGlzTmV4dFB1bmN0Q2hhciwgaXNMYXN0V2hpdGVTcGFjZSwgaXNOZXh0V2hpdGVTcGFjZSxcbiAgICAgIGNhbk9wZW4sIGNhbkNsb3NlLCBqLCBpc1NpbmdsZSwgc3RhY2ssIG9wZW5RdW90ZSwgY2xvc2VRdW90ZTtcblxuICBzdGFjayA9IFtdO1xuXG4gIGZvciAoaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICB0b2tlbiA9IHRva2Vuc1tpXTtcblxuICAgIHRoaXNMZXZlbCA9IHRva2Vuc1tpXS5sZXZlbDtcblxuICAgIGZvciAoaiA9IHN0YWNrLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICBpZiAoc3RhY2tbal0ubGV2ZWwgPD0gdGhpc0xldmVsKSB7IGJyZWFrOyB9XG4gICAgfVxuICAgIHN0YWNrLmxlbmd0aCA9IGogKyAxO1xuXG4gICAgaWYgKHRva2VuLnR5cGUgIT09ICd0ZXh0JykgeyBjb250aW51ZTsgfVxuXG4gICAgdGV4dCA9IHRva2VuLmNvbnRlbnQ7XG4gICAgcG9zID0gMDtcbiAgICBtYXggPSB0ZXh0Lmxlbmd0aDtcblxuICAgIC8qZXNsaW50IG5vLWxhYmVsczowLGJsb2NrLXNjb3BlZC12YXI6MCovXG4gICAgT1VURVI6XG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgUVVPVEVfUkUubGFzdEluZGV4ID0gcG9zO1xuICAgICAgdCA9IFFVT1RFX1JFLmV4ZWModGV4dCk7XG4gICAgICBpZiAoIXQpIHsgYnJlYWs7IH1cblxuICAgICAgY2FuT3BlbiA9IGNhbkNsb3NlID0gdHJ1ZTtcbiAgICAgIHBvcyA9IHQuaW5kZXggKyAxO1xuICAgICAgaXNTaW5nbGUgPSAodFswXSA9PT0gXCInXCIpO1xuXG4gICAgICAvLyBGaW5kIHByZXZpb3VzIGNoYXJhY3RlcixcbiAgICAgIC8vIGRlZmF1bHQgdG8gc3BhY2UgaWYgaXQncyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lXG4gICAgICAvL1xuICAgICAgbGFzdENoYXIgPSAweDIwO1xuXG4gICAgICBpZiAodC5pbmRleCAtIDEgPj0gMCkge1xuICAgICAgICBsYXN0Q2hhciA9IHRleHQuY2hhckNvZGVBdCh0LmluZGV4IC0gMSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGogPSBpIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICBpZiAodG9rZW5zW2pdLnR5cGUgIT09ICd0ZXh0JykgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgbGFzdENoYXIgPSB0b2tlbnNbal0uY29udGVudC5jaGFyQ29kZUF0KHRva2Vuc1tqXS5jb250ZW50Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZpbmQgbmV4dCBjaGFyYWN0ZXIsXG4gICAgICAvLyBkZWZhdWx0IHRvIHNwYWNlIGlmIGl0J3MgdGhlIGVuZCBvZiB0aGUgbGluZVxuICAgICAgLy9cbiAgICAgIG5leHRDaGFyID0gMHgyMDtcblxuICAgICAgaWYgKHBvcyA8IG1heCkge1xuICAgICAgICBuZXh0Q2hhciA9IHRleHQuY2hhckNvZGVBdChwb3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gaSArIDE7IGogPCB0b2tlbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAodG9rZW5zW2pdLnR5cGUgIT09ICd0ZXh0JykgeyBjb250aW51ZTsgfVxuXG4gICAgICAgICAgbmV4dENoYXIgPSB0b2tlbnNbal0uY29udGVudC5jaGFyQ29kZUF0KDApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlzTGFzdFB1bmN0Q2hhciA9IGlzTWRBc2NpaVB1bmN0KGxhc3RDaGFyKSB8fCBpc1B1bmN0Q2hhcihTdHJpbmcuZnJvbUNoYXJDb2RlKGxhc3RDaGFyKSk7XG4gICAgICBpc05leHRQdW5jdENoYXIgPSBpc01kQXNjaWlQdW5jdChuZXh0Q2hhcikgfHwgaXNQdW5jdENoYXIoU3RyaW5nLmZyb21DaGFyQ29kZShuZXh0Q2hhcikpO1xuXG4gICAgICBpc0xhc3RXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKGxhc3RDaGFyKTtcbiAgICAgIGlzTmV4dFdoaXRlU3BhY2UgPSBpc1doaXRlU3BhY2UobmV4dENoYXIpO1xuXG4gICAgICBpZiAoaXNOZXh0V2hpdGVTcGFjZSkge1xuICAgICAgICBjYW5PcGVuID0gZmFsc2U7XG4gICAgICB9IGVsc2UgaWYgKGlzTmV4dFB1bmN0Q2hhcikge1xuICAgICAgICBpZiAoIShpc0xhc3RXaGl0ZVNwYWNlIHx8IGlzTGFzdFB1bmN0Q2hhcikpIHtcbiAgICAgICAgICBjYW5PcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzTGFzdFdoaXRlU3BhY2UpIHtcbiAgICAgICAgY2FuQ2xvc2UgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNMYXN0UHVuY3RDaGFyKSB7XG4gICAgICAgIGlmICghKGlzTmV4dFdoaXRlU3BhY2UgfHwgaXNOZXh0UHVuY3RDaGFyKSkge1xuICAgICAgICAgIGNhbkNsb3NlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5leHRDaGFyID09PSAweDIyIC8qIFwiICovICYmIHRbMF0gPT09ICdcIicpIHtcbiAgICAgICAgaWYgKGxhc3RDaGFyID49IDB4MzAgLyogMCAqLyAmJiBsYXN0Q2hhciA8PSAweDM5IC8qIDkgKi8pIHtcbiAgICAgICAgICAvLyBzcGVjaWFsIGNhc2U6IDFcIlwiIC0gY291bnQgZmlyc3QgcXVvdGUgYXMgYW4gaW5jaFxuICAgICAgICAgIGNhbkNsb3NlID0gY2FuT3BlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5PcGVuICYmIGNhbkNsb3NlKSB7XG4gICAgICAgIC8vIHRyZWF0IHRoaXMgYXMgdGhlIG1pZGRsZSBvZiB0aGUgd29yZFxuICAgICAgICBjYW5PcGVuID0gZmFsc2U7XG4gICAgICAgIGNhbkNsb3NlID0gaXNOZXh0UHVuY3RDaGFyO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWNhbk9wZW4gJiYgIWNhbkNsb3NlKSB7XG4gICAgICAgIC8vIG1pZGRsZSBvZiB3b3JkXG4gICAgICAgIGlmIChpc1NpbmdsZSkge1xuICAgICAgICAgIHRva2VuLmNvbnRlbnQgPSByZXBsYWNlQXQodG9rZW4uY29udGVudCwgdC5pbmRleCwgQVBPU1RST1BIRSk7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5DbG9zZSkge1xuICAgICAgICAvLyB0aGlzIGNvdWxkIGJlIGEgY2xvc2luZyBxdW90ZSwgcmV3aW5kIHRoZSBzdGFjayB0byBnZXQgYSBtYXRjaFxuICAgICAgICBmb3IgKGogPSBzdGFjay5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgIGl0ZW0gPSBzdGFja1tqXTtcbiAgICAgICAgICBpZiAoc3RhY2tbal0ubGV2ZWwgPCB0aGlzTGV2ZWwpIHsgYnJlYWs7IH1cbiAgICAgICAgICBpZiAoaXRlbS5zaW5nbGUgPT09IGlzU2luZ2xlICYmIHN0YWNrW2pdLmxldmVsID09PSB0aGlzTGV2ZWwpIHtcbiAgICAgICAgICAgIGl0ZW0gPSBzdGFja1tqXTtcblxuICAgICAgICAgICAgaWYgKGlzU2luZ2xlKSB7XG4gICAgICAgICAgICAgIG9wZW5RdW90ZSA9IHN0YXRlLm1kLm9wdGlvbnMucXVvdGVzWzJdO1xuICAgICAgICAgICAgICBjbG9zZVF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbM107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBvcGVuUXVvdGUgPSBzdGF0ZS5tZC5vcHRpb25zLnF1b3Rlc1swXTtcbiAgICAgICAgICAgICAgY2xvc2VRdW90ZSA9IHN0YXRlLm1kLm9wdGlvbnMucXVvdGVzWzFdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyByZXBsYWNlIHRva2VuLmNvbnRlbnQgKmJlZm9yZSogdG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQsXG4gICAgICAgICAgICAvLyBiZWNhdXNlLCBpZiB0aGV5IGFyZSBwb2ludGluZyBhdCB0aGUgc2FtZSB0b2tlbiwgcmVwbGFjZUF0XG4gICAgICAgICAgICAvLyBjb3VsZCBtZXNzIHVwIGluZGljZXMgd2hlbiBxdW90ZSBsZW5ndGggIT0gMVxuICAgICAgICAgICAgdG9rZW4uY29udGVudCA9IHJlcGxhY2VBdCh0b2tlbi5jb250ZW50LCB0LmluZGV4LCBjbG9zZVF1b3RlKTtcbiAgICAgICAgICAgIHRva2Vuc1tpdGVtLnRva2VuXS5jb250ZW50ID0gcmVwbGFjZUF0KFxuICAgICAgICAgICAgICB0b2tlbnNbaXRlbS50b2tlbl0uY29udGVudCwgaXRlbS5wb3MsIG9wZW5RdW90ZSk7XG5cbiAgICAgICAgICAgIHBvcyArPSBjbG9zZVF1b3RlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICBpZiAoaXRlbS50b2tlbiA9PT0gaSkgeyBwb3MgKz0gb3BlblF1b3RlLmxlbmd0aCAtIDE7IH1cblxuICAgICAgICAgICAgdGV4dCA9IHRva2VuLmNvbnRlbnQ7XG4gICAgICAgICAgICBtYXggPSB0ZXh0Lmxlbmd0aDtcblxuICAgICAgICAgICAgc3RhY2subGVuZ3RoID0gajtcbiAgICAgICAgICAgIGNvbnRpbnVlIE9VVEVSO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2FuT3Blbikge1xuICAgICAgICBzdGFjay5wdXNoKHtcbiAgICAgICAgICB0b2tlbjogaSxcbiAgICAgICAgICBwb3M6IHQuaW5kZXgsXG4gICAgICAgICAgc2luZ2xlOiBpc1NpbmdsZSxcbiAgICAgICAgICBsZXZlbDogdGhpc0xldmVsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChjYW5DbG9zZSAmJiBpc1NpbmdsZSkge1xuICAgICAgICB0b2tlbi5jb250ZW50ID0gcmVwbGFjZUF0KHRva2VuLmNvbnRlbnQsIHQuaW5kZXgsIEFQT1NUUk9QSEUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gc21hcnRxdW90ZXMoc3RhdGUpIHtcbiAgLyplc2xpbnQgbWF4LWRlcHRoOjAqL1xuICB2YXIgYmxrSWR4O1xuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy50eXBvZ3JhcGhlcikgeyByZXR1cm47IH1cblxuICBmb3IgKGJsa0lkeCA9IHN0YXRlLnRva2Vucy5sZW5ndGggLSAxOyBibGtJZHggPj0gMDsgYmxrSWR4LS0pIHtcblxuICAgIGlmIChzdGF0ZS50b2tlbnNbYmxrSWR4XS50eXBlICE9PSAnaW5saW5lJyB8fFxuICAgICAgICAhUVVPVEVfVEVTVF9SRS50ZXN0KHN0YXRlLnRva2Vuc1tibGtJZHhdLmNvbnRlbnQpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBwcm9jZXNzX2lubGluZXMoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY2hpbGRyZW4sIHN0YXRlKTtcbiAgfVxufTtcbiIsIi8vIENvcmUgc3RhdGUgb2JqZWN0XG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuLi90b2tlbicpO1xuXG5cbmZ1bmN0aW9uIFN0YXRlQ29yZShzcmMsIG1kLCBlbnYpIHtcbiAgdGhpcy5zcmMgPSBzcmM7XG4gIHRoaXMuZW52ID0gZW52O1xuICB0aGlzLnRva2VucyA9IFtdO1xuICB0aGlzLmlubGluZU1vZGUgPSBmYWxzZTtcbiAgdGhpcy5tZCA9IG1kOyAvLyBsaW5rIHRvIHBhcnNlciBpbnN0YW5jZVxufVxuXG4vLyByZS1leHBvcnQgVG9rZW4gY2xhc3MgdG8gdXNlIGluIGNvcmUgcnVsZXNcblN0YXRlQ29yZS5wcm90b3R5cGUuVG9rZW4gPSBUb2tlbjtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlQ29yZTtcbiIsIi8vIFByb2Nlc3MgYXV0b2xpbmtzICc8cHJvdG9jb2w6Li4uPidcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbi8qZXNsaW50IG1heC1sZW46MCovXG52YXIgRU1BSUxfUkUgICAgPSAvXjwoW2EtekEtWjAtOS4hIyQlJicqK1xcLz0/Xl9ge3x9fi1dK0BbYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8oPzpcXC5bYS16QS1aMC05XSg/OlthLXpBLVowLTktXXswLDYxfVthLXpBLVowLTldKT8pKik+LztcbnZhciBBVVRPTElOS19SRSA9IC9ePChbYS16QS1aXVthLXpBLVowLTkrLlxcLV17MSwzMX0pOihbXjw+XFx4MDAtXFx4MjBdKik+LztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGF1dG9saW5rKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHRhaWwsIGxpbmtNYXRjaCwgZW1haWxNYXRjaCwgdXJsLCBmdWxsVXJsLCB0b2tlbixcbiAgICAgIHBvcyA9IHN0YXRlLnBvcztcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQy8qIDwgKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgdGFpbCA9IHN0YXRlLnNyYy5zbGljZShwb3MpO1xuXG4gIGlmICh0YWlsLmluZGV4T2YoJz4nKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKEFVVE9MSU5LX1JFLnRlc3QodGFpbCkpIHtcbiAgICBsaW5rTWF0Y2ggPSB0YWlsLm1hdGNoKEFVVE9MSU5LX1JFKTtcblxuICAgIHVybCA9IGxpbmtNYXRjaFswXS5zbGljZSgxLCAtMSk7XG4gICAgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsodXJsKTtcbiAgICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIGlmICghc2lsZW50KSB7XG4gICAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgnbGlua19vcGVuJywgJ2EnLCAxKTtcbiAgICAgIHRva2VuLmF0dHJzICAgPSBbIFsgJ2hyZWYnLCBmdWxsVXJsIF0gXTtcbiAgICAgIHRva2VuLm1hcmt1cCAgPSAnYXV0b2xpbmsnO1xuICAgICAgdG9rZW4uaW5mbyAgICA9ICdhdXRvJztcblxuICAgICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMCk7XG4gICAgICB0b2tlbi5jb250ZW50ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsKTtcblxuICAgICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ2xpbmtfY2xvc2UnLCAnYScsIC0xKTtcbiAgICAgIHRva2VuLm1hcmt1cCAgPSAnYXV0b2xpbmsnO1xuICAgICAgdG9rZW4uaW5mbyAgICA9ICdhdXRvJztcbiAgICB9XG5cbiAgICBzdGF0ZS5wb3MgKz0gbGlua01hdGNoWzBdLmxlbmd0aDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmIChFTUFJTF9SRS50ZXN0KHRhaWwpKSB7XG4gICAgZW1haWxNYXRjaCA9IHRhaWwubWF0Y2goRU1BSUxfUkUpO1xuXG4gICAgdXJsID0gZW1haWxNYXRjaFswXS5zbGljZSgxLCAtMSk7XG4gICAgZnVsbFVybCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsoJ21haWx0bzonICsgdXJsKTtcbiAgICBpZiAoIXN0YXRlLm1kLnZhbGlkYXRlTGluayhmdWxsVXJsKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIGlmICghc2lsZW50KSB7XG4gICAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgnbGlua19vcGVuJywgJ2EnLCAxKTtcbiAgICAgIHRva2VuLmF0dHJzICAgPSBbIFsgJ2hyZWYnLCBmdWxsVXJsIF0gXTtcbiAgICAgIHRva2VuLm1hcmt1cCAgPSAnYXV0b2xpbmsnO1xuICAgICAgdG9rZW4uaW5mbyAgICA9ICdhdXRvJztcblxuICAgICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMCk7XG4gICAgICB0b2tlbi5jb250ZW50ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsKTtcblxuICAgICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ2xpbmtfY2xvc2UnLCAnYScsIC0xKTtcbiAgICAgIHRva2VuLm1hcmt1cCAgPSAnYXV0b2xpbmsnO1xuICAgICAgdG9rZW4uaW5mbyAgICA9ICdhdXRvJztcbiAgICB9XG5cbiAgICBzdGF0ZS5wb3MgKz0gZW1haWxNYXRjaFswXS5sZW5ndGg7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuIiwiLy8gUGFyc2UgYmFja3RpY2tzXG5cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBiYWNrdGljayhzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBzdGFydCwgbWF4LCBtYXJrZXIsIG1hdGNoU3RhcnQsIG1hdGNoRW5kLCB0b2tlbixcbiAgICAgIHBvcyA9IHN0YXRlLnBvcyxcbiAgICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICBpZiAoY2ggIT09IDB4NjAvKiBgICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHN0YXJ0ID0gcG9zO1xuICBwb3MrKztcbiAgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIHdoaWxlIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg2MC8qIGAgKi8pIHsgcG9zKys7IH1cblxuICBtYXJrZXIgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbiAgbWF0Y2hTdGFydCA9IG1hdGNoRW5kID0gcG9zO1xuXG4gIHdoaWxlICgobWF0Y2hTdGFydCA9IHN0YXRlLnNyYy5pbmRleE9mKCdgJywgbWF0Y2hFbmQpKSAhPT0gLTEpIHtcbiAgICBtYXRjaEVuZCA9IG1hdGNoU3RhcnQgKyAxO1xuXG4gICAgd2hpbGUgKG1hdGNoRW5kIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KG1hdGNoRW5kKSA9PT0gMHg2MC8qIGAgKi8pIHsgbWF0Y2hFbmQrKzsgfVxuXG4gICAgaWYgKG1hdGNoRW5kIC0gbWF0Y2hTdGFydCA9PT0gbWFya2VyLmxlbmd0aCkge1xuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ2NvZGVfaW5saW5lJywgJ2NvZGUnLCAwKTtcbiAgICAgICAgdG9rZW4ubWFya3VwICA9IG1hcmtlcjtcbiAgICAgICAgdG9rZW4uY29udGVudCA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1hdGNoU3RhcnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvWyBcXG5dKy9nLCAnICcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudHJpbSgpO1xuICAgICAgfVxuICAgICAgc3RhdGUucG9zID0gbWF0Y2hFbmQ7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IG1hcmtlcjsgfVxuICBzdGF0ZS5wb3MgKz0gbWFya2VyLmxlbmd0aDtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gRm9yIGVhY2ggb3BlbmluZyBlbXBoYXNpcy1saWtlIG1hcmtlciBmaW5kIGEgbWF0Y2hpbmcgY2xvc2luZyBvbmVcbi8vXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsaW5rX3BhaXJzKHN0YXRlKSB7XG4gIHZhciBpLCBqLCBsYXN0RGVsaW0sIGN1cnJEZWxpbSxcbiAgICAgIGRlbGltaXRlcnMgPSBzdGF0ZS5kZWxpbWl0ZXJzLFxuICAgICAgbWF4ID0gc3RhdGUuZGVsaW1pdGVycy5sZW5ndGg7XG5cbiAgZm9yIChpID0gMDsgaSA8IG1heDsgaSsrKSB7XG4gICAgbGFzdERlbGltID0gZGVsaW1pdGVyc1tpXTtcblxuICAgIGlmICghbGFzdERlbGltLmNsb3NlKSB7IGNvbnRpbnVlOyB9XG5cbiAgICBqID0gaSAtIGxhc3REZWxpbS5qdW1wIC0gMTtcblxuICAgIHdoaWxlIChqID49IDApIHtcbiAgICAgIGN1cnJEZWxpbSA9IGRlbGltaXRlcnNbal07XG5cbiAgICAgIGlmIChjdXJyRGVsaW0ub3BlbiAmJlxuICAgICAgICAgIGN1cnJEZWxpbS5tYXJrZXIgPT09IGxhc3REZWxpbS5tYXJrZXIgJiZcbiAgICAgICAgICBjdXJyRGVsaW0uZW5kIDwgMCAmJlxuICAgICAgICAgIGN1cnJEZWxpbS5sZXZlbCA9PT0gbGFzdERlbGltLmxldmVsKSB7XG5cbiAgICAgICAgLy8gdHlwZW9mcyBhcmUgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgd2l0aCBwbHVnaW5zXG4gICAgICAgIHZhciBvZGRfbWF0Y2ggPSAoY3VyckRlbGltLmNsb3NlIHx8IGxhc3REZWxpbS5vcGVuKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mIGN1cnJEZWxpbS5sZW5ndGggIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgbGFzdERlbGltLmxlbmd0aCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIChjdXJyRGVsaW0ubGVuZ3RoICsgbGFzdERlbGltLmxlbmd0aCkgJSAzID09PSAwO1xuXG4gICAgICAgIGlmICghb2RkX21hdGNoKSB7XG4gICAgICAgICAgbGFzdERlbGltLmp1bXAgPSBpIC0gajtcbiAgICAgICAgICBsYXN0RGVsaW0ub3BlbiA9IGZhbHNlO1xuICAgICAgICAgIGN1cnJEZWxpbS5lbmQgID0gaTtcbiAgICAgICAgICBjdXJyRGVsaW0uanVtcCA9IDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaiAtPSBjdXJyRGVsaW0uanVtcCArIDE7XG4gICAgfVxuICB9XG59O1xuIiwiLy8gUHJvY2VzcyAqdGhpcyogYW5kIF90aGF0X1xuLy9cbid1c2Ugc3RyaWN0JztcblxuXG4vLyBJbnNlcnQgZWFjaCBtYXJrZXIgYXMgYSBzZXBhcmF0ZSB0ZXh0IHRva2VuLCBhbmQgYWRkIGl0IHRvIGRlbGltaXRlciBsaXN0XG4vL1xubW9kdWxlLmV4cG9ydHMudG9rZW5pemUgPSBmdW5jdGlvbiBlbXBoYXNpcyhzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBpLCBzY2FubmVkLCB0b2tlbixcbiAgICAgIHN0YXJ0ID0gc3RhdGUucG9zLFxuICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpO1xuXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKG1hcmtlciAhPT0gMHg1RiAvKiBfICovICYmIG1hcmtlciAhPT0gMHgyQSAvKiAqICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHNjYW5uZWQgPSBzdGF0ZS5zY2FuRGVsaW1zKHN0YXRlLnBvcywgbWFya2VyID09PSAweDJBKTtcblxuICBmb3IgKGkgPSAwOyBpIDwgc2Nhbm5lZC5sZW5ndGg7IGkrKykge1xuICAgIHRva2VuICAgICAgICAgPSBzdGF0ZS5wdXNoKCd0ZXh0JywgJycsIDApO1xuICAgIHRva2VuLmNvbnRlbnQgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcik7XG5cbiAgICBzdGF0ZS5kZWxpbWl0ZXJzLnB1c2goe1xuICAgICAgLy8gQ2hhciBjb2RlIG9mIHRoZSBzdGFydGluZyBtYXJrZXIgKG51bWJlcikuXG4gICAgICAvL1xuICAgICAgbWFya2VyOiBtYXJrZXIsXG5cbiAgICAgIC8vIFRvdGFsIGxlbmd0aCBvZiB0aGVzZSBzZXJpZXMgb2YgZGVsaW1pdGVycy5cbiAgICAgIC8vXG4gICAgICBsZW5ndGg6IHNjYW5uZWQubGVuZ3RoLFxuXG4gICAgICAvLyBBbiBhbW91bnQgb2YgY2hhcmFjdGVycyBiZWZvcmUgdGhpcyBvbmUgdGhhdCdzIGVxdWl2YWxlbnQgdG9cbiAgICAgIC8vIGN1cnJlbnQgb25lLiBJbiBwbGFpbiBFbmdsaXNoOiBpZiB0aGlzIGRlbGltaXRlciBkb2VzIG5vdCBvcGVuXG4gICAgICAvLyBhbiBlbXBoYXNpcywgbmVpdGhlciBkbyBwcmV2aW91cyBganVtcGAgY2hhcmFjdGVycy5cbiAgICAgIC8vXG4gICAgICAvLyBVc2VkIHRvIHNraXAgc2VxdWVuY2VzIGxpa2UgXCIqKioqKlwiIGluIG9uZSBzdGVwLCBmb3IgMXN0IGFzdGVyaXNrXG4gICAgICAvLyB2YWx1ZSB3aWxsIGJlIDAsIGZvciAybmQgaXQncyAxIGFuZCBzbyBvbi5cbiAgICAgIC8vXG4gICAgICBqdW1wOiAgIGksXG5cbiAgICAgIC8vIEEgcG9zaXRpb24gb2YgdGhlIHRva2VuIHRoaXMgZGVsaW1pdGVyIGNvcnJlc3BvbmRzIHRvLlxuICAgICAgLy9cbiAgICAgIHRva2VuOiAgc3RhdGUudG9rZW5zLmxlbmd0aCAtIDEsXG5cbiAgICAgIC8vIFRva2VuIGxldmVsLlxuICAgICAgLy9cbiAgICAgIGxldmVsOiAgc3RhdGUubGV2ZWwsXG5cbiAgICAgIC8vIElmIHRoaXMgZGVsaW1pdGVyIGlzIG1hdGNoZWQgYXMgYSB2YWxpZCBvcGVuZXIsIGBlbmRgIHdpbGwgYmVcbiAgICAgIC8vIGVxdWFsIHRvIGl0cyBwb3NpdGlvbiwgb3RoZXJ3aXNlIGl0J3MgYC0xYC5cbiAgICAgIC8vXG4gICAgICBlbmQ6ICAgIC0xLFxuXG4gICAgICAvLyBCb29sZWFuIGZsYWdzIHRoYXQgZGV0ZXJtaW5lIGlmIHRoaXMgZGVsaW1pdGVyIGNvdWxkIG9wZW4gb3IgY2xvc2VcbiAgICAgIC8vIGFuIGVtcGhhc2lzLlxuICAgICAgLy9cbiAgICAgIG9wZW46ICAgc2Nhbm5lZC5jYW5fb3BlbixcbiAgICAgIGNsb3NlOiAgc2Nhbm5lZC5jYW5fY2xvc2VcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRlLnBvcyArPSBzY2FubmVkLmxlbmd0aDtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuLy8gV2FsayB0aHJvdWdoIGRlbGltaXRlciBsaXN0IGFuZCByZXBsYWNlIHRleHQgdG9rZW5zIHdpdGggdGFnc1xuLy9cbm1vZHVsZS5leHBvcnRzLnBvc3RQcm9jZXNzID0gZnVuY3Rpb24gZW1waGFzaXMoc3RhdGUpIHtcbiAgdmFyIGksXG4gICAgICBzdGFydERlbGltLFxuICAgICAgZW5kRGVsaW0sXG4gICAgICB0b2tlbixcbiAgICAgIGNoLFxuICAgICAgaXNTdHJvbmcsXG4gICAgICBkZWxpbWl0ZXJzID0gc3RhdGUuZGVsaW1pdGVycyxcbiAgICAgIG1heCA9IHN0YXRlLmRlbGltaXRlcnMubGVuZ3RoO1xuXG4gIGZvciAoaSA9IG1heCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgc3RhcnREZWxpbSA9IGRlbGltaXRlcnNbaV07XG5cbiAgICBpZiAoc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4NUYvKiBfICovICYmIHN0YXJ0RGVsaW0ubWFya2VyICE9PSAweDJBLyogKiAqLykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gUHJvY2VzcyBvbmx5IG9wZW5pbmcgbWFya2Vyc1xuICAgIGlmIChzdGFydERlbGltLmVuZCA9PT0gLTEpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGVuZERlbGltID0gZGVsaW1pdGVyc1tzdGFydERlbGltLmVuZF07XG5cbiAgICAvLyBJZiB0aGUgcHJldmlvdXMgZGVsaW1pdGVyIGhhcyB0aGUgc2FtZSBtYXJrZXIgYW5kIGlzIGFkamFjZW50IHRvIHRoaXMgb25lLFxuICAgIC8vIG1lcmdlIHRob3NlIGludG8gb25lIHN0cm9uZyBkZWxpbWl0ZXIuXG4gICAgLy9cbiAgICAvLyBgPGVtPjxlbT53aGF0ZXZlcjwvZW0+PC9lbT5gIC0+IGA8c3Ryb25nPndoYXRldmVyPC9zdHJvbmc+YFxuICAgIC8vXG4gICAgaXNTdHJvbmcgPSBpID4gMCAmJlxuICAgICAgICAgICAgICAgZGVsaW1pdGVyc1tpIC0gMV0uZW5kID09PSBzdGFydERlbGltLmVuZCArIDEgJiZcbiAgICAgICAgICAgICAgIGRlbGltaXRlcnNbaSAtIDFdLnRva2VuID09PSBzdGFydERlbGltLnRva2VuIC0gMSAmJlxuICAgICAgICAgICAgICAgZGVsaW1pdGVyc1tzdGFydERlbGltLmVuZCArIDFdLnRva2VuID09PSBlbmREZWxpbS50b2tlbiArIDEgJiZcbiAgICAgICAgICAgICAgIGRlbGltaXRlcnNbaSAtIDFdLm1hcmtlciA9PT0gc3RhcnREZWxpbS5tYXJrZXI7XG5cbiAgICBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoc3RhcnREZWxpbS5tYXJrZXIpO1xuXG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnRva2Vuc1tzdGFydERlbGltLnRva2VuXTtcbiAgICB0b2tlbi50eXBlICAgID0gaXNTdHJvbmcgPyAnc3Ryb25nX29wZW4nIDogJ2VtX29wZW4nO1xuICAgIHRva2VuLnRhZyAgICAgPSBpc1N0cm9uZyA/ICdzdHJvbmcnIDogJ2VtJztcbiAgICB0b2tlbi5uZXN0aW5nID0gMTtcbiAgICB0b2tlbi5tYXJrdXAgID0gaXNTdHJvbmcgPyBjaCArIGNoIDogY2g7XG4gICAgdG9rZW4uY29udGVudCA9ICcnO1xuXG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnRva2Vuc1tlbmREZWxpbS50b2tlbl07XG4gICAgdG9rZW4udHlwZSAgICA9IGlzU3Ryb25nID8gJ3N0cm9uZ19jbG9zZScgOiAnZW1fY2xvc2UnO1xuICAgIHRva2VuLnRhZyAgICAgPSBpc1N0cm9uZyA/ICdzdHJvbmcnIDogJ2VtJztcbiAgICB0b2tlbi5uZXN0aW5nID0gLTE7XG4gICAgdG9rZW4ubWFya3VwICA9IGlzU3Ryb25nID8gY2ggKyBjaCA6IGNoO1xuICAgIHRva2VuLmNvbnRlbnQgPSAnJztcblxuICAgIGlmIChpc1N0cm9uZykge1xuICAgICAgc3RhdGUudG9rZW5zW2RlbGltaXRlcnNbaSAtIDFdLnRva2VuXS5jb250ZW50ID0gJyc7XG4gICAgICBzdGF0ZS50b2tlbnNbZGVsaW1pdGVyc1tzdGFydERlbGltLmVuZCArIDFdLnRva2VuXS5jb250ZW50ID0gJyc7XG4gICAgICBpLS07XG4gICAgfVxuICB9XG59O1xuIiwiLy8gUHJvY2VzcyBodG1sIGVudGl0eSAtICYjMTIzOywgJiN4QUY7LCAmcXVvdDssIC4uLlxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbnRpdGllcyAgICAgICAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi9lbnRpdGllcycpO1xudmFyIGhhcyAgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaGFzO1xudmFyIGlzVmFsaWRFbnRpdHlDb2RlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNWYWxpZEVudGl0eUNvZGU7XG52YXIgZnJvbUNvZGVQb2ludCAgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5mcm9tQ29kZVBvaW50O1xuXG5cbnZhciBESUdJVEFMX1JFID0gL14mIygoPzp4W2EtZjAtOV17MSw4fXxbMC05XXsxLDh9KSk7L2k7XG52YXIgTkFNRURfUkUgICA9IC9eJihbYS16XVthLXowLTldezEsMzF9KTsvaTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVudGl0eShzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBjaCwgY29kZSwgbWF0Y2gsIHBvcyA9IHN0YXRlLnBvcywgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI2LyogJiAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAocG9zICsgMSA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zICsgMSk7XG5cbiAgICBpZiAoY2ggPT09IDB4MjMgLyogIyAqLykge1xuICAgICAgbWF0Y2ggPSBzdGF0ZS5zcmMuc2xpY2UocG9zKS5tYXRjaChESUdJVEFMX1JFKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICAgIGNvZGUgPSBtYXRjaFsxXVswXS50b0xvd2VyQ2FzZSgpID09PSAneCcgPyBwYXJzZUludChtYXRjaFsxXS5zbGljZSgxKSwgMTYpIDogcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgICBzdGF0ZS5wZW5kaW5nICs9IGlzVmFsaWRFbnRpdHlDb2RlKGNvZGUpID8gZnJvbUNvZGVQb2ludChjb2RlKSA6IGZyb21Db2RlUG9pbnQoMHhGRkZEKTtcbiAgICAgICAgfVxuICAgICAgICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbWF0Y2ggPSBzdGF0ZS5zcmMuc2xpY2UocG9zKS5tYXRjaChOQU1FRF9SRSk7XG4gICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgaWYgKGhhcyhlbnRpdGllcywgbWF0Y2hbMV0pKSB7XG4gICAgICAgICAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBlbnRpdGllc1ttYXRjaFsxXV07IH1cbiAgICAgICAgICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSAnJic7IH1cbiAgc3RhdGUucG9zKys7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgZXNjYXBlZCBjaGFycyBhbmQgaGFyZGJyZWFrc1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxudmFyIEVTQ0FQRUQgPSBbXTtcblxuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7IGkrKykgeyBFU0NBUEVELnB1c2goMCk7IH1cblxuJ1xcXFwhXCIjJCUmXFwnKCkqKywuLzo7PD0+P0BbXV5fYHt8fX4tJ1xuICAuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGNoKSB7IEVTQ0FQRURbY2guY2hhckNvZGVBdCgwKV0gPSAxOyB9KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGVzY2FwZShzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBjaCwgcG9zID0gc3RhdGUucG9zLCBtYXggPSBzdGF0ZS5wb3NNYXg7XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4NUMvKiBcXCAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MrKztcblxuICBpZiAocG9zIDwgbWF4KSB7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gICAgaWYgKGNoIDwgMjU2ICYmIEVTQ0FQRURbY2hdICE9PSAwKSB7XG4gICAgICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyY1twb3NdOyB9XG4gICAgICBzdGF0ZS5wb3MgKz0gMjtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChjaCA9PT0gMHgwQSkge1xuICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgc3RhdGUucHVzaCgnaGFyZGJyZWFrJywgJ2JyJywgMCk7XG4gICAgICB9XG5cbiAgICAgIHBvcysrO1xuICAgICAgLy8gc2tpcCBsZWFkaW5nIHdoaXRlc3BhY2VzIGZyb20gbmV4dCBsaW5lXG4gICAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKCFpc1NwYWNlKGNoKSkgeyBicmVhazsgfVxuICAgICAgICBwb3MrKztcbiAgICAgIH1cblxuICAgICAgc3RhdGUucG9zID0gcG9zO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSAnXFxcXCc7IH1cbiAgc3RhdGUucG9zKys7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgaHRtbCB0YWdzXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgSFRNTF9UQUdfUkUgPSByZXF1aXJlKCcuLi9jb21tb24vaHRtbF9yZScpLkhUTUxfVEFHX1JFO1xuXG5cbmZ1bmN0aW9uIGlzTGV0dGVyKGNoKSB7XG4gIC8qZXNsaW50IG5vLWJpdHdpc2U6MCovXG4gIHZhciBsYyA9IGNoIHwgMHgyMDsgLy8gdG8gbG93ZXIgY2FzZVxuICByZXR1cm4gKGxjID49IDB4NjEvKiBhICovKSAmJiAobGMgPD0gMHg3YS8qIHogKi8pO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaHRtbF9pbmxpbmUoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgY2gsIG1hdGNoLCBtYXgsIHRva2VuLFxuICAgICAgcG9zID0gc3RhdGUucG9zO1xuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy5odG1sKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIENoZWNrIHN0YXJ0XG4gIG1heCA9IHN0YXRlLnBvc01heDtcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4M0MvKiA8ICovIHx8XG4gICAgICBwb3MgKyAyID49IG1heCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFF1aWNrIGZhaWwgb24gc2Vjb25kIGNoYXJcbiAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MgKyAxKTtcbiAgaWYgKGNoICE9PSAweDIxLyogISAqLyAmJlxuICAgICAgY2ggIT09IDB4M0YvKiA/ICovICYmXG4gICAgICBjaCAhPT0gMHgyRi8qIC8gKi8gJiZcbiAgICAgICFpc0xldHRlcihjaCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLm1hdGNoKEhUTUxfVEFHX1JFKTtcbiAgaWYgKCFtYXRjaCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoIXNpbGVudCkge1xuICAgIHRva2VuICAgICAgICAgPSBzdGF0ZS5wdXNoKCdodG1sX2lubGluZScsICcnLCAwKTtcbiAgICB0b2tlbi5jb250ZW50ID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgcG9zICsgbWF0Y2hbMF0ubGVuZ3RoKTtcbiAgfVxuICBzdGF0ZS5wb3MgKz0gbWF0Y2hbMF0ubGVuZ3RoO1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQcm9jZXNzICFbaW1hZ2VdKDxzcmM+IFwidGl0bGVcIilcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgbm9ybWFsaXplUmVmZXJlbmNlICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5ub3JtYWxpemVSZWZlcmVuY2U7XG52YXIgaXNTcGFjZSAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW1hZ2Uoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgYXR0cnMsXG4gICAgICBjb2RlLFxuICAgICAgY29udGVudCxcbiAgICAgIGxhYmVsLFxuICAgICAgbGFiZWxFbmQsXG4gICAgICBsYWJlbFN0YXJ0LFxuICAgICAgcG9zLFxuICAgICAgcmVmLFxuICAgICAgcmVzLFxuICAgICAgdGl0bGUsXG4gICAgICB0b2tlbixcbiAgICAgIHRva2VucyxcbiAgICAgIHN0YXJ0LFxuICAgICAgaHJlZiA9ICcnLFxuICAgICAgb2xkUG9zID0gc3RhdGUucG9zLFxuICAgICAgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpICE9PSAweDIxLyogISAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyArIDEpICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBsYWJlbFN0YXJ0ID0gc3RhdGUucG9zICsgMjtcbiAgbGFiZWxFbmQgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0xhYmVsKHN0YXRlLCBzdGF0ZS5wb3MgKyAxLCBmYWxzZSk7XG5cbiAgLy8gcGFyc2VyIGZhaWxlZCB0byBmaW5kICddJywgc28gaXQncyBub3QgYSB2YWxpZCBsaW5rXG4gIGlmIChsYWJlbEVuZCA8IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgcG9zID0gbGFiZWxFbmQgKyAxO1xuICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjgvKiAoICovKSB7XG4gICAgLy9cbiAgICAvLyBJbmxpbmUgbGlua1xuICAgIC8vXG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICBeXiBza2lwcGluZyB0aGVzZSBzcGFjZXNcbiAgICBwb3MrKztcbiAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhazsgfVxuICAgIH1cbiAgICBpZiAocG9zID49IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgXl5eXl5eIHBhcnNpbmcgbGluayBkZXN0aW5hdGlvblxuICAgIHN0YXJ0ID0gcG9zO1xuICAgIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rRGVzdGluYXRpb24oc3RhdGUuc3JjLCBwb3MsIHN0YXRlLnBvc01heCk7XG4gICAgaWYgKHJlcy5vaykge1xuICAgICAgaHJlZiA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmsocmVzLnN0cik7XG4gICAgICBpZiAoc3RhdGUubWQudmFsaWRhdGVMaW5rKGhyZWYpKSB7XG4gICAgICAgIHBvcyA9IHJlcy5wb3M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBocmVmID0gJyc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICAgICAgICBeXiBza2lwcGluZyB0aGVzZSBzcGFjZXNcbiAgICBzdGFydCA9IHBvcztcbiAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhazsgfVxuICAgIH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgICAgICAgICBeXl5eXl5eIHBhcnNpbmcgbGluayB0aXRsZVxuICAgIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rVGl0bGUoc3RhdGUuc3JjLCBwb3MsIHN0YXRlLnBvc01heCk7XG4gICAgaWYgKHBvcyA8IG1heCAmJiBzdGFydCAhPT0gcG9zICYmIHJlcy5vaykge1xuICAgICAgdGl0bGUgPSByZXMuc3RyO1xuICAgICAgcG9zID0gcmVzLnBvcztcblxuICAgICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgICAgY29kZSA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrOyB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpdGxlID0gJyc7XG4gICAgfVxuXG4gICAgaWYgKHBvcyA+PSBtYXggfHwgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgyOS8qICkgKi8pIHtcbiAgICAgIHN0YXRlLnBvcyA9IG9sZFBvcztcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcG9zKys7XG4gIH0gZWxzZSB7XG4gICAgLy9cbiAgICAvLyBMaW5rIHJlZmVyZW5jZVxuICAgIC8vXG4gICAgaWYgKHR5cGVvZiBzdGF0ZS5lbnYucmVmZXJlbmNlcyA9PT0gJ3VuZGVmaW5lZCcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4NUIvKiBbICovKSB7XG4gICAgICBzdGFydCA9IHBvcyArIDE7XG4gICAgICBwb3MgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0xhYmVsKHN0YXRlLCBwb3MpO1xuICAgICAgaWYgKHBvcyA+PSAwKSB7XG4gICAgICAgIGxhYmVsID0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3MrKyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb3MgPSBsYWJlbEVuZCArIDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHBvcyA9IGxhYmVsRW5kICsgMTtcbiAgICB9XG5cbiAgICAvLyBjb3ZlcnMgbGFiZWwgPT09ICcnIGFuZCBsYWJlbCA9PT0gdW5kZWZpbmVkXG4gICAgLy8gKGNvbGxhcHNlZCByZWZlcmVuY2UgbGluayBhbmQgc2hvcnRjdXQgcmVmZXJlbmNlIGxpbmsgcmVzcGVjdGl2ZWx5KVxuICAgIGlmICghbGFiZWwpIHsgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2UobGFiZWxTdGFydCwgbGFiZWxFbmQpOyB9XG5cbiAgICByZWYgPSBzdGF0ZS5lbnYucmVmZXJlbmNlc1tub3JtYWxpemVSZWZlcmVuY2UobGFiZWwpXTtcbiAgICBpZiAoIXJlZikge1xuICAgICAgc3RhdGUucG9zID0gb2xkUG9zO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBocmVmID0gcmVmLmhyZWY7XG4gICAgdGl0bGUgPSByZWYudGl0bGU7XG4gIH1cblxuICAvL1xuICAvLyBXZSBmb3VuZCB0aGUgZW5kIG9mIHRoZSBsaW5rLCBhbmQga25vdyBmb3IgYSBmYWN0IGl0J3MgYSB2YWxpZCBsaW5rO1xuICAvLyBzbyBhbGwgdGhhdCdzIGxlZnQgdG8gZG8gaXMgdG8gY2FsbCB0b2tlbml6ZXIuXG4gIC8vXG4gIGlmICghc2lsZW50KSB7XG4gICAgY29udGVudCA9IHN0YXRlLnNyYy5zbGljZShsYWJlbFN0YXJ0LCBsYWJlbEVuZCk7XG5cbiAgICBzdGF0ZS5tZC5pbmxpbmUucGFyc2UoXG4gICAgICBjb250ZW50LFxuICAgICAgc3RhdGUubWQsXG4gICAgICBzdGF0ZS5lbnYsXG4gICAgICB0b2tlbnMgPSBbXVxuICAgICk7XG5cbiAgICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ2ltYWdlJywgJ2ltZycsIDApO1xuICAgIHRva2VuLmF0dHJzICAgID0gYXR0cnMgPSBbIFsgJ3NyYycsIGhyZWYgXSwgWyAnYWx0JywgJycgXSBdO1xuICAgIHRva2VuLmNoaWxkcmVuID0gdG9rZW5zO1xuICAgIHRva2VuLmNvbnRlbnQgID0gY29udGVudDtcblxuICAgIGlmICh0aXRsZSkge1xuICAgICAgYXR0cnMucHVzaChbICd0aXRsZScsIHRpdGxlIF0pO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHBvcztcbiAgc3RhdGUucG9zTWF4ID0gbWF4O1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQcm9jZXNzIFtsaW5rXSg8dG8+IFwic3R1ZmZcIilcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgbm9ybWFsaXplUmVmZXJlbmNlICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5ub3JtYWxpemVSZWZlcmVuY2U7XG52YXIgaXNTcGFjZSAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGluayhzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBhdHRycyxcbiAgICAgIGNvZGUsXG4gICAgICBsYWJlbCxcbiAgICAgIGxhYmVsRW5kLFxuICAgICAgbGFiZWxTdGFydCxcbiAgICAgIHBvcyxcbiAgICAgIHJlcyxcbiAgICAgIHJlZixcbiAgICAgIHRpdGxlLFxuICAgICAgdG9rZW4sXG4gICAgICBocmVmID0gJycsXG4gICAgICBvbGRQb3MgPSBzdGF0ZS5wb3MsXG4gICAgICBtYXggPSBzdGF0ZS5wb3NNYXgsXG4gICAgICBzdGFydCA9IHN0YXRlLnBvcyxcbiAgICAgIHBhcnNlUmVmZXJlbmNlID0gdHJ1ZTtcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zKSAhPT0gMHg1Qi8qIFsgKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgbGFiZWxTdGFydCA9IHN0YXRlLnBvcyArIDE7XG4gIGxhYmVsRW5kID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtMYWJlbChzdGF0ZSwgc3RhdGUucG9zLCB0cnVlKTtcblxuICAvLyBwYXJzZXIgZmFpbGVkIHRvIGZpbmQgJ10nLCBzbyBpdCdzIG5vdCBhIHZhbGlkIGxpbmtcbiAgaWYgKGxhYmVsRW5kIDwgMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MgPSBsYWJlbEVuZCArIDE7XG4gIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgyOC8qICggKi8pIHtcbiAgICAvL1xuICAgIC8vIElubGluZSBsaW5rXG4gICAgLy9cblxuICAgIC8vIG1pZ2h0IGhhdmUgZm91bmQgYSB2YWxpZCBzaG9ydGN1dCBsaW5rLCBkaXNhYmxlIHJlZmVyZW5jZSBwYXJzaW5nXG4gICAgcGFyc2VSZWZlcmVuY2UgPSBmYWxzZTtcblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHBvcysrO1xuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrOyB9XG4gICAgfVxuICAgIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICBeXl5eXl4gcGFyc2luZyBsaW5rIGRlc3RpbmF0aW9uXG4gICAgc3RhcnQgPSBwb3M7XG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtEZXN0aW5hdGlvbihzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KTtcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhyZXMuc3RyKTtcbiAgICAgIGlmIChzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoaHJlZikpIHtcbiAgICAgICAgcG9zID0gcmVzLnBvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhyZWYgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHN0YXJ0ID0gcG9zO1xuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrOyB9XG4gICAgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICAgICAgICAgIF5eXl5eXl4gcGFyc2luZyBsaW5rIHRpdGxlXG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KTtcbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXJ0ICE9PSBwb3MgJiYgcmVzLm9rKSB7XG4gICAgICB0aXRsZSA9IHJlcy5zdHI7XG4gICAgICBwb3MgPSByZXMucG9zO1xuXG4gICAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGl0bGUgPSAnJztcbiAgICB9XG5cbiAgICBpZiAocG9zID49IG1heCB8fCBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI5LyogKSAqLykge1xuICAgICAgLy8gcGFyc2luZyBhIHZhbGlkIHNob3J0Y3V0IGxpbmsgZmFpbGVkLCBmYWxsYmFjayB0byByZWZlcmVuY2VcbiAgICAgIHBhcnNlUmVmZXJlbmNlID0gdHJ1ZTtcbiAgICB9XG4gICAgcG9zKys7XG4gIH1cblxuICBpZiAocGFyc2VSZWZlcmVuY2UpIHtcbiAgICAvL1xuICAgIC8vIExpbmsgcmVmZXJlbmNlXG4gICAgLy9cbiAgICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg1Qi8qIFsgKi8pIHtcbiAgICAgIHN0YXJ0ID0gcG9zICsgMTtcbiAgICAgIHBvcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rTGFiZWwoc3RhdGUsIHBvcyk7XG4gICAgICBpZiAocG9zID49IDApIHtcbiAgICAgICAgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcysrKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvcyA9IGxhYmVsRW5kICsgMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcG9zID0gbGFiZWxFbmQgKyAxO1xuICAgIH1cblxuICAgIC8vIGNvdmVycyBsYWJlbCA9PT0gJycgYW5kIGxhYmVsID09PSB1bmRlZmluZWRcbiAgICAvLyAoY29sbGFwc2VkIHJlZmVyZW5jZSBsaW5rIGFuZCBzaG9ydGN1dCByZWZlcmVuY2UgbGluayByZXNwZWN0aXZlbHkpXG4gICAgaWYgKCFsYWJlbCkgeyBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShsYWJlbFN0YXJ0LCBsYWJlbEVuZCk7IH1cblxuICAgIHJlZiA9IHN0YXRlLmVudi5yZWZlcmVuY2VzW25vcm1hbGl6ZVJlZmVyZW5jZShsYWJlbCldO1xuICAgIGlmICghcmVmKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGhyZWYgPSByZWYuaHJlZjtcbiAgICB0aXRsZSA9IHJlZi50aXRsZTtcbiAgfVxuXG4gIC8vXG4gIC8vIFdlIGZvdW5kIHRoZSBlbmQgb2YgdGhlIGxpbmssIGFuZCBrbm93IGZvciBhIGZhY3QgaXQncyBhIHZhbGlkIGxpbms7XG4gIC8vIHNvIGFsbCB0aGF0J3MgbGVmdCB0byBkbyBpcyB0byBjYWxsIHRva2VuaXplci5cbiAgLy9cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBzdGF0ZS5wb3MgPSBsYWJlbFN0YXJ0O1xuICAgIHN0YXRlLnBvc01heCA9IGxhYmVsRW5kO1xuXG4gICAgdG9rZW4gICAgICAgID0gc3RhdGUucHVzaCgnbGlua19vcGVuJywgJ2EnLCAxKTtcbiAgICB0b2tlbi5hdHRycyAgPSBhdHRycyA9IFsgWyAnaHJlZicsIGhyZWYgXSBdO1xuICAgIGlmICh0aXRsZSkge1xuICAgICAgYXR0cnMucHVzaChbICd0aXRsZScsIHRpdGxlIF0pO1xuICAgIH1cblxuICAgIHN0YXRlLm1kLmlubGluZS50b2tlbml6ZShzdGF0ZSk7XG5cbiAgICB0b2tlbiAgICAgICAgPSBzdGF0ZS5wdXNoKCdsaW5rX2Nsb3NlJywgJ2EnLCAtMSk7XG4gIH1cblxuICBzdGF0ZS5wb3MgPSBwb3M7XG4gIHN0YXRlLnBvc01heCA9IG1heDtcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2Vlc3MgJ1xcbidcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNTcGFjZSA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBuZXdsaW5lKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHBtYXgsIG1heCwgcG9zID0gc3RhdGUucG9zO1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDBBLyogXFxuICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHBtYXggPSBzdGF0ZS5wZW5kaW5nLmxlbmd0aCAtIDE7XG4gIG1heCA9IHN0YXRlLnBvc01heDtcblxuICAvLyAnICBcXG4nIC0+IGhhcmRicmVha1xuICAvLyBMb29rdXAgaW4gcGVuZGluZyBjaGFycyBpcyBiYWQgcHJhY3RpY2UhIERvbid0IGNvcHkgdG8gb3RoZXIgcnVsZXMhXG4gIC8vIFBlbmRpbmcgc3RyaW5nIGlzIHN0b3JlZCBpbiBjb25jYXQgbW9kZSwgaW5kZXhlZCBsb29rdXBzIHdpbGwgY2F1c2VcbiAgLy8gY29udmVydGlvbiB0byBmbGF0IG1vZGUuXG4gIGlmICghc2lsZW50KSB7XG4gICAgaWYgKHBtYXggPj0gMCAmJiBzdGF0ZS5wZW5kaW5nLmNoYXJDb2RlQXQocG1heCkgPT09IDB4MjApIHtcbiAgICAgIGlmIChwbWF4ID49IDEgJiYgc3RhdGUucGVuZGluZy5jaGFyQ29kZUF0KHBtYXggLSAxKSA9PT0gMHgyMCkge1xuICAgICAgICBzdGF0ZS5wZW5kaW5nID0gc3RhdGUucGVuZGluZy5yZXBsYWNlKC8gKyQvLCAnJyk7XG4gICAgICAgIHN0YXRlLnB1c2goJ2hhcmRicmVhaycsICdicicsIDApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucGVuZGluZyA9IHN0YXRlLnBlbmRpbmcuc2xpY2UoMCwgLTEpO1xuICAgICAgICBzdGF0ZS5wdXNoKCdzb2Z0YnJlYWsnLCAnYnInLCAwKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5wdXNoKCdzb2Z0YnJlYWsnLCAnYnInLCAwKTtcbiAgICB9XG4gIH1cblxuICBwb3MrKztcblxuICAvLyBza2lwIGhlYWRpbmcgc3BhY2VzIGZvciBuZXh0IGxpbmVcbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBpc1NwYWNlKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykpKSB7IHBvcysrOyB9XG5cbiAgc3RhdGUucG9zID0gcG9zO1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBJbmxpbmUgcGFyc2VyIHN0YXRlXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgVG9rZW4gICAgICAgICAgPSByZXF1aXJlKCcuLi90b2tlbicpO1xudmFyIGlzV2hpdGVTcGFjZSAgID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNXaGl0ZVNwYWNlO1xudmFyIGlzUHVuY3RDaGFyICAgID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNQdW5jdENoYXI7XG52YXIgaXNNZEFzY2lpUHVuY3QgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc01kQXNjaWlQdW5jdDtcblxuXG5mdW5jdGlvbiBTdGF0ZUlubGluZShzcmMsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICB0aGlzLnNyYyA9IHNyYztcbiAgdGhpcy5lbnYgPSBlbnY7XG4gIHRoaXMubWQgPSBtZDtcbiAgdGhpcy50b2tlbnMgPSBvdXRUb2tlbnM7XG5cbiAgdGhpcy5wb3MgPSAwO1xuICB0aGlzLnBvc01heCA9IHRoaXMuc3JjLmxlbmd0aDtcbiAgdGhpcy5sZXZlbCA9IDA7XG4gIHRoaXMucGVuZGluZyA9ICcnO1xuICB0aGlzLnBlbmRpbmdMZXZlbCA9IDA7XG5cbiAgdGhpcy5jYWNoZSA9IHt9OyAgICAgICAgLy8gU3RvcmVzIHsgc3RhcnQ6IGVuZCB9IHBhaXJzLiBVc2VmdWwgZm9yIGJhY2t0cmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvcHRpbWl6YXRpb24gb2YgcGFpcnMgcGFyc2UgKGVtcGhhc2lzLCBzdHJpa2VzKS5cblxuICB0aGlzLmRlbGltaXRlcnMgPSBbXTsgICAvLyBFbXBoYXNpcy1saWtlIGRlbGltaXRlcnNcbn1cblxuXG4vLyBGbHVzaCBwZW5kaW5nIHRleHRcbi8vXG5TdGF0ZUlubGluZS5wcm90b3R5cGUucHVzaFBlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB0b2tlbiA9IG5ldyBUb2tlbigndGV4dCcsICcnLCAwKTtcbiAgdG9rZW4uY29udGVudCA9IHRoaXMucGVuZGluZztcbiAgdG9rZW4ubGV2ZWwgPSB0aGlzLnBlbmRpbmdMZXZlbDtcbiAgdGhpcy50b2tlbnMucHVzaCh0b2tlbik7XG4gIHRoaXMucGVuZGluZyA9ICcnO1xuICByZXR1cm4gdG9rZW47XG59O1xuXG5cbi8vIFB1c2ggbmV3IHRva2VuIHRvIFwic3RyZWFtXCIuXG4vLyBJZiBwZW5kaW5nIHRleHQgZXhpc3RzIC0gZmx1c2ggaXQgYXMgdGV4dCB0b2tlblxuLy9cblN0YXRlSW5saW5lLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHR5cGUsIHRhZywgbmVzdGluZykge1xuICBpZiAodGhpcy5wZW5kaW5nKSB7XG4gICAgdGhpcy5wdXNoUGVuZGluZygpO1xuICB9XG5cbiAgdmFyIHRva2VuID0gbmV3IFRva2VuKHR5cGUsIHRhZywgbmVzdGluZyk7XG5cbiAgaWYgKG5lc3RpbmcgPCAwKSB7IHRoaXMubGV2ZWwtLTsgfVxuICB0b2tlbi5sZXZlbCA9IHRoaXMubGV2ZWw7XG4gIGlmIChuZXN0aW5nID4gMCkgeyB0aGlzLmxldmVsKys7IH1cblxuICB0aGlzLnBlbmRpbmdMZXZlbCA9IHRoaXMubGV2ZWw7XG4gIHRoaXMudG9rZW5zLnB1c2godG9rZW4pO1xuICByZXR1cm4gdG9rZW47XG59O1xuXG5cbi8vIFNjYW4gYSBzZXF1ZW5jZSBvZiBlbXBoYXNpcy1saWtlIG1hcmtlcnMsIGFuZCBkZXRlcm1pbmUgd2hldGhlclxuLy8gaXQgY2FuIHN0YXJ0IGFuIGVtcGhhc2lzIHNlcXVlbmNlIG9yIGVuZCBhbiBlbXBoYXNpcyBzZXF1ZW5jZS5cbi8vXG4vLyAgLSBzdGFydCAtIHBvc2l0aW9uIHRvIHNjYW4gZnJvbSAoaXQgc2hvdWxkIHBvaW50IGF0IGEgdmFsaWQgbWFya2VyKTtcbi8vICAtIGNhblNwbGl0V29yZCAtIGRldGVybWluZSBpZiB0aGVzZSBtYXJrZXJzIGNhbiBiZSBmb3VuZCBpbnNpZGUgYSB3b3JkXG4vL1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLnNjYW5EZWxpbXMgPSBmdW5jdGlvbiAoc3RhcnQsIGNhblNwbGl0V29yZCkge1xuICB2YXIgcG9zID0gc3RhcnQsIGxhc3RDaGFyLCBuZXh0Q2hhciwgY291bnQsIGNhbl9vcGVuLCBjYW5fY2xvc2UsXG4gICAgICBpc0xhc3RXaGl0ZVNwYWNlLCBpc0xhc3RQdW5jdENoYXIsXG4gICAgICBpc05leHRXaGl0ZVNwYWNlLCBpc05leHRQdW5jdENoYXIsXG4gICAgICBsZWZ0X2ZsYW5raW5nID0gdHJ1ZSxcbiAgICAgIHJpZ2h0X2ZsYW5raW5nID0gdHJ1ZSxcbiAgICAgIG1heCA9IHRoaXMucG9zTWF4LFxuICAgICAgbWFya2VyID0gdGhpcy5zcmMuY2hhckNvZGVBdChzdGFydCk7XG5cbiAgLy8gdHJlYXQgYmVnaW5uaW5nIG9mIHRoZSBsaW5lIGFzIGEgd2hpdGVzcGFjZVxuICBsYXN0Q2hhciA9IHN0YXJ0ID4gMCA/IHRoaXMuc3JjLmNoYXJDb2RlQXQoc3RhcnQgLSAxKSA6IDB4MjA7XG5cbiAgd2hpbGUgKHBvcyA8IG1heCAmJiB0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IG1hcmtlcikgeyBwb3MrKzsgfVxuXG4gIGNvdW50ID0gcG9zIC0gc3RhcnQ7XG5cbiAgLy8gdHJlYXQgZW5kIG9mIHRoZSBsaW5lIGFzIGEgd2hpdGVzcGFjZVxuICBuZXh0Q2hhciA9IHBvcyA8IG1heCA/IHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKSA6IDB4MjA7XG5cbiAgaXNMYXN0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobGFzdENoYXIpIHx8IGlzUHVuY3RDaGFyKFN0cmluZy5mcm9tQ2hhckNvZGUobGFzdENoYXIpKTtcbiAgaXNOZXh0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobmV4dENoYXIpIHx8IGlzUHVuY3RDaGFyKFN0cmluZy5mcm9tQ2hhckNvZGUobmV4dENoYXIpKTtcblxuICBpc0xhc3RXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKGxhc3RDaGFyKTtcbiAgaXNOZXh0V2hpdGVTcGFjZSA9IGlzV2hpdGVTcGFjZShuZXh0Q2hhcik7XG5cbiAgaWYgKGlzTmV4dFdoaXRlU3BhY2UpIHtcbiAgICBsZWZ0X2ZsYW5raW5nID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoaXNOZXh0UHVuY3RDaGFyKSB7XG4gICAgaWYgKCEoaXNMYXN0V2hpdGVTcGFjZSB8fCBpc0xhc3RQdW5jdENoYXIpKSB7XG4gICAgICBsZWZ0X2ZsYW5raW5nID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzTGFzdFdoaXRlU3BhY2UpIHtcbiAgICByaWdodF9mbGFua2luZyA9IGZhbHNlO1xuICB9IGVsc2UgaWYgKGlzTGFzdFB1bmN0Q2hhcikge1xuICAgIGlmICghKGlzTmV4dFdoaXRlU3BhY2UgfHwgaXNOZXh0UHVuY3RDaGFyKSkge1xuICAgICAgcmlnaHRfZmxhbmtpbmcgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIWNhblNwbGl0V29yZCkge1xuICAgIGNhbl9vcGVuICA9IGxlZnRfZmxhbmtpbmcgICYmICghcmlnaHRfZmxhbmtpbmcgfHwgaXNMYXN0UHVuY3RDaGFyKTtcbiAgICBjYW5fY2xvc2UgPSByaWdodF9mbGFua2luZyAmJiAoIWxlZnRfZmxhbmtpbmcgIHx8IGlzTmV4dFB1bmN0Q2hhcik7XG4gIH0gZWxzZSB7XG4gICAgY2FuX29wZW4gID0gbGVmdF9mbGFua2luZztcbiAgICBjYW5fY2xvc2UgPSByaWdodF9mbGFua2luZztcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgY2FuX29wZW46ICBjYW5fb3BlbixcbiAgICBjYW5fY2xvc2U6IGNhbl9jbG9zZSxcbiAgICBsZW5ndGg6ICAgIGNvdW50XG4gIH07XG59O1xuXG5cbi8vIHJlLWV4cG9ydCBUb2tlbiBjbGFzcyB0byB1c2UgaW4gYmxvY2sgcnVsZXNcblN0YXRlSW5saW5lLnByb3RvdHlwZS5Ub2tlbiA9IFRva2VuO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVJbmxpbmU7XG4iLCIvLyB+fnN0cmlrZSB0aHJvdWdofn5cbi8vXG4ndXNlIHN0cmljdCc7XG5cblxuLy8gSW5zZXJ0IGVhY2ggbWFya2VyIGFzIGEgc2VwYXJhdGUgdGV4dCB0b2tlbiwgYW5kIGFkZCBpdCB0byBkZWxpbWl0ZXIgbGlzdFxuLy9cbm1vZHVsZS5leHBvcnRzLnRva2VuaXplID0gZnVuY3Rpb24gc3RyaWtldGhyb3VnaChzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBpLCBzY2FubmVkLCB0b2tlbiwgbGVuLCBjaCxcbiAgICAgIHN0YXJ0ID0gc3RhdGUucG9zLFxuICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhcnQpO1xuXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKG1hcmtlciAhPT0gMHg3RS8qIH4gKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgc2Nhbm5lZCA9IHN0YXRlLnNjYW5EZWxpbXMoc3RhdGUucG9zLCB0cnVlKTtcbiAgbGVuID0gc2Nhbm5lZC5sZW5ndGg7XG4gIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpO1xuXG4gIGlmIChsZW4gPCAyKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChsZW4gJSAyKSB7XG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMCk7XG4gICAgdG9rZW4uY29udGVudCA9IGNoO1xuICAgIGxlbi0tO1xuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMCk7XG4gICAgdG9rZW4uY29udGVudCA9IGNoICsgY2g7XG5cbiAgICBzdGF0ZS5kZWxpbWl0ZXJzLnB1c2goe1xuICAgICAgbWFya2VyOiBtYXJrZXIsXG4gICAgICBqdW1wOiAgIGksXG4gICAgICB0b2tlbjogIHN0YXRlLnRva2Vucy5sZW5ndGggLSAxLFxuICAgICAgbGV2ZWw6ICBzdGF0ZS5sZXZlbCxcbiAgICAgIGVuZDogICAgLTEsXG4gICAgICBvcGVuOiAgIHNjYW5uZWQuY2FuX29wZW4sXG4gICAgICBjbG9zZTogIHNjYW5uZWQuY2FuX2Nsb3NlXG4gICAgfSk7XG4gIH1cblxuICBzdGF0ZS5wb3MgKz0gc2Nhbm5lZC5sZW5ndGg7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5cbi8vIFdhbGsgdGhyb3VnaCBkZWxpbWl0ZXIgbGlzdCBhbmQgcmVwbGFjZSB0ZXh0IHRva2VucyB3aXRoIHRhZ3Ncbi8vXG5tb2R1bGUuZXhwb3J0cy5wb3N0UHJvY2VzcyA9IGZ1bmN0aW9uIHN0cmlrZXRocm91Z2goc3RhdGUpIHtcbiAgdmFyIGksIGosXG4gICAgICBzdGFydERlbGltLFxuICAgICAgZW5kRGVsaW0sXG4gICAgICB0b2tlbixcbiAgICAgIGxvbmVNYXJrZXJzID0gW10sXG4gICAgICBkZWxpbWl0ZXJzID0gc3RhdGUuZGVsaW1pdGVycyxcbiAgICAgIG1heCA9IHN0YXRlLmRlbGltaXRlcnMubGVuZ3RoO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBtYXg7IGkrKykge1xuICAgIHN0YXJ0RGVsaW0gPSBkZWxpbWl0ZXJzW2ldO1xuXG4gICAgaWYgKHN0YXJ0RGVsaW0ubWFya2VyICE9PSAweDdFLyogfiAqLykge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0RGVsaW0uZW5kID09PSAtMSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgZW5kRGVsaW0gPSBkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kXTtcblxuICAgIHRva2VuICAgICAgICAgPSBzdGF0ZS50b2tlbnNbc3RhcnREZWxpbS50b2tlbl07XG4gICAgdG9rZW4udHlwZSAgICA9ICdzX29wZW4nO1xuICAgIHRva2VuLnRhZyAgICAgPSAncyc7XG4gICAgdG9rZW4ubmVzdGluZyA9IDE7XG4gICAgdG9rZW4ubWFya3VwICA9ICd+fic7XG4gICAgdG9rZW4uY29udGVudCA9ICcnO1xuXG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnRva2Vuc1tlbmREZWxpbS50b2tlbl07XG4gICAgdG9rZW4udHlwZSAgICA9ICdzX2Nsb3NlJztcbiAgICB0b2tlbi50YWcgICAgID0gJ3MnO1xuICAgIHRva2VuLm5lc3RpbmcgPSAtMTtcbiAgICB0b2tlbi5tYXJrdXAgID0gJ35+JztcbiAgICB0b2tlbi5jb250ZW50ID0gJyc7XG5cbiAgICBpZiAoc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuIC0gMV0udHlwZSA9PT0gJ3RleHQnICYmXG4gICAgICAgIHN0YXRlLnRva2Vuc1tlbmREZWxpbS50b2tlbiAtIDFdLmNvbnRlbnQgPT09ICd+Jykge1xuXG4gICAgICBsb25lTWFya2Vycy5wdXNoKGVuZERlbGltLnRva2VuIC0gMSk7XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYSBtYXJrZXIgc2VxdWVuY2UgaGFzIGFuIG9kZCBudW1iZXIgb2YgY2hhcmFjdGVycywgaXQncyBzcGxpdHRlZFxuICAvLyBsaWtlIHRoaXM6IGB+fn5+fmAgLT4gYH5gICsgYH5+YCArIGB+fmAsIGxlYXZpbmcgb25lIG1hcmtlciBhdCB0aGVcbiAgLy8gc3RhcnQgb2YgdGhlIHNlcXVlbmNlLlxuICAvL1xuICAvLyBTbywgd2UgaGF2ZSB0byBtb3ZlIGFsbCB0aG9zZSBtYXJrZXJzIGFmdGVyIHN1YnNlcXVlbnQgc19jbG9zZSB0YWdzLlxuICAvL1xuICB3aGlsZSAobG9uZU1hcmtlcnMubGVuZ3RoKSB7XG4gICAgaSA9IGxvbmVNYXJrZXJzLnBvcCgpO1xuICAgIGogPSBpICsgMTtcblxuICAgIHdoaWxlIChqIDwgc3RhdGUudG9rZW5zLmxlbmd0aCAmJiBzdGF0ZS50b2tlbnNbal0udHlwZSA9PT0gJ3NfY2xvc2UnKSB7XG4gICAgICBqKys7XG4gICAgfVxuXG4gICAgai0tO1xuXG4gICAgaWYgKGkgIT09IGopIHtcbiAgICAgIHRva2VuID0gc3RhdGUudG9rZW5zW2pdO1xuICAgICAgc3RhdGUudG9rZW5zW2pdID0gc3RhdGUudG9rZW5zW2ldO1xuICAgICAgc3RhdGUudG9rZW5zW2ldID0gdG9rZW47XG4gICAgfVxuICB9XG59O1xuIiwiLy8gU2tpcCB0ZXh0IGNoYXJhY3RlcnMgZm9yIHRleHQgdG9rZW4sIHBsYWNlIHRob3NlIHRvIHBlbmRpbmcgYnVmZmVyXG4vLyBhbmQgaW5jcmVtZW50IGN1cnJlbnQgcG9zXG5cbid1c2Ugc3RyaWN0JztcblxuXG4vLyBSdWxlIHRvIHNraXAgcHVyZSB0ZXh0XG4vLyAne30kJUB+Kz06JyByZXNlcnZlZCBmb3IgZXh0ZW50aW9uc1xuXG4vLyAhLCBcIiwgIywgJCwgJSwgJiwgJywgKCwgKSwgKiwgKywgLCwgLSwgLiwgLywgOiwgOywgPCwgPSwgPiwgPywgQCwgWywgXFwsIF0sIF4sIF8sIGAsIHssIHwsIH0sIG9yIH5cblxuLy8gISEhISBEb24ndCBjb25mdXNlIHdpdGggXCJNYXJrZG93biBBU0NJSSBQdW5jdHVhdGlvblwiIGNoYXJzXG4vLyBodHRwOi8vc3BlYy5jb21tb25tYXJrLm9yZy8wLjE1LyNhc2NpaS1wdW5jdHVhdGlvbi1jaGFyYWN0ZXJcbmZ1bmN0aW9uIGlzVGVybWluYXRvckNoYXIoY2gpIHtcbiAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgMHgwQS8qIFxcbiAqLzpcbiAgICBjYXNlIDB4MjEvKiAhICovOlxuICAgIGNhc2UgMHgyMy8qICMgKi86XG4gICAgY2FzZSAweDI0LyogJCAqLzpcbiAgICBjYXNlIDB4MjUvKiAlICovOlxuICAgIGNhc2UgMHgyNi8qICYgKi86XG4gICAgY2FzZSAweDJBLyogKiAqLzpcbiAgICBjYXNlIDB4MkIvKiArICovOlxuICAgIGNhc2UgMHgyRC8qIC0gKi86XG4gICAgY2FzZSAweDNBLyogOiAqLzpcbiAgICBjYXNlIDB4M0MvKiA8ICovOlxuICAgIGNhc2UgMHgzRC8qID0gKi86XG4gICAgY2FzZSAweDNFLyogPiAqLzpcbiAgICBjYXNlIDB4NDAvKiBAICovOlxuICAgIGNhc2UgMHg1Qi8qIFsgKi86XG4gICAgY2FzZSAweDVDLyogXFwgKi86XG4gICAgY2FzZSAweDVELyogXSAqLzpcbiAgICBjYXNlIDB4NUUvKiBeICovOlxuICAgIGNhc2UgMHg1Ri8qIF8gKi86XG4gICAgY2FzZSAweDYwLyogYCAqLzpcbiAgICBjYXNlIDB4N0IvKiB7ICovOlxuICAgIGNhc2UgMHg3RC8qIH0gKi86XG4gICAgY2FzZSAweDdFLyogfiAqLzpcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0ZXh0KHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHBvcyA9IHN0YXRlLnBvcztcblxuICB3aGlsZSAocG9zIDwgc3RhdGUucG9zTWF4ICYmICFpc1Rlcm1pbmF0b3JDaGFyKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykpKSB7XG4gICAgcG9zKys7XG4gIH1cblxuICBpZiAocG9zID09PSBzdGF0ZS5wb3MpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhdGUucG9zLCBwb3MpOyB9XG5cbiAgc3RhdGUucG9zID0gcG9zO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQWx0ZXJuYXRpdmUgaW1wbGVtZW50YXRpb24sIGZvciBtZW1vcnkuXG4vL1xuLy8gSXQgY29zdHMgMTAlIG9mIHBlcmZvcm1hbmNlLCBidXQgYWxsb3dzIGV4dGVuZCB0ZXJtaW5hdG9ycyBsaXN0LCBpZiBwbGFjZSBpdFxuLy8gdG8gYFBhcmNlcklubGluZWAgcHJvcGVydHkuIFByb2JhYmx5LCB3aWxsIHN3aXRjaCB0byBpdCBzb21ldGltZSwgc3VjaFxuLy8gZmxleGliaWxpdHkgcmVxdWlyZWQuXG5cbi8qXG52YXIgVEVSTUlOQVRPUl9SRSA9IC9bXFxuISMkJSYqK1xcLTo8PT5AW1xcXFxcXF1eX2B7fX5dLztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0ZXh0KHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHBvcyA9IHN0YXRlLnBvcyxcbiAgICAgIGlkeCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLnNlYXJjaChURVJNSU5BVE9SX1JFKTtcblxuICAvLyBmaXJzdCBjaGFyIGlzIHRlcm1pbmF0b3IgLT4gZW1wdHkgdGV4dFxuICBpZiAoaWR4ID09PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIG5vIHRlcm1pbmF0b3IgLT4gdGV4dCB0aWxsIGVuZCBvZiBzdHJpbmdcbiAgaWYgKGlkeCA8IDApIHtcbiAgICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShwb3MpOyB9XG4gICAgc3RhdGUucG9zID0gc3RhdGUuc3JjLmxlbmd0aDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjLnNsaWNlKHBvcywgcG9zICsgaWR4KTsgfVxuXG4gIHN0YXRlLnBvcyArPSBpZHg7XG5cbiAgcmV0dXJuIHRydWU7XG59OyovXG4iLCIvLyBNZXJnZSBhZGphY2VudCB0ZXh0IG5vZGVzIGludG8gb25lLCBhbmQgcmUtY2FsY3VsYXRlIGFsbCB0b2tlbiBsZXZlbHNcbi8vXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0ZXh0X2NvbGxhcHNlKHN0YXRlKSB7XG4gIHZhciBjdXJyLCBsYXN0LFxuICAgICAgbGV2ZWwgPSAwLFxuICAgICAgdG9rZW5zID0gc3RhdGUudG9rZW5zLFxuICAgICAgbWF4ID0gc3RhdGUudG9rZW5zLmxlbmd0aDtcblxuICBmb3IgKGN1cnIgPSBsYXN0ID0gMDsgY3VyciA8IG1heDsgY3VycisrKSB7XG4gICAgLy8gcmUtY2FsY3VsYXRlIGxldmVsc1xuICAgIGxldmVsICs9IHRva2Vuc1tjdXJyXS5uZXN0aW5nO1xuICAgIHRva2Vuc1tjdXJyXS5sZXZlbCA9IGxldmVsO1xuXG4gICAgaWYgKHRva2Vuc1tjdXJyXS50eXBlID09PSAndGV4dCcgJiZcbiAgICAgICAgY3VyciArIDEgPCBtYXggJiZcbiAgICAgICAgdG9rZW5zW2N1cnIgKyAxXS50eXBlID09PSAndGV4dCcpIHtcblxuICAgICAgLy8gY29sbGFwc2UgdHdvIGFkamFjZW50IHRleHQgbm9kZXNcbiAgICAgIHRva2Vuc1tjdXJyICsgMV0uY29udGVudCA9IHRva2Vuc1tjdXJyXS5jb250ZW50ICsgdG9rZW5zW2N1cnIgKyAxXS5jb250ZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY3VyciAhPT0gbGFzdCkgeyB0b2tlbnNbbGFzdF0gPSB0b2tlbnNbY3Vycl07IH1cblxuICAgICAgbGFzdCsrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjdXJyICE9PSBsYXN0KSB7XG4gICAgdG9rZW5zLmxlbmd0aCA9IGxhc3Q7XG4gIH1cbn07XG4iLCIvLyBUb2tlbiBjbGFzc1xuXG4ndXNlIHN0cmljdCc7XG5cblxuLyoqXG4gKiBjbGFzcyBUb2tlblxuICoqL1xuXG4vKipcbiAqIG5ldyBUb2tlbih0eXBlLCB0YWcsIG5lc3RpbmcpXG4gKlxuICogQ3JlYXRlIG5ldyB0b2tlbiBhbmQgZmlsbCBwYXNzZWQgcHJvcGVydGllcy5cbiAqKi9cbmZ1bmN0aW9uIFRva2VuKHR5cGUsIHRhZywgbmVzdGluZykge1xuICAvKipcbiAgICogVG9rZW4jdHlwZSAtPiBTdHJpbmdcbiAgICpcbiAgICogVHlwZSBvZiB0aGUgdG9rZW4gKHN0cmluZywgZS5nLiBcInBhcmFncmFwaF9vcGVuXCIpXG4gICAqKi9cbiAgdGhpcy50eXBlICAgICA9IHR5cGU7XG5cbiAgLyoqXG4gICAqIFRva2VuI3RhZyAtPiBTdHJpbmdcbiAgICpcbiAgICogaHRtbCB0YWcgbmFtZSwgZS5nLiBcInBcIlxuICAgKiovXG4gIHRoaXMudGFnICAgICAgPSB0YWc7XG5cbiAgLyoqXG4gICAqIFRva2VuI2F0dHJzIC0+IEFycmF5XG4gICAqXG4gICAqIEh0bWwgYXR0cmlidXRlcy4gRm9ybWF0OiBgWyBbIG5hbWUxLCB2YWx1ZTEgXSwgWyBuYW1lMiwgdmFsdWUyIF0gXWBcbiAgICoqL1xuICB0aGlzLmF0dHJzICAgID0gbnVsbDtcblxuICAvKipcbiAgICogVG9rZW4jbWFwIC0+IEFycmF5XG4gICAqXG4gICAqIFNvdXJjZSBtYXAgaW5mby4gRm9ybWF0OiBgWyBsaW5lX2JlZ2luLCBsaW5lX2VuZCBdYFxuICAgKiovXG4gIHRoaXMubWFwICAgICAgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNuZXN0aW5nIC0+IE51bWJlclxuICAgKlxuICAgKiBMZXZlbCBjaGFuZ2UgKG51bWJlciBpbiB7LTEsIDAsIDF9IHNldCksIHdoZXJlOlxuICAgKlxuICAgKiAtICBgMWAgbWVhbnMgdGhlIHRhZyBpcyBvcGVuaW5nXG4gICAqIC0gIGAwYCBtZWFucyB0aGUgdGFnIGlzIHNlbGYtY2xvc2luZ1xuICAgKiAtIGAtMWAgbWVhbnMgdGhlIHRhZyBpcyBjbG9zaW5nXG4gICAqKi9cbiAgdGhpcy5uZXN0aW5nICA9IG5lc3Rpbmc7XG5cbiAgLyoqXG4gICAqIFRva2VuI2xldmVsIC0+IE51bWJlclxuICAgKlxuICAgKiBuZXN0aW5nIGxldmVsLCB0aGUgc2FtZSBhcyBgc3RhdGUubGV2ZWxgXG4gICAqKi9cbiAgdGhpcy5sZXZlbCAgICA9IDA7XG5cbiAgLyoqXG4gICAqIFRva2VuI2NoaWxkcmVuIC0+IEFycmF5XG4gICAqXG4gICAqIEFuIGFycmF5IG9mIGNoaWxkIG5vZGVzIChpbmxpbmUgYW5kIGltZyB0b2tlbnMpXG4gICAqKi9cbiAgdGhpcy5jaGlsZHJlbiA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRva2VuI2NvbnRlbnQgLT4gU3RyaW5nXG4gICAqXG4gICAqIEluIGEgY2FzZSBvZiBzZWxmLWNsb3NpbmcgdGFnIChjb2RlLCBodG1sLCBmZW5jZSwgZXRjLiksXG4gICAqIGl0IGhhcyBjb250ZW50cyBvZiB0aGlzIHRhZy5cbiAgICoqL1xuICB0aGlzLmNvbnRlbnQgID0gJyc7XG5cbiAgLyoqXG4gICAqIFRva2VuI21hcmt1cCAtPiBTdHJpbmdcbiAgICpcbiAgICogJyonIG9yICdfJyBmb3IgZW1waGFzaXMsIGZlbmNlIHN0cmluZyBmb3IgZmVuY2UsIGV0Yy5cbiAgICoqL1xuICB0aGlzLm1hcmt1cCAgID0gJyc7XG5cbiAgLyoqXG4gICAqIFRva2VuI2luZm8gLT4gU3RyaW5nXG4gICAqXG4gICAqIGZlbmNlIGluZm9zdHJpbmdcbiAgICoqL1xuICB0aGlzLmluZm8gICAgID0gJyc7XG5cbiAgLyoqXG4gICAqIFRva2VuI21ldGEgLT4gT2JqZWN0XG4gICAqXG4gICAqIEEgcGxhY2UgZm9yIHBsdWdpbnMgdG8gc3RvcmUgYW4gYXJiaXRyYXJ5IGRhdGFcbiAgICoqL1xuICB0aGlzLm1ldGEgICAgID0gbnVsbDtcblxuICAvKipcbiAgICogVG9rZW4jYmxvY2sgLT4gQm9vbGVhblxuICAgKlxuICAgKiBUcnVlIGZvciBibG9jay1sZXZlbCB0b2tlbnMsIGZhbHNlIGZvciBpbmxpbmUgdG9rZW5zLlxuICAgKiBVc2VkIGluIHJlbmRlcmVyIHRvIGNhbGN1bGF0ZSBsaW5lIGJyZWFrc1xuICAgKiovXG4gIHRoaXMuYmxvY2sgICAgPSBmYWxzZTtcblxuICAvKipcbiAgICogVG9rZW4jaGlkZGVuIC0+IEJvb2xlYW5cbiAgICpcbiAgICogSWYgaXQncyB0cnVlLCBpZ25vcmUgdGhpcyBlbGVtZW50IHdoZW4gcmVuZGVyaW5nLiBVc2VkIGZvciB0aWdodCBsaXN0c1xuICAgKiB0byBoaWRlIHBhcmFncmFwaHMuXG4gICAqKi9cbiAgdGhpcy5oaWRkZW4gICA9IGZhbHNlO1xufVxuXG5cbi8qKlxuICogVG9rZW4uYXR0ckluZGV4KG5hbWUpIC0+IE51bWJlclxuICpcbiAqIFNlYXJjaCBhdHRyaWJ1dGUgaW5kZXggYnkgbmFtZS5cbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRySW5kZXggPSBmdW5jdGlvbiBhdHRySW5kZXgobmFtZSkge1xuICB2YXIgYXR0cnMsIGksIGxlbjtcblxuICBpZiAoIXRoaXMuYXR0cnMpIHsgcmV0dXJuIC0xOyB9XG5cbiAgYXR0cnMgPSB0aGlzLmF0dHJzO1xuXG4gIGZvciAoaSA9IDAsIGxlbiA9IGF0dHJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKGF0dHJzW2ldWzBdID09PSBuYW1lKSB7IHJldHVybiBpOyB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufTtcblxuXG4vKipcbiAqIFRva2VuLmF0dHJQdXNoKGF0dHJEYXRhKVxuICpcbiAqIEFkZCBgWyBuYW1lLCB2YWx1ZSBdYCBhdHRyaWJ1dGUgdG8gbGlzdC4gSW5pdCBhdHRycyBpZiBuZWNlc3NhcnlcbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRyUHVzaCA9IGZ1bmN0aW9uIGF0dHJQdXNoKGF0dHJEYXRhKSB7XG4gIGlmICh0aGlzLmF0dHJzKSB7XG4gICAgdGhpcy5hdHRycy5wdXNoKGF0dHJEYXRhKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzID0gWyBhdHRyRGF0YSBdO1xuICB9XG59O1xuXG5cbi8qKlxuICogVG9rZW4uYXR0clNldChuYW1lLCB2YWx1ZSlcbiAqXG4gKiBTZXQgYG5hbWVgIGF0dHJpYnV0ZSB0byBgdmFsdWVgLiBPdmVycmlkZSBvbGQgdmFsdWUgaWYgZXhpc3RzLlxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJTZXQgPSBmdW5jdGlvbiBhdHRyU2V0KG5hbWUsIHZhbHVlKSB7XG4gIHZhciBpZHggPSB0aGlzLmF0dHJJbmRleChuYW1lKSxcbiAgICAgIGF0dHJEYXRhID0gWyBuYW1lLCB2YWx1ZSBdO1xuXG4gIGlmIChpZHggPCAwKSB7XG4gICAgdGhpcy5hdHRyUHVzaChhdHRyRGF0YSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5hdHRyc1tpZHhdID0gYXR0ckRhdGE7XG4gIH1cbn07XG5cblxuLyoqXG4gKiBUb2tlbi5hdHRyR2V0KG5hbWUpXG4gKlxuICogR2V0IHRoZSB2YWx1ZSBvZiBhdHRyaWJ1dGUgYG5hbWVgLCBvciBudWxsIGlmIGl0IGRvZXMgbm90IGV4aXN0LlxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJHZXQgPSBmdW5jdGlvbiBhdHRyR2V0KG5hbWUpIHtcbiAgdmFyIGlkeCA9IHRoaXMuYXR0ckluZGV4KG5hbWUpLCB2YWx1ZSA9IG51bGw7XG4gIGlmIChpZHggPj0gMCkge1xuICAgIHZhbHVlID0gdGhpcy5hdHRyc1tpZHhdWzFdO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn07XG5cblxuLyoqXG4gKiBUb2tlbi5hdHRySm9pbihuYW1lLCB2YWx1ZSlcbiAqXG4gKiBKb2luIHZhbHVlIHRvIGV4aXN0aW5nIGF0dHJpYnV0ZSB2aWEgc3BhY2UuIE9yIGNyZWF0ZSBuZXcgYXR0cmlidXRlIGlmIG5vdFxuICogZXhpc3RzLiBVc2VmdWwgdG8gb3BlcmF0ZSB3aXRoIHRva2VuIGNsYXNzZXMuXG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0ckpvaW4gPSBmdW5jdGlvbiBhdHRySm9pbihuYW1lLCB2YWx1ZSkge1xuICB2YXIgaWR4ID0gdGhpcy5hdHRySW5kZXgobmFtZSk7XG5cbiAgaWYgKGlkeCA8IDApIHtcbiAgICB0aGlzLmF0dHJQdXNoKFsgbmFtZSwgdmFsdWUgXSk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5hdHRyc1tpZHhdWzFdID0gdGhpcy5hdHRyc1tpZHhdWzFdICsgJyAnICsgdmFsdWU7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBUb2tlbjtcbiIsIlxuJ3VzZSBzdHJpY3QnO1xuXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWJpdHdpc2UgKi9cblxudmFyIGRlY29kZUNhY2hlID0ge307XG5cbmZ1bmN0aW9uIGdldERlY29kZUNhY2hlKGV4Y2x1ZGUpIHtcbiAgdmFyIGksIGNoLCBjYWNoZSA9IGRlY29kZUNhY2hlW2V4Y2x1ZGVdO1xuICBpZiAoY2FjaGUpIHsgcmV0dXJuIGNhY2hlOyB9XG5cbiAgY2FjaGUgPSBkZWNvZGVDYWNoZVtleGNsdWRlXSA9IFtdO1xuXG4gIGZvciAoaSA9IDA7IGkgPCAxMjg7IGkrKykge1xuICAgIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcbiAgICBjYWNoZS5wdXNoKGNoKTtcbiAgfVxuXG4gIGZvciAoaSA9IDA7IGkgPCBleGNsdWRlLmxlbmd0aDsgaSsrKSB7XG4gICAgY2ggPSBleGNsdWRlLmNoYXJDb2RlQXQoaSk7XG4gICAgY2FjaGVbY2hdID0gJyUnICsgKCcwJyArIGNoLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpKS5zbGljZSgtMik7XG4gIH1cblxuICByZXR1cm4gY2FjaGU7XG59XG5cblxuLy8gRGVjb2RlIHBlcmNlbnQtZW5jb2RlZCBzdHJpbmcuXG4vL1xuZnVuY3Rpb24gZGVjb2RlKHN0cmluZywgZXhjbHVkZSkge1xuICB2YXIgY2FjaGU7XG5cbiAgaWYgKHR5cGVvZiBleGNsdWRlICE9PSAnc3RyaW5nJykge1xuICAgIGV4Y2x1ZGUgPSBkZWNvZGUuZGVmYXVsdENoYXJzO1xuICB9XG5cbiAgY2FjaGUgPSBnZXREZWNvZGVDYWNoZShleGNsdWRlKTtcblxuICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoLyglW2EtZjAtOV17Mn0pKy9naSwgZnVuY3Rpb24oc2VxKSB7XG4gICAgdmFyIGksIGwsIGIxLCBiMiwgYjMsIGI0LCBjaHIsXG4gICAgICAgIHJlc3VsdCA9ICcnO1xuXG4gICAgZm9yIChpID0gMCwgbCA9IHNlcS5sZW5ndGg7IGkgPCBsOyBpICs9IDMpIHtcbiAgICAgIGIxID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyAxLCBpICsgMyksIDE2KTtcblxuICAgICAgaWYgKGIxIDwgMHg4MCkge1xuICAgICAgICByZXN1bHQgKz0gY2FjaGVbYjFdO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKChiMSAmIDB4RTApID09PSAweEMwICYmIChpICsgMyA8IGwpKSB7XG4gICAgICAgIC8vIDExMHh4eHh4IDEweHh4eHh4XG4gICAgICAgIGIyID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA0LCBpICsgNiksIDE2KTtcblxuICAgICAgICBpZiAoKGIyICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICBjaHIgPSAoKGIxIDw8IDYpICYgMHg3QzApIHwgKGIyICYgMHgzRik7XG5cbiAgICAgICAgICBpZiAoY2hyIDwgMHg4MCkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkXFx1ZmZmZCc7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNocik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaSArPSAzO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoYjEgJiAweEYwKSA9PT0gMHhFMCAmJiAoaSArIDYgPCBsKSkge1xuICAgICAgICAvLyAxMTEweHh4eCAxMHh4eHh4eCAxMHh4eHh4eFxuICAgICAgICBiMiA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgNCwgaSArIDYpLCAxNik7XG4gICAgICAgIGIzID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA3LCBpICsgOSksIDE2KTtcblxuICAgICAgICBpZiAoKGIyICYgMHhDMCkgPT09IDB4ODAgJiYgKGIzICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICBjaHIgPSAoKGIxIDw8IDEyKSAmIDB4RjAwMCkgfCAoKGIyIDw8IDYpICYgMHhGQzApIHwgKGIzICYgMHgzRik7XG5cbiAgICAgICAgICBpZiAoY2hyIDwgMHg4MDAgfHwgKGNociA+PSAweEQ4MDAgJiYgY2hyIDw9IDB4REZGRikpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnXFx1ZmZmZFxcdWZmZmRcXHVmZmZkJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpICs9IDY7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKChiMSAmIDB4RjgpID09PSAweEYwICYmIChpICsgOSA8IGwpKSB7XG4gICAgICAgIC8vIDExMTExMHh4IDEweHh4eHh4IDEweHh4eHh4IDEweHh4eHh4XG4gICAgICAgIGIyID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA0LCBpICsgNiksIDE2KTtcbiAgICAgICAgYjMgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDcsIGkgKyA5KSwgMTYpO1xuICAgICAgICBiNCA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgMTAsIGkgKyAxMiksIDE2KTtcblxuICAgICAgICBpZiAoKGIyICYgMHhDMCkgPT09IDB4ODAgJiYgKGIzICYgMHhDMCkgPT09IDB4ODAgJiYgKGI0ICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICBjaHIgPSAoKGIxIDw8IDE4KSAmIDB4MUMwMDAwKSB8ICgoYjIgPDwgMTIpICYgMHgzRjAwMCkgfCAoKGIzIDw8IDYpICYgMHhGQzApIHwgKGI0ICYgMHgzRik7XG5cbiAgICAgICAgICBpZiAoY2hyIDwgMHgxMDAwMCB8fCBjaHIgPiAweDEwRkZGRikge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkXFx1ZmZmZFxcdWZmZmRcXHVmZmZkJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2hyIC09IDB4MTAwMDA7XG4gICAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSgweEQ4MDAgKyAoY2hyID4+IDEwKSwgMHhEQzAwICsgKGNociAmIDB4M0ZGKSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaSArPSA5O1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJlc3VsdCArPSAnXFx1ZmZmZCc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG59XG5cblxuZGVjb2RlLmRlZmF1bHRDaGFycyAgID0gJzsvPzpAJj0rJCwjJztcbmRlY29kZS5jb21wb25lbnRDaGFycyA9ICcnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZGVjb2RlO1xuIiwiXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIGVuY29kZUNhY2hlID0ge307XG5cblxuLy8gQ3JlYXRlIGEgbG9va3VwIGFycmF5IHdoZXJlIGFueXRoaW5nIGJ1dCBjaGFyYWN0ZXJzIGluIGBjaGFyc2Agc3RyaW5nXG4vLyBhbmQgYWxwaGFudW1lcmljIGNoYXJzIGlzIHBlcmNlbnQtZW5jb2RlZC5cbi8vXG5mdW5jdGlvbiBnZXRFbmNvZGVDYWNoZShleGNsdWRlKSB7XG4gIHZhciBpLCBjaCwgY2FjaGUgPSBlbmNvZGVDYWNoZVtleGNsdWRlXTtcbiAgaWYgKGNhY2hlKSB7IHJldHVybiBjYWNoZTsgfVxuXG4gIGNhY2hlID0gZW5jb2RlQ2FjaGVbZXhjbHVkZV0gPSBbXTtcblxuICBmb3IgKGkgPSAwOyBpIDwgMTI4OyBpKyspIHtcbiAgICBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaSk7XG5cbiAgICBpZiAoL15bMC05YS16XSQvaS50ZXN0KGNoKSkge1xuICAgICAgLy8gYWx3YXlzIGFsbG93IHVuZW5jb2RlZCBhbHBoYW51bWVyaWMgY2hhcmFjdGVyc1xuICAgICAgY2FjaGUucHVzaChjaCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhY2hlLnB1c2goJyUnICsgKCcwJyArIGkudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkpLnNsaWNlKC0yKSk7XG4gICAgfVxuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IGV4Y2x1ZGUubGVuZ3RoOyBpKyspIHtcbiAgICBjYWNoZVtleGNsdWRlLmNoYXJDb2RlQXQoaSldID0gZXhjbHVkZVtpXTtcbiAgfVxuXG4gIHJldHVybiBjYWNoZTtcbn1cblxuXG4vLyBFbmNvZGUgdW5zYWZlIGNoYXJhY3RlcnMgd2l0aCBwZXJjZW50LWVuY29kaW5nLCBza2lwcGluZyBhbHJlYWR5XG4vLyBlbmNvZGVkIHNlcXVlbmNlcy5cbi8vXG4vLyAgLSBzdHJpbmcgICAgICAgLSBzdHJpbmcgdG8gZW5jb2RlXG4vLyAgLSBleGNsdWRlICAgICAgLSBsaXN0IG9mIGNoYXJhY3RlcnMgdG8gaWdub3JlIChpbiBhZGRpdGlvbiB0byBhLXpBLVowLTkpXG4vLyAgLSBrZWVwRXNjYXBlZCAgLSBkb24ndCBlbmNvZGUgJyUnIGluIGEgY29ycmVjdCBlc2NhcGUgc2VxdWVuY2UgKGRlZmF1bHQ6IHRydWUpXG4vL1xuZnVuY3Rpb24gZW5jb2RlKHN0cmluZywgZXhjbHVkZSwga2VlcEVzY2FwZWQpIHtcbiAgdmFyIGksIGwsIGNvZGUsIG5leHRDb2RlLCBjYWNoZSxcbiAgICAgIHJlc3VsdCA9ICcnO1xuXG4gIGlmICh0eXBlb2YgZXhjbHVkZSAhPT0gJ3N0cmluZycpIHtcbiAgICAvLyBlbmNvZGUoc3RyaW5nLCBrZWVwRXNjYXBlZClcbiAgICBrZWVwRXNjYXBlZCAgPSBleGNsdWRlO1xuICAgIGV4Y2x1ZGUgPSBlbmNvZGUuZGVmYXVsdENoYXJzO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBrZWVwRXNjYXBlZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBrZWVwRXNjYXBlZCA9IHRydWU7XG4gIH1cblxuICBjYWNoZSA9IGdldEVuY29kZUNhY2hlKGV4Y2x1ZGUpO1xuXG4gIGZvciAoaSA9IDAsIGwgPSBzdHJpbmcubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgY29kZSA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuXG4gICAgaWYgKGtlZXBFc2NhcGVkICYmIGNvZGUgPT09IDB4MjUgLyogJSAqLyAmJiBpICsgMiA8IGwpIHtcbiAgICAgIGlmICgvXlswLTlhLWZdezJ9JC9pLnRlc3Qoc3RyaW5nLnNsaWNlKGkgKyAxLCBpICsgMykpKSB7XG4gICAgICAgIHJlc3VsdCArPSBzdHJpbmcuc2xpY2UoaSwgaSArIDMpO1xuICAgICAgICBpICs9IDI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlIDwgMTI4KSB7XG4gICAgICByZXN1bHQgKz0gY2FjaGVbY29kZV07XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY29kZSA+PSAweEQ4MDAgJiYgY29kZSA8PSAweERGRkYpIHtcbiAgICAgIGlmIChjb2RlID49IDB4RDgwMCAmJiBjb2RlIDw9IDB4REJGRiAmJiBpICsgMSA8IGwpIHtcbiAgICAgICAgbmV4dENvZGUgPSBzdHJpbmcuY2hhckNvZGVBdChpICsgMSk7XG4gICAgICAgIGlmIChuZXh0Q29kZSA+PSAweERDMDAgJiYgbmV4dENvZGUgPD0gMHhERkZGKSB7XG4gICAgICAgICAgcmVzdWx0ICs9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdbaV0gKyBzdHJpbmdbaSArIDFdKTtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdCArPSAnJUVGJUJGJUJEJztcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHJlc3VsdCArPSBlbmNvZGVVUklDb21wb25lbnQoc3RyaW5nW2ldKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmVuY29kZS5kZWZhdWx0Q2hhcnMgICA9IFwiOy8/OkAmPSskLC1fLiF+KicoKSNcIjtcbmVuY29kZS5jb21wb25lbnRDaGFycyA9IFwiLV8uIX4qJygpXCI7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBlbmNvZGU7XG4iLCJcbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZvcm1hdCh1cmwpIHtcbiAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gIHJlc3VsdCArPSB1cmwucHJvdG9jb2wgfHwgJyc7XG4gIHJlc3VsdCArPSB1cmwuc2xhc2hlcyA/ICcvLycgOiAnJztcbiAgcmVzdWx0ICs9IHVybC5hdXRoID8gdXJsLmF1dGggKyAnQCcgOiAnJztcblxuICBpZiAodXJsLmhvc3RuYW1lICYmIHVybC5ob3N0bmFtZS5pbmRleE9mKCc6JykgIT09IC0xKSB7XG4gICAgLy8gaXB2NiBhZGRyZXNzXG4gICAgcmVzdWx0ICs9ICdbJyArIHVybC5ob3N0bmFtZSArICddJztcbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgKz0gdXJsLmhvc3RuYW1lIHx8ICcnO1xuICB9XG5cbiAgcmVzdWx0ICs9IHVybC5wb3J0ID8gJzonICsgdXJsLnBvcnQgOiAnJztcbiAgcmVzdWx0ICs9IHVybC5wYXRobmFtZSB8fCAnJztcbiAgcmVzdWx0ICs9IHVybC5zZWFyY2ggfHwgJyc7XG4gIHJlc3VsdCArPSB1cmwuaGFzaCB8fCAnJztcblxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cy5lbmNvZGUgPSByZXF1aXJlKCcuL2VuY29kZScpO1xubW9kdWxlLmV4cG9ydHMuZGVjb2RlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbm1vZHVsZS5leHBvcnRzLmZvcm1hdCA9IHJlcXVpcmUoJy4vZm9ybWF0Jyk7XG5tb2R1bGUuZXhwb3J0cy5wYXJzZSAgPSByZXF1aXJlKCcuL3BhcnNlJyk7XG4iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuJ3VzZSBzdHJpY3QnO1xuXG4vL1xuLy8gQ2hhbmdlcyBmcm9tIGpveWVudC9ub2RlOlxuLy9cbi8vIDEuIE5vIGxlYWRpbmcgc2xhc2ggaW4gcGF0aHMsXG4vLyAgICBlLmcuIGluIGB1cmwucGFyc2UoJ2h0dHA6Ly9mb28/YmFyJylgIHBhdGhuYW1lIGlzIGBgLCBub3QgYC9gXG4vL1xuLy8gMi4gQmFja3NsYXNoZXMgYXJlIG5vdCByZXBsYWNlZCB3aXRoIHNsYXNoZXMsXG4vLyAgICBzbyBgaHR0cDpcXFxcZXhhbXBsZS5vcmdcXGAgaXMgdHJlYXRlZCBsaWtlIGEgcmVsYXRpdmUgcGF0aFxuLy9cbi8vIDMuIFRyYWlsaW5nIGNvbG9uIGlzIHRyZWF0ZWQgbGlrZSBhIHBhcnQgb2YgdGhlIHBhdGgsXG4vLyAgICBpLmUuIGluIGBodHRwOi8vZXhhbXBsZS5vcmc6Zm9vYCBwYXRobmFtZSBpcyBgOmZvb2Bcbi8vXG4vLyA0LiBOb3RoaW5nIGlzIFVSTC1lbmNvZGVkIGluIHRoZSByZXN1bHRpbmcgb2JqZWN0LFxuLy8gICAgKGluIGpveWVudC9ub2RlIHNvbWUgY2hhcnMgaW4gYXV0aCBhbmQgcGF0aHMgYXJlIGVuY29kZWQpXG4vL1xuLy8gNS4gYHVybC5wYXJzZSgpYCBkb2VzIG5vdCBoYXZlIGBwYXJzZVF1ZXJ5U3RyaW5nYCBhcmd1bWVudFxuLy9cbi8vIDYuIFJlbW92ZWQgZXh0cmFuZW91cyByZXN1bHQgcHJvcGVydGllczogYGhvc3RgLCBgcGF0aGAsIGBxdWVyeWAsIGV0Yy4sXG4vLyAgICB3aGljaCBjYW4gYmUgY29uc3RydWN0ZWQgdXNpbmcgb3RoZXIgcGFydHMgb2YgdGhlIHVybC5cbi8vXG5cblxuZnVuY3Rpb24gVXJsKCkge1xuICB0aGlzLnByb3RvY29sID0gbnVsbDtcbiAgdGhpcy5zbGFzaGVzID0gbnVsbDtcbiAgdGhpcy5hdXRoID0gbnVsbDtcbiAgdGhpcy5wb3J0ID0gbnVsbDtcbiAgdGhpcy5ob3N0bmFtZSA9IG51bGw7XG4gIHRoaXMuaGFzaCA9IG51bGw7XG4gIHRoaXMuc2VhcmNoID0gbnVsbDtcbiAgdGhpcy5wYXRobmFtZSA9IG51bGw7XG59XG5cbi8vIFJlZmVyZW5jZTogUkZDIDM5ODYsIFJGQyAxODA4LCBSRkMgMjM5NlxuXG4vLyBkZWZpbmUgdGhlc2UgaGVyZSBzbyBhdCBsZWFzdCB0aGV5IG9ubHkgaGF2ZSB0byBiZVxuLy8gY29tcGlsZWQgb25jZSBvbiB0aGUgZmlyc3QgbW9kdWxlIGxvYWQuXG52YXIgcHJvdG9jb2xQYXR0ZXJuID0gL14oW2EtejAtOS4rLV0rOikvaSxcbiAgICBwb3J0UGF0dGVybiA9IC86WzAtOV0qJC8sXG5cbiAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIGEgc2ltcGxlIHBhdGggVVJMXG4gICAgc2ltcGxlUGF0aFBhdHRlcm4gPSAvXihcXC9cXC8/KD8hXFwvKVteXFw/XFxzXSopKFxcP1teXFxzXSopPyQvLFxuXG4gICAgLy8gUkZDIDIzOTY6IGNoYXJhY3RlcnMgcmVzZXJ2ZWQgZm9yIGRlbGltaXRpbmcgVVJMcy5cbiAgICAvLyBXZSBhY3R1YWxseSBqdXN0IGF1dG8tZXNjYXBlIHRoZXNlLlxuICAgIGRlbGltcyA9IFsgJzwnLCAnPicsICdcIicsICdgJywgJyAnLCAnXFxyJywgJ1xcbicsICdcXHQnIF0sXG5cbiAgICAvLyBSRkMgMjM5NjogY2hhcmFjdGVycyBub3QgYWxsb3dlZCBmb3IgdmFyaW91cyByZWFzb25zLlxuICAgIHVud2lzZSA9IFsgJ3snLCAnfScsICd8JywgJ1xcXFwnLCAnXicsICdgJyBdLmNvbmNhdChkZWxpbXMpLFxuXG4gICAgLy8gQWxsb3dlZCBieSBSRkNzLCBidXQgY2F1c2Ugb2YgWFNTIGF0dGFja3MuICBBbHdheXMgZXNjYXBlIHRoZXNlLlxuICAgIGF1dG9Fc2NhcGUgPSBbICdcXCcnIF0uY29uY2F0KHVud2lzZSksXG4gICAgLy8gQ2hhcmFjdGVycyB0aGF0IGFyZSBuZXZlciBldmVyIGFsbG93ZWQgaW4gYSBob3N0bmFtZS5cbiAgICAvLyBOb3RlIHRoYXQgYW55IGludmFsaWQgY2hhcnMgYXJlIGFsc28gaGFuZGxlZCwgYnV0IHRoZXNlXG4gICAgLy8gYXJlIHRoZSBvbmVzIHRoYXQgYXJlICpleHBlY3RlZCogdG8gYmUgc2Vlbiwgc28gd2UgZmFzdC1wYXRoXG4gICAgLy8gdGhlbS5cbiAgICBub25Ib3N0Q2hhcnMgPSBbICclJywgJy8nLCAnPycsICc7JywgJyMnIF0uY29uY2F0KGF1dG9Fc2NhcGUpLFxuICAgIGhvc3RFbmRpbmdDaGFycyA9IFsgJy8nLCAnPycsICcjJyBdLFxuICAgIGhvc3RuYW1lTWF4TGVuID0gMjU1LFxuICAgIGhvc3RuYW1lUGFydFBhdHRlcm4gPSAvXlsrYS16MC05QS1aXy1dezAsNjN9JC8sXG4gICAgaG9zdG5hbWVQYXJ0U3RhcnQgPSAvXihbK2EtejAtOUEtWl8tXXswLDYzfSkoLiopJC8sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgY2FuIGFsbG93IFwidW5zYWZlXCIgYW5kIFwidW53aXNlXCIgY2hhcnMuXG4gICAgLyogZXNsaW50LWRpc2FibGUgbm8tc2NyaXB0LXVybCAqL1xuICAgIC8vIHByb3RvY29scyB0aGF0IG5ldmVyIGhhdmUgYSBob3N0bmFtZS5cbiAgICBob3N0bGVzc1Byb3RvY29sID0ge1xuICAgICAgJ2phdmFzY3JpcHQnOiB0cnVlLFxuICAgICAgJ2phdmFzY3JpcHQ6JzogdHJ1ZVxuICAgIH0sXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgYWx3YXlzIGNvbnRhaW4gYSAvLyBiaXQuXG4gICAgc2xhc2hlZFByb3RvY29sID0ge1xuICAgICAgJ2h0dHAnOiB0cnVlLFxuICAgICAgJ2h0dHBzJzogdHJ1ZSxcbiAgICAgICdmdHAnOiB0cnVlLFxuICAgICAgJ2dvcGhlcic6IHRydWUsXG4gICAgICAnZmlsZSc6IHRydWUsXG4gICAgICAnaHR0cDonOiB0cnVlLFxuICAgICAgJ2h0dHBzOic6IHRydWUsXG4gICAgICAnZnRwOic6IHRydWUsXG4gICAgICAnZ29waGVyOic6IHRydWUsXG4gICAgICAnZmlsZTonOiB0cnVlXG4gICAgfTtcbiAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLXNjcmlwdC11cmwgKi9cblxuZnVuY3Rpb24gdXJsUGFyc2UodXJsLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICBpZiAodXJsICYmIHVybCBpbnN0YW5jZW9mIFVybCkgeyByZXR1cm4gdXJsOyB9XG5cbiAgdmFyIHUgPSBuZXcgVXJsKCk7XG4gIHUucGFyc2UodXJsLCBzbGFzaGVzRGVub3RlSG9zdCk7XG4gIHJldHVybiB1O1xufVxuXG5VcmwucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24odXJsLCBzbGFzaGVzRGVub3RlSG9zdCkge1xuICB2YXIgaSwgbCwgbG93ZXJQcm90bywgaGVjLCBzbGFzaGVzLFxuICAgICAgcmVzdCA9IHVybDtcblxuICAvLyB0cmltIGJlZm9yZSBwcm9jZWVkaW5nLlxuICAvLyBUaGlzIGlzIHRvIHN1cHBvcnQgcGFyc2Ugc3R1ZmYgbGlrZSBcIiAgaHR0cDovL2Zvby5jb20gIFxcblwiXG4gIHJlc3QgPSByZXN0LnRyaW0oKTtcblxuICBpZiAoIXNsYXNoZXNEZW5vdGVIb3N0ICYmIHVybC5zcGxpdCgnIycpLmxlbmd0aCA9PT0gMSkge1xuICAgIC8vIFRyeSBmYXN0IHBhdGggcmVnZXhwXG4gICAgdmFyIHNpbXBsZVBhdGggPSBzaW1wbGVQYXRoUGF0dGVybi5leGVjKHJlc3QpO1xuICAgIGlmIChzaW1wbGVQYXRoKSB7XG4gICAgICB0aGlzLnBhdGhuYW1lID0gc2ltcGxlUGF0aFsxXTtcbiAgICAgIGlmIChzaW1wbGVQYXRoWzJdKSB7XG4gICAgICAgIHRoaXMuc2VhcmNoID0gc2ltcGxlUGF0aFsyXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHZhciBwcm90byA9IHByb3RvY29sUGF0dGVybi5leGVjKHJlc3QpO1xuICBpZiAocHJvdG8pIHtcbiAgICBwcm90byA9IHByb3RvWzBdO1xuICAgIGxvd2VyUHJvdG8gPSBwcm90by50b0xvd2VyQ2FzZSgpO1xuICAgIHRoaXMucHJvdG9jb2wgPSBwcm90bztcbiAgICByZXN0ID0gcmVzdC5zdWJzdHIocHJvdG8ubGVuZ3RoKTtcbiAgfVxuXG4gIC8vIGZpZ3VyZSBvdXQgaWYgaXQncyBnb3QgYSBob3N0XG4gIC8vIHVzZXJAc2VydmVyIGlzICphbHdheXMqIGludGVycHJldGVkIGFzIGEgaG9zdG5hbWUsIGFuZCB1cmxcbiAgLy8gcmVzb2x1dGlvbiB3aWxsIHRyZWF0IC8vZm9vL2JhciBhcyBob3N0PWZvbyxwYXRoPWJhciBiZWNhdXNlIHRoYXQnc1xuICAvLyBob3cgdGhlIGJyb3dzZXIgcmVzb2x2ZXMgcmVsYXRpdmUgVVJMcy5cbiAgaWYgKHNsYXNoZXNEZW5vdGVIb3N0IHx8IHByb3RvIHx8IHJlc3QubWF0Y2goL15cXC9cXC9bXkBcXC9dK0BbXkBcXC9dKy8pKSB7XG4gICAgc2xhc2hlcyA9IHJlc3Quc3Vic3RyKDAsIDIpID09PSAnLy8nO1xuICAgIGlmIChzbGFzaGVzICYmICEocHJvdG8gJiYgaG9zdGxlc3NQcm90b2NvbFtwcm90b10pKSB7XG4gICAgICByZXN0ID0gcmVzdC5zdWJzdHIoMik7XG4gICAgICB0aGlzLnNsYXNoZXMgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghaG9zdGxlc3NQcm90b2NvbFtwcm90b10gJiZcbiAgICAgIChzbGFzaGVzIHx8IChwcm90byAmJiAhc2xhc2hlZFByb3RvY29sW3Byb3RvXSkpKSB7XG5cbiAgICAvLyB0aGVyZSdzIGEgaG9zdG5hbWUuXG4gICAgLy8gdGhlIGZpcnN0IGluc3RhbmNlIG9mIC8sID8sIDssIG9yICMgZW5kcyB0aGUgaG9zdC5cbiAgICAvL1xuICAgIC8vIElmIHRoZXJlIGlzIGFuIEAgaW4gdGhlIGhvc3RuYW1lLCB0aGVuIG5vbi1ob3N0IGNoYXJzICphcmUqIGFsbG93ZWRcbiAgICAvLyB0byB0aGUgbGVmdCBvZiB0aGUgbGFzdCBAIHNpZ24sIHVubGVzcyBzb21lIGhvc3QtZW5kaW5nIGNoYXJhY3RlclxuICAgIC8vIGNvbWVzICpiZWZvcmUqIHRoZSBALXNpZ24uXG4gICAgLy8gVVJMcyBhcmUgb2Jub3hpb3VzLlxuICAgIC8vXG4gICAgLy8gZXg6XG4gICAgLy8gaHR0cDovL2FAYkBjLyA9PiB1c2VyOmFAYiBob3N0OmNcbiAgICAvLyBodHRwOi8vYUBiP0BjID0+IHVzZXI6YSBob3N0OmMgcGF0aDovP0BjXG5cbiAgICAvLyB2MC4xMiBUT0RPKGlzYWFjcyk6IFRoaXMgaXMgbm90IHF1aXRlIGhvdyBDaHJvbWUgZG9lcyB0aGluZ3MuXG4gICAgLy8gUmV2aWV3IG91ciB0ZXN0IGNhc2UgYWdhaW5zdCBicm93c2VycyBtb3JlIGNvbXByZWhlbnNpdmVseS5cblxuICAgIC8vIGZpbmQgdGhlIGZpcnN0IGluc3RhbmNlIG9mIGFueSBob3N0RW5kaW5nQ2hhcnNcbiAgICB2YXIgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAoaSA9IDA7IGkgPCBob3N0RW5kaW5nQ2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhlYyA9IHJlc3QuaW5kZXhPZihob3N0RW5kaW5nQ2hhcnNbaV0pO1xuICAgICAgaWYgKGhlYyAhPT0gLTEgJiYgKGhvc3RFbmQgPT09IC0xIHx8IGhlYyA8IGhvc3RFbmQpKSB7XG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYXQgdGhpcyBwb2ludCwgZWl0aGVyIHdlIGhhdmUgYW4gZXhwbGljaXQgcG9pbnQgd2hlcmUgdGhlXG4gICAgLy8gYXV0aCBwb3J0aW9uIGNhbm5vdCBnbyBwYXN0LCBvciB0aGUgbGFzdCBAIGNoYXIgaXMgdGhlIGRlY2lkZXIuXG4gICAgdmFyIGF1dGgsIGF0U2lnbjtcbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIGF0U2lnbiBjYW4gYmUgYW55d2hlcmUuXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGF0U2lnbiBtdXN0IGJlIGluIGF1dGggcG9ydGlvbi5cbiAgICAgIC8vIGh0dHA6Ly9hQGIvY0BkID0+IGhvc3Q6YiBhdXRoOmEgcGF0aDovY0BkXG4gICAgICBhdFNpZ24gPSByZXN0Lmxhc3RJbmRleE9mKCdAJywgaG9zdEVuZCk7XG4gICAgfVxuXG4gICAgLy8gTm93IHdlIGhhdmUgYSBwb3J0aW9uIHdoaWNoIGlzIGRlZmluaXRlbHkgdGhlIGF1dGguXG4gICAgLy8gUHVsbCB0aGF0IG9mZi5cbiAgICBpZiAoYXRTaWduICE9PSAtMSkge1xuICAgICAgYXV0aCA9IHJlc3Quc2xpY2UoMCwgYXRTaWduKTtcbiAgICAgIHJlc3QgPSByZXN0LnNsaWNlKGF0U2lnbiArIDEpO1xuICAgICAgdGhpcy5hdXRoID0gYXV0aDtcbiAgICB9XG5cbiAgICAvLyB0aGUgaG9zdCBpcyB0aGUgcmVtYWluaW5nIHRvIHRoZSBsZWZ0IG9mIHRoZSBmaXJzdCBub24taG9zdCBjaGFyXG4gICAgaG9zdEVuZCA9IC0xO1xuICAgIGZvciAoaSA9IDA7IGkgPCBub25Ib3N0Q2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGhlYyA9IHJlc3QuaW5kZXhPZihub25Ib3N0Q2hhcnNbaV0pO1xuICAgICAgaWYgKGhlYyAhPT0gLTEgJiYgKGhvc3RFbmQgPT09IC0xIHx8IGhlYyA8IGhvc3RFbmQpKSB7XG4gICAgICAgIGhvc3RFbmQgPSBoZWM7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGlmIHdlIHN0aWxsIGhhdmUgbm90IGhpdCBpdCwgdGhlbiB0aGUgZW50aXJlIHRoaW5nIGlzIGEgaG9zdC5cbiAgICBpZiAoaG9zdEVuZCA9PT0gLTEpIHtcbiAgICAgIGhvc3RFbmQgPSByZXN0Lmxlbmd0aDtcbiAgICB9XG5cbiAgICBpZiAocmVzdFtob3N0RW5kIC0gMV0gPT09ICc6JykgeyBob3N0RW5kLS07IH1cbiAgICB2YXIgaG9zdCA9IHJlc3Quc2xpY2UoMCwgaG9zdEVuZCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoaG9zdEVuZCk7XG5cbiAgICAvLyBwdWxsIG91dCBwb3J0LlxuICAgIHRoaXMucGFyc2VIb3N0KGhvc3QpO1xuXG4gICAgLy8gd2UndmUgaW5kaWNhdGVkIHRoYXQgdGhlcmUgaXMgYSBob3N0bmFtZSxcbiAgICAvLyBzbyBldmVuIGlmIGl0J3MgZW1wdHksIGl0IGhhcyB0byBiZSBwcmVzZW50LlxuICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lIHx8ICcnO1xuXG4gICAgLy8gaWYgaG9zdG5hbWUgYmVnaW5zIHdpdGggWyBhbmQgZW5kcyB3aXRoIF1cbiAgICAvLyBhc3N1bWUgdGhhdCBpdCdzIGFuIElQdjYgYWRkcmVzcy5cbiAgICB2YXIgaXB2Nkhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZVswXSA9PT0gJ1snICYmXG4gICAgICAgIHRoaXMuaG9zdG5hbWVbdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nO1xuXG4gICAgLy8gdmFsaWRhdGUgYSBsaXR0bGUuXG4gICAgaWYgKCFpcHY2SG9zdG5hbWUpIHtcbiAgICAgIHZhciBob3N0cGFydHMgPSB0aGlzLmhvc3RuYW1lLnNwbGl0KC9cXC4vKTtcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBob3N0cGFydHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHZhciBwYXJ0ID0gaG9zdHBhcnRzW2ldO1xuICAgICAgICBpZiAoIXBhcnQpIHsgY29udGludWU7IH1cbiAgICAgICAgaWYgKCFwYXJ0Lm1hdGNoKGhvc3RuYW1lUGFydFBhdHRlcm4pKSB7XG4gICAgICAgICAgdmFyIG5ld3BhcnQgPSAnJztcbiAgICAgICAgICBmb3IgKHZhciBqID0gMCwgayA9IHBhcnQubGVuZ3RoOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICBpZiAocGFydC5jaGFyQ29kZUF0KGopID4gMTI3KSB7XG4gICAgICAgICAgICAgIC8vIHdlIHJlcGxhY2Ugbm9uLUFTQ0lJIGNoYXIgd2l0aCBhIHRlbXBvcmFyeSBwbGFjZWhvbGRlclxuICAgICAgICAgICAgICAvLyB3ZSBuZWVkIHRoaXMgdG8gbWFrZSBzdXJlIHNpemUgb2YgaG9zdG5hbWUgaXMgbm90XG4gICAgICAgICAgICAgIC8vIGJyb2tlbiBieSByZXBsYWNpbmcgbm9uLUFTQ0lJIGJ5IG5vdGhpbmdcbiAgICAgICAgICAgICAgbmV3cGFydCArPSAneCc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9IHBhcnRbal07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIHdlIHRlc3QgYWdhaW4gd2l0aCBBU0NJSSBjaGFyIG9ubHlcbiAgICAgICAgICBpZiAoIW5ld3BhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZFBhcnRzID0gaG9zdHBhcnRzLnNsaWNlKDAsIGkpO1xuICAgICAgICAgICAgdmFyIG5vdEhvc3QgPSBob3N0cGFydHMuc2xpY2UoaSArIDEpO1xuICAgICAgICAgICAgdmFyIGJpdCA9IHBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0U3RhcnQpO1xuICAgICAgICAgICAgaWYgKGJpdCkge1xuICAgICAgICAgICAgICB2YWxpZFBhcnRzLnB1c2goYml0WzFdKTtcbiAgICAgICAgICAgICAgbm90SG9zdC51bnNoaWZ0KGJpdFsyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobm90SG9zdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmVzdCA9IG5vdEhvc3Quam9pbignLicpICsgcmVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuaG9zdG5hbWUgPSB2YWxpZFBhcnRzLmpvaW4oJy4nKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmhvc3RuYW1lLmxlbmd0aCA+IGhvc3RuYW1lTWF4TGVuKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gJyc7XG4gICAgfVxuXG4gICAgLy8gc3RyaXAgWyBhbmQgXSBmcm9tIHRoZSBob3N0bmFtZVxuICAgIC8vIHRoZSBob3N0IGZpZWxkIHN0aWxsIHJldGFpbnMgdGhlbSwgdGhvdWdoXG4gICAgaWYgKGlwdjZIb3N0bmFtZSkge1xuICAgICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUuc3Vic3RyKDEsIHRoaXMuaG9zdG5hbWUubGVuZ3RoIC0gMik7XG4gICAgfVxuICB9XG5cbiAgLy8gY2hvcCBvZmYgZnJvbSB0aGUgdGFpbCBmaXJzdC5cbiAgdmFyIGhhc2ggPSByZXN0LmluZGV4T2YoJyMnKTtcbiAgaWYgKGhhc2ggIT09IC0xKSB7XG4gICAgLy8gZ290IGEgZnJhZ21lbnQgc3RyaW5nLlxuICAgIHRoaXMuaGFzaCA9IHJlc3Quc3Vic3RyKGhhc2gpO1xuICAgIHJlc3QgPSByZXN0LnNsaWNlKDAsIGhhc2gpO1xuICB9XG4gIHZhciBxbSA9IHJlc3QuaW5kZXhPZignPycpO1xuICBpZiAocW0gIT09IC0xKSB7XG4gICAgdGhpcy5zZWFyY2ggPSByZXN0LnN1YnN0cihxbSk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgcW0pO1xuICB9XG4gIGlmIChyZXN0KSB7IHRoaXMucGF0aG5hbWUgPSByZXN0OyB9XG4gIGlmIChzbGFzaGVkUHJvdG9jb2xbbG93ZXJQcm90b10gJiZcbiAgICAgIHRoaXMuaG9zdG5hbWUgJiYgIXRoaXMucGF0aG5hbWUpIHtcbiAgICB0aGlzLnBhdGhuYW1lID0gJyc7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblVybC5wcm90b3R5cGUucGFyc2VIb3N0ID0gZnVuY3Rpb24oaG9zdCkge1xuICB2YXIgcG9ydCA9IHBvcnRQYXR0ZXJuLmV4ZWMoaG9zdCk7XG4gIGlmIChwb3J0KSB7XG4gICAgcG9ydCA9IHBvcnRbMF07XG4gICAgaWYgKHBvcnQgIT09ICc6Jykge1xuICAgICAgdGhpcy5wb3J0ID0gcG9ydC5zdWJzdHIoMSk7XG4gICAgfVxuICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLCBob3N0Lmxlbmd0aCAtIHBvcnQubGVuZ3RoKTtcbiAgfVxuICBpZiAoaG9zdCkgeyB0aGlzLmhvc3RuYW1lID0gaG9zdDsgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB1cmxQYXJzZTtcbiIsIm1vZHVsZS5leHBvcnRzPS9bXFwwLVxceDFGXFx4N0YtXFx4OUZdLyIsIm1vZHVsZS5leHBvcnRzPS9bXFx4QURcXHUwNjAwLVxcdTA2MDVcXHUwNjFDXFx1MDZERFxcdTA3MEZcXHUwOEUyXFx1MTgwRVxcdTIwMEItXFx1MjAwRlxcdTIwMkEtXFx1MjAyRVxcdTIwNjAtXFx1MjA2NFxcdTIwNjYtXFx1MjA2RlxcdUZFRkZcXHVGRkY5LVxcdUZGRkJdfFxcdUQ4MDRcXHVEQ0JEfFxcdUQ4MkZbXFx1RENBMC1cXHVEQ0EzXXxcXHVEODM0W1xcdURENzMtXFx1REQ3QV18XFx1REI0MFtcXHVEQzAxXFx1REMyMC1cXHVEQzdGXS8iLCJtb2R1bGUuZXhwb3J0cz0vWyEtIyUtXFwqLC0vOjtcXD9AXFxbLVxcXV9cXHtcXH1cXHhBMVxceEE3XFx4QUJcXHhCNlxceEI3XFx4QkJcXHhCRlxcdTAzN0VcXHUwMzg3XFx1MDU1QS1cXHUwNTVGXFx1MDU4OVxcdTA1OEFcXHUwNUJFXFx1MDVDMFxcdTA1QzNcXHUwNUM2XFx1MDVGM1xcdTA1RjRcXHUwNjA5XFx1MDYwQVxcdTA2MENcXHUwNjBEXFx1MDYxQlxcdTA2MUVcXHUwNjFGXFx1MDY2QS1cXHUwNjZEXFx1MDZENFxcdTA3MDAtXFx1MDcwRFxcdTA3RjctXFx1MDdGOVxcdTA4MzAtXFx1MDgzRVxcdTA4NUVcXHUwOTY0XFx1MDk2NVxcdTA5NzBcXHUwQUYwXFx1MERGNFxcdTBFNEZcXHUwRTVBXFx1MEU1QlxcdTBGMDQtXFx1MEYxMlxcdTBGMTRcXHUwRjNBLVxcdTBGM0RcXHUwRjg1XFx1MEZEMC1cXHUwRkQ0XFx1MEZEOVxcdTBGREFcXHUxMDRBLVxcdTEwNEZcXHUxMEZCXFx1MTM2MC1cXHUxMzY4XFx1MTQwMFxcdTE2NkRcXHUxNjZFXFx1MTY5QlxcdTE2OUNcXHUxNkVCLVxcdTE2RURcXHUxNzM1XFx1MTczNlxcdTE3RDQtXFx1MTdENlxcdTE3RDgtXFx1MTdEQVxcdTE4MDAtXFx1MTgwQVxcdTE5NDRcXHUxOTQ1XFx1MUExRVxcdTFBMUZcXHUxQUEwLVxcdTFBQTZcXHUxQUE4LVxcdTFBQURcXHUxQjVBLVxcdTFCNjBcXHUxQkZDLVxcdTFCRkZcXHUxQzNCLVxcdTFDM0ZcXHUxQzdFXFx1MUM3RlxcdTFDQzAtXFx1MUNDN1xcdTFDRDNcXHUyMDEwLVxcdTIwMjdcXHUyMDMwLVxcdTIwNDNcXHUyMDQ1LVxcdTIwNTFcXHUyMDUzLVxcdTIwNUVcXHUyMDdEXFx1MjA3RVxcdTIwOERcXHUyMDhFXFx1MjMwOC1cXHUyMzBCXFx1MjMyOVxcdTIzMkFcXHUyNzY4LVxcdTI3NzVcXHUyN0M1XFx1MjdDNlxcdTI3RTYtXFx1MjdFRlxcdTI5ODMtXFx1Mjk5OFxcdTI5RDgtXFx1MjlEQlxcdTI5RkNcXHUyOUZEXFx1MkNGOS1cXHUyQ0ZDXFx1MkNGRVxcdTJDRkZcXHUyRDcwXFx1MkUwMC1cXHUyRTJFXFx1MkUzMC1cXHUyRTQ0XFx1MzAwMS1cXHUzMDAzXFx1MzAwOC1cXHUzMDExXFx1MzAxNC1cXHUzMDFGXFx1MzAzMFxcdTMwM0RcXHUzMEEwXFx1MzBGQlxcdUE0RkVcXHVBNEZGXFx1QTYwRC1cXHVBNjBGXFx1QTY3M1xcdUE2N0VcXHVBNkYyLVxcdUE2RjdcXHVBODc0LVxcdUE4NzdcXHVBOENFXFx1QThDRlxcdUE4RjgtXFx1QThGQVxcdUE4RkNcXHVBOTJFXFx1QTkyRlxcdUE5NUZcXHVBOUMxLVxcdUE5Q0RcXHVBOURFXFx1QTlERlxcdUFBNUMtXFx1QUE1RlxcdUFBREVcXHVBQURGXFx1QUFGMFxcdUFBRjFcXHVBQkVCXFx1RkQzRVxcdUZEM0ZcXHVGRTEwLVxcdUZFMTlcXHVGRTMwLVxcdUZFNTJcXHVGRTU0LVxcdUZFNjFcXHVGRTYzXFx1RkU2OFxcdUZFNkFcXHVGRTZCXFx1RkYwMS1cXHVGRjAzXFx1RkYwNS1cXHVGRjBBXFx1RkYwQy1cXHVGRjBGXFx1RkYxQVxcdUZGMUJcXHVGRjFGXFx1RkYyMFxcdUZGM0ItXFx1RkYzRFxcdUZGM0ZcXHVGRjVCXFx1RkY1RFxcdUZGNUYtXFx1RkY2NV18XFx1RDgwMFtcXHVERDAwLVxcdUREMDJcXHVERjlGXFx1REZEMF18XFx1RDgwMVxcdURENkZ8XFx1RDgwMltcXHVEQzU3XFx1REQxRlxcdUREM0ZcXHVERTUwLVxcdURFNThcXHVERTdGXFx1REVGMC1cXHVERUY2XFx1REYzOS1cXHVERjNGXFx1REY5OS1cXHVERjlDXXxcXHVEODA0W1xcdURDNDctXFx1REM0RFxcdURDQkJcXHVEQ0JDXFx1RENCRS1cXHVEQ0MxXFx1REQ0MC1cXHVERDQzXFx1REQ3NFxcdURENzVcXHVEREM1LVxcdUREQzlcXHVERENEXFx1REREQlxcdUREREQtXFx1RERERlxcdURFMzgtXFx1REUzRFxcdURFQTldfFxcdUQ4MDVbXFx1REM0Qi1cXHVEQzRGXFx1REM1QlxcdURDNURcXHVEQ0M2XFx1RERDMS1cXHVEREQ3XFx1REU0MS1cXHVERTQzXFx1REU2MC1cXHVERTZDXFx1REYzQy1cXHVERjNFXXxcXHVEODA3W1xcdURDNDEtXFx1REM0NVxcdURDNzBcXHVEQzcxXXxcXHVEODA5W1xcdURDNzAtXFx1REM3NF18XFx1RDgxQVtcXHVERTZFXFx1REU2RlxcdURFRjVcXHVERjM3LVxcdURGM0JcXHVERjQ0XXxcXHVEODJGXFx1REM5RnxcXHVEODM2W1xcdURFODctXFx1REU4Ql18XFx1RDgzQVtcXHVERDVFXFx1REQ1Rl0vIiwibW9kdWxlLmV4cG9ydHM9L1sgXFx4QTBcXHUxNjgwXFx1MjAwMC1cXHUyMDBBXFx1MjAyRlxcdTIwNUZcXHUzMDAwXS8iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuQW55ID0gcmVxdWlyZSgnLi9wcm9wZXJ0aWVzL0FueS9yZWdleCcpO1xuZXhwb3J0cy5DYyAgPSByZXF1aXJlKCcuL2NhdGVnb3JpZXMvQ2MvcmVnZXgnKTtcbmV4cG9ydHMuQ2YgID0gcmVxdWlyZSgnLi9jYXRlZ29yaWVzL0NmL3JlZ2V4Jyk7XG5leHBvcnRzLlAgICA9IHJlcXVpcmUoJy4vY2F0ZWdvcmllcy9QL3JlZ2V4Jyk7XG5leHBvcnRzLlogICA9IHJlcXVpcmUoJy4vY2F0ZWdvcmllcy9aL3JlZ2V4Jyk7XG4iLCJtb2R1bGUuZXhwb3J0cz0vW1xcMC1cXHVEN0ZGXFx1RTAwMC1cXHVGRkZGXXxbXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZdfFtcXHVEODAwLVxcdURCRkZdKD8hW1xcdURDMDAtXFx1REZGRl0pfCg/OlteXFx1RDgwMC1cXHVEQkZGXXxeKVtcXHVEQzAwLVxcdURGRkZdLyIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJuYW1lXCI6IFwiY2hhdC1lbmdpbmUtbWFya2Rvd25cIixcbiAgXCJhdXRob3JcIjogXCJJYW4gSmVubmluZ3NcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMC4wLjhcIixcbiAgXCJtYWluXCI6IFwic3JjL3BsdWdpbi5qc1wiLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJjaGF0LWVuZ2luZVwiOiBcIl4wLjguM1wiLFxuICAgIFwiZG90dHlcIjogXCIwLjAuMlwiLFxuICAgIFwibWFya2Rvd24taXRcIjogXCJeOC40LjBcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJjaGFpXCI6IFwiXjMuNS4wXCIsXG4gICAgXCJtb2NoYVwiOiBcIl4zLjMuMFwiXG4gIH1cbn1cbiIsIi8qKlxuKiBSZW5kZXJzIG1hcmtkb3duIGZyb20gdGhlIGBgYG1lc3NhZ2VgYGAgZXZlbnQuXG4qIEBtb2R1bGUgY2hhdC1lbmdpbmUtbWFya2Rvd25cbiogQHJlcXVpcmVzIHtAbGluayBDaGF0RW5naW5lfVxuKiBAcmVxdWlyZXMge0BsaW5rIHNuYXJrZG93bn1cbiogQHJlcXVpcmVzIHtAbGluayBkb3R0eX1cbiovXG5jb25zdCBtYXJrZG93biA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICAgIGxpbmtpZnk6IHRydWVcbn0pO1xuY29uc3QgZG90dHkgPSByZXF1aXJlKCdkb3R0eScpO1xuXG4vKipcbiogQGZ1bmN0aW9uXG4qIEBleGFtcGxlXG4qIGNoYXQucGx1Z2luKENoYXRFbmdpbmVDb3JlLnBsdWdpblsnY2hhdC1lbmdpbmUtbWFya2Rvd24nXSgpKTtcblxuKiBjaGF0Lm9uKCdtZXNzYWdlJywgKHBheWxvYWQpID0+IHtcbiogICAgY29uc29sZS5sb2cocGF5bG9hZC5kYXRhLnRleHQpO1xuKiB9KTtcbipcbiogY2hhdC5lbWl0KCdtZXNzYWdlJywge1xuKiAgICB0ZXh0OiAnVGhpcyBpcyBzb21lICptYXJrZG93biogKipmb3Igc3VyZSoqLidcbiogfSk7XG4qIC8vICdUaGlzIGlzIHNvbWUgPGVtPm1hcmtkb3duPC9lbT4gPHN0cm9uZz5mb3Igc3VyZTwvc3Ryb25nPi5cbipcbiogQHBhcmFtIHtPYmplY3R9IFtjb25maWddIFRoZSBjb25maWcgb2JqZWN0XG4qIEBwYXJhbSB7U3RyaW5nfSBbZXZlbnQ9XCJtZXNzYWdlXCJdIFRoZSBDaGF0RW5naW5lIGV2ZW50IHdoZXJlIG1hcmtkb3duIHdpbGwgYmUgcGFyc2VkXG4qIEBwYXJhbSB7U3RyaW5nfSBbcHJvcD1cImRhdGEudGV4dFwiXSBUaGUgZXZlbnQgcHJvcGVydHkgdmFsdWUgd2hlcmUgbWFya2Rvd24gc2hvdWxkIGJlIHBhcnNlZC5cbiovXG5tb2R1bGUuZXhwb3J0cyA9IChjb25maWcgPSB7fSkgPT4ge1xuXG4gICAgY29uZmlnLnByb3AgPSBjb25maWcucHJvcCB8fCAnZGF0YS50ZXh0JztcbiAgICBjb25maWcuZXZlbnQgPSBjb25maWcuZXZlbnQgfHwgJ21lc3NhZ2UnXG5cbiAgICBsZXQgcGFyc2VNYXJrZG93biA9IGZ1bmN0aW9uKHBheWxvYWQsIG5leHQpIHtcblxuICAgICAgICBsZXQgdGV4dCA9IGRvdHR5LmdldChwYXlsb2FkLCBjb25maWcucHJvcCk7XG5cbiAgICAgICAgaWYodGV4dCkge1xuICAgICAgICAgICAgZG90dHkucHV0KHBheWxvYWQsIGNvbmZpZy5wcm9wLCBtYXJrZG93bi5yZW5kZXIodGV4dCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29udGludWUgYWxvbmcgbWlkZGxld2FyZVxuICAgICAgICBuZXh0KG51bGwsIHBheWxvYWQpO1xuXG4gICAgfTtcblxuICAgIC8vIGRlZmluZSBib3RoIHRoZSBleHRlbmRlZCBtZXRob2RzIGFuZCB0aGUgbWlkZGxld2FyZSBpbiBvdXIgcGx1Z2luXG4gICAgbGV0IHJlc3VsdCA9IHtcbiAgICAgICAgbmFtZXNwYWNlOiAnbWFya2Rvd24nLFxuICAgICAgICBtaWRkbGV3YXJlOiB7XG4gICAgICAgICAgICBvbjoge31cbiAgICAgICAgfSxcbiAgICB9O1xuXG5cbiAgICByZXN1bHQubWlkZGxld2FyZS5vbltjb25maWcuZXZlbnRdID0gcGFyc2VNYXJrZG93bjtcblxuICAgIHJldHVybiByZXN1bHQ7XG5cbn1cbiJdfQ==
