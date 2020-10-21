Map.setCenter(31.886179095507362, 2.778349074599303,9);

// Get Sentinel 2 Imagery

var pre_16_sent_wide = ee.ImageCollection('COPERNICUS/S2')
                .filterBounds(largeextent).filterDate('2016-03-01', '2016-05-31')
                .map(function(img){return img.clip(smaller_extent)})
                .min().select('B12','B11','B8','B4','B3','B2');
                
//Map.addLayer(pre_16_sent_wide,{bands: 'B4,B3,B2', gain: '0.1, 0.1, 0.1'},'Pre image Sentinel Wide Extent');

var FCC = {
  min: 0.0,
  max: 3000,
  bands: ['B8', 'B4', 'B3'],
  gamma: [0.95, 1.1, 1]
};

Map.addLayer(pre_16_sent_wide,FCC,'Pre-data FCC');

var post_20_sent_wide = ee.ImageCollection('COPERNICUS/S2')
                .filterBounds(largeextent).filterDate('2019-12-15', '2020-01-31')
                .map(function(img){return img.clip(smaller_extent)})
                .min().select('B12','B11','B8','B4','B3','B2');


//Map.addLayer(post_20_sent_wide,{bands: 'B4,B3,B2', gain: '0.1, 0.1, 0.1'}, 'Post Image Sentinel Wide Extent');

var FCC = {
  min: 0.0,
  max: 3000,
  bands: ['B8', 'B4', 'B3'],
  gamma: [0.95, 1.1, 1]
};

Map.addLayer(post_20_sent_wide,FCC,'Post-data FCC');

// //Merge Feature Collections
var training_merge_16 = settlement_16_full.merge(non_settlement_full);
// 2020 training included for experimentation, but ultimately wanted to train with 2016 training.
// var training_merge_20 = //insert.merge()   // try using only 2020 settlement data and merging all

// ////// RF Sentinel 2016 Wide Extent///////////// fill in with correct data and new training

//Define the bands to be used to train your data
var final_sent_16_wide = ee.Image.cat(pre_16_sent_wide);
var bands = ['B8','B4','B3']; //maybe try with only NIR, R and G
var bands_all = ['B12','B11','B8','B4','B3','B2'];
var training_16_wide = final_sent_16_wide.select(bands).sampleRegions({
collection: training_merge_16,
properties: ['landcover'],
scale: 10 });

// Optional training data for 2020 settlements (experimentation, not used in final classification)
// var training_20 = final.select(bands).sampleRegions({
//  collection: training_merge_20,
//  properties: ['landcover'],
//  scale: 10 });

var RF_classifier_2016_wide = ee.Classifier.smileRandomForest(10); // 10 trees
var trained_2016_wide = RF_classifier_2016_wide.train(training_16_wide, 'landcover', bands);
var rf_classified_2016_wide = final_sent_16_wide.classify(trained_2016_wide);

//Display the Classification
Map.addLayer(rf_classified_2016_wide,
{min: 1, max: 2, palette: ['98ff00', 'bdcec6']},
'RF Sentinel 2016 Classification Wide Extent','1',0.75);

// Export.image.toDrive({
//   image: rf_classified_2016_wide,
//   description: 'aaron_sent_classified_16_wide_good',
//   fileFormat: 'GeoTIFF',
//   scale: 10,
//   maxPixels: 5000000000,
//   region: smaller_extent,
// });


 ////// RF Sentinel 2020 Wide /////////////

//Define the bands to be used to train your data
var final_sent_20_wide = ee.Image.cat(post_20_sent_wide);
var bands = ['B8','B4','B3'];
var bands_all = ['B12','B11','B8','B4','B3','B2'];
var training_20_wide = final_sent_20_wide.select(bands).sampleRegions({
  collection: training_merge_16,
  properties: ['landcover'],
  scale: 10 });

// Optional training data for 2020 settlements (experimentation, not used in final classification)
// var training_20 = final.select(bands).sampleRegions({
// collection: training_merge_20,
// properties: ['landcover'],
// scale: 10 });

var RF_classifier_2020_wide = ee.Classifier.smileRandomForest(10); // 10 trees
var trained_2020_wide = RF_classifier_2020_wide.train(training_20_wide, 'landcover', bands);
var rf_classified_2020_wide = final_sent_20_wide.classify(trained_2020_wide);

//Display the Classification
Map.addLayer(rf_classified_2020_wide,
{min: 1, max: 2, palette: ['2B48B3', 'bdcec6']},
'RF Sentinel 2020 Classification Wide Extent','1',0.75);

// Export.image.toDrive({
//   image: rf_classified_2020_wide,
//   description: 'aaron_sent_classified_20_wide_good',
//   fileFormat: 'GeoTIFF',
//   scale: 10,
//   maxPixels: 5000000000,
//   region: smaller_extent,
// });


var camps = Map.addLayer(camps, {color:'2923D7'}, 'camps','');



//////////////Export Training Data///////////////////////////
// Export.table.toDrive({
//   collection: settlement_16_detail,
//   description: 'Post_Image_settlement_class',
//   fileFormat: "SHP",
// });

// Export.table.toDrive({
//   collection: nonsettlement_detail,
//   description: 'non_settlement_class_PreAndPost',
//   fileFormat: "SHP",
// });

// Export.table.toDrive({
//   collection: smaller_extent,
//   description: 'smaller_extent',
//   fileFormat: "SHP",
// });


//////////////Export Result Classifications///////////////////////////
Export.image.toDrive({
  image: final_sent_16_wide,
  description: 'final_sent_16_wide',
  fileFormat: 'GeoTIFF',
  scale: 10,
  maxPixels: 5000000000,
  region: smaller_extent,
});

Export.image.toDrive({
  image: final_sent_20_wide,
  description: 'final_sent_20_wide',
  fileFormat: 'GeoTIFF',
  scale: 10,
  maxPixels: 5000000000,
  region: smaller_extent,
});
