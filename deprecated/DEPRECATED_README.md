# Deprecated Files

This directory contains deprecated files that are no longer used in the application.

## discovery_service.py

**Status:** Deprecated (replaced by Web Serial API)

**Reason:** The Python Flask discovery service has been replaced with browser-native Web Serial API implementation. The frontend now communicates directly with ESP32 modules via USB serial ports.

**Migration Date:** 2024

**Replacement:** 
- `app/utils/serialApi.js` - Serial API detection
- `app/utils/Serial.js` - Serial port wrapper
- `app/utils/QueueProcessor.js` - Command queue system

**Note:** This file is kept for reference only. It is no longer needed for the application to function.

