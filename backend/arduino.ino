#include <Wire.h>
#include "MAX30105.h"
#include <MPU9250_asukiaaa.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ===== WIFI =====
const char* ssid     = "TOPNET_C990";
const char* password = "5aqehv48fo";

// ===== SERVER URL =====
// ✅ Must match your Node backend route
const char* serverUrl = "http://192.168.1.16:7002/api/players";

// ===== SENSOR OBJECTS =====
MAX30105 particleSensor;
MPU9250_asukiaaa mySensor;

// ===== GLOBAL VARIABLES =====
#define BUFFER_SIZE 100
long irBuffer[BUFFER_SIZE];
long redBuffer[BUFFER_SIZE];
int bufferIndex = 0;
unsigned long lastBeatTime = 0;

float bpm = 0;
float spo2 = 0;
int stepCount = 0;

// Step detection
const float stepThreshold = 1.2;
bool stepDetected = false;

// ===== SEND DATA TO SERVER =====
void sendToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected. Reconnecting...");
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // ✅ Build JSON with only 3 fields
  String jsonData = "{";
  jsonData += "\"bpm\":" + String(bpm, 1) + ",";
  jsonData += "\"spo2\":" + String(spo2, 1) + ",";
  jsonData += "\"steps\":" + String(stepCount);
  jsonData += "}";

  Serial.print("➡️ Sending JSON: ");
  Serial.println(jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.print("✅ Server Response Code: ");
    Serial.println(httpResponseCode);
    Serial.println(http.getString());
  } else {
    Serial.print("❌ POST failed. Code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);

  // ===== Connect WiFi =====
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected");

  // ===== Setup MAX30105 =====
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD, 0x57)) {
    Serial.println("❌ MAX30105 not found!");
    while (1);
  }
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x3F);
  particleSensor.setPulseAmplitudeIR(0x3F);

  // ===== Setup MPU9250 =====
  mySensor.setWire(&Wire);
  mySensor.beginAccel();
}

void loop() {

  // ===== Read MAX30105 =====
  long irValue = particleSensor.getIR();
  long redValue = particleSensor.getRed();

  if (irValue > 50000) {
    irBuffer[bufferIndex] = irValue;
    redBuffer[bufferIndex] = redValue;
    bufferIndex = (bufferIndex + 1) % BUFFER_SIZE;

    long maxVal = 0, minVal = 1e6;
    for (int i = 0; i < BUFFER_SIZE; i++) {
      if (irBuffer[i] > maxVal) maxVal = irBuffer[i];
      if (irBuffer[i] < minVal) minVal = irBuffer[i];
    }

    long threshold = minVal + (maxVal - minVal) / 2;
    static bool beatDetected = false;

    if (irValue > threshold && !beatDetected) {
      unsigned long currentTime = millis();
      float delta = (currentTime - lastBeatTime) / 1000.0;
      lastBeatTime = currentTime;
      if (delta > 0.3) bpm = (60.0 / delta) * 5;
      beatDetected = true;
    } else if (irValue < threshold) beatDetected = false;

    // Calculate SpO2
    float meanIR = 0, meanRed = 0;
    for (int i = 0; i < BUFFER_SIZE; i++) {
      meanIR += irBuffer[i];
      meanRed += redBuffer[i];
    }
    meanIR /= BUFFER_SIZE;
    meanRed /= BUFFER_SIZE;

    float rmsIR = 0, rmsRed = 0;
    for (int i = 0; i < BUFFER_SIZE; i++) {
      rmsIR += pow(irBuffer[i] - meanIR, 2);
      rmsRed += pow(redBuffer[i] - meanRed, 2);
    }
    rmsIR = sqrt(rmsIR / BUFFER_SIZE);
    rmsRed = sqrt(rmsRed / BUFFER_SIZE);

    float R = (rmsRed / meanRed) / (rmsIR / meanIR);
    spo2 = -45.06 * (R * R) + 30.354 * R + 94.845;
    spo2 = constrain(spo2, 70, 100);
  }

  // ===== Step Detection from MPU9250 =====
  mySensor.accelUpdate();
  float ax = mySensor.accelX();
  float ay = mySensor.accelY();
  float az = mySensor.accelZ();
  float totalAcc = sqrt(ax*ax + ay*ay + az*az);

  if (totalAcc > stepThreshold && !stepDetected) {
    stepCount++;
    stepDetected = true;
  }
  if (totalAcc < stepThreshold) stepDetected = false;

  // ===== Send every 2 seconds =====
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 2000) {
    sendToServer();
    lastSend = millis();
  }

  // Debug print
  Serial.print("BPM: "); Serial.print(bpm, 1);
  Serial.print(" | SpO2: "); Serial.print(spo2, 1);
  Serial.print(" | Steps: "); Serial.println(stepCount);

  delay(200);
}
