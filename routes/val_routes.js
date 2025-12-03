const path = require('path')
const express = require('express')
const router = express.Router();
const sql = require('mssql');

//Create connection string
const config = {
  user: 'pelican-ro',
  password: ' mbari-deepsea-1',
  server: 'foggy',   
  database: 'PELICAN',
  options: {
    encrypt: true,      
    trustServerCertificate: true
  }
};

const pool = sql.connect(config)

router.get('/val_app', (req, res, next) => {
  index_path = path.join(__dirname,'..','public','val_index.html')
  res.sendFile(index_path);
});

//NOTE! The callback function in router.get has to be asynchronous in order
//to accommodate the await statements.
router.get('/val_app/:param_names', async(req, res, next) => {
    //In the above construction, param_names corresponds to anything that is entered
    //after params/. get_profile_data appends a list of parameters to /params. The
    //list of parameters can then be extracted using req.params.param_names.
    const selected_columns = req.params.param_names
    const query = `SELECT ${selected_columns},WMO,CRUISE FROM [shipboard.profile_data]`

    try{
        //The following resolves the pool promise. The result, connected_pool,
        //is a pool of connections to the database.
        const connected_pool = await pool
        //connectedPool.request opens a new SQL request object.
        //.query() executes the query and returns a promise that is
        //resolved by the await statement.
        const result = await connected_pool.request().query(query); 
        //result.recordset is an array of the rows returned by the query. res.json() returns
        //the result in a json format. Express would also return the object as json by default
        //if res.send was used.
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});

router.get('/get_wmo/:max_distance',async(req,res,next)=>{
  const max_distance = req.params.max_distance;
    try{
        const connected_pool = await pool
        const result = await connected_pool.request()
        .input("max_distance",max_distance)
        .query(`SELECT * FROM [shipboard.meta_data]
                WHERE DIST < @max_distance`); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
})

router.post('/map_data',async(req,res,next)=>{
  const max_distance = req.body.max_dist;
  const selected_param = req.body.selected_param;
    try{
        const connected_pool = await pool
        const result = await connected_pool.request()
        .input("max_distance",max_distance)
        .input("selected_param",selected_param)
        .query(`SELECT * FROM [shipboard.anomaly_data]
                WHERE DIST < @max_distance AND PARAM = @selected_param`); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
})

module.exports = router;