# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 2.x     | ✅        |
| 1.x     | ❌        |

## Reporting a vulnerability

Please report vulnerabilities privately via
[GitHub security advisories](https://github.com/jeeanribeiro/key-event-plus/security/advisories/new)
rather than opening a public issue. You should receive a response within a few days.

Scope notes: this library attaches keyboard listeners in the page it runs in and never
transmits, stores, or logs keystrokes itself. Anything that would make it exfiltrate or leak
input, execute injected code, or misbehave under crafted `KeyboardEvent` input is in scope.
