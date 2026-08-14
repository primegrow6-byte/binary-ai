# Binary AI — Vercel-ready

এই version-এ Node server আলাদা করে চালাতে হবে না। Vercel-এর serverless function `/api/analyze` browser request গ্রহণ করে OpenAI API-তে পাঠায়।

## Deploy
1. এই folder GitHub repository-তে upload করুন।
2. Vercel-এ repository import করুন।
3. Project Settings → Environment Variables-এ `OPENAI_API_KEY` যোগ করুন।
4. Deploy করুন।
5. আপনার Vercel URL মোবাইল থেকে খুলুন।

API key কখনো frontend code-এ রাখবেন না।

## Note
`Failed to fetch` এড়াতে frontend এখন `/api/analyze`-এর একই deployed domain-এ request করে। AI result guaranteed trading signal নয়।
