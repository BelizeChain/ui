# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-home.spec.ts >> Home Page >> should handle page refresh
- Location: tests/e2e/01-home.spec.ts:69:7

# Error details

```
Error: Channel closed
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - img [ref=e6]
    - heading "Welcome to Maya" [level=2] [ref=e9]
    - paragraph [ref=e10]: Connect your wallet to access your BelizeChain assets
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - heading "Maya shell readiness" [level=2] [ref=e14]
          - paragraph [ref=e15]: Use this panel to confirm the wallet shell is pointed at the intended BelizeChain environment before building deeper flows.
        - generic [ref=e16]:
          - paragraph [ref=e17]: Checks
          - paragraph [ref=e18]: "4"
      - generic [ref=e19]:
        - article [ref=e20]:
          - generic [ref=e21]:
            - generic [ref=e22]: Network
            - img
          - paragraph [ref=e25]: Local Development
          - paragraph [ref=e26]: Waiting on local websocket ws://127.0.0.1:9944
          - paragraph [ref=e27]: Attention
        - article [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]: Wallet
            - img [ref=e31]
          - paragraph [ref=e34]: Wallet required
          - paragraph [ref=e35]: Connect a Polkadot extension account to unlock transactions
          - paragraph [ref=e36]: Pending
        - article [ref=e37]:
          - generic [ref=e38]:
            - generic [ref=e39]: Service Routes
            - img
          - paragraph [ref=e42]: 0/3 routes reachable
          - paragraph [ref=e43]: Pakit offline · Nawal offline · Kinich offline
          - paragraph [ref=e44]: Attention
        - article [ref=e45]:
          - generic [ref=e46]:
            - generic [ref=e47]: IPFS Gateway
            - img
          - paragraph [ref=e50]: http://127.0.0.1:8082/ipfs
          - paragraph [ref=e51]: Local gateway fallback is configured for development only
          - paragraph [ref=e52]: Attention
    - button "Connect Wallet" [ref=e53] [cursor=pointer]
  - navigation [ref=e54]:
    - generic [ref=e57]:
      - link "Home" [ref=e58] [cursor=pointer]:
        - /url: /
        - img [ref=e60]
        - generic [ref=e63]: Home
      - link "Community" [ref=e64] [cursor=pointer]:
        - /url: /community
        - img [ref=e66]
        - generic [ref=e72]: Community
      - link "Trade" [ref=e73] [cursor=pointer]:
        - /url: /trade
        - img [ref=e75]
        - generic [ref=e78]: Trade
      - link "Messages" [ref=e79] [cursor=pointer]:
        - /url: /messages
        - img [ref=e81]
        - generic [ref=e84]: Messages
      - link "More" [ref=e85] [cursor=pointer]:
        - /url: /more
        - img [ref=e87]
        - generic [ref=e92]: More
  - generic [active]:
    - generic [ref=e95]:
      - generic [ref=e96]:
        - generic [ref=e97]:
          - navigation [ref=e98]:
            - button "previous" [disabled] [ref=e99]:
              - img "previous" [ref=e100]
            - generic [ref=e102]:
              - generic [ref=e103]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e104]:
              - img "next" [ref=e105]
          - img
        - generic [ref=e107]:
          - link "Next.js 16.2.6 (stale) Webpack" [ref=e108] [cursor=pointer]:
            - /url: https://nextjs.org/docs/messages/version-staleness
            - img [ref=e109]
            - generic "There is a newer version (16.2.10) available, upgrade recommended!" [ref=e111]: Next.js 16.2.6 (stale)
            - generic [ref=e112]: Webpack
          - img
      - dialog "Build Error" [ref=e114]:
        - generic [ref=e117]:
          - generic [ref=e118]:
            - generic [ref=e119]:
              - generic [ref=e121]: Build Error
              - generic [ref=e122]:
                - button "Copy Error Info" [ref=e123] [cursor=pointer]:
                  - img [ref=e124]
                - button "No related documentation found" [disabled] [ref=e126]:
                  - img [ref=e127]
                - button "Attach Node.js inspector" [ref=e129] [cursor=pointer]:
                  - img [ref=e130]
            - generic [ref=e139]: "\"src/pages/community.tsx\" - \"src/app/community/page.tsx\""
          - generic [ref=e141]:
            - generic [ref=e143]:
              - img [ref=e145]
              - generic [ref=e147]: "Conflicting app and page file was found, please remove the conflicting files to continue:"
              - button "Open in editor" [ref=e148] [cursor=pointer]:
                - img [ref=e150]
            - generic [ref=e154]: "\"src/pages/community.tsx\" - \"src/app/community/page.tsx\""
        - generic [ref=e155]: "1"
        - generic [ref=e156]: "2"
    - generic [ref=e161] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e162]:
        - img [ref=e163]
      - button "Open issues overlay" [ref=e167]:
        - generic [ref=e168]:
          - generic [ref=e169]: "0"
          - generic [ref=e170]: "1"
        - generic [ref=e171]: Issue
  - alert [ref=e172]
```