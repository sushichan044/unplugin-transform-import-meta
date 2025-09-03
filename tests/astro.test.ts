import { describe, expect, it } from "vitest";

import { createProcessor, detectLanguage } from "../src/core/processors";
import { transformWithReplacements } from "../src/core/transform";

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

    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );
    expect(transformedCode).not.toContain("import.meta.env.NODE_ENV");
    expect(transformedCode).not.toContain("import.meta.env.BASE_URL");
    expect(transformedCode).toMatchInlineSnapshot(`
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

  it("should transform import.meta in Astro script tags", async () => {
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

    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );

    expect(transformedCode).toMatchInlineSnapshot(`
      "---
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
      </html>"
    `);
    expect(transformedCode).not.toContain("import.meta.env.MODE");
    expect(transformedCode).not.toContain("import.meta.env.PUBLIC_API_URL");
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

    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );
    expect(transformedCode).toBe(source);
    expect(result.warnings).toHaveLength(0);
  });

  it("should transform import.meta in Astro expressions", async () => {
    const source = `---
const title = "Astro Test Page";
---

<html>
<head>
    <title>{title}</title>
</head>
<body>
    <h1>{title}</h1>
    <p>Mode: {import.meta.env.MODE}</p>
    <div>API: {import.meta.env.VITE_API_URL || "default"}</div>
</body>
</html>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.MODE": "production",
        "env.VITE_API_URL": "https://api.prod.com",
      },
    };

    const processor = createProcessor("test.astro");
    const result = await processor.transform(
      source,
      "test.astro",
      resolveRules,
    );

    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );
    expect(transformedCode).toContain('"production"');
    expect(transformedCode).toContain('"https://api.prod.com"');
    expect(transformedCode).not.toContain("import.meta.env.MODE");
    expect(transformedCode).not.toContain("import.meta.env.VITE_API_URL");
  });

  it("should transform import.meta in all Astro contexts (frontmatter + script + expression)", async () => {
    const source = `---
const title = "Comprehensive Test";
const frontmatterEnv = import.meta.env.NODE_ENV;
const frontmatterUrl = import.meta.env.BASE_URL;
---

<html>
<head>
    <title>{title}</title>
</head>
<body>
    <h1>{title}</h1>
    <p>Frontmatter env: {frontmatterEnv}</p>
    <p>Expression mode: {import.meta.env.MODE}</p>
    <div>Expression API: {import.meta.env.VITE_API_URL}</div>

    <script>
        console.log("Script env:", import.meta.env.NODE_ENV);
        const scriptMode = import.meta.env.MODE;
        window.config = {
            apiUrl: import.meta.env.VITE_API_URL,
            baseUrl: import.meta.env.BASE_URL
        };
    </script>
</body>
</html>`;

    const resolveRules = {
      methods: {},
      properties: {
        "env.BASE_URL": "/app/",
        "env.MODE": "build",
        "env.NODE_ENV": "production",
        "env.VITE_API_URL": "https://api.example.com",
      },
    };

    const processor = createProcessor("test.astro");
    const result = await processor.transform(
      source,
      "test.astro",
      resolveRules,
    );

    const transformedCode = transformWithReplacements(
      source,
      result.replacements,
    );

    // Check that all import.meta references are replaced
    expect(transformedCode).not.toContain("import.meta");

    // Check specific replacements
    expect(transformedCode).toContain('"production"');
    expect(transformedCode).toContain('"build"');
    expect(transformedCode).toContain('"https://api.example.com"');
    expect(transformedCode).toContain('"/app/"');

    // Verify no warnings were generated
    expect(result.warnings).toHaveLength(0);
  });
});
