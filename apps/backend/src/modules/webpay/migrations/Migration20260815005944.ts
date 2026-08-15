import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260815005944 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "webpay_attempt" ("id" text not null, "state" text check ("state" in ('creating', 'initialized', 'create_failed', 'recovery_required', 'cancelled', 'approved_validated', 'medusa_authorized', 'completed')) not null, "cart_id" text not null, "payment_collection_id" text not null, "payment_session_id" text not null, "provider_id" text not null, "initiation_key" text not null, "buy_order" text not null, "session_id" text not null, "amount" numeric not null, "currency_code" text not null, "token" text null, "webpay_url" text null, "payment_id" text null, "order_id" text null, "transbank_status" text null, "failure_code" text null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "webpay_attempt_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_webpay_attempt_deleted_at" ON "webpay_attempt" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webpay_attempt_initiation_key" ON "webpay_attempt" ("initiation_key") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webpay_attempt_buy_order" ON "webpay_attempt" ("buy_order") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webpay_attempt_session_id" ON "webpay_attempt" ("session_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webpay_attempt_token" ON "webpay_attempt" ("token") WHERE deleted_at IS NULL AND token IS NOT NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webpay_attempt_payment_id" ON "webpay_attempt" ("payment_id") WHERE deleted_at IS NULL AND payment_id IS NOT NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_webpay_attempt_order_id" ON "webpay_attempt" ("order_id") WHERE deleted_at IS NULL AND order_id IS NOT NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_webpay_attempt_payment_session_id" ON "webpay_attempt" ("payment_session_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_webpay_attempt_cart_id" ON "webpay_attempt" ("cart_id") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_webpay_attempt_state_updated_at" ON "webpay_attempt" ("state", "updated_at") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "webpay_attempt" cascade;`);
  }
}
