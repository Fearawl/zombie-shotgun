export class EventBus {
  constructor() {
    this.emitter = new Phaser.Events.EventEmitter();
  }

  on(eventName, handler, context) {
    this.emitter.on(eventName, handler, context);
    return this;
  }

  once(eventName, handler, context) {
    this.emitter.once(eventName, handler, context);
    return this;
  }

  off(eventName, handler, context) {
    this.emitter.off(eventName, handler, context);
    return this;
  }

  emit(eventName, payload) {
    this.emitter.emit(eventName, payload);
    return this;
  }

  destroy() {
    this.emitter.removeAllListeners();
  }
}
