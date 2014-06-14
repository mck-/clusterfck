var distances = require("./distance");

function _getFourCorners(points) {
  minLat = Infinity;
  minLatPoint = null;
  minLng = Infinity;
  minLngPoint = null;
  maxLat = -Infinity;
  maxLatPoint = null;
  maxLng = -Infinity;
  maxLngPoint = null;

  for (var i = 0; i < points.length; i++) {
    if (points[i].lat < minLat) {
      minLat = points[i].lat;
      minLatPoint = points[i];
    }

    if (points[i].lng < minLng) {
      minLng = points[i].lng;
      minLngPoint = points[i];
    }

    if (points[i].lat > maxLat) {
      maxLat = points[i].lat;
      maxLatPoint = points[i];
    }

    if (points[i].lat > maxLng) {
      maxLng = points[i].lng;
      maxLngPoint = points[i];
    }
  }

  return [minLatPoint, minLngPoint, maxLatPoint, maxLngPoint];
}

function randomCentroids(points, k) {
   var centroids = points.slice(0); // copy
   centroids.sort(function() {
      return (Math.round(Math.random()) - 0.5);
   });
   var corners = _getFourCorners(points);
   for (var i = 0; i < corners.length; i++) {
     centroids.unshift(corners[i]); // Add four corners to always be selected
   }
   return centroids.slice(0, k);
}

function closestCentroid(point, centroids, distance) {
   var min = Infinity,
       index = 0;
   for (var i = 0; i < centroids.length; i++) {
      var dist = distance(point, centroids[i]);
      if (dist < min) {
         min = dist;
         index = i;
      }
   }
   return index;
}

function kmeans(points, k, distance, snapshotPeriod, snapshotCb) {
   k = k || Math.max(2, Math.ceil(Math.sqrt(points.length / 2)));

   distance = distance || "euclidean";
   if (typeof distance == "string") {
      distance = distances[distance];
   }

   var centroids = randomCentroids(points, k);
   var assignment = new Array(points.length);
   var clusters = new Array(k);

   var iterations = 0;
   var movement = true;
   while (movement) {
      // update point-to-centroid assignments
      for (var i = 0; i < points.length; i++) {
         assignment[i] = closestCentroid(points[i], centroids, distance);
      }

      // update location of each centroid
      movement = false;
      for (var j = 0; j < k; j++) {
         var assigned = [];
         for (var i = 0; i < assignment.length; i++) {
            if (assignment[i] == j) {
               assigned.push(points[i]);
            }
         }

         if (!assigned.length) {
            continue;
         }
         var centroid = centroids[j];
         var newCentroid = new Array(centroid.length);

         for (var g = 0; g < centroid.length; g++) {
            var sum = 0;
            for (var i = 0; i < assigned.length; i++) {
               sum += assigned[i][g];
            }
            newCentroid[g] = sum / assigned.length;

            if (newCentroid[g] != centroid[g]) {
               movement = true;
            }
         }
         centroids[j] = newCentroid;
         clusters[j] = assigned;
      }

      if (snapshotCb && (iterations++ % snapshotPeriod == 0)) {
         snapshotCb(clusters);
      }
   }
   return clusters;
}

module.exports = kmeans;
