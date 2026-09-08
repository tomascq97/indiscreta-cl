import { z } from "@medusajs/framework/zod";

const finitePositive = z.number().finite().positive();
const nullableUnknown = z.unknown().nullable().optional();

export const shipitRateRequestSchema = z.object({
  parcel: z.object({
    length: finitePositive,
    height: finitePositive,
    width: finitePositive,
    weight: finitePositive,
    origin_id: z.number().int().positive(),
    destiny_id: z.number().int().positive(),
    type_of_destiny: z.string().trim().min(1),
    courier_for_client: z.string().trim().min(1).optional(),
    algorithm: z.number().int().optional(),
    algorithm_days: z.number().int().nonnegative().optional(),
  }),
});

const shipitRateSchema = z.object({
  courier: z.object({
    name: z.string().min(1),
    packet_from: z.string(),
    packet_to: z.string(),
  }),
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  days: z.number().int().nonnegative(),
  available_to_shipping: z.boolean(),
  original_courier: z.string().min(1),
  volumetric_weight: z.number().finite().nonnegative(),
  destiny: z
    .object({
      id: z.number().int().positive(),
      name: z.string(),
      description: z.string(),
      type_of_destiny: z.string().min(1),
      payable: z.boolean(),
      available: z.boolean(),
      commune_id: z.number().int().positive(),
      courier_branch_office_id: nullableUnknown,
      courier_branch_office: z.object({
        id: nullableUnknown,
        name: nullableUnknown,
        commune_id: nullableUnknown,
        address: nullableUnknown,
        courier_bo_id: nullableUnknown,
      }),
    })
    .nullable()
    .optional(),
});

export const shipitRatesResponseSchema = z.object({
  algorithm: z.union([z.string(), z.number()]),
  algorithm_days: z.union([z.string(), z.number()]).nullable().optional(),
  courier_for_client: nullableUnknown,
  prices: z.array(shipitRateSchema),
  lower_price: shipitRateSchema.nullable().optional(),
});

export const shipitCommuneSchema = z.object({
  id: z.number().int().positive(),
  region_id: z.number().int().positive(),
  name: z.string().min(1),
  is_available: z.boolean().optional().default(true),
  region: z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    number: z.number().int().optional(),
    roman_numeral: z.string().optional(),
  }),
});

export const shipitCommunesResponseSchema = z.array(shipitCommuneSchema);

export const shipitCourierSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  available_to_ship: z.boolean(),
});

export const shipitCouriersResponseSchema = z.array(shipitCourierSchema);

export const shipitBranchOfficeSchema = z.object({
  id: z.number().int().positive(),
  address: z.string().min(1),
  commune_id: z.number().int().positive(),
  courier_bo_id: z.string().min(1),
  courier_id: z.number().int().positive(),
  name: z.string().min(1),
});

export const shipitBranchOfficesResponseSchema = z.array(
  shipitBranchOfficeSchema,
);

const shipmentDestinySchema = z.object({
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  complement: z.string().optional(),
  commune_id: z.number().int().positive(),
  commune_name: z.string().trim().min(1),
  full_name: z.string().trim().min(1),
  email: z.string().email().optional(),
  phone: z.string().trim().min(1).optional(),
  kind: z.enum(["home_delivery", "courier_branch_office"]),
  courier_branch_office_id: z.number().int().positive().optional(),
});

export const shipitShipmentRequestSchema = z
  .object({
    kind: z.number().int().nonnegative(),
    platform: z.number().int().nonnegative(),
    reference: z.string().trim().min(1).max(15),
    destiny: shipmentDestinySchema,
    sizes: z.object({
      length: finitePositive,
      height: finitePositive,
      width: finitePositive,
      weight: finitePositive,
    }),
    items: z.number().int().positive(),
    sandbox: z.boolean().optional(),
    courier: z.object({
      id: z.number().int().positive(),
      client: z.string().trim().min(1),
      payable: z.literal(false).optional(),
      selected: z.boolean().optional(),
      algorithm: z.number().int().optional(),
      algorithm_days: z.number().int().nonnegative().optional(),
      without_courier: z.boolean().optional(),
    }),
  })
  .superRefine((shipment, context) => {
    const branchId = shipment.destiny.courier_branch_office_id;
    if (shipment.destiny.kind === "courier_branch_office" && !branchId) {
      context.addIssue({
        code: "custom",
        path: ["destiny", "courier_branch_office_id"],
        message: "Branch office delivery requires a branch office ID",
      });
    }
    if (shipment.destiny.kind === "home_delivery" && branchId) {
      context.addIssue({
        code: "custom",
        path: ["destiny", "courier_branch_office_id"],
        message: "Home delivery cannot include a branch office ID",
      });
    }
  });

export const shipitShipmentResponseSchema = z
  .object({
    id: z.number().int().positive(),
    reference: z.string().min(1),
    status: z.string().min(1),
    sub_status: z.string().nullable().optional(),
    tracking_number: z.string().nullable().optional(),
    courier_status: z.string().nullable().optional(),
    shipping_price: z.number().finite().nonnegative().optional(),
    total: z.number().finite().nonnegative().optional(),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
  })
  .passthrough();

export const shipitTrackingResponseSchema = z
  .object({
    number: z.string().optional(),
    tracking_number: z.string().optional(),
    status: z.string().optional(),
    courier_status: z.string().optional(),
  })
  .passthrough();

export const shipitWebhookSchema = z
  .object({
    id: z.number().int().positive(),
    reference: z.string().min(1),
    status: z.string().min(1),
    tracking_number: z.string().nullable().optional(),
    courier_status: z.string().nullable().optional(),
    updated_at: z.string().min(1),
  })
  .passthrough();

export type ShipitRateRequest = z.infer<typeof shipitRateRequestSchema>;
export type ShipitShipmentRequest = z.infer<typeof shipitShipmentRequestSchema>;
