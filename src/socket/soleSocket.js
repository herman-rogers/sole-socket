import { Socket } from 'phoenix';
import { w3cwebsocket } from 'websocket';
import Console from '../console/logger';

let soleSocketInstance = null;
let socket = null;

export function solesocket() {
  return soleSocketInstance;
}

export function websocketSingleton() {
  return socket;
}

export default class SoleSocket {
  constructor(url, params) {
    this.socketData = {
      url,
      params,
    };
    this.channels = {};
    this.socketConnectState = '';
  }

  static instance() {
    return soleSocketInstance;
  }

  static socket() {
    return socket;
  }

  static purge() {
    if (socket) {
      socket.disconnect();
    }
    soleSocketInstance = undefined;
    socket = undefined;
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
      const { channels } = this;

      if (!SoleSocket.isSingleton()) {
        reject(new Error('Join channel was called before sole socket was initialized.'));
        return;
      }

      if (Object.prototype.hasOwnProperty.call(channels, topic)) {
        resolve(channels);
        return;
      }
      resolve(this.createNewChannel(topic));
    });
  }

  createNewChannel(topic) {
    return new Promise((resolve, reject) => {
      const { channels } = this;
      const channel = socket.channel(topic);

      channel.join()
        .receive('ok', () => {
          channels[topic] = channel;
          resolve(channels);
        })
        .receive('errors', (err) => {
          reject(new Error(`failed to join channel ${topic}. Got ${err}`));
        });
    });
  }

  getChannel(topic) {
    const { channels } = this;
    const channel = channels[topic];
    const error = new Error(`Failed to get channel with topic ${topic}, it does not exist`);

    if (!channel) {
      throw (error);
    }
    return channel;
  }

  subscribeToChannelEvent(topic, event, callback) {
    return new Promise((resolve, reject) => {
      try {
        const channel = this.getChannel(topic);
        const eventExists = channel.bindings.filter(binding => binding.event === event);

        if (eventExists.length > 0) return;
        channel.on(event, callback);

        resolve(`subscribed to ${event} successfully`);
      } catch (e) {
        reject(e);
      }
    });
  }

  sendMessage(topic, event, data) {
    return new Promise((resolve, reject) => {
      try {
        const channel = this.getChannel(topic);

        channel.push(event, data)
          .receive('ok', (response) => {
            resolve(response);
          })
          .receive('error', () => {
            reject(new Error('send message failed'));
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  leaveChannel(topic) {
    const channel = this.channels[topic];

    if (!channel) {
      Console.warn(`channel ${topic} does not exist, cannot leave`);
      return;
    }

    channel.leave();
    delete this.channels[topic];
  }
}
