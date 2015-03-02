var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
var usersInfo = [];
router.post('/chat/registration',function(req,res){
  console.log('succcess');
  usersInfo.push(req.body);
  res.body = usersInfo;
  //need to send a response status that use registered
  res.status(201).json(res.body);
  console.log(usersInfo);
});

var userName = '';
router.get('/chat/login/:username',function(req,res){
  console.log('req.params.username '+ req.params.username);
  for(var i = 0; i<usersInfo.length; i++){
    if(usersInfo[i].username == req.params.username){
      console.log('userinfo '+JSON.stringify(usersInfo[i]));
      userName = req.params.username;
      res.send(usersInfo[i].password+','+userName);
      res.end();
    }
  }
});
var isOnline = [];

var webSocketServer = new (require('websocket')).Server({port: (process.env.PORT || 3001)}),
    webSockets = {},http=require('http');
var server = http.createServer(function(req,res){
  console.log('server created');
});

var deletedUser = '';
webSocketServer.on('connection', function (webSocket) {

  webSockets[userName] = webSocket;
  console.log('connected: ' + userName+ ' in ' + Object.getOwnPropertyNames(webSockets));
  isOnline.push(userName);

  webSocket.on('message', function(message) {
    var messageArray = JSON.parse(message);
    deletedUser = messageArray.user;
    console.log('message array after window closed' + deletedUser);
    var toUserWebSocket = webSockets[messageArray.user];
    console.log('received from ' + userName+ ': ' + message);
    console.log('touserwebsocket key ' + toUserWebSocket);
    if(messageArray.status === 'offline'){
      for(var onlineUsers in webSockets){
        if(onlineUsers !== deletedUser){
          console.log('online users ' +onlineUsers);
          webSockets[onlineUsers].send(message);
        }
      }
    }
    else if(messageArray.status === 'signed on'){
      for(var onlineUsers in webSockets){
        if(messageArray.user !== onlineUsers){
          webSockets[onlineUsers].send(message);
        }
      }
    }
    else if(messageArray.status === 'online'){
      webSockets[messageArray.user].send(message);
      console.log('online user ' + messageArray.user);
    }


    //webSocket.send(JSON.stringify(messageArray));
    //webSocket.send(isOnline.toString());

  });
  webSocket.on('close', function () {
    delete webSockets[deletedUser];
    isOnline.forEach(function(user){
      if(deletedUser === user){
        isOnline.splice(isOnline.indexOf(user), 1);
        console.log('isOnline ' + isOnline);
        console.log('deleted: ' +deletedUser);
        deletedUser = '';

      }
    });
  });
});

router.get('/chat/online',function(req,res){
  res.send(isOnline);
});
module.exports = router;
