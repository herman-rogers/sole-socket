import * as websockets from 'phoenix';
import SoleSocket from './soleSocket';
import Console from '../console/logger';
import {
  MockSocket,
  MockChannel,
} from '../mocks/mockWebSocket';

describe('SoleSocket class', () => {
  const params = { jwt: 'mockToken' };
  const url = 'mockUrl';

  afterEach(() => {
    SoleSocket.purge();
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
      const expectedList = {};
      expectedList[topic] = SoleSocket.socket().mockChannel;

      expect(channelSpy).toHaveBeenCalledTimes(1);
      expect(joinSpy).toHaveBeenCalledTimes(1);
      expect(channelList).toEqual(expectedList);
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
      SoleSocket.purge();

      expect(SoleSocket.instance()).toBeUndefined();
      expect(SoleSocket.socket()).toBeUndefined();
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
          const expectedList = {};
          expectedList[firstTopic] = channelList[firstTopic];
          expectedList[secondTopic] = channelList[secondTopic];

          expect(channelList).toEqual(expectedList);
          expect(joinSpy).toHaveBeenCalledTimes(2);
        }));
  });

  it('should not add the same channel twice', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const joinSpy = jest.spyOn(websockets.Channel.prototype, 'join');
    const topic = 'mock:channelone';
    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.joinChannel(topic)
      .then(() => mockSoleSocket.joinChannel(topic)
        .then((channelList) => {
          expect(Object.keys(channelList).length).toEqual(1);
          expect(joinSpy).toHaveBeenCalledTimes(1);
        }));
  });

  it('should allow you to send a message to a channel', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const pushSpy = jest.spyOn(websockets.Channel.prototype, 'push');
    const topic = 'mock:channelone';
    const data = { message: 'mock message' };
    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.joinChannel(topic)
      .then(() => mockSoleSocket.sendMessage(topic, 'mock_event', data)
        .then(() => {
          expect(pushSpy).toHaveBeenCalledTimes(1);
        }));
  });

  it('should fail to send a message if channel does not exist', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.sendMessage('mock:topic', 'mock_event', {})
      .catch((err) => {
        expect(err.message).toEqual('channel mock:topic does not exist, cannot push');
      });
  });

  it('should leave channels gracefully', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const joinSpy = jest.spyOn(websockets.Channel.prototype, 'join');
    const topic = 'mock:channelone';
    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    return mockSoleSocket.joinChannel(topic)
      .then(() => {
        expect(joinSpy).toHaveBeenCalledTimes(1);
        mockSoleSocket.leaveChannel(topic);

        return mockSoleSocket.joinChannel(topic);
      }).then((channelList) => {
        expect(Object.keys(channelList).length).toEqual(1);
        expect(joinSpy).toHaveBeenCalledTimes(2);
      });
  });

  it('should fail to leave a channel if it does not exist', () => {
    websockets.Socket = MockSocket;
    websockets.Channel = MockChannel;

    const warnSpy = jest.spyOn(Console, 'warn');
    const mockSoleSocket = new SoleSocket(url, params);
    mockSoleSocket.initialize();

    mockSoleSocket.leaveChannel('mock:topic');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
