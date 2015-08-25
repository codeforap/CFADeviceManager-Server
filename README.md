# CFADeviceManager
CFA Device Manager is a yet another open source Mobile Device Management Solution. 

This project uses MQTT (Open Source - IoT Protocol, Read more at `http://mqtt.org`) in order to avoid long-polling on devices & server and for effective communication.
MQTT is reliable protocol, consumes low-power on mobiles/tablets & highly scalable.  

* Server Application uses Python-Flask framework and had a good REST API.
* Can Use MySQL/PostgreSQL for User-Auth and Android-App auth
* Uses MongoDB for Application-Received data and location data from the device. 
* Installation Steps can be followed at [https://github.com/codeforap/CFADeviceManager-Server/Install.md](https://github.com/codeforap/CFADeviceManager-Server/Install.md)


## Technologies Involved

* MQTT
* MongoDB
* Python
* GIS Maps- Geo-JSON
* D3 Js - Visualizations
* Bootstrap


### For Android Client, Clone the git Repo:

``` bash
git clone https://github.com/codeforap/CFADeviceManager-Android.git
```

Contribute to the Android Client at [CFADeviceManager-Android](https://github.com/codeforap/CFADeviceManager-Android)
