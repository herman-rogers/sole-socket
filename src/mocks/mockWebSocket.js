import Console from '../console/logger';

export const MOCK_SOCKET_STATES = {
  connecting: 0,
  open: 1,
  closing: 2,
  closed: 3,
};

export const MOCK_CHANNEL_STATES = {
  ok: 0,
  error: 1,
};

export class Push {
  constructor(channel, event, payload) {
    this.recHooks = [];
    this.channel = channel;
    this.event = event;
    this.payload = payload;
  }

  receive(status, callback) {
    this.recHooks.push({ status, callback });
    return this;
  }

  send() {
    this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload,
    });
  }
}

export class MockErrorChannel {
}

export class MockChannel {
  constructor(topic, params, socket) {
    this.topic = topic;
    this.params = params;
    this.socket = socket;
    this.bindings = [];
    this.joinPush = new Push();
    this.on = this.on.bind(this);
    this.testState = MOCK_CHANNEL_STATES.ok;
    this.trigger = this.trigger.bind(this);
    this.triggerJoinEvent = this.triggerJoinEvent.bind(this);
    // Mock Push Events
    this.triggerPushEvent = this.triggerPushEvent.bind(this);
    this.push = this.push.bind(this);
    this.mockPushObject = {};
  }

  join() {
    setTimeout(() => {
      this.triggerJoinEvent('ok');
    }, 100);
    return this.joinPush;
  }

  on(event, callback) {
    this.bindings.push({ event, callback });
  }

  // Call this to trigger events from listening
  // to channel events
  trigger(event, payload, ref) {
    this.bindings.filter(bind => bind.event === event)
      .map(bind => bind.callback(payload, ref));
  }

  // Call this to fire mock events from tests
  // pretending to be a server response
  triggerJoinEvent(event) {
    if (!this.joinPush.recHooks || this.joinPush.recHooks.length <= 0) {
      Console.warn('No join receive hooks found, are you testing a channel.join()?');
      return;
    }
    this.joinPush.recHooks.filter(hook => hook.status === event)
      .map(hook => hook.callback('mock event'));
  }

  // Call this from unit tests to mock
  // responses from a server.
  triggerPushEvent(event) {
    if (!this.mockPushObject.recHooks || this.mockPushObject.recHooks.length <= 0) {
      Console.warn('No push receive hooks found, are you testing a channel.push()?');
      return;
    }
    this.mockPushObject.recHooks.filter(hook => hook.status === event)
      .map(hook => hook.callback());
  }

  push(event, payload) {
    const pushEvent = new Push(this, event, payload);
    this.mockPushObject = pushEvent;

    this.mockPushObject.send();
    return this.mockPushObject;
  }
}

export class MockSocket {
  constructor() {
    this.mockChannel = null;
    this.connections = {
      open: [],
      error: [],
    };
    this.sendBuffer = [];
    this.conn = '';
    this.triggerOnOpen = this.triggerOnOpen.bind(this);
    this.connect = this.connect.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.onError = this.onError.bind(this);
    this.channel = this.channel.bind(this);
  }

  connect() {
    setTimeout(() => this.triggerOnOpen(), 100);
  }

  connectionState() {
    switch (this.conn) {
      case MOCK_SOCKET_STATES.connecting:
        return 'connecting';
      case MOCK_SOCKET_STATES.open:
        return 'open';
      case MOCK_SOCKET_STATES.closing:
        return 'closing';
      default:
        return 'closed';
    }
  }

  isConnected() {
    return this.connectionState() === 'open';
  }

  triggerOnOpen() {
    this.conn = MOCK_SOCKET_STATES.open;
    this.connections.open.map(callback => callback());
  }

  onOpen(callback) {
    this.connections.open.push(callback);
  }

  onError(callback) {
    this.connections.error.push(callback);
  }

  disconnect() {
    this.conn = MOCK_SOCKET_STATES.closed;
  }

  channel(topic) {
    this.mockChannel = new MockChannel(topic, {}, this);
    return this.mockChannel;
  }

  push(data) {
    this.sendBuffer.push(data);
  }
}

export class MockSocketConnectionError extends MockSocket {
  constructor() {
    super();
    this.triggerOnError = this.triggerOnError.bind(this);
  }

  connect() {
    setTimeout(() => {
      this.triggerOnError();
    }, 100);
  }

  triggerOnError() {
    this.connections.error.map(callback => callback());
    this.conn = MOCK_SOCKET_STATES.closed;
  }
}

