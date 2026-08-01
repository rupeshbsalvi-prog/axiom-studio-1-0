# Acceptance Criteria

## Architecture and security
- No external runtime code, eval, dynamic module URL, user-supplied endpoint or network dependency.
- Brand configuration contains no secrets or provider output.
- Manifest is read-only at runtime and validated before use.

## Brand system
- Strategy, audience, positioning, naming, narrative, voice and tokens are versioned.
- Public descriptor and tagline are consistent across priority surfaces.
- Approved logo variants and asset ownership are documented before production rollout.

## UX and accessibility
- Core text and controls meet the agreed contrast standard.
- Focus is visible, keyboard operation works and colour is not the sole state cue.
- Reduced-motion behaviour is verified.
- Long real content does not overflow or truncate essential meaning.

## Verification
- TypeScript passes.
- Focused brand tests pass.
- Full test suite passes without reducing the established baseline.
- Production build passes.
- Manual review covers small/large screens and critical states.
- Documentation and changelog are updated.
