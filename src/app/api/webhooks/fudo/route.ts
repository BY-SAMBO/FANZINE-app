import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Map Fudo webhook events to our status values
const EVENT_STATUS_MAP: Record<string, string> = {
  "ORDER-CONFIRMED": "confirmed",
  "ORDER-REJECTED": "rejected",
  "ORDER-READY-TO-DELIVER": "ready",
  "ORDER-CLOSED": "closed",
  "ORDER-DELIVERY-SENT": "closed",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[Fudo Webhook] Received:", JSON.stringify(body));

    // Fudo sends: { event, orderId, externalId?, ... }
    const event: string = body.event || body.type;
    const orderId: number | undefined = body.orderId || body.order?.id;
    const externalId: string | undefined = body.externalId;

    if (!event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    const newStatus = EVENT_STATUS_MAP[event];
    if (!newStatus) {
      console.log("[Fudo Webhook] Ignoring unknown event:", event);
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Find and update the order in our log
    const serviceClient = await createServiceClient();

    // Try to match by externalId first, then by fudo_order_id
    let query = serviceClient
      .from("remote_pos_orders_log")
      .update({ status: newStatus })
      .neq("status", "error"); // don't overwrite manual error flags

    if (externalId) {
      query = query.eq("external_id", externalId);
    } else if (orderId) {
      query = query.eq("fudo_order_id", orderId);
    } else {
      console.warn("[Fudo Webhook] No orderId or externalId in payload");
      return NextResponse.json({ error: "No order identifier" }, { status: 400 });
    }

    const { error, count } = await query;

    if (error) {
      console.error("[Fudo Webhook] DB update error:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log("[Fudo Webhook] Updated", count, "orders to status:", newStatus);
    return NextResponse.json({ ok: true, status: newStatus, updated: count });
  } catch (error) {
    console.error("[Fudo Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
