export class Pickup {
  constructor({ type, value, lifetimeSeconds, blinkStartSecondsRemaining }) {
    this.type = type;
    this.value = value;
    this.lifetimeSeconds = lifetimeSeconds;
    this.blinkStartSecondsRemaining = blinkStartSecondsRemaining;
  }
}
