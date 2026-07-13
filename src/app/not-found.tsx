"use client";

import { Button, Result } from "antd";
import Link from "next/link";

export default function NotFound() {
  return <Result status="404" title="Page not found" subTitle="The page you requested does not exist." extra={<Button type="primary"><Link href="/">Back to WatchMind</Link></Button>} />;
}
