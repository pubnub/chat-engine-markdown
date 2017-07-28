/**
* Renders markdown from the ```message``` event. Looks for ```payload.data.text```.
* @module chat-engine-markdown
*/
const snarkdown = require('snarkdown');
const dotty = require("dotty");

/**
* @function
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

    let parseMarkdown = function(payload, next) {

        let text = dotty.get(payload, config.prop);

        if(text) {
            dotty.put(payload, config.prop, snarkdown(text));
        }

        // continue along middleware
        next(null, payload);

    };

    // define both the extended methods and the middleware in our plugin
    return {
        namespace: 'markdown',
        middleware: {
            on: {
                'message': parseMarkdown,
                '$history.message': parseMarkdown
            }
        },
    }

}
