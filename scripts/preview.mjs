import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const readmePath = join(repoRoot, "README.md");
const cssPath = fileURLToPath(import.meta.resolve("github-markdown-css/github-markdown.css"));

const HOST = process.env.HOST ?? "0.0.0.0";
const PORT = Number(process.env.PORT ?? 3000);

marked.setOptions({ gfm: true, breaks: false });

function page(bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>README preview</title>
  <link rel="stylesheet" href="/github-markdown.css" />
  <style>
    body { margin: 0; background: #f6f8fa; }
    .markdown-body {
      box-sizing: border-box;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background: #ffffff;
    }
    @media (max-width: 767px) { .markdown-body { padding: 15px; } }
  </style>
</head>
<body>
  <article class="markdown-body">
${bodyHtml}
  </article>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/github-markdown.css") {
      const css = await readFile(cssPath, "utf8");
      res.writeHead(200, { "content-type": "text/css; charset=utf-8" });
      res.end(css);
      return;
    }

    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // Re-read README on every request so edits show up on refresh.
    const markdown = await readFile(readmePath, "utf8");
    const html = marked.parse(markdown);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(page(html));
  } catch (err) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Failed to render README: ${err.message}`);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`README preview running at http://${HOST}:${PORT}`);
});
