# MTBA Train Schedule
Offline-first transportation schedules for the MTBA (Massachusetts Bay Area) commuter rail schedule.

This App is designed to have some offline first functionality.

Once the user has visited the site and made at least one search, the service worker and IDB will help their
second user experience be decent as well, even if they are offline!

This app will save the most recent search the user has performed, and will return that trip info.

Enjoy! :)

# Installing

Dependencies:

* [Node.js](https://nodejs.org/en/) v0.21.7 or above

Then check out the project and run:

```sh
npm install
```

# Running

```sh
gulp serve
```

You should now have the app server at [localhost:3000](http://localhost:3000)

# Dependencies used:
* Bootstrap
* idb.js
* gulp
* MTBA commuter rail real-time api

#Future Improvements:

* Enable users to see what stops are in between
* Better error messaging when route turns up with no possible trips
