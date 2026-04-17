import { Endpoint as teleEndpoint } from 'react-native-tele'
import { Endpoint as sipEndpoint } from 'react-native-sip2'
import DeviceInfo from 'react-native-device-info';

//import { getUniqueId, getManufacturer } from 'react-native-device-info';

const sip2tele=true;
const tele2sip=false;

class Bridge
{

}

class Bridges
{
  constructor(tEndpoint,sEndpoint) {
    this.teleCall=null;
    this.sipCall=null;
    this.tEndpoint = new tEndpoint();
    this.sEndpoint = new sEndpoint();
  }

  //by sip
  //by tele
  onBridgeReceived = (bridge) => {
    console.log(">>🔗 ⬆️ onBridgeReceived");
    // Conf bridge 🌉⬇️⬆️⛓️🔗
  }

  onBridgeTerminated =(bridge, bySip, byTele) => {
    console.log(">>🔗 ⬆️ onBridgeTerminated");
    
    if(this.conf.sendSipHangup!=true) {
      this.conf.sendHangup=true;
      console.log("<<🔮 sEndpoint.hangupCall 3");
      this.sEndpoint.hangupCall(this.sipCall);
    }
  }
}



export default class Gateway{
    constructor() {
      //super();
  
      this.txtLog="123";

      this.teleCall=null;
      this.sipCall=null;
      
      this.conf={};
      this.bridges=[];

      this.tEndpoint = new teleEndpoint();
      this.sEndpoint = new sipEndpoint();
    }
   
    onCreate() {
        this.start().then(() => {console.log("started");});
    }

    async onMount() {
        //this.start();
    }

    async start() {
      console.log("\n\n");

      let deviceId = DeviceInfo.getDeviceId();
      let tConfig={},sConfig={};

      console.log("deviceId:",deviceId);
      
      if(deviceId=="sp7731cea"){
        tConfig={ReplaceDialer:true,Permissions:true};
        sConfig.name="50015";
        sConfig.username="50015";
        sConfig.password="pass50015";
      } else if(deviceId=="Impress_City"){
        //tConfig={ReplaceDialer:true,Permissions:true};
        tConfig={ReplaceDialer:false,Permissions:false};
        sConfig.name="50014";
        sConfig.username="50014";
        sConfig.password="pass50014";
      } else if(deviceId=="Impress_Tor"){
        tConfig={ReplaceDialer:true,Permissions:true};
        sConfig.name="50017";
        sConfig.username="50017";
        sConfig.password="pass50017";
      } else  if(deviceId=="QC_Reference_Phone"){ //Redmi 4A
        //tConfig={ReplaceDialer:false,Permissions:false};
        tConfig={ReplaceDialer:true,Permissions:true,fas:false};
        sConfig.name="50019";
        sConfig.username="50019";
        sConfig.password="pass50019";
      } else if(deviceId=="MSM8937"){ // Redmi 5A
        //tConfig={ReplaceDialer:false,Permissions:false};
        tConfig={ReplaceDialer:true,Permissions:true,fas:false};
        sConfig.name="50018";
        sConfig.username="50018";
        sConfig.password="pass50018";
      } else {
        tConfig={ReplaceDialer:false,Permissions:false};
        sConfig.name="50016";
        sConfig.username="50016";
        sConfig.password="pass50016";
      }

      
      

      

      console.log("🚀 Gateway start\n\n");
      await this.tEndpointInit(tConfig);
      await this.sEndpointInit(sConfig);
      console.log("🔥 Gateway started\n\n");
    }
  

    async tEndpointInit(tConfig) {
      console.log("📱 🚀 tEndpointInit()\n\n");
  
      //


      //let state = await this.tEndpoint.start({ReplaceDialer:true,Permissions:true}); // List of calls when RN context is started, could not be empty because Background service is working on Android
      //let state = await this.tEndpoint.start({ReplaceDialer:false,Permissions:false}); // List of calls when RN context is started, could not be empty because Background service is working on Android
      let state = await this.tEndpoint.start(tConfig); // List of calls when RN context is started, could not be empty because Background service is working on Android
      console.log("📱 🔥 tEndpoint started");
      console.log("📱 🚧 state:\n", state)
  
      let { calls, settings } = state;
      console.log("calls:\n", calls);
      console.log("settings:\n", settings);
        
      // tEndpoint.on("connectivity_changed", (online) => {}); // TODO      
      this.tEndpoint.on("call_received", (call) => {
        console.log(">>📱 📞 🔥 tEndpoint.call_received\n\n",(new Date).toUTCString(), call);
        this.onTeleCallReceived(call)
      });
      this.tEndpoint.on("call_changed", (call) => {
        console.log(">>📱 📞 📶 tEndpoint.call_changed",(new Date).toUTCString(), call);
        this.onTeleCallChanged(call);
      });
      this.tEndpoint.on("call_terminated", (call) => {
        console.log(">>📱 📞 📵 tEndpoint.call_terminated",(new Date).toUTCString(), call);
        this.onTeleCallTerminated(call);
      });
    }
  
    async sEndpointInit(sConfig) {
      console.log("🔮 🚀 sEndpointInit()\n\n");
      //this.sEndpoint = new sipEndpoint;
  
      let deviceId = DeviceInfo.getDeviceId();
      console.log(deviceId);


      let configuration = {
        "name": sConfig.name, //"50015",
  
        
        /*
        "username": "50363",
        "password": "pass50363",
        "domain": "sip.zadarma.com",
        "regServer": "sip.zadarma.com", // Default wildcard
        */

        
    

  
        "username": sConfig.username, //"50015",
        "password": sConfig.password, //"pass50015",
        //"domain": "192.168.88.254:6060",
        "domain": "192.168.88.254",
        "regServer": "",
        //"regServer": "192.168.88.254", // Default wildcard
        
  
        "proxy": null,
        "transport": "UDP",//null, // Default TCP
        
        "regTimeout": 3600, // Default 3600
        //"regTimeout": 3600, // Default 3600
        "regHeaders": {
          //"X-Custom-Header": "Value"
        },
        //"regContactParams": ";unique-device-token-id=XXXXXXXXX",
        "regOnAdd": true,  // Default true, use false for manual REGISTRATION
  
        service: {
          ua: "siptest",
          //stun: ['stun.l.google.com:19302', 'stun4.l.google.com:19302']
        },
  
        network: {
          useAnyway: true,           // Default: true
          useWifi: true,              // Default: true
          use3g: true,                // Default: false
          useEdge: true,             // Default: false
          useGprs: true,             // Default: false
          useInRoaming: true,        // Default: false
          useOtherNetworks: true      // Default: false
        }
      };
  

      console.log(configuration);


      let state = await this.sEndpoint.start();
      console.log("🔮 🚀 sEndpoint started");
  
      let { accounts, calls, settings, connectivity } = state;
      console.log("🔮 🚧 state:\n", state)
  
      try {
        console.log("endpoint.createAccount");
        this.account = await this.sEndpoint.createAccount(configuration);
        console.log("account created", this.account);
      } catch (err) {
        console.log("err");
        console.error(err);
      }
  
  
  
  
  
      // Subscribe to endpoint events
      this.sEndpoint.on("registration_changed", (account) => {
        console.log(">>🔮 ⚙️ sEndpoint.registration_changed", account);
      });
      this.sEndpoint.on("connectivity_changed", (online) => {
        console.log(">>🔮 ⚙️ sEndpoint.connectivity_changed", online);
      });
      this.sEndpoint.on("call_received", (call) => {
        console.log(">>🔮 📞 🔥 sEndpoint.call_received\n\n", call);
        this.onSipCallReceived(call)
      });
      this.sEndpoint.on("call_changed", (call) => {
        console.log(">>🔮 📞 📶 sEndpoint.call_changed", call);
        this.onSipCallChanged(call);
      });
      this.sEndpoint.on("call_terminated", (call) => {
        console.log(">>🔮 📞 📵 sEndpoint.call_terminated", call);
        this.onSipCallTerminated(call);
        //Если из SIP пришел сигнал повесить трубку - шлем intent в наш Dialer
      });
      this.sEndpoint.on("call_screen_locked", (call) => {
        console.log(">>🔮 sEndpoint.call_screen_locked", call);
      }); // Android only
    }
  
  
    onSipCallReceived = (call) => {
      //PJSIP_INV_STATE_NULL


      if(sip2tele==false) return;
      console.log("<<📱 🌉 ⬆️☎️ tEndpoint.makeCall");
      //
      // Conf bridge 🌉⬇️⬆️⛓️🔗

      this.sipCall=call;
      this.conf.sendHangup=false;
  
      let options = {
        headers: {
          "sim": "1" // TODO
        }
      }
      //this.teleCall = /*await*/ this.tEndpoint.makeCall(this.sipCall._localUri, options);
        //this.tEndpoint.makeCall(this.sipCall._localUri, options).then((call1)=>{this.teleCall = call1;});
        /*       
          "_localContact": "\"MyUserName\" <sip:50363@10.42.0.100:43422;ob>", 
          "_localUri": "<sip:900@10.42.0.100;ob>", "_media": [], "_muted": false,
          "_remoteContact": "<sip:asterisk@10.42.0.1:5060>", 
          "_remoteName": null, "_remoteNumber": "50015",
          "_remoteUri": "<sip:50015@172.16.104.17>" 
        */
        
       let destination=(call && call._localNumber) ? String(call._localNumber) : ""; //=call._localUri; <sip:900@10.42.0.100;ob

        if((call._localNumber=="50014")||(call._localNumber=="50015")||(call._localNumber=="50016")||(call._localNumber=="50017")||(call._localNumber=="50018"))
        {
          console.log("test: make call + fast answer");
          this.sEndpoint.answerCall(call);
          return;
        }

        if(call._localNumber=="3333")
        {
          console.log("3333 test: make call + fast answer");
          
          destination="900";

          this.sEndpoint.answerCall(call);
          return;
        }

        if(call._localNumber=="4444")
        {
          console.log("4444 test: make call + activate audio session");
          
          destination="900";

          this.sEndpoint.activateAudioSession();
          return;
        }


        console.log("standart call");
        //destination="+79006367756";
        destination = destination.startsWith("+") ? destination : `+${destination}`;
        if(destination === "+") {
          console.log("Skip dialing: empty local number in SIP call");
          return;
        }

        console.log("DIALING");
        this.tEndpoint.makeCall(1,destination, options).then((call1)=>{this.teleCall = call1;});
        
        //temporary hack one way audio
        //this.sEndpoint.activateAudioSession();



      
      
      //this.sEndpoint.answerCall(call);
    }
  
    onSipCallChanged = (call) => {
      /*
      PJSIP_INV_STATE_INCOMING
      PJSIP_INV_STATE_CONNECTING
      PJSIP_INV_STATE_CONFIRMED
      */
    }
  
    onSipCallTerminated = (call) => {
      if (call._state=="PJSIP_INV_STATE_DISCONNECTED") 
      {
        console.log("Если из SIP пришел сигнал повесить трубку - шлем intent в наш Dialer");
        console.log(this.teleCall);

        if(this.conf.sendHangup!=true){
          this.conf.sendHangup=true;
          console.log("<<📱 tEndpoint.hangupCall");
          this.tEndpoint.hangupCall(this.teleCall);
        }
      }
    }
  
  
    onTeleCallReceived = (call) => {
      console.log(">>📱 tEndpoint onTeleCallReceived");

      //Проверка входящий/исходящий
      if (call._state=="TELE_INV_STATE_RINGING") {
        //Входящий
        console.log(">>📱 📳 tEndpoint TELE_INV_STATE_RINGING");
        console.log("<<📱 tEndpoint.hangupCall");
        this.tEndpoint.hangupCall(call);

        //
      } else {
        //Исходящий
        this.teleCall=call;
      }
      
      
    }
  
    onTeleCallChanged = (call) => {
      
      if (call._state=="TELE_INV_STATE_CONNECTING") //PJSIP_INV_STATE_CALLING
      {
        console.log("Набор пошел");
      }
      if (call._state=="TELE_INV_STATE_DIALING")  //PJSIP_INV_STATE_EARLY
        {
          console.log("Пошли early media, шлем progress");
          this.sEndpoint.progressCall(this.sipCall);

          //Передача гудков
          //this.sEndpoint.ringingCall(this.sipCall);
        }
        if (call._state=="TELE_INV_STATE_ACTIVE") //PJSIP_INV_STATE_CONFIRMED
        {
          console.log("Поднял трубку, шлем answer в SIP");
          this.sEndpoint.answerCall(this.sipCall)
        }
        if ((call._state=="TELE_INV_STATE_DISCONNECTED") || (call._state=="TELE_INV_STATE_DISCONNECTING"))  //PJSIP_INV_STATE_DISCONNECTED
        {
          console.log("Повесил трубку");
          if(this.conf.sendHangup!=true) {
            this.conf.sendHangup=true;
            console.log("<<🔮 sEndpoint.hangupCall шлем hangup в SIP 2");
            console.log(this.sipCall);
            this.sEndpoint.hangupCall(this.sipCall)
          }
          return;
        }
        if (call._state=="BUSY") 
        {
          console.log("Занято");
          this.sEndpoint.busyCall(this.sipCall);
          return;
        }
        if (call._state=="TELE_INV_STATE_UNKNOWN") 
        {
          console.log("неизвестный");
        }

        if (call._state=="TELE_INV_STATE_RINGING")  //PJSIP_INV_STATE_INCOMING
        {
          console.log("Входящий");
          this.sEndpoint.answerCall(this.sipCall)
        }
        

      //this.progress();
      //this.answer();
    }
  
    onTeleCallTerminated = (call) => {
      if (call._direction=="DIRECTION_INCOMING") {console.log("no termination on incoming");return;};

      if (call._state=="PJSIP_INV_STATE_DISCONNECTED") 
        {
          // Статус повеса
        }

      
        //TODO: add disconnect state
        //declineCall
        if(this.conf.sendHangup!=true) {
          this.conf.sendHangup=true;
          console.log("<<🔮 sEndpoint.hangupCall 1");
          console.log(this.sipCall);
          this.sEndpoint.hangupCall(this.sipCall);
        }
    }


  
  

  
    destroy = () => {
      this.tEndpoint.destroy();
      this.sEndpoint.destroy();
    }

}
