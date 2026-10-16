# Work Order: Social Metadata And Page Identity From The Producer

Date: 2026-10-16. Issued by `project-management` at the product owner's
direction of 2026-10-16, after the owner's Search Console review of the
published site. Executed in the `devcapsule-website` repository,
single-stream, from its own `CURRENT-STATUS.md`. It extends
[the content–website contract](../../CONTRACT.md) additively; the
producer-side companion is an amendment to DevCapsule's `R-DOCS-003` and one
marker line in its `README.md`, both written in DevCapsule after slice 3
ships.

Status: delivered (2026-10-16, slices 1–4). Release: none; the site publishes
on its own clock. This order is part of the SEO objective the owner set for V1
on 2026-10-16.

## 1. What A Crawler And A Card Renderer Get Today, And What They Should

A page of the site presently carries a correct `<title>`, a
`<meta name="description">`, a canonical link and two Open Graph tags,
`og:title` and `og:type`. That is enough for Google to index the page and
not enough for anyone to share it. Observed on 2026-10-16 at
`devcapsule.mycodespace.ai`:

- `og:title` is built as `{{ title }} · DevCapsule` unconditionally, so the
  landing page announces itself as "DevCapsule · DevCapsule".
- There is no `og:description`, no `og:url`, no `og:image` and no
  `twitter:card`. A link pasted into Slack, X, LinkedIn or a GitHub issue
  renders as a bare URL, or with whatever the renderer guesses.
- The landing page's title is the README's first heading, "DevCapsule",
  because the landing page is exempt from front matter. The search result
  for the home page therefore says nothing about what the product is.

What they should get: every page, with no authoring, a complete and
consistent set of social tags derived from what the producer already says
about the page; and, where the producer wants the card to differ from the
page, a way to say so in the producer's own files, because what a page says
about itself is the producer's decision under section 2 of the contract.

## 2. The Design Judgment To Apply

1. **Derive first, override second.** Title, description, canonical URL and
   page kind already exist for every page. The consumer emits the full tag
   set from them. An override is for the exceptional page whose card should
   read differently: the landing page, a journal post with a picture, a
   release. No existing page may need editing to keep building or to get
   correct tags.
2. **One neutral vocabulary, several outputs.** Open Graph, X cards and
   JSON-LD structured data want the same three facts: a title, a
   description, an image. The producer states them once, in a block named
   `social`, and the consumer maps them to every output. Raw `og:` keys do
   not enter the producer's front matter; they are one vendor's spelling.
3. **Images are content.** An image path in the `social` block is a path
   under `docs/` of the producer, resolved through the existing content-asset
   rule of 5.5 into an absolute URL, and missing files fail the build by name
   like every other broken link. Card renderers do not fetch SVG, so the
   consumer owns one default raster card and uses it when a page names none.
4. **The README stays a README.** GitHub renders front matter as a table, so
   the landing page keeps its exemption and gets its identity through the
   marker mechanism of 3.7, which GitHub does not render.
5. **Fail by name, as the contract does.** An unknown key under `social`, an
   image that does not exist, a marker with an unknown attribute or a second
   `website:social` marker each fail the build naming the file and the
   problem, and the fixture provokes each one.

## 3. The Contract Change

Additive amendments, each written into `CONTRACT.md` in the slice that
implements it.

**3.3, front matter of versioned pages.** One new optional field:

| Field | Required | Values | Meaning |
|---|---|---|---|
| `social` | no | a mapping with any of `title`, `description`, `image` | What the page says about itself to card renderers and crawlers when that differs from its title, description and the default image. `title`: at most 70 characters. `description`: at most 200 characters. `image`: a path under `docs/` to a PNG or JPEG, resolved as in 5.5. Unknown keys fail the build. |

The same field applies to journal entries and release notes through 3.6,
which already give them the front matter of 3.3.

**3.7, landing page identities.** One new marker, self-closing, placed
before the first section marker:

```markdown
<!-- website:social title="..." description="..." image="docs/images/..." -->
```

Attributes are the three keys of the `social` field with the same limits.
The marker may appear once. Its `title` becomes the landing page's `<title>`
and `og:title`; the H1 of the README is unchanged on the page.

**5.7, page identity (new).** For every rendered page the consumer emits:

| Tag | Value |
|---|---|
| `<title>` | `social.title` if present, else the page title; suffixed ` · DevCapsule` except on the landing page |
| `og:title`, `twitter:title` | the same text as `<title>` |
| `og:description`, `twitter:description` | `social.description` if present, else `description` |
| `og:url` | the canonical URL of 5.2 |
| `og:type` | `article` for journal entries and release notes, `website` otherwise |
| `og:image`, `twitter:image` | `social.image` resolved to an absolute URL, else the consumer's default card |
| `og:site_name` | `DevCapsule` |
| `twitter:card` | `summary_large_image` |

Pages that are `noindex` under 5.2 still receive the tags; a shared link to a
planned page should at least say what the page will be.

## 4. Sequence Of Slices, With What "Done" Means

1. **Derived identity for every page.** Emit the full table of 5.7 from
   existing fields; fix the doubled suffix; add the default card as a
   1200×630 PNG under the consumer's assets, produced in this repository
   from the site's own type and colours, with the SVG source committed
   beside it. Done when every page of a production build carries every tag
   of 5.7 with the derived values, the landing page's `og:title` equals its
   `<title>`, and `og:image` resolves with status 200.
2. **The `social` field.** Parse, validate and map it for versioned pages,
   journal entries and release notes; resolve `image` through 5.5. Done when
   the fixture has one page with every key set and the build renders them,
   and the fixture provokes the unknown-key, over-length and missing-image
   failures by name.
3. **The landing marker.** Parse `website:social`, apply it to the landing
   page's identity, keep the H1. Done when the fixture README carries the
   marker and the landing page's `<title>`, `og:title`, `og:description` and
   `og:image` come from it, and a duplicate marker and an unknown attribute
   fail by name. This slice unblocks the producer: DevCapsule adds the marker
   to its README and amends `R-DOCS-003` afterwards.
4. **Structured data, optional.** JSON-LD `WebSite` on the landing page,
   `Article` on journal entries with `datePublished` from the entry date,
   `SoftwareApplication` on the landing page with the name, operating system
   (Linux) and licence (Apache-2.0). From the same facts; no new front
   matter. Done when Google's rich-results test accepts each page type.

Slices 1 to 3 are the order. Slice 4 may wait for the next time the
templates are touched.

## 5. What The Executing Session May Decide, And What It May Not

May decide: the exact attribute syntax of the marker within HTML-comment
rules; whether image dimensions are validated and what the minimum is; the
default card's design; the wording of each failure.

May not: change the meaning of any existing front matter field; require any
existing page to be edited for the build to pass; accept an image outside
`docs/` or fetched from another host; introduce `og:` or `twitter:` keys
into the producer's front matter; alter the canonical and robots behaviour
of 5.2.

## 6. Evidence This Order Rests On

- The owner's Search Console reading of 2026-10-16: the sitemap is known and
  accepted; 25 pages indexed, 35 not, several with "temporary processing
  error", for example `/docs/current/sessions/what-persists/`. The
  unindexed count includes the versioned twins and redirects that correctly
  point elsewhere.
- Page source of the live site on 2026-10-16: `<title>`, description and
  canonical correct on every page checked; `og:title` doubled on the landing
  page; no `og:description`, `og:url`, `og:image` or `twitter:card`
  anywhere; planned pages `noindex` and absent from the sitemap; older
  version pages self-canonical; `robots.txt` names the sitemap.
- `CONTRACT.md` sections 3.3, 3.6, 3.7, 5.2 and 5.5, which this order
  extends and does not alter.
