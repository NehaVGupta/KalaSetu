# KalaSetu — Your art. Your terms.
Hackathon prototype: a browser demo of an artist-controlled booking workflow for folk performers.

**Run:** unzip, then open `index.html` in any modern browser. No install, build step, server or network needed.

**Demo flow**
1. Start on KalaSetu Home. Choose *Find artists* for the Organizer flow or *Join as an artist* to open sign-up with Artist selected. This is demo role selection only; no credentials or real accounts are created.
2. As an Artist, complete *Artist registration*: generate and review a profile draft, add skills and portfolio filenames, then approve and publish.
3. As an Organizer, enter event type, location, date, and total budget in *Event & matches*. Suggestions rank fictional groups using budget, event specialty, location, and group capacity. Select an eligible group and send a request.
4. As an Artist, review the request in *Requests*: the prefilled offer is below the listed fee, so acceptance requires an explicit exception; the Artist can instead counteroffer or decline. The Organizer must approve any counteroffer before the booking is confirmed.
5. In *Bookings*, review agreed terms and history. The Organizer can record simulated payments; the booking is marked completed when the balance reaches zero.

**Notes**
- All data is fictional and lives in this browser's `localStorage`; **Reset demo** restores the seed data.
- "Log in", "Sign up", and "Switch demo role" are prototype controls, not authentication.
- Matching and profile extraction are deterministic demo rules, not live AI. Typing always works; there is no speech input.
- Selected media filenames can be listed on the profile, but media files are not uploaded or persisted.
- Payments are simulated only: no checkout, escrow or guarantee. Money is stored as integer paise.
- Not a secure production system: no accounts, server validation or encryption.
