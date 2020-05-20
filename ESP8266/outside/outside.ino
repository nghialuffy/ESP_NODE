#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <aREST.h>
#include <Wire.h>
#include <BH1750.h>
#include "DHT.h"
#include <ArduinoJson.h>
#include <SocketIOClient.h>
#include <time.h>
#include <Servo.h>

#define WIFI_SSID "DUT"
#define WIFI_PASSWORD "11223355"
#define DHTTYPE DHT11   // DHT 11
#define DHTPIN D5
#define TIMEZONE 7
#define IP_HOST "192.168.1.197"
#define IP_PORT 8888

/*
   ESP Outside
    BH1750
    SCL <--> D3
    SDA <--> D4

    DHT11
    DHTPIN <--> D5

    Servo

   attach <--> D2 (GPIO4)

   con lai thi 3.3V voi GND
*/

DHT dht (DHTPIN, DHTTYPE);
BH1750 lightMeter(0x23);

const char* ssid = WIFI_SSID;
const char* pass = WIFI_PASSWORD;

//Khai bao SocketOIClient
SocketIOClient client;

extern String RID;
extern String Rfull;

StaticJsonBuffer<256> jb;
JsonObject& obj = jb.createObject();

Servo myservo;
//bien chua thoi gian format ddmmyy/HHMM
char buffer[80];

char host[] = IP_HOST;
int port = IP_PORT;
int lastPos = 0;



unsigned long previousMillis = 0;
long interval = 1000;

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

  //Test Servo

  myservo.attach(4);
  int pos;
  Serial.println("Start Test Servo....");
  for (pos = 0; pos <= 180; pos += 1) {
    myservo.write(pos);
    delay(5);
  }
  for (pos = 180; pos >= 0; pos -= 1) {
    myservo.write(pos);
    delay(5);
  }
  Serial.println("Test Servo DONE....");


  //Set up time
  configTime(TIMEZONE * 3600, 0, "pool.ntp.org", "time.nist.gov");


  if (!client.connect(host, port)) {
    Serial.println(F("Ket noi den socker server that bai !!!!"));
    return;
  }

  if (client.connected()) {
    client.send("Connect", "Notification", "Outside connect !!!!");
  }

}

void loop() {



  if (millis() - previousMillis > interval) {
    //lệnh:
    previousMillis = millis();

    float lux = lightMeter.readLightLevel();
    float t = dht.readTemperature();
    if ( isnan(t)) {
      client.send("CheckOutside", "outside", "Doc cam bien nhiet do that bai\nKiem tra lai day dan");
      Serial.println(F("Doc cam bien nhiet do that bai\nKiem tra lai day dan"));
      return;
    }
    if ( isnan(lux)) {
      client.send("CheckOutside", "outside", "Doc cam bien cuong do anh sang that bai\nKiem tra lai day dan");
      Serial.println(F("Doc cam bien cuong do anh sang that bai\nKiem tra lai day dan"));
      return;
    }

    Serial.print("Nhiet do : ");
    Serial.println(t);
    Serial.print("Anh sang : ");
    Serial.println(lux);
    Serial.print("Goc Servo : ");
    Serial.println(lastPos);

    struct tm * timeinfo;
    time_t now = time(nullptr);
    Serial.println(ctime(&now));
    time (&now);
    timeinfo = localtime (&now);
    strftime (buffer, 80, "%d%m%y/%H%M%S", timeinfo);


    //gửi sự kiện "GetData" một JSON
        if ( (String(buffer[12]) == "2") && ((String(buffer[10])).toInt() % 2 == 0) && (String(buffer[11]) == "0")){
          client.send("GetDataOutside", "outside", String(t) + "," + String(lux) +"," + String(lastPos) + "," + String(buffer));
        }

//    if (String(buffer[12]) == "5") {
//      client.send("GetDataOutside", "outside", String(t) + "," + String(lux) + "," + String(lastPos) + "," + String(buffer));
//    }




    //Nhap even tu server tra ve. Se co 2 thong so RID va Rfull
    //  +RID: Tên sự kiện
    //  +RFull: Danh sách tham số được nén thành chuỗi JSON!
    if (client.monitor()) {
      Serial.print(RID + " : " + Rfull);
      if (RID == "setServo") {
        int pos = Rfull.toInt() + 90 ;
        int i;
        Serial.println("====================");
        if (pos > lastPos) {
          for (i = lastPos; i <= pos; i += 1) {
            myservo.write(i);
            delay(5);
          }
        } else {
          for (i = lastPos; i >= pos; i -= 1) {
            myservo.write(i);
            delay(5);
          }
        }
        lastPos = pos;
        client.send("servoDone", "servo", "Da quay goc : " + String(pos - 90));
      }
    }
    else{
      client.send(RID, Rfull);
    }




  }

  if (!client.connected()) {
    client.reconnect(host, port);
    client.send("Connect", "Notification", "Outside reconnect !!!!");
    Serial.println(F("Reconnected..."));
  }

}
