import { validateWithStats } from "./lib/validate.mjs";

const { errors, libraryCount } = validateWithStats(process.argv[2] || ".");

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ ${libraryCount} libraries valid; all benchmark files resolve.`);
