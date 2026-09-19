# Website current status

State: initial website accepted with A−; website-owned backlog handoff prepared.
Branch: `backlog-handoff`. Delivery: owner merges PR.
The owner authorized direct submodule edits to transfer the backlog from
DevCapsule. Future website development uses this project's single-stream status
and [BACKLOG.md](BACKLOG.md); the parent retains content and caller integration.
This handoff is performed under the explicit exception from the parent website
workstream, without selecting a second workstream in the checkout.

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

Review/merge this backlog handoff and the parent pointer update. Resume W00:
inspect search-engine reports with the owner and implement the sitemap/discovery
slice after agreeing its boundary. W12 needs producer agreement before changing
the content interface; W13 needs measurement requirements and provider choice.
W00 is still first. Resume from this status and BACKLOG.md rather than the old
parent implementation inventory.

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
