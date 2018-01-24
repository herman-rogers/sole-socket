import * as websockets from 'phoenix';
import SoleSocket from './soleSocket';
import {
  MockSocket,
  MockChannel,
} from '../mocks/mockWebSocket';

describe('SoleSocket class', () => {
  const params = { jwt: 'mockToken' };
  const url = 'mockUrl';

  afterEach(() => {
    SoleSocket.purgeInstance();
    jest.restoreAllMocks();
  });

  it('should allow setting the socket url', () => {
    const mockSoleSocket = new SoleSocket(url);
    const mockUrl = mockSoleSocket.socketData.url;

    expect(mockUrl).toEqual(url);
  });

  it('should allow setting socket params', () => {
    const mockSoleSocket = new SoleSocket('', params);
    const mockParams = mockSoleSocket.socketData.params;

    expect(mockParams).toEqual(params);
  });

  it('should initialize the socket instance and be connected', () => {
    websockets.Socket = MockSocket;

    const connectSpy = jest.spyOn(websockets.Socket.prototype, 'connect');
    const onOpenSpy = jest.spyOn(websockets.Socket.prototype, 'onOpen');
    const mockSoleSocket = new SoleSocket(url, params);

    return mockSoleSocket.initialize().then((success) => {
      expect(SoleSocket.instance).not.toBeNull();
      expect(connectSpy).toHaveBeenCalled();
      expect(onOpenSpy).toHaveBeenCalled();
      expect(success).toEqual('open');
    });
  });

  it('should prevent calling socket.connect twice if socket is connected', () => {
    websockets.Socket = MockSocket;

    const connectSpy = jest.spyOn(websockets.Socket.prototype, 'connect');
    const mockSoleSocket = new SoleSocket(url, params);

    return mockSoleSocket.initialize().then(() => {
      expect(connectSpy).toHaveBeenCalledTimes(1);

      return mockSoleSocket.initialize().then(() => {
        expect(connectSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  it('should create only one instance of a socket', () => {
    const mockSoleSocket = new SoleSocket(url);

    // Setup the socket instance
    mockSoleSocket.setInstance();

    const instance = SoleSocket.instance();

    // Setup another instance - should not be set
    mockSoleSocket.setInstance();

    expect(instance).not.toBeNull();
    expect(instance).toEqual(SoleSocket.instance());
  });

  it('should join a new channel', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const channelSpy = jest.spyOn(websockets.Socket.prototype, 'channel');
    const joinSpy = jest.spyOn(websockets.Channel.prototype, 'join');
    const topic = 'mock:channel';
    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.joinChannel(topic).then((channelList) => {
      const channelKeyValue = {
        key: topic,
        channel: SoleSocket.socket().mockChannel,
      };
      expect(channelSpy).toHaveBeenCalledTimes(1);
      expect(joinSpy).toHaveBeenCalledTimes(1);
      expect(channelList).toEqual([channelKeyValue]);
    });
  });

  it('should return an error when joining a channel fails', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.joinChannel('mock:channel').catch((err) => {
      expect(err.message).toEqual('failed to join channel mock:channel. Got mock event');
    });
  });

  it('should purge all singleton information on request', () => {
    websockets.Socket = MockSocket;

    const disconnectSpy = jest.spyOn(websockets.Socket.prototype, 'disconnect');
    const mockSoleSocket = new SoleSocket(url, params);

    return mockSoleSocket.initialize().then(() => {
      SoleSocket.purgeInstance();

      expect(SoleSocket.instance()).toBeUndefined();
      expect(disconnectSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('should be able to join two different channels', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const joinSpy = jest.spyOn(websockets.Channel.prototype, 'join');
    const firstTopic = 'mock:channelone';
    const secondTopic = 'mock:channeltwo';
    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.joinChannel(firstTopic)
      .then(() => mockSoleSocket.joinChannel(secondTopic)
        .then((channelList) => {
          const expectedList = [{
            key: firstTopic,
            channel: channelList[0].channel,
          }, {
            key: secondTopic,
            channel: channelList[1].channel,
          }];
          expect(channelList).toEqual(expectedList);
          expect(joinSpy).toHaveBeenCalledTimes(2);
        }));
  });

  it('should not add the same channel twice', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const topic = 'mock:channelone';
    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.joinChannel(topic)
      .then(() => mockSoleSocket.joinChannel(topic)
        .then((channelList) => {
          console.log(channelList);
          expect(channelList.length).toEqual(1);
        }));
  });
});
