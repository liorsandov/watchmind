"use client";

import { Card, Tag, Typography } from "antd";
import styles from "./placeholder-page.module.scss";

interface PlaceholderPageProps { eyebrow: string; title: string; description: string; }

export function PlaceholderPage({ eyebrow, title, description }: PlaceholderPageProps) {
  return (
    <main className={styles.page}>
      <Tag color="purple">{eyebrow}</Tag>
      <Typography.Title>{title}</Typography.Title>
      <Typography.Paragraph className={styles.description ?? ""}>{description}</Typography.Paragraph>
      <Card className={styles.card ?? ""}>
        <Typography.Title level={3}>Foundation ready</Typography.Title>
        <Typography.Paragraph>This route is intentionally a placeholder. Product behavior will be added in a focused implementation phase.</Typography.Paragraph>
      </Card>
    </main>
  );
}
