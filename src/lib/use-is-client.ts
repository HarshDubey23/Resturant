import { useSyncExternalStore } from "react";

/**
 * Returns `true` only after the component has hydrated on the client.
 *
 * Implemented with `useSyncExternalStore` so the rule
 * `react-hooks/set-state-in-effect` is not triggered (no `setState` call is
 * needed inside an effect). The server snapshot is always `false` and the
 * client snapshot is always `true`, which gives us the correct hydration
 * behaviour without any state update on mount.
 */
const emptySubscribe = () => () => {};

export function useIsClient(): boolean {
        return useSyncExternalStore(emptySubscribe, () => true, () => false);
}
