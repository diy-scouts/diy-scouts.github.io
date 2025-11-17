// scripts/build.js
import fs from "fs-extra";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const SRC_DIR = "./badges-src";
const OUT_DIR = "./badges";
const TEMPLATE_PATH = "./templates/badge-template.html";
const INDEX_PATH = path.join(OUT_DIR, "index.html");

async function build() {
  console.log("🌿 Building badge pages...");

  const template = await fs.readFile(TEMPLATE_PATH, "utf-8");
  const files = (await fs.readdir(SRC_DIR)).filter((f) => f.endsWith(".md"));

  const badgeLinks = [];

  for (const file of files) {
    const srcPath = path.join(SRC_DIR, file);
    const raw = await fs.readFile(srcPath, "utf-8");
    const { data, content } = matter(raw);

    marked.setOptions({
      gfm: true, // enables tables, strikethrough, task lists
      breaks: true, // respect single line breaks
      headerIds: false, // avoids weird auto-generated header IDs
    });

    const category = data.category || "default";

    let htmlContent = marked.parse(content);
    htmlContent = htmlContent.replace(
      /<input[^>]*disabled=""[^>]*>/g,
      (match) => match.replace(/disabled=""/, "")
    );
    const finalHTML = template

      .replaceAll("{{description}}", data.description || "")
      .replaceAll("{{title}}", data.title || "Untitled Badge")
      .replaceAll("{{emoji}}", data.emoji || "🏷️")
      .replaceAll("{{type}}", data.type || "Type")
      .replaceAll("{{category}}", data.category || "Category")
      .replaceAll("{{purpose}}", data.purpose || "Purpose")
      .replaceAll("{{overview}}", data.overview || "Overview")
      .replace(
        "{{badge}}",
        `<span class="badge category-${category.toLowerCase()}">${
          data.emoji
        }</span>`
      )
      .replaceAll("{{content}}", htmlContent);

    const outName = file.replace(/\.md$/, ".html");
    const outPath = path.join(OUT_DIR, outName);
    await fs.outputFile(outPath, finalHTML);

    badgeLinks.push({
      title: data.title || "Untitled Badge",
      file: outName,
      emoji: data.emoji || "🏷️",
    });

    console.log(`✅ ${data.title} → ${outName}`);
  }

  await generateIndex(badgeLinks);
  console.log("✨ Done!");
}

async function generateIndex(badges) {
  const listItems = badges
    .map((b) => `<li><a href="badges/${b.file}">${b.emoji} ${b.title}</a></li>`)
    .join("\n");

  const baseIndex = await fs.readFile(INDEX_PATH, "utf-8");
  const updatedIndex = baseIndex.replace(
    /<ul>[\s\S]*<\/ul>/,
    `<ul>\n\t\t\t\t${listItems}\n\t\t\t</ul>`
  );

  await fs.outputFile(INDEX_PATH, updatedIndex);
  console.log("📘 Updated badges index.");
}

const distDir = "./badges";

const badgeFiles = fs
  .readdirSync(distDir)
  .filter((f) => f.endsWith(".html"))
  .map((f) => path.basename(f, ".html"));

fs.writeFileSync(
  path.join(distDir, "index.json"),
  JSON.stringify(badgeFiles, null, 2),
  "utf8"
);

build().catch(console.error);
