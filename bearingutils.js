const BearingUtils = (function () {

  /**
   * @author David Black
   * @version 0.0.1
   */

  const EARTH_R = 6371e3; // metres

  // Arbitrary distance - change this if your applicatoin requires longer distances along a heading/bearing.
  const LINE_LENGTH_METERS = 100000;

  // convert from degrees to radians
  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  // convert from radians to degrees
  function toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  // Get the distance between two points
  function haversineDistance(start, end) {
    const startLat = toRadians(start.lat);
    const startLng = toRadians(start.lng);
    const endLat = toRadians(end.lat);
    const endLng = toRadians(end.lng);

    const a = Math.sin((endLat - startLat) / 2) * Math.sin((endLat - startLat) / 2) +
      Math.cos(startLat) * Math.cos(endLat) *
      Math.sin((endLng - startLng) / 2) * Math.sin((endLng - startLng) / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = EARTH_R * c;
    return d;
  }

  // Get the bearing between two points
  function getBearing(start, end) {
    const startLat = toRadians(start.lat);
    const startLng = toRadians(start.lng);
    const endLat = toRadians(end.lat);
    const endLng = toRadians(end.lng);

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
    const bearing = Math.atan2(y, x);
    return (toDegrees(bearing) + 360) % 360;
  }

  // With a starting location, bearing and distance, establish a line
  function getLine(start, bearing, distance = LINE_LENGTH_METERS) {
    const startLat = toRadians(start.lat);
    const startLng = toRadians(start.lng);
    const radBearing = toRadians(bearing); // Convert bearing to radians

    const endLat = Math.asin(Math.sin(startLat) * Math.cos(distance / EARTH_R) +
      Math.cos(startLat) * Math.sin(distance / EARTH_R) * Math.cos(radBearing)); // Use radBearing
    const endLng = startLng + Math.atan2(Math.sin(radBearing) * Math.sin(distance / EARTH_R) * Math.cos(startLat),
      Math.cos(distance / EARTH_R) - Math.sin(startLat) * Math.sin(endLat)); // Use radBearing
    return {
      start: start,
      end: {
        lat: toDegrees(endLat),
        lng: toDegrees(endLng)
      }
    }
  }

  // With point off line, find the point on the line closest to the point, the distance from the point to the line, and the distance along the line from the start point to the closest point
  function deviationMetrics(point, line) {
    const pointLat = toRadians(point.lat);
    const pointLng = toRadians(point.lng);
    const startLat = toRadians(line.start.lat);
    const startLng = toRadians(line.start.lng);
    const endLat = toRadians(line.end.lat);
    const endLng = toRadians(line.end.lng);

    const dStartToPoint = haversineDistance(line.start, point);
    const bearingStartToPoint = getBearing(line.start, point);
    const bearingStartToEnd = getBearing(line.start, line.end);

    const angularDifference = toRadians(bearingStartToPoint - bearingStartToEnd);
    const crossTrackDistance = Math.asin(Math.sin(dStartToPoint / EARTH_R) * Math.sin(angularDifference)) * EARTH_R;
    const alongTrackDistance = Math.acos(Math.cos(dStartToPoint / EARTH_R) / Math.cos(crossTrackDistance / EARTH_R)) * EARTH_R;

    const intersectionLat = Math.asin(Math.sin(startLat) * Math.cos(alongTrackDistance / EARTH_R) +
      Math.cos(startLat) * Math.sin(alongTrackDistance / EARTH_R) * Math.cos(bearingStartToEnd));
    const intersectionLng = startLng + Math.atan2(Math.sin(bearingStartToEnd) * Math.sin(alongTrackDistance / EARTH_R) * Math.cos(startLat),
      Math.cos(alongTrackDistance / EARTH_R) - Math.sin(startLat) * Math.sin(intersectionLat));

    const distanceToPoint = Math.abs(crossTrackDistance);

    const bearingToLine = getBearing(point, {
      lat: toDegrees(intersectionLat),
      lng: toDegrees(intersectionLng),
    });

    return {
      alongTrackPoint: {
        lat: toDegrees(intersectionLat),
        lng: toDegrees(intersectionLng),
      },
      alongTrackDistance: Math.trunc(alongTrackDistance),
      crossTrackDistance: Math.trunc(distanceToPoint),
      bearingToLine: Math.trunc(bearingToLine),
    };
  }
  return {
    toRadians,
    toDegrees,
    haversineDistance,
    getBearing,
    getLine,
    deviationMetrics
  };
})();

