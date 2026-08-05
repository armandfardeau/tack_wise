# PostHog session-duration analysis

Compare session duration across users grouped by the event property `ff_setup`.

- Use unique sessions as the aggregation.
- Exclude internal and test users.
- Report session count, average duration, median duration, and the percentage of sessions lasting at least five minutes.
- Break down the results by `ff_sail_boom_length` and `ff_sail_stroke_width`.
- Flag setups with small sample sizes or materially unbalanced traffic.
- Identify the setup with the strongest engagement, but do not declare a winner solely from a small or unbalanced sample.

If session duration cannot be broken down directly by event properties, use the first event in each session that contains `ff_setup` as the segmentation point.
