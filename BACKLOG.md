# Website backlog

Authoritative website-owned follow-up tasks, transferred from DevCapsule's
website workstream on 2026-09-19 at the owner's explicit request. IDs W00–W13
are preserved. Detailed website tasks are maintained here, not duplicated in
the parent. All remain open; completed prerequisites are noted within each.

W00 is the owner's top priority (gating). W12 is also gating for agreeing the
content interface. Existing P1/P2/P3 labels remain proposed sequencing, not
release commitments; W13 is wanted second-stage functionality. W09 remains
separate from W00 with its originally recorded scope. Evidence below is from
the original September 19 review unless a progress note says otherwise.

DevCapsule owns authored content and editorial decisions. This repository owns
website functionality, presentation and publishing, including the design of
publishing machinery currently executed from the parent. Physical file location
does not transfer that responsibility. DevCapsule retains the small integration
needed to invoke/pin those tools; no workflow code is moved by this handoff.

Producer responsibilities and integration requests are tracked in the
[DevCapsule content/integration tasks](https://github.com/ccozianu/devcapsule/blob/main/engineering-docs/wip/2026-09-16-website/CURRENT-STATUS.md#content-and-integration-tasks-retained-in-devcapsule).
The companion parent update and this backlog are delivered together. Suffix
`-C` denotes a content-side task, not a duplicate website implementation task.
W12 will establish one versioned contract here, with producer agreement and a
reference from DevCapsule. Until agreed, its current README description is
implementation documentation, not a newly accepted interface specification.

This is a direct repository handoff under the owner's one-time submodule-edit
exception, not inter-workstream mail. The two repositories do not share a
coordination mailbox; no unimplemented cross-repository mail command is assumed.
Future website work resumes from CURRENT-STATUS.md using this project's
single-stream workflow. No implementation, provider purchase or deployment is
implied by recording these tasks.

### W00 — Gating, top priority: Establish and verify search discoverability

- [ ] Diagnose and resolve production's absence from Google and Bing search results.
- Evidence: the owner reports no results for
  `+site:devcapsule.mycodespace.ai github`. Direct public checks on 2026-09-19
  found homepage and `/docs/` returning HTTPS 200 with production canonicals,
  no robots/Googlebot noindex meta or X-Robots-Tag header, and robots.txt allowing
  crawling. `/sitemap.xml` returns 404. These checks do not establish what Google
  has crawled or indexed; the missing sitemap alone does not establish the cause.
- Done means: inspect production in Google Search Console with the owner's
  verified access; distinguish discovery, crawling, indexing and canonical issues;
  fix identified barriers; provide and submit a production sitemap (shared
  implementation with W09 where appropriate), reference it in robots.txt, and
  request indexing of key pages. Keep staging excluded under W02. Obtain evidence
  of indexing and representative production search results before closing;
  a successful build or submission alone is insufficient. Google's timing and
  inclusion decisions are external; record pending status rather than promising
  a deadline or ranking.
- Verify: Search Console URL Inspection/Page Indexing evidence for the homepage
  and representative guide, sitemap retrieval/submission, and a repeat of the
  owner's query. Use URL Inspection to diagnose indexing; a site query alone is
  not an exhaustive index report. The agent has not inspected the owner's private
  Search Console reports.
- Reopen if intended public pages become undiscoverable or publication changes
  introduce indexing barriers.
- Progress: the verification-file fix is merged in website main at `2f7cc75`.
  The owner reports successful publication and Search Console showing
  “Processing data, please check again in a day or so.” This is owner-reported
  verification progress, not indexing evidence. Preserve the root verification
  file in future candidates. The owner also reports no Bing results; include
  Bing Webmaster Tools diagnosis. Sitemap and indexing evidence remain open.

### W01 — P1: Make the test publication action hard to misuse

- [ ] Resolve the [confirmed input-validation bug](engineering-docs/bugs/website/2026-09-19-test-publishing-accepts-inconsistent-settings.md).
- Evidence: parent `.github/workflows/website.yml` defaults to `preview`, labels
  test deployment `production`, and lets the origin/base path disagree with the
  candidate conditions. Wrong settings can yield a successful run with skipped
  jobs, or replace staging with a build that cannot be promoted.
- Done means: clear build-only/deploy-test choices; deploy-test is the owner-
  requested normal default; its host/base path are fixed or validated before
  deployment; intentional skips and invalid inputs are explicitly explained.
- Verify: default dispatch produces a test deployment and candidate; build-only
  is explicit; wrong host/path and wrong branch cannot quietly publish or skip.
- Reopen if new modes or destinations reintroduce incompatible combinations.
- Parent dependency: I01 applies any required caller/workflow wiring after the
  website-owned interface and validation are ready.

### W02 — P1: Distinguish staging and prevent accidental indexing

- [ ] Give staging a visible environment label and an explicit noindex policy,
  separate from the existing build-only/production rendering mode.
- Evidence: live test HTML on 2026-09-19 has no robots noindex meta, its robots.txt
  says Allow: /, and the shared layout has no test label. Its latest canonical
  URL points at production. This is observed configuration, not proof of indexing.
- Done means: visitors can identify staging; a chosen staging canonical policy and
  noindex directives are consistent; promotion deliberately removes staging-only
  metadata while preserving content. Update promotion's currently strict robots
  and canonical validation together, rather than patching the template alone.
- Verify: inspect staged and promoted HTML/robots, desktop/mobile label visibility,
  and a file-difference check limiting transformation to the agreed metadata.
- Reopen if a new host or rendering mode bypasses the staging policy.

### W03 — P1: Show what is being promoted and what is currently live

- [ ] Make candidate selection understandable without copying opaque tags between
  repositories and manually reading raw build-info JSON.
- Evidence: production accepts one free-text candidate tag; there is no comparison
  with deployed production, human-readable change summary, or publication timestamp.
  The footer's builtAt correctly preserves build time, including on rollback.
- Done means: the owner can see the selected candidate's content/presentation
  changes, source test run and comparison with current production before approval;
  current deployment/candidate identity and publication time are discoverable.
  Keep build time distinct. Decide how an older candidate is reviewed once the
  shared staging URL has advanced; do not imply that URL still shows the old one.
- Verify: two different candidates and an intentional rollback display the correct
  changes/identities; publication metadata does not rewrite original build time.
- Reopen if candidate selection becomes ambiguous again.

### W04 — P1: Validate website changes before the manual publishing run

- [ ] Add proportionate PR validation in both content and presentation repositories.
- Evidence: the website workflows are workflow_dispatch only. Publication runs
  unit/build/link checks; the existing browser/accessibility checks are absent
  from those workflows. Current browser evidence came from local agent execution.
- Done means: relevant content and website PRs run build/link/unit checks, with
  representative browser checks where appropriate, using the correct content and
  presentation revisions. PR checks produce reviewable output without deploying
  or exposing a write token to untrusted PR code.
- Verify: an intentionally broken link/layout fixture fails the appropriate check;
  a presentation PR builds its proposed version without first needing a parent
  submodule merge. Preserve manual production promotion.
- Reopen if a content/implementation path can merge without relevant validation.
- Split ownership: website owns reusable build/render/browser checks and its PR
  workflow; parent W04-C owns invoking them for content PRs against the selected
  website revision. Coordinate the interface through W12.

### W05 — P1: Verify the public result after deployment

- [ ] Add bounded post-deployment checks before calling a test candidate or
  production deployment successful.
- Evidence: both workflows stop deployment verification at deploy-pages success.
  They do not fetch the custom domain, validate its TLS/canonical/robots policy,
  or compare the served build-info revision with the intended candidate.
- Done means: distinguish an API-accepted deployment from a verified served site;
  check homepage, representative deep link/assets and provenance with bounded
  cache/propagation retries; give a useful failure summary. Do not automatically
  roll back based on an ambiguous transient network failure.
- Verify: wrong revision/hostname and a broken deep link produce actionable failure;
  a normal delayed propagation succeeds inside the documented bound.
- Reopen if a hosting or caching change defeats served-revision verification.
- Parent dependency: I01 wires website-supplied verification into the parent test
  deployment where needed; validation logic remains website-owned.

### W06 — P2: Make rollback and candidate retention operationally reliable

- [ ] Document and rehearse restoration, protect needed candidates, and define
  retention/recovery for missing assets and partially published releases.
- Evidence: rollback is another dispatch with an older tag; no live rollback has
  been exercised. Candidate assets are mutable/deletable, with no archive policy.
  A checksum stored beside its archive detects inconsistency, not an independent
  provenance proof against an authorized rewrite of both. Candidate prereleases
  also accumulate in the same Releases list visitors use for the CLI download.
- Done means: identify the last known good candidate; preserve required assets;
  exercise recovery in staging before any separately authorized production drill;
  define cleanup that cannot remove deployed/rollback candidates and keep CLI
  downloads easy to find. Handle release-upload failure without falsely claiming
  the already deployed test site rolled back. Choose immutability/backups based
  on the owner's actual recovery requirement, not speculative security machinery.
- Verify: restore an older candidate with unchanged content/assets, exercise missing
  and corrupt assets, and confirm cleanup/recovery preserves known-good releases.
- Reopen if release storage or cleanup changes invalidate the recovery procedure.
- Parent dependency: I01 coordinates any release-storage/caller changes in
  DevCapsule; website owns the candidate retention and recovery mechanism.

### W07 — P2: Remove brittle coupling to README wording and paragraph order

- [ ] Define a resilient landing-content mapping without duplicating authored prose.
- Evidence: `scripts/content.mjs` matches literal English headings and
  assigns paragraphs[0], paragraphs[1], slice(2,4) to visual roles. A harmless
  heading rename fails the build; reordering/adding prose can misassign sections.
- Done means: explicit stable section identities or another owner-approved content
  contract; routine editorial changes preserve intended grouping or fail with a
  targeted author-facing explanation; new authored content is not silently lost.
- Verify: heading rename, inserted/reordered paragraph and new section examples
  reviewed for meaning, not merely passing a test derived from the implementation.
- Reopen if ordinary editing again requires changing presentation code.
- Producer dependency: W07-C supplies/agrees landing section identities under
  W12; do not make presentation code the authority for product prose.

### W08 — P2: Make content status and version explicit

- [ ] Implement the content owner’s publication/status decisions and present
  documentation version and freshness clearly.
- Evidence: all Markdown under docs is imported; historical/draft status is inferred
  from `/product/` or `docker4pycharm` in the filename. Draft announcement pages
  are therefore public and indexable today, though visibly labeled. A fresh site
  build does not establish that an individual guide is current. The accepted
  v0.2.12 guide rewrite still belongs to user-docs, not this review.
- Done means: an explicit publication/status contract and version presentation,
  agreed with the content owner. Decide inclusion vs labeling vs noindex for
  drafts; preserve intentional historical links. Do not silently rewrite guides.
- Verify: representative current, draft and historical documents, plus a newly
  added file, receive the intended visibility/status/version and navigation.
- Reopen if path naming again becomes the only publication/status decision.
- Producer dependency: W08-C owns inclusion/status/version decisions and metadata.
  Website consumes that metadata and implements visibility and labels under W12;
  substantive guide corrections stay in DevCapsule.

### W09 — P2: Improve discovery and link previews

- [ ] Add deliberate production metadata and a sitemap; fix redundant social titles
  and choose useful descriptions/social images for homepage, docs and blog entries.
- Evidence: production sitemap.xml returns 404; base.njk has og:title and og:type
  only, without og:url/image/description. Homepage og:title is
  `DevCapsule · DevCapsule`; its description is the first setup paragraph rather
  than a concise product explanation. No search-ranking penalty was measured.
- Done means: accurate, nonduplicated metadata and canonical URLs, a sitemap limited
  to intended public pages, and meaningful share cards without inventing claims.
- Verify: generated head/sitemap checks and actual share-card previews for the
  homepage, guide and article; staging/drafts follow W02/W08 decisions.
- Reopen if new page types inherit misleading generic metadata.
- Producer dependency: W09-C supplies approved descriptions and social artwork.
  Website owns metadata generation, sitemap and preview rendering; agree the
  fields through W12. This split does not change the original W09 scope above.

### W10 — P3: Help readers find answers and follow the journal

- [ ] Scope lightweight documentation search/topic navigation and an RSS/Atom feed.
- Evidence: sidebar/toc navigation exists, but there is no site-wide search or
  journal subscription link/template; live feed.xml returns 404. These are
  enhancements, not failures of an original search/feed requirement.
- Done means: a reader can locate a known topic across guides, distinguish current
  from historical answers, and subscribe to new articles. Keep ordinary reading
  usable without JavaScript; avoid adding a backend/service without need.
- Verify: representative novice search tasks, keyboard/mobile use and an independent
  feed reader. Agree relevance/navigation expectations before choosing a library.
- Reopen if corpus growth makes answer-finding or feed delivery unreliable.

### W11 — P2: Validate the experience with people and browsers beyond this setup

- [ ] Test an unfamiliar visitor's first-use journey, and fill the explicit browser,
  performance and standalone-environment evidence gaps proportionately.
- Evidence: current browser evidence is Chromium automation plus agent screenshots;
  no independent novice study, Firefox/WebKit/mobile-device checks, performance
  budget or graphical launch of the website's own capsule is recorded. This is
  missing evidence, not a claim those experiences are broken or slow. The hero
  illustrates a concept but does not demonstrate an actual DevCapsule session.
- Done means: choose a small user task and target-browser set with the owner;
  record where a newcomer gets stuck and fix prioritized findings. Measure before
  choosing performance work; assess whether an authentic screenshot/demo clarifies
  the product. Verify the advertised standalone setup rather than assuming it.
- Verify: documented task outcomes and targeted browser/device/environment evidence;
  thresholds and stop conditions agreed before expanding the test matrix.
- Reopen if new layouts/platform promises invalidate the tested user journey.
- Producer dependency: W11-C owns guide corrections and authentic product demo
  content arising from agreed user tasks. Website owns browser/performance tests,
  presentation fixes and the website’s own standalone developer setup.

### W12 — Gating: Define the content–website contract

- [ ] Agree and document an explicit producer/consumer interface that a new
  maintainer can use without reverse-engineering the builder or chat history.
- Evidence: README describes consumed paths, while the implementation assumes
  particular headings/paragraph order and infers status from paths. Input/output,
  compatibility and error behavior are not specified sufficiently. Recording
  current code behavior alone does not establish intended behavior.
- Scope: input paths/formats, required/optional metadata, asset and link handling,
  stable landing sections, navigation/order, draft/historical/version semantics,
  output URL and redirect rules, root static files, build/publication entry points,
  source revision selection, compatibility/versioning and actionable diagnostics.
- Done means: one authoritative contract in this repository, referenced by
  DevCapsule, with explicit producer agreement through W12-C; small examples and
  reusable checks establish conformance on both sides. Distinguish existing
  behavior, agreed requirements, migrations and remaining implementation gaps.
  Explain how each side changes independently and handles incompatible versions.
- Verify: a maintainer can author a conforming content example and preview it
  using the documentation; incompatible input produces useful diagnostics;
  both repositories exercise shared examples against the declared contract.
- Reopen if either side changes the interface without a compatibility decision.
- Dependency: parent W12-C owns producer requirements and acceptance; W07 is the
  separate implementation task to replace fragile parsing under this contract.

### W13 — Wanted: Audience analytics and visitor experience measurement

- [ ] Add website-owned audience and experience measurement as second-stage
  functionality. The owner explicitly accepts its absence from the initial cut;
  this is an enhancement, not a defect counted against the experiment's quality.
- Evidence: the delivered website has no analytics or usage-event collection.
  Search Console's search reporting does not measure journeys within the site.
- Scope: visitor/page-view trends, acquisition sources, popular content and
  journeys to key actions such as starting instructions and GitHub; relevant
  real-visitor performance and browser-error evidence. Distinguish observed
  events from inferred engagement or completion of off-site actions.
- Before implementation: agree the owner's questions and useful reports, define
  metrics and unique/returning-visitor estimation, and select a proportionate
  collection approach with explicit cost, retention, privacy and consent
  behavior. Named-person identification, accounts, session replay and invasive
  tracking are not implied by this request. No provider is selected yet.
- Done means: the owner can access documented reports answering the agreed
  questions; instrumentation survives the build/promotion process, excludes
  staging from production reporting, and does not impair ordinary reading.
  Document measurement limitations, including blocked scripts and any consent
  effects, so estimates are not presented as exact counts of people.
- Verify: controlled visits and key actions appear correctly without duplicate
  events; staging is excluded; collection respects the chosen settings; the
  site still works when measurement is unavailable. Owner reviews report utility.
- Reopen if publication changes break collection or reports stop answering the
  agreed questions.
