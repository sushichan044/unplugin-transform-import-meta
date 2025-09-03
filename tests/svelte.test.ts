import { describe, expect, it } from "vitest";

import { createProcessor, detectLanguage } from "../src/core/processors";

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

    const processor = createProcessor("test.svelte");
    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    expect(result.code).not.toContain("import.meta.env.NODE_ENV");
    expect(result.code).not.toContain("import.meta.env.BASE_URL");
    expect(result.code).not.toContain("import.meta.env.API_URL");
    expect(result.code).toContain('"production"');
    expect(result.code).toContain('"/app/"');
    expect(result.code).toContain('"https://api.example.com"');
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

    const processor = createProcessor("test.svelte");
    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    expect(result.code).not.toContain("import.meta.env.VERSION");
    expect(result.code).not.toContain("import.meta.env.DEBUG");
    expect(result.code).toContain('"1.0.0"');
    expect(result.code).toContain("true");
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

    const processor = createProcessor("test.svelte");
    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    expect(result.code).toBe(source);
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

    const processor = createProcessor("test.svelte");
    const result = await processor.transform(
      source,
      "test.svelte",
      resolveRules,
    );

    expect(result.code).not.toContain("import.meta.env.DEBUG");
    expect(result.code).not.toContain("import.meta.env.THEME");
    expect(result.code).not.toContain("import.meta.env.IMAGE_URL");
    expect(result.code).toContain("true");
    expect(result.code).toContain('"dark"');
    expect(result.code).toContain('"https://example.com/image.jpg"');
  });
});
