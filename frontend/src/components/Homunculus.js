import React from "react";
import { HOMUNCULUS_REGIONS, elemKey } from "../services/williamsForm";

// Schematic skeletal homunculus. A region is shaded ("present") when at least
// one of its mapped elements is not marked absent in the inventory. This is a
// diagrammatic representation of presence/absence, not an anatomical drawing.
const PRESENT_FILL = "#5b3f8c";  // WCU-ish purple
const ABSENT_FILL = "#e9ecef";
const STROKE = "#6c757d";

const regionPresent = (region, inventory) =>
  region.elements.some(([g, e]) => {
    const cell = inventory?.[elemKey(g, e)];
    return cell ? !cell.absent : false;
  });

// A long bone: a slim shaft capped by paired epiphyseal knobs at each end.
const boneEls = (shape, common, kp) => {
  const { x, y, w, h, double } = shape;
  if (double) {
    const hw = w * 0.46;
    return [
      ...boneEls({ x, y, w: hw, h }, common, kp + "a"),
      ...boneEls({ x: x + w - hw, y, w: hw, h }, common, kp + "b"),
    ];
  }
  const cx = x + w / 2;
  const knobR = w * 0.4;
  const off = w * 0.2;
  const shaftW = w * 0.42;
  const lobe = (lx, ly, i) => <ellipse key={kp + i} cx={lx} cy={ly} rx={knobR} ry={knobR * 0.85} {...common} />;
  return [
    <rect key={kp + "s"} x={cx - shaftW / 2} y={y + knobR} width={shaftW} height={h - 2 * knobR} rx={shaftW / 2} {...common} />,
    lobe(cx - off, y + knobR, "1"), lobe(cx + off, y + knobR, "2"),
    lobe(cx - off, y + h - knobR, "3"), lobe(cx + off, y + h - knobR, "4"),
  ];
};

const renderShape = (shape, fill, kp) => {
  const common = { fill, stroke: STROKE, strokeWidth: 1 };
  if (shape.type === "path") return <path key={kp} d={shape.d} {...common} />;
  if (shape.type === "bone") return <g key={kp}>{boneEls(shape, common, kp)}</g>;
  if (shape.type === "ellipse") return <ellipse key={kp} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
  return <rect key={kp} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />;
};

const Homunculus = ({ inventory = {} }) => (
  <div className="text-center">
    <svg viewBox="0 0 200 410" width="200" height="410" role="img" aria-label="Skeletal inventory homunculus">
      {HOMUNCULUS_REGIONS.map((region) =>
        renderShape(region.shape, regionPresent(region, inventory) ? PRESENT_FILL : ABSENT_FILL, region.id)
      )}
    </svg>
    <div className="d-flex justify-content-center gap-3 small mt-1">
      <span><span style={{ display: "inline-block", width: 12, height: 12, background: PRESENT_FILL, border: `1px solid ${STROKE}`, verticalAlign: "middle" }} /> Present</span>
      <span><span style={{ display: "inline-block", width: 12, height: 12, background: ABSENT_FILL, border: `1px solid ${STROKE}`, verticalAlign: "middle" }} /> Absent</span>
    </div>
  </div>
);

export default Homunculus;
