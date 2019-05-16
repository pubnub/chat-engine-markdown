This repository is a part of the [ChatEngine Framework](https://github.com/pubnub/chat-engine).
For more information on building chat applications with PubNub, see our
[Chat Resource Center](http://www.pubnub.com/developers/chat-resource-center/).

# Markdown Plugin for ChatEngine

Adds the ability to render Markdown in a ChatEngine Chat

### Quick Start

0. Have a ChatEngine server running already, instantiate a client and connect it
```js
const ChatEngine = ChatEngineCore.create({
    publishKey: 'pub-key-here',
    subscribeKey: 'sub-key-here'
});

ChatEngine.connect('Username');
ChatEngine.on('$ready', () = { ... });
```

1. Attach this plugin to the channel you want, in this case global
```js
ChatEngine.global.plugin(ChatEngineCore.plugin['chat-engine-markdown']());
```

2. Listen for the message event
```js
ChatEngine.global.on('message', (payload) => {
    console.log(payload.data.text);
});
```
3. Send a message containing Markdown
```js
ChatEngine.global.emit('message', {
    text: 'This is some *markdown* **for sure**.'
});
// This is some <em>markdown</em> <strong>for sure</strong>.
```

## Support

- If you **need help**, have a **general question**, have a **feature request** or to file a **bug**, contact <support@pubnub.com>.
