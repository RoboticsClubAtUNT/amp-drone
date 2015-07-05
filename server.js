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
    rotation: 180
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
    dir: 4,
    cdir: 2
  }
});
var motorGroupRight_2 = new five.Motor({
  pins: {
    pwm: 5,
    dir: 7,
    cdir: 6
  }
});

var motorGroupLeft_1 = new five.Motor({
  pins: {
    pwm: 9,
    dir: 10,
    cdir: 8
  }
});
var motorGroupLeft_2 = new five.Motor({
  pins: {
    pwm: 11,
    dir: 13,
    cdir: 12
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
      case 'right':
        motorGroupRight_1.rev(speed);
        motorGroupRight_2.rev(speed);

        motorGroupLeft_1.forward(speed);
        motorGroupLeft_2.forward(speed);
        console.log('Case: right turn');
        break;
      case 'left':
        motorGroupLeft_1.rev(speed);
        motorGroupLeft_2.rev(speed);

        motorGroupRight_1.forward(speed);
        motorGroupRight_2.forward(speed);
        break;
      case 'stop':
        motorGroupRight_1.stop();
        motorGroupRight_2.stop();

        motorGroupLeft_1.stop();
        motorGroupLeft_2.stop();
        console.log('Case: Stop - ', speed);
    }
  }

  io.on('connection', function(socket)
  {
    socket.on('gamepad', function(data)
    {
        var left_Y_Axis = data.axis_Y[0];
        var right_Y_Axis = data.axis_Y[1];
        console.log(left_Y_Axis, right_Y_Axis);

        if ((left_Y_Axis == -1 && right_Y_Axis == -1) || data.dpad[0])
        {
          motorDrive(210, 'forward');
        }
        else if ((left_Y_Axis == 1 && right_Y_Axis == 1) || data.dpad[1])
        {
          motorDrive(210, 'backward');
        }
        else if ((left_Y_Axis == -1 && right_Y_Axis == 1) || data.dpad[3])
        {
          motorDrive(210, 'right');
        }
        else if ((left_Y_Axis == 1 && right_Y_Axis == -1) || data.dpad[2])
        {
          motorDrive(210, 'left');
        }
        else {
          motorDrive(0, 'stop');
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
