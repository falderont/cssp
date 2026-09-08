import { redirect } from "next/navigation";

// Batch upload now lives as a mode inside the "New visitor request"
// screen — this route stays only to keep old links/bookmarks working.
export default function BatchVisitorRequestPage() {
  redirect("/portal/visitors/new?mode=batch");
}
