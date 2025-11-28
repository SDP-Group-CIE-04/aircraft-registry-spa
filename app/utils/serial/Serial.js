/**
 * Serial Port Wrapper Class
 * Provides high-level interface for Web Serial API communication
 * Handles opening/closing ports, reading/writing data, and command queue
 */

import { QueueProcessor, NotEnoughDataError } from './QueueProcessor';

const BAUD_RATE = 115200;
const READ_TIMEOUT = 1000; // milliseconds

class Serial {
  constructor(port) {
    this.port = port;
    this.baudRate = BAUD_RATE;
    this.writer = null;
    this.reader = null;
    this.running = false;
    this.qp = new QueueProcessor();
    this.sent = 0;
    this.received = 0;
  }

  /**
   * Open connection to the serial port
   *
   * @param {number} baudRate - Communication speed (default: 115200)
   */
  async open(baudRate = BAUD_RATE) {
    this.baudRate = baudRate;

    try {
      // Open the port with specified baud rate
      await this.port.open({ baudRate });

      // Get writer for sending data
      this.writer = this.port.writable.getWriter();

      // Get reader for receiving data
      this.reader = this.port.readable.getReader();
    } catch (e) {
      console.error('Could not open serial port:', e);
      throw new Error('Could not open serial port');
    }

    // Start reading data in the background
    this.running = true;
    this.startReader();
  }

  /**
   * Start reading data from the port in a background loop
   */
  async startReader() {
    while (this.running) {
      try {
        // Read data (this blocks until data is available)
        const { value, done } = await this.reader.read();

        if (done) {
          // Reader was cancelled
          console.log('Reader done');
          return;
        }

        if (value) {
          // Process incoming data
          // value is a Uint8Array
          this.received += value.byteLength;
          this.handleIncomingData(value);
        }
      } catch (e) {
        console.error('Reader failed:', e);
        return;
      }
    }
  }

  /**
   * Handle incoming data (feed to queue processor)
   * @param {Uint8Array} data - Incoming data
   */
  handleIncomingData(data) {
    // Add to queue processor
    this.qp.addData(data);
  }

  /**
   * Write a buffer to the serial port
   *
   * @param {ArrayBuffer|Uint8Array|string} buffer - Data to send
   */
  async writeBuffer(buffer) {
    if (!this.writer) {
      throw new Error('Port not open - writer not available');
    }

    // Convert to Uint8Array if needed
    let data;
    if (typeof buffer === 'string') {
      data = new TextEncoder().encode(buffer);
    } else if (buffer instanceof Uint8Array) {
      data = buffer;
    } else {
      data = new Uint8Array(buffer);
    }

    // Write data
    await this.writer.write(data);

    // Track bytes sent
    this.sent += data.byteLength;
  }

  /**
   * Execute a command through the queue
   *
   * @param {string|Uint8Array} command - Command to send
   * @param {function} responseHandler - Function to process response (buffer, resolve, reject)
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise}
   */
  async executeCommand(command, responseHandler, timeout = READ_TIMEOUT) {
    const sendHandler = async () => {
      if (typeof command === 'string') {
        await this.writeBuffer(command);
      } else {
        await this.writeBuffer(command);
      }
    };

    return this.qp.addCommand(sendHandler, responseHandler, timeout);
  }

  /**
   * Send GET_INFO command and wait for response
   * @returns {Promise<{esn: string, status: string}>}
   */
  async getInfo() {
    return this.executeCommand(
      'GET_INFO\n',
      (buffer, resolve, reject) => {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        const trimmed = text.trim();

        // Try to find JSON in the response
        const jsonStart = trimmed.indexOf('{');
        const jsonEnd = trimmed.lastIndexOf('}') + 1;

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          try {
            const jsonStr = trimmed.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonStr);
            const esn = data.esn || 'UNKNOWN';
            const status = data.status || 'ready';
            resolve({ esn, status });
            return;
          } catch (e) {
            // Not valid JSON yet, might need more data
            reject(new NotEnoughDataError('Waiting for complete JSON response'));
            return;
          }
        }

        // If we have some data but no JSON yet, wait for more
        if (trimmed.length > 0) {
          reject(new NotEnoughDataError('Waiting for JSON response'));
        } else {
          reject(new Error('No response from device'));
        }
      },
      700, // timeout in milliseconds
    );
  }

  /**
   * Send GET_FIELDS command and wait for response
   * @returns {Promise<{operator_id: string, aircraft_id: string, rid_id: string}>}
   */
  async getFields() {
    return this.executeCommand(
      'GET_FIELDS\n',
      (buffer, resolve, reject) => {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        const trimmed = text.trim();

        // Try to find JSON in the response (might have extra text before/after)
        const jsonStart = trimmed.indexOf('{');
        const jsonEnd = trimmed.lastIndexOf('}') + 1;

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
          try {
            const jsonStr = trimmed.substring(jsonStart, jsonEnd);
            const data = JSON.parse(jsonStr);
            const operator_id = (data.operator_id || '').trim();
            const aircraft_id = (data.aircraft_id || '').trim();
            const rid_id = (data.rid_id || '').trim();

            resolve({
              operator_id,
              aircraft_id,
              rid_id,
            });
            return;
          } catch (e) {
            // Not valid JSON yet, might need more data
            reject(new NotEnoughDataError('Waiting for complete JSON response'));
            return;
          }
        }

        // If we have some data but no JSON yet, wait for more
        if (trimmed.length > 0) {
          reject(new NotEnoughDataError('Waiting for JSON response'));
        } else {
          // Return empty fields if no JSON found
          resolve({
            operator_id: '',
            aircraft_id: '',
            rid_id: '',
          });
        }
      },
      700, // timeout in milliseconds
    );
  }

  /**
   * Send BASIC_SET command and wait for response
   * @param {string} operatorId - Operator UUID
   * @param {string} aircraftId - Aircraft UUID
   * @param {string} ridId - RID ID (UUID)
   * @param {string} [serialNumber] - Optional serial number/ESN
   * @returns {Promise<string>} ESP32 response text
   */
  async basicSet(operatorId, aircraftId, ridId, serialNumber = null) {
    const pairs = [`operator_id=${operatorId}`, `aircraft_id=${aircraftId}`];
    if (serialNumber) {
      pairs.push(`serial_number=${serialNumber}`);
    }
    pairs.push(`rid_id=${ridId}`);

    const command = `BASIC_SET ${pairs.join('|')}\n`;

    return this.executeCommand(
      command,
      (buffer, resolve, reject) => {
        const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
        const trimmed = text.trim();

        // Check for success indicators
        const upperText = trimmed.toUpperCase();
        if (
          upperText.includes('SUCCESS') ||
          upperText.includes('[SUCCESS]') ||
          upperText.includes('STORED') ||
          upperText.includes('[INFO]')
        ) {
          resolve(trimmed);
          return;
        }

        // If we have some response, return it (even if not explicitly "SUCCESS")
        if (trimmed.length > 0) {
          resolve(trimmed);
        } else {
          // Wait for more data
          reject(new NotEnoughDataError('Waiting for response'));
        }
      },
      1200, // timeout in milliseconds
    );
  }

  /**
   * Cleanly close the serial connection
   */
  async close() {
    this.running = false;

    // Cancel and release the reader
    if (this.reader) {
      this.reader.cancel();
      await this.reader.releaseLock();
      this.reader = null;
    }

    // Release the writer
    if (this.writer) {
      await this.writer.releaseLock();
      this.writer = null;
    }

    // Clear command queue
    this.qp.clear();

    // Close the port
    try {
      await this.port.close();
    } catch (e) {
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
    this.qp.clear();
  }

  /**
   * Get port information
   * @returns {Object} Port info with usbVendorId, usbProductId
   */
  getInfo() {
    if (this.port && this.port.getInfo) {
      return this.port.getInfo();
    }
    return null;
  }
}

export default Serial;

