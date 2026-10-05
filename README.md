# PageSpeed Audit

A responsive React app for auditing web performance with the Google PageSpeed Insights API.

## Run locally

```bash
npm install
npm run dev
```

To configure the Google PageSpeed Insights API key locally, copy `.env.example` to `.env.local` and set `VITE_PAGESPEED_API_KEY`. Vite loads that key when the app starts; restart the dev server after changing it. `.env.local` is ignored by Git. You can also enter a key in the app's API key settings; that override stays in memory for the current tab.

The dashboard opens with an illustrative preview report. Enter a URL and select **Test speed** to request live mobile and desktop Lighthouse reports. Because this app calls Google directly from the browser, a Vite `VITE_` key is included in the built client and is visible to visitors. Restrict it in Google Cloud to the PageSpeed Insights API and the website's HTTP referrers. For a private key, use a server-side proxy instead.

The report includes performance, accessibility, best-practices, and SEO scores, Lighthouse metrics, grouped audits, mobile/desktop switching, expandable recommendations, a direct PageSpeed Insights link, and a print-to-PDF export.
