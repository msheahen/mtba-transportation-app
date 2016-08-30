
var apikey = "wX9NwuHnZU2ToO7GmGR9uw"

/* method for fetching json response data from a location */
function getJSON(url){
  return fetch(url).then(function(response){
    return response.json();
  }).catch(function(error){
    return error;
  });
}

function convertUnixTime(unix_timestamp){

  var date = new Date(unix_timestamp*1000);
  var hours = date.getHours();
  if(hours >= 13){
    amPm = "PM";
    hours -= 12;
  }else {
    amPm = "AM";
  }
  var minutes = "0" + date.getMinutes();
  var seconds = "0" + date.getSeconds();

  return hours + ":" + minutes.substr(-2) + " " + amPm;

}


function displayMessage(type, message) {

	if(type == 'error'){
    toastr.error(message);
  }else if(type == 'warning'){
    toastr.warning(message);
  }else{
    toastr.info(message);
  }

}

function createTripCard(tripData, departure, destination){
  var tripID = tripData.trip_id;
  var tripName = tripData.trip_name;
  var start_info = false;
  var end_info = false;
  var predictedStart_info = false;
  var predictedEnd_info = false;
  var d = new Date();
  d = d.getTime()/1000;
  var predictionDom = "<div class='prediction onTime'> ON TIME</div>";;

  tripData.stop.forEach(function(stop){
    if(stop.stop_id == departure){
      start_info = stop;
    }
    if(stop.stop_id == destination){
      end_info = stop;
    }
  });

  if(!start_info || !end_info){
    return 0;
  }else{

    var duration = (end_info.sch_arr_dt - start_info.sch_arr_dt)/60;
    var apiurl = "http://realtime.mbta.com/developer/api/v2/predictionsbytrip?api_key=" + apikey + "&trip=" + tripID + "&format=json";

    /* get predictin information (delays and alerts) for that trip
    if the train is late or early, update the time and put a message, otherwise say it's on time.*/
    getJSON(apiurl)
    .then(function(json){
      if(!json.error){

        json.stop.forEach(function(predictedStop){
          console.log(predictedStop);
          if(predictedStop.stop_id == departure){
            predictedStart_info = predictedStop;
          }
          if(predictedStop.stop_id == destination){
            predictedEnd_info = predictedStop;
          }
        });

        // if the train is a minute or more behind schedule, let's inform the user
        if((predictedEnd_info.pre_dt - end_info.sch_arr_dt)/60 >= 1 || (predictedStart_info.pre_dt - start_info.sch_arr_dt)/60 >= 1) {
          console.log((predictedEnd_info.pre_dt - end_info.sch_arr_dt)/60);
          var delay = Math.min((predictedEnd_info.pre_dt - end_info.sch_arr_dt), (predictedStart_info.pre_dt - start_info.sch_arr_dt));
          predictionDom = "<div class='prediction late'> DELAYED " + delay + " MINUTES</div>";
          //console.log(predictedEnd_info.pre_dt - end_info.sch_arr_dt);
        }
      }

      /* Build a dom with all dat info. */
      var newDom = "<div class='card'>" + predictionDom + "<div class='duration'>Duration: <b>" + duration + " minutes </b></div><br/><div class='depart'>Departs from " + start_info.stop_name + " at <b>" + convertUnixTime(start_info.sch_arr_dt) + "</b></div><a class='stops-link'>" + (end_info.stop_sequence -  start_info.stop_sequence - 1) + " stops in between</a><div class='arrive'>Arrives in " + end_info.stop_name + " at <b>" + convertUnixTime(end_info.sch_arr_dt) + "</b></div></div>";
      $("#trip-options").append(newDom);

    }).catch(function(error){
      displayMessage('error', error);
    });
  }
}


  /* Then we have to parse the json data to get stop times for
  their start and stop and display the answer!
  */



/*getJSON(apiurl).then(function(response){

  var allPromises = response.mode.map(function(response){
      return
  });
  return Promise.all(allPromises);
}).catch(function(error){
  console.log(error);
}).then(function(arrayOfPlanetData){

}).catch(function(error){
  console.log(error);
});
console.log(response.mode[0].mode_name);
*/


function IndexController() {

	this._dbPromise = this._setupDB();
	this._registerServiceWorker();
	this.showDefaultJourney();

}


IndexController.prototype._setupDB = function() {
	if (!navigator.serviceWorker) { return Promise.resolve(); }

	return idb.open('mtba-trans', 2, function(upgradeDb) {

	});
};

IndexController.prototype._registerServiceWorker = function() {

	if ( !('serviceWorker' in navigator) ) {
		return;
	}


	navigator.serviceWorker
	.register('./service-worker.js', { scope: './' })
	.then(function(reg) {
		//console.log('Service Worker Registered', reg);

		if (reg.waiting) {

	     console.log('service worker waiting');
			return;
		}

	})
	.catch(function(err) {
		console.log('Service Worker Failed to Register', err);
	});

	navigator.serviceWorker.addEventListener('controllerchange', function() {
		//window.location.reload();
	});

};

IndexController.prototype.showDefaultJourney = function() {

	var prototype = this;

	this._dbPromise.then(function(db) {
    db.transaction.objectStore('store');

		return store.getAll();

	}).then(function(response) {

		if ( response.length == 0 ) {

			return Promise.reject();
		} else {

			// RETURN THE LAST ITEM IN THE DATABASE
			//new Journey(null, response[ response.length - 1 ]);
      console.log("can't connect");
		}

	});
};



var Controller = new IndexController();




$(document).ready(function(){


/*  Get our default list of routes */
  getJSON('./assets/data/routes.json')
    .then(function(json){
      var lineDropdown = "<option>---</option>";
      json.mode.forEach(function(mode){
        lineDropdown += "<option disabled>--" + mode.mode_name + "--</option>";
        mode.route.forEach(function(line){
          lineDropdown += "<option value='" + line.route_id + "'>" + line.route_name + "</option>";
        });
      });
      return lineDropdown;
    }).then(function(innerhtml){
      $("#train-line").html(innerhtml);
    }).catch(function(error){
      console.log(error);
    });

    $("#train-line").change(function(){

      /*var apikey = "wX9NwuHnZU2ToO7GmGR9uw"
      http://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key=wX9NwuHnZU2ToO7GmGR9uw&route=Red&format=json
      var apiurl = "http://realtime.mbta.com/developer/api/v2/stopsbyroute?route=" + this.value + "&api_key=" + apikey + "&format=json";
      */

      getJSON('./assets/data/' + this.value + '.json')
        .then(function(json){
          var stopList = "<option value='none' selected>--</option>";
          json.direction[0].stop.forEach(function(stop){
            stopList += "<option value='" + stop.stop_id + "'>" + stop.stop_name + "</option>";
          });
          return stopList;
        }).then(function(stopList){
          $("#departing-stop").html(stopList);
          $("#destination-stop").html(stopList);
          $("#station-selection").removeClass('hidden');
        }).catch(function(error){
          console.log(error);
        });
      });

      // prevent from being able to pick same station in to and from fields.
      $("#destination-stop").change(function(){
        if(this.value != "none" && $("#departing-stop").value != "none"){
          $('#findTrain').prop('disabled', false);
        }else{
          $('#findTrain').prop('disabled', true);
        }
      });

      $("#departing-stop").change(function(){
        if(this.value != "none" && $("#destination-stop").value != "none"){
          $('#findTrain').prop('disabled', false);
        }else{
          $('#findTrain').prop('disabled', true);
        }
      });

      $("#findTrain").click(function(e){
        var route = $("#train-line").val();
        var start = $("#departing-stop").val();
        var stop = $("#destination-stop").val();
        var query = "schedulebyroute";

        /* add loading icon */
        $("#load").css({"display": "block"});
        $("#trip-options").html("");

        // Figure out if we are outbound or inbound
        var direction;
        if($("#departing-stop").prop('selectedIndex') < $("#destination-stop").prop('selectedIndex')){
          direction = 0;
        }else{
          direction = 1;
        }

        var queryParam = "&route=" + route + "&max_trips=100&max_time=1440&direction=" + direction;

        var apiurl = "http://realtime.mbta.com/developer/api/v2/" + query + "?api_key=" + apikey + queryParam + "&format=json";


        getJSON(apiurl)
          .then(function(json){
            console.log(json);
            return json.direction[0].trip;
          }).catch(function(error){

            displayMessage('error', error);
            $("#load").css({"display": "none"});

          }).then(function(tripArray){
            $("#trip-options").html(" ");
            $("#load").css({"display": "none"});
            tripArray.forEach(function(trip){
              createTripCard(trip, start, stop);
            });
          }).catch(function(error){

            displayMessage('error', "Sorry, no trips with those parameters at this time.");
            $("#load").css({"display": "none"});

          });
        });

      });
