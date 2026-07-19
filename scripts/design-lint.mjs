// Design-system lint (design.md §9). Flags drift away from the tokens/vocabulary.
//
//   node scripts/design-lint.mjs src/app/foo/page.tsx [more files...]   # CLI, exit 1 on violations
//   (no args) → hook mode: reads a Claude Code PostToolUse payload on stdin,
//              lints the edited file, exit 2 on violations (feeds stderr back to Claude).
//
// Deliberately narrow: only high-signal, unambiguous violations so it never
// fights legitimate structural values (Container max-w-[...], aspect-[3/2]).
import { readFileSync } from "node:fs";

const PALETTE =
  "gray|zinc|slate|neutral|stone|red|green|blue|amber|yellow|orange|lime|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose";

const RULES = [
  {
    id: "palette-utility",
    re: new RegExp(
      `\\b(bg|text|border|ring|from|to|via|divide|fill|stroke|outline|placeholder|shadow|accent|caret)-(${PALETTE})-\\d{2,3}\\b`,
    ),
    msg: "Tailwind palette color — use a design token (bg-surface, text-foreground, border-border, text-brand…).",
  },
  {
    id: "hardcoded-hex",
    re: /#[0-9a-fA-F]{3,8}\b/,
    msg: "Hardcoded hex color — use a token.",
  },
  {
    id: "hardcoded-func-color",
    re: /\b(rgba?|hsla?)\(/,
    msg: "Hardcoded rgb/hsl color — use a token.",
  },
  {
    id: "arbitrary-color",
    re: /-\[(#|rgb|hsl)/,
    msg: "Arbitrary color value — use a token.",
  },
  {
    id: "white-black",
    re: /\b(bg|text|border)-(white|black)\b/,
    msg: "bg/text-white|black — use tokens (bg-surface / text-foreground / bg-primary).",
  },
  {
    id: "page-max-width",
    re: /\bmax-w-2xl\b/,
    msg: "Page-width literal — wrap the page in <Container> (wide/app/prose/card) instead.",
  },
];

// Ignore matches inside comment lines and import paths.
function isIgnorable(line) {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

function lintFile(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return [];
  }
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (isIgnorable(line)) return;
    for (const rule of RULES) {
      const m = line.match(rule.re);
      if (m) out.push({ file, line: i + 1, rule: rule.id, match: m[0], msg: rule.msg });
    }
  });
  return out;
}

function report(violations) {
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}] "${v.match}" — ${v.msg}`);
  }
}

const args = process.argv.slice(2);

if (args.length > 0) {
  // CLI mode
  const all = args.flatMap(lintFile);
  if (all.length) {
    console.error(`✗ design-lint: ${all.length} violation(s):`);
    report(all);
    process.exit(1);
  }
  console.log("✓ design-lint: clean");
  process.exit(0);
} else {
  // Hook mode — read PostToolUse payload from stdin
  let raw = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (raw += c));
  process.stdin.on("end", () => {
    let file;
    try {
      const payload = JSON.parse(raw);
      file = payload?.tool_input?.file_path;
    } catch {
      process.exit(0);
    }
    if (!file || !/\.(tsx|jsx)$/.test(file) || !file.replace(/\\/g, "/").includes("/src/")) {
      process.exit(0);
    }
    const all = lintFile(file);
    if (all.length) {
      console.error(
        `Design-system violations in ${file} (design.md §9). Fix before continuing:`,
      );
      report(all);
      process.exit(2); // exit 2 → stderr is surfaced back to Claude
    }
    process.exit(0);
  });
}
