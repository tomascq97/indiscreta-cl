import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260815013201 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "webpay_attempt" drop constraint if exists "webpay_attempt_state_check";`);

    this.addSql(`alter table if exists "webpay_attempt" add column if not exists "response_code" integer null, add column if not exists "authorization_code" text null, add column if not exists "payment_type_code" text null, add column if not exists "installments_number" integer null, add column if not exists "transaction_date" timestamptz null, add column if not exists "card_last_four" text null, add column if not exists "commit_started_at" timestamptz null, add column if not exists "committed_at" timestamptz null, add column if not exists "completed_at" timestamptz null;`);
    this.addSql(`alter table if exists "webpay_attempt" add constraint "webpay_attempt_state_check" check("state" in ('creating', 'initialized', 'create_failed', 'recovery_required', 'cancelled', 'expired', 'committing', 'approved_validated', 'rejected', 'inconsistent', 'manual_review', 'medusa_authorizing', 'medusa_authorized', 'order_completing', 'completed'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "webpay_attempt" drop constraint if exists "webpay_attempt_state_check";`);

    this.addSql(`alter table if exists "webpay_attempt" drop column if exists "response_code", drop column if exists "authorization_code", drop column if exists "payment_type_code", drop column if exists "installments_number", drop column if exists "transaction_date", drop column if exists "card_last_four", drop column if exists "commit_started_at", drop column if exists "committed_at", drop column if exists "completed_at";`);

    this.addSql(`alter table if exists "webpay_attempt" add constraint "webpay_attempt_state_check" check("state" in ('creating', 'initialized', 'create_failed', 'recovery_required', 'cancelled', 'approved_validated', 'medusa_authorized', 'completed'));`);
  }

}
