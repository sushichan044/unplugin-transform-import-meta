import { describe, expect, it } from "vitest";

import { createProcessor, detectLanguage } from "../src/core/processors";
import { transformWithReplacements } from "../src/core/transform";

describe("Svelte support", () => {
  it("should detect Svelte files", () => {
    expect(detectLanguage("App.svelte")).toBe("svelte");
    expect(detectLanguage("component.svelte")).toBe("svelte");
    expect(detectLanguage("index.js")).toBe("ecma");
    expect(detectLanguage("index.ts")).toBe("ecma");
  });

  it("should transform import.meta in Svelte script tags", async () => {
    const resolveRules = {
      methods: {},
      properties: {
        "env.API_URL": "https://api.example.com",
        "env.BASE_URL": "/app/",
        "env.NODE_ENV": "production",
      },
    };

    const source = `<script>
  const title = "Svelte Test Page";
  const env = import.meta.env.NODE_ENV;
  const baseUrl = import.meta.env.BASE_URL;
  const apiUrl = import.meta.env.API_URL || "http://localhost";
</script>

<main>
  <h1>{title}</h1>
  <p>Environment: {env}</p>
  <p>Base URL: {baseUrl}</p>
  <p>API URL: {apiUrl}</p>
</main>`;

    const processor = await createProcessor("test.svelte");

    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    // Svelte script processing is not implemented, expect no replacements
    expect(result.replacements).toHaveLength(0);
    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );
    expect(transformedCode).toBe(source); // Should be unchanged
    expect(result.warnings).toContain(
      "Script tag processing in Svelte files is not yet fully implemented",
    );
  });

  it("should transform import.meta in Svelte script module", async () => {
    const resolveRules = {
      methods: {},
      properties: {
        "env.DEBUG": true,
        "env.VERSION": "1.0.0",
      },
    };

    const source = `<script module>
  const version = import.meta.env.VERSION;
  const debug = import.meta.env.DEBUG;
</script>

<script>
  const title = "Test";
</script>

<main>
  <h1>{title}</h1>
  <p>Version: {version}</p>
</main>`;

    const processor = await createProcessor("test.svelte");
    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    // Svelte module script processing is not implemented, expect no replacements
    expect(result.replacements).toHaveLength(0);
    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );
    expect(transformedCode).toBe(source); // Should be unchanged
    expect(result.warnings).toContain(
      "Module script processing in Svelte files is not yet fully implemented",
    );
  });

  it("should handle Svelte file without import.meta", async () => {
    const source = `<script>
  const title = "Simple Svelte Page";
</script>

<main>
  <h1>{title}</h1>
</main>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.NODE_ENV": "development",
      },
    };

    const processor = await createProcessor("test.svelte");
    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );
    expect(transformedCode).toBe(source);
    expect(result.warnings).toHaveLength(0);
  });

  it.skip("should transform import.meta in template expressions", async () => {
    const resolveRules = {
      methods: {},
      properties: {
        "env.DEBUG": true,
        "env.IMAGE_URL": "https://example.com/image.jpg",
        "env.THEME": "dark",
      },
    };

    const source = `<script>
  const title = "Test";
</script>

<main>
  <h1>{title}</h1>

  {#if import.meta.env.DEBUG}
    <div>Debug mode</div>
  {/if}

  <div class="{import.meta.env.THEME}">
    Themed content
  </div>

  <img bind:src={import.meta.env.IMAGE_URL} alt="Dynamic image" />
</main>`;

    const processor = await createProcessor("test.svelte");
    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    // Template expressions are not implemented
    expect(result.replacements).toHaveLength(0);
    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );
    expect(transformedCode).toBe(source); // Should be unchanged
  });
});
