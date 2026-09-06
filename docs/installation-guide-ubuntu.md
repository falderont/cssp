# Installation Guide — Running CSSP on an Ubuntu VM

This walks through getting the CSSP web app (`webapp/`) running from a
completely bare Ubuntu machine, assuming no prior development experience.
Every command below is meant to be copied and pasted exactly as written into
a terminal.

By the end, you'll have the full portal running at `http://localhost:3000`
with a realistic seeded demo — multiple regions, data center facilities,
tenant companies, and every module (visitors, incidents, maintenance,
tickets, remote hands, telemetry, documents, billing, CS performance) full of
sample data, ready to click through or demo to a customer.

Estimated time: 15–20 minutes.

## 0. What you need before starting

- An Ubuntu VM (22.04 LTS or newer works well) that you can open a terminal
  in, with internet access.
- Nothing else. You do **not** need to already have Node.js, a database, or
  any prior programming tools installed — this guide installs everything.

## 1. Open a terminal

On Ubuntu's desktop: click the "Show Applications" grid icon (bottom-left of
the dock) and search for **Terminal**, or press `Ctrl+Alt+T`.

Every command in this guide is run in that terminal window, one at a time,
pressing Enter after each one.

## 2. Update Ubuntu's package list

```bash
sudo apt update
```

This will ask for your password (the one you use to log into the VM) — type
it and press Enter. Nothing will appear on screen as you type the password;
that's normal, just type it and hit Enter.

## 3. Install Node.js

CSSP needs Node.js version 20 or newer. Ubuntu's own default `apt` package is
usually too old, so install it from NodeSource instead:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Check it worked:

```bash
node -v
npm -v
```

You should see something like `v20.x.x` and `10.x.x`. If you see `command
not found` instead, re-run the two commands above — a common cause is a
network hiccup during the first `curl` command.

## 4. Install Git (used to download the project)

```bash
sudo apt install -y git
```

## 5. Get the project onto your machine

If you were given a GitHub link to this repository, clone it (replace the
URL with the actual one you were given):

```bash
git clone <the repository URL you were given>
cd cssp
git checkout claude/colocation-self-service-portal-ft4b9e
```

If instead you received the project as a `.zip` file, right-click it in the
Files app and choose **Extract Here**, then in the terminal `cd` into the
extracted folder (for example `cd ~/Downloads/cssp`).

Either way, move into the web app folder — this is where all the commands
below are run from:

```bash
cd webapp
```

(Check you're in the right place: `pwd` should print a path ending in
`.../cssp/webapp`, and `ls` should list `package.json`, `prisma`, `src`, and
so on.)

## 6. Install the app's dependencies

```bash
npm install
```

This downloads everything the app needs (Next.js, the database toolkit,
etc.) into a `node_modules` folder. It takes a minute or two and prints a lot
of text — that's expected. A few "deprecated" warnings are normal and safe
to ignore.

## 7. Set up the configuration file

```bash
cp .env.example .env
```

The defaults in `.env` work as-is for local use — no editing required. (If
you're curious what's in there: it points the app at a local SQLite database
file and sets a login-session secret. See `webapp/README.md` for details if
you ever need to change it.)

## 8. Create the database

```bash
npx prisma migrate dev
```

The first time this runs it may ask "Enter a name for the new migration" —
just press Enter to accept the default. This creates a file
`prisma/dev.db` — that file *is* your database. Nothing else to install; no
separate database server needed.

## 9. Load the demo data

```bash
npm run seed
```

This wipes and fills the database with a realistic demo: 4 data center
facilities across 2 regions, 4 tenant companies, ~15 users across every
role, and populated visitors, incidents, maintenance windows, tickets,
remote-hands requests, telemetry charts, documents, and invoices. It prints
a list of demo login emails at the end — you'll use those in a moment.

You can re-run this command at any time to reset back to a clean demo state
(useful after you've clicked around and created test records).

## 10. Start the app

```bash
npm run dev
```

Leave this running — the terminal will show `Ready` and the app is now live.
**Don't close this terminal window** while you want the app to keep running;
closing it (or pressing `Ctrl+C`) stops the server.

## 11. Open it in your browser

If you're using the VM's own desktop (i.e., the browser is running inside
the same Ubuntu VM), open:

```
http://localhost:3000
```

You'll land on the login screen. It lists demo accounts you can click to
autofill — e.g. **Provider — Super Admin** to see the internal console, or
**Tenant — Global Admin (Meridian Logistics)** to see the customer-facing
portal. Every account's password is `password123`.

### If your browser is on a different machine than the VM

This is common if the Ubuntu VM is headless or you're using VirtualBox/VMware
with the VM's own window closed. Two options:

1. **Port forwarding** (recommended) — in your VM software's network
   settings, forward host port `3000` to guest port `3000`, then browse to
   `http://localhost:3000` on your actual machine.
2. **Bind to all network interfaces** — stop the dev server (`Ctrl+C`) and
   restart it with:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
   Then find the VM's IP address with `hostname -I`, and browse to
   `http://<that-ip>:3000` from your host machine (both machines need to be
   on the same network, and this is for local development only — never
   expose this dev server directly to the public internet).

## 12. Stopping and restarting later

- To stop: go to the terminal running `npm run dev` and press `Ctrl+C`.
- To start again later: `cd` back into the `webapp` folder and run
  `npm run dev` again. Your data persists between restarts (it's all in
  `prisma/dev.db`) — no need to re-run install/migrate/seed unless you want
  to reset the demo data.

## Troubleshooting

**"Port 3000 is already in use"** — either another copy of the app is
already running (check other terminal windows), or something else is using
that port. Find and stop it:
```bash
sudo fuser -k 3000/tcp
```
then run `npm run dev` again.

**`npm install` fails with permission errors** — don't use `sudo npm
install`. If you see `EACCES` errors, it usually means Node.js was installed
incorrectly; re-do Step 3 exactly as written (the NodeSource method avoids
this issue, unlike some other installation methods).

**`npx prisma migrate dev` complains the database is out of sync / asks to
reset** — this happens if you've deleted or corrupted `prisma/dev.db`. Fix
it with:
```bash
npx prisma migrate reset --force
npm run seed
```
(This deletes and fully recreates the database — fine to do any time in a
demo/dev environment.)

**The page loads but looks unstyled / broken** — usually means `npm install`
didn't finish successfully. Re-run it and watch for red error text near the
end.

**I want a completely fresh demo** — run `npm run seed` again at any time.

## What's next

- `webapp/README.md` — the technical reference: architecture, environment
  variables, and what to change before using this beyond a demo (swapping
  the database, file storage, real integrations, etc.).
- The main repo `README.md` and `docs/` — product background (the PRDs this
  build implements) and the earlier UI mockups/prototype.
