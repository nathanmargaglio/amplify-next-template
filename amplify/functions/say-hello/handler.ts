import type { Schema } from "../../data/resource"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client()
const bucketName = "amplify-test-serve"

async function fetchS3File(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({ Bucket: bucketName, Key: key })
    const response = await s3Client.send(command)
    return (await response.Body?.transformToString()) ?? ""
  } catch {
    return ""
  }
}

async function inlineResources(html: string, basePath: string): Promise<string> {
  const baseDir = basePath.includes("/")
    ? basePath.substring(0, basePath.lastIndexOf("/") + 1)
    : ""

  // Inline CSS
  const cssMatches = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi)]
  for (const match of cssMatches) {
    const href = match[1]
    if (!href.startsWith("http")) {
      const cssPath = href.startsWith("/") ? href.substring(1) : baseDir + href
      const css = await fetchS3File(cssPath)
      if (css) html = html.replace(match[0], `<style>${css}</style>`)
    }
  }

  // Inline JS
  const jsMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi)]
  for (const match of jsMatches) {
    const src = match[1]
    if (!src.startsWith("http")) {
      const jsPath = src.startsWith("/") ? src.substring(1) : baseDir + src
      const js = await fetchS3File(jsPath)
      if (js) html = html.replace(match[0], `<script>${js}</script>`)
    }
  }

  return html
}

export const handler: Schema["sayHello"]["functionHandler"] = async (event) => {
  const path = event.arguments.path || "index.html"

  const command = new GetObjectCommand({ Bucket: bucketName, Key: path })
  const response = await s3Client.send(command)
  const contentType = response.ContentType || ""
  let body = (await response.Body?.transformToString()) ?? ""

  if (contentType.includes("text/html") || path.endsWith(".html")) {
    body = await inlineResources(body, path)

    const interceptScript = `
      <script>
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link && link.href) {
            e.preventDefault();
            const url = new URL(link.href);
            window.parent.postMessage({ type: 'navigate', path: url.pathname.replace(/^\\//, '') }, '*');
          }
        });
      </script>
    `
    body = body.includes("</body>")
      ? body.replace("</body>", `${interceptScript}</body>`)
      : body + interceptScript
  }

  return body
}