import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";

const getCityModel = async () => {
  const mod: any = await import("@/models/City");
  return (mod.default || mod) as any;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const City = await getCityModel();

    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get("stateId");
    const countryId = searchParams.get("countryId");
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "200")));

    let items;
    if (q) {
      items = await City.searchCities(q, countryId ? parseInt(countryId, 10) : null);
    } else if (stateId) {
      items = await City.find({ state_id: parseInt(stateId, 10) }).sort({ name: 1 });
    } else if (countryId) {
      items = await City.getCitiesByCountry(parseInt(countryId, 10));
    } else {
      items = await City.getAllCities(page, limit);
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch cities" }, { status: 500 });
  }
}


