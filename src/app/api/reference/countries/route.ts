import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase as connectDB } from "@/lib/db";

// Models are CommonJS exports; handle default interop
const getCountryModel = async () => {
  const mod: any = await import("@/models/Country");
  return (mod.default || mod) as any;
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const Country = await getCountryModel();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100")));
    const q = (searchParams.get("q") || "").trim();

    let items;
    if (q) {
      items = await Country.searchCountries(q);
    } else {
      items = await Country.getAllCountries(page, limit);
    }

    const total = await Country.getTotalCountriesCount();

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch countries" }, { status: 500 });
  }
}


