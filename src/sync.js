// Cross-window state channel.
// The control window (laptop) sends audio features + app state;
// the output window (projector) listens and renders from it.
// Both windows share the same origin, so BroadcastChannel works between them.
const CHANNEL = 'live-visuals';

export function createChannel() {
  const bc = new BroadcastChannel(CHANNEL);
  return {
    send(type, payload) {
      bc.postMessage({ type, payload });
    },
    on(handler) {
      bc.onmessage = (e) => handler(e.data.type, e.data.payload);
    },
    close() {
      bc.close();
    },
  };
}
