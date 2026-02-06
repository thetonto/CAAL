---
phase: 09-settings-schema-extension
plan: 01
subsystem: settings
tags: [python, settings, validation, providers]

dependency-graph:
  requires: [08-backend-provider-foundation]
  provides: [settings-keys-for-openai-openrouter, url-validation-helper]
  affects: [10-frontend-provider-ui, 11-setup-wizard-update]

tech-stack:
  added: []
  patterns: [url-validation-at-save-time, secret-field-protection]

key-files:
  created: []
  modified:
    - src/caal/settings.py
    - src/caal/webhooks.py

decisions:
  - key: empty-string-defaults
    choice: Empty strings as defaults for new provider settings
    reason: Indicates "not configured" in UI, factory applies fallbacks at runtime

metrics:
  duration: 3 min
  completed: 2026-02-06
---

# Phase 9 Plan 1: Add Provider Settings Keys and URL Validation Summary

**One-liner:** Added 5 new provider settings keys (openai_*, openrouter_*) with URL validation helper and extended webhook validation for new providers.

## What Was Built

### 1. Provider Settings Keys (settings.py)

Added 5 new keys to `DEFAULT_SETTINGS` for OpenAI-compatible and OpenRouter providers:

```python
# OpenAI-compatible settings (any OpenAI-compatible server)
"openai_api_key": "",         # Optional API key for authenticated servers
"openai_base_url": "",        # Server URL (empty = not configured)
"openai_model": "",           # Model name (empty = use server default)
# OpenRouter settings (cloud API)
"openrouter_api_key": "",     # OpenRouter API key (required for openrouter provider)
"openrouter_model": "",       # Model name (empty = use default)
```

All defaults are empty strings to indicate "not configured" in the UI. The factory function in `create_provider_from_settings` applies runtime fallbacks when actually creating providers.

### 2. URL Validation Helper (settings.py)

Added `validate_url()` function using `urllib.parse`:

```python
def validate_url(url: str) -> tuple[bool, str]:
    """Validate URL format for settings."""
```

- Accepts empty strings (not configured)
- Accepts valid http:// and https:// URLs
- Rejects FTP, file://, and other schemes
- Rejects malformed URLs with descriptive error messages

### 3. Webhook Validation Extension (webhooks.py)

- **Import:** Added `from .settings import validate_url`
- **Secret fields:** Extended to include `openai_api_key` and `openrouter_api_key`
- **URL validation:** Validates `openai_base_url`, `ollama_host`, `hass_host`, `n8n_url` before saving
- **STT/LLM coupling:** Extended logic for new providers:
  - `openrouter` -> `groq` STT (cloud-based assumption)
  - `openai_compatible` -> `speaches` STT (local-based assumption)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 25432b6 | feat | Add provider settings keys and URL validation helper |
| 2500aed | feat | Extend webhook validation and provider coupling |

## Verification Results

All verification checks passed:

1. **Settings load correctly:** All 5 new keys present in DEFAULT_SETTINGS and loaded settings
2. **URL validation works:** Empty, http, https accepted; ftp, no-scheme rejected
3. **Lint passes:** `ruff check` clean for both files
4. **Type check:** Pre-existing mypy error in settings.py:229 (unrelated to changes)

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

| File | Lines | Change |
|------|-------|--------|
| src/caal/settings.py | +37 | Added validate_url(), 5 new DEFAULT_SETTINGS keys |
| src/caal/webhooks.py | +18/-3 | Import, secret_fields, URL validation, STT coupling |

## Next Phase Readiness

Phase 10 (Frontend Provider UI) can now:
- Read the new settings keys via GET /settings
- Save new provider configurations via POST /settings
- URL validation will reject malformed base URLs with HTTP 400

No blockers identified.
