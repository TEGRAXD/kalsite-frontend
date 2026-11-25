import type { Metadata } from "next";
import { OperatorSyncManager } from "@/features/operators/OperatorSyncManager";

export const metadata: Metadata = {
  title: "Manage & Sync Operators",
  description:
    "Sync Arknights Operators and local avatars from ArknightsResource or add operators manually.",
  robots: { index: false, follow: false },
};

export default function ManageOperatorsPage() {
  return <OperatorSyncManager />;
}
