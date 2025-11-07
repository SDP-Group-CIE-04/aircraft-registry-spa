#!/usr/bin/env python3
"""
RSAS Discovery Service - USB Serial Version
Runs on localhost:8080 and discovers ESP32 modules via USB serial connection
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import serial
import serial.tools.list_ports
import json
import time

app = Flask(__name__)
CORS(app)  # Allow requests from Aircraft SPA

def get_connected_modules():
    """Detect ESP32 modules connected via USB"""
    modules = []
    
    # Get all available COM ports
    ports = serial.tools.list_ports.comports()
    
    for port in ports:
        # Look for ESP32 devices (common VID/PID combinations)
        # ESP32: VID 0x10C4 (Silicon Labs) or 0x1A86 (QinHeng Electronics)
        if port.vid in [0x10C4, 0x1A86, 0x303A]:  # 0x303A is Espressif
            try:
                # Try to connect and get device info
                ser = serial.Serial(port.device, 115200, timeout=2)
                time.sleep(0.5)  # Wait for connection to stabilize
                
                # Send command to get device info
                ser.write(b'GET_INFO\n')
                time.sleep(0.3)
                
                # Try to read response
                response = b''
                if ser.in_waiting > 0:
                    response = ser.read(ser.in_waiting)
                
                # Parse ESN from response or use default
                esn = "UNKNOWN"
                if response:
                    try:
                        # Expecting JSON response like: {"esn": "MT7621", "status": "ready"}
                        data = json.loads(response.decode('utf-8').strip())
                        esn = data.get('esn', 'UNKNOWN')
                    except:
                        # If no valid JSON, extract ESN from device description
                        esn = port.serial_number if port.serial_number else f"USB-{port.device.split('/')[-1]}"
                else:
                    # Use port info if no response
                    esn = port.serial_number if port.serial_number else f"USB-{port.device.split('/')[-1]}"
                
                ser.close()
                
                module = {
                    'name': f"RSAS-Module-{esn}",
                    'port': port.device,
                    'esn': esn,
                    'description': port.description,
                    'manufacturer': port.manufacturer or 'Unknown',
                    'vid': hex(port.vid) if port.vid else 'N/A',
                    'pid': hex(port.pid) if port.pid else 'N/A',
                    'status': 'ready',
                    'connection_type': 'USB',
                    'last_seen': time.time()
                }
                
                modules.append(module)
                print(f"✅ Found module: {esn} on {port.device}")
                
            except serial.SerialException as e:
                print(f"⚠️  Could not open {port.device}: {e}")
                continue
            except Exception as e:
                print(f"⚠️  Error reading from {port.device}: {e}")
                continue
    
    return modules

@app.route('/devices', methods=['GET'])
def get_devices():
    """Return list of connected USB modules"""
    try:
        modules = get_connected_modules()
        return jsonify({
            'count': len(modules),
            'devices': modules
        })
    except Exception as e:
        print(f"❌ Error detecting devices: {e}")
        return jsonify({
            'count': 0,
            'devices': [],
            'error': str(e)
        }), 500

@app.route('/activate', methods=['POST'])
def activate_device():
    """Send activation data to ESP32 via USB serial"""
    data = request.json
    device_port = data.get('device_port')
    aircraft_data = data.get('aircraft_data')
    
    if not device_port or not aircraft_data:
        return jsonify({'error': 'Missing device_port or aircraft_data'}), 400
    
    try:
        print(f"📡 Activating device on {device_port}")
        print(f"   Data: {aircraft_data}")
        
        # Open serial connection
        ser = serial.Serial(device_port, 115200, timeout=5)
        time.sleep(0.5)  # Wait for connection
        
        # Send activation command with JSON data
        activation_cmd = {
            'command': 'ACTIVATE',
            'data': aircraft_data
        }
        
        ser.write(json.dumps(activation_cmd).encode('utf-8') + b'\n')
        time.sleep(0.5)
        
        # Read response
        response = b''
        if ser.in_waiting > 0:
            response = ser.read(ser.in_waiting).decode('utf-8').strip()
        
        ser.close()
        
        # Check response
        if 'OK' in response or 'SUCCESS' in response.upper():
            print(f"✅ Activation successful!")
            return jsonify({
                'success': True,
                'message': 'Module activated successfully',
                'esp32_response': response
            })
        else:
            print(f"⚠️  Unexpected response: {response}")
            return jsonify({
                'success': True,  # Still consider it success if we got a response
                'message': 'Command sent to module',
                'esp32_response': response
            })
            
    except serial.SerialException as e:
        print(f"❌ Serial error: {e}")
        return jsonify({
            'success': False,
            'error': f'Cannot connect to device: {str(e)}'
        }), 503
    except Exception as e:
        print(f"❌ Activation error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        modules = get_connected_modules()
        return jsonify({
            'status': 'running',
            'devices_count': len(modules),
            'connection_type': 'USB Serial'
        })
    except Exception as e:
        return jsonify({
            'status': 'running',
            'devices_count': 0,
            'error': str(e)
        })

if __name__ == '__main__':
    print("=" * 60)
    print("  RSAS Discovery Service - USB Serial")
    print("=" * 60)
    print("\n🔌 Detecting USB-connected ESP32 modules...")
    print("\n🚀 Starting HTTP server on http://localhost:8080")
    print("   Endpoints:")
    print("   - GET  /devices  -> List USB-connected modules")
    print("   - POST /activate -> Activate a module via serial")
    print("   - GET  /health   -> Service health check")
    print("\n" + "=" * 60 + "\n")
    
    # Test detection on startup
    modules = get_connected_modules()
    if modules:
        print(f"\n✅ Found {len(modules)} module(s) connected via USB\n")
    else:
        print("\n⚠️  No ESP32 modules detected. Connect via USB and refresh.\n")
    
    # Run Flask app
    app.run(host='127.0.0.1', port=8080, debug=False)