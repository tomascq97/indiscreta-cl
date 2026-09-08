import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260908014951 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "shipit_shipment" ("id" text not null, "fulfillment_id" text not null, "order_id" text not null, "shipit_id" integer not null, "reference" text not null, "status" text not null, "courier_status" text null, "tracking_number" text null, "shipit_created_at" timestamptz null, "shipit_updated_at" timestamptz not null, "sandbox" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipit_shipment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shipit_shipment_deleted_at" ON "shipit_shipment" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipit_shipment_fulfillment" ON "shipit_shipment" ("fulfillment_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipit_shipment_shipit_id" ON "shipit_shipment" ("shipit_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipit_shipment_reference" ON "shipit_shipment" ("reference") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shipit_shipment" cascade;`);
  }

}
