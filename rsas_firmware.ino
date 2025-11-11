/**
 * RSAS Firmware (ESP32-S3)
 * - EEPROM lookup table (name,address,size) + magic marker
 * - Plain-text serial, newline-terminated
 * - Implements:
 *     GET_INFO -> {"esn":"XXXXXX","status":"ready|temporary|permanent"}
 *     BASIC_SET operator_id=<...>|aircraft_id=<...>[|serial_number=<...>]
 *     READ_EEPROM / RESET_REMOTE_ID / LOCK_PERMANENT  (utilities)
 * - LED states:
 *     Blue (idle), Purple (temporary), White (permanent), Green (success blink), Yellow (reset blink)
 */

#include <EEPROM.h>
#include <Adafruit_NeoPixel.h>

// ---------- Hardware & Memory ----------
#define RGB_PIN 38
#define NUM_PIXELS 1

#define EEPROM_SIZE          512
#define MAX_FIELDS           10
#define ENTRY_SIZE           16
#define LOOKUP_TABLE_START   0
#define DATA_START           (MAX_FIELDS * ENTRY_SIZE)
#define FLAG_REGISTERED_ADDR (EEPROM_SIZE - 4)
#define FLAG_PERMANENT_ADDR  (EEPROM_SIZE - 3)
#define MAGIC_ADDR           (EEPROM_SIZE - 2)

// ---------- LED ----------
Adafruit_NeoPixel LED_RGB(NUM_PIXELS, RGB_PIN, NEO_GRB + NEO_KHZ800);

static void setColor(uint8_t r, uint8_t g, uint8_t b) {
  LED_RGB.setPixelColor(0, LED_RGB.Color(r, g, b));
  LED_RGB.show();
}

static void blinkColor(uint8_t r, uint8_t g, uint8_t b, int times = 3, int ms = 150) {
  for (int i = 0; i < times; i++) { setColor(r,g,b); delay(ms); setColor(0,0,0); delay(ms); }
}

// ---------- Field Table ----------
struct __attribute__((packed)) FieldEntry {
  char     name[12];   // null-terminated/padded
  uint16_t address;    // little endian in EEPROM
  uint16_t size;       // includes trailing '\0'
};

FieldEntry fieldTable[MAX_FIELDS];

static const char* fieldNames[MAX_FIELDS] = {
  "operator_id", "serial_number", "registration_id",
  "rid_id", "secure_key", "aircraft_type",
  "aircraft_id", "field_8", "field_9", "field_10"
};
static const int fieldSizes[MAX_FIELDS] = {24, 16, 32, 37, 32, 4, 24, 12, 12, 12};

// ---------- State ----------
bool is_registered = false;
bool is_permanent  = false;

// ---------- EEPROM Helpers ----------
static void writeField(int index, const String& v) {
  if (index < 0 || index >= MAX_FIELDS) return;
  int addr = fieldTable[index].address;
  int cap  = fieldTable[index].size;
  int n    = min((int)v.length(), cap - 1);
  for (int i = 0; i < cap - 1; i++) {
    char c = (i < n) ? v[i] : 0;
    EEPROM.write(addr + i, c);
  }
  EEPROM.write(addr + cap - 1, '\0');
}

static String readField(int index) {
  String out = "";
  if (index < 0 || index >= MAX_FIELDS) return out;
  int addr = fieldTable[index].address;
  int cap  = fieldTable[index].size;
  for (int i = 0; i < cap; i++) {
    char c = EEPROM.read(addr + i);
    if (c == '\0') break;
    out += c;
  }
  return out;
}

static int getFieldIndex(const char* key) {
  for (int i = 0; i < MAX_FIELDS; i++) {
    if (strncmp(fieldTable[i].name, key, sizeof(fieldTable[i].name)) == 0) return i;
  }
  return -1;
}

static bool writeByName(const char* key, const String& val) {
  int idx = getFieldIndex(key);
  if (idx < 0) return false;
  writeField(idx, val);
  return true;
}

static void setupFieldTableIfMissing() {
  if (EEPROM.read(MAGIC_ADDR) == 'R') {
    for (int i = 0; i < MAX_FIELDS; i++) {
      int off = LOOKUP_TABLE_START + i * ENTRY_SIZE;
      EEPROM.get(off, fieldTable[i]);
    }
    return;
  }
  int addr = DATA_START;
  for (int i = 0; i < MAX_FIELDS; i++) {
    FieldEntry e{};
    strncpy(e.name, fieldNames[i], sizeof(e.name) - 1);
    e.name[sizeof(e.name) - 1] = '\0';
    e.address = addr;
    e.size    = fieldSizes[i];
    EEPROM.put(LOOKUP_TABLE_START + i * ENTRY_SIZE, e);
    fieldTable[i] = e;
    addr += e.size;
  }
  EEPROM.write(MAGIC_ADDR, 'R');
  EEPROM.commit();
}

// ---------- Status ----------
static bool hasBasicFields() {
  int op = getFieldIndex("operator_id");
  int ac = getFieldIndex("aircraft_id");
  return readField(op).length() > 0 && readField(ac).length() > 0;
}

static void restoreStatusColor() {
  if (is_permanent)  { setColor(255,255,255); return; } // white
  if (is_registered) { setColor(128,0,128);   return; } // purple
  setColor(0,0,255);                                     // blue
}

static void readAllFields() {
  Serial.println("[EEPROM] Dump:");
  for (int i = 0; i < MAX_FIELDS; i++) {
    Serial.printf("%-15s : %s\n", fieldTable[i].name, readField(i).c_str());
  }
  Serial.printf("Registered : %s\n", is_registered ? (is_permanent ? "PERMANENT" : "TEMPORARY") : "NO");
}

// ---------- Serial Commands ----------
static String inputBuffer;

static String chipEsn() {
  uint64_t mac = ESP.getEfuseMac();
  uint32_t lo  = (uint32_t)(mac & 0xFFFFFF);
  char buf[16];
  snprintf(buf, sizeof(buf), "%06X", lo);
  return String(buf);
}

static void handleInput(String s) {
  s.trim();
  if (!s.length()) return;

  // GET_INFO -> JSON
  if (s == "GET_INFO") {
    const char* status = is_permanent ? "permanent" : (is_registered ? "temporary" : "ready");
    Serial.printf("{\"esn\":\"%s\",\"status\":\"%s\"}\n", chipEsn().c_str(), status);
    return;
  }

  // BASIC_SET operator_id=<...>|aircraft_id=<...>[|serial_number=<...>]
  if (s.startsWith("BASIC_SET ")) {
    if (is_permanent) { Serial.println("[BLOCKED] Permanently locked."); blinkColor(255,0,0); return; }

    String p = s.substring(strlen("BASIC_SET "));
    while (p.length() > 0) {
      int bar = p.indexOf('|');
      String pair = (bar < 0) ? p : p.substring(0, bar);
      int eq = pair.indexOf('=');
      if (eq > 0) {
        String key = pair.substring(0, eq); key.trim();
        String val = pair.substring(eq + 1); val.trim();
        if (!writeByName(key.c_str(), val)) {
          Serial.printf("[WARN] Unknown field: %s\n", key.c_str());
        }
      }
      if (bar < 0) break;
      p.remove(0, bar + 1);
    }
    EEPROM.commit();

    if (!is_registered && hasBasicFields()) {
      EEPROM.write(FLAG_REGISTERED_ADDR, 1);
      EEPROM.commit();
      is_registered = true;
      setColor(128,0,128);     // purple
      Serial.println("[SUCCESS] Basic activation stored.");
      blinkColor(0,255,0);     // green blink
    } else {
      restoreStatusColor();
      Serial.println("[INFO] BASIC_SET processed.");
    }
    return;
  }

  // Utilities
  if (s == "READ_EEPROM" || s == "READ") { readAllFields(); return; }

  if (s == "RESET_REMOTE_ID" || s == "RESET") {
    if (is_permanent) { Serial.println("[BLOCKED] Permanently locked."); blinkColor(255,0,0); return; }
    for (int i = 0; i < MAX_FIELDS; i++) {
      int addr = fieldTable[i].address;
      int cap  = fieldTable[i].size;
      for (int j = 0; j < cap; j++) EEPROM.write(addr + j, 0);
    }
    EEPROM.write(FLAG_REGISTERED_ADDR, 0);
    EEPROM.write(FLAG_PERMANENT_ADDR, 0);
    EEPROM.commit();
    is_registered = false;
    is_permanent  = false;
    blinkColor(255,255,0); // yellow blink
    restoreStatusColor();
    Serial.println("[INFO] Reset done.");
    return;
  }

  if (s == "LOCK_PERMANENT" || s == "LOCK") {
    if (!is_registered) { Serial.println("[ERROR] Not registered."); blinkColor(255,0,0); return; }
    EEPROM.write(FLAG_PERMANENT_ADDR, 1);
    EEPROM.commit();
    is_permanent = true;
    setColor(255,255,255); // white
    Serial.println("[LOCKED] Permanent.");
    return;
  }

  Serial.println("[WARN] Unknown command.");
}

// ---------- Setup / Loop ----------
void setup() {
  LED_RGB.begin();     // init LED first (per RSAS lessons)
  LED_RGB.show();
  setColor(0,0,255);   // blue idle

  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);

  is_registered = (EEPROM.read(FLAG_REGISTERED_ADDR) == 1);
  is_permanent  = (EEPROM.read(FLAG_PERMANENT_ADDR)  == 1);

  setupFieldTableIfMissing();
  restoreStatusColor();
  Serial.println("[BOOT] RSAS firmware ready.");
}

void loop() {
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') {
      handleInput(inputBuffer);
      inputBuffer = "";
    } else {
      inputBuffer += c;
    }
  }
}
