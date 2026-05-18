# PH Bot — Operations Runbook

Day-to-day operational knowledge for running the ph-bot. Pairs with `ONBOARDING.md` (new-client SOP) and `README.md` (codebase architecture).

Captured from Walter Schratt's handoff (May 18, 2026) and ongoing operational discoveries.

---

## Deploy pipeline

The whole loop is:

```
edit file → git commit → git push origin main → GitHub → Railway auto-deploy → live in ~30s
```

There is **no staging environment**. `main` IS production. A push to `main` triggers a Railway redeploy of the live SMS bot. During those ~30 seconds the bot may briefly restart and miss webhook calls. Avoid pushing during high-traffic windows (lead drips, etc.).

Railway also runs the DB migration step automatically on boot. If a migration is wrong, the boot fails and the previous version stays live — check Railway → ph-bot → web → Deployments → Build Logs / Deploy Logs.

---

## When the bot stops responding

Follow this sequence:

1. **Check GHL workflow execution.** In GHL, open the contact, click the bot's most recent message → CloudBot Outreach action → execution log. If the webhook fired but the bot didn't reply, the issue is on our side. If the webhook didn't fire, GHL workflow is broken.
2. **Check Railway deploy status.** Railway → ph-bot → web → Deployments. If the latest deploy is failed or building, that's why.
3. **Read deploy logs.** Click into the active deployment → Deploy Logs. Copy any error into chat for diagnosis.
4. **Check the QC Portal console.** The web service at `web-production-eaa98.up.railway.app` has a dev console / health page showing "all systems operational" or specific failures.

---

## Adding a new SMS phone number (Signal House)

**Critical gotcha — easy to miss:**

After buying any new phone number in GHL and provisioning it through Signal House, you MUST:
1. Open the number in Signal House
2. Open the number's **default settings**
3. Tick the two specific routing checkboxes (Walter never wrote down which two — they will be obvious from the UI but the UI doesn't always show their state)
4. Save

If you skip this, SMS will silently fail to deliver — no error, just no traffic. Signal House's UI doesn't reliably indicate whether the boxes are checked, so always re-verify.

---

## Webflow operational notes

The live site `www.profithexagon.com` is currently served by the Webflow site **"Profit Hexagon 2.0"** (site ID `697e36c71b2e633fdd535f77`), NOT the older "Profit Hexagon" site as the handover doc states. If you publish edits, make sure you're editing 2.0.

### Embed block 5,000-character limit

Webflow caps each custom-code Embed block at 5,000 characters. When generating sections with Claude, ask for HTML+CSS+JS split across multiple Embed blocks if the section is large. Trying to cram everything into one block will silently truncate.

### Global custom code

Site-wide JavaScript (Cal.com booking embed, Memberstack, etc.) lives in Webflow → Site Settings → Custom Code, not in any individual page or section.

### Redirects can break the site

If `www.profithexagon.com` starts returning errors or won't load after a publish, the cause is often a corrupted 301 redirect in Site Settings → Hosting → 301 Redirects. Walter's workaround: delete and re-create the offending redirect. Root cause unknown.

### CMS automation (blog posts via Make.com)

A Make.com scenario auto-generates blog posts: keyword → Grok writes SEO post → image from a 20-image rotation by category → posted to the Blog Articles CMS via Webflow API → site auto-publishes. Author is rotated 40% Jeremiah / 40% Llewellyn / 20% Walter. To pause posting: deactivate the scenario in Make. To change topic/style: edit the Grok module's prompt.

---

## QC Portal (the dashboard at `/`)

- **All tab** — every SMS conversation, click to see full back-and-forth and side Claude chat.
- **Changes tab** — flagged bot replies queued for prompt edits. "Push Changes to Live Bot" commits to GitHub and triggers redeploy in ~30s.
- **Alerts tab** — system health alerts.
- **Workflows tab** — after adding or editing a GHL workflow, you MUST click **Re-cluster** for the bot to recognize it. Easy to forget.
- **Sync Prompt button** — pushes system-prompt-only changes (faster than full deploy).
- **Sync GHL button** — manually re-pulls GHL conversations. Otherwise auto-pulls daily at **8 AM**.

The bot's system prompt lives in TWO places:
- `src/prompts/standard.js` (and variants) — the code
- A database override — what the LIVE bot reads

When you click "Push Changes to Live Bot" in the portal, both get updated. Editing `standard.js` and pushing without going through the portal also works — the code is the source of truth on redeploy.

---

## New client onboarding — manual step that can't be automated

The web form on profithexagon.com triggers `POST /onboarding/submit` which creates the GHL sub-account and most config automatically. However, **PIT token creation cannot be automated** (GHL doesn't expose this in their API).

After form submission:
1. Inside the new GHL sub-account: Settings → Integrations → Private Integrations → Create New
2. Scopes: `conversations.readonly`, `conversations.write`, `contacts.readonly`, `contacts.write`, `opportunities.readonly`, `opportunities.write`, `calendars.readonly`, `calendars.write`
3. Copy the token, paste into the sub-account's `ghl_token` custom value
4. The next inbound SMS from that sub-account auto-writes the token to the `subaccounts.ghl_api_key` DB table

See `ONBOARDING.md` for the full phase-by-phase checklist.

---

## Voice agent (ElevenLabs) — known limitation

The voice agent currently does NOT query the live calendar in real time. Instead it offers 3 hardcoded time options and books whichever the prospect picks via the post-call webhook to GHL. This means:
- Double-bookings are possible if two prospects pick the same slot before the calendar syncs
- Outside-business-hours bookings are possible if the prospect insists on a time the agent suggested

Long-term fix would be a real-time calendar query mid-call, which ElevenLabs' API didn't support cleanly when Walter built it.

---

## Service tiers and limits (as of May 18, 2026)

| Service | Tier | Key limit |
|---|---|---|
| **Railway** | Hobby ($5/mo + usage) | Usage was ~$50/mo at handoff, now Walter signed Jeremiah up fresh |
| **Make.com** | Free | 2 active scenarios, 1,000 ops/month, 7-day retention |
| **Anthropic API** | Pay-as-you-go | ~$20-25/mo at current volume |
| **Webflow** | Workspace plan | Unknown exact tier |

Total infra cost target: ~$75/mo all-in.

---

## Project naming reference

- **Railway project:** `ph-bot` (was auto-named `modest-eagerness` until May 18, 2026)
- **Railway service:** `web`, public URL `https://web-production-eaa98.up.railway.app`
- **Railway Postgres service:** standard, with volume `postgres-volume-z5CD`
- **GitHub repo:** `github.com/profithexagon/ph-bot`
- **Webflow live site:** "Profit Hexagon 2.0" (site ID `697e36c71b2e633fdd535f77`)
- **GHL Agency Company ID:** `D3aRlPovu9ZzLuafhiat`

---

## Open known issues to clean up later

- Decommission remaining Botpress workflows on sub-accounts that haven't migrated to "Claude Outreach"
- Enable 2FA on the GitHub `@profithexagon` org before June 15, 2026 deadline
- Rotate the GitHub PAT created May 18, 2026 (was pasted in chat during setup)
- Rotate the Railway API token created May 18, 2026 if extra paranoid
- Consider migrating Webflow → Vercel (Walter estimated multi-day; deferred)
- Voice agent real-time calendar query (deferred — see above)
