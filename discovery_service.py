#!/usr/bin/env python3
"""
RSAS Discovery Service - Windows Service
Runs on localhost:8080 and discovers ESP32 modules on local network
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from zeroconf import ServiceBrowser, Zeroconf
import socket
import requests
import threading
import time

app = Flask(__name__)
CORS(app)  # Allow requests from Aircraft SPA

# Store discovered devices
discovered_devices = {}
zeroconf = None
browser = None

class RSASListener:
    """Listens for RSAS devices on the network"""
    
    def remove_service(self, zeroconf, type, name):
        """Called when a service is removed"""
        print(f"Service removed: {name}")
        if name in discovered_devices:
            del discovered_devices[name]
    
    def add_service(self, zeroconf, type, name):
        """Called when a new service is discovered"""
        info = zeroconf.get_service_info(type, name)
        if info:
            address = socket.inet_ntoa(info.addresses[0])
            port = info.port
            hostname = info.server
            
            # Extract ESN from hostname (e.g., rsas-test.local -> test)
            esn = hostname.replace('.local.', '').replace('rsas-', '')
            
            device = {
                'name': name,
                'hostname': hostname,
                'ip': address,
                'port': port,
                'esn': esn,
                'status': 'discovered',
                'last_seen': time.time()
            }
            
            discovered_devices[name] = device
            print(f"✅ Discovered device: {esn} at {address}:{port}")
    
    def update_service(self, zeroconf, type, name):
        """Called when a service is updated"""
        if name in discovered_devices:
            discovered_devices[name]['last_seen'] = time.time()

def start_discovery():
    """Start mDNS discovery in background thread"""
    global zeroconf, browser
    
    print("🔍 Starting RSAS device discovery...")
    zeroconf = Zeroconf()
    listener = RSASListener()
    browser = ServiceBrowser(zeroconf, "_http._tcp.local.", listener)
    print("✅ Discovery service running")

def cleanup_old_devices():
    """Remove devices not seen in 30 seconds"""
    while True:
        time.sleep(10)
        current_time = time.time()
        to_remove = []
        
        for name, device in discovered_devices.items():
            if current_time - device['last_seen'] > 30:
                to_remove.append(name)
        
        for name in to_remove:
            print(f"⏰ Device timeout: {discovered_devices[name]['esn']}")
            del discovered_devices[name]

@app.route('/devices', methods=['GET'])
def get_devices():
    """Return list of discovered devices"""
    devices_list = list(discovered_devices.values())
    return jsonify({
        'count': len(devices_list),
        'devices': devices_list
    })

@app.route('/activate', methods=['POST'])
def activate_device():
    """Forward activation data to ESP32 device"""
    data = request.json
    device_ip = data.get('device_ip')
    aircraft_data = data.get('aircraft_data')
    
    if not device_ip or not aircraft_data:
        return jsonify({'error': 'Missing device_ip or aircraft_data'}), 400
    
    try:
        # Forward to ESP32
        url = f"http://{device_ip}/activate"
        print(f"📡 Activating device at {device_ip}")
        print(f"   Data: {aircraft_data}")
        
        response = requests.post(
            url, 
            json=aircraft_data, 
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Activation successful!")
            return jsonify({
                'success': True,
                'message': 'Module activated successfully',
                'esp32_response': response.text
            })
        else:
            print(f"❌ Activation failed: {response.status_code}")
            return jsonify({
                'success': False,
                'error': f'ESP32 returned status {response.status_code}'
            }), 500
            
    except requests.exceptions.Timeout:
        return jsonify({
            'success': False,
            'error': 'ESP32 device timeout'
        }), 504
    except requests.exceptions.ConnectionError:
        return jsonify({
            'success': False,
            'error': 'Cannot connect to ESP32 device'
        }), 503
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'running',
        'devices_count': len(discovered_devices)
    })

if __name__ == '__main__':
    print("=" * 60)
    print("  RSAS Discovery Service - Windows")
    print("=" * 60)
    
    # Start discovery in background thread
    discovery_thread = threading.Thread(target=start_discovery, daemon=True)
    discovery_thread.start()
    
    # Start cleanup thread
    cleanup_thread = threading.Thread(target=cleanup_old_devices, daemon=True)
    cleanup_thread.start()
    
    print("\n🚀 Starting HTTP server on http://localhost:8080")
    print("   Endpoints:")
    print("   - GET  /devices  -> List discovered devices")
    print("   - POST /activate -> Activate a device")
    print("   - GET  /health   -> Service health check")
    print("\n" + "=" * 60 + "\n")
    
    # Run Flask app
    app.run(host='127.0.0.1', port=8080, debug=False)