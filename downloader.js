/*global require, console*/

(function () {
    "use strict";

    var github = require('octonode'),
        fs = require('fs'),

        //read in config.json /*379396*/
        config = require('./config.json'),

        //create github client
        client = github.client({
            id: config.clientID,
            secret: config.clientSecret
        }),

        db = require('orchestrate')(config.orchestrateKey);

    function saveState(since) {

        config.since = since;

        fs.writeFile('config.json', JSON.stringify(config, null, 4), function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("State saved in config.json");
            }
        });
    }

    function getRepos(since) {

        //get repositories since last id
        client.get('/repositories', {
            "since": since
        }, function (err, status, body, headers) {

            if (typeof body === 'undefined') {
                console.log("Out of requests.");
                console.log("More requests available at: ");
                client.get('/rate_limit', {}, function (err, status, body, headers) {

                    //convert time since epoch to date
                    var d = new Date(0);
                    d.setUTCSeconds(body.resources.core.reset);

                    //print reset time
                    console.log(d.toUTCString());

                    //if we have seen new repos
                    if (config.since !== since) {

                        //save our state
                        saveState(since);
                    }
                });
            } else {

                //loop over each repository
                for (var i = 0; i < body.length; i++) {

                    var currRepo = body[i];

                    //make sure that the repo is public, from a user (not organization), and not a fork
                    if (!currRepo.private && currRepo.owner.type == 'User' && !currRepo.fork) {

                        //get the repo information
                        client.get('/repos/' + currRepo.owner.login + '/' + currRepo.name, {}, function (err, status, body, headers) {

                            //if there was no error and the repo is written in C++ or C
                            if (!err && (body.language == 'C++' || body.language == 'C')) {

                                (function (repo) {
                                    client.get('/repos/' + body.owner.login + '/' + body.name + '/contributors', {}, function (err, status, body, headers) {

                                        //if there was no error, there is only one contributor, and there were at least 10 contributions
                                        if (!err && body.length == 1 && body[0].contributions >= 10) {
                                            console.log(repo.id + " : " + repo.html_url);
                                            db.put(config.collection, repo.id, repo)
                                                .then(function (result) {

                                                })
                                                .fail(function (err) {
                                                    console.log(err);
                                                })
                                        }
                                    });
                                })(body);
                            }
                        });
                    }
                }

                getRepos(body[body.length - 1].id);
            }
        });
    }

    getRepos(config.since);
})();