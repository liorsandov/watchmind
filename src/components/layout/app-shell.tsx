"use client";

import { CompassOutlined, HeartOutlined, HistoryOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SettingOutlined, StarOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { Button, Drawer, Layout, Menu, Typography } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./app-shell.module.scss";

const { Header, Content, Sider } = Layout;
const navigation = [
  { key: "/discover", icon: <CompassOutlined />, label: <Link href="/discover">Discover</Link> },
  { key: "/rate", icon: <ThunderboltOutlined />, label: <Link href="/rate">Rate titles</Link> },
  { key: "/recommendations", icon: <StarOutlined />, label: <Link href="/recommendations">Recommendations</Link> },
  { key: "/watchlist", icon: <HeartOutlined />, label: <Link href="/watchlist">Watchlist</Link> },
  { key: "/history", icon: <HistoryOutlined />, label: <Link href="/history">History</Link> },
  { key: "/settings", icon: <SettingOutlined />, label: <Link href="/settings">Settings</Link> },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={styles.brand} href="/" aria-label="WatchMind home">
      <span className={styles.brandMark}>W</span>
      {!compact && <span>WatchMind</span>}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const selectedKey = navigation.find(({ key }) => pathname.startsWith(key))?.key;

  return (
    <Layout className={styles.shell}>
      <Sider className={styles.desktopSider} collapsed={collapsed} collapsedWidth={80} width={248}>
        <Brand compact={collapsed} />
        <Menu mode="inline" selectedKeys={selectedKey ? [selectedKey] : []} items={navigation} />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <Button aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} className={styles.desktopToggle ?? ""} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed((value) => !value)} type="text" />
          <Button aria-label="Open navigation" className={styles.mobileToggle ?? ""} icon={<MenuUnfoldOutlined />} onClick={() => setMobileOpen(true)} type="text" />
          <Typography.Text className={styles.privacyLabel ?? ""}>Your private taste profile</Typography.Text>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
      <Drawer onClose={() => setMobileOpen(false)} open={mobileOpen} placement="left" size="default" title={<Brand />}>
        <Menu mode="inline" selectedKeys={selectedKey ? [selectedKey] : []} items={navigation} onClick={() => setMobileOpen(false)} />
      </Drawer>
    </Layout>
  );
}
