# Test baseline

## Stage 5 checkpoint

The approved Stage 5 report recorded the storefront baseline as 59 of 60 tests
passing. Before creating the checkpoint, one additional approved Webpay test was
added for retrying after an initiation error. The reproducible checkpoint count
is therefore 60 of 61 tests passing.

The only failure in both counts is pre-existing and unrelated to Webpay:

```text
src/lib/translations/__tests__/dictionary-consumers.test.ts
representative dictionary consumers > uses the semantic order date key in the account overview
```

It expects the account overview source to use `esCl.orders.datePlaced`. Stage 5
does not modify the test or the account overview component. Any new storefront
failure is a regression relative to this baseline.
