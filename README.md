# Markdown Plugin for Chat Engine

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

3. Listen for the message event
```js
ChatEngine.global.on('message', (payload) => {
    console.log(payload.data.text);
});
```
2. Send a message containing Markdown
```js
ChatEngine.global.emit('message', {
    text: 'This is some *markdown* **for sure**.'
});
// This is some <em>markdown</em> <strong>for sure</strong>.
```
