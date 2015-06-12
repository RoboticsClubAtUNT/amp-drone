var express = require('express');
var app = express();

app.use('/static', express.static('public'));

app.get('/', function (req, res)
{
    var options = {
      root: __dirname + '/',
      dotfiles: 'deny',
      headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
      }
    };

    res.sendFile('/public/index.html', options, function (err)
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

var server = app.listen(92, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});


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
        console.log('forward_motorDrive');
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
    motorGroupLeft.start(speed);
  }

  io.sockets.on('connection', function(socket)
  {
    socket.on('accel', function (data)
    {
        var turnAMP = data.beta;
        var speedGamma = data.gamma;
        var pSpeed = speedGamma * -1 * 2.83;

        console.log(data.gamma);

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
