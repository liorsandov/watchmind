"use client";
import { Button, Result } from "antd";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return <html lang="en"><body><Result status="500" title="WatchMind needs a reset" subTitle="An unexpected application error occurred." extra={<Button onClick={unstable_retry}>Try again</Button>} /></body></html>;
}
