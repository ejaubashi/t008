# Reference review

The replacement was reconstructed from both user-supplied recordings, inspected as full-resolution frames throughout their durations (12.608 seconds and 15.168 seconds). The prior sculpture website's components, content, images and tests were reviewed and replaced. The public reference domain remains inaccessible through this cloud environment's network policy.

## What the recordings establish

- The site is an art gallery for paintings, not a sculptor's portfolio.
- A fixed top-left navigation contains `gallery area`, `about`, and `contacts`. The black CW mark and two-line gallery name sit top right.
- A pale gray architectural grid runs through the site. At a 1920 × 911 browser content viewport, grid spacing is approximately 190 pixels.
- The gallery is an open field, with scattered paintings in different sizes, small gray numbers, and two-line captions. Dragging and scrolling move through the field. Momentum bends the artwork and grid near screen edges. The pointer produces local ripples.
- Fixed bottom navigation switches between `Field` and `List`. The original reference's creator credit, badge shapes, sound label and copyright line remain in the frame.
- The index has a narrow table on the left and a larger artist biography / horizontal artwork rail on the right. The recordings reveal 27 artwork titles across five named artists. The gallery description refers to seven represented artists, but the other two are not identified in the recordings.
- About has a large three-line heading, a short gallery description, four statistics, and a chronological history below. The reference shows the 2012–2015 entries clearly. The initial gallery foundation and Wolfstein dates are also supported by the visible introductory/artist copy.
- Contacts has a sparse centered `contact us` link and four columns of address, hours, email addresses, and telephone details along the bottom.
- Opening `Woman in a Black Scarf` displays a large centered painting with a soft shadow and a cursor-following return link.

## Recovered artwork

Fifteen painting images were cropped directly from video frames: 01–06 and 19–27. `public/paintings/sources.json` records each source frame and crop rectangle. These are compressed footage-derived assets; some include motion/ripple/cursor artifacts from the original page. They are not the original high-resolution image files.

Works 07–18 are named in the index but their actual paintings are not visible. Their titles remain in the index and the preview explicitly states that their images are unavailable. No generated or unrelated paintings have been substituted.

## Deliberate implementation choices and limits

- Hash routes support direct links and refreshes on GitHub Pages without a server rewrite.
- A Canvas 2D renderer approximates the original field's motion and ripple effects; a small WebGL fragment shader supplies the liquid hover response in the list view. It is a reconstruction, not the original rendering source or shader.
- Inter is locally hosted as a close typographic match. The exact original font has not been identified from source.
- A quiet procedural ambient chord makes the sound control functional. It does not reproduce the original soundtrack.
- Mobile layouts are adapted from the desktop design, since the recordings contain no mobile viewport.
- The detail metadata below the initial image is a practical extension; the reference recording does not scroll far enough to establish its original contents.
- Decorative badges and the original design credit are reproduced as reference design details; they are not evidence of awards granted to this implementation.

Original source/assets, or recordings of the missing sections, are needed for a complete exact reconstruction beyond the visible reference.
