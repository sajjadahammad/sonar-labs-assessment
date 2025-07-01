import { isIOS } from "@/utils/isIos";
import { useWebSocketNative } from "./use-websocket-native";
import { useWebSocketInternal } from "./use-websocket-internal";

export default function useWebSocket() {

  const native = useWebSocketNative();
  const internal = useWebSocketInternal();

  return isIOS() ? native : internal;
}
