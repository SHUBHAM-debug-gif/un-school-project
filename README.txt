UNITED NATIONS ECOSYSTEM — DIGITAL MUSEUM V4 (FIXED)

HOW TO OPEN
1. Extract the ZIP.
2. Keep index.html, style.css, script.js and the assets folder together.
3. Open index.html in current Chrome, Edge or Firefox.
4. All QR codes and core interactions work locally.
5. Internet is needed only when opening official external websites.

MAJOR FIXES
- Removed duplicated malformed crisis-simulator HTML.
- Removed conflicting old and new voting systems.
- Rebuilt Security Council voting with reliable veto logic.
- Rebuilt the language switch without rewriting unrelated elements.
- Fixed ambient sound using the browser-safe Web Audio API.
- Added reliable modal, menu, rooms drawer, tour and presentation controls.
- Added runtime error reporting and a test mode.
- Improved mobile layout and touch targets.
- Improved agency search, filters and QR profiles.
- Improved interactive map, SDGs, quiz, chatbot, game and certificate.

TEST MODE
Open index.html?test=1 to disable long animations during technical testing.

CURRENT DATA VERIFIED: 14 July 2026
- 193 Member States
- Six principal organs
- 15 current Security Council members
- 11 current UN peacekeeping missions
- More than 50,000 peacekeepers currently serving
- UN Secretary-General: António Guterres
- WHO Director-General: Dr Tedros Adhanom Ghebreyesus
- UNESCO Director-General: Khaled El-Enany

GITHUB PAGES
Upload all extracted files to your repository and enable:
Settings > Pages > Deploy from a branch > main > /(root)


EMPTY OVERLAY FIX
- Fixed the blank dark pop-up visible immediately after opening the website.
- Added a critical hidden-state rule inside both index.html and style.css.
- Added defensive JavaScript startup states for every overlay and simulator panel.


AI CHATBOT ADDED
- Floating UN AI Guide available on every section.
- Answers questions about all included UN organs and agencies.
- Understands headquarters, founding year, leadership, functions, achievements and current focus.
- Answers questions about all 17 SDGs and current peacekeeping missions.
- Remembers the last agency for follow-up questions.
- Can compare two organizations.
- Can navigate visitors to the map, SDGs, peacekeeping, simulators, history or learning zone.
- Includes official website buttons in answers.
- Supports voice input when the browser provides Speech Recognition.
- Can read the last answer aloud.
- Works offline and does not expose or require an API key.

IMPORTANT
This is a private, browser-based knowledge assistant designed for a school exhibition.
A fully open-ended cloud AI would require a secure backend; an API key must never be placed inside public frontend JavaScript.


GENERAL ASSEMBLY VOTING SYSTEM ADDED
- Dedicated General Assembly voting tab.
- Visual hall containing 193 Member-State seats.
- Yes, No and Abstain delegate controls.
- Animated green, red and yellow seat indicators.
- Simple-majority mode for ordinary questions.
- Two-thirds-majority mode for important questions.
- Threshold automatically uses members present and voting.
- Abstentions are displayed but excluded from the threshold calculation.
- Adopted and rejected demonstrations.
- Close-voting and reset controls.
- Official General Assembly rules link.
- UN AI Guide can explain and open the General Assembly voting system.


V4.4 MOBILE-FIRST UPGRADE
- Phone-only bottom navigation for Home, Agencies, Voting, Learning and AI.
- One-hand-friendly 44–48 px touch controls.
- Safe-area support for modern Android phones and iPhones.
- Full-screen mobile AI chatbot above the bottom navigation.
- Responsive mobile menu with large navigation rows.
- Compact hero, Earth animation and two-column statistics.
- Horizontally scrollable filters, city selectors and simulator tabs.
- One- and two-column agency, mission, gallery and history layouts.
- Larger map markers and mobile city controls.
- Mobile Security Council and General Assembly voting layouts.
- 193 General Assembly seats remain visible and usable on small screens.
- Scrollable comparison table with a sticky first column.
- Bottom-sheet modals, mobile guided tour and mobile presentation controls.
- Landscape-phone support and reduced-motion accessibility.


VERSION 5 — COMPETITION EDITION
- Real, locally stored photographs with visible image credits.
- Named-country General Assembly voting for all 193 UN Member States.
- Country flags, search, display regions, country-by-country report, CSV download and print report.
- Interactive SDG City 2030.
- India and the United Nations exhibition section.
- Installable Progressive Web App with offline caching.
- Kiosk mode with automatic return to the home screen after inactivity.
- Automatic museum tour.
- Presenter dashboard and activity reset controls.
- Accessibility controls: text size, high contrast, reduced motion and visible keyboard focus.
- Improved AI knowledge about India and UN peacekeeping.
- Local app icons and mobile installation support.

IMPORTANT FOR OFFLINE APP INSTALLATION
Service workers require the website to be opened from GitHub Pages, Netlify, Vercel or a local web server.
Opening index.html directly still works, but browser app installation and automatic offline caching require HTTPS or localhost.


VERSION 5.1 — LOADING SCREEN FIX
- Corrected a JavaScript syntax error in the General Assembly CSV report.
- Added an independent loader timeout that works even if another feature fails.
- The Skip Intro button now has a separate inline fallback.
- Added error and rejected-promise safeguards that release the loading screen.
- Updated PWA cache version to prevent the broken script from remaining cached.
- Added cache-busting version numbers to style.css and script.js.

IMPORTANT
Extract this version into a new folder rather than replacing only one file.
For a published website, upload every file and press Ctrl+F5 once after deployment.


VERSION 5.2 — PERMANENT LOADER FAIL-SAFE
- The intro now closes automatically through CSS after about two seconds.
- A separate inline emergency script closes it even if script.js fails.
- The Skip Intro button works directly through HTML.
- The corrected JavaScript has been syntax-checked.
- Service-worker navigation now uses network-first loading so new versions update.
- Added fix-cache.html for removing an older broken published cache.

IF A PUBLISHED WEBSITE STILL SHOWS THE OLD LOADER
Open:
https://YOUR-WEBSITE-ADDRESS/fix-cache.html

For GitHub Pages this will be similar to:
https://SHUBHAM-debug-gif.github.io/un-school-project/fix-cache.html

That page removes the old cached service worker and opens the corrected website.


VERSION 5.4 — ACCURATE WORLD MAP
- Removed all manually drawn continent shapes.
- Added a geographically accurate Robinson-projection map generated from Basemap geographic data.
- City markers use real latitude and longitude coordinates.
- Only the selected or hovered city label appears, preventing European label crowding.
- New York opens by default and the city list remains available on mobile.


VERSION 6 — EXHIBITION EDITION
- Simplified mobile header: only language and menu remain visible.
- Moved Install, Accessibility, Presenter and Sound tools inside the mobile menu.
- Rebuilt the phone bottom bar as Home, Explore, Map, Voting and Ask.
- Removed the floating AI button on phones to prevent content overlap.
- Added quick museum-room cards to the opening screen.
- Improved section headings so long titles do not overflow.
- Added automatic low-power mode for smaller or lower-memory phones.
- Added back-to-top control.
- Improved map card containment and added extra clearance above the mobile navigation.
- Improved city-panel spacing and horizontally scrollable city buttons.
- Added subtle room numbers and card lighting on larger screens.
- Added cache version 6.0 so old layouts are replaced after deployment.

UPLOAD NOTE
Upload every extracted file, including assets, style.css, script.js, service-worker.js and fix-cache.html.
Then open fix-cache.html once on the published website.


VERSION 7 — PROFESSIONAL DIGITAL MUSEUM
- Added UN Charter and Core Values gallery.
- Added the six official UN languages display.
- Added a professional UN-in-Action section covering five major pillars.
- Added a global-issues explorer for climate, health, refugees, food, education and equality.
- Added a five-stage field-action process.
- Added a searchable UN glossary and decision pathway.
- Added an official-source reference centre.
- Added a site-wide museum search overlay with keyboard shortcut (/).
- Added professional institutional styling, gold Charter accents and improved information hierarchy.
- Added more educational information while keeping mobile layouts responsive.
- Updated offline cache and installable-app metadata to Version 7.

DEPLOYMENT
Upload every extracted file to GitHub Pages, then open fix-cache.html once.


VERSION 8 — INTERACTIVE EXHIBITION EDITION
- Added an Agency Comparison Lab for side-by-side organization profiles.
- Added a 193 Member-State Country and Region Explorer.
- Added a Global Cooperation Funding and Priorities Lab.
- Added a Model United Nations delegate speech challenge with a 60-second timer.
- Added printable Model UN delegate cards.
- Added a persistent UN Museum Passport with automatic room stamps.
- Added six achievement badges and printable passport output.
- Added new museum search entries and AI navigation for the new activities.
- Progress is stored locally in the visitor's browser.
- Updated installable-app metadata and offline cache to Version 8.

The funding activity uses fictional exhibition points and is clearly labelled as an educational model.


VERSION 9 — ULTIMATE INTERACTIVE EDITION
- Added a selected UN International Days calendar.
- Added a diplomacy and treaty-building challenge.
- Added an agency response-team matching activity.
- Added a 193-country flag-identification game.
- Added a Fact or Myth UN knowledge game.
- Added browser text-to-speech narration for the current section.
- Added local visitor feedback with star ratings.
- Added teacher CSV export for room visits, badges and feedback.
- Added the new rooms to museum search, AI navigation and passport progress.
- Updated offline cache and installable app metadata to Version 9.

Feedback and progress remain stored only on the visitor's device.


VERSION 10 — IMMERSIVE EXPERIENCE
- Added a Global Situation Room with four educational crisis scenarios and three-stage decision making.
- Added diplomacy, protection and cooperation scoring with outcome assessment.
- Added an interactive General Assembly and Security Council chamber hotspot tour.
- Added a formal educational UN Resolution Builder with selectable clauses, live preview, download and print.
- Added a UN Careers and Skills Explorer with eight role profiles and a five-question career quiz.
- Added a calendar-based Daily Museum Challenge.
- Added achievement confetti and new passport stamps and badges.
- Added the new experiences to museum search, mobile tools and AI navigation.
- Updated the installable-app metadata and offline cache to Version 10.

The Situation Room is an educational simulation and does not represent real operational decision-making.


VERSION 10.1 — ORIGINAL SOUNDTRACK EDITION
- Replaced the old three-tone ambient sound with four complete original instrumental themes.
- One Earth: cinematic opening and exploration theme.
- Blue Helmets: solemn peacekeeping theme.
- Future 2030: hopeful SDG and technology theme.
- Assembly Hall: calm diplomatic piano-inspired theme.
- Added a full music player with Play/Pause, Previous, Next and direct track selection.
- Added smooth fade-in, fade-out and track transitions.
- Added a volume control that remembers the visitor's setting.
- Added a progress bar and time display.
- Added an animated audio visualizer.
- Added optional automatic section themes.
- Added mobile bottom-sheet music controls.
- All music is original and included locally for offline playback.
- No commercial or copyrighted songs are included.

IMPORTANT
Keep the entire assets/music folder beside index.html when uploading the website.
Modern browsers require the visitor to press Play before music can begin.


VERSION 10.2 — SITUATION ROOM READABILITY FIX
- Increased all Situation Room decision headings.
- Increased question text and made it brighter.
- Increased decision-choice button text and line spacing.
- Added larger touch targets and internal padding.
- Improved contrast, borders and selected-state visibility.
- Changed the decision layout to one column on tablets and phones.
- Added better hover and keyboard-focus states.
- Updated the PWA cache to Version 10.2.


VERSION 10.3 — PREMIUM AUDIO EDITION
- Rebuilt the soundtrack with six longer, richer original instrumental tracks.
- Upgraded audio encoding from 128 kbps to 192 kbps stereo.
- Added layered strings, piano, flute, bells, bass, percussion and ambient reverb.
- Added One World Overture, Peacekeepers' Promise, Future 2030 Horizon,
  Assembly of Nations, Humanitarian Dawn and Planet in Balance.
- Added a persistent mini-player while music is active.
- Added shuffle and repeat-one/repeat-all modes.
- Added mute and a 10/20/30-minute sleep timer.
- Added keyboard shortcut M to mute or unmute music.
- Added smoother fades and richer section-based soundtrack changes.
- Music automatically lowers during spoken section narration and returns afterward.
- Volume, mute, shuffle, repeat and selected track settings are saved locally.
- All music remains original, offline and free from commercial copyrighted songs.

IMPORTANT
Upload the complete assets/music folder. The first playback still requires a visitor tap
because modern mobile and desktop browsers block automatic audio.


VERSION 10.4 — MULTILINGUAL EDITION
- Added English, Hindi, French and Spanish language options.
- Replaced the two-language toggle with a professional language menu.
- The selected language is remembered on the visitor's device.
- Translated the main navigation, museum rooms, section headings, key descriptions,
  buttons, forms, accessibility controls, music controls and visitor activities.
- Added a live translation observer so dynamically generated controls are translated.
- Added localized number templates such as question counts, room counts and country totals.
- Narration now uses en-IN, hi-IN, fr-FR or es-ES according to the selected language.
- AI voice input now uses the selected language.
- The offline AI Guide can answer basic questions in French and Spanish.
- World clocks now use the selected locale.
- Official organization names, country names, acronyms and source titles remain in
  their recognized official form where appropriate.
- Updated offline cache and installable app metadata to Version 10.4.

All translations work offline. No external translation service is required.


VERSION 10.5 — MOBILE LAYOUT FIX
- Fixed the navigation link that remained over the hero section.
- The mobile menu is now a proper scrollable drawer with an opaque background.
- Added a dark backdrop and reliable close behavior.
- The menu closes after selecting a page, tool, pressing Escape or tapping outside.
- Simplified the mobile header to brand, language and menu controls.
- Moved Narration and Passport into the mobile menu to create more space.
- Reduced and contained the large United Nations hero heading.
- Prevented horizontal page overflow on narrow devices.
- Fixed hero buttons, badges, information strips and cards overflowing the screen.
- Added a permanent mobile Music button above the bottom navigation.
- Music Player is now the first and largest tool inside the mobile menu.
- The music panel opens as a full-width scrollable bottom sheet.
- Updated the offline cache to Version 10.5.
