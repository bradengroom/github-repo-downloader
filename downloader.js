var github = require('octonode');
var fs = require('fs');

//read in config.json
var config = require('./config.json');

//create github client
var client = github.client({
  id: config.clientID,
  secret: config.clientSecret
});

getRepos(config.since);

function  getRepos(since) {

  //get repositories since last id
  client.get('/repositories', {"since": since}, function (err, status, body, headers) {

    //loop over each repository
    for (var i = 0; i < body.length; i++) {

      var currRepo = body[i];

      //make sure that the repo is public, from a user (not organization), and not a fork
      if (!currRepo.private && currRepo.owner.type == 'User' && !currRepo.fork) {

        //get the repo information
        client.get('/repos/' + currRepo.owner.login + '/' + currRepo.name, {}, function (err, status, body, headers) {

          //if there was no error and the repo is written in C++ or C
          if(!err && (body.language == 'C++' || body.language == 'C' )){

            /*client.get('/repos/' +body.owner.login + '/' + body.name + '/contributors', {}, function (err, status, body, headers) {

              //if there was no error, there is only one contributor, and there were at least 10 contributions
              if (!err && body.length == 1 && body[0].contributions >= 10) {
                console.log(body[]);
                console.log(body[0].id + " : " + currRepo.html_url);
              }
            });*/

            console.log(body.id,body.html_url);
          }
        });
      }
    }

    getRepos(body[body.length-1].id);
  });
}

function saveState(config, since) {

  config.since = since;

  fs.writeFile('config.json', JSON.stringify(config, null, 4), function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("JSON saved to ");
      config.password = req.body.new;
    }
  });
}
