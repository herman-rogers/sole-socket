import * as websockets from 'phoenix';
import SoleSocket from './soleSocket';
import {
  MockSocket,
} from '../mocks/mockWebSocket';

describe('SoleSocket class', () => {
  const params = { jwt: 'mockToken' };
  const url = 'mockUrl';

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

  it('should setup the socket for use', () => {
    websockets.Socket = MockSocket;

    const connectSpy = jest.spyOn(websockets.Socket.prototype, 'connect');
    const onOpenSpy = jest.spyOn(websockets.Socket.prototype, 'onOpen');
    const mockSoleSocket = new SoleSocket(url, params);

    return mockSoleSocket.initialize().then((success) => {
      expect(SoleSocket.instance).not.toBeNull();
      expect(connectSpy).toHaveBeenCalled();
      expect(onOpenSpy).toHaveBeenCalled();
      expect(success).toEqual('connected to socket');
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
});
