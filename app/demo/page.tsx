import type { Metadata } from "next";
import { DemoPreviewClient } from "@/components/DemoPreviewClient";

export const metadata: Metadata = {
  title: "Demo Preview",
};

export default function DemoPage() {
  return <DemoPreviewClient />;
}
