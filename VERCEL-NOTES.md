# vercel.json notes

Spark Vercel config. Keeps .html URLs (matches the canonical tags in every page). Domain www<->apex + HTTPS is set in Vercel > Project > Settings > Domains (make https://sparkhome.co.uk the primary; www auto-301s to it). The redirects below preserve SEO from the OLD WordPress URLs — CONFIRM each old path against Google Search Console > Pages before go-live and edit/remove as needed.

---

Moved out of `vercel.json` on 19 Aug 2026: Vercel's config schema rejects unknown keys such as `$schema_note`, which made production builds fail with `should NOT have additional property $schema_note`. Keep commentary in this file instead.
