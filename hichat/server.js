var express = require('express'),
    https = require('https'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users = [];


//To process the client message, then return
function say (Word) {
  console.log(Word);
  return "Hi";
};

//To save the chat message
function save(name,msg) {
  //Save the chat history
  var nowtime = Date();
  var timestamp = Date.parse(nowtime);
  var data = {
    TableName: "Chat",
    Item: {
            NickName: name,
            CreateDate: timestamp.toString(),
            Msg: msg
  }};

  data = JSON.stringify(data);
  console.log(data);
  var opt = {
  method: "POST",
  host: "ese77mrv88.execute-api.us-west-2.amazonaws.com",
  port: 443,
  path: "/prod/Chat",
  headers: {
      "Content-Type": 'application/json',
      "Content-Length": data.length
  }
};

var post_req = https.request(opt, function (serverFeedback) {
        if (serverFeedback.statusCode == 200) {
            var body = "";
            serverFeedback.on('data', function (data) { body += data; })
                          .on('end', function () { console.log ("200 response:" + body); });
        }
        else {
            //res.send(500, "error");
        }
    });

post_req.write(data + "\n");
post_req.end();
};

//specify the html we will use
app.use('/', express.static(__dirname + '/www'));
//bind the server to the 80 port
//server.listen(3000);//for local test
server.listen(process.env.PORT || 3000);//publish to heroku
//server.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000);//publish to openshift
//console.log('server started on port'+process.env.PORT || 3000);
//handle the socket
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1) {
            socket.emit('nickExisted');
        } else {
            socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login');
        };
    });
    //user leaves
    socket.on('disconnect', function() {
        if (socket.nickname != null) {
            users.splice(socket.userIndex, 1);
            socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        }
    });
    //new message get
    socket.on('postMsg', function(msg, color) {
        socket.broadcast.emit('newMsg', socket.nickname, msg, color);

        socket.emit('newMsg', 'system', say('haha'), color);
        save(socket.nickname, socket.nickname + ":" + msg);
    });
    //new image get
    socket.on('img', function(imgData, color) {
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
});
