# Ice Roughness Classification using S1 Data

This is a basic thresholding algorithm for classifying sea ice roughness, developed by the ICE Lab at the University of Victoria. The basic algorithm was converted to a Google Earth Engine by Andy Wynden and Sasha Nasanova. Subsequent improvements for efficiency and to remove bugs was done by Andy Wynden. Many thanks to Sasha Nasanova, Randy Schlaren and Becky Segal for helping me understand the nature of radar data, as well as the intricacies of land-fast Arctic sea ice, and its importance to the communities that depend on it.

### Basic Algorithm

[Google uses the SNAP toolkit](https://developers.google.com/earth-engine/sentinel1) to do some basic speckle filtering and cleanup of the data, so much of the algorithm was simplified due to this helpful cleanup. We did look at using a Refined Lee Speckle Filter, but found it unnecessary. 

We selected and took the mean of all of the HH band images across a given time period (usually a month). Then, we masked out the land, masked out all zeros, and then classified it into smooth, medium and rough ice.

Smooth == < -21dB
Medium == >= -21dB and < -18dB
Rough == >= -18dB

#### Sea Ice Classified into Smooth (green), Medium (yellow), and Rough (purple)
![Image of the Artic Region near Cambridge Bay, showing ice roughness classified into smooth, medium, and rough](https://github.com/lyramer/seaiceclassifier/blob/master/img/demo.PNG "Sea Ice Classified into Smooth (green), Medium (yellow), and Rough (purple)")

#### Sea Ice Before Threshold Classification
![Image of the Artic Region near Cambridge Bay, showing ice roughness as a monochrome map](https://github.com/lyramer/seaiceclassifier/blob/master/img/demo1.PNG "Sea Ice Before Threshold Classification")

### Pitfalls

In the spirit of [The Journal Of Null Findings](https://www.journalnetwork.org/journals/international-journal-of-negative-and-null-results), here is a short list of problems, bugs, and dead ends that I encountered.

+ Filtering the Sentinel-1 ImageCollection for both EW swath and HH band yielded no images. No idea why - filtering for both in other applications (for instance, selecting IW swath and VV & HV bands as shown in the official GEE docs' S1 demo code works just fine) poses no problem. Sasha pointed out that by default, HH is only used in EW scanning, so there was no need to filter by both.

+ We tried limiting the incidence angle but unfortunately there is little enough coverage of the Arctic (between 4 and 11 passes a month in the region we were studying) that limiting the incidence angle range left large gaps in coverage. Code for doing so is below.

```javascript
// remove incidence angle that is <26 and >42
// to keep values between 26 and 42 we say, <42 and >26
var inAngleRange = collection.map(function(img) {
  var mask = img.select(['angle']);
  mask = mask.gt(26).and(mask.lt(42));
  return img.mask(mask);
});
```

This returns an ImageCollection where all the pixels which fall outside the incidence angle range are masked. Note that this is applied to an ee.ImageCollection, not an ee.Image. 

*I suspect there is a more efficient way to limit incidence angle range, and my academic curiosity welcomes any suggestions*

+ We discovered that the spatial area covered by the incidence angle band is not 1-1 to the spatial area covered by the actual radar dB data. This is because the incidence angle is calculated by GEE rather than part of the raw S1 dataset. Some minor corrections were made to this algorithm during the development of our product, so only around 2.4% of the data is not covered properly. Still, a good gotcha that so far has only been addressed in the GEE developer's mailing list.

+ The [built-in landmask that Google offers](https://developers.google.com/earth-engine/datasets/catalog/MODIS_MOD44W_MOD44W_005_2000_02_24) is far from perfect. We have tried uploading a higher resolution land mask to both GEE directly, and to Fusion Tables. The upload has failed in both cases (timed out on GEE, and only a small section of the shp file appears in FT, likely due to a million-character cell limit in FT). Just today I have received an email saying that FT will be discontinued, so we remain limited in uploading a higher quality land mask. I will update this as we continue to work on this problem, as high resolution is important for the Arctic communities that hope to use this tool.

+ When uploading masks, you need a positive mask (ie you need a 1 for every pixel you don't want masked).