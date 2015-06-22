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
  motor = new five.Motor({
     pins: {
       pwm: 9,
       dir: 8,
       cdir: 11
     }
   });




   board.repl.inject({
     motor: motor
   });

   motor.on("start", function(err, timestamp) {
     console.log("start", timestamp);
   });

   motor.on("stop", function(err, timestamp) {
     console.log("automated stop on timer", timestamp);
   });

   motor.on("brake", function(err, timestamp) {
     console.log("automated brake on timer", timestamp);
   });

   motor.on("forward", function(err, timestamp) {
     console.log("forward", timestamp);

     // demonstrate switching to reverse after 5 seconds
     board.wait(5000, function() {
       motor.reverse(255);
     });
   });

   motor.on("reverse", function(err, timestamp) {
     console.log("reverse", timestamp);

     // demonstrate braking after 5 seconds
     board.wait(5000, function() {

       // Brake for 500ms and call stop()
       motor.brake(500);
     });
   });

   // set the motor going forward full speed
   motor.forward(255);
  });
  // function motorDrive(speed, direction)
  // {
  //   switch(direction)
  //   {
  //     case 'forward':
  //     {
  //       motorGroupRight.forward(speed);
  //       console.log('forward_motorDrive');
  //     }
  //     case 'backward':
  //     {
  //       motorGroupRight.reverse(170);
  //       console.log('reverse_motorDrive');
  //     }
  //     default:
  //     {
  //       //stops all motors
  //       motorGroupRight.stop();
  //       console.log('stop');
  //     }
  //   }
  // }
  //
  // io.on('connection', function(socket)
  // {
  //   socket.on('mag', function (data)
  //   {
  //       var turnAMP = data.Results[0];
  //       var speedGamma = data.Results[1];
  //       var pSpeed = speedGamma * -1 * 2.83;
  //
  //       // console.log('gamma' + data.Results[1]);
  //       // console.log('beta' + data.Results[0]);
  //
  //       if(!(turnAMP > 5 || turnAMP < -5))
  //       {
  //         if(speedGamma > 0)
  //         {
  //           motorDrive(pSpeed, 'forward');
  //         }
  //         else if(speedGamma < 0)
  //         {
  //           motorDrive((pSpeed * -1), 'backward');
  //         }
  //       }
  //       else if(turnAMP > 5)
  //       {
  //         var right = pSpeed - (turnAMP * 3.64);
  //         rightTurn(pSpeed, right);
  //       }
  //       else if(turnAMP < -5)
  //       {
  //         var left = pSpeed + (turnAMP * 3.64);
  //         leftTurn(pSpeed, left);
  //       }
  //       else
  //       {
  //         motorDrive(pSpeed, 'forward');
  //       }
  //   });
  //
  //   socket.on('autoDrive', function (data)
  //   {
  //     motorDrive(255, 'forward');
  //     console.log('forward_func');
  //   });
  //
  // });

})
