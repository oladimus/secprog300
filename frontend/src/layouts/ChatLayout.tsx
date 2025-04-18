import * as React from "react";
import { Outlet } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";

export default function ChatLayout() {
  return (
    <DashboardLayout>
        <Outlet />
    </DashboardLayout>
  );
}