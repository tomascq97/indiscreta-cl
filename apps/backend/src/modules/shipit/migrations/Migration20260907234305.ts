import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260907234305 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "shipit_quote" ("id" text not null, "cart_id" text not null, "shipping_option_id" text null, "quote_hash" text not null, "contract_version" text not null, "packing_policy" text not null, "origin_commune_id" integer not null, "destination_commune_id" integer not null, "destination_kind" text not null, "destination_context" text not null, "courier_id" integer null, "courier_name" text not null, "service_name" text not null, "shipit_destiny_id" integer not null, "branch_office_id" integer null, "length_cm" real not null, "width_cm" real not null, "height_cm" real not null, "weight_kg" real not null, "price" numeric not null, "currency_code" text not null, "tax_inclusive" boolean null, "delivery_days" integer not null, "quoted_at" timestamptz not null, "selected_at" timestamptz null, "invalidated_at" timestamptz null, "raw_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipit_quote_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipit_quote_deleted_at" ON "shipit_quote" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipit_quote_hash" ON "shipit_quote" ("quote_hash") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipit_quote_cart_id" ON "shipit_quote" ("cart_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_shipit_quote_cart_validity" ON "shipit_quote" ("cart_id", "invalidated_at", "quoted_at") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shipit_quote" cascade;`);
  }
}
