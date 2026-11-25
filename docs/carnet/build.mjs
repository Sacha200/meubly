// Carnet de bord : genere docs/carnet/<phase>/*.html depuis docs/carnet/src/<phase>/*.html.
// Remplace {{css}} par src/carnet.css et {{code:chemin}} par le contenu reel du fichier du depot,
// pour que le code affiche soit toujours celui qui est commite.
// Usage, depuis la racine du depot : node docs/carnet/build.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");
const src = join(here, "src");
const css = readFileSync(join(src, "carnet.css"), "utf8").trim();
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const head =
  '<!doctype html>\n<html lang="fr">\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';

for (const phase of readdirSync(src, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  mkdirSync(join(here, phase.name), { recursive: true });
  for (const page of readdirSync(join(src, phase.name)).filter((f) => f.endsWith(".html"))) {
    const html = readFileSync(join(src, phase.name, page), "utf8")
      .replace("{{css}}", css)
      .replace(/\{\{code:([^}]+)\}\}/g, (_, path) =>
        escape(readFileSync(join(repo, path), "utf8").replace(/\r\n/g, "\n").trimEnd())
      );
    if (/\{\{(css|code:)/.test(html)) throw new Error(`${page} : marqueur non remplace`);
    writeFileSync(join(here, phase.name, page), head + html);
    console.log(`${phase.name}/${page}`);
  }
}
