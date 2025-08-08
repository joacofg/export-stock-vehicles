## Export Stock Vehicles (Playwright)

A small automation that signs in to `web.onepilot.app`, navigates to Vehicles, opens the correct actions menu, and downloads the exported `.xlsx` file to a local `downloads/` folder.

### What you need
- Node.js 18+ and pnpm
- Internet access to `web.onepilot.app`
- A valid OnePilot user (email + password)

### Install
```bash
pnpm install
```

### Configure credentials
Provide your OnePilot login as environment variables. You can either export them in your shell:
```bash
export ONEPILOT_EMAIL="you@example.com"
export ONEPILOT_PASSWORD="your_password"
```

Or create a `.env` file in the project root (not committed):
```env
ONEPILOT_EMAIL=you@example.com
ONEPILOT_PASSWORD=your_password
```

### Run the export
- Interactive (headed) run:
```bash
pnpm run export:vehicles
```

- Headless (CI/automation), or add it to the `.env`:
```bash
HEADLESS=1 pnpm run export:vehicles
```

### Output
- Files are saved to `downloads/` with a timestamped name, for example:
  - `downloads/stock-vehicles-20250101-123045.xlsx`

### Notes
- The script always navigates to the login page and signs in using the provided credentials.
- It then opens the Vehicles actions menu (next to “Adicionar veículo”), chooses “Exportar”, and saves the download.

### Troubleshooting
- Login fails: verify `ONEPILOT_EMAIL` and `ONEPILOT_PASSWORD` and that the account can access Vehicles.
- No file downloaded / timeout: UI labels may have changed. Re-run in headed mode to observe the clicks: `pnpm run export:vehicles`.
- Corporate networks or strict ad-blockers may interfere with automation—try another network or disable blocking.

### Support
If you need help running this script, contact your OnePilot partner manager.


