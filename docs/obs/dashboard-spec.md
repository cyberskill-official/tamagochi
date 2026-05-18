# DashboardSpec

## Purpose

This media artifact documents the operational behavior, policy boundary, and verification surface for `docs/obs/dashboard-spec.md`.

## Behavior

- Inputs carry explicit tenant context when player or tenant data is involved.
- Under-13 paths use stricter privacy, social, advertising, and AI controls.
- Economy paths reject paid randomized outcomes and invalid balance transitions.
- Social paths require invite, confirmation, or ceremony state as appropriate.
- Observability paths emit deterministic audit events for incident follow-up.

## Verification

Covered by the strict FR pipeline, unit tests, FR acceptance tests, E2E journeys, and QA console smoke checks.
