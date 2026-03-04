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
22. ProInterestModal doesn't trap focus — ⏳ PENDING (focus trap not yet implemented)
--------------------------------------------------------------

Product: 
1. Draft the generation templates. — ✅ DONE (generate page: left sidebar New/Drafts; Step5Review: Save as Draft button + hint; useDrafts hook localStorage CRUD; free plan 5 drafts; DraftCard load/delete; loadDraft action in generator store)
2. user can save the prompts. use the prompts in generation.library two tabs MCp and prompt. — ✅ DONE (useSavedPrompts hook; Step1Description: Library dropdown loads saved prompts + Save to Library inline form; Library page: two tabs MCP Library / Prompt Library with list, copy, delete, use buttons; free plan 5 prompts)
3. resource do we need library? like prompt — ✅ CONFIRMED NOT NEEDED (per-server resources work in generator Step4; a global resource library is not MVP; Prompt Library covers reusable templates; MCP Library covers official server references)
4. each generated mcp server we should generated config. that should be as raw json. it should be like accordion collapsed expanded after the connect to your ai client. this is for insight purpose and analysis. — ✅ DONE (server detail page: "Configuration JSON" accordion card after "Connect to your AI client"; collapsed by default; shows both claudeConfig + vscodeConfig as formatted JSON with per-section copy buttons)
4b. support ticket flow? received email response. how to update in product. admin flow?
5.in dashboard itself showing plan we should give upgrade button  near plan mentioned. DONE
6. IN dashboard credtits card, See just show with coming soon like Add more credits button. See 5/5 credits should show without add credits. DONE
7. generation engine should generate the readme file with mcp documentation about generated server.DONE
8. show the My mcp servers list with score tag like generated tag.
9. "Your generated server is private until you choose to share it. Each generation uses one credit from your plan." - remove the one credit just mention credit.
10. support all the dropdown list not show correctly text and background both is white color. please make it with theme style.
12. notification close should be available. see closebutton not clearly visible.
14. See submits ticket shows enable even with all subject and description please mention the error before the submit ticket button. 
15.Submit ticket should accept resources like screenshot and video. media files.
16. we should implement feedback system. See feedback should get after generated the server. 
17.Settings account profile display name should show all the dashboard and all place. 
18.Check all the documents in legal.
19. personal api key mention available for pro user. Just mention the crown in all the coming soon and pro sections.
20.All delete should show the server name to type and delete.
21.Check the entire all alert notifications.
22. support python language. 
23. Promode: not needed now
1. MCP assistent

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
