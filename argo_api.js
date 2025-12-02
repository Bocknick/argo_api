// Install dependencies first:
const express = require('express');
const cors = require('cors')
const path = require('path');

//Create a connection pool using sql.connect. pool is 
//only a promise. pool is resolved within the context
//of an asynchronous function via await

//Create an express app as app
const app = express();

//Create a router to manage the various routes defined belowx

//Enable Cross Origin Resource Sharing. A browser may restrict responses from different
//origins. By including a cors header in responses, the node.js script ensures that 
//the browser will accept responses from the server.
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
const qc_routes = require('./routes/qc_routes')
const val_routes = require('./routes/val_routes')
app.use(qc_routes);
app.use(val_routes);


//NOTE! The callback function in router.get has to be asynchronous in order
//to accommodate the await statements.

app.listen(3000);