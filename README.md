# Spark — website (static build)

Conversion-focused, SEO-friendly Spark solar/battery site, built as **plain
static HTML/CSS/JS with no runtime dependency** (no React, no build step).

## ⚠️ Repo layout — this is what fixes the 404

**These files must sit at the ROOT of your GitHub repo** — `index.html` at the
top level, NOT inside a `site/` subfolder. If `index.html` is nested, Vercel
serves the repo root (which has no `index.html`) and you get a 404 on `/`.

```
your-repo/
├── index.html        ← must be here, at the top
├── get-a-quote.html
├── app.js  flows.js  styles.css
├── assets/
├── vercel.json
├── sitemap.xml  robots.txt
└── ...
```

## Updating your existing repo

From the folder where you unzipped this, with your repo checked out:

```bash
# from inside your local clone of the GitHub repo:
rm -rf *.html assets app.js flows.js styles.css vercel.json robots.txt sitemap.xml og-image.png README.md
cp -R /path/to/this/unzipped/. .
git add -A
git commit -m "Update site (canonical tags + SEO redirects); flatten to repo root"
git push
```

Then in Vercel → **Deployments** it will auto-build. Confirm **Settings →
Build & Deployment → Root Directory** is empty / `./` and **Framework: Other**.

## What's inside

- 31 pages (home, products, guides, 11 city pages, quote flow, reviews, legal).
- `app.js` — FAQ, live chat, savings/heat-pump/EV calculators, animated chart, forms.
- `flows.js` — get-a-quote wizard, EV cart (localStorage) + drawer, EV checkout.
- `vercel.json` — keeps `.html` URLs, 1-year asset caching, and 30+ SEO redirects
  from old WordPress paths (`/solar-panels` → `/solar-and-battery.html`, etc.).
  **Review those redirects against Google Search Console before go-live.**
- `<link rel="canonical">` on every page.

## Notes

- Accreditation marks render as branded text badges — drop the real logo PNGs in
  `assets/` and swap the badges for `<img>` when you have them.
- Forms + live chat are front-end prototypes — connect to your CRM/email/chat provider.
- `og:image` points to `https://sparkhome.co.uk/og-image.png` (included at root),
  so social cards resolve once your domain is live.
