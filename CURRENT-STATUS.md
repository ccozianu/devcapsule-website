# Website current status

State: the visitor-experience work order is published. The owner merged the
seven stacked branches as PR #7 (`6759b9d`) and promoted the test candidate
to production on 2026-09-28; the live verification is below. Delivery: SSH
push, owner merges PRs and runs the publication workflows.

## Live verification (2026-09-28, 21:08 UTC build)

Checked by the agent against `https://devcapsule.mycodespace.ai` after the
owner reported publication:

- HTTP 200 on `/`, `/docs/`, `/docs/current/`, the current first-session
  guide, `/journal/`, `/releases/`, `/why/`, `/sitemap.xml`, `/robots.txt`
  and the `/blog/` redirect.
- `build-info.json`: implementation `6759b9d` (the PR #7 merge), content
  `2ec36b9` clean, contract 1, current `0.2.15`, versions devel
  (development), 0.2.15 (supported), 0.2.14 and 0.2.12 (deprecated);
  promotion from candidate `website-candidate-36484073029-1` with the
  origin-only transformation.
- `robots.txt` allows crawling and names the production sitemap; the sitemap
  lists 49 pages at the production origin.
- The 0.2.14 first-session guide carries its own canonical, as a deprecated
  page absent from `current` should, and no robots meta.
- The colour-scheme select is served with Catppuccin latte first.

So the producer has landed its side: a manifest with the four versions,
the journal front matter and the README markers are in content `2ec36b9`.
The acceptance item "against the producer's main at the pin" is therefore
met by the live build. Not checked by the agent: Search Console and Bing
submission of the sitemap, and indexing evidence; those remain W00.

## Work order execution (2026-09-28)

### Owner request after review — colour schemes: delivered, awaiting merge

Branch `colour-schemes` from `publication`. The owner reviewed the local
test site (the parent's checkout at `http://localhost:8080`, building
implementation `31e85b1` against producer branch `ws-website/contract-v1`
at `3325172`, which already carries a manifest) and asked for a drop-down of
open-source colour schemes instead of the night-mode switch, as the reference
site offers. The header now has a "Colour scheme" select: Day & night
(system), DevCapsule day, DevCapsule night, Solarized light and dark,
Gruvbox light and dark, Nord, Catppuccin latte and mocha. Each scheme sets
every token via `data-palette` on the root; the empty choice removes the
attribute and follows the system preference again; the choice persists per
browser under `palette`, and an earlier `theme` choice migrates. Without
JavaScript the select stays hidden and the system preference applies.

Validated: every scheme's token pairs a reader meets were checked for WCAG
AA by a generator script before the CSS was written (seven pairs were
adjusted); 21 unit tests, build and `npm run check` pass; browser checks
pass with 57 audits, now including the home page and the current
first-session guide in every scheme, the picker's persistence and its return
to the system, plus one contrast defect the audit caught and this branch
fixes (the "current" switcher label now inherits the ink colour). Hero
screenshots of Solarized light, Gruvbox dark, Nord and Catppuccin latte were
inspected by eye. Compare link:
[publication…colour-schemes](https://github.com/ccozianu/devcapsule-website/compare/publication...colour-schemes).

Second review, same day: the owner chose Catppuccin latte as the default
and reported the drop-down's options rendering white on white in the dark
schemes. Now the root tokens are Catppuccin latte, so it applies with no
stored choice and without JavaScript; "DevCapsule day & night (system)" is a
selectable scheme carrying the former default behaviour; and the select
declares a light colour scheme with explicit dark text on a white popup for
its options, so the list reads the same in every scheme. The audit caught
that the closing band's contributor text inherited prose colours meant for
paper; it now uses the band tokens. Browser checks: 59 audits pass.

### Slice 6 — publication: prepared, awaiting the owner

Branch `publication` from `releases`. The production check now accepts a
candidate that predates the sitemap, so rollback keeps working. A local
end-to-end dry run of the publication path passed on this implementation:
a clean production-mode build for the test origin (176 pages, 13368 links,
48 sitemap entries) was packaged as the parent's candidate job packages it
(410737 bytes, ustar), downloaded through the public-asset code path with a
stub fetch, promoted (canonical links, the robots sitemap reference and the
sitemap locations moved to `https://devcapsule.mycodespace.ai`, `builtAt`
preserved, provenance recorded), and passed `npm run check`; the same output
without `sitemap.xml` and with the old two-line robots policy also passed,
which is the rollback shape. `npm run test:updates` on a clean clone of the
`publication` branch passed against the scratch content: npm ci, build,
paragraph update, independent styling update with an unchanged content
digest, subdirectory links and production metadata.

A hosted candidate does not exist yet and cannot be created from here: the
parent **Website** workflow is the owner's manual dispatch, and it builds
producer `main` with the pinned website revision, which today is `78b7b7f`.
The runbook for the owner, in order:

1. Merge the six PRs in the order above (each is a fast-forward of the last).
2. In DevCapsule, one change by its `website` workstream: `docs/versions.yaml`
   with `contract: 1` (requests 1 and 3 under slice 2, with `legacy: true`
   on the pre-contract entries), front matter on the journal entries
   (request 2), the README markers of CONTRACT.md 3.7 (request 5), the
   three quoted descriptions (request 3), the `website` pin advanced to the
   merged `main` revision, and the gate running
   `npm --prefix website run check:content`. Until `docs-0.2.15` carries the
   corrected guides, `current` cannot be a legacy tree because the six roles
   are missing there; either correct the guides first or make `devel`
   current for the first publication and say so in the notice.
3. Dispatch **Website** on DevCapsule `main` with mode `production`, origin
   `https://test-devcapsule.mycodespace.ai`, base path `/`. Review the test
   site: home, `/docs/`, `/docs/current/`, the switcher, `/journal/`,
   `/releases/`, night mode, a phone width.
4. Run **Publish production website** here with the candidate tag, then
   check production HTTPS, `/sitemap.xml`, `/build-info.json` and submit the
   sitemap in Search Console and Bing Webmaster Tools (W00).

Production publication needs the owner's explicit acceptance and is not
performed by the agent.

### Slice 5 — releases: delivered, awaiting merge

Branch `releases` from `home-page`. `/releases/` lists every
`engineering-docs/releases/<tag>/notes.md` newest first with its description
and release date; `/releases/<tag>/` renders the notes with links to the
GitHub release and to that version's documentation when the manifest lists
it. The home page's releases strip names the current release and its date
from the manifest and the notes and links the notes, all releases and all
documentation versions. Releases joins the navigation, which is now Docs ·
Start here · Journal · Releases · GitHub as the work order asks. The release
date is the first "Released YYYY-MM-DD" in the notes (CONTRACT.md 3.6).

Validated: 21 unit tests pass, including the release fixture (order, date,
documentation links, front matter required). Preview build and
`npm run check` pass (180 pages). Browser checks: 39 audits including
`/releases/` and `/releases/v0.2.15/` pass at 1440px and 360px in both
schemes; the header now wraps at 360px rather than overflowing. The release
page, the index and the home strip at 1440px and the index at 360px were
inspected by eye: 0.2.14 and 0.2.15 are listed with their notes.

### Slice 4 — home page: delivered, awaiting merge

Branch `home-page` from `design-system`. The landing page is assembled from
stable section identities (W07, CONTRACT.md 3.7): HTML-comment markers in
the README name the `hero`, `benefits`, `fit`, `dogfood`, `why`,
`comparison` and `contribute` sections; the three pillars are the
`getting-started`, `your-project` and `agents` role pages with their titles
and descriptions; the health badges moved to the footer; the hero carries the
current version beside its one action and a quiet in-page secondary. New
routes: `/why/` from the `why`, `comparison` and `fit` sections; `/contribute/`
as a "coming soon" stub until the producer authors that section; `/journal/`
with `/blog/` and every old entry address redirecting. Navigation is Docs ·
Start here · Journal · GitHub; Releases joins in slice 5, where the releases
strip (section 6 of the home page) also lands, because its link target does
not exist yet. No product text is typed in templates; the labels are the
section eyebrows, button labels and the stub notice. A README without
markers falls back to the original heading adapter so the test site builds
before the producer adopts the markers; the fallback is deleted with W07.

Validated: 20 unit tests pass, including the marked fixture README, its
named failures (unknown or duplicated marker, hero without heading, more
than four benefits), the fallback, the journal aliases and the `/why/` and
`/contribute/` pages. Preview build and `npm run check` pass (177 pages,
13017 links). Browser checks: 33 page/viewport/scheme audits over the home,
docs, journal, `/why/` and `/contribute/` pages pass, plus the `/blog/`
redirect. Home at 1440px and 360px and `/why/` at 1440px were inspected by
eye against a scratch README carrying markers around its existing prose.

Not validated: the test site; the `fit` and `contribute` sections and the
hero chips are exercised only by the fixture until the producer authors
them.

**Further requests to DevCapsule.** (5) Adopt the README markers of
CONTRACT.md 3.7; author the `fit` section (good fit today / not yet,
including macOS and "every edge has a file") and the `dogfood` line, and
later the `contribute` section. (6) The work order's `/why/` also wants the
comparison note; it is linked from the README today and stays a GitHub link
until the producer decides whether `engineering-docs/design-notes/…/competitive-comparison.md`
joins the published inputs (an additive contract change).

### Slice 3 — design system: delivered, awaiting merge

Branch `design-system` from `contract-v1`. `src/assets/site.css` is rewritten
around tokens: the reference pairing Fraunces (variable serif, display) and
Atkinson Hyperlegible (body), self-hosted as latin woff2 files under
`src/assets/fonts/` with their SIL Open Font License texts and no third-party
fetch; a `clamp()` type scale (`--fs-*`), body 1.0625rem at line-height 1.6;
the spacing scale `--s-1` (0.25rem) to `--s-9` (6rem); `--w-prose: 70ch`;
radii; and two palettes from the same names, tuned to WCAG AA. The header
and hero sit on one deep-green band, the closing call to action on another,
and the page between is paper with alternating calm sections. Cards, pillars,
banners, the switcher, sidebar and prose use tokens only; the only literal
colours left are inside the IDE illustration, which is a picture of an IDE
at night in both modes, and the syntax highlighting inside code blocks. The
existing home sections are restyled on the new system; slice 4 restructures
them.

Validated: 18 unit tests, preview build and `npm run check` (168 pages,
12317 links including the eight font files) pass. Browser checks now audit
1440px and 360px: 27 page/viewport/scheme audits pass without overflow or
WCAG A/AA violations in either palette, with the switch, anchors, keyboard
and no-JavaScript navigation. Home in both palettes at 1440px, the current
first-session guide at 1440px, and the home page and journal at 360px were
inspected by eye.

Not validated: the test site; `npm run test:updates` was run for slice 2 and
the styling change is exercised by its independent-styling step in the same
way, but the run was not repeated for this slice.

### Slice 2 — contract version 1: delivered, awaiting merge

Branch `contract-v1` from `take-2026-09-22-delivery`. [CONTRACT.md](CONTRACT.md)
records the accepted contract, implementing the producer's design with its
section 11a decisions, and lists what this consumer added or interpreted
(section 8): the additive `legacy: true` manifest field for the pre-contract
sources the owner decided to publish as they are, `source: main` as the
checkout's working tree, tokens rendering the entry's version under
`source-version`, `noindex` for planned and historical pages, sidebar areas
derived from the overview page, and alias preference. Implemented: manifest
parsing with the version check, front matter with the R-DOCS-003 fields plus
`role` and `planned`, tokens and the typed-version check, the per-version
build with once-only rendering of immutable sources cached by commit, the
versions index at `/docs/`, the `current` copy with canonicals and robots by
status, role resolution used by the header, hero, footer and 404, the
switcher and banners, redirect pages for aliases, the shared fixture and
`npm run check:content` for the producer's gate. The `yaml` package was added
to the dependency lock for the manifest and front matter.

Validated: 18 unit tests pass, including every named failure of the contract
provoked from the fixture and the once-only build (a `main` change re-renders
only `devel`; a manifest status change re-renders nothing). Against a scratch
copy of producer `main` `d9b9975` with a preview manifest and journal front
matter added locally (see the requests below), preview and production-mode
builds pass `npm run check` (166 pages, 11951 links, 44 sitemap entries,
6 alias redirects) and `npm run check:content`. Browser checks pass: 27
page/viewport/scheme audits over the home page, the versions index, the
current, devel and 0.2.14 first-session guides, a 0.2.14 historical page and
the journal, without overflow or WCAG A/AA violations; the switcher reaches
0.2.14's index from a page it lacks; the old `/docs/guides/first-session/`
URL redirects to the current guide; no-JavaScript navigation through the
sidebar works. The versions index, the current and 0.2.14 guides at 1440px
and the current guide at 390px were inspected by eye.

The clean-clone acceptance `npm run test:updates` passes against the scratch
content, after it caught two defects now fixed: the cached rendering of an
immutable version is keyed by base path, and the breadcrumb applied the base
path only to one branch of a conditional.

Not validated: the test site, and the acceptance item "against the
producer's `main` at the pin", which needs the producer requests below. The production sitemap now lists 0.2.14's and 0.2.12's guide
pages that have no counterpart in `current`; W00 may revisit that with the
owner's Search Console evidence.

**Requests to DevCapsule (recorded here per work order section 7).**

1. `docs/versions.yaml` does not exist on any producer branch. Add it with
   `contract: 1`, the owner's notice, and the bootstrap of the companion
   order's section 3, using `legacy: true` on the 0.2.14 and 0.2.12 entries
   (CONTRACT.md 3.5). While `docs-0.2.15` still equals `v0.2.15`, its guides
   are pre-contract too: either mark that entry `legacy: true` or, better,
   carry the corrected guides onto it first; note that with a legacy tree as
   `current` the build fails on the missing roles, by design.
2. Journal entries under `engineering-docs/blog/` have no front matter; the
   build requires `description` on each and `draft: true` on the two
   2026-09-19 retrospectives, per R-DOCS-003.
3. Three descriptions are not valid YAML because of an unquoted colon:
   `docs/sessions/another-machine.md`, `docs/reference/configuration-nodes.md`
   and `docs/reference/cli.md`. Quote them.
4. The currently pinned website (`78b7b7f`) no longer builds against
   producer `main` since the documentation restructure; the pin must advance
   to the merged slice 2 revision together with items 1 to 3, and the gate
   should run `npm --prefix website run check:content`.

### Slice 1 — take the 2026-09-22 delivery: delivered, awaiting merge

Branch `take-2026-09-22-delivery` from `main` (which carries the owner's local
lock commit `acade9c`, preserved and pushed with it). It merges
`requests-from-devcapsule-2026-09-22` without conflicts: the contract request
pointer, the DevCapsule workflow definition 0.2.14 (`WORKFLOW.md`,
`WORKFLOW-LOCAL.md`, the generic `AGENTS.md` with website instructions, the
`[workflow]` table). The declared workflow version stays 0.2.14 as the
definition requires; the owner's lock commit names 0.2.15 defaults for the
capsule components only.

The branch only recorded the sitemap and night mode as requests; the work
order's "done" for this slice needs them served, so this slice implements them:

- `sitemap.xml` listing exactly the indexable pages (all ordinary pages in a
  production build, none in a preview build) with `lastmod` for journal
  entries; `robots.txt` references it in production mode. `npm run check`
  verifies both; promotion moves their origin to production and still accepts
  older candidates without a sitemap. Backlog W00 and W09 carry the progress.
- Night mode (new backlog task W14): both palettes from the same tokens,
  `color-scheme: light dark`, system preference by default, a header switch
  that persists per browser and stores only a deviation from the system, and
  no JavaScript needed for the system preference to apply.

Validated: 15 unit tests pass; preview and production-mode builds pass with
`npm run check` (22 pages, 861 links, 21 sitemap entries in production mode,
0 in preview). Browser checks pass: 18 page/viewport/scheme audits without
overflow or WCAG A/AA violations, keyboard and anchor navigation, the switch
and its persistence, and no-JavaScript navigation in both schemes. Desktop
light and dark home pages and the mobile no-JavaScript dark documentation page
were inspected by eye. These checks ran against DevCapsule `3e92a1d`, the last
`main` revision with the old `docs/guides/` layout; see the note below.

Not validated: the test site. It is built by the owner's manual parent
**Website** workflow after DevCapsule advances its website pin; the agent has
no dispatch rights. Search Console and Bing submission of the sitemap remain
the owner's W00 work.

**Producer state found on 2026-09-28.** DevCapsule `main` (`d9b9975`) already
carries the 0.2.15 documentation under the contract: thirteen areas under
`docs/`, front matter with `role` on six pages and `status: planned` on
fifteen stubs, tokens instead of typed versions, and release notes for 0.2.14
and 0.2.15 under `engineering-docs/releases/<tag>/notes.md`. It does not yet
carry `docs/versions.yaml` or journal front matter, and the README's headings
are unchanged. Because the old `docs/guides/` files are gone, the currently
pinned website (`78b7b7f`) and this slice both fail to build against producer
`main`; only slice 2 restores that. This is the producer's migration item 3 of
the companion order, landing with the pin, and is not a website defect.

## Current result

The static website is delivered and public on both domains. Product content
remains authored in DevCapsule; this repository owns presentation and publishing
machinery. The owner accepted the autonomy experiment and is reviewing follow-up
work. [BACKLOG.md](BACKLOG.md) now owns W00–W13, their evidence, acceptance
criteria and producer dependencies. It includes the content–website contract
(W12), which was previously discussed but not yet given a full task record.

## Ownership handoff (2026-09-19)

DevCapsule owns authored text, editorial status/version decisions, descriptions
and product media. This repository owns website functionality, appearance,
navigation, rendering, search/analytics and publishing machinery. The existing
parent GitHub workflow remains in place; its physical location does not make
website behavior a content responsibility. Parent integration task I01 coordinates
changes to that caller. Mixed work is split into linked producer tasks, not
duplicated implementation backlogs.

The full W01 publishing bug evidence is in
[the website bug record](engineering-docs/bugs/website/2026-09-19-test-publishing-accepts-inconsistent-settings.md),
confirmed and open; the parent keeps a retired transfer pointer. W09 keeps its
original scope; W00 remains first. W13 analytics is planned second-stage work
and is not counted as an initial implementation defect.

No source behavior, workflow, deployment, or new service changed during this
handoff. Review task coverage, links and the paired parent/submodule changes;
implementation testing is not evidence for the quality of this backlog split.

## Urgent Google verification (2026-09-19)

The owner supplied `googledda808d7513923e5.html` and requested a quick fix for
Search Console verification. `src/static/` now copies to the site root unchanged.
Page checking and promotion validate root Google verification responses and
preserve them without normal-page metadata. Other HTML keeps its existing checks.
This is a bounded W00 prerequisite, not completion of search indexing work.

Validation: all 12 tests pass, including exact file preservation through candidate
packaging, download and promotion, and rejection of malformed verification bodies.
Production-mode test-origin build and all 582 local link/asset checks pass;
the built verification file matches its source byte for byte. No visual change,
browser campaign or container build was needed. The fix is merged in website
main at `2f7cc75`. The owner reports successful publication and Google Search
Console processing the indexing data. This is owner-reported progress, not an
agent observation of indexing or permission to close W00; see BACKLOG.md.

Live verification on 2026-09-18: production HTTPS, homepage, docs overview,
first-session guide and journal return HTTP 200 with production canonical URLs
and the visible 00:43 UTC build timestamp. Production build-info identifies
content `5a4b35435ee3e1cb460b48d292f15e5efe5228be`, implementation
`0691956e3aa383b74c9fb87f4d46140136b8a0b6`, and promoted public release
`website-candidate-35292339140-1`. Anonymous retrieval of that release's metadata
confirmed matching source revisions and archive checksum provenance.

Test HTTPS and the same four routes also pass. Its newer 00:57 UTC build has
production canonical URLs, although it is served on the test hostname. That
build does not meet the current candidate packaging checks; this does not affect
the earlier valid candidate already promoted to production. Future test runs
must use test origin `https://test-devcapsule.mycodespace.ai` and base path `/`.

SSH push is the agent's delivery path; the owner creates/merges PRs and runs
publication workflows. No personal token or expiring credential is required.
See [PUBLISHING.md](PUBLISHING.md). Budget and final experiment acceptance
remain owned by the parent workstream.

## Validation

Build and all 582 local links/anchors/assets pass across 16 HTML pages. Four
focused routing/rendering tests pass. Chromium audits of six representative
pages at 1440px and 390px pass with zero automated WCAG A/AA violations, no page
overflow, and no JavaScript errors. Keyboard skip/anchor navigation and no-JS
navigation pass. Additional 320px reflow and exact clipboard checks pass.
Desktop and mobile screenshots were visually inspected. Evidence is in ignored
`.artifacts/` for this checkout; regenerate it with the browser-check script.

The clean standalone clone acceptance passed: npm ci/build, paragraph update,
independent styling update with unchanged content digest, subdirectory links,
and production canonical/robots metadata. Parent submodules were not initialized.
The parent DevCapsule Nox build gate also passed; no backend source changed.
The manifest and Linux lock were generated/validated using DevCapsule's current
resolver; a separate capsule launch has not been performed.

## Production promotion slice (2026-09-17)

The owner requested a publishing action here for `devcapsule.mycodespace.ai`.
Only `mycodespace.ai` is owned; other domain spellings in conversation were typos.
The owner selected public GitHub Release assets to avoid personal tokens and
credential renewal. The parent test workflow now publishes a prerelease candidate
only after successful test deployment, using its built-in GITHUB_TOKEN. Candidate
tags are `website-candidate-RUN_ID-ATTEMPT`, and do not become the latest CLI
release. The website production workflow downloads candidate.json and the tar.gz
anonymously, validates the checksum, safe archive paths, source revisions and
metadata, then changes canonical origins and adds promotion provenance.
It does not rebuild tested content/assets. No CANDIDATE_READ_TOKEN is used.
Release assets remain available until deleted; Actions retention no longer limits
promotion/rollback. Downloads trust the repository's published release assets;
no enforced immutable-release setting is claimed.

Eleven unit tests pass, including anonymous-download behavior, archive corruption
and unsafe-path rejection, byte preservation and invalid candidate metadata.
A clean build of the deployed source revisions passed packaging, simulated
anonymous asset download, promotion and all 582 local links across 16 pages.
Both workflows pass actionlint 1.7.12. No visual changes were made, so browser
audits were not repeated for that slice. Those workflow PRs are now merged.
Hosted candidate creation, production promotion and HTTPS are now verified as
recorded above. Public deployment is complete; no token setup remains.

The required parent `nox -s build` gate passed again, including all nine
packaging integration checks. Its dirty-tree policy skipped the public revision
PEX; the local PEX build and smoke checks passed.

## Visible build timestamp

The owner requested a visible indication of when the website was updated.
All pages now show “Site built” with a UTC date/time in the footer, next to the
existing build-information link. `builtAt` in the manifest records the same
instant. Promotion and rollback preserve the original candidate timestamp;
this is build time, not deployment completion or per-article modification time.
The footer text is larger and wraps on narrow screens. No JavaScript is needed.
Older candidates remain promotable without fabricated timestamps.

Timestamp validation: all 11 unit tests, the build and 582 local links pass.
Twelve desktop/mobile browser audits pass without overflow or automated WCAG
A/AA violations. Additional desktop/mobile/320px checks without JavaScript
confirm that the visible timestamp matches the manifest; footer screenshots
were visually inspected. Existing promotion tests confirm builtAt is preserved.


## Next step

Published. W00 resumes with the owner's Search Console and Bing evidence
and the sitemap submission; W07 closes when the README carries the markers
and the heading adapter is deleted; W09's metadata and share cards follow
from the `description` field now available; W13 still needs its
measurement requirements and provider choice.

Session close, 2026-09-28. Changed: six stacked branches pushed, listed at
the top. Requirements: CONTRACT.md is the contract record; REQUIREMENTS.md
unchanged. Validated: per slice above; final `npm test` 21 passing.
Not validated: the test site and production. External state: branches on
`origin` only; nothing published; no producer repository written.
Uncommitted changes: none in this repository; a scratch worktree of
DevCapsule with local-only commits (manifest, journal front matter, README
markers, three quoted descriptions) exists outside the repository for the
preview and was never pushed. Next task: the owner's runbook above. W00 keeps its priority for the owner's
Search Console work and is not blocked by any of this. The requests to
DevCapsule under slice 2 gate the test-site deployment of everything above.

Earlier recorded next steps, kept for context: review/merge this backlog
handoff and the parent pointer update (done, PR #5); resume W00 with the owner's
search-engine reports; W12 producer agreement (delivered as the contract
proposal of 2026-09-28); W13 measurement requirements and provider choice.

## Open threads and future maintenance

- Experiment accepted with A−; website backlog delivery is prepared for merge.
  Its tasks, including remaining publication/recovery/browser evidence gaps,
  are authoritative in BACKLOG.md. Parent content/integration tasks stay there.
- Search indexing is not yet established. Read the owner's current Search Console
  and Bing reports before attributing a cause; prior live observations are dated.
- W12 is the intended single contract definition, not a claim that a complete
  contract already exists. Content-owner approval remains necessary.
- No content copy, database, cloud account, personal token or chat transcript
  was introduced. The migrated feature backlog was explicitly requested by the
  owner; recording it did not authorize implementing or publishing every item.

## Requests from DevCapsule (2026-09-22)

Delivered by the parent `user-docs` workstream as a pointer commit under the
owner's cross-repository exception; the two repositories share no mailbox.
The owner merges this; the website decides sequencing in BACKLOG.md.

1. **W12-C is delivered.** The producer side of the content–website contract
   is [R-DOCS-003](https://github.com/ccozianu/devcapsule/blob/e67f6faf5e2aba80e942b35bd9bf72bea26adb10/engineering-docs/requirements/product/r-docs-003-website-content-carries-front-matter.md):
   mandatory front matter on every published page under `docs/` and the
   journal (`description`, `draft`, `status`, `aliases`, `weight`, `updated`),
   and `docs/versions.yaml` giving the documentation the PostgreSQL shape:
   `/docs/<version>/`, a canonical `/docs/current/` copy, a per-page version
   switcher, and the statuses `development`, `supported`, `deprecated`,
   `unsupported`. Each version is built from the `docs/` tree of its declared
   source ref only; landing page and journal always come from `main`. Please
   implement it as contract version 1 (W12, with W07/W08 as its consumers).
   The parent will add the front matter and the manifest in the same parent
   change that pins the implementing website revision, so no build sees half
   a contract. Ask questions by editing the requirement through a parent PR
   or in the owner's review of this handoff.
2. **Sitemap now, ahead of the rest of W09.** For W00: emit `sitemap.xml`
   limited to indexable pages, so drafts, `noindex` versions and the staging
   policy are respected once those land, reference it from `robots.txt`, and
   keep it through candidate packaging and promotion. The owner submits it in
   Search Console and Bing Webmaster Tools.
3. **Night mode switch, proposed as a new task.** Follow `prefers-color-scheme`
   by default, offer a visible light/dark toggle persisted per browser, keep
   reading correct without JavaScript through the system preference alone,
   change the `color-scheme` meta to `light dark`, and run the existing axe
   contrast checks in both modes. The owner expects this to be small.

## Planned next step (2026-09-22, superseded)

The 2026-09-22 branch installed the DevCapsule workflow definition 0.2.14 with
`WORKFLOW.md`, `WORKFLOW-LOCAL.md`, the generic `AGENTS.md` plus
website-specific instructions, and the `[workflow]` table in the manifest. It
was merged on 2026-09-28 by slice 1 above, together with the sitemap and the
night-mode task it suggested sequencing separately. The contract request is
slice 2 of the work order.
