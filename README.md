# awesome-zorch

The zorch showcase: browse the libraries built on the
[zorch](https://github.com/fractalyze/zorch) stack, see how fast they run,
and try them.

Everything on the site is generated from the data in this repo. One YAML file
per library; the site rebuilds when `main` changes.

## Layout

```
libraries/<id>.yaml     one library per file (the catalog)
benchmarks/<id>.yaml    measured stats per library (maintainer-only)
schema/                 JSON Schemas with the controlled vocabularies
scripts/validate.mjs    schema and reference checks
site/                   the Next.js site (Vercel, root directory site/)
design.md               design doc: scope, data model, site structure
```

## Quick start

```bash
npm install
npm run validate        # check the data

cd site && npm install
npm run dev             # run the site from the YAML one level up
npm run build           # production build; set GITHUB_TOKEN to fetch
                        # READMEs and stars of still-private repos
```

## Contributing

Add your library with one `libraries/<id>.yaml` and open a PR. CI validates,
a maintainer reviews. See [CONTRIBUTING.md](CONTRIBUTING.md).

Benchmark numbers are measured and committed by maintainers only. Want your
library measured? Open an issue.

## License

[Apache-2.0](LICENSE).
