import type { Metadata } from "next";
import SuperAdminConsole from "./console";

export const metadata: Metadata = {
  title: "Console",
  robots: { index: false, follow: false, nocache: true },
};

export default function SuperAdminPage() {
  return <SuperAdminConsole />;
}
