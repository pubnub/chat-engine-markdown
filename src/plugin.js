/**
* Renders markdown from the ```message``` event. Looks for ```payload.data.text```.
* @module chat-engine-markdown
*/
const snarkdown = require('snarkdown');
const dotty = require("dotty");

/**
* @function
* @param {Object} [config] The config object
* @param {String} [event="message"] The ChatEngine event where markdown will be parsed
* @param {String} [prop="data.text"] The event property value where markdown should be parsed.
* @example
* pluginchat = new ChatEngine.Chat('markdown-chat');
* pluginchat.plugin(markdown({}));
* pluginchat.on('message', (payload) => {
*
*    // payload.data.text == 'This is some <em>markdown</em> <strong>for sure</strong>.'
*
* });
*
* pluginchat.emit('message', {
*    text: 'This is some *markdown* **for sure**.'
* });
*/
module.exports = (config = {}) => {

    config.prop = config.prop || 'data.text';
    config.event = config.event || 'message'

    let parseMarkdown = function(payload, next) {

        let text = dotty.get(payload, config.prop);

        if(text) {
            dotty.put(payload, config.prop, snarkdown(text));
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
    result.middleware.on['$history.' + config.event] = parseMarkdown;

    return result;

}
