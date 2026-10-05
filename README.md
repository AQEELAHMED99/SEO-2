# PageSpeed Audit

A responsive React app for auditing web performance with the Google PageSpeed Insights API.

## Run locally

```bash
npm install
npm run dev
```

The dashboard opens with an illustrative preview report. Enter a URL and select **Test speed** to request live mobile and desktop Lighthouse reports. The API key is optional for occasional use; add one from the API key settings if Google asks for it. A key entered in the app is kept in memory for the current tab only.

The report includes performance, accessibility, best-practices, and SEO scores, Lighthouse metrics, grouped audits, mobile/desktop switching, expandable recommendations, a direct PageSpeed Insights link, and a print-to-PDF export.
