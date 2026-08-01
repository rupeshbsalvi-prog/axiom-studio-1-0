# Security and Architecture Notes

The brand system is deliberately static. It must not become an alternate runtime configuration or content-injection path.

- No secrets belong in tokens, messaging, analytics examples or asset metadata.
- No user-supplied URLs, arbitrary adapters or external module execution.
- AI/provider output must not directly rewrite approved brand sources.
- AI-generated proposals remain candidates until explicit approval and commit.
- Keep audit history in version control and brand change records.
- Deprecation must be explicit; do not silently mutate historical artifacts.
