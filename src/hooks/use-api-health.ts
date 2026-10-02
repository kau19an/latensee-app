import { useEffect, useState } from "react";

import { fetchApiHealth } from "@/services/api/health";
import type { ApiHealthStatus } from "@/types/api";

export function useApiHealth() {
  const [status, setStatus] = useState<ApiHealthStatus>("checking");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchApiHealth(controller.signal)
      .then(() => setStatus("active"))
      .catch(() => {
        if (!controller.signal.aborted) setStatus("unavailable");
      });

    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (status !== "checking") return undefined;

    const intervalId = setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [status, attempt]);

  function retry() {
    setStatus("checking");
    setElapsedSeconds(0);
    setAttempt((current) => current + 1);
  }

  return { status, elapsedSeconds, retry };
}
