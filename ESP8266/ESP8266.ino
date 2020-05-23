#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <aREST.h>
#include <Wire.h>
#include <BH1750.h>
#include "DHT.h"
#include <ArduinoJson.h>
#include <SocketIOClient.h>
#include <time.h>

#define WIFI_SSID "Tony Stark"
#define WIFI_PASSWORD "iloveyou3000"
#define DHTTYPE DHT11   // DHT 11
#define DHTPIN D5
#define TIMEZONE 7
#define IP_HOST "192.168.0.113"
#define IP_PORT 8888

/*
   ESP Inside
    BH1750
    SCL <--> D3
    SDA <--> D4

    DHT11
    DHTPIN <--> D5
*/

DHT dht (DHTPIN, DHTTYPE);
BH1750 lightMeter(0x23);

const char* ssid = WIFI_SSID;
const char* pass = WIFI_PASSWORD;

//Khai bao SocketOIClient
SocketIOClient client;

StaticJsonBuffer<256> jb;
JsonObject& obj = jb.createObject();
//bien chua thoi gian format ddmmyy/HHMM
char buffer[80];

char host[] = IP_HOST;
int port = IP_PORT;



unsigned long previousMillis = 0;
long interval = 60000;

void setup() {
  Serial.begin(115200);

  dht.begin();
  Wire.begin(D4, D3);

  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println(F("BH1750 Advanced beginning"));
  }
  else {
    Serial.println(F("Error initialising BH1750"));
  }

  //Connect to WiFi
  Serial.print("Ket noi vao mang ");
  Serial.println(WIFI_SSID);

  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");

  Serial.println(WiFi.localIP());

  //Set up time
  configTime(TIMEZONE * 3600, 0, "pool.ntp.org", "time.nist.gov");


  if (!client.connect(host, port)) {
    Serial.println(F("Ket noi den socker server that bai !!!!"));
    return;
  }

  if (client.connected()) {
    client.send("Connect", "Notification", "Connected !!!!");
  }

}

void loop() {



  if (millis() - previousMillis > interval) {
    //lệnh:
    previousMillis = millis();

    float lux = lightMeter.readLightLevel();
    float t = dht.readTemperature();
    if ( isnan(t)) {
      Serial.println(F("Doc cam bien nhiet do that bai\nKiem tra lai day dan"));
      return;
    }
    if ( isnan(lux)) {
      Serial.println(F("Doc cam bien cuong do anh sang that bai\nKiem tra lai day dan"));
      return;
    }

    Serial.print("Nhiet do : ");
    Serial.println(t);
    Serial.print("Anh sang : ");
    Serial.println(lux);
    obj["insidetemp"] = t;
    obj["insidelux"] = lux;

    struct tm * timeinfo;
    time_t now = time(nullptr);
    Serial.println(ctime(&now));
    time (&now);
    timeinfo = localtime (&now);
    strftime (buffer, 80, "%d%m%y/%H%M%S", timeinfo);


    //gửi sự kiện "GetData" một JSON
    client.send("GetData", "inside", String(t) + "," + String(lux) + ","+String(buffer));

    if (!client.connected()) {
      client.reconnect(host, port);
      Serial.println(F("Reconnected..."));
    }




  }


}
