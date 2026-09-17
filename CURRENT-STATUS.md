# Website current status

State: test site and public candidates working; visible build timestamp prepared
as part of DevCapsule's `website` workstream. Branch: `build-timestamp`.
Delivery: owner merges PR to `main`.
Independent future development: `single-stream`; transition not yet performed.

## Current result

Eleventy renders the parent README, guides and development blog. The custom
responsive presentation, navigation, code highlighting/copying, local preview,
source-link conversion and build identities are implemented. Content stays in
DevCapsule. The owner reports the test deployment works well; HTTPS and its
manifest were independently checked on 2026-09-17. Initial website and parent
PRs are merged. Production publication remains an owner action.

The parent owns the current experiment budget and interruption arrangements.
SSH clone/push is the delivery path; GitHub app access is unavailable. The owner
accepts local execution of build/trigger scripts and will handle backend wiring
at delivery. See [PUBLISHING.md](PUBLISHING.md).

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
Public candidate website-candidate-35286734496-1 is fetched; the test site
serves content a99ca28 and implementation ff1a987 over HTTPS. Production
publication is owner-reported; HTTPS verification from this environment still
reports a hostname mismatch, so production is not independently verified.

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

Merge website `build-timestamp`, then parent `website/initial-cut` with its new
website pin. Select the merged website revision first if squash-merging.
Run a fresh parent Website deployment (`production`, test domain, `/`) to get
the timestamp into the test site and a new release candidate; promote that tag
when reviewed. Existing published files do not update merely by merging code.

## Open threads

- Owner handles both timestamp PR merges and new test/production workflow runs.
- The current test deployment allows indexing because the parent workflow uses
  production mode to publish; separate noindex support is outside this slice.
- Formal autonomy-experiment acceptance/finalization remains with the owner.
- Full graphical launch of this project's own capsule remains untested; Node-based
  standalone preview is the practical acceptance path for this cut.
- No separate content copy, database, cloud account, or full chat record is preserved.
