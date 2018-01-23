import { Socket } from 'phoenix';
import { w3cwebsocket } from 'websocket';

let socketInstance = null;

export default class SoleSocket {
  constructor(url, params) {
    this.socketData = {
      url,
      params,
    };
    this.socketConnectState = '';
  }

  static instance() {
    return socketInstance;
  }

  // TODO: Disconnect from the channels and sockets
  static purgeInstance() {
    socketInstance = null;
  }

  setInstance() {
    if (socketInstance !== null) {
      return;
    }

    const {
      url,
      params,
    } = this.socketData;

    socketInstance = new Socket(url, {
      transport: w3cwebsocket,
      params,
    });
  }

  initialize() {
    this.setInstance();
    return this.connectToSocket();
  }

  connectToSocket() {
    return new Promise((resolve, reject) => {
      if (socketInstance.isConnected()) {
        resolve(this.socketConnectState);
        return;
      }
      socketInstance.connect();

      socketInstance.onOpen(() => {
        this.socketConnectState = socketInstance.connectionState();
        resolve(this.socketConnectState);
      });

      socketInstance.onError(() => {
        this.socketConnectState = socketInstance.connectionState();
        reject(this.socketConnectState);
      });
    });
  }
}
