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
