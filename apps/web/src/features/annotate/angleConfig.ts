export interface AngleInfo {
  labelKey: string;
  typicalRange: string;
  noteKey: string;
}

export const ANGLE_CONFIG: Record<string, AngleInfo> = {
  torsoLean:       { labelKey: 'pose.torsoLean',   typicalRange: '10–20°',   noteKey: 'pose.note.torsoLean' },
  rightKneeAngle:  { labelKey: 'pose.rightKnee',   typicalRange: '120–170°', noteKey: 'pose.note.knee' },
  leftKneeAngle:   { labelKey: 'pose.leftKnee',    typicalRange: '120–170°', noteKey: 'pose.note.knee' },
  rightElbowAngle: { labelKey: 'pose.rightElbow',  typicalRange: '80–110°',  noteKey: 'pose.note.elbow' },
  leftElbowAngle:  { labelKey: 'pose.leftElbow',   typicalRange: '80–110°',  noteKey: 'pose.note.elbow' },
};
