# TSS Feature Roadmap

Forward-looking feature catalog for Tack Wise, based on the official Tactical
Sailing Situations (TSS) description and published changelog.

TSS is described as a drawing program for illustrating and explaining sailing
rules, protests, tactics, and boat movements for umpires, protest committees,
coaches, and sailors. This roadmap groups the published capabilities into
planned Tack Wise versions rather than reproducing the historical TSS release
sequence.

Sources:

- [TSS official site](https://tss.peronneau.net/)
- [TSS changelog](https://tss.peronneau.net/news.html)

## v1.0 — Core Sailing Situation Authoring

Build the foundational 2D authoring model for sailing situations.

- Create and open top-down sailing diagrams for rules, protests, tactics, and
  boat movements.
- Place, move, rotate, select, and edit boats and marks.
- Represent wind direction and boat headings.
- Support adjustable boat aspect ratios and mark sizes.
- Provide gate areas, committee boats, and other mark arrangements.
- Represent obstructions with a configurable proximity circle; the default
  radius is three boat lengths.
- Open diagrams in read-only mode for presentation or review.

Historical TSS references: 2.4A, 2.5G, 2.6A.

## v1.1 — Boat Classes and Sail Behavior

Expand the visual vocabulary and sailing-specific behavior of diagram objects.

- Support Optimist, Tornado, trimaran, judge, wing, and other racing-boat
  representations.
- Improve sail rendering and representation quality.
- Support symmetric and asymmetric spinnakers.
- Support manual sail trimming.
- Represent a flogging spinnaker when luffing above close-hauled.
- Represent boat-by-the-lee sail behavior.

Historical TSS references: 2.5C, 2.5F, 2.6F, 2.6G, 2.6H.

## v1.2 — Timeline and Animation

Make a situation explainable as a sequence of tactical events.

- Edit boat positions and headings step by step.
- Animate continuous boat movement between situations.
- Control animation speed.
- Choose single-situation or cumulative display during step-by-step playback
  and animation.
- Preserve situation order in the visual stack so the latest situation is on
  top.
- Select the intended boat when multiple boats overlap.
- Animate judges and wings as racing boats.
- Export and play animated GIFs for one situation or a sequence of situations.
- Loop animated GIF playback continuously.

Historical TSS references: 2.4A, 2.4D, 2.4E, 2.5C, 2.6D, 2.6E, 2.6G.

## v1.3 — Tactical Annotations and Rules

Add the visual explanations needed to teach and discuss a situation.

- Draw straight tactical arrows.
- Draw curved arrows for mark roundings, boat course changes, and other
  maneuvers.
- Add comments or balloons to diagrams.
- Customize annotation font color and size.
- Show the basic rules that apply to each situation.
- Attach contextual rule references to a diagram or situation.

Historical TSS references: 2.4E, 2.5E, 2.5F.

## v1.4 — Canvas and Document Workflow

Make diagram creation and navigation efficient for repeated coaching and
protest-room use.

- Pan or scroll the diagram by dragging the canvas.
- Zoom with the mouse wheel and modifier-key input.
- Provide a welcome flow for creating or opening a diagram.
- Provide search and setup panels for finding and configuring diagrams.
- Provide undo facilities for authoring changes.
- Allow multiple diagrams to be open in one application session.
- Improve drawing clarity and overall diagram presentation.

Historical TSS references: 2.6A, 2.6C, 2.6D.

## v1.5 — Media, Printing, and Presentation Export

Support diagrams as reusable teaching and presentation assets.

- Add pictures such as flags, logos, and other reference images to diagrams.
- Export diagrams as PNG, GIF, and JPG images.
- Export multiple JPG images from a sequence for presentation software.
- Print diagrams so they fit on one page when possible.
- Produce clear, presentation-ready static diagrams.

Historical TSS references: 2.3C, 2.4D, 2.4E, 2.5A, 2.5E, 2.5G, 2.6E.

## v1.6 — Sharing and Scenario Repository

Make authored situations portable and shareable with other sailors and race
officials.

- Save and open portable scenario files.
- Publish diagrams to a web-hosted TSS repository.
- Browse and share repository scenarios.
- Preserve scenarios for later review, presentation, or reuse.

Historical TSS references: 2.5E.

## v1.7 — Help, Licensing, Updates, and Distribution

Provide the supporting product experience needed to install, learn, register,
and maintain the application.

- Provide in-product help, including a packaged help format and updated help
  content.
- Keep help available when the application is launched from an email or web
  page.
- Support registration and licensing for continued use.
- Allow registration keys to be obtained directly from TSS.
- Check for updates at application startup.
- Support Windows Vista and compatible 64-bit Windows installations.
- Provide an installer and distribution workflow.

Historical TSS references: 2.4D, 2.5A, 2.5C, 2.6A, 2.6E, 2.6G.

## Scope Notes

- This document is a feature catalog and target roadmap; it does not label
  features by current implementation status.
- Historical bug fixes and corrective release notes are intentionally omitted.
- Historical release references identify the source changelog entries for each
  capability; they are not planned Tack Wise release dates.
