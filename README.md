# Shaba News Tamil · Folio

Folio is the photographic magazine edition of Shaba News Tamil. It features a three-dimensional cover turn, a photo cursor for mouse readers, and shared-photo transitions when opening a story or returning to the cover. Open `/folio` or the site root to read. Readers can share permanent story links without signing in.

[Open the live Folio](https://shaba-news-tamil-folio.ideastonetech.chatgpt.site/)

The public edition is a static site built from the archived stories with `npm run build:static` and published at the link above. Visitors do not need a running server. The editorial desk and SQLite publishing workflow below still require the standalone Next.js server; changes made there do not appear on the live static site until rebuilt and republished.

## Run locally

Install Node.js 22.13 or later, then run:

```sh
npm ci
npm run dev
```

Open [the local reader](http://localhost:3000/folio). The site starts with Tamil archive stories and their published photos. The editorial desk is disabled until you configure its password.

## Editing and publication

Set a private, unique `STUDIO_PASSWORD` in the hosting environment or an untracked `.env.local`. You can generate a local password on macOS or Linux with:

```sh
(set -C; umask 077; printf 'STUDIO_PASSWORD=%s\n' "$(openssl rand -hex 32)" > .env.local)
```

Use that command only for a new checkout. Restart the server after setting the password. Open `/admin` and sign in at the browser prompt with the username **editor** and your configured password. For production, serve the site over HTTPS and store the password in your host’s secret manager.

Choose **Add news**, enter a headline and body, upload a cover and select a section. **Save draft** keeps the story private. Choose **Preview** to read the saved draft. **Review & publish** saves your edits and opens a confirmation for the current edition's stories, layout and settings. **Library only** keeps a story off the homepage. The **Page layout** tab lets editors reorder sections and stories. Concurrent saves detect stale revisions, and unpublished uploads are available only to authenticated editors.

## Production and verification

```sh
npm run build
npm run typecheck
npm test
npm start
```

This is a standalone Next.js server. Run one instance with persistent, writable storage. SQLite stores drafts and published snapshots in `.data/studio.sqlite`; uploaded images are stored under `.data/media/`. Set `SHABA_DATA_DIR` to change that directory. Keep it private, back it up with the app stopped, and mount it across deploys. The automated publishing test uses its own temporary directory.

The archive reporting, photographs and Shaba brand belong to their original publisher. Each seed article records its original report URL. The Noto Tamil fonts include the SIL Open Font License in `public/fonts/`.

For the archived Shaba stories, **மூலச் செய்தி** opens a full-text Folio view on this site. The source URLs remain in the editorial data for attribution. To refresh the saved article text from the old Shaba pages, run `node scripts/scrape_sources.mjs` and review the updated `lib/originals.json` before publishing. No live scrape runs when a reader opens a story.
