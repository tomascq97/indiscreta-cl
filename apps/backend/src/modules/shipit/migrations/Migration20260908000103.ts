import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260908000103 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shipit_quote" add column if not exists "net_price" numeric not null, add column if not exists "tax_amount" numeric not null, add column if not exists "tax_rate_bps" integer not null, add column if not exists "raw_net_price" jsonb not null, add column if not exists "raw_tax_amount" jsonb not null;`);
    this.addSql(`alter table if exists "shipit_quote" alter column "tax_inclusive" type boolean using ("tax_inclusive"::boolean);`);
    this.addSql(`alter table if exists "shipit_quote" alter column "tax_inclusive" set default true;`);
    this.addSql(`alter table if exists "shipit_quote" alter column "tax_inclusive" set not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shipit_quote" drop column if exists "net_price", drop column if exists "tax_amount", drop column if exists "tax_rate_bps", drop column if exists "raw_net_price", drop column if exists "raw_tax_amount";`);

    this.addSql(`alter table if exists "shipit_quote" alter column "tax_inclusive" type boolean using ("tax_inclusive"::boolean);`);
    this.addSql(`alter table if exists "shipit_quote" alter column "tax_inclusive" drop not null;`);
  }

}
