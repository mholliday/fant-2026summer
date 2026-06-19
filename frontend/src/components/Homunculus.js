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

const Shape = ({ shape, fill }) => {
  const common = { fill, stroke: STROKE, strokeWidth: 1 };
  if (shape.type === "ellipse") {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...common} />;
  }
  return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...common} />;
};

const Homunculus = ({ inventory = {} }) => (
  <div className="text-center">
    <svg viewBox="0 0 200 410" width="200" height="410" role="img" aria-label="Skeletal inventory homunculus">
      {HOMUNCULUS_REGIONS.map((region) => (
        <Shape
          key={region.id}
          shape={region.shape}
          fill={regionPresent(region, inventory) ? PRESENT_FILL : ABSENT_FILL}
        />
      ))}
    </svg>
    <div className="d-flex justify-content-center gap-3 small mt-1">
      <span><span style={{ display: "inline-block", width: 12, height: 12, background: PRESENT_FILL, border: `1px solid ${STROKE}`, verticalAlign: "middle" }} /> Present</span>
      <span><span style={{ display: "inline-block", width: 12, height: 12, background: ABSENT_FILL, border: `1px solid ${STROKE}`, verticalAlign: "middle" }} /> Absent</span>
    </div>
  </div>
);

export default Homunculus;
