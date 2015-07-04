var express = require('express');
var app = express();
var port = 3030;
var io = require('socket.io').listen(app.listen(port));
var five = require('johnny-five');
var RaspiCam = require('raspicam');

var camera = new RaspiCam({
    mode: 'timelapse',
    w: 640,
    h: 480,
    output: '/home/pi/node_programs/amp-drone/public/robot.jpg',
    timeout: 9999999,
    quality: 5,
    timelapse: 100,
    encoding: 'jpg',
    rotation: 0
    });

app.use('/static', express.static('public'));

var board = new five.Board();

app.get('/', function(req, res)
{
    var options = {
      root: __dirname + '/',
      dotfiles: 'allow',
      headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
      }
    };

    res.sendFile('/index.html', options, function(err)
    {
       if (err)
       {
         console.log(err);
         return res.end('Error loading index.html');
       }
       else
       {
           console.log('sent index.html');
       }
    });
});

//set board to ready state to start transfer of data
board.on('ready', function() {

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
    switch (direction)
    {
      case 'forward':
        motorGroupRight_1.forward(speed);
        motorGroupRight_2.forward(speed);

        motorGroupLeft_1.forward(speed);
        motorGroupLeft_2.forward(speed);

        console.log('Case: forward - ', speed);
        break;
      case 'backward':
        motorGroupRight_1.rev(speed);
        motorGroupRight_2.rev(speed);

        motorGroupLeft_1.rev(speed);
        motorGroupLeft_2.rev(speed);
        console.log('Case: backward - ', speed);
        break;
      case 'stop':
        motorGroupRight_1.stop();
        motorGroupRight_2.stop();

        motorGroupLeft_1.stop();
        motorGroupLeft_2.stop();
        console.log('Case: Stop - ', speed);
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
    socket.on('mag', function(data)
    {
        var turnAMP = data.Results[0];
        var speedGamma = data.Results[1] * 2.83;
        var pSpeed = speedGamma * -1;

        // console.log('gamma' + data.Results[1]);
        // console.log('beta' + data.Results[0]);

        if (turnAMP < 5 && turnAMP > -5)
        {
          if (speedGamma > -10)
          {
            motorDrive(speedGamma, 'forward');
          }
          else if (speedGamma < 10)
          {
            motorDrive((pSpeed), 'backward');
          }
        }
        else if (turnAMP > 20)
        {
          rightTurn(190, 190);
        }
        else if (turnAMP < -20)
        {
          leftTurn(190, 190);
        }
        else
        {
          motorDrive(pSpeed, 'stop');
        }
    });

    socket.on('autoDrive', function(data)
    {
      motorDrive(255, 'forward');
      console.log('forward_func');
    });

    socket.on('pic', function(data)
    {
      var process_id = camera.start({});
    });

    camera.on('read', function(err, timestamp, filename)
    {
      //do stuff
      socket.emit('newPic');
    });

    socket.on('stopPic', function(data)
    {
      camera.stop();
    });

  });

});
