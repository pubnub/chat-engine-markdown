/**
* Renders markdown from the ```message``` event.
* @module chat-engine-markdown
* @requires {@link ChatEngine}
* @requires {@link snarkdown}
* @requires {@link dotty}
*/
const snarkdown = require('snarkdown');
const dotty = require('dotty');

/**
* @function
* @example
* // providing a config is optional
* // the default property is ```data.text``` and the default event is ```message```
* let config = { prop: 'data.text', event: 'message' }
* chat.plugin(ChatEngineCore.plugin['chat-engine-markdown'](config));
* 
* // send markdown syntax
* pluginchat.emit('message', {
*    text: 'This is some *markdown* **for sure**.'
* });
* 
* // receive rendered markdown
* chat.on('message', (payload) => {
*    console.log(payload.data.text);
*    //'This is some <em>markdown</em> <strong>for sure</strong>.'
* });
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
