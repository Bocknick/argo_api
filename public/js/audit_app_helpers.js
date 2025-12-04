const base_path = 'https://whimbrel.mbari.org/'
async function get_data(method,thresh){
  const node_route = base_path+method.toString()
  //The entire fetch statement here is embedded within a try/catch structure
  //in order to avoid uncaught errors when they occur.
  try {
    // fetch(node_route) returns a promise. WHAT IS A PROMISE? By placing
    // await in front of fetch, javascript will wait for the promise to be
    // resolved before continuing in the code. The content inside of the brackets
    // is the request content, which can also include a header and a body.
    // Note that 'GET' is the  default method for fetch and so doesn't 
    // actually need to be included.
    const response = await fetch(node_route, 
      {method: 'POST', 
       headers:  { 'Content-Type': 'application/json' },
       body: JSON.stringify({thresh})}) ;
    //If the response does not have an .ok property, an error is created
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    //response.json() also returns a promise, because it takes time to parse
    //the data. Again, await ensures that the code does not continue until
    //the promise is resolved. When the promise is resolved, selected_data is 
    //associated with a json file.
    selected_data = await response.json();
  } catch (err) {
    data_error = err;
    console.error('Fetch error:', err)  ;
  }
  return {selected_data}
}

async function get_profile_data(input_wmo){
  console.log(base_path+'selected_wmo/'+input_wmo.toString())
  const node_route = base_path+'selected_wmo/'+input_wmo.toString()
  //The entire fetch statement here is embedded within a try/catch structure
  //in order to avoid uncaught errors when they occur.
  try {
    // fetch(node_route) returns a promise. WHAT IS A PROMISE? By placing
    // await in front of fetch, javascript will wait for the promise to be
    // resolved before continuing in the code. The content inside of the brackets
    // is the request content, which can also include a header and a body.
    // Note that 'GET' is the  default method for fetch and so doesn't 
    // actually need to be included.
    const response = await fetch(node_route, {method: 'GET' });
    //If the response does not have an .ok property, an error is created
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    //response.json() also returns a promise, because it takes time to parse
    //the data. Again, await ensures that the code does not continue until
    //the promise is resolved. When the promise is resolved, selected_data is 
    //associated with a json file.
    selected_data = await response.json();
  } catch (err) {
    data_error = err;
    console.error('Fetch error:', err);
  }
  return {selected_data}
}

async function get_timeseries_data(input_wmo){
  const node_route = base_path+'selected_ts_wmo/'+input_wmo.toString()
  //The entire fetch statement here is embedded within a try/catch structure
  //in order to avoid uncaught errors when they occur.
  try {
    // fetch(node_route) returns a promise. WHAT IS A PROMISE? By placing
    // await in front of fetch, javascript will wait for the promise to be
    // resolved before continuing in the code. The content inside of the brackets
    // is the request content, which can also include a header and a body.
    // Note that 'GET' is the  default method for fetch and so doesn't 
    // actually need to be included.
    const response = await fetch(node_route, {method: 'GET' });
    //If the response does not have an .ok property, an error is created
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    //response.json() also returns a promise, because it takes time to parse
    //the data. Again, await ensures that the code does not continue until
    //the promise is resolved. When the promise is resolved, selected_data is 
    //associated with a json file.
    selected_data = await response.json();
  } catch (err) {
    data_error = err;
    console.error('Fetch error:', err);
  }
  return {selected_data}
}


async function make_map(plot_data){
  //refresh()
  id_data = plot_data.selected_data.map(row => row["ID"])
  wmo_data = plot_data.selected_data.map(row => row["WMO"])
  lat_data = plot_data.selected_data.map(row => row["LAT"])
  lon_data = plot_data.selected_data.map(row => row["LON"])
  z_data = plot_data.selected_data.map(row => row["METRIC"])

  const {color_scale, min_value, mid_value, max_value } = make_palette(z_data);
  var map = L.map('map_content', {
    center: [0, 0],
    zoom: 2,
    minZoom: 1.85,
    zoomSnap: 0.1,
    //dragging: false,
    maxBounds: [[-90,-180],[90,180]],
    maxBoundsViscosity: 1.0,
    zoomControl: false,
    attributionControl: false})
  
  leafletMap = map; // Save the map so we can remove it later

  const ocean_res = await fetch('https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_ocean.json');
  const ocean = await ocean_res.json();
  L.geoJSON(ocean,{color:'#5BBCD6',
    weight: 0.5,
    color: 'black',
    fillColor: '#ADD8E6',
    fillOpacity: 1,
    pane: "tilePane"}).addTo(map);

  for(let i = 0; i < z_data.length; i++){
    let tooltip_string = `<b>WMO: </b> ${id_data[i]}<br>`
    L.circleMarker([lat_data[i],lon_data[i]],
      {fillColor: color_scale(z_data[i]).hex(),color: "black",weight: 0.5,fillOpacity: 1,radius: 2.5})
    .bindTooltip(tooltip_string, 
      {permanent: false, direction: 'top', offset: [0, -5], fillColor: '#0397A8'})
    .addTo(map)
    .on('click', function () {
      clicked_wmo = [wmo_data[i]];
      clicked_id = [id_data[i]]
      plot_wrapper(clicked_wmo,clicked_id)
    })
  }
map.createPane("graticulePane");
map.getPane("graticulePane").style.zIndex = 650;  // Higher than polygons/circles

L.latlngGraticule({
    showLabel: true,
    color: "black",
    opacity: 0.6,
    zoomInterval: [
        {start: 2, end: 3, interval: 30},
        {start: 4, end: 4, interval: 10},
        {start: 5, end: 7, interval: 5},
        {start: 8, end: 10, interval: 1}
    ],
    pane: "graticulePane"
}).addTo(map);

  return map
}

function plot_wrapper(clicked_wmo,clicked_id){
  get_timeseries_data(clicked_wmo)
    .then(profile_data => make_timeseries_plot(profile_data,clicked_id,thresh))
    .then(plot_object => Plotly.newPlot('timeseries_plot_content',
      plot_object.traces,
      plot_object.layout,
    { displayModeBar: false }
    ).then(()=>{
      const plot_event = document.getElementById('timeseries_plot_content');
      plot_event.on('plotly_click', function(eventData) {
        const point = eventData.points[0];
        const timeseries_id = point.customdata
        plot_wrapper(clicked_wmo,timeseries_id)
      });
    })
  );
  get_profile_data(clicked_wmo)
    .then(profile_data => make_profile_plot(profile_data,clicked_id))
    .then(plot_object => {Plotly.newPlot('profile_plot_content',
      plot_object.traces,
      plot_object.layout,
    { displayModeBar: false }
    ).then(()=>{
      const plot_event = document.getElementById('profile_plot_content');
      plot_event.on('plotly_click', function(eventData) {
        const point = eventData.points[0];
        const profile_id = point.customdata
        plot_wrapper(clicked_wmo,profile_id)
      });
    })

  }
  );
}

function make_profile_plot(plot_data,clicked_id){
  //const plot_data = await get_profile_data(selected_params,selected_wmo,goShip_only);
  //let wmo_data = plot_data.selected_data.map(row => row.WMO);
  let id_data = plot_data.selected_data.map(row => row.ID);
  let depth_data = plot_data.selected_data.map(row => row.PRES);
  let flt_data = plot_data.selected_data.map(row => row.FLT_SAT);
  let woa_data = plot_data.selected_data.map(row => row.WOA_SAT);
  //let z_scores = plot_data.selected_data.map(row => row.Z);
    
  let selected_rows = id_data.map((value,i)=>value == clicked_id)
  let selected_depths = depth_data.filter((value,i)=>selected_rows[i])
  let selected_flt = flt_data.filter((value,i)=>selected_rows[i])
  let selected_woa = woa_data.filter((value,i)=>selected_rows[i])
  //let selected_z= z_scores.filter((value,i)=>selected_rows[i])

  const titles = ["Float % Sat.","WOA % Sat."]
  const traces = [];

  let layout = {
    grid: { rows: 1, columns: 2, pattern: 'independent',xgap: 0.2},
    //   xgap: 0.2},
    autoexpand: true,
    // yaxis: {title: {text: "Depth (m)",
    //   font: {size: 14},standoff: 3}
    //   },
    //margin controls the margin of the entire plotting area,
    //not individual subplots. Note that plotly's default
    //margins are relatively large, so removing the margin
    //line results in more comptessed plots. Also, The plot title
    //appears within the margin, so too small of a margin will push the
    //title into the axis
    margin: {t: 40, b: 50, l: 50, r: 50},    
    width: 500,
    height: 500,
    hovermode: 'closest',
    showlegend: false,
    title: {text: `${clicked_id}`, 
            xref: 'paper', x: 0.5, 
            yref: 'paper', y: 1.05,},
    legend: {bordercolor: 'black', borderwidth: 1},
    font: {family:  "Menlo,Consolas,monaco,monospace", size: 14},
    plot_bgcolor: 'white',
  };

  for(let i = 0; i < 2; i++){
    x_global = flt_data
    y_global = depth_data
    x_selected = selected_flt
    y_selected = selected_depths

    if(i == 1){
      x_global = woa_data
      y_global = depth_data
      x_selected = selected_woa
      y_selected = selected_depths
    } 
    
    sorted_indices = y_selected
      //This step creates a list of value + index for each item in the initial array
      .map((value,index) => ({value,index}))
      //This step sorts the list tems based on value
      .sort((a,b) => b.value - a.value)
      //Ths step retreves the corresponding index value for each sorted list item. Brilliant!
      .map(item => item.index)

    x_selected_sorted = sorted_indices.map((value,i) => x_selected[value])
    y_selected_sorted = sorted_indices.map((value,i) => y_selected[value])

    var current_trace_1 = {
      x: x_global,
      y: y_global,
      customdata: id_data,
      //The following create an array where each element is 
      //customdata: wmo_plot_data.map((val,i)=>[val,cruise_plot_data[i]]),
      //Note: the trace name is normally displayed via the <extra> tag.
      //Including <extra></extra> prevents it from being displayed.
      hovertemplate: '<b>ID: </b>%{customdata}',
      //hovertemplate: '<b>ID: </b>%{customdata[0]} <br><b>Cruise: </b>%{customdata[1]}<extra></extra>',
      type: 'scattergl',
      mode: 'markers',
      //name: "Bottle Data",
      opacity: 0.7,
      marker: {line: {width: 0},size: 4, opacity: 0.7, color: '#0397A8'},
      xaxis: `x${i+1}`,
      yaxis: `y${i+1}`
    }

    var current_trace_2 = {
      x: x_selected_sorted,
      y: y_selected_sorted,
      //The following create an array where each element is 
      //customdata: wmo_plot_data.map((val,i)=>[val,cruise_plot_data[i]]),
      //Note: the trace name is normally displayed via the <extra> tag.
      //Including <extra></extra> prevents it from being displayed.
      //hovertemplate: '<b>WMO: </b>%{customdata[0]} <br><b>Cruise: </b>%{customdata[1]}<extra></extra>',
      type: 'scattergl',
      mode: 'line',
      //name: "Bottle Data",
      // opacity: 0.7,
      marker: {line: {width: 1},size: 5, opacity: 0.7, color: '#ff0000ff'},
      xaxis: `x${i+1}`,
      yaxis: `y${i+1}`
    }
  
    layout[`xaxis${i+1}`] = {
      showline: true,
      linewidth: .5,
      linecolor: 'black',
      tickfont: {size: 12},
      showgrid: true,
      zeroline: false,
      automargin: false,
      title: {text: titles[i], font: {size: 12}}
    }
    
    //This adjusts the yaxis appearance for a specific subplot  
    layout[`yaxis${i+1}`] = {
      autorange: 'reversed',
      showline: true,
      linewidth: .5,
      linecolor: 'black',
      tickfont: {size: 10},
      showgrid: true,
      zeroline: false,
      // title: {text: [float_titles[i],float_units[i]].join(" "),
      //   font: {size: 12},standoff: 3},
      automargin: false,
    }
    traces.push(current_trace_1)
    traces.push(current_trace_2)
  }
  return {traces, layout}
}

function make_timeseries_plot(plot_data,clicked_id,thresh){
  //const plot_data = await get_profile_data(selected_params,selected_wmo,goShip_only);
  //let wmo_data = plot_data.selected_data.map(row => row.WMO);
  let id_data = plot_data.selected_data.map(row => row.ID);
  let date_data = plot_data.selected_data.map(row => new Date(row.DATE));

  let glbl_surf_z = plot_data.selected_data.map(row => row.SURF_GAIN_Z);
  let glbl_deep_z = plot_data.selected_data.map(row => row.DEEP_GAIN_Z);
  let flt_surf_z = plot_data.selected_data.map(row => row.FLT_SURF_Z);
  let flt_deep_z = plot_data.selected_data.map(row => row.FLT_DEEP_Z);
  let woa_surf_z = plot_data.selected_data.map(row => row.WOA_SURF_Z);
  let woa_deep_z = plot_data.selected_data.map(row => row.WOA_DEEP_Z);
  let y_axis = [glbl_surf_z,glbl_deep_z,flt_surf_z,flt_deep_z,woa_surf_z,woa_deep_z]

  let selected_rows = id_data.map((value,i)=>value == clicked_id)
  let selected_date = date_data.filter((value,i)=>selected_rows[i])
  let sel_glbl_surf_z = glbl_surf_z.filter((value,i)=>selected_rows[i])
  let sel_glbl_deep_z = glbl_deep_z.filter((value,i)=>selected_rows[i])
  let sel_flt_surf_z = flt_surf_z.filter((value,i)=>selected_rows[i])
  let sel_flt_deep_z = flt_deep_z.filter((value,i)=>selected_rows[i])
  let sel_woa_surf_z = woa_surf_z.filter((value,i)=>selected_rows[i])
  let sel_woa_deep_z = woa_deep_z.filter((value,i)=>selected_rows[i])
  let y_selected = [sel_glbl_surf_z,sel_glbl_deep_z,sel_flt_surf_z,sel_flt_deep_z,sel_woa_surf_z,sel_woa_deep_z]

  const traces = [];
  shapes = [];
  const axis_titles = ["Global Surf Z","Deep Surf Z","Flt Surf Z","Flt Deep Z","WOA Surf Z","WOA Deep Z"];
  let layout = {
    grid: { rows: 3, columns: 2, pattern: 'independent',xgap: 0.2},
    //   xgap: 0.2},
    autoexpand: true,
    // yaxis: {title: {text: "Depth (m)",
    //   font: {size: 14},standoff: 3}
    //   },
    //margin controls the margin of the entire plotting area,
    //not individual subplots. Note that plotly's default
    //margins are relatively large, so removing the margin
    //line results in more comptessed plots. Also, The plot title
    //appears within the margin, so too small of a margin will push the
    //title into the axis
    margin: {t: 10, b: 40, l: 30, r: 5},    
    width: 500,
    height: 500,
    hovermode: 'closest',
    showlegend: false,
    legend: {bordercolor: 'black', borderwidth: 1},
    font: {family:  "Menlo,Consolas,monaco,monospace", size: 14},
    plot_bgcolor: 'white',
  };

  for(let i = 0; i < y_axis.length; i++){

  date_min = new Date(Math.min(...date_data))
  date_max = new Date(Math.max(...date_data))

  // var current_lower = {
      // type: 'line',
      // x0: date_min,
      // y0: -thresh,
      // x1: date_max,
      // y1: -thresh,
      // line: {width:1,color:"red"},
      // x and y describe a plot position relative to xref and yref. The following
      // commands specify that xref and yref should be set to x1/y1, x2/y2, etc. 
      // xref: `x${i+1}`,
      // yref: `y${i+1}`
    // }

    var current_upper = {
      type: 'line',
      x0: date_min,
      y0: thresh,
      x1: date_max,
      y1: thresh,
      line: {width:1,color:"red"},
      //x and y describe a plot position relative to xref and yref. The following
      //commands specify that xref and yref should be set to x1/y1, x2/y2, etc. 
      xref: `x${i+1}`,
      yref: `y${i+1}`
    }

    var current_trace_1 = {
      x: date_data,
      y: y_axis[i],
      customdata: id_data,
      //The following create an array where each element is 
      //customdata: wmo_plot_data.map((val,i)=>[val,cruise_plot_data[i]]),
      //Note: the trace name is normally displayed via the <extra> tag.
      //Including <extra></extra> prevents it from being displayed.
      hovertemplate: '<b>ID: </b>%{customdata}',
      type: 'scattergl',
      mode: 'markers',
      //name: "Bottle Data",
      opacity: 0.7,
      marker: {line: {width: 1},size: 4, opacity: 0.7, color: '#0397A8'},
      xaxis: `x${i+1}`,
      yaxis: `y${i+1}`
    }

    var current_trace_2 = {
      x: selected_date,
      y: y_selected[i],
      customdata: id_data,
      hovertemplate: '<b>ID: </b>%{customdata}',
      type: 'scattergl',
      mode: 'markers',
      //name: "Bottle Data",
      opacity: 0.7,
      marker: {line: {width: 1},size: 8, opacity: 0.7, color: '#a80303ff'},
      xaxis: `x${i+1}`,
      yaxis: `y${i+1}`
    }
 
    layout[`xaxis${i+1}`] = {
      showline: true,
      linewidth: .5,
      linecolor: 'black',
      tickfont: {size: 12},
      showgrid: true,
      zeroline: false,
      // title: {text: [bottle_titles[i],bottle_units[i]].join(" "),
      //   font: {size: 12}, standoff: 7},
      automargin: false,
      //title: {text: [x_titles[i],x_units[i]].join(" "),
    }
    
    //This adjusts the yaxis appearance for a specific subplot  
    layout[`yaxis${i+1}`] = {
      showline: true,
      linewidth: .5,
      linecolor: 'black',
      tickfont: {size: 10},
      showgrid: true,
      zeroline: false,
      title: {text: axis_titles[i], font: {size: 12}, standoff: 7},
      automargin: false
    }

    traces.push(current_trace_1)
    traces.push(current_trace_2)
    //shapes.push(current_lower)
    shapes.push(current_upper)
  }
  layout.shapes = shapes;
  return {traces, layout}
}

function refresh(){
  //Lines to the next comment are very much Chat GPT, but are 
  //required to clear the plotting space after a Leaflet map is generated.
  //Leaflet seems to alter "plot_content," creating issues when displaying
  //scatterplots. It also addresses issues where the map cannot be drawn a 
  //second time after being initialized.  
  const oldContainer = document.getElementById("map_content");
  const parent = oldContainer.parentNode;

  oldContainer.remove();

  // Recreate the container
  const newContainer = document.createElement("div");
  newContainer.id = "map_content";
  newContainer.gridRow = "1/2";
  newContainer.gridColumn = "2/4"; 
  //newContainer.style.width = "800px";
  //newContainer.style.height = "300px";
  newContainer.backgroundColor = 'white';
  newContainer.overflow = 'hidden';
  parent.appendChild(newContainer);
}

function make_palette(input_data){
  //Note use of spread operator (...) to unlist array
  const min_value = Math.min(...input_data)
  const mid_value = ss.median(input_data)
  const max_value = Math.max(...input_data)
  console.log(min_value);
  console.log(mid_value);
  console.log(mid_value*10);
  const color_scale =  chroma.scale(['5083BB','FFFFBF','DE3F2E']).domain([min_value,mid_value, mid_value*10]);
  //const color_values = input_data.map(val => color_scale(val).hex());

  //Create binned values depending on specified resolution
  //data_values_binned = input_data.map(row => Math.round(row/resolution) * resolution)
  //Create array of unique bin values
  //data_bins = [...new Set(data_values_binned)].sort()
  //palette = chroma.scale('Spectral').colors(data_bins.length)
  //color_values = data_values_binned.map(row => palette[data_bins.indexOf(row)])
  return { color_scale, min_value, mid_value, max_value};
}
