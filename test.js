
const assert = require('chai').assert;
const markdown = require('./src/plugin.js');

const ChatEngine = require('chat-engine');

let pluginchat;
let CE;

describe('config', function() {

    it('should be configured', function() {

        CE = ChatEngine.create({
            publishKey: 'pub-c-c6303bb2-8bf8-4417-aac7-e83b52237ea6',
            subscribeKey: 'sub-c-67db0e7a-50be-11e7-bf50-02ee2ddab7fe',
        }, {
            endpoint: 'http://localhost:3000/insecure',
            globalChannel: 'test-channel'
        });

        assert.isOk(CE);

    });

});

describe('connect', function() {

    it('should be identified as new user', function(done) {

        CE.connect('robot-tester', {works: true}, 'auth-key');

        CE.on('$.ready', (data) => {

            assert.isObject(data.me);
            done();

        })

    });

});

describe('plugins', function() {

    it('should be created', function() {

        pluginchat = new CE.Chat('pluginchat' + new Date().getTime());

        pluginchat.plugin(markdown({}));

    });

    it('publish and subscribe hooks should be called', function(done) {

        pluginchat.on('$.connected', () => {

            let success = 'This is some <em>markdown</em> <strong>for sure</strong>.';

            pluginchat.on('message', (payload) => {

                assert.isAbove(payload.data.text.indexOf(success), -1);
                done();

            });

            pluginchat.emit('message', {
                text: 'This is some *markdown* **for sure**.'
            });

        });

    });

});
