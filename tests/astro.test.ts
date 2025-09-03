import { describe, expect, it } from "vitest";

import { createProcessor, detectLanguage } from "../src/core/processors";

describe("Astro support", () => {
  it("should detect Astro files", () => {
    expect(detectLanguage("App.astro")).toBe("astro");
    expect(detectLanguage("component.astro")).toBe("astro");
    expect(detectLanguage("index.js")).toBe("ecma");
    expect(detectLanguage("index.ts")).toBe("ecma");
  });

  it("should transform import.meta in Astro frontmatter", async () => {
    const resolveRules = {
      methods: {},
      properties: {
        "env.BASE_URL": "/app/",
        "env.NODE_ENV": "development",
      },
    };

    const source = `---
const title = "Astro Test Page";
const env = import.meta.env.NODE_ENV;
const baseUrl = import.meta.env.BASE_URL;
---

<html>
<head>
    <title>{title}</title>
</head>
<body>
    <h1>{title}</h1>
    <p>Environment: {env}</p>
    <p>Base URL: {baseUrl}</p>
</body>
</html>`;

    const processor = createProcessor("test.astro");
    const result = await processor.transform(
      source,
      "test.astro",
      resolveRules,
    );

    expect(result.code).not.toContain("import.meta.env.NODE_ENV");
    expect(result.code).not.toContain("import.meta.env.BASE_URL");
    expect(result.code).toMatchInlineSnapshot(`
      "---
      const title = "Astro Test Page";
      const env = "development";
      const baseUrl = "/app/";
      ---

      <html>
      <head>
          <title>{title}</title>
      </head>
      <body>
          <h1>{title}</h1>
          <p>Environment: {env}</p>
          <p>Base URL: {baseUrl}</p>
      </body>
      </html>"
    `);
  });

  it.skip("should transform import.meta in Astro script tags", async () => {
    // TODO: Implement script tag transformation
    const source = `---
const title = "Astro Test Page";
---

<html>
<head>
    <title>{title}</title>
</head>
<body>
    <h1>{title}</h1>

    <script>
        console.log("Client script:", import.meta.env.MODE);
        const apiUrl = import.meta.env.PUBLIC_API_URL || "http://localhost";
    </script>
</body>
</html>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.MODE": "production",
        "env.PUBLIC_API_URL": "https://api.example.com",
      },
    };

    const processor = createProcessor("test.astro");
    const result = await processor.transform(
      source,
      "test.astro",
      resolveRules,
    );

    expect(result.code).toContain('"production"');
    expect(result.code).toContain('"https://api.example.com"');
    expect(result.code).not.toContain("import.meta.env.MODE");
    expect(result.code).not.toContain("import.meta.env.PUBLIC_API_URL");
  });

  it("should handle Astro file without import.meta", async () => {
    const source = `---
const title = "Simple Astro Page";
---

<html>
<head>
    <title>{title}</title>
</head>
<body>
    <h1>{title}</h1>
</body>
</html>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.NODE_ENV": "development",
      },
    };

    const processor = createProcessor("test.astro");
    const result = await processor.transform(
      source,
      "test.astro",
      resolveRules,
    );

    expect(result.code).toBe(source);
    expect(result.warnings).toHaveLength(0);
  });
});
