const path = require('path')
const express = require('express')
const router = express.Router();
const sql = require('mssql');

//Create connection string
const config = {
  user: 'pelican-ro',
  password: 'mbari-deepsea-1',
  server: 'foggy',   
  database: 'PELICAN',
  options: {
    encrypt: true,      
    trustServerCertificate: true
  }
};

const pool = sql.connect(config)

router.get('/audit_app', (req, res, next) => {
  console.log("path accessed")
  index_path = path.join(__dirname,'..','views','audit_index.html')
  res.sendFile(index_path);
});


router.post('/FLT_SURF', async(req, res, next) => {
    const thresh = req.body.thresh;
    const query = `SELECT WMO, ID, LON, LAT, FLT_SURF_Z AS METRIC
                   FROM doxy_qc_meta 
                   WHERE abs(FLT_SURF_Z) >= ${thresh} 
                   AND abs(WOA_SURF_Z) < ${thresh}`

    try{
        const connected_pool = await pool
        const result = await connected_pool.request().query(query); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});

router.post('/FLT_DEEP', async(req, res, next) => {
    const thresh = req.body.thresh;
    const query = `SELECT WMO, ID, LON, LAT, FLT_DEEP_Z AS METRIC
                   FROM doxy_qc_meta 
                   WHERE abs(FLT_DEEP_Z) >= ${thresh} 
                   AND abs(WOA_DEEP_Z) < ${thresh}`

    try{
        const connected_pool = await pool
        const result = await connected_pool.request().query(query); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});


router.post('/FLT_SURF_DEEP', async(req, res, next) => {
    const thresh = req.body.thresh;
    const query = `SELECT WMO, ID, LON, LAT, FLT_SURF_Z AS METRIC
                   FROM doxy_qc_meta 
                   WHERE abs(FLT_DEEP_Z) >= ${thresh} 
                   AND abs(WOA_DEEP_Z) < ${thresh}
                   AND abs(FLT_SURF_Z) >= ${thresh} 
                   AND abs(WOA_SURF_Z) < ${thresh}`

    try{
        const connected_pool = await pool
        const result = await connected_pool.request().query(query); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});

router.post('/SURF_GAIN', async(req, res, next) => {
    const thresh = req.body.thresh;
    const query = `SELECT WMO, ID, LON, LAT, SURF_GAIN_Z AS METRIC
                   FROM doxy_qc_meta 
                   WHERE abs(SURF_GAIN_Z) >= ${thresh}`

    try{
        const connected_pool = await pool
        const result = await connected_pool.request().query(query); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});

router.post('/post_qc_list', async(req,res, next) =>{
    const request = new sql.Request();
    json_data = req.bod
    // Loop through JSON array and insert each record
    for (const row of jsonData) {
        await request
            .input('param', sql.VarChar, row.PARAM)
            .input('cycle', sql.Int, row.CYCLE)
            .input('gain', sql.Float, row.GAIN)
            .input('offset', sql.Float, row.OFFSET)
            .input('drift', sql.Float, row.DRIFT)
            .query(`
                INSERT INTO QC_TEST (PARAM, CYCLE, GAIN, OFFSET, DRIFT)
                VALUES (@param, @cycle, @gain, @offset, @drift)
            `);
    }
})  

router.post('/DEEP_GAIN', async(req, res, next) => {
    const thresh = req.body.thresh;
    const query = `SELECT WMO, ID, LON, LAT, DEEP_GAIN_Z AS METRIC
                   FROM doxy_qc_meta 
                   WHERE abs(DEEP_GAIN_Z) >= ${thresh}`

    try{
        const connected_pool = await pool
        const result = await connected_pool.request().query(query); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});

router.post('/DEEP_SURF_GAIN', async(req, res, next) => {
    const thresh = req.body.thresh;
    const query = `SELECT WMO, ID, LON, LAT, SURF_GAIN_Z AS METRIC
                   FROM doxy_qc_meta 
                   WHERE abs(DEEP_GAIN_Z) >= ${thresh}
                   AND abs(SURF_GAIN_Z) >= ${thresh}`

    try{
        const connected_pool = await pool
        const result = await connected_pool.request().query(query); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});

router.post('/SPIKES', async(req, res, next) => {
    const thresh = req.body.thresh;
    const query = `SELECT WMO, ID, LON, LAT, MAX_SPIKES_Z AS METRIC
                   FROM doxy_qc_meta 
                   WHERE abs(MAX_SPIKES_Z) >= ${thresh}`

    try{
        const connected_pool = await pool
        const result = await connected_pool.request().query(query); 
        res.json(result.recordset)
    }catch (err) {
         console.error('Database error:', err);
         res.status(500).json({ error: err.message });
    }
});

router.get('/selected_wmo/:wmo', async(req, res, next) => {
    //In the above construction, param_names corresponds to anything that is entered
    //after params/. get_profile_data appends a list of parameters to /params. The
    //list of parameters can then be extracted using req.params.param_names.
    const selected_wmo = req.params.wmo
    const query = `SELECT * FROM doxy_qc_profs 
                   WHERE WMO = ${selected_wmo}`

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

router.get('/selected_ts_wmo/:wmo', async(req, res, next) => {
    //In the above construction, param_names corresponds to anything that is entered
    //after params/. get_profile_data appends a list of parameters to /params. The
    //list of parameters can then be extracted using req.params.param_names.
    const selected_wmo = req.params.wmo
    const query = `SELECT * FROM doxy_qc_meta 
                   WHERE WMO = ${selected_wmo}`

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

module.exports = router;
