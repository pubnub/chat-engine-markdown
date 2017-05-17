(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {

    const namespace = require('../package.json')['open-chat-framework']['namespace'];
    window.OpenChatFramework.plugin[namespace] = require('../plugin.js');

})();

},{"../package.json":3,"../plugin.js":4}],2:[function(require,module,exports){
function e(e){return e.replace(RegExp("^"+(e.match(/^(\t| )+/)||"")[0],"gm"),"")}function n(e){return(e+"").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function r(a){function c(e){var n=t[e.replace(/\*/g,"_")[1]||""],r=i[i.length-1]==e;return n?n[1]?(i[r?"pop":"push"](e),n[0|r]):n[0]:e}function o(){for(var e="";i.length;)e+=c(i[i.length-1]);return e}var l,g,s,p,u,m=/((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^```(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:\!\[([^\]]*?)\]\(([^\)]+?)\))|(\[)|(\](?:\(([^\)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(\-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,3})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|(  \n\n*|\n{2,}|__|\*\*|[_*])/gm,i=[],h="",f=0,$={};for(a=a.replace(/^\[(.+?)\]:\s*(.+)$/gm,function(e,n,r){return $[n.toLowerCase()]=r,""}).replace(/^\n+|\n+$/g,"");s=m.exec(a);)g=a.substring(f,s.index),f=m.lastIndex,l=s[0],g.match(/[^\\](\\\\)*\\$/)||(s[3]||s[4]?l='<pre class="code '+(s[4]?"poetry":s[2].toLowerCase())+'">'+e(n(s[3]||s[4]).replace(/^\n+|\n+$/g,""))+"</pre>":s[6]?(u=s[6],u.match(/\./)&&(s[5]=s[5].replace(/^\d+/gm,"")),p=r(e(s[5].replace(/^\s*[>*+.-]/gm,""))),">"===u?u="blockquote":(u=u.match(/\./)?"ol":"ul",p=p.replace(/^(.*)(\n|$)/gm,"<li>$1</li>")),l="<"+u+">"+p+"</"+u+">"):s[8]?l='<img src="'+n(s[8])+'" alt="'+n(s[7])+'">':s[10]?(h=h.replace("<a>",'<a href="'+n(s[11]||$[g.toLowerCase()])+'">'),l=o()+"</a>"):s[9]?l="<a>":s[12]||s[14]?(u="h"+(s[14]?s[14].length:"="===s[13][0]?1:2),l="<"+u+">"+r(s[12]||s[15])+"</"+u+">"):s[16]?l="<code>"+n(s[16])+"</code>":(s[17]||s[1])&&(l=c(s[17]||"--"))),h+=g,h+=l;return(h+a.substring(f)+o()).trim()}var t={"":["<em>","</em>"],_:["<strong>","</strong>"],"\n":["<br />"]," ":["<br />"],"-":["<hr />"]};module.exports=r;

},{}],3:[function(require,module,exports){
module.exports={
  "name": "ocf-markdown",
  "version": "0.0.1",
  "main": "./plugin.js",
  "open-chat-framework": {
    "namespace": "markdown"
  },
  "devDependencies": {
    "chai": "^3.5.0",
    "mocha": "^3.3.0"
  },
  "dependencies": {
    "snarkdown": "^1.2.2"
  }
}

},{}],4:[function(require,module,exports){
const snarkdown = require('snarkdown');

module.exports = (config) => {
    
    let parseMarkdown = function(payload, next) {
        
        if(payload.data.text) {
            payload.data.text = snarkdown(payload.data.text);
        }

        // continue along middleware
        next(null, payload);

    };

    // define middleware to run after a message has been received and OCF has processed it
    let broadcast = {
        'message': parseMarkdown,
        '$history.message': parseMarkdown
    };

    // define both the extended methods and the middleware in our plugin
    return {
        middleware: {
            broadcast: broadcast
        },
    }

}

},{"snarkdown":2}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni43LjAvbGliL25vZGVfbW9kdWxlcy9vY2YtcGx1Z2luL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIudG1wL3dyYXAuanMiLCJub2RlX21vZHVsZXMvc25hcmtkb3duL2Rpc3Qvc25hcmtkb3duLmpzIiwicGFja2FnZS5qc29uIiwicGx1Z2luLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uKCkge1xuXG4gICAgY29uc3QgbmFtZXNwYWNlID0gcmVxdWlyZSgnLi4vcGFja2FnZS5qc29uJylbJ29wZW4tY2hhdC1mcmFtZXdvcmsnXVsnbmFtZXNwYWNlJ107XG4gICAgd2luZG93Lk9wZW5DaGF0RnJhbWV3b3JrLnBsdWdpbltuYW1lc3BhY2VdID0gcmVxdWlyZSgnLi4vcGx1Z2luLmpzJyk7XG5cbn0pKCk7XG4iLCJmdW5jdGlvbiBlKGUpe3JldHVybiBlLnJlcGxhY2UoUmVnRXhwKFwiXlwiKyhlLm1hdGNoKC9eKFxcdHwgKSsvKXx8XCJcIilbMF0sXCJnbVwiKSxcIlwiKX1mdW5jdGlvbiBuKGUpe3JldHVybihlK1wiXCIpLnJlcGxhY2UoL1wiL2csXCImcXVvdDtcIikucmVwbGFjZSgvPC9nLFwiJmx0O1wiKS5yZXBsYWNlKC8+L2csXCImZ3Q7XCIpfWZ1bmN0aW9uIHIoYSl7ZnVuY3Rpb24gYyhlKXt2YXIgbj10W2UucmVwbGFjZSgvXFwqL2csXCJfXCIpWzFdfHxcIlwiXSxyPWlbaS5sZW5ndGgtMV09PWU7cmV0dXJuIG4/blsxXT8oaVtyP1wicG9wXCI6XCJwdXNoXCJdKGUpLG5bMHxyXSk6blswXTplfWZ1bmN0aW9uIG8oKXtmb3IodmFyIGU9XCJcIjtpLmxlbmd0aDspZSs9YyhpW2kubGVuZ3RoLTFdKTtyZXR1cm4gZX12YXIgbCxnLHMscCx1LG09LygoPzpefFxcbispKD86XFxuLS0tK3xcXCogXFwqKD86IFxcKikrKVxcbil8KD86XmBgYChcXHcqKVxcbihbXFxzXFxTXSo/KVxcbmBgYCQpfCgoPzooPzpefFxcbispKD86XFx0fCAgezIsfSkuKykrXFxuKil8KCg/Oig/Ol58XFxuKShbPiorLV18XFxkK1xcLilcXHMrLiopKyl8KD86XFwhXFxbKFteXFxdXSo/KVxcXVxcKChbXlxcKV0rPylcXCkpfChcXFspfChcXF0oPzpcXCgoW15cXCldKz8pXFwpKT8pfCg/Oig/Ol58XFxuKykoW15cXHNdLiopXFxuKFxcLXszLH18PXszLH0pKD86XFxuK3wkKSl8KD86KD86XnxcXG4rKSgjezEsM30pXFxzKiguKykoPzpcXG4rfCQpKXwoPzpgKFteYF0uKj8pYCl8KCAgXFxuXFxuKnxcXG57Mix9fF9ffFxcKlxcKnxbXypdKS9nbSxpPVtdLGg9XCJcIixmPTAsJD17fTtmb3IoYT1hLnJlcGxhY2UoL15cXFsoLis/KVxcXTpcXHMqKC4rKSQvZ20sZnVuY3Rpb24oZSxuLHIpe3JldHVybiAkW24udG9Mb3dlckNhc2UoKV09cixcIlwifSkucmVwbGFjZSgvXlxcbit8XFxuKyQvZyxcIlwiKTtzPW0uZXhlYyhhKTspZz1hLnN1YnN0cmluZyhmLHMuaW5kZXgpLGY9bS5sYXN0SW5kZXgsbD1zWzBdLGcubWF0Y2goL1teXFxcXF0oXFxcXFxcXFwpKlxcXFwkLyl8fChzWzNdfHxzWzRdP2w9JzxwcmUgY2xhc3M9XCJjb2RlICcrKHNbNF0/XCJwb2V0cnlcIjpzWzJdLnRvTG93ZXJDYXNlKCkpKydcIj4nK2UobihzWzNdfHxzWzRdKS5yZXBsYWNlKC9eXFxuK3xcXG4rJC9nLFwiXCIpKStcIjwvcHJlPlwiOnNbNl0/KHU9c1s2XSx1Lm1hdGNoKC9cXC4vKSYmKHNbNV09c1s1XS5yZXBsYWNlKC9eXFxkKy9nbSxcIlwiKSkscD1yKGUoc1s1XS5yZXBsYWNlKC9eXFxzKls+KisuLV0vZ20sXCJcIikpKSxcIj5cIj09PXU/dT1cImJsb2NrcXVvdGVcIjoodT11Lm1hdGNoKC9cXC4vKT9cIm9sXCI6XCJ1bFwiLHA9cC5yZXBsYWNlKC9eKC4qKShcXG58JCkvZ20sXCI8bGk+JDE8L2xpPlwiKSksbD1cIjxcIit1K1wiPlwiK3ArXCI8L1wiK3UrXCI+XCIpOnNbOF0/bD0nPGltZyBzcmM9XCInK24oc1s4XSkrJ1wiIGFsdD1cIicrbihzWzddKSsnXCI+JzpzWzEwXT8oaD1oLnJlcGxhY2UoXCI8YT5cIiwnPGEgaHJlZj1cIicrbihzWzExXXx8JFtnLnRvTG93ZXJDYXNlKCldKSsnXCI+JyksbD1vKCkrXCI8L2E+XCIpOnNbOV0/bD1cIjxhPlwiOnNbMTJdfHxzWzE0XT8odT1cImhcIisoc1sxNF0/c1sxNF0ubGVuZ3RoOlwiPVwiPT09c1sxM11bMF0/MToyKSxsPVwiPFwiK3UrXCI+XCIrcihzWzEyXXx8c1sxNV0pK1wiPC9cIit1K1wiPlwiKTpzWzE2XT9sPVwiPGNvZGU+XCIrbihzWzE2XSkrXCI8L2NvZGU+XCI6KHNbMTddfHxzWzFdKSYmKGw9YyhzWzE3XXx8XCItLVwiKSkpLGgrPWcsaCs9bDtyZXR1cm4oaCthLnN1YnN0cmluZyhmKStvKCkpLnRyaW0oKX12YXIgdD17XCJcIjpbXCI8ZW0+XCIsXCI8L2VtPlwiXSxfOltcIjxzdHJvbmc+XCIsXCI8L3N0cm9uZz5cIl0sXCJcXG5cIjpbXCI8YnIgLz5cIl0sXCIgXCI6W1wiPGJyIC8+XCJdLFwiLVwiOltcIjxociAvPlwiXX07bW9kdWxlLmV4cG9ydHM9cjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNuYXJrZG93bi5qcy5tYXAiLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwibmFtZVwiOiBcIm9jZi1tYXJrZG93blwiLFxuICBcInZlcnNpb25cIjogXCIwLjAuMVwiLFxuICBcIm1haW5cIjogXCIuL3BsdWdpbi5qc1wiLFxuICBcIm9wZW4tY2hhdC1mcmFtZXdvcmtcIjoge1xuICAgIFwibmFtZXNwYWNlXCI6IFwibWFya2Rvd25cIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJjaGFpXCI6IFwiXjMuNS4wXCIsXG4gICAgXCJtb2NoYVwiOiBcIl4zLjMuMFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcInNuYXJrZG93blwiOiBcIl4xLjIuMlwiXG4gIH1cbn1cbiIsImNvbnN0IHNuYXJrZG93biA9IHJlcXVpcmUoJ3NuYXJrZG93bicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChjb25maWcpID0+IHtcbiAgICBcbiAgICBsZXQgcGFyc2VNYXJrZG93biA9IGZ1bmN0aW9uKHBheWxvYWQsIG5leHQpIHtcbiAgICAgICAgXG4gICAgICAgIGlmKHBheWxvYWQuZGF0YS50ZXh0KSB7XG4gICAgICAgICAgICBwYXlsb2FkLmRhdGEudGV4dCA9IHNuYXJrZG93bihwYXlsb2FkLmRhdGEudGV4dCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb250aW51ZSBhbG9uZyBtaWRkbGV3YXJlXG4gICAgICAgIG5leHQobnVsbCwgcGF5bG9hZCk7XG5cbiAgICB9O1xuXG4gICAgLy8gZGVmaW5lIG1pZGRsZXdhcmUgdG8gcnVuIGFmdGVyIGEgbWVzc2FnZSBoYXMgYmVlbiByZWNlaXZlZCBhbmQgT0NGIGhhcyBwcm9jZXNzZWQgaXRcbiAgICBsZXQgYnJvYWRjYXN0ID0ge1xuICAgICAgICAnbWVzc2FnZSc6IHBhcnNlTWFya2Rvd24sXG4gICAgICAgICckaGlzdG9yeS5tZXNzYWdlJzogcGFyc2VNYXJrZG93blxuICAgIH07XG5cbiAgICAvLyBkZWZpbmUgYm90aCB0aGUgZXh0ZW5kZWQgbWV0aG9kcyBhbmQgdGhlIG1pZGRsZXdhcmUgaW4gb3VyIHBsdWdpblxuICAgIHJldHVybiB7XG4gICAgICAgIG1pZGRsZXdhcmU6IHtcbiAgICAgICAgICAgIGJyb2FkY2FzdDogYnJvYWRjYXN0XG4gICAgICAgIH0sXG4gICAgfVxuXG59XG4iXX0=
