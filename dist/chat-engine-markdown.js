(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function() {

    const package = require('../package.json');
    window.ChatEngineCore.plugin[package.name] = require('../src/plugin.js');

})();

},{"../package.json":69,"../src/plugin.js":70}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
module.exports={"Aacute":"\u00C1","aacute":"\u00E1","Abreve":"\u0102","abreve":"\u0103","ac":"\u223E","acd":"\u223F","acE":"\u223E\u0333","Acirc":"\u00C2","acirc":"\u00E2","acute":"\u00B4","Acy":"\u0410","acy":"\u0430","AElig":"\u00C6","aelig":"\u00E6","af":"\u2061","Afr":"\uD835\uDD04","afr":"\uD835\uDD1E","Agrave":"\u00C0","agrave":"\u00E0","alefsym":"\u2135","aleph":"\u2135","Alpha":"\u0391","alpha":"\u03B1","Amacr":"\u0100","amacr":"\u0101","amalg":"\u2A3F","amp":"&","AMP":"&","andand":"\u2A55","And":"\u2A53","and":"\u2227","andd":"\u2A5C","andslope":"\u2A58","andv":"\u2A5A","ang":"\u2220","ange":"\u29A4","angle":"\u2220","angmsdaa":"\u29A8","angmsdab":"\u29A9","angmsdac":"\u29AA","angmsdad":"\u29AB","angmsdae":"\u29AC","angmsdaf":"\u29AD","angmsdag":"\u29AE","angmsdah":"\u29AF","angmsd":"\u2221","angrt":"\u221F","angrtvb":"\u22BE","angrtvbd":"\u299D","angsph":"\u2222","angst":"\u00C5","angzarr":"\u237C","Aogon":"\u0104","aogon":"\u0105","Aopf":"\uD835\uDD38","aopf":"\uD835\uDD52","apacir":"\u2A6F","ap":"\u2248","apE":"\u2A70","ape":"\u224A","apid":"\u224B","apos":"'","ApplyFunction":"\u2061","approx":"\u2248","approxeq":"\u224A","Aring":"\u00C5","aring":"\u00E5","Ascr":"\uD835\uDC9C","ascr":"\uD835\uDCB6","Assign":"\u2254","ast":"*","asymp":"\u2248","asympeq":"\u224D","Atilde":"\u00C3","atilde":"\u00E3","Auml":"\u00C4","auml":"\u00E4","awconint":"\u2233","awint":"\u2A11","backcong":"\u224C","backepsilon":"\u03F6","backprime":"\u2035","backsim":"\u223D","backsimeq":"\u22CD","Backslash":"\u2216","Barv":"\u2AE7","barvee":"\u22BD","barwed":"\u2305","Barwed":"\u2306","barwedge":"\u2305","bbrk":"\u23B5","bbrktbrk":"\u23B6","bcong":"\u224C","Bcy":"\u0411","bcy":"\u0431","bdquo":"\u201E","becaus":"\u2235","because":"\u2235","Because":"\u2235","bemptyv":"\u29B0","bepsi":"\u03F6","bernou":"\u212C","Bernoullis":"\u212C","Beta":"\u0392","beta":"\u03B2","beth":"\u2136","between":"\u226C","Bfr":"\uD835\uDD05","bfr":"\uD835\uDD1F","bigcap":"\u22C2","bigcirc":"\u25EF","bigcup":"\u22C3","bigodot":"\u2A00","bigoplus":"\u2A01","bigotimes":"\u2A02","bigsqcup":"\u2A06","bigstar":"\u2605","bigtriangledown":"\u25BD","bigtriangleup":"\u25B3","biguplus":"\u2A04","bigvee":"\u22C1","bigwedge":"\u22C0","bkarow":"\u290D","blacklozenge":"\u29EB","blacksquare":"\u25AA","blacktriangle":"\u25B4","blacktriangledown":"\u25BE","blacktriangleleft":"\u25C2","blacktriangleright":"\u25B8","blank":"\u2423","blk12":"\u2592","blk14":"\u2591","blk34":"\u2593","block":"\u2588","bne":"=\u20E5","bnequiv":"\u2261\u20E5","bNot":"\u2AED","bnot":"\u2310","Bopf":"\uD835\uDD39","bopf":"\uD835\uDD53","bot":"\u22A5","bottom":"\u22A5","bowtie":"\u22C8","boxbox":"\u29C9","boxdl":"\u2510","boxdL":"\u2555","boxDl":"\u2556","boxDL":"\u2557","boxdr":"\u250C","boxdR":"\u2552","boxDr":"\u2553","boxDR":"\u2554","boxh":"\u2500","boxH":"\u2550","boxhd":"\u252C","boxHd":"\u2564","boxhD":"\u2565","boxHD":"\u2566","boxhu":"\u2534","boxHu":"\u2567","boxhU":"\u2568","boxHU":"\u2569","boxminus":"\u229F","boxplus":"\u229E","boxtimes":"\u22A0","boxul":"\u2518","boxuL":"\u255B","boxUl":"\u255C","boxUL":"\u255D","boxur":"\u2514","boxuR":"\u2558","boxUr":"\u2559","boxUR":"\u255A","boxv":"\u2502","boxV":"\u2551","boxvh":"\u253C","boxvH":"\u256A","boxVh":"\u256B","boxVH":"\u256C","boxvl":"\u2524","boxvL":"\u2561","boxVl":"\u2562","boxVL":"\u2563","boxvr":"\u251C","boxvR":"\u255E","boxVr":"\u255F","boxVR":"\u2560","bprime":"\u2035","breve":"\u02D8","Breve":"\u02D8","brvbar":"\u00A6","bscr":"\uD835\uDCB7","Bscr":"\u212C","bsemi":"\u204F","bsim":"\u223D","bsime":"\u22CD","bsolb":"\u29C5","bsol":"\\","bsolhsub":"\u27C8","bull":"\u2022","bullet":"\u2022","bump":"\u224E","bumpE":"\u2AAE","bumpe":"\u224F","Bumpeq":"\u224E","bumpeq":"\u224F","Cacute":"\u0106","cacute":"\u0107","capand":"\u2A44","capbrcup":"\u2A49","capcap":"\u2A4B","cap":"\u2229","Cap":"\u22D2","capcup":"\u2A47","capdot":"\u2A40","CapitalDifferentialD":"\u2145","caps":"\u2229\uFE00","caret":"\u2041","caron":"\u02C7","Cayleys":"\u212D","ccaps":"\u2A4D","Ccaron":"\u010C","ccaron":"\u010D","Ccedil":"\u00C7","ccedil":"\u00E7","Ccirc":"\u0108","ccirc":"\u0109","Cconint":"\u2230","ccups":"\u2A4C","ccupssm":"\u2A50","Cdot":"\u010A","cdot":"\u010B","cedil":"\u00B8","Cedilla":"\u00B8","cemptyv":"\u29B2","cent":"\u00A2","centerdot":"\u00B7","CenterDot":"\u00B7","cfr":"\uD835\uDD20","Cfr":"\u212D","CHcy":"\u0427","chcy":"\u0447","check":"\u2713","checkmark":"\u2713","Chi":"\u03A7","chi":"\u03C7","circ":"\u02C6","circeq":"\u2257","circlearrowleft":"\u21BA","circlearrowright":"\u21BB","circledast":"\u229B","circledcirc":"\u229A","circleddash":"\u229D","CircleDot":"\u2299","circledR":"\u00AE","circledS":"\u24C8","CircleMinus":"\u2296","CirclePlus":"\u2295","CircleTimes":"\u2297","cir":"\u25CB","cirE":"\u29C3","cire":"\u2257","cirfnint":"\u2A10","cirmid":"\u2AEF","cirscir":"\u29C2","ClockwiseContourIntegral":"\u2232","CloseCurlyDoubleQuote":"\u201D","CloseCurlyQuote":"\u2019","clubs":"\u2663","clubsuit":"\u2663","colon":":","Colon":"\u2237","Colone":"\u2A74","colone":"\u2254","coloneq":"\u2254","comma":",","commat":"@","comp":"\u2201","compfn":"\u2218","complement":"\u2201","complexes":"\u2102","cong":"\u2245","congdot":"\u2A6D","Congruent":"\u2261","conint":"\u222E","Conint":"\u222F","ContourIntegral":"\u222E","copf":"\uD835\uDD54","Copf":"\u2102","coprod":"\u2210","Coproduct":"\u2210","copy":"\u00A9","COPY":"\u00A9","copysr":"\u2117","CounterClockwiseContourIntegral":"\u2233","crarr":"\u21B5","cross":"\u2717","Cross":"\u2A2F","Cscr":"\uD835\uDC9E","cscr":"\uD835\uDCB8","csub":"\u2ACF","csube":"\u2AD1","csup":"\u2AD0","csupe":"\u2AD2","ctdot":"\u22EF","cudarrl":"\u2938","cudarrr":"\u2935","cuepr":"\u22DE","cuesc":"\u22DF","cularr":"\u21B6","cularrp":"\u293D","cupbrcap":"\u2A48","cupcap":"\u2A46","CupCap":"\u224D","cup":"\u222A","Cup":"\u22D3","cupcup":"\u2A4A","cupdot":"\u228D","cupor":"\u2A45","cups":"\u222A\uFE00","curarr":"\u21B7","curarrm":"\u293C","curlyeqprec":"\u22DE","curlyeqsucc":"\u22DF","curlyvee":"\u22CE","curlywedge":"\u22CF","curren":"\u00A4","curvearrowleft":"\u21B6","curvearrowright":"\u21B7","cuvee":"\u22CE","cuwed":"\u22CF","cwconint":"\u2232","cwint":"\u2231","cylcty":"\u232D","dagger":"\u2020","Dagger":"\u2021","daleth":"\u2138","darr":"\u2193","Darr":"\u21A1","dArr":"\u21D3","dash":"\u2010","Dashv":"\u2AE4","dashv":"\u22A3","dbkarow":"\u290F","dblac":"\u02DD","Dcaron":"\u010E","dcaron":"\u010F","Dcy":"\u0414","dcy":"\u0434","ddagger":"\u2021","ddarr":"\u21CA","DD":"\u2145","dd":"\u2146","DDotrahd":"\u2911","ddotseq":"\u2A77","deg":"\u00B0","Del":"\u2207","Delta":"\u0394","delta":"\u03B4","demptyv":"\u29B1","dfisht":"\u297F","Dfr":"\uD835\uDD07","dfr":"\uD835\uDD21","dHar":"\u2965","dharl":"\u21C3","dharr":"\u21C2","DiacriticalAcute":"\u00B4","DiacriticalDot":"\u02D9","DiacriticalDoubleAcute":"\u02DD","DiacriticalGrave":"`","DiacriticalTilde":"\u02DC","diam":"\u22C4","diamond":"\u22C4","Diamond":"\u22C4","diamondsuit":"\u2666","diams":"\u2666","die":"\u00A8","DifferentialD":"\u2146","digamma":"\u03DD","disin":"\u22F2","div":"\u00F7","divide":"\u00F7","divideontimes":"\u22C7","divonx":"\u22C7","DJcy":"\u0402","djcy":"\u0452","dlcorn":"\u231E","dlcrop":"\u230D","dollar":"$","Dopf":"\uD835\uDD3B","dopf":"\uD835\uDD55","Dot":"\u00A8","dot":"\u02D9","DotDot":"\u20DC","doteq":"\u2250","doteqdot":"\u2251","DotEqual":"\u2250","dotminus":"\u2238","dotplus":"\u2214","dotsquare":"\u22A1","doublebarwedge":"\u2306","DoubleContourIntegral":"\u222F","DoubleDot":"\u00A8","DoubleDownArrow":"\u21D3","DoubleLeftArrow":"\u21D0","DoubleLeftRightArrow":"\u21D4","DoubleLeftTee":"\u2AE4","DoubleLongLeftArrow":"\u27F8","DoubleLongLeftRightArrow":"\u27FA","DoubleLongRightArrow":"\u27F9","DoubleRightArrow":"\u21D2","DoubleRightTee":"\u22A8","DoubleUpArrow":"\u21D1","DoubleUpDownArrow":"\u21D5","DoubleVerticalBar":"\u2225","DownArrowBar":"\u2913","downarrow":"\u2193","DownArrow":"\u2193","Downarrow":"\u21D3","DownArrowUpArrow":"\u21F5","DownBreve":"\u0311","downdownarrows":"\u21CA","downharpoonleft":"\u21C3","downharpoonright":"\u21C2","DownLeftRightVector":"\u2950","DownLeftTeeVector":"\u295E","DownLeftVectorBar":"\u2956","DownLeftVector":"\u21BD","DownRightTeeVector":"\u295F","DownRightVectorBar":"\u2957","DownRightVector":"\u21C1","DownTeeArrow":"\u21A7","DownTee":"\u22A4","drbkarow":"\u2910","drcorn":"\u231F","drcrop":"\u230C","Dscr":"\uD835\uDC9F","dscr":"\uD835\uDCB9","DScy":"\u0405","dscy":"\u0455","dsol":"\u29F6","Dstrok":"\u0110","dstrok":"\u0111","dtdot":"\u22F1","dtri":"\u25BF","dtrif":"\u25BE","duarr":"\u21F5","duhar":"\u296F","dwangle":"\u29A6","DZcy":"\u040F","dzcy":"\u045F","dzigrarr":"\u27FF","Eacute":"\u00C9","eacute":"\u00E9","easter":"\u2A6E","Ecaron":"\u011A","ecaron":"\u011B","Ecirc":"\u00CA","ecirc":"\u00EA","ecir":"\u2256","ecolon":"\u2255","Ecy":"\u042D","ecy":"\u044D","eDDot":"\u2A77","Edot":"\u0116","edot":"\u0117","eDot":"\u2251","ee":"\u2147","efDot":"\u2252","Efr":"\uD835\uDD08","efr":"\uD835\uDD22","eg":"\u2A9A","Egrave":"\u00C8","egrave":"\u00E8","egs":"\u2A96","egsdot":"\u2A98","el":"\u2A99","Element":"\u2208","elinters":"\u23E7","ell":"\u2113","els":"\u2A95","elsdot":"\u2A97","Emacr":"\u0112","emacr":"\u0113","empty":"\u2205","emptyset":"\u2205","EmptySmallSquare":"\u25FB","emptyv":"\u2205","EmptyVerySmallSquare":"\u25AB","emsp13":"\u2004","emsp14":"\u2005","emsp":"\u2003","ENG":"\u014A","eng":"\u014B","ensp":"\u2002","Eogon":"\u0118","eogon":"\u0119","Eopf":"\uD835\uDD3C","eopf":"\uD835\uDD56","epar":"\u22D5","eparsl":"\u29E3","eplus":"\u2A71","epsi":"\u03B5","Epsilon":"\u0395","epsilon":"\u03B5","epsiv":"\u03F5","eqcirc":"\u2256","eqcolon":"\u2255","eqsim":"\u2242","eqslantgtr":"\u2A96","eqslantless":"\u2A95","Equal":"\u2A75","equals":"=","EqualTilde":"\u2242","equest":"\u225F","Equilibrium":"\u21CC","equiv":"\u2261","equivDD":"\u2A78","eqvparsl":"\u29E5","erarr":"\u2971","erDot":"\u2253","escr":"\u212F","Escr":"\u2130","esdot":"\u2250","Esim":"\u2A73","esim":"\u2242","Eta":"\u0397","eta":"\u03B7","ETH":"\u00D0","eth":"\u00F0","Euml":"\u00CB","euml":"\u00EB","euro":"\u20AC","excl":"!","exist":"\u2203","Exists":"\u2203","expectation":"\u2130","exponentiale":"\u2147","ExponentialE":"\u2147","fallingdotseq":"\u2252","Fcy":"\u0424","fcy":"\u0444","female":"\u2640","ffilig":"\uFB03","fflig":"\uFB00","ffllig":"\uFB04","Ffr":"\uD835\uDD09","ffr":"\uD835\uDD23","filig":"\uFB01","FilledSmallSquare":"\u25FC","FilledVerySmallSquare":"\u25AA","fjlig":"fj","flat":"\u266D","fllig":"\uFB02","fltns":"\u25B1","fnof":"\u0192","Fopf":"\uD835\uDD3D","fopf":"\uD835\uDD57","forall":"\u2200","ForAll":"\u2200","fork":"\u22D4","forkv":"\u2AD9","Fouriertrf":"\u2131","fpartint":"\u2A0D","frac12":"\u00BD","frac13":"\u2153","frac14":"\u00BC","frac15":"\u2155","frac16":"\u2159","frac18":"\u215B","frac23":"\u2154","frac25":"\u2156","frac34":"\u00BE","frac35":"\u2157","frac38":"\u215C","frac45":"\u2158","frac56":"\u215A","frac58":"\u215D","frac78":"\u215E","frasl":"\u2044","frown":"\u2322","fscr":"\uD835\uDCBB","Fscr":"\u2131","gacute":"\u01F5","Gamma":"\u0393","gamma":"\u03B3","Gammad":"\u03DC","gammad":"\u03DD","gap":"\u2A86","Gbreve":"\u011E","gbreve":"\u011F","Gcedil":"\u0122","Gcirc":"\u011C","gcirc":"\u011D","Gcy":"\u0413","gcy":"\u0433","Gdot":"\u0120","gdot":"\u0121","ge":"\u2265","gE":"\u2267","gEl":"\u2A8C","gel":"\u22DB","geq":"\u2265","geqq":"\u2267","geqslant":"\u2A7E","gescc":"\u2AA9","ges":"\u2A7E","gesdot":"\u2A80","gesdoto":"\u2A82","gesdotol":"\u2A84","gesl":"\u22DB\uFE00","gesles":"\u2A94","Gfr":"\uD835\uDD0A","gfr":"\uD835\uDD24","gg":"\u226B","Gg":"\u22D9","ggg":"\u22D9","gimel":"\u2137","GJcy":"\u0403","gjcy":"\u0453","gla":"\u2AA5","gl":"\u2277","glE":"\u2A92","glj":"\u2AA4","gnap":"\u2A8A","gnapprox":"\u2A8A","gne":"\u2A88","gnE":"\u2269","gneq":"\u2A88","gneqq":"\u2269","gnsim":"\u22E7","Gopf":"\uD835\uDD3E","gopf":"\uD835\uDD58","grave":"`","GreaterEqual":"\u2265","GreaterEqualLess":"\u22DB","GreaterFullEqual":"\u2267","GreaterGreater":"\u2AA2","GreaterLess":"\u2277","GreaterSlantEqual":"\u2A7E","GreaterTilde":"\u2273","Gscr":"\uD835\uDCA2","gscr":"\u210A","gsim":"\u2273","gsime":"\u2A8E","gsiml":"\u2A90","gtcc":"\u2AA7","gtcir":"\u2A7A","gt":">","GT":">","Gt":"\u226B","gtdot":"\u22D7","gtlPar":"\u2995","gtquest":"\u2A7C","gtrapprox":"\u2A86","gtrarr":"\u2978","gtrdot":"\u22D7","gtreqless":"\u22DB","gtreqqless":"\u2A8C","gtrless":"\u2277","gtrsim":"\u2273","gvertneqq":"\u2269\uFE00","gvnE":"\u2269\uFE00","Hacek":"\u02C7","hairsp":"\u200A","half":"\u00BD","hamilt":"\u210B","HARDcy":"\u042A","hardcy":"\u044A","harrcir":"\u2948","harr":"\u2194","hArr":"\u21D4","harrw":"\u21AD","Hat":"^","hbar":"\u210F","Hcirc":"\u0124","hcirc":"\u0125","hearts":"\u2665","heartsuit":"\u2665","hellip":"\u2026","hercon":"\u22B9","hfr":"\uD835\uDD25","Hfr":"\u210C","HilbertSpace":"\u210B","hksearow":"\u2925","hkswarow":"\u2926","hoarr":"\u21FF","homtht":"\u223B","hookleftarrow":"\u21A9","hookrightarrow":"\u21AA","hopf":"\uD835\uDD59","Hopf":"\u210D","horbar":"\u2015","HorizontalLine":"\u2500","hscr":"\uD835\uDCBD","Hscr":"\u210B","hslash":"\u210F","Hstrok":"\u0126","hstrok":"\u0127","HumpDownHump":"\u224E","HumpEqual":"\u224F","hybull":"\u2043","hyphen":"\u2010","Iacute":"\u00CD","iacute":"\u00ED","ic":"\u2063","Icirc":"\u00CE","icirc":"\u00EE","Icy":"\u0418","icy":"\u0438","Idot":"\u0130","IEcy":"\u0415","iecy":"\u0435","iexcl":"\u00A1","iff":"\u21D4","ifr":"\uD835\uDD26","Ifr":"\u2111","Igrave":"\u00CC","igrave":"\u00EC","ii":"\u2148","iiiint":"\u2A0C","iiint":"\u222D","iinfin":"\u29DC","iiota":"\u2129","IJlig":"\u0132","ijlig":"\u0133","Imacr":"\u012A","imacr":"\u012B","image":"\u2111","ImaginaryI":"\u2148","imagline":"\u2110","imagpart":"\u2111","imath":"\u0131","Im":"\u2111","imof":"\u22B7","imped":"\u01B5","Implies":"\u21D2","incare":"\u2105","in":"\u2208","infin":"\u221E","infintie":"\u29DD","inodot":"\u0131","intcal":"\u22BA","int":"\u222B","Int":"\u222C","integers":"\u2124","Integral":"\u222B","intercal":"\u22BA","Intersection":"\u22C2","intlarhk":"\u2A17","intprod":"\u2A3C","InvisibleComma":"\u2063","InvisibleTimes":"\u2062","IOcy":"\u0401","iocy":"\u0451","Iogon":"\u012E","iogon":"\u012F","Iopf":"\uD835\uDD40","iopf":"\uD835\uDD5A","Iota":"\u0399","iota":"\u03B9","iprod":"\u2A3C","iquest":"\u00BF","iscr":"\uD835\uDCBE","Iscr":"\u2110","isin":"\u2208","isindot":"\u22F5","isinE":"\u22F9","isins":"\u22F4","isinsv":"\u22F3","isinv":"\u2208","it":"\u2062","Itilde":"\u0128","itilde":"\u0129","Iukcy":"\u0406","iukcy":"\u0456","Iuml":"\u00CF","iuml":"\u00EF","Jcirc":"\u0134","jcirc":"\u0135","Jcy":"\u0419","jcy":"\u0439","Jfr":"\uD835\uDD0D","jfr":"\uD835\uDD27","jmath":"\u0237","Jopf":"\uD835\uDD41","jopf":"\uD835\uDD5B","Jscr":"\uD835\uDCA5","jscr":"\uD835\uDCBF","Jsercy":"\u0408","jsercy":"\u0458","Jukcy":"\u0404","jukcy":"\u0454","Kappa":"\u039A","kappa":"\u03BA","kappav":"\u03F0","Kcedil":"\u0136","kcedil":"\u0137","Kcy":"\u041A","kcy":"\u043A","Kfr":"\uD835\uDD0E","kfr":"\uD835\uDD28","kgreen":"\u0138","KHcy":"\u0425","khcy":"\u0445","KJcy":"\u040C","kjcy":"\u045C","Kopf":"\uD835\uDD42","kopf":"\uD835\uDD5C","Kscr":"\uD835\uDCA6","kscr":"\uD835\uDCC0","lAarr":"\u21DA","Lacute":"\u0139","lacute":"\u013A","laemptyv":"\u29B4","lagran":"\u2112","Lambda":"\u039B","lambda":"\u03BB","lang":"\u27E8","Lang":"\u27EA","langd":"\u2991","langle":"\u27E8","lap":"\u2A85","Laplacetrf":"\u2112","laquo":"\u00AB","larrb":"\u21E4","larrbfs":"\u291F","larr":"\u2190","Larr":"\u219E","lArr":"\u21D0","larrfs":"\u291D","larrhk":"\u21A9","larrlp":"\u21AB","larrpl":"\u2939","larrsim":"\u2973","larrtl":"\u21A2","latail":"\u2919","lAtail":"\u291B","lat":"\u2AAB","late":"\u2AAD","lates":"\u2AAD\uFE00","lbarr":"\u290C","lBarr":"\u290E","lbbrk":"\u2772","lbrace":"{","lbrack":"[","lbrke":"\u298B","lbrksld":"\u298F","lbrkslu":"\u298D","Lcaron":"\u013D","lcaron":"\u013E","Lcedil":"\u013B","lcedil":"\u013C","lceil":"\u2308","lcub":"{","Lcy":"\u041B","lcy":"\u043B","ldca":"\u2936","ldquo":"\u201C","ldquor":"\u201E","ldrdhar":"\u2967","ldrushar":"\u294B","ldsh":"\u21B2","le":"\u2264","lE":"\u2266","LeftAngleBracket":"\u27E8","LeftArrowBar":"\u21E4","leftarrow":"\u2190","LeftArrow":"\u2190","Leftarrow":"\u21D0","LeftArrowRightArrow":"\u21C6","leftarrowtail":"\u21A2","LeftCeiling":"\u2308","LeftDoubleBracket":"\u27E6","LeftDownTeeVector":"\u2961","LeftDownVectorBar":"\u2959","LeftDownVector":"\u21C3","LeftFloor":"\u230A","leftharpoondown":"\u21BD","leftharpoonup":"\u21BC","leftleftarrows":"\u21C7","leftrightarrow":"\u2194","LeftRightArrow":"\u2194","Leftrightarrow":"\u21D4","leftrightarrows":"\u21C6","leftrightharpoons":"\u21CB","leftrightsquigarrow":"\u21AD","LeftRightVector":"\u294E","LeftTeeArrow":"\u21A4","LeftTee":"\u22A3","LeftTeeVector":"\u295A","leftthreetimes":"\u22CB","LeftTriangleBar":"\u29CF","LeftTriangle":"\u22B2","LeftTriangleEqual":"\u22B4","LeftUpDownVector":"\u2951","LeftUpTeeVector":"\u2960","LeftUpVectorBar":"\u2958","LeftUpVector":"\u21BF","LeftVectorBar":"\u2952","LeftVector":"\u21BC","lEg":"\u2A8B","leg":"\u22DA","leq":"\u2264","leqq":"\u2266","leqslant":"\u2A7D","lescc":"\u2AA8","les":"\u2A7D","lesdot":"\u2A7F","lesdoto":"\u2A81","lesdotor":"\u2A83","lesg":"\u22DA\uFE00","lesges":"\u2A93","lessapprox":"\u2A85","lessdot":"\u22D6","lesseqgtr":"\u22DA","lesseqqgtr":"\u2A8B","LessEqualGreater":"\u22DA","LessFullEqual":"\u2266","LessGreater":"\u2276","lessgtr":"\u2276","LessLess":"\u2AA1","lesssim":"\u2272","LessSlantEqual":"\u2A7D","LessTilde":"\u2272","lfisht":"\u297C","lfloor":"\u230A","Lfr":"\uD835\uDD0F","lfr":"\uD835\uDD29","lg":"\u2276","lgE":"\u2A91","lHar":"\u2962","lhard":"\u21BD","lharu":"\u21BC","lharul":"\u296A","lhblk":"\u2584","LJcy":"\u0409","ljcy":"\u0459","llarr":"\u21C7","ll":"\u226A","Ll":"\u22D8","llcorner":"\u231E","Lleftarrow":"\u21DA","llhard":"\u296B","lltri":"\u25FA","Lmidot":"\u013F","lmidot":"\u0140","lmoustache":"\u23B0","lmoust":"\u23B0","lnap":"\u2A89","lnapprox":"\u2A89","lne":"\u2A87","lnE":"\u2268","lneq":"\u2A87","lneqq":"\u2268","lnsim":"\u22E6","loang":"\u27EC","loarr":"\u21FD","lobrk":"\u27E6","longleftarrow":"\u27F5","LongLeftArrow":"\u27F5","Longleftarrow":"\u27F8","longleftrightarrow":"\u27F7","LongLeftRightArrow":"\u27F7","Longleftrightarrow":"\u27FA","longmapsto":"\u27FC","longrightarrow":"\u27F6","LongRightArrow":"\u27F6","Longrightarrow":"\u27F9","looparrowleft":"\u21AB","looparrowright":"\u21AC","lopar":"\u2985","Lopf":"\uD835\uDD43","lopf":"\uD835\uDD5D","loplus":"\u2A2D","lotimes":"\u2A34","lowast":"\u2217","lowbar":"_","LowerLeftArrow":"\u2199","LowerRightArrow":"\u2198","loz":"\u25CA","lozenge":"\u25CA","lozf":"\u29EB","lpar":"(","lparlt":"\u2993","lrarr":"\u21C6","lrcorner":"\u231F","lrhar":"\u21CB","lrhard":"\u296D","lrm":"\u200E","lrtri":"\u22BF","lsaquo":"\u2039","lscr":"\uD835\uDCC1","Lscr":"\u2112","lsh":"\u21B0","Lsh":"\u21B0","lsim":"\u2272","lsime":"\u2A8D","lsimg":"\u2A8F","lsqb":"[","lsquo":"\u2018","lsquor":"\u201A","Lstrok":"\u0141","lstrok":"\u0142","ltcc":"\u2AA6","ltcir":"\u2A79","lt":"<","LT":"<","Lt":"\u226A","ltdot":"\u22D6","lthree":"\u22CB","ltimes":"\u22C9","ltlarr":"\u2976","ltquest":"\u2A7B","ltri":"\u25C3","ltrie":"\u22B4","ltrif":"\u25C2","ltrPar":"\u2996","lurdshar":"\u294A","luruhar":"\u2966","lvertneqq":"\u2268\uFE00","lvnE":"\u2268\uFE00","macr":"\u00AF","male":"\u2642","malt":"\u2720","maltese":"\u2720","Map":"\u2905","map":"\u21A6","mapsto":"\u21A6","mapstodown":"\u21A7","mapstoleft":"\u21A4","mapstoup":"\u21A5","marker":"\u25AE","mcomma":"\u2A29","Mcy":"\u041C","mcy":"\u043C","mdash":"\u2014","mDDot":"\u223A","measuredangle":"\u2221","MediumSpace":"\u205F","Mellintrf":"\u2133","Mfr":"\uD835\uDD10","mfr":"\uD835\uDD2A","mho":"\u2127","micro":"\u00B5","midast":"*","midcir":"\u2AF0","mid":"\u2223","middot":"\u00B7","minusb":"\u229F","minus":"\u2212","minusd":"\u2238","minusdu":"\u2A2A","MinusPlus":"\u2213","mlcp":"\u2ADB","mldr":"\u2026","mnplus":"\u2213","models":"\u22A7","Mopf":"\uD835\uDD44","mopf":"\uD835\uDD5E","mp":"\u2213","mscr":"\uD835\uDCC2","Mscr":"\u2133","mstpos":"\u223E","Mu":"\u039C","mu":"\u03BC","multimap":"\u22B8","mumap":"\u22B8","nabla":"\u2207","Nacute":"\u0143","nacute":"\u0144","nang":"\u2220\u20D2","nap":"\u2249","napE":"\u2A70\u0338","napid":"\u224B\u0338","napos":"\u0149","napprox":"\u2249","natural":"\u266E","naturals":"\u2115","natur":"\u266E","nbsp":"\u00A0","nbump":"\u224E\u0338","nbumpe":"\u224F\u0338","ncap":"\u2A43","Ncaron":"\u0147","ncaron":"\u0148","Ncedil":"\u0145","ncedil":"\u0146","ncong":"\u2247","ncongdot":"\u2A6D\u0338","ncup":"\u2A42","Ncy":"\u041D","ncy":"\u043D","ndash":"\u2013","nearhk":"\u2924","nearr":"\u2197","neArr":"\u21D7","nearrow":"\u2197","ne":"\u2260","nedot":"\u2250\u0338","NegativeMediumSpace":"\u200B","NegativeThickSpace":"\u200B","NegativeThinSpace":"\u200B","NegativeVeryThinSpace":"\u200B","nequiv":"\u2262","nesear":"\u2928","nesim":"\u2242\u0338","NestedGreaterGreater":"\u226B","NestedLessLess":"\u226A","NewLine":"\n","nexist":"\u2204","nexists":"\u2204","Nfr":"\uD835\uDD11","nfr":"\uD835\uDD2B","ngE":"\u2267\u0338","nge":"\u2271","ngeq":"\u2271","ngeqq":"\u2267\u0338","ngeqslant":"\u2A7E\u0338","nges":"\u2A7E\u0338","nGg":"\u22D9\u0338","ngsim":"\u2275","nGt":"\u226B\u20D2","ngt":"\u226F","ngtr":"\u226F","nGtv":"\u226B\u0338","nharr":"\u21AE","nhArr":"\u21CE","nhpar":"\u2AF2","ni":"\u220B","nis":"\u22FC","nisd":"\u22FA","niv":"\u220B","NJcy":"\u040A","njcy":"\u045A","nlarr":"\u219A","nlArr":"\u21CD","nldr":"\u2025","nlE":"\u2266\u0338","nle":"\u2270","nleftarrow":"\u219A","nLeftarrow":"\u21CD","nleftrightarrow":"\u21AE","nLeftrightarrow":"\u21CE","nleq":"\u2270","nleqq":"\u2266\u0338","nleqslant":"\u2A7D\u0338","nles":"\u2A7D\u0338","nless":"\u226E","nLl":"\u22D8\u0338","nlsim":"\u2274","nLt":"\u226A\u20D2","nlt":"\u226E","nltri":"\u22EA","nltrie":"\u22EC","nLtv":"\u226A\u0338","nmid":"\u2224","NoBreak":"\u2060","NonBreakingSpace":"\u00A0","nopf":"\uD835\uDD5F","Nopf":"\u2115","Not":"\u2AEC","not":"\u00AC","NotCongruent":"\u2262","NotCupCap":"\u226D","NotDoubleVerticalBar":"\u2226","NotElement":"\u2209","NotEqual":"\u2260","NotEqualTilde":"\u2242\u0338","NotExists":"\u2204","NotGreater":"\u226F","NotGreaterEqual":"\u2271","NotGreaterFullEqual":"\u2267\u0338","NotGreaterGreater":"\u226B\u0338","NotGreaterLess":"\u2279","NotGreaterSlantEqual":"\u2A7E\u0338","NotGreaterTilde":"\u2275","NotHumpDownHump":"\u224E\u0338","NotHumpEqual":"\u224F\u0338","notin":"\u2209","notindot":"\u22F5\u0338","notinE":"\u22F9\u0338","notinva":"\u2209","notinvb":"\u22F7","notinvc":"\u22F6","NotLeftTriangleBar":"\u29CF\u0338","NotLeftTriangle":"\u22EA","NotLeftTriangleEqual":"\u22EC","NotLess":"\u226E","NotLessEqual":"\u2270","NotLessGreater":"\u2278","NotLessLess":"\u226A\u0338","NotLessSlantEqual":"\u2A7D\u0338","NotLessTilde":"\u2274","NotNestedGreaterGreater":"\u2AA2\u0338","NotNestedLessLess":"\u2AA1\u0338","notni":"\u220C","notniva":"\u220C","notnivb":"\u22FE","notnivc":"\u22FD","NotPrecedes":"\u2280","NotPrecedesEqual":"\u2AAF\u0338","NotPrecedesSlantEqual":"\u22E0","NotReverseElement":"\u220C","NotRightTriangleBar":"\u29D0\u0338","NotRightTriangle":"\u22EB","NotRightTriangleEqual":"\u22ED","NotSquareSubset":"\u228F\u0338","NotSquareSubsetEqual":"\u22E2","NotSquareSuperset":"\u2290\u0338","NotSquareSupersetEqual":"\u22E3","NotSubset":"\u2282\u20D2","NotSubsetEqual":"\u2288","NotSucceeds":"\u2281","NotSucceedsEqual":"\u2AB0\u0338","NotSucceedsSlantEqual":"\u22E1","NotSucceedsTilde":"\u227F\u0338","NotSuperset":"\u2283\u20D2","NotSupersetEqual":"\u2289","NotTilde":"\u2241","NotTildeEqual":"\u2244","NotTildeFullEqual":"\u2247","NotTildeTilde":"\u2249","NotVerticalBar":"\u2224","nparallel":"\u2226","npar":"\u2226","nparsl":"\u2AFD\u20E5","npart":"\u2202\u0338","npolint":"\u2A14","npr":"\u2280","nprcue":"\u22E0","nprec":"\u2280","npreceq":"\u2AAF\u0338","npre":"\u2AAF\u0338","nrarrc":"\u2933\u0338","nrarr":"\u219B","nrArr":"\u21CF","nrarrw":"\u219D\u0338","nrightarrow":"\u219B","nRightarrow":"\u21CF","nrtri":"\u22EB","nrtrie":"\u22ED","nsc":"\u2281","nsccue":"\u22E1","nsce":"\u2AB0\u0338","Nscr":"\uD835\uDCA9","nscr":"\uD835\uDCC3","nshortmid":"\u2224","nshortparallel":"\u2226","nsim":"\u2241","nsime":"\u2244","nsimeq":"\u2244","nsmid":"\u2224","nspar":"\u2226","nsqsube":"\u22E2","nsqsupe":"\u22E3","nsub":"\u2284","nsubE":"\u2AC5\u0338","nsube":"\u2288","nsubset":"\u2282\u20D2","nsubseteq":"\u2288","nsubseteqq":"\u2AC5\u0338","nsucc":"\u2281","nsucceq":"\u2AB0\u0338","nsup":"\u2285","nsupE":"\u2AC6\u0338","nsupe":"\u2289","nsupset":"\u2283\u20D2","nsupseteq":"\u2289","nsupseteqq":"\u2AC6\u0338","ntgl":"\u2279","Ntilde":"\u00D1","ntilde":"\u00F1","ntlg":"\u2278","ntriangleleft":"\u22EA","ntrianglelefteq":"\u22EC","ntriangleright":"\u22EB","ntrianglerighteq":"\u22ED","Nu":"\u039D","nu":"\u03BD","num":"#","numero":"\u2116","numsp":"\u2007","nvap":"\u224D\u20D2","nvdash":"\u22AC","nvDash":"\u22AD","nVdash":"\u22AE","nVDash":"\u22AF","nvge":"\u2265\u20D2","nvgt":">\u20D2","nvHarr":"\u2904","nvinfin":"\u29DE","nvlArr":"\u2902","nvle":"\u2264\u20D2","nvlt":"<\u20D2","nvltrie":"\u22B4\u20D2","nvrArr":"\u2903","nvrtrie":"\u22B5\u20D2","nvsim":"\u223C\u20D2","nwarhk":"\u2923","nwarr":"\u2196","nwArr":"\u21D6","nwarrow":"\u2196","nwnear":"\u2927","Oacute":"\u00D3","oacute":"\u00F3","oast":"\u229B","Ocirc":"\u00D4","ocirc":"\u00F4","ocir":"\u229A","Ocy":"\u041E","ocy":"\u043E","odash":"\u229D","Odblac":"\u0150","odblac":"\u0151","odiv":"\u2A38","odot":"\u2299","odsold":"\u29BC","OElig":"\u0152","oelig":"\u0153","ofcir":"\u29BF","Ofr":"\uD835\uDD12","ofr":"\uD835\uDD2C","ogon":"\u02DB","Ograve":"\u00D2","ograve":"\u00F2","ogt":"\u29C1","ohbar":"\u29B5","ohm":"\u03A9","oint":"\u222E","olarr":"\u21BA","olcir":"\u29BE","olcross":"\u29BB","oline":"\u203E","olt":"\u29C0","Omacr":"\u014C","omacr":"\u014D","Omega":"\u03A9","omega":"\u03C9","Omicron":"\u039F","omicron":"\u03BF","omid":"\u29B6","ominus":"\u2296","Oopf":"\uD835\uDD46","oopf":"\uD835\uDD60","opar":"\u29B7","OpenCurlyDoubleQuote":"\u201C","OpenCurlyQuote":"\u2018","operp":"\u29B9","oplus":"\u2295","orarr":"\u21BB","Or":"\u2A54","or":"\u2228","ord":"\u2A5D","order":"\u2134","orderof":"\u2134","ordf":"\u00AA","ordm":"\u00BA","origof":"\u22B6","oror":"\u2A56","orslope":"\u2A57","orv":"\u2A5B","oS":"\u24C8","Oscr":"\uD835\uDCAA","oscr":"\u2134","Oslash":"\u00D8","oslash":"\u00F8","osol":"\u2298","Otilde":"\u00D5","otilde":"\u00F5","otimesas":"\u2A36","Otimes":"\u2A37","otimes":"\u2297","Ouml":"\u00D6","ouml":"\u00F6","ovbar":"\u233D","OverBar":"\u203E","OverBrace":"\u23DE","OverBracket":"\u23B4","OverParenthesis":"\u23DC","para":"\u00B6","parallel":"\u2225","par":"\u2225","parsim":"\u2AF3","parsl":"\u2AFD","part":"\u2202","PartialD":"\u2202","Pcy":"\u041F","pcy":"\u043F","percnt":"%","period":".","permil":"\u2030","perp":"\u22A5","pertenk":"\u2031","Pfr":"\uD835\uDD13","pfr":"\uD835\uDD2D","Phi":"\u03A6","phi":"\u03C6","phiv":"\u03D5","phmmat":"\u2133","phone":"\u260E","Pi":"\u03A0","pi":"\u03C0","pitchfork":"\u22D4","piv":"\u03D6","planck":"\u210F","planckh":"\u210E","plankv":"\u210F","plusacir":"\u2A23","plusb":"\u229E","pluscir":"\u2A22","plus":"+","plusdo":"\u2214","plusdu":"\u2A25","pluse":"\u2A72","PlusMinus":"\u00B1","plusmn":"\u00B1","plussim":"\u2A26","plustwo":"\u2A27","pm":"\u00B1","Poincareplane":"\u210C","pointint":"\u2A15","popf":"\uD835\uDD61","Popf":"\u2119","pound":"\u00A3","prap":"\u2AB7","Pr":"\u2ABB","pr":"\u227A","prcue":"\u227C","precapprox":"\u2AB7","prec":"\u227A","preccurlyeq":"\u227C","Precedes":"\u227A","PrecedesEqual":"\u2AAF","PrecedesSlantEqual":"\u227C","PrecedesTilde":"\u227E","preceq":"\u2AAF","precnapprox":"\u2AB9","precneqq":"\u2AB5","precnsim":"\u22E8","pre":"\u2AAF","prE":"\u2AB3","precsim":"\u227E","prime":"\u2032","Prime":"\u2033","primes":"\u2119","prnap":"\u2AB9","prnE":"\u2AB5","prnsim":"\u22E8","prod":"\u220F","Product":"\u220F","profalar":"\u232E","profline":"\u2312","profsurf":"\u2313","prop":"\u221D","Proportional":"\u221D","Proportion":"\u2237","propto":"\u221D","prsim":"\u227E","prurel":"\u22B0","Pscr":"\uD835\uDCAB","pscr":"\uD835\uDCC5","Psi":"\u03A8","psi":"\u03C8","puncsp":"\u2008","Qfr":"\uD835\uDD14","qfr":"\uD835\uDD2E","qint":"\u2A0C","qopf":"\uD835\uDD62","Qopf":"\u211A","qprime":"\u2057","Qscr":"\uD835\uDCAC","qscr":"\uD835\uDCC6","quaternions":"\u210D","quatint":"\u2A16","quest":"?","questeq":"\u225F","quot":"\"","QUOT":"\"","rAarr":"\u21DB","race":"\u223D\u0331","Racute":"\u0154","racute":"\u0155","radic":"\u221A","raemptyv":"\u29B3","rang":"\u27E9","Rang":"\u27EB","rangd":"\u2992","range":"\u29A5","rangle":"\u27E9","raquo":"\u00BB","rarrap":"\u2975","rarrb":"\u21E5","rarrbfs":"\u2920","rarrc":"\u2933","rarr":"\u2192","Rarr":"\u21A0","rArr":"\u21D2","rarrfs":"\u291E","rarrhk":"\u21AA","rarrlp":"\u21AC","rarrpl":"\u2945","rarrsim":"\u2974","Rarrtl":"\u2916","rarrtl":"\u21A3","rarrw":"\u219D","ratail":"\u291A","rAtail":"\u291C","ratio":"\u2236","rationals":"\u211A","rbarr":"\u290D","rBarr":"\u290F","RBarr":"\u2910","rbbrk":"\u2773","rbrace":"}","rbrack":"]","rbrke":"\u298C","rbrksld":"\u298E","rbrkslu":"\u2990","Rcaron":"\u0158","rcaron":"\u0159","Rcedil":"\u0156","rcedil":"\u0157","rceil":"\u2309","rcub":"}","Rcy":"\u0420","rcy":"\u0440","rdca":"\u2937","rdldhar":"\u2969","rdquo":"\u201D","rdquor":"\u201D","rdsh":"\u21B3","real":"\u211C","realine":"\u211B","realpart":"\u211C","reals":"\u211D","Re":"\u211C","rect":"\u25AD","reg":"\u00AE","REG":"\u00AE","ReverseElement":"\u220B","ReverseEquilibrium":"\u21CB","ReverseUpEquilibrium":"\u296F","rfisht":"\u297D","rfloor":"\u230B","rfr":"\uD835\uDD2F","Rfr":"\u211C","rHar":"\u2964","rhard":"\u21C1","rharu":"\u21C0","rharul":"\u296C","Rho":"\u03A1","rho":"\u03C1","rhov":"\u03F1","RightAngleBracket":"\u27E9","RightArrowBar":"\u21E5","rightarrow":"\u2192","RightArrow":"\u2192","Rightarrow":"\u21D2","RightArrowLeftArrow":"\u21C4","rightarrowtail":"\u21A3","RightCeiling":"\u2309","RightDoubleBracket":"\u27E7","RightDownTeeVector":"\u295D","RightDownVectorBar":"\u2955","RightDownVector":"\u21C2","RightFloor":"\u230B","rightharpoondown":"\u21C1","rightharpoonup":"\u21C0","rightleftarrows":"\u21C4","rightleftharpoons":"\u21CC","rightrightarrows":"\u21C9","rightsquigarrow":"\u219D","RightTeeArrow":"\u21A6","RightTee":"\u22A2","RightTeeVector":"\u295B","rightthreetimes":"\u22CC","RightTriangleBar":"\u29D0","RightTriangle":"\u22B3","RightTriangleEqual":"\u22B5","RightUpDownVector":"\u294F","RightUpTeeVector":"\u295C","RightUpVectorBar":"\u2954","RightUpVector":"\u21BE","RightVectorBar":"\u2953","RightVector":"\u21C0","ring":"\u02DA","risingdotseq":"\u2253","rlarr":"\u21C4","rlhar":"\u21CC","rlm":"\u200F","rmoustache":"\u23B1","rmoust":"\u23B1","rnmid":"\u2AEE","roang":"\u27ED","roarr":"\u21FE","robrk":"\u27E7","ropar":"\u2986","ropf":"\uD835\uDD63","Ropf":"\u211D","roplus":"\u2A2E","rotimes":"\u2A35","RoundImplies":"\u2970","rpar":")","rpargt":"\u2994","rppolint":"\u2A12","rrarr":"\u21C9","Rrightarrow":"\u21DB","rsaquo":"\u203A","rscr":"\uD835\uDCC7","Rscr":"\u211B","rsh":"\u21B1","Rsh":"\u21B1","rsqb":"]","rsquo":"\u2019","rsquor":"\u2019","rthree":"\u22CC","rtimes":"\u22CA","rtri":"\u25B9","rtrie":"\u22B5","rtrif":"\u25B8","rtriltri":"\u29CE","RuleDelayed":"\u29F4","ruluhar":"\u2968","rx":"\u211E","Sacute":"\u015A","sacute":"\u015B","sbquo":"\u201A","scap":"\u2AB8","Scaron":"\u0160","scaron":"\u0161","Sc":"\u2ABC","sc":"\u227B","sccue":"\u227D","sce":"\u2AB0","scE":"\u2AB4","Scedil":"\u015E","scedil":"\u015F","Scirc":"\u015C","scirc":"\u015D","scnap":"\u2ABA","scnE":"\u2AB6","scnsim":"\u22E9","scpolint":"\u2A13","scsim":"\u227F","Scy":"\u0421","scy":"\u0441","sdotb":"\u22A1","sdot":"\u22C5","sdote":"\u2A66","searhk":"\u2925","searr":"\u2198","seArr":"\u21D8","searrow":"\u2198","sect":"\u00A7","semi":";","seswar":"\u2929","setminus":"\u2216","setmn":"\u2216","sext":"\u2736","Sfr":"\uD835\uDD16","sfr":"\uD835\uDD30","sfrown":"\u2322","sharp":"\u266F","SHCHcy":"\u0429","shchcy":"\u0449","SHcy":"\u0428","shcy":"\u0448","ShortDownArrow":"\u2193","ShortLeftArrow":"\u2190","shortmid":"\u2223","shortparallel":"\u2225","ShortRightArrow":"\u2192","ShortUpArrow":"\u2191","shy":"\u00AD","Sigma":"\u03A3","sigma":"\u03C3","sigmaf":"\u03C2","sigmav":"\u03C2","sim":"\u223C","simdot":"\u2A6A","sime":"\u2243","simeq":"\u2243","simg":"\u2A9E","simgE":"\u2AA0","siml":"\u2A9D","simlE":"\u2A9F","simne":"\u2246","simplus":"\u2A24","simrarr":"\u2972","slarr":"\u2190","SmallCircle":"\u2218","smallsetminus":"\u2216","smashp":"\u2A33","smeparsl":"\u29E4","smid":"\u2223","smile":"\u2323","smt":"\u2AAA","smte":"\u2AAC","smtes":"\u2AAC\uFE00","SOFTcy":"\u042C","softcy":"\u044C","solbar":"\u233F","solb":"\u29C4","sol":"/","Sopf":"\uD835\uDD4A","sopf":"\uD835\uDD64","spades":"\u2660","spadesuit":"\u2660","spar":"\u2225","sqcap":"\u2293","sqcaps":"\u2293\uFE00","sqcup":"\u2294","sqcups":"\u2294\uFE00","Sqrt":"\u221A","sqsub":"\u228F","sqsube":"\u2291","sqsubset":"\u228F","sqsubseteq":"\u2291","sqsup":"\u2290","sqsupe":"\u2292","sqsupset":"\u2290","sqsupseteq":"\u2292","square":"\u25A1","Square":"\u25A1","SquareIntersection":"\u2293","SquareSubset":"\u228F","SquareSubsetEqual":"\u2291","SquareSuperset":"\u2290","SquareSupersetEqual":"\u2292","SquareUnion":"\u2294","squarf":"\u25AA","squ":"\u25A1","squf":"\u25AA","srarr":"\u2192","Sscr":"\uD835\uDCAE","sscr":"\uD835\uDCC8","ssetmn":"\u2216","ssmile":"\u2323","sstarf":"\u22C6","Star":"\u22C6","star":"\u2606","starf":"\u2605","straightepsilon":"\u03F5","straightphi":"\u03D5","strns":"\u00AF","sub":"\u2282","Sub":"\u22D0","subdot":"\u2ABD","subE":"\u2AC5","sube":"\u2286","subedot":"\u2AC3","submult":"\u2AC1","subnE":"\u2ACB","subne":"\u228A","subplus":"\u2ABF","subrarr":"\u2979","subset":"\u2282","Subset":"\u22D0","subseteq":"\u2286","subseteqq":"\u2AC5","SubsetEqual":"\u2286","subsetneq":"\u228A","subsetneqq":"\u2ACB","subsim":"\u2AC7","subsub":"\u2AD5","subsup":"\u2AD3","succapprox":"\u2AB8","succ":"\u227B","succcurlyeq":"\u227D","Succeeds":"\u227B","SucceedsEqual":"\u2AB0","SucceedsSlantEqual":"\u227D","SucceedsTilde":"\u227F","succeq":"\u2AB0","succnapprox":"\u2ABA","succneqq":"\u2AB6","succnsim":"\u22E9","succsim":"\u227F","SuchThat":"\u220B","sum":"\u2211","Sum":"\u2211","sung":"\u266A","sup1":"\u00B9","sup2":"\u00B2","sup3":"\u00B3","sup":"\u2283","Sup":"\u22D1","supdot":"\u2ABE","supdsub":"\u2AD8","supE":"\u2AC6","supe":"\u2287","supedot":"\u2AC4","Superset":"\u2283","SupersetEqual":"\u2287","suphsol":"\u27C9","suphsub":"\u2AD7","suplarr":"\u297B","supmult":"\u2AC2","supnE":"\u2ACC","supne":"\u228B","supplus":"\u2AC0","supset":"\u2283","Supset":"\u22D1","supseteq":"\u2287","supseteqq":"\u2AC6","supsetneq":"\u228B","supsetneqq":"\u2ACC","supsim":"\u2AC8","supsub":"\u2AD4","supsup":"\u2AD6","swarhk":"\u2926","swarr":"\u2199","swArr":"\u21D9","swarrow":"\u2199","swnwar":"\u292A","szlig":"\u00DF","Tab":"\t","target":"\u2316","Tau":"\u03A4","tau":"\u03C4","tbrk":"\u23B4","Tcaron":"\u0164","tcaron":"\u0165","Tcedil":"\u0162","tcedil":"\u0163","Tcy":"\u0422","tcy":"\u0442","tdot":"\u20DB","telrec":"\u2315","Tfr":"\uD835\uDD17","tfr":"\uD835\uDD31","there4":"\u2234","therefore":"\u2234","Therefore":"\u2234","Theta":"\u0398","theta":"\u03B8","thetasym":"\u03D1","thetav":"\u03D1","thickapprox":"\u2248","thicksim":"\u223C","ThickSpace":"\u205F\u200A","ThinSpace":"\u2009","thinsp":"\u2009","thkap":"\u2248","thksim":"\u223C","THORN":"\u00DE","thorn":"\u00FE","tilde":"\u02DC","Tilde":"\u223C","TildeEqual":"\u2243","TildeFullEqual":"\u2245","TildeTilde":"\u2248","timesbar":"\u2A31","timesb":"\u22A0","times":"\u00D7","timesd":"\u2A30","tint":"\u222D","toea":"\u2928","topbot":"\u2336","topcir":"\u2AF1","top":"\u22A4","Topf":"\uD835\uDD4B","topf":"\uD835\uDD65","topfork":"\u2ADA","tosa":"\u2929","tprime":"\u2034","trade":"\u2122","TRADE":"\u2122","triangle":"\u25B5","triangledown":"\u25BF","triangleleft":"\u25C3","trianglelefteq":"\u22B4","triangleq":"\u225C","triangleright":"\u25B9","trianglerighteq":"\u22B5","tridot":"\u25EC","trie":"\u225C","triminus":"\u2A3A","TripleDot":"\u20DB","triplus":"\u2A39","trisb":"\u29CD","tritime":"\u2A3B","trpezium":"\u23E2","Tscr":"\uD835\uDCAF","tscr":"\uD835\uDCC9","TScy":"\u0426","tscy":"\u0446","TSHcy":"\u040B","tshcy":"\u045B","Tstrok":"\u0166","tstrok":"\u0167","twixt":"\u226C","twoheadleftarrow":"\u219E","twoheadrightarrow":"\u21A0","Uacute":"\u00DA","uacute":"\u00FA","uarr":"\u2191","Uarr":"\u219F","uArr":"\u21D1","Uarrocir":"\u2949","Ubrcy":"\u040E","ubrcy":"\u045E","Ubreve":"\u016C","ubreve":"\u016D","Ucirc":"\u00DB","ucirc":"\u00FB","Ucy":"\u0423","ucy":"\u0443","udarr":"\u21C5","Udblac":"\u0170","udblac":"\u0171","udhar":"\u296E","ufisht":"\u297E","Ufr":"\uD835\uDD18","ufr":"\uD835\uDD32","Ugrave":"\u00D9","ugrave":"\u00F9","uHar":"\u2963","uharl":"\u21BF","uharr":"\u21BE","uhblk":"\u2580","ulcorn":"\u231C","ulcorner":"\u231C","ulcrop":"\u230F","ultri":"\u25F8","Umacr":"\u016A","umacr":"\u016B","uml":"\u00A8","UnderBar":"_","UnderBrace":"\u23DF","UnderBracket":"\u23B5","UnderParenthesis":"\u23DD","Union":"\u22C3","UnionPlus":"\u228E","Uogon":"\u0172","uogon":"\u0173","Uopf":"\uD835\uDD4C","uopf":"\uD835\uDD66","UpArrowBar":"\u2912","uparrow":"\u2191","UpArrow":"\u2191","Uparrow":"\u21D1","UpArrowDownArrow":"\u21C5","updownarrow":"\u2195","UpDownArrow":"\u2195","Updownarrow":"\u21D5","UpEquilibrium":"\u296E","upharpoonleft":"\u21BF","upharpoonright":"\u21BE","uplus":"\u228E","UpperLeftArrow":"\u2196","UpperRightArrow":"\u2197","upsi":"\u03C5","Upsi":"\u03D2","upsih":"\u03D2","Upsilon":"\u03A5","upsilon":"\u03C5","UpTeeArrow":"\u21A5","UpTee":"\u22A5","upuparrows":"\u21C8","urcorn":"\u231D","urcorner":"\u231D","urcrop":"\u230E","Uring":"\u016E","uring":"\u016F","urtri":"\u25F9","Uscr":"\uD835\uDCB0","uscr":"\uD835\uDCCA","utdot":"\u22F0","Utilde":"\u0168","utilde":"\u0169","utri":"\u25B5","utrif":"\u25B4","uuarr":"\u21C8","Uuml":"\u00DC","uuml":"\u00FC","uwangle":"\u29A7","vangrt":"\u299C","varepsilon":"\u03F5","varkappa":"\u03F0","varnothing":"\u2205","varphi":"\u03D5","varpi":"\u03D6","varpropto":"\u221D","varr":"\u2195","vArr":"\u21D5","varrho":"\u03F1","varsigma":"\u03C2","varsubsetneq":"\u228A\uFE00","varsubsetneqq":"\u2ACB\uFE00","varsupsetneq":"\u228B\uFE00","varsupsetneqq":"\u2ACC\uFE00","vartheta":"\u03D1","vartriangleleft":"\u22B2","vartriangleright":"\u22B3","vBar":"\u2AE8","Vbar":"\u2AEB","vBarv":"\u2AE9","Vcy":"\u0412","vcy":"\u0432","vdash":"\u22A2","vDash":"\u22A8","Vdash":"\u22A9","VDash":"\u22AB","Vdashl":"\u2AE6","veebar":"\u22BB","vee":"\u2228","Vee":"\u22C1","veeeq":"\u225A","vellip":"\u22EE","verbar":"|","Verbar":"\u2016","vert":"|","Vert":"\u2016","VerticalBar":"\u2223","VerticalLine":"|","VerticalSeparator":"\u2758","VerticalTilde":"\u2240","VeryThinSpace":"\u200A","Vfr":"\uD835\uDD19","vfr":"\uD835\uDD33","vltri":"\u22B2","vnsub":"\u2282\u20D2","vnsup":"\u2283\u20D2","Vopf":"\uD835\uDD4D","vopf":"\uD835\uDD67","vprop":"\u221D","vrtri":"\u22B3","Vscr":"\uD835\uDCB1","vscr":"\uD835\uDCCB","vsubnE":"\u2ACB\uFE00","vsubne":"\u228A\uFE00","vsupnE":"\u2ACC\uFE00","vsupne":"\u228B\uFE00","Vvdash":"\u22AA","vzigzag":"\u299A","Wcirc":"\u0174","wcirc":"\u0175","wedbar":"\u2A5F","wedge":"\u2227","Wedge":"\u22C0","wedgeq":"\u2259","weierp":"\u2118","Wfr":"\uD835\uDD1A","wfr":"\uD835\uDD34","Wopf":"\uD835\uDD4E","wopf":"\uD835\uDD68","wp":"\u2118","wr":"\u2240","wreath":"\u2240","Wscr":"\uD835\uDCB2","wscr":"\uD835\uDCCC","xcap":"\u22C2","xcirc":"\u25EF","xcup":"\u22C3","xdtri":"\u25BD","Xfr":"\uD835\uDD1B","xfr":"\uD835\uDD35","xharr":"\u27F7","xhArr":"\u27FA","Xi":"\u039E","xi":"\u03BE","xlarr":"\u27F5","xlArr":"\u27F8","xmap":"\u27FC","xnis":"\u22FB","xodot":"\u2A00","Xopf":"\uD835\uDD4F","xopf":"\uD835\uDD69","xoplus":"\u2A01","xotime":"\u2A02","xrarr":"\u27F6","xrArr":"\u27F9","Xscr":"\uD835\uDCB3","xscr":"\uD835\uDCCD","xsqcup":"\u2A06","xuplus":"\u2A04","xutri":"\u25B3","xvee":"\u22C1","xwedge":"\u22C0","Yacute":"\u00DD","yacute":"\u00FD","YAcy":"\u042F","yacy":"\u044F","Ycirc":"\u0176","ycirc":"\u0177","Ycy":"\u042B","ycy":"\u044B","yen":"\u00A5","Yfr":"\uD835\uDD1C","yfr":"\uD835\uDD36","YIcy":"\u0407","yicy":"\u0457","Yopf":"\uD835\uDD50","yopf":"\uD835\uDD6A","Yscr":"\uD835\uDCB4","yscr":"\uD835\uDCCE","YUcy":"\u042E","yucy":"\u044E","yuml":"\u00FF","Yuml":"\u0178","Zacute":"\u0179","zacute":"\u017A","Zcaron":"\u017D","zcaron":"\u017E","Zcy":"\u0417","zcy":"\u0437","Zdot":"\u017B","zdot":"\u017C","zeetrf":"\u2128","ZeroWidthSpace":"\u200B","Zeta":"\u0396","zeta":"\u03B6","zfr":"\uD835\uDD37","Zfr":"\u2128","ZHcy":"\u0416","zhcy":"\u0436","zigrarr":"\u21DD","zopf":"\uD835\uDD6B","Zopf":"\u2124","Zscr":"\uD835\uDCB5","zscr":"\uD835\uDCCF","zwj":"\u200D","zwnj":"\u200C"}
},{}],4:[function(require,module,exports){
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

  self.re.pretest = RegExp(
    '(' + self.re.schema_test.source + ')|(' + self.re.host_fuzzy_test.source + ')|@',
    'i'
  );

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

},{"./lib/re":5}],5:[function(require,module,exports){
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
      '(?:' + re.src_pseudo_letter + '(?:-|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' +
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

},{"uc.micro/categories/Cc/regex":63,"uc.micro/categories/P/regex":65,"uc.micro/categories/Z/regex":66,"uc.micro/properties/Any/regex":68}],6:[function(require,module,exports){
'use strict';


module.exports = require('./lib/');

},{"./lib/":15}],7:[function(require,module,exports){
// HTML5 entities map: { name -> utf16string }
//
'use strict';

/*eslint quotes:0*/
module.exports = require('entities/maps/entities.json');

},{"entities/maps/entities.json":3}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./entities":7,"mdurl":61,"uc.micro":67,"uc.micro/categories/P/regex":65}],11:[function(require,module,exports){
// Just a shortcut for bulk export
'use strict';


exports.parseLinkLabel       = require('./parse_link_label');
exports.parseLinkDestination = require('./parse_link_destination');
exports.parseLinkTitle       = require('./parse_link_title');

},{"./parse_link_destination":12,"./parse_link_label":13,"./parse_link_title":14}],12:[function(require,module,exports){
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

},{"../common/utils":10}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"../common/utils":10}],15:[function(require,module,exports){
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

},{"./common/utils":10,"./helpers":11,"./parser_block":16,"./parser_core":17,"./parser_inline":18,"./presets/commonmark":19,"./presets/default":20,"./presets/zero":21,"./renderer":22,"linkify-it":4,"mdurl":61,"punycode":71}],16:[function(require,module,exports){
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

},{"./ruler":23,"./rules_block/blockquote":24,"./rules_block/code":25,"./rules_block/fence":26,"./rules_block/heading":27,"./rules_block/hr":28,"./rules_block/html_block":29,"./rules_block/lheading":30,"./rules_block/list":31,"./rules_block/paragraph":32,"./rules_block/reference":33,"./rules_block/state_block":34,"./rules_block/table":35}],17:[function(require,module,exports){
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

},{"./ruler":23,"./rules_core/block":36,"./rules_core/inline":37,"./rules_core/linkify":38,"./rules_core/normalize":39,"./rules_core/replacements":40,"./rules_core/smartquotes":41,"./rules_core/state_core":42}],18:[function(require,module,exports){
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

},{"./ruler":23,"./rules_inline/autolink":43,"./rules_inline/backticks":44,"./rules_inline/balance_pairs":45,"./rules_inline/emphasis":46,"./rules_inline/entity":47,"./rules_inline/escape":48,"./rules_inline/html_inline":49,"./rules_inline/image":50,"./rules_inline/link":51,"./rules_inline/newline":52,"./rules_inline/state_inline":53,"./rules_inline/strikethrough":54,"./rules_inline/text":55,"./rules_inline/text_collapse":56}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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
   * Each rule is called as independent static function with fixed signature:
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

},{"./common/utils":10}],23:[function(require,module,exports){
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
 * Replace existing typographer replacement rule with new one:
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

},{}],24:[function(require,module,exports){
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

},{"../common/utils":10}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{"../common/utils":10}],28:[function(require,module,exports){
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

},{"../common/utils":10}],29:[function(require,module,exports){
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

},{"../common/html_blocks":8,"../common/html_re":9}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{"../common/utils":10}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{"../common/utils":10}],34:[function(require,module,exports){
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

},{"../common/utils":10,"../token":57}],35:[function(require,module,exports){
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

},{"../common/utils":10}],36:[function(require,module,exports){
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

},{}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
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

},{"../common/utils":10}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // lastChar defaults to 0x20
          if (tokens[j].type !== 'text') continue;

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
          if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // nextChar defaults to 0x20
          if (tokens[j].type !== 'text') continue;

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

},{"../common/utils":10}],42:[function(require,module,exports){
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

},{"../token":57}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
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

},{"../common/entities":7,"../common/utils":10}],48:[function(require,module,exports){
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

},{"../common/utils":10}],49:[function(require,module,exports){
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

},{"../common/html_re":9}],50:[function(require,module,exports){
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

},{"../common/utils":10}],51:[function(require,module,exports){
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

},{"../common/utils":10}],52:[function(require,module,exports){
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

},{"../common/utils":10}],53:[function(require,module,exports){
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

},{"../common/utils":10,"../token":57}],54:[function(require,module,exports){
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

},{}],55:[function(require,module,exports){
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

},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){

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

},{}],59:[function(require,module,exports){

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

},{}],60:[function(require,module,exports){

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

},{}],61:[function(require,module,exports){
'use strict';


module.exports.encode = require('./encode');
module.exports.decode = require('./decode');
module.exports.format = require('./format');
module.exports.parse  = require('./parse');

},{"./decode":58,"./encode":59,"./format":60,"./parse":62}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
module.exports=/[\0-\x1F\x7F-\x9F]/
},{}],64:[function(require,module,exports){
module.exports=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/
},{}],65:[function(require,module,exports){
module.exports=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/
},{}],66:[function(require,module,exports){
module.exports=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/
},{}],67:[function(require,module,exports){
'use strict';

exports.Any = require('./properties/Any/regex');
exports.Cc  = require('./categories/Cc/regex');
exports.Cf  = require('./categories/Cf/regex');
exports.P   = require('./categories/P/regex');
exports.Z   = require('./categories/Z/regex');

},{"./categories/Cc/regex":63,"./categories/Cf/regex":64,"./categories/P/regex":65,"./categories/Z/regex":66,"./properties/Any/regex":68}],68:[function(require,module,exports){
module.exports=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/
},{}],69:[function(require,module,exports){
module.exports={
  "name": "chat-engine-markdown",
  "author": "Ian Jennings",
  "version": "0.0.9",
  "main": "src/plugin.js",
  "dependencies": {
    "chat-engine": "^0.9.21",
    "dotty": "0.0.2",
    "markdown-it": "^8.4.0"
  },
  "devDependencies": {
    "chai": "^3.5.0",
    "mocha": "^6.0.2"
  }
}

},{}],70:[function(require,module,exports){
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

},{"dotty":2,"markdown-it":6}],71:[function(require,module,exports){
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2NoYXQtZW5naW5lLXBsdWdpbi9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLnRtcC93cmFwLmpzIiwibm9kZV9tb2R1bGVzL2RvdHR5L2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lbnRpdGllcy9tYXBzL2VudGl0aWVzLmpzb24iLCJub2RlX21vZHVsZXMvbGlua2lmeS1pdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9saW5raWZ5LWl0L2xpYi9yZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvY29tbW9uL2VudGl0aWVzLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9jb21tb24vaHRtbF9ibG9ja3MuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2NvbW1vbi9odG1sX3JlLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9jb21tb24vdXRpbHMuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2hlbHBlcnMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2hlbHBlcnMvcGFyc2VfbGlua19kZXN0aW5hdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvaGVscGVycy9wYXJzZV9saW5rX2xhYmVsLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9oZWxwZXJzL3BhcnNlX2xpbmtfdGl0bGUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9wYXJzZXJfYmxvY2suanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3BhcnNlcl9jb3JlLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9wYXJzZXJfaW5saW5lLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9wcmVzZXRzL2NvbW1vbm1hcmsuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3ByZXNldHMvZGVmYXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcHJlc2V0cy96ZXJvLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9yZW5kZXJlci5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXIuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2Jsb2NrcXVvdGUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2NvZGUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2ZlbmNlLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9oZWFkaW5nLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9oci5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svaHRtbF9ibG9jay5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svbGhlYWRpbmcuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL2xpc3QuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2Jsb2NrL3BhcmFncmFwaC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svcmVmZXJlbmNlLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19ibG9jay9zdGF0ZV9ibG9jay5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfYmxvY2svdGFibGUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvYmxvY2suanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvaW5saW5lLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL2xpbmtpZnkuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2NvcmUvbm9ybWFsaXplLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9zbWFydHF1b3Rlcy5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfY29yZS9zdGF0ZV9jb3JlLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvYXV0b2xpbmsuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9iYWNrdGlja3MuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9iYWxhbmNlX3BhaXJzLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvZW1waGFzaXMuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9lbnRpdHkuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9lc2NhcGUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9odG1sX2lubGluZS5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL2ltYWdlLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvbGluay5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL25ld2xpbmUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9zdGF0ZV9pbmxpbmUuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3J1bGVzX2lubGluZS9zdHJpa2V0aHJvdWdoLmpzIiwibm9kZV9tb2R1bGVzL21hcmtkb3duLWl0L2xpYi9ydWxlc19pbmxpbmUvdGV4dC5qcyIsIm5vZGVfbW9kdWxlcy9tYXJrZG93bi1pdC9saWIvcnVsZXNfaW5saW5lL3RleHRfY29sbGFwc2UuanMiLCJub2RlX21vZHVsZXMvbWFya2Rvd24taXQvbGliL3Rva2VuLmpzIiwibm9kZV9tb2R1bGVzL21kdXJsL2RlY29kZS5qcyIsIm5vZGVfbW9kdWxlcy9tZHVybC9lbmNvZGUuanMiLCJub2RlX21vZHVsZXMvbWR1cmwvZm9ybWF0LmpzIiwibm9kZV9tb2R1bGVzL21kdXJsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21kdXJsL3BhcnNlLmpzIiwibm9kZV9tb2R1bGVzL3VjLm1pY3JvL2NhdGVnb3JpZXMvQ2MvcmVnZXguanMiLCJub2RlX21vZHVsZXMvdWMubWljcm8vY2F0ZWdvcmllcy9DZi9yZWdleC5qcyIsIm5vZGVfbW9kdWxlcy91Yy5taWNyby9jYXRlZ29yaWVzL1AvcmVnZXguanMiLCJub2RlX21vZHVsZXMvdWMubWljcm8vY2F0ZWdvcmllcy9aL3JlZ2V4LmpzIiwibm9kZV9tb2R1bGVzL3VjLm1pY3JvL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3VjLm1pY3JvL3Byb3BlcnRpZXMvQW55L3JlZ2V4LmpzIiwicGFja2FnZS5qc29uIiwic3JjL3BsdWdpbi5qcyIsIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2NoYXQtZW5naW5lLXBsdWdpbi9ub2RlX21vZHVsZXMvcHVueWNvZGUvcHVueWNvZGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek9BOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFRBOztBQ0FBOztBQ0FBOztBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgY29uc3QgcGFja2FnZSA9IHJlcXVpcmUoJy4uL3BhY2thZ2UuanNvbicpO1xuICAgIHdpbmRvdy5DaGF0RW5naW5lQ29yZS5wbHVnaW5bcGFja2FnZS5uYW1lXSA9IHJlcXVpcmUoJy4uL3NyYy9wbHVnaW4uanMnKTtcblxufSkoKTtcbiIsIi8vXG4vLyBEb3R0eSBtYWtlcyBpdCBlYXN5IHRvIHByb2dyYW1tYXRpY2FsbHkgYWNjZXNzIGFyYml0cmFyaWx5IG5lc3RlZCBvYmplY3RzIGFuZFxuLy8gdGhlaXIgcHJvcGVydGllcy5cbi8vXG5cbi8vXG4vLyBgb2JqZWN0YCBpcyBhbiBvYmplY3QsIGBwYXRoYCBpcyB0aGUgcGF0aCB0byB0aGUgcHJvcGVydHkgeW91IHdhbnQgdG8gY2hlY2tcbi8vIGZvciBleGlzdGVuY2Ugb2YuXG4vL1xuLy8gYHBhdGhgIGNhbiBiZSBwcm92aWRlZCBhcyBlaXRoZXIgYSBgXCJzdHJpbmcuc2VwYXJhdGVkLndpdGguZG90c1wiYCBvciBhc1xuLy8gYFtcImFuXCIsIFwiYXJyYXlcIl1gLlxuLy9cbi8vIFJldHVybnMgYHRydWVgIGlmIHRoZSBwYXRoIGNhbiBiZSBjb21wbGV0ZWx5IHJlc29sdmVkLCBgZmFsc2VgIG90aGVyd2lzZS5cbi8vXG5cbnZhciBleGlzdHMgPSBtb2R1bGUuZXhwb3J0cy5leGlzdHMgPSBmdW5jdGlvbiBleGlzdHMob2JqZWN0LCBwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHBhdGggPSBwYXRoLnNwbGl0KFwiLlwiKTtcbiAgfVxuXG4gIGlmICghKHBhdGggaW5zdGFuY2VvZiBBcnJheSkgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXRoID0gcGF0aC5zbGljZSgpO1xuXG4gIHZhciBrZXkgPSBwYXRoLnNoaWZ0KCk7XG5cbiAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIE9iamVjdC5oYXNPd25Qcm9wZXJ0eS5hcHBseShvYmplY3QsIFtrZXldKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZXhpc3RzKG9iamVjdFtrZXldLCBwYXRoKTtcbiAgfVxufTtcblxuLy9cbi8vIFRoZXNlIGFyZ3VtZW50cyBhcmUgdGhlIHNhbWUgYXMgdGhvc2UgZm9yIGBleGlzdHNgLlxuLy9cbi8vIFRoZSByZXR1cm4gdmFsdWUsIGhvd2V2ZXIsIGlzIHRoZSBwcm9wZXJ0eSB5b3UncmUgdHJ5aW5nIHRvIGFjY2Vzcywgb3Jcbi8vIGB1bmRlZmluZWRgIGlmIGl0IGNhbid0IGJlIGZvdW5kLiBUaGlzIG1lYW5zIHlvdSB3b24ndCBiZSBhYmxlIHRvIHRlbGxcbi8vIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gYW4gdW5yZXNvbHZlZCBwYXRoIGFuZCBhbiB1bmRlZmluZWQgcHJvcGVydHksIHNvIHlvdSBcbi8vIHNob3VsZCBub3QgdXNlIGBnZXRgIHRvIGNoZWNrIGZvciB0aGUgZXhpc3RlbmNlIG9mIGEgcHJvcGVydHkuIFVzZSBgZXhpc3RzYFxuLy8gaW5zdGVhZC5cbi8vXG5cbnZhciBnZXQgPSBtb2R1bGUuZXhwb3J0cy5nZXQgPSBmdW5jdGlvbiBnZXQob2JqZWN0LCBwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIikge1xuICAgIHBhdGggPSBwYXRoLnNwbGl0KFwiLlwiKTtcbiAgfVxuXG4gIGlmICghKHBhdGggaW5zdGFuY2VvZiBBcnJheSkgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBwYXRoID0gcGF0aC5zbGljZSgpO1xuXG4gIHZhciBrZXkgPSBwYXRoLnNoaWZ0KCk7XG5cbiAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG9iamVjdFtrZXldO1xuICB9XG5cbiAgaWYgKHBhdGgubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGdldChvYmplY3Rba2V5XSwgcGF0aCk7XG4gIH1cbn07XG5cbi8vXG4vLyBBcmd1bWVudHMgYXJlIHNpbWlsYXIgdG8gYGV4aXN0c2AgYW5kIGBnZXRgLCB3aXRoIHRoZSBleGNlcHRpb24gdGhhdCBwYXRoXG4vLyBjb21wb25lbnRzIGFyZSByZWdleGVzIHdpdGggc29tZSBzcGVjaWFsIGNhc2VzLiBJZiBhIHBhdGggY29tcG9uZW50IGlzIGBcIipcImBcbi8vIG9uIGl0cyBvd24sIGl0J2xsIGJlIGNvbnZlcnRlZCB0byBgLy4qL2AuXG4vL1xuLy8gVGhlIHJldHVybiB2YWx1ZSBpcyBhbiBhcnJheSBvZiB2YWx1ZXMgd2hlcmUgdGhlIGtleSBwYXRoIG1hdGNoZXMgdGhlXG4vLyBzcGVjaWZpZWQgY3JpdGVyaW9uLiBJZiBub25lIG1hdGNoLCBhbiBlbXB0eSBhcnJheSB3aWxsIGJlIHJldHVybmVkLlxuLy9cblxudmFyIHNlYXJjaCA9IG1vZHVsZS5leHBvcnRzLnNlYXJjaCA9IGZ1bmN0aW9uIHNlYXJjaChvYmplY3QsIHBhdGgpIHtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiKSB7XG4gICAgcGF0aCA9IHBhdGguc3BsaXQoXCIuXCIpO1xuICB9XG5cbiAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHBhdGggPSBwYXRoLnNsaWNlKCk7XG5cbiAgdmFyIGtleSA9IHBhdGguc2hpZnQoKTtcblxuICBpZiAodHlwZW9mIG9iamVjdCAhPT0gXCJvYmplY3RcIiB8fCBvYmplY3QgPT09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAoa2V5ID09PSBcIipcIikge1xuICAgIGtleSA9IFwiLipcIjtcbiAgfVxuXG4gIGlmICh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKSB7XG4gICAga2V5ID0gbmV3IFJlZ0V4cChrZXkpO1xuICB9XG5cbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkuZmlsdGVyKGtleS50ZXN0LmJpbmQoa2V5KSkubWFwKGZ1bmN0aW9uKGspIHsgcmV0dXJuIG9iamVjdFtrXTsgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIE9iamVjdC5rZXlzKG9iamVjdCkuZmlsdGVyKGtleS50ZXN0LmJpbmQoa2V5KSkubWFwKGZ1bmN0aW9uKGspIHsgcmV0dXJuIHNlYXJjaChvYmplY3Rba10sIHBhdGgpOyB9KSk7XG4gIH1cbn07XG5cbi8vXG4vLyBUaGUgZmlyc3QgdHdvIGFyZ3VtZW50cyBmb3IgYHB1dGAgYXJlIHRoZSBzYW1lIGFzIGBleGlzdHNgIGFuZCBgZ2V0YC5cbi8vXG4vLyBUaGUgdGhpcmQgYXJndW1lbnQgaXMgYSB2YWx1ZSB0byBgcHV0YCBhdCB0aGUgYHBhdGhgIG9mIHRoZSBgb2JqZWN0YC5cbi8vIE9iamVjdHMgaW4gdGhlIG1pZGRsZSB3aWxsIGJlIGNyZWF0ZWQgaWYgdGhleSBkb24ndCBleGlzdCwgb3IgYWRkZWQgdG8gaWZcbi8vIHRoZXkgZG8uIElmIGEgdmFsdWUgaXMgZW5jb3VudGVyZWQgaW4gdGhlIG1pZGRsZSBvZiB0aGUgcGF0aCB0aGF0IGlzICpub3QqXG4vLyBhbiBvYmplY3QsIGl0IHdpbGwgbm90IGJlIG92ZXJ3cml0dGVuLlxuLy9cbi8vIFRoZSByZXR1cm4gdmFsdWUgaXMgYHRydWVgIGluIHRoZSBjYXNlIHRoYXQgdGhlIHZhbHVlIHdhcyBgcHV0YFxuLy8gc3VjY2Vzc2Z1bGx5LCBvciBgZmFsc2VgIG90aGVyd2lzZS5cbi8vXG5cbnZhciBwdXQgPSBtb2R1bGUuZXhwb3J0cy5wdXQgPSBmdW5jdGlvbiBwdXQob2JqZWN0LCBwYXRoLCB2YWx1ZSkge1xuICBpZiAodHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIpIHtcbiAgICBwYXRoID0gcGF0aC5zcGxpdChcIi5cIik7XG4gIH1cblxuICBpZiAoIShwYXRoIGluc3RhbmNlb2YgQXJyYXkpIHx8IHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIFxuICBwYXRoID0gcGF0aC5zbGljZSgpO1xuXG4gIHZhciBrZXkgPSBwYXRoLnNoaWZ0KCk7XG5cbiAgaWYgKHR5cGVvZiBvYmplY3QgIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSB7XG4gICAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICBvYmplY3Rba2V5XSA9IHt9O1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygb2JqZWN0W2tleV0gIT09IFwib2JqZWN0XCIgfHwgb2JqZWN0W2tleV0gPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHV0KG9iamVjdFtrZXldLCBwYXRoLCB2YWx1ZSk7XG4gIH1cbn07XG5cbi8vXG4vLyBgcmVtb3ZlYCBpcyBsaWtlIGBwdXRgIGluIHJldmVyc2UhXG4vL1xuLy8gVGhlIHJldHVybiB2YWx1ZSBpcyBgdHJ1ZWAgaW4gdGhlIGNhc2UgdGhhdCB0aGUgdmFsdWUgZXhpc3RlZCBhbmQgd2FzIHJlbW92ZWRcbi8vIHN1Y2Nlc3NmdWxseSwgb3IgYGZhbHNlYCBvdGhlcndpc2UuXG4vL1xuXG52YXIgcmVtb3ZlID0gbW9kdWxlLmV4cG9ydHMucmVtb3ZlID0gZnVuY3Rpb24gcmVtb3ZlKG9iamVjdCwgcGF0aCwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiKSB7XG4gICAgcGF0aCA9IHBhdGguc3BsaXQoXCIuXCIpO1xuICB9XG5cbiAgaWYgKCEocGF0aCBpbnN0YW5jZW9mIEFycmF5KSB8fCBwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgcGF0aCA9IHBhdGguc2xpY2UoKTtcblxuICB2YXIga2V5ID0gcGF0aC5zaGlmdCgpO1xuXG4gIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSBcIm9iamVjdFwiIHx8IG9iamVjdCA9PT0gbnVsbCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmICghT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBrZXkpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZGVsZXRlIG9iamVjdFtrZXldO1xuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHJlbW92ZShvYmplY3Rba2V5XSwgcGF0aCwgdmFsdWUpO1xuICB9XG59O1xuXG4vL1xuLy8gYGRlZXBLZXlzYCBjcmVhdGVzIGEgbGlzdCBvZiBhbGwgcG9zc2libGUga2V5IHBhdGhzIGZvciBhIGdpdmVuIG9iamVjdC5cbi8vXG4vLyBUaGUgcmV0dXJuIHZhbHVlIGlzIGFsd2F5cyBhbiBhcnJheSwgdGhlIG1lbWJlcnMgb2Ygd2hpY2ggYXJlIHBhdGhzIGluIGFycmF5XG4vLyBmb3JtYXQuIElmIHlvdSB3YW50IHRoZW0gaW4gZG90LW5vdGF0aW9uIGZvcm1hdCwgZG8gc29tZXRoaW5nIGxpa2UgdGhpczpcbi8vXG4vLyBgYGBqc1xuLy8gZG90dHkuZGVlcEtleXMob2JqKS5tYXAoZnVuY3Rpb24oZSkge1xuLy8gICByZXR1cm4gZS5qb2luKFwiLlwiKTtcbi8vIH0pO1xuLy8gYGBgXG4vL1xuLy8gKk5vdGU6IHRoaXMgd2lsbCBwcm9iYWJseSBleHBsb2RlIG9uIHJlY3Vyc2l2ZSBvYmplY3RzLiBCZSBjYXJlZnVsLipcbi8vXG5cbnZhciBkZWVwS2V5cyA9IG1vZHVsZS5leHBvcnRzLmRlZXBLZXlzID0gZnVuY3Rpb24gZGVlcEtleXMob2JqZWN0LCBwcmVmaXgpIHtcbiAgaWYgKHR5cGVvZiBwcmVmaXggPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBwcmVmaXggPSBbXTtcbiAgfVxuXG4gIHZhciBrZXlzID0gW107XG5cbiAgZm9yICh2YXIgayBpbiBvYmplY3QpIHtcbiAgICBpZiAoIU9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgaykpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGtleXMucHVzaChwcmVmaXguY29uY2F0KFtrXSkpO1xuXG4gICAgaWYgKHR5cGVvZiBvYmplY3Rba10gPT09IFwib2JqZWN0XCIgJiYgb2JqZWN0W2tdICE9PSBudWxsKSB7XG4gICAgICBrZXlzID0ga2V5cy5jb25jYXQoZGVlcEtleXMob2JqZWN0W2tdLCBwcmVmaXguY29uY2F0KFtrXSkpKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ga2V5cztcbn07XG4iLCJtb2R1bGUuZXhwb3J0cz17XCJBYWN1dGVcIjpcIlxcdTAwQzFcIixcImFhY3V0ZVwiOlwiXFx1MDBFMVwiLFwiQWJyZXZlXCI6XCJcXHUwMTAyXCIsXCJhYnJldmVcIjpcIlxcdTAxMDNcIixcImFjXCI6XCJcXHUyMjNFXCIsXCJhY2RcIjpcIlxcdTIyM0ZcIixcImFjRVwiOlwiXFx1MjIzRVxcdTAzMzNcIixcIkFjaXJjXCI6XCJcXHUwMEMyXCIsXCJhY2lyY1wiOlwiXFx1MDBFMlwiLFwiYWN1dGVcIjpcIlxcdTAwQjRcIixcIkFjeVwiOlwiXFx1MDQxMFwiLFwiYWN5XCI6XCJcXHUwNDMwXCIsXCJBRWxpZ1wiOlwiXFx1MDBDNlwiLFwiYWVsaWdcIjpcIlxcdTAwRTZcIixcImFmXCI6XCJcXHUyMDYxXCIsXCJBZnJcIjpcIlxcdUQ4MzVcXHVERDA0XCIsXCJhZnJcIjpcIlxcdUQ4MzVcXHVERDFFXCIsXCJBZ3JhdmVcIjpcIlxcdTAwQzBcIixcImFncmF2ZVwiOlwiXFx1MDBFMFwiLFwiYWxlZnN5bVwiOlwiXFx1MjEzNVwiLFwiYWxlcGhcIjpcIlxcdTIxMzVcIixcIkFscGhhXCI6XCJcXHUwMzkxXCIsXCJhbHBoYVwiOlwiXFx1MDNCMVwiLFwiQW1hY3JcIjpcIlxcdTAxMDBcIixcImFtYWNyXCI6XCJcXHUwMTAxXCIsXCJhbWFsZ1wiOlwiXFx1MkEzRlwiLFwiYW1wXCI6XCImXCIsXCJBTVBcIjpcIiZcIixcImFuZGFuZFwiOlwiXFx1MkE1NVwiLFwiQW5kXCI6XCJcXHUyQTUzXCIsXCJhbmRcIjpcIlxcdTIyMjdcIixcImFuZGRcIjpcIlxcdTJBNUNcIixcImFuZHNsb3BlXCI6XCJcXHUyQTU4XCIsXCJhbmR2XCI6XCJcXHUyQTVBXCIsXCJhbmdcIjpcIlxcdTIyMjBcIixcImFuZ2VcIjpcIlxcdTI5QTRcIixcImFuZ2xlXCI6XCJcXHUyMjIwXCIsXCJhbmdtc2RhYVwiOlwiXFx1MjlBOFwiLFwiYW5nbXNkYWJcIjpcIlxcdTI5QTlcIixcImFuZ21zZGFjXCI6XCJcXHUyOUFBXCIsXCJhbmdtc2RhZFwiOlwiXFx1MjlBQlwiLFwiYW5nbXNkYWVcIjpcIlxcdTI5QUNcIixcImFuZ21zZGFmXCI6XCJcXHUyOUFEXCIsXCJhbmdtc2RhZ1wiOlwiXFx1MjlBRVwiLFwiYW5nbXNkYWhcIjpcIlxcdTI5QUZcIixcImFuZ21zZFwiOlwiXFx1MjIyMVwiLFwiYW5ncnRcIjpcIlxcdTIyMUZcIixcImFuZ3J0dmJcIjpcIlxcdTIyQkVcIixcImFuZ3J0dmJkXCI6XCJcXHUyOTlEXCIsXCJhbmdzcGhcIjpcIlxcdTIyMjJcIixcImFuZ3N0XCI6XCJcXHUwMEM1XCIsXCJhbmd6YXJyXCI6XCJcXHUyMzdDXCIsXCJBb2dvblwiOlwiXFx1MDEwNFwiLFwiYW9nb25cIjpcIlxcdTAxMDVcIixcIkFvcGZcIjpcIlxcdUQ4MzVcXHVERDM4XCIsXCJhb3BmXCI6XCJcXHVEODM1XFx1REQ1MlwiLFwiYXBhY2lyXCI6XCJcXHUyQTZGXCIsXCJhcFwiOlwiXFx1MjI0OFwiLFwiYXBFXCI6XCJcXHUyQTcwXCIsXCJhcGVcIjpcIlxcdTIyNEFcIixcImFwaWRcIjpcIlxcdTIyNEJcIixcImFwb3NcIjpcIidcIixcIkFwcGx5RnVuY3Rpb25cIjpcIlxcdTIwNjFcIixcImFwcHJveFwiOlwiXFx1MjI0OFwiLFwiYXBwcm94ZXFcIjpcIlxcdTIyNEFcIixcIkFyaW5nXCI6XCJcXHUwMEM1XCIsXCJhcmluZ1wiOlwiXFx1MDBFNVwiLFwiQXNjclwiOlwiXFx1RDgzNVxcdURDOUNcIixcImFzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I2XCIsXCJBc3NpZ25cIjpcIlxcdTIyNTRcIixcImFzdFwiOlwiKlwiLFwiYXN5bXBcIjpcIlxcdTIyNDhcIixcImFzeW1wZXFcIjpcIlxcdTIyNERcIixcIkF0aWxkZVwiOlwiXFx1MDBDM1wiLFwiYXRpbGRlXCI6XCJcXHUwMEUzXCIsXCJBdW1sXCI6XCJcXHUwMEM0XCIsXCJhdW1sXCI6XCJcXHUwMEU0XCIsXCJhd2NvbmludFwiOlwiXFx1MjIzM1wiLFwiYXdpbnRcIjpcIlxcdTJBMTFcIixcImJhY2tjb25nXCI6XCJcXHUyMjRDXCIsXCJiYWNrZXBzaWxvblwiOlwiXFx1MDNGNlwiLFwiYmFja3ByaW1lXCI6XCJcXHUyMDM1XCIsXCJiYWNrc2ltXCI6XCJcXHUyMjNEXCIsXCJiYWNrc2ltZXFcIjpcIlxcdTIyQ0RcIixcIkJhY2tzbGFzaFwiOlwiXFx1MjIxNlwiLFwiQmFydlwiOlwiXFx1MkFFN1wiLFwiYmFydmVlXCI6XCJcXHUyMkJEXCIsXCJiYXJ3ZWRcIjpcIlxcdTIzMDVcIixcIkJhcndlZFwiOlwiXFx1MjMwNlwiLFwiYmFyd2VkZ2VcIjpcIlxcdTIzMDVcIixcImJicmtcIjpcIlxcdTIzQjVcIixcImJicmt0YnJrXCI6XCJcXHUyM0I2XCIsXCJiY29uZ1wiOlwiXFx1MjI0Q1wiLFwiQmN5XCI6XCJcXHUwNDExXCIsXCJiY3lcIjpcIlxcdTA0MzFcIixcImJkcXVvXCI6XCJcXHUyMDFFXCIsXCJiZWNhdXNcIjpcIlxcdTIyMzVcIixcImJlY2F1c2VcIjpcIlxcdTIyMzVcIixcIkJlY2F1c2VcIjpcIlxcdTIyMzVcIixcImJlbXB0eXZcIjpcIlxcdTI5QjBcIixcImJlcHNpXCI6XCJcXHUwM0Y2XCIsXCJiZXJub3VcIjpcIlxcdTIxMkNcIixcIkJlcm5vdWxsaXNcIjpcIlxcdTIxMkNcIixcIkJldGFcIjpcIlxcdTAzOTJcIixcImJldGFcIjpcIlxcdTAzQjJcIixcImJldGhcIjpcIlxcdTIxMzZcIixcImJldHdlZW5cIjpcIlxcdTIyNkNcIixcIkJmclwiOlwiXFx1RDgzNVxcdUREMDVcIixcImJmclwiOlwiXFx1RDgzNVxcdUREMUZcIixcImJpZ2NhcFwiOlwiXFx1MjJDMlwiLFwiYmlnY2lyY1wiOlwiXFx1MjVFRlwiLFwiYmlnY3VwXCI6XCJcXHUyMkMzXCIsXCJiaWdvZG90XCI6XCJcXHUyQTAwXCIsXCJiaWdvcGx1c1wiOlwiXFx1MkEwMVwiLFwiYmlnb3RpbWVzXCI6XCJcXHUyQTAyXCIsXCJiaWdzcWN1cFwiOlwiXFx1MkEwNlwiLFwiYmlnc3RhclwiOlwiXFx1MjYwNVwiLFwiYmlndHJpYW5nbGVkb3duXCI6XCJcXHUyNUJEXCIsXCJiaWd0cmlhbmdsZXVwXCI6XCJcXHUyNUIzXCIsXCJiaWd1cGx1c1wiOlwiXFx1MkEwNFwiLFwiYmlndmVlXCI6XCJcXHUyMkMxXCIsXCJiaWd3ZWRnZVwiOlwiXFx1MjJDMFwiLFwiYmthcm93XCI6XCJcXHUyOTBEXCIsXCJibGFja2xvemVuZ2VcIjpcIlxcdTI5RUJcIixcImJsYWNrc3F1YXJlXCI6XCJcXHUyNUFBXCIsXCJibGFja3RyaWFuZ2xlXCI6XCJcXHUyNUI0XCIsXCJibGFja3RyaWFuZ2xlZG93blwiOlwiXFx1MjVCRVwiLFwiYmxhY2t0cmlhbmdsZWxlZnRcIjpcIlxcdTI1QzJcIixcImJsYWNrdHJpYW5nbGVyaWdodFwiOlwiXFx1MjVCOFwiLFwiYmxhbmtcIjpcIlxcdTI0MjNcIixcImJsazEyXCI6XCJcXHUyNTkyXCIsXCJibGsxNFwiOlwiXFx1MjU5MVwiLFwiYmxrMzRcIjpcIlxcdTI1OTNcIixcImJsb2NrXCI6XCJcXHUyNTg4XCIsXCJibmVcIjpcIj1cXHUyMEU1XCIsXCJibmVxdWl2XCI6XCJcXHUyMjYxXFx1MjBFNVwiLFwiYk5vdFwiOlwiXFx1MkFFRFwiLFwiYm5vdFwiOlwiXFx1MjMxMFwiLFwiQm9wZlwiOlwiXFx1RDgzNVxcdUREMzlcIixcImJvcGZcIjpcIlxcdUQ4MzVcXHVERDUzXCIsXCJib3RcIjpcIlxcdTIyQTVcIixcImJvdHRvbVwiOlwiXFx1MjJBNVwiLFwiYm93dGllXCI6XCJcXHUyMkM4XCIsXCJib3hib3hcIjpcIlxcdTI5QzlcIixcImJveGRsXCI6XCJcXHUyNTEwXCIsXCJib3hkTFwiOlwiXFx1MjU1NVwiLFwiYm94RGxcIjpcIlxcdTI1NTZcIixcImJveERMXCI6XCJcXHUyNTU3XCIsXCJib3hkclwiOlwiXFx1MjUwQ1wiLFwiYm94ZFJcIjpcIlxcdTI1NTJcIixcImJveERyXCI6XCJcXHUyNTUzXCIsXCJib3hEUlwiOlwiXFx1MjU1NFwiLFwiYm94aFwiOlwiXFx1MjUwMFwiLFwiYm94SFwiOlwiXFx1MjU1MFwiLFwiYm94aGRcIjpcIlxcdTI1MkNcIixcImJveEhkXCI6XCJcXHUyNTY0XCIsXCJib3hoRFwiOlwiXFx1MjU2NVwiLFwiYm94SERcIjpcIlxcdTI1NjZcIixcImJveGh1XCI6XCJcXHUyNTM0XCIsXCJib3hIdVwiOlwiXFx1MjU2N1wiLFwiYm94aFVcIjpcIlxcdTI1NjhcIixcImJveEhVXCI6XCJcXHUyNTY5XCIsXCJib3htaW51c1wiOlwiXFx1MjI5RlwiLFwiYm94cGx1c1wiOlwiXFx1MjI5RVwiLFwiYm94dGltZXNcIjpcIlxcdTIyQTBcIixcImJveHVsXCI6XCJcXHUyNTE4XCIsXCJib3h1TFwiOlwiXFx1MjU1QlwiLFwiYm94VWxcIjpcIlxcdTI1NUNcIixcImJveFVMXCI6XCJcXHUyNTVEXCIsXCJib3h1clwiOlwiXFx1MjUxNFwiLFwiYm94dVJcIjpcIlxcdTI1NThcIixcImJveFVyXCI6XCJcXHUyNTU5XCIsXCJib3hVUlwiOlwiXFx1MjU1QVwiLFwiYm94dlwiOlwiXFx1MjUwMlwiLFwiYm94VlwiOlwiXFx1MjU1MVwiLFwiYm94dmhcIjpcIlxcdTI1M0NcIixcImJveHZIXCI6XCJcXHUyNTZBXCIsXCJib3hWaFwiOlwiXFx1MjU2QlwiLFwiYm94VkhcIjpcIlxcdTI1NkNcIixcImJveHZsXCI6XCJcXHUyNTI0XCIsXCJib3h2TFwiOlwiXFx1MjU2MVwiLFwiYm94VmxcIjpcIlxcdTI1NjJcIixcImJveFZMXCI6XCJcXHUyNTYzXCIsXCJib3h2clwiOlwiXFx1MjUxQ1wiLFwiYm94dlJcIjpcIlxcdTI1NUVcIixcImJveFZyXCI6XCJcXHUyNTVGXCIsXCJib3hWUlwiOlwiXFx1MjU2MFwiLFwiYnByaW1lXCI6XCJcXHUyMDM1XCIsXCJicmV2ZVwiOlwiXFx1MDJEOFwiLFwiQnJldmVcIjpcIlxcdTAyRDhcIixcImJydmJhclwiOlwiXFx1MDBBNlwiLFwiYnNjclwiOlwiXFx1RDgzNVxcdURDQjdcIixcIkJzY3JcIjpcIlxcdTIxMkNcIixcImJzZW1pXCI6XCJcXHUyMDRGXCIsXCJic2ltXCI6XCJcXHUyMjNEXCIsXCJic2ltZVwiOlwiXFx1MjJDRFwiLFwiYnNvbGJcIjpcIlxcdTI5QzVcIixcImJzb2xcIjpcIlxcXFxcIixcImJzb2xoc3ViXCI6XCJcXHUyN0M4XCIsXCJidWxsXCI6XCJcXHUyMDIyXCIsXCJidWxsZXRcIjpcIlxcdTIwMjJcIixcImJ1bXBcIjpcIlxcdTIyNEVcIixcImJ1bXBFXCI6XCJcXHUyQUFFXCIsXCJidW1wZVwiOlwiXFx1MjI0RlwiLFwiQnVtcGVxXCI6XCJcXHUyMjRFXCIsXCJidW1wZXFcIjpcIlxcdTIyNEZcIixcIkNhY3V0ZVwiOlwiXFx1MDEwNlwiLFwiY2FjdXRlXCI6XCJcXHUwMTA3XCIsXCJjYXBhbmRcIjpcIlxcdTJBNDRcIixcImNhcGJyY3VwXCI6XCJcXHUyQTQ5XCIsXCJjYXBjYXBcIjpcIlxcdTJBNEJcIixcImNhcFwiOlwiXFx1MjIyOVwiLFwiQ2FwXCI6XCJcXHUyMkQyXCIsXCJjYXBjdXBcIjpcIlxcdTJBNDdcIixcImNhcGRvdFwiOlwiXFx1MkE0MFwiLFwiQ2FwaXRhbERpZmZlcmVudGlhbERcIjpcIlxcdTIxNDVcIixcImNhcHNcIjpcIlxcdTIyMjlcXHVGRTAwXCIsXCJjYXJldFwiOlwiXFx1MjA0MVwiLFwiY2Fyb25cIjpcIlxcdTAyQzdcIixcIkNheWxleXNcIjpcIlxcdTIxMkRcIixcImNjYXBzXCI6XCJcXHUyQTREXCIsXCJDY2Fyb25cIjpcIlxcdTAxMENcIixcImNjYXJvblwiOlwiXFx1MDEwRFwiLFwiQ2NlZGlsXCI6XCJcXHUwMEM3XCIsXCJjY2VkaWxcIjpcIlxcdTAwRTdcIixcIkNjaXJjXCI6XCJcXHUwMTA4XCIsXCJjY2lyY1wiOlwiXFx1MDEwOVwiLFwiQ2NvbmludFwiOlwiXFx1MjIzMFwiLFwiY2N1cHNcIjpcIlxcdTJBNENcIixcImNjdXBzc21cIjpcIlxcdTJBNTBcIixcIkNkb3RcIjpcIlxcdTAxMEFcIixcImNkb3RcIjpcIlxcdTAxMEJcIixcImNlZGlsXCI6XCJcXHUwMEI4XCIsXCJDZWRpbGxhXCI6XCJcXHUwMEI4XCIsXCJjZW1wdHl2XCI6XCJcXHUyOUIyXCIsXCJjZW50XCI6XCJcXHUwMEEyXCIsXCJjZW50ZXJkb3RcIjpcIlxcdTAwQjdcIixcIkNlbnRlckRvdFwiOlwiXFx1MDBCN1wiLFwiY2ZyXCI6XCJcXHVEODM1XFx1REQyMFwiLFwiQ2ZyXCI6XCJcXHUyMTJEXCIsXCJDSGN5XCI6XCJcXHUwNDI3XCIsXCJjaGN5XCI6XCJcXHUwNDQ3XCIsXCJjaGVja1wiOlwiXFx1MjcxM1wiLFwiY2hlY2ttYXJrXCI6XCJcXHUyNzEzXCIsXCJDaGlcIjpcIlxcdTAzQTdcIixcImNoaVwiOlwiXFx1MDNDN1wiLFwiY2lyY1wiOlwiXFx1MDJDNlwiLFwiY2lyY2VxXCI6XCJcXHUyMjU3XCIsXCJjaXJjbGVhcnJvd2xlZnRcIjpcIlxcdTIxQkFcIixcImNpcmNsZWFycm93cmlnaHRcIjpcIlxcdTIxQkJcIixcImNpcmNsZWRhc3RcIjpcIlxcdTIyOUJcIixcImNpcmNsZWRjaXJjXCI6XCJcXHUyMjlBXCIsXCJjaXJjbGVkZGFzaFwiOlwiXFx1MjI5RFwiLFwiQ2lyY2xlRG90XCI6XCJcXHUyMjk5XCIsXCJjaXJjbGVkUlwiOlwiXFx1MDBBRVwiLFwiY2lyY2xlZFNcIjpcIlxcdTI0QzhcIixcIkNpcmNsZU1pbnVzXCI6XCJcXHUyMjk2XCIsXCJDaXJjbGVQbHVzXCI6XCJcXHUyMjk1XCIsXCJDaXJjbGVUaW1lc1wiOlwiXFx1MjI5N1wiLFwiY2lyXCI6XCJcXHUyNUNCXCIsXCJjaXJFXCI6XCJcXHUyOUMzXCIsXCJjaXJlXCI6XCJcXHUyMjU3XCIsXCJjaXJmbmludFwiOlwiXFx1MkExMFwiLFwiY2lybWlkXCI6XCJcXHUyQUVGXCIsXCJjaXJzY2lyXCI6XCJcXHUyOUMyXCIsXCJDbG9ja3dpc2VDb250b3VySW50ZWdyYWxcIjpcIlxcdTIyMzJcIixcIkNsb3NlQ3VybHlEb3VibGVRdW90ZVwiOlwiXFx1MjAxRFwiLFwiQ2xvc2VDdXJseVF1b3RlXCI6XCJcXHUyMDE5XCIsXCJjbHVic1wiOlwiXFx1MjY2M1wiLFwiY2x1YnN1aXRcIjpcIlxcdTI2NjNcIixcImNvbG9uXCI6XCI6XCIsXCJDb2xvblwiOlwiXFx1MjIzN1wiLFwiQ29sb25lXCI6XCJcXHUyQTc0XCIsXCJjb2xvbmVcIjpcIlxcdTIyNTRcIixcImNvbG9uZXFcIjpcIlxcdTIyNTRcIixcImNvbW1hXCI6XCIsXCIsXCJjb21tYXRcIjpcIkBcIixcImNvbXBcIjpcIlxcdTIyMDFcIixcImNvbXBmblwiOlwiXFx1MjIxOFwiLFwiY29tcGxlbWVudFwiOlwiXFx1MjIwMVwiLFwiY29tcGxleGVzXCI6XCJcXHUyMTAyXCIsXCJjb25nXCI6XCJcXHUyMjQ1XCIsXCJjb25nZG90XCI6XCJcXHUyQTZEXCIsXCJDb25ncnVlbnRcIjpcIlxcdTIyNjFcIixcImNvbmludFwiOlwiXFx1MjIyRVwiLFwiQ29uaW50XCI6XCJcXHUyMjJGXCIsXCJDb250b3VySW50ZWdyYWxcIjpcIlxcdTIyMkVcIixcImNvcGZcIjpcIlxcdUQ4MzVcXHVERDU0XCIsXCJDb3BmXCI6XCJcXHUyMTAyXCIsXCJjb3Byb2RcIjpcIlxcdTIyMTBcIixcIkNvcHJvZHVjdFwiOlwiXFx1MjIxMFwiLFwiY29weVwiOlwiXFx1MDBBOVwiLFwiQ09QWVwiOlwiXFx1MDBBOVwiLFwiY29weXNyXCI6XCJcXHUyMTE3XCIsXCJDb3VudGVyQ2xvY2t3aXNlQ29udG91ckludGVncmFsXCI6XCJcXHUyMjMzXCIsXCJjcmFyclwiOlwiXFx1MjFCNVwiLFwiY3Jvc3NcIjpcIlxcdTI3MTdcIixcIkNyb3NzXCI6XCJcXHUyQTJGXCIsXCJDc2NyXCI6XCJcXHVEODM1XFx1REM5RVwiLFwiY3NjclwiOlwiXFx1RDgzNVxcdURDQjhcIixcImNzdWJcIjpcIlxcdTJBQ0ZcIixcImNzdWJlXCI6XCJcXHUyQUQxXCIsXCJjc3VwXCI6XCJcXHUyQUQwXCIsXCJjc3VwZVwiOlwiXFx1MkFEMlwiLFwiY3Rkb3RcIjpcIlxcdTIyRUZcIixcImN1ZGFycmxcIjpcIlxcdTI5MzhcIixcImN1ZGFycnJcIjpcIlxcdTI5MzVcIixcImN1ZXByXCI6XCJcXHUyMkRFXCIsXCJjdWVzY1wiOlwiXFx1MjJERlwiLFwiY3VsYXJyXCI6XCJcXHUyMUI2XCIsXCJjdWxhcnJwXCI6XCJcXHUyOTNEXCIsXCJjdXBicmNhcFwiOlwiXFx1MkE0OFwiLFwiY3VwY2FwXCI6XCJcXHUyQTQ2XCIsXCJDdXBDYXBcIjpcIlxcdTIyNERcIixcImN1cFwiOlwiXFx1MjIyQVwiLFwiQ3VwXCI6XCJcXHUyMkQzXCIsXCJjdXBjdXBcIjpcIlxcdTJBNEFcIixcImN1cGRvdFwiOlwiXFx1MjI4RFwiLFwiY3Vwb3JcIjpcIlxcdTJBNDVcIixcImN1cHNcIjpcIlxcdTIyMkFcXHVGRTAwXCIsXCJjdXJhcnJcIjpcIlxcdTIxQjdcIixcImN1cmFycm1cIjpcIlxcdTI5M0NcIixcImN1cmx5ZXFwcmVjXCI6XCJcXHUyMkRFXCIsXCJjdXJseWVxc3VjY1wiOlwiXFx1MjJERlwiLFwiY3VybHl2ZWVcIjpcIlxcdTIyQ0VcIixcImN1cmx5d2VkZ2VcIjpcIlxcdTIyQ0ZcIixcImN1cnJlblwiOlwiXFx1MDBBNFwiLFwiY3VydmVhcnJvd2xlZnRcIjpcIlxcdTIxQjZcIixcImN1cnZlYXJyb3dyaWdodFwiOlwiXFx1MjFCN1wiLFwiY3V2ZWVcIjpcIlxcdTIyQ0VcIixcImN1d2VkXCI6XCJcXHUyMkNGXCIsXCJjd2NvbmludFwiOlwiXFx1MjIzMlwiLFwiY3dpbnRcIjpcIlxcdTIyMzFcIixcImN5bGN0eVwiOlwiXFx1MjMyRFwiLFwiZGFnZ2VyXCI6XCJcXHUyMDIwXCIsXCJEYWdnZXJcIjpcIlxcdTIwMjFcIixcImRhbGV0aFwiOlwiXFx1MjEzOFwiLFwiZGFyclwiOlwiXFx1MjE5M1wiLFwiRGFyclwiOlwiXFx1MjFBMVwiLFwiZEFyclwiOlwiXFx1MjFEM1wiLFwiZGFzaFwiOlwiXFx1MjAxMFwiLFwiRGFzaHZcIjpcIlxcdTJBRTRcIixcImRhc2h2XCI6XCJcXHUyMkEzXCIsXCJkYmthcm93XCI6XCJcXHUyOTBGXCIsXCJkYmxhY1wiOlwiXFx1MDJERFwiLFwiRGNhcm9uXCI6XCJcXHUwMTBFXCIsXCJkY2Fyb25cIjpcIlxcdTAxMEZcIixcIkRjeVwiOlwiXFx1MDQxNFwiLFwiZGN5XCI6XCJcXHUwNDM0XCIsXCJkZGFnZ2VyXCI6XCJcXHUyMDIxXCIsXCJkZGFyclwiOlwiXFx1MjFDQVwiLFwiRERcIjpcIlxcdTIxNDVcIixcImRkXCI6XCJcXHUyMTQ2XCIsXCJERG90cmFoZFwiOlwiXFx1MjkxMVwiLFwiZGRvdHNlcVwiOlwiXFx1MkE3N1wiLFwiZGVnXCI6XCJcXHUwMEIwXCIsXCJEZWxcIjpcIlxcdTIyMDdcIixcIkRlbHRhXCI6XCJcXHUwMzk0XCIsXCJkZWx0YVwiOlwiXFx1MDNCNFwiLFwiZGVtcHR5dlwiOlwiXFx1MjlCMVwiLFwiZGZpc2h0XCI6XCJcXHUyOTdGXCIsXCJEZnJcIjpcIlxcdUQ4MzVcXHVERDA3XCIsXCJkZnJcIjpcIlxcdUQ4MzVcXHVERDIxXCIsXCJkSGFyXCI6XCJcXHUyOTY1XCIsXCJkaGFybFwiOlwiXFx1MjFDM1wiLFwiZGhhcnJcIjpcIlxcdTIxQzJcIixcIkRpYWNyaXRpY2FsQWN1dGVcIjpcIlxcdTAwQjRcIixcIkRpYWNyaXRpY2FsRG90XCI6XCJcXHUwMkQ5XCIsXCJEaWFjcml0aWNhbERvdWJsZUFjdXRlXCI6XCJcXHUwMkREXCIsXCJEaWFjcml0aWNhbEdyYXZlXCI6XCJgXCIsXCJEaWFjcml0aWNhbFRpbGRlXCI6XCJcXHUwMkRDXCIsXCJkaWFtXCI6XCJcXHUyMkM0XCIsXCJkaWFtb25kXCI6XCJcXHUyMkM0XCIsXCJEaWFtb25kXCI6XCJcXHUyMkM0XCIsXCJkaWFtb25kc3VpdFwiOlwiXFx1MjY2NlwiLFwiZGlhbXNcIjpcIlxcdTI2NjZcIixcImRpZVwiOlwiXFx1MDBBOFwiLFwiRGlmZmVyZW50aWFsRFwiOlwiXFx1MjE0NlwiLFwiZGlnYW1tYVwiOlwiXFx1MDNERFwiLFwiZGlzaW5cIjpcIlxcdTIyRjJcIixcImRpdlwiOlwiXFx1MDBGN1wiLFwiZGl2aWRlXCI6XCJcXHUwMEY3XCIsXCJkaXZpZGVvbnRpbWVzXCI6XCJcXHUyMkM3XCIsXCJkaXZvbnhcIjpcIlxcdTIyQzdcIixcIkRKY3lcIjpcIlxcdTA0MDJcIixcImRqY3lcIjpcIlxcdTA0NTJcIixcImRsY29yblwiOlwiXFx1MjMxRVwiLFwiZGxjcm9wXCI6XCJcXHUyMzBEXCIsXCJkb2xsYXJcIjpcIiRcIixcIkRvcGZcIjpcIlxcdUQ4MzVcXHVERDNCXCIsXCJkb3BmXCI6XCJcXHVEODM1XFx1REQ1NVwiLFwiRG90XCI6XCJcXHUwMEE4XCIsXCJkb3RcIjpcIlxcdTAyRDlcIixcIkRvdERvdFwiOlwiXFx1MjBEQ1wiLFwiZG90ZXFcIjpcIlxcdTIyNTBcIixcImRvdGVxZG90XCI6XCJcXHUyMjUxXCIsXCJEb3RFcXVhbFwiOlwiXFx1MjI1MFwiLFwiZG90bWludXNcIjpcIlxcdTIyMzhcIixcImRvdHBsdXNcIjpcIlxcdTIyMTRcIixcImRvdHNxdWFyZVwiOlwiXFx1MjJBMVwiLFwiZG91YmxlYmFyd2VkZ2VcIjpcIlxcdTIzMDZcIixcIkRvdWJsZUNvbnRvdXJJbnRlZ3JhbFwiOlwiXFx1MjIyRlwiLFwiRG91YmxlRG90XCI6XCJcXHUwMEE4XCIsXCJEb3VibGVEb3duQXJyb3dcIjpcIlxcdTIxRDNcIixcIkRvdWJsZUxlZnRBcnJvd1wiOlwiXFx1MjFEMFwiLFwiRG91YmxlTGVmdFJpZ2h0QXJyb3dcIjpcIlxcdTIxRDRcIixcIkRvdWJsZUxlZnRUZWVcIjpcIlxcdTJBRTRcIixcIkRvdWJsZUxvbmdMZWZ0QXJyb3dcIjpcIlxcdTI3RjhcIixcIkRvdWJsZUxvbmdMZWZ0UmlnaHRBcnJvd1wiOlwiXFx1MjdGQVwiLFwiRG91YmxlTG9uZ1JpZ2h0QXJyb3dcIjpcIlxcdTI3RjlcIixcIkRvdWJsZVJpZ2h0QXJyb3dcIjpcIlxcdTIxRDJcIixcIkRvdWJsZVJpZ2h0VGVlXCI6XCJcXHUyMkE4XCIsXCJEb3VibGVVcEFycm93XCI6XCJcXHUyMUQxXCIsXCJEb3VibGVVcERvd25BcnJvd1wiOlwiXFx1MjFENVwiLFwiRG91YmxlVmVydGljYWxCYXJcIjpcIlxcdTIyMjVcIixcIkRvd25BcnJvd0JhclwiOlwiXFx1MjkxM1wiLFwiZG93bmFycm93XCI6XCJcXHUyMTkzXCIsXCJEb3duQXJyb3dcIjpcIlxcdTIxOTNcIixcIkRvd25hcnJvd1wiOlwiXFx1MjFEM1wiLFwiRG93bkFycm93VXBBcnJvd1wiOlwiXFx1MjFGNVwiLFwiRG93bkJyZXZlXCI6XCJcXHUwMzExXCIsXCJkb3duZG93bmFycm93c1wiOlwiXFx1MjFDQVwiLFwiZG93bmhhcnBvb25sZWZ0XCI6XCJcXHUyMUMzXCIsXCJkb3duaGFycG9vbnJpZ2h0XCI6XCJcXHUyMUMyXCIsXCJEb3duTGVmdFJpZ2h0VmVjdG9yXCI6XCJcXHUyOTUwXCIsXCJEb3duTGVmdFRlZVZlY3RvclwiOlwiXFx1Mjk1RVwiLFwiRG93bkxlZnRWZWN0b3JCYXJcIjpcIlxcdTI5NTZcIixcIkRvd25MZWZ0VmVjdG9yXCI6XCJcXHUyMUJEXCIsXCJEb3duUmlnaHRUZWVWZWN0b3JcIjpcIlxcdTI5NUZcIixcIkRvd25SaWdodFZlY3RvckJhclwiOlwiXFx1Mjk1N1wiLFwiRG93blJpZ2h0VmVjdG9yXCI6XCJcXHUyMUMxXCIsXCJEb3duVGVlQXJyb3dcIjpcIlxcdTIxQTdcIixcIkRvd25UZWVcIjpcIlxcdTIyQTRcIixcImRyYmthcm93XCI6XCJcXHUyOTEwXCIsXCJkcmNvcm5cIjpcIlxcdTIzMUZcIixcImRyY3JvcFwiOlwiXFx1MjMwQ1wiLFwiRHNjclwiOlwiXFx1RDgzNVxcdURDOUZcIixcImRzY3JcIjpcIlxcdUQ4MzVcXHVEQ0I5XCIsXCJEU2N5XCI6XCJcXHUwNDA1XCIsXCJkc2N5XCI6XCJcXHUwNDU1XCIsXCJkc29sXCI6XCJcXHUyOUY2XCIsXCJEc3Ryb2tcIjpcIlxcdTAxMTBcIixcImRzdHJva1wiOlwiXFx1MDExMVwiLFwiZHRkb3RcIjpcIlxcdTIyRjFcIixcImR0cmlcIjpcIlxcdTI1QkZcIixcImR0cmlmXCI6XCJcXHUyNUJFXCIsXCJkdWFyclwiOlwiXFx1MjFGNVwiLFwiZHVoYXJcIjpcIlxcdTI5NkZcIixcImR3YW5nbGVcIjpcIlxcdTI5QTZcIixcIkRaY3lcIjpcIlxcdTA0MEZcIixcImR6Y3lcIjpcIlxcdTA0NUZcIixcImR6aWdyYXJyXCI6XCJcXHUyN0ZGXCIsXCJFYWN1dGVcIjpcIlxcdTAwQzlcIixcImVhY3V0ZVwiOlwiXFx1MDBFOVwiLFwiZWFzdGVyXCI6XCJcXHUyQTZFXCIsXCJFY2Fyb25cIjpcIlxcdTAxMUFcIixcImVjYXJvblwiOlwiXFx1MDExQlwiLFwiRWNpcmNcIjpcIlxcdTAwQ0FcIixcImVjaXJjXCI6XCJcXHUwMEVBXCIsXCJlY2lyXCI6XCJcXHUyMjU2XCIsXCJlY29sb25cIjpcIlxcdTIyNTVcIixcIkVjeVwiOlwiXFx1MDQyRFwiLFwiZWN5XCI6XCJcXHUwNDREXCIsXCJlRERvdFwiOlwiXFx1MkE3N1wiLFwiRWRvdFwiOlwiXFx1MDExNlwiLFwiZWRvdFwiOlwiXFx1MDExN1wiLFwiZURvdFwiOlwiXFx1MjI1MVwiLFwiZWVcIjpcIlxcdTIxNDdcIixcImVmRG90XCI6XCJcXHUyMjUyXCIsXCJFZnJcIjpcIlxcdUQ4MzVcXHVERDA4XCIsXCJlZnJcIjpcIlxcdUQ4MzVcXHVERDIyXCIsXCJlZ1wiOlwiXFx1MkE5QVwiLFwiRWdyYXZlXCI6XCJcXHUwMEM4XCIsXCJlZ3JhdmVcIjpcIlxcdTAwRThcIixcImVnc1wiOlwiXFx1MkE5NlwiLFwiZWdzZG90XCI6XCJcXHUyQTk4XCIsXCJlbFwiOlwiXFx1MkE5OVwiLFwiRWxlbWVudFwiOlwiXFx1MjIwOFwiLFwiZWxpbnRlcnNcIjpcIlxcdTIzRTdcIixcImVsbFwiOlwiXFx1MjExM1wiLFwiZWxzXCI6XCJcXHUyQTk1XCIsXCJlbHNkb3RcIjpcIlxcdTJBOTdcIixcIkVtYWNyXCI6XCJcXHUwMTEyXCIsXCJlbWFjclwiOlwiXFx1MDExM1wiLFwiZW1wdHlcIjpcIlxcdTIyMDVcIixcImVtcHR5c2V0XCI6XCJcXHUyMjA1XCIsXCJFbXB0eVNtYWxsU3F1YXJlXCI6XCJcXHUyNUZCXCIsXCJlbXB0eXZcIjpcIlxcdTIyMDVcIixcIkVtcHR5VmVyeVNtYWxsU3F1YXJlXCI6XCJcXHUyNUFCXCIsXCJlbXNwMTNcIjpcIlxcdTIwMDRcIixcImVtc3AxNFwiOlwiXFx1MjAwNVwiLFwiZW1zcFwiOlwiXFx1MjAwM1wiLFwiRU5HXCI6XCJcXHUwMTRBXCIsXCJlbmdcIjpcIlxcdTAxNEJcIixcImVuc3BcIjpcIlxcdTIwMDJcIixcIkVvZ29uXCI6XCJcXHUwMTE4XCIsXCJlb2dvblwiOlwiXFx1MDExOVwiLFwiRW9wZlwiOlwiXFx1RDgzNVxcdUREM0NcIixcImVvcGZcIjpcIlxcdUQ4MzVcXHVERDU2XCIsXCJlcGFyXCI6XCJcXHUyMkQ1XCIsXCJlcGFyc2xcIjpcIlxcdTI5RTNcIixcImVwbHVzXCI6XCJcXHUyQTcxXCIsXCJlcHNpXCI6XCJcXHUwM0I1XCIsXCJFcHNpbG9uXCI6XCJcXHUwMzk1XCIsXCJlcHNpbG9uXCI6XCJcXHUwM0I1XCIsXCJlcHNpdlwiOlwiXFx1MDNGNVwiLFwiZXFjaXJjXCI6XCJcXHUyMjU2XCIsXCJlcWNvbG9uXCI6XCJcXHUyMjU1XCIsXCJlcXNpbVwiOlwiXFx1MjI0MlwiLFwiZXFzbGFudGd0clwiOlwiXFx1MkE5NlwiLFwiZXFzbGFudGxlc3NcIjpcIlxcdTJBOTVcIixcIkVxdWFsXCI6XCJcXHUyQTc1XCIsXCJlcXVhbHNcIjpcIj1cIixcIkVxdWFsVGlsZGVcIjpcIlxcdTIyNDJcIixcImVxdWVzdFwiOlwiXFx1MjI1RlwiLFwiRXF1aWxpYnJpdW1cIjpcIlxcdTIxQ0NcIixcImVxdWl2XCI6XCJcXHUyMjYxXCIsXCJlcXVpdkREXCI6XCJcXHUyQTc4XCIsXCJlcXZwYXJzbFwiOlwiXFx1MjlFNVwiLFwiZXJhcnJcIjpcIlxcdTI5NzFcIixcImVyRG90XCI6XCJcXHUyMjUzXCIsXCJlc2NyXCI6XCJcXHUyMTJGXCIsXCJFc2NyXCI6XCJcXHUyMTMwXCIsXCJlc2RvdFwiOlwiXFx1MjI1MFwiLFwiRXNpbVwiOlwiXFx1MkE3M1wiLFwiZXNpbVwiOlwiXFx1MjI0MlwiLFwiRXRhXCI6XCJcXHUwMzk3XCIsXCJldGFcIjpcIlxcdTAzQjdcIixcIkVUSFwiOlwiXFx1MDBEMFwiLFwiZXRoXCI6XCJcXHUwMEYwXCIsXCJFdW1sXCI6XCJcXHUwMENCXCIsXCJldW1sXCI6XCJcXHUwMEVCXCIsXCJldXJvXCI6XCJcXHUyMEFDXCIsXCJleGNsXCI6XCIhXCIsXCJleGlzdFwiOlwiXFx1MjIwM1wiLFwiRXhpc3RzXCI6XCJcXHUyMjAzXCIsXCJleHBlY3RhdGlvblwiOlwiXFx1MjEzMFwiLFwiZXhwb25lbnRpYWxlXCI6XCJcXHUyMTQ3XCIsXCJFeHBvbmVudGlhbEVcIjpcIlxcdTIxNDdcIixcImZhbGxpbmdkb3RzZXFcIjpcIlxcdTIyNTJcIixcIkZjeVwiOlwiXFx1MDQyNFwiLFwiZmN5XCI6XCJcXHUwNDQ0XCIsXCJmZW1hbGVcIjpcIlxcdTI2NDBcIixcImZmaWxpZ1wiOlwiXFx1RkIwM1wiLFwiZmZsaWdcIjpcIlxcdUZCMDBcIixcImZmbGxpZ1wiOlwiXFx1RkIwNFwiLFwiRmZyXCI6XCJcXHVEODM1XFx1REQwOVwiLFwiZmZyXCI6XCJcXHVEODM1XFx1REQyM1wiLFwiZmlsaWdcIjpcIlxcdUZCMDFcIixcIkZpbGxlZFNtYWxsU3F1YXJlXCI6XCJcXHUyNUZDXCIsXCJGaWxsZWRWZXJ5U21hbGxTcXVhcmVcIjpcIlxcdTI1QUFcIixcImZqbGlnXCI6XCJmalwiLFwiZmxhdFwiOlwiXFx1MjY2RFwiLFwiZmxsaWdcIjpcIlxcdUZCMDJcIixcImZsdG5zXCI6XCJcXHUyNUIxXCIsXCJmbm9mXCI6XCJcXHUwMTkyXCIsXCJGb3BmXCI6XCJcXHVEODM1XFx1REQzRFwiLFwiZm9wZlwiOlwiXFx1RDgzNVxcdURENTdcIixcImZvcmFsbFwiOlwiXFx1MjIwMFwiLFwiRm9yQWxsXCI6XCJcXHUyMjAwXCIsXCJmb3JrXCI6XCJcXHUyMkQ0XCIsXCJmb3JrdlwiOlwiXFx1MkFEOVwiLFwiRm91cmllcnRyZlwiOlwiXFx1MjEzMVwiLFwiZnBhcnRpbnRcIjpcIlxcdTJBMERcIixcImZyYWMxMlwiOlwiXFx1MDBCRFwiLFwiZnJhYzEzXCI6XCJcXHUyMTUzXCIsXCJmcmFjMTRcIjpcIlxcdTAwQkNcIixcImZyYWMxNVwiOlwiXFx1MjE1NVwiLFwiZnJhYzE2XCI6XCJcXHUyMTU5XCIsXCJmcmFjMThcIjpcIlxcdTIxNUJcIixcImZyYWMyM1wiOlwiXFx1MjE1NFwiLFwiZnJhYzI1XCI6XCJcXHUyMTU2XCIsXCJmcmFjMzRcIjpcIlxcdTAwQkVcIixcImZyYWMzNVwiOlwiXFx1MjE1N1wiLFwiZnJhYzM4XCI6XCJcXHUyMTVDXCIsXCJmcmFjNDVcIjpcIlxcdTIxNThcIixcImZyYWM1NlwiOlwiXFx1MjE1QVwiLFwiZnJhYzU4XCI6XCJcXHUyMTVEXCIsXCJmcmFjNzhcIjpcIlxcdTIxNUVcIixcImZyYXNsXCI6XCJcXHUyMDQ0XCIsXCJmcm93blwiOlwiXFx1MjMyMlwiLFwiZnNjclwiOlwiXFx1RDgzNVxcdURDQkJcIixcIkZzY3JcIjpcIlxcdTIxMzFcIixcImdhY3V0ZVwiOlwiXFx1MDFGNVwiLFwiR2FtbWFcIjpcIlxcdTAzOTNcIixcImdhbW1hXCI6XCJcXHUwM0IzXCIsXCJHYW1tYWRcIjpcIlxcdTAzRENcIixcImdhbW1hZFwiOlwiXFx1MDNERFwiLFwiZ2FwXCI6XCJcXHUyQTg2XCIsXCJHYnJldmVcIjpcIlxcdTAxMUVcIixcImdicmV2ZVwiOlwiXFx1MDExRlwiLFwiR2NlZGlsXCI6XCJcXHUwMTIyXCIsXCJHY2lyY1wiOlwiXFx1MDExQ1wiLFwiZ2NpcmNcIjpcIlxcdTAxMURcIixcIkdjeVwiOlwiXFx1MDQxM1wiLFwiZ2N5XCI6XCJcXHUwNDMzXCIsXCJHZG90XCI6XCJcXHUwMTIwXCIsXCJnZG90XCI6XCJcXHUwMTIxXCIsXCJnZVwiOlwiXFx1MjI2NVwiLFwiZ0VcIjpcIlxcdTIyNjdcIixcImdFbFwiOlwiXFx1MkE4Q1wiLFwiZ2VsXCI6XCJcXHUyMkRCXCIsXCJnZXFcIjpcIlxcdTIyNjVcIixcImdlcXFcIjpcIlxcdTIyNjdcIixcImdlcXNsYW50XCI6XCJcXHUyQTdFXCIsXCJnZXNjY1wiOlwiXFx1MkFBOVwiLFwiZ2VzXCI6XCJcXHUyQTdFXCIsXCJnZXNkb3RcIjpcIlxcdTJBODBcIixcImdlc2RvdG9cIjpcIlxcdTJBODJcIixcImdlc2RvdG9sXCI6XCJcXHUyQTg0XCIsXCJnZXNsXCI6XCJcXHUyMkRCXFx1RkUwMFwiLFwiZ2VzbGVzXCI6XCJcXHUyQTk0XCIsXCJHZnJcIjpcIlxcdUQ4MzVcXHVERDBBXCIsXCJnZnJcIjpcIlxcdUQ4MzVcXHVERDI0XCIsXCJnZ1wiOlwiXFx1MjI2QlwiLFwiR2dcIjpcIlxcdTIyRDlcIixcImdnZ1wiOlwiXFx1MjJEOVwiLFwiZ2ltZWxcIjpcIlxcdTIxMzdcIixcIkdKY3lcIjpcIlxcdTA0MDNcIixcImdqY3lcIjpcIlxcdTA0NTNcIixcImdsYVwiOlwiXFx1MkFBNVwiLFwiZ2xcIjpcIlxcdTIyNzdcIixcImdsRVwiOlwiXFx1MkE5MlwiLFwiZ2xqXCI6XCJcXHUyQUE0XCIsXCJnbmFwXCI6XCJcXHUyQThBXCIsXCJnbmFwcHJveFwiOlwiXFx1MkE4QVwiLFwiZ25lXCI6XCJcXHUyQTg4XCIsXCJnbkVcIjpcIlxcdTIyNjlcIixcImduZXFcIjpcIlxcdTJBODhcIixcImduZXFxXCI6XCJcXHUyMjY5XCIsXCJnbnNpbVwiOlwiXFx1MjJFN1wiLFwiR29wZlwiOlwiXFx1RDgzNVxcdUREM0VcIixcImdvcGZcIjpcIlxcdUQ4MzVcXHVERDU4XCIsXCJncmF2ZVwiOlwiYFwiLFwiR3JlYXRlckVxdWFsXCI6XCJcXHUyMjY1XCIsXCJHcmVhdGVyRXF1YWxMZXNzXCI6XCJcXHUyMkRCXCIsXCJHcmVhdGVyRnVsbEVxdWFsXCI6XCJcXHUyMjY3XCIsXCJHcmVhdGVyR3JlYXRlclwiOlwiXFx1MkFBMlwiLFwiR3JlYXRlckxlc3NcIjpcIlxcdTIyNzdcIixcIkdyZWF0ZXJTbGFudEVxdWFsXCI6XCJcXHUyQTdFXCIsXCJHcmVhdGVyVGlsZGVcIjpcIlxcdTIyNzNcIixcIkdzY3JcIjpcIlxcdUQ4MzVcXHVEQ0EyXCIsXCJnc2NyXCI6XCJcXHUyMTBBXCIsXCJnc2ltXCI6XCJcXHUyMjczXCIsXCJnc2ltZVwiOlwiXFx1MkE4RVwiLFwiZ3NpbWxcIjpcIlxcdTJBOTBcIixcImd0Y2NcIjpcIlxcdTJBQTdcIixcImd0Y2lyXCI6XCJcXHUyQTdBXCIsXCJndFwiOlwiPlwiLFwiR1RcIjpcIj5cIixcIkd0XCI6XCJcXHUyMjZCXCIsXCJndGRvdFwiOlwiXFx1MjJEN1wiLFwiZ3RsUGFyXCI6XCJcXHUyOTk1XCIsXCJndHF1ZXN0XCI6XCJcXHUyQTdDXCIsXCJndHJhcHByb3hcIjpcIlxcdTJBODZcIixcImd0cmFyclwiOlwiXFx1Mjk3OFwiLFwiZ3RyZG90XCI6XCJcXHUyMkQ3XCIsXCJndHJlcWxlc3NcIjpcIlxcdTIyREJcIixcImd0cmVxcWxlc3NcIjpcIlxcdTJBOENcIixcImd0cmxlc3NcIjpcIlxcdTIyNzdcIixcImd0cnNpbVwiOlwiXFx1MjI3M1wiLFwiZ3ZlcnRuZXFxXCI6XCJcXHUyMjY5XFx1RkUwMFwiLFwiZ3ZuRVwiOlwiXFx1MjI2OVxcdUZFMDBcIixcIkhhY2VrXCI6XCJcXHUwMkM3XCIsXCJoYWlyc3BcIjpcIlxcdTIwMEFcIixcImhhbGZcIjpcIlxcdTAwQkRcIixcImhhbWlsdFwiOlwiXFx1MjEwQlwiLFwiSEFSRGN5XCI6XCJcXHUwNDJBXCIsXCJoYXJkY3lcIjpcIlxcdTA0NEFcIixcImhhcnJjaXJcIjpcIlxcdTI5NDhcIixcImhhcnJcIjpcIlxcdTIxOTRcIixcImhBcnJcIjpcIlxcdTIxRDRcIixcImhhcnJ3XCI6XCJcXHUyMUFEXCIsXCJIYXRcIjpcIl5cIixcImhiYXJcIjpcIlxcdTIxMEZcIixcIkhjaXJjXCI6XCJcXHUwMTI0XCIsXCJoY2lyY1wiOlwiXFx1MDEyNVwiLFwiaGVhcnRzXCI6XCJcXHUyNjY1XCIsXCJoZWFydHN1aXRcIjpcIlxcdTI2NjVcIixcImhlbGxpcFwiOlwiXFx1MjAyNlwiLFwiaGVyY29uXCI6XCJcXHUyMkI5XCIsXCJoZnJcIjpcIlxcdUQ4MzVcXHVERDI1XCIsXCJIZnJcIjpcIlxcdTIxMENcIixcIkhpbGJlcnRTcGFjZVwiOlwiXFx1MjEwQlwiLFwiaGtzZWFyb3dcIjpcIlxcdTI5MjVcIixcImhrc3dhcm93XCI6XCJcXHUyOTI2XCIsXCJob2FyclwiOlwiXFx1MjFGRlwiLFwiaG9tdGh0XCI6XCJcXHUyMjNCXCIsXCJob29rbGVmdGFycm93XCI6XCJcXHUyMUE5XCIsXCJob29rcmlnaHRhcnJvd1wiOlwiXFx1MjFBQVwiLFwiaG9wZlwiOlwiXFx1RDgzNVxcdURENTlcIixcIkhvcGZcIjpcIlxcdTIxMERcIixcImhvcmJhclwiOlwiXFx1MjAxNVwiLFwiSG9yaXpvbnRhbExpbmVcIjpcIlxcdTI1MDBcIixcImhzY3JcIjpcIlxcdUQ4MzVcXHVEQ0JEXCIsXCJIc2NyXCI6XCJcXHUyMTBCXCIsXCJoc2xhc2hcIjpcIlxcdTIxMEZcIixcIkhzdHJva1wiOlwiXFx1MDEyNlwiLFwiaHN0cm9rXCI6XCJcXHUwMTI3XCIsXCJIdW1wRG93bkh1bXBcIjpcIlxcdTIyNEVcIixcIkh1bXBFcXVhbFwiOlwiXFx1MjI0RlwiLFwiaHlidWxsXCI6XCJcXHUyMDQzXCIsXCJoeXBoZW5cIjpcIlxcdTIwMTBcIixcIklhY3V0ZVwiOlwiXFx1MDBDRFwiLFwiaWFjdXRlXCI6XCJcXHUwMEVEXCIsXCJpY1wiOlwiXFx1MjA2M1wiLFwiSWNpcmNcIjpcIlxcdTAwQ0VcIixcImljaXJjXCI6XCJcXHUwMEVFXCIsXCJJY3lcIjpcIlxcdTA0MThcIixcImljeVwiOlwiXFx1MDQzOFwiLFwiSWRvdFwiOlwiXFx1MDEzMFwiLFwiSUVjeVwiOlwiXFx1MDQxNVwiLFwiaWVjeVwiOlwiXFx1MDQzNVwiLFwiaWV4Y2xcIjpcIlxcdTAwQTFcIixcImlmZlwiOlwiXFx1MjFENFwiLFwiaWZyXCI6XCJcXHVEODM1XFx1REQyNlwiLFwiSWZyXCI6XCJcXHUyMTExXCIsXCJJZ3JhdmVcIjpcIlxcdTAwQ0NcIixcImlncmF2ZVwiOlwiXFx1MDBFQ1wiLFwiaWlcIjpcIlxcdTIxNDhcIixcImlpaWludFwiOlwiXFx1MkEwQ1wiLFwiaWlpbnRcIjpcIlxcdTIyMkRcIixcImlpbmZpblwiOlwiXFx1MjlEQ1wiLFwiaWlvdGFcIjpcIlxcdTIxMjlcIixcIklKbGlnXCI6XCJcXHUwMTMyXCIsXCJpamxpZ1wiOlwiXFx1MDEzM1wiLFwiSW1hY3JcIjpcIlxcdTAxMkFcIixcImltYWNyXCI6XCJcXHUwMTJCXCIsXCJpbWFnZVwiOlwiXFx1MjExMVwiLFwiSW1hZ2luYXJ5SVwiOlwiXFx1MjE0OFwiLFwiaW1hZ2xpbmVcIjpcIlxcdTIxMTBcIixcImltYWdwYXJ0XCI6XCJcXHUyMTExXCIsXCJpbWF0aFwiOlwiXFx1MDEzMVwiLFwiSW1cIjpcIlxcdTIxMTFcIixcImltb2ZcIjpcIlxcdTIyQjdcIixcImltcGVkXCI6XCJcXHUwMUI1XCIsXCJJbXBsaWVzXCI6XCJcXHUyMUQyXCIsXCJpbmNhcmVcIjpcIlxcdTIxMDVcIixcImluXCI6XCJcXHUyMjA4XCIsXCJpbmZpblwiOlwiXFx1MjIxRVwiLFwiaW5maW50aWVcIjpcIlxcdTI5RERcIixcImlub2RvdFwiOlwiXFx1MDEzMVwiLFwiaW50Y2FsXCI6XCJcXHUyMkJBXCIsXCJpbnRcIjpcIlxcdTIyMkJcIixcIkludFwiOlwiXFx1MjIyQ1wiLFwiaW50ZWdlcnNcIjpcIlxcdTIxMjRcIixcIkludGVncmFsXCI6XCJcXHUyMjJCXCIsXCJpbnRlcmNhbFwiOlwiXFx1MjJCQVwiLFwiSW50ZXJzZWN0aW9uXCI6XCJcXHUyMkMyXCIsXCJpbnRsYXJoa1wiOlwiXFx1MkExN1wiLFwiaW50cHJvZFwiOlwiXFx1MkEzQ1wiLFwiSW52aXNpYmxlQ29tbWFcIjpcIlxcdTIwNjNcIixcIkludmlzaWJsZVRpbWVzXCI6XCJcXHUyMDYyXCIsXCJJT2N5XCI6XCJcXHUwNDAxXCIsXCJpb2N5XCI6XCJcXHUwNDUxXCIsXCJJb2dvblwiOlwiXFx1MDEyRVwiLFwiaW9nb25cIjpcIlxcdTAxMkZcIixcIklvcGZcIjpcIlxcdUQ4MzVcXHVERDQwXCIsXCJpb3BmXCI6XCJcXHVEODM1XFx1REQ1QVwiLFwiSW90YVwiOlwiXFx1MDM5OVwiLFwiaW90YVwiOlwiXFx1MDNCOVwiLFwiaXByb2RcIjpcIlxcdTJBM0NcIixcImlxdWVzdFwiOlwiXFx1MDBCRlwiLFwiaXNjclwiOlwiXFx1RDgzNVxcdURDQkVcIixcIklzY3JcIjpcIlxcdTIxMTBcIixcImlzaW5cIjpcIlxcdTIyMDhcIixcImlzaW5kb3RcIjpcIlxcdTIyRjVcIixcImlzaW5FXCI6XCJcXHUyMkY5XCIsXCJpc2luc1wiOlwiXFx1MjJGNFwiLFwiaXNpbnN2XCI6XCJcXHUyMkYzXCIsXCJpc2ludlwiOlwiXFx1MjIwOFwiLFwiaXRcIjpcIlxcdTIwNjJcIixcIkl0aWxkZVwiOlwiXFx1MDEyOFwiLFwiaXRpbGRlXCI6XCJcXHUwMTI5XCIsXCJJdWtjeVwiOlwiXFx1MDQwNlwiLFwiaXVrY3lcIjpcIlxcdTA0NTZcIixcIkl1bWxcIjpcIlxcdTAwQ0ZcIixcIml1bWxcIjpcIlxcdTAwRUZcIixcIkpjaXJjXCI6XCJcXHUwMTM0XCIsXCJqY2lyY1wiOlwiXFx1MDEzNVwiLFwiSmN5XCI6XCJcXHUwNDE5XCIsXCJqY3lcIjpcIlxcdTA0MzlcIixcIkpmclwiOlwiXFx1RDgzNVxcdUREMERcIixcImpmclwiOlwiXFx1RDgzNVxcdUREMjdcIixcImptYXRoXCI6XCJcXHUwMjM3XCIsXCJKb3BmXCI6XCJcXHVEODM1XFx1REQ0MVwiLFwiam9wZlwiOlwiXFx1RDgzNVxcdURENUJcIixcIkpzY3JcIjpcIlxcdUQ4MzVcXHVEQ0E1XCIsXCJqc2NyXCI6XCJcXHVEODM1XFx1RENCRlwiLFwiSnNlcmN5XCI6XCJcXHUwNDA4XCIsXCJqc2VyY3lcIjpcIlxcdTA0NThcIixcIkp1a2N5XCI6XCJcXHUwNDA0XCIsXCJqdWtjeVwiOlwiXFx1MDQ1NFwiLFwiS2FwcGFcIjpcIlxcdTAzOUFcIixcImthcHBhXCI6XCJcXHUwM0JBXCIsXCJrYXBwYXZcIjpcIlxcdTAzRjBcIixcIktjZWRpbFwiOlwiXFx1MDEzNlwiLFwia2NlZGlsXCI6XCJcXHUwMTM3XCIsXCJLY3lcIjpcIlxcdTA0MUFcIixcImtjeVwiOlwiXFx1MDQzQVwiLFwiS2ZyXCI6XCJcXHVEODM1XFx1REQwRVwiLFwia2ZyXCI6XCJcXHVEODM1XFx1REQyOFwiLFwia2dyZWVuXCI6XCJcXHUwMTM4XCIsXCJLSGN5XCI6XCJcXHUwNDI1XCIsXCJraGN5XCI6XCJcXHUwNDQ1XCIsXCJLSmN5XCI6XCJcXHUwNDBDXCIsXCJramN5XCI6XCJcXHUwNDVDXCIsXCJLb3BmXCI6XCJcXHVEODM1XFx1REQ0MlwiLFwia29wZlwiOlwiXFx1RDgzNVxcdURENUNcIixcIktzY3JcIjpcIlxcdUQ4MzVcXHVEQ0E2XCIsXCJrc2NyXCI6XCJcXHVEODM1XFx1RENDMFwiLFwibEFhcnJcIjpcIlxcdTIxREFcIixcIkxhY3V0ZVwiOlwiXFx1MDEzOVwiLFwibGFjdXRlXCI6XCJcXHUwMTNBXCIsXCJsYWVtcHR5dlwiOlwiXFx1MjlCNFwiLFwibGFncmFuXCI6XCJcXHUyMTEyXCIsXCJMYW1iZGFcIjpcIlxcdTAzOUJcIixcImxhbWJkYVwiOlwiXFx1MDNCQlwiLFwibGFuZ1wiOlwiXFx1MjdFOFwiLFwiTGFuZ1wiOlwiXFx1MjdFQVwiLFwibGFuZ2RcIjpcIlxcdTI5OTFcIixcImxhbmdsZVwiOlwiXFx1MjdFOFwiLFwibGFwXCI6XCJcXHUyQTg1XCIsXCJMYXBsYWNldHJmXCI6XCJcXHUyMTEyXCIsXCJsYXF1b1wiOlwiXFx1MDBBQlwiLFwibGFycmJcIjpcIlxcdTIxRTRcIixcImxhcnJiZnNcIjpcIlxcdTI5MUZcIixcImxhcnJcIjpcIlxcdTIxOTBcIixcIkxhcnJcIjpcIlxcdTIxOUVcIixcImxBcnJcIjpcIlxcdTIxRDBcIixcImxhcnJmc1wiOlwiXFx1MjkxRFwiLFwibGFycmhrXCI6XCJcXHUyMUE5XCIsXCJsYXJybHBcIjpcIlxcdTIxQUJcIixcImxhcnJwbFwiOlwiXFx1MjkzOVwiLFwibGFycnNpbVwiOlwiXFx1Mjk3M1wiLFwibGFycnRsXCI6XCJcXHUyMUEyXCIsXCJsYXRhaWxcIjpcIlxcdTI5MTlcIixcImxBdGFpbFwiOlwiXFx1MjkxQlwiLFwibGF0XCI6XCJcXHUyQUFCXCIsXCJsYXRlXCI6XCJcXHUyQUFEXCIsXCJsYXRlc1wiOlwiXFx1MkFBRFxcdUZFMDBcIixcImxiYXJyXCI6XCJcXHUyOTBDXCIsXCJsQmFyclwiOlwiXFx1MjkwRVwiLFwibGJicmtcIjpcIlxcdTI3NzJcIixcImxicmFjZVwiOlwie1wiLFwibGJyYWNrXCI6XCJbXCIsXCJsYnJrZVwiOlwiXFx1Mjk4QlwiLFwibGJya3NsZFwiOlwiXFx1Mjk4RlwiLFwibGJya3NsdVwiOlwiXFx1Mjk4RFwiLFwiTGNhcm9uXCI6XCJcXHUwMTNEXCIsXCJsY2Fyb25cIjpcIlxcdTAxM0VcIixcIkxjZWRpbFwiOlwiXFx1MDEzQlwiLFwibGNlZGlsXCI6XCJcXHUwMTNDXCIsXCJsY2VpbFwiOlwiXFx1MjMwOFwiLFwibGN1YlwiOlwie1wiLFwiTGN5XCI6XCJcXHUwNDFCXCIsXCJsY3lcIjpcIlxcdTA0M0JcIixcImxkY2FcIjpcIlxcdTI5MzZcIixcImxkcXVvXCI6XCJcXHUyMDFDXCIsXCJsZHF1b3JcIjpcIlxcdTIwMUVcIixcImxkcmRoYXJcIjpcIlxcdTI5NjdcIixcImxkcnVzaGFyXCI6XCJcXHUyOTRCXCIsXCJsZHNoXCI6XCJcXHUyMUIyXCIsXCJsZVwiOlwiXFx1MjI2NFwiLFwibEVcIjpcIlxcdTIyNjZcIixcIkxlZnRBbmdsZUJyYWNrZXRcIjpcIlxcdTI3RThcIixcIkxlZnRBcnJvd0JhclwiOlwiXFx1MjFFNFwiLFwibGVmdGFycm93XCI6XCJcXHUyMTkwXCIsXCJMZWZ0QXJyb3dcIjpcIlxcdTIxOTBcIixcIkxlZnRhcnJvd1wiOlwiXFx1MjFEMFwiLFwiTGVmdEFycm93UmlnaHRBcnJvd1wiOlwiXFx1MjFDNlwiLFwibGVmdGFycm93dGFpbFwiOlwiXFx1MjFBMlwiLFwiTGVmdENlaWxpbmdcIjpcIlxcdTIzMDhcIixcIkxlZnREb3VibGVCcmFja2V0XCI6XCJcXHUyN0U2XCIsXCJMZWZ0RG93blRlZVZlY3RvclwiOlwiXFx1Mjk2MVwiLFwiTGVmdERvd25WZWN0b3JCYXJcIjpcIlxcdTI5NTlcIixcIkxlZnREb3duVmVjdG9yXCI6XCJcXHUyMUMzXCIsXCJMZWZ0Rmxvb3JcIjpcIlxcdTIzMEFcIixcImxlZnRoYXJwb29uZG93blwiOlwiXFx1MjFCRFwiLFwibGVmdGhhcnBvb251cFwiOlwiXFx1MjFCQ1wiLFwibGVmdGxlZnRhcnJvd3NcIjpcIlxcdTIxQzdcIixcImxlZnRyaWdodGFycm93XCI6XCJcXHUyMTk0XCIsXCJMZWZ0UmlnaHRBcnJvd1wiOlwiXFx1MjE5NFwiLFwiTGVmdHJpZ2h0YXJyb3dcIjpcIlxcdTIxRDRcIixcImxlZnRyaWdodGFycm93c1wiOlwiXFx1MjFDNlwiLFwibGVmdHJpZ2h0aGFycG9vbnNcIjpcIlxcdTIxQ0JcIixcImxlZnRyaWdodHNxdWlnYXJyb3dcIjpcIlxcdTIxQURcIixcIkxlZnRSaWdodFZlY3RvclwiOlwiXFx1Mjk0RVwiLFwiTGVmdFRlZUFycm93XCI6XCJcXHUyMUE0XCIsXCJMZWZ0VGVlXCI6XCJcXHUyMkEzXCIsXCJMZWZ0VGVlVmVjdG9yXCI6XCJcXHUyOTVBXCIsXCJsZWZ0dGhyZWV0aW1lc1wiOlwiXFx1MjJDQlwiLFwiTGVmdFRyaWFuZ2xlQmFyXCI6XCJcXHUyOUNGXCIsXCJMZWZ0VHJpYW5nbGVcIjpcIlxcdTIyQjJcIixcIkxlZnRUcmlhbmdsZUVxdWFsXCI6XCJcXHUyMkI0XCIsXCJMZWZ0VXBEb3duVmVjdG9yXCI6XCJcXHUyOTUxXCIsXCJMZWZ0VXBUZWVWZWN0b3JcIjpcIlxcdTI5NjBcIixcIkxlZnRVcFZlY3RvckJhclwiOlwiXFx1Mjk1OFwiLFwiTGVmdFVwVmVjdG9yXCI6XCJcXHUyMUJGXCIsXCJMZWZ0VmVjdG9yQmFyXCI6XCJcXHUyOTUyXCIsXCJMZWZ0VmVjdG9yXCI6XCJcXHUyMUJDXCIsXCJsRWdcIjpcIlxcdTJBOEJcIixcImxlZ1wiOlwiXFx1MjJEQVwiLFwibGVxXCI6XCJcXHUyMjY0XCIsXCJsZXFxXCI6XCJcXHUyMjY2XCIsXCJsZXFzbGFudFwiOlwiXFx1MkE3RFwiLFwibGVzY2NcIjpcIlxcdTJBQThcIixcImxlc1wiOlwiXFx1MkE3RFwiLFwibGVzZG90XCI6XCJcXHUyQTdGXCIsXCJsZXNkb3RvXCI6XCJcXHUyQTgxXCIsXCJsZXNkb3RvclwiOlwiXFx1MkE4M1wiLFwibGVzZ1wiOlwiXFx1MjJEQVxcdUZFMDBcIixcImxlc2dlc1wiOlwiXFx1MkE5M1wiLFwibGVzc2FwcHJveFwiOlwiXFx1MkE4NVwiLFwibGVzc2RvdFwiOlwiXFx1MjJENlwiLFwibGVzc2VxZ3RyXCI6XCJcXHUyMkRBXCIsXCJsZXNzZXFxZ3RyXCI6XCJcXHUyQThCXCIsXCJMZXNzRXF1YWxHcmVhdGVyXCI6XCJcXHUyMkRBXCIsXCJMZXNzRnVsbEVxdWFsXCI6XCJcXHUyMjY2XCIsXCJMZXNzR3JlYXRlclwiOlwiXFx1MjI3NlwiLFwibGVzc2d0clwiOlwiXFx1MjI3NlwiLFwiTGVzc0xlc3NcIjpcIlxcdTJBQTFcIixcImxlc3NzaW1cIjpcIlxcdTIyNzJcIixcIkxlc3NTbGFudEVxdWFsXCI6XCJcXHUyQTdEXCIsXCJMZXNzVGlsZGVcIjpcIlxcdTIyNzJcIixcImxmaXNodFwiOlwiXFx1Mjk3Q1wiLFwibGZsb29yXCI6XCJcXHUyMzBBXCIsXCJMZnJcIjpcIlxcdUQ4MzVcXHVERDBGXCIsXCJsZnJcIjpcIlxcdUQ4MzVcXHVERDI5XCIsXCJsZ1wiOlwiXFx1MjI3NlwiLFwibGdFXCI6XCJcXHUyQTkxXCIsXCJsSGFyXCI6XCJcXHUyOTYyXCIsXCJsaGFyZFwiOlwiXFx1MjFCRFwiLFwibGhhcnVcIjpcIlxcdTIxQkNcIixcImxoYXJ1bFwiOlwiXFx1Mjk2QVwiLFwibGhibGtcIjpcIlxcdTI1ODRcIixcIkxKY3lcIjpcIlxcdTA0MDlcIixcImxqY3lcIjpcIlxcdTA0NTlcIixcImxsYXJyXCI6XCJcXHUyMUM3XCIsXCJsbFwiOlwiXFx1MjI2QVwiLFwiTGxcIjpcIlxcdTIyRDhcIixcImxsY29ybmVyXCI6XCJcXHUyMzFFXCIsXCJMbGVmdGFycm93XCI6XCJcXHUyMURBXCIsXCJsbGhhcmRcIjpcIlxcdTI5NkJcIixcImxsdHJpXCI6XCJcXHUyNUZBXCIsXCJMbWlkb3RcIjpcIlxcdTAxM0ZcIixcImxtaWRvdFwiOlwiXFx1MDE0MFwiLFwibG1vdXN0YWNoZVwiOlwiXFx1MjNCMFwiLFwibG1vdXN0XCI6XCJcXHUyM0IwXCIsXCJsbmFwXCI6XCJcXHUyQTg5XCIsXCJsbmFwcHJveFwiOlwiXFx1MkE4OVwiLFwibG5lXCI6XCJcXHUyQTg3XCIsXCJsbkVcIjpcIlxcdTIyNjhcIixcImxuZXFcIjpcIlxcdTJBODdcIixcImxuZXFxXCI6XCJcXHUyMjY4XCIsXCJsbnNpbVwiOlwiXFx1MjJFNlwiLFwibG9hbmdcIjpcIlxcdTI3RUNcIixcImxvYXJyXCI6XCJcXHUyMUZEXCIsXCJsb2Jya1wiOlwiXFx1MjdFNlwiLFwibG9uZ2xlZnRhcnJvd1wiOlwiXFx1MjdGNVwiLFwiTG9uZ0xlZnRBcnJvd1wiOlwiXFx1MjdGNVwiLFwiTG9uZ2xlZnRhcnJvd1wiOlwiXFx1MjdGOFwiLFwibG9uZ2xlZnRyaWdodGFycm93XCI6XCJcXHUyN0Y3XCIsXCJMb25nTGVmdFJpZ2h0QXJyb3dcIjpcIlxcdTI3RjdcIixcIkxvbmdsZWZ0cmlnaHRhcnJvd1wiOlwiXFx1MjdGQVwiLFwibG9uZ21hcHN0b1wiOlwiXFx1MjdGQ1wiLFwibG9uZ3JpZ2h0YXJyb3dcIjpcIlxcdTI3RjZcIixcIkxvbmdSaWdodEFycm93XCI6XCJcXHUyN0Y2XCIsXCJMb25ncmlnaHRhcnJvd1wiOlwiXFx1MjdGOVwiLFwibG9vcGFycm93bGVmdFwiOlwiXFx1MjFBQlwiLFwibG9vcGFycm93cmlnaHRcIjpcIlxcdTIxQUNcIixcImxvcGFyXCI6XCJcXHUyOTg1XCIsXCJMb3BmXCI6XCJcXHVEODM1XFx1REQ0M1wiLFwibG9wZlwiOlwiXFx1RDgzNVxcdURENURcIixcImxvcGx1c1wiOlwiXFx1MkEyRFwiLFwibG90aW1lc1wiOlwiXFx1MkEzNFwiLFwibG93YXN0XCI6XCJcXHUyMjE3XCIsXCJsb3diYXJcIjpcIl9cIixcIkxvd2VyTGVmdEFycm93XCI6XCJcXHUyMTk5XCIsXCJMb3dlclJpZ2h0QXJyb3dcIjpcIlxcdTIxOThcIixcImxvelwiOlwiXFx1MjVDQVwiLFwibG96ZW5nZVwiOlwiXFx1MjVDQVwiLFwibG96ZlwiOlwiXFx1MjlFQlwiLFwibHBhclwiOlwiKFwiLFwibHBhcmx0XCI6XCJcXHUyOTkzXCIsXCJscmFyclwiOlwiXFx1MjFDNlwiLFwibHJjb3JuZXJcIjpcIlxcdTIzMUZcIixcImxyaGFyXCI6XCJcXHUyMUNCXCIsXCJscmhhcmRcIjpcIlxcdTI5NkRcIixcImxybVwiOlwiXFx1MjAwRVwiLFwibHJ0cmlcIjpcIlxcdTIyQkZcIixcImxzYXF1b1wiOlwiXFx1MjAzOVwiLFwibHNjclwiOlwiXFx1RDgzNVxcdURDQzFcIixcIkxzY3JcIjpcIlxcdTIxMTJcIixcImxzaFwiOlwiXFx1MjFCMFwiLFwiTHNoXCI6XCJcXHUyMUIwXCIsXCJsc2ltXCI6XCJcXHUyMjcyXCIsXCJsc2ltZVwiOlwiXFx1MkE4RFwiLFwibHNpbWdcIjpcIlxcdTJBOEZcIixcImxzcWJcIjpcIltcIixcImxzcXVvXCI6XCJcXHUyMDE4XCIsXCJsc3F1b3JcIjpcIlxcdTIwMUFcIixcIkxzdHJva1wiOlwiXFx1MDE0MVwiLFwibHN0cm9rXCI6XCJcXHUwMTQyXCIsXCJsdGNjXCI6XCJcXHUyQUE2XCIsXCJsdGNpclwiOlwiXFx1MkE3OVwiLFwibHRcIjpcIjxcIixcIkxUXCI6XCI8XCIsXCJMdFwiOlwiXFx1MjI2QVwiLFwibHRkb3RcIjpcIlxcdTIyRDZcIixcImx0aHJlZVwiOlwiXFx1MjJDQlwiLFwibHRpbWVzXCI6XCJcXHUyMkM5XCIsXCJsdGxhcnJcIjpcIlxcdTI5NzZcIixcImx0cXVlc3RcIjpcIlxcdTJBN0JcIixcImx0cmlcIjpcIlxcdTI1QzNcIixcImx0cmllXCI6XCJcXHUyMkI0XCIsXCJsdHJpZlwiOlwiXFx1MjVDMlwiLFwibHRyUGFyXCI6XCJcXHUyOTk2XCIsXCJsdXJkc2hhclwiOlwiXFx1Mjk0QVwiLFwibHVydWhhclwiOlwiXFx1Mjk2NlwiLFwibHZlcnRuZXFxXCI6XCJcXHUyMjY4XFx1RkUwMFwiLFwibHZuRVwiOlwiXFx1MjI2OFxcdUZFMDBcIixcIm1hY3JcIjpcIlxcdTAwQUZcIixcIm1hbGVcIjpcIlxcdTI2NDJcIixcIm1hbHRcIjpcIlxcdTI3MjBcIixcIm1hbHRlc2VcIjpcIlxcdTI3MjBcIixcIk1hcFwiOlwiXFx1MjkwNVwiLFwibWFwXCI6XCJcXHUyMUE2XCIsXCJtYXBzdG9cIjpcIlxcdTIxQTZcIixcIm1hcHN0b2Rvd25cIjpcIlxcdTIxQTdcIixcIm1hcHN0b2xlZnRcIjpcIlxcdTIxQTRcIixcIm1hcHN0b3VwXCI6XCJcXHUyMUE1XCIsXCJtYXJrZXJcIjpcIlxcdTI1QUVcIixcIm1jb21tYVwiOlwiXFx1MkEyOVwiLFwiTWN5XCI6XCJcXHUwNDFDXCIsXCJtY3lcIjpcIlxcdTA0M0NcIixcIm1kYXNoXCI6XCJcXHUyMDE0XCIsXCJtRERvdFwiOlwiXFx1MjIzQVwiLFwibWVhc3VyZWRhbmdsZVwiOlwiXFx1MjIyMVwiLFwiTWVkaXVtU3BhY2VcIjpcIlxcdTIwNUZcIixcIk1lbGxpbnRyZlwiOlwiXFx1MjEzM1wiLFwiTWZyXCI6XCJcXHVEODM1XFx1REQxMFwiLFwibWZyXCI6XCJcXHVEODM1XFx1REQyQVwiLFwibWhvXCI6XCJcXHUyMTI3XCIsXCJtaWNyb1wiOlwiXFx1MDBCNVwiLFwibWlkYXN0XCI6XCIqXCIsXCJtaWRjaXJcIjpcIlxcdTJBRjBcIixcIm1pZFwiOlwiXFx1MjIyM1wiLFwibWlkZG90XCI6XCJcXHUwMEI3XCIsXCJtaW51c2JcIjpcIlxcdTIyOUZcIixcIm1pbnVzXCI6XCJcXHUyMjEyXCIsXCJtaW51c2RcIjpcIlxcdTIyMzhcIixcIm1pbnVzZHVcIjpcIlxcdTJBMkFcIixcIk1pbnVzUGx1c1wiOlwiXFx1MjIxM1wiLFwibWxjcFwiOlwiXFx1MkFEQlwiLFwibWxkclwiOlwiXFx1MjAyNlwiLFwibW5wbHVzXCI6XCJcXHUyMjEzXCIsXCJtb2RlbHNcIjpcIlxcdTIyQTdcIixcIk1vcGZcIjpcIlxcdUQ4MzVcXHVERDQ0XCIsXCJtb3BmXCI6XCJcXHVEODM1XFx1REQ1RVwiLFwibXBcIjpcIlxcdTIyMTNcIixcIm1zY3JcIjpcIlxcdUQ4MzVcXHVEQ0MyXCIsXCJNc2NyXCI6XCJcXHUyMTMzXCIsXCJtc3Rwb3NcIjpcIlxcdTIyM0VcIixcIk11XCI6XCJcXHUwMzlDXCIsXCJtdVwiOlwiXFx1MDNCQ1wiLFwibXVsdGltYXBcIjpcIlxcdTIyQjhcIixcIm11bWFwXCI6XCJcXHUyMkI4XCIsXCJuYWJsYVwiOlwiXFx1MjIwN1wiLFwiTmFjdXRlXCI6XCJcXHUwMTQzXCIsXCJuYWN1dGVcIjpcIlxcdTAxNDRcIixcIm5hbmdcIjpcIlxcdTIyMjBcXHUyMEQyXCIsXCJuYXBcIjpcIlxcdTIyNDlcIixcIm5hcEVcIjpcIlxcdTJBNzBcXHUwMzM4XCIsXCJuYXBpZFwiOlwiXFx1MjI0QlxcdTAzMzhcIixcIm5hcG9zXCI6XCJcXHUwMTQ5XCIsXCJuYXBwcm94XCI6XCJcXHUyMjQ5XCIsXCJuYXR1cmFsXCI6XCJcXHUyNjZFXCIsXCJuYXR1cmFsc1wiOlwiXFx1MjExNVwiLFwibmF0dXJcIjpcIlxcdTI2NkVcIixcIm5ic3BcIjpcIlxcdTAwQTBcIixcIm5idW1wXCI6XCJcXHUyMjRFXFx1MDMzOFwiLFwibmJ1bXBlXCI6XCJcXHUyMjRGXFx1MDMzOFwiLFwibmNhcFwiOlwiXFx1MkE0M1wiLFwiTmNhcm9uXCI6XCJcXHUwMTQ3XCIsXCJuY2Fyb25cIjpcIlxcdTAxNDhcIixcIk5jZWRpbFwiOlwiXFx1MDE0NVwiLFwibmNlZGlsXCI6XCJcXHUwMTQ2XCIsXCJuY29uZ1wiOlwiXFx1MjI0N1wiLFwibmNvbmdkb3RcIjpcIlxcdTJBNkRcXHUwMzM4XCIsXCJuY3VwXCI6XCJcXHUyQTQyXCIsXCJOY3lcIjpcIlxcdTA0MURcIixcIm5jeVwiOlwiXFx1MDQzRFwiLFwibmRhc2hcIjpcIlxcdTIwMTNcIixcIm5lYXJoa1wiOlwiXFx1MjkyNFwiLFwibmVhcnJcIjpcIlxcdTIxOTdcIixcIm5lQXJyXCI6XCJcXHUyMUQ3XCIsXCJuZWFycm93XCI6XCJcXHUyMTk3XCIsXCJuZVwiOlwiXFx1MjI2MFwiLFwibmVkb3RcIjpcIlxcdTIyNTBcXHUwMzM4XCIsXCJOZWdhdGl2ZU1lZGl1bVNwYWNlXCI6XCJcXHUyMDBCXCIsXCJOZWdhdGl2ZVRoaWNrU3BhY2VcIjpcIlxcdTIwMEJcIixcIk5lZ2F0aXZlVGhpblNwYWNlXCI6XCJcXHUyMDBCXCIsXCJOZWdhdGl2ZVZlcnlUaGluU3BhY2VcIjpcIlxcdTIwMEJcIixcIm5lcXVpdlwiOlwiXFx1MjI2MlwiLFwibmVzZWFyXCI6XCJcXHUyOTI4XCIsXCJuZXNpbVwiOlwiXFx1MjI0MlxcdTAzMzhcIixcIk5lc3RlZEdyZWF0ZXJHcmVhdGVyXCI6XCJcXHUyMjZCXCIsXCJOZXN0ZWRMZXNzTGVzc1wiOlwiXFx1MjI2QVwiLFwiTmV3TGluZVwiOlwiXFxuXCIsXCJuZXhpc3RcIjpcIlxcdTIyMDRcIixcIm5leGlzdHNcIjpcIlxcdTIyMDRcIixcIk5mclwiOlwiXFx1RDgzNVxcdUREMTFcIixcIm5mclwiOlwiXFx1RDgzNVxcdUREMkJcIixcIm5nRVwiOlwiXFx1MjI2N1xcdTAzMzhcIixcIm5nZVwiOlwiXFx1MjI3MVwiLFwibmdlcVwiOlwiXFx1MjI3MVwiLFwibmdlcXFcIjpcIlxcdTIyNjdcXHUwMzM4XCIsXCJuZ2Vxc2xhbnRcIjpcIlxcdTJBN0VcXHUwMzM4XCIsXCJuZ2VzXCI6XCJcXHUyQTdFXFx1MDMzOFwiLFwibkdnXCI6XCJcXHUyMkQ5XFx1MDMzOFwiLFwibmdzaW1cIjpcIlxcdTIyNzVcIixcIm5HdFwiOlwiXFx1MjI2QlxcdTIwRDJcIixcIm5ndFwiOlwiXFx1MjI2RlwiLFwibmd0clwiOlwiXFx1MjI2RlwiLFwibkd0dlwiOlwiXFx1MjI2QlxcdTAzMzhcIixcIm5oYXJyXCI6XCJcXHUyMUFFXCIsXCJuaEFyclwiOlwiXFx1MjFDRVwiLFwibmhwYXJcIjpcIlxcdTJBRjJcIixcIm5pXCI6XCJcXHUyMjBCXCIsXCJuaXNcIjpcIlxcdTIyRkNcIixcIm5pc2RcIjpcIlxcdTIyRkFcIixcIm5pdlwiOlwiXFx1MjIwQlwiLFwiTkpjeVwiOlwiXFx1MDQwQVwiLFwibmpjeVwiOlwiXFx1MDQ1QVwiLFwibmxhcnJcIjpcIlxcdTIxOUFcIixcIm5sQXJyXCI6XCJcXHUyMUNEXCIsXCJubGRyXCI6XCJcXHUyMDI1XCIsXCJubEVcIjpcIlxcdTIyNjZcXHUwMzM4XCIsXCJubGVcIjpcIlxcdTIyNzBcIixcIm5sZWZ0YXJyb3dcIjpcIlxcdTIxOUFcIixcIm5MZWZ0YXJyb3dcIjpcIlxcdTIxQ0RcIixcIm5sZWZ0cmlnaHRhcnJvd1wiOlwiXFx1MjFBRVwiLFwibkxlZnRyaWdodGFycm93XCI6XCJcXHUyMUNFXCIsXCJubGVxXCI6XCJcXHUyMjcwXCIsXCJubGVxcVwiOlwiXFx1MjI2NlxcdTAzMzhcIixcIm5sZXFzbGFudFwiOlwiXFx1MkE3RFxcdTAzMzhcIixcIm5sZXNcIjpcIlxcdTJBN0RcXHUwMzM4XCIsXCJubGVzc1wiOlwiXFx1MjI2RVwiLFwibkxsXCI6XCJcXHUyMkQ4XFx1MDMzOFwiLFwibmxzaW1cIjpcIlxcdTIyNzRcIixcIm5MdFwiOlwiXFx1MjI2QVxcdTIwRDJcIixcIm5sdFwiOlwiXFx1MjI2RVwiLFwibmx0cmlcIjpcIlxcdTIyRUFcIixcIm5sdHJpZVwiOlwiXFx1MjJFQ1wiLFwibkx0dlwiOlwiXFx1MjI2QVxcdTAzMzhcIixcIm5taWRcIjpcIlxcdTIyMjRcIixcIk5vQnJlYWtcIjpcIlxcdTIwNjBcIixcIk5vbkJyZWFraW5nU3BhY2VcIjpcIlxcdTAwQTBcIixcIm5vcGZcIjpcIlxcdUQ4MzVcXHVERDVGXCIsXCJOb3BmXCI6XCJcXHUyMTE1XCIsXCJOb3RcIjpcIlxcdTJBRUNcIixcIm5vdFwiOlwiXFx1MDBBQ1wiLFwiTm90Q29uZ3J1ZW50XCI6XCJcXHUyMjYyXCIsXCJOb3RDdXBDYXBcIjpcIlxcdTIyNkRcIixcIk5vdERvdWJsZVZlcnRpY2FsQmFyXCI6XCJcXHUyMjI2XCIsXCJOb3RFbGVtZW50XCI6XCJcXHUyMjA5XCIsXCJOb3RFcXVhbFwiOlwiXFx1MjI2MFwiLFwiTm90RXF1YWxUaWxkZVwiOlwiXFx1MjI0MlxcdTAzMzhcIixcIk5vdEV4aXN0c1wiOlwiXFx1MjIwNFwiLFwiTm90R3JlYXRlclwiOlwiXFx1MjI2RlwiLFwiTm90R3JlYXRlckVxdWFsXCI6XCJcXHUyMjcxXCIsXCJOb3RHcmVhdGVyRnVsbEVxdWFsXCI6XCJcXHUyMjY3XFx1MDMzOFwiLFwiTm90R3JlYXRlckdyZWF0ZXJcIjpcIlxcdTIyNkJcXHUwMzM4XCIsXCJOb3RHcmVhdGVyTGVzc1wiOlwiXFx1MjI3OVwiLFwiTm90R3JlYXRlclNsYW50RXF1YWxcIjpcIlxcdTJBN0VcXHUwMzM4XCIsXCJOb3RHcmVhdGVyVGlsZGVcIjpcIlxcdTIyNzVcIixcIk5vdEh1bXBEb3duSHVtcFwiOlwiXFx1MjI0RVxcdTAzMzhcIixcIk5vdEh1bXBFcXVhbFwiOlwiXFx1MjI0RlxcdTAzMzhcIixcIm5vdGluXCI6XCJcXHUyMjA5XCIsXCJub3RpbmRvdFwiOlwiXFx1MjJGNVxcdTAzMzhcIixcIm5vdGluRVwiOlwiXFx1MjJGOVxcdTAzMzhcIixcIm5vdGludmFcIjpcIlxcdTIyMDlcIixcIm5vdGludmJcIjpcIlxcdTIyRjdcIixcIm5vdGludmNcIjpcIlxcdTIyRjZcIixcIk5vdExlZnRUcmlhbmdsZUJhclwiOlwiXFx1MjlDRlxcdTAzMzhcIixcIk5vdExlZnRUcmlhbmdsZVwiOlwiXFx1MjJFQVwiLFwiTm90TGVmdFRyaWFuZ2xlRXF1YWxcIjpcIlxcdTIyRUNcIixcIk5vdExlc3NcIjpcIlxcdTIyNkVcIixcIk5vdExlc3NFcXVhbFwiOlwiXFx1MjI3MFwiLFwiTm90TGVzc0dyZWF0ZXJcIjpcIlxcdTIyNzhcIixcIk5vdExlc3NMZXNzXCI6XCJcXHUyMjZBXFx1MDMzOFwiLFwiTm90TGVzc1NsYW50RXF1YWxcIjpcIlxcdTJBN0RcXHUwMzM4XCIsXCJOb3RMZXNzVGlsZGVcIjpcIlxcdTIyNzRcIixcIk5vdE5lc3RlZEdyZWF0ZXJHcmVhdGVyXCI6XCJcXHUyQUEyXFx1MDMzOFwiLFwiTm90TmVzdGVkTGVzc0xlc3NcIjpcIlxcdTJBQTFcXHUwMzM4XCIsXCJub3RuaVwiOlwiXFx1MjIwQ1wiLFwibm90bml2YVwiOlwiXFx1MjIwQ1wiLFwibm90bml2YlwiOlwiXFx1MjJGRVwiLFwibm90bml2Y1wiOlwiXFx1MjJGRFwiLFwiTm90UHJlY2VkZXNcIjpcIlxcdTIyODBcIixcIk5vdFByZWNlZGVzRXF1YWxcIjpcIlxcdTJBQUZcXHUwMzM4XCIsXCJOb3RQcmVjZWRlc1NsYW50RXF1YWxcIjpcIlxcdTIyRTBcIixcIk5vdFJldmVyc2VFbGVtZW50XCI6XCJcXHUyMjBDXCIsXCJOb3RSaWdodFRyaWFuZ2xlQmFyXCI6XCJcXHUyOUQwXFx1MDMzOFwiLFwiTm90UmlnaHRUcmlhbmdsZVwiOlwiXFx1MjJFQlwiLFwiTm90UmlnaHRUcmlhbmdsZUVxdWFsXCI6XCJcXHUyMkVEXCIsXCJOb3RTcXVhcmVTdWJzZXRcIjpcIlxcdTIyOEZcXHUwMzM4XCIsXCJOb3RTcXVhcmVTdWJzZXRFcXVhbFwiOlwiXFx1MjJFMlwiLFwiTm90U3F1YXJlU3VwZXJzZXRcIjpcIlxcdTIyOTBcXHUwMzM4XCIsXCJOb3RTcXVhcmVTdXBlcnNldEVxdWFsXCI6XCJcXHUyMkUzXCIsXCJOb3RTdWJzZXRcIjpcIlxcdTIyODJcXHUyMEQyXCIsXCJOb3RTdWJzZXRFcXVhbFwiOlwiXFx1MjI4OFwiLFwiTm90U3VjY2VlZHNcIjpcIlxcdTIyODFcIixcIk5vdFN1Y2NlZWRzRXF1YWxcIjpcIlxcdTJBQjBcXHUwMzM4XCIsXCJOb3RTdWNjZWVkc1NsYW50RXF1YWxcIjpcIlxcdTIyRTFcIixcIk5vdFN1Y2NlZWRzVGlsZGVcIjpcIlxcdTIyN0ZcXHUwMzM4XCIsXCJOb3RTdXBlcnNldFwiOlwiXFx1MjI4M1xcdTIwRDJcIixcIk5vdFN1cGVyc2V0RXF1YWxcIjpcIlxcdTIyODlcIixcIk5vdFRpbGRlXCI6XCJcXHUyMjQxXCIsXCJOb3RUaWxkZUVxdWFsXCI6XCJcXHUyMjQ0XCIsXCJOb3RUaWxkZUZ1bGxFcXVhbFwiOlwiXFx1MjI0N1wiLFwiTm90VGlsZGVUaWxkZVwiOlwiXFx1MjI0OVwiLFwiTm90VmVydGljYWxCYXJcIjpcIlxcdTIyMjRcIixcIm5wYXJhbGxlbFwiOlwiXFx1MjIyNlwiLFwibnBhclwiOlwiXFx1MjIyNlwiLFwibnBhcnNsXCI6XCJcXHUyQUZEXFx1MjBFNVwiLFwibnBhcnRcIjpcIlxcdTIyMDJcXHUwMzM4XCIsXCJucG9saW50XCI6XCJcXHUyQTE0XCIsXCJucHJcIjpcIlxcdTIyODBcIixcIm5wcmN1ZVwiOlwiXFx1MjJFMFwiLFwibnByZWNcIjpcIlxcdTIyODBcIixcIm5wcmVjZXFcIjpcIlxcdTJBQUZcXHUwMzM4XCIsXCJucHJlXCI6XCJcXHUyQUFGXFx1MDMzOFwiLFwibnJhcnJjXCI6XCJcXHUyOTMzXFx1MDMzOFwiLFwibnJhcnJcIjpcIlxcdTIxOUJcIixcIm5yQXJyXCI6XCJcXHUyMUNGXCIsXCJucmFycndcIjpcIlxcdTIxOURcXHUwMzM4XCIsXCJucmlnaHRhcnJvd1wiOlwiXFx1MjE5QlwiLFwiblJpZ2h0YXJyb3dcIjpcIlxcdTIxQ0ZcIixcIm5ydHJpXCI6XCJcXHUyMkVCXCIsXCJucnRyaWVcIjpcIlxcdTIyRURcIixcIm5zY1wiOlwiXFx1MjI4MVwiLFwibnNjY3VlXCI6XCJcXHUyMkUxXCIsXCJuc2NlXCI6XCJcXHUyQUIwXFx1MDMzOFwiLFwiTnNjclwiOlwiXFx1RDgzNVxcdURDQTlcIixcIm5zY3JcIjpcIlxcdUQ4MzVcXHVEQ0MzXCIsXCJuc2hvcnRtaWRcIjpcIlxcdTIyMjRcIixcIm5zaG9ydHBhcmFsbGVsXCI6XCJcXHUyMjI2XCIsXCJuc2ltXCI6XCJcXHUyMjQxXCIsXCJuc2ltZVwiOlwiXFx1MjI0NFwiLFwibnNpbWVxXCI6XCJcXHUyMjQ0XCIsXCJuc21pZFwiOlwiXFx1MjIyNFwiLFwibnNwYXJcIjpcIlxcdTIyMjZcIixcIm5zcXN1YmVcIjpcIlxcdTIyRTJcIixcIm5zcXN1cGVcIjpcIlxcdTIyRTNcIixcIm5zdWJcIjpcIlxcdTIyODRcIixcIm5zdWJFXCI6XCJcXHUyQUM1XFx1MDMzOFwiLFwibnN1YmVcIjpcIlxcdTIyODhcIixcIm5zdWJzZXRcIjpcIlxcdTIyODJcXHUyMEQyXCIsXCJuc3Vic2V0ZXFcIjpcIlxcdTIyODhcIixcIm5zdWJzZXRlcXFcIjpcIlxcdTJBQzVcXHUwMzM4XCIsXCJuc3VjY1wiOlwiXFx1MjI4MVwiLFwibnN1Y2NlcVwiOlwiXFx1MkFCMFxcdTAzMzhcIixcIm5zdXBcIjpcIlxcdTIyODVcIixcIm5zdXBFXCI6XCJcXHUyQUM2XFx1MDMzOFwiLFwibnN1cGVcIjpcIlxcdTIyODlcIixcIm5zdXBzZXRcIjpcIlxcdTIyODNcXHUyMEQyXCIsXCJuc3Vwc2V0ZXFcIjpcIlxcdTIyODlcIixcIm5zdXBzZXRlcXFcIjpcIlxcdTJBQzZcXHUwMzM4XCIsXCJudGdsXCI6XCJcXHUyMjc5XCIsXCJOdGlsZGVcIjpcIlxcdTAwRDFcIixcIm50aWxkZVwiOlwiXFx1MDBGMVwiLFwibnRsZ1wiOlwiXFx1MjI3OFwiLFwibnRyaWFuZ2xlbGVmdFwiOlwiXFx1MjJFQVwiLFwibnRyaWFuZ2xlbGVmdGVxXCI6XCJcXHUyMkVDXCIsXCJudHJpYW5nbGVyaWdodFwiOlwiXFx1MjJFQlwiLFwibnRyaWFuZ2xlcmlnaHRlcVwiOlwiXFx1MjJFRFwiLFwiTnVcIjpcIlxcdTAzOURcIixcIm51XCI6XCJcXHUwM0JEXCIsXCJudW1cIjpcIiNcIixcIm51bWVyb1wiOlwiXFx1MjExNlwiLFwibnVtc3BcIjpcIlxcdTIwMDdcIixcIm52YXBcIjpcIlxcdTIyNERcXHUyMEQyXCIsXCJudmRhc2hcIjpcIlxcdTIyQUNcIixcIm52RGFzaFwiOlwiXFx1MjJBRFwiLFwiblZkYXNoXCI6XCJcXHUyMkFFXCIsXCJuVkRhc2hcIjpcIlxcdTIyQUZcIixcIm52Z2VcIjpcIlxcdTIyNjVcXHUyMEQyXCIsXCJudmd0XCI6XCI+XFx1MjBEMlwiLFwibnZIYXJyXCI6XCJcXHUyOTA0XCIsXCJudmluZmluXCI6XCJcXHUyOURFXCIsXCJudmxBcnJcIjpcIlxcdTI5MDJcIixcIm52bGVcIjpcIlxcdTIyNjRcXHUyMEQyXCIsXCJudmx0XCI6XCI8XFx1MjBEMlwiLFwibnZsdHJpZVwiOlwiXFx1MjJCNFxcdTIwRDJcIixcIm52ckFyclwiOlwiXFx1MjkwM1wiLFwibnZydHJpZVwiOlwiXFx1MjJCNVxcdTIwRDJcIixcIm52c2ltXCI6XCJcXHUyMjNDXFx1MjBEMlwiLFwibndhcmhrXCI6XCJcXHUyOTIzXCIsXCJud2FyclwiOlwiXFx1MjE5NlwiLFwibndBcnJcIjpcIlxcdTIxRDZcIixcIm53YXJyb3dcIjpcIlxcdTIxOTZcIixcIm53bmVhclwiOlwiXFx1MjkyN1wiLFwiT2FjdXRlXCI6XCJcXHUwMEQzXCIsXCJvYWN1dGVcIjpcIlxcdTAwRjNcIixcIm9hc3RcIjpcIlxcdTIyOUJcIixcIk9jaXJjXCI6XCJcXHUwMEQ0XCIsXCJvY2lyY1wiOlwiXFx1MDBGNFwiLFwib2NpclwiOlwiXFx1MjI5QVwiLFwiT2N5XCI6XCJcXHUwNDFFXCIsXCJvY3lcIjpcIlxcdTA0M0VcIixcIm9kYXNoXCI6XCJcXHUyMjlEXCIsXCJPZGJsYWNcIjpcIlxcdTAxNTBcIixcIm9kYmxhY1wiOlwiXFx1MDE1MVwiLFwib2RpdlwiOlwiXFx1MkEzOFwiLFwib2RvdFwiOlwiXFx1MjI5OVwiLFwib2Rzb2xkXCI6XCJcXHUyOUJDXCIsXCJPRWxpZ1wiOlwiXFx1MDE1MlwiLFwib2VsaWdcIjpcIlxcdTAxNTNcIixcIm9mY2lyXCI6XCJcXHUyOUJGXCIsXCJPZnJcIjpcIlxcdUQ4MzVcXHVERDEyXCIsXCJvZnJcIjpcIlxcdUQ4MzVcXHVERDJDXCIsXCJvZ29uXCI6XCJcXHUwMkRCXCIsXCJPZ3JhdmVcIjpcIlxcdTAwRDJcIixcIm9ncmF2ZVwiOlwiXFx1MDBGMlwiLFwib2d0XCI6XCJcXHUyOUMxXCIsXCJvaGJhclwiOlwiXFx1MjlCNVwiLFwib2htXCI6XCJcXHUwM0E5XCIsXCJvaW50XCI6XCJcXHUyMjJFXCIsXCJvbGFyclwiOlwiXFx1MjFCQVwiLFwib2xjaXJcIjpcIlxcdTI5QkVcIixcIm9sY3Jvc3NcIjpcIlxcdTI5QkJcIixcIm9saW5lXCI6XCJcXHUyMDNFXCIsXCJvbHRcIjpcIlxcdTI5QzBcIixcIk9tYWNyXCI6XCJcXHUwMTRDXCIsXCJvbWFjclwiOlwiXFx1MDE0RFwiLFwiT21lZ2FcIjpcIlxcdTAzQTlcIixcIm9tZWdhXCI6XCJcXHUwM0M5XCIsXCJPbWljcm9uXCI6XCJcXHUwMzlGXCIsXCJvbWljcm9uXCI6XCJcXHUwM0JGXCIsXCJvbWlkXCI6XCJcXHUyOUI2XCIsXCJvbWludXNcIjpcIlxcdTIyOTZcIixcIk9vcGZcIjpcIlxcdUQ4MzVcXHVERDQ2XCIsXCJvb3BmXCI6XCJcXHVEODM1XFx1REQ2MFwiLFwib3BhclwiOlwiXFx1MjlCN1wiLFwiT3BlbkN1cmx5RG91YmxlUXVvdGVcIjpcIlxcdTIwMUNcIixcIk9wZW5DdXJseVF1b3RlXCI6XCJcXHUyMDE4XCIsXCJvcGVycFwiOlwiXFx1MjlCOVwiLFwib3BsdXNcIjpcIlxcdTIyOTVcIixcIm9yYXJyXCI6XCJcXHUyMUJCXCIsXCJPclwiOlwiXFx1MkE1NFwiLFwib3JcIjpcIlxcdTIyMjhcIixcIm9yZFwiOlwiXFx1MkE1RFwiLFwib3JkZXJcIjpcIlxcdTIxMzRcIixcIm9yZGVyb2ZcIjpcIlxcdTIxMzRcIixcIm9yZGZcIjpcIlxcdTAwQUFcIixcIm9yZG1cIjpcIlxcdTAwQkFcIixcIm9yaWdvZlwiOlwiXFx1MjJCNlwiLFwib3JvclwiOlwiXFx1MkE1NlwiLFwib3JzbG9wZVwiOlwiXFx1MkE1N1wiLFwib3J2XCI6XCJcXHUyQTVCXCIsXCJvU1wiOlwiXFx1MjRDOFwiLFwiT3NjclwiOlwiXFx1RDgzNVxcdURDQUFcIixcIm9zY3JcIjpcIlxcdTIxMzRcIixcIk9zbGFzaFwiOlwiXFx1MDBEOFwiLFwib3NsYXNoXCI6XCJcXHUwMEY4XCIsXCJvc29sXCI6XCJcXHUyMjk4XCIsXCJPdGlsZGVcIjpcIlxcdTAwRDVcIixcIm90aWxkZVwiOlwiXFx1MDBGNVwiLFwib3RpbWVzYXNcIjpcIlxcdTJBMzZcIixcIk90aW1lc1wiOlwiXFx1MkEzN1wiLFwib3RpbWVzXCI6XCJcXHUyMjk3XCIsXCJPdW1sXCI6XCJcXHUwMEQ2XCIsXCJvdW1sXCI6XCJcXHUwMEY2XCIsXCJvdmJhclwiOlwiXFx1MjMzRFwiLFwiT3ZlckJhclwiOlwiXFx1MjAzRVwiLFwiT3ZlckJyYWNlXCI6XCJcXHUyM0RFXCIsXCJPdmVyQnJhY2tldFwiOlwiXFx1MjNCNFwiLFwiT3ZlclBhcmVudGhlc2lzXCI6XCJcXHUyM0RDXCIsXCJwYXJhXCI6XCJcXHUwMEI2XCIsXCJwYXJhbGxlbFwiOlwiXFx1MjIyNVwiLFwicGFyXCI6XCJcXHUyMjI1XCIsXCJwYXJzaW1cIjpcIlxcdTJBRjNcIixcInBhcnNsXCI6XCJcXHUyQUZEXCIsXCJwYXJ0XCI6XCJcXHUyMjAyXCIsXCJQYXJ0aWFsRFwiOlwiXFx1MjIwMlwiLFwiUGN5XCI6XCJcXHUwNDFGXCIsXCJwY3lcIjpcIlxcdTA0M0ZcIixcInBlcmNudFwiOlwiJVwiLFwicGVyaW9kXCI6XCIuXCIsXCJwZXJtaWxcIjpcIlxcdTIwMzBcIixcInBlcnBcIjpcIlxcdTIyQTVcIixcInBlcnRlbmtcIjpcIlxcdTIwMzFcIixcIlBmclwiOlwiXFx1RDgzNVxcdUREMTNcIixcInBmclwiOlwiXFx1RDgzNVxcdUREMkRcIixcIlBoaVwiOlwiXFx1MDNBNlwiLFwicGhpXCI6XCJcXHUwM0M2XCIsXCJwaGl2XCI6XCJcXHUwM0Q1XCIsXCJwaG1tYXRcIjpcIlxcdTIxMzNcIixcInBob25lXCI6XCJcXHUyNjBFXCIsXCJQaVwiOlwiXFx1MDNBMFwiLFwicGlcIjpcIlxcdTAzQzBcIixcInBpdGNoZm9ya1wiOlwiXFx1MjJENFwiLFwicGl2XCI6XCJcXHUwM0Q2XCIsXCJwbGFuY2tcIjpcIlxcdTIxMEZcIixcInBsYW5ja2hcIjpcIlxcdTIxMEVcIixcInBsYW5rdlwiOlwiXFx1MjEwRlwiLFwicGx1c2FjaXJcIjpcIlxcdTJBMjNcIixcInBsdXNiXCI6XCJcXHUyMjlFXCIsXCJwbHVzY2lyXCI6XCJcXHUyQTIyXCIsXCJwbHVzXCI6XCIrXCIsXCJwbHVzZG9cIjpcIlxcdTIyMTRcIixcInBsdXNkdVwiOlwiXFx1MkEyNVwiLFwicGx1c2VcIjpcIlxcdTJBNzJcIixcIlBsdXNNaW51c1wiOlwiXFx1MDBCMVwiLFwicGx1c21uXCI6XCJcXHUwMEIxXCIsXCJwbHVzc2ltXCI6XCJcXHUyQTI2XCIsXCJwbHVzdHdvXCI6XCJcXHUyQTI3XCIsXCJwbVwiOlwiXFx1MDBCMVwiLFwiUG9pbmNhcmVwbGFuZVwiOlwiXFx1MjEwQ1wiLFwicG9pbnRpbnRcIjpcIlxcdTJBMTVcIixcInBvcGZcIjpcIlxcdUQ4MzVcXHVERDYxXCIsXCJQb3BmXCI6XCJcXHUyMTE5XCIsXCJwb3VuZFwiOlwiXFx1MDBBM1wiLFwicHJhcFwiOlwiXFx1MkFCN1wiLFwiUHJcIjpcIlxcdTJBQkJcIixcInByXCI6XCJcXHUyMjdBXCIsXCJwcmN1ZVwiOlwiXFx1MjI3Q1wiLFwicHJlY2FwcHJveFwiOlwiXFx1MkFCN1wiLFwicHJlY1wiOlwiXFx1MjI3QVwiLFwicHJlY2N1cmx5ZXFcIjpcIlxcdTIyN0NcIixcIlByZWNlZGVzXCI6XCJcXHUyMjdBXCIsXCJQcmVjZWRlc0VxdWFsXCI6XCJcXHUyQUFGXCIsXCJQcmVjZWRlc1NsYW50RXF1YWxcIjpcIlxcdTIyN0NcIixcIlByZWNlZGVzVGlsZGVcIjpcIlxcdTIyN0VcIixcInByZWNlcVwiOlwiXFx1MkFBRlwiLFwicHJlY25hcHByb3hcIjpcIlxcdTJBQjlcIixcInByZWNuZXFxXCI6XCJcXHUyQUI1XCIsXCJwcmVjbnNpbVwiOlwiXFx1MjJFOFwiLFwicHJlXCI6XCJcXHUyQUFGXCIsXCJwckVcIjpcIlxcdTJBQjNcIixcInByZWNzaW1cIjpcIlxcdTIyN0VcIixcInByaW1lXCI6XCJcXHUyMDMyXCIsXCJQcmltZVwiOlwiXFx1MjAzM1wiLFwicHJpbWVzXCI6XCJcXHUyMTE5XCIsXCJwcm5hcFwiOlwiXFx1MkFCOVwiLFwicHJuRVwiOlwiXFx1MkFCNVwiLFwicHJuc2ltXCI6XCJcXHUyMkU4XCIsXCJwcm9kXCI6XCJcXHUyMjBGXCIsXCJQcm9kdWN0XCI6XCJcXHUyMjBGXCIsXCJwcm9mYWxhclwiOlwiXFx1MjMyRVwiLFwicHJvZmxpbmVcIjpcIlxcdTIzMTJcIixcInByb2ZzdXJmXCI6XCJcXHUyMzEzXCIsXCJwcm9wXCI6XCJcXHUyMjFEXCIsXCJQcm9wb3J0aW9uYWxcIjpcIlxcdTIyMURcIixcIlByb3BvcnRpb25cIjpcIlxcdTIyMzdcIixcInByb3B0b1wiOlwiXFx1MjIxRFwiLFwicHJzaW1cIjpcIlxcdTIyN0VcIixcInBydXJlbFwiOlwiXFx1MjJCMFwiLFwiUHNjclwiOlwiXFx1RDgzNVxcdURDQUJcIixcInBzY3JcIjpcIlxcdUQ4MzVcXHVEQ0M1XCIsXCJQc2lcIjpcIlxcdTAzQThcIixcInBzaVwiOlwiXFx1MDNDOFwiLFwicHVuY3NwXCI6XCJcXHUyMDA4XCIsXCJRZnJcIjpcIlxcdUQ4MzVcXHVERDE0XCIsXCJxZnJcIjpcIlxcdUQ4MzVcXHVERDJFXCIsXCJxaW50XCI6XCJcXHUyQTBDXCIsXCJxb3BmXCI6XCJcXHVEODM1XFx1REQ2MlwiLFwiUW9wZlwiOlwiXFx1MjExQVwiLFwicXByaW1lXCI6XCJcXHUyMDU3XCIsXCJRc2NyXCI6XCJcXHVEODM1XFx1RENBQ1wiLFwicXNjclwiOlwiXFx1RDgzNVxcdURDQzZcIixcInF1YXRlcm5pb25zXCI6XCJcXHUyMTBEXCIsXCJxdWF0aW50XCI6XCJcXHUyQTE2XCIsXCJxdWVzdFwiOlwiP1wiLFwicXVlc3RlcVwiOlwiXFx1MjI1RlwiLFwicXVvdFwiOlwiXFxcIlwiLFwiUVVPVFwiOlwiXFxcIlwiLFwickFhcnJcIjpcIlxcdTIxREJcIixcInJhY2VcIjpcIlxcdTIyM0RcXHUwMzMxXCIsXCJSYWN1dGVcIjpcIlxcdTAxNTRcIixcInJhY3V0ZVwiOlwiXFx1MDE1NVwiLFwicmFkaWNcIjpcIlxcdTIyMUFcIixcInJhZW1wdHl2XCI6XCJcXHUyOUIzXCIsXCJyYW5nXCI6XCJcXHUyN0U5XCIsXCJSYW5nXCI6XCJcXHUyN0VCXCIsXCJyYW5nZFwiOlwiXFx1Mjk5MlwiLFwicmFuZ2VcIjpcIlxcdTI5QTVcIixcInJhbmdsZVwiOlwiXFx1MjdFOVwiLFwicmFxdW9cIjpcIlxcdTAwQkJcIixcInJhcnJhcFwiOlwiXFx1Mjk3NVwiLFwicmFycmJcIjpcIlxcdTIxRTVcIixcInJhcnJiZnNcIjpcIlxcdTI5MjBcIixcInJhcnJjXCI6XCJcXHUyOTMzXCIsXCJyYXJyXCI6XCJcXHUyMTkyXCIsXCJSYXJyXCI6XCJcXHUyMUEwXCIsXCJyQXJyXCI6XCJcXHUyMUQyXCIsXCJyYXJyZnNcIjpcIlxcdTI5MUVcIixcInJhcnJoa1wiOlwiXFx1MjFBQVwiLFwicmFycmxwXCI6XCJcXHUyMUFDXCIsXCJyYXJycGxcIjpcIlxcdTI5NDVcIixcInJhcnJzaW1cIjpcIlxcdTI5NzRcIixcIlJhcnJ0bFwiOlwiXFx1MjkxNlwiLFwicmFycnRsXCI6XCJcXHUyMUEzXCIsXCJyYXJyd1wiOlwiXFx1MjE5RFwiLFwicmF0YWlsXCI6XCJcXHUyOTFBXCIsXCJyQXRhaWxcIjpcIlxcdTI5MUNcIixcInJhdGlvXCI6XCJcXHUyMjM2XCIsXCJyYXRpb25hbHNcIjpcIlxcdTIxMUFcIixcInJiYXJyXCI6XCJcXHUyOTBEXCIsXCJyQmFyclwiOlwiXFx1MjkwRlwiLFwiUkJhcnJcIjpcIlxcdTI5MTBcIixcInJiYnJrXCI6XCJcXHUyNzczXCIsXCJyYnJhY2VcIjpcIn1cIixcInJicmFja1wiOlwiXVwiLFwicmJya2VcIjpcIlxcdTI5OENcIixcInJicmtzbGRcIjpcIlxcdTI5OEVcIixcInJicmtzbHVcIjpcIlxcdTI5OTBcIixcIlJjYXJvblwiOlwiXFx1MDE1OFwiLFwicmNhcm9uXCI6XCJcXHUwMTU5XCIsXCJSY2VkaWxcIjpcIlxcdTAxNTZcIixcInJjZWRpbFwiOlwiXFx1MDE1N1wiLFwicmNlaWxcIjpcIlxcdTIzMDlcIixcInJjdWJcIjpcIn1cIixcIlJjeVwiOlwiXFx1MDQyMFwiLFwicmN5XCI6XCJcXHUwNDQwXCIsXCJyZGNhXCI6XCJcXHUyOTM3XCIsXCJyZGxkaGFyXCI6XCJcXHUyOTY5XCIsXCJyZHF1b1wiOlwiXFx1MjAxRFwiLFwicmRxdW9yXCI6XCJcXHUyMDFEXCIsXCJyZHNoXCI6XCJcXHUyMUIzXCIsXCJyZWFsXCI6XCJcXHUyMTFDXCIsXCJyZWFsaW5lXCI6XCJcXHUyMTFCXCIsXCJyZWFscGFydFwiOlwiXFx1MjExQ1wiLFwicmVhbHNcIjpcIlxcdTIxMURcIixcIlJlXCI6XCJcXHUyMTFDXCIsXCJyZWN0XCI6XCJcXHUyNUFEXCIsXCJyZWdcIjpcIlxcdTAwQUVcIixcIlJFR1wiOlwiXFx1MDBBRVwiLFwiUmV2ZXJzZUVsZW1lbnRcIjpcIlxcdTIyMEJcIixcIlJldmVyc2VFcXVpbGlicml1bVwiOlwiXFx1MjFDQlwiLFwiUmV2ZXJzZVVwRXF1aWxpYnJpdW1cIjpcIlxcdTI5NkZcIixcInJmaXNodFwiOlwiXFx1Mjk3RFwiLFwicmZsb29yXCI6XCJcXHUyMzBCXCIsXCJyZnJcIjpcIlxcdUQ4MzVcXHVERDJGXCIsXCJSZnJcIjpcIlxcdTIxMUNcIixcInJIYXJcIjpcIlxcdTI5NjRcIixcInJoYXJkXCI6XCJcXHUyMUMxXCIsXCJyaGFydVwiOlwiXFx1MjFDMFwiLFwicmhhcnVsXCI6XCJcXHUyOTZDXCIsXCJSaG9cIjpcIlxcdTAzQTFcIixcInJob1wiOlwiXFx1MDNDMVwiLFwicmhvdlwiOlwiXFx1MDNGMVwiLFwiUmlnaHRBbmdsZUJyYWNrZXRcIjpcIlxcdTI3RTlcIixcIlJpZ2h0QXJyb3dCYXJcIjpcIlxcdTIxRTVcIixcInJpZ2h0YXJyb3dcIjpcIlxcdTIxOTJcIixcIlJpZ2h0QXJyb3dcIjpcIlxcdTIxOTJcIixcIlJpZ2h0YXJyb3dcIjpcIlxcdTIxRDJcIixcIlJpZ2h0QXJyb3dMZWZ0QXJyb3dcIjpcIlxcdTIxQzRcIixcInJpZ2h0YXJyb3d0YWlsXCI6XCJcXHUyMUEzXCIsXCJSaWdodENlaWxpbmdcIjpcIlxcdTIzMDlcIixcIlJpZ2h0RG91YmxlQnJhY2tldFwiOlwiXFx1MjdFN1wiLFwiUmlnaHREb3duVGVlVmVjdG9yXCI6XCJcXHUyOTVEXCIsXCJSaWdodERvd25WZWN0b3JCYXJcIjpcIlxcdTI5NTVcIixcIlJpZ2h0RG93blZlY3RvclwiOlwiXFx1MjFDMlwiLFwiUmlnaHRGbG9vclwiOlwiXFx1MjMwQlwiLFwicmlnaHRoYXJwb29uZG93blwiOlwiXFx1MjFDMVwiLFwicmlnaHRoYXJwb29udXBcIjpcIlxcdTIxQzBcIixcInJpZ2h0bGVmdGFycm93c1wiOlwiXFx1MjFDNFwiLFwicmlnaHRsZWZ0aGFycG9vbnNcIjpcIlxcdTIxQ0NcIixcInJpZ2h0cmlnaHRhcnJvd3NcIjpcIlxcdTIxQzlcIixcInJpZ2h0c3F1aWdhcnJvd1wiOlwiXFx1MjE5RFwiLFwiUmlnaHRUZWVBcnJvd1wiOlwiXFx1MjFBNlwiLFwiUmlnaHRUZWVcIjpcIlxcdTIyQTJcIixcIlJpZ2h0VGVlVmVjdG9yXCI6XCJcXHUyOTVCXCIsXCJyaWdodHRocmVldGltZXNcIjpcIlxcdTIyQ0NcIixcIlJpZ2h0VHJpYW5nbGVCYXJcIjpcIlxcdTI5RDBcIixcIlJpZ2h0VHJpYW5nbGVcIjpcIlxcdTIyQjNcIixcIlJpZ2h0VHJpYW5nbGVFcXVhbFwiOlwiXFx1MjJCNVwiLFwiUmlnaHRVcERvd25WZWN0b3JcIjpcIlxcdTI5NEZcIixcIlJpZ2h0VXBUZWVWZWN0b3JcIjpcIlxcdTI5NUNcIixcIlJpZ2h0VXBWZWN0b3JCYXJcIjpcIlxcdTI5NTRcIixcIlJpZ2h0VXBWZWN0b3JcIjpcIlxcdTIxQkVcIixcIlJpZ2h0VmVjdG9yQmFyXCI6XCJcXHUyOTUzXCIsXCJSaWdodFZlY3RvclwiOlwiXFx1MjFDMFwiLFwicmluZ1wiOlwiXFx1MDJEQVwiLFwicmlzaW5nZG90c2VxXCI6XCJcXHUyMjUzXCIsXCJybGFyclwiOlwiXFx1MjFDNFwiLFwicmxoYXJcIjpcIlxcdTIxQ0NcIixcInJsbVwiOlwiXFx1MjAwRlwiLFwicm1vdXN0YWNoZVwiOlwiXFx1MjNCMVwiLFwicm1vdXN0XCI6XCJcXHUyM0IxXCIsXCJybm1pZFwiOlwiXFx1MkFFRVwiLFwicm9hbmdcIjpcIlxcdTI3RURcIixcInJvYXJyXCI6XCJcXHUyMUZFXCIsXCJyb2Jya1wiOlwiXFx1MjdFN1wiLFwicm9wYXJcIjpcIlxcdTI5ODZcIixcInJvcGZcIjpcIlxcdUQ4MzVcXHVERDYzXCIsXCJSb3BmXCI6XCJcXHUyMTFEXCIsXCJyb3BsdXNcIjpcIlxcdTJBMkVcIixcInJvdGltZXNcIjpcIlxcdTJBMzVcIixcIlJvdW5kSW1wbGllc1wiOlwiXFx1Mjk3MFwiLFwicnBhclwiOlwiKVwiLFwicnBhcmd0XCI6XCJcXHUyOTk0XCIsXCJycHBvbGludFwiOlwiXFx1MkExMlwiLFwicnJhcnJcIjpcIlxcdTIxQzlcIixcIlJyaWdodGFycm93XCI6XCJcXHUyMURCXCIsXCJyc2FxdW9cIjpcIlxcdTIwM0FcIixcInJzY3JcIjpcIlxcdUQ4MzVcXHVEQ0M3XCIsXCJSc2NyXCI6XCJcXHUyMTFCXCIsXCJyc2hcIjpcIlxcdTIxQjFcIixcIlJzaFwiOlwiXFx1MjFCMVwiLFwicnNxYlwiOlwiXVwiLFwicnNxdW9cIjpcIlxcdTIwMTlcIixcInJzcXVvclwiOlwiXFx1MjAxOVwiLFwicnRocmVlXCI6XCJcXHUyMkNDXCIsXCJydGltZXNcIjpcIlxcdTIyQ0FcIixcInJ0cmlcIjpcIlxcdTI1QjlcIixcInJ0cmllXCI6XCJcXHUyMkI1XCIsXCJydHJpZlwiOlwiXFx1MjVCOFwiLFwicnRyaWx0cmlcIjpcIlxcdTI5Q0VcIixcIlJ1bGVEZWxheWVkXCI6XCJcXHUyOUY0XCIsXCJydWx1aGFyXCI6XCJcXHUyOTY4XCIsXCJyeFwiOlwiXFx1MjExRVwiLFwiU2FjdXRlXCI6XCJcXHUwMTVBXCIsXCJzYWN1dGVcIjpcIlxcdTAxNUJcIixcInNicXVvXCI6XCJcXHUyMDFBXCIsXCJzY2FwXCI6XCJcXHUyQUI4XCIsXCJTY2Fyb25cIjpcIlxcdTAxNjBcIixcInNjYXJvblwiOlwiXFx1MDE2MVwiLFwiU2NcIjpcIlxcdTJBQkNcIixcInNjXCI6XCJcXHUyMjdCXCIsXCJzY2N1ZVwiOlwiXFx1MjI3RFwiLFwic2NlXCI6XCJcXHUyQUIwXCIsXCJzY0VcIjpcIlxcdTJBQjRcIixcIlNjZWRpbFwiOlwiXFx1MDE1RVwiLFwic2NlZGlsXCI6XCJcXHUwMTVGXCIsXCJTY2lyY1wiOlwiXFx1MDE1Q1wiLFwic2NpcmNcIjpcIlxcdTAxNURcIixcInNjbmFwXCI6XCJcXHUyQUJBXCIsXCJzY25FXCI6XCJcXHUyQUI2XCIsXCJzY25zaW1cIjpcIlxcdTIyRTlcIixcInNjcG9saW50XCI6XCJcXHUyQTEzXCIsXCJzY3NpbVwiOlwiXFx1MjI3RlwiLFwiU2N5XCI6XCJcXHUwNDIxXCIsXCJzY3lcIjpcIlxcdTA0NDFcIixcInNkb3RiXCI6XCJcXHUyMkExXCIsXCJzZG90XCI6XCJcXHUyMkM1XCIsXCJzZG90ZVwiOlwiXFx1MkE2NlwiLFwic2VhcmhrXCI6XCJcXHUyOTI1XCIsXCJzZWFyclwiOlwiXFx1MjE5OFwiLFwic2VBcnJcIjpcIlxcdTIxRDhcIixcInNlYXJyb3dcIjpcIlxcdTIxOThcIixcInNlY3RcIjpcIlxcdTAwQTdcIixcInNlbWlcIjpcIjtcIixcInNlc3dhclwiOlwiXFx1MjkyOVwiLFwic2V0bWludXNcIjpcIlxcdTIyMTZcIixcInNldG1uXCI6XCJcXHUyMjE2XCIsXCJzZXh0XCI6XCJcXHUyNzM2XCIsXCJTZnJcIjpcIlxcdUQ4MzVcXHVERDE2XCIsXCJzZnJcIjpcIlxcdUQ4MzVcXHVERDMwXCIsXCJzZnJvd25cIjpcIlxcdTIzMjJcIixcInNoYXJwXCI6XCJcXHUyNjZGXCIsXCJTSENIY3lcIjpcIlxcdTA0MjlcIixcInNoY2hjeVwiOlwiXFx1MDQ0OVwiLFwiU0hjeVwiOlwiXFx1MDQyOFwiLFwic2hjeVwiOlwiXFx1MDQ0OFwiLFwiU2hvcnREb3duQXJyb3dcIjpcIlxcdTIxOTNcIixcIlNob3J0TGVmdEFycm93XCI6XCJcXHUyMTkwXCIsXCJzaG9ydG1pZFwiOlwiXFx1MjIyM1wiLFwic2hvcnRwYXJhbGxlbFwiOlwiXFx1MjIyNVwiLFwiU2hvcnRSaWdodEFycm93XCI6XCJcXHUyMTkyXCIsXCJTaG9ydFVwQXJyb3dcIjpcIlxcdTIxOTFcIixcInNoeVwiOlwiXFx1MDBBRFwiLFwiU2lnbWFcIjpcIlxcdTAzQTNcIixcInNpZ21hXCI6XCJcXHUwM0MzXCIsXCJzaWdtYWZcIjpcIlxcdTAzQzJcIixcInNpZ21hdlwiOlwiXFx1MDNDMlwiLFwic2ltXCI6XCJcXHUyMjNDXCIsXCJzaW1kb3RcIjpcIlxcdTJBNkFcIixcInNpbWVcIjpcIlxcdTIyNDNcIixcInNpbWVxXCI6XCJcXHUyMjQzXCIsXCJzaW1nXCI6XCJcXHUyQTlFXCIsXCJzaW1nRVwiOlwiXFx1MkFBMFwiLFwic2ltbFwiOlwiXFx1MkE5RFwiLFwic2ltbEVcIjpcIlxcdTJBOUZcIixcInNpbW5lXCI6XCJcXHUyMjQ2XCIsXCJzaW1wbHVzXCI6XCJcXHUyQTI0XCIsXCJzaW1yYXJyXCI6XCJcXHUyOTcyXCIsXCJzbGFyclwiOlwiXFx1MjE5MFwiLFwiU21hbGxDaXJjbGVcIjpcIlxcdTIyMThcIixcInNtYWxsc2V0bWludXNcIjpcIlxcdTIyMTZcIixcInNtYXNocFwiOlwiXFx1MkEzM1wiLFwic21lcGFyc2xcIjpcIlxcdTI5RTRcIixcInNtaWRcIjpcIlxcdTIyMjNcIixcInNtaWxlXCI6XCJcXHUyMzIzXCIsXCJzbXRcIjpcIlxcdTJBQUFcIixcInNtdGVcIjpcIlxcdTJBQUNcIixcInNtdGVzXCI6XCJcXHUyQUFDXFx1RkUwMFwiLFwiU09GVGN5XCI6XCJcXHUwNDJDXCIsXCJzb2Z0Y3lcIjpcIlxcdTA0NENcIixcInNvbGJhclwiOlwiXFx1MjMzRlwiLFwic29sYlwiOlwiXFx1MjlDNFwiLFwic29sXCI6XCIvXCIsXCJTb3BmXCI6XCJcXHVEODM1XFx1REQ0QVwiLFwic29wZlwiOlwiXFx1RDgzNVxcdURENjRcIixcInNwYWRlc1wiOlwiXFx1MjY2MFwiLFwic3BhZGVzdWl0XCI6XCJcXHUyNjYwXCIsXCJzcGFyXCI6XCJcXHUyMjI1XCIsXCJzcWNhcFwiOlwiXFx1MjI5M1wiLFwic3FjYXBzXCI6XCJcXHUyMjkzXFx1RkUwMFwiLFwic3FjdXBcIjpcIlxcdTIyOTRcIixcInNxY3Vwc1wiOlwiXFx1MjI5NFxcdUZFMDBcIixcIlNxcnRcIjpcIlxcdTIyMUFcIixcInNxc3ViXCI6XCJcXHUyMjhGXCIsXCJzcXN1YmVcIjpcIlxcdTIyOTFcIixcInNxc3Vic2V0XCI6XCJcXHUyMjhGXCIsXCJzcXN1YnNldGVxXCI6XCJcXHUyMjkxXCIsXCJzcXN1cFwiOlwiXFx1MjI5MFwiLFwic3FzdXBlXCI6XCJcXHUyMjkyXCIsXCJzcXN1cHNldFwiOlwiXFx1MjI5MFwiLFwic3FzdXBzZXRlcVwiOlwiXFx1MjI5MlwiLFwic3F1YXJlXCI6XCJcXHUyNUExXCIsXCJTcXVhcmVcIjpcIlxcdTI1QTFcIixcIlNxdWFyZUludGVyc2VjdGlvblwiOlwiXFx1MjI5M1wiLFwiU3F1YXJlU3Vic2V0XCI6XCJcXHUyMjhGXCIsXCJTcXVhcmVTdWJzZXRFcXVhbFwiOlwiXFx1MjI5MVwiLFwiU3F1YXJlU3VwZXJzZXRcIjpcIlxcdTIyOTBcIixcIlNxdWFyZVN1cGVyc2V0RXF1YWxcIjpcIlxcdTIyOTJcIixcIlNxdWFyZVVuaW9uXCI6XCJcXHUyMjk0XCIsXCJzcXVhcmZcIjpcIlxcdTI1QUFcIixcInNxdVwiOlwiXFx1MjVBMVwiLFwic3F1ZlwiOlwiXFx1MjVBQVwiLFwic3JhcnJcIjpcIlxcdTIxOTJcIixcIlNzY3JcIjpcIlxcdUQ4MzVcXHVEQ0FFXCIsXCJzc2NyXCI6XCJcXHVEODM1XFx1RENDOFwiLFwic3NldG1uXCI6XCJcXHUyMjE2XCIsXCJzc21pbGVcIjpcIlxcdTIzMjNcIixcInNzdGFyZlwiOlwiXFx1MjJDNlwiLFwiU3RhclwiOlwiXFx1MjJDNlwiLFwic3RhclwiOlwiXFx1MjYwNlwiLFwic3RhcmZcIjpcIlxcdTI2MDVcIixcInN0cmFpZ2h0ZXBzaWxvblwiOlwiXFx1MDNGNVwiLFwic3RyYWlnaHRwaGlcIjpcIlxcdTAzRDVcIixcInN0cm5zXCI6XCJcXHUwMEFGXCIsXCJzdWJcIjpcIlxcdTIyODJcIixcIlN1YlwiOlwiXFx1MjJEMFwiLFwic3ViZG90XCI6XCJcXHUyQUJEXCIsXCJzdWJFXCI6XCJcXHUyQUM1XCIsXCJzdWJlXCI6XCJcXHUyMjg2XCIsXCJzdWJlZG90XCI6XCJcXHUyQUMzXCIsXCJzdWJtdWx0XCI6XCJcXHUyQUMxXCIsXCJzdWJuRVwiOlwiXFx1MkFDQlwiLFwic3VibmVcIjpcIlxcdTIyOEFcIixcInN1YnBsdXNcIjpcIlxcdTJBQkZcIixcInN1YnJhcnJcIjpcIlxcdTI5NzlcIixcInN1YnNldFwiOlwiXFx1MjI4MlwiLFwiU3Vic2V0XCI6XCJcXHUyMkQwXCIsXCJzdWJzZXRlcVwiOlwiXFx1MjI4NlwiLFwic3Vic2V0ZXFxXCI6XCJcXHUyQUM1XCIsXCJTdWJzZXRFcXVhbFwiOlwiXFx1MjI4NlwiLFwic3Vic2V0bmVxXCI6XCJcXHUyMjhBXCIsXCJzdWJzZXRuZXFxXCI6XCJcXHUyQUNCXCIsXCJzdWJzaW1cIjpcIlxcdTJBQzdcIixcInN1YnN1YlwiOlwiXFx1MkFENVwiLFwic3Vic3VwXCI6XCJcXHUyQUQzXCIsXCJzdWNjYXBwcm94XCI6XCJcXHUyQUI4XCIsXCJzdWNjXCI6XCJcXHUyMjdCXCIsXCJzdWNjY3VybHllcVwiOlwiXFx1MjI3RFwiLFwiU3VjY2VlZHNcIjpcIlxcdTIyN0JcIixcIlN1Y2NlZWRzRXF1YWxcIjpcIlxcdTJBQjBcIixcIlN1Y2NlZWRzU2xhbnRFcXVhbFwiOlwiXFx1MjI3RFwiLFwiU3VjY2VlZHNUaWxkZVwiOlwiXFx1MjI3RlwiLFwic3VjY2VxXCI6XCJcXHUyQUIwXCIsXCJzdWNjbmFwcHJveFwiOlwiXFx1MkFCQVwiLFwic3VjY25lcXFcIjpcIlxcdTJBQjZcIixcInN1Y2Nuc2ltXCI6XCJcXHUyMkU5XCIsXCJzdWNjc2ltXCI6XCJcXHUyMjdGXCIsXCJTdWNoVGhhdFwiOlwiXFx1MjIwQlwiLFwic3VtXCI6XCJcXHUyMjExXCIsXCJTdW1cIjpcIlxcdTIyMTFcIixcInN1bmdcIjpcIlxcdTI2NkFcIixcInN1cDFcIjpcIlxcdTAwQjlcIixcInN1cDJcIjpcIlxcdTAwQjJcIixcInN1cDNcIjpcIlxcdTAwQjNcIixcInN1cFwiOlwiXFx1MjI4M1wiLFwiU3VwXCI6XCJcXHUyMkQxXCIsXCJzdXBkb3RcIjpcIlxcdTJBQkVcIixcInN1cGRzdWJcIjpcIlxcdTJBRDhcIixcInN1cEVcIjpcIlxcdTJBQzZcIixcInN1cGVcIjpcIlxcdTIyODdcIixcInN1cGVkb3RcIjpcIlxcdTJBQzRcIixcIlN1cGVyc2V0XCI6XCJcXHUyMjgzXCIsXCJTdXBlcnNldEVxdWFsXCI6XCJcXHUyMjg3XCIsXCJzdXBoc29sXCI6XCJcXHUyN0M5XCIsXCJzdXBoc3ViXCI6XCJcXHUyQUQ3XCIsXCJzdXBsYXJyXCI6XCJcXHUyOTdCXCIsXCJzdXBtdWx0XCI6XCJcXHUyQUMyXCIsXCJzdXBuRVwiOlwiXFx1MkFDQ1wiLFwic3VwbmVcIjpcIlxcdTIyOEJcIixcInN1cHBsdXNcIjpcIlxcdTJBQzBcIixcInN1cHNldFwiOlwiXFx1MjI4M1wiLFwiU3Vwc2V0XCI6XCJcXHUyMkQxXCIsXCJzdXBzZXRlcVwiOlwiXFx1MjI4N1wiLFwic3Vwc2V0ZXFxXCI6XCJcXHUyQUM2XCIsXCJzdXBzZXRuZXFcIjpcIlxcdTIyOEJcIixcInN1cHNldG5lcXFcIjpcIlxcdTJBQ0NcIixcInN1cHNpbVwiOlwiXFx1MkFDOFwiLFwic3Vwc3ViXCI6XCJcXHUyQUQ0XCIsXCJzdXBzdXBcIjpcIlxcdTJBRDZcIixcInN3YXJoa1wiOlwiXFx1MjkyNlwiLFwic3dhcnJcIjpcIlxcdTIxOTlcIixcInN3QXJyXCI6XCJcXHUyMUQ5XCIsXCJzd2Fycm93XCI6XCJcXHUyMTk5XCIsXCJzd253YXJcIjpcIlxcdTI5MkFcIixcInN6bGlnXCI6XCJcXHUwMERGXCIsXCJUYWJcIjpcIlxcdFwiLFwidGFyZ2V0XCI6XCJcXHUyMzE2XCIsXCJUYXVcIjpcIlxcdTAzQTRcIixcInRhdVwiOlwiXFx1MDNDNFwiLFwidGJya1wiOlwiXFx1MjNCNFwiLFwiVGNhcm9uXCI6XCJcXHUwMTY0XCIsXCJ0Y2Fyb25cIjpcIlxcdTAxNjVcIixcIlRjZWRpbFwiOlwiXFx1MDE2MlwiLFwidGNlZGlsXCI6XCJcXHUwMTYzXCIsXCJUY3lcIjpcIlxcdTA0MjJcIixcInRjeVwiOlwiXFx1MDQ0MlwiLFwidGRvdFwiOlwiXFx1MjBEQlwiLFwidGVscmVjXCI6XCJcXHUyMzE1XCIsXCJUZnJcIjpcIlxcdUQ4MzVcXHVERDE3XCIsXCJ0ZnJcIjpcIlxcdUQ4MzVcXHVERDMxXCIsXCJ0aGVyZTRcIjpcIlxcdTIyMzRcIixcInRoZXJlZm9yZVwiOlwiXFx1MjIzNFwiLFwiVGhlcmVmb3JlXCI6XCJcXHUyMjM0XCIsXCJUaGV0YVwiOlwiXFx1MDM5OFwiLFwidGhldGFcIjpcIlxcdTAzQjhcIixcInRoZXRhc3ltXCI6XCJcXHUwM0QxXCIsXCJ0aGV0YXZcIjpcIlxcdTAzRDFcIixcInRoaWNrYXBwcm94XCI6XCJcXHUyMjQ4XCIsXCJ0aGlja3NpbVwiOlwiXFx1MjIzQ1wiLFwiVGhpY2tTcGFjZVwiOlwiXFx1MjA1RlxcdTIwMEFcIixcIlRoaW5TcGFjZVwiOlwiXFx1MjAwOVwiLFwidGhpbnNwXCI6XCJcXHUyMDA5XCIsXCJ0aGthcFwiOlwiXFx1MjI0OFwiLFwidGhrc2ltXCI6XCJcXHUyMjNDXCIsXCJUSE9STlwiOlwiXFx1MDBERVwiLFwidGhvcm5cIjpcIlxcdTAwRkVcIixcInRpbGRlXCI6XCJcXHUwMkRDXCIsXCJUaWxkZVwiOlwiXFx1MjIzQ1wiLFwiVGlsZGVFcXVhbFwiOlwiXFx1MjI0M1wiLFwiVGlsZGVGdWxsRXF1YWxcIjpcIlxcdTIyNDVcIixcIlRpbGRlVGlsZGVcIjpcIlxcdTIyNDhcIixcInRpbWVzYmFyXCI6XCJcXHUyQTMxXCIsXCJ0aW1lc2JcIjpcIlxcdTIyQTBcIixcInRpbWVzXCI6XCJcXHUwMEQ3XCIsXCJ0aW1lc2RcIjpcIlxcdTJBMzBcIixcInRpbnRcIjpcIlxcdTIyMkRcIixcInRvZWFcIjpcIlxcdTI5MjhcIixcInRvcGJvdFwiOlwiXFx1MjMzNlwiLFwidG9wY2lyXCI6XCJcXHUyQUYxXCIsXCJ0b3BcIjpcIlxcdTIyQTRcIixcIlRvcGZcIjpcIlxcdUQ4MzVcXHVERDRCXCIsXCJ0b3BmXCI6XCJcXHVEODM1XFx1REQ2NVwiLFwidG9wZm9ya1wiOlwiXFx1MkFEQVwiLFwidG9zYVwiOlwiXFx1MjkyOVwiLFwidHByaW1lXCI6XCJcXHUyMDM0XCIsXCJ0cmFkZVwiOlwiXFx1MjEyMlwiLFwiVFJBREVcIjpcIlxcdTIxMjJcIixcInRyaWFuZ2xlXCI6XCJcXHUyNUI1XCIsXCJ0cmlhbmdsZWRvd25cIjpcIlxcdTI1QkZcIixcInRyaWFuZ2xlbGVmdFwiOlwiXFx1MjVDM1wiLFwidHJpYW5nbGVsZWZ0ZXFcIjpcIlxcdTIyQjRcIixcInRyaWFuZ2xlcVwiOlwiXFx1MjI1Q1wiLFwidHJpYW5nbGVyaWdodFwiOlwiXFx1MjVCOVwiLFwidHJpYW5nbGVyaWdodGVxXCI6XCJcXHUyMkI1XCIsXCJ0cmlkb3RcIjpcIlxcdTI1RUNcIixcInRyaWVcIjpcIlxcdTIyNUNcIixcInRyaW1pbnVzXCI6XCJcXHUyQTNBXCIsXCJUcmlwbGVEb3RcIjpcIlxcdTIwREJcIixcInRyaXBsdXNcIjpcIlxcdTJBMzlcIixcInRyaXNiXCI6XCJcXHUyOUNEXCIsXCJ0cml0aW1lXCI6XCJcXHUyQTNCXCIsXCJ0cnBleml1bVwiOlwiXFx1MjNFMlwiLFwiVHNjclwiOlwiXFx1RDgzNVxcdURDQUZcIixcInRzY3JcIjpcIlxcdUQ4MzVcXHVEQ0M5XCIsXCJUU2N5XCI6XCJcXHUwNDI2XCIsXCJ0c2N5XCI6XCJcXHUwNDQ2XCIsXCJUU0hjeVwiOlwiXFx1MDQwQlwiLFwidHNoY3lcIjpcIlxcdTA0NUJcIixcIlRzdHJva1wiOlwiXFx1MDE2NlwiLFwidHN0cm9rXCI6XCJcXHUwMTY3XCIsXCJ0d2l4dFwiOlwiXFx1MjI2Q1wiLFwidHdvaGVhZGxlZnRhcnJvd1wiOlwiXFx1MjE5RVwiLFwidHdvaGVhZHJpZ2h0YXJyb3dcIjpcIlxcdTIxQTBcIixcIlVhY3V0ZVwiOlwiXFx1MDBEQVwiLFwidWFjdXRlXCI6XCJcXHUwMEZBXCIsXCJ1YXJyXCI6XCJcXHUyMTkxXCIsXCJVYXJyXCI6XCJcXHUyMTlGXCIsXCJ1QXJyXCI6XCJcXHUyMUQxXCIsXCJVYXJyb2NpclwiOlwiXFx1Mjk0OVwiLFwiVWJyY3lcIjpcIlxcdTA0MEVcIixcInVicmN5XCI6XCJcXHUwNDVFXCIsXCJVYnJldmVcIjpcIlxcdTAxNkNcIixcInVicmV2ZVwiOlwiXFx1MDE2RFwiLFwiVWNpcmNcIjpcIlxcdTAwREJcIixcInVjaXJjXCI6XCJcXHUwMEZCXCIsXCJVY3lcIjpcIlxcdTA0MjNcIixcInVjeVwiOlwiXFx1MDQ0M1wiLFwidWRhcnJcIjpcIlxcdTIxQzVcIixcIlVkYmxhY1wiOlwiXFx1MDE3MFwiLFwidWRibGFjXCI6XCJcXHUwMTcxXCIsXCJ1ZGhhclwiOlwiXFx1Mjk2RVwiLFwidWZpc2h0XCI6XCJcXHUyOTdFXCIsXCJVZnJcIjpcIlxcdUQ4MzVcXHVERDE4XCIsXCJ1ZnJcIjpcIlxcdUQ4MzVcXHVERDMyXCIsXCJVZ3JhdmVcIjpcIlxcdTAwRDlcIixcInVncmF2ZVwiOlwiXFx1MDBGOVwiLFwidUhhclwiOlwiXFx1Mjk2M1wiLFwidWhhcmxcIjpcIlxcdTIxQkZcIixcInVoYXJyXCI6XCJcXHUyMUJFXCIsXCJ1aGJsa1wiOlwiXFx1MjU4MFwiLFwidWxjb3JuXCI6XCJcXHUyMzFDXCIsXCJ1bGNvcm5lclwiOlwiXFx1MjMxQ1wiLFwidWxjcm9wXCI6XCJcXHUyMzBGXCIsXCJ1bHRyaVwiOlwiXFx1MjVGOFwiLFwiVW1hY3JcIjpcIlxcdTAxNkFcIixcInVtYWNyXCI6XCJcXHUwMTZCXCIsXCJ1bWxcIjpcIlxcdTAwQThcIixcIlVuZGVyQmFyXCI6XCJfXCIsXCJVbmRlckJyYWNlXCI6XCJcXHUyM0RGXCIsXCJVbmRlckJyYWNrZXRcIjpcIlxcdTIzQjVcIixcIlVuZGVyUGFyZW50aGVzaXNcIjpcIlxcdTIzRERcIixcIlVuaW9uXCI6XCJcXHUyMkMzXCIsXCJVbmlvblBsdXNcIjpcIlxcdTIyOEVcIixcIlVvZ29uXCI6XCJcXHUwMTcyXCIsXCJ1b2dvblwiOlwiXFx1MDE3M1wiLFwiVW9wZlwiOlwiXFx1RDgzNVxcdURENENcIixcInVvcGZcIjpcIlxcdUQ4MzVcXHVERDY2XCIsXCJVcEFycm93QmFyXCI6XCJcXHUyOTEyXCIsXCJ1cGFycm93XCI6XCJcXHUyMTkxXCIsXCJVcEFycm93XCI6XCJcXHUyMTkxXCIsXCJVcGFycm93XCI6XCJcXHUyMUQxXCIsXCJVcEFycm93RG93bkFycm93XCI6XCJcXHUyMUM1XCIsXCJ1cGRvd25hcnJvd1wiOlwiXFx1MjE5NVwiLFwiVXBEb3duQXJyb3dcIjpcIlxcdTIxOTVcIixcIlVwZG93bmFycm93XCI6XCJcXHUyMUQ1XCIsXCJVcEVxdWlsaWJyaXVtXCI6XCJcXHUyOTZFXCIsXCJ1cGhhcnBvb25sZWZ0XCI6XCJcXHUyMUJGXCIsXCJ1cGhhcnBvb25yaWdodFwiOlwiXFx1MjFCRVwiLFwidXBsdXNcIjpcIlxcdTIyOEVcIixcIlVwcGVyTGVmdEFycm93XCI6XCJcXHUyMTk2XCIsXCJVcHBlclJpZ2h0QXJyb3dcIjpcIlxcdTIxOTdcIixcInVwc2lcIjpcIlxcdTAzQzVcIixcIlVwc2lcIjpcIlxcdTAzRDJcIixcInVwc2loXCI6XCJcXHUwM0QyXCIsXCJVcHNpbG9uXCI6XCJcXHUwM0E1XCIsXCJ1cHNpbG9uXCI6XCJcXHUwM0M1XCIsXCJVcFRlZUFycm93XCI6XCJcXHUyMUE1XCIsXCJVcFRlZVwiOlwiXFx1MjJBNVwiLFwidXB1cGFycm93c1wiOlwiXFx1MjFDOFwiLFwidXJjb3JuXCI6XCJcXHUyMzFEXCIsXCJ1cmNvcm5lclwiOlwiXFx1MjMxRFwiLFwidXJjcm9wXCI6XCJcXHUyMzBFXCIsXCJVcmluZ1wiOlwiXFx1MDE2RVwiLFwidXJpbmdcIjpcIlxcdTAxNkZcIixcInVydHJpXCI6XCJcXHUyNUY5XCIsXCJVc2NyXCI6XCJcXHVEODM1XFx1RENCMFwiLFwidXNjclwiOlwiXFx1RDgzNVxcdURDQ0FcIixcInV0ZG90XCI6XCJcXHUyMkYwXCIsXCJVdGlsZGVcIjpcIlxcdTAxNjhcIixcInV0aWxkZVwiOlwiXFx1MDE2OVwiLFwidXRyaVwiOlwiXFx1MjVCNVwiLFwidXRyaWZcIjpcIlxcdTI1QjRcIixcInV1YXJyXCI6XCJcXHUyMUM4XCIsXCJVdW1sXCI6XCJcXHUwMERDXCIsXCJ1dW1sXCI6XCJcXHUwMEZDXCIsXCJ1d2FuZ2xlXCI6XCJcXHUyOUE3XCIsXCJ2YW5ncnRcIjpcIlxcdTI5OUNcIixcInZhcmVwc2lsb25cIjpcIlxcdTAzRjVcIixcInZhcmthcHBhXCI6XCJcXHUwM0YwXCIsXCJ2YXJub3RoaW5nXCI6XCJcXHUyMjA1XCIsXCJ2YXJwaGlcIjpcIlxcdTAzRDVcIixcInZhcnBpXCI6XCJcXHUwM0Q2XCIsXCJ2YXJwcm9wdG9cIjpcIlxcdTIyMURcIixcInZhcnJcIjpcIlxcdTIxOTVcIixcInZBcnJcIjpcIlxcdTIxRDVcIixcInZhcnJob1wiOlwiXFx1MDNGMVwiLFwidmFyc2lnbWFcIjpcIlxcdTAzQzJcIixcInZhcnN1YnNldG5lcVwiOlwiXFx1MjI4QVxcdUZFMDBcIixcInZhcnN1YnNldG5lcXFcIjpcIlxcdTJBQ0JcXHVGRTAwXCIsXCJ2YXJzdXBzZXRuZXFcIjpcIlxcdTIyOEJcXHVGRTAwXCIsXCJ2YXJzdXBzZXRuZXFxXCI6XCJcXHUyQUNDXFx1RkUwMFwiLFwidmFydGhldGFcIjpcIlxcdTAzRDFcIixcInZhcnRyaWFuZ2xlbGVmdFwiOlwiXFx1MjJCMlwiLFwidmFydHJpYW5nbGVyaWdodFwiOlwiXFx1MjJCM1wiLFwidkJhclwiOlwiXFx1MkFFOFwiLFwiVmJhclwiOlwiXFx1MkFFQlwiLFwidkJhcnZcIjpcIlxcdTJBRTlcIixcIlZjeVwiOlwiXFx1MDQxMlwiLFwidmN5XCI6XCJcXHUwNDMyXCIsXCJ2ZGFzaFwiOlwiXFx1MjJBMlwiLFwidkRhc2hcIjpcIlxcdTIyQThcIixcIlZkYXNoXCI6XCJcXHUyMkE5XCIsXCJWRGFzaFwiOlwiXFx1MjJBQlwiLFwiVmRhc2hsXCI6XCJcXHUyQUU2XCIsXCJ2ZWViYXJcIjpcIlxcdTIyQkJcIixcInZlZVwiOlwiXFx1MjIyOFwiLFwiVmVlXCI6XCJcXHUyMkMxXCIsXCJ2ZWVlcVwiOlwiXFx1MjI1QVwiLFwidmVsbGlwXCI6XCJcXHUyMkVFXCIsXCJ2ZXJiYXJcIjpcInxcIixcIlZlcmJhclwiOlwiXFx1MjAxNlwiLFwidmVydFwiOlwifFwiLFwiVmVydFwiOlwiXFx1MjAxNlwiLFwiVmVydGljYWxCYXJcIjpcIlxcdTIyMjNcIixcIlZlcnRpY2FsTGluZVwiOlwifFwiLFwiVmVydGljYWxTZXBhcmF0b3JcIjpcIlxcdTI3NThcIixcIlZlcnRpY2FsVGlsZGVcIjpcIlxcdTIyNDBcIixcIlZlcnlUaGluU3BhY2VcIjpcIlxcdTIwMEFcIixcIlZmclwiOlwiXFx1RDgzNVxcdUREMTlcIixcInZmclwiOlwiXFx1RDgzNVxcdUREMzNcIixcInZsdHJpXCI6XCJcXHUyMkIyXCIsXCJ2bnN1YlwiOlwiXFx1MjI4MlxcdTIwRDJcIixcInZuc3VwXCI6XCJcXHUyMjgzXFx1MjBEMlwiLFwiVm9wZlwiOlwiXFx1RDgzNVxcdURENERcIixcInZvcGZcIjpcIlxcdUQ4MzVcXHVERDY3XCIsXCJ2cHJvcFwiOlwiXFx1MjIxRFwiLFwidnJ0cmlcIjpcIlxcdTIyQjNcIixcIlZzY3JcIjpcIlxcdUQ4MzVcXHVEQ0IxXCIsXCJ2c2NyXCI6XCJcXHVEODM1XFx1RENDQlwiLFwidnN1Ym5FXCI6XCJcXHUyQUNCXFx1RkUwMFwiLFwidnN1Ym5lXCI6XCJcXHUyMjhBXFx1RkUwMFwiLFwidnN1cG5FXCI6XCJcXHUyQUNDXFx1RkUwMFwiLFwidnN1cG5lXCI6XCJcXHUyMjhCXFx1RkUwMFwiLFwiVnZkYXNoXCI6XCJcXHUyMkFBXCIsXCJ2emlnemFnXCI6XCJcXHUyOTlBXCIsXCJXY2lyY1wiOlwiXFx1MDE3NFwiLFwid2NpcmNcIjpcIlxcdTAxNzVcIixcIndlZGJhclwiOlwiXFx1MkE1RlwiLFwid2VkZ2VcIjpcIlxcdTIyMjdcIixcIldlZGdlXCI6XCJcXHUyMkMwXCIsXCJ3ZWRnZXFcIjpcIlxcdTIyNTlcIixcIndlaWVycFwiOlwiXFx1MjExOFwiLFwiV2ZyXCI6XCJcXHVEODM1XFx1REQxQVwiLFwid2ZyXCI6XCJcXHVEODM1XFx1REQzNFwiLFwiV29wZlwiOlwiXFx1RDgzNVxcdURENEVcIixcIndvcGZcIjpcIlxcdUQ4MzVcXHVERDY4XCIsXCJ3cFwiOlwiXFx1MjExOFwiLFwid3JcIjpcIlxcdTIyNDBcIixcIndyZWF0aFwiOlwiXFx1MjI0MFwiLFwiV3NjclwiOlwiXFx1RDgzNVxcdURDQjJcIixcIndzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NDXCIsXCJ4Y2FwXCI6XCJcXHUyMkMyXCIsXCJ4Y2lyY1wiOlwiXFx1MjVFRlwiLFwieGN1cFwiOlwiXFx1MjJDM1wiLFwieGR0cmlcIjpcIlxcdTI1QkRcIixcIlhmclwiOlwiXFx1RDgzNVxcdUREMUJcIixcInhmclwiOlwiXFx1RDgzNVxcdUREMzVcIixcInhoYXJyXCI6XCJcXHUyN0Y3XCIsXCJ4aEFyclwiOlwiXFx1MjdGQVwiLFwiWGlcIjpcIlxcdTAzOUVcIixcInhpXCI6XCJcXHUwM0JFXCIsXCJ4bGFyclwiOlwiXFx1MjdGNVwiLFwieGxBcnJcIjpcIlxcdTI3RjhcIixcInhtYXBcIjpcIlxcdTI3RkNcIixcInhuaXNcIjpcIlxcdTIyRkJcIixcInhvZG90XCI6XCJcXHUyQTAwXCIsXCJYb3BmXCI6XCJcXHVEODM1XFx1REQ0RlwiLFwieG9wZlwiOlwiXFx1RDgzNVxcdURENjlcIixcInhvcGx1c1wiOlwiXFx1MkEwMVwiLFwieG90aW1lXCI6XCJcXHUyQTAyXCIsXCJ4cmFyclwiOlwiXFx1MjdGNlwiLFwieHJBcnJcIjpcIlxcdTI3RjlcIixcIlhzY3JcIjpcIlxcdUQ4MzVcXHVEQ0IzXCIsXCJ4c2NyXCI6XCJcXHVEODM1XFx1RENDRFwiLFwieHNxY3VwXCI6XCJcXHUyQTA2XCIsXCJ4dXBsdXNcIjpcIlxcdTJBMDRcIixcInh1dHJpXCI6XCJcXHUyNUIzXCIsXCJ4dmVlXCI6XCJcXHUyMkMxXCIsXCJ4d2VkZ2VcIjpcIlxcdTIyQzBcIixcIllhY3V0ZVwiOlwiXFx1MDBERFwiLFwieWFjdXRlXCI6XCJcXHUwMEZEXCIsXCJZQWN5XCI6XCJcXHUwNDJGXCIsXCJ5YWN5XCI6XCJcXHUwNDRGXCIsXCJZY2lyY1wiOlwiXFx1MDE3NlwiLFwieWNpcmNcIjpcIlxcdTAxNzdcIixcIlljeVwiOlwiXFx1MDQyQlwiLFwieWN5XCI6XCJcXHUwNDRCXCIsXCJ5ZW5cIjpcIlxcdTAwQTVcIixcIllmclwiOlwiXFx1RDgzNVxcdUREMUNcIixcInlmclwiOlwiXFx1RDgzNVxcdUREMzZcIixcIllJY3lcIjpcIlxcdTA0MDdcIixcInlpY3lcIjpcIlxcdTA0NTdcIixcIllvcGZcIjpcIlxcdUQ4MzVcXHVERDUwXCIsXCJ5b3BmXCI6XCJcXHVEODM1XFx1REQ2QVwiLFwiWXNjclwiOlwiXFx1RDgzNVxcdURDQjRcIixcInlzY3JcIjpcIlxcdUQ4MzVcXHVEQ0NFXCIsXCJZVWN5XCI6XCJcXHUwNDJFXCIsXCJ5dWN5XCI6XCJcXHUwNDRFXCIsXCJ5dW1sXCI6XCJcXHUwMEZGXCIsXCJZdW1sXCI6XCJcXHUwMTc4XCIsXCJaYWN1dGVcIjpcIlxcdTAxNzlcIixcInphY3V0ZVwiOlwiXFx1MDE3QVwiLFwiWmNhcm9uXCI6XCJcXHUwMTdEXCIsXCJ6Y2Fyb25cIjpcIlxcdTAxN0VcIixcIlpjeVwiOlwiXFx1MDQxN1wiLFwiemN5XCI6XCJcXHUwNDM3XCIsXCJaZG90XCI6XCJcXHUwMTdCXCIsXCJ6ZG90XCI6XCJcXHUwMTdDXCIsXCJ6ZWV0cmZcIjpcIlxcdTIxMjhcIixcIlplcm9XaWR0aFNwYWNlXCI6XCJcXHUyMDBCXCIsXCJaZXRhXCI6XCJcXHUwMzk2XCIsXCJ6ZXRhXCI6XCJcXHUwM0I2XCIsXCJ6ZnJcIjpcIlxcdUQ4MzVcXHVERDM3XCIsXCJaZnJcIjpcIlxcdTIxMjhcIixcIlpIY3lcIjpcIlxcdTA0MTZcIixcInpoY3lcIjpcIlxcdTA0MzZcIixcInppZ3JhcnJcIjpcIlxcdTIxRERcIixcInpvcGZcIjpcIlxcdUQ4MzVcXHVERDZCXCIsXCJab3BmXCI6XCJcXHUyMTI0XCIsXCJac2NyXCI6XCJcXHVEODM1XFx1RENCNVwiLFwienNjclwiOlwiXFx1RDgzNVxcdURDQ0ZcIixcInp3alwiOlwiXFx1MjAwRFwiLFwiendualwiOlwiXFx1MjAwQ1wifSIsIid1c2Ugc3RyaWN0JztcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gSGVscGVyc1xuXG4vLyBNZXJnZSBvYmplY3RzXG4vL1xuZnVuY3Rpb24gYXNzaWduKG9iaiAvKmZyb20xLCBmcm9tMiwgZnJvbTMsIC4uLiovKSB7XG4gIHZhciBzb3VyY2VzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBzb3VyY2VzLmZvckVhY2goZnVuY3Rpb24gKHNvdXJjZSkge1xuICAgIGlmICghc291cmNlKSB7IHJldHVybjsgfVxuXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIF9jbGFzcyhvYmopIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopOyB9XG5mdW5jdGlvbiBpc1N0cmluZyhvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBTdHJpbmddJzsgfVxuZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7IHJldHVybiBfY2xhc3Mob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7IH1cbmZ1bmN0aW9uIGlzUmVnRXhwKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IFJlZ0V4cF0nOyB9XG5mdW5jdGlvbiBpc0Z1bmN0aW9uKG9iaikgeyByZXR1cm4gX2NsYXNzKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7IH1cblxuXG5mdW5jdGlvbiBlc2NhcGVSRShzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKC9bLj8qK14kW1xcXVxcXFwoKXt9fC1dL2csICdcXFxcJCYnKTsgfVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgZnV6enlMaW5rOiB0cnVlLFxuICBmdXp6eUVtYWlsOiB0cnVlLFxuICBmdXp6eUlQOiBmYWxzZVxufTtcblxuXG5mdW5jdGlvbiBpc09wdGlvbnNPYmoob2JqKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmogfHwge30pLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBrKSB7XG4gICAgcmV0dXJuIGFjYyB8fCBkZWZhdWx0T3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrKTtcbiAgfSwgZmFsc2UpO1xufVxuXG5cbnZhciBkZWZhdWx0U2NoZW1hcyA9IHtcbiAgJ2h0dHA6Jzoge1xuICAgIHZhbGlkYXRlOiBmdW5jdGlvbiAodGV4dCwgcG9zLCBzZWxmKSB7XG4gICAgICB2YXIgdGFpbCA9IHRleHQuc2xpY2UocG9zKTtcblxuICAgICAgaWYgKCFzZWxmLnJlLmh0dHApIHtcbiAgICAgICAgLy8gY29tcGlsZSBsYXppbHksIGJlY2F1c2UgXCJob3N0XCItY29udGFpbmluZyB2YXJpYWJsZXMgY2FuIGNoYW5nZSBvbiB0bGRzIHVwZGF0ZS5cbiAgICAgICAgc2VsZi5yZS5odHRwID0gIG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ15cXFxcL1xcXFwvJyArIHNlbGYucmUuc3JjX2F1dGggKyBzZWxmLnJlLnNyY19ob3N0X3BvcnRfc3RyaWN0ICsgc2VsZi5yZS5zcmNfcGF0aCwgJ2knXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZi5yZS5odHRwLnRlc3QodGFpbCkpIHtcbiAgICAgICAgcmV0dXJuIHRhaWwubWF0Y2goc2VsZi5yZS5odHRwKVswXS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH0sXG4gICdodHRwczonOiAgJ2h0dHA6JyxcbiAgJ2Z0cDonOiAgICAnaHR0cDonLFxuICAnLy8nOiAgICAgIHtcbiAgICB2YWxpZGF0ZTogZnVuY3Rpb24gKHRleHQsIHBvcywgc2VsZikge1xuICAgICAgdmFyIHRhaWwgPSB0ZXh0LnNsaWNlKHBvcyk7XG5cbiAgICAgIGlmICghc2VsZi5yZS5ub19odHRwKSB7XG4gICAgICAvLyBjb21waWxlIGxhemlseSwgYmVjYXVzZSBcImhvc3RcIi1jb250YWluaW5nIHZhcmlhYmxlcyBjYW4gY2hhbmdlIG9uIHRsZHMgdXBkYXRlLlxuICAgICAgICBzZWxmLnJlLm5vX2h0dHAgPSAgbmV3IFJlZ0V4cChcbiAgICAgICAgICAnXicgK1xuICAgICAgICAgIHNlbGYucmUuc3JjX2F1dGggK1xuICAgICAgICAgIC8vIERvbid0IGFsbG93IHNpbmdsZS1sZXZlbCBkb21haW5zLCBiZWNhdXNlIG9mIGZhbHNlIHBvc2l0aXZlcyBsaWtlICcvL3Rlc3QnXG4gICAgICAgICAgLy8gd2l0aCBjb2RlIGNvbW1lbnRzXG4gICAgICAgICAgJyg/OmxvY2FsaG9zdHwoPzooPzonICsgc2VsZi5yZS5zcmNfZG9tYWluICsgJylcXFxcLikrJyArIHNlbGYucmUuc3JjX2RvbWFpbl9yb290ICsgJyknICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19wb3J0ICtcbiAgICAgICAgICBzZWxmLnJlLnNyY19ob3N0X3Rlcm1pbmF0b3IgK1xuICAgICAgICAgIHNlbGYucmUuc3JjX3BhdGgsXG5cbiAgICAgICAgICAnaSdcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHNlbGYucmUubm9faHR0cC50ZXN0KHRhaWwpKSB7XG4gICAgICAgIC8vIHNob3VsZCBub3QgYmUgYDovL2AgJiBgLy8vYCwgdGhhdCBwcm90ZWN0cyBmcm9tIGVycm9ycyBpbiBwcm90b2NvbCBuYW1lXG4gICAgICAgIGlmIChwb3MgPj0gMyAmJiB0ZXh0W3BvcyAtIDNdID09PSAnOicpIHsgcmV0dXJuIDA7IH1cbiAgICAgICAgaWYgKHBvcyA+PSAzICYmIHRleHRbcG9zIC0gM10gPT09ICcvJykgeyByZXR1cm4gMDsgfVxuICAgICAgICByZXR1cm4gdGFpbC5tYXRjaChzZWxmLnJlLm5vX2h0dHApWzBdLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgfSxcbiAgJ21haWx0bzonOiB7XG4gICAgdmFsaWRhdGU6IGZ1bmN0aW9uICh0ZXh0LCBwb3MsIHNlbGYpIHtcbiAgICAgIHZhciB0YWlsID0gdGV4dC5zbGljZShwb3MpO1xuXG4gICAgICBpZiAoIXNlbGYucmUubWFpbHRvKSB7XG4gICAgICAgIHNlbGYucmUubWFpbHRvID0gIG5ldyBSZWdFeHAoXG4gICAgICAgICAgJ14nICsgc2VsZi5yZS5zcmNfZW1haWxfbmFtZSArICdAJyArIHNlbGYucmUuc3JjX2hvc3Rfc3RyaWN0LCAnaSdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLnJlLm1haWx0by50ZXN0KHRhaWwpKSB7XG4gICAgICAgIHJldHVybiB0YWlsLm1hdGNoKHNlbGYucmUubWFpbHRvKVswXS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG4gIH1cbn07XG5cbi8qZXNsaW50LWRpc2FibGUgbWF4LWxlbiovXG5cbi8vIFJFIHBhdHRlcm4gZm9yIDItY2hhcmFjdGVyIHRsZHMgKGF1dG9nZW5lcmF0ZWQgYnkgLi9zdXBwb3J0L3RsZHNfMmNoYXJfZ2VuLmpzKVxudmFyIHRsZHNfMmNoX3NyY19yZSA9ICdhW2NkZWZnaWxtbm9xcnN0dXd4el18YlthYmRlZmdoaWptbm9yc3R2d3l6XXxjW2FjZGZnaGlrbG1ub3J1dnd4eXpdfGRbZWprbW96XXxlW2NlZ3JzdHVdfGZbaWprbW9yXXxnW2FiZGVmZ2hpbG1ucHFyc3R1d3ldfGhba21ucnR1XXxpW2RlbG1ub3Fyc3RdfGpbZW1vcF18a1tlZ2hpbW5wcnd5el18bFthYmNpa3JzdHV2eV18bVthY2RlZ2hrbG1ub3BxcnN0dXZ3eHl6XXxuW2FjZWZnaWxvcHJ1el18b218cFthZWZnaGtsbW5yc3R3eV18cWF8cltlb3N1d118c1thYmNkZWdoaWprbG1ub3J0dXZ4eXpdfHRbY2RmZ2hqa2xtbm9ydHZ3el18dVthZ2tzeXpdfHZbYWNlZ2ludV18d1tmc118eVtldF18elthbXddJztcblxuLy8gRE9OJ1QgdHJ5IHRvIG1ha2UgUFJzIHdpdGggY2hhbmdlcy4gRXh0ZW5kIFRMRHMgd2l0aCBMaW5raWZ5SXQudGxkcygpIGluc3RlYWRcbnZhciB0bGRzX2RlZmF1bHQgPSAnYml6fGNvbXxlZHV8Z292fG5ldHxvcmd8cHJvfHdlYnx4eHh8YWVyb3xhc2lhfGNvb3B8aW5mb3xtdXNldW18bmFtZXxzaG9wfNGA0YQnLnNwbGl0KCd8Jyk7XG5cbi8qZXNsaW50LWVuYWJsZSBtYXgtbGVuKi9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gcmVzZXRTY2FuQ2FjaGUoc2VsZikge1xuICBzZWxmLl9faW5kZXhfXyA9IC0xO1xuICBzZWxmLl9fdGV4dF9jYWNoZV9fICAgPSAnJztcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmFsaWRhdG9yKHJlKSB7XG4gIHJldHVybiBmdW5jdGlvbiAodGV4dCwgcG9zKSB7XG4gICAgdmFyIHRhaWwgPSB0ZXh0LnNsaWNlKHBvcyk7XG5cbiAgICBpZiAocmUudGVzdCh0YWlsKSkge1xuICAgICAgcmV0dXJuIHRhaWwubWF0Y2gocmUpWzBdLmxlbmd0aDtcbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU5vcm1hbGl6ZXIoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAobWF0Y2gsIHNlbGYpIHtcbiAgICBzZWxmLm5vcm1hbGl6ZShtYXRjaCk7XG4gIH07XG59XG5cbi8vIFNjaGVtYXMgY29tcGlsZXIuIEJ1aWxkIHJlZ2V4cHMuXG4vL1xuZnVuY3Rpb24gY29tcGlsZShzZWxmKSB7XG5cbiAgLy8gTG9hZCAmIGNsb25lIFJFIHBhdHRlcm5zLlxuICB2YXIgcmUgPSBzZWxmLnJlID0gcmVxdWlyZSgnLi9saWIvcmUnKShzZWxmLl9fb3B0c19fKTtcblxuICAvLyBEZWZpbmUgZHluYW1pYyBwYXR0ZXJuc1xuICB2YXIgdGxkcyA9IHNlbGYuX190bGRzX18uc2xpY2UoKTtcblxuICBzZWxmLm9uQ29tcGlsZSgpO1xuXG4gIGlmICghc2VsZi5fX3RsZHNfcmVwbGFjZWRfXykge1xuICAgIHRsZHMucHVzaCh0bGRzXzJjaF9zcmNfcmUpO1xuICB9XG4gIHRsZHMucHVzaChyZS5zcmNfeG4pO1xuXG4gIHJlLnNyY190bGRzID0gdGxkcy5qb2luKCd8Jyk7XG5cbiAgZnVuY3Rpb24gdW50cGwodHBsKSB7IHJldHVybiB0cGwucmVwbGFjZSgnJVRMRFMlJywgcmUuc3JjX3RsZHMpOyB9XG5cbiAgcmUuZW1haWxfZnV6enkgICAgICA9IFJlZ0V4cCh1bnRwbChyZS50cGxfZW1haWxfZnV6enkpLCAnaScpO1xuICByZS5saW5rX2Z1enp5ICAgICAgID0gUmVnRXhwKHVudHBsKHJlLnRwbF9saW5rX2Z1enp5KSwgJ2knKTtcbiAgcmUubGlua19ub19pcF9mdXp6eSA9IFJlZ0V4cCh1bnRwbChyZS50cGxfbGlua19ub19pcF9mdXp6eSksICdpJyk7XG4gIHJlLmhvc3RfZnV6enlfdGVzdCAgPSBSZWdFeHAodW50cGwocmUudHBsX2hvc3RfZnV6enlfdGVzdCksICdpJyk7XG5cbiAgLy9cbiAgLy8gQ29tcGlsZSBlYWNoIHNjaGVtYVxuICAvL1xuXG4gIHZhciBhbGlhc2VzID0gW107XG5cbiAgc2VsZi5fX2NvbXBpbGVkX18gPSB7fTsgLy8gUmVzZXQgY29tcGlsZWQgZGF0YVxuXG4gIGZ1bmN0aW9uIHNjaGVtYUVycm9yKG5hbWUsIHZhbCkge1xuICAgIHRocm93IG5ldyBFcnJvcignKExpbmtpZnlJdCkgSW52YWxpZCBzY2hlbWEgXCInICsgbmFtZSArICdcIjogJyArIHZhbCk7XG4gIH1cblxuICBPYmplY3Qua2V5cyhzZWxmLl9fc2NoZW1hc19fKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIHZhbCA9IHNlbGYuX19zY2hlbWFzX19bbmFtZV07XG5cbiAgICAvLyBza2lwIGRpc2FibGVkIG1ldGhvZHNcbiAgICBpZiAodmFsID09PSBudWxsKSB7IHJldHVybjsgfVxuXG4gICAgdmFyIGNvbXBpbGVkID0geyB2YWxpZGF0ZTogbnVsbCwgbGluazogbnVsbCB9O1xuXG4gICAgc2VsZi5fX2NvbXBpbGVkX19bbmFtZV0gPSBjb21waWxlZDtcblxuICAgIGlmIChpc09iamVjdCh2YWwpKSB7XG4gICAgICBpZiAoaXNSZWdFeHAodmFsLnZhbGlkYXRlKSkge1xuICAgICAgICBjb21waWxlZC52YWxpZGF0ZSA9IGNyZWF0ZVZhbGlkYXRvcih2YWwudmFsaWRhdGUpO1xuICAgICAgfSBlbHNlIGlmIChpc0Z1bmN0aW9uKHZhbC52YWxpZGF0ZSkpIHtcbiAgICAgICAgY29tcGlsZWQudmFsaWRhdGUgPSB2YWwudmFsaWRhdGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlbWFFcnJvcihuYW1lLCB2YWwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNGdW5jdGlvbih2YWwubm9ybWFsaXplKSkge1xuICAgICAgICBjb21waWxlZC5ub3JtYWxpemUgPSB2YWwubm9ybWFsaXplO1xuICAgICAgfSBlbHNlIGlmICghdmFsLm5vcm1hbGl6ZSkge1xuICAgICAgICBjb21waWxlZC5ub3JtYWxpemUgPSBjcmVhdGVOb3JtYWxpemVyKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzY2hlbWFFcnJvcihuYW1lLCB2YWwpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGlzU3RyaW5nKHZhbCkpIHtcbiAgICAgIGFsaWFzZXMucHVzaChuYW1lKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzY2hlbWFFcnJvcihuYW1lLCB2YWwpO1xuICB9KTtcblxuICAvL1xuICAvLyBDb21waWxlIHBvc3Rwb25lZCBhbGlhc2VzXG4gIC8vXG5cbiAgYWxpYXNlcy5mb3JFYWNoKGZ1bmN0aW9uIChhbGlhcykge1xuICAgIGlmICghc2VsZi5fX2NvbXBpbGVkX19bc2VsZi5fX3NjaGVtYXNfX1thbGlhc11dKSB7XG4gICAgICAvLyBTaWxlbnRseSBmYWlsIG9uIG1pc3NlZCBzY2hlbWFzIHRvIGF2b2lkIGVycm9ucyBvbiBkaXNhYmxlLlxuICAgICAgLy8gc2NoZW1hRXJyb3IoYWxpYXMsIHNlbGYuX19zY2hlbWFzX19bYWxpYXNdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLl9fY29tcGlsZWRfX1thbGlhc10udmFsaWRhdGUgPVxuICAgICAgc2VsZi5fX2NvbXBpbGVkX19bc2VsZi5fX3NjaGVtYXNfX1thbGlhc11dLnZhbGlkYXRlO1xuICAgIHNlbGYuX19jb21waWxlZF9fW2FsaWFzXS5ub3JtYWxpemUgPVxuICAgICAgc2VsZi5fX2NvbXBpbGVkX19bc2VsZi5fX3NjaGVtYXNfX1thbGlhc11dLm5vcm1hbGl6ZTtcbiAgfSk7XG5cbiAgLy9cbiAgLy8gRmFrZSByZWNvcmQgZm9yIGd1ZXNzZWQgbGlua3NcbiAgLy9cbiAgc2VsZi5fX2NvbXBpbGVkX19bJyddID0geyB2YWxpZGF0ZTogbnVsbCwgbm9ybWFsaXplOiBjcmVhdGVOb3JtYWxpemVyKCkgfTtcblxuICAvL1xuICAvLyBCdWlsZCBzY2hlbWEgY29uZGl0aW9uXG4gIC8vXG4gIHZhciBzbGlzdCA9IE9iamVjdC5rZXlzKHNlbGYuX19jb21waWxlZF9fKVxuICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpbHRlciBkaXNhYmxlZCAmIGZha2Ugc2NoZW1hc1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5hbWUubGVuZ3RoID4gMCAmJiBzZWxmLl9fY29tcGlsZWRfX1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgIC5tYXAoZXNjYXBlUkUpXG4gICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJ3wnKTtcbiAgLy8gKD8hXykgY2F1c2UgMS41eCBzbG93ZG93blxuICBzZWxmLnJlLnNjaGVtYV90ZXN0ICAgPSBSZWdFeHAoJyhefCg/IV8pKD86Wz48XFx1ZmY1Y118JyArIHJlLnNyY19aUENjICsgJykpKCcgKyBzbGlzdCArICcpJywgJ2knKTtcbiAgc2VsZi5yZS5zY2hlbWFfc2VhcmNoID0gUmVnRXhwKCcoXnwoPyFfKSg/Ols+PFxcdWZmNWNdfCcgKyByZS5zcmNfWlBDYyArICcpKSgnICsgc2xpc3QgKyAnKScsICdpZycpO1xuXG4gIHNlbGYucmUucHJldGVzdCA9IFJlZ0V4cChcbiAgICAnKCcgKyBzZWxmLnJlLnNjaGVtYV90ZXN0LnNvdXJjZSArICcpfCgnICsgc2VsZi5yZS5ob3N0X2Z1enp5X3Rlc3Quc291cmNlICsgJyl8QCcsXG4gICAgJ2knXG4gICk7XG5cbiAgLy9cbiAgLy8gQ2xlYW51cFxuICAvL1xuXG4gIHJlc2V0U2NhbkNhY2hlKHNlbGYpO1xufVxuXG4vKipcbiAqIGNsYXNzIE1hdGNoXG4gKlxuICogTWF0Y2ggcmVzdWx0LiBTaW5nbGUgZWxlbWVudCBvZiBhcnJheSwgcmV0dXJuZWQgYnkgW1tMaW5raWZ5SXQjbWF0Y2hdXVxuICoqL1xuZnVuY3Rpb24gTWF0Y2goc2VsZiwgc2hpZnQpIHtcbiAgdmFyIHN0YXJ0ID0gc2VsZi5fX2luZGV4X18sXG4gICAgICBlbmQgICA9IHNlbGYuX19sYXN0X2luZGV4X18sXG4gICAgICB0ZXh0ICA9IHNlbGYuX190ZXh0X2NhY2hlX18uc2xpY2Uoc3RhcnQsIGVuZCk7XG5cbiAgLyoqXG4gICAqIE1hdGNoI3NjaGVtYSAtPiBTdHJpbmdcbiAgICpcbiAgICogUHJlZml4IChwcm90b2NvbCkgZm9yIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMuc2NoZW1hICAgID0gc2VsZi5fX3NjaGVtYV9fLnRvTG93ZXJDYXNlKCk7XG4gIC8qKlxuICAgKiBNYXRjaCNpbmRleCAtPiBOdW1iZXJcbiAgICpcbiAgICogRmlyc3QgcG9zaXRpb24gb2YgbWF0Y2hlZCBzdHJpbmcuXG4gICAqKi9cbiAgdGhpcy5pbmRleCAgICAgPSBzdGFydCArIHNoaWZ0O1xuICAvKipcbiAgICogTWF0Y2gjbGFzdEluZGV4IC0+IE51bWJlclxuICAgKlxuICAgKiBOZXh0IHBvc2l0aW9uIGFmdGVyIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMubGFzdEluZGV4ID0gZW5kICsgc2hpZnQ7XG4gIC8qKlxuICAgKiBNYXRjaCNyYXcgLT4gU3RyaW5nXG4gICAqXG4gICAqIE1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMucmF3ICAgICAgID0gdGV4dDtcbiAgLyoqXG4gICAqIE1hdGNoI3RleHQgLT4gU3RyaW5nXG4gICAqXG4gICAqIE5vdG1hbGl6ZWQgdGV4dCBvZiBtYXRjaGVkIHN0cmluZy5cbiAgICoqL1xuICB0aGlzLnRleHQgICAgICA9IHRleHQ7XG4gIC8qKlxuICAgKiBNYXRjaCN1cmwgLT4gU3RyaW5nXG4gICAqXG4gICAqIE5vcm1hbGl6ZWQgdXJsIG9mIG1hdGNoZWQgc3RyaW5nLlxuICAgKiovXG4gIHRoaXMudXJsICAgICAgID0gdGV4dDtcbn1cblxuZnVuY3Rpb24gY3JlYXRlTWF0Y2goc2VsZiwgc2hpZnQpIHtcbiAgdmFyIG1hdGNoID0gbmV3IE1hdGNoKHNlbGYsIHNoaWZ0KTtcblxuICBzZWxmLl9fY29tcGlsZWRfX1ttYXRjaC5zY2hlbWFdLm5vcm1hbGl6ZShtYXRjaCwgc2VsZik7XG5cbiAgcmV0dXJuIG1hdGNoO1xufVxuXG5cbi8qKlxuICogY2xhc3MgTGlua2lmeUl0XG4gKiovXG5cbi8qKlxuICogbmV3IExpbmtpZnlJdChzY2hlbWFzLCBvcHRpb25zKVxuICogLSBzY2hlbWFzIChPYmplY3QpOiBPcHRpb25hbC4gQWRkaXRpb25hbCBzY2hlbWFzIHRvIHZhbGlkYXRlIChwcmVmaXgvdmFsaWRhdG9yKVxuICogLSBvcHRpb25zIChPYmplY3QpOiB7IGZ1enp5TGlua3xmdXp6eUVtYWlsfGZ1enp5SVA6IHRydWV8ZmFsc2UgfVxuICpcbiAqIENyZWF0ZXMgbmV3IGxpbmtpZmllciBpbnN0YW5jZSB3aXRoIG9wdGlvbmFsIGFkZGl0aW9uYWwgc2NoZW1hcy5cbiAqIENhbiBiZSBjYWxsZWQgd2l0aG91dCBgbmV3YCBrZXl3b3JkIGZvciBjb252ZW5pZW5jZS5cbiAqXG4gKiBCeSBkZWZhdWx0IHVuZGVyc3RhbmRzOlxuICpcbiAqIC0gYGh0dHAocyk6Ly8uLi5gICwgYGZ0cDovLy4uLmAsIGBtYWlsdG86Li4uYCAmIGAvLy4uLmAgbGlua3NcbiAqIC0gXCJmdXp6eVwiIGxpbmtzIGFuZCBlbWFpbHMgKGV4YW1wbGUuY29tLCBmb29AYmFyLmNvbSkuXG4gKlxuICogYHNjaGVtYXNgIGlzIGFuIG9iamVjdCwgd2hlcmUgZWFjaCBrZXkvdmFsdWUgZGVzY3JpYmVzIHByb3RvY29sL3J1bGU6XG4gKlxuICogLSBfX2tleV9fIC0gbGluayBwcmVmaXggKHVzdWFsbHksIHByb3RvY29sIG5hbWUgd2l0aCBgOmAgYXQgdGhlIGVuZCwgYHNreXBlOmBcbiAqICAgZm9yIGV4YW1wbGUpLiBgbGlua2lmeS1pdGAgbWFrZXMgc2h1cmUgdGhhdCBwcmVmaXggaXMgbm90IHByZWNlZWRlZCB3aXRoXG4gKiAgIGFscGhhbnVtZXJpYyBjaGFyIGFuZCBzeW1ib2xzLiBPbmx5IHdoaXRlc3BhY2VzIGFuZCBwdW5jdHVhdGlvbiBhbGxvd2VkLlxuICogLSBfX3ZhbHVlX18gLSBydWxlIHRvIGNoZWNrIHRhaWwgYWZ0ZXIgbGluayBwcmVmaXhcbiAqICAgLSBfU3RyaW5nXyAtIGp1c3QgYWxpYXMgdG8gZXhpc3RpbmcgcnVsZVxuICogICAtIF9PYmplY3RfXG4gKiAgICAgLSBfdmFsaWRhdGVfIC0gdmFsaWRhdG9yIGZ1bmN0aW9uIChzaG91bGQgcmV0dXJuIG1hdGNoZWQgbGVuZ3RoIG9uIHN1Y2Nlc3MpLFxuICogICAgICAgb3IgYFJlZ0V4cGAuXG4gKiAgICAgLSBfbm9ybWFsaXplXyAtIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIG5vcm1hbGl6ZSB0ZXh0ICYgdXJsIG9mIG1hdGNoZWQgcmVzdWx0XG4gKiAgICAgICAoZm9yIGV4YW1wbGUsIGZvciBAdHdpdHRlciBtZW50aW9ucykuXG4gKlxuICogYG9wdGlvbnNgOlxuICpcbiAqIC0gX19mdXp6eUxpbmtfXyAtIHJlY29nbmlnZSBVUkwtcyB3aXRob3V0IGBodHRwKHMpOmAgcHJlZml4LiBEZWZhdWx0IGB0cnVlYC5cbiAqIC0gX19mdXp6eUlQX18gLSBhbGxvdyBJUHMgaW4gZnV6enkgbGlua3MgYWJvdmUuIENhbiBjb25mbGljdCB3aXRoIHNvbWUgdGV4dHNcbiAqICAgbGlrZSB2ZXJzaW9uIG51bWJlcnMuIERlZmF1bHQgYGZhbHNlYC5cbiAqIC0gX19mdXp6eUVtYWlsX18gLSByZWNvZ25pemUgZW1haWxzIHdpdGhvdXQgYG1haWx0bzpgIHByZWZpeC5cbiAqXG4gKiovXG5mdW5jdGlvbiBMaW5raWZ5SXQoc2NoZW1hcywgb3B0aW9ucykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTGlua2lmeUl0KSkge1xuICAgIHJldHVybiBuZXcgTGlua2lmeUl0KHNjaGVtYXMsIG9wdGlvbnMpO1xuICB9XG5cbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgaWYgKGlzT3B0aW9uc09iaihzY2hlbWFzKSkge1xuICAgICAgb3B0aW9ucyA9IHNjaGVtYXM7XG4gICAgICBzY2hlbWFzID0ge307XG4gICAgfVxuICB9XG5cbiAgdGhpcy5fX29wdHNfXyAgICAgICAgICAgPSBhc3NpZ24oe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICAvLyBDYWNoZSBsYXN0IHRlc3RlZCByZXN1bHQuIFVzZWQgdG8gc2tpcCByZXBlYXRpbmcgc3RlcHMgb24gbmV4dCBgbWF0Y2hgIGNhbGwuXG4gIHRoaXMuX19pbmRleF9fICAgICAgICAgID0gLTE7XG4gIHRoaXMuX19sYXN0X2luZGV4X18gICAgID0gLTE7IC8vIE5leHQgc2NhbiBwb3NpdGlvblxuICB0aGlzLl9fc2NoZW1hX18gICAgICAgICA9ICcnO1xuICB0aGlzLl9fdGV4dF9jYWNoZV9fICAgICA9ICcnO1xuXG4gIHRoaXMuX19zY2hlbWFzX18gICAgICAgID0gYXNzaWduKHt9LCBkZWZhdWx0U2NoZW1hcywgc2NoZW1hcyk7XG4gIHRoaXMuX19jb21waWxlZF9fICAgICAgID0ge307XG5cbiAgdGhpcy5fX3RsZHNfXyAgICAgICAgICAgPSB0bGRzX2RlZmF1bHQ7XG4gIHRoaXMuX190bGRzX3JlcGxhY2VkX18gID0gZmFsc2U7XG5cbiAgdGhpcy5yZSA9IHt9O1xuXG4gIGNvbXBpbGUodGhpcyk7XG59XG5cblxuLyoqIGNoYWluYWJsZVxuICogTGlua2lmeUl0I2FkZChzY2hlbWEsIGRlZmluaXRpb24pXG4gKiAtIHNjaGVtYSAoU3RyaW5nKTogcnVsZSBuYW1lIChmaXhlZCBwYXR0ZXJuIHByZWZpeClcbiAqIC0gZGVmaW5pdGlvbiAoU3RyaW5nfFJlZ0V4cHxPYmplY3QpOiBzY2hlbWEgZGVmaW5pdGlvblxuICpcbiAqIEFkZCBuZXcgcnVsZSBkZWZpbml0aW9uLiBTZWUgY29uc3RydWN0b3IgZGVzY3JpcHRpb24gZm9yIGRldGFpbHMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZChzY2hlbWEsIGRlZmluaXRpb24pIHtcbiAgdGhpcy5fX3NjaGVtYXNfX1tzY2hlbWFdID0gZGVmaW5pdGlvbjtcbiAgY29tcGlsZSh0aGlzKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKiBjaGFpbmFibGVcbiAqIExpbmtpZnlJdCNzZXQob3B0aW9ucylcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogeyBmdXp6eUxpbmt8ZnV6enlFbWFpbHxmdXp6eUlQOiB0cnVlfGZhbHNlIH1cbiAqXG4gKiBTZXQgcmVjb2duaXRpb24gb3B0aW9ucyBmb3IgbGlua3Mgd2l0aG91dCBzY2hlbWEuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldChvcHRpb25zKSB7XG4gIHRoaXMuX19vcHRzX18gPSBhc3NpZ24odGhpcy5fX29wdHNfXywgb3B0aW9ucyk7XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKipcbiAqIExpbmtpZnlJdCN0ZXN0KHRleHQpIC0+IEJvb2xlYW5cbiAqXG4gKiBTZWFyY2hlcyBsaW5raWZpYWJsZSBwYXR0ZXJuIGFuZCByZXR1cm5zIGB0cnVlYCBvbiBzdWNjZXNzIG9yIGBmYWxzZWAgb24gZmFpbC5cbiAqKi9cbkxpbmtpZnlJdC5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uIHRlc3QodGV4dCkge1xuICAvLyBSZXNldCBzY2FuIGNhY2hlXG4gIHRoaXMuX190ZXh0X2NhY2hlX18gPSB0ZXh0O1xuICB0aGlzLl9faW5kZXhfXyAgICAgID0gLTE7XG5cbiAgaWYgKCF0ZXh0Lmxlbmd0aCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICB2YXIgbSwgbWwsIG1lLCBsZW4sIHNoaWZ0LCBuZXh0LCByZSwgdGxkX3BvcywgYXRfcG9zO1xuXG4gIC8vIHRyeSB0byBzY2FuIGZvciBsaW5rIHdpdGggc2NoZW1hIC0gdGhhdCdzIHRoZSBtb3N0IHNpbXBsZSBydWxlXG4gIGlmICh0aGlzLnJlLnNjaGVtYV90ZXN0LnRlc3QodGV4dCkpIHtcbiAgICByZSA9IHRoaXMucmUuc2NoZW1hX3NlYXJjaDtcbiAgICByZS5sYXN0SW5kZXggPSAwO1xuICAgIHdoaWxlICgobSA9IHJlLmV4ZWModGV4dCkpICE9PSBudWxsKSB7XG4gICAgICBsZW4gPSB0aGlzLnRlc3RTY2hlbWFBdCh0ZXh0LCBtWzJdLCByZS5sYXN0SW5kZXgpO1xuICAgICAgaWYgKGxlbikge1xuICAgICAgICB0aGlzLl9fc2NoZW1hX18gICAgID0gbVsyXTtcbiAgICAgICAgdGhpcy5fX2luZGV4X18gICAgICA9IG0uaW5kZXggKyBtWzFdLmxlbmd0aDtcbiAgICAgICAgdGhpcy5fX2xhc3RfaW5kZXhfXyA9IG0uaW5kZXggKyBtWzBdLmxlbmd0aCArIGxlbjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMuX19vcHRzX18uZnV6enlMaW5rICYmIHRoaXMuX19jb21waWxlZF9fWydodHRwOiddKSB7XG4gICAgLy8gZ3Vlc3Mgc2NoZW1hbGVzcyBsaW5rc1xuICAgIHRsZF9wb3MgPSB0ZXh0LnNlYXJjaCh0aGlzLnJlLmhvc3RfZnV6enlfdGVzdCk7XG4gICAgaWYgKHRsZF9wb3MgPj0gMCkge1xuICAgICAgLy8gaWYgdGxkIGlzIGxvY2F0ZWQgYWZ0ZXIgZm91bmQgbGluayAtIG5vIG5lZWQgdG8gY2hlY2sgZnV6enkgcGF0dGVyblxuICAgICAgaWYgKHRoaXMuX19pbmRleF9fIDwgMCB8fCB0bGRfcG9zIDwgdGhpcy5fX2luZGV4X18pIHtcbiAgICAgICAgaWYgKChtbCA9IHRleHQubWF0Y2godGhpcy5fX29wdHNfXy5mdXp6eUlQID8gdGhpcy5yZS5saW5rX2Z1enp5IDogdGhpcy5yZS5saW5rX25vX2lwX2Z1enp5KSkgIT09IG51bGwpIHtcblxuICAgICAgICAgIHNoaWZ0ID0gbWwuaW5kZXggKyBtbFsxXS5sZW5ndGg7XG5cbiAgICAgICAgICBpZiAodGhpcy5fX2luZGV4X18gPCAwIHx8IHNoaWZ0IDwgdGhpcy5fX2luZGV4X18pIHtcbiAgICAgICAgICAgIHRoaXMuX19zY2hlbWFfXyAgICAgPSAnJztcbiAgICAgICAgICAgIHRoaXMuX19pbmRleF9fICAgICAgPSBzaGlmdDtcbiAgICAgICAgICAgIHRoaXMuX19sYXN0X2luZGV4X18gPSBtbC5pbmRleCArIG1sWzBdLmxlbmd0aDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAodGhpcy5fX29wdHNfXy5mdXp6eUVtYWlsICYmIHRoaXMuX19jb21waWxlZF9fWydtYWlsdG86J10pIHtcbiAgICAvLyBndWVzcyBzY2hlbWFsZXNzIGVtYWlsc1xuICAgIGF0X3BvcyA9IHRleHQuaW5kZXhPZignQCcpO1xuICAgIGlmIChhdF9wb3MgPj0gMCkge1xuICAgICAgLy8gV2UgY2FuJ3Qgc2tpcCB0aGlzIGNoZWNrLCBiZWNhdXNlIHRoaXMgY2FzZXMgYXJlIHBvc3NpYmxlOlxuICAgICAgLy8gMTkyLjE2OC4xLjFAZ21haWwuY29tLCBteS5pbkBleGFtcGxlLmNvbVxuICAgICAgaWYgKChtZSA9IHRleHQubWF0Y2godGhpcy5yZS5lbWFpbF9mdXp6eSkpICE9PSBudWxsKSB7XG5cbiAgICAgICAgc2hpZnQgPSBtZS5pbmRleCArIG1lWzFdLmxlbmd0aDtcbiAgICAgICAgbmV4dCAgPSBtZS5pbmRleCArIG1lWzBdLmxlbmd0aDtcblxuICAgICAgICBpZiAodGhpcy5fX2luZGV4X18gPCAwIHx8IHNoaWZ0IDwgdGhpcy5fX2luZGV4X18gfHxcbiAgICAgICAgICAgIChzaGlmdCA9PT0gdGhpcy5fX2luZGV4X18gJiYgbmV4dCA+IHRoaXMuX19sYXN0X2luZGV4X18pKSB7XG4gICAgICAgICAgdGhpcy5fX3NjaGVtYV9fICAgICA9ICdtYWlsdG86JztcbiAgICAgICAgICB0aGlzLl9faW5kZXhfXyAgICAgID0gc2hpZnQ7XG4gICAgICAgICAgdGhpcy5fX2xhc3RfaW5kZXhfXyA9IG5leHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcy5fX2luZGV4X18gPj0gMDtcbn07XG5cblxuLyoqXG4gKiBMaW5raWZ5SXQjcHJldGVzdCh0ZXh0KSAtPiBCb29sZWFuXG4gKlxuICogVmVyeSBxdWljayBjaGVjaywgdGhhdCBjYW4gZ2l2ZSBmYWxzZSBwb3NpdGl2ZXMuIFJldHVybnMgdHJ1ZSBpZiBsaW5rIE1BWSBCRVxuICogY2FuIGV4aXN0cy4gQ2FuIGJlIHVzZWQgZm9yIHNwZWVkIG9wdGltaXphdGlvbiwgd2hlbiB5b3UgbmVlZCB0byBjaGVjayB0aGF0XG4gKiBsaW5rIE5PVCBleGlzdHMuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnByZXRlc3QgPSBmdW5jdGlvbiBwcmV0ZXN0KHRleHQpIHtcbiAgcmV0dXJuIHRoaXMucmUucHJldGVzdC50ZXN0KHRleHQpO1xufTtcblxuXG4vKipcbiAqIExpbmtpZnlJdCN0ZXN0U2NoZW1hQXQodGV4dCwgbmFtZSwgcG9zaXRpb24pIC0+IE51bWJlclxuICogLSB0ZXh0IChTdHJpbmcpOiB0ZXh0IHRvIHNjYW5cbiAqIC0gbmFtZSAoU3RyaW5nKTogcnVsZSAoc2NoZW1hKSBuYW1lXG4gKiAtIHBvc2l0aW9uIChOdW1iZXIpOiB0ZXh0IG9mZnNldCB0byBjaGVjayBmcm9tXG4gKlxuICogU2ltaWxhciB0byBbW0xpbmtpZnlJdCN0ZXN0XV0gYnV0IGNoZWNrcyBvbmx5IHNwZWNpZmljIHByb3RvY29sIHRhaWwgZXhhY3RseVxuICogYXQgZ2l2ZW4gcG9zaXRpb24uIFJldHVybnMgbGVuZ3RoIG9mIGZvdW5kIHBhdHRlcm4gKDAgb24gZmFpbCkuXG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLnRlc3RTY2hlbWFBdCA9IGZ1bmN0aW9uIHRlc3RTY2hlbWFBdCh0ZXh0LCBzY2hlbWEsIHBvcykge1xuICAvLyBJZiBub3Qgc3VwcG9ydGVkIHNjaGVtYSBjaGVjayByZXF1ZXN0ZWQgLSB0ZXJtaW5hdGVcbiAgaWYgKCF0aGlzLl9fY29tcGlsZWRfX1tzY2hlbWEudG9Mb3dlckNhc2UoKV0pIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICByZXR1cm4gdGhpcy5fX2NvbXBpbGVkX19bc2NoZW1hLnRvTG93ZXJDYXNlKCldLnZhbGlkYXRlKHRleHQsIHBvcywgdGhpcyk7XG59O1xuXG5cbi8qKlxuICogTGlua2lmeUl0I21hdGNoKHRleHQpIC0+IEFycmF5fG51bGxcbiAqXG4gKiBSZXR1cm5zIGFycmF5IG9mIGZvdW5kIGxpbmsgZGVzY3JpcHRpb25zIG9yIGBudWxsYCBvbiBmYWlsLiBXZSBzdHJvbmdseVxuICogcmVjb21tZW5kIHRvIHVzZSBbW0xpbmtpZnlJdCN0ZXN0XV0gZmlyc3QsIGZvciBiZXN0IHNwZWVkLlxuICpcbiAqICMjIyMjIFJlc3VsdCBtYXRjaCBkZXNjcmlwdGlvblxuICpcbiAqIC0gX19zY2hlbWFfXyAtIGxpbmsgc2NoZW1hLCBjYW4gYmUgZW1wdHkgZm9yIGZ1enp5IGxpbmtzLCBvciBgLy9gIGZvclxuICogICBwcm90b2NvbC1uZXV0cmFsICBsaW5rcy5cbiAqIC0gX19pbmRleF9fIC0gb2Zmc2V0IG9mIG1hdGNoZWQgdGV4dFxuICogLSBfX2xhc3RJbmRleF9fIC0gaW5kZXggb2YgbmV4dCBjaGFyIGFmdGVyIG1hdGhjaCBlbmRcbiAqIC0gX19yYXdfXyAtIG1hdGNoZWQgdGV4dFxuICogLSBfX3RleHRfXyAtIG5vcm1hbGl6ZWQgdGV4dFxuICogLSBfX3VybF9fIC0gbGluaywgZ2VuZXJhdGVkIGZyb20gbWF0Y2hlZCB0ZXh0XG4gKiovXG5MaW5raWZ5SXQucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24gbWF0Y2godGV4dCkge1xuICB2YXIgc2hpZnQgPSAwLCByZXN1bHQgPSBbXTtcblxuICAvLyBUcnkgdG8gdGFrZSBwcmV2aW91cyBlbGVtZW50IGZyb20gY2FjaGUsIGlmIC50ZXN0KCkgY2FsbGVkIGJlZm9yZVxuICBpZiAodGhpcy5fX2luZGV4X18gPj0gMCAmJiB0aGlzLl9fdGV4dF9jYWNoZV9fID09PSB0ZXh0KSB7XG4gICAgcmVzdWx0LnB1c2goY3JlYXRlTWF0Y2godGhpcywgc2hpZnQpKTtcbiAgICBzaGlmdCA9IHRoaXMuX19sYXN0X2luZGV4X187XG4gIH1cblxuICAvLyBDdXQgaGVhZCBpZiBjYWNoZSB3YXMgdXNlZFxuICB2YXIgdGFpbCA9IHNoaWZ0ID8gdGV4dC5zbGljZShzaGlmdCkgOiB0ZXh0O1xuXG4gIC8vIFNjYW4gc3RyaW5nIHVudGlsIGVuZCByZWFjaGVkXG4gIHdoaWxlICh0aGlzLnRlc3QodGFpbCkpIHtcbiAgICByZXN1bHQucHVzaChjcmVhdGVNYXRjaCh0aGlzLCBzaGlmdCkpO1xuXG4gICAgdGFpbCA9IHRhaWwuc2xpY2UodGhpcy5fX2xhc3RfaW5kZXhfXyk7XG4gICAgc2hpZnQgKz0gdGhpcy5fX2xhc3RfaW5kZXhfXztcbiAgfVxuXG4gIGlmIChyZXN1bHQubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBudWxsO1xufTtcblxuXG4vKiogY2hhaW5hYmxlXG4gKiBMaW5raWZ5SXQjdGxkcyhsaXN0IFssIGtlZXBPbGRdKSAtPiB0aGlzXG4gKiAtIGxpc3QgKEFycmF5KTogbGlzdCBvZiB0bGRzXG4gKiAtIGtlZXBPbGQgKEJvb2xlYW4pOiBtZXJnZSB3aXRoIGN1cnJlbnQgbGlzdCBpZiBgdHJ1ZWAgKGBmYWxzZWAgYnkgZGVmYXVsdClcbiAqXG4gKiBMb2FkIChvciBtZXJnZSkgbmV3IHRsZHMgbGlzdC4gVGhvc2UgYXJlIHVzZXIgZm9yIGZ1enp5IGxpbmtzICh3aXRob3V0IHByZWZpeClcbiAqIHRvIGF2b2lkIGZhbHNlIHBvc2l0aXZlcy4gQnkgZGVmYXVsdCB0aGlzIGFsZ29yeXRobSB1c2VkOlxuICpcbiAqIC0gaG9zdG5hbWUgd2l0aCBhbnkgMi1sZXR0ZXIgcm9vdCB6b25lcyBhcmUgb2suXG4gKiAtIGJpenxjb218ZWR1fGdvdnxuZXR8b3JnfHByb3x3ZWJ8eHh4fGFlcm98YXNpYXxjb29wfGluZm98bXVzZXVtfG5hbWV8c2hvcHzRgNGEXG4gKiAgIGFyZSBvay5cbiAqIC0gZW5jb2RlZCAoYHhuLS0uLi5gKSByb290IHpvbmVzIGFyZSBvay5cbiAqXG4gKiBJZiBsaXN0IGlzIHJlcGxhY2VkLCB0aGVuIGV4YWN0IG1hdGNoIGZvciAyLWNoYXJzIHJvb3Qgem9uZXMgd2lsbCBiZSBjaGVja2VkLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS50bGRzID0gZnVuY3Rpb24gdGxkcyhsaXN0LCBrZWVwT2xkKSB7XG4gIGxpc3QgPSBBcnJheS5pc0FycmF5KGxpc3QpID8gbGlzdCA6IFsgbGlzdCBdO1xuXG4gIGlmICgha2VlcE9sZCkge1xuICAgIHRoaXMuX190bGRzX18gPSBsaXN0LnNsaWNlKCk7XG4gICAgdGhpcy5fX3RsZHNfcmVwbGFjZWRfXyA9IHRydWU7XG4gICAgY29tcGlsZSh0aGlzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHRoaXMuX190bGRzX18gPSB0aGlzLl9fdGxkc19fLmNvbmNhdChsaXN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zb3J0KClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChlbCwgaWR4LCBhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBlbCAhPT0gYXJyW2lkeCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJldmVyc2UoKTtcblxuICBjb21waWxlKHRoaXMpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTGlua2lmeUl0I25vcm1hbGl6ZShtYXRjaClcbiAqXG4gKiBEZWZhdWx0IG5vcm1hbGl6ZXIgKGlmIHNjaGVtYSBkb2VzIG5vdCBkZWZpbmUgaXQncyBvd24pLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUobWF0Y2gpIHtcblxuICAvLyBEbyBtaW5pbWFsIHBvc3NpYmxlIGNoYW5nZXMgYnkgZGVmYXVsdC4gTmVlZCB0byBjb2xsZWN0IGZlZWRiYWNrIHByaW9yXG4gIC8vIHRvIG1vdmUgZm9yd2FyZCBodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbGlua2lmeS1pdC9pc3N1ZXMvMVxuXG4gIGlmICghbWF0Y2guc2NoZW1hKSB7IG1hdGNoLnVybCA9ICdodHRwOi8vJyArIG1hdGNoLnVybDsgfVxuXG4gIGlmIChtYXRjaC5zY2hlbWEgPT09ICdtYWlsdG86JyAmJiAhL15tYWlsdG86L2kudGVzdChtYXRjaC51cmwpKSB7XG4gICAgbWF0Y2gudXJsID0gJ21haWx0bzonICsgbWF0Y2gudXJsO1xuICB9XG59O1xuXG5cbi8qKlxuICogTGlua2lmeUl0I29uQ29tcGlsZSgpXG4gKlxuICogT3ZlcnJpZGUgdG8gbW9kaWZ5IGJhc2ljIFJlZ0V4cC1zLlxuICoqL1xuTGlua2lmeUl0LnByb3RvdHlwZS5vbkNvbXBpbGUgPSBmdW5jdGlvbiBvbkNvbXBpbGUoKSB7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTGlua2lmeUl0O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgdmFyIHJlID0ge307XG5cbiAgLy8gVXNlIGRpcmVjdCBleHRyYWN0IGluc3RlYWQgb2YgYHJlZ2VuZXJhdGVgIHRvIHJlZHVzZSBicm93c2VyaWZpZWQgc2l6ZVxuICByZS5zcmNfQW55ID0gcmVxdWlyZSgndWMubWljcm8vcHJvcGVydGllcy9BbnkvcmVnZXgnKS5zb3VyY2U7XG4gIHJlLnNyY19DYyAgPSByZXF1aXJlKCd1Yy5taWNyby9jYXRlZ29yaWVzL0NjL3JlZ2V4Jykuc291cmNlO1xuICByZS5zcmNfWiAgID0gcmVxdWlyZSgndWMubWljcm8vY2F0ZWdvcmllcy9aL3JlZ2V4Jykuc291cmNlO1xuICByZS5zcmNfUCAgID0gcmVxdWlyZSgndWMubWljcm8vY2F0ZWdvcmllcy9QL3JlZ2V4Jykuc291cmNlO1xuXG4gIC8vIFxccHtcXFpcXFBcXENjXFxDRn0gKHdoaXRlIHNwYWNlcyArIGNvbnRyb2wgKyBmb3JtYXQgKyBwdW5jdHVhdGlvbilcbiAgcmUuc3JjX1pQQ2MgPSBbIHJlLnNyY19aLCByZS5zcmNfUCwgcmUuc3JjX0NjIF0uam9pbignfCcpO1xuXG4gIC8vIFxccHtcXFpcXENjfSAod2hpdGUgc3BhY2VzICsgY29udHJvbClcbiAgcmUuc3JjX1pDYyA9IFsgcmUuc3JjX1osIHJlLnNyY19DYyBdLmpvaW4oJ3wnKTtcblxuICAvLyBFeHBlcmltZW50YWwuIExpc3Qgb2YgY2hhcnMsIGNvbXBsZXRlbHkgcHJvaGliaXRlZCBpbiBsaW5rc1xuICAvLyBiZWNhdXNlIGNhbiBzZXBhcmF0ZSBpdCBmcm9tIG90aGVyIHBhcnQgb2YgdGV4dFxuICB2YXIgdGV4dF9zZXBhcmF0b3JzID0gJ1s+PFxcdWZmNWNdJztcblxuICAvLyBBbGwgcG9zc2libGUgd29yZCBjaGFyYWN0ZXJzIChldmVyeXRoaW5nIHdpdGhvdXQgcHVuY3R1YXRpb24sIHNwYWNlcyAmIGNvbnRyb2xzKVxuICAvLyBEZWZpbmVkIHZpYSBwdW5jdHVhdGlvbiAmIHNwYWNlcyB0byBzYXZlIHNwYWNlXG4gIC8vIFNob3VsZCBiZSBzb21ldGhpbmcgbGlrZSBcXHB7XFxMXFxOXFxTXFxNfSAoXFx3IGJ1dCB3aXRob3V0IGBfYClcbiAgcmUuc3JjX3BzZXVkb19sZXR0ZXIgICAgICAgPSAnKD86KD8hJyArIHRleHRfc2VwYXJhdG9ycyArICd8JyArIHJlLnNyY19aUENjICsgJyknICsgcmUuc3JjX0FueSArICcpJztcbiAgLy8gVGhlIHNhbWUgYXMgYWJvdGhlIGJ1dCB3aXRob3V0IFswLTldXG4gIC8vIHZhciBzcmNfcHNldWRvX2xldHRlcl9ub25fZCA9ICcoPzooPyFbMC05XXwnICsgc3JjX1pQQ2MgKyAnKScgKyBzcmNfQW55ICsgJyknO1xuXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbiAgcmUuc3JjX2lwNCA9XG5cbiAgICAnKD86KDI1WzAtNV18MlswLTRdWzAtOV18WzAxXT9bMC05XVswLTldPylcXFxcLil7M30oMjVbMC01XXwyWzAtNF1bMC05XXxbMDFdP1swLTldWzAtOV0/KSc7XG5cbiAgLy8gUHJvaGliaXQgYW55IG9mIFwiQC9bXSgpXCIgaW4gdXNlci9wYXNzIHRvIGF2b2lkIHdyb25nIGRvbWFpbiBmZXRjaC5cbiAgcmUuc3JjX2F1dGggICAgPSAnKD86KD86KD8hJyArIHJlLnNyY19aQ2MgKyAnfFtAL1xcXFxbXFxcXF0oKV0pLikrQCk/JztcblxuICByZS5zcmNfcG9ydCA9XG5cbiAgICAnKD86Oig/OjYoPzpbMC00XVxcXFxkezN9fDUoPzpbMC00XVxcXFxkezJ9fDUoPzpbMC0yXVxcXFxkfDNbMC01XSkpKXxbMS01XT9cXFxcZHsxLDR9KSk/JztcblxuICByZS5zcmNfaG9zdF90ZXJtaW5hdG9yID1cblxuICAgICcoPz0kfCcgKyB0ZXh0X3NlcGFyYXRvcnMgKyAnfCcgKyByZS5zcmNfWlBDYyArICcpKD8hLXxffDpcXFxcZHxcXFxcLi18XFxcXC4oPyEkfCcgKyByZS5zcmNfWlBDYyArICcpKSc7XG5cbiAgcmUuc3JjX3BhdGggPVxuXG4gICAgJyg/OicgK1xuICAgICAgJ1svPyNdJyArXG4gICAgICAgICcoPzonICtcbiAgICAgICAgICAnKD8hJyArIHJlLnNyY19aQ2MgKyAnfCcgKyB0ZXh0X3NlcGFyYXRvcnMgKyAnfFsoKVtcXFxcXXt9LixcIlxcJz8hXFxcXC1dKS58JyArXG4gICAgICAgICAgJ1xcXFxbKD86KD8hJyArIHJlLnNyY19aQ2MgKyAnfFxcXFxdKS4pKlxcXFxdfCcgK1xuICAgICAgICAgICdcXFxcKCg/Oig/IScgKyByZS5zcmNfWkNjICsgJ3xbKV0pLikqXFxcXCl8JyArXG4gICAgICAgICAgJ1xcXFx7KD86KD8hJyArIHJlLnNyY19aQ2MgKyAnfFt9XSkuKSpcXFxcfXwnICtcbiAgICAgICAgICAnXFxcXFwiKD86KD8hJyArIHJlLnNyY19aQ2MgKyAnfFtcIl0pLikrXFxcXFwifCcgK1xuICAgICAgICAgIFwiXFxcXCcoPzooPyFcIiArIHJlLnNyY19aQ2MgKyBcInxbJ10pLikrXFxcXCd8XCIgK1xuICAgICAgICAgIFwiXFxcXCcoPz1cIiArIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJ3xbLV0pLnwnICsgIC8vIGFsbG93IGBJJ21fa2luZ2AgaWYgbm8gcGFpciBmb3VuZFxuICAgICAgICAgICdcXFxcLnsyLDN9W2EtekEtWjAtOSUvXXwnICsgLy8gZ2l0aHViIGhhcyAuLi4gaW4gY29tbWl0IHJhbmdlIGxpbmtzLiBSZXN0cmljdCB0b1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0gZW5nbGlzaFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC0gcGVyY2VudC1lbmNvZGVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLSBwYXJ0cyBvZiBmaWxlIHBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1bnRpbCBtb3JlIGV4YW1wbGVzIGZvdW5kLlxuICAgICAgICAgICdcXFxcLig/IScgKyByZS5zcmNfWkNjICsgJ3xbLl0pLnwnICtcbiAgICAgICAgICAob3B0cyAmJiBvcHRzWyctLS0nXSA/XG4gICAgICAgICAgICAnXFxcXC0oPyEtLSg/OlteLV18JCkpKD86LSopfCcgLy8gYC0tLWAgPT4gbG9uZyBkYXNoLCB0ZXJtaW5hdGVcbiAgICAgICAgICAgIDpcbiAgICAgICAgICAgICdcXFxcLSt8J1xuICAgICAgICAgICkgK1xuICAgICAgICAgICdcXFxcLCg/IScgKyByZS5zcmNfWkNjICsgJykufCcgKyAgICAgIC8vIGFsbG93IGAsLCxgIGluIHBhdGhzXG4gICAgICAgICAgJ1xcXFwhKD8hJyArIHJlLnNyY19aQ2MgKyAnfFshXSkufCcgK1xuICAgICAgICAgICdcXFxcPyg/IScgKyByZS5zcmNfWkNjICsgJ3xbP10pLicgK1xuICAgICAgICAnKSsnICtcbiAgICAgICd8XFxcXC8nICtcbiAgICAnKT8nO1xuXG4gIHJlLnNyY19lbWFpbF9uYW1lID1cblxuICAgICdbXFxcXC07OiY9XFxcXCtcXFxcJCxcXFxcXCJcXFxcLmEtekEtWjAtOV9dKyc7XG5cbiAgcmUuc3JjX3huID1cblxuICAgICd4bi0tW2EtejAtOVxcXFwtXXsxLDU5fSc7XG5cbiAgLy8gTW9yZSB0byByZWFkIGFib3V0IGRvbWFpbiBuYW1lc1xuICAvLyBodHRwOi8vc2VydmVyZmF1bHQuY29tL3F1ZXN0aW9ucy82MzgyNjAvXG5cbiAgcmUuc3JjX2RvbWFpbl9yb290ID1cblxuICAgIC8vIEFsbG93IGxldHRlcnMgJiBkaWdpdHMgKGh0dHA6Ly90ZXN0MSlcbiAgICAnKD86JyArXG4gICAgICByZS5zcmNfeG4gK1xuICAgICAgJ3wnICtcbiAgICAgIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJ3sxLDYzfScgK1xuICAgICcpJztcblxuICByZS5zcmNfZG9tYWluID1cblxuICAgICcoPzonICtcbiAgICAgIHJlLnNyY194biArXG4gICAgICAnfCcgK1xuICAgICAgJyg/OicgKyByZS5zcmNfcHNldWRvX2xldHRlciArICcpJyArXG4gICAgICAnfCcgK1xuICAgICAgJyg/OicgKyByZS5zcmNfcHNldWRvX2xldHRlciArICcoPzotfCcgKyByZS5zcmNfcHNldWRvX2xldHRlciArICcpezAsNjF9JyArIHJlLnNyY19wc2V1ZG9fbGV0dGVyICsgJyknICtcbiAgICAnKSc7XG5cbiAgcmUuc3JjX2hvc3QgPVxuXG4gICAgJyg/OicgK1xuICAgIC8vIERvbid0IG5lZWQgSVAgY2hlY2ssIGJlY2F1c2UgZGlnaXRzIGFyZSBhbHJlYWR5IGFsbG93ZWQgaW4gbm9ybWFsIGRvbWFpbiBuYW1lc1xuICAgIC8vICAgc3JjX2lwNCArXG4gICAgLy8gJ3wnICtcbiAgICAgICcoPzooPzooPzonICsgcmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKicgKyByZS5zcmNfZG9tYWluLypfcm9vdCovICsgJyknICtcbiAgICAnKSc7XG5cbiAgcmUudHBsX2hvc3RfZnV6enkgPVxuXG4gICAgJyg/OicgK1xuICAgICAgcmUuc3JjX2lwNCArXG4gICAgJ3wnICtcbiAgICAgICcoPzooPzooPzonICsgcmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKyg/OiVUTERTJSkpJyArXG4gICAgJyknO1xuXG4gIHJlLnRwbF9ob3N0X25vX2lwX2Z1enp5ID1cblxuICAgICcoPzooPzooPzonICsgcmUuc3JjX2RvbWFpbiArICcpXFxcXC4pKyg/OiVUTERTJSkpJztcblxuICByZS5zcmNfaG9zdF9zdHJpY3QgPVxuXG4gICAgcmUuc3JjX2hvc3QgKyByZS5zcmNfaG9zdF90ZXJtaW5hdG9yO1xuXG4gIHJlLnRwbF9ob3N0X2Z1enp5X3N0cmljdCA9XG5cbiAgICByZS50cGxfaG9zdF9mdXp6eSArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cbiAgcmUuc3JjX2hvc3RfcG9ydF9zdHJpY3QgPVxuXG4gICAgcmUuc3JjX2hvc3QgKyByZS5zcmNfcG9ydCArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cbiAgcmUudHBsX2hvc3RfcG9ydF9mdXp6eV9zdHJpY3QgPVxuXG4gICAgcmUudHBsX2hvc3RfZnV6enkgKyByZS5zcmNfcG9ydCArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cbiAgcmUudHBsX2hvc3RfcG9ydF9ub19pcF9mdXp6eV9zdHJpY3QgPVxuXG4gICAgcmUudHBsX2hvc3Rfbm9faXBfZnV6enkgKyByZS5zcmNfcG9ydCArIHJlLnNyY19ob3N0X3Rlcm1pbmF0b3I7XG5cblxuICAvLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAvLyBNYWluIHJ1bGVzXG5cbiAgLy8gUnVkZSB0ZXN0IGZ1enp5IGxpbmtzIGJ5IGhvc3QsIGZvciBxdWljayBkZW55XG4gIHJlLnRwbF9ob3N0X2Z1enp5X3Rlc3QgPVxuXG4gICAgJ2xvY2FsaG9zdHx3d3dcXFxcLnxcXFxcLlxcXFxkezEsM31cXFxcLnwoPzpcXFxcLig/OiVUTERTJSkoPzonICsgcmUuc3JjX1pQQ2MgKyAnfD58JCkpJztcblxuICByZS50cGxfZW1haWxfZnV6enkgPVxuXG4gICAgICAnKF58JyArIHRleHRfc2VwYXJhdG9ycyArICd8XFxcXCh8JyArIHJlLnNyY19aQ2MgKyAnKSgnICsgcmUuc3JjX2VtYWlsX25hbWUgKyAnQCcgKyByZS50cGxfaG9zdF9mdXp6eV9zdHJpY3QgKyAnKSc7XG5cbiAgcmUudHBsX2xpbmtfZnV6enkgPVxuICAgICAgLy8gRnV6enkgbGluayBjYW4ndCBiZSBwcmVwZW5kZWQgd2l0aCAuOi9cXC0gYW5kIG5vbiBwdW5jdHVhdGlvbi5cbiAgICAgIC8vIGJ1dCBjYW4gc3RhcnQgd2l0aCA+IChtYXJrZG93biBibG9ja3F1b3RlKVxuICAgICAgJyhefCg/IVsuOi9cXFxcLV9AXSkoPzpbJCs8PT5eYHxcXHVmZjVjXXwnICsgcmUuc3JjX1pQQ2MgKyAnKSknICtcbiAgICAgICcoKD8hWyQrPD0+XmB8XFx1ZmY1Y10pJyArIHJlLnRwbF9ob3N0X3BvcnRfZnV6enlfc3RyaWN0ICsgcmUuc3JjX3BhdGggKyAnKSc7XG5cbiAgcmUudHBsX2xpbmtfbm9faXBfZnV6enkgPVxuICAgICAgLy8gRnV6enkgbGluayBjYW4ndCBiZSBwcmVwZW5kZWQgd2l0aCAuOi9cXC0gYW5kIG5vbiBwdW5jdHVhdGlvbi5cbiAgICAgIC8vIGJ1dCBjYW4gc3RhcnQgd2l0aCA+IChtYXJrZG93biBibG9ja3F1b3RlKVxuICAgICAgJyhefCg/IVsuOi9cXFxcLV9AXSkoPzpbJCs8PT5eYHxcXHVmZjVjXXwnICsgcmUuc3JjX1pQQ2MgKyAnKSknICtcbiAgICAgICcoKD8hWyQrPD0+XmB8XFx1ZmY1Y10pJyArIHJlLnRwbF9ob3N0X3BvcnRfbm9faXBfZnV6enlfc3RyaWN0ICsgcmUuc3JjX3BhdGggKyAnKSc7XG5cbiAgcmV0dXJuIHJlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliLycpO1xuIiwiLy8gSFRNTDUgZW50aXRpZXMgbWFwOiB7IG5hbWUgLT4gdXRmMTZzdHJpbmcgfVxuLy9cbid1c2Ugc3RyaWN0JztcblxuLyplc2xpbnQgcXVvdGVzOjAqL1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCdlbnRpdGllcy9tYXBzL2VudGl0aWVzLmpzb24nKTtcbiIsIi8vIExpc3Qgb2YgdmFsaWQgaHRtbCBibG9ja3MgbmFtZXMsIGFjY29ydGluZyB0byBjb21tb25tYXJrIHNwZWNcbi8vIGh0dHA6Ly9qZ20uZ2l0aHViLmlvL0NvbW1vbk1hcmsvc3BlYy5odG1sI2h0bWwtYmxvY2tzXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFtcbiAgJ2FkZHJlc3MnLFxuICAnYXJ0aWNsZScsXG4gICdhc2lkZScsXG4gICdiYXNlJyxcbiAgJ2Jhc2Vmb250JyxcbiAgJ2Jsb2NrcXVvdGUnLFxuICAnYm9keScsXG4gICdjYXB0aW9uJyxcbiAgJ2NlbnRlcicsXG4gICdjb2wnLFxuICAnY29sZ3JvdXAnLFxuICAnZGQnLFxuICAnZGV0YWlscycsXG4gICdkaWFsb2cnLFxuICAnZGlyJyxcbiAgJ2RpdicsXG4gICdkbCcsXG4gICdkdCcsXG4gICdmaWVsZHNldCcsXG4gICdmaWdjYXB0aW9uJyxcbiAgJ2ZpZ3VyZScsXG4gICdmb290ZXInLFxuICAnZm9ybScsXG4gICdmcmFtZScsXG4gICdmcmFtZXNldCcsXG4gICdoMScsXG4gICdoMicsXG4gICdoMycsXG4gICdoNCcsXG4gICdoNScsXG4gICdoNicsXG4gICdoZWFkJyxcbiAgJ2hlYWRlcicsXG4gICdocicsXG4gICdodG1sJyxcbiAgJ2lmcmFtZScsXG4gICdsZWdlbmQnLFxuICAnbGknLFxuICAnbGluaycsXG4gICdtYWluJyxcbiAgJ21lbnUnLFxuICAnbWVudWl0ZW0nLFxuICAnbWV0YScsXG4gICduYXYnLFxuICAnbm9mcmFtZXMnLFxuICAnb2wnLFxuICAnb3B0Z3JvdXAnLFxuICAnb3B0aW9uJyxcbiAgJ3AnLFxuICAncGFyYW0nLFxuICAnc2VjdGlvbicsXG4gICdzb3VyY2UnLFxuICAnc3VtbWFyeScsXG4gICd0YWJsZScsXG4gICd0Ym9keScsXG4gICd0ZCcsXG4gICd0Zm9vdCcsXG4gICd0aCcsXG4gICd0aGVhZCcsXG4gICd0aXRsZScsXG4gICd0cicsXG4gICd0cmFjaycsXG4gICd1bCdcbl07XG4iLCIvLyBSZWdleHBzIHRvIG1hdGNoIGh0bWwgZWxlbWVudHNcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXR0cl9uYW1lICAgICA9ICdbYS16QS1aXzpdW2EtekEtWjAtOTouXy1dKic7XG5cbnZhciB1bnF1b3RlZCAgICAgID0gJ1teXCJcXCc9PD5gXFxcXHgwMC1cXFxceDIwXSsnO1xudmFyIHNpbmdsZV9xdW90ZWQgPSBcIidbXiddKidcIjtcbnZhciBkb3VibGVfcXVvdGVkID0gJ1wiW15cIl0qXCInO1xuXG52YXIgYXR0cl92YWx1ZSAgPSAnKD86JyArIHVucXVvdGVkICsgJ3wnICsgc2luZ2xlX3F1b3RlZCArICd8JyArIGRvdWJsZV9xdW90ZWQgKyAnKSc7XG5cbnZhciBhdHRyaWJ1dGUgICA9ICcoPzpcXFxccysnICsgYXR0cl9uYW1lICsgJyg/OlxcXFxzKj1cXFxccyonICsgYXR0cl92YWx1ZSArICcpPyknO1xuXG52YXIgb3Blbl90YWcgICAgPSAnPFtBLVphLXpdW0EtWmEtejAtOVxcXFwtXSonICsgYXR0cmlidXRlICsgJypcXFxccypcXFxcLz8+JztcblxudmFyIGNsb3NlX3RhZyAgID0gJzxcXFxcL1tBLVphLXpdW0EtWmEtejAtOVxcXFwtXSpcXFxccyo+JztcbnZhciBjb21tZW50ICAgICA9ICc8IS0tLS0+fDwhLS0oPzotP1tePi1dKSg/Oi0/W14tXSkqLS0+JztcbnZhciBwcm9jZXNzaW5nICA9ICc8Wz9dLio/Wz9dPic7XG52YXIgZGVjbGFyYXRpb24gPSAnPCFbQS1aXStcXFxccytbXj5dKj4nO1xudmFyIGNkYXRhICAgICAgID0gJzwhXFxcXFtDREFUQVxcXFxbW1xcXFxzXFxcXFNdKj9cXFxcXVxcXFxdPic7XG5cbnZhciBIVE1MX1RBR19SRSA9IG5ldyBSZWdFeHAoJ14oPzonICsgb3Blbl90YWcgKyAnfCcgKyBjbG9zZV90YWcgKyAnfCcgKyBjb21tZW50ICtcbiAgICAgICAgICAgICAgICAgICAgICAgICd8JyArIHByb2Nlc3NpbmcgKyAnfCcgKyBkZWNsYXJhdGlvbiArICd8JyArIGNkYXRhICsgJyknKTtcbnZhciBIVE1MX09QRU5fQ0xPU0VfVEFHX1JFID0gbmV3IFJlZ0V4cCgnXig/OicgKyBvcGVuX3RhZyArICd8JyArIGNsb3NlX3RhZyArICcpJyk7XG5cbm1vZHVsZS5leHBvcnRzLkhUTUxfVEFHX1JFID0gSFRNTF9UQUdfUkU7XG5tb2R1bGUuZXhwb3J0cy5IVE1MX09QRU5fQ0xPU0VfVEFHX1JFID0gSFRNTF9PUEVOX0NMT1NFX1RBR19SRTtcbiIsIi8vIFV0aWxpdGllc1xuLy9cbid1c2Ugc3RyaWN0JztcblxuXG5mdW5jdGlvbiBfY2xhc3Mob2JqKSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTsgfVxuXG5mdW5jdGlvbiBpc1N0cmluZyhvYmopIHsgcmV0dXJuIF9jbGFzcyhvYmopID09PSAnW29iamVjdCBTdHJpbmddJzsgfVxuXG52YXIgX2hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuZnVuY3Rpb24gaGFzKG9iamVjdCwga2V5KSB7XG4gIHJldHVybiBfaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGtleSk7XG59XG5cbi8vIE1lcmdlIG9iamVjdHNcbi8vXG5mdW5jdGlvbiBhc3NpZ24ob2JqIC8qZnJvbTEsIGZyb20yLCBmcm9tMywgLi4uKi8pIHtcbiAgdmFyIHNvdXJjZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIHNvdXJjZXMuZm9yRWFjaChmdW5jdGlvbiAoc291cmNlKSB7XG4gICAgaWYgKCFzb3VyY2UpIHsgcmV0dXJuOyB9XG5cbiAgICBpZiAodHlwZW9mIHNvdXJjZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3Ioc291cmNlICsgJ211c3QgYmUgb2JqZWN0Jyk7XG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoc291cmNlKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgIG9ialtrZXldID0gc291cmNlW2tleV07XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59XG5cbi8vIFJlbW92ZSBlbGVtZW50IGZyb20gYXJyYXkgYW5kIHB1dCBhbm90aGVyIGFycmF5IGF0IHRob3NlIHBvc2l0aW9uLlxuLy8gVXNlZnVsIGZvciBzb21lIG9wZXJhdGlvbnMgd2l0aCB0b2tlbnNcbmZ1bmN0aW9uIGFycmF5UmVwbGFjZUF0KHNyYywgcG9zLCBuZXdFbGVtZW50cykge1xuICByZXR1cm4gW10uY29uY2F0KHNyYy5zbGljZSgwLCBwb3MpLCBuZXdFbGVtZW50cywgc3JjLnNsaWNlKHBvcyArIDEpKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZnVuY3Rpb24gaXNWYWxpZEVudGl0eUNvZGUoYykge1xuICAvKmVzbGludCBuby1iaXR3aXNlOjAqL1xuICAvLyBicm9rZW4gc2VxdWVuY2VcbiAgaWYgKGMgPj0gMHhEODAwICYmIGMgPD0gMHhERkZGKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBuZXZlciB1c2VkXG4gIGlmIChjID49IDB4RkREMCAmJiBjIDw9IDB4RkRFRikgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKChjICYgMHhGRkZGKSA9PT0gMHhGRkZGIHx8IChjICYgMHhGRkZGKSA9PT0gMHhGRkZFKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBjb250cm9sIGNvZGVzXG4gIGlmIChjID49IDB4MDAgJiYgYyA8PSAweDA4KSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoYyA9PT0gMHgwQikgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKGMgPj0gMHgwRSAmJiBjIDw9IDB4MUYpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmIChjID49IDB4N0YgJiYgYyA8PSAweDlGKSB7IHJldHVybiBmYWxzZTsgfVxuICAvLyBvdXQgb2YgcmFuZ2VcbiAgaWYgKGMgPiAweDEwRkZGRikgeyByZXR1cm4gZmFsc2U7IH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGZyb21Db2RlUG9pbnQoYykge1xuICAvKmVzbGludCBuby1iaXR3aXNlOjAqL1xuICBpZiAoYyA+IDB4ZmZmZikge1xuICAgIGMgLT0gMHgxMDAwMDtcbiAgICB2YXIgc3Vycm9nYXRlMSA9IDB4ZDgwMCArIChjID4+IDEwKSxcbiAgICAgICAgc3Vycm9nYXRlMiA9IDB4ZGMwMCArIChjICYgMHgzZmYpO1xuXG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoc3Vycm9nYXRlMSwgc3Vycm9nYXRlMik7XG4gIH1cbiAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoYyk7XG59XG5cblxudmFyIFVORVNDQVBFX01EX1JFICA9IC9cXFxcKFshXCIjJCUmJygpKissXFwtLlxcLzo7PD0+P0BbXFxcXFxcXV5fYHt8fX5dKS9nO1xudmFyIEVOVElUWV9SRSAgICAgICA9IC8mKFthLXojXVthLXowLTldezEsMzF9KTsvZ2k7XG52YXIgVU5FU0NBUEVfQUxMX1JFID0gbmV3IFJlZ0V4cChVTkVTQ0FQRV9NRF9SRS5zb3VyY2UgKyAnfCcgKyBFTlRJVFlfUkUuc291cmNlLCAnZ2knKTtcblxudmFyIERJR0lUQUxfRU5USVRZX1RFU1RfUkUgPSAvXiMoKD86eFthLWYwLTldezEsOH18WzAtOV17MSw4fSkpL2k7XG5cbnZhciBlbnRpdGllcyA9IHJlcXVpcmUoJy4vZW50aXRpZXMnKTtcblxuZnVuY3Rpb24gcmVwbGFjZUVudGl0eVBhdHRlcm4obWF0Y2gsIG5hbWUpIHtcbiAgdmFyIGNvZGUgPSAwO1xuXG4gIGlmIChoYXMoZW50aXRpZXMsIG5hbWUpKSB7XG4gICAgcmV0dXJuIGVudGl0aWVzW25hbWVdO1xuICB9XG5cbiAgaWYgKG5hbWUuY2hhckNvZGVBdCgwKSA9PT0gMHgyMy8qICMgKi8gJiYgRElHSVRBTF9FTlRJVFlfVEVTVF9SRS50ZXN0KG5hbWUpKSB7XG4gICAgY29kZSA9IG5hbWVbMV0udG9Mb3dlckNhc2UoKSA9PT0gJ3gnID9cbiAgICAgIHBhcnNlSW50KG5hbWUuc2xpY2UoMiksIDE2KVxuICAgIDpcbiAgICAgIHBhcnNlSW50KG5hbWUuc2xpY2UoMSksIDEwKTtcbiAgICBpZiAoaXNWYWxpZEVudGl0eUNvZGUoY29kZSkpIHtcbiAgICAgIHJldHVybiBmcm9tQ29kZVBvaW50KGNvZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtYXRjaDtcbn1cblxuLypmdW5jdGlvbiByZXBsYWNlRW50aXRpZXMoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignJicpIDwgMCkgeyByZXR1cm4gc3RyOyB9XG5cbiAgcmV0dXJuIHN0ci5yZXBsYWNlKEVOVElUWV9SRSwgcmVwbGFjZUVudGl0eVBhdHRlcm4pO1xufSovXG5cbmZ1bmN0aW9uIHVuZXNjYXBlTWQoc3RyKSB7XG4gIGlmIChzdHIuaW5kZXhPZignXFxcXCcpIDwgMCkgeyByZXR1cm4gc3RyOyB9XG4gIHJldHVybiBzdHIucmVwbGFjZShVTkVTQ0FQRV9NRF9SRSwgJyQxJyk7XG59XG5cbmZ1bmN0aW9uIHVuZXNjYXBlQWxsKHN0cikge1xuICBpZiAoc3RyLmluZGV4T2YoJ1xcXFwnKSA8IDAgJiYgc3RyLmluZGV4T2YoJyYnKSA8IDApIHsgcmV0dXJuIHN0cjsgfVxuXG4gIHJldHVybiBzdHIucmVwbGFjZShVTkVTQ0FQRV9BTExfUkUsIGZ1bmN0aW9uIChtYXRjaCwgZXNjYXBlZCwgZW50aXR5KSB7XG4gICAgaWYgKGVzY2FwZWQpIHsgcmV0dXJuIGVzY2FwZWQ7IH1cbiAgICByZXR1cm4gcmVwbGFjZUVudGl0eVBhdHRlcm4obWF0Y2gsIGVudGl0eSk7XG4gIH0pO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG52YXIgSFRNTF9FU0NBUEVfVEVTVF9SRSA9IC9bJjw+XCJdLztcbnZhciBIVE1MX0VTQ0FQRV9SRVBMQUNFX1JFID0gL1smPD5cIl0vZztcbnZhciBIVE1MX1JFUExBQ0VNRU5UUyA9IHtcbiAgJyYnOiAnJmFtcDsnLFxuICAnPCc6ICcmbHQ7JyxcbiAgJz4nOiAnJmd0OycsXG4gICdcIic6ICcmcXVvdDsnXG59O1xuXG5mdW5jdGlvbiByZXBsYWNlVW5zYWZlQ2hhcihjaCkge1xuICByZXR1cm4gSFRNTF9SRVBMQUNFTUVOVFNbY2hdO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVIdG1sKHN0cikge1xuICBpZiAoSFRNTF9FU0NBUEVfVEVTVF9SRS50ZXN0KHN0cikpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoSFRNTF9FU0NBUEVfUkVQTEFDRV9SRSwgcmVwbGFjZVVuc2FmZUNoYXIpO1xuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnZhciBSRUdFWFBfRVNDQVBFX1JFID0gL1suPyorXiRbXFxdXFxcXCgpe318LV0vZztcblxuZnVuY3Rpb24gZXNjYXBlUkUoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZShSRUdFWFBfRVNDQVBFX1JFLCAnXFxcXCQmJyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmZ1bmN0aW9uIGlzU3BhY2UoY29kZSkge1xuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDk6XG4gICAgY2FzZSAweDIwOlxuICAgICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBacyAodW5pY29kZSBjbGFzcykgfHwgW1xcdFxcZlxcdlxcclxcbl1cbmZ1bmN0aW9uIGlzV2hpdGVTcGFjZShjb2RlKSB7XG4gIGlmIChjb2RlID49IDB4MjAwMCAmJiBjb2RlIDw9IDB4MjAwQSkgeyByZXR1cm4gdHJ1ZTsgfVxuICBzd2l0Y2ggKGNvZGUpIHtcbiAgICBjYXNlIDB4MDk6IC8vIFxcdFxuICAgIGNhc2UgMHgwQTogLy8gXFxuXG4gICAgY2FzZSAweDBCOiAvLyBcXHZcbiAgICBjYXNlIDB4MEM6IC8vIFxcZlxuICAgIGNhc2UgMHgwRDogLy8gXFxyXG4gICAgY2FzZSAweDIwOlxuICAgIGNhc2UgMHhBMDpcbiAgICBjYXNlIDB4MTY4MDpcbiAgICBjYXNlIDB4MjAyRjpcbiAgICBjYXNlIDB4MjA1RjpcbiAgICBjYXNlIDB4MzAwMDpcbiAgICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyplc2xpbnQtZGlzYWJsZSBtYXgtbGVuKi9cbnZhciBVTklDT0RFX1BVTkNUX1JFID0gcmVxdWlyZSgndWMubWljcm8vY2F0ZWdvcmllcy9QL3JlZ2V4Jyk7XG5cbi8vIEN1cnJlbnRseSB3aXRob3V0IGFzdHJhbCBjaGFyYWN0ZXJzIHN1cHBvcnQuXG5mdW5jdGlvbiBpc1B1bmN0Q2hhcihjaCkge1xuICByZXR1cm4gVU5JQ09ERV9QVU5DVF9SRS50ZXN0KGNoKTtcbn1cblxuXG4vLyBNYXJrZG93biBBU0NJSSBwdW5jdHVhdGlvbiBjaGFyYWN0ZXJzLlxuLy9cbi8vICEsIFwiLCAjLCAkLCAlLCAmLCAnLCAoLCApLCAqLCArLCAsLCAtLCAuLCAvLCA6LCA7LCA8LCA9LCA+LCA/LCBALCBbLCBcXCwgXSwgXiwgXywgYCwgeywgfCwgfSwgb3IgflxuLy8gaHR0cDovL3NwZWMuY29tbW9ubWFyay5vcmcvMC4xNS8jYXNjaWktcHVuY3R1YXRpb24tY2hhcmFjdGVyXG4vL1xuLy8gRG9uJ3QgY29uZnVzZSB3aXRoIHVuaWNvZGUgcHVuY3R1YXRpb24gISEhIEl0IGxhY2tzIHNvbWUgY2hhcnMgaW4gYXNjaWkgcmFuZ2UuXG4vL1xuZnVuY3Rpb24gaXNNZEFzY2lpUHVuY3QoY2gpIHtcbiAgc3dpdGNoIChjaCkge1xuICAgIGNhc2UgMHgyMS8qICEgKi86XG4gICAgY2FzZSAweDIyLyogXCIgKi86XG4gICAgY2FzZSAweDIzLyogIyAqLzpcbiAgICBjYXNlIDB4MjQvKiAkICovOlxuICAgIGNhc2UgMHgyNS8qICUgKi86XG4gICAgY2FzZSAweDI2LyogJiAqLzpcbiAgICBjYXNlIDB4MjcvKiAnICovOlxuICAgIGNhc2UgMHgyOC8qICggKi86XG4gICAgY2FzZSAweDI5LyogKSAqLzpcbiAgICBjYXNlIDB4MkEvKiAqICovOlxuICAgIGNhc2UgMHgyQi8qICsgKi86XG4gICAgY2FzZSAweDJDLyogLCAqLzpcbiAgICBjYXNlIDB4MkQvKiAtICovOlxuICAgIGNhc2UgMHgyRS8qIC4gKi86XG4gICAgY2FzZSAweDJGLyogLyAqLzpcbiAgICBjYXNlIDB4M0EvKiA6ICovOlxuICAgIGNhc2UgMHgzQi8qIDsgKi86XG4gICAgY2FzZSAweDNDLyogPCAqLzpcbiAgICBjYXNlIDB4M0QvKiA9ICovOlxuICAgIGNhc2UgMHgzRS8qID4gKi86XG4gICAgY2FzZSAweDNGLyogPyAqLzpcbiAgICBjYXNlIDB4NDAvKiBAICovOlxuICAgIGNhc2UgMHg1Qi8qIFsgKi86XG4gICAgY2FzZSAweDVDLyogXFwgKi86XG4gICAgY2FzZSAweDVELyogXSAqLzpcbiAgICBjYXNlIDB4NUUvKiBeICovOlxuICAgIGNhc2UgMHg1Ri8qIF8gKi86XG4gICAgY2FzZSAweDYwLyogYCAqLzpcbiAgICBjYXNlIDB4N0IvKiB7ICovOlxuICAgIGNhc2UgMHg3Qy8qIHwgKi86XG4gICAgY2FzZSAweDdELyogfSAqLzpcbiAgICBjYXNlIDB4N0UvKiB+ICovOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vLyBIZXBsZXIgdG8gdW5pZnkgW3JlZmVyZW5jZSBsYWJlbHNdLlxuLy9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlZmVyZW5jZShzdHIpIHtcbiAgLy8gdXNlIC50b1VwcGVyQ2FzZSgpIGluc3RlYWQgb2YgLnRvTG93ZXJDYXNlKClcbiAgLy8gaGVyZSB0byBhdm9pZCBhIGNvbmZsaWN0IHdpdGggT2JqZWN0LnByb3RvdHlwZVxuICAvLyBtZW1iZXJzIChtb3N0IG5vdGFibHksIGBfX3Byb3RvX19gKVxuICByZXR1cm4gc3RyLnRyaW0oKS5yZXBsYWNlKC9cXHMrL2csICcgJykudG9VcHBlckNhc2UoKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gUmUtZXhwb3J0IGxpYnJhcmllcyBjb21tb25seSB1c2VkIGluIGJvdGggbWFya2Rvd24taXQgYW5kIGl0cyBwbHVnaW5zLFxuLy8gc28gcGx1Z2lucyB3b24ndCBoYXZlIHRvIGRlcGVuZCBvbiB0aGVtIGV4cGxpY2l0bHksIHdoaWNoIHJlZHVjZXMgdGhlaXJcbi8vIGJ1bmRsZWQgc2l6ZSAoZS5nLiBhIGJyb3dzZXIgYnVpbGQpLlxuLy9cbmV4cG9ydHMubGliICAgICAgICAgICAgICAgICA9IHt9O1xuZXhwb3J0cy5saWIubWR1cmwgICAgICAgICAgID0gcmVxdWlyZSgnbWR1cmwnKTtcbmV4cG9ydHMubGliLnVjbWljcm8gICAgICAgICA9IHJlcXVpcmUoJ3VjLm1pY3JvJyk7XG5cbmV4cG9ydHMuYXNzaWduICAgICAgICAgICAgICA9IGFzc2lnbjtcbmV4cG9ydHMuaXNTdHJpbmcgICAgICAgICAgICA9IGlzU3RyaW5nO1xuZXhwb3J0cy5oYXMgICAgICAgICAgICAgICAgID0gaGFzO1xuZXhwb3J0cy51bmVzY2FwZU1kICAgICAgICAgID0gdW5lc2NhcGVNZDtcbmV4cG9ydHMudW5lc2NhcGVBbGwgICAgICAgICA9IHVuZXNjYXBlQWxsO1xuZXhwb3J0cy5pc1ZhbGlkRW50aXR5Q29kZSAgID0gaXNWYWxpZEVudGl0eUNvZGU7XG5leHBvcnRzLmZyb21Db2RlUG9pbnQgICAgICAgPSBmcm9tQ29kZVBvaW50O1xuLy8gZXhwb3J0cy5yZXBsYWNlRW50aXRpZXMgICAgID0gcmVwbGFjZUVudGl0aWVzO1xuZXhwb3J0cy5lc2NhcGVIdG1sICAgICAgICAgID0gZXNjYXBlSHRtbDtcbmV4cG9ydHMuYXJyYXlSZXBsYWNlQXQgICAgICA9IGFycmF5UmVwbGFjZUF0O1xuZXhwb3J0cy5pc1NwYWNlICAgICAgICAgICAgID0gaXNTcGFjZTtcbmV4cG9ydHMuaXNXaGl0ZVNwYWNlICAgICAgICA9IGlzV2hpdGVTcGFjZTtcbmV4cG9ydHMuaXNNZEFzY2lpUHVuY3QgICAgICA9IGlzTWRBc2NpaVB1bmN0O1xuZXhwb3J0cy5pc1B1bmN0Q2hhciAgICAgICAgID0gaXNQdW5jdENoYXI7XG5leHBvcnRzLmVzY2FwZVJFICAgICAgICAgICAgPSBlc2NhcGVSRTtcbmV4cG9ydHMubm9ybWFsaXplUmVmZXJlbmNlICA9IG5vcm1hbGl6ZVJlZmVyZW5jZTtcbiIsIi8vIEp1c3QgYSBzaG9ydGN1dCBmb3IgYnVsayBleHBvcnRcbid1c2Ugc3RyaWN0JztcblxuXG5leHBvcnRzLnBhcnNlTGlua0xhYmVsICAgICAgID0gcmVxdWlyZSgnLi9wYXJzZV9saW5rX2xhYmVsJyk7XG5leHBvcnRzLnBhcnNlTGlua0Rlc3RpbmF0aW9uID0gcmVxdWlyZSgnLi9wYXJzZV9saW5rX2Rlc3RpbmF0aW9uJyk7XG5leHBvcnRzLnBhcnNlTGlua1RpdGxlICAgICAgID0gcmVxdWlyZSgnLi9wYXJzZV9saW5rX3RpdGxlJyk7XG4iLCIvLyBQYXJzZSBsaW5rIGRlc3RpbmF0aW9uXG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBpc1NwYWNlICAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG52YXIgdW5lc2NhcGVBbGwgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS51bmVzY2FwZUFsbDtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhcnNlTGlua0Rlc3RpbmF0aW9uKHN0ciwgcG9zLCBtYXgpIHtcbiAgdmFyIGNvZGUsIGxldmVsLFxuICAgICAgbGluZXMgPSAwLFxuICAgICAgc3RhcnQgPSBwb3MsXG4gICAgICByZXN1bHQgPSB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgcG9zOiAwLFxuICAgICAgICBsaW5lczogMCxcbiAgICAgICAgc3RyOiAnJ1xuICAgICAgfTtcblxuICBpZiAoc3RyLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgzQyAvKiA8ICovKSB7XG4gICAgcG9zKys7XG4gICAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgICAgY29kZSA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICBpZiAoY29kZSA9PT0gMHgwQSAvKiBcXG4gKi8gfHwgaXNTcGFjZShjb2RlKSkgeyByZXR1cm4gcmVzdWx0OyB9XG4gICAgICBpZiAoY29kZSA9PT0gMHgzRSAvKiA+ICovKSB7XG4gICAgICAgIHJlc3VsdC5wb3MgPSBwb3MgKyAxO1xuICAgICAgICByZXN1bHQuc3RyID0gdW5lc2NhcGVBbGwoc3RyLnNsaWNlKHN0YXJ0ICsgMSwgcG9zKSk7XG4gICAgICAgIHJlc3VsdC5vayA9IHRydWU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gMHg1QyAvKiBcXCAqLyAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgICAgIHBvcyArPSAyO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgcG9zKys7XG4gICAgfVxuXG4gICAgLy8gbm8gY2xvc2luZyAnPidcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gdGhpcyBzaG91bGQgYmUgLi4uIH0gZWxzZSB7IC4uLiBicmFuY2hcblxuICBsZXZlbCA9IDA7XG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmIChjb2RlID09PSAweDIwKSB7IGJyZWFrOyB9XG5cbiAgICAvLyBhc2NpaSBjb250cm9sIGNoYXJhY3RlcnNcbiAgICBpZiAoY29kZSA8IDB4MjAgfHwgY29kZSA9PT0gMHg3RikgeyBicmVhazsgfVxuXG4gICAgaWYgKGNvZGUgPT09IDB4NUMgLyogXFwgKi8gJiYgcG9zICsgMSA8IG1heCkge1xuICAgICAgcG9zICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoY29kZSA9PT0gMHgyOCAvKiAoICovKSB7XG4gICAgICBsZXZlbCsrO1xuICAgIH1cblxuICAgIGlmIChjb2RlID09PSAweDI5IC8qICkgKi8pIHtcbiAgICAgIGlmIChsZXZlbCA9PT0gMCkgeyBicmVhazsgfVxuICAgICAgbGV2ZWwtLTtcbiAgICB9XG5cbiAgICBwb3MrKztcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gcG9zKSB7IHJldHVybiByZXN1bHQ7IH1cbiAgaWYgKGxldmVsICE9PSAwKSB7IHJldHVybiByZXN1bHQ7IH1cblxuICByZXN1bHQuc3RyID0gdW5lc2NhcGVBbGwoc3RyLnNsaWNlKHN0YXJ0LCBwb3MpKTtcbiAgcmVzdWx0LmxpbmVzID0gbGluZXM7XG4gIHJlc3VsdC5wb3MgPSBwb3M7XG4gIHJlc3VsdC5vayA9IHRydWU7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiLy8gUGFyc2UgbGluayBsYWJlbFxuLy9cbi8vIHRoaXMgZnVuY3Rpb24gYXNzdW1lcyB0aGF0IGZpcnN0IGNoYXJhY3RlciAoXCJbXCIpIGFscmVhZHkgbWF0Y2hlcztcbi8vIHJldHVybnMgdGhlIGVuZCBvZiB0aGUgbGFiZWxcbi8vXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2VMaW5rTGFiZWwoc3RhdGUsIHN0YXJ0LCBkaXNhYmxlTmVzdGVkKSB7XG4gIHZhciBsZXZlbCwgZm91bmQsIG1hcmtlciwgcHJldlBvcyxcbiAgICAgIGxhYmVsRW5kID0gLTEsXG4gICAgICBtYXggPSBzdGF0ZS5wb3NNYXgsXG4gICAgICBvbGRQb3MgPSBzdGF0ZS5wb3M7XG5cbiAgc3RhdGUucG9zID0gc3RhcnQgKyAxO1xuICBsZXZlbCA9IDE7XG5cbiAgd2hpbGUgKHN0YXRlLnBvcyA8IG1heCkge1xuICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyk7XG4gICAgaWYgKG1hcmtlciA9PT0gMHg1RCAvKiBdICovKSB7XG4gICAgICBsZXZlbC0tO1xuICAgICAgaWYgKGxldmVsID09PSAwKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJldlBvcyA9IHN0YXRlLnBvcztcbiAgICBzdGF0ZS5tZC5pbmxpbmUuc2tpcFRva2VuKHN0YXRlKTtcbiAgICBpZiAobWFya2VyID09PSAweDVCIC8qIFsgKi8pIHtcbiAgICAgIGlmIChwcmV2UG9zID09PSBzdGF0ZS5wb3MgLSAxKSB7XG4gICAgICAgIC8vIGluY3JlYXNlIGxldmVsIGlmIHdlIGZpbmQgdGV4dCBgW2AsIHdoaWNoIGlzIG5vdCBhIHBhcnQgb2YgYW55IHRva2VuXG4gICAgICAgIGxldmVsKys7XG4gICAgICB9IGVsc2UgaWYgKGRpc2FibGVOZXN0ZWQpIHtcbiAgICAgICAgc3RhdGUucG9zID0gb2xkUG9zO1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGZvdW5kKSB7XG4gICAgbGFiZWxFbmQgPSBzdGF0ZS5wb3M7XG4gIH1cblxuICAvLyByZXN0b3JlIG9sZCBzdGF0ZVxuICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG5cbiAgcmV0dXJuIGxhYmVsRW5kO1xufTtcbiIsIi8vIFBhcnNlIGxpbmsgdGl0bGVcbi8vXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIHVuZXNjYXBlQWxsID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykudW5lc2NhcGVBbGw7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZUxpbmtUaXRsZShzdHIsIHBvcywgbWF4KSB7XG4gIHZhciBjb2RlLFxuICAgICAgbWFya2VyLFxuICAgICAgbGluZXMgPSAwLFxuICAgICAgc3RhcnQgPSBwb3MsXG4gICAgICByZXN1bHQgPSB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgcG9zOiAwLFxuICAgICAgICBsaW5lczogMCxcbiAgICAgICAgc3RyOiAnJ1xuICAgICAgfTtcblxuICBpZiAocG9zID49IG1heCkgeyByZXR1cm4gcmVzdWx0OyB9XG5cbiAgbWFya2VyID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcblxuICBpZiAobWFya2VyICE9PSAweDIyIC8qIFwiICovICYmIG1hcmtlciAhPT0gMHgyNyAvKiAnICovICYmIG1hcmtlciAhPT0gMHgyOCAvKiAoICovKSB7IHJldHVybiByZXN1bHQ7IH1cblxuICBwb3MrKztcblxuICAvLyBpZiBvcGVuaW5nIG1hcmtlciBpcyBcIihcIiwgc3dpdGNoIGl0IHRvIGNsb3NpbmcgbWFya2VyIFwiKVwiXG4gIGlmIChtYXJrZXIgPT09IDB4MjgpIHsgbWFya2VyID0gMHgyOTsgfVxuXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjb2RlID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY29kZSA9PT0gbWFya2VyKSB7XG4gICAgICByZXN1bHQucG9zID0gcG9zICsgMTtcbiAgICAgIHJlc3VsdC5saW5lcyA9IGxpbmVzO1xuICAgICAgcmVzdWx0LnN0ciA9IHVuZXNjYXBlQWxsKHN0ci5zbGljZShzdGFydCArIDEsIHBvcykpO1xuICAgICAgcmVzdWx0Lm9rID0gdHJ1ZTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIGlmIChjb2RlID09PSAweDBBKSB7XG4gICAgICBsaW5lcysrO1xuICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gMHg1QyAvKiBcXCAqLyAmJiBwb3MgKyAxIDwgbWF4KSB7XG4gICAgICBwb3MrKztcbiAgICAgIGlmIChzdHIuY2hhckNvZGVBdChwb3MpID09PSAweDBBKSB7XG4gICAgICAgIGxpbmVzKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcG9zKys7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcbiIsIi8vIE1haW4gcGFyc2VyIGNsYXNzXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgdXRpbHMgICAgICAgID0gcmVxdWlyZSgnLi9jb21tb24vdXRpbHMnKTtcbnZhciBoZWxwZXJzICAgICAgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcbnZhciBSZW5kZXJlciAgICAgPSByZXF1aXJlKCcuL3JlbmRlcmVyJyk7XG52YXIgUGFyc2VyQ29yZSAgID0gcmVxdWlyZSgnLi9wYXJzZXJfY29yZScpO1xudmFyIFBhcnNlckJsb2NrICA9IHJlcXVpcmUoJy4vcGFyc2VyX2Jsb2NrJyk7XG52YXIgUGFyc2VySW5saW5lID0gcmVxdWlyZSgnLi9wYXJzZXJfaW5saW5lJyk7XG52YXIgTGlua2lmeUl0ICAgID0gcmVxdWlyZSgnbGlua2lmeS1pdCcpO1xudmFyIG1kdXJsICAgICAgICA9IHJlcXVpcmUoJ21kdXJsJyk7XG52YXIgcHVueWNvZGUgICAgID0gcmVxdWlyZSgncHVueWNvZGUnKTtcblxuXG52YXIgY29uZmlnID0ge1xuICAnZGVmYXVsdCc6IHJlcXVpcmUoJy4vcHJlc2V0cy9kZWZhdWx0JyksXG4gIHplcm86IHJlcXVpcmUoJy4vcHJlc2V0cy96ZXJvJyksXG4gIGNvbW1vbm1hcms6IHJlcXVpcmUoJy4vcHJlc2V0cy9jb21tb25tYXJrJylcbn07XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL1xuLy8gVGhpcyB2YWxpZGF0b3IgY2FuIHByb2hpYml0IG1vcmUgdGhhbiByZWFsbHkgbmVlZGVkIHRvIHByZXZlbnQgWFNTLiBJdCdzIGFcbi8vIHRyYWRlb2ZmIHRvIGtlZXAgY29kZSBzaW1wbGUgYW5kIHRvIGJlIHNlY3VyZSBieSBkZWZhdWx0LlxuLy9cbi8vIElmIHlvdSBuZWVkIGRpZmZlcmVudCBzZXR1cCAtIG92ZXJyaWRlIHZhbGlkYXRvciBtZXRob2QgYXMgeW91IHdpc2guIE9yXG4vLyByZXBsYWNlIGl0IHdpdGggZHVtbXkgZnVuY3Rpb24gYW5kIHVzZSBleHRlcm5hbCBzYW5pdGl6ZXIuXG4vL1xuXG52YXIgQkFEX1BST1RPX1JFID0gL14odmJzY3JpcHR8amF2YXNjcmlwdHxmaWxlfGRhdGEpOi87XG52YXIgR09PRF9EQVRBX1JFID0gL15kYXRhOmltYWdlXFwvKGdpZnxwbmd8anBlZ3x3ZWJwKTsvO1xuXG5mdW5jdGlvbiB2YWxpZGF0ZUxpbmsodXJsKSB7XG4gIC8vIHVybCBzaG91bGQgYmUgbm9ybWFsaXplZCBhdCB0aGlzIHBvaW50LCBhbmQgZXhpc3RpbmcgZW50aXRpZXMgYXJlIGRlY29kZWRcbiAgdmFyIHN0ciA9IHVybC50cmltKCkudG9Mb3dlckNhc2UoKTtcblxuICByZXR1cm4gQkFEX1BST1RPX1JFLnRlc3Qoc3RyKSA/IChHT09EX0RBVEFfUkUudGVzdChzdHIpID8gdHJ1ZSA6IGZhbHNlKSA6IHRydWU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxudmFyIFJFQ09ERV9IT1NUTkFNRV9GT1IgPSBbICdodHRwOicsICdodHRwczonLCAnbWFpbHRvOicgXTtcblxuZnVuY3Rpb24gbm9ybWFsaXplTGluayh1cmwpIHtcbiAgdmFyIHBhcnNlZCA9IG1kdXJsLnBhcnNlKHVybCwgdHJ1ZSk7XG5cbiAgaWYgKHBhcnNlZC5ob3N0bmFtZSkge1xuICAgIC8vIEVuY29kZSBob3N0bmFtZXMgaW4gdXJscyBsaWtlOlxuICAgIC8vIGBodHRwOi8vaG9zdC9gLCBgaHR0cHM6Ly9ob3N0L2AsIGBtYWlsdG86dXNlckBob3N0YCwgYC8vaG9zdC9gXG4gICAgLy9cbiAgICAvLyBXZSBkb24ndCBlbmNvZGUgdW5rbm93biBzY2hlbWFzLCBiZWNhdXNlIGl0J3MgbGlrZWx5IHRoYXQgd2UgZW5jb2RlXG4gICAgLy8gc29tZXRoaW5nIHdlIHNob3VsZG4ndCAoZS5nLiBgc2t5cGU6bmFtZWAgdHJlYXRlZCBhcyBgc2t5cGU6aG9zdGApXG4gICAgLy9cbiAgICBpZiAoIXBhcnNlZC5wcm90b2NvbCB8fCBSRUNPREVfSE9TVE5BTUVfRk9SLmluZGV4T2YocGFyc2VkLnByb3RvY29sKSA+PSAwKSB7XG4gICAgICB0cnkge1xuICAgICAgICBwYXJzZWQuaG9zdG5hbWUgPSBwdW55Y29kZS50b0FTQ0lJKHBhcnNlZC5ob3N0bmFtZSk7XG4gICAgICB9IGNhdGNoIChlcikgeyAvKiovIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWR1cmwuZW5jb2RlKG1kdXJsLmZvcm1hdChwYXJzZWQpKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTGlua1RleHQodXJsKSB7XG4gIHZhciBwYXJzZWQgPSBtZHVybC5wYXJzZSh1cmwsIHRydWUpO1xuXG4gIGlmIChwYXJzZWQuaG9zdG5hbWUpIHtcbiAgICAvLyBFbmNvZGUgaG9zdG5hbWVzIGluIHVybHMgbGlrZTpcbiAgICAvLyBgaHR0cDovL2hvc3QvYCwgYGh0dHBzOi8vaG9zdC9gLCBgbWFpbHRvOnVzZXJAaG9zdGAsIGAvL2hvc3QvYFxuICAgIC8vXG4gICAgLy8gV2UgZG9uJ3QgZW5jb2RlIHVua25vd24gc2NoZW1hcywgYmVjYXVzZSBpdCdzIGxpa2VseSB0aGF0IHdlIGVuY29kZVxuICAgIC8vIHNvbWV0aGluZyB3ZSBzaG91bGRuJ3QgKGUuZy4gYHNreXBlOm5hbWVgIHRyZWF0ZWQgYXMgYHNreXBlOmhvc3RgKVxuICAgIC8vXG4gICAgaWYgKCFwYXJzZWQucHJvdG9jb2wgfHwgUkVDT0RFX0hPU1ROQU1FX0ZPUi5pbmRleE9mKHBhcnNlZC5wcm90b2NvbCkgPj0gMCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcGFyc2VkLmhvc3RuYW1lID0gcHVueWNvZGUudG9Vbmljb2RlKHBhcnNlZC5ob3N0bmFtZSk7XG4gICAgICB9IGNhdGNoIChlcikgeyAvKiovIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbWR1cmwuZGVjb2RlKG1kdXJsLmZvcm1hdChwYXJzZWQpKTtcbn1cblxuXG4vKipcbiAqIGNsYXNzIE1hcmtkb3duSXRcbiAqXG4gKiBNYWluIHBhcnNlci9yZW5kZXJlciBjbGFzcy5cbiAqXG4gKiAjIyMjIyBVc2FnZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIC8vIG5vZGUuanMsIFwiY2xhc3NpY1wiIHdheTpcbiAqIHZhciBNYXJrZG93bkl0ID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSxcbiAqICAgICBtZCA9IG5ldyBNYXJrZG93bkl0KCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqXG4gKiAvLyBub2RlLmpzLCB0aGUgc2FtZSwgYnV0IHdpdGggc3VnYXI6XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqXG4gKiAvLyBicm93c2VyIHdpdGhvdXQgQU1ELCBhZGRlZCB0byBcIndpbmRvd1wiIG9uIHNjcmlwdCBsb2FkXG4gKiAvLyBOb3RlLCB0aGVyZSBhcmUgbm8gZGFzaC5cbiAqIHZhciBtZCA9IHdpbmRvdy5tYXJrZG93bml0KCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVyKCcjIG1hcmtkb3duLWl0IHJ1bGV6eiEnKTtcbiAqIGBgYFxuICpcbiAqIFNpbmdsZSBsaW5lIHJlbmRlcmluZywgd2l0aG91dCBwYXJhZ3JhcGggd3JhcDpcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gKiB2YXIgcmVzdWx0ID0gbWQucmVuZGVySW5saW5lKCdfX21hcmtkb3duLWl0X18gcnVsZXp6IScpO1xuICogYGBgXG4gKiovXG5cbi8qKlxuICogbmV3IE1hcmtkb3duSXQoW3ByZXNldE5hbWUsIG9wdGlvbnNdKVxuICogLSBwcmVzZXROYW1lIChTdHJpbmcpOiBvcHRpb25hbCwgYGNvbW1vbm1hcmtgIC8gYHplcm9gXG4gKiAtIG9wdGlvbnMgKE9iamVjdClcbiAqXG4gKiBDcmVhdGVzIHBhcnNlciBpbnN0YW5zZSB3aXRoIGdpdmVuIGNvbmZpZy4gQ2FuIGJlIGNhbGxlZCB3aXRob3V0IGBuZXdgLlxuICpcbiAqICMjIyMjIHByZXNldE5hbWVcbiAqXG4gKiBNYXJrZG93bkl0IHByb3ZpZGVzIG5hbWVkIHByZXNldHMgYXMgYSBjb252ZW5pZW5jZSB0byBxdWlja2x5XG4gKiBlbmFibGUvZGlzYWJsZSBhY3RpdmUgc3ludGF4IHJ1bGVzIGFuZCBvcHRpb25zIGZvciBjb21tb24gdXNlIGNhc2VzLlxuICpcbiAqIC0gW1wiY29tbW9ubWFya1wiXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvY29tbW9ubWFyay5qcykgLVxuICogICBjb25maWd1cmVzIHBhcnNlciB0byBzdHJpY3QgW0NvbW1vbk1hcmtdKGh0dHA6Ly9jb21tb25tYXJrLm9yZy8pIG1vZGUuXG4gKiAtIFtkZWZhdWx0XShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvZGVmYXVsdC5qcykgLVxuICogICBzaW1pbGFyIHRvIEdGTSwgdXNlZCB3aGVuIG5vIHByZXNldCBuYW1lIGdpdmVuLiBFbmFibGVzIGFsbCBhdmFpbGFibGUgcnVsZXMsXG4gKiAgIGJ1dCBzdGlsbCB3aXRob3V0IGh0bWwsIHR5cG9ncmFwaGVyICYgYXV0b2xpbmtlci5cbiAqIC0gW1wiemVyb1wiXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvYmxvYi9tYXN0ZXIvbGliL3ByZXNldHMvemVyby5qcykgLVxuICogICBhbGwgcnVsZXMgZGlzYWJsZWQuIFVzZWZ1bCB0byBxdWlja2x5IHNldHVwIHlvdXIgY29uZmlnIHZpYSBgLmVuYWJsZSgpYC5cbiAqICAgRm9yIGV4YW1wbGUsIHdoZW4geW91IG5lZWQgb25seSBgYm9sZGAgYW5kIGBpdGFsaWNgIG1hcmt1cCBhbmQgbm90aGluZyBlbHNlLlxuICpcbiAqICMjIyMjIG9wdGlvbnM6XG4gKlxuICogLSBfX2h0bWxfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gZW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2UuIEJlIGNhcmVmdWwhXG4gKiAgIFRoYXQncyBub3Qgc2FmZSEgWW91IG1heSBuZWVkIGV4dGVybmFsIHNhbml0aXplciB0byBwcm90ZWN0IG91dHB1dCBmcm9tIFhTUy5cbiAqICAgSXQncyBiZXR0ZXIgdG8gZXh0ZW5kIGZlYXR1cmVzIHZpYSBwbHVnaW5zLCBpbnN0ZWFkIG9mIGVuYWJsaW5nIEhUTUwuXG4gKiAtIF9feGh0bWxPdXRfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gYWRkICcvJyB3aGVuIGNsb3Npbmcgc2luZ2xlIHRhZ3NcbiAqICAgKGA8YnIgLz5gKS4gVGhpcyBpcyBuZWVkZWQgb25seSBmb3IgZnVsbCBDb21tb25NYXJrIGNvbXBhdGliaWxpdHkuIEluIHJlYWxcbiAqICAgd29ybGQgeW91IHdpbGwgbmVlZCBIVE1MIG91dHB1dC5cbiAqIC0gX19icmVha3NfXyAtIGBmYWxzZWAuIFNldCBgdHJ1ZWAgdG8gY29udmVydCBgXFxuYCBpbiBwYXJhZ3JhcGhzIGludG8gYDxicj5gLlxuICogLSBfX2xhbmdQcmVmaXhfXyAtIGBsYW5ndWFnZS1gLiBDU1MgbGFuZ3VhZ2UgY2xhc3MgcHJlZml4IGZvciBmZW5jZWQgYmxvY2tzLlxuICogICBDYW4gYmUgdXNlZnVsIGZvciBleHRlcm5hbCBoaWdobGlnaHRlcnMuXG4gKiAtIF9fbGlua2lmeV9fIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0IHRvIGxpbmtzLlxuICogLSBfX3R5cG9ncmFwaGVyX18gIC0gYGZhbHNlYC4gU2V0IGB0cnVlYCB0byBlbmFibGUgW3NvbWUgbGFuZ3VhZ2UtbmV1dHJhbFxuICogICByZXBsYWNlbWVudF0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9ydWxlc19jb3JlL3JlcGxhY2VtZW50cy5qcykgK1xuICogICBxdW90ZXMgYmVhdXRpZmljYXRpb24gKHNtYXJ0cXVvdGVzKS5cbiAqIC0gX19xdW90ZXNfXyAtIGDigJzigJ3igJjigJlgLCBTdHJpbmcgb3IgQXJyYXkuIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnRcbiAqICAgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCBhbmQgc21hcnRxdW90ZXMgb24uIEZvciBleGFtcGxlLCB5b3UgY2FuXG4gKiAgIHVzZSBgJ8KrwrvigJ7igJwnYCBmb3IgUnVzc2lhbiwgYCfigJ7igJzigJrigJgnYCBmb3IgR2VybWFuLCBhbmRcbiAqICAgYFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J11gIGZvciBGcmVuY2ggKGluY2x1ZGluZyBuYnNwKS5cbiAqIC0gX19oaWdobGlnaHRfXyAtIGBudWxsYC4gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24gZm9yIGZlbmNlZCBjb2RlIGJsb2Nrcy5cbiAqICAgSGlnaGxpZ2h0ZXIgYGZ1bmN0aW9uIChzdHIsIGxhbmcpYCBzaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTC4gSXQgY2FuIGFsc29cbiAqICAgcmV0dXJuIGVtcHR5IHN0cmluZyBpZiB0aGUgc291cmNlIHdhcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWRcbiAqICAgZXh0ZXJuYWx5LiBJZiByZXN1bHQgc3RhcnRzIHdpdGggPHByZS4uLiBpbnRlcm5hbCB3cmFwcGVyIGlzIHNraXBwZWQuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIC8vIGNvbW1vbm1hcmsgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgnY29tbW9ubWFyaycpO1xuICpcbiAqIC8vIGRlZmF1bHQgbW9kZVxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIC8vIGVuYWJsZSBldmVyeXRoaW5nXG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKHtcbiAqICAgaHRtbDogdHJ1ZSxcbiAqICAgbGlua2lmeTogdHJ1ZSxcbiAqICAgdHlwb2dyYXBoZXI6IHRydWVcbiAqIH0pO1xuICogYGBgXG4gKlxuICogIyMjIyMgU3ludGF4IGhpZ2hsaWdodGluZ1xuICpcbiAqIGBgYGpzXG4gKiB2YXIgaGxqcyA9IHJlcXVpcmUoJ2hpZ2hsaWdodC5qcycpIC8vIGh0dHBzOi8vaGlnaGxpZ2h0anMub3JnL1xuICpcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gaGxqcy5oaWdobGlnaHQobGFuZywgc3RyLCB0cnVlKS52YWx1ZTtcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICcnOyAvLyB1c2UgZXh0ZXJuYWwgZGVmYXVsdCBlc2NhcGluZ1xuICogICB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIE9yIHdpdGggZnVsbCB3cmFwcGVyIG92ZXJyaWRlIChpZiB5b3UgbmVlZCBhc3NpZ24gY2xhc3MgdG8gYDxwcmU+YCk6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIGhsanMgPSByZXF1aXJlKCdoaWdobGlnaHQuanMnKSAvLyBodHRwczovL2hpZ2hsaWdodGpzLm9yZy9cbiAqXG4gKiAvLyBBY3R1YWwgZGVmYXVsdCB2YWx1ZXNcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0Jykoe1xuICogICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAqICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gKiAgICAgICB0cnkge1xuICogICAgICAgICByZXR1cm4gJzxwcmUgY2xhc3M9XCJobGpzXCI+PGNvZGU+JyArXG4gKiAgICAgICAgICAgICAgICBobGpzLmhpZ2hsaWdodChsYW5nLCBzdHIsIHRydWUpLnZhbHVlICtcbiAqICAgICAgICAgICAgICAgICc8L2NvZGU+PC9wcmU+JztcbiAqICAgICAgIH0gY2F0Y2ggKF9fKSB7fVxuICogICAgIH1cbiAqXG4gKiAgICAgcmV0dXJuICc8cHJlIGNsYXNzPVwiaGxqc1wiPjxjb2RlPicgKyBtZC51dGlscy5lc2NhcGVIdG1sKHN0cikgKyAnPC9jb2RlPjwvcHJlPic7XG4gKiAgIH1cbiAqIH0pO1xuICogYGBgXG4gKlxuICoqL1xuZnVuY3Rpb24gTWFya2Rvd25JdChwcmVzZXROYW1lLCBvcHRpb25zKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBNYXJrZG93bkl0KSkge1xuICAgIHJldHVybiBuZXcgTWFya2Rvd25JdChwcmVzZXROYW1lLCBvcHRpb25zKTtcbiAgfVxuXG4gIGlmICghb3B0aW9ucykge1xuICAgIGlmICghdXRpbHMuaXNTdHJpbmcocHJlc2V0TmFtZSkpIHtcbiAgICAgIG9wdGlvbnMgPSBwcmVzZXROYW1lIHx8IHt9O1xuICAgICAgcHJlc2V0TmFtZSA9ICdkZWZhdWx0JztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTWFya2Rvd25JdCNpbmxpbmUgLT4gUGFyc2VySW5saW5lXG4gICAqXG4gICAqIEluc3RhbmNlIG9mIFtbUGFyc2VySW5saW5lXV0uIFlvdSBtYXkgbmVlZCBpdCB0byBhZGQgbmV3IHJ1bGVzIHdoZW5cbiAgICogd3JpdGluZyBwbHVnaW5zLiBGb3Igc2ltcGxlIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0gYW5kXG4gICAqIFtbTWFya2Rvd25JdC5lbmFibGVdXS5cbiAgICoqL1xuICB0aGlzLmlubGluZSA9IG5ldyBQYXJzZXJJbmxpbmUoKTtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNibG9jayAtPiBQYXJzZXJCbG9ja1xuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW1BhcnNlckJsb2NrXV0uIFlvdSBtYXkgbmVlZCBpdCB0byBhZGQgbmV3IHJ1bGVzIHdoZW5cbiAgICogd3JpdGluZyBwbHVnaW5zLiBGb3Igc2ltcGxlIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0gYW5kXG4gICAqIFtbTWFya2Rvd25JdC5lbmFibGVdXS5cbiAgICoqL1xuICB0aGlzLmJsb2NrID0gbmV3IFBhcnNlckJsb2NrKCk7XG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjY29yZSAtPiBDb3JlXG4gICAqXG4gICAqIEluc3RhbmNlIG9mIFtbQ29yZV1dIGNoYWluIGV4ZWN1dG9yLiBZb3UgbWF5IG5lZWQgaXQgdG8gYWRkIG5ldyBydWxlcyB3aGVuXG4gICAqIHdyaXRpbmcgcGx1Z2lucy4gRm9yIHNpbXBsZSBydWxlcyBjb250cm9sIHVzZSBbW01hcmtkb3duSXQuZGlzYWJsZV1dIGFuZFxuICAgKiBbW01hcmtkb3duSXQuZW5hYmxlXV0uXG4gICAqKi9cbiAgdGhpcy5jb3JlID0gbmV3IFBhcnNlckNvcmUoKTtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNyZW5kZXJlciAtPiBSZW5kZXJlclxuICAgKlxuICAgKiBJbnN0YW5jZSBvZiBbW1JlbmRlcmVyXV0uIFVzZSBpdCB0byBtb2RpZnkgb3V0cHV0IGxvb2suIE9yIHRvIGFkZCByZW5kZXJpbmdcbiAgICogcnVsZXMgZm9yIG5ldyB0b2tlbiB0eXBlcywgZ2VuZXJhdGVkIGJ5IHBsdWdpbnMuXG4gICAqXG4gICAqICMjIyMjIEV4YW1wbGVcbiAgICpcbiAgICogYGBgamF2YXNjcmlwdFxuICAgKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKCk7XG4gICAqXG4gICAqIGZ1bmN0aW9uIG15VG9rZW4odG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2VsZikge1xuICAgKiAgIC8vLi4uXG4gICAqICAgcmV0dXJuIHJlc3VsdDtcbiAgICogfTtcbiAgICpcbiAgICogbWQucmVuZGVyZXIucnVsZXNbJ215X3Rva2VuJ10gPSBteVRva2VuXG4gICAqIGBgYFxuICAgKlxuICAgKiBTZWUgW1tSZW5kZXJlcl1dIGRvY3MgYW5kIFtzb3VyY2UgY29kZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9yZW5kZXJlci5qcykuXG4gICAqKi9cbiAgdGhpcy5yZW5kZXJlciA9IG5ldyBSZW5kZXJlcigpO1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I2xpbmtpZnkgLT4gTGlua2lmeUl0XG4gICAqXG4gICAqIFtsaW5raWZ5LWl0XShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbGlua2lmeS1pdCkgaW5zdGFuY2UuXG4gICAqIFVzZWQgYnkgW2xpbmtpZnldKGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9ibG9iL21hc3Rlci9saWIvcnVsZXNfY29yZS9saW5raWZ5LmpzKVxuICAgKiBydWxlLlxuICAgKiovXG4gIHRoaXMubGlua2lmeSA9IG5ldyBMaW5raWZ5SXQoKTtcblxuICAvKipcbiAgICogTWFya2Rvd25JdCN2YWxpZGF0ZUxpbmsodXJsKSAtPiBCb29sZWFuXG4gICAqXG4gICAqIExpbmsgdmFsaWRhdGlvbiBmdW5jdGlvbi4gQ29tbW9uTWFyayBhbGxvd3MgdG9vIG11Y2ggaW4gbGlua3MuIEJ5IGRlZmF1bHRcbiAgICogd2UgZGlzYWJsZSBgamF2YXNjcmlwdDpgLCBgdmJzY3JpcHQ6YCwgYGZpbGU6YCBzY2hlbWFzLCBhbmQgYWxtb3N0IGFsbCBgZGF0YTouLi5gIHNjaGVtYXNcbiAgICogZXhjZXB0IHNvbWUgZW1iZWRkZWQgaW1hZ2UgdHlwZXMuXG4gICAqXG4gICAqIFlvdSBjYW4gY2hhbmdlIHRoaXMgYmVoYXZpb3VyOlxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAgICogLy8gZW5hYmxlIGV2ZXJ5dGhpbmdcbiAgICogbWQudmFsaWRhdGVMaW5rID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgKiBgYGBcbiAgICoqL1xuICB0aGlzLnZhbGlkYXRlTGluayA9IHZhbGlkYXRlTGluaztcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNub3JtYWxpemVMaW5rKHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZW5jb2RlIGxpbmsgdXJsIHRvIGEgbWFjaGluZS1yZWFkYWJsZSBmb3JtYXQsXG4gICAqIHdoaWNoIGluY2x1ZGVzIHVybC1lbmNvZGluZywgcHVueWNvZGUsIGV0Yy5cbiAgICoqL1xuICB0aGlzLm5vcm1hbGl6ZUxpbmsgPSBub3JtYWxpemVMaW5rO1xuXG4gIC8qKlxuICAgKiBNYXJrZG93bkl0I25vcm1hbGl6ZUxpbmtUZXh0KHVybCkgLT4gU3RyaW5nXG4gICAqXG4gICAqIEZ1bmN0aW9uIHVzZWQgdG8gZGVjb2RlIGxpbmsgdXJsIHRvIGEgaHVtYW4tcmVhZGFibGUgZm9ybWF0YFxuICAgKiovXG4gIHRoaXMubm9ybWFsaXplTGlua1RleHQgPSBub3JtYWxpemVMaW5rVGV4dDtcblxuXG4gIC8vIEV4cG9zZSB1dGlscyAmIGhlbHBlcnMgZm9yIGVhc3kgYWNjZXMgZnJvbSBwbHVnaW5zXG5cbiAgLyoqXG4gICAqIE1hcmtkb3duSXQjdXRpbHMgLT4gdXRpbHNcbiAgICpcbiAgICogQXNzb3J0ZWQgdXRpbGl0eSBmdW5jdGlvbnMsIHVzZWZ1bCB0byB3cml0ZSBwbHVnaW5zLiBTZWUgZGV0YWlsc1xuICAgKiBbaGVyZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9jb21tb24vdXRpbHMuanMpLlxuICAgKiovXG4gIHRoaXMudXRpbHMgPSB1dGlscztcblxuICAvKipcbiAgICogTWFya2Rvd25JdCNoZWxwZXJzIC0+IGhlbHBlcnNcbiAgICpcbiAgICogTGluayBjb21wb25lbnRzIHBhcnNlciBmdW5jdGlvbnMsIHVzZWZ1bCB0byB3cml0ZSBwbHVnaW5zLiBTZWUgZGV0YWlsc1xuICAgKiBbaGVyZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9oZWxwZXJzKS5cbiAgICoqL1xuICB0aGlzLmhlbHBlcnMgPSB1dGlscy5hc3NpZ24oe30sIGhlbHBlcnMpO1xuXG5cbiAgdGhpcy5vcHRpb25zID0ge307XG4gIHRoaXMuY29uZmlndXJlKHByZXNldE5hbWUpO1xuXG4gIGlmIChvcHRpb25zKSB7IHRoaXMuc2V0KG9wdGlvbnMpOyB9XG59XG5cblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC5zZXQob3B0aW9ucylcbiAqXG4gKiBTZXQgcGFyc2VyIG9wdGlvbnMgKGluIHRoZSBzYW1lIGZvcm1hdCBhcyBpbiBjb25zdHJ1Y3RvcikuIFByb2JhYmx5LCB5b3VcbiAqIHdpbGwgbmV2ZXIgbmVlZCBpdCwgYnV0IHlvdSBjYW4gY2hhbmdlIG9wdGlvbnMgYWZ0ZXIgY29uc3RydWN0b3IgY2FsbC5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAuc2V0KHsgaHRtbDogdHJ1ZSwgYnJlYWtzOiB0cnVlIH0pXG4gKiAgICAgICAgICAgICAuc2V0KHsgdHlwb2dyYXBoZXIsIHRydWUgfSk7XG4gKiBgYGBcbiAqXG4gKiBfX05vdGU6X18gVG8gYWNoaWV2ZSB0aGUgYmVzdCBwb3NzaWJsZSBwZXJmb3JtYW5jZSwgZG9uJ3QgbW9kaWZ5IGFcbiAqIGBtYXJrZG93bi1pdGAgaW5zdGFuY2Ugb3B0aW9ucyBvbiB0aGUgZmx5LiBJZiB5b3UgbmVlZCBtdWx0aXBsZSBjb25maWd1cmF0aW9uc1xuICogaXQncyBiZXN0IHRvIGNyZWF0ZSBtdWx0aXBsZSBpbnN0YW5jZXMgYW5kIGluaXRpYWxpemUgZWFjaCB3aXRoIHNlcGFyYXRlXG4gKiBjb25maWcuXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB1dGlscy5hc3NpZ24odGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKiBjaGFpbmFibGUsIGludGVybmFsXG4gKiBNYXJrZG93bkl0LmNvbmZpZ3VyZShwcmVzZXRzKVxuICpcbiAqIEJhdGNoIGxvYWQgb2YgYWxsIG9wdGlvbnMgYW5kIGNvbXBlbmVudCBzZXR0aW5ncy4gVGhpcyBpcyBpbnRlcm5hbCBtZXRob2QsXG4gKiBhbmQgeW91IHByb2JhYmx5IHdpbGwgbm90IG5lZWQgaXQuIEJ1dCBpZiB5b3Ugd2l0aCAtIHNlZSBhdmFpbGFibGUgcHJlc2V0c1xuICogYW5kIGRhdGEgc3RydWN0dXJlIFtoZXJlXShodHRwczovL2dpdGh1Yi5jb20vbWFya2Rvd24taXQvbWFya2Rvd24taXQvdHJlZS9tYXN0ZXIvbGliL3ByZXNldHMpXG4gKlxuICogV2Ugc3Ryb25nbHkgcmVjb21tZW5kIHRvIHVzZSBwcmVzZXRzIGluc3RlYWQgb2YgZGlyZWN0IGNvbmZpZyBsb2Fkcy4gVGhhdFxuICogd2lsbCBnaXZlIGJldHRlciBjb21wYXRpYmlsaXR5IHdpdGggbmV4dCB2ZXJzaW9ucy5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uIChwcmVzZXRzKSB7XG4gIHZhciBzZWxmID0gdGhpcywgcHJlc2V0TmFtZTtcblxuICBpZiAodXRpbHMuaXNTdHJpbmcocHJlc2V0cykpIHtcbiAgICBwcmVzZXROYW1lID0gcHJlc2V0cztcbiAgICBwcmVzZXRzID0gY29uZmlnW3ByZXNldE5hbWVdO1xuICAgIGlmICghcHJlc2V0cykgeyB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIGBtYXJrZG93bi1pdGAgcHJlc2V0IFwiJyArIHByZXNldE5hbWUgKyAnXCIsIGNoZWNrIG5hbWUnKTsgfVxuICB9XG5cbiAgaWYgKCFwcmVzZXRzKSB7IHRocm93IG5ldyBFcnJvcignV3JvbmcgYG1hcmtkb3duLWl0YCBwcmVzZXQsIGNhblxcJ3QgYmUgZW1wdHknKTsgfVxuXG4gIGlmIChwcmVzZXRzLm9wdGlvbnMpIHsgc2VsZi5zZXQocHJlc2V0cy5vcHRpb25zKTsgfVxuXG4gIGlmIChwcmVzZXRzLmNvbXBvbmVudHMpIHtcbiAgICBPYmplY3Qua2V5cyhwcmVzZXRzLmNvbXBvbmVudHMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIGlmIChwcmVzZXRzLmNvbXBvbmVudHNbbmFtZV0ucnVsZXMpIHtcbiAgICAgICAgc2VsZltuYW1lXS5ydWxlci5lbmFibGVPbmx5KHByZXNldHMuY29tcG9uZW50c1tuYW1lXS5ydWxlcyk7XG4gICAgICB9XG4gICAgICBpZiAocHJlc2V0cy5jb21wb25lbnRzW25hbWVdLnJ1bGVzMikge1xuICAgICAgICBzZWxmW25hbWVdLnJ1bGVyMi5lbmFibGVPbmx5KHByZXNldHMuY29tcG9uZW50c1tuYW1lXS5ydWxlczIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKiogY2hhaW5hYmxlXG4gKiBNYXJrZG93bkl0LmVuYWJsZShsaXN0LCBpZ25vcmVJbnZhbGlkKVxuICogLSBsaXN0IChTdHJpbmd8QXJyYXkpOiBydWxlIG5hbWUgb3IgbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZVxuICogLSBpZ25vcmVJbnZhbGlkIChCb29sZWFuKTogc2V0IGB0cnVlYCB0byBpZ25vcmUgZXJyb3JzIHdoZW4gcnVsZSBub3QgZm91bmQuXG4gKlxuICogRW5hYmxlIGxpc3Qgb3IgcnVsZXMuIEl0IHdpbGwgYXV0b21hdGljYWxseSBmaW5kIGFwcHJvcHJpYXRlIGNvbXBvbmVudHMsXG4gKiBjb250YWluaW5nIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMuIElmIHJ1bGUgbm90IGZvdW5kLCBhbmQgYGlnbm9yZUludmFsaWRgXG4gKiBub3Qgc2V0IC0gdGhyb3dzIGV4Y2VwdGlvbi5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpXG4gKiAgICAgICAgICAgICAuZW5hYmxlKFsnc3ViJywgJ3N1cCddKVxuICogICAgICAgICAgICAgLmRpc2FibGUoJ3NtYXJ0cXVvdGVzJyk7XG4gKiBgYGBcbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmVuYWJsZSA9IGZ1bmN0aW9uIChsaXN0LCBpZ25vcmVJbnZhbGlkKSB7XG4gIHZhciByZXN1bHQgPSBbXTtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFsgbGlzdCBdOyB9XG5cbiAgWyAnY29yZScsICdibG9jaycsICdpbmxpbmUnIF0uZm9yRWFjaChmdW5jdGlvbiAoY2hhaW4pIHtcbiAgICByZXN1bHQgPSByZXN1bHQuY29uY2F0KHRoaXNbY2hhaW5dLnJ1bGVyLmVuYWJsZShsaXN0LCB0cnVlKSk7XG4gIH0sIHRoaXMpO1xuXG4gIHJlc3VsdCA9IHJlc3VsdC5jb25jYXQodGhpcy5pbmxpbmUucnVsZXIyLmVuYWJsZShsaXN0LCB0cnVlKSk7XG5cbiAgdmFyIG1pc3NlZCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiByZXN1bHQuaW5kZXhPZihuYW1lKSA8IDA7IH0pO1xuXG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZW5hYmxlIHVua25vd24gcnVsZShzKTogJyArIG1pc3NlZCk7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqIGNoYWluYWJsZVxuICogTWFya2Rvd25JdC5kaXNhYmxlKGxpc3QsIGlnbm9yZUludmFsaWQpXG4gKiAtIGxpc3QgKFN0cmluZ3xBcnJheSk6IHJ1bGUgbmFtZSBvciBsaXN0IG9mIHJ1bGUgbmFtZXMgdG8gZGlzYWJsZS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIFRoZSBzYW1lIGFzIFtbTWFya2Rvd25JdC5lbmFibGVdXSwgYnV0IHR1cm4gc3BlY2lmaWVkIHJ1bGVzIG9mZi5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbIGxpc3QgXTsgfVxuXG4gIFsgJ2NvcmUnLCAnYmxvY2snLCAnaW5saW5lJyBdLmZvckVhY2goZnVuY3Rpb24gKGNoYWluKSB7XG4gICAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh0aGlzW2NoYWluXS5ydWxlci5kaXNhYmxlKGxpc3QsIHRydWUpKTtcbiAgfSwgdGhpcyk7XG5cbiAgcmVzdWx0ID0gcmVzdWx0LmNvbmNhdCh0aGlzLmlubGluZS5ydWxlcjIuZGlzYWJsZShsaXN0LCB0cnVlKSk7XG5cbiAgdmFyIG1pc3NlZCA9IGxpc3QuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiByZXN1bHQuaW5kZXhPZihuYW1lKSA8IDA7IH0pO1xuXG4gIGlmIChtaXNzZWQubGVuZ3RoICYmICFpZ25vcmVJbnZhbGlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdNYXJrZG93bkl0LiBGYWlsZWQgdG8gZGlzYWJsZSB1bmtub3duIHJ1bGUocyk6ICcgKyBtaXNzZWQpO1xuICB9XG4gIHJldHVybiB0aGlzO1xufTtcblxuXG4vKiogY2hhaW5hYmxlXG4gKiBNYXJrZG93bkl0LnVzZShwbHVnaW4sIHBhcmFtcylcbiAqXG4gKiBMb2FkIHNwZWNpZmllZCBwbHVnaW4gd2l0aCBnaXZlbiBwYXJhbXMgaW50byBjdXJyZW50IHBhcnNlciBpbnN0YW5jZS5cbiAqIEl0J3MganVzdCBhIHN1Z2FyIHRvIGNhbGwgYHBsdWdpbihtZCwgcGFyYW1zKWAgd2l0aCBjdXJyaW5nLlxuICpcbiAqICMjIyMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqYXZhc2NyaXB0XG4gKiB2YXIgaXRlcmF0b3IgPSByZXF1aXJlKCdtYXJrZG93bi1pdC1mb3ItaW5saW5lJyk7XG4gKiB2YXIgbWQgPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKClcbiAqICAgICAgICAgICAgIC51c2UoaXRlcmF0b3IsICdmb29fcmVwbGFjZScsICd0ZXh0JywgZnVuY3Rpb24gKHRva2VucywgaWR4KSB7XG4gKiAgICAgICAgICAgICAgIHRva2Vuc1tpZHhdLmNvbnRlbnQgPSB0b2tlbnNbaWR4XS5jb250ZW50LnJlcGxhY2UoL2Zvby9nLCAnYmFyJyk7XG4gKiAgICAgICAgICAgICB9KTtcbiAqIGBgYFxuICoqL1xuTWFya2Rvd25JdC5wcm90b3R5cGUudXNlID0gZnVuY3Rpb24gKHBsdWdpbiAvKiwgcGFyYW1zLCAuLi4gKi8pIHtcbiAgdmFyIGFyZ3MgPSBbIHRoaXMgXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gIHBsdWdpbi5hcHBseShwbHVnaW4sIGFyZ3MpO1xuICByZXR1cm4gdGhpcztcbn07XG5cblxuLyoqIGludGVybmFsXG4gKiBNYXJrZG93bkl0LnBhcnNlKHNyYywgZW52KSAtPiBBcnJheVxuICogLSBzcmMgKFN0cmluZyk6IHNvdXJjZSBzdHJpbmdcbiAqIC0gZW52IChPYmplY3QpOiBlbnZpcm9ubWVudCBzYW5kYm94XG4gKlxuICogUGFyc2UgaW5wdXQgc3RyaW5nIGFuZCByZXR1cm5zIGxpc3Qgb2YgYmxvY2sgdG9rZW5zIChzcGVjaWFsIHRva2VuIHR5cGVcbiAqIFwiaW5saW5lXCIgd2lsbCBjb250YWluIGxpc3Qgb2YgaW5saW5lIHRva2VucykuIFlvdSBzaG91bGQgbm90IGNhbGwgdGhpc1xuICogbWV0aG9kIGRpcmVjdGx5LCB1bnRpbCB5b3Ugd3JpdGUgY3VzdG9tIHJlbmRlcmVyIChmb3IgZXhhbXBsZSwgdG8gcHJvZHVjZVxuICogQVNUKS5cbiAqXG4gKiBgZW52YCBpcyB1c2VkIHRvIHBhc3MgZGF0YSBiZXR3ZWVuIFwiZGlzdHJpYnV0ZWRcIiBydWxlcyBhbmQgcmV0dXJuIGFkZGl0aW9uYWxcbiAqIG1ldGFkYXRhIGxpa2UgcmVmZXJlbmNlIGluZm8sIG5lZWRlZCBmb3IgdGhlIHJlbmRlcmVyLiBJdCBhbHNvIGNhbiBiZSB1c2VkIHRvXG4gKiBpbmplY3QgZGF0YSBpbiBzcGVjaWZpYyBjYXNlcy4gVXN1YWxseSwgeW91IHdpbGwgYmUgb2sgdG8gcGFzcyBge31gLFxuICogYW5kIHRoZW4gcGFzcyB1cGRhdGVkIG9iamVjdCB0byByZW5kZXJlci5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIGlmICh0eXBlb2Ygc3JjICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBFcnJvcignSW5wdXQgZGF0YSBzaG91bGQgYmUgYSBTdHJpbmcnKTtcbiAgfVxuXG4gIHZhciBzdGF0ZSA9IG5ldyB0aGlzLmNvcmUuU3RhdGUoc3JjLCB0aGlzLCBlbnYpO1xuXG4gIHRoaXMuY29yZS5wcm9jZXNzKHN0YXRlKTtcblxuICByZXR1cm4gc3RhdGUudG9rZW5zO1xufTtcblxuXG4vKipcbiAqIE1hcmtkb3duSXQucmVuZGVyKHNyYyBbLCBlbnZdKSAtPiBTdHJpbmdcbiAqIC0gc3JjIChTdHJpbmcpOiBzb3VyY2Ugc3RyaW5nXG4gKiAtIGVudiAoT2JqZWN0KTogZW52aXJvbm1lbnQgc2FuZGJveFxuICpcbiAqIFJlbmRlciBtYXJrZG93biBzdHJpbmcgaW50byBodG1sLiBJdCBkb2VzIGFsbCBtYWdpYyBmb3IgeW91IDopLlxuICpcbiAqIGBlbnZgIGNhbiBiZSB1c2VkIHRvIGluamVjdCBhZGRpdGlvbmFsIG1ldGFkYXRhIChge31gIGJ5IGRlZmF1bHQpLlxuICogQnV0IHlvdSB3aWxsIG5vdCBuZWVkIGl0IHdpdGggaGlnaCBwcm9iYWJpbGl0eS4gU2VlIGFsc28gY29tbWVudFxuICogaW4gW1tNYXJrZG93bkl0LnBhcnNlXV0uXG4gKiovXG5NYXJrZG93bkl0LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoc3JjLCBlbnYpIHtcbiAgZW52ID0gZW52IHx8IHt9O1xuXG4gIHJldHVybiB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLnBhcnNlKHNyYywgZW52KSwgdGhpcy5vcHRpb25zLCBlbnYpO1xufTtcblxuXG4vKiogaW50ZXJuYWxcbiAqIE1hcmtkb3duSXQucGFyc2VJbmxpbmUoc3JjLCBlbnYpIC0+IEFycmF5XG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBUaGUgc2FtZSBhcyBbW01hcmtkb3duSXQucGFyc2VdXSBidXQgc2tpcCBhbGwgYmxvY2sgcnVsZXMuIEl0IHJldHVybnMgdGhlXG4gKiBibG9jayB0b2tlbnMgbGlzdCB3aXRoIHRoZSBzaW5nbGUgYGlubGluZWAgZWxlbWVudCwgY29udGFpbmluZyBwYXJzZWQgaW5saW5lXG4gKiB0b2tlbnMgaW4gYGNoaWxkcmVuYCBwcm9wZXJ0eS4gQWxzbyB1cGRhdGVzIGBlbnZgIG9iamVjdC5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnBhcnNlSW5saW5lID0gZnVuY3Rpb24gKHNyYywgZW52KSB7XG4gIHZhciBzdGF0ZSA9IG5ldyB0aGlzLmNvcmUuU3RhdGUoc3JjLCB0aGlzLCBlbnYpO1xuXG4gIHN0YXRlLmlubGluZU1vZGUgPSB0cnVlO1xuICB0aGlzLmNvcmUucHJvY2VzcyhzdGF0ZSk7XG5cbiAgcmV0dXJuIHN0YXRlLnRva2Vucztcbn07XG5cblxuLyoqXG4gKiBNYXJrZG93bkl0LnJlbmRlcklubGluZShzcmMgWywgZW52XSkgLT4gU3RyaW5nXG4gKiAtIHNyYyAoU3RyaW5nKTogc291cmNlIHN0cmluZ1xuICogLSBlbnYgKE9iamVjdCk6IGVudmlyb25tZW50IHNhbmRib3hcbiAqXG4gKiBTaW1pbGFyIHRvIFtbTWFya2Rvd25JdC5yZW5kZXJdXSBidXQgZm9yIHNpbmdsZSBwYXJhZ3JhcGggY29udGVudC4gUmVzdWx0XG4gKiB3aWxsIE5PVCBiZSB3cmFwcGVkIGludG8gYDxwPmAgdGFncy5cbiAqKi9cbk1hcmtkb3duSXQucHJvdG90eXBlLnJlbmRlcklubGluZSA9IGZ1bmN0aW9uIChzcmMsIGVudikge1xuICBlbnYgPSBlbnYgfHwge307XG5cbiAgcmV0dXJuIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMucGFyc2VJbmxpbmUoc3JjLCBlbnYpLCB0aGlzLm9wdGlvbnMsIGVudik7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gTWFya2Rvd25JdDtcbiIsIi8qKiBpbnRlcm5hbFxuICogY2xhc3MgUGFyc2VyQmxvY2tcbiAqXG4gKiBCbG9jay1sZXZlbCB0b2tlbml6ZXIuXG4gKiovXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFJ1bGVyICAgICAgICAgICA9IHJlcXVpcmUoJy4vcnVsZXInKTtcblxuXG52YXIgX3J1bGVzID0gW1xuICAvLyBGaXJzdCAyIHBhcmFtcyAtIHJ1bGUgbmFtZSAmIHNvdXJjZS4gU2Vjb25kYXJ5IGFycmF5IC0gbGlzdCBvZiBydWxlcyxcbiAgLy8gd2hpY2ggY2FuIGJlIHRlcm1pbmF0ZWQgYnkgdGhpcyBvbmUuXG4gIFsgJ3RhYmxlJywgICAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL3RhYmxlJyksICAgICAgWyAncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScgXSBdLFxuICBbICdjb2RlJywgICAgICAgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9jb2RlJykgXSxcbiAgWyAnZmVuY2UnLCAgICAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svZmVuY2UnKSwgICAgICBbICdwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnLCAnbGlzdCcgXSBdLFxuICBbICdibG9ja3F1b3RlJywgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9ibG9ja3F1b3RlJyksIFsgJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScsICdsaXN0JyBdIF0sXG4gIFsgJ2hyJywgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2Jsb2NrL2hyJyksICAgICAgICAgWyAncGFyYWdyYXBoJywgJ3JlZmVyZW5jZScsICdibG9ja3F1b3RlJywgJ2xpc3QnIF0gXSxcbiAgWyAnbGlzdCcsICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svbGlzdCcpLCAgICAgICBbICdwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnIF0gXSxcbiAgWyAncmVmZXJlbmNlJywgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svcmVmZXJlbmNlJykgXSxcbiAgWyAnaGVhZGluZycsICAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svaGVhZGluZycpLCAgICBbICdwYXJhZ3JhcGgnLCAncmVmZXJlbmNlJywgJ2Jsb2NrcXVvdGUnIF0gXSxcbiAgWyAnbGhlYWRpbmcnLCAgIHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svbGhlYWRpbmcnKSBdLFxuICBbICdodG1sX2Jsb2NrJywgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9odG1sX2Jsb2NrJyksIFsgJ3BhcmFncmFwaCcsICdyZWZlcmVuY2UnLCAnYmxvY2txdW90ZScgXSBdLFxuICBbICdwYXJhZ3JhcGgnLCAgcmVxdWlyZSgnLi9ydWxlc19ibG9jay9wYXJhZ3JhcGgnKSBdXG5dO1xuXG5cbi8qKlxuICogbmV3IFBhcnNlckJsb2NrKClcbiAqKi9cbmZ1bmN0aW9uIFBhcnNlckJsb2NrKCkge1xuICAvKipcbiAgICogUGFyc2VyQmxvY2sjcnVsZXIgLT4gUnVsZXJcbiAgICpcbiAgICogW1tSdWxlcl1dIGluc3RhbmNlLiBLZWVwIGNvbmZpZ3VyYXRpb24gb2YgYmxvY2sgcnVsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgX3J1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5ydWxlci5wdXNoKF9ydWxlc1tpXVswXSwgX3J1bGVzW2ldWzFdLCB7IGFsdDogKF9ydWxlc1tpXVsyXSB8fCBbXSkuc2xpY2UoKSB9KTtcbiAgfVxufVxuXG5cbi8vIEdlbmVyYXRlIHRva2VucyBmb3IgaW5wdXQgcmFuZ2Vcbi8vXG5QYXJzZXJCbG9jay5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSkge1xuICB2YXIgb2ssIGksXG4gICAgICBydWxlcyA9IHRoaXMucnVsZXIuZ2V0UnVsZXMoJycpLFxuICAgICAgbGVuID0gcnVsZXMubGVuZ3RoLFxuICAgICAgbGluZSA9IHN0YXJ0TGluZSxcbiAgICAgIGhhc0VtcHR5TGluZXMgPSBmYWxzZSxcbiAgICAgIG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3Rpbmc7XG5cbiAgd2hpbGUgKGxpbmUgPCBlbmRMaW5lKSB7XG4gICAgc3RhdGUubGluZSA9IGxpbmUgPSBzdGF0ZS5za2lwRW1wdHlMaW5lcyhsaW5lKTtcbiAgICBpZiAobGluZSA+PSBlbmRMaW5lKSB7IGJyZWFrOyB9XG5cbiAgICAvLyBUZXJtaW5hdGlvbiBjb25kaXRpb24gZm9yIG5lc3RlZCBjYWxscy5cbiAgICAvLyBOZXN0ZWQgY2FsbHMgY3VycmVudGx5IHVzZWQgZm9yIGJsb2NrcXVvdGVzICYgbGlzdHNcbiAgICBpZiAoc3RhdGUuc0NvdW50W2xpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IGJyZWFrOyB9XG5cbiAgICAvLyBJZiBuZXN0aW5nIGxldmVsIGV4Y2VlZGVkIC0gc2tpcCB0YWlsIHRvIHRoZSBlbmQuIFRoYXQncyBub3Qgb3JkaW5hcnlcbiAgICAvLyBzaXR1YXRpb24gYW5kIHdlIHNob3VsZCBub3QgY2FyZSBhYm91dCBjb250ZW50LlxuICAgIGlmIChzdGF0ZS5sZXZlbCA+PSBtYXhOZXN0aW5nKSB7XG4gICAgICBzdGF0ZS5saW5lID0gZW5kTGluZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIFRyeSBhbGwgcG9zc2libGUgcnVsZXMuXG4gICAgLy8gT24gc3VjY2VzcywgcnVsZSBzaG91bGQ6XG4gICAgLy9cbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUubGluZWBcbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUudG9rZW5zYFxuICAgIC8vIC0gcmV0dXJuIHRydWVcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgb2sgPSBydWxlc1tpXShzdGF0ZSwgbGluZSwgZW5kTGluZSwgZmFsc2UpO1xuICAgICAgaWYgKG9rKSB7IGJyZWFrOyB9XG4gICAgfVxuXG4gICAgLy8gc2V0IHN0YXRlLnRpZ2h0IGlmIHdlIGhhZCBhbiBlbXB0eSBsaW5lIGJlZm9yZSBjdXJyZW50IHRhZ1xuICAgIC8vIGkuZS4gbGF0ZXN0IGVtcHR5IGxpbmUgc2hvdWxkIG5vdCBjb3VudFxuICAgIHN0YXRlLnRpZ2h0ID0gIWhhc0VtcHR5TGluZXM7XG5cbiAgICAvLyBwYXJhZ3JhcGggbWlnaHQgXCJlYXRcIiBvbmUgbmV3bGluZSBhZnRlciBpdCBpbiBuZXN0ZWQgbGlzdHNcbiAgICBpZiAoc3RhdGUuaXNFbXB0eShzdGF0ZS5saW5lIC0gMSkpIHtcbiAgICAgIGhhc0VtcHR5TGluZXMgPSB0cnVlO1xuICAgIH1cblxuICAgIGxpbmUgPSBzdGF0ZS5saW5lO1xuXG4gICAgaWYgKGxpbmUgPCBlbmRMaW5lICYmIHN0YXRlLmlzRW1wdHkobGluZSkpIHtcbiAgICAgIGhhc0VtcHR5TGluZXMgPSB0cnVlO1xuICAgICAgbGluZSsrO1xuICAgICAgc3RhdGUubGluZSA9IGxpbmU7XG4gICAgfVxuICB9XG59O1xuXG5cbi8qKlxuICogUGFyc2VyQmxvY2sucGFyc2Uoc3RyLCBtZCwgZW52LCBvdXRUb2tlbnMpXG4gKlxuICogUHJvY2VzcyBpbnB1dCBzdHJpbmcgYW5kIHB1c2ggYmxvY2sgdG9rZW5zIGludG8gYG91dFRva2Vuc2BcbiAqKi9cblBhcnNlckJsb2NrLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzcmMsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICB2YXIgc3RhdGU7XG5cbiAgaWYgKCFzcmMpIHsgcmV0dXJuOyB9XG5cbiAgc3RhdGUgPSBuZXcgdGhpcy5TdGF0ZShzcmMsIG1kLCBlbnYsIG91dFRva2Vucyk7XG5cbiAgdGhpcy50b2tlbml6ZShzdGF0ZSwgc3RhdGUubGluZSwgc3RhdGUubGluZU1heCk7XG59O1xuXG5cblBhcnNlckJsb2NrLnByb3RvdHlwZS5TdGF0ZSA9IHJlcXVpcmUoJy4vcnVsZXNfYmxvY2svc3RhdGVfYmxvY2snKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnNlckJsb2NrO1xuIiwiLyoqIGludGVybmFsXG4gKiBjbGFzcyBDb3JlXG4gKlxuICogVG9wLWxldmVsIHJ1bGVzIGV4ZWN1dG9yLiBHbHVlcyBibG9jay9pbmxpbmUgcGFyc2VycyBhbmQgZG9lcyBpbnRlcm1lZGlhdGVcbiAqIHRyYW5zZm9ybWF0aW9ucy5cbiAqKi9cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgUnVsZXIgID0gcmVxdWlyZSgnLi9ydWxlcicpO1xuXG5cbnZhciBfcnVsZXMgPSBbXG4gIFsgJ25vcm1hbGl6ZScsICAgICAgcmVxdWlyZSgnLi9ydWxlc19jb3JlL25vcm1hbGl6ZScpICAgICAgXSxcbiAgWyAnYmxvY2snLCAgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2NvcmUvYmxvY2snKSAgICAgICAgICBdLFxuICBbICdpbmxpbmUnLCAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfY29yZS9pbmxpbmUnKSAgICAgICAgIF0sXG4gIFsgJ2xpbmtpZnknLCAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19jb3JlL2xpbmtpZnknKSAgICAgICAgXSxcbiAgWyAncmVwbGFjZW1lbnRzJywgICByZXF1aXJlKCcuL3J1bGVzX2NvcmUvcmVwbGFjZW1lbnRzJykgICBdLFxuICBbICdzbWFydHF1b3RlcycsICAgIHJlcXVpcmUoJy4vcnVsZXNfY29yZS9zbWFydHF1b3RlcycpICAgIF1cbl07XG5cblxuLyoqXG4gKiBuZXcgQ29yZSgpXG4gKiovXG5mdW5jdGlvbiBDb3JlKCkge1xuICAvKipcbiAgICogQ29yZSNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBjb3JlIHJ1bGVzLlxuICAgKiovXG4gIHRoaXMucnVsZXIgPSBuZXcgUnVsZXIoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IF9ydWxlcy5sZW5ndGg7IGkrKykge1xuICAgIHRoaXMucnVsZXIucHVzaChfcnVsZXNbaV1bMF0sIF9ydWxlc1tpXVsxXSk7XG4gIH1cbn1cblxuXG4vKipcbiAqIENvcmUucHJvY2VzcyhzdGF0ZSlcbiAqXG4gKiBFeGVjdXRlcyBjb3JlIGNoYWluIHJ1bGVzLlxuICoqL1xuQ29yZS5wcm90b3R5cGUucHJvY2VzcyA9IGZ1bmN0aW9uIChzdGF0ZSkge1xuICB2YXIgaSwgbCwgcnVsZXM7XG5cbiAgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKTtcblxuICBmb3IgKGkgPSAwLCBsID0gcnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgcnVsZXNbaV0oc3RhdGUpO1xuICB9XG59O1xuXG5Db3JlLnByb3RvdHlwZS5TdGF0ZSA9IHJlcXVpcmUoJy4vcnVsZXNfY29yZS9zdGF0ZV9jb3JlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb3JlO1xuIiwiLyoqIGludGVybmFsXG4gKiBjbGFzcyBQYXJzZXJJbmxpbmVcbiAqXG4gKiBUb2tlbml6ZXMgcGFyYWdyYXBoIGNvbnRlbnQuXG4gKiovXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIFJ1bGVyICAgICAgICAgICA9IHJlcXVpcmUoJy4vcnVsZXInKTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gUGFyc2VyIHJ1bGVzXG5cbnZhciBfcnVsZXMgPSBbXG4gIFsgJ3RleHQnLCAgICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL3RleHQnKSBdLFxuICBbICduZXdsaW5lJywgICAgICAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9uZXdsaW5lJykgXSxcbiAgWyAnZXNjYXBlJywgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvZXNjYXBlJykgXSxcbiAgWyAnYmFja3RpY2tzJywgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvYmFja3RpY2tzJykgXSxcbiAgWyAnc3RyaWtldGhyb3VnaCcsICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvc3RyaWtldGhyb3VnaCcpLnRva2VuaXplIF0sXG4gIFsgJ2VtcGhhc2lzJywgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2VtcGhhc2lzJykudG9rZW5pemUgXSxcbiAgWyAnbGluaycsICAgICAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvbGluaycpIF0sXG4gIFsgJ2ltYWdlJywgICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2ltYWdlJykgXSxcbiAgWyAnYXV0b2xpbmsnLCAgICAgICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvYXV0b2xpbmsnKSBdLFxuICBbICdodG1sX2lubGluZScsICAgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9odG1sX2lubGluZScpIF0sXG4gIFsgJ2VudGl0eScsICAgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2VudGl0eScpIF1cbl07XG5cbnZhciBfcnVsZXMyID0gW1xuICBbICdiYWxhbmNlX3BhaXJzJywgICByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9iYWxhbmNlX3BhaXJzJykgXSxcbiAgWyAnc3RyaWtldGhyb3VnaCcsICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvc3RyaWtldGhyb3VnaCcpLnBvc3RQcm9jZXNzIF0sXG4gIFsgJ2VtcGhhc2lzJywgICAgICAgIHJlcXVpcmUoJy4vcnVsZXNfaW5saW5lL2VtcGhhc2lzJykucG9zdFByb2Nlc3MgXSxcbiAgWyAndGV4dF9jb2xsYXBzZScsICAgcmVxdWlyZSgnLi9ydWxlc19pbmxpbmUvdGV4dF9jb2xsYXBzZScpIF1cbl07XG5cblxuLyoqXG4gKiBuZXcgUGFyc2VySW5saW5lKClcbiAqKi9cbmZ1bmN0aW9uIFBhcnNlcklubGluZSgpIHtcbiAgdmFyIGk7XG5cbiAgLyoqXG4gICAqIFBhcnNlcklubGluZSNydWxlciAtPiBSdWxlclxuICAgKlxuICAgKiBbW1J1bGVyXV0gaW5zdGFuY2UuIEtlZXAgY29uZmlndXJhdGlvbiBvZiBpbmxpbmUgcnVsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlciA9IG5ldyBSdWxlcigpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBfcnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyLnB1c2goX3J1bGVzW2ldWzBdLCBfcnVsZXNbaV1bMV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcklubGluZSNydWxlcjIgLT4gUnVsZXJcbiAgICpcbiAgICogW1tSdWxlcl1dIGluc3RhbmNlLiBTZWNvbmQgcnVsZXIgdXNlZCBmb3IgcG9zdC1wcm9jZXNzaW5nXG4gICAqIChlLmcuIGluIGVtcGhhc2lzLWxpa2UgcnVsZXMpLlxuICAgKiovXG4gIHRoaXMucnVsZXIyID0gbmV3IFJ1bGVyKCk7XG5cbiAgZm9yIChpID0gMDsgaSA8IF9ydWxlczIubGVuZ3RoOyBpKyspIHtcbiAgICB0aGlzLnJ1bGVyMi5wdXNoKF9ydWxlczJbaV1bMF0sIF9ydWxlczJbaV1bMV0pO1xuICB9XG59XG5cblxuLy8gU2tpcCBzaW5nbGUgdG9rZW4gYnkgcnVubmluZyBhbGwgcnVsZXMgaW4gdmFsaWRhdGlvbiBtb2RlO1xuLy8gcmV0dXJucyBgdHJ1ZWAgaWYgYW55IHJ1bGUgcmVwb3J0ZWQgc3VjY2Vzc1xuLy9cblBhcnNlcklubGluZS5wcm90b3R5cGUuc2tpcFRva2VuID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gIHZhciBvaywgaSwgcG9zID0gc3RhdGUucG9zLFxuICAgICAgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKSxcbiAgICAgIGxlbiA9IHJ1bGVzLmxlbmd0aCxcbiAgICAgIG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3RpbmcsXG4gICAgICBjYWNoZSA9IHN0YXRlLmNhY2hlO1xuXG5cbiAgaWYgKHR5cGVvZiBjYWNoZVtwb3NdICE9PSAndW5kZWZpbmVkJykge1xuICAgIHN0YXRlLnBvcyA9IGNhY2hlW3Bvc107XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0YXRlLmxldmVsIDwgbWF4TmVzdGluZykge1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgLy8gSW5jcmVtZW50IHN0YXRlLmxldmVsIGFuZCBkZWNyZW1lbnQgaXQgbGF0ZXIgdG8gbGltaXQgcmVjdXJzaW9uLlxuICAgICAgLy8gSXQncyBoYXJtbGVzcyB0byBkbyBoZXJlLCBiZWNhdXNlIG5vIHRva2VucyBhcmUgY3JlYXRlZC4gQnV0IGlkZWFsbHksXG4gICAgICAvLyB3ZSdkIG5lZWQgYSBzZXBhcmF0ZSBwcml2YXRlIHN0YXRlIHZhcmlhYmxlIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgICAvL1xuICAgICAgc3RhdGUubGV2ZWwrKztcbiAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIHRydWUpO1xuICAgICAgc3RhdGUubGV2ZWwtLTtcblxuICAgICAgaWYgKG9rKSB7IGJyZWFrOyB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIFRvbyBtdWNoIG5lc3RpbmcsIGp1c3Qgc2tpcCB1bnRpbCB0aGUgZW5kIG9mIHRoZSBwYXJhZ3JhcGguXG4gICAgLy9cbiAgICAvLyBOT1RFOiB0aGlzIHdpbGwgY2F1c2UgbGlua3MgdG8gYmVoYXZlIGluY29ycmVjdGx5IGluIHRoZSBmb2xsb3dpbmcgY2FzZSxcbiAgICAvLyAgICAgICB3aGVuIGFuIGFtb3VudCBvZiBgW2AgaXMgZXhhY3RseSBlcXVhbCB0byBgbWF4TmVzdGluZyArIDFgOlxuICAgIC8vXG4gICAgLy8gICAgICAgW1tbW1tbW1tbW1tbW1tbW1tbW1tbZm9vXSgpXG4gICAgLy9cbiAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyB3b3JrYXJvdW5kIHdoZW4gQ00gc3RhbmRhcmQgd2lsbCBhbGxvdyBuZXN0ZWQgbGlua3NcbiAgICAvLyAgICAgICAod2UgY2FuIHJlcGxhY2UgaXQgYnkgcHJldmVudGluZyBsaW5rcyBmcm9tIGJlaW5nIHBhcnNlZCBpblxuICAgIC8vICAgICAgIHZhbGlkYXRpb24gbW9kZSlcbiAgICAvL1xuICAgIHN0YXRlLnBvcyA9IHN0YXRlLnBvc01heDtcbiAgfVxuXG4gIGlmICghb2spIHsgc3RhdGUucG9zKys7IH1cbiAgY2FjaGVbcG9zXSA9IHN0YXRlLnBvcztcbn07XG5cblxuLy8gR2VuZXJhdGUgdG9rZW5zIGZvciBpbnB1dCByYW5nZVxuLy9cblBhcnNlcklubGluZS5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgdmFyIG9rLCBpLFxuICAgICAgcnVsZXMgPSB0aGlzLnJ1bGVyLmdldFJ1bGVzKCcnKSxcbiAgICAgIGxlbiA9IHJ1bGVzLmxlbmd0aCxcbiAgICAgIGVuZCA9IHN0YXRlLnBvc01heCxcbiAgICAgIG1heE5lc3RpbmcgPSBzdGF0ZS5tZC5vcHRpb25zLm1heE5lc3Rpbmc7XG5cbiAgd2hpbGUgKHN0YXRlLnBvcyA8IGVuZCkge1xuICAgIC8vIFRyeSBhbGwgcG9zc2libGUgcnVsZXMuXG4gICAgLy8gT24gc3VjY2VzcywgcnVsZSBzaG91bGQ6XG4gICAgLy9cbiAgICAvLyAtIHVwZGF0ZSBgc3RhdGUucG9zYFxuICAgIC8vIC0gdXBkYXRlIGBzdGF0ZS50b2tlbnNgXG4gICAgLy8gLSByZXR1cm4gdHJ1ZVxuXG4gICAgaWYgKHN0YXRlLmxldmVsIDwgbWF4TmVzdGluZykge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIG9rID0gcnVsZXNbaV0oc3RhdGUsIGZhbHNlKTtcbiAgICAgICAgaWYgKG9rKSB7IGJyZWFrOyB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG9rKSB7XG4gICAgICBpZiAoc3RhdGUucG9zID49IGVuZCkgeyBicmVhazsgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmNbc3RhdGUucG9zKytdO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBlbmRpbmcpIHtcbiAgICBzdGF0ZS5wdXNoUGVuZGluZygpO1xuICB9XG59O1xuXG5cbi8qKlxuICogUGFyc2VySW5saW5lLnBhcnNlKHN0ciwgbWQsIGVudiwgb3V0VG9rZW5zKVxuICpcbiAqIFByb2Nlc3MgaW5wdXQgc3RyaW5nIGFuZCBwdXNoIGlubGluZSB0b2tlbnMgaW50byBgb3V0VG9rZW5zYFxuICoqL1xuUGFyc2VySW5saW5lLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uIChzdHIsIG1kLCBlbnYsIG91dFRva2Vucykge1xuICB2YXIgaSwgcnVsZXMsIGxlbjtcbiAgdmFyIHN0YXRlID0gbmV3IHRoaXMuU3RhdGUoc3RyLCBtZCwgZW52LCBvdXRUb2tlbnMpO1xuXG4gIHRoaXMudG9rZW5pemUoc3RhdGUpO1xuXG4gIHJ1bGVzID0gdGhpcy5ydWxlcjIuZ2V0UnVsZXMoJycpO1xuICBsZW4gPSBydWxlcy5sZW5ndGg7XG5cbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgcnVsZXNbaV0oc3RhdGUpO1xuICB9XG59O1xuXG5cblBhcnNlcklubGluZS5wcm90b3R5cGUuU3RhdGUgPSByZXF1aXJlKCcuL3J1bGVzX2lubGluZS9zdGF0ZV9pbmxpbmUnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhcnNlcklubGluZTtcbiIsIi8vIENvbW1vbm1hcmsgZGVmYXVsdCBvcHRpb25zXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb3B0aW9uczoge1xuICAgIGh0bWw6ICAgICAgICAgdHJ1ZSwgICAgICAgICAvLyBFbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZVxuICAgIHhodG1sT3V0OiAgICAgdHJ1ZSwgICAgICAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgYnJlYWtzOiAgICAgICBmYWxzZSwgICAgICAgIC8vIENvbnZlcnQgJ1xcbicgaW4gcGFyYWdyYXBocyBpbnRvIDxicj5cbiAgICBsYW5nUHJlZml4OiAgICdsYW5ndWFnZS0nLCAgLy8gQ1NTIGxhbmd1YWdlIHByZWZpeCBmb3IgZmVuY2VkIGJsb2Nrc1xuICAgIGxpbmtpZnk6ICAgICAgZmFsc2UsICAgICAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogIGZhbHNlLFxuXG4gICAgLy8gRG91YmxlICsgc2luZ2xlIHF1b3RlcyByZXBsYWNlbWVudCBwYWlycywgd2hlbiB0eXBvZ3JhcGhlciBlbmFibGVkLFxuICAgIC8vIGFuZCBzbWFydHF1b3RlcyBvbi4gQ291bGQgYmUgZWl0aGVyIGEgU3RyaW5nIG9yIGFuIEFycmF5LlxuICAgIC8vXG4gICAgLy8gRm9yIGV4YW1wbGUsIHlvdSBjYW4gdXNlICfCq8K74oCe4oCcJyBmb3IgUnVzc2lhbiwgJ+KAnuKAnOKAmuKAmCcgZm9yIEdlcm1hbixcbiAgICAvLyBhbmQgWyfCq1xceEEwJywgJ1xceEEwwrsnLCAn4oC5XFx4QTAnLCAnXFx4QTDigLonXSBmb3IgRnJlbmNoIChpbmNsdWRpbmcgbmJzcCkuXG4gICAgcXVvdGVzOiAnXFx1MjAxY1xcdTIwMWRcXHUyMDE4XFx1MjAxOScsIC8qIOKAnOKAneKAmOKAmSAqL1xuXG4gICAgLy8gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24uIFNob3VsZCByZXR1cm4gZXNjYXBlZCBIVE1MLFxuICAgIC8vIG9yICcnIGlmIHRoZSBzb3VyY2Ugc3RyaW5nIGlzIG5vdCBjaGFuZ2VkIGFuZCBzaG91bGQgYmUgZXNjYXBlZCBleHRlcm5hbHkuXG4gICAgLy8gSWYgcmVzdWx0IHN0YXJ0cyB3aXRoIDxwcmUuLi4gaW50ZXJuYWwgd3JhcHBlciBpcyBza2lwcGVkLlxuICAgIC8vXG4gICAgLy8gZnVuY3Rpb24gKC8qc3RyLCBsYW5nKi8pIHsgcmV0dXJuICcnOyB9XG4gICAgLy9cbiAgICBoaWdobGlnaHQ6IG51bGwsXG5cbiAgICBtYXhOZXN0aW5nOiAgIDIwICAgICAgICAgICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuXG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ25vcm1hbGl6ZScsXG4gICAgICAgICdibG9jaycsXG4gICAgICAgICdpbmxpbmUnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAnYmxvY2txdW90ZScsXG4gICAgICAgICdjb2RlJyxcbiAgICAgICAgJ2ZlbmNlJyxcbiAgICAgICAgJ2hlYWRpbmcnLFxuICAgICAgICAnaHInLFxuICAgICAgICAnaHRtbF9ibG9jaycsXG4gICAgICAgICdsaGVhZGluZycsXG4gICAgICAgICdsaXN0JyxcbiAgICAgICAgJ3JlZmVyZW5jZScsXG4gICAgICAgICdwYXJhZ3JhcGgnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGlubGluZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ2F1dG9saW5rJyxcbiAgICAgICAgJ2JhY2t0aWNrcycsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICdlbnRpdHknLFxuICAgICAgICAnZXNjYXBlJyxcbiAgICAgICAgJ2h0bWxfaW5saW5lJyxcbiAgICAgICAgJ2ltYWdlJyxcbiAgICAgICAgJ2xpbmsnLFxuICAgICAgICAnbmV3bGluZScsXG4gICAgICAgICd0ZXh0J1xuICAgICAgXSxcbiAgICAgIHJ1bGVzMjogW1xuICAgICAgICAnYmFsYW5jZV9wYWlycycsXG4gICAgICAgICdlbXBoYXNpcycsXG4gICAgICAgICd0ZXh0X2NvbGxhcHNlJ1xuICAgICAgXVxuICAgIH1cbiAgfVxufTtcbiIsIi8vIG1hcmtkb3duLWl0IGRlZmF1bHQgb3B0aW9uc1xuXG4ndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG9wdGlvbnM6IHtcbiAgICBodG1sOiAgICAgICAgIGZhbHNlLCAgICAgICAgLy8gRW5hYmxlIEhUTUwgdGFncyBpbiBzb3VyY2VcbiAgICB4aHRtbE91dDogICAgIGZhbHNlLCAgICAgICAgLy8gVXNlICcvJyB0byBjbG9zZSBzaW5nbGUgdGFncyAoPGJyIC8+KVxuICAgIGJyZWFrczogICAgICAgZmFsc2UsICAgICAgICAvLyBDb252ZXJ0ICdcXG4nIGluIHBhcmFncmFwaHMgaW50byA8YnI+XG4gICAgbGFuZ1ByZWZpeDogICAnbGFuZ3VhZ2UtJywgIC8vIENTUyBsYW5ndWFnZSBwcmVmaXggZm9yIGZlbmNlZCBibG9ja3NcbiAgICBsaW5raWZ5OiAgICAgIGZhbHNlLCAgICAgICAgLy8gYXV0b2NvbnZlcnQgVVJMLWxpa2UgdGV4dHMgdG8gbGlua3NcblxuICAgIC8vIEVuYWJsZSBzb21lIGxhbmd1YWdlLW5ldXRyYWwgcmVwbGFjZW1lbnRzICsgcXVvdGVzIGJlYXV0aWZpY2F0aW9uXG4gICAgdHlwb2dyYXBoZXI6ICBmYWxzZSxcblxuICAgIC8vIERvdWJsZSArIHNpbmdsZSBxdW90ZXMgcmVwbGFjZW1lbnQgcGFpcnMsIHdoZW4gdHlwb2dyYXBoZXIgZW5hYmxlZCxcbiAgICAvLyBhbmQgc21hcnRxdW90ZXMgb24uIENvdWxkIGJlIGVpdGhlciBhIFN0cmluZyBvciBhbiBBcnJheS5cbiAgICAvL1xuICAgIC8vIEZvciBleGFtcGxlLCB5b3UgY2FuIHVzZSAnwqvCu+KAnuKAnCcgZm9yIFJ1c3NpYW4sICfigJ7igJzigJrigJgnIGZvciBHZXJtYW4sXG4gICAgLy8gYW5kIFsnwqtcXHhBMCcsICdcXHhBMMK7JywgJ+KAuVxceEEwJywgJ1xceEEw4oC6J10gZm9yIEZyZW5jaCAoaW5jbHVkaW5nIG5ic3ApLlxuICAgIHF1b3RlczogJ1xcdTIwMWNcXHUyMDFkXFx1MjAxOFxcdTIwMTknLCAvKiDigJzigJ3igJjigJkgKi9cblxuICAgIC8vIEhpZ2hsaWdodGVyIGZ1bmN0aW9uLiBTaG91bGQgcmV0dXJuIGVzY2FwZWQgSFRNTCxcbiAgICAvLyBvciAnJyBpZiB0aGUgc291cmNlIHN0cmluZyBpcyBub3QgY2hhbmdlZCBhbmQgc2hvdWxkIGJlIGVzY2FwZWQgZXh0ZXJuYWx5LlxuICAgIC8vIElmIHJlc3VsdCBzdGFydHMgd2l0aCA8cHJlLi4uIGludGVybmFsIHdyYXBwZXIgaXMgc2tpcHBlZC5cbiAgICAvL1xuICAgIC8vIGZ1bmN0aW9uICgvKnN0ciwgbGFuZyovKSB7IHJldHVybiAnJzsgfVxuICAgIC8vXG4gICAgaGlnaGxpZ2h0OiBudWxsLFxuXG4gICAgbWF4TmVzdGluZzogICAxMDAgICAgICAgICAgICAvLyBJbnRlcm5hbCBwcm90ZWN0aW9uLCByZWN1cnNpb24gbGltaXRcbiAgfSxcblxuICBjb21wb25lbnRzOiB7XG5cbiAgICBjb3JlOiB7fSxcbiAgICBibG9jazoge30sXG4gICAgaW5saW5lOiB7fVxuICB9XG59O1xuIiwiLy8gXCJaZXJvXCIgcHJlc2V0LCB3aXRoIG5vdGhpbmcgZW5hYmxlZC4gVXNlZnVsIGZvciBtYW51YWwgY29uZmlndXJpbmcgb2Ygc2ltcGxlXG4vLyBtb2Rlcy4gRm9yIGV4YW1wbGUsIHRvIHBhcnNlIGJvbGQvaXRhbGljIG9ubHkuXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb3B0aW9uczoge1xuICAgIGh0bWw6ICAgICAgICAgZmFsc2UsICAgICAgICAvLyBFbmFibGUgSFRNTCB0YWdzIGluIHNvdXJjZVxuICAgIHhodG1sT3V0OiAgICAgZmFsc2UsICAgICAgICAvLyBVc2UgJy8nIHRvIGNsb3NlIHNpbmdsZSB0YWdzICg8YnIgLz4pXG4gICAgYnJlYWtzOiAgICAgICBmYWxzZSwgICAgICAgIC8vIENvbnZlcnQgJ1xcbicgaW4gcGFyYWdyYXBocyBpbnRvIDxicj5cbiAgICBsYW5nUHJlZml4OiAgICdsYW5ndWFnZS0nLCAgLy8gQ1NTIGxhbmd1YWdlIHByZWZpeCBmb3IgZmVuY2VkIGJsb2Nrc1xuICAgIGxpbmtpZnk6ICAgICAgZmFsc2UsICAgICAgICAvLyBhdXRvY29udmVydCBVUkwtbGlrZSB0ZXh0cyB0byBsaW5rc1xuXG4gICAgLy8gRW5hYmxlIHNvbWUgbGFuZ3VhZ2UtbmV1dHJhbCByZXBsYWNlbWVudHMgKyBxdW90ZXMgYmVhdXRpZmljYXRpb25cbiAgICB0eXBvZ3JhcGhlcjogIGZhbHNlLFxuXG4gICAgLy8gRG91YmxlICsgc2luZ2xlIHF1b3RlcyByZXBsYWNlbWVudCBwYWlycywgd2hlbiB0eXBvZ3JhcGhlciBlbmFibGVkLFxuICAgIC8vIGFuZCBzbWFydHF1b3RlcyBvbi4gQ291bGQgYmUgZWl0aGVyIGEgU3RyaW5nIG9yIGFuIEFycmF5LlxuICAgIC8vXG4gICAgLy8gRm9yIGV4YW1wbGUsIHlvdSBjYW4gdXNlICfCq8K74oCe4oCcJyBmb3IgUnVzc2lhbiwgJ+KAnuKAnOKAmuKAmCcgZm9yIEdlcm1hbixcbiAgICAvLyBhbmQgWyfCq1xceEEwJywgJ1xceEEwwrsnLCAn4oC5XFx4QTAnLCAnXFx4QTDigLonXSBmb3IgRnJlbmNoIChpbmNsdWRpbmcgbmJzcCkuXG4gICAgcXVvdGVzOiAnXFx1MjAxY1xcdTIwMWRcXHUyMDE4XFx1MjAxOScsIC8qIOKAnOKAneKAmOKAmSAqL1xuXG4gICAgLy8gSGlnaGxpZ2h0ZXIgZnVuY3Rpb24uIFNob3VsZCByZXR1cm4gZXNjYXBlZCBIVE1MLFxuICAgIC8vIG9yICcnIGlmIHRoZSBzb3VyY2Ugc3RyaW5nIGlzIG5vdCBjaGFuZ2VkIGFuZCBzaG91bGQgYmUgZXNjYXBlZCBleHRlcm5hbHkuXG4gICAgLy8gSWYgcmVzdWx0IHN0YXJ0cyB3aXRoIDxwcmUuLi4gaW50ZXJuYWwgd3JhcHBlciBpcyBza2lwcGVkLlxuICAgIC8vXG4gICAgLy8gZnVuY3Rpb24gKC8qc3RyLCBsYW5nKi8pIHsgcmV0dXJuICcnOyB9XG4gICAgLy9cbiAgICBoaWdobGlnaHQ6IG51bGwsXG5cbiAgICBtYXhOZXN0aW5nOiAgIDIwICAgICAgICAgICAgLy8gSW50ZXJuYWwgcHJvdGVjdGlvbiwgcmVjdXJzaW9uIGxpbWl0XG4gIH0sXG5cbiAgY29tcG9uZW50czoge1xuXG4gICAgY29yZToge1xuICAgICAgcnVsZXM6IFtcbiAgICAgICAgJ25vcm1hbGl6ZScsXG4gICAgICAgICdibG9jaycsXG4gICAgICAgICdpbmxpbmUnXG4gICAgICBdXG4gICAgfSxcblxuICAgIGJsb2NrOiB7XG4gICAgICBydWxlczogW1xuICAgICAgICAncGFyYWdyYXBoJ1xuICAgICAgXVxuICAgIH0sXG5cbiAgICBpbmxpbmU6IHtcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgICd0ZXh0J1xuICAgICAgXSxcbiAgICAgIHJ1bGVzMjogW1xuICAgICAgICAnYmFsYW5jZV9wYWlycycsXG4gICAgICAgICd0ZXh0X2NvbGxhcHNlJ1xuICAgICAgXVxuICAgIH1cbiAgfVxufTtcbiIsIi8qKlxuICogY2xhc3MgUmVuZGVyZXJcbiAqXG4gKiBHZW5lcmF0ZXMgSFRNTCBmcm9tIHBhcnNlZCB0b2tlbiBzdHJlYW0uIEVhY2ggaW5zdGFuY2UgaGFzIGluZGVwZW5kZW50XG4gKiBjb3B5IG9mIHJ1bGVzLiBUaG9zZSBjYW4gYmUgcmV3cml0dGVuIHdpdGggZWFzZS4gQWxzbywgeW91IGNhbiBhZGQgbmV3XG4gKiBydWxlcyBpZiB5b3UgY3JlYXRlIHBsdWdpbiBhbmQgYWRkcyBuZXcgdG9rZW4gdHlwZXMuXG4gKiovXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIGFzc2lnbiAgICAgICAgICA9IHJlcXVpcmUoJy4vY29tbW9uL3V0aWxzJykuYXNzaWduO1xudmFyIHVuZXNjYXBlQWxsICAgICA9IHJlcXVpcmUoJy4vY29tbW9uL3V0aWxzJykudW5lc2NhcGVBbGw7XG52YXIgZXNjYXBlSHRtbCAgICAgID0gcmVxdWlyZSgnLi9jb21tb24vdXRpbHMnKS5lc2NhcGVIdG1sO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnZhciBkZWZhdWx0X3J1bGVzID0ge307XG5cblxuZGVmYXVsdF9ydWxlcy5jb2RlX2lubGluZSA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCwgb3B0aW9ucywgZW52LCBzbGYpIHtcbiAgdmFyIHRva2VuID0gdG9rZW5zW2lkeF07XG5cbiAgcmV0dXJuICAnPGNvZGUnICsgc2xmLnJlbmRlckF0dHJzKHRva2VuKSArICc+JyArXG4gICAgICAgICAgZXNjYXBlSHRtbCh0b2tlbnNbaWR4XS5jb250ZW50KSArXG4gICAgICAgICAgJzwvY29kZT4nO1xufTtcblxuXG5kZWZhdWx0X3J1bGVzLmNvZGVfYmxvY2sgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIHZhciB0b2tlbiA9IHRva2Vuc1tpZHhdO1xuXG4gIHJldHVybiAgJzxwcmUnICsgc2xmLnJlbmRlckF0dHJzKHRva2VuKSArICc+PGNvZGU+JyArXG4gICAgICAgICAgZXNjYXBlSHRtbCh0b2tlbnNbaWR4XS5jb250ZW50KSArXG4gICAgICAgICAgJzwvY29kZT48L3ByZT5cXG4nO1xufTtcblxuXG5kZWZhdWx0X3J1bGVzLmZlbmNlID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHNsZikge1xuICB2YXIgdG9rZW4gPSB0b2tlbnNbaWR4XSxcbiAgICAgIGluZm8gPSB0b2tlbi5pbmZvID8gdW5lc2NhcGVBbGwodG9rZW4uaW5mbykudHJpbSgpIDogJycsXG4gICAgICBsYW5nTmFtZSA9ICcnLFxuICAgICAgaGlnaGxpZ2h0ZWQsIGksIHRtcEF0dHJzLCB0bXBUb2tlbjtcblxuICBpZiAoaW5mbykge1xuICAgIGxhbmdOYW1lID0gaW5mby5zcGxpdCgvXFxzKy9nKVswXTtcbiAgfVxuXG4gIGlmIChvcHRpb25zLmhpZ2hsaWdodCkge1xuICAgIGhpZ2hsaWdodGVkID0gb3B0aW9ucy5oaWdobGlnaHQodG9rZW4uY29udGVudCwgbGFuZ05hbWUpIHx8IGVzY2FwZUh0bWwodG9rZW4uY29udGVudCk7XG4gIH0gZWxzZSB7XG4gICAgaGlnaGxpZ2h0ZWQgPSBlc2NhcGVIdG1sKHRva2VuLmNvbnRlbnQpO1xuICB9XG5cbiAgaWYgKGhpZ2hsaWdodGVkLmluZGV4T2YoJzxwcmUnKSA9PT0gMCkge1xuICAgIHJldHVybiBoaWdobGlnaHRlZCArICdcXG4nO1xuICB9XG5cbiAgLy8gSWYgbGFuZ3VhZ2UgZXhpc3RzLCBpbmplY3QgY2xhc3MgZ2VudGx5LCB3aXRob3V0IG1vZGlmeWluZyBvcmlnaW5hbCB0b2tlbi5cbiAgLy8gTWF5IGJlLCBvbmUgZGF5IHdlIHdpbGwgYWRkIC5jbG9uZSgpIGZvciB0b2tlbiBhbmQgc2ltcGxpZnkgdGhpcyBwYXJ0LCBidXRcbiAgLy8gbm93IHdlIHByZWZlciB0byBrZWVwIHRoaW5ncyBsb2NhbC5cbiAgaWYgKGluZm8pIHtcbiAgICBpICAgICAgICA9IHRva2VuLmF0dHJJbmRleCgnY2xhc3MnKTtcbiAgICB0bXBBdHRycyA9IHRva2VuLmF0dHJzID8gdG9rZW4uYXR0cnMuc2xpY2UoKSA6IFtdO1xuXG4gICAgaWYgKGkgPCAwKSB7XG4gICAgICB0bXBBdHRycy5wdXNoKFsgJ2NsYXNzJywgb3B0aW9ucy5sYW5nUHJlZml4ICsgbGFuZ05hbWUgXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcEF0dHJzW2ldWzFdICs9ICcgJyArIG9wdGlvbnMubGFuZ1ByZWZpeCArIGxhbmdOYW1lO1xuICAgIH1cblxuICAgIC8vIEZha2UgdG9rZW4ganVzdCB0byByZW5kZXIgYXR0cmlidXRlc1xuICAgIHRtcFRva2VuID0ge1xuICAgICAgYXR0cnM6IHRtcEF0dHJzXG4gICAgfTtcblxuICAgIHJldHVybiAgJzxwcmU+PGNvZGUnICsgc2xmLnJlbmRlckF0dHJzKHRtcFRva2VuKSArICc+J1xuICAgICAgICAgICsgaGlnaGxpZ2h0ZWRcbiAgICAgICAgICArICc8L2NvZGU+PC9wcmU+XFxuJztcbiAgfVxuXG5cbiAgcmV0dXJuICAnPHByZT48Y29kZScgKyBzbGYucmVuZGVyQXR0cnModG9rZW4pICsgJz4nXG4gICAgICAgICsgaGlnaGxpZ2h0ZWRcbiAgICAgICAgKyAnPC9jb2RlPjwvcHJlPlxcbic7XG59O1xuXG5cbmRlZmF1bHRfcnVsZXMuaW1hZ2UgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMsIGVudiwgc2xmKSB7XG4gIHZhciB0b2tlbiA9IHRva2Vuc1tpZHhdO1xuXG4gIC8vIFwiYWx0XCIgYXR0ciBNVVNUIGJlIHNldCwgZXZlbiBpZiBlbXB0eS4gQmVjYXVzZSBpdCdzIG1hbmRhdG9yeSBhbmRcbiAgLy8gc2hvdWxkIGJlIHBsYWNlZCBvbiBwcm9wZXIgcG9zaXRpb24gZm9yIHRlc3RzLlxuICAvL1xuICAvLyBSZXBsYWNlIGNvbnRlbnQgd2l0aCBhY3R1YWwgdmFsdWVcblxuICB0b2tlbi5hdHRyc1t0b2tlbi5hdHRySW5kZXgoJ2FsdCcpXVsxXSA9XG4gICAgc2xmLnJlbmRlcklubGluZUFzVGV4dCh0b2tlbi5jaGlsZHJlbiwgb3B0aW9ucywgZW52KTtcblxuICByZXR1cm4gc2xmLnJlbmRlclRva2VuKHRva2VucywgaWR4LCBvcHRpb25zKTtcbn07XG5cblxuZGVmYXVsdF9ydWxlcy5oYXJkYnJlYWsgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHgsIG9wdGlvbnMgLyosIGVudiAqLykge1xuICByZXR1cm4gb3B0aW9ucy54aHRtbE91dCA/ICc8YnIgLz5cXG4nIDogJzxicj5cXG4nO1xufTtcbmRlZmF1bHRfcnVsZXMuc29mdGJyZWFrID0gZnVuY3Rpb24gKHRva2VucywgaWR4LCBvcHRpb25zIC8qLCBlbnYgKi8pIHtcbiAgcmV0dXJuIG9wdGlvbnMuYnJlYWtzID8gKG9wdGlvbnMueGh0bWxPdXQgPyAnPGJyIC8+XFxuJyA6ICc8YnI+XFxuJykgOiAnXFxuJztcbn07XG5cblxuZGVmYXVsdF9ydWxlcy50ZXh0ID0gZnVuY3Rpb24gKHRva2VucywgaWR4IC8qLCBvcHRpb25zLCBlbnYgKi8pIHtcbiAgcmV0dXJuIGVzY2FwZUh0bWwodG9rZW5zW2lkeF0uY29udGVudCk7XG59O1xuXG5cbmRlZmF1bHRfcnVsZXMuaHRtbF9ibG9jayA9IGZ1bmN0aW9uICh0b2tlbnMsIGlkeCAvKiwgb3B0aW9ucywgZW52ICovKSB7XG4gIHJldHVybiB0b2tlbnNbaWR4XS5jb250ZW50O1xufTtcbmRlZmF1bHRfcnVsZXMuaHRtbF9pbmxpbmUgPSBmdW5jdGlvbiAodG9rZW5zLCBpZHggLyosIG9wdGlvbnMsIGVudiAqLykge1xuICByZXR1cm4gdG9rZW5zW2lkeF0uY29udGVudDtcbn07XG5cblxuLyoqXG4gKiBuZXcgUmVuZGVyZXIoKVxuICpcbiAqIENyZWF0ZXMgbmV3IFtbUmVuZGVyZXJdXSBpbnN0YW5jZSBhbmQgZmlsbCBbW1JlbmRlcmVyI3J1bGVzXV0gd2l0aCBkZWZhdWx0cy5cbiAqKi9cbmZ1bmN0aW9uIFJlbmRlcmVyKCkge1xuXG4gIC8qKlxuICAgKiBSZW5kZXJlciNydWxlcyAtPiBPYmplY3RcbiAgICpcbiAgICogQ29udGFpbnMgcmVuZGVyIHJ1bGVzIGZvciB0b2tlbnMuIENhbiBiZSB1cGRhdGVkIGFuZCBleHRlbmRlZC5cbiAgICpcbiAgICogIyMjIyMgRXhhbXBsZVxuICAgKlxuICAgKiBgYGBqYXZhc2NyaXB0XG4gICAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAgICpcbiAgICogbWQucmVuZGVyZXIucnVsZXMuc3Ryb25nX29wZW4gID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJzxiPic7IH07XG4gICAqIG1kLnJlbmRlcmVyLnJ1bGVzLnN0cm9uZ19jbG9zZSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICc8L2I+JzsgfTtcbiAgICpcbiAgICogdmFyIHJlc3VsdCA9IG1kLnJlbmRlcklubGluZSguLi4pO1xuICAgKiBgYGBcbiAgICpcbiAgICogRWFjaCBydWxlIGlzIGNhbGxlZCBhcyBpbmRlcGVuZGVudCBzdGF0aWMgZnVuY3Rpb24gd2l0aCBmaXhlZCBzaWduYXR1cmU6XG4gICAqXG4gICAqIGBgYGphdmFzY3JpcHRcbiAgICogZnVuY3Rpb24gbXlfdG9rZW5fcmVuZGVyKHRva2VucywgaWR4LCBvcHRpb25zLCBlbnYsIHJlbmRlcmVyKSB7XG4gICAqICAgLy8gLi4uXG4gICAqICAgcmV0dXJuIHJlbmRlcmVkSFRNTDtcbiAgICogfVxuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIFtzb3VyY2UgY29kZV0oaHR0cHM6Ly9naXRodWIuY29tL21hcmtkb3duLWl0L21hcmtkb3duLWl0L2Jsb2IvbWFzdGVyL2xpYi9yZW5kZXJlci5qcylcbiAgICogZm9yIG1vcmUgZGV0YWlscyBhbmQgZXhhbXBsZXMuXG4gICAqKi9cbiAgdGhpcy5ydWxlcyA9IGFzc2lnbih7fSwgZGVmYXVsdF9ydWxlcyk7XG59XG5cblxuLyoqXG4gKiBSZW5kZXJlci5yZW5kZXJBdHRycyh0b2tlbikgLT4gU3RyaW5nXG4gKlxuICogUmVuZGVyIHRva2VuIGF0dHJpYnV0ZXMgdG8gc3RyaW5nLlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlckF0dHJzID0gZnVuY3Rpb24gcmVuZGVyQXR0cnModG9rZW4pIHtcbiAgdmFyIGksIGwsIHJlc3VsdDtcblxuICBpZiAoIXRva2VuLmF0dHJzKSB7IHJldHVybiAnJzsgfVxuXG4gIHJlc3VsdCA9ICcnO1xuXG4gIGZvciAoaSA9IDAsIGwgPSB0b2tlbi5hdHRycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICByZXN1bHQgKz0gJyAnICsgZXNjYXBlSHRtbCh0b2tlbi5hdHRyc1tpXVswXSkgKyAnPVwiJyArIGVzY2FwZUh0bWwodG9rZW4uYXR0cnNbaV1bMV0pICsgJ1wiJztcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5cbi8qKlxuICogUmVuZGVyZXIucmVuZGVyVG9rZW4odG9rZW5zLCBpZHgsIG9wdGlvbnMpIC0+IFN0cmluZ1xuICogLSB0b2tlbnMgKEFycmF5KTogbGlzdCBvZiB0b2tlbnNcbiAqIC0gaWR4IChOdW1iZWQpOiB0b2tlbiBpbmRleCB0byByZW5kZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICpcbiAqIERlZmF1bHQgdG9rZW4gcmVuZGVyZXIuIENhbiBiZSBvdmVycmlkZW4gYnkgY3VzdG9tIGZ1bmN0aW9uXG4gKiBpbiBbW1JlbmRlcmVyI3J1bGVzXV0uXG4gKiovXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyVG9rZW4gPSBmdW5jdGlvbiByZW5kZXJUb2tlbih0b2tlbnMsIGlkeCwgb3B0aW9ucykge1xuICB2YXIgbmV4dFRva2VuLFxuICAgICAgcmVzdWx0ID0gJycsXG4gICAgICBuZWVkTGYgPSBmYWxzZSxcbiAgICAgIHRva2VuID0gdG9rZW5zW2lkeF07XG5cbiAgLy8gVGlnaHQgbGlzdCBwYXJhZ3JhcGhzXG4gIGlmICh0b2tlbi5oaWRkZW4pIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvLyBJbnNlcnQgYSBuZXdsaW5lIGJldHdlZW4gaGlkZGVuIHBhcmFncmFwaCBhbmQgc3Vic2VxdWVudCBvcGVuaW5nXG4gIC8vIGJsb2NrLWxldmVsIHRhZy5cbiAgLy9cbiAgLy8gRm9yIGV4YW1wbGUsIGhlcmUgd2Ugc2hvdWxkIGluc2VydCBhIG5ld2xpbmUgYmVmb3JlIGJsb2NrcXVvdGU6XG4gIC8vICAtIGFcbiAgLy8gICAgPlxuICAvL1xuICBpZiAodG9rZW4uYmxvY2sgJiYgdG9rZW4ubmVzdGluZyAhPT0gLTEgJiYgaWR4ICYmIHRva2Vuc1tpZHggLSAxXS5oaWRkZW4pIHtcbiAgICByZXN1bHQgKz0gJ1xcbic7XG4gIH1cblxuICAvLyBBZGQgdG9rZW4gbmFtZSwgZS5nLiBgPGltZ2BcbiAgcmVzdWx0ICs9ICh0b2tlbi5uZXN0aW5nID09PSAtMSA/ICc8LycgOiAnPCcpICsgdG9rZW4udGFnO1xuXG4gIC8vIEVuY29kZSBhdHRyaWJ1dGVzLCBlLmcuIGA8aW1nIHNyYz1cImZvb1wiYFxuICByZXN1bHQgKz0gdGhpcy5yZW5kZXJBdHRycyh0b2tlbik7XG5cbiAgLy8gQWRkIGEgc2xhc2ggZm9yIHNlbGYtY2xvc2luZyB0YWdzLCBlLmcuIGA8aW1nIHNyYz1cImZvb1wiIC9gXG4gIGlmICh0b2tlbi5uZXN0aW5nID09PSAwICYmIG9wdGlvbnMueGh0bWxPdXQpIHtcbiAgICByZXN1bHQgKz0gJyAvJztcbiAgfVxuXG4gIC8vIENoZWNrIGlmIHdlIG5lZWQgdG8gYWRkIGEgbmV3bGluZSBhZnRlciB0aGlzIHRhZ1xuICBpZiAodG9rZW4uYmxvY2spIHtcbiAgICBuZWVkTGYgPSB0cnVlO1xuXG4gICAgaWYgKHRva2VuLm5lc3RpbmcgPT09IDEpIHtcbiAgICAgIGlmIChpZHggKyAxIDwgdG9rZW5zLmxlbmd0aCkge1xuICAgICAgICBuZXh0VG9rZW4gPSB0b2tlbnNbaWR4ICsgMV07XG5cbiAgICAgICAgaWYgKG5leHRUb2tlbi50eXBlID09PSAnaW5saW5lJyB8fCBuZXh0VG9rZW4uaGlkZGVuKSB7XG4gICAgICAgICAgLy8gQmxvY2stbGV2ZWwgdGFnIGNvbnRhaW5pbmcgYW4gaW5saW5lIHRhZy5cbiAgICAgICAgICAvL1xuICAgICAgICAgIG5lZWRMZiA9IGZhbHNlO1xuXG4gICAgICAgIH0gZWxzZSBpZiAobmV4dFRva2VuLm5lc3RpbmcgPT09IC0xICYmIG5leHRUb2tlbi50YWcgPT09IHRva2VuLnRhZykge1xuICAgICAgICAgIC8vIE9wZW5pbmcgdGFnICsgY2xvc2luZyB0YWcgb2YgdGhlIHNhbWUgdHlwZS4gRS5nLiBgPGxpPjwvbGk+YC5cbiAgICAgICAgICAvL1xuICAgICAgICAgIG5lZWRMZiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVzdWx0ICs9IG5lZWRMZiA/ICc+XFxuJyA6ICc+JztcblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG4vKipcbiAqIFJlbmRlcmVyLnJlbmRlcklubGluZSh0b2tlbnMsIG9wdGlvbnMsIGVudikgLT4gU3RyaW5nXG4gKiAtIHRva2VucyAoQXJyYXkpOiBsaXN0IG9uIGJsb2NrIHRva2VucyB0byByZW50ZXJcbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcGFyYW1zIG9mIHBhcnNlciBpbnN0YW5jZVxuICogLSBlbnYgKE9iamVjdCk6IGFkZGl0aW9uYWwgZGF0YSBmcm9tIHBhcnNlZCBpbnB1dCAocmVmZXJlbmNlcywgZm9yIGV4YW1wbGUpXG4gKlxuICogVGhlIHNhbWUgYXMgW1tSZW5kZXJlci5yZW5kZXJdXSwgYnV0IGZvciBzaW5nbGUgdG9rZW4gb2YgYGlubGluZWAgdHlwZS5cbiAqKi9cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXJJbmxpbmUgPSBmdW5jdGlvbiAodG9rZW5zLCBvcHRpb25zLCBlbnYpIHtcbiAgdmFyIHR5cGUsXG4gICAgICByZXN1bHQgPSAnJyxcbiAgICAgIHJ1bGVzID0gdGhpcy5ydWxlcztcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdHlwZSA9IHRva2Vuc1tpXS50eXBlO1xuXG4gICAgaWYgKHR5cGVvZiBydWxlc1t0eXBlXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJlc3VsdCArPSBydWxlc1t0eXBlXSh0b2tlbnMsIGksIG9wdGlvbnMsIGVudiwgdGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlclRva2VuKHRva2VucywgaSwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuLyoqIGludGVybmFsXG4gKiBSZW5kZXJlci5yZW5kZXJJbmxpbmVBc1RleHQodG9rZW5zLCBvcHRpb25zLCBlbnYpIC0+IFN0cmluZ1xuICogLSB0b2tlbnMgKEFycmF5KTogbGlzdCBvbiBibG9jayB0b2tlbnMgdG8gcmVudGVyXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHBhcmFtcyBvZiBwYXJzZXIgaW5zdGFuY2VcbiAqIC0gZW52IChPYmplY3QpOiBhZGRpdGlvbmFsIGRhdGEgZnJvbSBwYXJzZWQgaW5wdXQgKHJlZmVyZW5jZXMsIGZvciBleGFtcGxlKVxuICpcbiAqIFNwZWNpYWwga2x1ZGdlIGZvciBpbWFnZSBgYWx0YCBhdHRyaWJ1dGVzIHRvIGNvbmZvcm0gQ29tbW9uTWFyayBzcGVjLlxuICogRG9uJ3QgdHJ5IHRvIHVzZSBpdCEgU3BlYyByZXF1aXJlcyB0byBzaG93IGBhbHRgIGNvbnRlbnQgd2l0aCBzdHJpcHBlZCBtYXJrdXAsXG4gKiBpbnN0ZWFkIG9mIHNpbXBsZSBlc2NhcGluZy5cbiAqKi9cblJlbmRlcmVyLnByb3RvdHlwZS5yZW5kZXJJbmxpbmVBc1RleHQgPSBmdW5jdGlvbiAodG9rZW5zLCBvcHRpb25zLCBlbnYpIHtcbiAgdmFyIHJlc3VsdCA9ICcnO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0b2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAodG9rZW5zW2ldLnR5cGUgPT09ICd0ZXh0Jykge1xuICAgICAgcmVzdWx0ICs9IHRva2Vuc1tpXS5jb250ZW50O1xuICAgIH0gZWxzZSBpZiAodG9rZW5zW2ldLnR5cGUgPT09ICdpbWFnZScpIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlcklubGluZUFzVGV4dCh0b2tlbnNbaV0uY2hpbGRyZW4sIG9wdGlvbnMsIGVudik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuLyoqXG4gKiBSZW5kZXJlci5yZW5kZXIodG9rZW5zLCBvcHRpb25zLCBlbnYpIC0+IFN0cmluZ1xuICogLSB0b2tlbnMgKEFycmF5KTogbGlzdCBvbiBibG9jayB0b2tlbnMgdG8gcmVudGVyXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHBhcmFtcyBvZiBwYXJzZXIgaW5zdGFuY2VcbiAqIC0gZW52IChPYmplY3QpOiBhZGRpdGlvbmFsIGRhdGEgZnJvbSBwYXJzZWQgaW5wdXQgKHJlZmVyZW5jZXMsIGZvciBleGFtcGxlKVxuICpcbiAqIFRha2VzIHRva2VuIHN0cmVhbSBhbmQgZ2VuZXJhdGVzIEhUTUwuIFByb2JhYmx5LCB5b3Ugd2lsbCBuZXZlciBuZWVkIHRvIGNhbGxcbiAqIHRoaXMgbWV0aG9kIGRpcmVjdGx5LlxuICoqL1xuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICh0b2tlbnMsIG9wdGlvbnMsIGVudikge1xuICB2YXIgaSwgbGVuLCB0eXBlLFxuICAgICAgcmVzdWx0ID0gJycsXG4gICAgICBydWxlcyA9IHRoaXMucnVsZXM7XG5cbiAgZm9yIChpID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgdHlwZSA9IHRva2Vuc1tpXS50eXBlO1xuXG4gICAgaWYgKHR5cGUgPT09ICdpbmxpbmUnKSB7XG4gICAgICByZXN1bHQgKz0gdGhpcy5yZW5kZXJJbmxpbmUodG9rZW5zW2ldLmNoaWxkcmVuLCBvcHRpb25zLCBlbnYpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJ1bGVzW3R5cGVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmVzdWx0ICs9IHJ1bGVzW3Rva2Vuc1tpXS50eXBlXSh0b2tlbnMsIGksIG9wdGlvbnMsIGVudiwgdGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3VsdCArPSB0aGlzLnJlbmRlclRva2VuKHRva2VucywgaSwgb3B0aW9ucywgZW52KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSZW5kZXJlcjtcbiIsIi8qKlxuICogY2xhc3MgUnVsZXJcbiAqXG4gKiBIZWxwZXIgY2xhc3MsIHVzZWQgYnkgW1tNYXJrZG93bkl0I2NvcmVdXSwgW1tNYXJrZG93bkl0I2Jsb2NrXV0gYW5kXG4gKiBbW01hcmtkb3duSXQjaW5saW5lXV0gdG8gbWFuYWdlIHNlcXVlbmNlcyBvZiBmdW5jdGlvbnMgKHJ1bGVzKTpcbiAqXG4gKiAtIGtlZXAgcnVsZXMgaW4gZGVmaW5lZCBvcmRlclxuICogLSBhc3NpZ24gdGhlIG5hbWUgdG8gZWFjaCBydWxlXG4gKiAtIGVuYWJsZS9kaXNhYmxlIHJ1bGVzXG4gKiAtIGFkZC9yZXBsYWNlIHJ1bGVzXG4gKiAtIGFsbG93IGFzc2lnbiBydWxlcyB0byBhZGRpdGlvbmFsIG5hbWVkIGNoYWlucyAoaW4gdGhlIHNhbWUpXG4gKiAtIGNhY2hlaW5nIGxpc3RzIG9mIGFjdGl2ZSBydWxlc1xuICpcbiAqIFlvdSB3aWxsIG5vdCBuZWVkIHVzZSB0aGlzIGNsYXNzIGRpcmVjdGx5IHVudGlsIHdyaXRlIHBsdWdpbnMuIEZvciBzaW1wbGVcbiAqIHJ1bGVzIGNvbnRyb2wgdXNlIFtbTWFya2Rvd25JdC5kaXNhYmxlXV0sIFtbTWFya2Rvd25JdC5lbmFibGVdXSBhbmRcbiAqIFtbTWFya2Rvd25JdC51c2VdXS5cbiAqKi9cbid1c2Ugc3RyaWN0JztcblxuXG4vKipcbiAqIG5ldyBSdWxlcigpXG4gKiovXG5mdW5jdGlvbiBSdWxlcigpIHtcbiAgLy8gTGlzdCBvZiBhZGRlZCBydWxlcy4gRWFjaCBlbGVtZW50IGlzOlxuICAvL1xuICAvLyB7XG4gIC8vICAgbmFtZTogWFhYLFxuICAvLyAgIGVuYWJsZWQ6IEJvb2xlYW4sXG4gIC8vICAgZm46IEZ1bmN0aW9uKCksXG4gIC8vICAgYWx0OiBbIG5hbWUyLCBuYW1lMyBdXG4gIC8vIH1cbiAgLy9cbiAgdGhpcy5fX3J1bGVzX18gPSBbXTtcblxuICAvLyBDYWNoZWQgcnVsZSBjaGFpbnMuXG4gIC8vXG4gIC8vIEZpcnN0IGxldmVsIC0gY2hhaW4gbmFtZSwgJycgZm9yIGRlZmF1bHQuXG4gIC8vIFNlY29uZCBsZXZlbCAtIGRpZ2luYWwgYW5jaG9yIGZvciBmYXN0IGZpbHRlcmluZyBieSBjaGFyY29kZXMuXG4gIC8vXG4gIHRoaXMuX19jYWNoZV9fID0gbnVsbDtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIEhlbHBlciBtZXRob2RzLCBzaG91bGQgbm90IGJlIHVzZWQgZGlyZWN0bHlcblxuXG4vLyBGaW5kIHJ1bGUgaW5kZXggYnkgbmFtZVxuLy9cblJ1bGVyLnByb3RvdHlwZS5fX2ZpbmRfXyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fX3J1bGVzX18ubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodGhpcy5fX3J1bGVzX19baV0ubmFtZSA9PT0gbmFtZSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn07XG5cblxuLy8gQnVpbGQgcnVsZXMgbG9va3VwIGNhY2hlXG4vL1xuUnVsZXIucHJvdG90eXBlLl9fY29tcGlsZV9fID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBjaGFpbnMgPSBbICcnIF07XG5cbiAgLy8gY29sbGVjdCB1bmlxdWUgbmFtZXNcbiAgc2VsZi5fX3J1bGVzX18uZm9yRWFjaChmdW5jdGlvbiAocnVsZSkge1xuICAgIGlmICghcnVsZS5lbmFibGVkKSB7IHJldHVybjsgfVxuXG4gICAgcnVsZS5hbHQuZm9yRWFjaChmdW5jdGlvbiAoYWx0TmFtZSkge1xuICAgICAgaWYgKGNoYWlucy5pbmRleE9mKGFsdE5hbWUpIDwgMCkge1xuICAgICAgICBjaGFpbnMucHVzaChhbHROYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgc2VsZi5fX2NhY2hlX18gPSB7fTtcblxuICBjaGFpbnMuZm9yRWFjaChmdW5jdGlvbiAoY2hhaW4pIHtcbiAgICBzZWxmLl9fY2FjaGVfX1tjaGFpbl0gPSBbXTtcbiAgICBzZWxmLl9fcnVsZXNfXy5mb3JFYWNoKGZ1bmN0aW9uIChydWxlKSB7XG4gICAgICBpZiAoIXJ1bGUuZW5hYmxlZCkgeyByZXR1cm47IH1cblxuICAgICAgaWYgKGNoYWluICYmIHJ1bGUuYWx0LmluZGV4T2YoY2hhaW4pIDwgMCkgeyByZXR1cm47IH1cblxuICAgICAgc2VsZi5fX2NhY2hlX19bY2hhaW5dLnB1c2gocnVsZS5mbik7XG4gICAgfSk7XG4gIH0pO1xufTtcblxuXG4vKipcbiAqIFJ1bGVyLmF0KG5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICogLSBuYW1lIChTdHJpbmcpOiBydWxlIG5hbWUgdG8gcmVwbGFjZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogbmV3IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IG5ldyBydWxlIG9wdGlvbnMgKG5vdCBtYW5kYXRvcnkpLlxuICpcbiAqIFJlcGxhY2UgcnVsZSBieSBuYW1lIHdpdGggbmV3IGZ1bmN0aW9uICYgb3B0aW9ucy4gVGhyb3dzIGVycm9yIGlmIG5hbWUgbm90XG4gKiBmb3VuZC5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIFJlcGxhY2UgZXhpc3RpbmcgdHlwb2dyYXBoZXIgcmVwbGFjZW1lbnQgcnVsZSB3aXRoIG5ldyBvbmU6XG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmNvcmUucnVsZXIuYXQoJ3JlcGxhY2VtZW50cycsIGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAqICAgLy8uLi5cbiAqIH0pO1xuICogYGBgXG4gKiovXG5SdWxlci5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAobmFtZSwgZm4sIG9wdGlvbnMpIHtcbiAgdmFyIGluZGV4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKTtcbiAgdmFyIG9wdCA9IG9wdGlvbnMgfHwge307XG5cbiAgaWYgKGluZGV4ID09PSAtMSkgeyB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlciBydWxlIG5vdCBmb3VuZDogJyArIG5hbWUpOyB9XG5cbiAgdGhpcy5fX3J1bGVzX19baW5kZXhdLmZuID0gZm47XG4gIHRoaXMuX19ydWxlc19fW2luZGV4XS5hbHQgPSBvcHQuYWx0IHx8IFtdO1xuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG59O1xuXG5cbi8qKlxuICogUnVsZXIuYmVmb3JlKGJlZm9yZU5hbWUsIHJ1bGVOYW1lLCBmbiBbLCBvcHRpb25zXSlcbiAqIC0gYmVmb3JlTmFtZSAoU3RyaW5nKTogbmV3IHJ1bGUgd2lsbCBiZSBhZGRlZCBiZWZvcmUgdGhpcyBvbmUuXG4gKiAtIHJ1bGVOYW1lIChTdHJpbmcpOiBuYW1lIG9mIGFkZGVkIHJ1bGUuXG4gKiAtIGZuIChGdW5jdGlvbik6IHJ1bGUgZnVuY3Rpb24uXG4gKiAtIG9wdGlvbnMgKE9iamVjdCk6IHJ1bGUgb3B0aW9ucyAobm90IG1hbmRhdG9yeSkuXG4gKlxuICogQWRkIG5ldyBydWxlIHRvIGNoYWluIGJlZm9yZSBvbmUgd2l0aCBnaXZlbiBuYW1lLiBTZWUgYWxzb1xuICogW1tSdWxlci5hZnRlcl1dLCBbW1J1bGVyLnB1c2hdXS5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiBtZC5ibG9jay5ydWxlci5iZWZvcmUoJ3BhcmFncmFwaCcsICdteV9ydWxlJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5iZWZvcmUgPSBmdW5jdGlvbiAoYmVmb3JlTmFtZSwgcnVsZU5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIHZhciBpbmRleCA9IHRoaXMuX19maW5kX18oYmVmb3JlTmFtZSk7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGlmIChpbmRleCA9PT0gLTEpIHsgdGhyb3cgbmV3IEVycm9yKCdQYXJzZXIgcnVsZSBub3QgZm91bmQ6ICcgKyBiZWZvcmVOYW1lKTsgfVxuXG4gIHRoaXMuX19ydWxlc19fLnNwbGljZShpbmRleCwgMCwge1xuICAgIG5hbWU6IHJ1bGVOYW1lLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZm46IGZuLFxuICAgIGFsdDogb3B0LmFsdCB8fCBbXVxuICB9KTtcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG59O1xuXG5cbi8qKlxuICogUnVsZXIuYWZ0ZXIoYWZ0ZXJOYW1lLCBydWxlTmFtZSwgZm4gWywgb3B0aW9uc10pXG4gKiAtIGFmdGVyTmFtZSAoU3RyaW5nKTogbmV3IHJ1bGUgd2lsbCBiZSBhZGRlZCBhZnRlciB0aGlzIG9uZS5cbiAqIC0gcnVsZU5hbWUgKFN0cmluZyk6IG5hbWUgb2YgYWRkZWQgcnVsZS5cbiAqIC0gZm4gKEZ1bmN0aW9uKTogcnVsZSBmdW5jdGlvbi5cbiAqIC0gb3B0aW9ucyAoT2JqZWN0KTogcnVsZSBvcHRpb25zIChub3QgbWFuZGF0b3J5KS5cbiAqXG4gKiBBZGQgbmV3IHJ1bGUgdG8gY2hhaW4gYWZ0ZXIgb25lIHdpdGggZ2l2ZW4gbmFtZS4gU2VlIGFsc29cbiAqIFtbUnVsZXIuYmVmb3JlXV0sIFtbUnVsZXIucHVzaF1dLlxuICpcbiAqICMjIyMjIE9wdGlvbnM6XG4gKlxuICogLSBfX2FsdF9fIC0gYXJyYXkgd2l0aCBuYW1lcyBvZiBcImFsdGVybmF0ZVwiIGNoYWlucy5cbiAqXG4gKiAjIyMjIyBFeGFtcGxlXG4gKlxuICogYGBgamF2YXNjcmlwdFxuICogdmFyIG1kID0gcmVxdWlyZSgnbWFya2Rvd24taXQnKSgpO1xuICpcbiAqIG1kLmlubGluZS5ydWxlci5hZnRlcigndGV4dCcsICdteV9ydWxlJywgZnVuY3Rpb24gcmVwbGFjZShzdGF0ZSkge1xuICogICAvLy4uLlxuICogfSk7XG4gKiBgYGBcbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5hZnRlciA9IGZ1bmN0aW9uIChhZnRlck5hbWUsIHJ1bGVOYW1lLCBmbiwgb3B0aW9ucykge1xuICB2YXIgaW5kZXggPSB0aGlzLl9fZmluZF9fKGFmdGVyTmFtZSk7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGlmIChpbmRleCA9PT0gLTEpIHsgdGhyb3cgbmV3IEVycm9yKCdQYXJzZXIgcnVsZSBub3QgZm91bmQ6ICcgKyBhZnRlck5hbWUpOyB9XG5cbiAgdGhpcy5fX3J1bGVzX18uc3BsaWNlKGluZGV4ICsgMSwgMCwge1xuICAgIG5hbWU6IHJ1bGVOYW1lLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZm46IGZuLFxuICAgIGFsdDogb3B0LmFsdCB8fCBbXVxuICB9KTtcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG59O1xuXG4vKipcbiAqIFJ1bGVyLnB1c2gocnVsZU5hbWUsIGZuIFssIG9wdGlvbnNdKVxuICogLSBydWxlTmFtZSAoU3RyaW5nKTogbmFtZSBvZiBhZGRlZCBydWxlLlxuICogLSBmbiAoRnVuY3Rpb24pOiBydWxlIGZ1bmN0aW9uLlxuICogLSBvcHRpb25zIChPYmplY3QpOiBydWxlIG9wdGlvbnMgKG5vdCBtYW5kYXRvcnkpLlxuICpcbiAqIFB1c2ggbmV3IHJ1bGUgdG8gdGhlIGVuZCBvZiBjaGFpbi4gU2VlIGFsc29cbiAqIFtbUnVsZXIuYmVmb3JlXV0sIFtbUnVsZXIuYWZ0ZXJdXS5cbiAqXG4gKiAjIyMjIyBPcHRpb25zOlxuICpcbiAqIC0gX19hbHRfXyAtIGFycmF5IHdpdGggbmFtZXMgb2YgXCJhbHRlcm5hdGVcIiBjaGFpbnMuXG4gKlxuICogIyMjIyMgRXhhbXBsZVxuICpcbiAqIGBgYGphdmFzY3JpcHRcbiAqIHZhciBtZCA9IHJlcXVpcmUoJ21hcmtkb3duLWl0JykoKTtcbiAqXG4gKiBtZC5jb3JlLnJ1bGVyLnB1c2goJ215X3J1bGUnLCBmdW5jdGlvbiByZXBsYWNlKHN0YXRlKSB7XG4gKiAgIC8vLi4uXG4gKiB9KTtcbiAqIGBgYFxuICoqL1xuUnVsZXIucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAocnVsZU5hbWUsIGZuLCBvcHRpb25zKSB7XG4gIHZhciBvcHQgPSBvcHRpb25zIHx8IHt9O1xuXG4gIHRoaXMuX19ydWxlc19fLnB1c2goe1xuICAgIG5hbWU6IHJ1bGVOYW1lLFxuICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgZm46IGZuLFxuICAgIGFsdDogb3B0LmFsdCB8fCBbXVxuICB9KTtcblxuICB0aGlzLl9fY2FjaGVfXyA9IG51bGw7XG59O1xuXG5cbi8qKlxuICogUnVsZXIuZW5hYmxlKGxpc3QgWywgaWdub3JlSW52YWxpZF0pIC0+IEFycmF5XG4gKiAtIGxpc3QgKFN0cmluZ3xBcnJheSk6IGxpc3Qgb2YgcnVsZSBuYW1lcyB0byBlbmFibGUuXG4gKiAtIGlnbm9yZUludmFsaWQgKEJvb2xlYW4pOiBzZXQgYHRydWVgIHRvIGlnbm9yZSBlcnJvcnMgd2hlbiBydWxlIG5vdCBmb3VuZC5cbiAqXG4gKiBFbmFibGUgcnVsZXMgd2l0aCBnaXZlbiBuYW1lcy4gSWYgYW55IHJ1bGUgbmFtZSBub3QgZm91bmQgLSB0aHJvdyBFcnJvci5cbiAqIEVycm9ycyBjYW4gYmUgZGlzYWJsZWQgYnkgc2Vjb25kIHBhcmFtLlxuICpcbiAqIFJldHVybnMgbGlzdCBvZiBmb3VuZCBydWxlIG5hbWVzIChpZiBubyBleGNlcHRpb24gaGFwcGVuZWQpLlxuICpcbiAqIFNlZSBhbHNvIFtbUnVsZXIuZGlzYWJsZV1dLCBbW1J1bGVyLmVuYWJsZU9ubHldXS5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5lbmFibGUgPSBmdW5jdGlvbiAobGlzdCwgaWdub3JlSW52YWxpZCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHsgbGlzdCA9IFsgbGlzdCBdOyB9XG5cbiAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gIC8vIFNlYXJjaCBieSBuYW1lIGFuZCBlbmFibGVcbiAgbGlzdC5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdmFyIGlkeCA9IHRoaXMuX19maW5kX18obmFtZSk7XG5cbiAgICBpZiAoaWR4IDwgMCkge1xuICAgICAgaWYgKGlnbm9yZUludmFsaWQpIHsgcmV0dXJuOyB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1J1bGVzIG1hbmFnZXI6IGludmFsaWQgcnVsZSBuYW1lICcgKyBuYW1lKTtcbiAgICB9XG4gICAgdGhpcy5fX3J1bGVzX19baWR4XS5lbmFibGVkID0gdHJ1ZTtcbiAgICByZXN1bHQucHVzaChuYW1lKTtcbiAgfSwgdGhpcyk7XG5cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG4vKipcbiAqIFJ1bGVyLmVuYWJsZU9ubHkobGlzdCBbLCBpZ25vcmVJbnZhbGlkXSlcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogbGlzdCBvZiBydWxlIG5hbWVzIHRvIGVuYWJsZSAod2hpdGVsaXN0KS5cbiAqIC0gaWdub3JlSW52YWxpZCAoQm9vbGVhbik6IHNldCBgdHJ1ZWAgdG8gaWdub3JlIGVycm9ycyB3aGVuIHJ1bGUgbm90IGZvdW5kLlxuICpcbiAqIEVuYWJsZSBydWxlcyB3aXRoIGdpdmVuIG5hbWVzLCBhbmQgZGlzYWJsZSBldmVyeXRoaW5nIGVsc2UuIElmIGFueSBydWxlIG5hbWVcbiAqIG5vdCBmb3VuZCAtIHRocm93IEVycm9yLiBFcnJvcnMgY2FuIGJlIGRpc2FibGVkIGJ5IHNlY29uZCBwYXJhbS5cbiAqXG4gKiBTZWUgYWxzbyBbW1J1bGVyLmRpc2FibGVdXSwgW1tSdWxlci5lbmFibGVdXS5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5lbmFibGVPbmx5ID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbIGxpc3QgXTsgfVxuXG4gIHRoaXMuX19ydWxlc19fLmZvckVhY2goZnVuY3Rpb24gKHJ1bGUpIHsgcnVsZS5lbmFibGVkID0gZmFsc2U7IH0pO1xuXG4gIHRoaXMuZW5hYmxlKGxpc3QsIGlnbm9yZUludmFsaWQpO1xufTtcblxuXG4vKipcbiAqIFJ1bGVyLmRpc2FibGUobGlzdCBbLCBpZ25vcmVJbnZhbGlkXSkgLT4gQXJyYXlcbiAqIC0gbGlzdCAoU3RyaW5nfEFycmF5KTogbGlzdCBvZiBydWxlIG5hbWVzIHRvIGRpc2FibGUuXG4gKiAtIGlnbm9yZUludmFsaWQgKEJvb2xlYW4pOiBzZXQgYHRydWVgIHRvIGlnbm9yZSBlcnJvcnMgd2hlbiBydWxlIG5vdCBmb3VuZC5cbiAqXG4gKiBEaXNhYmxlIHJ1bGVzIHdpdGggZ2l2ZW4gbmFtZXMuIElmIGFueSBydWxlIG5hbWUgbm90IGZvdW5kIC0gdGhyb3cgRXJyb3IuXG4gKiBFcnJvcnMgY2FuIGJlIGRpc2FibGVkIGJ5IHNlY29uZCBwYXJhbS5cbiAqXG4gKiBSZXR1cm5zIGxpc3Qgb2YgZm91bmQgcnVsZSBuYW1lcyAoaWYgbm8gZXhjZXB0aW9uIGhhcHBlbmVkKS5cbiAqXG4gKiBTZWUgYWxzbyBbW1J1bGVyLmVuYWJsZV1dLCBbW1J1bGVyLmVuYWJsZU9ubHldXS5cbiAqKi9cblJ1bGVyLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24gKGxpc3QsIGlnbm9yZUludmFsaWQpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7IGxpc3QgPSBbIGxpc3QgXTsgfVxuXG4gIHZhciByZXN1bHQgPSBbXTtcblxuICAvLyBTZWFyY2ggYnkgbmFtZSBhbmQgZGlzYWJsZVxuICBsaXN0LmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB2YXIgaWR4ID0gdGhpcy5fX2ZpbmRfXyhuYW1lKTtcblxuICAgIGlmIChpZHggPCAwKSB7XG4gICAgICBpZiAoaWdub3JlSW52YWxpZCkgeyByZXR1cm47IH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignUnVsZXMgbWFuYWdlcjogaW52YWxpZCBydWxlIG5hbWUgJyArIG5hbWUpO1xuICAgIH1cbiAgICB0aGlzLl9fcnVsZXNfX1tpZHhdLmVuYWJsZWQgPSBmYWxzZTtcbiAgICByZXN1bHQucHVzaChuYW1lKTtcbiAgfSwgdGhpcyk7XG5cbiAgdGhpcy5fX2NhY2hlX18gPSBudWxsO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG4vKipcbiAqIFJ1bGVyLmdldFJ1bGVzKGNoYWluTmFtZSkgLT4gQXJyYXlcbiAqXG4gKiBSZXR1cm4gYXJyYXkgb2YgYWN0aXZlIGZ1bmN0aW9ucyAocnVsZXMpIGZvciBnaXZlbiBjaGFpbiBuYW1lLiBJdCBhbmFseXplc1xuICogcnVsZXMgY29uZmlndXJhdGlvbiwgY29tcGlsZXMgY2FjaGVzIGlmIG5vdCBleGlzdHMgYW5kIHJldHVybnMgcmVzdWx0LlxuICpcbiAqIERlZmF1bHQgY2hhaW4gbmFtZSBpcyBgJydgIChlbXB0eSBzdHJpbmcpLiBJdCBjYW4ndCBiZSBza2lwcGVkLiBUaGF0J3NcbiAqIGRvbmUgaW50ZW50aW9uYWxseSwgdG8ga2VlcCBzaWduYXR1cmUgbW9ub21vcnBoaWMgZm9yIGhpZ2ggc3BlZWQuXG4gKiovXG5SdWxlci5wcm90b3R5cGUuZ2V0UnVsZXMgPSBmdW5jdGlvbiAoY2hhaW5OYW1lKSB7XG4gIGlmICh0aGlzLl9fY2FjaGVfXyA9PT0gbnVsbCkge1xuICAgIHRoaXMuX19jb21waWxlX18oKTtcbiAgfVxuXG4gIC8vIENoYWluIGNhbiBiZSBlbXB0eSwgaWYgcnVsZXMgZGlzYWJsZWQuIEJ1dCB3ZSBzdGlsbCBoYXZlIHRvIHJldHVybiBBcnJheS5cbiAgcmV0dXJuIHRoaXMuX19jYWNoZV9fW2NoYWluTmFtZV0gfHwgW107XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJ1bGVyO1xuIiwiLy8gQmxvY2sgcXVvdGVzXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzU3BhY2UgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmxvY2txdW90ZShzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIGFkanVzdFRhYixcbiAgICAgIGNoLFxuICAgICAgaSxcbiAgICAgIGluaXRpYWwsXG4gICAgICBsLFxuICAgICAgbGFzdExpbmVFbXB0eSxcbiAgICAgIGxpbmVzLFxuICAgICAgbmV4dExpbmUsXG4gICAgICBvZmZzZXQsXG4gICAgICBvbGRCTWFya3MsXG4gICAgICBvbGRCU0NvdW50LFxuICAgICAgb2xkSW5kZW50LFxuICAgICAgb2xkUGFyZW50VHlwZSxcbiAgICAgIG9sZFNDb3VudCxcbiAgICAgIG9sZFRTaGlmdCxcbiAgICAgIHNwYWNlQWZ0ZXJNYXJrZXIsXG4gICAgICB0ZXJtaW5hdGUsXG4gICAgICB0ZXJtaW5hdG9yUnVsZXMsXG4gICAgICB0b2tlbixcbiAgICAgIHdhc091dGRlbnRlZCxcbiAgICAgIG9sZExpbmVNYXggPSBzdGF0ZS5saW5lTWF4LFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIGNoZWNrIHRoZSBibG9jayBxdW90ZSBtYXJrZXJcbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKSAhPT0gMHgzRS8qID4gKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gd2Uga25vdyB0aGF0IGl0J3MgZ29pbmcgdG8gYmUgYSB2YWxpZCBibG9ja3F1b3RlLFxuICAvLyBzbyBubyBwb2ludCB0cnlpbmcgdG8gZmluZCB0aGUgZW5kIG9mIGl0IGluIHNpbGVudCBtb2RlXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWU7IH1cblxuICAvLyBza2lwIHNwYWNlcyBhZnRlciBcIj5cIiBhbmQgcmUtY2FsY3VsYXRlIG9mZnNldFxuICBpbml0aWFsID0gb2Zmc2V0ID0gc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gKyBwb3MgLSAoc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSk7XG5cbiAgLy8gc2tpcCBvbmUgb3B0aW9uYWwgc3BhY2UgYWZ0ZXIgJz4nXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDIwIC8qIHNwYWNlICovKSB7XG4gICAgLy8gJyA+ICAgdGVzdCAnXG4gICAgLy8gICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlOlxuICAgIHBvcysrO1xuICAgIGluaXRpYWwrKztcbiAgICBvZmZzZXQrKztcbiAgICBhZGp1c3RUYWIgPSBmYWxzZTtcbiAgICBzcGFjZUFmdGVyTWFya2VyID0gdHJ1ZTtcbiAgfSBlbHNlIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDA5IC8qIHRhYiAqLykge1xuICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSB0cnVlO1xuXG4gICAgaWYgKChzdGF0ZS5ic0NvdW50W3N0YXJ0TGluZV0gKyBvZmZzZXQpICUgNCA9PT0gMykge1xuICAgICAgLy8gJyAgPlxcdCAgdGVzdCAnXG4gICAgICAvLyAgICAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZSAodGFiIGhhcyB3aWR0aD09PTEpXG4gICAgICBwb3MrKztcbiAgICAgIGluaXRpYWwrKztcbiAgICAgIG9mZnNldCsrO1xuICAgICAgYWRqdXN0VGFiID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vICcgPlxcdCAgdGVzdCAnXG4gICAgICAvLyAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZSArIHNoaWZ0IGJzQ291bnQgc2xpZ2h0bHlcbiAgICAgIC8vICAgICAgICAgdG8gbWFrZSBleHRyYSBzcGFjZSBhcHBlYXJcbiAgICAgIGFkanVzdFRhYiA9IHRydWU7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSBmYWxzZTtcbiAgfVxuXG4gIG9sZEJNYXJrcyA9IFsgc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gXTtcbiAgc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gPSBwb3M7XG5cbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgIG9mZnNldCArPSA0IC0gKG9mZnNldCArIHN0YXRlLmJzQ291bnRbc3RhcnRMaW5lXSArIChhZGp1c3RUYWIgPyAxIDogMCkpICUgNDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9mZnNldCsrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBwb3MrKztcbiAgfVxuXG4gIG9sZEJTQ291bnQgPSBbIHN0YXRlLmJzQ291bnRbc3RhcnRMaW5lXSBdO1xuICBzdGF0ZS5ic0NvdW50W3N0YXJ0TGluZV0gPSBzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSArIDEgKyAoc3BhY2VBZnRlck1hcmtlciA/IDEgOiAwKTtcblxuICBsYXN0TGluZUVtcHR5ID0gcG9zID49IG1heDtcblxuICBvbGRTQ291bnQgPSBbIHN0YXRlLnNDb3VudFtzdGFydExpbmVdIF07XG4gIHN0YXRlLnNDb3VudFtzdGFydExpbmVdID0gb2Zmc2V0IC0gaW5pdGlhbDtcblxuICBvbGRUU2hpZnQgPSBbIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdIF07XG4gIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdID0gcG9zIC0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV07XG5cbiAgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ2Jsb2NrcXVvdGUnKTtcblxuICBvbGRQYXJlbnRUeXBlID0gc3RhdGUucGFyZW50VHlwZTtcbiAgc3RhdGUucGFyZW50VHlwZSA9ICdibG9ja3F1b3RlJztcbiAgd2FzT3V0ZGVudGVkID0gZmFsc2U7XG5cbiAgLy8gU2VhcmNoIHRoZSBlbmQgb2YgdGhlIGJsb2NrXG4gIC8vXG4gIC8vIEJsb2NrIGVuZHMgd2l0aCBlaXRoZXI6XG4gIC8vICAxLiBhbiBlbXB0eSBsaW5lIG91dHNpZGU6XG4gIC8vICAgICBgYGBcbiAgLy8gICAgID4gdGVzdFxuICAvL1xuICAvLyAgICAgYGBgXG4gIC8vICAyLiBhbiBlbXB0eSBsaW5lIGluc2lkZTpcbiAgLy8gICAgIGBgYFxuICAvLyAgICAgPlxuICAvLyAgICAgdGVzdFxuICAvLyAgICAgYGBgXG4gIC8vICAzLiBhbm90aGVyIHRhZzpcbiAgLy8gICAgIGBgYFxuICAvLyAgICAgPiB0ZXN0XG4gIC8vICAgICAgLSAtIC1cbiAgLy8gICAgIGBgYFxuICBmb3IgKG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTsgbmV4dExpbmUgPCBlbmRMaW5lOyBuZXh0TGluZSsrKSB7XG4gICAgLy8gY2hlY2sgaWYgaXQncyBvdXRkZW50ZWQsIGkuZS4gaXQncyBpbnNpZGUgbGlzdCBpdGVtIGFuZCBpbmRlbnRlZFxuICAgIC8vIGxlc3MgdGhhbiBzYWlkIGxpc3QgaXRlbTpcbiAgICAvL1xuICAgIC8vIGBgYFxuICAgIC8vIDEuIGFueXRoaW5nXG4gICAgLy8gICAgPiBjdXJyZW50IGJsb2NrcXVvdGVcbiAgICAvLyAyLiBjaGVja2luZyB0aGlzIGxpbmVcbiAgICAvLyBgYGBcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgd2FzT3V0ZGVudGVkID0gdHJ1ZTtcblxuICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICAgIG1heCA9IHN0YXRlLmVNYXJrc1tuZXh0TGluZV07XG5cbiAgICBpZiAocG9zID49IG1heCkge1xuICAgICAgLy8gQ2FzZSAxOiBsaW5lIGlzIG5vdCBpbnNpZGUgdGhlIGJsb2NrcXVvdGUsIGFuZCB0aGlzIGxpbmUgaXMgZW1wdHkuXG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspID09PSAweDNFLyogPiAqLyAmJiAhd2FzT3V0ZGVudGVkKSB7XG4gICAgICAvLyBUaGlzIGxpbmUgaXMgaW5zaWRlIHRoZSBibG9ja3F1b3RlLlxuXG4gICAgICAvLyBza2lwIHNwYWNlcyBhZnRlciBcIj5cIiBhbmQgcmUtY2FsY3VsYXRlIG9mZnNldFxuICAgICAgaW5pdGlhbCA9IG9mZnNldCA9IHN0YXRlLnNDb3VudFtuZXh0TGluZV0gKyBwb3MgLSAoc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pO1xuXG4gICAgICAvLyBza2lwIG9uZSBvcHRpb25hbCBzcGFjZSBhZnRlciAnPidcbiAgICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDIwIC8qIHNwYWNlICovKSB7XG4gICAgICAgIC8vICcgPiAgIHRlc3QgJ1xuICAgICAgICAvLyAgICAgXiAtLSBwb3NpdGlvbiBzdGFydCBvZiBsaW5lIGhlcmU6XG4gICAgICAgIHBvcysrO1xuICAgICAgICBpbml0aWFsKys7XG4gICAgICAgIG9mZnNldCsrO1xuICAgICAgICBhZGp1c3RUYWIgPSBmYWxzZTtcbiAgICAgICAgc3BhY2VBZnRlck1hcmtlciA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MDkgLyogdGFiICovKSB7XG4gICAgICAgIHNwYWNlQWZ0ZXJNYXJrZXIgPSB0cnVlO1xuXG4gICAgICAgIGlmICgoc3RhdGUuYnNDb3VudFtuZXh0TGluZV0gKyBvZmZzZXQpICUgNCA9PT0gMykge1xuICAgICAgICAgIC8vICcgID5cXHQgIHRlc3QgJ1xuICAgICAgICAgIC8vICAgICAgIF4gLS0gcG9zaXRpb24gc3RhcnQgb2YgbGluZSBoZXJlICh0YWIgaGFzIHdpZHRoPT09MSlcbiAgICAgICAgICBwb3MrKztcbiAgICAgICAgICBpbml0aWFsKys7XG4gICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgICAgYWRqdXN0VGFiID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gJyA+XFx0ICB0ZXN0ICdcbiAgICAgICAgICAvLyAgICBeIC0tIHBvc2l0aW9uIHN0YXJ0IG9mIGxpbmUgaGVyZSArIHNoaWZ0IGJzQ291bnQgc2xpZ2h0bHlcbiAgICAgICAgICAvLyAgICAgICAgIHRvIG1ha2UgZXh0cmEgc3BhY2UgYXBwZWFyXG4gICAgICAgICAgYWRqdXN0VGFiID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3BhY2VBZnRlck1hcmtlciA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBvbGRCTWFya3MucHVzaChzdGF0ZS5iTWFya3NbbmV4dExpbmVdKTtcbiAgICAgIHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gPSBwb3M7XG5cbiAgICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gICAgICAgIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgICAgIGlmIChjaCA9PT0gMHgwOSkge1xuICAgICAgICAgICAgb2Zmc2V0ICs9IDQgLSAob2Zmc2V0ICsgc3RhdGUuYnNDb3VudFtuZXh0TGluZV0gKyAoYWRqdXN0VGFiID8gMSA6IDApKSAlIDQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9mZnNldCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHBvcysrO1xuICAgICAgfVxuXG4gICAgICBsYXN0TGluZUVtcHR5ID0gcG9zID49IG1heDtcblxuICAgICAgb2xkQlNDb3VudC5wdXNoKHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKTtcbiAgICAgIHN0YXRlLmJzQ291bnRbbmV4dExpbmVdID0gc3RhdGUuc0NvdW50W25leHRMaW5lXSArIDEgKyAoc3BhY2VBZnRlck1hcmtlciA/IDEgOiAwKTtcblxuICAgICAgb2xkU0NvdW50LnB1c2goc3RhdGUuc0NvdW50W25leHRMaW5lXSk7XG4gICAgICBzdGF0ZS5zQ291bnRbbmV4dExpbmVdID0gb2Zmc2V0IC0gaW5pdGlhbDtcblxuICAgICAgb2xkVFNoaWZ0LnB1c2goc3RhdGUudFNoaWZ0W25leHRMaW5lXSk7XG4gICAgICBzdGF0ZS50U2hpZnRbbmV4dExpbmVdID0gcG9zIC0gc3RhdGUuYk1hcmtzW25leHRMaW5lXTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIENhc2UgMjogbGluZSBpcyBub3QgaW5zaWRlIHRoZSBibG9ja3F1b3RlLCBhbmQgdGhlIGxhc3QgbGluZSB3YXMgZW1wdHkuXG4gICAgaWYgKGxhc3RMaW5lRW1wdHkpIHsgYnJlYWs7IH1cblxuICAgIC8vIENhc2UgMzogYW5vdGhlciB0YWcgZm91bmQuXG4gICAgdGVybWluYXRlID0gZmFsc2U7XG4gICAgZm9yIChpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGVybWluYXRlKSB7XG4gICAgICAvLyBRdWlyayB0byBlbmZvcmNlIFwiaGFyZCB0ZXJtaW5hdGlvbiBtb2RlXCIgZm9yIHBhcmFncmFwaHM7XG4gICAgICAvLyBub3JtYWxseSBpZiB5b3UgY2FsbCBgdG9rZW5pemUoc3RhdGUsIHN0YXJ0TGluZSwgbmV4dExpbmUpYCxcbiAgICAgIC8vIHBhcmFncmFwaHMgd2lsbCBsb29rIGJlbG93IG5leHRMaW5lIGZvciBwYXJhZ3JhcGggY29udGludWF0aW9uLFxuICAgICAgLy8gYnV0IGlmIGJsb2NrcXVvdGUgaXMgdGVybWluYXRlZCBieSBhbm90aGVyIHRhZywgdGhleSBzaG91bGRuJ3RcbiAgICAgIHN0YXRlLmxpbmVNYXggPSBuZXh0TGluZTtcblxuICAgICAgaWYgKHN0YXRlLmJsa0luZGVudCAhPT0gMCkge1xuICAgICAgICAvLyBzdGF0ZS5ibGtJbmRlbnQgd2FzIG5vbi16ZXJvLCB3ZSBub3cgc2V0IGl0IHRvIHplcm8sXG4gICAgICAgIC8vIHNvIHdlIG5lZWQgdG8gcmUtY2FsY3VsYXRlIGFsbCBvZmZzZXRzIHRvIGFwcGVhciBhc1xuICAgICAgICAvLyBpZiBpbmRlbnQgd2Fzbid0IGNoYW5nZWRcbiAgICAgICAgb2xkQk1hcmtzLnB1c2goc3RhdGUuYk1hcmtzW25leHRMaW5lXSk7XG4gICAgICAgIG9sZEJTQ291bnQucHVzaChzdGF0ZS5ic0NvdW50W25leHRMaW5lXSk7XG4gICAgICAgIG9sZFRTaGlmdC5wdXNoKHN0YXRlLnRTaGlmdFtuZXh0TGluZV0pO1xuICAgICAgICBvbGRTQ291bnQucHVzaChzdGF0ZS5zQ291bnRbbmV4dExpbmVdKTtcbiAgICAgICAgc3RhdGUuc0NvdW50W25leHRMaW5lXSAtPSBzdGF0ZS5ibGtJbmRlbnQ7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIG9sZEJNYXJrcy5wdXNoKHN0YXRlLmJNYXJrc1tuZXh0TGluZV0pO1xuICAgIG9sZEJTQ291bnQucHVzaChzdGF0ZS5ic0NvdW50W25leHRMaW5lXSk7XG4gICAgb2xkVFNoaWZ0LnB1c2goc3RhdGUudFNoaWZ0W25leHRMaW5lXSk7XG4gICAgb2xkU0NvdW50LnB1c2goc3RhdGUuc0NvdW50W25leHRMaW5lXSk7XG5cbiAgICAvLyBBIG5lZ2F0aXZlIGluZGVudGF0aW9uIG1lYW5zIHRoYXQgdGhpcyBpcyBhIHBhcmFncmFwaCBjb250aW51YXRpb25cbiAgICAvL1xuICAgIHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPSAtMTtcbiAgfVxuXG4gIG9sZEluZGVudCA9IHN0YXRlLmJsa0luZGVudDtcbiAgc3RhdGUuYmxrSW5kZW50ID0gMDtcblxuICB0b2tlbiAgICAgICAgPSBzdGF0ZS5wdXNoKCdibG9ja3F1b3RlX29wZW4nLCAnYmxvY2txdW90ZScsIDEpO1xuICB0b2tlbi5tYXJrdXAgPSAnPic7XG4gIHRva2VuLm1hcCAgICA9IGxpbmVzID0gWyBzdGFydExpbmUsIDAgXTtcblxuICBzdGF0ZS5tZC5ibG9jay50b2tlbml6ZShzdGF0ZSwgc3RhcnRMaW5lLCBuZXh0TGluZSk7XG5cbiAgdG9rZW4gICAgICAgID0gc3RhdGUucHVzaCgnYmxvY2txdW90ZV9jbG9zZScsICdibG9ja3F1b3RlJywgLTEpO1xuICB0b2tlbi5tYXJrdXAgPSAnPic7XG5cbiAgc3RhdGUubGluZU1heCA9IG9sZExpbmVNYXg7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlO1xuICBsaW5lc1sxXSA9IHN0YXRlLmxpbmU7XG5cbiAgLy8gUmVzdG9yZSBvcmlnaW5hbCB0U2hpZnQ7IHRoaXMgbWlnaHQgbm90IGJlIG5lY2Vzc2FyeSBzaW5jZSB0aGUgcGFyc2VyXG4gIC8vIGhhcyBhbHJlYWR5IGJlZW4gaGVyZSwgYnV0IGp1c3QgdG8gbWFrZSBzdXJlIHdlIGNhbiBkbyB0aGF0LlxuICBmb3IgKGkgPSAwOyBpIDwgb2xkVFNoaWZ0Lmxlbmd0aDsgaSsrKSB7XG4gICAgc3RhdGUuYk1hcmtzW2kgKyBzdGFydExpbmVdID0gb2xkQk1hcmtzW2ldO1xuICAgIHN0YXRlLnRTaGlmdFtpICsgc3RhcnRMaW5lXSA9IG9sZFRTaGlmdFtpXTtcbiAgICBzdGF0ZS5zQ291bnRbaSArIHN0YXJ0TGluZV0gPSBvbGRTQ291bnRbaV07XG4gICAgc3RhdGUuYnNDb3VudFtpICsgc3RhcnRMaW5lXSA9IG9sZEJTQ291bnRbaV07XG4gIH1cbiAgc3RhdGUuYmxrSW5kZW50ID0gb2xkSW5kZW50O1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIENvZGUgYmxvY2sgKDQgc3BhY2VzIHBhZGRlZClcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY29kZShzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLyosIHNpbGVudCovKSB7XG4gIHZhciBuZXh0TGluZSwgbGFzdCwgdG9rZW47XG5cbiAgaWYgKHN0YXRlLnNDb3VudFtzdGFydExpbmVdIC0gc3RhdGUuYmxrSW5kZW50IDwgNCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBsYXN0ID0gbmV4dExpbmUgPSBzdGFydExpbmUgKyAxO1xuXG4gIHdoaWxlIChuZXh0TGluZSA8IGVuZExpbmUpIHtcbiAgICBpZiAoc3RhdGUuaXNFbXB0eShuZXh0TGluZSkpIHtcbiAgICAgIG5leHRMaW5lKys7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7XG4gICAgICBuZXh0TGluZSsrO1xuICAgICAgbGFzdCA9IG5leHRMaW5lO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGJyZWFrO1xuICB9XG5cbiAgc3RhdGUubGluZSA9IGxhc3Q7XG5cbiAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ2NvZGVfYmxvY2snLCAnY29kZScsIDApO1xuICB0b2tlbi5jb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBsYXN0LCA0ICsgc3RhdGUuYmxrSW5kZW50LCB0cnVlKTtcbiAgdG9rZW4ubWFwICAgICA9IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF07XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gZmVuY2VzIChgYGAgbGFuZywgfn5+IGxhbmcpXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGZlbmNlKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgbWFya2VyLCBsZW4sIHBhcmFtcywgbmV4dExpbmUsIG1lbSwgdG9rZW4sIG1hcmt1cCxcbiAgICAgIGhhdmVFbmRNYXJrZXIgPSBmYWxzZSxcbiAgICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0sXG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXTtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAocG9zICsgMyA+IG1heCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gIGlmIChtYXJrZXIgIT09IDB4N0UvKiB+ICovICYmIG1hcmtlciAhPT0gMHg2MCAvKiBgICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gc2NhbiBtYXJrZXIgbGVuZ3RoXG4gIG1lbSA9IHBvcztcbiAgcG9zID0gc3RhdGUuc2tpcENoYXJzKHBvcywgbWFya2VyKTtcblxuICBsZW4gPSBwb3MgLSBtZW07XG5cbiAgaWYgKGxlbiA8IDMpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgbWFya3VwID0gc3RhdGUuc3JjLnNsaWNlKG1lbSwgcG9zKTtcbiAgcGFyYW1zID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF4KTtcblxuICBpZiAocGFyYW1zLmluZGV4T2YoU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpKSA+PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIFNpbmNlIHN0YXJ0IGlzIGZvdW5kLCB3ZSBjYW4gcmVwb3J0IHN1Y2Nlc3MgaGVyZSBpbiB2YWxpZGF0aW9uIG1vZGVcbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIC8vIHNlYXJjaCBlbmQgb2YgYmxvY2tcbiAgbmV4dExpbmUgPSBzdGFydExpbmU7XG5cbiAgZm9yICg7Oykge1xuICAgIG5leHRMaW5lKys7XG4gICAgaWYgKG5leHRMaW5lID49IGVuZExpbmUpIHtcbiAgICAgIC8vIHVuY2xvc2VkIGJsb2NrIHNob3VsZCBiZSBhdXRvY2xvc2VkIGJ5IGVuZCBvZiBkb2N1bWVudC5cbiAgICAgIC8vIGFsc28gYmxvY2sgc2VlbXMgdG8gYmUgYXV0b2Nsb3NlZCBieSBlbmQgb2YgcGFyZW50XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBwb3MgPSBtZW0gPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXTtcbiAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdO1xuXG4gICAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICAvLyBub24tZW1wdHkgbGluZSB3aXRoIG5lZ2F0aXZlIGluZGVudCBzaG91bGQgc3RvcCB0aGUgbGlzdDpcbiAgICAgIC8vIC0gYGBgXG4gICAgICAvLyAgdGVzdFxuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IG1hcmtlcikgeyBjb250aW51ZTsgfVxuXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkge1xuICAgICAgLy8gY2xvc2luZyBmZW5jZSBzaG91bGQgYmUgaW5kZW50ZWQgbGVzcyB0aGFuIDQgc3BhY2VzXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBwb3MgPSBzdGF0ZS5za2lwQ2hhcnMocG9zLCBtYXJrZXIpO1xuXG4gICAgLy8gY2xvc2luZyBjb2RlIGZlbmNlIG11c3QgYmUgYXQgbGVhc3QgYXMgbG9uZyBhcyB0aGUgb3BlbmluZyBvbmVcbiAgICBpZiAocG9zIC0gbWVtIDwgbGVuKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAvLyBtYWtlIHN1cmUgdGFpbCBoYXMgc3BhY2VzIG9ubHlcbiAgICBwb3MgPSBzdGF0ZS5za2lwU3BhY2VzKHBvcyk7XG5cbiAgICBpZiAocG9zIDwgbWF4KSB7IGNvbnRpbnVlOyB9XG5cbiAgICBoYXZlRW5kTWFya2VyID0gdHJ1ZTtcbiAgICAvLyBmb3VuZCFcbiAgICBicmVhaztcbiAgfVxuXG4gIC8vIElmIGEgZmVuY2UgaGFzIGhlYWRpbmcgc3BhY2VzLCB0aGV5IHNob3VsZCBiZSByZW1vdmVkIGZyb20gaXRzIGlubmVyIGJsb2NrXG4gIGxlbiA9IHN0YXRlLnNDb3VudFtzdGFydExpbmVdO1xuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZSArIChoYXZlRW5kTWFya2VyID8gMSA6IDApO1xuXG4gIHRva2VuICAgICAgICAgPSBzdGF0ZS5wdXNoKCdmZW5jZScsICdjb2RlJywgMCk7XG4gIHRva2VuLmluZm8gICAgPSBwYXJhbXM7XG4gIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUgKyAxLCBuZXh0TGluZSwgbGVuLCB0cnVlKTtcbiAgdG9rZW4ubWFya3VwICA9IG1hcmt1cDtcbiAgdG9rZW4ubWFwICAgICA9IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF07XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gaGVhZGluZyAoIywgIyMsIC4uLilcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNTcGFjZSA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBoZWFkaW5nKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgY2gsIGxldmVsLCB0bXAsIHRva2VuLFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGNoICA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgaWYgKGNoICE9PSAweDIzLyogIyAqLyB8fCBwb3MgPj0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIGNvdW50IGhlYWRpbmcgbGV2ZWxcbiAgbGV2ZWwgPSAxO1xuICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KCsrcG9zKTtcbiAgd2hpbGUgKGNoID09PSAweDIzLyogIyAqLyAmJiBwb3MgPCBtYXggJiYgbGV2ZWwgPD0gNikge1xuICAgIGxldmVsKys7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdCgrK3Bvcyk7XG4gIH1cblxuICBpZiAobGV2ZWwgPiA2IHx8IChwb3MgPCBtYXggJiYgIWlzU3BhY2UoY2gpKSkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgLy8gTGV0J3MgY3V0IHRhaWxzIGxpa2UgJyAgICAjIyMgICcgZnJvbSB0aGUgZW5kIG9mIHN0cmluZ1xuXG4gIG1heCA9IHN0YXRlLnNraXBTcGFjZXNCYWNrKG1heCwgcG9zKTtcbiAgdG1wID0gc3RhdGUuc2tpcENoYXJzQmFjayhtYXgsIDB4MjMsIHBvcyk7IC8vICNcbiAgaWYgKHRtcCA+IHBvcyAmJiBpc1NwYWNlKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHRtcCAtIDEpKSkge1xuICAgIG1heCA9IHRtcDtcbiAgfVxuXG4gIHN0YXRlLmxpbmUgPSBzdGFydExpbmUgKyAxO1xuXG4gIHRva2VuICAgICAgICA9IHN0YXRlLnB1c2goJ2hlYWRpbmdfb3BlbicsICdoJyArIFN0cmluZyhsZXZlbCksIDEpO1xuICB0b2tlbi5tYXJrdXAgPSAnIyMjIyMjIyMnLnNsaWNlKDAsIGxldmVsKTtcbiAgdG9rZW4ubWFwICAgID0gWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgXTtcblxuICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ2lubGluZScsICcnLCAwKTtcbiAgdG9rZW4uY29udGVudCAgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpLnRyaW0oKTtcbiAgdG9rZW4ubWFwICAgICAgPSBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdO1xuICB0b2tlbi5jaGlsZHJlbiA9IFtdO1xuXG4gIHRva2VuICAgICAgICA9IHN0YXRlLnB1c2goJ2hlYWRpbmdfY2xvc2UnLCAnaCcgKyBTdHJpbmcobGV2ZWwpLCAtMSk7XG4gIHRva2VuLm1hcmt1cCA9ICcjIyMjIyMjIycuc2xpY2UoMCwgbGV2ZWwpO1xuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIEhvcml6b250YWwgcnVsZVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGhyKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUsIHNpbGVudCkge1xuICB2YXIgbWFya2VyLCBjbnQsIGNoLCB0b2tlbixcbiAgICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0sXG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXTtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKyk7XG5cbiAgLy8gQ2hlY2sgaHIgbWFya2VyXG4gIGlmIChtYXJrZXIgIT09IDB4MkEvKiAqICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkQvKiAtICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4NUYvKiBfICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gbWFya2VycyBjYW4gYmUgbWl4ZWQgd2l0aCBzcGFjZXMsIGJ1dCB0aGVyZSBzaG91bGQgYmUgYXQgbGVhc3QgMyBvZiB0aGVtXG5cbiAgY250ID0gMTtcbiAgd2hpbGUgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuICAgIGlmIChjaCAhPT0gbWFya2VyICYmICFpc1NwYWNlKGNoKSkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICBpZiAoY2ggPT09IG1hcmtlcikgeyBjbnQrKzsgfVxuICB9XG5cbiAgaWYgKGNudCA8IDMpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIHN0YXRlLmxpbmUgPSBzdGFydExpbmUgKyAxO1xuXG4gIHRva2VuICAgICAgICA9IHN0YXRlLnB1c2goJ2hyJywgJ2hyJywgMCk7XG4gIHRva2VuLm1hcCAgICA9IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF07XG4gIHRva2VuLm1hcmt1cCA9IEFycmF5KGNudCArIDEpLmpvaW4oU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXIpKTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBIVE1MIGJsb2NrXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgYmxvY2tfbmFtZXMgPSByZXF1aXJlKCcuLi9jb21tb24vaHRtbF9ibG9ja3MnKTtcbnZhciBIVE1MX09QRU5fQ0xPU0VfVEFHX1JFID0gcmVxdWlyZSgnLi4vY29tbW9uL2h0bWxfcmUnKS5IVE1MX09QRU5fQ0xPU0VfVEFHX1JFO1xuXG4vLyBBbiBhcnJheSBvZiBvcGVuaW5nIGFuZCBjb3JyZXNwb25kaW5nIGNsb3Npbmcgc2VxdWVuY2VzIGZvciBodG1sIHRhZ3MsXG4vLyBsYXN0IGFyZ3VtZW50IGRlZmluZXMgd2hldGhlciBpdCBjYW4gdGVybWluYXRlIGEgcGFyYWdyYXBoIG9yIG5vdFxuLy9cbnZhciBIVE1MX1NFUVVFTkNFUyA9IFtcbiAgWyAvXjwoc2NyaXB0fHByZXxzdHlsZSkoPz0oXFxzfD58JCkpL2ksIC88XFwvKHNjcmlwdHxwcmV8c3R5bGUpPi9pLCB0cnVlIF0sXG4gIFsgL148IS0tLywgICAgICAgIC8tLT4vLCAgIHRydWUgXSxcbiAgWyAvXjxcXD8vLCAgICAgICAgIC9cXD8+LywgICB0cnVlIF0sXG4gIFsgL148IVtBLVpdLywgICAgIC8+LywgICAgIHRydWUgXSxcbiAgWyAvXjwhXFxbQ0RBVEFcXFsvLCAvXFxdXFxdPi8sIHRydWUgXSxcbiAgWyBuZXcgUmVnRXhwKCdePC8/KCcgKyBibG9ja19uYW1lcy5qb2luKCd8JykgKyAnKSg/PShcXFxcc3wvPz58JCkpJywgJ2knKSwgL14kLywgdHJ1ZSBdLFxuICBbIG5ldyBSZWdFeHAoSFRNTF9PUEVOX0NMT1NFX1RBR19SRS5zb3VyY2UgKyAnXFxcXHMqJCcpLCAgL14kLywgZmFsc2UgXVxuXTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGh0bWxfYmxvY2soc3RhdGUsIHN0YXJ0TGluZSwgZW5kTGluZSwgc2lsZW50KSB7XG4gIHZhciBpLCBuZXh0TGluZSwgdG9rZW4sIGxpbmVUZXh0LFxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW3N0YXJ0TGluZV0gKyBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmICghc3RhdGUubWQub3B0aW9ucy5odG1sKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDNDLyogPCAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBsaW5lVGV4dCA9IHN0YXRlLnNyYy5zbGljZShwb3MsIG1heCk7XG5cbiAgZm9yIChpID0gMDsgaSA8IEhUTUxfU0VRVUVOQ0VTLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKEhUTUxfU0VRVUVOQ0VTW2ldWzBdLnRlc3QobGluZVRleHQpKSB7IGJyZWFrOyB9XG4gIH1cblxuICBpZiAoaSA9PT0gSFRNTF9TRVFVRU5DRVMubGVuZ3RoKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChzaWxlbnQpIHtcbiAgICAvLyB0cnVlIGlmIHRoaXMgc2VxdWVuY2UgY2FuIGJlIGEgdGVybWluYXRvciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAgcmV0dXJuIEhUTUxfU0VRVUVOQ0VTW2ldWzJdO1xuICB9XG5cbiAgbmV4dExpbmUgPSBzdGFydExpbmUgKyAxO1xuXG4gIC8vIElmIHdlIGFyZSBoZXJlIC0gd2UgZGV0ZWN0ZWQgSFRNTCBibG9jay5cbiAgLy8gTGV0J3Mgcm9sbCBkb3duIHRpbGwgYmxvY2sgZW5kLlxuICBpZiAoIUhUTUxfU0VRVUVOQ0VTW2ldWzFdLnRlc3QobGluZVRleHQpKSB7XG4gICAgZm9yICg7IG5leHRMaW5lIDwgZW5kTGluZTsgbmV4dExpbmUrKykge1xuICAgICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gPCBzdGF0ZS5ibGtJbmRlbnQpIHsgYnJlYWs7IH1cblxuICAgICAgcG9zID0gc3RhdGUuYk1hcmtzW25leHRMaW5lXSArIHN0YXRlLnRTaGlmdFtuZXh0TGluZV07XG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdO1xuICAgICAgbGluZVRleHQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBtYXgpO1xuXG4gICAgICBpZiAoSFRNTF9TRVFVRU5DRVNbaV1bMV0udGVzdChsaW5lVGV4dCkpIHtcbiAgICAgICAgaWYgKGxpbmVUZXh0Lmxlbmd0aCAhPT0gMCkgeyBuZXh0TGluZSsrOyB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHN0YXRlLmxpbmUgPSBuZXh0TGluZTtcblxuICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgnaHRtbF9ibG9jaycsICcnLCAwKTtcbiAgdG9rZW4ubWFwICAgICA9IFsgc3RhcnRMaW5lLCBuZXh0TGluZSBdO1xuICB0b2tlbi5jb250ZW50ID0gc3RhdGUuZ2V0TGluZXMoc3RhcnRMaW5lLCBuZXh0TGluZSwgc3RhdGUuYmxrSW5kZW50LCB0cnVlKTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBsaGVhZGluZyAoLS0tLCA9PT0pXG5cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxoZWFkaW5nKHN0YXRlLCBzdGFydExpbmUsIGVuZExpbmUvKiwgc2lsZW50Ki8pIHtcbiAgdmFyIGNvbnRlbnQsIHRlcm1pbmF0ZSwgaSwgbCwgdG9rZW4sIHBvcywgbWF4LCBsZXZlbCwgbWFya2VyLFxuICAgICAgbmV4dExpbmUgPSBzdGFydExpbmUgKyAxLCBvbGRQYXJlbnRUeXBlLFxuICAgICAgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ3BhcmFncmFwaCcpO1xuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbc3RhcnRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlO1xuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ3BhcmFncmFwaCc7IC8vIHVzZSBwYXJhZ3JhcGggdG8gbWF0Y2ggdGVybWluYXRvclJ1bGVzXG5cbiAgLy8ganVtcCBsaW5lLWJ5LWxpbmUgdW50aWwgZW1wdHkgb25lIG9yIEVPRlxuICBmb3IgKDsgbmV4dExpbmUgPCBlbmRMaW5lICYmICFzdGF0ZS5pc0VtcHR5KG5leHRMaW5lKTsgbmV4dExpbmUrKykge1xuICAgIC8vIHRoaXMgd291bGQgYmUgYSBjb2RlIGJsb2NrIG5vcm1hbGx5LCBidXQgYWZ0ZXIgcGFyYWdyYXBoXG4gICAgLy8gaXQncyBjb25zaWRlcmVkIGEgbGF6eSBjb250aW51YXRpb24gcmVnYXJkbGVzcyBvZiB3aGF0J3MgdGhlcmVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+IDMpIHsgY29udGludWU7IH1cblxuICAgIC8vXG4gICAgLy8gQ2hlY2sgZm9yIHVuZGVybGluZSBpbiBzZXRleHQgaGVhZGVyXG4gICAgLy9cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA+PSBzdGF0ZS5ibGtJbmRlbnQpIHtcbiAgICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tuZXh0TGluZV0gKyBzdGF0ZS50U2hpZnRbbmV4dExpbmVdO1xuICAgICAgbWF4ID0gc3RhdGUuZU1hcmtzW25leHRMaW5lXTtcblxuICAgICAgaWYgKHBvcyA8IG1heCkge1xuICAgICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gICAgICAgIGlmIChtYXJrZXIgPT09IDB4MkQvKiAtICovIHx8IG1hcmtlciA9PT0gMHgzRC8qID0gKi8pIHtcbiAgICAgICAgICBwb3MgPSBzdGF0ZS5za2lwQ2hhcnMocG9zLCBtYXJrZXIpO1xuICAgICAgICAgIHBvcyA9IHN0YXRlLnNraXBTcGFjZXMocG9zKTtcblxuICAgICAgICAgIGlmIChwb3MgPj0gbWF4KSB7XG4gICAgICAgICAgICBsZXZlbCA9IChtYXJrZXIgPT09IDB4M0QvKiA9ICovID8gMSA6IDIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcXVpcmsgZm9yIGJsb2NrcXVvdGVzLCB0aGlzIGxpbmUgc2hvdWxkIGFscmVhZHkgYmUgY2hlY2tlZCBieSB0aGF0IHJ1bGVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IDApIHsgY29udGludWU7IH1cblxuICAgIC8vIFNvbWUgdGFncyBjYW4gdGVybWluYXRlIHBhcmFncmFwaCB3aXRob3V0IGVtcHR5IGxpbmUuXG4gICAgdGVybWluYXRlID0gZmFsc2U7XG4gICAgZm9yIChpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhazsgfVxuICB9XG5cbiAgaWYgKCFsZXZlbCkge1xuICAgIC8vIERpZG4ndCBmaW5kIHZhbGlkIHVuZGVybGluZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnRlbnQgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIG5leHRMaW5lLCBzdGF0ZS5ibGtJbmRlbnQsIGZhbHNlKS50cmltKCk7XG5cbiAgc3RhdGUubGluZSA9IG5leHRMaW5lICsgMTtcblxuICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ2hlYWRpbmdfb3BlbicsICdoJyArIFN0cmluZyhsZXZlbCksIDEpO1xuICB0b2tlbi5tYXJrdXAgICA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKTtcbiAgdG9rZW4ubWFwICAgICAgPSBbIHN0YXJ0TGluZSwgc3RhdGUubGluZSBdO1xuXG4gIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgnaW5saW5lJywgJycsIDApO1xuICB0b2tlbi5jb250ZW50ICA9IGNvbnRlbnQ7XG4gIHRva2VuLm1hcCAgICAgID0gWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgLSAxIF07XG4gIHRva2VuLmNoaWxkcmVuID0gW107XG5cbiAgdG9rZW4gICAgICAgICAgPSBzdGF0ZS5wdXNoKCdoZWFkaW5nX2Nsb3NlJywgJ2gnICsgU3RyaW5nKGxldmVsKSwgLTEpO1xuICB0b2tlbi5tYXJrdXAgICA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKTtcblxuICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBMaXN0c1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxuXG4vLyBTZWFyY2ggYFstKypdW1xcbiBdYCwgcmV0dXJucyBuZXh0IHBvcyBhZnRlciBtYXJrZXIgb24gc3VjY2Vzc1xuLy8gb3IgLTEgb24gZmFpbC5cbmZ1bmN0aW9uIHNraXBCdWxsZXRMaXN0TWFya2VyKHN0YXRlLCBzdGFydExpbmUpIHtcbiAgdmFyIG1hcmtlciwgcG9zLCBtYXgsIGNoO1xuXG4gIHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV07XG4gIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcysrKTtcbiAgLy8gQ2hlY2sgYnVsbGV0XG4gIGlmIChtYXJrZXIgIT09IDB4MkEvKiAqICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkQvKiAtICovICYmXG4gICAgICBtYXJrZXIgIT09IDB4MkIvKiArICovKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgaWYgKHBvcyA8IG1heCkge1xuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICAgIGlmICghaXNTcGFjZShjaCkpIHtcbiAgICAgIC8vIFwiIC10ZXN0IFwiIC0gaXMgbm90IGEgbGlzdCBpdGVtXG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBvcztcbn1cblxuLy8gU2VhcmNoIGBcXGQrWy4pXVtcXG4gXWAsIHJldHVybnMgbmV4dCBwb3MgYWZ0ZXIgbWFya2VyIG9uIHN1Y2Nlc3Ncbi8vIG9yIC0xIG9uIGZhaWwuXG5mdW5jdGlvbiBza2lwT3JkZXJlZExpc3RNYXJrZXIoc3RhdGUsIHN0YXJ0TGluZSkge1xuICB2YXIgY2gsXG4gICAgICBzdGFydCA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0sXG4gICAgICBwb3MgPSBzdGFydCxcbiAgICAgIG1heCA9IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdO1xuXG4gIC8vIExpc3QgbWFya2VyIHNob3VsZCBoYXZlIGF0IGxlYXN0IDIgY2hhcnMgKGRpZ2l0ICsgZG90KVxuICBpZiAocG9zICsgMSA+PSBtYXgpIHsgcmV0dXJuIC0xOyB9XG5cbiAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MrKyk7XG5cbiAgaWYgKGNoIDwgMHgzMC8qIDAgKi8gfHwgY2ggPiAweDM5LyogOSAqLykgeyByZXR1cm4gLTE7IH1cblxuICBmb3IgKDs7KSB7XG4gICAgLy8gRU9MIC0+IGZhaWxcbiAgICBpZiAocG9zID49IG1heCkgeyByZXR1cm4gLTE7IH1cblxuICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuXG4gICAgaWYgKGNoID49IDB4MzAvKiAwICovICYmIGNoIDw9IDB4MzkvKiA5ICovKSB7XG5cbiAgICAgIC8vIExpc3QgbWFya2VyIHNob3VsZCBoYXZlIG5vIG1vcmUgdGhhbiA5IGRpZ2l0c1xuICAgICAgLy8gKHByZXZlbnRzIGludGVnZXIgb3ZlcmZsb3cgaW4gYnJvd3NlcnMpXG4gICAgICBpZiAocG9zIC0gc3RhcnQgPj0gMTApIHsgcmV0dXJuIC0xOyB9XG5cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIGZvdW5kIHZhbGlkIG1hcmtlclxuICAgIGlmIChjaCA9PT0gMHgyOS8qICkgKi8gfHwgY2ggPT09IDB4MmUvKiAuICovKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gLTE7XG4gIH1cblxuXG4gIGlmIChwb3MgPCBtYXgpIHtcbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgICBpZiAoIWlzU3BhY2UoY2gpKSB7XG4gICAgICAvLyBcIiAxLnRlc3QgXCIgLSBpcyBub3QgYSBsaXN0IGl0ZW1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn1cblxuZnVuY3Rpb24gbWFya1RpZ2h0UGFyYWdyYXBocyhzdGF0ZSwgaWR4KSB7XG4gIHZhciBpLCBsLFxuICAgICAgbGV2ZWwgPSBzdGF0ZS5sZXZlbCArIDI7XG5cbiAgZm9yIChpID0gaWR4ICsgMiwgbCA9IHN0YXRlLnRva2Vucy5sZW5ndGggLSAyOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYgKHN0YXRlLnRva2Vuc1tpXS5sZXZlbCA9PT0gbGV2ZWwgJiYgc3RhdGUudG9rZW5zW2ldLnR5cGUgPT09ICdwYXJhZ3JhcGhfb3BlbicpIHtcbiAgICAgIHN0YXRlLnRva2Vuc1tpICsgMl0uaGlkZGVuID0gdHJ1ZTtcbiAgICAgIHN0YXRlLnRva2Vuc1tpXS5oaWRkZW4gPSB0cnVlO1xuICAgICAgaSArPSAyO1xuICAgIH1cbiAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbGlzdChzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIGNoLFxuICAgICAgY29udGVudFN0YXJ0LFxuICAgICAgaSxcbiAgICAgIGluZGVudCxcbiAgICAgIGluZGVudEFmdGVyTWFya2VyLFxuICAgICAgaW5pdGlhbCxcbiAgICAgIGlzT3JkZXJlZCxcbiAgICAgIGl0ZW1MaW5lcyxcbiAgICAgIGwsXG4gICAgICBsaXN0TGluZXMsXG4gICAgICBsaXN0VG9rSWR4LFxuICAgICAgbWFya2VyQ2hhckNvZGUsXG4gICAgICBtYXJrZXJWYWx1ZSxcbiAgICAgIG1heCxcbiAgICAgIG5leHRMaW5lLFxuICAgICAgb2Zmc2V0LFxuICAgICAgb2xkSW5kZW50LFxuICAgICAgb2xkTEluZGVudCxcbiAgICAgIG9sZFBhcmVudFR5cGUsXG4gICAgICBvbGRUU2hpZnQsXG4gICAgICBvbGRUaWdodCxcbiAgICAgIHBvcyxcbiAgICAgIHBvc0FmdGVyTWFya2VyLFxuICAgICAgcHJldkVtcHR5RW5kLFxuICAgICAgc3RhcnQsXG4gICAgICB0ZXJtaW5hdGUsXG4gICAgICB0ZXJtaW5hdG9yUnVsZXMsXG4gICAgICB0b2tlbixcbiAgICAgIGlzVGVybWluYXRpbmdQYXJhZ3JhcGggPSBmYWxzZSxcbiAgICAgIHRpZ2h0ID0gdHJ1ZTtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICAvLyBsaW1pdCBjb25kaXRpb25zIHdoZW4gbGlzdCBjYW4gaW50ZXJydXB0XG4gIC8vIGEgcGFyYWdyYXBoICh2YWxpZGF0aW9uIG1vZGUgb25seSlcbiAgaWYgKHNpbGVudCAmJiBzdGF0ZS5wYXJlbnRUeXBlID09PSAncGFyYWdyYXBoJykge1xuICAgIC8vIE5leHQgbGlzdCBpdGVtIHNob3VsZCBzdGlsbCB0ZXJtaW5hdGUgcHJldmlvdXMgbGlzdCBpdGVtO1xuICAgIC8vXG4gICAgLy8gVGhpcyBjb2RlIGNhbiBmYWlsIGlmIHBsdWdpbnMgdXNlIGJsa0luZGVudCBhcyB3ZWxsIGFzIGxpc3RzLFxuICAgIC8vIGJ1dCBJIGhvcGUgdGhlIHNwZWMgZ2V0cyBmaXhlZCBsb25nIGJlZm9yZSB0aGF0IGhhcHBlbnMuXG4gICAgLy9cbiAgICBpZiAoc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0gPj0gc3RhdGUuYmxrSW5kZW50KSB7XG4gICAgICBpc1Rlcm1pbmF0aW5nUGFyYWdyYXBoID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBEZXRlY3QgbGlzdCB0eXBlIGFuZCBwb3NpdGlvbiBhZnRlciBtYXJrZXJcbiAgaWYgKChwb3NBZnRlck1hcmtlciA9IHNraXBPcmRlcmVkTGlzdE1hcmtlcihzdGF0ZSwgc3RhcnRMaW5lKSkgPj0gMCkge1xuICAgIGlzT3JkZXJlZCA9IHRydWU7XG4gICAgc3RhcnQgPSBzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdO1xuICAgIG1hcmtlclZhbHVlID0gTnVtYmVyKHN0YXRlLnNyYy5zdWJzdHIoc3RhcnQsIHBvc0FmdGVyTWFya2VyIC0gc3RhcnQgLSAxKSk7XG5cbiAgICAvLyBJZiB3ZSdyZSBzdGFydGluZyBhIG5ldyBvcmRlcmVkIGxpc3QgcmlnaHQgYWZ0ZXJcbiAgICAvLyBhIHBhcmFncmFwaCwgaXQgc2hvdWxkIHN0YXJ0IHdpdGggMS5cbiAgICBpZiAoaXNUZXJtaW5hdGluZ1BhcmFncmFwaCAmJiBtYXJrZXJWYWx1ZSAhPT0gMSkgcmV0dXJuIGZhbHNlO1xuXG4gIH0gZWxzZSBpZiAoKHBvc0FmdGVyTWFya2VyID0gc2tpcEJ1bGxldExpc3RNYXJrZXIoc3RhdGUsIHN0YXJ0TGluZSkpID49IDApIHtcbiAgICBpc09yZGVyZWQgPSBmYWxzZTtcblxuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIElmIHdlJ3JlIHN0YXJ0aW5nIGEgbmV3IHVub3JkZXJlZCBsaXN0IHJpZ2h0IGFmdGVyXG4gIC8vIGEgcGFyYWdyYXBoLCBmaXJzdCBsaW5lIHNob3VsZCBub3QgYmUgZW1wdHkuXG4gIGlmIChpc1Rlcm1pbmF0aW5nUGFyYWdyYXBoKSB7XG4gICAgaWYgKHN0YXRlLnNraXBTcGFjZXMocG9zQWZ0ZXJNYXJrZXIpID49IHN0YXRlLmVNYXJrc1tzdGFydExpbmVdKSByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBXZSBzaG91bGQgdGVybWluYXRlIGxpc3Qgb24gc3R5bGUgY2hhbmdlLiBSZW1lbWJlciBmaXJzdCBvbmUgdG8gY29tcGFyZS5cbiAgbWFya2VyQ2hhckNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3NBZnRlck1hcmtlciAtIDEpO1xuXG4gIC8vIEZvciB2YWxpZGF0aW9uIG1vZGUgd2UgY2FuIHRlcm1pbmF0ZSBpbW1lZGlhdGVseVxuICBpZiAoc2lsZW50KSB7IHJldHVybiB0cnVlOyB9XG5cbiAgLy8gU3RhcnQgbGlzdFxuICBsaXN0VG9rSWR4ID0gc3RhdGUudG9rZW5zLmxlbmd0aDtcblxuICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgdG9rZW4gICAgICAgPSBzdGF0ZS5wdXNoKCdvcmRlcmVkX2xpc3Rfb3BlbicsICdvbCcsIDEpO1xuICAgIGlmIChtYXJrZXJWYWx1ZSAhPT0gMSkge1xuICAgICAgdG9rZW4uYXR0cnMgPSBbIFsgJ3N0YXJ0JywgbWFya2VyVmFsdWUgXSBdO1xuICAgIH1cblxuICB9IGVsc2Uge1xuICAgIHRva2VuICAgICAgID0gc3RhdGUucHVzaCgnYnVsbGV0X2xpc3Rfb3BlbicsICd1bCcsIDEpO1xuICB9XG5cbiAgdG9rZW4ubWFwICAgID0gbGlzdExpbmVzID0gWyBzdGFydExpbmUsIDAgXTtcbiAgdG9rZW4ubWFya3VwID0gU3RyaW5nLmZyb21DaGFyQ29kZShtYXJrZXJDaGFyQ29kZSk7XG5cbiAgLy9cbiAgLy8gSXRlcmF0ZSBsaXN0IGl0ZW1zXG4gIC8vXG5cbiAgbmV4dExpbmUgPSBzdGFydExpbmU7XG4gIHByZXZFbXB0eUVuZCA9IGZhbHNlO1xuICB0ZXJtaW5hdG9yUnVsZXMgPSBzdGF0ZS5tZC5ibG9jay5ydWxlci5nZXRSdWxlcygnbGlzdCcpO1xuXG4gIG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlO1xuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ2xpc3QnO1xuXG4gIHdoaWxlIChuZXh0TGluZSA8IGVuZExpbmUpIHtcbiAgICBwb3MgPSBwb3NBZnRlck1hcmtlcjtcbiAgICBtYXggPSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdO1xuXG4gICAgaW5pdGlhbCA9IG9mZnNldCA9IHN0YXRlLnNDb3VudFtuZXh0TGluZV0gKyBwb3NBZnRlck1hcmtlciAtIChzdGF0ZS5iTWFya3Nbc3RhcnRMaW5lXSArIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdKTtcblxuICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcblxuICAgICAgaWYgKGNoID09PSAweDA5KSB7XG4gICAgICAgIG9mZnNldCArPSA0IC0gKG9mZnNldCArIHN0YXRlLmJzQ291bnRbbmV4dExpbmVdKSAlIDQ7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAweDIwKSB7XG4gICAgICAgIG9mZnNldCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIHBvcysrO1xuICAgIH1cblxuICAgIGNvbnRlbnRTdGFydCA9IHBvcztcblxuICAgIGlmIChjb250ZW50U3RhcnQgPj0gbWF4KSB7XG4gICAgICAvLyB0cmltbWluZyBzcGFjZSBpbiBcIi0gICAgXFxuICAzXCIgY2FzZSwgaW5kZW50IGlzIDEgaGVyZVxuICAgICAgaW5kZW50QWZ0ZXJNYXJrZXIgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbmRlbnRBZnRlck1hcmtlciA9IG9mZnNldCAtIGluaXRpYWw7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGF2ZSBtb3JlIHRoYW4gNCBzcGFjZXMsIHRoZSBpbmRlbnQgaXMgMVxuICAgIC8vICh0aGUgcmVzdCBpcyBqdXN0IGluZGVudGVkIGNvZGUgYmxvY2spXG4gICAgaWYgKGluZGVudEFmdGVyTWFya2VyID4gNCkgeyBpbmRlbnRBZnRlck1hcmtlciA9IDE7IH1cblxuICAgIC8vIFwiICAtICB0ZXN0XCJcbiAgICAvLyAgXl5eXl4gLSBjYWxjdWxhdGluZyB0b3RhbCBsZW5ndGggb2YgdGhpcyB0aGluZ1xuICAgIGluZGVudCA9IGluaXRpYWwgKyBpbmRlbnRBZnRlck1hcmtlcjtcblxuICAgIC8vIFJ1biBzdWJwYXJzZXIgJiB3cml0ZSB0b2tlbnNcbiAgICB0b2tlbiAgICAgICAgPSBzdGF0ZS5wdXNoKCdsaXN0X2l0ZW1fb3BlbicsICdsaScsIDEpO1xuICAgIHRva2VuLm1hcmt1cCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyQ2hhckNvZGUpO1xuICAgIHRva2VuLm1hcCAgICA9IGl0ZW1MaW5lcyA9IFsgc3RhcnRMaW5lLCAwIF07XG5cbiAgICBvbGRJbmRlbnQgPSBzdGF0ZS5ibGtJbmRlbnQ7XG4gICAgb2xkVGlnaHQgPSBzdGF0ZS50aWdodDtcbiAgICBvbGRUU2hpZnQgPSBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXTtcbiAgICBvbGRMSW5kZW50ID0gc3RhdGUuc0NvdW50W3N0YXJ0TGluZV07XG4gICAgc3RhdGUuYmxrSW5kZW50ID0gaW5kZW50O1xuICAgIHN0YXRlLnRpZ2h0ID0gdHJ1ZTtcbiAgICBzdGF0ZS50U2hpZnRbc3RhcnRMaW5lXSA9IGNvbnRlbnRTdGFydCAtIHN0YXRlLmJNYXJrc1tzdGFydExpbmVdO1xuICAgIHN0YXRlLnNDb3VudFtzdGFydExpbmVdID0gb2Zmc2V0O1xuXG4gICAgaWYgKGNvbnRlbnRTdGFydCA+PSBtYXggJiYgc3RhdGUuaXNFbXB0eShzdGFydExpbmUgKyAxKSkge1xuICAgICAgLy8gd29ya2Fyb3VuZCBmb3IgdGhpcyBjYXNlXG4gICAgICAvLyAobGlzdCBpdGVtIGlzIGVtcHR5LCBsaXN0IHRlcm1pbmF0ZXMgYmVmb3JlIFwiZm9vXCIpOlxuICAgICAgLy8gfn5+fn5+fn5cbiAgICAgIC8vICAgLVxuICAgICAgLy9cbiAgICAgIC8vICAgICBmb29cbiAgICAgIC8vIH5+fn5+fn5+XG4gICAgICBzdGF0ZS5saW5lID0gTWF0aC5taW4oc3RhdGUubGluZSArIDIsIGVuZExpbmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5tZC5ibG9jay50b2tlbml6ZShzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCB0cnVlKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhbnkgb2YgbGlzdCBpdGVtIGlzIHRpZ2h0LCBtYXJrIGxpc3QgYXMgdGlnaHRcbiAgICBpZiAoIXN0YXRlLnRpZ2h0IHx8IHByZXZFbXB0eUVuZCkge1xuICAgICAgdGlnaHQgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gSXRlbSBiZWNvbWUgbG9vc2UgaWYgZmluaXNoIHdpdGggZW1wdHkgbGluZSxcbiAgICAvLyBidXQgd2Ugc2hvdWxkIGZpbHRlciBsYXN0IGVsZW1lbnQsIGJlY2F1c2UgaXQgbWVhbnMgbGlzdCBmaW5pc2hcbiAgICBwcmV2RW1wdHlFbmQgPSAoc3RhdGUubGluZSAtIHN0YXJ0TGluZSkgPiAxICYmIHN0YXRlLmlzRW1wdHkoc3RhdGUubGluZSAtIDEpO1xuXG4gICAgc3RhdGUuYmxrSW5kZW50ID0gb2xkSW5kZW50O1xuICAgIHN0YXRlLnRTaGlmdFtzdGFydExpbmVdID0gb2xkVFNoaWZ0O1xuICAgIHN0YXRlLnNDb3VudFtzdGFydExpbmVdID0gb2xkTEluZGVudDtcbiAgICBzdGF0ZS50aWdodCA9IG9sZFRpZ2h0O1xuXG4gICAgdG9rZW4gICAgICAgID0gc3RhdGUucHVzaCgnbGlzdF9pdGVtX2Nsb3NlJywgJ2xpJywgLTEpO1xuICAgIHRva2VuLm1hcmt1cCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyQ2hhckNvZGUpO1xuXG4gICAgbmV4dExpbmUgPSBzdGFydExpbmUgPSBzdGF0ZS5saW5lO1xuICAgIGl0ZW1MaW5lc1sxXSA9IG5leHRMaW5lO1xuICAgIGNvbnRlbnRTdGFydCA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdO1xuXG4gICAgaWYgKG5leHRMaW5lID49IGVuZExpbmUpIHsgYnJlYWs7IH1cblxuICAgIC8vXG4gICAgLy8gVHJ5IHRvIGNoZWNrIGlmIGxpc3QgaXMgdGVybWluYXRlZCBvciBjb250aW51ZWQuXG4gICAgLy9cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IHN0YXRlLmJsa0luZGVudCkgeyBicmVhazsgfVxuXG4gICAgLy8gZmFpbCBpZiB0ZXJtaW5hdGluZyBibG9jayBmb3VuZFxuICAgIHRlcm1pbmF0ZSA9IGZhbHNlO1xuICAgIGZvciAoaSA9IDAsIGwgPSB0ZXJtaW5hdG9yUnVsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAodGVybWluYXRvclJ1bGVzW2ldKHN0YXRlLCBuZXh0TGluZSwgZW5kTGluZSwgdHJ1ZSkpIHtcbiAgICAgICAgdGVybWluYXRlID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0ZXJtaW5hdGUpIHsgYnJlYWs7IH1cblxuICAgIC8vIGZhaWwgaWYgbGlzdCBoYXMgYW5vdGhlciB0eXBlXG4gICAgaWYgKGlzT3JkZXJlZCkge1xuICAgICAgcG9zQWZ0ZXJNYXJrZXIgPSBza2lwT3JkZXJlZExpc3RNYXJrZXIoc3RhdGUsIG5leHRMaW5lKTtcbiAgICAgIGlmIChwb3NBZnRlck1hcmtlciA8IDApIHsgYnJlYWs7IH1cbiAgICB9IGVsc2Uge1xuICAgICAgcG9zQWZ0ZXJNYXJrZXIgPSBza2lwQnVsbGV0TGlzdE1hcmtlcihzdGF0ZSwgbmV4dExpbmUpO1xuICAgICAgaWYgKHBvc0FmdGVyTWFya2VyIDwgMCkgeyBicmVhazsgfVxuICAgIH1cblxuICAgIGlmIChtYXJrZXJDaGFyQ29kZSAhPT0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zQWZ0ZXJNYXJrZXIgLSAxKSkgeyBicmVhazsgfVxuICB9XG5cbiAgLy8gRmluYWxpemUgbGlzdFxuICBpZiAoaXNPcmRlcmVkKSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdvcmRlcmVkX2xpc3RfY2xvc2UnLCAnb2wnLCAtMSk7XG4gIH0gZWxzZSB7XG4gICAgdG9rZW4gPSBzdGF0ZS5wdXNoKCdidWxsZXRfbGlzdF9jbG9zZScsICd1bCcsIC0xKTtcbiAgfVxuICB0b2tlbi5tYXJrdXAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlckNoYXJDb2RlKTtcblxuICBsaXN0TGluZXNbMV0gPSBuZXh0TGluZTtcbiAgc3RhdGUubGluZSA9IG5leHRMaW5lO1xuXG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlO1xuXG4gIC8vIG1hcmsgcGFyYWdyYXBocyB0aWdodCBpZiBuZWVkZWRcbiAgaWYgKHRpZ2h0KSB7XG4gICAgbWFya1RpZ2h0UGFyYWdyYXBocyhzdGF0ZSwgbGlzdFRva0lkeCk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQYXJhZ3JhcGhcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyYWdyYXBoKHN0YXRlLCBzdGFydExpbmUvKiwgZW5kTGluZSovKSB7XG4gIHZhciBjb250ZW50LCB0ZXJtaW5hdGUsIGksIGwsIHRva2VuLCBvbGRQYXJlbnRUeXBlLFxuICAgICAgbmV4dExpbmUgPSBzdGFydExpbmUgKyAxLFxuICAgICAgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ3BhcmFncmFwaCcpLFxuICAgICAgZW5kTGluZSA9IHN0YXRlLmxpbmVNYXg7XG5cbiAgb2xkUGFyZW50VHlwZSA9IHN0YXRlLnBhcmVudFR5cGU7XG4gIHN0YXRlLnBhcmVudFR5cGUgPSAncGFyYWdyYXBoJztcblxuICAvLyBqdW1wIGxpbmUtYnktbGluZSB1bnRpbCBlbXB0eSBvbmUgb3IgRU9GXG4gIGZvciAoOyBuZXh0TGluZSA8IGVuZExpbmUgJiYgIXN0YXRlLmlzRW1wdHkobmV4dExpbmUpOyBuZXh0TGluZSsrKSB7XG4gICAgLy8gdGhpcyB3b3VsZCBiZSBhIGNvZGUgYmxvY2sgbm9ybWFsbHksIGJ1dCBhZnRlciBwYXJhZ3JhcGhcbiAgICAvLyBpdCdzIGNvbnNpZGVyZWQgYSBsYXp5IGNvbnRpbnVhdGlvbiByZWdhcmRsZXNzIG9mIHdoYXQncyB0aGVyZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID4gMykgeyBjb250aW51ZTsgfVxuXG4gICAgLy8gcXVpcmsgZm9yIGJsb2NrcXVvdGVzLCB0aGlzIGxpbmUgc2hvdWxkIGFscmVhZHkgYmUgY2hlY2tlZCBieSB0aGF0IHJ1bGVcbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSA8IDApIHsgY29udGludWU7IH1cblxuICAgIC8vIFNvbWUgdGFncyBjYW4gdGVybWluYXRlIHBhcmFncmFwaCB3aXRob3V0IGVtcHR5IGxpbmUuXG4gICAgdGVybWluYXRlID0gZmFsc2U7XG4gICAgZm9yIChpID0gMCwgbCA9IHRlcm1pbmF0b3JSdWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmICh0ZXJtaW5hdG9yUnVsZXNbaV0oc3RhdGUsIG5leHRMaW5lLCBlbmRMaW5lLCB0cnVlKSkge1xuICAgICAgICB0ZXJtaW5hdGUgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRlcm1pbmF0ZSkgeyBicmVhazsgfVxuICB9XG5cbiAgY29udGVudCA9IHN0YXRlLmdldExpbmVzKHN0YXJ0TGluZSwgbmV4dExpbmUsIHN0YXRlLmJsa0luZGVudCwgZmFsc2UpLnRyaW0oKTtcblxuICBzdGF0ZS5saW5lID0gbmV4dExpbmU7XG5cbiAgdG9rZW4gICAgICAgICAgPSBzdGF0ZS5wdXNoKCdwYXJhZ3JhcGhfb3BlbicsICdwJywgMSk7XG4gIHRva2VuLm1hcCAgICAgID0gWyBzdGFydExpbmUsIHN0YXRlLmxpbmUgXTtcblxuICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ2lubGluZScsICcnLCAwKTtcbiAgdG9rZW4uY29udGVudCAgPSBjb250ZW50O1xuICB0b2tlbi5tYXAgICAgICA9IFsgc3RhcnRMaW5lLCBzdGF0ZS5saW5lIF07XG4gIHRva2VuLmNoaWxkcmVuID0gW107XG5cbiAgdG9rZW4gICAgICAgICAgPSBzdGF0ZS5wdXNoKCdwYXJhZ3JhcGhfY2xvc2UnLCAncCcsIC0xKTtcblxuICBzdGF0ZS5wYXJlbnRUeXBlID0gb2xkUGFyZW50VHlwZTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cblxudmFyIG5vcm1hbGl6ZVJlZmVyZW5jZSAgID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykubm9ybWFsaXplUmVmZXJlbmNlO1xudmFyIGlzU3BhY2UgICAgICAgICAgICAgID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlZmVyZW5jZShzdGF0ZSwgc3RhcnRMaW5lLCBfZW5kTGluZSwgc2lsZW50KSB7XG4gIHZhciBjaCxcbiAgICAgIGRlc3RFbmRQb3MsXG4gICAgICBkZXN0RW5kTGluZU5vLFxuICAgICAgZW5kTGluZSxcbiAgICAgIGhyZWYsXG4gICAgICBpLFxuICAgICAgbCxcbiAgICAgIGxhYmVsLFxuICAgICAgbGFiZWxFbmQsXG4gICAgICBvbGRQYXJlbnRUeXBlLFxuICAgICAgcmVzLFxuICAgICAgc3RhcnQsXG4gICAgICBzdHIsXG4gICAgICB0ZXJtaW5hdGUsXG4gICAgICB0ZXJtaW5hdG9yUnVsZXMsXG4gICAgICB0aXRsZSxcbiAgICAgIGxpbmVzID0gMCxcbiAgICAgIHBvcyA9IHN0YXRlLmJNYXJrc1tzdGFydExpbmVdICsgc3RhdGUudFNoaWZ0W3N0YXJ0TGluZV0sXG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3Nbc3RhcnRMaW5lXSxcbiAgICAgIG5leHRMaW5lID0gc3RhcnRMaW5lICsgMTtcblxuICAvLyBpZiBpdCdzIGluZGVudGVkIG1vcmUgdGhhbiAzIHNwYWNlcywgaXQgc2hvdWxkIGJlIGEgY29kZSBibG9ja1xuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHg1Qi8qIFsgKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gU2ltcGxlIGNoZWNrIHRvIHF1aWNrbHkgaW50ZXJydXB0IHNjYW4gb24gW2xpbmtdKHVybCkgYXQgdGhlIHN0YXJ0IG9mIGxpbmUuXG4gIC8vIENhbiBiZSB1c2VmdWwgb24gcHJhY3RpY2U6IGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJrZG93bi1pdC9tYXJrZG93bi1pdC9pc3N1ZXMvNTRcbiAgd2hpbGUgKCsrcG9zIDwgbWF4KSB7XG4gICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4NUQgLyogXSAqLyAmJlxuICAgICAgICBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MgLSAxKSAhPT0gMHg1Qy8qIFxcICovKSB7XG4gICAgICBpZiAocG9zICsgMSA9PT0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyArIDEpICE9PSAweDNBLyogOiAqLykgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGVuZExpbmUgPSBzdGF0ZS5saW5lTWF4O1xuXG4gIC8vIGp1bXAgbGluZS1ieS1saW5lIHVudGlsIGVtcHR5IG9uZSBvciBFT0ZcbiAgdGVybWluYXRvclJ1bGVzID0gc3RhdGUubWQuYmxvY2sucnVsZXIuZ2V0UnVsZXMoJ3JlZmVyZW5jZScpO1xuXG4gIG9sZFBhcmVudFR5cGUgPSBzdGF0ZS5wYXJlbnRUeXBlO1xuICBzdGF0ZS5wYXJlbnRUeXBlID0gJ3JlZmVyZW5jZSc7XG5cbiAgZm9yICg7IG5leHRMaW5lIDwgZW5kTGluZSAmJiAhc3RhdGUuaXNFbXB0eShuZXh0TGluZSk7IG5leHRMaW5lKyspIHtcbiAgICAvLyB0aGlzIHdvdWxkIGJlIGEgY29kZSBibG9jayBub3JtYWxseSwgYnV0IGFmdGVyIHBhcmFncmFwaFxuICAgIC8vIGl0J3MgY29uc2lkZXJlZCBhIGxhenkgY29udGludWF0aW9uIHJlZ2FyZGxlc3Mgb2Ygd2hhdCdzIHRoZXJlXG4gICAgaWYgKHN0YXRlLnNDb3VudFtuZXh0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPiAzKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAvLyBxdWlyayBmb3IgYmxvY2txdW90ZXMsIHRoaXMgbGluZSBzaG91bGQgYWxyZWFkeSBiZSBjaGVja2VkIGJ5IHRoYXQgcnVsZVxuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgMCkgeyBjb250aW51ZTsgfVxuXG4gICAgLy8gU29tZSB0YWdzIGNhbiB0ZXJtaW5hdGUgcGFyYWdyYXBoIHdpdGhvdXQgZW1wdHkgbGluZS5cbiAgICB0ZXJtaW5hdGUgPSBmYWxzZTtcbiAgICBmb3IgKGkgPSAwLCBsID0gdGVybWluYXRvclJ1bGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYgKHRlcm1pbmF0b3JSdWxlc1tpXShzdGF0ZSwgbmV4dExpbmUsIGVuZExpbmUsIHRydWUpKSB7XG4gICAgICAgIHRlcm1pbmF0ZSA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGVybWluYXRlKSB7IGJyZWFrOyB9XG4gIH1cblxuICBzdHIgPSBzdGF0ZS5nZXRMaW5lcyhzdGFydExpbmUsIG5leHRMaW5lLCBzdGF0ZS5ibGtJbmRlbnQsIGZhbHNlKS50cmltKCk7XG4gIG1heCA9IHN0ci5sZW5ndGg7XG5cbiAgZm9yIChwb3MgPSAxOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuICAgIGlmIChjaCA9PT0gMHg1QiAvKiBbICovKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHg1RCAvKiBdICovKSB7XG4gICAgICBsYWJlbEVuZCA9IHBvcztcbiAgICAgIGJyZWFrO1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4MEEgLyogXFxuICovKSB7XG4gICAgICBsaW5lcysrO1xuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4NUMgLyogXFwgKi8pIHtcbiAgICAgIHBvcysrO1xuICAgICAgaWYgKHBvcyA8IG1heCAmJiBzdHIuY2hhckNvZGVBdChwb3MpID09PSAweDBBKSB7XG4gICAgICAgIGxpbmVzKys7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGxhYmVsRW5kIDwgMCB8fCBzdHIuY2hhckNvZGVBdChsYWJlbEVuZCArIDEpICE9PSAweDNBLyogOiAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgIF5eXiBza2lwIG9wdGlvbmFsIHdoaXRlc3BhY2UgaGVyZVxuICBmb3IgKHBvcyA9IGxhYmVsRW5kICsgMjsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgIGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgICBpZiAoY2ggPT09IDB4MEEpIHtcbiAgICAgIGxpbmVzKys7XG4gICAgfSBlbHNlIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgLyplc2xpbnQgbm8tZW1wdHk6MCovXG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFtsYWJlbF06ICAgZGVzdGluYXRpb24gICAndGl0bGUnXG4gIC8vICAgICAgICAgICAgXl5eXl5eXl5eXl4gcGFyc2UgdGhpc1xuICByZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0Rlc3RpbmF0aW9uKHN0ciwgcG9zLCBtYXgpO1xuICBpZiAoIXJlcy5vaykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhyZXMuc3RyKTtcbiAgaWYgKCFzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoaHJlZikpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgcG9zID0gcmVzLnBvcztcbiAgbGluZXMgKz0gcmVzLmxpbmVzO1xuXG4gIC8vIHNhdmUgY3Vyc29yIHN0YXRlLCB3ZSBjb3VsZCByZXF1aXJlIHRvIHJvbGxiYWNrIGxhdGVyXG4gIGRlc3RFbmRQb3MgPSBwb3M7XG4gIGRlc3RFbmRMaW5lTm8gPSBsaW5lcztcblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgXl5eIHNraXBwaW5nIHRob3NlIHNwYWNlc1xuICBzdGFydCA9IHBvcztcbiAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgaWYgKGNoID09PSAweDBBKSB7XG4gICAgICBsaW5lcysrO1xuICAgIH0gZWxzZSBpZiAoaXNTcGFjZShjaCkpIHtcbiAgICAgIC8qZXNsaW50IG5vLWVtcHR5OjAqL1xuICAgIH0gZWxzZSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBbbGFiZWxdOiAgIGRlc3RpbmF0aW9uICAgJ3RpdGxlJ1xuICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAgXl5eXl5eXiBwYXJzZSB0aGlzXG4gIHJlcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rVGl0bGUoc3RyLCBwb3MsIG1heCk7XG4gIGlmIChwb3MgPCBtYXggJiYgc3RhcnQgIT09IHBvcyAmJiByZXMub2spIHtcbiAgICB0aXRsZSA9IHJlcy5zdHI7XG4gICAgcG9zID0gcmVzLnBvcztcbiAgICBsaW5lcyArPSByZXMubGluZXM7XG4gIH0gZWxzZSB7XG4gICAgdGl0bGUgPSAnJztcbiAgICBwb3MgPSBkZXN0RW5kUG9zO1xuICAgIGxpbmVzID0gZGVzdEVuZExpbmVObztcbiAgfVxuXG4gIC8vIHNraXAgdHJhaWxpbmcgc3BhY2VzIHVudGlsIHRoZSByZXN0IG9mIHRoZSBsaW5lXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBjaCA9IHN0ci5jaGFyQ29kZUF0KHBvcyk7XG4gICAgaWYgKCFpc1NwYWNlKGNoKSkgeyBicmVhazsgfVxuICAgIHBvcysrO1xuICB9XG5cbiAgaWYgKHBvcyA8IG1heCAmJiBzdHIuY2hhckNvZGVBdChwb3MpICE9PSAweDBBKSB7XG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICAvLyBnYXJiYWdlIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmUgYWZ0ZXIgdGl0bGUsXG4gICAgICAvLyBidXQgaXQgY291bGQgc3RpbGwgYmUgYSB2YWxpZCByZWZlcmVuY2UgaWYgd2Ugcm9sbCBiYWNrXG4gICAgICB0aXRsZSA9ICcnO1xuICAgICAgcG9zID0gZGVzdEVuZFBvcztcbiAgICAgIGxpbmVzID0gZGVzdEVuZExpbmVObztcbiAgICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgICAgY2ggPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICBpZiAoIWlzU3BhY2UoY2gpKSB7IGJyZWFrOyB9XG4gICAgICAgIHBvcysrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChwb3MgPCBtYXggJiYgc3RyLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgwQSkge1xuICAgIC8vIGdhcmJhZ2UgYXQgdGhlIGVuZCBvZiB0aGUgbGluZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGxhYmVsID0gbm9ybWFsaXplUmVmZXJlbmNlKHN0ci5zbGljZSgxLCBsYWJlbEVuZCkpO1xuICBpZiAoIWxhYmVsKSB7XG4gICAgLy8gQ29tbW9uTWFyayAwLjIwIGRpc2FsbG93cyBlbXB0eSBsYWJlbHNcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBSZWZlcmVuY2UgY2FuIG5vdCB0ZXJtaW5hdGUgYW55dGhpbmcuIFRoaXMgY2hlY2sgaXMgZm9yIHNhZmV0eSBvbmx5LlxuICAvKmlzdGFuYnVsIGlnbm9yZSBpZiovXG4gIGlmIChzaWxlbnQpIHsgcmV0dXJuIHRydWU7IH1cblxuICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykge1xuICAgIHN0YXRlLmVudi5yZWZlcmVuY2VzID0ge307XG4gIH1cbiAgaWYgKHR5cGVvZiBzdGF0ZS5lbnYucmVmZXJlbmNlc1tsYWJlbF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgc3RhdGUuZW52LnJlZmVyZW5jZXNbbGFiZWxdID0geyB0aXRsZTogdGl0bGUsIGhyZWY6IGhyZWYgfTtcbiAgfVxuXG4gIHN0YXRlLnBhcmVudFR5cGUgPSBvbGRQYXJlbnRUeXBlO1xuXG4gIHN0YXRlLmxpbmUgPSBzdGFydExpbmUgKyBsaW5lcyArIDE7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFBhcnNlciBzdGF0ZSBjbGFzc1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4uL3Rva2VuJyk7XG52YXIgaXNTcGFjZSA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG5cblxuZnVuY3Rpb24gU3RhdGVCbG9jayhzcmMsIG1kLCBlbnYsIHRva2Vucykge1xuICB2YXIgY2gsIHMsIHN0YXJ0LCBwb3MsIGxlbiwgaW5kZW50LCBvZmZzZXQsIGluZGVudF9mb3VuZDtcblxuICB0aGlzLnNyYyA9IHNyYztcblxuICAvLyBsaW5rIHRvIHBhcnNlciBpbnN0YW5jZVxuICB0aGlzLm1kICAgICA9IG1kO1xuXG4gIHRoaXMuZW52ID0gZW52O1xuXG4gIC8vXG4gIC8vIEludGVybmFsIHN0YXRlIHZhcnRpYWJsZXNcbiAgLy9cblxuICB0aGlzLnRva2VucyA9IHRva2VucztcblxuICB0aGlzLmJNYXJrcyA9IFtdOyAgLy8gbGluZSBiZWdpbiBvZmZzZXRzIGZvciBmYXN0IGp1bXBzXG4gIHRoaXMuZU1hcmtzID0gW107ICAvLyBsaW5lIGVuZCBvZmZzZXRzIGZvciBmYXN0IGp1bXBzXG4gIHRoaXMudFNoaWZ0ID0gW107ICAvLyBvZmZzZXRzIG9mIHRoZSBmaXJzdCBub24tc3BhY2UgY2hhcmFjdGVycyAodGFicyBub3QgZXhwYW5kZWQpXG4gIHRoaXMuc0NvdW50ID0gW107ICAvLyBpbmRlbnRzIGZvciBlYWNoIGxpbmUgKHRhYnMgZXhwYW5kZWQpXG5cbiAgLy8gQW4gYW1vdW50IG9mIHZpcnR1YWwgc3BhY2VzICh0YWJzIGV4cGFuZGVkKSBiZXR3ZWVuIGJlZ2lubmluZ1xuICAvLyBvZiBlYWNoIGxpbmUgKGJNYXJrcykgYW5kIHJlYWwgYmVnaW5uaW5nIG9mIHRoYXQgbGluZS5cbiAgLy9cbiAgLy8gSXQgZXhpc3RzIG9ubHkgYXMgYSBoYWNrIGJlY2F1c2UgYmxvY2txdW90ZXMgb3ZlcnJpZGUgYk1hcmtzXG4gIC8vIGxvc2luZyBpbmZvcm1hdGlvbiBpbiB0aGUgcHJvY2Vzcy5cbiAgLy9cbiAgLy8gSXQncyB1c2VkIG9ubHkgd2hlbiBleHBhbmRpbmcgdGFicywgeW91IGNhbiB0aGluayBhYm91dCBpdCBhc1xuICAvLyBhbiBpbml0aWFsIHRhYiBsZW5ndGgsIGUuZy4gYnNDb3VudD0yMSBhcHBsaWVkIHRvIHN0cmluZyBgXFx0MTIzYFxuICAvLyBtZWFucyBmaXJzdCB0YWIgc2hvdWxkIGJlIGV4cGFuZGVkIHRvIDQtMjElNCA9PT0gMyBzcGFjZXMuXG4gIC8vXG4gIHRoaXMuYnNDb3VudCA9IFtdO1xuXG4gIC8vIGJsb2NrIHBhcnNlciB2YXJpYWJsZXNcbiAgdGhpcy5ibGtJbmRlbnQgID0gMDsgLy8gcmVxdWlyZWQgYmxvY2sgY29udGVudCBpbmRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gKGZvciBleGFtcGxlLCBpZiB3ZSBhcmUgaW4gbGlzdClcbiAgdGhpcy5saW5lICAgICAgID0gMDsgLy8gbGluZSBpbmRleCBpbiBzcmNcbiAgdGhpcy5saW5lTWF4ICAgID0gMDsgLy8gbGluZXMgY291bnRcbiAgdGhpcy50aWdodCAgICAgID0gZmFsc2U7ICAvLyBsb29zZS90aWdodCBtb2RlIGZvciBsaXN0c1xuICB0aGlzLmRkSW5kZW50ICAgPSAtMTsgLy8gaW5kZW50IG9mIHRoZSBjdXJyZW50IGRkIGJsb2NrICgtMSBpZiB0aGVyZSBpc24ndCBhbnkpXG5cbiAgLy8gY2FuIGJlICdibG9ja3F1b3RlJywgJ2xpc3QnLCAncm9vdCcsICdwYXJhZ3JhcGgnIG9yICdyZWZlcmVuY2UnXG4gIC8vIHVzZWQgaW4gbGlzdHMgdG8gZGV0ZXJtaW5lIGlmIHRoZXkgaW50ZXJydXB0IGEgcGFyYWdyYXBoXG4gIHRoaXMucGFyZW50VHlwZSA9ICdyb290JztcblxuICB0aGlzLmxldmVsID0gMDtcblxuICAvLyByZW5kZXJlclxuICB0aGlzLnJlc3VsdCA9ICcnO1xuXG4gIC8vIENyZWF0ZSBjYWNoZXNcbiAgLy8gR2VuZXJhdGUgbWFya2Vycy5cbiAgcyA9IHRoaXMuc3JjO1xuICBpbmRlbnRfZm91bmQgPSBmYWxzZTtcblxuICBmb3IgKHN0YXJ0ID0gcG9zID0gaW5kZW50ID0gb2Zmc2V0ID0gMCwgbGVuID0gcy5sZW5ndGg7IHBvcyA8IGxlbjsgcG9zKyspIHtcbiAgICBjaCA9IHMuY2hhckNvZGVBdChwb3MpO1xuXG4gICAgaWYgKCFpbmRlbnRfZm91bmQpIHtcbiAgICAgIGlmIChpc1NwYWNlKGNoKSkge1xuICAgICAgICBpbmRlbnQrKztcblxuICAgICAgICBpZiAoY2ggPT09IDB4MDkpIHtcbiAgICAgICAgICBvZmZzZXQgKz0gNCAtIG9mZnNldCAlIDQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmRlbnRfZm91bmQgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjaCA9PT0gMHgwQSB8fCBwb3MgPT09IGxlbiAtIDEpIHtcbiAgICAgIGlmIChjaCAhPT0gMHgwQSkgeyBwb3MrKzsgfVxuICAgICAgdGhpcy5iTWFya3MucHVzaChzdGFydCk7XG4gICAgICB0aGlzLmVNYXJrcy5wdXNoKHBvcyk7XG4gICAgICB0aGlzLnRTaGlmdC5wdXNoKGluZGVudCk7XG4gICAgICB0aGlzLnNDb3VudC5wdXNoKG9mZnNldCk7XG4gICAgICB0aGlzLmJzQ291bnQucHVzaCgwKTtcblxuICAgICAgaW5kZW50X2ZvdW5kID0gZmFsc2U7XG4gICAgICBpbmRlbnQgPSAwO1xuICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgIHN0YXJ0ID0gcG9zICsgMTtcbiAgICB9XG4gIH1cblxuICAvLyBQdXNoIGZha2UgZW50cnkgdG8gc2ltcGxpZnkgY2FjaGUgYm91bmRzIGNoZWNrc1xuICB0aGlzLmJNYXJrcy5wdXNoKHMubGVuZ3RoKTtcbiAgdGhpcy5lTWFya3MucHVzaChzLmxlbmd0aCk7XG4gIHRoaXMudFNoaWZ0LnB1c2goMCk7XG4gIHRoaXMuc0NvdW50LnB1c2goMCk7XG4gIHRoaXMuYnNDb3VudC5wdXNoKDApO1xuXG4gIHRoaXMubGluZU1heCA9IHRoaXMuYk1hcmtzLmxlbmd0aCAtIDE7IC8vIGRvbid0IGNvdW50IGxhc3QgZmFrZSBsaW5lXG59XG5cbi8vIFB1c2ggbmV3IHRva2VuIHRvIFwic3RyZWFtXCIuXG4vL1xuU3RhdGVCbG9jay5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh0eXBlLCB0YWcsIG5lc3RpbmcpIHtcbiAgdmFyIHRva2VuID0gbmV3IFRva2VuKHR5cGUsIHRhZywgbmVzdGluZyk7XG4gIHRva2VuLmJsb2NrID0gdHJ1ZTtcblxuICBpZiAobmVzdGluZyA8IDApIHsgdGhpcy5sZXZlbC0tOyB9XG4gIHRva2VuLmxldmVsID0gdGhpcy5sZXZlbDtcbiAgaWYgKG5lc3RpbmcgPiAwKSB7IHRoaXMubGV2ZWwrKzsgfVxuXG4gIHRoaXMudG9rZW5zLnB1c2godG9rZW4pO1xuICByZXR1cm4gdG9rZW47XG59O1xuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24gaXNFbXB0eShsaW5lKSB7XG4gIHJldHVybiB0aGlzLmJNYXJrc1tsaW5lXSArIHRoaXMudFNoaWZ0W2xpbmVdID49IHRoaXMuZU1hcmtzW2xpbmVdO1xufTtcblxuU3RhdGVCbG9jay5wcm90b3R5cGUuc2tpcEVtcHR5TGluZXMgPSBmdW5jdGlvbiBza2lwRW1wdHlMaW5lcyhmcm9tKSB7XG4gIGZvciAodmFyIG1heCA9IHRoaXMubGluZU1heDsgZnJvbSA8IG1heDsgZnJvbSsrKSB7XG4gICAgaWYgKHRoaXMuYk1hcmtzW2Zyb21dICsgdGhpcy50U2hpZnRbZnJvbV0gPCB0aGlzLmVNYXJrc1tmcm9tXSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBmcm9tO1xufTtcblxuLy8gU2tpcCBzcGFjZXMgZnJvbSBnaXZlbiBwb3NpdGlvbi5cblN0YXRlQmxvY2sucHJvdG90eXBlLnNraXBTcGFjZXMgPSBmdW5jdGlvbiBza2lwU3BhY2VzKHBvcykge1xuICB2YXIgY2g7XG5cbiAgZm9yICh2YXIgbWF4ID0gdGhpcy5zcmMubGVuZ3RoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgY2ggPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgaWYgKCFpc1NwYWNlKGNoKSkgeyBicmVhazsgfVxuICB9XG4gIHJldHVybiBwb3M7XG59O1xuXG4vLyBTa2lwIHNwYWNlcyBmcm9tIGdpdmVuIHBvc2l0aW9uIGluIHJldmVyc2UuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwU3BhY2VzQmFjayA9IGZ1bmN0aW9uIHNraXBTcGFjZXNCYWNrKHBvcywgbWluKSB7XG4gIGlmIChwb3MgPD0gbWluKSB7IHJldHVybiBwb3M7IH1cblxuICB3aGlsZSAocG9zID4gbWluKSB7XG4gICAgaWYgKCFpc1NwYWNlKHRoaXMuc3JjLmNoYXJDb2RlQXQoLS1wb3MpKSkgeyByZXR1cm4gcG9zICsgMTsgfVxuICB9XG4gIHJldHVybiBwb3M7XG59O1xuXG4vLyBTa2lwIGNoYXIgY29kZXMgZnJvbSBnaXZlbiBwb3NpdGlvblxuU3RhdGVCbG9jay5wcm90b3R5cGUuc2tpcENoYXJzID0gZnVuY3Rpb24gc2tpcENoYXJzKHBvcywgY29kZSkge1xuICBmb3IgKHZhciBtYXggPSB0aGlzLnNyYy5sZW5ndGg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICBpZiAodGhpcy5zcmMuY2hhckNvZGVBdChwb3MpICE9PSBjb2RlKSB7IGJyZWFrOyB9XG4gIH1cbiAgcmV0dXJuIHBvcztcbn07XG5cbi8vIFNraXAgY2hhciBjb2RlcyByZXZlcnNlIGZyb20gZ2l2ZW4gcG9zaXRpb24gLSAxXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5za2lwQ2hhcnNCYWNrID0gZnVuY3Rpb24gc2tpcENoYXJzQmFjayhwb3MsIGNvZGUsIG1pbikge1xuICBpZiAocG9zIDw9IG1pbikgeyByZXR1cm4gcG9zOyB9XG5cbiAgd2hpbGUgKHBvcyA+IG1pbikge1xuICAgIGlmIChjb2RlICE9PSB0aGlzLnNyYy5jaGFyQ29kZUF0KC0tcG9zKSkgeyByZXR1cm4gcG9zICsgMTsgfVxuICB9XG4gIHJldHVybiBwb3M7XG59O1xuXG4vLyBjdXQgbGluZXMgcmFuZ2UgZnJvbSBzb3VyY2UuXG5TdGF0ZUJsb2NrLnByb3RvdHlwZS5nZXRMaW5lcyA9IGZ1bmN0aW9uIGdldExpbmVzKGJlZ2luLCBlbmQsIGluZGVudCwga2VlcExhc3RMRikge1xuICB2YXIgaSwgbGluZUluZGVudCwgY2gsIGZpcnN0LCBsYXN0LCBxdWV1ZSwgbGluZVN0YXJ0LFxuICAgICAgbGluZSA9IGJlZ2luO1xuXG4gIGlmIChiZWdpbiA+PSBlbmQpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBxdWV1ZSA9IG5ldyBBcnJheShlbmQgLSBiZWdpbik7XG5cbiAgZm9yIChpID0gMDsgbGluZSA8IGVuZDsgbGluZSsrLCBpKyspIHtcbiAgICBsaW5lSW5kZW50ID0gMDtcbiAgICBsaW5lU3RhcnQgPSBmaXJzdCA9IHRoaXMuYk1hcmtzW2xpbmVdO1xuXG4gICAgaWYgKGxpbmUgKyAxIDwgZW5kIHx8IGtlZXBMYXN0TEYpIHtcbiAgICAgIC8vIE5vIG5lZWQgZm9yIGJvdW5kcyBjaGVjayBiZWNhdXNlIHdlIGhhdmUgZmFrZSBlbnRyeSBvbiB0YWlsLlxuICAgICAgbGFzdCA9IHRoaXMuZU1hcmtzW2xpbmVdICsgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGFzdCA9IHRoaXMuZU1hcmtzW2xpbmVdO1xuICAgIH1cblxuICAgIHdoaWxlIChmaXJzdCA8IGxhc3QgJiYgbGluZUluZGVudCA8IGluZGVudCkge1xuICAgICAgY2ggPSB0aGlzLnNyYy5jaGFyQ29kZUF0KGZpcnN0KTtcblxuICAgICAgaWYgKGlzU3BhY2UoY2gpKSB7XG4gICAgICAgIGlmIChjaCA9PT0gMHgwOSkge1xuICAgICAgICAgIGxpbmVJbmRlbnQgKz0gNCAtIChsaW5lSW5kZW50ICsgdGhpcy5ic0NvdW50W2xpbmVdKSAlIDQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGluZUluZGVudCsrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0IC0gbGluZVN0YXJ0IDwgdGhpcy50U2hpZnRbbGluZV0pIHtcbiAgICAgICAgLy8gcGF0Y2hlZCB0U2hpZnQgbWFza2VkIGNoYXJhY3RlcnMgdG8gbG9vayBsaWtlIHNwYWNlcyAoYmxvY2txdW90ZXMsIGxpc3QgbWFya2VycylcbiAgICAgICAgbGluZUluZGVudCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGZpcnN0Kys7XG4gICAgfVxuXG4gICAgaWYgKGxpbmVJbmRlbnQgPiBpbmRlbnQpIHtcbiAgICAgIC8vIHBhcnRpYWxseSBleHBhbmRpbmcgdGFicyBpbiBjb2RlIGJsb2NrcywgZS5nICdcXHRcXHRmb29iYXInXG4gICAgICAvLyB3aXRoIGluZGVudD0yIGJlY29tZXMgJyAgXFx0Zm9vYmFyJ1xuICAgICAgcXVldWVbaV0gPSBuZXcgQXJyYXkobGluZUluZGVudCAtIGluZGVudCArIDEpLmpvaW4oJyAnKSArIHRoaXMuc3JjLnNsaWNlKGZpcnN0LCBsYXN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcXVldWVbaV0gPSB0aGlzLnNyYy5zbGljZShmaXJzdCwgbGFzdCk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHF1ZXVlLmpvaW4oJycpO1xufTtcblxuLy8gcmUtZXhwb3J0IFRva2VuIGNsYXNzIHRvIHVzZSBpbiBibG9jayBydWxlc1xuU3RhdGVCbG9jay5wcm90b3R5cGUuVG9rZW4gPSBUb2tlbjtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlQmxvY2s7XG4iLCIvLyBHRk0gdGFibGUsIG5vbi1zdGFuZGFyZFxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxuXG5mdW5jdGlvbiBnZXRMaW5lKHN0YXRlLCBsaW5lKSB7XG4gIHZhciBwb3MgPSBzdGF0ZS5iTWFya3NbbGluZV0gKyBzdGF0ZS5ibGtJbmRlbnQsXG4gICAgICBtYXggPSBzdGF0ZS5lTWFya3NbbGluZV07XG5cbiAgcmV0dXJuIHN0YXRlLnNyYy5zdWJzdHIocG9zLCBtYXggLSBwb3MpO1xufVxuXG5mdW5jdGlvbiBlc2NhcGVkU3BsaXQoc3RyKSB7XG4gIHZhciByZXN1bHQgPSBbXSxcbiAgICAgIHBvcyA9IDAsXG4gICAgICBtYXggPSBzdHIubGVuZ3RoLFxuICAgICAgY2gsXG4gICAgICBlc2NhcGVzID0gMCxcbiAgICAgIGxhc3RQb3MgPSAwLFxuICAgICAgYmFja1RpY2tlZCA9IGZhbHNlLFxuICAgICAgbGFzdEJhY2tUaWNrID0gMDtcblxuICBjaCAgPSBzdHIuY2hhckNvZGVBdChwb3MpO1xuXG4gIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICBpZiAoY2ggPT09IDB4NjAvKiBgICovKSB7XG4gICAgICBpZiAoYmFja1RpY2tlZCkge1xuICAgICAgICAvLyBtYWtlIFxcYCBjbG9zZSBjb2RlIHNlcXVlbmNlLCBidXQgbm90IG9wZW4gaXQ7XG4gICAgICAgIC8vIHRoZSByZWFzb24gaXM6IGBcXGAgaXMgY29ycmVjdCBjb2RlIGJsb2NrXG4gICAgICAgIGJhY2tUaWNrZWQgPSBmYWxzZTtcbiAgICAgICAgbGFzdEJhY2tUaWNrID0gcG9zO1xuICAgICAgfSBlbHNlIGlmIChlc2NhcGVzICUgMiA9PT0gMCkge1xuICAgICAgICBiYWNrVGlja2VkID0gdHJ1ZTtcbiAgICAgICAgbGFzdEJhY2tUaWNrID0gcG9zO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggPT09IDB4N2MvKiB8ICovICYmIChlc2NhcGVzICUgMiA9PT0gMCkgJiYgIWJhY2tUaWNrZWQpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHN0ci5zdWJzdHJpbmcobGFzdFBvcywgcG9zKSk7XG4gICAgICBsYXN0UG9zID0gcG9zICsgMTtcbiAgICB9XG5cbiAgICBpZiAoY2ggPT09IDB4NWMvKiBcXCAqLykge1xuICAgICAgZXNjYXBlcysrO1xuICAgIH0gZWxzZSB7XG4gICAgICBlc2NhcGVzID0gMDtcbiAgICB9XG5cbiAgICBwb3MrKztcblxuICAgIC8vIElmIHRoZXJlIHdhcyBhbiB1bi1jbG9zZWQgYmFja3RpY2ssIGdvIGJhY2sgdG8ganVzdCBhZnRlclxuICAgIC8vIHRoZSBsYXN0IGJhY2t0aWNrLCBidXQgYXMgaWYgaXQgd2FzIGEgbm9ybWFsIGNoYXJhY3RlclxuICAgIGlmIChwb3MgPT09IG1heCAmJiBiYWNrVGlja2VkKSB7XG4gICAgICBiYWNrVGlja2VkID0gZmFsc2U7XG4gICAgICBwb3MgPSBsYXN0QmFja1RpY2sgKyAxO1xuICAgIH1cblxuICAgIGNoID0gc3RyLmNoYXJDb2RlQXQocG9zKTtcbiAgfVxuXG4gIHJlc3VsdC5wdXNoKHN0ci5zdWJzdHJpbmcobGFzdFBvcykpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB0YWJsZShzdGF0ZSwgc3RhcnRMaW5lLCBlbmRMaW5lLCBzaWxlbnQpIHtcbiAgdmFyIGNoLCBsaW5lVGV4dCwgcG9zLCBpLCBuZXh0TGluZSwgY29sdW1ucywgY29sdW1uQ291bnQsIHRva2VuLFxuICAgICAgYWxpZ25zLCB0LCB0YWJsZUxpbmVzLCB0Ym9keUxpbmVzO1xuXG4gIC8vIHNob3VsZCBoYXZlIGF0IGxlYXN0IHR3byBsaW5lc1xuICBpZiAoc3RhcnRMaW5lICsgMiA+IGVuZExpbmUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgbmV4dExpbmUgPSBzdGFydExpbmUgKyAxO1xuXG4gIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIC8vIGlmIGl0J3MgaW5kZW50ZWQgbW9yZSB0aGFuIDMgc3BhY2VzLCBpdCBzaG91bGQgYmUgYSBjb2RlIGJsb2NrXG4gIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIC0gc3RhdGUuYmxrSW5kZW50ID49IDQpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBzZWNvbmQgbGluZSBzaG91bGQgYmUgJ3wnLCAnLScsICc6JyxcbiAgLy8gYW5kIG5vIG90aGVyIGNoYXJhY3RlcnMgYXJlIGFsbG93ZWQgYnV0IHNwYWNlcztcbiAgLy8gYmFzaWNhbGx5LCB0aGlzIGlzIHRoZSBlcXVpdmFsZW50IG9mIC9eWy06fF1bLTp8XFxzXSokLyByZWdleHBcblxuICBwb3MgPSBzdGF0ZS5iTWFya3NbbmV4dExpbmVdICsgc3RhdGUudFNoaWZ0W25leHRMaW5lXTtcbiAgaWYgKHBvcyA+PSBzdGF0ZS5lTWFya3NbbmV4dExpbmVdKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGNoID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKyspO1xuICBpZiAoY2ggIT09IDB4N0MvKiB8ICovICYmIGNoICE9PSAweDJELyogLSAqLyAmJiBjaCAhPT0gMHgzQS8qIDogKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgd2hpbGUgKHBvcyA8IHN0YXRlLmVNYXJrc1tuZXh0TGluZV0pIHtcbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgICBpZiAoY2ggIT09IDB4N0MvKiB8ICovICYmIGNoICE9PSAweDJELyogLSAqLyAmJiBjaCAhPT0gMHgzQS8qIDogKi8gJiYgIWlzU3BhY2UoY2gpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgcG9zKys7XG4gIH1cblxuICBsaW5lVGV4dCA9IGdldExpbmUoc3RhdGUsIHN0YXJ0TGluZSArIDEpO1xuXG4gIGNvbHVtbnMgPSBsaW5lVGV4dC5zcGxpdCgnfCcpO1xuICBhbGlnbnMgPSBbXTtcbiAgZm9yIChpID0gMDsgaSA8IGNvbHVtbnMubGVuZ3RoOyBpKyspIHtcbiAgICB0ID0gY29sdW1uc1tpXS50cmltKCk7XG4gICAgaWYgKCF0KSB7XG4gICAgICAvLyBhbGxvdyBlbXB0eSBjb2x1bW5zIGJlZm9yZSBhbmQgYWZ0ZXIgdGFibGUsIGJ1dCBub3QgaW4gYmV0d2VlbiBjb2x1bW5zO1xuICAgICAgLy8gZS5nLiBhbGxvdyBgIHwtLS18IGAsIGRpc2FsbG93IGAgLS0tfHwtLS0gYFxuICAgICAgaWYgKGkgPT09IDAgfHwgaSA9PT0gY29sdW1ucy5sZW5ndGggLSAxKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghL146Py0rOj8kLy50ZXN0KHQpKSB7IHJldHVybiBmYWxzZTsgfVxuICAgIGlmICh0LmNoYXJDb2RlQXQodC5sZW5ndGggLSAxKSA9PT0gMHgzQS8qIDogKi8pIHtcbiAgICAgIGFsaWducy5wdXNoKHQuY2hhckNvZGVBdCgwKSA9PT0gMHgzQS8qIDogKi8gPyAnY2VudGVyJyA6ICdyaWdodCcpO1xuICAgIH0gZWxzZSBpZiAodC5jaGFyQ29kZUF0KDApID09PSAweDNBLyogOiAqLykge1xuICAgICAgYWxpZ25zLnB1c2goJ2xlZnQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWxpZ25zLnB1c2goJycpO1xuICAgIH1cbiAgfVxuXG4gIGxpbmVUZXh0ID0gZ2V0TGluZShzdGF0ZSwgc3RhcnRMaW5lKS50cmltKCk7XG4gIGlmIChsaW5lVGV4dC5pbmRleE9mKCd8JykgPT09IC0xKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUuc0NvdW50W3N0YXJ0TGluZV0gLSBzdGF0ZS5ibGtJbmRlbnQgPj0gNCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgY29sdW1ucyA9IGVzY2FwZWRTcGxpdChsaW5lVGV4dC5yZXBsYWNlKC9eXFx8fFxcfCQvZywgJycpKTtcblxuICAvLyBoZWFkZXIgcm93IHdpbGwgZGVmaW5lIGFuIGFtb3VudCBvZiBjb2x1bW5zIGluIHRoZSBlbnRpcmUgdGFibGUsXG4gIC8vIGFuZCBhbGlnbiByb3cgc2hvdWxkbid0IGJlIHNtYWxsZXIgdGhhbiB0aGF0ICh0aGUgcmVzdCBvZiB0aGUgcm93cyBjYW4pXG4gIGNvbHVtbkNvdW50ID0gY29sdW1ucy5sZW5ndGg7XG4gIGlmIChjb2x1bW5Db3VudCA+IGFsaWducy5sZW5ndGgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gdHJ1ZTsgfVxuXG4gIHRva2VuICAgICA9IHN0YXRlLnB1c2goJ3RhYmxlX29wZW4nLCAndGFibGUnLCAxKTtcbiAgdG9rZW4ubWFwID0gdGFibGVMaW5lcyA9IFsgc3RhcnRMaW5lLCAwIF07XG5cbiAgdG9rZW4gICAgID0gc3RhdGUucHVzaCgndGhlYWRfb3BlbicsICd0aGVhZCcsIDEpO1xuICB0b2tlbi5tYXAgPSBbIHN0YXJ0TGluZSwgc3RhcnRMaW5lICsgMSBdO1xuXG4gIHRva2VuICAgICA9IHN0YXRlLnB1c2goJ3RyX29wZW4nLCAndHInLCAxKTtcbiAgdG9rZW4ubWFwID0gWyBzdGFydExpbmUsIHN0YXJ0TGluZSArIDEgXTtcblxuICBmb3IgKGkgPSAwOyBpIDwgY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgndGhfb3BlbicsICd0aCcsIDEpO1xuICAgIHRva2VuLm1hcCAgICAgID0gWyBzdGFydExpbmUsIHN0YXJ0TGluZSArIDEgXTtcbiAgICBpZiAoYWxpZ25zW2ldKSB7XG4gICAgICB0b2tlbi5hdHRycyAgPSBbIFsgJ3N0eWxlJywgJ3RleHQtYWxpZ246JyArIGFsaWduc1tpXSBdIF07XG4gICAgfVxuXG4gICAgdG9rZW4gICAgICAgICAgPSBzdGF0ZS5wdXNoKCdpbmxpbmUnLCAnJywgMCk7XG4gICAgdG9rZW4uY29udGVudCAgPSBjb2x1bW5zW2ldLnRyaW0oKTtcbiAgICB0b2tlbi5tYXAgICAgICA9IFsgc3RhcnRMaW5lLCBzdGFydExpbmUgKyAxIF07XG4gICAgdG9rZW4uY2hpbGRyZW4gPSBbXTtcblxuICAgIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgndGhfY2xvc2UnLCAndGgnLCAtMSk7XG4gIH1cblxuICB0b2tlbiAgICAgPSBzdGF0ZS5wdXNoKCd0cl9jbG9zZScsICd0cicsIC0xKTtcbiAgdG9rZW4gICAgID0gc3RhdGUucHVzaCgndGhlYWRfY2xvc2UnLCAndGhlYWQnLCAtMSk7XG5cbiAgdG9rZW4gICAgID0gc3RhdGUucHVzaCgndGJvZHlfb3BlbicsICd0Ym9keScsIDEpO1xuICB0b2tlbi5tYXAgPSB0Ym9keUxpbmVzID0gWyBzdGFydExpbmUgKyAyLCAwIF07XG5cbiAgZm9yIChuZXh0TGluZSA9IHN0YXJ0TGluZSArIDI7IG5leHRMaW5lIDwgZW5kTGluZTsgbmV4dExpbmUrKykge1xuICAgIGlmIChzdGF0ZS5zQ291bnRbbmV4dExpbmVdIDwgc3RhdGUuYmxrSW5kZW50KSB7IGJyZWFrOyB9XG5cbiAgICBsaW5lVGV4dCA9IGdldExpbmUoc3RhdGUsIG5leHRMaW5lKS50cmltKCk7XG4gICAgaWYgKGxpbmVUZXh0LmluZGV4T2YoJ3wnKSA9PT0gLTEpIHsgYnJlYWs7IH1cbiAgICBpZiAoc3RhdGUuc0NvdW50W25leHRMaW5lXSAtIHN0YXRlLmJsa0luZGVudCA+PSA0KSB7IGJyZWFrOyB9XG4gICAgY29sdW1ucyA9IGVzY2FwZWRTcGxpdChsaW5lVGV4dC5yZXBsYWNlKC9eXFx8fFxcfCQvZywgJycpKTtcblxuICAgIHRva2VuID0gc3RhdGUucHVzaCgndHJfb3BlbicsICd0cicsIDEpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBjb2x1bW5Db3VudDsgaSsrKSB7XG4gICAgICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ3RkX29wZW4nLCAndGQnLCAxKTtcbiAgICAgIGlmIChhbGlnbnNbaV0pIHtcbiAgICAgICAgdG9rZW4uYXR0cnMgID0gWyBbICdzdHlsZScsICd0ZXh0LWFsaWduOicgKyBhbGlnbnNbaV0gXSBdO1xuICAgICAgfVxuXG4gICAgICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ2lubGluZScsICcnLCAwKTtcbiAgICAgIHRva2VuLmNvbnRlbnQgID0gY29sdW1uc1tpXSA/IGNvbHVtbnNbaV0udHJpbSgpIDogJyc7XG4gICAgICB0b2tlbi5jaGlsZHJlbiA9IFtdO1xuXG4gICAgICB0b2tlbiAgICAgICAgICA9IHN0YXRlLnB1c2goJ3RkX2Nsb3NlJywgJ3RkJywgLTEpO1xuICAgIH1cbiAgICB0b2tlbiA9IHN0YXRlLnB1c2goJ3RyX2Nsb3NlJywgJ3RyJywgLTEpO1xuICB9XG4gIHRva2VuID0gc3RhdGUucHVzaCgndGJvZHlfY2xvc2UnLCAndGJvZHknLCAtMSk7XG4gIHRva2VuID0gc3RhdGUucHVzaCgndGFibGVfY2xvc2UnLCAndGFibGUnLCAtMSk7XG5cbiAgdGFibGVMaW5lc1sxXSA9IHRib2R5TGluZXNbMV0gPSBuZXh0TGluZTtcbiAgc3RhdGUubGluZSA9IG5leHRMaW5lO1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBibG9jayhzdGF0ZSkge1xuICB2YXIgdG9rZW47XG5cbiAgaWYgKHN0YXRlLmlubGluZU1vZGUpIHtcbiAgICB0b2tlbiAgICAgICAgICA9IG5ldyBzdGF0ZS5Ub2tlbignaW5saW5lJywgJycsIDApO1xuICAgIHRva2VuLmNvbnRlbnQgID0gc3RhdGUuc3JjO1xuICAgIHRva2VuLm1hcCAgICAgID0gWyAwLCAxIF07XG4gICAgdG9rZW4uY2hpbGRyZW4gPSBbXTtcbiAgICBzdGF0ZS50b2tlbnMucHVzaCh0b2tlbik7XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUubWQuYmxvY2sucGFyc2Uoc3RhdGUuc3JjLCBzdGF0ZS5tZCwgc3RhdGUuZW52LCBzdGF0ZS50b2tlbnMpO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlubGluZShzdGF0ZSkge1xuICB2YXIgdG9rZW5zID0gc3RhdGUudG9rZW5zLCB0b2ssIGksIGw7XG5cbiAgLy8gUGFyc2UgaW5saW5lc1xuICBmb3IgKGkgPSAwLCBsID0gdG9rZW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIHRvayA9IHRva2Vuc1tpXTtcbiAgICBpZiAodG9rLnR5cGUgPT09ICdpbmxpbmUnKSB7XG4gICAgICBzdGF0ZS5tZC5pbmxpbmUucGFyc2UodG9rLmNvbnRlbnQsIHN0YXRlLm1kLCBzdGF0ZS5lbnYsIHRvay5jaGlsZHJlbik7XG4gICAgfVxuICB9XG59O1xuIiwiLy8gUmVwbGFjZSBsaW5rLWxpa2UgdGV4dHMgd2l0aCBsaW5rIG5vZGVzLlxuLy9cbi8vIEN1cnJlbnRseSByZXN0cmljdGVkIGJ5IGBtZC52YWxpZGF0ZUxpbmsoKWAgdG8gaHR0cC9odHRwcy9mdHBcbi8vXG4ndXNlIHN0cmljdCc7XG5cblxudmFyIGFycmF5UmVwbGFjZUF0ID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuYXJyYXlSZXBsYWNlQXQ7XG5cblxuZnVuY3Rpb24gaXNMaW5rT3BlbihzdHIpIHtcbiAgcmV0dXJuIC9ePGFbPlxcc10vaS50ZXN0KHN0cik7XG59XG5mdW5jdGlvbiBpc0xpbmtDbG9zZShzdHIpIHtcbiAgcmV0dXJuIC9ePFxcL2FcXHMqPi9pLnRlc3Qoc3RyKTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxpbmtpZnkoc3RhdGUpIHtcbiAgdmFyIGksIGosIGwsIHRva2VucywgdG9rZW4sIGN1cnJlbnRUb2tlbiwgbm9kZXMsIGxuLCB0ZXh0LCBwb3MsIGxhc3RQb3MsXG4gICAgICBsZXZlbCwgaHRtbExpbmtMZXZlbCwgdXJsLCBmdWxsVXJsLCB1cmxUZXh0LFxuICAgICAgYmxvY2tUb2tlbnMgPSBzdGF0ZS50b2tlbnMsXG4gICAgICBsaW5rcztcblxuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMubGlua2lmeSkgeyByZXR1cm47IH1cblxuICBmb3IgKGogPSAwLCBsID0gYmxvY2tUb2tlbnMubGVuZ3RoOyBqIDwgbDsgaisrKSB7XG4gICAgaWYgKGJsb2NrVG9rZW5zW2pdLnR5cGUgIT09ICdpbmxpbmUnIHx8XG4gICAgICAgICFzdGF0ZS5tZC5saW5raWZ5LnByZXRlc3QoYmxvY2tUb2tlbnNbal0uY29udGVudCkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHRva2VucyA9IGJsb2NrVG9rZW5zW2pdLmNoaWxkcmVuO1xuXG4gICAgaHRtbExpbmtMZXZlbCA9IDA7XG5cbiAgICAvLyBXZSBzY2FuIGZyb20gdGhlIGVuZCwgdG8ga2VlcCBwb3NpdGlvbiB3aGVuIG5ldyB0YWdzIGFkZGVkLlxuICAgIC8vIFVzZSByZXZlcnNlZCBsb2dpYyBpbiBsaW5rcyBzdGFydC9lbmQgbWF0Y2hcbiAgICBmb3IgKGkgPSB0b2tlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGN1cnJlbnRUb2tlbiA9IHRva2Vuc1tpXTtcblxuICAgICAgLy8gU2tpcCBjb250ZW50IG9mIG1hcmtkb3duIGxpbmtzXG4gICAgICBpZiAoY3VycmVudFRva2VuLnR5cGUgPT09ICdsaW5rX2Nsb3NlJykge1xuICAgICAgICBpLS07XG4gICAgICAgIHdoaWxlICh0b2tlbnNbaV0ubGV2ZWwgIT09IGN1cnJlbnRUb2tlbi5sZXZlbCAmJiB0b2tlbnNbaV0udHlwZSAhPT0gJ2xpbmtfb3BlbicpIHtcbiAgICAgICAgICBpLS07XG4gICAgICAgIH1cbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFNraXAgY29udGVudCBvZiBodG1sIHRhZyBsaW5rc1xuICAgICAgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSAnaHRtbF9pbmxpbmUnKSB7XG4gICAgICAgIGlmIChpc0xpbmtPcGVuKGN1cnJlbnRUb2tlbi5jb250ZW50KSAmJiBodG1sTGlua0xldmVsID4gMCkge1xuICAgICAgICAgIGh0bWxMaW5rTGV2ZWwtLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNMaW5rQ2xvc2UoY3VycmVudFRva2VuLmNvbnRlbnQpKSB7XG4gICAgICAgICAgaHRtbExpbmtMZXZlbCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaHRtbExpbmtMZXZlbCA+IDApIHsgY29udGludWU7IH1cblxuICAgICAgaWYgKGN1cnJlbnRUb2tlbi50eXBlID09PSAndGV4dCcgJiYgc3RhdGUubWQubGlua2lmeS50ZXN0KGN1cnJlbnRUb2tlbi5jb250ZW50KSkge1xuXG4gICAgICAgIHRleHQgPSBjdXJyZW50VG9rZW4uY29udGVudDtcbiAgICAgICAgbGlua3MgPSBzdGF0ZS5tZC5saW5raWZ5Lm1hdGNoKHRleHQpO1xuXG4gICAgICAgIC8vIE5vdyBzcGxpdCBzdHJpbmcgdG8gbm9kZXNcbiAgICAgICAgbm9kZXMgPSBbXTtcbiAgICAgICAgbGV2ZWwgPSBjdXJyZW50VG9rZW4ubGV2ZWw7XG4gICAgICAgIGxhc3RQb3MgPSAwO1xuXG4gICAgICAgIGZvciAobG4gPSAwOyBsbiA8IGxpbmtzLmxlbmd0aDsgbG4rKykge1xuXG4gICAgICAgICAgdXJsID0gbGlua3NbbG5dLnVybDtcbiAgICAgICAgICBmdWxsVXJsID0gc3RhdGUubWQubm9ybWFsaXplTGluayh1cmwpO1xuICAgICAgICAgIGlmICghc3RhdGUubWQudmFsaWRhdGVMaW5rKGZ1bGxVcmwpKSB7IGNvbnRpbnVlOyB9XG5cbiAgICAgICAgICB1cmxUZXh0ID0gbGlua3NbbG5dLnRleHQ7XG5cbiAgICAgICAgICAvLyBMaW5raWZpZXIgbWlnaHQgc2VuZCByYXcgaG9zdG5hbWVzIGxpa2UgXCJleGFtcGxlLmNvbVwiLCB3aGVyZSB1cmxcbiAgICAgICAgICAvLyBzdGFydHMgd2l0aCBkb21haW4gbmFtZS4gU28gd2UgcHJlcGVuZCBodHRwOi8vIGluIHRob3NlIGNhc2VzLFxuICAgICAgICAgIC8vIGFuZCByZW1vdmUgaXQgYWZ0ZXJ3YXJkcy5cbiAgICAgICAgICAvL1xuICAgICAgICAgIGlmICghbGlua3NbbG5dLnNjaGVtYSkge1xuICAgICAgICAgICAgdXJsVGV4dCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KCdodHRwOi8vJyArIHVybFRleHQpLnJlcGxhY2UoL15odHRwOlxcL1xcLy8sICcnKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGxpbmtzW2xuXS5zY2hlbWEgPT09ICdtYWlsdG86JyAmJiAhL15tYWlsdG86L2kudGVzdCh1cmxUZXh0KSkge1xuICAgICAgICAgICAgdXJsVGV4dCA9IHN0YXRlLm1kLm5vcm1hbGl6ZUxpbmtUZXh0KCdtYWlsdG86JyArIHVybFRleHQpLnJlcGxhY2UoL15tYWlsdG86LywgJycpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cmxUZXh0ID0gc3RhdGUubWQubm9ybWFsaXplTGlua1RleHQodXJsVGV4dCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcG9zID0gbGlua3NbbG5dLmluZGV4O1xuXG4gICAgICAgICAgaWYgKHBvcyA+IGxhc3RQb3MpIHtcbiAgICAgICAgICAgIHRva2VuICAgICAgICAgPSBuZXcgc3RhdGUuVG9rZW4oJ3RleHQnLCAnJywgMCk7XG4gICAgICAgICAgICB0b2tlbi5jb250ZW50ID0gdGV4dC5zbGljZShsYXN0UG9zLCBwb3MpO1xuICAgICAgICAgICAgdG9rZW4ubGV2ZWwgICA9IGxldmVsO1xuICAgICAgICAgICAgbm9kZXMucHVzaCh0b2tlbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdG9rZW4gICAgICAgICA9IG5ldyBzdGF0ZS5Ub2tlbignbGlua19vcGVuJywgJ2EnLCAxKTtcbiAgICAgICAgICB0b2tlbi5hdHRycyAgID0gWyBbICdocmVmJywgZnVsbFVybCBdIF07XG4gICAgICAgICAgdG9rZW4ubGV2ZWwgICA9IGxldmVsKys7XG4gICAgICAgICAgdG9rZW4ubWFya3VwICA9ICdsaW5raWZ5JztcbiAgICAgICAgICB0b2tlbi5pbmZvICAgID0gJ2F1dG8nO1xuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW4pO1xuXG4gICAgICAgICAgdG9rZW4gICAgICAgICA9IG5ldyBzdGF0ZS5Ub2tlbigndGV4dCcsICcnLCAwKTtcbiAgICAgICAgICB0b2tlbi5jb250ZW50ID0gdXJsVGV4dDtcbiAgICAgICAgICB0b2tlbi5sZXZlbCAgID0gbGV2ZWw7XG4gICAgICAgICAgbm9kZXMucHVzaCh0b2tlbik7XG5cbiAgICAgICAgICB0b2tlbiAgICAgICAgID0gbmV3IHN0YXRlLlRva2VuKCdsaW5rX2Nsb3NlJywgJ2EnLCAtMSk7XG4gICAgICAgICAgdG9rZW4ubGV2ZWwgICA9IC0tbGV2ZWw7XG4gICAgICAgICAgdG9rZW4ubWFya3VwICA9ICdsaW5raWZ5JztcbiAgICAgICAgICB0b2tlbi5pbmZvICAgID0gJ2F1dG8nO1xuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW4pO1xuXG4gICAgICAgICAgbGFzdFBvcyA9IGxpbmtzW2xuXS5sYXN0SW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhc3RQb3MgPCB0ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgIHRva2VuICAgICAgICAgPSBuZXcgc3RhdGUuVG9rZW4oJ3RleHQnLCAnJywgMCk7XG4gICAgICAgICAgdG9rZW4uY29udGVudCA9IHRleHQuc2xpY2UobGFzdFBvcyk7XG4gICAgICAgICAgdG9rZW4ubGV2ZWwgICA9IGxldmVsO1xuICAgICAgICAgIG5vZGVzLnB1c2godG9rZW4pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVwbGFjZSBjdXJyZW50IG5vZGVcbiAgICAgICAgYmxvY2tUb2tlbnNbal0uY2hpbGRyZW4gPSB0b2tlbnMgPSBhcnJheVJlcGxhY2VBdCh0b2tlbnMsIGksIG5vZGVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iLCIvLyBOb3JtYWxpemUgaW5wdXQgc3RyaW5nXG5cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgTkVXTElORVNfUkUgID0gL1xccltcXG5cXHUwMDg1XT98W1xcdTI0MjRcXHUyMDI4XFx1MDA4NV0vZztcbnZhciBOVUxMX1JFICAgICAgPSAvXFx1MDAwMC9nO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5saW5lKHN0YXRlKSB7XG4gIHZhciBzdHI7XG5cbiAgLy8gTm9ybWFsaXplIG5ld2xpbmVzXG4gIHN0ciA9IHN0YXRlLnNyYy5yZXBsYWNlKE5FV0xJTkVTX1JFLCAnXFxuJyk7XG5cbiAgLy8gUmVwbGFjZSBOVUxMIGNoYXJhY3RlcnNcbiAgc3RyID0gc3RyLnJlcGxhY2UoTlVMTF9SRSwgJ1xcdUZGRkQnKTtcblxuICBzdGF0ZS5zcmMgPSBzdHI7XG59O1xuIiwiLy8gU2ltcGxlIHR5cG9ncmFwaHljIHJlcGxhY2VtZW50c1xuLy9cbi8vIChjKSAoQykg4oaSIMKpXG4vLyAodG0pIChUTSkg4oaSIOKEolxuLy8gKHIpIChSKSDihpIgwq5cbi8vICstIOKGkiDCsVxuLy8gKHApIChQKSAtPiDCp1xuLy8gLi4uIOKGkiDigKYgKGFsc28gPy4uLi4g4oaSID8uLiwgIS4uLi4g4oaSICEuLilcbi8vID8/Pz8/Pz8/IOKGkiA/Pz8sICEhISEhIOKGkiAhISEsIGAsLGAg4oaSIGAsYFxuLy8gLS0g4oaSICZuZGFzaDssIC0tLSDihpIgJm1kYXNoO1xuLy9cbid1c2Ugc3RyaWN0JztcblxuLy8gVE9ETzpcbi8vIC0gZnJhY3Rpb25hbHMgMS8yLCAxLzQsIDMvNCAtPiDCvSwgwrwsIMK+XG4vLyAtIG1pbHRpcGxpY2F0aW9uIDIgeCA0IC0+IDIgw5cgNFxuXG52YXIgUkFSRV9SRSA9IC9cXCstfFxcLlxcLnxcXD9cXD9cXD9cXD98ISEhIXwsLHwtLS87XG5cbi8vIFdvcmthcm91bmQgZm9yIHBoYW50b21qcyAtIG5lZWQgcmVnZXggd2l0aG91dCAvZyBmbGFnLFxuLy8gb3Igcm9vdCBjaGVjayB3aWxsIGZhaWwgZXZlcnkgc2Vjb25kIHRpbWVcbnZhciBTQ09QRURfQUJCUl9URVNUX1JFID0gL1xcKChjfHRtfHJ8cClcXCkvaTtcblxudmFyIFNDT1BFRF9BQkJSX1JFID0gL1xcKChjfHRtfHJ8cClcXCkvaWc7XG52YXIgU0NPUEVEX0FCQlIgPSB7XG4gIGM6ICfCqScsXG4gIHI6ICfCricsXG4gIHA6ICfCpycsXG4gIHRtOiAn4oSiJ1xufTtcblxuZnVuY3Rpb24gcmVwbGFjZUZuKG1hdGNoLCBuYW1lKSB7XG4gIHJldHVybiBTQ09QRURfQUJCUltuYW1lLnRvTG93ZXJDYXNlKCldO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlX3Njb3BlZChpbmxpbmVUb2tlbnMpIHtcbiAgdmFyIGksIHRva2VuLCBpbnNpZGVfYXV0b2xpbmsgPSAwO1xuXG4gIGZvciAoaSA9IGlubGluZVRva2Vucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHRva2VuID0gaW5saW5lVG9rZW5zW2ldO1xuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09ICd0ZXh0JyAmJiAhaW5zaWRlX2F1dG9saW5rKSB7XG4gICAgICB0b2tlbi5jb250ZW50ID0gdG9rZW4uY29udGVudC5yZXBsYWNlKFNDT1BFRF9BQkJSX1JFLCByZXBsYWNlRm4pO1xuICAgIH1cblxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19vcGVuJyAmJiB0b2tlbi5pbmZvID09PSAnYXV0bycpIHtcbiAgICAgIGluc2lkZV9hdXRvbGluay0tO1xuICAgIH1cblxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19jbG9zZScgJiYgdG9rZW4uaW5mbyA9PT0gJ2F1dG8nKSB7XG4gICAgICBpbnNpZGVfYXV0b2xpbmsrKztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVwbGFjZV9yYXJlKGlubGluZVRva2Vucykge1xuICB2YXIgaSwgdG9rZW4sIGluc2lkZV9hdXRvbGluayA9IDA7XG5cbiAgZm9yIChpID0gaW5saW5lVG9rZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdG9rZW4gPSBpbmxpbmVUb2tlbnNbaV07XG5cbiAgICBpZiAodG9rZW4udHlwZSA9PT0gJ3RleHQnICYmICFpbnNpZGVfYXV0b2xpbmspIHtcbiAgICAgIGlmIChSQVJFX1JFLnRlc3QodG9rZW4uY29udGVudCkpIHtcbiAgICAgICAgdG9rZW4uY29udGVudCA9IHRva2VuLmNvbnRlbnRcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcKy0vZywgJ8KxJylcbiAgICAgICAgICAgICAgICAgICAgLy8gLi4sIC4uLiwgLi4uLi4uLiAtPiDigKZcbiAgICAgICAgICAgICAgICAgICAgLy8gYnV0ID8uLi4uLiAmICEuLi4uLiAtPiA/Li4gJiAhLi5cbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcLnsyLH0vZywgJ+KApicpLnJlcGxhY2UoLyhbPyFdKeKApi9nLCAnJDEuLicpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oWz8hXSl7NCx9L2csICckMSQxJDEnKS5yZXBsYWNlKC8sezIsfS9nLCAnLCcpXG4gICAgICAgICAgICAgICAgICAgIC8vIGVtLWRhc2hcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhefFteLV0pLS0tKFteLV18JCkvbWcsICckMVxcdTIwMTQkMicpXG4gICAgICAgICAgICAgICAgICAgIC8vIGVuLWRhc2hcbiAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyhefFxccyktLShcXHN8JCkvbWcsICckMVxcdTIwMTMkMicpXG4gICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXnxbXi1cXHNdKS0tKFteLVxcc118JCkvbWcsICckMVxcdTIwMTMkMicpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19vcGVuJyAmJiB0b2tlbi5pbmZvID09PSAnYXV0bycpIHtcbiAgICAgIGluc2lkZV9hdXRvbGluay0tO1xuICAgIH1cblxuICAgIGlmICh0b2tlbi50eXBlID09PSAnbGlua19jbG9zZScgJiYgdG9rZW4uaW5mbyA9PT0gJ2F1dG8nKSB7XG4gICAgICBpbnNpZGVfYXV0b2xpbmsrKztcbiAgICB9XG4gIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHJlcGxhY2Uoc3RhdGUpIHtcbiAgdmFyIGJsa0lkeDtcblxuICBpZiAoIXN0YXRlLm1kLm9wdGlvbnMudHlwb2dyYXBoZXIpIHsgcmV0dXJuOyB9XG5cbiAgZm9yIChibGtJZHggPSBzdGF0ZS50b2tlbnMubGVuZ3RoIC0gMTsgYmxrSWR4ID49IDA7IGJsa0lkeC0tKSB7XG5cbiAgICBpZiAoc3RhdGUudG9rZW5zW2Jsa0lkeF0udHlwZSAhPT0gJ2lubGluZScpIHsgY29udGludWU7IH1cblxuICAgIGlmIChTQ09QRURfQUJCUl9URVNUX1JFLnRlc3Qoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY29udGVudCkpIHtcbiAgICAgIHJlcGxhY2Vfc2NvcGVkKHN0YXRlLnRva2Vuc1tibGtJZHhdLmNoaWxkcmVuKTtcbiAgICB9XG5cbiAgICBpZiAoUkFSRV9SRS50ZXN0KHN0YXRlLnRva2Vuc1tibGtJZHhdLmNvbnRlbnQpKSB7XG4gICAgICByZXBsYWNlX3JhcmUoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY2hpbGRyZW4pO1xuICAgIH1cblxuICB9XG59O1xuIiwiLy8gQ29udmVydCBzdHJhaWdodCBxdW90YXRpb24gbWFya3MgdG8gdHlwb2dyYXBoaWMgb25lc1xuLy9cbid1c2Ugc3RyaWN0JztcblxuXG52YXIgaXNXaGl0ZVNwYWNlICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1doaXRlU3BhY2U7XG52YXIgaXNQdW5jdENoYXIgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1B1bmN0Q2hhcjtcbnZhciBpc01kQXNjaWlQdW5jdCA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzTWRBc2NpaVB1bmN0O1xuXG52YXIgUVVPVEVfVEVTVF9SRSA9IC9bJ1wiXS87XG52YXIgUVVPVEVfUkUgPSAvWydcIl0vZztcbnZhciBBUE9TVFJPUEhFID0gJ1xcdTIwMTknOyAvKiDigJkgKi9cblxuXG5mdW5jdGlvbiByZXBsYWNlQXQoc3RyLCBpbmRleCwgY2gpIHtcbiAgcmV0dXJuIHN0ci5zdWJzdHIoMCwgaW5kZXgpICsgY2ggKyBzdHIuc3Vic3RyKGluZGV4ICsgMSk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NfaW5saW5lcyh0b2tlbnMsIHN0YXRlKSB7XG4gIHZhciBpLCB0b2tlbiwgdGV4dCwgdCwgcG9zLCBtYXgsIHRoaXNMZXZlbCwgaXRlbSwgbGFzdENoYXIsIG5leHRDaGFyLFxuICAgICAgaXNMYXN0UHVuY3RDaGFyLCBpc05leHRQdW5jdENoYXIsIGlzTGFzdFdoaXRlU3BhY2UsIGlzTmV4dFdoaXRlU3BhY2UsXG4gICAgICBjYW5PcGVuLCBjYW5DbG9zZSwgaiwgaXNTaW5nbGUsIHN0YWNrLCBvcGVuUXVvdGUsIGNsb3NlUXVvdGU7XG5cbiAgc3RhY2sgPSBbXTtcblxuICBmb3IgKGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdG9rZW4gPSB0b2tlbnNbaV07XG5cbiAgICB0aGlzTGV2ZWwgPSB0b2tlbnNbaV0ubGV2ZWw7XG5cbiAgICBmb3IgKGogPSBzdGFjay5sZW5ndGggLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgaWYgKHN0YWNrW2pdLmxldmVsIDw9IHRoaXNMZXZlbCkgeyBicmVhazsgfVxuICAgIH1cbiAgICBzdGFjay5sZW5ndGggPSBqICsgMTtcblxuICAgIGlmICh0b2tlbi50eXBlICE9PSAndGV4dCcpIHsgY29udGludWU7IH1cblxuICAgIHRleHQgPSB0b2tlbi5jb250ZW50O1xuICAgIHBvcyA9IDA7XG4gICAgbWF4ID0gdGV4dC5sZW5ndGg7XG5cbiAgICAvKmVzbGludCBuby1sYWJlbHM6MCxibG9jay1zY29wZWQtdmFyOjAqL1xuICAgIE9VVEVSOlxuICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgIFFVT1RFX1JFLmxhc3RJbmRleCA9IHBvcztcbiAgICAgIHQgPSBRVU9URV9SRS5leGVjKHRleHQpO1xuICAgICAgaWYgKCF0KSB7IGJyZWFrOyB9XG5cbiAgICAgIGNhbk9wZW4gPSBjYW5DbG9zZSA9IHRydWU7XG4gICAgICBwb3MgPSB0LmluZGV4ICsgMTtcbiAgICAgIGlzU2luZ2xlID0gKHRbMF0gPT09IFwiJ1wiKTtcblxuICAgICAgLy8gRmluZCBwcmV2aW91cyBjaGFyYWN0ZXIsXG4gICAgICAvLyBkZWZhdWx0IHRvIHNwYWNlIGlmIGl0J3MgdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZVxuICAgICAgLy9cbiAgICAgIGxhc3RDaGFyID0gMHgyMDtcblxuICAgICAgaWYgKHQuaW5kZXggLSAxID49IDApIHtcbiAgICAgICAgbGFzdENoYXIgPSB0ZXh0LmNoYXJDb2RlQXQodC5pbmRleCAtIDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gaSAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgaWYgKHRva2Vuc1tqXS50eXBlID09PSAnc29mdGJyZWFrJyB8fCB0b2tlbnNbal0udHlwZSA9PT0gJ2hhcmRicmVhaycpIGJyZWFrOyAvLyBsYXN0Q2hhciBkZWZhdWx0cyB0byAweDIwXG4gICAgICAgICAgaWYgKHRva2Vuc1tqXS50eXBlICE9PSAndGV4dCcpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgbGFzdENoYXIgPSB0b2tlbnNbal0uY29udGVudC5jaGFyQ29kZUF0KHRva2Vuc1tqXS5jb250ZW50Lmxlbmd0aCAtIDEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZpbmQgbmV4dCBjaGFyYWN0ZXIsXG4gICAgICAvLyBkZWZhdWx0IHRvIHNwYWNlIGlmIGl0J3MgdGhlIGVuZCBvZiB0aGUgbGluZVxuICAgICAgLy9cbiAgICAgIG5leHRDaGFyID0gMHgyMDtcblxuICAgICAgaWYgKHBvcyA8IG1heCkge1xuICAgICAgICBuZXh0Q2hhciA9IHRleHQuY2hhckNvZGVBdChwb3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChqID0gaSArIDE7IGogPCB0b2tlbnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAodG9rZW5zW2pdLnR5cGUgPT09ICdzb2Z0YnJlYWsnIHx8IHRva2Vuc1tqXS50eXBlID09PSAnaGFyZGJyZWFrJykgYnJlYWs7IC8vIG5leHRDaGFyIGRlZmF1bHRzIHRvIDB4MjBcbiAgICAgICAgICBpZiAodG9rZW5zW2pdLnR5cGUgIT09ICd0ZXh0JykgY29udGludWU7XG5cbiAgICAgICAgICBuZXh0Q2hhciA9IHRva2Vuc1tqXS5jb250ZW50LmNoYXJDb2RlQXQoMCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaXNMYXN0UHVuY3RDaGFyID0gaXNNZEFzY2lpUHVuY3QobGFzdENoYXIpIHx8IGlzUHVuY3RDaGFyKFN0cmluZy5mcm9tQ2hhckNvZGUobGFzdENoYXIpKTtcbiAgICAgIGlzTmV4dFB1bmN0Q2hhciA9IGlzTWRBc2NpaVB1bmN0KG5leHRDaGFyKSB8fCBpc1B1bmN0Q2hhcihTdHJpbmcuZnJvbUNoYXJDb2RlKG5leHRDaGFyKSk7XG5cbiAgICAgIGlzTGFzdFdoaXRlU3BhY2UgPSBpc1doaXRlU3BhY2UobGFzdENoYXIpO1xuICAgICAgaXNOZXh0V2hpdGVTcGFjZSA9IGlzV2hpdGVTcGFjZShuZXh0Q2hhcik7XG5cbiAgICAgIGlmIChpc05leHRXaGl0ZVNwYWNlKSB7XG4gICAgICAgIGNhbk9wZW4gPSBmYWxzZTtcbiAgICAgIH0gZWxzZSBpZiAoaXNOZXh0UHVuY3RDaGFyKSB7XG4gICAgICAgIGlmICghKGlzTGFzdFdoaXRlU3BhY2UgfHwgaXNMYXN0UHVuY3RDaGFyKSkge1xuICAgICAgICAgIGNhbk9wZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNMYXN0V2hpdGVTcGFjZSkge1xuICAgICAgICBjYW5DbG9zZSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIGlmIChpc0xhc3RQdW5jdENoYXIpIHtcbiAgICAgICAgaWYgKCEoaXNOZXh0V2hpdGVTcGFjZSB8fCBpc05leHRQdW5jdENoYXIpKSB7XG4gICAgICAgICAgY2FuQ2xvc2UgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobmV4dENoYXIgPT09IDB4MjIgLyogXCIgKi8gJiYgdFswXSA9PT0gJ1wiJykge1xuICAgICAgICBpZiAobGFzdENoYXIgPj0gMHgzMCAvKiAwICovICYmIGxhc3RDaGFyIDw9IDB4MzkgLyogOSAqLykge1xuICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZTogMVwiXCIgLSBjb3VudCBmaXJzdCBxdW90ZSBhcyBhbiBpbmNoXG4gICAgICAgICAgY2FuQ2xvc2UgPSBjYW5PcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNhbk9wZW4gJiYgY2FuQ2xvc2UpIHtcbiAgICAgICAgLy8gdHJlYXQgdGhpcyBhcyB0aGUgbWlkZGxlIG9mIHRoZSB3b3JkXG4gICAgICAgIGNhbk9wZW4gPSBmYWxzZTtcbiAgICAgICAgY2FuQ2xvc2UgPSBpc05leHRQdW5jdENoYXI7XG4gICAgICB9XG5cbiAgICAgIGlmICghY2FuT3BlbiAmJiAhY2FuQ2xvc2UpIHtcbiAgICAgICAgLy8gbWlkZGxlIG9mIHdvcmRcbiAgICAgICAgaWYgKGlzU2luZ2xlKSB7XG4gICAgICAgICAgdG9rZW4uY29udGVudCA9IHJlcGxhY2VBdCh0b2tlbi5jb250ZW50LCB0LmluZGV4LCBBUE9TVFJPUEhFKTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNhbkNsb3NlKSB7XG4gICAgICAgIC8vIHRoaXMgY291bGQgYmUgYSBjbG9zaW5nIHF1b3RlLCByZXdpbmQgdGhlIHN0YWNrIHRvIGdldCBhIG1hdGNoXG4gICAgICAgIGZvciAoaiA9IHN0YWNrLmxlbmd0aCAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgaXRlbSA9IHN0YWNrW2pdO1xuICAgICAgICAgIGlmIChzdGFja1tqXS5sZXZlbCA8IHRoaXNMZXZlbCkgeyBicmVhazsgfVxuICAgICAgICAgIGlmIChpdGVtLnNpbmdsZSA9PT0gaXNTaW5nbGUgJiYgc3RhY2tbal0ubGV2ZWwgPT09IHRoaXNMZXZlbCkge1xuICAgICAgICAgICAgaXRlbSA9IHN0YWNrW2pdO1xuXG4gICAgICAgICAgICBpZiAoaXNTaW5nbGUpIHtcbiAgICAgICAgICAgICAgb3BlblF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbMl07XG4gICAgICAgICAgICAgIGNsb3NlUXVvdGUgPSBzdGF0ZS5tZC5vcHRpb25zLnF1b3Rlc1szXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG9wZW5RdW90ZSA9IHN0YXRlLm1kLm9wdGlvbnMucXVvdGVzWzBdO1xuICAgICAgICAgICAgICBjbG9zZVF1b3RlID0gc3RhdGUubWQub3B0aW9ucy5xdW90ZXNbMV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlcGxhY2UgdG9rZW4uY29udGVudCAqYmVmb3JlKiB0b2tlbnNbaXRlbS50b2tlbl0uY29udGVudCxcbiAgICAgICAgICAgIC8vIGJlY2F1c2UsIGlmIHRoZXkgYXJlIHBvaW50aW5nIGF0IHRoZSBzYW1lIHRva2VuLCByZXBsYWNlQXRcbiAgICAgICAgICAgIC8vIGNvdWxkIG1lc3MgdXAgaW5kaWNlcyB3aGVuIHF1b3RlIGxlbmd0aCAhPSAxXG4gICAgICAgICAgICB0b2tlbi5jb250ZW50ID0gcmVwbGFjZUF0KHRva2VuLmNvbnRlbnQsIHQuaW5kZXgsIGNsb3NlUXVvdGUpO1xuICAgICAgICAgICAgdG9rZW5zW2l0ZW0udG9rZW5dLmNvbnRlbnQgPSByZXBsYWNlQXQoXG4gICAgICAgICAgICAgIHRva2Vuc1tpdGVtLnRva2VuXS5jb250ZW50LCBpdGVtLnBvcywgb3BlblF1b3RlKTtcblxuICAgICAgICAgICAgcG9zICs9IGNsb3NlUXVvdGUubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIGlmIChpdGVtLnRva2VuID09PSBpKSB7IHBvcyArPSBvcGVuUXVvdGUubGVuZ3RoIC0gMTsgfVxuXG4gICAgICAgICAgICB0ZXh0ID0gdG9rZW4uY29udGVudDtcbiAgICAgICAgICAgIG1heCA9IHRleHQubGVuZ3RoO1xuXG4gICAgICAgICAgICBzdGFjay5sZW5ndGggPSBqO1xuICAgICAgICAgICAgY29udGludWUgT1VURVI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjYW5PcGVuKSB7XG4gICAgICAgIHN0YWNrLnB1c2goe1xuICAgICAgICAgIHRva2VuOiBpLFxuICAgICAgICAgIHBvczogdC5pbmRleCxcbiAgICAgICAgICBzaW5nbGU6IGlzU2luZ2xlLFxuICAgICAgICAgIGxldmVsOiB0aGlzTGV2ZWxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKGNhbkNsb3NlICYmIGlzU2luZ2xlKSB7XG4gICAgICAgIHRva2VuLmNvbnRlbnQgPSByZXBsYWNlQXQodG9rZW4uY29udGVudCwgdC5pbmRleCwgQVBPU1RST1BIRSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBzbWFydHF1b3RlcyhzdGF0ZSkge1xuICAvKmVzbGludCBtYXgtZGVwdGg6MCovXG4gIHZhciBibGtJZHg7XG5cbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLnR5cG9ncmFwaGVyKSB7IHJldHVybjsgfVxuXG4gIGZvciAoYmxrSWR4ID0gc3RhdGUudG9rZW5zLmxlbmd0aCAtIDE7IGJsa0lkeCA+PSAwOyBibGtJZHgtLSkge1xuXG4gICAgaWYgKHN0YXRlLnRva2Vuc1tibGtJZHhdLnR5cGUgIT09ICdpbmxpbmUnIHx8XG4gICAgICAgICFRVU9URV9URVNUX1JFLnRlc3Qoc3RhdGUudG9rZW5zW2Jsa0lkeF0uY29udGVudCkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIHByb2Nlc3NfaW5saW5lcyhzdGF0ZS50b2tlbnNbYmxrSWR4XS5jaGlsZHJlbiwgc3RhdGUpO1xuICB9XG59O1xuIiwiLy8gQ29yZSBzdGF0ZSBvYmplY3Rcbi8vXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4uL3Rva2VuJyk7XG5cblxuZnVuY3Rpb24gU3RhdGVDb3JlKHNyYywgbWQsIGVudikge1xuICB0aGlzLnNyYyA9IHNyYztcbiAgdGhpcy5lbnYgPSBlbnY7XG4gIHRoaXMudG9rZW5zID0gW107XG4gIHRoaXMuaW5saW5lTW9kZSA9IGZhbHNlO1xuICB0aGlzLm1kID0gbWQ7IC8vIGxpbmsgdG8gcGFyc2VyIGluc3RhbmNlXG59XG5cbi8vIHJlLWV4cG9ydCBUb2tlbiBjbGFzcyB0byB1c2UgaW4gY29yZSBydWxlc1xuU3RhdGVDb3JlLnByb3RvdHlwZS5Ub2tlbiA9IFRva2VuO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGVDb3JlO1xuIiwiLy8gUHJvY2VzcyBhdXRvbGlua3MgJzxwcm90b2NvbDouLi4+J1xuXG4ndXNlIHN0cmljdCc7XG5cblxuLyplc2xpbnQgbWF4LWxlbjowKi9cbnZhciBFTUFJTF9SRSAgICA9IC9ePChbYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykqKT4vO1xudmFyIEFVVE9MSU5LX1JFID0gL148KFthLXpBLVpdW2EtekEtWjAtOSsuXFwtXXsxLDMxfSk6KFtePD5cXHgwMC1cXHgyMF0qKT4vO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYXV0b2xpbmsoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgdGFpbCwgbGlua01hdGNoLCBlbWFpbE1hdGNoLCB1cmwsIGZ1bGxVcmwsIHRva2VuLFxuICAgICAgcG9zID0gc3RhdGUucG9zO1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDNDLyogPCAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICB0YWlsID0gc3RhdGUuc3JjLnNsaWNlKHBvcyk7XG5cbiAgaWYgKHRhaWwuaW5kZXhPZignPicpIDwgMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoQVVUT0xJTktfUkUudGVzdCh0YWlsKSkge1xuICAgIGxpbmtNYXRjaCA9IHRhaWwubWF0Y2goQVVUT0xJTktfUkUpO1xuXG4gICAgdXJsID0gbGlua01hdGNoWzBdLnNsaWNlKDEsIC0xKTtcbiAgICBmdWxsVXJsID0gc3RhdGUubWQubm9ybWFsaXplTGluayh1cmwpO1xuICAgIGlmICghc3RhdGUubWQudmFsaWRhdGVMaW5rKGZ1bGxVcmwpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHRva2VuICAgICAgICAgPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpO1xuICAgICAgdG9rZW4uYXR0cnMgICA9IFsgWyAnaHJlZicsIGZ1bGxVcmwgXSBdO1xuICAgICAgdG9rZW4ubWFya3VwICA9ICdhdXRvbGluayc7XG4gICAgICB0b2tlbi5pbmZvICAgID0gJ2F1dG8nO1xuXG4gICAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKTtcbiAgICAgIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCh1cmwpO1xuXG4gICAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgnbGlua19jbG9zZScsICdhJywgLTEpO1xuICAgICAgdG9rZW4ubWFya3VwICA9ICdhdXRvbGluayc7XG4gICAgICB0b2tlbi5pbmZvICAgID0gJ2F1dG8nO1xuICAgIH1cblxuICAgIHN0YXRlLnBvcyArPSBsaW5rTWF0Y2hbMF0ubGVuZ3RoO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKEVNQUlMX1JFLnRlc3QodGFpbCkpIHtcbiAgICBlbWFpbE1hdGNoID0gdGFpbC5tYXRjaChFTUFJTF9SRSk7XG5cbiAgICB1cmwgPSBlbWFpbE1hdGNoWzBdLnNsaWNlKDEsIC0xKTtcbiAgICBmdWxsVXJsID0gc3RhdGUubWQubm9ybWFsaXplTGluaygnbWFpbHRvOicgKyB1cmwpO1xuICAgIGlmICghc3RhdGUubWQudmFsaWRhdGVMaW5rKGZ1bGxVcmwpKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgIHRva2VuICAgICAgICAgPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpO1xuICAgICAgdG9rZW4uYXR0cnMgICA9IFsgWyAnaHJlZicsIGZ1bGxVcmwgXSBdO1xuICAgICAgdG9rZW4ubWFya3VwICA9ICdhdXRvbGluayc7XG4gICAgICB0b2tlbi5pbmZvICAgID0gJ2F1dG8nO1xuXG4gICAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKTtcbiAgICAgIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rVGV4dCh1cmwpO1xuXG4gICAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgnbGlua19jbG9zZScsICdhJywgLTEpO1xuICAgICAgdG9rZW4ubWFya3VwICA9ICdhdXRvbGluayc7XG4gICAgICB0b2tlbi5pbmZvICAgID0gJ2F1dG8nO1xuICAgIH1cblxuICAgIHN0YXRlLnBvcyArPSBlbWFpbE1hdGNoWzBdLmxlbmd0aDtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG4iLCIvLyBQYXJzZSBiYWNrdGlja3NcblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGJhY2t0aWNrKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIHN0YXJ0LCBtYXgsIG1hcmtlciwgbWF0Y2hTdGFydCwgbWF0Y2hFbmQsIHRva2VuLFxuICAgICAgcG9zID0gc3RhdGUucG9zLFxuICAgICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuXG4gIGlmIChjaCAhPT0gMHg2MC8qIGAgKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgc3RhcnQgPSBwb3M7XG4gIHBvcysrO1xuICBtYXggPSBzdGF0ZS5wb3NNYXg7XG5cbiAgd2hpbGUgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDYwLyogYCAqLykgeyBwb3MrKzsgfVxuXG4gIG1hcmtlciA9IHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zKTtcblxuICBtYXRjaFN0YXJ0ID0gbWF0Y2hFbmQgPSBwb3M7XG5cbiAgd2hpbGUgKChtYXRjaFN0YXJ0ID0gc3RhdGUuc3JjLmluZGV4T2YoJ2AnLCBtYXRjaEVuZCkpICE9PSAtMSkge1xuICAgIG1hdGNoRW5kID0gbWF0Y2hTdGFydCArIDE7XG5cbiAgICB3aGlsZSAobWF0Y2hFbmQgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQobWF0Y2hFbmQpID09PSAweDYwLyogYCAqLykgeyBtYXRjaEVuZCsrOyB9XG5cbiAgICBpZiAobWF0Y2hFbmQgLSBtYXRjaFN0YXJ0ID09PSBtYXJrZXIubGVuZ3RoKSB7XG4gICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgnY29kZV9pbmxpbmUnLCAnY29kZScsIDApO1xuICAgICAgICB0b2tlbi5tYXJrdXAgID0gbWFya2VyO1xuICAgICAgICB0b2tlbi5jb250ZW50ID0gc3RhdGUuc3JjLnNsaWNlKHBvcywgbWF0Y2hTdGFydClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9bIFxcbl0rL2csICcgJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC50cmltKCk7XG4gICAgICB9XG4gICAgICBzdGF0ZS5wb3MgPSBtYXRjaEVuZDtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gbWFya2VyOyB9XG4gIHN0YXRlLnBvcyArPSBtYXJrZXIubGVuZ3RoO1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBGb3IgZWFjaCBvcGVuaW5nIGVtcGhhc2lzLWxpa2UgbWFya2VyIGZpbmQgYSBtYXRjaGluZyBjbG9zaW5nIG9uZVxuLy9cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGxpbmtfcGFpcnMoc3RhdGUpIHtcbiAgdmFyIGksIGosIGxhc3REZWxpbSwgY3VyckRlbGltLFxuICAgICAgZGVsaW1pdGVycyA9IHN0YXRlLmRlbGltaXRlcnMsXG4gICAgICBtYXggPSBzdGF0ZS5kZWxpbWl0ZXJzLmxlbmd0aDtcblxuICBmb3IgKGkgPSAwOyBpIDwgbWF4OyBpKyspIHtcbiAgICBsYXN0RGVsaW0gPSBkZWxpbWl0ZXJzW2ldO1xuXG4gICAgaWYgKCFsYXN0RGVsaW0uY2xvc2UpIHsgY29udGludWU7IH1cblxuICAgIGogPSBpIC0gbGFzdERlbGltLmp1bXAgLSAxO1xuXG4gICAgd2hpbGUgKGogPj0gMCkge1xuICAgICAgY3VyckRlbGltID0gZGVsaW1pdGVyc1tqXTtcblxuICAgICAgaWYgKGN1cnJEZWxpbS5vcGVuICYmXG4gICAgICAgICAgY3VyckRlbGltLm1hcmtlciA9PT0gbGFzdERlbGltLm1hcmtlciAmJlxuICAgICAgICAgIGN1cnJEZWxpbS5lbmQgPCAwICYmXG4gICAgICAgICAgY3VyckRlbGltLmxldmVsID09PSBsYXN0RGVsaW0ubGV2ZWwpIHtcblxuICAgICAgICAvLyB0eXBlb2ZzIGFyZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eSB3aXRoIHBsdWdpbnNcbiAgICAgICAgdmFyIG9kZF9tYXRjaCA9IChjdXJyRGVsaW0uY2xvc2UgfHwgbGFzdERlbGltLm9wZW4pICYmXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgY3VyckRlbGltLmxlbmd0aCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZiBsYXN0RGVsaW0ubGVuZ3RoICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKGN1cnJEZWxpbS5sZW5ndGggKyBsYXN0RGVsaW0ubGVuZ3RoKSAlIDMgPT09IDA7XG5cbiAgICAgICAgaWYgKCFvZGRfbWF0Y2gpIHtcbiAgICAgICAgICBsYXN0RGVsaW0uanVtcCA9IGkgLSBqO1xuICAgICAgICAgIGxhc3REZWxpbS5vcGVuID0gZmFsc2U7XG4gICAgICAgICAgY3VyckRlbGltLmVuZCAgPSBpO1xuICAgICAgICAgIGN1cnJEZWxpbS5qdW1wID0gMDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBqIC09IGN1cnJEZWxpbS5qdW1wICsgMTtcbiAgICB9XG4gIH1cbn07XG4iLCIvLyBQcm9jZXNzICp0aGlzKiBhbmQgX3RoYXRfXG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG5cbi8vIEluc2VydCBlYWNoIG1hcmtlciBhcyBhIHNlcGFyYXRlIHRleHQgdG9rZW4sIGFuZCBhZGQgaXQgdG8gZGVsaW1pdGVyIGxpc3Rcbi8vXG5tb2R1bGUuZXhwb3J0cy50b2tlbml6ZSA9IGZ1bmN0aW9uIGVtcGhhc2lzKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIGksIHNjYW5uZWQsIHRva2VuLFxuICAgICAgc3RhcnQgPSBzdGF0ZS5wb3MsXG4gICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCk7XG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAobWFya2VyICE9PSAweDVGIC8qIF8gKi8gJiYgbWFya2VyICE9PSAweDJBIC8qICogKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgc2Nhbm5lZCA9IHN0YXRlLnNjYW5EZWxpbXMoc3RhdGUucG9zLCBtYXJrZXIgPT09IDB4MkEpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBzY2FubmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ3RleHQnLCAnJywgMCk7XG4gICAgdG9rZW4uY29udGVudCA9IFN0cmluZy5mcm9tQ2hhckNvZGUobWFya2VyKTtcblxuICAgIHN0YXRlLmRlbGltaXRlcnMucHVzaCh7XG4gICAgICAvLyBDaGFyIGNvZGUgb2YgdGhlIHN0YXJ0aW5nIG1hcmtlciAobnVtYmVyKS5cbiAgICAgIC8vXG4gICAgICBtYXJrZXI6IG1hcmtlcixcblxuICAgICAgLy8gVG90YWwgbGVuZ3RoIG9mIHRoZXNlIHNlcmllcyBvZiBkZWxpbWl0ZXJzLlxuICAgICAgLy9cbiAgICAgIGxlbmd0aDogc2Nhbm5lZC5sZW5ndGgsXG5cbiAgICAgIC8vIEFuIGFtb3VudCBvZiBjaGFyYWN0ZXJzIGJlZm9yZSB0aGlzIG9uZSB0aGF0J3MgZXF1aXZhbGVudCB0b1xuICAgICAgLy8gY3VycmVudCBvbmUuIEluIHBsYWluIEVuZ2xpc2g6IGlmIHRoaXMgZGVsaW1pdGVyIGRvZXMgbm90IG9wZW5cbiAgICAgIC8vIGFuIGVtcGhhc2lzLCBuZWl0aGVyIGRvIHByZXZpb3VzIGBqdW1wYCBjaGFyYWN0ZXJzLlxuICAgICAgLy9cbiAgICAgIC8vIFVzZWQgdG8gc2tpcCBzZXF1ZW5jZXMgbGlrZSBcIioqKioqXCIgaW4gb25lIHN0ZXAsIGZvciAxc3QgYXN0ZXJpc2tcbiAgICAgIC8vIHZhbHVlIHdpbGwgYmUgMCwgZm9yIDJuZCBpdCdzIDEgYW5kIHNvIG9uLlxuICAgICAgLy9cbiAgICAgIGp1bXA6ICAgaSxcblxuICAgICAgLy8gQSBwb3NpdGlvbiBvZiB0aGUgdG9rZW4gdGhpcyBkZWxpbWl0ZXIgY29ycmVzcG9uZHMgdG8uXG4gICAgICAvL1xuICAgICAgdG9rZW46ICBzdGF0ZS50b2tlbnMubGVuZ3RoIC0gMSxcblxuICAgICAgLy8gVG9rZW4gbGV2ZWwuXG4gICAgICAvL1xuICAgICAgbGV2ZWw6ICBzdGF0ZS5sZXZlbCxcblxuICAgICAgLy8gSWYgdGhpcyBkZWxpbWl0ZXIgaXMgbWF0Y2hlZCBhcyBhIHZhbGlkIG9wZW5lciwgYGVuZGAgd2lsbCBiZVxuICAgICAgLy8gZXF1YWwgdG8gaXRzIHBvc2l0aW9uLCBvdGhlcndpc2UgaXQncyBgLTFgLlxuICAgICAgLy9cbiAgICAgIGVuZDogICAgLTEsXG5cbiAgICAgIC8vIEJvb2xlYW4gZmxhZ3MgdGhhdCBkZXRlcm1pbmUgaWYgdGhpcyBkZWxpbWl0ZXIgY291bGQgb3BlbiBvciBjbG9zZVxuICAgICAgLy8gYW4gZW1waGFzaXMuXG4gICAgICAvL1xuICAgICAgb3BlbjogICBzY2FubmVkLmNhbl9vcGVuLFxuICAgICAgY2xvc2U6ICBzY2FubmVkLmNhbl9jbG9zZVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGUucG9zICs9IHNjYW5uZWQubGVuZ3RoO1xuXG4gIHJldHVybiB0cnVlO1xufTtcblxuXG4vLyBXYWxrIHRocm91Z2ggZGVsaW1pdGVyIGxpc3QgYW5kIHJlcGxhY2UgdGV4dCB0b2tlbnMgd2l0aCB0YWdzXG4vL1xubW9kdWxlLmV4cG9ydHMucG9zdFByb2Nlc3MgPSBmdW5jdGlvbiBlbXBoYXNpcyhzdGF0ZSkge1xuICB2YXIgaSxcbiAgICAgIHN0YXJ0RGVsaW0sXG4gICAgICBlbmREZWxpbSxcbiAgICAgIHRva2VuLFxuICAgICAgY2gsXG4gICAgICBpc1N0cm9uZyxcbiAgICAgIGRlbGltaXRlcnMgPSBzdGF0ZS5kZWxpbWl0ZXJzLFxuICAgICAgbWF4ID0gc3RhdGUuZGVsaW1pdGVycy5sZW5ndGg7XG5cbiAgZm9yIChpID0gbWF4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBzdGFydERlbGltID0gZGVsaW1pdGVyc1tpXTtcblxuICAgIGlmIChzdGFydERlbGltLm1hcmtlciAhPT0gMHg1Ri8qIF8gKi8gJiYgc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4MkEvKiAqICovKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBQcm9jZXNzIG9ubHkgb3BlbmluZyBtYXJrZXJzXG4gICAgaWYgKHN0YXJ0RGVsaW0uZW5kID09PSAtMSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgZW5kRGVsaW0gPSBkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kXTtcblxuICAgIC8vIElmIHRoZSBwcmV2aW91cyBkZWxpbWl0ZXIgaGFzIHRoZSBzYW1lIG1hcmtlciBhbmQgaXMgYWRqYWNlbnQgdG8gdGhpcyBvbmUsXG4gICAgLy8gbWVyZ2UgdGhvc2UgaW50byBvbmUgc3Ryb25nIGRlbGltaXRlci5cbiAgICAvL1xuICAgIC8vIGA8ZW0+PGVtPndoYXRldmVyPC9lbT48L2VtPmAgLT4gYDxzdHJvbmc+d2hhdGV2ZXI8L3N0cm9uZz5gXG4gICAgLy9cbiAgICBpc1N0cm9uZyA9IGkgPiAwICYmXG4gICAgICAgICAgICAgICBkZWxpbWl0ZXJzW2kgLSAxXS5lbmQgPT09IHN0YXJ0RGVsaW0uZW5kICsgMSAmJlxuICAgICAgICAgICAgICAgZGVsaW1pdGVyc1tpIC0gMV0udG9rZW4gPT09IHN0YXJ0RGVsaW0udG9rZW4gLSAxICYmXG4gICAgICAgICAgICAgICBkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kICsgMV0udG9rZW4gPT09IGVuZERlbGltLnRva2VuICsgMSAmJlxuICAgICAgICAgICAgICAgZGVsaW1pdGVyc1tpIC0gMV0ubWFya2VyID09PSBzdGFydERlbGltLm1hcmtlcjtcblxuICAgIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShzdGFydERlbGltLm1hcmtlcik7XG5cbiAgICB0b2tlbiAgICAgICAgID0gc3RhdGUudG9rZW5zW3N0YXJ0RGVsaW0udG9rZW5dO1xuICAgIHRva2VuLnR5cGUgICAgPSBpc1N0cm9uZyA/ICdzdHJvbmdfb3BlbicgOiAnZW1fb3Blbic7XG4gICAgdG9rZW4udGFnICAgICA9IGlzU3Ryb25nID8gJ3N0cm9uZycgOiAnZW0nO1xuICAgIHRva2VuLm5lc3RpbmcgPSAxO1xuICAgIHRva2VuLm1hcmt1cCAgPSBpc1N0cm9uZyA/IGNoICsgY2ggOiBjaDtcbiAgICB0b2tlbi5jb250ZW50ID0gJyc7XG5cbiAgICB0b2tlbiAgICAgICAgID0gc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuXTtcbiAgICB0b2tlbi50eXBlICAgID0gaXNTdHJvbmcgPyAnc3Ryb25nX2Nsb3NlJyA6ICdlbV9jbG9zZSc7XG4gICAgdG9rZW4udGFnICAgICA9IGlzU3Ryb25nID8gJ3N0cm9uZycgOiAnZW0nO1xuICAgIHRva2VuLm5lc3RpbmcgPSAtMTtcbiAgICB0b2tlbi5tYXJrdXAgID0gaXNTdHJvbmcgPyBjaCArIGNoIDogY2g7XG4gICAgdG9rZW4uY29udGVudCA9ICcnO1xuXG4gICAgaWYgKGlzU3Ryb25nKSB7XG4gICAgICBzdGF0ZS50b2tlbnNbZGVsaW1pdGVyc1tpIC0gMV0udG9rZW5dLmNvbnRlbnQgPSAnJztcbiAgICAgIHN0YXRlLnRva2Vuc1tkZWxpbWl0ZXJzW3N0YXJ0RGVsaW0uZW5kICsgMV0udG9rZW5dLmNvbnRlbnQgPSAnJztcbiAgICAgIGktLTtcbiAgICB9XG4gIH1cbn07XG4iLCIvLyBQcm9jZXNzIGh0bWwgZW50aXR5IC0gJiMxMjM7LCAmI3hBRjssICZxdW90OywgLi4uXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGVudGl0aWVzICAgICAgICAgID0gcmVxdWlyZSgnLi4vY29tbW9uL2VudGl0aWVzJyk7XG52YXIgaGFzICAgICAgICAgICAgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5oYXM7XG52YXIgaXNWYWxpZEVudGl0eUNvZGUgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1ZhbGlkRW50aXR5Q29kZTtcbnZhciBmcm9tQ29kZVBvaW50ICAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmZyb21Db2RlUG9pbnQ7XG5cblxudmFyIERJR0lUQUxfUkUgPSAvXiYjKCg/OnhbYS1mMC05XXsxLDh9fFswLTldezEsOH0pKTsvaTtcbnZhciBOQU1FRF9SRSAgID0gL14mKFthLXpdW2EtejAtOV17MSwzMX0pOy9pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZW50aXR5KHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIGNoLCBjb2RlLCBtYXRjaCwgcG9zID0gc3RhdGUucG9zLCBtYXggPSBzdGF0ZS5wb3NNYXg7XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MjYvKiAmICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmIChwb3MgKyAxIDwgbWF4KSB7XG4gICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MgKyAxKTtcblxuICAgIGlmIChjaCA9PT0gMHgyMyAvKiAjICovKSB7XG4gICAgICBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLm1hdGNoKERJR0lUQUxfUkUpO1xuICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgICAgY29kZSA9IG1hdGNoWzFdWzBdLnRvTG93ZXJDYXNlKCkgPT09ICd4JyA/IHBhcnNlSW50KG1hdGNoWzFdLnNsaWNlKDEpLCAxNikgOiBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICAgIHN0YXRlLnBlbmRpbmcgKz0gaXNWYWxpZEVudGl0eUNvZGUoY29kZSkgPyBmcm9tQ29kZVBvaW50KGNvZGUpIDogZnJvbUNvZGVQb2ludCgweEZGRkQpO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBtYXRjaCA9IHN0YXRlLnNyYy5zbGljZShwb3MpLm1hdGNoKE5BTUVEX1JFKTtcbiAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICBpZiAoaGFzKGVudGl0aWVzLCBtYXRjaFsxXSkpIHtcbiAgICAgICAgICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IGVudGl0aWVzW21hdGNoWzFdXTsgfVxuICAgICAgICAgIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9ICcmJzsgfVxuICBzdGF0ZS5wb3MrKztcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2VzcyBlc2NhcGVkIGNoYXJzIGFuZCBoYXJkYnJlYWtzXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGlzU3BhY2UgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1NwYWNlO1xuXG52YXIgRVNDQVBFRCA9IFtdO1xuXG5mb3IgKHZhciBpID0gMDsgaSA8IDI1NjsgaSsrKSB7IEVTQ0FQRUQucHVzaCgwKTsgfVxuXG4nXFxcXCFcIiMkJSZcXCcoKSorLC4vOjs8PT4/QFtdXl9ge3x9fi0nXG4gIC5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAoY2gpIHsgRVNDQVBFRFtjaC5jaGFyQ29kZUF0KDApXSA9IDE7IH0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXNjYXBlKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIGNoLCBwb3MgPSBzdGF0ZS5wb3MsIG1heCA9IHN0YXRlLnBvc01heDtcblxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHg1Qy8qIFxcICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHBvcysrO1xuXG4gIGlmIChwb3MgPCBtYXgpIHtcbiAgICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG5cbiAgICBpZiAoY2ggPCAyNTYgJiYgRVNDQVBFRFtjaF0gIT09IDApIHtcbiAgICAgIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjW3Bvc107IH1cbiAgICAgIHN0YXRlLnBvcyArPSAyO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKGNoID09PSAweDBBKSB7XG4gICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICBzdGF0ZS5wdXNoKCdoYXJkYnJlYWsnLCAnYnInLCAwKTtcbiAgICAgIH1cblxuICAgICAgcG9zKys7XG4gICAgICAvLyBza2lwIGxlYWRpbmcgd2hpdGVzcGFjZXMgZnJvbSBuZXh0IGxpbmVcbiAgICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgICAgY2ggPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICBpZiAoIWlzU3BhY2UoY2gpKSB7IGJyZWFrOyB9XG4gICAgICAgIHBvcysrO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5wb3MgPSBwb3M7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9ICdcXFxcJzsgfVxuICBzdGF0ZS5wb3MrKztcbiAgcmV0dXJuIHRydWU7XG59O1xuIiwiLy8gUHJvY2VzcyBodG1sIHRhZ3NcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBIVE1MX1RBR19SRSA9IHJlcXVpcmUoJy4uL2NvbW1vbi9odG1sX3JlJykuSFRNTF9UQUdfUkU7XG5cblxuZnVuY3Rpb24gaXNMZXR0ZXIoY2gpIHtcbiAgLyplc2xpbnQgbm8tYml0d2lzZTowKi9cbiAgdmFyIGxjID0gY2ggfCAweDIwOyAvLyB0byBsb3dlciBjYXNlXG4gIHJldHVybiAobGMgPj0gMHg2MS8qIGEgKi8pICYmIChsYyA8PSAweDdhLyogeiAqLyk7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBodG1sX2lubGluZShzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBjaCwgbWF0Y2gsIG1heCwgdG9rZW4sXG4gICAgICBwb3MgPSBzdGF0ZS5wb3M7XG5cbiAgaWYgKCFzdGF0ZS5tZC5vcHRpb25zLmh0bWwpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gQ2hlY2sgc3RhcnRcbiAgbWF4ID0gc3RhdGUucG9zTWF4O1xuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSAhPT0gMHgzQy8qIDwgKi8gfHxcbiAgICAgIHBvcyArIDIgPj0gbWF4KSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gUXVpY2sgZmFpbCBvbiBzZWNvbmQgY2hhclxuICBjaCA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyArIDEpO1xuICBpZiAoY2ggIT09IDB4MjEvKiAhICovICYmXG4gICAgICBjaCAhPT0gMHgzRi8qID8gKi8gJiZcbiAgICAgIGNoICE9PSAweDJGLyogLyAqLyAmJlxuICAgICAgIWlzTGV0dGVyKGNoKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIG1hdGNoID0gc3RhdGUuc3JjLnNsaWNlKHBvcykubWF0Y2goSFRNTF9UQUdfUkUpO1xuICBpZiAoIW1hdGNoKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGlmICghc2lsZW50KSB7XG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnB1c2goJ2h0bWxfaW5saW5lJywgJycsIDApO1xuICAgIHRva2VuLmNvbnRlbnQgPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBwb3MgKyBtYXRjaFswXS5sZW5ndGgpO1xuICB9XG4gIHN0YXRlLnBvcyArPSBtYXRjaFswXS5sZW5ndGg7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgIVtpbWFnZV0oPHNyYz4gXCJ0aXRsZVwiKVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBub3JtYWxpemVSZWZlcmVuY2UgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLm5vcm1hbGl6ZVJlZmVyZW5jZTtcbnZhciBpc1NwYWNlICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbWFnZShzdGF0ZSwgc2lsZW50KSB7XG4gIHZhciBhdHRycyxcbiAgICAgIGNvZGUsXG4gICAgICBjb250ZW50LFxuICAgICAgbGFiZWwsXG4gICAgICBsYWJlbEVuZCxcbiAgICAgIGxhYmVsU3RhcnQsXG4gICAgICBwb3MsXG4gICAgICByZWYsXG4gICAgICByZXMsXG4gICAgICB0aXRsZSxcbiAgICAgIHRva2VuLFxuICAgICAgdG9rZW5zLFxuICAgICAgc3RhcnQsXG4gICAgICBocmVmID0gJycsXG4gICAgICBvbGRQb3MgPSBzdGF0ZS5wb3MsXG4gICAgICBtYXggPSBzdGF0ZS5wb3NNYXg7XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcykgIT09IDB4MjEvKiAhICovKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zICsgMSkgIT09IDB4NUIvKiBbICovKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIGxhYmVsU3RhcnQgPSBzdGF0ZS5wb3MgKyAyO1xuICBsYWJlbEVuZCA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rTGFiZWwoc3RhdGUsIHN0YXRlLnBvcyArIDEsIGZhbHNlKTtcblxuICAvLyBwYXJzZXIgZmFpbGVkIHRvIGZpbmQgJ10nLCBzbyBpdCdzIG5vdCBhIHZhbGlkIGxpbmtcbiAgaWYgKGxhYmVsRW5kIDwgMCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBwb3MgPSBsYWJlbEVuZCArIDE7XG4gIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHgyOC8qICggKi8pIHtcbiAgICAvL1xuICAgIC8vIElubGluZSBsaW5rXG4gICAgLy9cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHBvcysrO1xuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrOyB9XG4gICAgfVxuICAgIGlmIChwb3MgPj0gbWF4KSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICBeXl5eXl4gcGFyc2luZyBsaW5rIGRlc3RpbmF0aW9uXG4gICAgc3RhcnQgPSBwb3M7XG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtEZXN0aW5hdGlvbihzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KTtcbiAgICBpZiAocmVzLm9rKSB7XG4gICAgICBocmVmID0gc3RhdGUubWQubm9ybWFsaXplTGluayhyZXMuc3RyKTtcbiAgICAgIGlmIChzdGF0ZS5tZC52YWxpZGF0ZUxpbmsoaHJlZikpIHtcbiAgICAgICAgcG9zID0gcmVzLnBvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhyZWYgPSAnJztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgICAgICAgIF5eIHNraXBwaW5nIHRoZXNlIHNwYWNlc1xuICAgIHN0YXJ0ID0gcG9zO1xuICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgIGlmICghaXNTcGFjZShjb2RlKSAmJiBjb2RlICE9PSAweDBBKSB7IGJyZWFrOyB9XG4gICAgfVxuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgICAgICAgICAgIF5eXl5eXl4gcGFyc2luZyBsaW5rIHRpdGxlXG4gICAgcmVzID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtUaXRsZShzdGF0ZS5zcmMsIHBvcywgc3RhdGUucG9zTWF4KTtcbiAgICBpZiAocG9zIDwgbWF4ICYmIHN0YXJ0ICE9PSBwb3MgJiYgcmVzLm9rKSB7XG4gICAgICB0aXRsZSA9IHJlcy5zdHI7XG4gICAgICBwb3MgPSByZXMucG9zO1xuXG4gICAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgICBmb3IgKDsgcG9zIDwgbWF4OyBwb3MrKykge1xuICAgICAgICBjb2RlID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGl0bGUgPSAnJztcbiAgICB9XG5cbiAgICBpZiAocG9zID49IG1heCB8fCBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpICE9PSAweDI5LyogKSAqLykge1xuICAgICAgc3RhdGUucG9zID0gb2xkUG9zO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBwb3MrKztcbiAgfSBlbHNlIHtcbiAgICAvL1xuICAgIC8vIExpbmsgcmVmZXJlbmNlXG4gICAgLy9cbiAgICBpZiAodHlwZW9mIHN0YXRlLmVudi5yZWZlcmVuY2VzID09PSAndW5kZWZpbmVkJykgeyByZXR1cm4gZmFsc2U7IH1cblxuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg1Qi8qIFsgKi8pIHtcbiAgICAgIHN0YXJ0ID0gcG9zICsgMTtcbiAgICAgIHBvcyA9IHN0YXRlLm1kLmhlbHBlcnMucGFyc2VMaW5rTGFiZWwoc3RhdGUsIHBvcyk7XG4gICAgICBpZiAocG9zID49IDApIHtcbiAgICAgICAgbGFiZWwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcysrKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvcyA9IGxhYmVsRW5kICsgMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcG9zID0gbGFiZWxFbmQgKyAxO1xuICAgIH1cblxuICAgIC8vIGNvdmVycyBsYWJlbCA9PT0gJycgYW5kIGxhYmVsID09PSB1bmRlZmluZWRcbiAgICAvLyAoY29sbGFwc2VkIHJlZmVyZW5jZSBsaW5rIGFuZCBzaG9ydGN1dCByZWZlcmVuY2UgbGluayByZXNwZWN0aXZlbHkpXG4gICAgaWYgKCFsYWJlbCkgeyBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShsYWJlbFN0YXJ0LCBsYWJlbEVuZCk7IH1cblxuICAgIHJlZiA9IHN0YXRlLmVudi5yZWZlcmVuY2VzW25vcm1hbGl6ZVJlZmVyZW5jZShsYWJlbCldO1xuICAgIGlmICghcmVmKSB7XG4gICAgICBzdGF0ZS5wb3MgPSBvbGRQb3M7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGhyZWYgPSByZWYuaHJlZjtcbiAgICB0aXRsZSA9IHJlZi50aXRsZTtcbiAgfVxuXG4gIC8vXG4gIC8vIFdlIGZvdW5kIHRoZSBlbmQgb2YgdGhlIGxpbmssIGFuZCBrbm93IGZvciBhIGZhY3QgaXQncyBhIHZhbGlkIGxpbms7XG4gIC8vIHNvIGFsbCB0aGF0J3MgbGVmdCB0byBkbyBpcyB0byBjYWxsIHRva2VuaXplci5cbiAgLy9cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBjb250ZW50ID0gc3RhdGUuc3JjLnNsaWNlKGxhYmVsU3RhcnQsIGxhYmVsRW5kKTtcblxuICAgIHN0YXRlLm1kLmlubGluZS5wYXJzZShcbiAgICAgIGNvbnRlbnQsXG4gICAgICBzdGF0ZS5tZCxcbiAgICAgIHN0YXRlLmVudixcbiAgICAgIHRva2VucyA9IFtdXG4gICAgKTtcblxuICAgIHRva2VuICAgICAgICAgID0gc3RhdGUucHVzaCgnaW1hZ2UnLCAnaW1nJywgMCk7XG4gICAgdG9rZW4uYXR0cnMgICAgPSBhdHRycyA9IFsgWyAnc3JjJywgaHJlZiBdLCBbICdhbHQnLCAnJyBdIF07XG4gICAgdG9rZW4uY2hpbGRyZW4gPSB0b2tlbnM7XG4gICAgdG9rZW4uY29udGVudCAgPSBjb250ZW50O1xuXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBhdHRycy5wdXNoKFsgJ3RpdGxlJywgdGl0bGUgXSk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGUucG9zID0gcG9zO1xuICBzdGF0ZS5wb3NNYXggPSBtYXg7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIFByb2Nlc3MgW2xpbmtdKDx0bz4gXCJzdHVmZlwiKVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBub3JtYWxpemVSZWZlcmVuY2UgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLm5vcm1hbGl6ZVJlZmVyZW5jZTtcbnZhciBpc1NwYWNlICAgICAgICAgICAgICA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzU3BhY2U7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBsaW5rKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIGF0dHJzLFxuICAgICAgY29kZSxcbiAgICAgIGxhYmVsLFxuICAgICAgbGFiZWxFbmQsXG4gICAgICBsYWJlbFN0YXJ0LFxuICAgICAgcG9zLFxuICAgICAgcmVzLFxuICAgICAgcmVmLFxuICAgICAgdGl0bGUsXG4gICAgICB0b2tlbixcbiAgICAgIGhyZWYgPSAnJyxcbiAgICAgIG9sZFBvcyA9IHN0YXRlLnBvcyxcbiAgICAgIG1heCA9IHN0YXRlLnBvc01heCxcbiAgICAgIHN0YXJ0ID0gc3RhdGUucG9zLFxuICAgICAgcGFyc2VSZWZlcmVuY2UgPSB0cnVlO1xuXG4gIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGF0ZS5wb3MpICE9PSAweDVCLyogWyAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBsYWJlbFN0YXJ0ID0gc3RhdGUucG9zICsgMTtcbiAgbGFiZWxFbmQgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0xhYmVsKHN0YXRlLCBzdGF0ZS5wb3MsIHRydWUpO1xuXG4gIC8vIHBhcnNlciBmYWlsZWQgdG8gZmluZCAnXScsIHNvIGl0J3Mgbm90IGEgdmFsaWQgbGlua1xuICBpZiAobGFiZWxFbmQgPCAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gIHBvcyA9IGxhYmVsRW5kICsgMTtcbiAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDI4LyogKCAqLykge1xuICAgIC8vXG4gICAgLy8gSW5saW5lIGxpbmtcbiAgICAvL1xuXG4gICAgLy8gbWlnaHQgaGF2ZSBmb3VuZCBhIHZhbGlkIHNob3J0Y3V0IGxpbmssIGRpc2FibGUgcmVmZXJlbmNlIHBhcnNpbmdcbiAgICBwYXJzZVJlZmVyZW5jZSA9IGZhbHNlO1xuXG4gICAgLy8gW2xpbmtdKCAgPGhyZWY+ICBcInRpdGxlXCIgIClcbiAgICAvLyAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgcG9zKys7XG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgICB9XG4gICAgaWYgKHBvcyA+PSBtYXgpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgIF5eXl5eXiBwYXJzaW5nIGxpbmsgZGVzdGluYXRpb25cbiAgICBzdGFydCA9IHBvcztcbiAgICByZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua0Rlc3RpbmF0aW9uKHN0YXRlLnNyYywgcG9zLCBzdGF0ZS5wb3NNYXgpO1xuICAgIGlmIChyZXMub2spIHtcbiAgICAgIGhyZWYgPSBzdGF0ZS5tZC5ub3JtYWxpemVMaW5rKHJlcy5zdHIpO1xuICAgICAgaWYgKHN0YXRlLm1kLnZhbGlkYXRlTGluayhocmVmKSkge1xuICAgICAgICBwb3MgPSByZXMucG9zO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaHJlZiA9ICcnO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgLy8gICAgICAgICAgICAgICAgXl4gc2tpcHBpbmcgdGhlc2Ugc3BhY2VzXG4gICAgc3RhcnQgPSBwb3M7XG4gICAgZm9yICg7IHBvcyA8IG1heDsgcG9zKyspIHtcbiAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgaWYgKCFpc1NwYWNlKGNvZGUpICYmIGNvZGUgIT09IDB4MEEpIHsgYnJlYWs7IH1cbiAgICB9XG5cbiAgICAvLyBbbGlua10oICA8aHJlZj4gIFwidGl0bGVcIiAgKVxuICAgIC8vICAgICAgICAgICAgICAgICAgXl5eXl5eXiBwYXJzaW5nIGxpbmsgdGl0bGVcbiAgICByZXMgPSBzdGF0ZS5tZC5oZWxwZXJzLnBhcnNlTGlua1RpdGxlKHN0YXRlLnNyYywgcG9zLCBzdGF0ZS5wb3NNYXgpO1xuICAgIGlmIChwb3MgPCBtYXggJiYgc3RhcnQgIT09IHBvcyAmJiByZXMub2spIHtcbiAgICAgIHRpdGxlID0gcmVzLnN0cjtcbiAgICAgIHBvcyA9IHJlcy5wb3M7XG5cbiAgICAgIC8vIFtsaW5rXSggIDxocmVmPiAgXCJ0aXRsZVwiICApXG4gICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBeXiBza2lwcGluZyB0aGVzZSBzcGFjZXNcbiAgICAgIGZvciAoOyBwb3MgPCBtYXg7IHBvcysrKSB7XG4gICAgICAgIGNvZGUgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICBpZiAoIWlzU3BhY2UoY29kZSkgJiYgY29kZSAhPT0gMHgwQSkgeyBicmVhazsgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aXRsZSA9ICcnO1xuICAgIH1cblxuICAgIGlmIChwb3MgPj0gbWF4IHx8IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MjkvKiApICovKSB7XG4gICAgICAvLyBwYXJzaW5nIGEgdmFsaWQgc2hvcnRjdXQgbGluayBmYWlsZWQsIGZhbGxiYWNrIHRvIHJlZmVyZW5jZVxuICAgICAgcGFyc2VSZWZlcmVuY2UgPSB0cnVlO1xuICAgIH1cbiAgICBwb3MrKztcbiAgfVxuXG4gIGlmIChwYXJzZVJlZmVyZW5jZSkge1xuICAgIC8vXG4gICAgLy8gTGluayByZWZlcmVuY2VcbiAgICAvL1xuICAgIGlmICh0eXBlb2Ygc3RhdGUuZW52LnJlZmVyZW5jZXMgPT09ICd1bmRlZmluZWQnKSB7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgaWYgKHBvcyA8IG1heCAmJiBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDVCLyogWyAqLykge1xuICAgICAgc3RhcnQgPSBwb3MgKyAxO1xuICAgICAgcG9zID0gc3RhdGUubWQuaGVscGVycy5wYXJzZUxpbmtMYWJlbChzdGF0ZSwgcG9zKTtcbiAgICAgIGlmIChwb3MgPj0gMCkge1xuICAgICAgICBsYWJlbCA9IHN0YXRlLnNyYy5zbGljZShzdGFydCwgcG9zKyspO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9zID0gbGFiZWxFbmQgKyAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwb3MgPSBsYWJlbEVuZCArIDE7XG4gICAgfVxuXG4gICAgLy8gY292ZXJzIGxhYmVsID09PSAnJyBhbmQgbGFiZWwgPT09IHVuZGVmaW5lZFxuICAgIC8vIChjb2xsYXBzZWQgcmVmZXJlbmNlIGxpbmsgYW5kIHNob3J0Y3V0IHJlZmVyZW5jZSBsaW5rIHJlc3BlY3RpdmVseSlcbiAgICBpZiAoIWxhYmVsKSB7IGxhYmVsID0gc3RhdGUuc3JjLnNsaWNlKGxhYmVsU3RhcnQsIGxhYmVsRW5kKTsgfVxuXG4gICAgcmVmID0gc3RhdGUuZW52LnJlZmVyZW5jZXNbbm9ybWFsaXplUmVmZXJlbmNlKGxhYmVsKV07XG4gICAgaWYgKCFyZWYpIHtcbiAgICAgIHN0YXRlLnBvcyA9IG9sZFBvcztcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaHJlZiA9IHJlZi5ocmVmO1xuICAgIHRpdGxlID0gcmVmLnRpdGxlO1xuICB9XG5cbiAgLy9cbiAgLy8gV2UgZm91bmQgdGhlIGVuZCBvZiB0aGUgbGluaywgYW5kIGtub3cgZm9yIGEgZmFjdCBpdCdzIGEgdmFsaWQgbGluaztcbiAgLy8gc28gYWxsIHRoYXQncyBsZWZ0IHRvIGRvIGlzIHRvIGNhbGwgdG9rZW5pemVyLlxuICAvL1xuICBpZiAoIXNpbGVudCkge1xuICAgIHN0YXRlLnBvcyA9IGxhYmVsU3RhcnQ7XG4gICAgc3RhdGUucG9zTWF4ID0gbGFiZWxFbmQ7XG5cbiAgICB0b2tlbiAgICAgICAgPSBzdGF0ZS5wdXNoKCdsaW5rX29wZW4nLCAnYScsIDEpO1xuICAgIHRva2VuLmF0dHJzICA9IGF0dHJzID0gWyBbICdocmVmJywgaHJlZiBdIF07XG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICBhdHRycy5wdXNoKFsgJ3RpdGxlJywgdGl0bGUgXSk7XG4gICAgfVxuXG4gICAgc3RhdGUubWQuaW5saW5lLnRva2VuaXplKHN0YXRlKTtcblxuICAgIHRva2VuICAgICAgICA9IHN0YXRlLnB1c2goJ2xpbmtfY2xvc2UnLCAnYScsIC0xKTtcbiAgfVxuXG4gIHN0YXRlLnBvcyA9IHBvcztcbiAgc3RhdGUucG9zTWF4ID0gbWF4O1xuICByZXR1cm4gdHJ1ZTtcbn07XG4iLCIvLyBQcm9jZWVzcyAnXFxuJ1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBpc1NwYWNlID0gcmVxdWlyZSgnLi4vY29tbW9uL3V0aWxzJykuaXNTcGFjZTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5ld2xpbmUoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgcG1heCwgbWF4LCBwb3MgPSBzdGF0ZS5wb3M7XG5cbiAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgIT09IDB4MEEvKiBcXG4gKi8pIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgcG1heCA9IHN0YXRlLnBlbmRpbmcubGVuZ3RoIC0gMTtcbiAgbWF4ID0gc3RhdGUucG9zTWF4O1xuXG4gIC8vICcgIFxcbicgLT4gaGFyZGJyZWFrXG4gIC8vIExvb2t1cCBpbiBwZW5kaW5nIGNoYXJzIGlzIGJhZCBwcmFjdGljZSEgRG9uJ3QgY29weSB0byBvdGhlciBydWxlcyFcbiAgLy8gUGVuZGluZyBzdHJpbmcgaXMgc3RvcmVkIGluIGNvbmNhdCBtb2RlLCBpbmRleGVkIGxvb2t1cHMgd2lsbCBjYXVzZVxuICAvLyBjb252ZXJ0aW9uIHRvIGZsYXQgbW9kZS5cbiAgaWYgKCFzaWxlbnQpIHtcbiAgICBpZiAocG1heCA+PSAwICYmIHN0YXRlLnBlbmRpbmcuY2hhckNvZGVBdChwbWF4KSA9PT0gMHgyMCkge1xuICAgICAgaWYgKHBtYXggPj0gMSAmJiBzdGF0ZS5wZW5kaW5nLmNoYXJDb2RlQXQocG1heCAtIDEpID09PSAweDIwKSB7XG4gICAgICAgIHN0YXRlLnBlbmRpbmcgPSBzdGF0ZS5wZW5kaW5nLnJlcGxhY2UoLyArJC8sICcnKTtcbiAgICAgICAgc3RhdGUucHVzaCgnaGFyZGJyZWFrJywgJ2JyJywgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5wZW5kaW5nID0gc3RhdGUucGVuZGluZy5zbGljZSgwLCAtMSk7XG4gICAgICAgIHN0YXRlLnB1c2goJ3NvZnRicmVhaycsICdicicsIDApO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlLnB1c2goJ3NvZnRicmVhaycsICdicicsIDApO1xuICAgIH1cbiAgfVxuXG4gIHBvcysrO1xuXG4gIC8vIHNraXAgaGVhZGluZyBzcGFjZXMgZm9yIG5leHQgbGluZVxuICB3aGlsZSAocG9zIDwgbWF4ICYmIGlzU3BhY2Uoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSkpIHsgcG9zKys7IH1cblxuICBzdGF0ZS5wb3MgPSBwb3M7XG4gIHJldHVybiB0cnVlO1xufTtcbiIsIi8vIElubGluZSBwYXJzZXIgc3RhdGVcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBUb2tlbiAgICAgICAgICA9IHJlcXVpcmUoJy4uL3Rva2VuJyk7XG52YXIgaXNXaGl0ZVNwYWNlICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1doaXRlU3BhY2U7XG52YXIgaXNQdW5jdENoYXIgICAgPSByZXF1aXJlKCcuLi9jb21tb24vdXRpbHMnKS5pc1B1bmN0Q2hhcjtcbnZhciBpc01kQXNjaWlQdW5jdCA9IHJlcXVpcmUoJy4uL2NvbW1vbi91dGlscycpLmlzTWRBc2NpaVB1bmN0O1xuXG5cbmZ1bmN0aW9uIFN0YXRlSW5saW5lKHNyYywgbWQsIGVudiwgb3V0VG9rZW5zKSB7XG4gIHRoaXMuc3JjID0gc3JjO1xuICB0aGlzLmVudiA9IGVudjtcbiAgdGhpcy5tZCA9IG1kO1xuICB0aGlzLnRva2VucyA9IG91dFRva2VucztcblxuICB0aGlzLnBvcyA9IDA7XG4gIHRoaXMucG9zTWF4ID0gdGhpcy5zcmMubGVuZ3RoO1xuICB0aGlzLmxldmVsID0gMDtcbiAgdGhpcy5wZW5kaW5nID0gJyc7XG4gIHRoaXMucGVuZGluZ0xldmVsID0gMDtcblxuICB0aGlzLmNhY2hlID0ge307ICAgICAgICAvLyBTdG9yZXMgeyBzdGFydDogZW5kIH0gcGFpcnMuIFVzZWZ1bCBmb3IgYmFja3RyYWNrXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9wdGltaXphdGlvbiBvZiBwYWlycyBwYXJzZSAoZW1waGFzaXMsIHN0cmlrZXMpLlxuXG4gIHRoaXMuZGVsaW1pdGVycyA9IFtdOyAgIC8vIEVtcGhhc2lzLWxpa2UgZGVsaW1pdGVyc1xufVxuXG5cbi8vIEZsdXNoIHBlbmRpbmcgdGV4dFxuLy9cblN0YXRlSW5saW5lLnByb3RvdHlwZS5wdXNoUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRva2VuID0gbmV3IFRva2VuKCd0ZXh0JywgJycsIDApO1xuICB0b2tlbi5jb250ZW50ID0gdGhpcy5wZW5kaW5nO1xuICB0b2tlbi5sZXZlbCA9IHRoaXMucGVuZGluZ0xldmVsO1xuICB0aGlzLnRva2Vucy5wdXNoKHRva2VuKTtcbiAgdGhpcy5wZW5kaW5nID0gJyc7XG4gIHJldHVybiB0b2tlbjtcbn07XG5cblxuLy8gUHVzaCBuZXcgdG9rZW4gdG8gXCJzdHJlYW1cIi5cbi8vIElmIHBlbmRpbmcgdGV4dCBleGlzdHMgLSBmbHVzaCBpdCBhcyB0ZXh0IHRva2VuXG4vL1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbiAodHlwZSwgdGFnLCBuZXN0aW5nKSB7XG4gIGlmICh0aGlzLnBlbmRpbmcpIHtcbiAgICB0aGlzLnB1c2hQZW5kaW5nKCk7XG4gIH1cblxuICB2YXIgdG9rZW4gPSBuZXcgVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKTtcblxuICBpZiAobmVzdGluZyA8IDApIHsgdGhpcy5sZXZlbC0tOyB9XG4gIHRva2VuLmxldmVsID0gdGhpcy5sZXZlbDtcbiAgaWYgKG5lc3RpbmcgPiAwKSB7IHRoaXMubGV2ZWwrKzsgfVxuXG4gIHRoaXMucGVuZGluZ0xldmVsID0gdGhpcy5sZXZlbDtcbiAgdGhpcy50b2tlbnMucHVzaCh0b2tlbik7XG4gIHJldHVybiB0b2tlbjtcbn07XG5cblxuLy8gU2NhbiBhIHNlcXVlbmNlIG9mIGVtcGhhc2lzLWxpa2UgbWFya2VycywgYW5kIGRldGVybWluZSB3aGV0aGVyXG4vLyBpdCBjYW4gc3RhcnQgYW4gZW1waGFzaXMgc2VxdWVuY2Ugb3IgZW5kIGFuIGVtcGhhc2lzIHNlcXVlbmNlLlxuLy9cbi8vICAtIHN0YXJ0IC0gcG9zaXRpb24gdG8gc2NhbiBmcm9tIChpdCBzaG91bGQgcG9pbnQgYXQgYSB2YWxpZCBtYXJrZXIpO1xuLy8gIC0gY2FuU3BsaXRXb3JkIC0gZGV0ZXJtaW5lIGlmIHRoZXNlIG1hcmtlcnMgY2FuIGJlIGZvdW5kIGluc2lkZSBhIHdvcmRcbi8vXG5TdGF0ZUlubGluZS5wcm90b3R5cGUuc2NhbkRlbGltcyA9IGZ1bmN0aW9uIChzdGFydCwgY2FuU3BsaXRXb3JkKSB7XG4gIHZhciBwb3MgPSBzdGFydCwgbGFzdENoYXIsIG5leHRDaGFyLCBjb3VudCwgY2FuX29wZW4sIGNhbl9jbG9zZSxcbiAgICAgIGlzTGFzdFdoaXRlU3BhY2UsIGlzTGFzdFB1bmN0Q2hhcixcbiAgICAgIGlzTmV4dFdoaXRlU3BhY2UsIGlzTmV4dFB1bmN0Q2hhcixcbiAgICAgIGxlZnRfZmxhbmtpbmcgPSB0cnVlLFxuICAgICAgcmlnaHRfZmxhbmtpbmcgPSB0cnVlLFxuICAgICAgbWF4ID0gdGhpcy5wb3NNYXgsXG4gICAgICBtYXJrZXIgPSB0aGlzLnNyYy5jaGFyQ29kZUF0KHN0YXJ0KTtcblxuICAvLyB0cmVhdCBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgYXMgYSB3aGl0ZXNwYWNlXG4gIGxhc3RDaGFyID0gc3RhcnQgPiAwID8gdGhpcy5zcmMuY2hhckNvZGVBdChzdGFydCAtIDEpIDogMHgyMDtcblxuICB3aGlsZSAocG9zIDwgbWF4ICYmIHRoaXMuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gbWFya2VyKSB7IHBvcysrOyB9XG5cbiAgY291bnQgPSBwb3MgLSBzdGFydDtcblxuICAvLyB0cmVhdCBlbmQgb2YgdGhlIGxpbmUgYXMgYSB3aGl0ZXNwYWNlXG4gIG5leHRDaGFyID0gcG9zIDwgbWF4ID8gdGhpcy5zcmMuY2hhckNvZGVBdChwb3MpIDogMHgyMDtcblxuICBpc0xhc3RQdW5jdENoYXIgPSBpc01kQXNjaWlQdW5jdChsYXN0Q2hhcikgfHwgaXNQdW5jdENoYXIoU3RyaW5nLmZyb21DaGFyQ29kZShsYXN0Q2hhcikpO1xuICBpc05leHRQdW5jdENoYXIgPSBpc01kQXNjaWlQdW5jdChuZXh0Q2hhcikgfHwgaXNQdW5jdENoYXIoU3RyaW5nLmZyb21DaGFyQ29kZShuZXh0Q2hhcikpO1xuXG4gIGlzTGFzdFdoaXRlU3BhY2UgPSBpc1doaXRlU3BhY2UobGFzdENoYXIpO1xuICBpc05leHRXaGl0ZVNwYWNlID0gaXNXaGl0ZVNwYWNlKG5leHRDaGFyKTtcblxuICBpZiAoaXNOZXh0V2hpdGVTcGFjZSkge1xuICAgIGxlZnRfZmxhbmtpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChpc05leHRQdW5jdENoYXIpIHtcbiAgICBpZiAoIShpc0xhc3RXaGl0ZVNwYWNlIHx8IGlzTGFzdFB1bmN0Q2hhcikpIHtcbiAgICAgIGxlZnRfZmxhbmtpbmcgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoaXNMYXN0V2hpdGVTcGFjZSkge1xuICAgIHJpZ2h0X2ZsYW5raW5nID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoaXNMYXN0UHVuY3RDaGFyKSB7XG4gICAgaWYgKCEoaXNOZXh0V2hpdGVTcGFjZSB8fCBpc05leHRQdW5jdENoYXIpKSB7XG4gICAgICByaWdodF9mbGFua2luZyA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGlmICghY2FuU3BsaXRXb3JkKSB7XG4gICAgY2FuX29wZW4gID0gbGVmdF9mbGFua2luZyAgJiYgKCFyaWdodF9mbGFua2luZyB8fCBpc0xhc3RQdW5jdENoYXIpO1xuICAgIGNhbl9jbG9zZSA9IHJpZ2h0X2ZsYW5raW5nICYmICghbGVmdF9mbGFua2luZyAgfHwgaXNOZXh0UHVuY3RDaGFyKTtcbiAgfSBlbHNlIHtcbiAgICBjYW5fb3BlbiAgPSBsZWZ0X2ZsYW5raW5nO1xuICAgIGNhbl9jbG9zZSA9IHJpZ2h0X2ZsYW5raW5nO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjYW5fb3BlbjogIGNhbl9vcGVuLFxuICAgIGNhbl9jbG9zZTogY2FuX2Nsb3NlLFxuICAgIGxlbmd0aDogICAgY291bnRcbiAgfTtcbn07XG5cblxuLy8gcmUtZXhwb3J0IFRva2VuIGNsYXNzIHRvIHVzZSBpbiBibG9jayBydWxlc1xuU3RhdGVJbmxpbmUucHJvdG90eXBlLlRva2VuID0gVG9rZW47XG5cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZUlubGluZTtcbiIsIi8vIH5+c3RyaWtlIHRocm91Z2h+flxuLy9cbid1c2Ugc3RyaWN0JztcblxuXG4vLyBJbnNlcnQgZWFjaCBtYXJrZXIgYXMgYSBzZXBhcmF0ZSB0ZXh0IHRva2VuLCBhbmQgYWRkIGl0IHRvIGRlbGltaXRlciBsaXN0XG4vL1xubW9kdWxlLmV4cG9ydHMudG9rZW5pemUgPSBmdW5jdGlvbiBzdHJpa2V0aHJvdWdoKHN0YXRlLCBzaWxlbnQpIHtcbiAgdmFyIGksIHNjYW5uZWQsIHRva2VuLCBsZW4sIGNoLFxuICAgICAgc3RhcnQgPSBzdGF0ZS5wb3MsXG4gICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChzdGFydCk7XG5cbiAgaWYgKHNpbGVudCkgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAobWFya2VyICE9PSAweDdFLyogfiAqLykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBzY2FubmVkID0gc3RhdGUuc2NhbkRlbGltcyhzdGF0ZS5wb3MsIHRydWUpO1xuICBsZW4gPSBzY2FubmVkLmxlbmd0aDtcbiAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKG1hcmtlcik7XG5cbiAgaWYgKGxlbiA8IDIpIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgaWYgKGxlbiAlIDIpIHtcbiAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKTtcbiAgICB0b2tlbi5jb250ZW50ID0gY2g7XG4gICAgbGVuLS07XG4gIH1cblxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICB0b2tlbiAgICAgICAgID0gc3RhdGUucHVzaCgndGV4dCcsICcnLCAwKTtcbiAgICB0b2tlbi5jb250ZW50ID0gY2ggKyBjaDtcblxuICAgIHN0YXRlLmRlbGltaXRlcnMucHVzaCh7XG4gICAgICBtYXJrZXI6IG1hcmtlcixcbiAgICAgIGp1bXA6ICAgaSxcbiAgICAgIHRva2VuOiAgc3RhdGUudG9rZW5zLmxlbmd0aCAtIDEsXG4gICAgICBsZXZlbDogIHN0YXRlLmxldmVsLFxuICAgICAgZW5kOiAgICAtMSxcbiAgICAgIG9wZW46ICAgc2Nhbm5lZC5jYW5fb3BlbixcbiAgICAgIGNsb3NlOiAgc2Nhbm5lZC5jYW5fY2xvc2VcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRlLnBvcyArPSBzY2FubmVkLmxlbmd0aDtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblxuLy8gV2FsayB0aHJvdWdoIGRlbGltaXRlciBsaXN0IGFuZCByZXBsYWNlIHRleHQgdG9rZW5zIHdpdGggdGFnc1xuLy9cbm1vZHVsZS5leHBvcnRzLnBvc3RQcm9jZXNzID0gZnVuY3Rpb24gc3RyaWtldGhyb3VnaChzdGF0ZSkge1xuICB2YXIgaSwgaixcbiAgICAgIHN0YXJ0RGVsaW0sXG4gICAgICBlbmREZWxpbSxcbiAgICAgIHRva2VuLFxuICAgICAgbG9uZU1hcmtlcnMgPSBbXSxcbiAgICAgIGRlbGltaXRlcnMgPSBzdGF0ZS5kZWxpbWl0ZXJzLFxuICAgICAgbWF4ID0gc3RhdGUuZGVsaW1pdGVycy5sZW5ndGg7XG5cbiAgZm9yIChpID0gMDsgaSA8IG1heDsgaSsrKSB7XG4gICAgc3RhcnREZWxpbSA9IGRlbGltaXRlcnNbaV07XG5cbiAgICBpZiAoc3RhcnREZWxpbS5tYXJrZXIgIT09IDB4N0UvKiB+ICovKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAoc3RhcnREZWxpbS5lbmQgPT09IC0xKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBlbmREZWxpbSA9IGRlbGltaXRlcnNbc3RhcnREZWxpbS5lbmRdO1xuXG4gICAgdG9rZW4gICAgICAgICA9IHN0YXRlLnRva2Vuc1tzdGFydERlbGltLnRva2VuXTtcbiAgICB0b2tlbi50eXBlICAgID0gJ3Nfb3Blbic7XG4gICAgdG9rZW4udGFnICAgICA9ICdzJztcbiAgICB0b2tlbi5uZXN0aW5nID0gMTtcbiAgICB0b2tlbi5tYXJrdXAgID0gJ35+JztcbiAgICB0b2tlbi5jb250ZW50ID0gJyc7XG5cbiAgICB0b2tlbiAgICAgICAgID0gc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuXTtcbiAgICB0b2tlbi50eXBlICAgID0gJ3NfY2xvc2UnO1xuICAgIHRva2VuLnRhZyAgICAgPSAncyc7XG4gICAgdG9rZW4ubmVzdGluZyA9IC0xO1xuICAgIHRva2VuLm1hcmt1cCAgPSAnfn4nO1xuICAgIHRva2VuLmNvbnRlbnQgPSAnJztcblxuICAgIGlmIChzdGF0ZS50b2tlbnNbZW5kRGVsaW0udG9rZW4gLSAxXS50eXBlID09PSAndGV4dCcgJiZcbiAgICAgICAgc3RhdGUudG9rZW5zW2VuZERlbGltLnRva2VuIC0gMV0uY29udGVudCA9PT0gJ34nKSB7XG5cbiAgICAgIGxvbmVNYXJrZXJzLnB1c2goZW5kRGVsaW0udG9rZW4gLSAxKTtcbiAgICB9XG4gIH1cblxuICAvLyBJZiBhIG1hcmtlciBzZXF1ZW5jZSBoYXMgYW4gb2RkIG51bWJlciBvZiBjaGFyYWN0ZXJzLCBpdCdzIHNwbGl0dGVkXG4gIC8vIGxpa2UgdGhpczogYH5+fn5+YCAtPiBgfmAgKyBgfn5gICsgYH5+YCwgbGVhdmluZyBvbmUgbWFya2VyIGF0IHRoZVxuICAvLyBzdGFydCBvZiB0aGUgc2VxdWVuY2UuXG4gIC8vXG4gIC8vIFNvLCB3ZSBoYXZlIHRvIG1vdmUgYWxsIHRob3NlIG1hcmtlcnMgYWZ0ZXIgc3Vic2VxdWVudCBzX2Nsb3NlIHRhZ3MuXG4gIC8vXG4gIHdoaWxlIChsb25lTWFya2Vycy5sZW5ndGgpIHtcbiAgICBpID0gbG9uZU1hcmtlcnMucG9wKCk7XG4gICAgaiA9IGkgKyAxO1xuXG4gICAgd2hpbGUgKGogPCBzdGF0ZS50b2tlbnMubGVuZ3RoICYmIHN0YXRlLnRva2Vuc1tqXS50eXBlID09PSAnc19jbG9zZScpIHtcbiAgICAgIGorKztcbiAgICB9XG5cbiAgICBqLS07XG5cbiAgICBpZiAoaSAhPT0gaikge1xuICAgICAgdG9rZW4gPSBzdGF0ZS50b2tlbnNbal07XG4gICAgICBzdGF0ZS50b2tlbnNbal0gPSBzdGF0ZS50b2tlbnNbaV07XG4gICAgICBzdGF0ZS50b2tlbnNbaV0gPSB0b2tlbjtcbiAgICB9XG4gIH1cbn07XG4iLCIvLyBTa2lwIHRleHQgY2hhcmFjdGVycyBmb3IgdGV4dCB0b2tlbiwgcGxhY2UgdGhvc2UgdG8gcGVuZGluZyBidWZmZXJcbi8vIGFuZCBpbmNyZW1lbnQgY3VycmVudCBwb3NcblxuJ3VzZSBzdHJpY3QnO1xuXG5cbi8vIFJ1bGUgdG8gc2tpcCBwdXJlIHRleHRcbi8vICd7fSQlQH4rPTonIHJlc2VydmVkIGZvciBleHRlbnRpb25zXG5cbi8vICEsIFwiLCAjLCAkLCAlLCAmLCAnLCAoLCApLCAqLCArLCAsLCAtLCAuLCAvLCA6LCA7LCA8LCA9LCA+LCA/LCBALCBbLCBcXCwgXSwgXiwgXywgYCwgeywgfCwgfSwgb3IgflxuXG4vLyAhISEhIERvbid0IGNvbmZ1c2Ugd2l0aCBcIk1hcmtkb3duIEFTQ0lJIFB1bmN0dWF0aW9uXCIgY2hhcnNcbi8vIGh0dHA6Ly9zcGVjLmNvbW1vbm1hcmsub3JnLzAuMTUvI2FzY2lpLXB1bmN0dWF0aW9uLWNoYXJhY3RlclxuZnVuY3Rpb24gaXNUZXJtaW5hdG9yQ2hhcihjaCkge1xuICBzd2l0Y2ggKGNoKSB7XG4gICAgY2FzZSAweDBBLyogXFxuICovOlxuICAgIGNhc2UgMHgyMS8qICEgKi86XG4gICAgY2FzZSAweDIzLyogIyAqLzpcbiAgICBjYXNlIDB4MjQvKiAkICovOlxuICAgIGNhc2UgMHgyNS8qICUgKi86XG4gICAgY2FzZSAweDI2LyogJiAqLzpcbiAgICBjYXNlIDB4MkEvKiAqICovOlxuICAgIGNhc2UgMHgyQi8qICsgKi86XG4gICAgY2FzZSAweDJELyogLSAqLzpcbiAgICBjYXNlIDB4M0EvKiA6ICovOlxuICAgIGNhc2UgMHgzQy8qIDwgKi86XG4gICAgY2FzZSAweDNELyogPSAqLzpcbiAgICBjYXNlIDB4M0UvKiA+ICovOlxuICAgIGNhc2UgMHg0MC8qIEAgKi86XG4gICAgY2FzZSAweDVCLyogWyAqLzpcbiAgICBjYXNlIDB4NUMvKiBcXCAqLzpcbiAgICBjYXNlIDB4NUQvKiBdICovOlxuICAgIGNhc2UgMHg1RS8qIF4gKi86XG4gICAgY2FzZSAweDVGLyogXyAqLzpcbiAgICBjYXNlIDB4NjAvKiBgICovOlxuICAgIGNhc2UgMHg3Qi8qIHsgKi86XG4gICAgY2FzZSAweDdELyogfSAqLzpcbiAgICBjYXNlIDB4N0UvKiB+ICovOlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRleHQoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgcG9zID0gc3RhdGUucG9zO1xuXG4gIHdoaWxlIChwb3MgPCBzdGF0ZS5wb3NNYXggJiYgIWlzVGVybWluYXRvckNoYXIoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSkpIHtcbiAgICBwb3MrKztcbiAgfVxuXG4gIGlmIChwb3MgPT09IHN0YXRlLnBvcykgeyByZXR1cm4gZmFsc2U7IH1cblxuICBpZiAoIXNpbGVudCkgeyBzdGF0ZS5wZW5kaW5nICs9IHN0YXRlLnNyYy5zbGljZShzdGF0ZS5wb3MsIHBvcyk7IH1cblxuICBzdGF0ZS5wb3MgPSBwb3M7XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBBbHRlcm5hdGl2ZSBpbXBsZW1lbnRhdGlvbiwgZm9yIG1lbW9yeS5cbi8vXG4vLyBJdCBjb3N0cyAxMCUgb2YgcGVyZm9ybWFuY2UsIGJ1dCBhbGxvd3MgZXh0ZW5kIHRlcm1pbmF0b3JzIGxpc3QsIGlmIHBsYWNlIGl0XG4vLyB0byBgUGFyY2VySW5saW5lYCBwcm9wZXJ0eS4gUHJvYmFibHksIHdpbGwgc3dpdGNoIHRvIGl0IHNvbWV0aW1lLCBzdWNoXG4vLyBmbGV4aWJpbGl0eSByZXF1aXJlZC5cblxuLypcbnZhciBURVJNSU5BVE9SX1JFID0gL1tcXG4hIyQlJiorXFwtOjw9PkBbXFxcXFxcXV5fYHt9fl0vO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRleHQoc3RhdGUsIHNpbGVudCkge1xuICB2YXIgcG9zID0gc3RhdGUucG9zLFxuICAgICAgaWR4ID0gc3RhdGUuc3JjLnNsaWNlKHBvcykuc2VhcmNoKFRFUk1JTkFUT1JfUkUpO1xuXG4gIC8vIGZpcnN0IGNoYXIgaXMgdGVybWluYXRvciAtPiBlbXB0eSB0ZXh0XG4gIGlmIChpZHggPT09IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgLy8gbm8gdGVybWluYXRvciAtPiB0ZXh0IHRpbGwgZW5kIG9mIHN0cmluZ1xuICBpZiAoaWR4IDwgMCkge1xuICAgIGlmICghc2lsZW50KSB7IHN0YXRlLnBlbmRpbmcgKz0gc3RhdGUuc3JjLnNsaWNlKHBvcyk7IH1cbiAgICBzdGF0ZS5wb3MgPSBzdGF0ZS5zcmMubGVuZ3RoO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKCFzaWxlbnQpIHsgc3RhdGUucGVuZGluZyArPSBzdGF0ZS5zcmMuc2xpY2UocG9zLCBwb3MgKyBpZHgpOyB9XG5cbiAgc3RhdGUucG9zICs9IGlkeDtcblxuICByZXR1cm4gdHJ1ZTtcbn07Ki9cbiIsIi8vIE1lcmdlIGFkamFjZW50IHRleHQgbm9kZXMgaW50byBvbmUsIGFuZCByZS1jYWxjdWxhdGUgYWxsIHRva2VuIGxldmVsc1xuLy9cbid1c2Ugc3RyaWN0JztcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRleHRfY29sbGFwc2Uoc3RhdGUpIHtcbiAgdmFyIGN1cnIsIGxhc3QsXG4gICAgICBsZXZlbCA9IDAsXG4gICAgICB0b2tlbnMgPSBzdGF0ZS50b2tlbnMsXG4gICAgICBtYXggPSBzdGF0ZS50b2tlbnMubGVuZ3RoO1xuXG4gIGZvciAoY3VyciA9IGxhc3QgPSAwOyBjdXJyIDwgbWF4OyBjdXJyKyspIHtcbiAgICAvLyByZS1jYWxjdWxhdGUgbGV2ZWxzXG4gICAgbGV2ZWwgKz0gdG9rZW5zW2N1cnJdLm5lc3Rpbmc7XG4gICAgdG9rZW5zW2N1cnJdLmxldmVsID0gbGV2ZWw7XG5cbiAgICBpZiAodG9rZW5zW2N1cnJdLnR5cGUgPT09ICd0ZXh0JyAmJlxuICAgICAgICBjdXJyICsgMSA8IG1heCAmJlxuICAgICAgICB0b2tlbnNbY3VyciArIDFdLnR5cGUgPT09ICd0ZXh0Jykge1xuXG4gICAgICAvLyBjb2xsYXBzZSB0d28gYWRqYWNlbnQgdGV4dCBub2Rlc1xuICAgICAgdG9rZW5zW2N1cnIgKyAxXS5jb250ZW50ID0gdG9rZW5zW2N1cnJdLmNvbnRlbnQgKyB0b2tlbnNbY3VyciArIDFdLmNvbnRlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjdXJyICE9PSBsYXN0KSB7IHRva2Vuc1tsYXN0XSA9IHRva2Vuc1tjdXJyXTsgfVxuXG4gICAgICBsYXN0Kys7XG4gICAgfVxuICB9XG5cbiAgaWYgKGN1cnIgIT09IGxhc3QpIHtcbiAgICB0b2tlbnMubGVuZ3RoID0gbGFzdDtcbiAgfVxufTtcbiIsIi8vIFRva2VuIGNsYXNzXG5cbid1c2Ugc3RyaWN0JztcblxuXG4vKipcbiAqIGNsYXNzIFRva2VuXG4gKiovXG5cbi8qKlxuICogbmV3IFRva2VuKHR5cGUsIHRhZywgbmVzdGluZylcbiAqXG4gKiBDcmVhdGUgbmV3IHRva2VuIGFuZCBmaWxsIHBhc3NlZCBwcm9wZXJ0aWVzLlxuICoqL1xuZnVuY3Rpb24gVG9rZW4odHlwZSwgdGFnLCBuZXN0aW5nKSB7XG4gIC8qKlxuICAgKiBUb2tlbiN0eXBlIC0+IFN0cmluZ1xuICAgKlxuICAgKiBUeXBlIG9mIHRoZSB0b2tlbiAoc3RyaW5nLCBlLmcuIFwicGFyYWdyYXBoX29wZW5cIilcbiAgICoqL1xuICB0aGlzLnR5cGUgICAgID0gdHlwZTtcblxuICAvKipcbiAgICogVG9rZW4jdGFnIC0+IFN0cmluZ1xuICAgKlxuICAgKiBodG1sIHRhZyBuYW1lLCBlLmcuIFwicFwiXG4gICAqKi9cbiAgdGhpcy50YWcgICAgICA9IHRhZztcblxuICAvKipcbiAgICogVG9rZW4jYXR0cnMgLT4gQXJyYXlcbiAgICpcbiAgICogSHRtbCBhdHRyaWJ1dGVzLiBGb3JtYXQ6IGBbIFsgbmFtZTEsIHZhbHVlMSBdLCBbIG5hbWUyLCB2YWx1ZTIgXSBdYFxuICAgKiovXG4gIHRoaXMuYXR0cnMgICAgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNtYXAgLT4gQXJyYXlcbiAgICpcbiAgICogU291cmNlIG1hcCBpbmZvLiBGb3JtYXQ6IGBbIGxpbmVfYmVnaW4sIGxpbmVfZW5kIF1gXG4gICAqKi9cbiAgdGhpcy5tYXAgICAgICA9IG51bGw7XG5cbiAgLyoqXG4gICAqIFRva2VuI25lc3RpbmcgLT4gTnVtYmVyXG4gICAqXG4gICAqIExldmVsIGNoYW5nZSAobnVtYmVyIGluIHstMSwgMCwgMX0gc2V0KSwgd2hlcmU6XG4gICAqXG4gICAqIC0gIGAxYCBtZWFucyB0aGUgdGFnIGlzIG9wZW5pbmdcbiAgICogLSAgYDBgIG1lYW5zIHRoZSB0YWcgaXMgc2VsZi1jbG9zaW5nXG4gICAqIC0gYC0xYCBtZWFucyB0aGUgdGFnIGlzIGNsb3NpbmdcbiAgICoqL1xuICB0aGlzLm5lc3RpbmcgID0gbmVzdGluZztcblxuICAvKipcbiAgICogVG9rZW4jbGV2ZWwgLT4gTnVtYmVyXG4gICAqXG4gICAqIG5lc3RpbmcgbGV2ZWwsIHRoZSBzYW1lIGFzIGBzdGF0ZS5sZXZlbGBcbiAgICoqL1xuICB0aGlzLmxldmVsICAgID0gMDtcblxuICAvKipcbiAgICogVG9rZW4jY2hpbGRyZW4gLT4gQXJyYXlcbiAgICpcbiAgICogQW4gYXJyYXkgb2YgY2hpbGQgbm9kZXMgKGlubGluZSBhbmQgaW1nIHRva2VucylcbiAgICoqL1xuICB0aGlzLmNoaWxkcmVuID0gbnVsbDtcblxuICAvKipcbiAgICogVG9rZW4jY29udGVudCAtPiBTdHJpbmdcbiAgICpcbiAgICogSW4gYSBjYXNlIG9mIHNlbGYtY2xvc2luZyB0YWcgKGNvZGUsIGh0bWwsIGZlbmNlLCBldGMuKSxcbiAgICogaXQgaGFzIGNvbnRlbnRzIG9mIHRoaXMgdGFnLlxuICAgKiovXG4gIHRoaXMuY29udGVudCAgPSAnJztcblxuICAvKipcbiAgICogVG9rZW4jbWFya3VwIC0+IFN0cmluZ1xuICAgKlxuICAgKiAnKicgb3IgJ18nIGZvciBlbXBoYXNpcywgZmVuY2Ugc3RyaW5nIGZvciBmZW5jZSwgZXRjLlxuICAgKiovXG4gIHRoaXMubWFya3VwICAgPSAnJztcblxuICAvKipcbiAgICogVG9rZW4jaW5mbyAtPiBTdHJpbmdcbiAgICpcbiAgICogZmVuY2UgaW5mb3N0cmluZ1xuICAgKiovXG4gIHRoaXMuaW5mbyAgICAgPSAnJztcblxuICAvKipcbiAgICogVG9rZW4jbWV0YSAtPiBPYmplY3RcbiAgICpcbiAgICogQSBwbGFjZSBmb3IgcGx1Z2lucyB0byBzdG9yZSBhbiBhcmJpdHJhcnkgZGF0YVxuICAgKiovXG4gIHRoaXMubWV0YSAgICAgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNibG9jayAtPiBCb29sZWFuXG4gICAqXG4gICAqIFRydWUgZm9yIGJsb2NrLWxldmVsIHRva2VucywgZmFsc2UgZm9yIGlubGluZSB0b2tlbnMuXG4gICAqIFVzZWQgaW4gcmVuZGVyZXIgdG8gY2FsY3VsYXRlIGxpbmUgYnJlYWtzXG4gICAqKi9cbiAgdGhpcy5ibG9jayAgICA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBUb2tlbiNoaWRkZW4gLT4gQm9vbGVhblxuICAgKlxuICAgKiBJZiBpdCdzIHRydWUsIGlnbm9yZSB0aGlzIGVsZW1lbnQgd2hlbiByZW5kZXJpbmcuIFVzZWQgZm9yIHRpZ2h0IGxpc3RzXG4gICAqIHRvIGhpZGUgcGFyYWdyYXBocy5cbiAgICoqL1xuICB0aGlzLmhpZGRlbiAgID0gZmFsc2U7XG59XG5cblxuLyoqXG4gKiBUb2tlbi5hdHRySW5kZXgobmFtZSkgLT4gTnVtYmVyXG4gKlxuICogU2VhcmNoIGF0dHJpYnV0ZSBpbmRleCBieSBuYW1lLlxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJJbmRleCA9IGZ1bmN0aW9uIGF0dHJJbmRleChuYW1lKSB7XG4gIHZhciBhdHRycywgaSwgbGVuO1xuXG4gIGlmICghdGhpcy5hdHRycykgeyByZXR1cm4gLTE7IH1cblxuICBhdHRycyA9IHRoaXMuYXR0cnM7XG5cbiAgZm9yIChpID0gMCwgbGVuID0gYXR0cnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICBpZiAoYXR0cnNbaV1bMF0gPT09IG5hbWUpIHsgcmV0dXJuIGk7IH1cbiAgfVxuICByZXR1cm4gLTE7XG59O1xuXG5cbi8qKlxuICogVG9rZW4uYXR0clB1c2goYXR0ckRhdGEpXG4gKlxuICogQWRkIGBbIG5hbWUsIHZhbHVlIF1gIGF0dHJpYnV0ZSB0byBsaXN0LiBJbml0IGF0dHJzIGlmIG5lY2Vzc2FyeVxuICoqL1xuVG9rZW4ucHJvdG90eXBlLmF0dHJQdXNoID0gZnVuY3Rpb24gYXR0clB1c2goYXR0ckRhdGEpIHtcbiAgaWYgKHRoaXMuYXR0cnMpIHtcbiAgICB0aGlzLmF0dHJzLnB1c2goYXR0ckRhdGEpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuYXR0cnMgPSBbIGF0dHJEYXRhIF07XG4gIH1cbn07XG5cblxuLyoqXG4gKiBUb2tlbi5hdHRyU2V0KG5hbWUsIHZhbHVlKVxuICpcbiAqIFNldCBgbmFtZWAgYXR0cmlidXRlIHRvIGB2YWx1ZWAuIE92ZXJyaWRlIG9sZCB2YWx1ZSBpZiBleGlzdHMuXG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0clNldCA9IGZ1bmN0aW9uIGF0dHJTZXQobmFtZSwgdmFsdWUpIHtcbiAgdmFyIGlkeCA9IHRoaXMuYXR0ckluZGV4KG5hbWUpLFxuICAgICAgYXR0ckRhdGEgPSBbIG5hbWUsIHZhbHVlIF07XG5cbiAgaWYgKGlkeCA8IDApIHtcbiAgICB0aGlzLmF0dHJQdXNoKGF0dHJEYXRhKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzW2lkeF0gPSBhdHRyRGF0YTtcbiAgfVxufTtcblxuXG4vKipcbiAqIFRva2VuLmF0dHJHZXQobmFtZSlcbiAqXG4gKiBHZXQgdGhlIHZhbHVlIG9mIGF0dHJpYnV0ZSBgbmFtZWAsIG9yIG51bGwgaWYgaXQgZG9lcyBub3QgZXhpc3QuXG4gKiovXG5Ub2tlbi5wcm90b3R5cGUuYXR0ckdldCA9IGZ1bmN0aW9uIGF0dHJHZXQobmFtZSkge1xuICB2YXIgaWR4ID0gdGhpcy5hdHRySW5kZXgobmFtZSksIHZhbHVlID0gbnVsbDtcbiAgaWYgKGlkeCA+PSAwKSB7XG4gICAgdmFsdWUgPSB0aGlzLmF0dHJzW2lkeF1bMV07XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufTtcblxuXG4vKipcbiAqIFRva2VuLmF0dHJKb2luKG5hbWUsIHZhbHVlKVxuICpcbiAqIEpvaW4gdmFsdWUgdG8gZXhpc3RpbmcgYXR0cmlidXRlIHZpYSBzcGFjZS4gT3IgY3JlYXRlIG5ldyBhdHRyaWJ1dGUgaWYgbm90XG4gKiBleGlzdHMuIFVzZWZ1bCB0byBvcGVyYXRlIHdpdGggdG9rZW4gY2xhc3Nlcy5cbiAqKi9cblRva2VuLnByb3RvdHlwZS5hdHRySm9pbiA9IGZ1bmN0aW9uIGF0dHJKb2luKG5hbWUsIHZhbHVlKSB7XG4gIHZhciBpZHggPSB0aGlzLmF0dHJJbmRleChuYW1lKTtcblxuICBpZiAoaWR4IDwgMCkge1xuICAgIHRoaXMuYXR0clB1c2goWyBuYW1lLCB2YWx1ZSBdKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmF0dHJzW2lkeF1bMV0gPSB0aGlzLmF0dHJzW2lkeF1bMV0gKyAnICcgKyB2YWx1ZTtcbiAgfVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFRva2VuO1xuIiwiXG4ndXNlIHN0cmljdCc7XG5cblxuLyogZXNsaW50LWRpc2FibGUgbm8tYml0d2lzZSAqL1xuXG52YXIgZGVjb2RlQ2FjaGUgPSB7fTtcblxuZnVuY3Rpb24gZ2V0RGVjb2RlQ2FjaGUoZXhjbHVkZSkge1xuICB2YXIgaSwgY2gsIGNhY2hlID0gZGVjb2RlQ2FjaGVbZXhjbHVkZV07XG4gIGlmIChjYWNoZSkgeyByZXR1cm4gY2FjaGU7IH1cblxuICBjYWNoZSA9IGRlY29kZUNhY2hlW2V4Y2x1ZGVdID0gW107XG5cbiAgZm9yIChpID0gMDsgaSA8IDEyODsgaSsrKSB7XG4gICAgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpO1xuICAgIGNhY2hlLnB1c2goY2gpO1xuICB9XG5cbiAgZm9yIChpID0gMDsgaSA8IGV4Y2x1ZGUubGVuZ3RoOyBpKyspIHtcbiAgICBjaCA9IGV4Y2x1ZGUuY2hhckNvZGVBdChpKTtcbiAgICBjYWNoZVtjaF0gPSAnJScgKyAoJzAnICsgY2gudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkpLnNsaWNlKC0yKTtcbiAgfVxuXG4gIHJldHVybiBjYWNoZTtcbn1cblxuXG4vLyBEZWNvZGUgcGVyY2VudC1lbmNvZGVkIHN0cmluZy5cbi8vXG5mdW5jdGlvbiBkZWNvZGUoc3RyaW5nLCBleGNsdWRlKSB7XG4gIHZhciBjYWNoZTtcblxuICBpZiAodHlwZW9mIGV4Y2x1ZGUgIT09ICdzdHJpbmcnKSB7XG4gICAgZXhjbHVkZSA9IGRlY29kZS5kZWZhdWx0Q2hhcnM7XG4gIH1cblxuICBjYWNoZSA9IGdldERlY29kZUNhY2hlKGV4Y2x1ZGUpO1xuXG4gIHJldHVybiBzdHJpbmcucmVwbGFjZSgvKCVbYS1mMC05XXsyfSkrL2dpLCBmdW5jdGlvbihzZXEpIHtcbiAgICB2YXIgaSwgbCwgYjEsIGIyLCBiMywgYjQsIGNocixcbiAgICAgICAgcmVzdWx0ID0gJyc7XG5cbiAgICBmb3IgKGkgPSAwLCBsID0gc2VxLmxlbmd0aDsgaSA8IGw7IGkgKz0gMykge1xuICAgICAgYjEgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDEsIGkgKyAzKSwgMTYpO1xuXG4gICAgICBpZiAoYjEgPCAweDgwKSB7XG4gICAgICAgIHJlc3VsdCArPSBjYWNoZVtiMV07XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoKGIxICYgMHhFMCkgPT09IDB4QzAgJiYgKGkgKyAzIDwgbCkpIHtcbiAgICAgICAgLy8gMTEweHh4eHggMTB4eHh4eHhcbiAgICAgICAgYjIgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDQsIGkgKyA2KSwgMTYpO1xuXG4gICAgICAgIGlmICgoYjIgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgIGNociA9ICgoYjEgPDwgNikgJiAweDdDMCkgfCAoYjIgJiAweDNGKTtcblxuICAgICAgICAgIGlmIChjaHIgPCAweDgwKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcdWZmZmRcXHVmZmZkJztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2hyKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpICs9IDM7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKChiMSAmIDB4RjApID09PSAweEUwICYmIChpICsgNiA8IGwpKSB7XG4gICAgICAgIC8vIDExMTB4eHh4IDEweHh4eHh4IDEweHh4eHh4XG4gICAgICAgIGIyID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyA0LCBpICsgNiksIDE2KTtcbiAgICAgICAgYjMgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDcsIGkgKyA5KSwgMTYpO1xuXG4gICAgICAgIGlmICgoYjIgJiAweEMwKSA9PT0gMHg4MCAmJiAoYjMgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgIGNociA9ICgoYjEgPDwgMTIpICYgMHhGMDAwKSB8ICgoYjIgPDwgNikgJiAweEZDMCkgfCAoYjMgJiAweDNGKTtcblxuICAgICAgICAgIGlmIChjaHIgPCAweDgwMCB8fCAoY2hyID49IDB4RDgwMCAmJiBjaHIgPD0gMHhERkZGKSkge1xuICAgICAgICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkXFx1ZmZmZFxcdWZmZmQnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaHIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGkgKz0gNjtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGIxICYgMHhGOCkgPT09IDB4RjAgJiYgKGkgKyA5IDwgbCkpIHtcbiAgICAgICAgLy8gMTExMTEweHggMTB4eHh4eHggMTB4eHh4eHggMTB4eHh4eHhcbiAgICAgICAgYjIgPSBwYXJzZUludChzZXEuc2xpY2UoaSArIDQsIGkgKyA2KSwgMTYpO1xuICAgICAgICBiMyA9IHBhcnNlSW50KHNlcS5zbGljZShpICsgNywgaSArIDkpLCAxNik7XG4gICAgICAgIGI0ID0gcGFyc2VJbnQoc2VxLnNsaWNlKGkgKyAxMCwgaSArIDEyKSwgMTYpO1xuXG4gICAgICAgIGlmICgoYjIgJiAweEMwKSA9PT0gMHg4MCAmJiAoYjMgJiAweEMwKSA9PT0gMHg4MCAmJiAoYjQgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgIGNociA9ICgoYjEgPDwgMTgpICYgMHgxQzAwMDApIHwgKChiMiA8PCAxMikgJiAweDNGMDAwKSB8ICgoYjMgPDwgNikgJiAweEZDMCkgfCAoYjQgJiAweDNGKTtcblxuICAgICAgICAgIGlmIChjaHIgPCAweDEwMDAwIHx8IGNociA+IDB4MTBGRkZGKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ1xcdWZmZmRcXHVmZmZkXFx1ZmZmZFxcdWZmZmQnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjaHIgLT0gMHgxMDAwMDtcbiAgICAgICAgICAgIHJlc3VsdCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RDgwMCArIChjaHIgPj4gMTApLCAweERDMDAgKyAoY2hyICYgMHgzRkYpKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpICs9IDk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmVzdWx0ICs9ICdcXHVmZmZkJztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9KTtcbn1cblxuXG5kZWNvZGUuZGVmYXVsdENoYXJzICAgPSAnOy8/OkAmPSskLCMnO1xuZGVjb2RlLmNvbXBvbmVudENoYXJzID0gJyc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBkZWNvZGU7XG4iLCJcbid1c2Ugc3RyaWN0JztcblxuXG52YXIgZW5jb2RlQ2FjaGUgPSB7fTtcblxuXG4vLyBDcmVhdGUgYSBsb29rdXAgYXJyYXkgd2hlcmUgYW55dGhpbmcgYnV0IGNoYXJhY3RlcnMgaW4gYGNoYXJzYCBzdHJpbmdcbi8vIGFuZCBhbHBoYW51bWVyaWMgY2hhcnMgaXMgcGVyY2VudC1lbmNvZGVkLlxuLy9cbmZ1bmN0aW9uIGdldEVuY29kZUNhY2hlKGV4Y2x1ZGUpIHtcbiAgdmFyIGksIGNoLCBjYWNoZSA9IGVuY29kZUNhY2hlW2V4Y2x1ZGVdO1xuICBpZiAoY2FjaGUpIHsgcmV0dXJuIGNhY2hlOyB9XG5cbiAgY2FjaGUgPSBlbmNvZGVDYWNoZVtleGNsdWRlXSA9IFtdO1xuXG4gIGZvciAoaSA9IDA7IGkgPCAxMjg7IGkrKykge1xuICAgIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpKTtcblxuICAgIGlmICgvXlswLTlhLXpdJC9pLnRlc3QoY2gpKSB7XG4gICAgICAvLyBhbHdheXMgYWxsb3cgdW5lbmNvZGVkIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzXG4gICAgICBjYWNoZS5wdXNoKGNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FjaGUucHVzaCgnJScgKyAoJzAnICsgaS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKSkuc2xpY2UoLTIpKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGkgPSAwOyBpIDwgZXhjbHVkZS5sZW5ndGg7IGkrKykge1xuICAgIGNhY2hlW2V4Y2x1ZGUuY2hhckNvZGVBdChpKV0gPSBleGNsdWRlW2ldO1xuICB9XG5cbiAgcmV0dXJuIGNhY2hlO1xufVxuXG5cbi8vIEVuY29kZSB1bnNhZmUgY2hhcmFjdGVycyB3aXRoIHBlcmNlbnQtZW5jb2RpbmcsIHNraXBwaW5nIGFscmVhZHlcbi8vIGVuY29kZWQgc2VxdWVuY2VzLlxuLy9cbi8vICAtIHN0cmluZyAgICAgICAtIHN0cmluZyB0byBlbmNvZGVcbi8vICAtIGV4Y2x1ZGUgICAgICAtIGxpc3Qgb2YgY2hhcmFjdGVycyB0byBpZ25vcmUgKGluIGFkZGl0aW9uIHRvIGEtekEtWjAtOSlcbi8vICAtIGtlZXBFc2NhcGVkICAtIGRvbid0IGVuY29kZSAnJScgaW4gYSBjb3JyZWN0IGVzY2FwZSBzZXF1ZW5jZSAoZGVmYXVsdDogdHJ1ZSlcbi8vXG5mdW5jdGlvbiBlbmNvZGUoc3RyaW5nLCBleGNsdWRlLCBrZWVwRXNjYXBlZCkge1xuICB2YXIgaSwgbCwgY29kZSwgbmV4dENvZGUsIGNhY2hlLFxuICAgICAgcmVzdWx0ID0gJyc7XG5cbiAgaWYgKHR5cGVvZiBleGNsdWRlICE9PSAnc3RyaW5nJykge1xuICAgIC8vIGVuY29kZShzdHJpbmcsIGtlZXBFc2NhcGVkKVxuICAgIGtlZXBFc2NhcGVkICA9IGV4Y2x1ZGU7XG4gICAgZXhjbHVkZSA9IGVuY29kZS5kZWZhdWx0Q2hhcnM7XG4gIH1cblxuICBpZiAodHlwZW9mIGtlZXBFc2NhcGVkID09PSAndW5kZWZpbmVkJykge1xuICAgIGtlZXBFc2NhcGVkID0gdHJ1ZTtcbiAgfVxuXG4gIGNhY2hlID0gZ2V0RW5jb2RlQ2FjaGUoZXhjbHVkZSk7XG5cbiAgZm9yIChpID0gMCwgbCA9IHN0cmluZy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBjb2RlID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG5cbiAgICBpZiAoa2VlcEVzY2FwZWQgJiYgY29kZSA9PT0gMHgyNSAvKiAlICovICYmIGkgKyAyIDwgbCkge1xuICAgICAgaWYgKC9eWzAtOWEtZl17Mn0kL2kudGVzdChzdHJpbmcuc2xpY2UoaSArIDEsIGkgKyAzKSkpIHtcbiAgICAgICAgcmVzdWx0ICs9IHN0cmluZy5zbGljZShpLCBpICsgMyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGUgPCAxMjgpIHtcbiAgICAgIHJlc3VsdCArPSBjYWNoZVtjb2RlXTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmIChjb2RlID49IDB4RDgwMCAmJiBjb2RlIDw9IDB4REZGRikge1xuICAgICAgaWYgKGNvZGUgPj0gMHhEODAwICYmIGNvZGUgPD0gMHhEQkZGICYmIGkgKyAxIDwgbCkge1xuICAgICAgICBuZXh0Q29kZSA9IHN0cmluZy5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgICAgaWYgKG5leHRDb2RlID49IDB4REMwMCAmJiBuZXh0Q29kZSA8PSAweERGRkYpIHtcbiAgICAgICAgICByZXN1bHQgKz0gZW5jb2RlVVJJQ29tcG9uZW50KHN0cmluZ1tpXSArIHN0cmluZ1tpICsgMV0pO1xuICAgICAgICAgIGkrKztcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0ICs9ICclRUYlQkYlQkQnO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzdWx0ICs9IGVuY29kZVVSSUNvbXBvbmVudChzdHJpbmdbaV0pO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZW5jb2RlLmRlZmF1bHRDaGFycyAgID0gXCI7Lz86QCY9KyQsLV8uIX4qJygpI1wiO1xuZW5jb2RlLmNvbXBvbmVudENoYXJzID0gXCItXy4hfionKClcIjtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGVuY29kZTtcbiIsIlxuJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZm9ybWF0KHVybCkge1xuICB2YXIgcmVzdWx0ID0gJyc7XG5cbiAgcmVzdWx0ICs9IHVybC5wcm90b2NvbCB8fCAnJztcbiAgcmVzdWx0ICs9IHVybC5zbGFzaGVzID8gJy8vJyA6ICcnO1xuICByZXN1bHQgKz0gdXJsLmF1dGggPyB1cmwuYXV0aCArICdAJyA6ICcnO1xuXG4gIGlmICh1cmwuaG9zdG5hbWUgJiYgdXJsLmhvc3RuYW1lLmluZGV4T2YoJzonKSAhPT0gLTEpIHtcbiAgICAvLyBpcHY2IGFkZHJlc3NcbiAgICByZXN1bHQgKz0gJ1snICsgdXJsLmhvc3RuYW1lICsgJ10nO1xuICB9IGVsc2Uge1xuICAgIHJlc3VsdCArPSB1cmwuaG9zdG5hbWUgfHwgJyc7XG4gIH1cblxuICByZXN1bHQgKz0gdXJsLnBvcnQgPyAnOicgKyB1cmwucG9ydCA6ICcnO1xuICByZXN1bHQgKz0gdXJsLnBhdGhuYW1lIHx8ICcnO1xuICByZXN1bHQgKz0gdXJsLnNlYXJjaCB8fCAnJztcbiAgcmVzdWx0ICs9IHVybC5oYXNoIHx8ICcnO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5cbm1vZHVsZS5leHBvcnRzLmVuY29kZSA9IHJlcXVpcmUoJy4vZW5jb2RlJyk7XG5tb2R1bGUuZXhwb3J0cy5kZWNvZGUgPSByZXF1aXJlKCcuL2RlY29kZScpO1xubW9kdWxlLmV4cG9ydHMuZm9ybWF0ID0gcmVxdWlyZSgnLi9mb3JtYXQnKTtcbm1vZHVsZS5leHBvcnRzLnBhcnNlICA9IHJlcXVpcmUoJy4vcGFyc2UnKTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG4ndXNlIHN0cmljdCc7XG5cbi8vXG4vLyBDaGFuZ2VzIGZyb20gam95ZW50L25vZGU6XG4vL1xuLy8gMS4gTm8gbGVhZGluZyBzbGFzaCBpbiBwYXRocyxcbi8vICAgIGUuZy4gaW4gYHVybC5wYXJzZSgnaHR0cDovL2Zvbz9iYXInKWAgcGF0aG5hbWUgaXMgYGAsIG5vdCBgL2Bcbi8vXG4vLyAyLiBCYWNrc2xhc2hlcyBhcmUgbm90IHJlcGxhY2VkIHdpdGggc2xhc2hlcyxcbi8vICAgIHNvIGBodHRwOlxcXFxleGFtcGxlLm9yZ1xcYCBpcyB0cmVhdGVkIGxpa2UgYSByZWxhdGl2ZSBwYXRoXG4vL1xuLy8gMy4gVHJhaWxpbmcgY29sb24gaXMgdHJlYXRlZCBsaWtlIGEgcGFydCBvZiB0aGUgcGF0aCxcbi8vICAgIGkuZS4gaW4gYGh0dHA6Ly9leGFtcGxlLm9yZzpmb29gIHBhdGhuYW1lIGlzIGA6Zm9vYFxuLy9cbi8vIDQuIE5vdGhpbmcgaXMgVVJMLWVuY29kZWQgaW4gdGhlIHJlc3VsdGluZyBvYmplY3QsXG4vLyAgICAoaW4gam95ZW50L25vZGUgc29tZSBjaGFycyBpbiBhdXRoIGFuZCBwYXRocyBhcmUgZW5jb2RlZClcbi8vXG4vLyA1LiBgdXJsLnBhcnNlKClgIGRvZXMgbm90IGhhdmUgYHBhcnNlUXVlcnlTdHJpbmdgIGFyZ3VtZW50XG4vL1xuLy8gNi4gUmVtb3ZlZCBleHRyYW5lb3VzIHJlc3VsdCBwcm9wZXJ0aWVzOiBgaG9zdGAsIGBwYXRoYCwgYHF1ZXJ5YCwgZXRjLixcbi8vICAgIHdoaWNoIGNhbiBiZSBjb25zdHJ1Y3RlZCB1c2luZyBvdGhlciBwYXJ0cyBvZiB0aGUgdXJsLlxuLy9cblxuXG5mdW5jdGlvbiBVcmwoKSB7XG4gIHRoaXMucHJvdG9jb2wgPSBudWxsO1xuICB0aGlzLnNsYXNoZXMgPSBudWxsO1xuICB0aGlzLmF1dGggPSBudWxsO1xuICB0aGlzLnBvcnQgPSBudWxsO1xuICB0aGlzLmhvc3RuYW1lID0gbnVsbDtcbiAgdGhpcy5oYXNoID0gbnVsbDtcbiAgdGhpcy5zZWFyY2ggPSBudWxsO1xuICB0aGlzLnBhdGhuYW1lID0gbnVsbDtcbn1cblxuLy8gUmVmZXJlbmNlOiBSRkMgMzk4NiwgUkZDIDE4MDgsIFJGQyAyMzk2XG5cbi8vIGRlZmluZSB0aGVzZSBoZXJlIHNvIGF0IGxlYXN0IHRoZXkgb25seSBoYXZlIHRvIGJlXG4vLyBjb21waWxlZCBvbmNlIG9uIHRoZSBmaXJzdCBtb2R1bGUgbG9hZC5cbnZhciBwcm90b2NvbFBhdHRlcm4gPSAvXihbYS16MC05ListXSs6KS9pLFxuICAgIHBvcnRQYXR0ZXJuID0gLzpbMC05XSokLyxcblxuICAgIC8vIFNwZWNpYWwgY2FzZSBmb3IgYSBzaW1wbGUgcGF0aCBVUkxcbiAgICBzaW1wbGVQYXRoUGF0dGVybiA9IC9eKFxcL1xcLz8oPyFcXC8pW15cXD9cXHNdKikoXFw/W15cXHNdKik/JC8sXG5cbiAgICAvLyBSRkMgMjM5NjogY2hhcmFjdGVycyByZXNlcnZlZCBmb3IgZGVsaW1pdGluZyBVUkxzLlxuICAgIC8vIFdlIGFjdHVhbGx5IGp1c3QgYXV0by1lc2NhcGUgdGhlc2UuXG4gICAgZGVsaW1zID0gWyAnPCcsICc+JywgJ1wiJywgJ2AnLCAnICcsICdcXHInLCAnXFxuJywgJ1xcdCcgXSxcblxuICAgIC8vIFJGQyAyMzk2OiBjaGFyYWN0ZXJzIG5vdCBhbGxvd2VkIGZvciB2YXJpb3VzIHJlYXNvbnMuXG4gICAgdW53aXNlID0gWyAneycsICd9JywgJ3wnLCAnXFxcXCcsICdeJywgJ2AnIF0uY29uY2F0KGRlbGltcyksXG5cbiAgICAvLyBBbGxvd2VkIGJ5IFJGQ3MsIGJ1dCBjYXVzZSBvZiBYU1MgYXR0YWNrcy4gIEFsd2F5cyBlc2NhcGUgdGhlc2UuXG4gICAgYXV0b0VzY2FwZSA9IFsgJ1xcJycgXS5jb25jYXQodW53aXNlKSxcbiAgICAvLyBDaGFyYWN0ZXJzIHRoYXQgYXJlIG5ldmVyIGV2ZXIgYWxsb3dlZCBpbiBhIGhvc3RuYW1lLlxuICAgIC8vIE5vdGUgdGhhdCBhbnkgaW52YWxpZCBjaGFycyBhcmUgYWxzbyBoYW5kbGVkLCBidXQgdGhlc2VcbiAgICAvLyBhcmUgdGhlIG9uZXMgdGhhdCBhcmUgKmV4cGVjdGVkKiB0byBiZSBzZWVuLCBzbyB3ZSBmYXN0LXBhdGhcbiAgICAvLyB0aGVtLlxuICAgIG5vbkhvc3RDaGFycyA9IFsgJyUnLCAnLycsICc/JywgJzsnLCAnIycgXS5jb25jYXQoYXV0b0VzY2FwZSksXG4gICAgaG9zdEVuZGluZ0NoYXJzID0gWyAnLycsICc/JywgJyMnIF0sXG4gICAgaG9zdG5hbWVNYXhMZW4gPSAyNTUsXG4gICAgaG9zdG5hbWVQYXJ0UGF0dGVybiA9IC9eWythLXowLTlBLVpfLV17MCw2M30kLyxcbiAgICBob3N0bmFtZVBhcnRTdGFydCA9IC9eKFsrYS16MC05QS1aXy1dezAsNjN9KSguKikkLyxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBjYW4gYWxsb3cgXCJ1bnNhZmVcIiBhbmQgXCJ1bndpc2VcIiBjaGFycy5cbiAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1zY3JpcHQtdXJsICovXG4gICAgLy8gcHJvdG9jb2xzIHRoYXQgbmV2ZXIgaGF2ZSBhIGhvc3RuYW1lLlxuICAgIGhvc3RsZXNzUHJvdG9jb2wgPSB7XG4gICAgICAnamF2YXNjcmlwdCc6IHRydWUsXG4gICAgICAnamF2YXNjcmlwdDonOiB0cnVlXG4gICAgfSxcbiAgICAvLyBwcm90b2NvbHMgdGhhdCBhbHdheXMgY29udGFpbiBhIC8vIGJpdC5cbiAgICBzbGFzaGVkUHJvdG9jb2wgPSB7XG4gICAgICAnaHR0cCc6IHRydWUsXG4gICAgICAnaHR0cHMnOiB0cnVlLFxuICAgICAgJ2Z0cCc6IHRydWUsXG4gICAgICAnZ29waGVyJzogdHJ1ZSxcbiAgICAgICdmaWxlJzogdHJ1ZSxcbiAgICAgICdodHRwOic6IHRydWUsXG4gICAgICAnaHR0cHM6JzogdHJ1ZSxcbiAgICAgICdmdHA6JzogdHJ1ZSxcbiAgICAgICdnb3BoZXI6JzogdHJ1ZSxcbiAgICAgICdmaWxlOic6IHRydWVcbiAgICB9O1xuICAgIC8qIGVzbGludC1lbmFibGUgbm8tc2NyaXB0LXVybCAqL1xuXG5mdW5jdGlvbiB1cmxQYXJzZSh1cmwsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIGlmICh1cmwgJiYgdXJsIGluc3RhbmNlb2YgVXJsKSB7IHJldHVybiB1cmw7IH1cblxuICB2YXIgdSA9IG5ldyBVcmwoKTtcbiAgdS5wYXJzZSh1cmwsIHNsYXNoZXNEZW5vdGVIb3N0KTtcbiAgcmV0dXJuIHU7XG59XG5cblVybC5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbih1cmwsIHNsYXNoZXNEZW5vdGVIb3N0KSB7XG4gIHZhciBpLCBsLCBsb3dlclByb3RvLCBoZWMsIHNsYXNoZXMsXG4gICAgICByZXN0ID0gdXJsO1xuXG4gIC8vIHRyaW0gYmVmb3JlIHByb2NlZWRpbmcuXG4gIC8vIFRoaXMgaXMgdG8gc3VwcG9ydCBwYXJzZSBzdHVmZiBsaWtlIFwiICBodHRwOi8vZm9vLmNvbSAgXFxuXCJcbiAgcmVzdCA9IHJlc3QudHJpbSgpO1xuXG4gIGlmICghc2xhc2hlc0Rlbm90ZUhvc3QgJiYgdXJsLnNwbGl0KCcjJykubGVuZ3RoID09PSAxKSB7XG4gICAgLy8gVHJ5IGZhc3QgcGF0aCByZWdleHBcbiAgICB2YXIgc2ltcGxlUGF0aCA9IHNpbXBsZVBhdGhQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gICAgaWYgKHNpbXBsZVBhdGgpIHtcbiAgICAgIHRoaXMucGF0aG5hbWUgPSBzaW1wbGVQYXRoWzFdO1xuICAgICAgaWYgKHNpbXBsZVBhdGhbMl0pIHtcbiAgICAgICAgdGhpcy5zZWFyY2ggPSBzaW1wbGVQYXRoWzJdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgdmFyIHByb3RvID0gcHJvdG9jb2xQYXR0ZXJuLmV4ZWMocmVzdCk7XG4gIGlmIChwcm90bykge1xuICAgIHByb3RvID0gcHJvdG9bMF07XG4gICAgbG93ZXJQcm90byA9IHByb3RvLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5wcm90b2NvbCA9IHByb3RvO1xuICAgIHJlc3QgPSByZXN0LnN1YnN0cihwcm90by5sZW5ndGgpO1xuICB9XG5cbiAgLy8gZmlndXJlIG91dCBpZiBpdCdzIGdvdCBhIGhvc3RcbiAgLy8gdXNlckBzZXJ2ZXIgaXMgKmFsd2F5cyogaW50ZXJwcmV0ZWQgYXMgYSBob3N0bmFtZSwgYW5kIHVybFxuICAvLyByZXNvbHV0aW9uIHdpbGwgdHJlYXQgLy9mb28vYmFyIGFzIGhvc3Q9Zm9vLHBhdGg9YmFyIGJlY2F1c2UgdGhhdCdzXG4gIC8vIGhvdyB0aGUgYnJvd3NlciByZXNvbHZlcyByZWxhdGl2ZSBVUkxzLlxuICBpZiAoc2xhc2hlc0Rlbm90ZUhvc3QgfHwgcHJvdG8gfHwgcmVzdC5tYXRjaCgvXlxcL1xcL1teQFxcL10rQFteQFxcL10rLykpIHtcbiAgICBzbGFzaGVzID0gcmVzdC5zdWJzdHIoMCwgMikgPT09ICcvLyc7XG4gICAgaWYgKHNsYXNoZXMgJiYgIShwcm90byAmJiBob3N0bGVzc1Byb3RvY29sW3Byb3RvXSkpIHtcbiAgICAgIHJlc3QgPSByZXN0LnN1YnN0cigyKTtcbiAgICAgIHRoaXMuc2xhc2hlcyA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFob3N0bGVzc1Byb3RvY29sW3Byb3RvXSAmJlxuICAgICAgKHNsYXNoZXMgfHwgKHByb3RvICYmICFzbGFzaGVkUHJvdG9jb2xbcHJvdG9dKSkpIHtcblxuICAgIC8vIHRoZXJlJ3MgYSBob3N0bmFtZS5cbiAgICAvLyB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgLywgPywgOywgb3IgIyBlbmRzIHRoZSBob3N0LlxuICAgIC8vXG4gICAgLy8gSWYgdGhlcmUgaXMgYW4gQCBpbiB0aGUgaG9zdG5hbWUsIHRoZW4gbm9uLWhvc3QgY2hhcnMgKmFyZSogYWxsb3dlZFxuICAgIC8vIHRvIHRoZSBsZWZ0IG9mIHRoZSBsYXN0IEAgc2lnbiwgdW5sZXNzIHNvbWUgaG9zdC1lbmRpbmcgY2hhcmFjdGVyXG4gICAgLy8gY29tZXMgKmJlZm9yZSogdGhlIEAtc2lnbi5cbiAgICAvLyBVUkxzIGFyZSBvYm5veGlvdXMuXG4gICAgLy9cbiAgICAvLyBleDpcbiAgICAvLyBodHRwOi8vYUBiQGMvID0+IHVzZXI6YUBiIGhvc3Q6Y1xuICAgIC8vIGh0dHA6Ly9hQGI/QGMgPT4gdXNlcjphIGhvc3Q6YyBwYXRoOi8/QGNcblxuICAgIC8vIHYwLjEyIFRPRE8oaXNhYWNzKTogVGhpcyBpcyBub3QgcXVpdGUgaG93IENocm9tZSBkb2VzIHRoaW5ncy5cbiAgICAvLyBSZXZpZXcgb3VyIHRlc3QgY2FzZSBhZ2FpbnN0IGJyb3dzZXJzIG1vcmUgY29tcHJlaGVuc2l2ZWx5LlxuXG4gICAgLy8gZmluZCB0aGUgZmlyc3QgaW5zdGFuY2Ugb2YgYW55IGhvc3RFbmRpbmdDaGFyc1xuICAgIHZhciBob3N0RW5kID0gLTE7XG4gICAgZm9yIChpID0gMDsgaSA8IGhvc3RFbmRpbmdDaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgaGVjID0gcmVzdC5pbmRleE9mKGhvc3RFbmRpbmdDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpIHtcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhdCB0aGlzIHBvaW50LCBlaXRoZXIgd2UgaGF2ZSBhbiBleHBsaWNpdCBwb2ludCB3aGVyZSB0aGVcbiAgICAvLyBhdXRoIHBvcnRpb24gY2Fubm90IGdvIHBhc3QsIG9yIHRoZSBsYXN0IEAgY2hhciBpcyB0aGUgZGVjaWRlci5cbiAgICB2YXIgYXV0aCwgYXRTaWduO1xuICAgIGlmIChob3N0RW5kID09PSAtMSkge1xuICAgICAgLy8gYXRTaWduIGNhbiBiZSBhbnl3aGVyZS5cbiAgICAgIGF0U2lnbiA9IHJlc3QubGFzdEluZGV4T2YoJ0AnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYXRTaWduIG11c3QgYmUgaW4gYXV0aCBwb3J0aW9uLlxuICAgICAgLy8gaHR0cDovL2FAYi9jQGQgPT4gaG9zdDpiIGF1dGg6YSBwYXRoOi9jQGRcbiAgICAgIGF0U2lnbiA9IHJlc3QubGFzdEluZGV4T2YoJ0AnLCBob3N0RW5kKTtcbiAgICB9XG5cbiAgICAvLyBOb3cgd2UgaGF2ZSBhIHBvcnRpb24gd2hpY2ggaXMgZGVmaW5pdGVseSB0aGUgYXV0aC5cbiAgICAvLyBQdWxsIHRoYXQgb2ZmLlxuICAgIGlmIChhdFNpZ24gIT09IC0xKSB7XG4gICAgICBhdXRoID0gcmVzdC5zbGljZSgwLCBhdFNpZ24pO1xuICAgICAgcmVzdCA9IHJlc3Quc2xpY2UoYXRTaWduICsgMSk7XG4gICAgICB0aGlzLmF1dGggPSBhdXRoO1xuICAgIH1cblxuICAgIC8vIHRoZSBob3N0IGlzIHRoZSByZW1haW5pbmcgdG8gdGhlIGxlZnQgb2YgdGhlIGZpcnN0IG5vbi1ob3N0IGNoYXJcbiAgICBob3N0RW5kID0gLTE7XG4gICAgZm9yIChpID0gMDsgaSA8IG5vbkhvc3RDaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgaGVjID0gcmVzdC5pbmRleE9mKG5vbkhvc3RDaGFyc1tpXSk7XG4gICAgICBpZiAoaGVjICE9PSAtMSAmJiAoaG9zdEVuZCA9PT0gLTEgfHwgaGVjIDwgaG9zdEVuZCkpIHtcbiAgICAgICAgaG9zdEVuZCA9IGhlYztcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBub3QgaGl0IGl0LCB0aGVuIHRoZSBlbnRpcmUgdGhpbmcgaXMgYSBob3N0LlxuICAgIGlmIChob3N0RW5kID09PSAtMSkge1xuICAgICAgaG9zdEVuZCA9IHJlc3QubGVuZ3RoO1xuICAgIH1cblxuICAgIGlmIChyZXN0W2hvc3RFbmQgLSAxXSA9PT0gJzonKSB7IGhvc3RFbmQtLTsgfVxuICAgIHZhciBob3N0ID0gcmVzdC5zbGljZSgwLCBob3N0RW5kKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZShob3N0RW5kKTtcblxuICAgIC8vIHB1bGwgb3V0IHBvcnQuXG4gICAgdGhpcy5wYXJzZUhvc3QoaG9zdCk7XG5cbiAgICAvLyB3ZSd2ZSBpbmRpY2F0ZWQgdGhhdCB0aGVyZSBpcyBhIGhvc3RuYW1lLFxuICAgIC8vIHNvIGV2ZW4gaWYgaXQncyBlbXB0eSwgaXQgaGFzIHRvIGJlIHByZXNlbnQuXG4gICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuaG9zdG5hbWUgfHwgJyc7XG5cbiAgICAvLyBpZiBob3N0bmFtZSBiZWdpbnMgd2l0aCBbIGFuZCBlbmRzIHdpdGggXVxuICAgIC8vIGFzc3VtZSB0aGF0IGl0J3MgYW4gSVB2NiBhZGRyZXNzLlxuICAgIHZhciBpcHY2SG9zdG5hbWUgPSB0aGlzLmhvc3RuYW1lWzBdID09PSAnWycgJiZcbiAgICAgICAgdGhpcy5ob3N0bmFtZVt0aGlzLmhvc3RuYW1lLmxlbmd0aCAtIDFdID09PSAnXSc7XG5cbiAgICAvLyB2YWxpZGF0ZSBhIGxpdHRsZS5cbiAgICBpZiAoIWlwdjZIb3N0bmFtZSkge1xuICAgICAgdmFyIGhvc3RwYXJ0cyA9IHRoaXMuaG9zdG5hbWUuc3BsaXQoL1xcLi8pO1xuICAgICAgZm9yIChpID0gMCwgbCA9IGhvc3RwYXJ0cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdmFyIHBhcnQgPSBob3N0cGFydHNbaV07XG4gICAgICAgIGlmICghcGFydCkgeyBjb250aW51ZTsgfVxuICAgICAgICBpZiAoIXBhcnQubWF0Y2goaG9zdG5hbWVQYXJ0UGF0dGVybikpIHtcbiAgICAgICAgICB2YXIgbmV3cGFydCA9ICcnO1xuICAgICAgICAgIGZvciAodmFyIGogPSAwLCBrID0gcGFydC5sZW5ndGg7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChwYXJ0LmNoYXJDb2RlQXQoaikgPiAxMjcpIHtcbiAgICAgICAgICAgICAgLy8gd2UgcmVwbGFjZSBub24tQVNDSUkgY2hhciB3aXRoIGEgdGVtcG9yYXJ5IHBsYWNlaG9sZGVyXG4gICAgICAgICAgICAgIC8vIHdlIG5lZWQgdGhpcyB0byBtYWtlIHN1cmUgc2l6ZSBvZiBob3N0bmFtZSBpcyBub3RcbiAgICAgICAgICAgICAgLy8gYnJva2VuIGJ5IHJlcGxhY2luZyBub24tQVNDSUkgYnkgbm90aGluZ1xuICAgICAgICAgICAgICBuZXdwYXJ0ICs9ICd4JztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIG5ld3BhcnQgKz0gcGFydFtqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gd2UgdGVzdCBhZ2FpbiB3aXRoIEFTQ0lJIGNoYXIgb25seVxuICAgICAgICAgIGlmICghbmV3cGFydC5tYXRjaChob3N0bmFtZVBhcnRQYXR0ZXJuKSkge1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFydHMgPSBob3N0cGFydHMuc2xpY2UoMCwgaSk7XG4gICAgICAgICAgICB2YXIgbm90SG9zdCA9IGhvc3RwYXJ0cy5zbGljZShpICsgMSk7XG4gICAgICAgICAgICB2YXIgYml0ID0gcGFydC5tYXRjaChob3N0bmFtZVBhcnRTdGFydCk7XG4gICAgICAgICAgICBpZiAoYml0KSB7XG4gICAgICAgICAgICAgIHZhbGlkUGFydHMucHVzaChiaXRbMV0pO1xuICAgICAgICAgICAgICBub3RIb3N0LnVuc2hpZnQoYml0WzJdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChub3RIb3N0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICByZXN0ID0gbm90SG9zdC5qb2luKCcuJykgKyByZXN0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHZhbGlkUGFydHMuam9pbignLicpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaG9zdG5hbWUubGVuZ3RoID4gaG9zdG5hbWVNYXhMZW4pIHtcbiAgICAgIHRoaXMuaG9zdG5hbWUgPSAnJztcbiAgICB9XG5cbiAgICAvLyBzdHJpcCBbIGFuZCBdIGZyb20gdGhlIGhvc3RuYW1lXG4gICAgLy8gdGhlIGhvc3QgZmllbGQgc3RpbGwgcmV0YWlucyB0aGVtLCB0aG91Z2hcbiAgICBpZiAoaXB2Nkhvc3RuYW1lKSB7XG4gICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS5zdWJzdHIoMSwgdGhpcy5ob3N0bmFtZS5sZW5ndGggLSAyKTtcbiAgICB9XG4gIH1cblxuICAvLyBjaG9wIG9mZiBmcm9tIHRoZSB0YWlsIGZpcnN0LlxuICB2YXIgaGFzaCA9IHJlc3QuaW5kZXhPZignIycpO1xuICBpZiAoaGFzaCAhPT0gLTEpIHtcbiAgICAvLyBnb3QgYSBmcmFnbWVudCBzdHJpbmcuXG4gICAgdGhpcy5oYXNoID0gcmVzdC5zdWJzdHIoaGFzaCk7XG4gICAgcmVzdCA9IHJlc3Quc2xpY2UoMCwgaGFzaCk7XG4gIH1cbiAgdmFyIHFtID0gcmVzdC5pbmRleE9mKCc/Jyk7XG4gIGlmIChxbSAhPT0gLTEpIHtcbiAgICB0aGlzLnNlYXJjaCA9IHJlc3Quc3Vic3RyKHFtKTtcbiAgICByZXN0ID0gcmVzdC5zbGljZSgwLCBxbSk7XG4gIH1cbiAgaWYgKHJlc3QpIHsgdGhpcy5wYXRobmFtZSA9IHJlc3Q7IH1cbiAgaWYgKHNsYXNoZWRQcm90b2NvbFtsb3dlclByb3RvXSAmJlxuICAgICAgdGhpcy5ob3N0bmFtZSAmJiAhdGhpcy5wYXRobmFtZSkge1xuICAgIHRoaXMucGF0aG5hbWUgPSAnJztcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuVXJsLnByb3RvdHlwZS5wYXJzZUhvc3QgPSBmdW5jdGlvbihob3N0KSB7XG4gIHZhciBwb3J0ID0gcG9ydFBhdHRlcm4uZXhlYyhob3N0KTtcbiAgaWYgKHBvcnQpIHtcbiAgICBwb3J0ID0gcG9ydFswXTtcbiAgICBpZiAocG9ydCAhPT0gJzonKSB7XG4gICAgICB0aGlzLnBvcnQgPSBwb3J0LnN1YnN0cigxKTtcbiAgICB9XG4gICAgaG9zdCA9IGhvc3Quc3Vic3RyKDAsIGhvc3QubGVuZ3RoIC0gcG9ydC5sZW5ndGgpO1xuICB9XG4gIGlmIChob3N0KSB7IHRoaXMuaG9zdG5hbWUgPSBob3N0OyB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHVybFBhcnNlO1xuIiwibW9kdWxlLmV4cG9ydHM9L1tcXDAtXFx4MUZcXHg3Ri1cXHg5Rl0vIiwibW9kdWxlLmV4cG9ydHM9L1tcXHhBRFxcdTA2MDAtXFx1MDYwNVxcdTA2MUNcXHUwNkREXFx1MDcwRlxcdTA4RTJcXHUxODBFXFx1MjAwQi1cXHUyMDBGXFx1MjAyQS1cXHUyMDJFXFx1MjA2MC1cXHUyMDY0XFx1MjA2Ni1cXHUyMDZGXFx1RkVGRlxcdUZGRjktXFx1RkZGQl18XFx1RDgwNFtcXHVEQ0JEXFx1RENDRF18XFx1RDgyRltcXHVEQ0EwLVxcdURDQTNdfFxcdUQ4MzRbXFx1REQ3My1cXHVERDdBXXxcXHVEQjQwW1xcdURDMDFcXHVEQzIwLVxcdURDN0ZdLyIsIm1vZHVsZS5leHBvcnRzPS9bIS0jJS1cXCosLVxcLzo7XFw/QFxcWy1cXF1fXFx7XFx9XFx4QTFcXHhBN1xceEFCXFx4QjZcXHhCN1xceEJCXFx4QkZcXHUwMzdFXFx1MDM4N1xcdTA1NUEtXFx1MDU1RlxcdTA1ODlcXHUwNThBXFx1MDVCRVxcdTA1QzBcXHUwNUMzXFx1MDVDNlxcdTA1RjNcXHUwNUY0XFx1MDYwOVxcdTA2MEFcXHUwNjBDXFx1MDYwRFxcdTA2MUJcXHUwNjFFXFx1MDYxRlxcdTA2NkEtXFx1MDY2RFxcdTA2RDRcXHUwNzAwLVxcdTA3MERcXHUwN0Y3LVxcdTA3RjlcXHUwODMwLVxcdTA4M0VcXHUwODVFXFx1MDk2NFxcdTA5NjVcXHUwOTcwXFx1MDlGRFxcdTBBNzZcXHUwQUYwXFx1MEM4NFxcdTBERjRcXHUwRTRGXFx1MEU1QVxcdTBFNUJcXHUwRjA0LVxcdTBGMTJcXHUwRjE0XFx1MEYzQS1cXHUwRjNEXFx1MEY4NVxcdTBGRDAtXFx1MEZENFxcdTBGRDlcXHUwRkRBXFx1MTA0QS1cXHUxMDRGXFx1MTBGQlxcdTEzNjAtXFx1MTM2OFxcdTE0MDBcXHUxNjZEXFx1MTY2RVxcdTE2OUJcXHUxNjlDXFx1MTZFQi1cXHUxNkVEXFx1MTczNVxcdTE3MzZcXHUxN0Q0LVxcdTE3RDZcXHUxN0Q4LVxcdTE3REFcXHUxODAwLVxcdTE4MEFcXHUxOTQ0XFx1MTk0NVxcdTFBMUVcXHUxQTFGXFx1MUFBMC1cXHUxQUE2XFx1MUFBOC1cXHUxQUFEXFx1MUI1QS1cXHUxQjYwXFx1MUJGQy1cXHUxQkZGXFx1MUMzQi1cXHUxQzNGXFx1MUM3RVxcdTFDN0ZcXHUxQ0MwLVxcdTFDQzdcXHUxQ0QzXFx1MjAxMC1cXHUyMDI3XFx1MjAzMC1cXHUyMDQzXFx1MjA0NS1cXHUyMDUxXFx1MjA1My1cXHUyMDVFXFx1MjA3RFxcdTIwN0VcXHUyMDhEXFx1MjA4RVxcdTIzMDgtXFx1MjMwQlxcdTIzMjlcXHUyMzJBXFx1Mjc2OC1cXHUyNzc1XFx1MjdDNVxcdTI3QzZcXHUyN0U2LVxcdTI3RUZcXHUyOTgzLVxcdTI5OThcXHUyOUQ4LVxcdTI5REJcXHUyOUZDXFx1MjlGRFxcdTJDRjktXFx1MkNGQ1xcdTJDRkVcXHUyQ0ZGXFx1MkQ3MFxcdTJFMDAtXFx1MkUyRVxcdTJFMzAtXFx1MkU0RVxcdTMwMDEtXFx1MzAwM1xcdTMwMDgtXFx1MzAxMVxcdTMwMTQtXFx1MzAxRlxcdTMwMzBcXHUzMDNEXFx1MzBBMFxcdTMwRkJcXHVBNEZFXFx1QTRGRlxcdUE2MEQtXFx1QTYwRlxcdUE2NzNcXHVBNjdFXFx1QTZGMi1cXHVBNkY3XFx1QTg3NC1cXHVBODc3XFx1QThDRVxcdUE4Q0ZcXHVBOEY4LVxcdUE4RkFcXHVBOEZDXFx1QTkyRVxcdUE5MkZcXHVBOTVGXFx1QTlDMS1cXHVBOUNEXFx1QTlERVxcdUE5REZcXHVBQTVDLVxcdUFBNUZcXHVBQURFXFx1QUFERlxcdUFBRjBcXHVBQUYxXFx1QUJFQlxcdUZEM0VcXHVGRDNGXFx1RkUxMC1cXHVGRTE5XFx1RkUzMC1cXHVGRTUyXFx1RkU1NC1cXHVGRTYxXFx1RkU2M1xcdUZFNjhcXHVGRTZBXFx1RkU2QlxcdUZGMDEtXFx1RkYwM1xcdUZGMDUtXFx1RkYwQVxcdUZGMEMtXFx1RkYwRlxcdUZGMUFcXHVGRjFCXFx1RkYxRlxcdUZGMjBcXHVGRjNCLVxcdUZGM0RcXHVGRjNGXFx1RkY1QlxcdUZGNURcXHVGRjVGLVxcdUZGNjVdfFxcdUQ4MDBbXFx1REQwMC1cXHVERDAyXFx1REY5RlxcdURGRDBdfFxcdUQ4MDFcXHVERDZGfFxcdUQ4MDJbXFx1REM1N1xcdUREMUZcXHVERDNGXFx1REU1MC1cXHVERTU4XFx1REU3RlxcdURFRjAtXFx1REVGNlxcdURGMzktXFx1REYzRlxcdURGOTktXFx1REY5Q118XFx1RDgwM1tcXHVERjU1LVxcdURGNTldfFxcdUQ4MDRbXFx1REM0Ny1cXHVEQzREXFx1RENCQlxcdURDQkNcXHVEQ0JFLVxcdURDQzFcXHVERDQwLVxcdURENDNcXHVERDc0XFx1REQ3NVxcdUREQzUtXFx1RERDOFxcdUREQ0RcXHVERERCXFx1RERERC1cXHVERERGXFx1REUzOC1cXHVERTNEXFx1REVBOV18XFx1RDgwNVtcXHVEQzRCLVxcdURDNEZcXHVEQzVCXFx1REM1RFxcdURDQzZcXHVEREMxLVxcdURERDdcXHVERTQxLVxcdURFNDNcXHVERTYwLVxcdURFNkNcXHVERjNDLVxcdURGM0VdfFxcdUQ4MDZbXFx1REMzQlxcdURFM0YtXFx1REU0NlxcdURFOUEtXFx1REU5Q1xcdURFOUUtXFx1REVBMl18XFx1RDgwN1tcXHVEQzQxLVxcdURDNDVcXHVEQzcwXFx1REM3MVxcdURFRjdcXHVERUY4XXxcXHVEODA5W1xcdURDNzAtXFx1REM3NF18XFx1RDgxQVtcXHVERTZFXFx1REU2RlxcdURFRjVcXHVERjM3LVxcdURGM0JcXHVERjQ0XXxcXHVEODFCW1xcdURFOTctXFx1REU5QV18XFx1RDgyRlxcdURDOUZ8XFx1RDgzNltcXHVERTg3LVxcdURFOEJdfFxcdUQ4M0FbXFx1REQ1RVxcdURENUZdLyIsIm1vZHVsZS5leHBvcnRzPS9bIFxceEEwXFx1MTY4MFxcdTIwMDAtXFx1MjAwQVxcdTIwMjhcXHUyMDI5XFx1MjAyRlxcdTIwNUZcXHUzMDAwXS8iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydHMuQW55ID0gcmVxdWlyZSgnLi9wcm9wZXJ0aWVzL0FueS9yZWdleCcpO1xuZXhwb3J0cy5DYyAgPSByZXF1aXJlKCcuL2NhdGVnb3JpZXMvQ2MvcmVnZXgnKTtcbmV4cG9ydHMuQ2YgID0gcmVxdWlyZSgnLi9jYXRlZ29yaWVzL0NmL3JlZ2V4Jyk7XG5leHBvcnRzLlAgICA9IHJlcXVpcmUoJy4vY2F0ZWdvcmllcy9QL3JlZ2V4Jyk7XG5leHBvcnRzLlogICA9IHJlcXVpcmUoJy4vY2F0ZWdvcmllcy9aL3JlZ2V4Jyk7XG4iLCJtb2R1bGUuZXhwb3J0cz0vW1xcMC1cXHVEN0ZGXFx1RTAwMC1cXHVGRkZGXXxbXFx1RDgwMC1cXHVEQkZGXVtcXHVEQzAwLVxcdURGRkZdfFtcXHVEODAwLVxcdURCRkZdKD8hW1xcdURDMDAtXFx1REZGRl0pfCg/OlteXFx1RDgwMC1cXHVEQkZGXXxeKVtcXHVEQzAwLVxcdURGRkZdLyIsIm1vZHVsZS5leHBvcnRzPXtcbiAgXCJuYW1lXCI6IFwiY2hhdC1lbmdpbmUtbWFya2Rvd25cIixcbiAgXCJhdXRob3JcIjogXCJJYW4gSmVubmluZ3NcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMC4wLjlcIixcbiAgXCJtYWluXCI6IFwic3JjL3BsdWdpbi5qc1wiLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJjaGF0LWVuZ2luZVwiOiBcIl4wLjkuMjFcIixcbiAgICBcImRvdHR5XCI6IFwiMC4wLjJcIixcbiAgICBcIm1hcmtkb3duLWl0XCI6IFwiXjguNC4wXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiY2hhaVwiOiBcIl4zLjUuMFwiLFxuICAgIFwibW9jaGFcIjogXCJeNi4wLjJcIlxuICB9XG59XG4iLCIvKipcbiogUmVuZGVycyBtYXJrZG93biBmcm9tIHRoZSBgYGBtZXNzYWdlYGBgIGV2ZW50LlxuKiBAbW9kdWxlIGNoYXQtZW5naW5lLW1hcmtkb3duXG4qIEByZXF1aXJlcyB7QGxpbmsgQ2hhdEVuZ2luZX1cbiogQHJlcXVpcmVzIHtAbGluayBzbmFya2Rvd259XG4qIEByZXF1aXJlcyB7QGxpbmsgZG90dHl9XG4qL1xuY29uc3QgbWFya2Rvd24gPSByZXF1aXJlKCdtYXJrZG93bi1pdCcpKHtcbiAgICBsaW5raWZ5OiB0cnVlXG59KTtcbmNvbnN0IGRvdHR5ID0gcmVxdWlyZSgnZG90dHknKTtcblxuLyoqXG4qIEBmdW5jdGlvblxuKiBAZXhhbXBsZVxuKiBjaGF0LnBsdWdpbihDaGF0RW5naW5lQ29yZS5wbHVnaW5bJ2NoYXQtZW5naW5lLW1hcmtkb3duJ10oKSk7XG5cbiogY2hhdC5vbignbWVzc2FnZScsIChwYXlsb2FkKSA9PiB7XG4qICAgIGNvbnNvbGUubG9nKHBheWxvYWQuZGF0YS50ZXh0KTtcbiogfSk7XG4qXG4qIGNoYXQuZW1pdCgnbWVzc2FnZScsIHtcbiogICAgdGV4dDogJ1RoaXMgaXMgc29tZSAqbWFya2Rvd24qICoqZm9yIHN1cmUqKi4nXG4qIH0pO1xuKiAvLyAnVGhpcyBpcyBzb21lIDxlbT5tYXJrZG93bjwvZW0+IDxzdHJvbmc+Zm9yIHN1cmU8L3N0cm9uZz4uXG4qXG4qIEBwYXJhbSB7T2JqZWN0fSBbY29uZmlnXSBUaGUgY29uZmlnIG9iamVjdFxuKiBAcGFyYW0ge1N0cmluZ30gW2V2ZW50PVwibWVzc2FnZVwiXSBUaGUgQ2hhdEVuZ2luZSBldmVudCB3aGVyZSBtYXJrZG93biB3aWxsIGJlIHBhcnNlZFxuKiBAcGFyYW0ge1N0cmluZ30gW3Byb3A9XCJkYXRhLnRleHRcIl0gVGhlIGV2ZW50IHByb3BlcnR5IHZhbHVlIHdoZXJlIG1hcmtkb3duIHNob3VsZCBiZSBwYXJzZWQuXG4qL1xubW9kdWxlLmV4cG9ydHMgPSAoY29uZmlnID0ge30pID0+IHtcblxuICAgIGNvbmZpZy5wcm9wID0gY29uZmlnLnByb3AgfHwgJ2RhdGEudGV4dCc7XG4gICAgY29uZmlnLmV2ZW50ID0gY29uZmlnLmV2ZW50IHx8ICdtZXNzYWdlJ1xuXG4gICAgbGV0IHBhcnNlTWFya2Rvd24gPSBmdW5jdGlvbihwYXlsb2FkLCBuZXh0KSB7XG5cbiAgICAgICAgbGV0IHRleHQgPSBkb3R0eS5nZXQocGF5bG9hZCwgY29uZmlnLnByb3ApO1xuXG4gICAgICAgIGlmKHRleHQpIHtcbiAgICAgICAgICAgIGRvdHR5LnB1dChwYXlsb2FkLCBjb25maWcucHJvcCwgbWFya2Rvd24ucmVuZGVyKHRleHQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnRpbnVlIGFsb25nIG1pZGRsZXdhcmVcbiAgICAgICAgbmV4dChudWxsLCBwYXlsb2FkKTtcblxuICAgIH07XG5cbiAgICAvLyBkZWZpbmUgYm90aCB0aGUgZXh0ZW5kZWQgbWV0aG9kcyBhbmQgdGhlIG1pZGRsZXdhcmUgaW4gb3VyIHBsdWdpblxuICAgIGxldCByZXN1bHQgPSB7XG4gICAgICAgIG5hbWVzcGFjZTogJ21hcmtkb3duJyxcbiAgICAgICAgbWlkZGxld2FyZToge1xuICAgICAgICAgICAgb246IHt9XG4gICAgICAgIH0sXG4gICAgfTtcblxuXG4gICAgcmVzdWx0Lm1pZGRsZXdhcmUub25bY29uZmlnLmV2ZW50XSA9IHBhcnNlTWFya2Rvd247XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuXG59XG4iLCIvKiEgaHR0cHM6Ly9tdGhzLmJlL3B1bnljb2RlIHYxLjQuMSBieSBAbWF0aGlhcyAqL1xuOyhmdW5jdGlvbihyb290KSB7XG5cblx0LyoqIERldGVjdCBmcmVlIHZhcmlhYmxlcyAqL1xuXHR2YXIgZnJlZUV4cG9ydHMgPSB0eXBlb2YgZXhwb3J0cyA9PSAnb2JqZWN0JyAmJiBleHBvcnRzICYmXG5cdFx0IWV4cG9ydHMubm9kZVR5cGUgJiYgZXhwb3J0cztcblx0dmFyIGZyZWVNb2R1bGUgPSB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJlxuXHRcdCFtb2R1bGUubm9kZVR5cGUgJiYgbW9kdWxlO1xuXHR2YXIgZnJlZUdsb2JhbCA9IHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsO1xuXHRpZiAoXG5cdFx0ZnJlZUdsb2JhbC5nbG9iYWwgPT09IGZyZWVHbG9iYWwgfHxcblx0XHRmcmVlR2xvYmFsLndpbmRvdyA9PT0gZnJlZUdsb2JhbCB8fFxuXHRcdGZyZWVHbG9iYWwuc2VsZiA9PT0gZnJlZUdsb2JhbFxuXHQpIHtcblx0XHRyb290ID0gZnJlZUdsb2JhbDtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGUgYHB1bnljb2RlYCBvYmplY3QuXG5cdCAqIEBuYW1lIHB1bnljb2RlXG5cdCAqIEB0eXBlIE9iamVjdFxuXHQgKi9cblx0dmFyIHB1bnljb2RlLFxuXG5cdC8qKiBIaWdoZXN0IHBvc2l0aXZlIHNpZ25lZCAzMi1iaXQgZmxvYXQgdmFsdWUgKi9cblx0bWF4SW50ID0gMjE0NzQ4MzY0NywgLy8gYWthLiAweDdGRkZGRkZGIG9yIDJeMzEtMVxuXG5cdC8qKiBCb290c3RyaW5nIHBhcmFtZXRlcnMgKi9cblx0YmFzZSA9IDM2LFxuXHR0TWluID0gMSxcblx0dE1heCA9IDI2LFxuXHRza2V3ID0gMzgsXG5cdGRhbXAgPSA3MDAsXG5cdGluaXRpYWxCaWFzID0gNzIsXG5cdGluaXRpYWxOID0gMTI4LCAvLyAweDgwXG5cdGRlbGltaXRlciA9ICctJywgLy8gJ1xceDJEJ1xuXG5cdC8qKiBSZWd1bGFyIGV4cHJlc3Npb25zICovXG5cdHJlZ2V4UHVueWNvZGUgPSAvXnhuLS0vLFxuXHRyZWdleE5vbkFTQ0lJID0gL1teXFx4MjAtXFx4N0VdLywgLy8gdW5wcmludGFibGUgQVNDSUkgY2hhcnMgKyBub24tQVNDSUkgY2hhcnNcblx0cmVnZXhTZXBhcmF0b3JzID0gL1tcXHgyRVxcdTMwMDJcXHVGRjBFXFx1RkY2MV0vZywgLy8gUkZDIDM0OTAgc2VwYXJhdG9yc1xuXG5cdC8qKiBFcnJvciBtZXNzYWdlcyAqL1xuXHRlcnJvcnMgPSB7XG5cdFx0J292ZXJmbG93JzogJ092ZXJmbG93OiBpbnB1dCBuZWVkcyB3aWRlciBpbnRlZ2VycyB0byBwcm9jZXNzJyxcblx0XHQnbm90LWJhc2ljJzogJ0lsbGVnYWwgaW5wdXQgPj0gMHg4MCAobm90IGEgYmFzaWMgY29kZSBwb2ludCknLFxuXHRcdCdpbnZhbGlkLWlucHV0JzogJ0ludmFsaWQgaW5wdXQnXG5cdH0sXG5cblx0LyoqIENvbnZlbmllbmNlIHNob3J0Y3V0cyAqL1xuXHRiYXNlTWludXNUTWluID0gYmFzZSAtIHRNaW4sXG5cdGZsb29yID0gTWF0aC5mbG9vcixcblx0c3RyaW5nRnJvbUNoYXJDb2RlID0gU3RyaW5nLmZyb21DaGFyQ29kZSxcblxuXHQvKiogVGVtcG9yYXJ5IHZhcmlhYmxlICovXG5cdGtleTtcblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKipcblx0ICogQSBnZW5lcmljIGVycm9yIHV0aWxpdHkgZnVuY3Rpb24uXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBlcnJvciB0eXBlLlxuXHQgKiBAcmV0dXJucyB7RXJyb3J9IFRocm93cyBhIGBSYW5nZUVycm9yYCB3aXRoIHRoZSBhcHBsaWNhYmxlIGVycm9yIG1lc3NhZ2UuXG5cdCAqL1xuXHRmdW5jdGlvbiBlcnJvcih0eXBlKSB7XG5cdFx0dGhyb3cgbmV3IFJhbmdlRXJyb3IoZXJyb3JzW3R5cGVdKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBBIGdlbmVyaWMgYEFycmF5I21hcGAgdXRpbGl0eSBmdW5jdGlvbi5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGl0ZXJhdGUgb3Zlci5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5IGFycmF5XG5cdCAqIGl0ZW0uXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gQSBuZXcgYXJyYXkgb2YgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBjYWxsYmFjayBmdW5jdGlvbi5cblx0ICovXG5cdGZ1bmN0aW9uIG1hcChhcnJheSwgZm4pIHtcblx0XHR2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuXHRcdHZhciByZXN1bHQgPSBbXTtcblx0XHR3aGlsZSAobGVuZ3RoLS0pIHtcblx0XHRcdHJlc3VsdFtsZW5ndGhdID0gZm4oYXJyYXlbbGVuZ3RoXSk7XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHQvKipcblx0ICogQSBzaW1wbGUgYEFycmF5I21hcGAtbGlrZSB3cmFwcGVyIHRvIHdvcmsgd2l0aCBkb21haW4gbmFtZSBzdHJpbmdzIG9yIGVtYWlsXG5cdCAqIGFkZHJlc3Nlcy5cblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGRvbWFpbiBUaGUgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcy5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgZm9yIGV2ZXJ5XG5cdCAqIGNoYXJhY3Rlci5cblx0ICogQHJldHVybnMge0FycmF5fSBBIG5ldyBzdHJpbmcgb2YgY2hhcmFjdGVycyByZXR1cm5lZCBieSB0aGUgY2FsbGJhY2tcblx0ICogZnVuY3Rpb24uXG5cdCAqL1xuXHRmdW5jdGlvbiBtYXBEb21haW4oc3RyaW5nLCBmbikge1xuXHRcdHZhciBwYXJ0cyA9IHN0cmluZy5zcGxpdCgnQCcpO1xuXHRcdHZhciByZXN1bHQgPSAnJztcblx0XHRpZiAocGFydHMubGVuZ3RoID4gMSkge1xuXHRcdFx0Ly8gSW4gZW1haWwgYWRkcmVzc2VzLCBvbmx5IHRoZSBkb21haW4gbmFtZSBzaG91bGQgYmUgcHVueWNvZGVkLiBMZWF2ZVxuXHRcdFx0Ly8gdGhlIGxvY2FsIHBhcnQgKGkuZS4gZXZlcnl0aGluZyB1cCB0byBgQGApIGludGFjdC5cblx0XHRcdHJlc3VsdCA9IHBhcnRzWzBdICsgJ0AnO1xuXHRcdFx0c3RyaW5nID0gcGFydHNbMV07XG5cdFx0fVxuXHRcdC8vIEF2b2lkIGBzcGxpdChyZWdleClgIGZvciBJRTggY29tcGF0aWJpbGl0eS4gU2VlICMxNy5cblx0XHRzdHJpbmcgPSBzdHJpbmcucmVwbGFjZShyZWdleFNlcGFyYXRvcnMsICdcXHgyRScpO1xuXHRcdHZhciBsYWJlbHMgPSBzdHJpbmcuc3BsaXQoJy4nKTtcblx0XHR2YXIgZW5jb2RlZCA9IG1hcChsYWJlbHMsIGZuKS5qb2luKCcuJyk7XG5cdFx0cmV0dXJuIHJlc3VsdCArIGVuY29kZWQ7XG5cdH1cblxuXHQvKipcblx0ICogQ3JlYXRlcyBhbiBhcnJheSBjb250YWluaW5nIHRoZSBudW1lcmljIGNvZGUgcG9pbnRzIG9mIGVhY2ggVW5pY29kZVxuXHQgKiBjaGFyYWN0ZXIgaW4gdGhlIHN0cmluZy4gV2hpbGUgSmF2YVNjcmlwdCB1c2VzIFVDUy0yIGludGVybmFsbHksXG5cdCAqIHRoaXMgZnVuY3Rpb24gd2lsbCBjb252ZXJ0IGEgcGFpciBvZiBzdXJyb2dhdGUgaGFsdmVzIChlYWNoIG9mIHdoaWNoXG5cdCAqIFVDUy0yIGV4cG9zZXMgYXMgc2VwYXJhdGUgY2hhcmFjdGVycykgaW50byBhIHNpbmdsZSBjb2RlIHBvaW50LFxuXHQgKiBtYXRjaGluZyBVVEYtMTYuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZW5jb2RlYFxuXHQgKiBAc2VlIDxodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1lbmNvZGluZz5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlLnVjczJcblx0ICogQG5hbWUgZGVjb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgVGhlIFVuaWNvZGUgaW5wdXQgc3RyaW5nIChVQ1MtMikuXG5cdCAqIEByZXR1cm5zIHtBcnJheX0gVGhlIG5ldyBhcnJheSBvZiBjb2RlIHBvaW50cy5cblx0ICovXG5cdGZ1bmN0aW9uIHVjczJkZWNvZGUoc3RyaW5nKSB7XG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBjb3VudGVyID0gMCxcblx0XHQgICAgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aCxcblx0XHQgICAgdmFsdWUsXG5cdFx0ICAgIGV4dHJhO1xuXHRcdHdoaWxlIChjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHR2YWx1ZSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XG5cdFx0XHRcdC8vIGhpZ2ggc3Vycm9nYXRlLCBhbmQgdGhlcmUgaXMgYSBuZXh0IGNoYXJhY3RlclxuXHRcdFx0XHRleHRyYSA9IHN0cmluZy5jaGFyQ29kZUF0KGNvdW50ZXIrKyk7XG5cdFx0XHRcdGlmICgoZXh0cmEgJiAweEZDMDApID09IDB4REMwMCkgeyAvLyBsb3cgc3Vycm9nYXRlXG5cdFx0XHRcdFx0b3V0cHV0LnB1c2goKCh2YWx1ZSAmIDB4M0ZGKSA8PCAxMCkgKyAoZXh0cmEgJiAweDNGRikgKyAweDEwMDAwKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyB1bm1hdGNoZWQgc3Vycm9nYXRlOyBvbmx5IGFwcGVuZCB0aGlzIGNvZGUgdW5pdCwgaW4gY2FzZSB0aGUgbmV4dFxuXHRcdFx0XHRcdC8vIGNvZGUgdW5pdCBpcyB0aGUgaGlnaCBzdXJyb2dhdGUgb2YgYSBzdXJyb2dhdGUgcGFpclxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0XHRjb3VudGVyLS07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dDtcblx0fVxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIGEgc3RyaW5nIGJhc2VkIG9uIGFuIGFycmF5IG9mIG51bWVyaWMgY29kZSBwb2ludHMuXG5cdCAqIEBzZWUgYHB1bnljb2RlLnVjczIuZGVjb2RlYFxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGUudWNzMlxuXHQgKiBAbmFtZSBlbmNvZGVcblx0ICogQHBhcmFtIHtBcnJheX0gY29kZVBvaW50cyBUaGUgYXJyYXkgb2YgbnVtZXJpYyBjb2RlIHBvaW50cy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIG5ldyBVbmljb2RlIHN0cmluZyAoVUNTLTIpLlxuXHQgKi9cblx0ZnVuY3Rpb24gdWNzMmVuY29kZShhcnJheSkge1xuXHRcdHJldHVybiBtYXAoYXJyYXksIGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHR2YXIgb3V0cHV0ID0gJyc7XG5cdFx0XHRpZiAodmFsdWUgPiAweEZGRkYpIHtcblx0XHRcdFx0dmFsdWUgLT0gMHgxMDAwMDtcblx0XHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMCk7XG5cdFx0XHRcdHZhbHVlID0gMHhEQzAwIHwgdmFsdWUgJiAweDNGRjtcblx0XHRcdH1cblx0XHRcdG91dHB1dCArPSBzdHJpbmdGcm9tQ2hhckNvZGUodmFsdWUpO1xuXHRcdFx0cmV0dXJuIG91dHB1dDtcblx0XHR9KS5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIGJhc2ljIGNvZGUgcG9pbnQgaW50byBhIGRpZ2l0L2ludGVnZXIuXG5cdCAqIEBzZWUgYGRpZ2l0VG9CYXNpYygpYFxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlcn0gY29kZVBvaW50IFRoZSBiYXNpYyBudW1lcmljIGNvZGUgcG9pbnQgdmFsdWUuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBudW1lcmljIHZhbHVlIG9mIGEgYmFzaWMgY29kZSBwb2ludCAoZm9yIHVzZSBpblxuXHQgKiByZXByZXNlbnRpbmcgaW50ZWdlcnMpIGluIHRoZSByYW5nZSBgMGAgdG8gYGJhc2UgLSAxYCwgb3IgYGJhc2VgIGlmXG5cdCAqIHRoZSBjb2RlIHBvaW50IGRvZXMgbm90IHJlcHJlc2VudCBhIHZhbHVlLlxuXHQgKi9cblx0ZnVuY3Rpb24gYmFzaWNUb0RpZ2l0KGNvZGVQb2ludCkge1xuXHRcdGlmIChjb2RlUG9pbnQgLSA0OCA8IDEwKSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gMjI7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA2NSA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gNjU7XG5cdFx0fVxuXHRcdGlmIChjb2RlUG9pbnQgLSA5NyA8IDI2KSB7XG5cdFx0XHRyZXR1cm4gY29kZVBvaW50IC0gOTc7XG5cdFx0fVxuXHRcdHJldHVybiBiYXNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgZGlnaXQvaW50ZWdlciBpbnRvIGEgYmFzaWMgY29kZSBwb2ludC5cblx0ICogQHNlZSBgYmFzaWNUb0RpZ2l0KClgXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBkaWdpdCBUaGUgbnVtZXJpYyB2YWx1ZSBvZiBhIGJhc2ljIGNvZGUgcG9pbnQuXG5cdCAqIEByZXR1cm5zIHtOdW1iZXJ9IFRoZSBiYXNpYyBjb2RlIHBvaW50IHdob3NlIHZhbHVlICh3aGVuIHVzZWQgZm9yXG5cdCAqIHJlcHJlc2VudGluZyBpbnRlZ2VycykgaXMgYGRpZ2l0YCwgd2hpY2ggbmVlZHMgdG8gYmUgaW4gdGhlIHJhbmdlXG5cdCAqIGAwYCB0byBgYmFzZSAtIDFgLiBJZiBgZmxhZ2AgaXMgbm9uLXplcm8sIHRoZSB1cHBlcmNhc2UgZm9ybSBpc1xuXHQgKiB1c2VkOyBlbHNlLCB0aGUgbG93ZXJjYXNlIGZvcm0gaXMgdXNlZC4gVGhlIGJlaGF2aW9yIGlzIHVuZGVmaW5lZFxuXHQgKiBpZiBgZmxhZ2AgaXMgbm9uLXplcm8gYW5kIGBkaWdpdGAgaGFzIG5vIHVwcGVyY2FzZSBmb3JtLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGlnaXRUb0Jhc2ljKGRpZ2l0LCBmbGFnKSB7XG5cdFx0Ly8gIDAuLjI1IG1hcCB0byBBU0NJSSBhLi56IG9yIEEuLlpcblx0XHQvLyAyNi4uMzUgbWFwIHRvIEFTQ0lJIDAuLjlcblx0XHRyZXR1cm4gZGlnaXQgKyAyMiArIDc1ICogKGRpZ2l0IDwgMjYpIC0gKChmbGFnICE9IDApIDw8IDUpO1xuXHR9XG5cblx0LyoqXG5cdCAqIEJpYXMgYWRhcHRhdGlvbiBmdW5jdGlvbiBhcyBwZXIgc2VjdGlvbiAzLjQgb2YgUkZDIDM0OTIuXG5cdCAqIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNDkyI3NlY3Rpb24tMy40XG5cdCAqIEBwcml2YXRlXG5cdCAqL1xuXHRmdW5jdGlvbiBhZGFwdChkZWx0YSwgbnVtUG9pbnRzLCBmaXJzdFRpbWUpIHtcblx0XHR2YXIgayA9IDA7XG5cdFx0ZGVsdGEgPSBmaXJzdFRpbWUgPyBmbG9vcihkZWx0YSAvIGRhbXApIDogZGVsdGEgPj4gMTtcblx0XHRkZWx0YSArPSBmbG9vcihkZWx0YSAvIG51bVBvaW50cyk7XG5cdFx0Zm9yICgvKiBubyBpbml0aWFsaXphdGlvbiAqLzsgZGVsdGEgPiBiYXNlTWludXNUTWluICogdE1heCA+PiAxOyBrICs9IGJhc2UpIHtcblx0XHRcdGRlbHRhID0gZmxvb3IoZGVsdGEgLyBiYXNlTWludXNUTWluKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZsb29yKGsgKyAoYmFzZU1pbnVzVE1pbiArIDEpICogZGVsdGEgLyAoZGVsdGEgKyBza2V3KSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBQdW55Y29kZSBzdHJpbmcgb2YgQVNDSUktb25seSBzeW1ib2xzIHRvIGEgc3RyaW5nIG9mIFVuaWNvZGVcblx0ICogc3ltYm9scy5cblx0ICogQG1lbWJlck9mIHB1bnljb2RlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBUaGUgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIHJlc3VsdGluZyBzdHJpbmcgb2YgVW5pY29kZSBzeW1ib2xzLlxuXHQgKi9cblx0ZnVuY3Rpb24gZGVjb2RlKGlucHV0KSB7XG5cdFx0Ly8gRG9uJ3QgdXNlIFVDUy0yXG5cdFx0dmFyIG91dHB1dCA9IFtdLFxuXHRcdCAgICBpbnB1dExlbmd0aCA9IGlucHV0Lmxlbmd0aCxcblx0XHQgICAgb3V0LFxuXHRcdCAgICBpID0gMCxcblx0XHQgICAgbiA9IGluaXRpYWxOLFxuXHRcdCAgICBiaWFzID0gaW5pdGlhbEJpYXMsXG5cdFx0ICAgIGJhc2ljLFxuXHRcdCAgICBqLFxuXHRcdCAgICBpbmRleCxcblx0XHQgICAgb2xkaSxcblx0XHQgICAgdyxcblx0XHQgICAgayxcblx0XHQgICAgZGlnaXQsXG5cdFx0ICAgIHQsXG5cdFx0ICAgIC8qKiBDYWNoZWQgY2FsY3VsYXRpb24gcmVzdWx0cyAqL1xuXHRcdCAgICBiYXNlTWludXNUO1xuXG5cdFx0Ly8gSGFuZGxlIHRoZSBiYXNpYyBjb2RlIHBvaW50czogbGV0IGBiYXNpY2AgYmUgdGhlIG51bWJlciBvZiBpbnB1dCBjb2RlXG5cdFx0Ly8gcG9pbnRzIGJlZm9yZSB0aGUgbGFzdCBkZWxpbWl0ZXIsIG9yIGAwYCBpZiB0aGVyZSBpcyBub25lLCB0aGVuIGNvcHlcblx0XHQvLyB0aGUgZmlyc3QgYmFzaWMgY29kZSBwb2ludHMgdG8gdGhlIG91dHB1dC5cblxuXHRcdGJhc2ljID0gaW5wdXQubGFzdEluZGV4T2YoZGVsaW1pdGVyKTtcblx0XHRpZiAoYmFzaWMgPCAwKSB7XG5cdFx0XHRiYXNpYyA9IDA7XG5cdFx0fVxuXG5cdFx0Zm9yIChqID0gMDsgaiA8IGJhc2ljOyArK2opIHtcblx0XHRcdC8vIGlmIGl0J3Mgbm90IGEgYmFzaWMgY29kZSBwb2ludFxuXHRcdFx0aWYgKGlucHV0LmNoYXJDb2RlQXQoaikgPj0gMHg4MCkge1xuXHRcdFx0XHRlcnJvcignbm90LWJhc2ljJyk7XG5cdFx0XHR9XG5cdFx0XHRvdXRwdXQucHVzaChpbnB1dC5jaGFyQ29kZUF0KGopKTtcblx0XHR9XG5cblx0XHQvLyBNYWluIGRlY29kaW5nIGxvb3A6IHN0YXJ0IGp1c3QgYWZ0ZXIgdGhlIGxhc3QgZGVsaW1pdGVyIGlmIGFueSBiYXNpYyBjb2RlXG5cdFx0Ly8gcG9pbnRzIHdlcmUgY29waWVkOyBzdGFydCBhdCB0aGUgYmVnaW5uaW5nIG90aGVyd2lzZS5cblxuXHRcdGZvciAoaW5kZXggPSBiYXNpYyA+IDAgPyBiYXNpYyArIDEgOiAwOyBpbmRleCA8IGlucHV0TGVuZ3RoOyAvKiBubyBmaW5hbCBleHByZXNzaW9uICovKSB7XG5cblx0XHRcdC8vIGBpbmRleGAgaXMgdGhlIGluZGV4IG9mIHRoZSBuZXh0IGNoYXJhY3RlciB0byBiZSBjb25zdW1lZC5cblx0XHRcdC8vIERlY29kZSBhIGdlbmVyYWxpemVkIHZhcmlhYmxlLWxlbmd0aCBpbnRlZ2VyIGludG8gYGRlbHRhYCxcblx0XHRcdC8vIHdoaWNoIGdldHMgYWRkZWQgdG8gYGlgLiBUaGUgb3ZlcmZsb3cgY2hlY2tpbmcgaXMgZWFzaWVyXG5cdFx0XHQvLyBpZiB3ZSBpbmNyZWFzZSBgaWAgYXMgd2UgZ28sIHRoZW4gc3VidHJhY3Qgb2ZmIGl0cyBzdGFydGluZ1xuXHRcdFx0Ly8gdmFsdWUgYXQgdGhlIGVuZCB0byBvYnRhaW4gYGRlbHRhYC5cblx0XHRcdGZvciAob2xkaSA9IGksIHcgPSAxLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblxuXHRcdFx0XHRpZiAoaW5kZXggPj0gaW5wdXRMZW5ndGgpIHtcblx0XHRcdFx0XHRlcnJvcignaW52YWxpZC1pbnB1dCcpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZGlnaXQgPSBiYXNpY1RvRGlnaXQoaW5wdXQuY2hhckNvZGVBdChpbmRleCsrKSk7XG5cblx0XHRcdFx0aWYgKGRpZ2l0ID49IGJhc2UgfHwgZGlnaXQgPiBmbG9vcigobWF4SW50IC0gaSkgLyB3KSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aSArPSBkaWdpdCAqIHc7XG5cdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXG5cdFx0XHRcdGlmIChkaWdpdCA8IHQpIHtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGJhc2VNaW51c1QgPSBiYXNlIC0gdDtcblx0XHRcdFx0aWYgKHcgPiBmbG9vcihtYXhJbnQgLyBiYXNlTWludXNUKSkge1xuXHRcdFx0XHRcdGVycm9yKCdvdmVyZmxvdycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dyAqPSBiYXNlTWludXNUO1xuXG5cdFx0XHR9XG5cblx0XHRcdG91dCA9IG91dHB1dC5sZW5ndGggKyAxO1xuXHRcdFx0YmlhcyA9IGFkYXB0KGkgLSBvbGRpLCBvdXQsIG9sZGkgPT0gMCk7XG5cblx0XHRcdC8vIGBpYCB3YXMgc3VwcG9zZWQgdG8gd3JhcCBhcm91bmQgZnJvbSBgb3V0YCB0byBgMGAsXG5cdFx0XHQvLyBpbmNyZW1lbnRpbmcgYG5gIGVhY2ggdGltZSwgc28gd2UnbGwgZml4IHRoYXQgbm93OlxuXHRcdFx0aWYgKGZsb29yKGkgLyBvdXQpID4gbWF4SW50IC0gbikge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0biArPSBmbG9vcihpIC8gb3V0KTtcblx0XHRcdGkgJT0gb3V0O1xuXG5cdFx0XHQvLyBJbnNlcnQgYG5gIGF0IHBvc2l0aW9uIGBpYCBvZiB0aGUgb3V0cHV0XG5cdFx0XHRvdXRwdXQuc3BsaWNlKGkrKywgMCwgbik7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdWNzMmVuY29kZShvdXRwdXQpO1xuXHR9XG5cblx0LyoqXG5cdCAqIENvbnZlcnRzIGEgc3RyaW5nIG9mIFVuaWNvZGUgc3ltYm9scyAoZS5nLiBhIGRvbWFpbiBuYW1lIGxhYmVsKSB0byBhXG5cdCAqIFB1bnljb2RlIHN0cmluZyBvZiBBU0NJSS1vbmx5IHN5bWJvbHMuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIHN0cmluZyBvZiBVbmljb2RlIHN5bWJvbHMuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSByZXN1bHRpbmcgUHVueWNvZGUgc3RyaW5nIG9mIEFTQ0lJLW9ubHkgc3ltYm9scy5cblx0ICovXG5cdGZ1bmN0aW9uIGVuY29kZShpbnB1dCkge1xuXHRcdHZhciBuLFxuXHRcdCAgICBkZWx0YSxcblx0XHQgICAgaGFuZGxlZENQQ291bnQsXG5cdFx0ICAgIGJhc2ljTGVuZ3RoLFxuXHRcdCAgICBiaWFzLFxuXHRcdCAgICBqLFxuXHRcdCAgICBtLFxuXHRcdCAgICBxLFxuXHRcdCAgICBrLFxuXHRcdCAgICB0LFxuXHRcdCAgICBjdXJyZW50VmFsdWUsXG5cdFx0ICAgIG91dHB1dCA9IFtdLFxuXHRcdCAgICAvKiogYGlucHV0TGVuZ3RoYCB3aWxsIGhvbGQgdGhlIG51bWJlciBvZiBjb2RlIHBvaW50cyBpbiBgaW5wdXRgLiAqL1xuXHRcdCAgICBpbnB1dExlbmd0aCxcblx0XHQgICAgLyoqIENhY2hlZCBjYWxjdWxhdGlvbiByZXN1bHRzICovXG5cdFx0ICAgIGhhbmRsZWRDUENvdW50UGx1c09uZSxcblx0XHQgICAgYmFzZU1pbnVzVCxcblx0XHQgICAgcU1pbnVzVDtcblxuXHRcdC8vIENvbnZlcnQgdGhlIGlucHV0IGluIFVDUy0yIHRvIFVuaWNvZGVcblx0XHRpbnB1dCA9IHVjczJkZWNvZGUoaW5wdXQpO1xuXG5cdFx0Ly8gQ2FjaGUgdGhlIGxlbmd0aFxuXHRcdGlucHV0TGVuZ3RoID0gaW5wdXQubGVuZ3RoO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSB0aGUgc3RhdGVcblx0XHRuID0gaW5pdGlhbE47XG5cdFx0ZGVsdGEgPSAwO1xuXHRcdGJpYXMgPSBpbml0aWFsQmlhcztcblxuXHRcdC8vIEhhbmRsZSB0aGUgYmFzaWMgY29kZSBwb2ludHNcblx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0Y3VycmVudFZhbHVlID0gaW5wdXRbal07XG5cdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgMHg4MCkge1xuXHRcdFx0XHRvdXRwdXQucHVzaChzdHJpbmdGcm9tQ2hhckNvZGUoY3VycmVudFZhbHVlKSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aGFuZGxlZENQQ291bnQgPSBiYXNpY0xlbmd0aCA9IG91dHB1dC5sZW5ndGg7XG5cblx0XHQvLyBgaGFuZGxlZENQQ291bnRgIGlzIHRoZSBudW1iZXIgb2YgY29kZSBwb2ludHMgdGhhdCBoYXZlIGJlZW4gaGFuZGxlZDtcblx0XHQvLyBgYmFzaWNMZW5ndGhgIGlzIHRoZSBudW1iZXIgb2YgYmFzaWMgY29kZSBwb2ludHMuXG5cblx0XHQvLyBGaW5pc2ggdGhlIGJhc2ljIHN0cmluZyAtIGlmIGl0IGlzIG5vdCBlbXB0eSAtIHdpdGggYSBkZWxpbWl0ZXJcblx0XHRpZiAoYmFzaWNMZW5ndGgpIHtcblx0XHRcdG91dHB1dC5wdXNoKGRlbGltaXRlcik7XG5cdFx0fVxuXG5cdFx0Ly8gTWFpbiBlbmNvZGluZyBsb29wOlxuXHRcdHdoaWxlIChoYW5kbGVkQ1BDb3VudCA8IGlucHV0TGVuZ3RoKSB7XG5cblx0XHRcdC8vIEFsbCBub24tYmFzaWMgY29kZSBwb2ludHMgPCBuIGhhdmUgYmVlbiBoYW5kbGVkIGFscmVhZHkuIEZpbmQgdGhlIG5leHRcblx0XHRcdC8vIGxhcmdlciBvbmU6XG5cdFx0XHRmb3IgKG0gPSBtYXhJbnQsIGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWYWx1ZSA+PSBuICYmIGN1cnJlbnRWYWx1ZSA8IG0pIHtcblx0XHRcdFx0XHRtID0gY3VycmVudFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vIEluY3JlYXNlIGBkZWx0YWAgZW5vdWdoIHRvIGFkdmFuY2UgdGhlIGRlY29kZXIncyA8bixpPiBzdGF0ZSB0byA8bSwwPixcblx0XHRcdC8vIGJ1dCBndWFyZCBhZ2FpbnN0IG92ZXJmbG93XG5cdFx0XHRoYW5kbGVkQ1BDb3VudFBsdXNPbmUgPSBoYW5kbGVkQ1BDb3VudCArIDE7XG5cdFx0XHRpZiAobSAtIG4gPiBmbG9vcigobWF4SW50IC0gZGVsdGEpIC8gaGFuZGxlZENQQ291bnRQbHVzT25lKSkge1xuXHRcdFx0XHRlcnJvcignb3ZlcmZsb3cnKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVsdGEgKz0gKG0gLSBuKSAqIGhhbmRsZWRDUENvdW50UGx1c09uZTtcblx0XHRcdG4gPSBtO1xuXG5cdFx0XHRmb3IgKGogPSAwOyBqIDwgaW5wdXRMZW5ndGg7ICsraikge1xuXHRcdFx0XHRjdXJyZW50VmFsdWUgPSBpbnB1dFtqXTtcblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlIDwgbiAmJiArK2RlbHRhID4gbWF4SW50KSB7XG5cdFx0XHRcdFx0ZXJyb3IoJ292ZXJmbG93Jyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoY3VycmVudFZhbHVlID09IG4pIHtcblx0XHRcdFx0XHQvLyBSZXByZXNlbnQgZGVsdGEgYXMgYSBnZW5lcmFsaXplZCB2YXJpYWJsZS1sZW5ndGggaW50ZWdlclxuXHRcdFx0XHRcdGZvciAocSA9IGRlbHRhLCBrID0gYmFzZTsgLyogbm8gY29uZGl0aW9uICovOyBrICs9IGJhc2UpIHtcblx0XHRcdFx0XHRcdHQgPSBrIDw9IGJpYXMgPyB0TWluIDogKGsgPj0gYmlhcyArIHRNYXggPyB0TWF4IDogayAtIGJpYXMpO1xuXHRcdFx0XHRcdFx0aWYgKHEgPCB0KSB7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0cU1pbnVzVCA9IHEgLSB0O1xuXHRcdFx0XHRcdFx0YmFzZU1pbnVzVCA9IGJhc2UgLSB0O1xuXHRcdFx0XHRcdFx0b3V0cHV0LnB1c2goXG5cdFx0XHRcdFx0XHRcdHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWModCArIHFNaW51c1QgJSBiYXNlTWludXNULCAwKSlcblx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHRxID0gZmxvb3IocU1pbnVzVCAvIGJhc2VNaW51c1QpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKHN0cmluZ0Zyb21DaGFyQ29kZShkaWdpdFRvQmFzaWMocSwgMCkpKTtcblx0XHRcdFx0XHRiaWFzID0gYWRhcHQoZGVsdGEsIGhhbmRsZWRDUENvdW50UGx1c09uZSwgaGFuZGxlZENQQ291bnQgPT0gYmFzaWNMZW5ndGgpO1xuXHRcdFx0XHRcdGRlbHRhID0gMDtcblx0XHRcdFx0XHQrK2hhbmRsZWRDUENvdW50O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdCsrZGVsdGE7XG5cdFx0XHQrK247XG5cblx0XHR9XG5cdFx0cmV0dXJuIG91dHB1dC5qb2luKCcnKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDb252ZXJ0cyBhIFB1bnljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzXG5cdCAqIHRvIFVuaWNvZGUuIE9ubHkgdGhlIFB1bnljb2RlZCBwYXJ0cyBvZiB0aGUgaW5wdXQgd2lsbCBiZSBjb252ZXJ0ZWQsIGkuZS5cblx0ICogaXQgZG9lc24ndCBtYXR0ZXIgaWYgeW91IGNhbGwgaXQgb24gYSBzdHJpbmcgdGhhdCBoYXMgYWxyZWFkeSBiZWVuXG5cdCAqIGNvbnZlcnRlZCB0byBVbmljb2RlLlxuXHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IFRoZSBQdW55Y29kZWQgZG9tYWluIG5hbWUgb3IgZW1haWwgYWRkcmVzcyB0b1xuXHQgKiBjb252ZXJ0IHRvIFVuaWNvZGUuXG5cdCAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBVbmljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBQdW55Y29kZVxuXHQgKiBzdHJpbmcuXG5cdCAqL1xuXHRmdW5jdGlvbiB0b1VuaWNvZGUoaW5wdXQpIHtcblx0XHRyZXR1cm4gbWFwRG9tYWluKGlucHV0LCBmdW5jdGlvbihzdHJpbmcpIHtcblx0XHRcdHJldHVybiByZWdleFB1bnljb2RlLnRlc3Qoc3RyaW5nKVxuXHRcdFx0XHQ/IGRlY29kZShzdHJpbmcuc2xpY2UoNCkudG9Mb3dlckNhc2UoKSlcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogQ29udmVydHMgYSBVbmljb2RlIHN0cmluZyByZXByZXNlbnRpbmcgYSBkb21haW4gbmFtZSBvciBhbiBlbWFpbCBhZGRyZXNzIHRvXG5cdCAqIFB1bnljb2RlLiBPbmx5IHRoZSBub24tQVNDSUkgcGFydHMgb2YgdGhlIGRvbWFpbiBuYW1lIHdpbGwgYmUgY29udmVydGVkLFxuXHQgKiBpLmUuIGl0IGRvZXNuJ3QgbWF0dGVyIGlmIHlvdSBjYWxsIGl0IHdpdGggYSBkb21haW4gdGhhdCdzIGFscmVhZHkgaW5cblx0ICogQVNDSUkuXG5cdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgVGhlIGRvbWFpbiBuYW1lIG9yIGVtYWlsIGFkZHJlc3MgdG8gY29udmVydCwgYXMgYVxuXHQgKiBVbmljb2RlIHN0cmluZy5cblx0ICogQHJldHVybnMge1N0cmluZ30gVGhlIFB1bnljb2RlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBkb21haW4gbmFtZSBvclxuXHQgKiBlbWFpbCBhZGRyZXNzLlxuXHQgKi9cblx0ZnVuY3Rpb24gdG9BU0NJSShpbnB1dCkge1xuXHRcdHJldHVybiBtYXBEb21haW4oaW5wdXQsIGZ1bmN0aW9uKHN0cmluZykge1xuXHRcdFx0cmV0dXJuIHJlZ2V4Tm9uQVNDSUkudGVzdChzdHJpbmcpXG5cdFx0XHRcdD8gJ3huLS0nICsgZW5jb2RlKHN0cmluZylcblx0XHRcdFx0OiBzdHJpbmc7XG5cdFx0fSk7XG5cdH1cblxuXHQvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cblxuXHQvKiogRGVmaW5lIHRoZSBwdWJsaWMgQVBJICovXG5cdHB1bnljb2RlID0ge1xuXHRcdC8qKlxuXHRcdCAqIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCBQdW55Y29kZS5qcyB2ZXJzaW9uIG51bWJlci5cblx0XHQgKiBAbWVtYmVyT2YgcHVueWNvZGVcblx0XHQgKiBAdHlwZSBTdHJpbmdcblx0XHQgKi9cblx0XHQndmVyc2lvbic6ICcxLjQuMScsXG5cdFx0LyoqXG5cdFx0ICogQW4gb2JqZWN0IG9mIG1ldGhvZHMgdG8gY29udmVydCBmcm9tIEphdmFTY3JpcHQncyBpbnRlcm5hbCBjaGFyYWN0ZXJcblx0XHQgKiByZXByZXNlbnRhdGlvbiAoVUNTLTIpIHRvIFVuaWNvZGUgY29kZSBwb2ludHMsIGFuZCBiYWNrLlxuXHRcdCAqIEBzZWUgPGh0dHBzOi8vbWF0aGlhc2J5bmVucy5iZS9ub3Rlcy9qYXZhc2NyaXB0LWVuY29kaW5nPlxuXHRcdCAqIEBtZW1iZXJPZiBwdW55Y29kZVxuXHRcdCAqIEB0eXBlIE9iamVjdFxuXHRcdCAqL1xuXHRcdCd1Y3MyJzoge1xuXHRcdFx0J2RlY29kZSc6IHVjczJkZWNvZGUsXG5cdFx0XHQnZW5jb2RlJzogdWNzMmVuY29kZVxuXHRcdH0sXG5cdFx0J2RlY29kZSc6IGRlY29kZSxcblx0XHQnZW5jb2RlJzogZW5jb2RlLFxuXHRcdCd0b0FTQ0lJJzogdG9BU0NJSSxcblx0XHQndG9Vbmljb2RlJzogdG9Vbmljb2RlXG5cdH07XG5cblx0LyoqIEV4cG9zZSBgcHVueWNvZGVgICovXG5cdC8vIFNvbWUgQU1EIGJ1aWxkIG9wdGltaXplcnMsIGxpa2Ugci5qcywgY2hlY2sgZm9yIHNwZWNpZmljIGNvbmRpdGlvbiBwYXR0ZXJuc1xuXHQvLyBsaWtlIHRoZSBmb2xsb3dpbmc6XG5cdGlmIChcblx0XHR0eXBlb2YgZGVmaW5lID09ICdmdW5jdGlvbicgJiZcblx0XHR0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJlxuXHRcdGRlZmluZS5hbWRcblx0KSB7XG5cdFx0ZGVmaW5lKCdwdW55Y29kZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHB1bnljb2RlO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKGZyZWVFeHBvcnRzICYmIGZyZWVNb2R1bGUpIHtcblx0XHRpZiAobW9kdWxlLmV4cG9ydHMgPT0gZnJlZUV4cG9ydHMpIHtcblx0XHRcdC8vIGluIE5vZGUuanMsIGlvLmpzLCBvciBSaW5nb0pTIHYwLjguMCtcblx0XHRcdGZyZWVNb2R1bGUuZXhwb3J0cyA9IHB1bnljb2RlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBpbiBOYXJ3aGFsIG9yIFJpbmdvSlMgdjAuNy4wLVxuXHRcdFx0Zm9yIChrZXkgaW4gcHVueWNvZGUpIHtcblx0XHRcdFx0cHVueWNvZGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAoZnJlZUV4cG9ydHNba2V5XSA9IHB1bnljb2RlW2tleV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHQvLyBpbiBSaGlubyBvciBhIHdlYiBicm93c2VyXG5cdFx0cm9vdC5wdW55Y29kZSA9IHB1bnljb2RlO1xuXHR9XG5cbn0odGhpcykpO1xuIl19
