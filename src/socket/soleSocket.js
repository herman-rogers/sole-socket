import { Socket } from 'phoenix';
import { w3cwebsocket } from 'websocket';

let soleSocketInstance = null;
let socket = null;

export default class SoleSocket {
  constructor(url, params) {
    this.socketData = {
      url,
      params,
    };
    this.channels = [];
    this.socketConnectState = '';
  }

  static instance() {
    return soleSocketInstance;
  }

  static socket() {
    return socket;
  }

  static purgeInstance() {
    if (socket) {
      socket.disconnect();
    }
    soleSocketInstance = undefined;
  }

  static isSingleton() {
    return socket && soleSocketInstance;
  }

  initialize() {
    this.setInstance();
    return this.connectToSocket();
  }

  setInstance() {
    if (SoleSocket.isSingleton()) {
      return;
    }

    const {
      url,
      params,
    } = this.socketData;

    socket = new Socket(url, {
      transport: w3cwebsocket,
      params,
    });

    soleSocketInstance = this;
  }

  connectToSocket() {
    return new Promise((resolve, reject) => {
      let { socketConnectState } = this;

      if (socket.isConnected()) {
        resolve(socketConnectState);
        return;
      }
      socket.connect();

      socket.onOpen(() => {
        socketConnectState = socket.connectionState();
        resolve(socketConnectState);
      });

      socket.onError(() => {
        socketConnectState = socket.connectionState();
        reject(socketConnectState);
      });
    });
  }

  joinChannel(topic) {
    return new Promise((resolve, reject) => {
      if (!SoleSocket.isSingleton()) {
        reject(new Error('Join channel was called before initialize.'));
        return;
      }
      const { channels } = this;
      const channel = socket.channel(topic);

      channel.join()
        .receive('ok', () => {
          const newChannel = {
            key: topic,
            channel,
          };
          channels.push(newChannel);
          resolve(channels);
        })
        .receive('error', (err) => {
          reject(new Error(`failed to join channel ${topic}. Got ${err}`));
        });
    });
  }
}
