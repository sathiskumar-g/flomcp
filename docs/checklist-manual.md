Landing page:
1. demo video
2. demo code view
3. seo perfect
4. logo for flomcp - DONE
5. Add all form with proper email admin with flomcp domain mail
6. make sure all forms submitted without error and make sure validations and security fixes.
7. All the landing page should be accessible using tabkey and enter/space key. So provide proper aria-label and role for all the buttons and forms and input and interactive sections. 
8. proper order html order with heading and others.
9. see we have code so make sure not affeting aything and fully safe as string.
10. chrome fi icon and title.
11. mention with pro like using emoji in landing page wherever we mention coming soon. just have emoji like crown on the content mention as pro.
12. Make sure foooter are corectly a and need any more links. 
13. double check and terms and privacy policy. 
14.make sure all faq are correct
15. when the focus hover outside the contents just do animation little bit.
16. seo usecase: 82/100.

Remaining 8 points to hit 90/100:
Create /public/og-image.png (1200×630) — 30 min in Figma/Canva
Split "use client" off the hero into a server component — 2 hrs
Add a live "X servers generated" counter pulled from the DB

17. mention the enterprise custom gets included pro subsctiption benefits.DONE
18. See enterprise custom - contact us should be get the emailand server. Same like get early access with pro. DONE
19. See when the logined user sign in and see the landing page that time we dont need to show the start building today section with create free account and sign. Show only Create MCP for loggedinuser. DONE
 
----------------------------------------------
GPT Addon:

17. Footer <a> tags use onClick with router.push — these are plain <a href> links, no JS needed. Breaks right-click → open in new tab, hurts SEO crawling

18.No og-image.png in public/ — OG card will be blank on Twitter/Slack/LinkedIn shares

19.No apple-touch-icon.png — iOS home screen will show blank

20."use client" on entire page.tsx — whole page is client-rendered, hurts LCP / Core Web Vitals

21.Modal has no role="dialog" or aria-modal="true" — screen readers won't announce it correctly

22.ProInterestModal doesn't trap focus — Tab key escapes the modal while it's open

23.No <label> elements on ProInterestModal inputs — only placeholders, which disappear when typing

24.verification: { google: "your-google-verification-code" } in layout.tsx — placeholder text still in production metadata

25.aggregateRating fake data removed but Organization logo URL https://flomcp.com/logo.png points to a file that doesn't exist

26.No 404 page (app/not-found.tsx) — Next.js shows default blank error

27. No sitemap.xml auto-generation — current sitemap.xml is static, won't update as pages are added

28. server animation or hover pointer animatio with landing page.

------------------------------------------------------------------------------------------------------------------------

Product: 
1. Draft the generation templates.
2. user can save the prompts. use the prompts in generation.library two tabs MCp and prompt. 
3. resource do we need library? like prompt
4. support ticket flow? received email response. how to update in product. admin flow?
5.in dashboard itself showing plan we should give upgrade button  near plan mentioned. 
6. IN dashboard credtits card, See just show with coming soon like Add more credits button. See 5/5 credits should show without add credits. 
7. generation engine should generate the readme file with mcp documentation about generated server.
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