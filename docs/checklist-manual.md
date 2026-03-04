Landing page:
1. demo video — ⏳ PENDING (manual — record/embed walkthrough video)
5. Add all form with proper email admin with flomcp domain mail — ⏳ PENDING (manual — set up flomcp.com domain email in Resend)
Remaining 8 points to hit 90/100:
- Create /public/og-image.png (1200×630) — ⏳ PENDING (manual — Figma/Canva)
- Split "use client" off the hero into a server component — ⏳ PENDING (manual — ~2 hrs refactor)

GPT Addon:
24. verification: { google: "your-google-verification-code" } in layout.tsx — ⏳ PENDING (manual — replace with real Search Console code)
18. No og-image.png in public/ — ⏳ PENDING (manual — create 1200×630 image)
19. No apple-touch-icon.png — ⏳ PENDING (manual — export 180×180 icon to /public/apple-touch-icon.png)
20. "use client" on entire page.tsx — ⏳ PENDING (manual — architectural refactor ~2 hrs)
22. ProInterestModal doesn't trap focus — ⏳ PENDING (focus trap not yet implemented)   ✅ DONE 
--------------------------------------------------------------

Product: 
Remaining ⏳ PENDING (need work):

4b — Admin flow for support tickets
18 — Manual legal content review
20 — Type-to-confirm delete (server name input)  ✅ DONE 
21 — Audit all alert/toast messages  ✅ DONE 
22 — Python language support for generation
24 — MCP Assistant

---
18. Check all documents in legal. — ⏳ PENDING (manual — review Terms, Privacy Policy, Cookie Policy content for accuracy)
20. All delete should show server name to type and confirm. — ✅ DONE  (currently simple AlertDialog without type-to-confirm input)
21. Check all alert notifications. —  ✅ DONE (manual audit of all toast messages for tone/accuracy)
22. Support Python language for MCP server generation. — ⏳ PENDING (generation engine currently outputs TypeScript only)
23. Pro mode — not needed now. — 🚫 SKIPPED
24. MCP Assistant. — ⏳ PENDING (not started)
1.  Draft the generation templates. — ✅ DONE (generate page: left sidebar New/Drafts; Step5Review: Save as Draft button + hint; useDrafts hook localStorage CRUD; free plan 5 drafts; DraftCard load/delete; loadDraft action in generator store)
2.  User can save the prompts. use the prompts in generation. library two tabs MCP and prompt. — ✅ DONE (useSavedPrompts hook; Step1Description: Library dropdown loads saved prompts + Save to Library inline form; Library page: two tabs MCP Library / Prompt Library with list, copy, delete, use buttons; free plan 5 prompts)
3.  Resource library? like prompt — ✅ CONFIRMED NOT NEEDED (per-server resources work in generator Step4; global resource library is not MVP)
4.  Each generated MCP server should have config as raw JSON accordion after "Connect to your AI client". — ✅ DONE (server detail page: "Generation Input" accordion; collapsed by default; sections for description, API config, tools, resources, prompts; Copy Full JSON button) 
5.  In dashboard show upgrade button near plan. — ✅ DONE (Crown + "Upgrade to Pro" button on Plan card for free users, links to /dashboard/settings#subscription)
6.  Dashboard credits card: show 5/5 credits with "Add credits — Coming Soon". — ✅ DONE (Crown + coming soon note below credit bar; no add credits button for free users)
7.  Generation engine should generate README file with MCP documentation. — ✅ DONE (README.md tab added to server detail file viewer)
8.  My MCP Servers list with security score tag. — ✅ DONE (Shield badge with color-coded score next to status badge on servers list)
9.  Remove "one credit" — just say "credit". — ✅ DONE (generate page footer copy updated)
10. All dropdowns not showing correctly — white text on white background. — ✅ DONE (dark:[color-scheme:dark] on all native <select> elements in Step2, Step3, Step4, Support)
11. Prompt Library: cancel = Button, exclusive accordion (single open), AlertDialog delete. — ✅ DONE
12. Toast notification close button — remove it, auto-close only. — ✅ DONE (removed closeButton prop from Toaster; removed all [data-close-button] CSS from globals.css)
13. Sidebar nav order: Dashboard → Generate New → My MCP Servers → Library → Settings → Support. — ✅ DONE
14. Submit ticket shows enabled even with empty fields — show field errors before submit button. — ✅ DONE (touched state per field; per-field error messages; submit disabled until valid)
15. Submit ticket accept screenshots and video attachments. — ✅ DONE (file picker up to 3 files image/video; uploaded to Supabase Storage bucket support-attachments; public URLs stored in description; rendered as img/video previews in ticket detail dialog — run migration 010_support_attachments.sql)
16. Feedback system after server generation. — ✅ DONE (removed from PostGenerationReview; added to server detail page as permanent card + 1-min auto modal; thumbs up/down + optional comment; saves to user_feedback JSONB column via /api/feedback)
17. Settings display name should show everywhere in dashboard. — ✅ DONE (Sidebar + dashboard page now check user_metadata.display_name first before full_name → name → email)

25. Accept & View Server glitch (step 1 flash) — ✅ DONE (overlay moved to GenerateWizard level using navigatingToServer store flag; reset() now fires on page unmount only)

----------------------------------------------------------------------------------------------

10. chrome favicon and title — ✅ DONE (favicon.svg in /public/, layout.tsx metadata.icons: icon+shortcut=favicon.svg, apple=FloMCP-Logo.png)
2. demo code view — ✅ DONE (CodeEditorShowcase with 5-file tab viewer)
3. seo perfect — ✅ DONE (82→88/100 — session audit fixed: robots.txt was empty, sitemap only had homepage, description 183 chars, twitter-image.png missing, duplicate canonical, no <nav> on header links, how-it-works on <div> not <section>)
4. logo for flomcp — ✅ DONE
6. make sure all forms submitted without error and make sure validations and security fixes — ✅ DONE (server-side email regex, interest type whitelist, input sanitization)
7. All the landing page should be accessible using tabkey and enter/space key. So provide proper aria-label and role for all the buttons and forms and input and interactive sections — ✅ DONE (logo btn, nav btns, modals, FAQ accordion, code tabs, video placeholder — all aria'd)
8. proper order html order with heading and others — ✅ DONE (H1 hero → H2 sections → H3 subsections, verified no regressions)
9. see we have code so make sure not affecting anything and fully safe as string — ✅ DONE (code rendered as {file.content} inside <code> tag, never dangerouslySetInnerHTML)
11. mention with pro like using emoji crown represent pro wherever we mention coming soon — ✅ DONE (👑 Pro badge on VS Code extension card, 👑 Coming soon on credit top-up packs)
12. Make sure footer are correctly <a> and need any more links — ✅ DONE (Privacy Policy added, MCP Library added, all plain <a href>, no router.push overrides)
13. double check terms and privacy policy — ✅ DONE (all 3 legal pages exist + linked from footer)
14. make sure all faq are correct — ✅ DONE (8 FAQs verified, aria-controls + panel IDs added)
15. when the focus hover outside the contents just do animation little bit. indicate brand color on #7c3aed — ✅ DONE (feature cards: hover:shadow-md hover:-translate-y-0.5 transition-all duration-200; focus-visible:ring-primary on all interactive elements; hero section: cursor-following radial-gradient glow rgba(124,58,237,0.10) that covers margins on mousemove, fades on mouseleave)
16. seo usecase: 88/100 — ✅ DONE (full audit ran; 7 issues found and fixed; reach 92+ by creating og-image.png)
17. mention the enterprise custom gets included pro subscription benefits — ✅ DONE
18. Enterprise custom - contact us form with email and server details — ✅ DONE
19. Logged-in user sees only Create MCP, not Start Building Today section — ✅ DONE

----------------------------------------------
//gpt addon:

21. Modal has no role="dialog" or aria-modal="true" — ✅ DONE (both ProInterestModal and EnterpriseModal have role/aria-modal/aria-labelledby)
17. Footer <a> tags use onClick with router.push — ✅ DONE (converted to plain <a href>, no JS)
23. No <label> elements on ProInterestModal inputs — ✅ DONE (all inputs have id + htmlFor labels)
25. Organization logo URL https://flomcp.com/logo.png points to a file that doesn't exist — ✅ DONE (updated to /FloMCP-Logo.png which exists in /public/)
26. No 404 page (app/not-found.tsx) — ✅ DONE (app/not-found.tsx exists with Logo + nav)
27. sitemap.xml — ✅ DONE (expanded from 1 URL to 8: homepage, library, docs, signup, signin, 3 legal pages; robots.txt now non-empty with Disallow /api/ /dashboard/ /auth/ + Sitemap: reference)
28. server animation or hover pointer animation with landing page — ✅ DONE (hover:-translate-y-0.5 + shadow on all feature/security cards)

------------------------------------------------------------------------------------------------------------------------
