# Contributing templates

Tack Wise templates are stored as JSON files in `src/data/situations/`. A
template contains only a title and its frames:

```json
{
  "title": "A short situation title",
  "frames": []
}
```

The easiest way to contribute is from the app. Open **File → Templates →
Submit current diagram**, copy the generated JSON, and open the GitHub editor
link. Add the JSON to the suggested path, commit it to a new branch, and use
GitHub’s **Create pull request** option. To update an existing template, load
it first, make the changes, then choose **Update current template**.

Please keep a template pull request focused on one situation and do not include
changes outside `src/data/situations/`. The pull-request checks validate the
template JSON before review.

Deployments that target a fork can set `VITE_TEMPLATE_REPOSITORY` to an
`owner/name` value and `VITE_TEMPLATE_BRANCH` to the branch used by that fork.
