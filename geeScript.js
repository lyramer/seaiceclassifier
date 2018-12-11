// conceptual underpinning written by Sasha Nasonova, ICE Lab, Uvic Geography
// rewritten to optimize and make use of GEE libraries by Andy Wynden
// this code was written to select individual S1 images in EW mode 
// for a given time period. Then, using the HH band do some land masking
// and getting rid of zeros and then finally basic threshold classification

var pt = ee.Geometry.Point(-105.83, 68.65); // near Cam Bay
var water = ee.Image("MODIS/MOD44W/MOD44W_005_2000_02_24").select([0]);
Map.centerObject(pt,7);


// Load Sentinel-1 C-band SAR Ground Range collection (HH db)
var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterDate('2017-04-01', '2017-04-30')
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'HH'))
  .select('HH').mean();

// mask the image, projection WGS 1984 Web Auxillary Sphere
var b1Clip = collection.mask(water);

// mask out any zeros in the image
var zerosmaskHH = b1Clip.expression('b(0) != 0');
var finalHH = b1Clip.mask(zerosmaskHH);

//ice trafficability zones (purple: #8a1c7c'), (yellow: #faf2a1), (green:#59c9a5')
var palette = ['8a1c7c','faf2a1', '59c9a5'];

// classification into 3 zones
var zonesHH = finalHH.lt(-21).add(finalHH.lt(-18)).add(finalHH.lt(0));

Map.addLayer(zonesHH,{min: 1, max: 3, palette: palette},'Classification');
