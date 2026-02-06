# Phase 12: Settings Panel UI - Research

**Researched:** 2026-02-06
**Domain:** React Settings Panel, Provider Configuration Forms, Searchable Model Dropdowns
**Confidence:** HIGH

## Summary

This phase extends the existing Settings Panel to include OpenAI-compatible and OpenRouter as provider choices in the Providers tab. The work is straightforward because:

1. **The setup wizard (Phase 11) already implemented provider forms** for all four providers. The settings panel currently only shows Ollama and Groq but needs the same forms for OpenAI-compatible and OpenRouter.

2. **All backend infrastructure is complete:**
   - Phase 8: Provider classes created
   - Phase 9: Settings schema extended with new keys
   - Phase 10: Test endpoints created and working
   - Phase 11: Setup wizard forms implemented (can be referenced as patterns)

3. **The settings panel shares patterns with the setup wizard** but has its own rendering approach (full panel with tabs vs. modal wizard). The Settings type in `settings-panel.tsx` needs extending and the `renderProvidersTab()` function needs the new provider buttons and form sections.

4. **OpenRouter's 400+ models require a searchable dropdown**. The existing select component won't scale well. Options include: cmdk command palette, Ariakit combobox, or a simple filter input above the select. Given the project uses Radix UI, cmdk (which builds on Radix Dialog) is the natural choice.

**Primary recommendation:** Extend the Settings interface and `renderProvidersTab()` with new provider options following the existing Ollama/Groq patterns. For OpenRouter model selection, implement a searchable dropdown using cmdk to handle 400+ models efficiently. Add restart prompt when provider changes are detected.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.x | Component framework | Already used |
| next-intl | 4.7.0 | i18n translations | Already used in settings-panel.tsx |
| @phosphor-icons | 2.1.8 | Status icons (Check, X, CircleNotch) | Already used for test status |
| cmdk | 1.x | Searchable command menu | Best fit for 400+ items, Radix-compatible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | 5.x | Type safety | Already configured |
| TailwindCSS v4 | 4.x | Styling | Already used in all components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| cmdk | Native select + filter | Poor UX for 400+ models, no keyboard navigation |
| cmdk | Ariakit Combobox | More dependencies, less integrated with Radix ecosystem |
| cmdk | @radix-ui/react-select with filter | Radix Select doesn't support search natively |

**Installation:**
```bash
cd frontend && pnpm add cmdk
```

## Architecture Patterns

### Recommended Settings Interface Extension
```typescript
// Source: frontend/components/settings/settings-panel.tsx (existing)
interface Settings {
  // Existing fields...
  llm_provider: 'ollama' | 'groq' | 'openai_compatible' | 'openrouter';

  // NEW: OpenAI-compatible settings
  openai_base_url: string;
  openai_api_key: string;  // Optional for some servers
  openai_model: string;

  // NEW: OpenRouter settings
  openrouter_api_key: string;
  openrouter_model: string;

  // ... rest of existing fields unchanged
}
```

### Pattern 1: Extended Provider Toggle Buttons
**What:** Display all four providers in the toggle group
**When to use:** Settings panel providers tab
**Example:**
```tsx
// Source: Derived from existing settings-panel.tsx pattern
<div
  className="inline-flex rounded-xl p-1"
  style={{ background: 'rgb(from var(--surface-2) r g b / 0.5)' }}
>
  <button
    onClick={() =>
      setSettings({
        ...settings,
        llm_provider: 'ollama',
        stt_provider: 'speaches',
      } as Settings)
    }
    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
      settings.llm_provider === 'ollama'
        ? 'bg-background text-foreground shadow'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    Ollama
  </button>
  {/* Groq button - existing */}
  <button onClick={() => setSettings({ ...settings, llm_provider: 'openai_compatible', stt_provider: 'speaches' } as Settings)} ...>
    OpenAI Compatible
  </button>
  <button onClick={() => setSettings({ ...settings, llm_provider: 'openrouter', stt_provider: 'groq' } as Settings)} ...>
    OpenRouter
  </button>
</div>
```

### Pattern 2: OpenAI-Compatible Form Section
**What:** Base URL (required), API key (optional), model selection after test
**When to use:** When `settings.llm_provider === 'openai_compatible'`
**Example:**
```tsx
// Source: Derived from existing Ollama pattern + provider-step.tsx
settings.llm_provider === 'openai_compatible' && (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('providers.baseUrl')}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={settings.openai_base_url}
          onChange={(e) => setSettings({ ...settings, openai_base_url: e.target.value })}
          placeholder="http://localhost:8000/v1"
          className="input-field text-foreground flex-1 px-4 py-3 text-sm"
        />
        <button
          onClick={testOpenAICompatible}
          disabled={!settings.openai_base_url || openaiTest.status === 'testing'}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{ background: 'rgb(from var(--surface-2) r g b / 0.5)' }}
        >
          <TestStatusIcon status={openaiTest.status} />
          {tCommon('test')}
        </button>
      </div>
      {openaiTest.error && <p className="text-xs text-red-500">{openaiTest.error}</p>}
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">
        {t('providers.apiKey')} ({t('providers.optional')})
      </label>
      <input
        type="password"
        value={settings.openai_api_key}
        onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
        placeholder="sk-..."
        className="input-field text-foreground w-full px-4 py-3 text-sm"
      />
      <p className="text-muted-foreground text-xs">{t('providers.openaiApiKeyNote')}</p>
    </div>

    {/* Model dropdown - shown after successful test */}
    {(openaiModels.length > 0 || settings.openai_model) && (
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('providers.model')}</label>
        <select
          value={settings.openai_model}
          onChange={(e) => setSettings({ ...settings, openai_model: e.target.value })}
          className="select-field text-foreground w-full px-4 py-3 text-sm"
        >
          {openaiModels.length > 0 ? (
            <>
              <option value="">{t('providers.selectModel')}</option>
              {openaiModels.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </>
          ) : (
            <option value={settings.openai_model}>{settings.openai_model}</option>
          )}
        </select>
      </div>
    )}

    <p className="text-muted-foreground text-xs">{t('providers.openaiCompatibleSttNote')}</p>
  </div>
)
```

### Pattern 3: OpenRouter Form Section with Searchable Dropdown
**What:** API key (required), searchable model selection for 400+ models
**When to use:** When `settings.llm_provider === 'openrouter'`
**Example:**
```tsx
// Source: cmdk documentation + existing form patterns
import { Command } from 'cmdk';

settings.llm_provider === 'openrouter' && (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('providers.apiKey')}</label>
      <div className="flex gap-2">
        <input
          type="password"
          value={settings.openrouter_api_key}
          onChange={(e) => setSettings({ ...settings, openrouter_api_key: e.target.value })}
          placeholder="sk-or-..."
          className="input-field text-foreground flex-1 px-4 py-3 text-sm"
        />
        <button
          onClick={testOpenRouter}
          disabled={!settings.openrouter_api_key || openrouterTest.status === 'testing'}
          className="..."
        >
          <TestStatusIcon status={openrouterTest.status} />
          {tCommon('test')}
        </button>
      </div>
      {openrouterTest.error && <p className="text-xs text-red-500">{openrouterTest.error}</p>}
      <p className="text-muted-foreground text-xs">
        {t('providers.getApiKeyAt')}{' '}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
           className="text-primary underline">openrouter.ai</a>
      </p>
    </div>

    {/* Searchable model dropdown */}
    {openrouterModels.length > 0 && (
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('providers.model')}</label>
        <ModelSearchCombobox
          models={openrouterModels}
          value={settings.openrouter_model}
          onChange={(model) => setSettings({ ...settings, openrouter_model: model })}
          placeholder={t('providers.searchModels')}
        />
      </div>
    )}

    <p className="text-muted-foreground text-xs">{t('providers.openrouterSttNote')}</p>
  </div>
)
```

### Pattern 4: Model Search Combobox Component
**What:** Reusable searchable dropdown using cmdk for 400+ models
**When to use:** OpenRouter model selection
**Example:**
```tsx
// Source: cmdk documentation
import { Command } from 'cmdk';

interface ModelSearchComboboxProps {
  models: string[];
  value: string;
  onChange: (model: string) => void;
  placeholder?: string;
}

function ModelSearchCombobox({ models, value, onChange, placeholder }: ModelSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredModels = models.filter((model) =>
    model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="input-field text-foreground w-full px-4 py-3 text-sm text-left flex items-center justify-between"
      >
        <span className={value ? '' : 'text-muted-foreground'}>
          {value || placeholder}
        </span>
        <CaretDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg">
          <Command shouldFilter={false}>
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={placeholder}
              className="w-full border-b px-4 py-3 text-sm outline-none"
            />
            <Command.List className="max-h-60 overflow-y-auto p-1">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No models found
              </Command.Empty>
              {filteredModels.map((model) => (
                <Command.Item
                  key={model}
                  value={model}
                  onSelect={() => {
                    onChange(model);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent"
                >
                  {model}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
```

### Pattern 5: Test Connection Functions
**What:** Async test functions following existing Ollama/Groq patterns
**When to use:** Each new provider needs its own test function
**Example:**
```tsx
// Source: Derived from existing testOllama/testGroq patterns
const [openaiTest, setOpenaiTest] = useState<{ status: TestStatus; error: string | null }>({
  status: 'idle',
  error: null,
});
const [openrouterTest, setOpenrouterTest] = useState<{ status: TestStatus; error: string | null }>({
  status: 'idle',
  error: null,
});
const [openaiModels, setOpenaiModels] = useState<string[]>([]);
const [openrouterModels, setOpenrouterModels] = useState<string[]>([]);

const testOpenAICompatible = useCallback(async () => {
  if (!settings.openai_base_url) return;
  setOpenaiTest({ status: 'testing', error: null });

  try {
    const res = await fetch('/api/setup/test-openai-compatible', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_url: settings.openai_base_url,
        api_key: settings.openai_api_key,
      }),
    });
    const result = await res.json();

    if (result.success) {
      setOpenaiTest({ status: 'success', error: null });
      setOpenaiModels(result.models || []);
      if (!settings.openai_model && result.models?.length > 0) {
        setSettings((s) => ({ ...s, openai_model: result.models[0] }));
      }
    } else {
      setOpenaiTest({ status: 'error', error: result.error || t('errors.connectionFailed') });
    }
  } catch {
    setOpenaiTest({ status: 'error', error: t('errors.connectionFailed') });
  }
}, [settings.openai_base_url, settings.openai_api_key, settings.openai_model]);

const testOpenRouter = useCallback(async () => {
  if (!settings.openrouter_api_key) return;
  setOpenrouterTest({ status: 'testing', error: null });

  try {
    const res = await fetch('/api/setup/test-openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: settings.openrouter_api_key }),
    });
    const result = await res.json();

    if (result.success) {
      setOpenrouterTest({ status: 'success', error: null });
      setOpenrouterModels(result.models || []);
      if (!settings.openrouter_model && result.models?.length > 0) {
        setSettings((s) => ({ ...s, openrouter_model: result.models[0] }));
      }
    } else {
      setOpenrouterTest({ status: 'error', error: result.error || t('errors.invalidApiKey') });
    }
  } catch {
    setOpenrouterTest({ status: 'error', error: t('errors.failedToValidate') });
  }
}, [settings.openrouter_api_key, settings.openrouter_model]);
```

### Pattern 6: Restart Prompt After Provider Change
**What:** Show a banner prompting user to restart agent when provider changes
**When to use:** After successful save when llm_provider has changed
**Example:**
```tsx
// Track original provider on load
const [originalProvider, setOriginalProvider] = useState<string | null>(null);
const [showRestartPrompt, setShowRestartPrompt] = useState(false);

useEffect(() => {
  if (settingsLoadedFromApi && originalProvider === null) {
    setOriginalProvider(settings.llm_provider);
  }
}, [settingsLoadedFromApi, settings.llm_provider, originalProvider]);

// After successful save, check if provider changed
const handleSave = async () => {
  // ... existing save logic ...

  if (settings.llm_provider !== originalProvider) {
    setShowRestartPrompt(true);
    // Don't close panel, show restart prompt instead
  } else {
    onClose();
  }
};

// Restart prompt UI
{showRestartPrompt && (
  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 mb-4">
    <p className="text-sm font-medium text-yellow-200">
      {t('providers.restartRequired')}
    </p>
    <p className="text-xs text-yellow-200/70 mt-1">
      {t('providers.restartDescription')}
    </p>
    <div className="flex gap-2 mt-3">
      <button onClick={onClose} className="...">
        {t('providers.restartLater')}
      </button>
    </div>
  </div>
)}
```

### Anti-Patterns to Avoid
- **Sharing test state across providers:** Each provider should track its own test status and models array
- **Not resetting state on provider switch:** Clear test status when user changes provider selection
- **Using native select for 400+ models:** Creates poor UX, use searchable combobox instead
- **Not tracking original provider:** Needed for restart prompt logic
- **Closing panel immediately after save with provider change:** User should see restart prompt first

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable dropdown for 400+ items | Custom filter + dropdown | cmdk | Keyboard navigation, accessibility, focus management built-in |
| Model filtering logic | Client-side full search | cmdk's built-in filter + client filter | Efficient, handles edge cases |
| Connection test debouncing | Custom debounce | `testStatus === 'testing'` disable | Existing pattern works |
| Form validation | Custom validation | Backend returns descriptive errors | Phase 10 provides clear messages |

**Key insight:** cmdk handles keyboard navigation, accessibility, and focus management. Building a searchable dropdown from scratch is complex and error-prone.

## Common Pitfalls

### Pitfall 1: Forgetting DEFAULT_SETTINGS Defaults
**What goes wrong:** New fields are undefined, causing TypeScript errors or controlled/uncontrolled input warnings
**Why it happens:** Settings interface updated but DEFAULT_SETTINGS constant not updated
**How to avoid:** Always update both the interface AND the DEFAULT_SETTINGS constant with matching fields
**Warning signs:** TypeScript errors, React warnings about controlled inputs

### Pitfall 2: Test Status Shared Across All Providers
**What goes wrong:** Test success from Ollama shows when viewing OpenRouter settings
**Why it happens:** Using existing `ollamaTest`/`groqTest` for new providers
**How to avoid:** Add dedicated state for each new provider: `openaiTest`, `openrouterTest`
**Warning signs:** Green checkmark showing for untested provider

### Pitfall 3: Provider Button Layout Broken on Mobile
**What goes wrong:** Four buttons don't fit in inline-flex on small screens
**Why it happens:** Current toggle uses inline-flex, works for 2 buttons but not 4
**How to avoid:** Use grid or allow wrapping with flex-wrap
**Warning signs:** Buttons overflow or get squished on mobile

### Pitfall 4: OpenRouter Model List Rendering Slowly
**What goes wrong:** UI freezes when rendering 400+ options
**Why it happens:** Rendering all items in DOM without virtualization
**How to avoid:** cmdk handles this well up to ~2000 items. For larger lists, add shouldFilter={false} and filter client-side
**Warning signs:** Visible lag when opening dropdown

### Pitfall 5: Restart Prompt Not Shown
**What goes wrong:** User changes provider, saves, panel closes, no restart reminder
**Why it happens:** handleSave closes panel unconditionally
**How to avoid:** Check if provider changed before closing, show restart prompt if so
**Warning signs:** Provider change doesn't take effect until manual restart

### Pitfall 6: Missing i18n Keys
**What goes wrong:** Raw i18n keys displayed instead of translated text
**Why it happens:** Keys added to code but not to messages/en.json and messages/fr.json
**How to avoid:** Add translations for BOTH languages before testing
**Warning signs:** Text like "Settings.providers.searchModels" displayed in UI

## Code Examples

### Complete Settings Interface (Updated)
```typescript
// Source: frontend/components/settings/settings-panel.tsx
interface Settings {
  agent_name: string;
  prompt: string;
  // General
  theme: 'midnight' | 'greySlate' | 'light';
  // Providers - UPDATED union type
  llm_provider: 'ollama' | 'groq' | 'openai_compatible' | 'openrouter';
  ollama_host: string;
  ollama_model: string;
  groq_api_key: string;
  groq_model: string;
  // NEW: OpenAI-compatible
  openai_base_url: string;
  openai_api_key: string;
  openai_model: string;
  // NEW: OpenRouter
  openrouter_api_key: string;
  openrouter_model: string;
  // Existing fields unchanged...
  tts_provider: 'kokoro' | 'piper';
  tts_voice_kokoro: string;
  tts_voice_piper: string;
  temperature: number;
  num_ctx: number;
  max_turns: number;
  tool_cache_size: number;
  hass_enabled: boolean;
  hass_host: string;
  hass_token: string;
  n8n_enabled: boolean;
  n8n_url: string;
  n8n_token: string;
  n8n_api_key: string;
  wake_word_enabled: boolean;
  wake_word_model: string;
  wake_word_threshold: number;
  wake_word_timeout: number;
  allow_interruptions: boolean;
  min_endpointing_delay: number;
  language: string;
}
```

### Complete DEFAULT_SETTINGS Constant (Updated)
```typescript
// Source: frontend/components/settings/settings-panel.tsx
const DEFAULT_SETTINGS: Settings = {
  agent_name: 'Cal',
  prompt: 'default',
  theme: 'midnight',
  llm_provider: 'ollama',
  ollama_host: 'http://localhost:11434',
  ollama_model: '',
  groq_api_key: '',
  groq_model: '',
  // NEW
  openai_base_url: '',
  openai_api_key: '',
  openai_model: '',
  openrouter_api_key: '',
  openrouter_model: '',
  // Existing
  tts_provider: 'kokoro',
  tts_voice_kokoro: 'am_puck',
  tts_voice_piper: 'speaches-ai/piper-en_US-ryan-high',
  temperature: 0.15,
  num_ctx: 8192,
  max_turns: 20,
  tool_cache_size: 3,
  hass_enabled: false,
  hass_host: '',
  hass_token: '',
  n8n_enabled: false,
  n8n_url: '',
  n8n_token: '',
  n8n_api_key: '',
  wake_word_enabled: false,
  wake_word_model: 'models/hey_cal.onnx',
  wake_word_threshold: 0.5,
  wake_word_timeout: 3.0,
  allow_interruptions: true,
  min_endpointing_delay: 0.5,
  language: 'en',
};
```

### i18n Keys to Add (en.json)
```json
{
  "Settings": {
    "providers": {
      "searchModels": "Search models...",
      "noModelsFound": "No models found",
      "restartRequired": "Restart Required",
      "restartDescription": "The LLM provider has changed. Please restart the agent for changes to take effect.",
      "restartLater": "I'll restart later"
    }
  }
}
```

### i18n Keys to Add (fr.json)
```json
{
  "Settings": {
    "providers": {
      "searchModels": "Rechercher des modeles...",
      "noModelsFound": "Aucun modele trouve",
      "restartRequired": "Redemarrage requis",
      "restartDescription": "Le fournisseur LLM a change. Veuillez redemarrer l'agent pour que les modifications prennent effet.",
      "restartLater": "Je redemarrerai plus tard"
    }
  }
}
```

### Test Endpoint Request/Response Reference
```typescript
// OpenAI-compatible endpoint (from Phase 10)
// POST /api/setup/test-openai-compatible
// Request: { base_url: string, api_key?: string }
// Response: { success: boolean, error?: string, models?: string[] }

// OpenRouter endpoint (from Phase 10)
// POST /api/setup/test-openrouter
// Request: { api_key: string }
// Response: { success: boolean, error?: string, models?: string[] }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 2 provider buttons | 4 provider buttons in grid/wrap | This phase | Accommodates 4 providers |
| Native select for models | cmdk searchable combobox | This phase | Scales to 400+ OpenRouter models |
| Close panel after save | Restart prompt if provider changed | This phase | Better UX for provider changes |

**Deprecated/outdated:**
- None - this is net-new functionality for the settings panel

## Open Questions

1. **cmdk Styling Integration**
   - What we know: cmdk uses data-attributes for styling (cmdk-*)
   - What's unclear: Exact integration with existing Tailwind/theming
   - Recommendation: Use existing input-field and select-field classes as base, override cmdk styles as needed

2. **Provider Button Layout**
   - What we know: Current inline-flex works for 2 buttons
   - What's unclear: Best layout for 4 buttons (2x2 grid, scrollable, or wrapping)
   - Recommendation: Use `flex flex-wrap gap-2` to allow buttons to wrap naturally. Test on mobile.

3. **Auto-fetch Models on Load**
   - What we know: Groq models are auto-fetched when API key exists
   - What's unclear: Should same pattern apply to new providers?
   - Recommendation: Yes - add useEffect to auto-fetch OpenRouter/OpenAI models when credentials exist and models not loaded

## Sources

### Primary (HIGH confidence)
- `frontend/components/settings/settings-panel.tsx` - Existing settings panel with Ollama/Groq provider forms
- `frontend/components/setup/provider-step.tsx` - Phase 11 provider forms for all 4 providers (reference implementation)
- `frontend/app/api/setup/test-openai-compatible/route.ts` - OpenAI-compatible proxy route
- `frontend/app/api/setup/test-openrouter/route.ts` - OpenRouter proxy route
- [cmdk GitHub](https://github.com/dip/cmdk) - Command menu component documentation

### Secondary (MEDIUM confidence)
- [Radix UI Select](https://www.radix-ui.com/primitives/docs/components/select) - Existing select patterns
- [shadcn/ui Combobox](https://ui.shadcn.com/docs/components/radix/combobox) - Combobox implementation reference

### Tertiary (LOW confidence)
- Web search on searchable dropdowns - General patterns, not verified against this codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - cmdk is well-established, other libraries already in use
- Architecture: HIGH - Follows existing patterns from settings-panel.tsx and provider-step.tsx
- Pitfalls: HIGH - Derived from codebase analysis and prior phase patterns

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (stable domain, 30 days)
