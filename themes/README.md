# Ohana presentation themes

These are the existing Ohana presentation assets, exported without deployment configuration, private data or application backends.

| Theme | Editable files | Local preview |
| --- | --- | --- |
| Staff booking | `librebooking/interface.css`, `librebooking/interface.js` | `/previews/booking-admin.html` |
| EspoCRM | `crm/tokens.css`, `crm/ohana.css` | `/previews/crm.html`, `/previews/crm-login.html` |

`librebooking/interface.css` imports the shared public `/tokens.css` and references `/assets/…`. Start the repository's local preview server so these paths work.

The CRM CSS keeps its original directory structure: local fonts and images resolve relative to the CSS. Font licence files are beside the font files.

## Preview limitations

The preview HTML is a synthetic rendering fixture, **not LibreBooking or EspoCRM**. It contains only invented names, dates and records. Its small base stylesheet stands in for the native apps' layout styles, which are deliberately not redistributed here. No authentication, live calendars, customer data, API requests or save operations are included.

The booking preview uses representative FullCalendar-compatible class names without bundling FullCalendar. The real `interface.js` adapter is included for review but is **not executed** by the preview, because it expects a native authenticated LibreBooking page. The preview's local month/list switch and sample-details dialog are separate fixture code.

The CRM fixtures cover the login and a simple contacts workspace. They do not simulate native permissions, validation, two-factor authentication, record forms or all Espo screen layouts.

Edit the theme files for changes intended to return to the real applications. `previews/base.css` and the fixture HTML/JS are preview scaffolding; do not send their layout rules into production as a replacement for native app CSS. We will review and test any changes against the real applications before deployment.

## Return the work

Send a pull request or a commit link, together with desktop and mobile screenshots and a brief explanation of the changed theme files. Keep the work limited to presentation; do not add integrations, credentials or production URLs for data access.
