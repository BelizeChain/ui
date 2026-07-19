# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-staking.spec.ts >> Staking Page >> should display staking statistics
- Location: tests/e2e/02-staking.spec.ts:49:7

# Error details

```
Error: Channel closed
```

# Page snapshot

```yaml
- generic:
  - generic [ref=e1]:
    - img [ref=e3]
    - heading "Wallet Connection Required" [level=3] [ref=e6]
    - paragraph [ref=e7]: Connect your wallet to view staking information and earn PoUW rewards
    - button "Connect Wallet" [ref=e8] [cursor=pointer]:
      - img [ref=e9]
      - text: Connect Wallet
    - generic [ref=e13]:
      - paragraph [ref=e14]: Don't have a wallet?
      - link "Install Polkadot.js Extension" [ref=e15] [cursor=pointer]:
        - /url: https://polkadot.js.org/extension/
        - img [ref=e16]
        - text: Install Polkadot.js Extension
  - navigation [ref=e21]:
    - generic [ref=e24]:
      - link "Home" [ref=e25] [cursor=pointer]:
        - /url: /
        - img [ref=e27]
        - generic [ref=e30]: Home
      - link "Community" [ref=e31] [cursor=pointer]:
        - /url: /community
        - img [ref=e33]
        - generic [ref=e39]: Community
      - link "Trade" [ref=e40] [cursor=pointer]:
        - /url: /trade
        - img [ref=e42]
        - generic [ref=e45]: Trade
      - link "Messages" [ref=e46] [cursor=pointer]:
        - /url: /messages
        - img [ref=e48]
        - generic [ref=e51]: Messages
      - link "More" [ref=e52] [cursor=pointer]:
        - /url: /more
        - img [ref=e54]
        - generic [ref=e59]: More
  - generic [active]:
    - generic [ref=e62]:
      - generic [ref=e63]:
        - generic [ref=e64]:
          - navigation [ref=e65]:
            - button "previous" [disabled] [ref=e66]:
              - img "previous" [ref=e67]
            - generic [ref=e69]:
              - generic [ref=e70]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e71]:
              - img "next" [ref=e72]
          - img
        - generic [ref=e74]:
          - link "Next.js 16.2.6 (stale) Webpack" [ref=e75] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e76]
            - generic "There is a newer version (16.2.10) available, upgrade recommended!" [ref=e78]: Next.js 16.2.6 (stale)
            - generic [ref=e79]: Webpack
          - img
      - dialog "Build Error" [ref=e81]:
        - generic [ref=e84]:
          - generic [ref=e85]:
            - generic [ref=e86]:
              - generic [ref=e88]: Build Error
              - generic [ref=e89]:
                - button "Copy Error Info" [ref=e90] [cursor=pointer]:
                  - img [ref=e91]
                - button "No related documentation found" [disabled] [ref=e93]:
                  - img [ref=e94]
                - button "Attach Node.js inspector" [ref=e96] [cursor=pointer]:
                  - img [ref=e97]
            - generic [ref=e106]: "\"src/pages/community.tsx\" - \"src/app/community/page.tsx\""
          - generic [ref=e108]:
            - generic [ref=e110]:
              - img [ref=e112]
              - generic [ref=e114]: "Conflicting app and page file was found, please remove the conflicting files to continue:"
              - button "Open in editor" [ref=e115] [cursor=pointer]:
                - img [ref=e117]
            - generic [ref=e121]: "\"src/pages/community.tsx\" - \"src/app/community/page.tsx\""
        - generic [ref=e122]: "1"
        - generic [ref=e123]: "2"
    - generic [ref=e128] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e129]:
        - img [ref=e130]
      - button "Open issues overlay" [ref=e134]:
        - generic [ref=e135]:
          - generic [ref=e136]: "0"
          - generic [ref=e137]: "1"
        - generic [ref=e138]: Issue
  - alert [ref=e139]
```