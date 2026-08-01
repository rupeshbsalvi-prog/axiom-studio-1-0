# Studio Template

**Required starting point for every new Studio on Platform Runtime v5.**

This is a project rule, not a suggestion.
See `PLATFORM_RUNTIME_V5_SPEC.md` → *Studio Template Rule* for the formal statement.

---

## Four Questions Every Studio Must Answer

Before shipping, every Studio must answer **yes** to all four:

| # | Question | Why it matters |
|---|----------|----------------|
| 1 | Does it build entirely from this template? | Ensures correct lifecycle, RT-001 guard, and disposal from the start |
| 2 | Does it integrate exclusively through Runtime v5 contracts? | Prevents direct coupling to platform internals |
| 3 | Can it be removed without requiring changes to `src/platform/`? | The Studio Independence Guarantee |
| 4 | Does it avoid producing evidence for Runtime v6 in isolation? | A limitation felt by one Studio is a Studio problem, not a platform problem |

If any answer is "no," the Studio has a product problem to resolve — not a platform problem to escalate.

---

## How to Create a New Studio

1. **Copy** `StudioTemplate.ts` into `src/app/studios/<your-studio-id>/`
2. **Rename** the class from `StudioTemplate` to `<YourStudio>Studio`
3. **Rename** the singleton export from `studioTemplate` to `<yourStudio>Studio`
4. **Replace all `TODO` blocks** with your Studio's implementation
5. **Replace `myStudio.*`** with your Studio's state namespace prefix (e.g. `brainX.*`)
6. **Create** `diagnostics/<YourStudio>Provider.ts` using `BrainXProvider.ts` as reference
7. **Create** `<YourStudio>State.ts` with your initial state constant
8. **Create** `<YourStudio>Panel.tsx` for your Studio's UI
9. **Create** `tests/<YourStudio>Studio.test.ts` — eight validation tests minimum

---

## What the Template Gives You

| Pattern | Guaranteed by template |
|---------|----------------------|
| StudioModule lifecycle | `initialize / activate / deactivate / dispose` in correct order |
| Platform registration | `registerStudio` on init, `unregisterStudio` on dispose |
| Provider registration | `registerProvider` on init, `unregisterProvider` on dispose |
| EventBus cleanup | All subscriptions stored in `this.unsubscribers`, cleared on `deactivate()` |
| RT-001 re-entrancy guard | `isProcessingObservation` flag with `try/finally` reset |
| Cross-Studio isolation | EventBus-only observation — zero direct Studio imports |
| Zero platform residue | `dispose()` leaves no dangling references |

---

## RT-001 — Why the Re-Entrancy Guard Is Already Here

`StateService.setState()` publishes the **full merged state** on every write — not just the delta.

If your Studio subscribes to `state:changed` and also calls `setState()` inside that handler, the handler will re-trigger itself on every write because the merged snapshot retains all previously written keys.

The guard prevents this:

```typescript
private isProcessingObservation = false;

eventBus.subscribe("state:changed", (state) => {
  if (this.isProcessingObservation) return;  // ← break the cycle
  // ...
  try {
    this.isProcessingObservation = true;
    stateService.setState({ ... });
  } finally {
    this.isProcessingObservation = false;     // ← always resets
  }
});
```

**This guard is required** for any `state:changed` subscriber that calls `setState()`.
It is not required for subscribers that only read state or publish events.

Full specification: `RT-001` in `../PLATFORM_RUNTIME_V5_SPEC.md`.

---

## Validation Gates (Required Before Certification)

A new Studio must pass all of these before it is listed as **Certified** in `COMPATIBILITY_MATRIX.md`:

- [ ] All Studio-specific unit tests pass
- [ ] Zero modifications to `src/platform/`
- [ ] All code in `src/app/studios/<studio-id>/` only
- [ ] Zero Three.js imports (non-rendering Studios)
- [ ] `initialize / activate / deactivate / dispose` implemented
- [ ] DiagnosticsProvider `id / initialize / collect / dispose` implemented
- [ ] State writes use Studio-specific namespace prefix only
- [ ] Zero platform references after `dispose()`

---

## Reference Implementations

| Studio | Domain | Reference for |
|--------|--------|---------------|
| Brain X | Async orchestration | Cross-Studio observation, scheduler, async workflows, memory graph |
| Axiom AI | Intelligence / data | Simple provider, state-only Studio, zero rendering |
| AX-CORE | WebGL rendering | Frame loop, Three.js integration, rendering layers |
