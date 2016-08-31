var apikey = "wX9NwuHnZU2ToO7GmGR9uw"

/*generic function using fetch method for JSON response*/
function getJSON(url) {
    return fetch(url).then(function(response) {
        return response.json();
    }).catch(function(error) {
        return Promise.reject(err);
    });
}

/* helper function used to convert the unic time from server into regular time.*/
function convertUnixTime(unix_timestamp) {

    var date = new Date(unix_timestamp * 1000);
    var hours = date.getHours();
    if (hours >= 13) {
        amPm = "PM";
        hours -= 12;
    } else {
        amPm = "AM";
    }
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();

    return hours + ":" + minutes.substr(-2) + " " + amPm;

}


/*  helper function for displaying toast messages to the user!
*/
function displayMessage(message, action_message, dismiss_message, action, actionParams) {

  $("#toast-text").html(message);
  if(action_message === null){
    $("#toast_action").css({"display": "none"});
  }else{
    $("#toast_action").css({"display": "block"});
    $("#toast_action").html(action_message);
  }

  $("#toast").show("slow");

  $("#toast_action").click(function(){

    action(actionParams);
    $("#toast").hide("slow");
  });

  $("#toast_dismiss").click(function(){
    $("#toast").hide("slow");
  });

}


/*
function which takes in data about a trip and returns the html trip card
*/
function createTripCard(tripData, departure, destination) {
    var tripID = tripData.trip_id;
    var tripName = tripData.trip_name;
    var start_info = false;
    var end_info = false;
    var predictedStart_info = false;
    var predictedEnd_info = false;
    var d = new Date();
    d = d.getTime() / 1000;
    var predictionDom = "<div class='prediction onTime'> ON TIME</div>";

    tripData.stop.forEach(function(stop) {
        if (stop.stop_id == departure) {
            start_info = stop;
        }
        if (stop.stop_id == destination) {
            end_info = stop;
        }
    });

    /* sometimes two stops on a line don't actually go to each other...*/
    if (!start_info || !end_info) {
        return 0;
    } else {

        var duration = (end_info.sch_arr_dt - start_info.sch_arr_dt) / 60;
        var apiurl = "http://realtime.mbta.com/developer/api/v2/predictionsbytrip?api_key=" + apikey + "&trip=" + tripID + "&format=json";

        /* get predictin information (delays and alerts) for that trip
        if the train is late or early, update the time and put a message, otherwise say it's on time.
        ** Note: This API call will return a 404 no data if the predicted stop doesn't have info yet.
        This is by design but will have no negative impact on the app itself.*/
        getJSON(apiurl)
            .then(function(json) {
                if (!json.error) {

                    json.stop.forEach(function(predictedStop) {

                        if (predictedStop.stop_id == departure) {
                            predictedStart_info = predictedStop;
                        }
                        if (predictedStop.stop_id == destination) {
                            predictedEnd_info = predictedStop;
                        }
                    });

                    // if the train is a minute or more behind schedule, let's inform the user
                    // NOTE:  this very rarely happens
                    if ((predictedEnd_info.pre_dt - end_info.sch_arr_dt) / 60 >= 1 || (predictedStart_info.pre_dt - start_info.sch_arr_dt) / 60 >= 1) {

                        var delay = Math.min((predictedEnd_info.pre_dt - end_info.sch_arr_dt), (predictedStart_info.pre_dt - start_info.sch_arr_dt));
                        predictionDom = "<div class='prediction late'> DELAYED " + delay + " MINUTES</div>";

                    }
                }

                /* Build a dom with all dat info. */
                var newDom = "<div class='card'>" + predictionDom + "<div class='duration'>Duration: <b>" + duration + " minutes </b></div><br/><div class='depart'>Departs from " + start_info.stop_name + " at <b>" + convertUnixTime(start_info.sch_arr_dt) + "</b></div><div class='stops-link'>" + (end_info.stop_sequence - start_info.stop_sequence - 1) + " stops in between</div><div class='arrive'>Arrives in " + end_info.stop_name + " at <b>" + convertUnixTime(end_info.sch_arr_dt) + "</b></div></div>";
                $("#trip-options").append(newDom);

                var route = $("#train-line").val();
                var data = {
                  route_id: route,
                  trip_start: departure,
                  trip_end: destination,
                  trip_id: tripID,
                  tripCard: newDom
                };

                /* save trip data in db */
                var db = openDatabase();
              		db.then(function(db) {
              			var tx = db.transaction('trips', 'readwrite');
              			var store = tx.objectStore('trips');
              			store.put(data);
              			return tx.complete;
              		}).catch(function(error){
                    console.log(error);
                  });

            }).catch(function(error) {
                displayMessage(error, null, 'dismiss');
            });
    }
}

/*
gets all the trips from url given a route, start, stop, and direction
*/
function getTrips(route, start, stop, direction){

  var queryParam = "&route=" + route + "&max_trips=100&max_time=1440&direction=" + direction;

  var apiurl = "http://realtime.mbta.com/developer/api/v2/schedulebyroute?api_key=" + apikey + queryParam + "&format=json";

  getJSON(apiurl)
    .then(function(json) {
        return json.direction[0].trip;
    }).catch(function(error) {

        displayMessage("Uh oh!  We were unable to retreive your trip from the api.  Want to see your last saved trip?", "Yes!", "dismiss", Controller.showSavedSearch);
        $("#load").css({
            "display": "none"
        });

    }).then(function(tripArray) {
        if(!tripArray){
          reject();
        }else{
          /* clear the database ! */
          Controller.db.then(function(db) {
            var tx = db.transaction('trips', 'readwrite');
            var store = tx.objectStore('trips');
            store.clear();
          });
        }
        $("#load").css({
            "display": "none"
        });

        tripArray.forEach(function(trip) {
            createTripCard(trip, start, stop);
        });


    }).catch(function(error) {

      displayMessage("Uh oh!  We were unable to retreive your trip from the api.  If you previously searched with us, here is your latest search results.  You can still view the map by navigating to \"Route Map\" in the menu.", null, "dismiss", Controller.showSavedSearch());
        $("#load").css({
            "display": "none"
        });
    });

  }

/*
Index controller stuff!
*/

function openDatabase() {
    if (!navigator.serviceWorker) {
        displayMessage("WARNING: your web browser doesn't fully support this app", null, "dismiss");
        return Promise.resolve();
    }

    return idb.open('mtba-trans', 1, function(upgradeDb) {
        var store = upgradeDb.createObjectStore('trips', {
            keyPath: 'trip_id'
        });
    });
}


/*
 Defining the index controller prototype
*/
function IndexController() {

	this.db = openDatabase();
	this.registerServiceWorker();
	this.showSavedSearch();

}


/*
Register our little helper!
*/
IndexController.prototype.registerServiceWorker = function() {

	if ( !('serviceWorker' in navigator) ) {
    displayMessage("WARNING: your web browser doesn't fully support this app.  Try this app in chrome.", null, "dismiss");
		return;
	}

	navigator.serviceWorker
	.register('./service-worker.js', { scope: './' })
	.then(function(reg) {

		if (reg.waiting) {

			displayMessage("New update available!", "Refresh", "dismiss", function(worker){
				worker.postMessage({ action: 'skipWaiting' });
			}, reg.waiting);

			return;
		}

    if (reg.installing) {
      Controller.trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function() {
      Controller.trackInstalling(reg.installing);
    });

	})
	.catch(function(err) {
		console.log('Service Worker Failed to Register', err);
	});

  /* useful tip on preventing chrome from refreshing endlessly when
  update on reload is checked (from Jake Archibalds' wittr)*/
  var refreshing;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (refreshing) return;
    window.location.reload();
    refreshing = true;
  });

};

/*
We have to watch our index controller if it's status is installing
*/
IndexController.prototype.trackInstalling = function(worker) {
  var indexController = this;
  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      displayMessage("New Update available!", "update now!", "dismiss", function(worker) {
				worker.postMessage({ action: 'skipWaiting' });
			}, worker);
    }
  });
};


/* this shows a saved search from our database.
The saved search shows up automatically on page load if there is something stored,
aka if the user has been here before, or if we can't connect to a search we can show them this!*/

IndexController.prototype.showSavedSearch = function() {

  var indexController = this;

	this.db.then(function(db) {

    if (!db){
      console.log('No database!');
      return;
    }
		var tx = db.transaction('trips', 'readwrite');
		var store = tx.objectStore('trips');

		return store.getAll();

	}).catch(function(err){
  }).then(function(response) {

		if ( response.length === 0 ) {

			return Promise.reject();
		} else {

      var cardDom = "<div class='card-title'>Trip info for <b>" + response[0].route_id + "</b><br /><b>" + response[0].trip_start + "</b> to <b>" + response[0].trip_end + "</b></div>";

			// return the previous search from the db.
      response.forEach(function(trip){
        cardDom += trip.tripCard;
      });

      $("#trip-options").html(cardDom);


		}

	}).catch(function(error){

  });
};

var Controller = new IndexController();


/*  jquery dom actions to listen for! */
$(document).ready(function() {


    /*  Get our default list of routes */
    getJSON('assets/data/routes.json')
        .then(function(json) {
            var lineDropdown = "";
            json.mode.forEach(function(mode) {
                lineDropdown += "<option disabled>--" + mode.mode_name + "--</option>";
                mode.route.forEach(function(line) {
                    lineDropdown += "<option value='" + line.route_id + "'>" + line.route_name + "</option>";
                });
            });
            return lineDropdown;
        }).then(function(innerhtml) {
            $("#train-line").html(innerhtml);
        }).catch(function(error) {
            console.log(error);
        });

    $("#train-line").change(function() {
        $("#trip-options").html(" ");
        getJSON('assets/data/' + this.value + '.json')
            .then(function(json) {

                var stopList = "<option value='none' selected>--</option>";
                json.direction[0].stop.forEach(function(stop) {
                    stopList += "<option value='" + stop.stop_id + "'>" + stop.stop_name + "</option>";
                });
                return stopList;
            }).then(function(stopList) {
                $("#departing-stop").html(stopList);
                $("#destination-stop").html(stopList);
                $("#station-selection").removeClass('hidden');
            }).catch(function(error) {
                console.log(error);
            });
    });

    // prevent from being able to pick same station in to and from fields.
    $("#destination-stop").change(function() {
        if (this.value != "none" && $("#departing-stop").value != "none") {
            $('#findTrain').prop('disabled', false);
        } else {
            $('#findTrain').prop('disabled', true);
        }
    });

    $("#departing-stop").change(function() {
        if (this.value != "none" && $("#destination-stop").value != "none") {
            $('#findTrain').prop('disabled', false);
        } else {
            $('#findTrain').prop('disabled', true);
        }
    });

    $("#findTrain").click(function(e) {
        var route = $("#train-line").val();
        var start = $("#departing-stop").val();
        var stop = $("#destination-stop").val();


        // Figure out if we are outbound or inbound
        var direction;
        if ($("#departing-stop").prop('selectedIndex') == $("#destination-stop").prop('selectedIndex')){
            displayMessage("Are you trying to trick me?  Departing stop and returning stop must be different", null, "dismiss");
            return;
        }else if ($("#departing-stop").prop('selectedIndex') < $("#destination-stop").prop('selectedIndex')) {
            direction = 0;
        } else {
            direction = 1;
        }

        /* add loading icon */
        $("#load").css({
            "display": "block"
        });
        $("#trip-options").html("");

        getTrips(route, start, stop, direction);
    });

});
