---
name: dcg-client-guide
description: Write plain-language guides for the DCG Dental client (Russell) or the co-owner, such as how to approve listings, manage coupons, handle a refund, or what to do when something breaks. Use for any non-technical, client-facing explanation of the platform.
---

# Client guides

The reader runs a dental education business. Smart, busy, not technical. They'll follow steps exactly as written.

## Before writing
- Confirm what the feature actually does today by reading the code or `docs/ARCHITECTURE.md`. Don't describe features from memory.
- Ask who it's for (Russell, the co-owner, a future admin) and what they need to get done

## Voice
- Use the human-writing skill if it's available
- Short sentences. Second person ("you").
- No jargon: say "the website" not "the app", "the list of classes" not "the classes table"
- No em dashes
- Name the exact button and page: "Click **Approve** on the Submissions tab"

## Structure
1. One line on what this guide helps you do
2. Numbered steps, one action each
3. "What you should see" after any step where they might wonder if it worked
4. "If something looks wrong" with 2 or 3 common cases and who to contact
5. Nothing about code, env vars, or databases unless the guide is specifically for the co-owner

## Never include
- Passwords, keys, coupon codes, or account numbers
- Anything that tells them to change Supabase, Vercel, or Stripe settings, unless that's the guide's explicit purpose and Jupiter approved it

## Deliver
- As a doc they can open and share. Don't commit client guides into the repo unless asked.
