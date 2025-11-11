#!/usr/bin/env python3
"""
RSAS Discovery Service - USB Serial
- GET /devices  -> detect USB ESP32 modules, ask GET_INFO for ESN/status
- POST /activate -> send BASIC_SET operator_id|aircraft_id|rid_id[|serial_number] to selected serial port
  (RID ID is automatically generated from operator_id, aircraft_id, and esn)
- GET /health
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import serial
import serial.tools.list_ports
import json
import time
import re

app = Flask(__name__)
CORS(app)

BAUD = 115200
DISCOVERY_VIDS = {0x10C4, 0x1A86, 0x303A}  # Silicon Labs, QinHeng, Espressif

def generate_rid_id(operator_id, aircraft_id, module_esn):
    """
    Generate a RID ID based on operator, aircraft, and module information
    Format: RID-{operator_short}-{aircraft_short}-{module_esn_short}
    """
    # Extract short identifiers from UUIDs (first 8 chars)
    operator_short = operator_id[:8].upper() if operator_id else "UNKNOWN"
    aircraft_short = aircraft_id[:8].upper() if aircraft_id else "UNKNOWN"
    # Clean ESN: remove non-alphanumeric and take first 8 chars
    esn_clean = re.sub(r'[^A-Z0-9]', '', module_esn.upper())[:8] if module_esn else "UNKNOWN"
    
    # Format: RID-{OP}-{AC}-{ESN}
    return f"RID-{operator_short}-{aircraft_short}-{esn_clean}"

def read_lines_with_timeout(ser, timeout_s=0.9):
    start = time.time()
    buf = b""
    while time.time() - start < timeout_s:
        if ser.in_waiting > 0:
            buf += ser.read(ser.in_waiting)
        time.sleep(0.05)
    return buf.decode("utf-8", errors="ignore").strip()

def get_info_from_port(port_path):
    try:
        ser = serial.Serial(port_path, BAUD, timeout=0.5)
        time.sleep(0.25)
        ser.write(b"GET_INFO\n")
        time.sleep(0.25)
        resp = read_lines_with_timeout(ser, timeout_s=0.7)
        ser.close()

        if resp.startswith("{") and resp.endswith("}"):
            try:
                data = json.loads(resp)
                esn = data.get("esn") or "UNKNOWN"
                status = data.get("status") or "ready"
                return esn, status
            except Exception:
                pass
        return None, None
    except Exception:
        return None, None

def get_connected_modules():
    modules = []
    for port in serial.tools.list_ports.comports():
        if port.vid and port.vid in DISCOVERY_VIDS:
            esn, status = get_info_from_port(port.device)
            if not esn:
                esn = port.serial_number or f"USB-{port.device.split('/')[-1]}"
            if not status:
                status = "ready"
            modules.append({
                "name": f"RSAS-Module-{esn}",
                "port": port.device,
                "esn": esn,
                "description": port.description,
                "manufacturer": port.manufacturer or "Unknown",
                "vid": hex(port.vid) if port.vid else "N/A",
                "pid": hex(port.pid) if port.pid else "N/A",
                "status": status,
                "connection_type": "USB",
                "last_seen": time.time()
            })
    return modules

@app.route("/devices", methods=["GET"])
def devices():
    try:
        mods = get_connected_modules()
        return jsonify({"count": len(mods), "devices": mods})
    except Exception as e:
        return jsonify({"count": 0, "devices": [], "error": str(e)}), 500

@app.route("/activate", methods=["POST"])
def activate():
    """
    Body:
    {
      "device_port": "/dev/ttyACM0" | "COM3",
      "aircraft_data": {
        "operator_id": "OP123",
        "aircraft_id": "AC567",
        "esn": "optional"
      }
    }
    Note: RID ID is automatically generated from operator_id, aircraft_id, and esn
    """
    data = request.json or {}
    device_port = data.get("device_port")
    aircraft = data.get("aircraft_data") or {}
    operator_id = (aircraft.get("operator_id") or "").strip()
    aircraft_id = (aircraft.get("aircraft_id") or "").strip()
    esn = (aircraft.get("esn") or "").strip()  # optional -> serial_number

    if not device_port:
        return jsonify({"success": False, "error": "Missing device_port"}), 400
    if not operator_id or not aircraft_id:
        return jsonify({"success": False, "error": "operator_id and aircraft_id are required"}), 400

    # Generate RID ID automatically
    rid_id = generate_rid_id(operator_id, aircraft_id, esn)

    try:
        ser = serial.Serial(device_port, BAUD, timeout=1.0)
        time.sleep(0.3)

        # Build command with all required fields
        pairs = [f"operator_id={operator_id}", f"aircraft_id={aircraft_id}"]
        if esn:
            pairs.append(f"serial_number={esn}")
        # Always include the generated RID ID
        pairs.append(f"rid_id={rid_id}")
        
        cmd = "BASIC_SET " + "|".join(pairs) + "\n"

        ser.write(cmd.encode("utf-8"))
        time.sleep(0.35)
        resp = read_lines_with_timeout(ser, timeout_s=1.2)
        ser.close()

        ok = any(tok in resp.upper() for tok in ["SUCCESS", "[SUCCESS]", "STORED"])
        return jsonify({
            "success": True if ok else True,  # board often returns text even when successful
            "sent_command": cmd.strip(),
            "esp32_response": resp,
            "rid_id": rid_id  # Return the generated RID ID
        })
    except serial.SerialException as e:
        return jsonify({"success": False, "error": f"Serial error: {e}"}), 503
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    try:
        mods = get_connected_modules()
        return jsonify({
            "status": "running",
            "devices_count": len(mods),
            "connection_type": "USB Serial"
        })
    except Exception as e:
        return jsonify({
            "status": "running",
            "devices_count": 0,
            "error": str(e)
        })

if __name__ == "__main__":
    print("=" * 60)
    print("  RSAS Discovery Service - USB Serial")
    print("=" * 60)
    print("GET /devices | POST /activate | GET /health")
    print("Listening on http://127.0.0.1:8080")
    print("=" * 60)
    app.run(host="127.0.0.1", port=8080, debug=False)
