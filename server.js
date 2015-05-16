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


//set board to ready state to start transfer of data
board.on('ready', function () {

// Motor
  var motorGroupRight = new five.Motor({
    pin: 10,
    pin: 11,
  });
//group2
  var motorGroupLeft = new five.Motor({
    pin: 5,
    pin: 6,
  });

// digital pins needed to tell the motor controller "forward" and "backword"
  var digitalGroupRightA = new five.Pin({
    pin: 2,
    pin: 3,
  });
  var digitalGroupRightB = new five.Pin({
    pin: 4,
    pin: 7,
  });
//group 2
  var digitalGroupLeftA = new five.Pin({
    pin: 8,
    pin: 9,
  });
  var digitalGroupLeftB = new five.Pin({
    pin: 12,
    pin: 13,
  });

  function motorDrive(speed, direction)
  {
    switch(direction)
    {
      case 'forward':
      {
        digitalGroupRightA.low();
        digitalGroupRightB.high();

        digitalGroupLeftA.low();
        digitalGroupLeftB.high();

        motorGroupRight.start(speed);
        motorGroupLeft.start(speed);
      }
      case 'backward':
      {
        digitalGroupRightA.high();
        digitalGroupRightB.low();

        digitalGroupLeftA.high();
        digitalGroupLeftB.low();

        motorGroupRight.start(speed);
        motorGroupLeft.start(speed);
      }
      default:
      {
        //stops all motors
        digitalGroupRightA.low();
        digitalGroupRightB.low();

        digitalGroupLeftA.low();
        digitalGroupLeftB.low();

        motorGroupRight.start(0);
        motorGroupLeft.start(0);
      }
    }
  }

  function rightTurn(speed, minusSpeed)
  {
    digitalGroupRightA.low();
    digitalGroupRightB.high();

    digitalGroupLeftA.low();
    digitalGroupLeftB.high();

    motorGroupRight.start(speed);
    motorGroupLeft.start(minusSpeed);
  }

  function leftTurn(speed, minusSpeed)
  {
    digitalGroupRightA.low();
    digitalGroupRightB.high();

    digitalGroupLeftA.low();
    digitalGroupLeftB.high();

    motorGroupRight.start(minusSpeed);
    motorGroupLeft.start(Speed);
  }

  io.sockets.on('connection', function(socket)
  {
    socket.on('accel', function (data)
    {
        var turnAMP = data.beta;
        var speedGamma = data.gamma;
        var pSpeed = speedGamma * -1 * 2.83;

        if(!(turnAMP > 5 || turnAMP < -5))
        {
          if(speedGamma > 0)
          {
            motorDrive(pSpeed, 'forward');
          }
          else if(speedGamma < 0)
          {
            motorDrive((pSpeed * -1), 'backward');
          }
        }
        else if(turnAMP > 5)
        {
          var right = pSpeed - (turnAmp * 3.64);
          turnRight(pSpeed, right);
        }
        else if(turnAMP < -5)
        {
          var left = pSpeed + (turnAmp * 3.64);
          turnLeft(pSpeed, left);
        }
        else
        {
          motorDrive();
        }
    });

  });
})
