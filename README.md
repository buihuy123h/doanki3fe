# Nexus Service Marketing System

A responsive, dependency-free HTML/CSS/JavaScript prototype with five connected workspaces: Customer, Admin / Manager, Retail Outlet Employee, Technical Staff, and Accounts Department.

## Run locally

Open `index.html` directly, or serve the folder with any static server:

```powershell
npx serve .
```

No build step is required. Google Fonts load from the network and fall back to system fonts when offline.

## Demo access

Enter any non-empty username and password, then select a role. Once signed in, use the **View as** selector in the top bar to review every workspace without logging out.

- Example Order ID: `D0000000001`
- Example Account ID: `4851029384756102`

## Included flows

- **Customer:** account overview, new service requests, order progress, connection health, bills and payments, profile updates, and support requests.
- **Admin:** management overview, employee and vendor add/edit/delete dialogs, stock ledger, retail shops, and plan charges.
- **Retail:** fast customer order entry, 11-character Order ID tracking, 16-digit Account ID connection lookup, and payment records.
- **Technical:** feasibility queue status updates, account connection-state controls, and modem/router assignment.
- **Accounts:** bill generation with automated 12.24% service tax, payment updates, and charge settings.

The Customer role uses the demo profile for Maya Chen, Account ID `4851029384756102`, so its orders, connection, equipment, and billing records remain linked to the internal workspaces.

All data is held in memory and resets when the page reloads. Production authentication, payments, downloads, support delivery, and persistence should be connected to secure backend services.
