import { NextRequest, NextResponse } from "next/server";
import { requireHousehold, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { user, householdId } = await requireHousehold();
    const params = request.nextUrl.searchParams;

    const where: Record<string, unknown> = { householdId };

    // Date filter
    const date = params.get("date");
    if (date === "today") {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start.getTime() + 86400000);
      where.date = { gte: start, lt: end };
    } else if (params.get("from") || params.get("to")) {
      const dateFilter: Record<string, Date> = {};
      if (params.get("from")) dateFilter.gte = new Date(params.get("from")!);
      if (params.get("to")) dateFilter.lte = new Date(params.get("to")!);
      where.date = dateFilter;
    }

    // Entity filter (comma-separated)
    const entity = params.get("entity");
    if (entity) {
      const entities = entity.split(",");
      where.entity = { in: entities };
    }

    // Category filter
    const category = params.get("category");
    if (category) where.category = category;

    // Search filter
    const search = params.get("search");
    if (search) {
      where.OR = [
        { merchant: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: { select: { name: true, last4: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
