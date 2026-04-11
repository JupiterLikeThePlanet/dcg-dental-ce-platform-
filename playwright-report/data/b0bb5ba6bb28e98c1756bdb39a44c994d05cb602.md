# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submit-class.spec.ts >> Step 4: Details >> registration URL must start with http or https
- Location: tests/e2e/submit-class.spec.ts:187:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=URL must start with http')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=URL must start with http')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "DCG Dental CE" [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation [ref=e5]:
        - link "Browse Classes" [ref=e6] [cursor=pointer]:
          - /url: /classes
        - link "Submit Class" [ref=e7] [cursor=pointer]:
          - /url: /submit
        - generic [ref=e8]:
          - link "T testuser" [ref=e9] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e10]: T
            - generic [ref=e11]: testuser
          - button "Logout" [ref=e12] [cursor=pointer]
  - main [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]:
        - heading "Submit a CE Class" [level=1] [ref=e16]
        - paragraph [ref=e17]: List your dental continuing education course for just $5. Your submission will be reviewed and published within 24-48 hours.
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]:
            - generic [ref=e22]: ✓
            - generic [ref=e25]: ✓
            - generic [ref=e28]: ✓
            - generic [ref=e31]: "4"
          - generic [ref=e32]:
            - generic [ref=e33]: Basic Info
            - generic [ref=e34]: Date & Time
            - generic [ref=e35]: Location
            - generic [ref=e36]: Details
        - generic [ref=e38]:
          - heading "Course Details" [level=2] [ref=e39]
          - generic [ref=e40]:
            - generic [ref=e41]:
              - generic [ref=e42]: Instructor Name *
              - textbox "Instructor Name *" [ref=e43]:
                - /placeholder: Dr. Jane Smith
                - text: Dr. Smith
            - generic [ref=e44]:
              - generic [ref=e45]: Provider/Organization *
              - textbox "Provider/Organization *" [ref=e46]:
                - /placeholder: Louisiana Dental Association
                - text: Dental Academy
          - generic [ref=e47]:
            - generic [ref=e48]:
              - generic [ref=e49]: Contact Email (optional)
              - textbox "Contact Email (optional)" [ref=e50]:
                - /placeholder: contact@example.com
            - generic [ref=e51]:
              - generic [ref=e52]: Contact Phone (optional)
              - textbox "Contact Phone (optional)" [ref=e53]:
                - /placeholder: (555) 123-4567
          - generic [ref=e54]:
            - generic [ref=e55]:
              - generic [ref=e56]: Price ($) *
              - spinbutton "Price ($) *" [ref=e57]: "100"
            - generic [ref=e58]:
              - generic [ref=e59]: CE Credits (optional)
              - spinbutton "CE Credits (optional)" [ref=e60]
          - generic [ref=e61]:
            - generic [ref=e62]: Registration URL *
            - textbox "Registration URL *" [ref=e63]:
              - /placeholder: https://example.com/register
              - text: example.com
            - paragraph [ref=e64]: Where attendees will go to register for your class
          - generic [ref=e65]:
            - generic [ref=e66]: Image URL (optional)
            - textbox "Image URL (optional)" [ref=e67]:
              - /placeholder: https://example.com/image.jpg
            - paragraph [ref=e68]: Leave blank to use a default dental image
          - generic [ref=e69]:
            - generic [ref=e70]: Coupon Code (optional)
            - textbox "Coupon Code (optional)" [ref=e71]:
              - /placeholder: Enter coupon code if you have one
            - paragraph [ref=e72]: Have a coupon? Enter it to waive the $5 fee
        - generic [ref=e73]:
          - button "← Back" [ref=e74] [cursor=pointer]
          - button "Submit for Review" [ref=e75] [cursor=pointer]
        - paragraph [ref=e76]: "Submission fee: $5 (paid after review) • Questions? Contact support@dcgdental.com"
  - contentinfo [ref=e77]:
    - generic [ref=e78]:
      - paragraph [ref=e79]: © 2025 DCG Dental CE Platform. All rights reserved.
      - paragraph [ref=e80]: Built for the dental community.
  - alert [ref=e81]
```