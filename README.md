# Birthday Club

Next.js App Router application for birthday club signup, secure family
management links, administrator management, and Mailchimp Customer Journey
triggers.

## Development

```bash
npm run dev
```

Open http://localhost:3000.

## Environment Variables

```bash
DATABASE_URL=
AUTH_SECRET=
AUTH_URL=https://birthdayclub.example.com
APP_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
MAILCHIMP_API_KEY=
MAILCHIMP_SERVER_PREFIX=us10
CRON_SECRET=
```

Create the first admin password hash:

```bash
npm run admin:hash-password -- "replace-with-a-strong-password"
```

Use the escaped `.env` value printed by the script when writing to a local
Next.js `.env` file. Bcrypt hashes contain `$`, and Next.js expands `$...` in
`.env` files unless the dollar signs are escaped. In hosting dashboards, use the
raw hash as the `ADMIN_PASSWORD_HASH` value. `AUTH_SECRET` is required by Auth.js
for secure admin session cookies. Set `AUTH_URL` to the public production origin;
`APP_URL` is used for application-generated links and is not read by Auth.js.

## Database

This project uses Prisma 7 with PostgreSQL.

```bash
npm run prisma:generate
npm run prisma:migrate
```

The initial migration creates parents, children, birthday send history,
settings, and rate-limit buckets. Parent email is normalized and unique. Send
records are unique by child, send type, and occurrence year.

## Mailchimp

Configure these in `/admin/birthday-club/settings`:

- Signup email Customer Journey trigger URL
- Birthday-month Customer Journey trigger URL
- Birthday-day Customer Journey trigger URL
- Optional Mailchimp audience/list ID
- Birthday-month send day
- Application timezone
- Consent disclosure text
- Automated sends enabled/disabled

The Mailchimp API key is stored only in `MAILCHIMP_API_KEY`, never in
`AppSetting`. Trigger URLs must be HTTPS and must target the configured
`{MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com` Customer Journey trigger path.

If an audience ID is configured, signup ensures the parent exists as a
subscribed audience member. Existing `unsubscribed`, `cleaned`, and `pending`
contacts are not silently resubscribed.

Test triggers require typing `TEST` and send to `ADMIN_EMAIL`.

## Daily Cron

Schedule a daily `POST` to:

```text
/api/cron/birthdays
```

Send the secret as a bearer token:

```text
Authorization: Bearer <CRON_SECRET>
```

Do not send `CRON_SECRET` in the query string.

## Duplicate Protection

Cron claims send records before calling Mailchimp. The database unique
constraint on `(childId, type, occurrenceYear)` prevents duplicate records under
repeated or concurrent cron invocations.

Birthday-month emails are grouped so one parent receives one identical monthly
email for children in the same birthday month. Birthday-day emails are grouped
the same way when siblings share the same birthday. Additional child records are
marked `SKIPPED` where needed to prevent later duplicate triggers.

Manual retries are available for failed sends. Retrying after an ambiguous
network timeout can duplicate the external Mailchimp trigger because the
Customer Journey endpoint does not provide an idempotency key here.

## Parent Management Links

Family management lives at `/family/[token]`. Tokens use at least 32 random
bytes encoded URL-safe. Only the SHA-256 hash is stored. Admins can generate a
fresh link from a parent detail page; the raw link is shown once and the
previous link is invalidated.

## February 29 Policy

February 29 birthday-day emails are sent on February 28 in non-leap years. In
leap years, they are sent on February 29.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

No formatter is currently configured in this project.
