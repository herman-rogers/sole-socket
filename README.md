# SoleSocket

SoleSocket is a api wrapper for the pheonix.js websockets implementation. It's main purpose is to be a fool proof way to create a socket and manage multiple channels. SoleSocket guarantees on and only one socket will ever be established

It's main features are to guarantee only one socket will be established (to prevent echos), easy reference to the websocket instance, and the ability to keep track of multiple channels.

## Getting started

To get started you first need to install SoleSocket into your project:

```bash
npm install sole-socket
or
yarn add sole-socket
```

And then you'll need to initialize the socket instance - preferably from your app's index file (or generally anytime before you need to utilize websockets).

```javascript
import { SoleSocket } from 'sole-socket';

const url = 'wss://my.socket.url/socket';

// The second parameter is simply the pheonix param: {} object
const socket = new SoleSocket(socketUrl, { jwt: 'my_token' });

socket.initialize();
```

And that's it! Your pheonix websocket is setup and ready to be used.

### Using SoleSocket in your project

To use SoleSocket throughout your project just import the instance after you've ran ```socket.initialize()```

```javascript
import { solesocket } from 'sole-socket';

solesocket() // returns the instance of the initialized object
```

```solesocket``` contains everything you need to interact directly with your websocket instance. If you need to access the the websocket you can import it with:

```javascript
import { websocketSingleton } from 'sole-socket';

websocketSingleton() // returns the created websocket instance
```

> Using the websocket directly is not recommended as a lot of the functionality provided by SoleSocket cannot be guaranteed if manipulated directly

## API

joinChannel()
---

You can create a new channel by calling ```joinChannel``` with the initialize SoleSocket instance. The convinience here is that joinChannel() will automatically create a new channel instance and attempt to join it. If the channel already exists then the promise will resolve with a list of your current channels.

This method is also a promise and will return a list of all channels created (including your new channel) or respond with an error if creation failed.

```javascript
const topic = 'fake:topic';

solesocket().joinChannel(topic).then((channels) => {
  console.log(channels[topic]) // prints out the 'fake:topic' channel
}).catch((err) => {
  // catches any errors thrown by joining a channel
});
```

sendMessage()
---

Sends a message to the specified channel. Returns a promise.

```javascript
const topic = 'fake:topic';

solesocket().sendMessage(topic, 'event', 'new message!');
```

leaveChannel()
---

Leaves a specified channel and removes it from the channels list.

```javascript
const topic = 'fake:topic';

solesocket().leaveChannel(topic);
```

purge()
---

Disconnects from the socket and removes the singleton reference. Completely resets SoleSocket.

```javascript
solesocket().purge();
```

License
----

MIT
