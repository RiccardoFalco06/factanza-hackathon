# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- Primary: Gen Z (about 16–30) who already meet Factanza on Instagram and TikTok and land in the app from a post, a story link, a newsletter or a QR at an event. They use it on the phone, in short sessions, often while something is happening (a vote, Sanremo, a scandal) and want to follow it with others.
- Evaluators: the Factanza Hackathon jury (Factanza team and ZNext/Zanichelli) watching a recorded demo and trying the prototype from a QR.

## Product Purpose
A single Factanza platform that turns 2 million monthly social reach into an active community that stays inside Factanza. Success = more time and more return visits, which bring people closer to Factanza's paid services (Academy, subscription, events, books, game).

## Positioning
Not a news aggregator with AI recommendations. Factanza's own explanations ("the world in 1 minute") plus following live events together with the community, a weekly quiz with a streak, and Zanichelli definitions on difficult words. AI stays behind the scenes; people, creators and community stay in front.

## Operating Context
- Entry from social without sign-up; the account is asked softly after some value (progress, streak, followed events).
- Core loop: follow a live event (news or gossip) → updates arrive in real time with community comments → share it → it stays pinned in Home next to the weekly quiz → notifications bring people back (followed-event updates, quiz streak).
- Factanza services live inside the app, not as external links: podcasts with an always-on player, the board game The Social Contract, Academy courses (first lesson free), free live classes, books, newsletters (Weekly Pills, The Feed), Plus. Payment is the only step outside (fake in the demo).

## Capabilities and Constraints
- Hackathon prototype, phone-sized web app; on desktop a centred phone column to record with Recordly.
- Real server and database hosted on Riccardo's Mac (decided 2026-11-21): real comments and follows shared live between everyone who opens the demo (e.g. the jury from the QR). Must be easy to move to another computer (copy one folder, one command).
- Language: English (the presentation site is English by default).
- Example community activity (fake users commenting, event updates arriving) is simulated on top of the real comments, so the demo looks alive even when few people are connected.
- Undecided: moderation policy for comments, real Zanichelli integration.

## Stack
Delegated: plain HTML/CSS/JS front end (the existing demo), Node server with data on Supabase (Postgres) and live updates pushed to the browser; public link through a tunnel from the Mac.

## Brand Commitments
- Factanza's 3D F logo, the "Tessera" system in DESIGN.md/tokens.css (tiles with solid navy depth, one highlighted keyword per title, the small F bottom-left on every cover).
- Voice: "accessible but not simplistic", informal "you", irony and wordplay, the world explained in one minute.
- Trust first: sources visible, no AI-written news or opinions, no synthetic creator voices.

## Evidence on Hand
- Real Factanza service names: podcasts Squattrinati, Rewind, The Factanza Show, Tutti i fatti, Oriana, Ogni maledetto Sanremo; Factanza Academy (Digital Creator School: 22 h, 50 lessons, 4 modules, two 1:1 calls, €799; AI Content School); books "Come siamo diventati schiavi felici" and "Stare bene in un mondo che corre"; board game The Social Contract; newsletters Weekly Pills and The Feed; Factanza Awards.
- Everything else (news, figures, people, artists, episodes, Zanichelli partnership) is example content and must be labelled as such.

## Product Principles
1. Follow it together: the live event with the community is the heart of the app.
2. Zero friction in, value before the account.
3. Every minute leads somewhere: each piece links to the next and, at the right moment, to a Factanza service.
4. Trust is the asset: sources visible, moderation visible, AI only behind the scenes.

## Accessibility & Inclusion
Readable contrast on saturated tiles, reduced-motion respected, every action reachable by keyboard and screen reader.
