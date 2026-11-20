# KalaSetu — Your art. Your terms.
Hackathon prototype: a browser demo of an artist-controlled booking workflow for folk performers.

**Run:** unzip, then open `welcome.html` in any modern browser. No install, build step, server or network needed.

**Demo flow**
1. Start on the separate KalaSetu welcome page. Choose *Explore the universe of art* to open Login / Sign up. From the booking demo Home, choose *Find artists* for the Organizer flow, *Join as an artist* to open sign-up with Artist selected, or *Tourist* to browse organizer events and artist event offerings. Tourist browsing does not switch demo roles.
2. As an Artist, complete *Artist registration*: generate and review a profile draft, add skills and portfolio filenames, then approve and publish.
3. Browse and search groups by name, art form, place, or skill; save groups to *Wishlist* for later. As an Organizer, enter event type, location, date, and total budget in *Event & matches*. Describe the event to see a relevant image preview, then add optional performance notes, select an eligible group, and send a request. Suggestions rank fictional groups using budget, event specialty, location, and group capacity.
4. As an Artist, review the request in *Requests*: the prefilled offer is below the listed fee, so acceptance requires an explicit exception; the Artist can instead counteroffer or decline. The Organizer must approve any counteroffer before the booking is confirmed.
5. In *Bookings*, review agreed terms and history. The Organizer can record simulated payments; the booking is marked completed when the balance reaches zero.

**Notes**
- All data is fictional and lives in this browser's `localStorage`; **Reset demo** restores the seed data.
- Wishlist selections and custom performance notes are saved only in this browser demo.
- "Log in", "Sign up", and "Switch demo role" are prototype controls, not authentication.
- Matching and profile extraction are deterministic demo rules, not live AI. Typing always works; there is no speech input.
- Event preview photos are selected from the event type and description and are hosted by Unsplash; an internet connection is required to load them.
- Selected media filenames can be listed on the profile, but media files are not uploaded or persisted.
- Payments are simulated only: no checkout, escrow or guarantee. Money is stored as integer paise.
- Not a secure production system: no accounts, server validation or encryption.
