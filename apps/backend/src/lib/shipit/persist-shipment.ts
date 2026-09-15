export type ShipitShipmentPersistenceInput = {
  fulfillment_id: string;
  order_id: string;
  shipit_id: number;
  reference: string;
  status: string;
  courier_status: string | null;
  tracking_number: string | null;
  shipit_created_at: Date | null;
  shipit_updated_at: Date;
  sandbox: boolean;
};

type ExistingShipitShipment = {
  id: string;
  fulfillment_id: string;
  shipit_id: number;
  reference: string;
};

export type PersistShipitShipmentDependencies = {
  lockingService: {
    execute<T>(key: string, callback: () => Promise<T>): Promise<T>;
  };
  listShipments(
    filters: Record<string, unknown>,
  ): Promise<ExistingShipitShipment[]>;
  createShipment(
    input: ShipitShipmentPersistenceInput,
  ): Promise<unknown>;
};

export type PersistShipitShipmentResult =
  | {
      status: "created";
    }
  | {
      status: "existing";
      shipment_id: string;
    };

export async function persistShipitShipmentIdempotently(
  dependencies: PersistShipitShipmentDependencies,
  input: ShipitShipmentPersistenceInput,
): Promise<PersistShipitShipmentResult> {
  return dependencies.lockingService.execute(
    `shipit:shipment-persist:${input.fulfillment_id}`,
    async () => {
      const [byFulfillment] = await dependencies.listShipments({
        fulfillment_id: input.fulfillment_id,
      });
      const [byShipitId] = await dependencies.listShipments({
        shipit_id: input.shipit_id,
      });
      const [byReference] = await dependencies.listShipments({
        reference: input.reference,
      });

      const existing = byFulfillment ?? byShipitId ?? byReference;

      if (!existing) {
        await dependencies.createShipment(input);
        return { status: "created" };
      }

      const candidates = [
        byFulfillment,
        byShipitId,
        byReference,
      ].filter(
        (shipment): shipment is ExistingShipitShipment =>
          Boolean(shipment),
      );

      const consistent = candidates.every(
        (shipment) =>
          shipment.id === existing.id &&
          shipment.fulfillment_id === input.fulfillment_id &&
          shipment.shipit_id === input.shipit_id &&
          shipment.reference === input.reference,
      );

      if (!consistent) {
        throw new Error(
          `Conflicting Shipit shipment identity for fulfillment ${input.fulfillment_id}`,
        );
      }

      return {
        status: "existing",
        shipment_id: existing.id,
      };
    },
  );
}
