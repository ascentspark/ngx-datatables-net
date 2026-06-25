<!--
Thanks for contributing to ngx-datatables-net!
For non-trivial features, please open an issue to discuss the API first.
-->

## Summary

<!-- What does this PR do, and why? -->

Closes #

## Type of change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Docs / tooling only

## Target release line

<!-- Land cross-cutting changes on `main` (Angular 22) first; we cherry-pick to 21.x / 20.x. -->

- [ ] `main` (Angular 22 — `latest`)
- [ ] `21.x` (Angular 21 — `ng21`)
- [ ] `20.x` (Angular 20 — `ng20`)

## Checklist

- [ ] `ng test ngx-datatables-net` passes
- [ ] `ng lint` passes
- [ ] `ng build ngx-datatables-net` succeeds
- [ ] Added or updated tests for the change
- [ ] No jQuery introduced; uses the non-jQuery DataTables API
- [ ] Works under zoneless change detection (init outside CD, re-enter deliberately)
- [ ] Public API change is reflected in `public-api.ts` and the docs
- [ ] Considered the XSS / sanitization boundary for any rendered data
- [ ] Updated `CHANGELOG.md`

## Notes for reviewers

<!-- Anything that needs extra attention, screenshots, or backport notes. -->
