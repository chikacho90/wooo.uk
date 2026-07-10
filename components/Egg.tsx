// 갓 태어난 알 — 픽셀아트, 다마고치처럼 숨쉬고 꿈틀대며 깨어날락 말락
// 순수 SVG rect 픽셀 + CSS 애니메이션 (globals.css의 keyframes 사용)

const O = "#0a0a0a"; // 배경과 같은 (외곽 픽셀 = 실루엣 경계)
const SH = "#3a3630"; // 알 외곽선
const A = "#efe7d6"; // 알 본체(크림)
const B = "#e0d5bf"; // 음영
const H = "#fbf6ec"; // 하이라이트
const E = "#2a2622"; // 눈
const C = "#c96f4a"; // 부리/볼(코랄, 클로드톤)

// 12x14 픽셀 알. 각 문자가 한 픽셀.
// . = 투명, o = 외곽선, a = 본체, b = 음영, h = 하이라이트, e = 눈, c = 코랄
const ART = [
  "....oooo....",
  "..oohhhhoo..",
  ".ohhhaaaabo.",
  ".ohaaaaaabo.",
  "ohaaaaaaaabo",
  "ohaaeaaeaabo",
  "ohaaeaaeaabo",
  "ohaaaccaaabo",
  "ohaaaaaaaabo",
  "ohbaaaaaabbo",
  ".obaaaaaabo.",
  ".obbaaaabbo.",
  "..obbbbbbo..",
  "...oooooo...",
];
const MAP: Record<string, string | null> = { ".": null, o: SH, a: A, b: B, h: H, e: E, c: C };
const PX = 8; // 픽셀 한 칸 px

export default function Egg() {
  const w = ART[0].length * PX;
  const h = ART.length * PX;
  return (
    <div className="egg-wrap select-none" aria-hidden>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated", overflow: "visible" }}
      >
        {/* 바닥 그림자 */}
        <ellipse className="egg-shadow" cx={w / 2} cy={h + 6} rx={w * 0.34} ry={PX * 0.6} fill="#000" opacity="0.35" />
        {/* 알 본체 (숨쉬기·꿈틀 애니메이션은 그룹에) */}
        <g className="egg-body" style={{ transformOrigin: `${w / 2}px ${h}px` }}>
          {ART.map((row, y) =>
            row.split("").map((ch, x) => {
              const fill = MAP[ch];
              if (!fill) return null;
              const isEye = ch === "e";
              return (
                <rect
                  key={`${x}-${y}`}
                  x={x * PX}
                  y={y * PX}
                  width={PX}
                  height={PX}
                  fill={fill}
                  className={isEye ? "egg-eye" : undefined}
                />
              );
            }),
          )}
          {/* 부화 균열 — 평소 숨어있다가 가끔 번쩍 */}
          <g className="egg-crack" fill={SH}>
            <rect x={5 * PX} y={0} width={PX} height={PX} />
            <rect x={6 * PX} y={1 * PX} width={PX} height={PX} />
            <rect x={5 * PX} y={2 * PX} width={PX} height={PX} />
            <rect x={6 * PX} y={3 * PX} width={PX} height={PX} />
          </g>
        </g>
      </svg>
    </div>
  );
}
