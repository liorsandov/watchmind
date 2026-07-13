"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme } from "antd";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: "#a78bfa",
            colorBgBase: "#090b12",
            colorBgContainer: "#121622",
            colorBorder: "#292f40",
            borderRadius: 10,
            fontFamily: "var(--font-geist-sans)",
          },
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
}
