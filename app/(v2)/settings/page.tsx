import { redirect } from "next/navigation";
import { settingsHref } from "@/lib/routes/app";

export default function SettingsIndexPage() {
  redirect(settingsHref("projects"));
}
