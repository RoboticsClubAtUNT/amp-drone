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
      res.writeHead(200);
      res.end(data);
      }
   );
   console.log('Connection');
}


//set board to ready state to start transfer of data
board.on('ready', function () {

// Motor
  var motorGroupRight = new five.Motor({
    pins: {
      pwm: 3,
      dir: 2,
      cdir: 4
    }
  });

  function motorDrive(speed, direction)
  {
    switch(direction)
    {
      case 'forward':
      {
        motorGroupRight.forward(speed);
        console.log('forward_motorDrive');
      }
      case 'backward':
      {
        motorGroupRight.reverse(170);
        console.log('reverse_motorDrive');
      }
      // default:
      // {
      //   //stops all motors
      //   motorGroupRight.stop();
      //   console.log('stop');
      // }
    }
  }

  io.on('connection', function(socket)
  {
    socket.on('mag', function (data)
    {
        var turnAMP = data.Results[0];
        var speedGamma = data.Results[1];
        var pSpeed = speedGamma * -1 * 2.83;

        // console.log('gamma' + data.Results[1]);
        // console.log('beta' + data.Results[0]);

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
