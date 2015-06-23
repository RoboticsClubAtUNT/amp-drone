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
var motorGroupRight_1 = new five.Motor({
  pins: {
    pwm: 3,
    dir: 2,
    cdir: 4
  }
});
var motorGroupRight_2 = new five.Motor({
  pins: {
    pwm: 5,
    dir: 6,
    cdir: 7
  }
});

var motorGroupLeft_1 = new five.Motor({
  pins: {
    pwm: 9,
    dir: 8,
    cdir: 10
  }
});
var motorGroupLeft_2 = new five.Motor({
  pins: {
    pwm: 11,
    dir: 12,
    cdir: 13
  }
});

  function motorDrive(speed, direction)
  {
    switch(direction)
    {
      case 'forward':
        motorGroupRight_1.forward(speed);
        motorGroupRight_2.forward(speed);

        motorGroupLeft_1.forward(speed);
        motorGroupLeft_2.forward(speed);

        console.log('Case: forward');
        break;
      case 'backward':
        motorGroupRight_1.rev(speed);
        motorGroupRight_2.rev(speed);

        motorGroupLeft_1.rev(speed);
        motorGroupLeft_2.rev(speed);
        console.log('Case: backward');
        break;
      case 'stop':
        motorGroupRight_1.stop(speed);
        motorGroupRight_2.stop(speed);

        motorGroupLeft_1.stop(speed);
        motorGroupLeft_2.stop(speed);
    }
  }

  function rightTurn(speed, minusSpeed)
  {
      motorGroupRight_1.rev(minusSpeed);
      motorGroupRight_2.rev(minusSpeed);

      motorGroupLeft_1.forward(speed);
      motorGroupLeft_2.forward(speed);
      console.log('Case: right turn');
  }

  function leftTurn(speed, minusSpeed)
  {
      motorGroupLeft_1.rev(minusSpeed);
      motorGroupLeft_2.rev(minusSpeed);

      motorGroupRight_1.forward(speed);
      motorGroupRight_2.forward(speed);

      console.log('Case: Left turn');
  }

  io.on('connection', function(socket)
  {
    socket.on('mag', function (data)
    {
        var turnAMP = data.Results[0];
        var speedGamma = data.Results[1];
        var pSpeed = speedGamma * -2.83;

        // console.log('gamma' + data.Results[1]);
        // console.log('beta' + data.Results[0]);

        if(turnAMP < 5 && turnAMP > -5)
        {
          if(speedGamma > -10)
          {
            motorDrive(pSpeed, 'forward');
          }
          else if(speedGamma < 10)
          {
            motorDrive((pSpeed), 'backward');
          }
        }
        else if(turnAMP > 5)
        {
          var right = pSpeed - (turnAMP * 3.64);
          rightTurn(pSpeed, right);
        }
        else if(turnAMP < -5)
        {
          var left = pSpeed + (turnAMP * 3.64);
          leftTurn(pSpeed, left);
        }
        else
        {
          motorDrive(pSpeed, 'forward');
        }
    });

    socket.on('autoDrive', function (data)
    {
      motorDrive(255, 'forward');
      console.log('forward_func');
    });

  });

})
