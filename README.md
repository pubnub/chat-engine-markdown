# Markdown Plugin for Chat Engine

Adds the ability to render Markdown in a ChatEngine Chat

### Quick Start

0. Have ChatEngine instantiated and connected, and have a channel you want to render Markdown in
```js
const ChatEngine = ChatEngineCore.create({
    publishKey: 'pub-key-here',
    subscribeKey: 'sub-key-here'
});

ChatEngine.connect('Username');
ChatEngine.on('$.ready', () => { ... });
```

1. Attach this plugin to the channel you want, in this case global
```js
ChatEngine.global.plugin(ChatEngineCore.plugin['chat-engine-markdown']());
```

2. Send Markdown syntax
```js
ChatEngine.global.emit('message', {
   text: 'This is some *markdown* **for sure**.'
});
```

3. Receive rendered Markdown
```js
ChatEngine.global.on('message', (payload) => {
   console.log(payload.data.text);
   //'This is some <em>markdown</em> <strong>for sure</strong>.'
});
```
