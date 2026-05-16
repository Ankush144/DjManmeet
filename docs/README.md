# DJ Manmeet — Live Portfolio Demo

This folder is the **GitHub Pages** deploy package for the DJ artist portfolio site. Open `index.html` locally or publish via GitHub Pages to share with clients.

## Publish on GitHub Pages

1. Push this repository to GitHub (include the `docs` folder).
2. On GitHub: **Settings → Pages**.
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or your default branch)
   - **Folder:** `/docs`
4. Save. After 1–3 minutes your site will be live at:

   `https://<your-username>.github.io/DjManmeet/`

   (Replace `DjManmeet` with your repository name if different.)

## Customize the artist

Edit **`js/artist-config.js`** — name, links, stats, countdown date, contact info.

Update copy and images in **`index.html`** and the **`images/`** folder.

## Local preview

```bash
cd docs
npx serve .
```

Then open the URL shown in the terminal (usually `http://localhost:3000`).

## Notes

- The booking form posts to PHP (`src/index.php`), which does **not** run on GitHub Pages. For production, use Formspree, Netlify Forms, or your own API and update the form `action` in `index.html`.
- Spotify, YouTube, and SoundCloud embeds require an internet connection.
