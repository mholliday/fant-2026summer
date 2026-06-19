import React, { useMemo } from "react";
import skeletonRaw from "../assets/skeleton.svg?raw";
import { absentBoneIds, ABSENT_FILL, ABSENT_STROKE } from "../services/williamsForm";

// Strip the XML prolog / DOCTYPE so the markup is valid inline in HTML.
const skeletonSvg = skeletonRaw.replace(/<\?xml[\s\S]*?\?>/, "").replace(/<!DOCTYPE[\s\S]*?>/, "");

// Renders the public-domain anatomical skeleton (LadyofHats, Wikimedia Commons)
// and reddens any bone whose inventory elements are all marked absent. The base
// figure is injected once (constant markup); only the <style> block changes as
// the inventory changes, so toggling absence doesn't re-parse the whole SVG.
const Homunculus = ({ inventory = {} }) => {
  const css = useMemo(() => {
    const ids = absentBoneIds(inventory);
    if (!ids.length) return "";
    return ids
      .map((id) => `.homunculus #${id}, .homunculus #${id} * { fill: ${ABSENT_FILL} !important; stroke: ${ABSENT_STROKE} !important; }`)
      .join("\n");
  }, [inventory]);

  return (
    <div className="homunculus text-center">
      <style>{`.homunculus svg { display: block; margin: 0 auto; max-width: 100%; height: auto; max-height: 460px; }\n${css}`}</style>
      <div dangerouslySetInnerHTML={{ __html: skeletonSvg }} />
      <div className="d-flex justify-content-center gap-3 small mt-1">
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: ABSENT_FILL, border: `1px solid ${ABSENT_STROKE}`, verticalAlign: "middle" }} /> Absent</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, background: "#f3d48c", border: "1px solid #967348", verticalAlign: "middle" }} /> Present / intact</span>
      </div>
      <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
        Figure: public domain (M. Ruiz Villarreal, Wikimedia Commons)
      </div>
    </div>
  );
};

export default Homunculus;
