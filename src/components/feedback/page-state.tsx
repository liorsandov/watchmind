"use client";

import { Button, Result, Skeleton, Space } from "antd";

export function PageLoading() {
  return (
    <Space orientation="vertical" size="large" style={{ width: "100%" }}>
      <Skeleton active paragraph={{ rows: 2 }} title={{ width: "45%" }} />
      <Skeleton.Node active style={{ width: "100%", height: 280 }} />
    </Space>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <Result status="error" title="Something went wrong" subTitle="We could not load this part of WatchMind. Your saved data is safe." extra={<Button onClick={onRetry}>Try again</Button>} />;
}
