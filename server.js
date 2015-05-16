var controller = require('http').createServer(handler);
var io = require('socket.io').listen(controller);
var fs = require('fs');
var five = require('johnny-five');
var board = new five.Board()

controller.listen(8080);

function handler (req, res) {
   fs.readFile(__dirname + '/index.html',
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      console.log('Connection');
      res.writeHead(200);
      res.end(data);
      }
   );
}
//turn off debug
io.set('log level', 1);

//set board to ready state to start transfer of data
board.on('ready', function () {

// Motor
  var motorGroup1 = new five.Motor({
    pin: 10,
    pin: 11,
  });
  var motorGroup2 = new five.Motor({
    pin: 6,
    pin: 5,
  });

// digital pins needed to tell the motor controller "forward" and "backword"
  var digitalGroup1 = new five.Pin({
    pin: 4,
    pin: 3,
    });
  var digitalGroup2 = new five.Pin({
    pin: 9,
    pin: 8,
  });

function driveMotor(beta, gamma)
{
  if(gamma < 70)
  {
    var forward = 255
    motorGroup1.start()
  }
}

// define interactions with client
  io.sockets.on('connection', function(socket)
  {
     socket.on('accel', function (data)
     {
       driveMotor(data.beta, data.gamma);

        if(beta > 10)
        {
          motor1.start(beta);
          digitalM1a.low();
          digitalM1b.high();
        }
        else if(beta < (-10))
        {
          motor1.start(posBeta);
          digitalM1a.high();
          digitalM1b.low();
        }
        else
        {
          motor1.stop();
          digitalM1a.low();
          digitalM1b.low();
        }
     });
  });
})
