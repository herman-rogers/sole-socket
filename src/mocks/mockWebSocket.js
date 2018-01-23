export const MOCK_SOCKET_STATES = {
  connecting: 0,
  error: 1,
  connected: 2,
  disconnected: 3,
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
    this.joinPush.recHooks.filter(hook => hook.status === event)
      .map(hook => hook.callback());
  }

  // Call this from unit tests to mock
  // responses from a server.
  triggerPushEvent(event) {
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
    this.testState = MOCK_SOCKET_STATES.connecting;
    this.mockChannel = null;
    this.connections = {
      open: [],
      error: [],
    };
    this.sendBuffer = [];
    this.triggerOnOpen = this.triggerOnOpen.bind(this);
    this.triggerOnError = this.triggerOnError.bind(this);
    this.setupTestState = this.setupTestState.bind(this);
    this.connect = this.connect.bind(this);
    this.onOpen = this.onOpen.bind(this);
    this.onError = this.onError.bind(this);
    this.channel = this.channel.bind(this);
  }

  // Call this to setup the Mock State
  // and fire corresponding actions
  setupTestState(state) {
    this.testState = state;
  }

  triggerOnOpen() {
    this.connections.open.map(callback => callback());
  }

  triggerOnError() {
    this.connections.error.map(callback => callback());
  }

  connect() {
    setTimeout(() => {
      switch (this.testState) {
        case MOCK_SOCKET_STATES.connecting:
          this.testState = MOCK_SOCKET_STATES.connected;
          return this.triggerOnOpen();
        case MOCK_SOCKET_STATES.error:
          return this.triggerOnError();
        default:
          return this.triggerOnOpen();
      }
    }, 100);
  }

  onOpen(callback) {
    this.connections.open.push(callback);
  }

  onError(callback) {
    this.connections.error.push(callback);
  }

  disconnect() {
    this.testState = MOCK_SOCKET_STATES.disconnected;
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
    this.testState = MOCK_SOCKET_STATES.error;
  }
}

export class MockSocketError extends MockSocket {
  constructor() {
    super();
    throw new Error('Socket Failed to Create');
  }
}
