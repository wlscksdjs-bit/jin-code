type Callback = (data: any) => void;

const subscribers = new Map<string, Set<Callback>>();

export function subscribe(channel: string, callback: Callback) {
  if (!subscribers.has(channel)) {
    subscribers.set(channel, new Set());
  }
  subscribers.get(channel)!.add(callback);
  
  return () => unsubscribe(channel, callback);
}

export function unsubscribe(channel: string, callback?: Callback) {
  if (!callback) {
    subscribers.delete(channel);
    return;
  }
  
  const channelSubscribers = subscribers.get(channel);
  if (channelSubscribers) {
    channelSubscribers.delete(callback);
    if (channelSubscribers.size === 0) {
      subscribers.delete(channel);
    }
  }
}

export function broadcast(channel: string, event: object) {
  const channelSubscribers = subscribers.get(channel);
  if (channelSubscribers) {
    channelSubscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`Error in SSE broadcast for channel ${channel}:`, error);
      }
    });
  }
}
