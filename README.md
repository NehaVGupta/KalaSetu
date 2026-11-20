# KalaSetu — Your art. Your terms.
Hackathon prototype: a browser demo of an artist-controlled booking workflow for folk performers.

**Run:** unzip, then open `index.html` in any modern browser. No install, build step, server or network needed.

**Core demo (about 2 minutes)**
1. *Profile studio* (switch demo role to Artist): "Use sample introduction" → "Generate profile draft" → "Approve & publish".
2. *Organizer request* (Organizer role): send the prefilled 45-minute college request. The ₹8,000 offer against the listed ₹10,000 is flagged for artist review. Nothing is confirmed.
3. *Artist inbox* (Artist role): accepting needs an explicit exception tick, or send a counteroffer (e.g. ₹10,000), which creates v2.
4. Switch to Organizer and approve v2. Both roles have now approved the same current version, so the booking is confirmed.
5. *Booking workspace*: agreed terms, offer history, activity log, and **Simulate payment** against the outstanding balance.

**Notes**
- All data is fictional and lives in this browser's `localStorage`; **Reset demo** restores the seed data.
- "Switch demo role" is demo switching, not authentication.
- Extraction is rule-based: *Demo extraction—not live AI.* Typing always works; there is no speech input.
- Payments are simulated only: no checkout, escrow or guarantee. Money is stored as integer paise.
- Not a secure production system: no accounts, server validation or encryption.
