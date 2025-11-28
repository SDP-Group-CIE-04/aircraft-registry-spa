# Web Serial API Implementation Guide

This document provides detailed code examples from the ESC Configurator codebase to help you implement Web Serial port discovery and connection in your own application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [API Detection & Loading](#api-detection--loading)
3. [Port Discovery](#port-discovery)
4. [Port Selection & Permission](#port-selection--permission)
5. [Opening & Closing Ports](#opening--closing-ports)
6. [Reading & Writing Data](#reading--writing-data)
7. [Command Queue System](#command-queue-system)
8. [Event Handling](#event-handling)
9. [Complete Example](#complete-example)

---

## Prerequisites

### Browser Support
- **Chrome/Edge 89+**: Native Web Serial API support
- **Firefox**: Not supported (as of 2024)
- **Safari**: Not supported (as of 2024)
- **Android Chrome**: Requires Web USB polyfill (see below)

### HTTPS Requirement
The Web Serial API only works over:
- `https://` connections
- `http://localhost` (for development)

### Dependencies
```json
{
  "dependencies": {
    "web-serial-polyfill": "^2.0.0"
  }
}
```

---

## API Detection & Loading

### Step 1: Check for Web Serial API Support

**File: `src/utils/LocalStorage.js`**

```javascript
import { serial as serialPolyfill } from 'web-serial-polyfill';

/**
 * Checks browser and returns preferred serial API.
 *
 * @returns {Serial} The serial API object or null if not supported
 */
function loadSerialApi() {
  // Check for native Web Serial API (Chrome/Edge 89+)
  if('serial' in navigator) {
    return navigator.serial;
  }

  // Fallback: Use Web USB polyfill for browsers with USB support
  // Note: Brave has USB support but doesn't work properly with the polyfill
  if(
    'usb' in navigator &&
    !('brave' in navigator)
  ) {
    return serialPolyfill;
  }

  // No serial support available
  return null;
}

export { loadSerialApi };
```

### Usage in Your App

```javascript
// Initialize serial API
const serialApi = loadSerialApi();

if (!serialApi) {
  console.error('Web Serial API not supported in this browser');
  // Show compatibility warning to user
}
```

---

## Port Discovery

### Step 2: Get Previously Authorized Ports

**File: `src/Containers/App/index.jsx`**

```javascript
serialConnectHandler = async() => {
  this.serial = undefined;
  let connected = false;

  // Get list of ports that were previously authorized by the user
  const ports = await this.serialApi.getPorts();
  
  if(ports.length > 0) {
    console.log('Found previously authorized ports:', ports.length);
    connected = true;

    // Use the first available port
    this.serial = new Serial(ports[0]);
  }

  // Extract port information for display
  const portNames = ports.map((item) => {
    const info = item.getInfo();
    // Format: "vendorId:productId"
    const name = `${info.usbVendorId}:${info.usbProductId}`;
    return name;
  });

  // Update application state
  store.dispatch(setChecked(true));
  store.dispatch(setHasSerial(true));
  store.dispatch(setConnected(connected));
  store.dispatch(setPortNames(portNames));
};
```

### Port Information Structure

Each port object has a `getInfo()` method that returns:
```javascript
{
  usbVendorId: 1234,      // USB vendor ID
  usbProductId: 5678,      // USB product ID
  // Note: Port name/description not always available
}
```

---

## Port Selection & Permission

### Step 3: Request Port Permission (User Action Required)

**File: `src/Containers/App/index.jsx`**

```javascript
handleSetPort = async() => {
  try {
    // This MUST be called from a user gesture (button click, etc.)
    // Browser will show a port selection dialog
    const port = await this.serialApi.requestPort();
    
    // Create Serial wrapper for the selected port
    this.serial = new Serial(port);

    console.log('Port selected by user');

    // Extract port info for display
    const portNames = [port].map((item) => {
      const info = item.getInfo();
      const name = `${info.usbVendorId}:${info.usbProductId}`;
      return name;
    });

    // Update state
    store.dispatch(setConnected(true));
    store.dispatch(setPortNames(portNames));
  } catch (e) {
    // User cancelled the port selection dialog
    if (e.name === 'NotFoundError') {
      console.log('No port selected');
    } else {
      console.error('Error requesting port:', e);
    }
  }
};
```

### Optional: Filter Ports by USB IDs

```javascript
// Request only specific USB devices
const port = await this.serialApi.requestPort({
  filters: [
    { usbVendorId: 0x1234, usbProductId: 0x5678 },
    { usbVendorId: 0xABCD }
  ]
});
```

### Step 4: Change Between Multiple Ports

```javascript
handleChangePort = async(index) => {
  // Get all available authorized ports
  const availablePorts = await this.serialApi.getPorts();
  
  // Switch to the selected port
  this.serial = new Serial(availablePorts[index]);

  console.log('Port changed to index:', index);
};
```

---

## Opening & Closing Ports

### Step 5: Open Port Connection

**File: `src/utils/Serial.js`**

```javascript
class Serial {
  constructor(port) {
    this.port = port;
    this.baudRate = 115200;
    this.writer = null;
    this.reader = null;
    this.running = false;
  }

  /**
   * Open connection to the serial port
   * 
   * @param {number} baudRate - Communication speed (default: 115200)
   */
  async open(baudRate = 115200) {
    this.baudRate = baudRate;

    try {
      // Open the port with specified baud rate
      await this.port.open({ baudRate });
      
      // Get writer for sending data
      this.writer = await this.port.writable.getWriter();
      
      // Get reader for receiving data
      this.reader = await this.port.readable.getReader();
    } catch(e) {
      console.error('Could not open serial port:', e);
      throw new Error('Could not open serial port');
    }

    // Start reading data in the background
    this.running = true;
    this.startReader();
  }
}
```

### Step 6: Close Port Connection

**File: `src/utils/Serial.js`**

```javascript
/**
 * Cleanly close the serial connection
 */
async close() {
  this.running = false;

  // Cancel and release the reader
  if(this.reader) {
    this.reader.cancel();
    await this.reader.releaseLock();
    this.reader = null;
  }

  // Release the writer
  if(this.writer) {
    await this.writer.releaseLock();
    this.writer = null;
  }

  // Close the port
  try {
    await this.port.close();
  } catch(e) {
    console.error('Error closing port:', e);
  }
}

/**
 * Disconnect without full cleanup (for quick disconnects)
 */
async disconnect() {
  this.running = false;
  this.reader = null;
  this.writer = null;
}
```

### Usage Example

**File: `src/Containers/App/index.jsx`**

```javascript
handleConnect = async(e) => {
  e.preventDefault();

  const serial = store.getState().serial;
  
  try {
    // Open port with user-selected baud rate
    await this.serial.open(serial.baudRate);
    this.addLogMessage('portOpened');
    
    // Connection successful
    store.dispatch(setOpen(true));
  } catch (e) {
    console.error('Connection failed:', e);

    // Clean up on error
    try {
      await this.serial.close();
    } catch(closeError) {
      console.error('Error during cleanup:', closeError);
    }

    this.addLogMessage('portUsed'); // Port might be in use
    return;
  }
};

handleDisconnect = async(e) => {
  e.preventDefault();

  if(this.serial) {
    // Cleanly close the connection
    await this.serial.close();
  }

  store.dispatch(setOpen(false));
  this.addLogMessage('closedPort');
};
```

---

## Reading & Writing Data

### Step 7: Write Data to Port

**File: `src/utils/Serial.js`**

```javascript
/**
 * Write a buffer to the serial port
 * 
 * @param {ArrayBuffer|Uint8Array} buffer - Data to send
 */
async writeBuffer(buffer) {
  if(this.writer) {
    // Convert to Uint8Array if needed
    const data = buffer instanceof Uint8Array 
      ? buffer 
      : new Uint8Array(buffer);
    
    // Write data
    await this.writer.write(data);
    
    // Track bytes sent (optional)
    this.sent += data.byteLength;
  } else {
    throw new Error('Port not open - writer not available');
  }
}
```

### Step 8: Read Data from Port

**File: `src/utils/Serial.js`**

```javascript
/**
 * Start reading data from the port in a background loop
 */
async startReader() {
  while(this.running) {
    try {
      // Read data (this blocks until data is available)
      const { value, done } = await this.reader.read();

      if(done) {
        // Reader was cancelled
        console.log('Reader done');
        return;
      }

      if(value) {
        // Process incoming data
        // value is a Uint8Array
        this.received += value.byteLength;
        this.handleIncomingData(value);
      }
    } catch(e) {
      console.error('Reader failed:', e);
      return;
    }
  }
}

/**
 * Handle incoming data (implement your protocol here)
 */
handleIncomingData(data) {
  // Example: Add to queue processor
  this.qp.addData(data);
  
  // Or process directly:
  // console.log('Received:', Array.from(data));
}
```

### Example: Send Command and Wait for Response

```javascript
// Send command
const command = new Uint8Array([0x01, 0x02, 0x03]);
await this.serial.writeBuffer(command);

// Response will be handled by the reader loop
// Use the queue system (see below) for request/response patterns
```

---

## Command Queue System

### Step 9: Implement Command Queue (Prevents Race Conditions)

**File: `src/utils/helpers/QueueProcessor.js`**

```javascript
class QueueProcessor {
  constructor() {
    this.buffer = new Uint8Array([]);
    this.commands = [];
    this.newData = false;
    this.processing = false;
    this.currentCommand = null;
  }

  /**
   * Append new incoming data to the buffer
   */
  addData(buffer) {
    this.buffer = this.appendBuffer(this.buffer, buffer.buffer);
    this.newData = true;
    this.processCommands();
  }

  /**
   * Add a command to the queue
   * 
   * @param {function} transmit - Function that sends data
   * @param {function} receive - Function that processes response
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Resolves when command completes
   */
  addCommand(transmit, receive = null, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const newCommand = {
        transmit,
        receive,
        timeout,
        resolveCallback: (result) => resolve(result),
        rejectCallback: (error) => reject(error),
      };

      this.commands.push(newCommand);
      this.processCommands();
    });
  }

  /**
   * Process commands in FIFO order
   */
  async processCommands() {
    // Start next command if none is running
    if(!this.currentCommand && this.commands.length > 0) {
      await this.startCommand();
    }

    // Process current command if data is available
    if(this.currentCommand && this.currentCommand.receive) {
      await this.processCommand();
    }
  }

  /**
   * Start executing a command
   */
  async startCommand() {
    this.currentCommand = this.commands.shift();
    const timeout = this.currentCommand.timeout;
    
    // Send the command
    await this.currentCommand.transmit();

    // Set timeout
    if(this.currentCommand.receive) {
      this.currentCommand.timeoutFunct = setTimeout(() => {
        this.resolveTimeout();
      }, timeout);
    } else {
      // No response expected, resolve immediately
      this.currentCommand.resolveCallback(true);
      this.currentCommand = null;
      this.processCommands();
    }
  }

  /**
   * Process response for current command
   */
  async processCommand() {
    while(!this.processing && this.newData) {
      this.processing = true;
      const currentBuffer = this.buffer;
      this.buffer = new Uint8Array([]);
      this.newData = false;

      const promise = new Promise((resolve, reject) => {
        this.currentCommand.receive(currentBuffer, resolve, reject);
      });

      try {
        const result = await promise;
        clearTimeout(this.currentCommand.timeoutFunct);
        this.currentCommand.resolveCallback(result);
        this.currentCommand = null;
        this.processing = false;
        this.processCommands();
      } catch(e) {
        if(e instanceof NotEnoughDataError) {
          // Not enough data yet, put it back
          this.buffer = this.appendBuffer(currentBuffer, this.buffer);
          this.processing = false;
        } else {
          // Command failed
          clearTimeout(this.currentCommand.timeoutFunct);
          this.currentCommand.rejectCallback(e);
          this.cleanUp();
          this.processCommands();
        }
      }
    }
  }

  /**
   * Helper: Append two buffers
   */
  appendBuffer(buffer1, buffer2) {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp;
  }
}
```

### Using the Queue System

**File: `src/utils/Serial.js`**

```javascript
class Serial {
  constructor(port) {
    this.port = port;
    this.qp = new QueueProcessor();
    // ... other initialization
  }

  /**
   * Execute a command through the queue
   * 
   * @param {ArrayBuffer} buffer - Data to send
   * @param {function} responseHandler - Function to process response
   * @returns {Promise}
   */
  async executeCommand(buffer, responseHandler) {
    const sendHandler = async () => {
      await this.writeBuffer(buffer);
    };

    return this.qp.addCommand(sendHandler, responseHandler);
  }

  /**
   * Start reader and feed data to queue
   */
  async startReader() {
    while(this.running) {
      try {
        const { value } = await this.reader.read();
        if(value) {
          this.received += value.byteLength;
          // Feed data to queue processor
          this.qp.addData(value);
        }
      } catch(e) {
        console.error('Reader failed', e);
        return;
      }
    }
  }
}
```

---

## Event Handling

### Step 10: Listen for Port Connect/Disconnect Events

**File: `src/Containers/App/index.jsx`**

```javascript
async componentDidMount() {
  if (this.serialApi) {
    // Remove old listeners (if any)
    this.serialApi.removeEventListener('connect', this.serialConnectHandler);
    this.serialApi.removeEventListener('disconnect', this.serialDisconnectHandler);

    // Add event listeners for device connect/disconnect
    this.serialApi.addEventListener('connect', this.serialConnectHandler);
    this.serialApi.addEventListener('disconnect', this.serialDisconnectHandler);

    // Check for already connected ports
    this.serialConnectHandler();
  }
}

serialConnectHandler = async() => {
  // Device was plugged in
  const ports = await this.serialApi.getPorts();
  if(ports.length > 0) {
    console.log('Device connected');
    // Update UI, create Serial instance, etc.
  }
};

serialDisconnectHandler = async() => {
  // Device was unplugged
  console.log('Device disconnected');
  
  const availablePorts = await this.serialApi.getPorts();
  
  // Clean up
  if(this.serial) {
    this.serial.disconnect();
  }
  
  // Update UI state
  store.dispatch(setOpen(false));
};
```

---

## Complete Example

### Minimal Working Implementation

```javascript
// 1. Check for API support
const serialApi = 'serial' in navigator 
  ? navigator.serial 
  : null;

if (!serialApi) {
  alert('Web Serial API not supported');
  return;
}

// 2. Request port (must be from user gesture)
async function connect() {
  try {
    const port = await serialApi.requestPort();
    
    // 3. Open port
    await port.open({ baudRate: 115200 });
    
    // 4. Get reader and writer
    const writer = port.writable.getWriter();
    const reader = port.readable.getReader();
    
    // 5. Start reading
    (async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        console.log('Received:', value);
      }
    })();
    
    // 6. Write data
    const data = new Uint8Array([0x01, 0x02, 0x03]);
    await writer.write(data);
    
    // 7. Close when done
    reader.releaseLock();
    writer.releaseLock();
    await port.close();
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Attach to button click
document.getElementById('connect-btn').addEventListener('click', connect);
```

---

## Best Practices

### 1. Error Handling
- Always wrap port operations in try/catch
- Handle `NotFoundError` when user cancels port selection
- Handle `InvalidStateError` when port is already open
- Check if port is open before operations

### 2. Resource Management
- Always release reader/writer locks before closing
- Cancel readers before releasing
- Clean up event listeners on component unmount

### 3. User Experience
- Show clear error messages
- Indicate connection status in UI
- Provide disconnect button
- Handle unexpected disconnections gracefully

### 4. Security
- Only request ports from user gestures
- Don't store sensitive port data
- Validate all incoming data

### 5. Performance
- Use command queue to prevent race conditions
- Buffer incoming data appropriately
- Set appropriate timeouts for commands

---

## Common Issues & Solutions

### Issue: "Port is already open"
**Solution**: Check if port is open before opening:
```javascript
if (port.readable && port.writable) {
  // Port is already open
} else {
  await port.open({ baudRate: 115200 });
}
```

### Issue: "User cancelled port selection"
**Solution**: Handle the error gracefully:
```javascript
try {
  const port = await serialApi.requestPort();
} catch (e) {
  if (e.name === 'NotFoundError') {
    // User cancelled - this is normal
  }
}
```

### Issue: "Data not arriving"
**Solution**: 
- Check baud rate matches device
- Ensure reader loop is running
- Verify device is sending data
- Check for buffer overflow

### Issue: "Race conditions"
**Solution**: Use command queue system (see Step 9)

---

## Additional Resources

- [Web Serial API Specification](https://wicg.github.io/serial/)
- [MDN Web Serial API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
- [Chrome Web Serial Guide](https://developer.chrome.com/articles/serial/)

---

## License

This implementation guide is based on code from the [ESC Configurator](https://github.com/stylesuxx/esc-configurator) project, which is licensed under AGPL-3.0.

