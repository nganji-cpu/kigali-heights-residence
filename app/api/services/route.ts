import { connection } from "next/server";
import { serviceCategoryLabels } from "@/data/services";
import { errorResponse, jsonOk } from "@/lib/server/http";
import { listServices } from "@/lib/server/repository";
import type { ServiceCategory } from "@/types";

/** GET /api/services — transportation, dining, lifestyle and business services. */
export async function GET() {
  await connection();
  try {
    const services = await listServices();

    const categories = Array.from(new Set(services.map((service) => service.category))).map(
      (category: ServiceCategory) => ({
        value: category,
        label: serviceCategoryLabels[category],
        count: services.filter((service) => service.category === category).length,
      }),
    );

    return jsonOk({ services, categories, total: services.length });
  } catch (error) {
    return errorResponse(error);
  }
}
