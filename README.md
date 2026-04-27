# RES EX MACHINA

A show of things I make.

This is a lightweight public website built with Vite, TypeScript, plain CSS, Firebase Hosting, and Firebase Storage. It does not use Flutter, React, authentication, a service worker, or an upload/admin UI.

## Routes

- `/` - main cabinet index
- `/meows` - fullscreen Romeo photo viewer
- `/excorium` - quiet placeholder
- `/unexposd` - quiet placeholder
- `/vitrify` - quiet placeholder

Firebase Hosting rewrites all routes to `index.html`.

## Firebase setup

Create a new Firebase project, then enable Hosting and Storage. Upload Romeo images manually to Firebase Storage under:

```txt
cats/
```

The public viewer lists that folder with the Firebase JS SDK and shows files ending in `.jpg`, `.jpeg`, `.png`, or `.webp`.

Create a local `.env.local` file with:

```txt
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

## Deploy

Select the new Firebase project locally if needed:

```sh
firebase use --add
```

Deploy Hosting:

```sh
firebase deploy --only hosting
```

Deploy Storage rules when ready:

```sh
firebase deploy --only storage
```

The intended custom domain is `resfactae.xyz`, with `romeo.resfactae.xyz` opening the MEOWS viewer. Connect both in Firebase Hosting after the project is deployed.
