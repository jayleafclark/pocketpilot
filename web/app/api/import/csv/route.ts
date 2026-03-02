import { NextRequest, NextResponse } from "next/server";
import { requireHousehold } from "@/lib/auth";
import Papa from "papaparse";

export async function POST(request: NextRequest) {
  try {
    await requireHousehold();
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });

    // Return first 5 rows for preview + all column names
    return NextResponse.json({
      columns: result.meta.fields || [],
      preview: result.data.slice(0, 5),
      totalRows: result.data.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to parse CSV" }, { status: 500 });
  }
}
