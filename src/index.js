import SoleSocket, {
  solesocket,
  websocketSingleton,
} from './socket/soleSocket';

// Export the SoleSocket class for construction
module.exports.SoleSocket = SoleSocket;

// Export SoleSocket singleton instance
module.exports.solesocket = solesocket;

// Export the websocket singleton instance
module.exports.websocketSingleton = websocketSingleton;
