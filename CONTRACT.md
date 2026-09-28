# The content–website contract, version 1

Accepted on 2026-09-28 by this repository, under the owner's autonomy grant
recorded in [the visitor-experience work order](engineering-docs/work-orders/2026-09-28-website-visitor-experience.md),
as the interface between the producer, DevCapsule, and this consumer. It
implements the producer's proposal,
[Design: The Content–Website Contract, Version 1](https://github.com/ccozianu/devcapsule/blob/main/engineering-docs/wip/2026-08-09-project-management/2026-09-28-design-content-website-contract.md),
which extends
[R-DOCS-003](https://github.com/ccozianu/devcapsule/blob/main/engineering-docs/requirements/product/r-docs-003-website-content-carries-front-matter.md),
with the decisions its section 11a records. This file is the authoritative
text on the consumer side, as backlog task W12 asks; the producer references
it from R-DOCS-003. Where this file adds to or interprets the proposal, the
paragraph says so and section 8 lists it, so that either side proposes
version 2 with a compatibility decision rather than a surprise build failure.

The executable half is `scripts/contract.mjs` and `scripts/content.mjs`; the
shared examples are `test/fixtures/contract-1/`; the acceptance checks are
`test/contract.test.mjs`; the command the producer's gate runs is
`npm run check:content`.

## 1. What the contract decides

1. Exactly one tree is versioned: `docs/`. Everything else the site publishes
   exists in one version, taken from the content checkout, which stands for
   `main`.
2. Each version's documentation is built from that version's own source ref,
   and the version number is read from that ref, never typed into pages.
3. Six distinguished pages, named by role, are linked from the home page and
   always resolve to the current version.
4. A reader reaches any published version from the home page in two clicks,
   and any page's other versions in one.
5. The owner's support statement for 0.x is shown where versions are listed.
6. Released versions are immutable and are built once.

## 2. Parties

| | Producer: DevCapsule | Consumer: this repository |
|---|---|---|
| Owns | every authored page; the manifest; front matter; editorial and status decisions | build, layouts, routing, redirects, the versions index, the switcher, banners, caching, publication |
| Never contains | layouts, CSS, navigation code | a second copy of any authored Markdown |
| Changes the contract by | proposing a successor design, agreed with the consumer | recording the accepted version here and implementing it |

## 3. Inputs the consumer reads

### 3.1 The manifest, `docs/versions.yaml`, from the checkout

```yaml
contract: 1
current: "0.2.15"
notice: >
  One Markdown paragraph, the owner's support statement, shown on /docs/.
versions:
  - version: devel
    source: main
    status: development
  - version: "0.2.15"
    source: docs-0.2.15
    status: supported
  - version: "0.2.14"
    source: v0.2.14
    status: deprecated
    legacy: true
    note: One sentence shown in this version's banner and on the index.
  - version: "0.2.12"
    source: a989155385026b2e5f80cedb5edc8e1e0f4a6bbd
    source-version: 0.2.14.dev0
    status: deprecated
    legacy: true
```

| Field | Required | Meaning |
|---|---|---|
| `contract` | yes | The contract version the manifest is written to. The build refuses any value but `1`, naming both numbers. |
| `current` | yes | A listed version, served as the full copy at `/docs/current/`. |
| `notice` | no | One Markdown paragraph rendered first on the versions index. Links resolve like links in unversioned pages. |
| `versions[].version` | yes | `devel` or a release `X.Y.Z`; the URL segment. Listed once. |
| `versions[].source` | yes | A Git ref the content checkout resolves: `main`, a tag, a branch or a commit. `main` means the checkout itself, see 3.2. |
| `versions[].status` | yes | `development`, `supported`, `deprecated` or `unsupported`, with the behaviour of section 5. |
| `versions[].note` | no | One sentence, shown in that version's banner and on the index. |
| `versions[].source-version` | no | The version the source declares when it is not the entry's `version`; see 3.2. |
| `versions[].legacy` | no | *Added by this consumer, additive.* `true` marks a source that predates this contract; see 3.5. Default `false`. |

Unknown keys, at either level, fail the build naming the key. A missing
manifest fails the build naming the file: the consumer does not infer
versions from tags or paths.

### 3.2 The version, read from the source

For each entry the consumer reads `[project] version` from
`devcapsule-src/pyproject.toml` at the source, the only file outside `docs/`
it reads there. A release entry's declared version must equal its `version`;
`devel` must declare a development version `X.Y.Z.devN`. Otherwise the build
fails naming the entry, the source and both versions, unless
`source-version` equals what the source declares.

*Interpretation.* `source: main` is built from the content checkout's working
tree, whatever branch it is on, because the manifest itself is read from that
checkout and the parent's build runs on `main`. A dirty preview therefore
renders `devel` with its edits and the build identifies itself as dirty.
Every other source is resolved with `git rev-parse` (the name as given, then
`origin/<name>`), extracted once, and never re-read.

### 3.3 Front matter of versioned pages

Every Markdown page under `docs/` begins with a YAML block. The first `#`
heading remains the title.

| Field | Required | Values | Meaning |
|---|---|---|---|
| `description` | yes | one sentence, at most 200 characters | `<meta name="description">`, cards and lists |
| `draft` | no, `false` | boolean | `true`: absent from production builds, navigation and the sitemap; rendered with a "Draft" label in previews |
| `status` | no, `current` | `current`, `historical`, `planned` | `historical`: served under the background notice, in the sidebar's background group, `noindex`. `planned`: a "Coming soon" stub, greyed in the sidebar, `noindex`. |
| `aliases` | no | list of site-relative directory paths | Old URLs that keep working; the consumer emits a redirect page at each, see 5.6 |
| `weight` | no | integer | Order within the sidebar area, lower first; unweighted pages follow in title order |
| `updated` | no | `YYYY-MM-DD` | Shown on the page; the sitemap's `lastmod` |
| `role` | no | one of the six roles, section 4 | This page is the version's page for that role, at most once per version |

Failures, each naming the file: a missing block, a block without
`description`, an unknown key, an invalid value. The block never appears in
the rendered page.

### 3.4 Tokens, and the typed-version check

A versioned page never types a version. It writes `{{version}}`, `{{tag}}`,
`{{release_url}}` or `{{download_url}}`, substituted before Markdown
rendering so they work inside code blocks. For a release entry they render
the entry's `version`; for `devel` they render the version the source
declares. *Interpretation:* when `source-version` records a mismatch, tokens
still render the entry's `version`, which is the release the reader has.

A literal string matching `v?0\.\d+\.\d+(\.dev\d+)?`, not embedded in a
longer number or word, fails the build naming the file and line. An unknown
`{{name}}` token fails the same way. Unversioned pages are exempt.

### 3.5 Legacy sources

*Added by this consumer.* The owner decided to publish 0.2.14 as it is and
0.2.12 from its guides' commit, and both predate this contract. An entry with
`legacy: true` is built with these relaxations, and no others: a page without
a front matter block gets the defaults and its description from its first
paragraph; typed versions are allowed; pages under `docs/product/` and the
Docker4PyCharm guide are `historical`. A page that does carry a block is
checked as usual. The field is additive, so the manifest keeps `contract: 1`.

### 3.6 Unversioned content, from the checkout

- `README.md`: the landing page, exempt from front matter. Its links into
  `docs/` resolve to the current copy when the page exists there, otherwise
  to the newest listed version that has it, otherwise the build fails. Its
  sections are identified by the markers of 3.7.
- `engineering-docs/blog/*.md`: the journal, one page per dated file, with
  the front matter of 3.3 minus `role`; drafts behave as in 3.3.
- `engineering-docs/releases/<tag>/notes.md`: release notes, consumed once
  the releases route is built (work order slice 5).

### 3.7 Landing page identities (W07)

*Added by this consumer as the stable section identities backlog task W07
asks for; additive.* The README marks the sections the site uses with HTML
comments, which GitHub does not render:

```markdown
<!-- website:hero -->
## Start working on a project right away!

One lead paragraph.

- Pre-V1
- Linux x86-64
- Windows via WSL2

<!-- website:benefits -->
- **A real IDE in a capsule.** Two lines. [The first session](docs/getting-started/first-session.md)
- **Agents at full speed, behind a boundary you control.** Two lines. [Containment](docs/containment/the-boundary.md)

<!-- website:end -->
```

A marker starts a section that runs to the next marker or to
`<!-- website:end -->`; text outside the markers is not shown on the site.
Within a section, the first heading is its heading and the rest its body;
top-level list items are its items; lower headings split it into
subsections. The names, and what each renders:

| Name | Renders | Shape |
|---|---|---|
| `hero` | the headline, the lead and the eyebrow chips | required: a heading and a paragraph; optional: a list, one chip per item |
| `benefits` | the "What you get" cards | at most four items: `**Headline.** text [link](docs/…)` |
| `fit` | the "Is it for you?" columns, also shown on `/why/` | a heading and two subsections, each with a list |
| `dogfood` | the line above the journal cards | one paragraph |
| `why` | `/why/`, the long answer | a heading and prose |
| `comparison` | the second part of `/why/` | a heading and prose |
| `contribute` | `/contribute/` and the closing band's invitation | a heading and prose; absent means `/contribute/` is a "coming soon" stub, `noindex` |

The three pillars under the hero are not a section: they are the
`getting-started`, `your-project` and `agents` role pages of the current
version, with their titles and descriptions, so the producer edits them in
the documentation. Images before the first marker are the health badges,
shown in the footer. An unknown name, a name marked twice, a hero without a
heading or more than four benefits fail the build naming the problem. A
README without any marker is read by the original heading adapter as long as
it lasts, so the site builds while the producer adopts the markers.

## 4. Roles

| Role | Meaning |
|---|---|
| `overview` | the documentation front door, `docs/README.md` |
| `getting-started` | the first session |
| `your-project` | bringing an existing project |
| `agents` | working with a coding agent |
| `containment` | what the capsule and its agents can touch |
| `windows` | the platform note for Windows |

The current version must define all six, or the build fails naming the
role. An older version may lack a role. The home page, header and footer link
documentation only by role, resolved to `/docs/current/<path>/`.

## 5. Outputs the consumer produces

### 5.1 Routes

| Route | Content |
|---|---|
| `/` | landing page |
| `/journal/`, `/journal/<date>-<slug>/` | journal; `/blog/` and every `/blog/<date>-<slug>/` redirect to it |
| `/why/` | the `why`, `comparison` and `fit` sections of 3.7; absent when the README has neither `why` nor `comparison` |
| `/contribute/` | the `contribute` section of 3.7, or a "coming soon" stub |
| `/docs/` | the versions index: the notice, the current version, then supported (with deprecated marked), unsupported and development versions, each with its status and note |
| `/docs/<version>/…` | that version's documentation, `docs/README.md` at the version root, `docs/a/b.md` at `a/b/` |
| `/docs/current/…` | a full copy of the current version; the canonical URL of every page that exists in it |
| each alias | a redirect page to the page that declares it |
| `/content-assets/<key>/docs/…` | images a version references, keyed `main` for the checkout or the source's short commit |

### 5.2 Canonical and robots behaviour by status

| Status | Banner | Canonical | Robots | In the sitemap |
|---|---|---|---|---|
| `development` | "Unreleased … may change", link to current | the page in `current` when it exists there, else itself | `noindex` | no |
| `supported`, current | none | itself under `/docs/current/` | indexable | the `current` copy |
| `supported`, not current | the note, if any | the page in `current` when it exists there, else itself | indexable | only pages absent from `current` |
| `deprecated` | "Deprecated … move to the current version", the note | as above | indexable | only pages absent from `current` |
| `unsupported` | "Unsupported … no longer maintained", the note | as above | `noindex` | no |

Drafts, planned stubs, historical pages and aliases are never in the sitemap;
drafts and planned or historical pages carry `noindex`. Promotion to
production accepts exactly `<meta name="robots" content="noindex">` and still
refuses the preview marker.

### 5.3 The switcher

Every documentation page lists every version: the same path where it exists,
that version's index where it does not, the reader's version marked, the
current version linked through `/docs/current/`, and a link to `/docs/`.

### 5.4 The sidebar

Per version: the role pages first, in the order of section 4, under "Start
here"; then one group per first-level directory of `docs/`, in the order the
version's overview page first links each directory, titled by the overview's
link text when it is not simply the linked page's title, otherwise by the
directory name; pages within a group by `weight`; historical pages in a
background group; planned pages greyed with a "soon" marker. *Interpretation:*
the area order and titles are derived from the overview so the producer
controls them without a new field; a future additive field can make them
explicit.

### 5.5 Links inside a version

Links to pages of the same version stay inside the copy they are read in
(`/docs/current/…` in the current copy, `/docs/<version>/…` otherwise);
`README.md` leads to the landing page; journal entries published from the
checkout lead to the journal; any other existing file becomes a GitHub
permalink at the version's source revision; a missing target fails the build
naming the file and link. Images under `docs/` are copied from the version's
source.

### 5.6 Aliases

An alias declared by a page leads to that page in `current` when it exists
there, otherwise to the newest listed version that declares it. An alias that
would shadow a published page fails the build naming both. The redirect page
carries the target as its canonical URL.

## 6. Build and caching

A released version's rendering depends only on its source commit, its
`legacy` flag, this repository's contract code and the site's base path, and
is cached under `.cache/` by those four. A change on `main` re-renders only versions whose
source is `main`, then re-assembles the index, the switcher, the banners,
`current` and the aliases. A manifest change re-renders no version whose
source is unchanged. The build fails as a whole when any version fails; a
partial site is never published. `build-info.json` records `contract`,
`current` and every version's status, source and revision.

## 7. Diagnostics and the shared check

Every failure is a `ContractError` naming the file, field, version or role,
and `npm run check:content` (with `CONTENT_DIR` pointing at a checkout)
assembles the site without writing output and exits non-zero on the first
failure. The producer's gate runs it against the real tree at the pinned
consumer revision, so a change that would break the site fails there first.
The fixture under `test/fixtures/contract-1/` is a minimal conforming tree
with a legacy tag, a release tag and a working tree; `test/contract.test.mjs`
provokes each named failure from it and checks the once-only build.

## 8. What this consumer added or interpreted

Recorded so that version 2 starts from what is actually implemented:

1. `legacy: true` on a manifest entry (3.5), additive.
2. `source: main` means the checkout's working tree (3.2).
3. Tokens render the entry's version when `source-version` records a
   mismatch (3.4).
4. Planned stubs and historical pages are `noindex` and out of the sitemap;
   supported and deprecated pages that exist in `current` point their
   canonical there and stay out of the sitemap (5.2).
5. Sidebar area order and titles derive from the overview page (5.4).
6. Alias resolution prefers `current`, then manifest order (5.6).
7. The typed-version pattern is bounded so that addresses such as
   `127.0.0.1` and sentence-final versions are handled as intended (3.4).
8. A `role` on a journal entry fails the build; roles belong to `docs/`.
9. The landing page identities of 3.7, the pillars from role pages, and the
   `/why/` and `/contribute/` routes (5.1).
10. The journal lives at `/journal/`; `/blog/` addresses redirect (5.1).

## 9. Acceptance

The contract is satisfied when, at the pinned consumer revision:

- the fixture provokes each named failure of sections 3, 4 and 5.6 and the
  build reports it by name;
- the build serves `/docs/`, `/docs/current/` and one directory per listed
  version with the banners, canonicals and robots behaviour of 5.2;
- every role resolves to the current version;
- tokens render to the version of each source;
- with three versions listed, a change to a `main` page re-renders only
  `devel`, and a manifest status change re-renders nothing;
- a reader reaches an older version's first-session guide from the home page
  in two clicks and switches to the current one in one.

`test/contract.test.mjs` covers the first five against the fixture;
`scripts/browser-check.mjs` walks the last against a preview.
