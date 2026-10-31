# Contributing

New connectors are the most valuable contribution.

1. Add `connectors/<name>.js` (see "Write a connector" in the README) and register it in `connectors/index.js`.
2. Prefer free, key-less, stable public APIs. If a key is required, read it with `"${YOUR_KEY}"` and document it.
3. Trim responses with `pick` / `fields` so results stay small.
4. Add a case to `scripts/smoke.js`, then run `npm test` and `npm run smoke`.
5. Only add services whose terms allow automated API access.
