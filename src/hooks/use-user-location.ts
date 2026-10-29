import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Linking } from "react-native";

export type UserLocationStatus =
  | "checking"
  | "needs-permission"
  | "denied"
  | "locating"
  | "ready"
  | "error";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const LAST_KNOWN_MAX_AGE_MS = 15 * 60 * 1000;

export function useUserLocation() {
  const [permission, requestPermission] = Location.useForegroundPermissions();
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const granted = permission?.granted === true;

  useEffect(() => {
    if (!granted) return undefined;

    let cancelled = false;

    async function locate() {
      try {
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
        });
        const position =
          lastKnown ??
          (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));

        if (cancelled) return;
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    locate();

    return () => {
      cancelled = true;
    };
  }, [granted, attempt]);

  function retry() {
    setFailed(false);
    setAttempt((current) => current + 1);
  }

  function openSettings() {
    Linking.openSettings();
  }

  let status: UserLocationStatus;
  if (permission === null) status = "checking";
  else if (!granted) status = permission.canAskAgain ? "needs-permission" : "denied";
  else if (coordinates) status = "ready";
  else if (failed) status = "error";
  else status = "locating";

  return { status, coordinates, requestPermission, retry, openSettings };
}
