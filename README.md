# Airegister (Front End) Application 

## Quick start
### Prerequisites
- node version >= 8.15.1
- npm version >= 5
- a server to pull from
  

### Steps
Install all the dependencies.

`npm install --legacy-peer-deps`

Create an environment file at the root of the project that will contain sensative info.

`touch process.env`

The file must have these properties. These are specific to the Auth0 Identity provider that you have to setup.

```
clientId=SOMELONGFAKECLIENTID
domain=somedomain.eu.auth0.com
audience=https://somedomain/registration
```
These properties are then used in an auth config file `app/auth_config.js` during run-time to establish a connection with the Auth0 Indentity Service.

Start the server.

`npm start`

Open a browser to http://localhost:3000

## RID Module Activation

The application now uses **Web Serial API** for direct browser-to-device communication. No separate Python service is required.

### Requirements
- Chrome 89+ or Edge 89+ browser
- HTTPS connection (or `http://localhost` for development)
- ESP32 module connected via USB

### Usage
1. Navigate to `/load` page
2. Click "Request Port" to select your USB device
3. Select operator and aircraft
4. Click "Activate This Module"

See `WEBSERIAL_MIGRATION_COMPLETE.md` for detailed documentation.