var express = require('express');
var app = express();
var port = 3030;
var io = require('socket.io').listen(app.listen(port));
var five = require('johnny-five');
var RaspiCam = require('raspicam');
var exec = require('child_process').exec,
    child;
var psTree = require('ps-tree');

var camera = new RaspiCam({
    mode: 'timelapse',
    w: 480,
    h: 640,
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

    socket.on('auto_drive', function(data)
    {
      if (data == 'face') {
        cmd_python = 'python /home/pi/python/opencv_picam/follow_face.py';
      }
      else if (data == 'color') {
        cmd_python = 'python /home/pi/python/opencv_picam/follow_color.py';
      }
      child = exec(cmd_python,
      function (error, stdout, stderr)
      {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null)
        {
          console.log('exec error: ' + error);
        }
      });
      console.log('running follow_face \npid: ', child.pid);

    });
    socket.on('kill_drive', function(data)
    {
      console.log('killing pid: ', child.pid);
      kill(child.pid);
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


  var kill = function (pid, signal, callback) {
      signal   = signal || 'SIGKILL';
      callback = callback || function () {};
      var killTree = true;
      if(killTree) {
          psTree(pid, function (err, children) {
              [pid].concat(
                  children.map(function (p) {
                      return p.PID;
                  })
              ).forEach(function (tpid) {
                  try { process.kill(tpid, signal) }
                  catch (ex) { }
              });
              callback();
          });
      } else {
          try { process.kill(pid, signal) }
          catch (ex) { }
          callback();
      }
  };
});
