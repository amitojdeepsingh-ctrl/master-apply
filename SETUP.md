# Master Apply — Backend Setup Guide

## 1. Supabase (Document Storage)

1. Go to https://supabase.com → New Project → name: `master-apply`
2. Storage → New Bucket:
   - Name: `student-documents`
   - Public bucket: OFF
3. Storage → Policies → student-documents → New Policy → Custom:

```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'student-documents');
```

4. Settings → API → copy:
   - Project URL  →  paste into `js/upload.js` line 7  (`SUPABASE_URL`)
   - anon/public key  →  paste into `js/upload.js` line 8  (`SUPABASE_ANON_KEY`)


## 2. n8n Workflow

### Import
1. Open your n8n instance (cloud.n8n.io or self-hosted)
2. New Workflow → Import → select `n8n/master-apply-workflow.json`

### Configure credentials inside n8n:

#### Airtable
- Credentials → New → Airtable Personal Access Token
- Token: from https://airtable.com/account → API → Personal Access Token
- Name it: "Airtable — ADS Immigration"

#### Email (Resend SMTP)
- Credentials → New → SMTP
- Host: smtp.resend.com
- Port: 465 / SSL
- User: resend
- Password: your Resend API key (https://resend.com → API Keys)
- From email: noreply@adsimmigration.com  ← must be verified domain
- Name it: "Resend SMTP"

### Get your webhook URL
After importing the workflow:
1. Click "Webhook — Receive Application" node
2. Copy the Production URL — looks like:
   `https://your-n8n.app.n8n.cloud/webhook/master-apply-intake`
3. Paste it into `js/app.js` line 1:
   `const N8N_WEBHOOK_URL = 'https://...'`

### Activate
- Toggle the workflow to "Active" (top-right switch)


## 3. Airtable — Applications Table

Create a new table called **Applications** in your Airtable base with these fields:

| Field Name          | Type           |
|---------------------|----------------|
| Full Name           | Single line    |
| Email               | Email          |
| Phone               | Phone          |
| GPA                 | Number         |
| Test Type           | Single select  |
| IELTS Equivalent    | Number         |
| Nationality         | Single line    |
| Date of Birth       | Date           |
| Degree Level        | Single line    |
| Field of Study      | Single line    |
| Institution         | Single line    |
| Graduation Year     | Number         |
| Work Experience     | Single line    |
| Notes               | Long text      |
| Programs Selected   | Number         |
| Program List        | Long text      |
| Documents Submitted | Single line    |
| Document Links      | Long text      |
| Submitted At        | Date/time      |
| Status              | Single select  |  ← values: New, In Review, Applied, Rejected
| Source              | Single line    |

Then get your Base ID:
- Open Airtable → your base → click "Help" → API documentation
- The URL shows: `https://airtable.com/appXXXXXXX` → `appXXXXXXX` is your Base ID
- Add to n8n node or as n8n env var `AIRTABLE_BASE_ID`


## 4. programs.json

After running the scraper (cd to applyboard-scraper folder):
```
run.bat scrape --limit 500
```
Then copy the output:
```
copy C:\Users\amito\Downloads\applyboard-scraper\data\programs.json ^
     C:\Users\amito\Downloads\apply-portal\programs.json
```


## 5. Deploy to Cloudflare Pages

1. Go to https://dash.cloudflare.com → Pages → Create a project
2. Connect to Git → upload the `apply-portal` folder to a GitHub repo first:
   ```
   cd C:\Users\amito\Downloads\apply-portal
   git init
   git add .
   git commit -m "feat: initial Master Apply portal"
   git remote add origin https://github.com/YOUR_USERNAME/master-apply
   git push -u origin main
   ```
3. In Cloudflare Pages:
   - Connect GitHub repo `master-apply`
   - Build command: (leave blank — static site)
   - Build output directory: `/` (root)
   - Deploy!

4. Custom domain → add `apply.adsimmigration.com`
   - Cloudflare will give you a CNAME record
   - Go to DNS → add CNAME: `apply` → `master-apply.pages.dev`


## 6. Final Checklist Before Going Live

- [ ] `js/upload.js` — SUPABASE_URL and SUPABASE_ANON_KEY filled in
- [ ] `js/app.js` — N8N_WEBHOOK_URL filled in
- [ ] `programs.json` copied to portal root
- [ ] Supabase bucket created with upload policy
- [ ] n8n workflow imported, credentials connected, workflow ACTIVE
- [ ] Airtable Applications table created
- [ ] Cloudflare Pages deployed
- [ ] `apply.adsimmigration.com` DNS CNAME pointing to Pages
- [ ] Test: fill form → submit → check Airtable → check email inbox
