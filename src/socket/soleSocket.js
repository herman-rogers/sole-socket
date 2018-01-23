import { Socket } from 'phoenix';
import { w3cwebsocket } from 'websocket';

const SOCKET_STATES = {
  connectSuccess: 'connected to socket',
  connectError: 'failed to connect to socket',
};

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
      socketInstance.connect();

      socketInstance.onOpen(() => {
        this.socketConnectState = SOCKET_STATES.connectSuccess;
        resolve(this.socketConnectState);
      });

      socketInstance.onError(() => {
        this.socketConnectState = SOCKET_STATES.connectError;
        reject(this.socketConnectState);
      });
    });
  }
}
