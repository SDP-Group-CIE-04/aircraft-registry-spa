#!/usr/bin/env python3
"""
Simple script to discover and test ESP32-S3 on local network
"""

import socket
import requests
from zeroconf import ServiceBrowser, Zeroconf

class RSASListener:
    def __init__(self):
        self.devices = []
    
    def remove_service(self, zeroconf, type, name):
        print(f"Service {name} removed")
    
    def add_service(self, zeroconf, type, name):
        info = zeroconf.get_service_info(type, name)
        if info:
            address = socket.inet_ntoa(info.addresses[0])
            port = info.port
            hostname = info.server
            
            print(f"\n✅ Found RSAS Device!")
            print(f"   Name: {name}")
            print(f"   Hostname: {hostname}")
            print(f"   IP: {address}")
            print(f"   Port: {port}")
            
            self.devices.append({
                'name': name,
                'hostname': hostname,
                'ip': address,
                'port': port
            })
    
    def update_service(self, zeroconf, type, name):
        pass

def discover_devices(timeout=5):
    """Discover RSAS devices on network"""
    print("🔍 Scanning for RSAS devices on network...")
    print(f"   Timeout: {timeout} seconds\n")
    
    zeroconf = Zeroconf()
    listener = RSASListener()
    browser = ServiceBrowser(zeroconf, "_http._tcp.local.", listener)
    
    try:
        import time
        time.sleep(timeout)
    finally:
        zeroconf.close()
    
    return listener.devices

def test_device(device):
    """Test HTTP connection to device"""
    ip = device['ip']
    port = device['port']
    
    print(f"\n📡 Testing device at {ip}:{port}")
    
    try:
        # Test root endpoint
        url = f"http://{ip}:{port}/"
        print(f"   GET {url}")
        response = requests.get(url, timeout=5)
        print(f"   ✅ Status: {response.status_code}")
        print(f"   Response:\n{response.text}")
        
        # Test activation endpoint
        url = f"http://{ip}:{port}/activate"
        test_data = {
            "aircraft_id": "test-123",
            "operator_id": "test-456"
        }
        print(f"\n   POST {url}")
        print(f"   Data: {test_data}")
        response = requests.post(url, json=test_data, timeout=5)
        print(f"   ✅ Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("  RSAS ESP32-S3 Discovery & Test Script")
    print("=" * 60)
    
    # Discover devices
    devices = discover_devices(timeout=5)
    
    if not devices:
        print("\n❌ No RSAS devices found on network")
        print("\nTroubleshooting:")
        print("  1. Is ESP32 powered on?")
        print("  2. Is ESP32 connected to same WiFi?")
        print("  3. Check ESP32 serial output for IP address")
        print("  4. Try: ping rsas-test.local")
        return
    
    print(f"\n✅ Found {len(devices)} device(s)")
    
    # Test each device
    for i, device in enumerate(devices, 1):
        print(f"\n{'=' * 60}")
        print(f"Testing Device {i}/{len(devices)}")
        print('=' * 60)
        test_device(device)
    
    print("\n" + "=" * 60)
    print("Testing complete!")
    print("=" * 60)

if __name__ == "__main__":
    # Install required package first:
    # pip install zeroconf requests
    
    main()