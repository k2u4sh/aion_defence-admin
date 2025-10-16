import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";

const getStateModel = async () => {
  const mod: any = await import("@/models/State");
  return (mod.default || mod) as any;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const State = await getStateModel();

    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get("countryId");
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "200")));

    let items;
    if (q) {
      items = await State.searchStates(q, countryId ? parseInt(countryId, 10) : null);
    } else if (countryId) {
      items = await State.getStatesByCountry(parseInt(countryId, 10));
    } else {
      items = await State.getAllStates(page, limit);
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching states:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch states" }, { status: 500 });
  }
}


