# DJ Manmeet — Premium DJ Artist Portfolio Template

A dark, neon-styled one-page portfolio built for DJs, producers, and live performers. Converted from the Rockfest layout while keeping the original section structure and components.

## Quick customization

Edit **`js/artist-config.js`** to update:

- Artist name, tagline, SEO meta
- Social links (Spotify, YouTube, Instagram, WhatsApp, etc.)
- Contact details
- Stats (years, events, countries, releases)
- Countdown target date for the next event

HTML sections in **`index.html`** hold event cards, gallery images, embeds, and testimonials — swap text and image paths directly.

## Color theme

- Primary scheme: **`css/colors/scheme-dj-neon.css`**
- Extra styles: **`css/dj-portfolio.css`**
- Typography / base DJ styles: **`css/de-dj.css`**

Change `--primary-color` and `--accent-magenta` in `scheme-dj-neon.css` to rebrand.

## Sections

1. Hero — fullscreen carousel + CTAs + wave visualizer  
2. About — bio, genres, animated counters  
3. Events — tour cards with tickets / sold-out badges  
4. Music — Spotify, SoundCloud, featured tracks  
5. Gallery — masonry grid + lightbox + video thumb  
6. Videos — YouTube embeds  
7. Brands — logo carousel  
8. Testimonials — client reviews  
9. Booking — inquiry form + WhatsApp / email / Instagram  
10. Social — platform links + Instagram preview  
11. Footer — links, contact, social icons  
12. Countdown — next performance timer  

## Run locally

Open `index.html` in a browser, or use any static server:

```bash
npx serve .
```

## Booking form

The form posts to `src/index.php` (PHP mail handler included). Configure your server or replace with Formspree / Netlify Forms as needed.
