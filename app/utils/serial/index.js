/**
 * Web Serial API Utilities
 * 
 * Provides browser-native serial port communication for ESP32 modules.
 * Replaces the need for a separate Python discovery service.
 * 
 * @module serial
 */

export { default as Serial } from './Serial';
export { loadSerialApi, isSerialApiSupported } from './serialApi';
export { QueueProcessor, NotEnoughDataError } from './QueueProcessor';

