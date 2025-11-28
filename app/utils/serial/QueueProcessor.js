/**
 * Command Queue Processor
 * Manages serial command queue to prevent race conditions
 * Ensures commands are executed in order and responses are matched correctly
 */

class NotEnoughDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotEnoughDataError';
  }
}

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
   * @param {Uint8Array|ArrayBuffer} buffer - Incoming data
   */
  addData(buffer) {
    const dataArray = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.buffer = this.appendBuffer(this.buffer, dataArray);
    this.newData = true;
    this.processCommands();
  }

  /**
   * Add a command to the queue
   *
   * @param {function} transmit - Function that sends data (returns Promise)
   * @param {function} receive - Function that processes response (buffer, resolve, reject)
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Resolves when command completes
   */
  addCommand(transmit, receive = null, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const newCommand = {
        transmit,
        receive,
        timeout,
        resolveCallback: result => resolve(result),
        rejectCallback: error => reject(error),
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
    if (!this.currentCommand && this.commands.length > 0) {
      await this.startCommand();
    }

    // Process current command if data is available
    if (this.currentCommand && this.currentCommand.receive) {
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
    if (this.currentCommand.receive) {
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
    while (!this.processing && this.newData) {
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
      } catch (e) {
        if (e instanceof NotEnoughDataError) {
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
   * Handle timeout for current command
   */
  resolveTimeout() {
    if (this.currentCommand) {
      this.currentCommand.rejectCallback(
        new Error(`Command timeout after ${this.currentCommand.timeout}ms`),
      );
      this.cleanUp();
      this.processCommands();
    }
  }

  /**
   * Clean up current command
   */
  cleanUp() {
    this.currentCommand = null;
    this.processing = false;
  }

  /**
   * Helper: Append two buffers
   * @param {Uint8Array} buffer1
   * @param {Uint8Array} buffer2
   * @returns {Uint8Array}
   */
  appendBuffer(buffer1, buffer2) {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp;
  }

  /**
   * Clear all pending commands and reset buffer
   */
  clear() {
    this.commands = [];
    this.buffer = new Uint8Array([]);
    this.newData = false;
    this.processing = false;
    if (this.currentCommand && this.currentCommand.timeoutFunct) {
      clearTimeout(this.currentCommand.timeoutFunct);
    }
    this.currentCommand = null;
  }
}

export { QueueProcessor, NotEnoughDataError };

