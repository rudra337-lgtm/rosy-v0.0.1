export type Domain = 'AIR' | 'SEA' | 'GROUND' | 'NEAR-SPACE';

export const TRACK_KINDS = [
  'airliner', 'ga', 'uav', 'bird', 'weather',
  'cargo', 'fishing',
  'train',
  'seismic',
  'debris', 'gnss_anomaly',
  'wildfire'
] as const;