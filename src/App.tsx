import { useEffect, useMemo, useRef, useState } from "react";
import {
  DrawablyButton,
  DrawablyCard,
  DrawablyDivider,
} from "drawably/react";
import { drawablyButton, drawablyCard, drawablyInput } from "drawably";
import { renderBooth } from "./lib/renderBooth";
import bg from "./assets/bg.png";
import cat from "./assets/cat.png";
import cat2 from "./assets/cat2.png";
import { useBooth } from "./store";
import type { FilterId, FrameId, LayoutId } from "./types";
import "./App.css";

const filters: { id: FilterId; label: string; css: string }[] = [
  { id: "original", label: "Original", css: "none" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.6) brightness(.9)" },
  {
    id: "soft-bw",
    label: "Soft B&W",
    css: "grayscale(1) contrast(.72) brightness(1.25)",
  },
  {
    id: "warm",
    label: "Warm",
    css: "sepia(.48) saturate(1.25) contrast(1.12)",
  },
  { id: "film", label: "Film", css: "sepia(.5) saturate(.65) contrast(1.25) brightness(.9)" },
  {
    id: "dreamy",
    label: "Dreamy",
    css: "brightness(1.25) contrast(.62) saturate(1.25)",
  },
  { id: "cool", label: "Cool", css: "saturate(1.35) hue-rotate(18deg) contrast(1.12)" },
  {
    id: "vintage",
    label: "Vintage",
    css: "sepia(.65) saturate(.65) contrast(1.25) brightness(.9)",
  },
];
const frames: { id: FrameId; label: string; swatch: string }[] = [
  { id: "none", label: "None", swatch: "#fffdf8" }, { id: "classic", label: "Classic", swatch: "#fff9ee" },
  { id: "film", label: "Film", swatch: "#292724" }, { id: "polaroid", label: "Polaroid", swatch: "#e5e0d6" },
  { id: "doodle", label: "Doodle", swatch: "#fff9ee" }, { id: "kawaii", label: "Kawaii", swatch: "#ffd6df" },
  { id: "minimal", label: "Minimal", swatch: "#faf8f0" }, { id: "vintage", label: "Vintage", swatch: "#d4c4a8" },
];
const frameColors = ["#fff9ee", "#f7c2c3", "#cbdcf1", "#d6e6c9", "#d9cef2", "#4a4a4a"];
const prompts = [
  "smile!!",
  "okay now be weird.",
  "pretty!!",
  "look here!",
  "✌️?",
  "last one ♡",
];
const stickerOptions = [
  "♡",
  "✿",
  "★",
  "☺",
  "xoxo",
  "REC",
  "cherry",
  "cute!!",
  "→",
];
const maxBoil = 1;
function FilterOptions({
  selected,
  onPick,
}: {
  selected: FilterId;
  onPick: (filter: FilterId) => void;
}) {
  return (
    <div className="picker-grid filters">
      {filters.map((item) => (
        <DrawablyButton
          boil={maxBoil}
          className={
            selected === item.id ? "selected filter-sample" : "filter-sample"
          }
          onClick={() => onPick(item.id)}
          key={item.id}
        >
          <img src={bg} alt="" style={{ filter: item.css }} />
          {item.label}
        </DrawablyButton>
      ))}
    </div>
  );
}

function BoothPreview({ preview, photos, layout, alt }: { preview: string; photos: string[]; layout: LayoutId; alt: string }) {
  if (preview) return <img className="strip-preview" src={preview} alt={alt} />;
  return <div className={`strip-preview strip-fallback strip-fallback-${layout}`} aria-label={alt}>{photos.map((photo, index) => <img src={photo} alt="" key={photo || index} />)}</div>;
}
function App() {
  const booth = useBooth();
  const video = useRef<HTMLVideoElement>(null);
  const captureRun = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [preview, setPreview] = useState("");
  const [activeTool, setActiveTool] = useState<"frame" | "filter" | "sticker">("frame");
  const [giftOpen, setGiftOpen] = useState(false);
  const renderState = useMemo(
    () => ({
      stage: booth.stage,
      layout: booth.layout,
      photoCount: booth.photoCount,
      countdown: booth.countdown,
      filter: booth.filter,
      frame: booth.frame,
      frameColor: booth.frameColor,
      borderWidth: booth.borderWidth,
      photos: booth.photos,
      stickers: booth.stickers,
    }),
    [
      booth.stage,
      booth.layout,
      booth.photoCount,
      booth.countdown,
      booth.filter,
      booth.frame,
      booth.frameColor,
      booth.borderWidth,
      booth.photos,
      booth.stickers,
    ],
  );

  useEffect(
    () => () => stream?.getTracks().forEach((track) => track.stop()),
    [stream],
  );
  useEffect(() => {
    if (video.current && stream) {
      video.current.srcObject = stream;
      void video.current.play().catch(() => undefined);
    }
  }, [stream, booth.stage]);
  useEffect(() => {
    if (!renderState.photos.length) return;
    let alive = true;
    renderBooth(renderState, 1).then((url) => alive && setPreview(url)).catch(() => alive && setPreview(""));
    return () => {
      alive = false;
    };
  }, [renderState]);
  useEffect(() => {
    const options = { boil: maxBoil };
    const sketches = [
      ...document.querySelectorAll<HTMLElement>(
        ".chips button, .layout-options button, .picker-grid button, .toolbox nav button, .stickers button",
      ),
    ]
      .filter((element) => !element.classList.contains("drawably-host"))
      .map((element) =>
        element instanceof HTMLInputElement
          ? drawablyInput(element, options)
          : drawablyButton(element, options),
      );
    sketches.push(
      ...[
        ...document.querySelectorAll<HTMLElement>(
          ".camera-doodle, .small-camera, .camera-area, .composition, .toolbox",
        ),
      ]
        .filter((element) => !element.classList.contains("drawably-host"))
        .map((element) => drawablyCard(element, options)),
    );
    return () => sketches.forEach((sketch) => sketch.destroy());
  });

  const requestCamera = async () => {
    setCameraError("");
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(next);
      booth.setStage("setup");
    } catch {
      setCameraError(
        "I can't see you :( Camera access is turned off or unavailable.",
      );
    }
  };
  const capture = () =>
    new Promise<string | null>((resolve) => {
      const camera = video.current;
      if (!camera?.videoWidth) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = camera.videoWidth;
      canvas.height = camera.videoHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(camera, 0, 0);
      canvas.toBlob(
        (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
        "image/jpeg",
        0.92,
      );
    });
  const startSession = () => {
    const captured: string[] = [];
    booth.setPhotos([]);
    booth.setStage("capturing");
    const wait = (ms: number) =>
      new Promise((resolve) => window.setTimeout(resolve, ms));
    const takeShot = async (shot: number): Promise<void> => {
      for (let n = booth.countdown; n > 0; n -= 1) {
        setCountdown(n);
        await wait(1000);
      }
      setCountdown(null);
      setFlash(true);
      const photo = await capture();
      if (photo) {
        captured.push(photo);
        booth.setPhotos([...captured]);
      }
      await wait(140);
      setFlash(false);
      if (captured.length >= booth.photoCount)
        booth.setStage("session-preview");
      else {
        await wait(750);
        await takeShot(shot + 1);
      }
    };
    void takeShot(0);
  };
  const leaveCapture = () => { captureRun.current += 1; setCountdown(null); setFlash(false); booth.setStage("setup") };
  const download = async () => {
    const url = await renderBooth(booth, 3);
    const link = document.createElement("a");
    link.href = url;
    link.download = "little-booth.png";
    link.click();
  };
  const setLayout = (layout: LayoutId) =>
    booth.patch({
      layout,
      photoCount: ({ "strip-4": 4, "strip-3": 3, "grid-4": 4, "grid-6": 6, collage: 4, wide: 2, polaroid: 1 } as const)[layout],
    });

  if (booth.stage === "home")
    return (
      <main className="landing landing-reference">
        <button
          className="reference-secret top-right"
          onClick={() => setGiftOpen(true)}
          aria-label="A small birthday note"
        >
          same
          <br />
          silly you
          <br />
          always ♡
        </button>
        <p className="corner-message top-left">
          good
          <br />
          photos
          <br />
          happier
          <br />
          days ♡
        </p>
        <span className="corner-arrow top-arrow" aria-hidden="true">
          ↘
        </span>
        <span className="corner-star" aria-hidden="true">
          ☆
        </span>
        <aside className="memory-note bottom-left" aria-hidden="true">
          cute
          <br />
          moments
          <br />
          live here ♡
        </aside>
        <span className="bottom-heart" aria-hidden="true">
          ♡
        </span>
        <aside className="polaroid-stack" aria-hidden="true">
          <i></i>
          <b></b>
          <em>♡</em>
        </aside>
        <section className="reference-hero">
          <div className="reference-title">
            <span>little</span>
            <span>booth</span>
            <i aria-hidden="true">♡</i>
            <b aria-hidden="true"></b>
            <em aria-hidden="true">⌇</em>
          </div>
          <div className="reference-story">
            <DrawablyCard
              boil={maxBoil}
              className="reference-camera"
              aria-hidden="true"
            >
              <span className="camera-shutter"></span>
              <span className="camera-flash"></span>
              <span className="camera-mark">♡</span>
              <span className="camera-lens">
                <i></i>
              </span>
              <span className="camera-smile">⌣</span>
            </DrawablyCard>
            <DrawablyCard
              boil={maxBoil}
              className="reference-note"
              aria-hidden="true"
            >
              a tiny
              <br />
              photobooth
              <br />
              made for you
              <br />
              <span>♡</span>
            </DrawablyCard>
            <span className="camera-spark camera-spark-left" aria-hidden="true">
              ⌇
            </span>
            <span
              className="camera-spark camera-spark-right"
              aria-hidden="true"
            >
              ⌇
            </span>
          </div>
          <DrawablyButton
            boil={maxBoil}
            variant="solid"
            className="primary reference-enter"
            onClick={() => booth.setStage("permission")}
          >
            enter booth <span>→</span>
          </DrawablyButton>
          <p className="reference-steps" aria-hidden="true">
            snap <i>✦</i> smile <i>✦</i> keep
          </p>
          <p className="reference-pager" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </p>
        </section>
        {giftOpen && (
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Birthday note"
          >
            <DrawablyCard boil={maxBoil} className="note-card">
              <button
                onClick={() => setGiftOpen(false)}
                aria-label="Close note"
              >
                ×
              </button>
              <p>
                happy birthday, my love
                <br />
                <br />I made this little place for you because I know how much
                you love taking pictures. Smile looks good on you.
              </p>
            </DrawablyCard>
          </div>
        )}
      </main>
    );
  if (booth.stage === "permission")
    return (
      <main className="center-screen permission-reference">
        <p className="permission-scribble scribble-top" aria-hidden="true">
          camera
          <br />
          on?
          <br />
          cute photos
          <br />
          await! ♡
        </p>
        <span className="permission-arrow" aria-hidden="true">
          ↘
        </span>
        <p className="permission-scribble scribble-bottom" aria-hidden="true">
          good
          <br />
          photos
          <br />
          happier
          <br />
          days ♡
        </p>
        <span className="permission-star" aria-hidden="true">
          ☆
        </span>
        <aside className="permission-tape" aria-hidden="true">
          same
          <br />
          silly you
          <br />
          always ♡
        </aside>
        <DrawablyButton
          boil={maxBoil}
          className="flow-back permission-back"
          onClick={() => booth.setStage("home")}
        >
          ← back
        </DrawablyButton>
        <section className="permission-hero">
          <div className="permission-camera-set" aria-hidden="true">
            <DrawablyCard boil={maxBoil} className="permission-camera">
              <span className="permission-shutter"></span>
              <span className="permission-flash"></span>
              <span className="permission-heart">♡</span>
              <span className="permission-lens">
                <i></i>
              </span>
            </DrawablyCard>
            <DrawablyCard boil={maxBoil} className="permission-polaroid">
              <span>☺</span>
              <small>
                let's take
                <br />
                some memories ♡
              </small>
            </DrawablyCard>
            <i className="permission-camera-heart">♡</i>
            <b className="permission-rays">⌇</b>
          </div>
          <p className="permission-kicker">first things first...</p>
          <h1 className="permission-title">
            let me see you! <span>♡</span>
          </h1>
          <p className="permission-copy">
            little booth needs camera access
            <br />
            to take your photos.
          </p>
          {cameraError && <p className="error">{cameraError}</p>}
          <DrawablyButton
            boil={maxBoil}
            variant="solid"
            className="primary permission-allow"
            onClick={requestCamera}
          >
            <i aria-hidden="true"></i>allow camera
          </DrawablyButton>
          <p className="privacy permission-privacy">
            <i aria-hidden="true">♢</i>your photos stay in your browser.
          </p>
        </section>
      </main>
    );
    if (booth.stage === "setup")
    return (
      <main className="setup-reference">
        <header className="setup-header">
          <DrawablyButton boil={maxBoil} className="flow-back" onClick={() => booth.setStage("permission")}>← back</DrawablyButton>
          <b>little booth <span>♡</span></b>
          <p>your photos <i>stay with you</i> ♡</p>
        </header>
        <p className="setup-note setup-note-left" aria-hidden="true">smile<br />good<br />things<br />ahead ♡</p>
        <span className="setup-swirl setup-swirl-left" aria-hidden="true">⌇</span>
        <aside className="setup-polaroids" aria-hidden="true"><DrawablyCard boil={maxBoil}><span>☺</span><small>more<br />little moments ♡</small></DrawablyCard></aside>
        <aside className="setup-note setup-note-right" aria-hidden="true">same<br />silly you<br />always ♡</aside>
        <span className="setup-swirl setup-swirl-right" aria-hidden="true">⌇</span>
        <img className="setup-cat-asset" src={cat} alt="" aria-hidden="true" />
        <section className="setup-core">
          <DrawablyCard boil={maxBoil} className="setup-camera-frame">
            <video ref={video} autoPlay playsInline muted onLoadedMetadata={(event) => void event.currentTarget.play().catch(() => undefined)} className="camera" style={{ filter: filters.find((item) => item.id === booth.filter)?.css }} />
            <p>ready for some cute photos? ♡</p>
          </DrawablyCard>
          <section className="setup-reference-controls">
            <div className="setup-pair">
              <div><label>▣ frames</label><p className="setup-count">{booth.photoCount} photos</p></div>
              <div><label>◷ timer</label><div className="chips">{([3, 5] as const).map((seconds) => <DrawablyButton boil={maxBoil} className={booth.countdown === seconds ? "selected" : ""} onClick={() => booth.patch({ countdown: seconds })} key={seconds}>{seconds}s</DrawablyButton>)}</div></div>
            </div>
            <div className="setup-layout"><label>▦ layout</label><div className="layout-options">{([['strip-4', '▯', '4-strip'], ['strip-3', '▯', '3-strip'], ['grid-4', '▦', '4-grid'], ['grid-6', '▦', '6-grid'], ['collage', '▧', 'collage'], ['wide', '▭', 'wide'], ['polaroid', '▣', 'polaroid']] as const).map(([id, mark, label]) => <DrawablyButton boil={maxBoil} className={booth.layout === id ? "selected" : ""} onClick={() => setLayout(id)} key={id}><span>{mark}</span>{label}</DrawablyButton>)}</div></div>
            <div className="setup-filter"><label>✦ filter</label><FilterOptions selected={booth.filter} onPick={(filter) => booth.patch({ filter })} /></div>
            <DrawablyButton boil={maxBoil} variant="solid" className="primary setup-start" onClick={startSession}><i aria-hidden="true"></i>start! <span>→</span></DrawablyButton>
          </section>
        </section>
      </main>
    );
  if (booth.stage === "capturing")
    return (
      <main className="capture-reference">
        <header className="capture-header">
          <DrawablyButton boil={maxBoil} className="capture-back" onClick={leaveCapture}>← back</DrawablyButton>
          <b>little booth <span>♡</span></b>
          <p>your photos <i>stay with you</i> ♡</p>
        </header>
        <p className="capture-note capture-note-left" aria-hidden="true">good<br />photos<br />happier<br />days ♡</p>
        <span className="capture-arrow capture-arrow-left" aria-hidden="true">↘</span>
        <p className="capture-note capture-note-right" aria-hidden="true">same<br />silly you<br />always ♡</p>
        <span className="capture-arrow capture-arrow-right" aria-hidden="true">⌇</span>
        <section className="capture-core">
          <DrawablyCard boil={maxBoil} className="capture-frame">
            <video ref={video} autoPlay playsInline muted onLoadedMetadata={(event) => void event.currentTarget.play().catch(() => undefined)} className="camera" style={{ filter: filters.find((item) => item.id === booth.filter)?.css }} />
            {flash && <div className="flash" />}
            <div className="capture-overlay">
              <p>photo {Math.min(booth.photos.length + 1, booth.photoCount)} of {booth.photoCount}</p>
              <strong>{countdown ?? "✦"}</strong>
              <span>{prompts[booth.photos.length % prompts.length]} ♡</span>
            </div>
          </DrawablyCard>
          <img className="capture-cat" src={cat2} alt="" aria-hidden="true" />
          <div className="capture-progress" aria-label={`Photo ${Math.min(booth.photos.length + 1, booth.photoCount)} of ${booth.photoCount}`}>{Array.from({ length: booth.photoCount }, (_, index) => <i className={index < booth.photos.length ? "complete" : index === booth.photos.length ? "current" : ""} key={index}>{index < booth.photos.length ? "✓" : index + 1}</i>)}</div>
          <p className="capture-prompt" aria-hidden="true">smile · be silly · take your time ♡</p>
        </section>
      </main>
    );
  if (booth.stage === "session-preview")
    return (
      <main className="results-reference">
        <p className="results-note results-note-left" aria-hidden="true">same<br />silly you<br />always<br />♡</p>
        <span className="results-arrow" aria-hidden="true">↘</span>
        <aside className="results-note-card" aria-hidden="true">good<br />photos<br />happier<br />days<br />♡</aside>
        <aside className="results-note results-note-right" aria-hidden="true">cute<br />memories<br />forever<br />♡</aside>
        <section className="results-core">
          <h1>they’re cute!! <span>♡</span></h1>
          <p className="results-subtitle">your little moments, all together ♡</p>
          <DrawablyCard boil={maxBoil} className={`results-strip-frame results-${booth.layout}`}>
            <BoothPreview preview={preview} photos={booth.photos} layout={booth.layout} alt="Your completed photobooth photos" />
          </DrawablyCard>
          <span className="results-heart" aria-hidden="true">♡</span>
          <span className="results-sparkles" aria-hidden="true">✧<br />✧</span>
          <img className="results-cat" src={cat} alt="" aria-hidden="true" />
          <p className="results-decorate">decorate it ↓</p>
        </section>
        <div className="action-row results-actions">
          <DrawablyButton
            boil={maxBoil}
            className="flow-back"
            onClick={() => booth.setStage("setup")}
          >
            ← back
          </DrawablyButton>
          <DrawablyButton
            boil={maxBoil}
            variant="solid"
            className="primary"
            onClick={() => booth.setStage("editing")}
          >
            continue
          </DrawablyButton>
          <DrawablyButton
            boil={maxBoil}
            onClick={() => booth.setStage("setup")}
          >
            retake
          </DrawablyButton>
        </div>
      </main>
    );
  return (
    <main className="editor-reference">
      <header className="editor-reference-header">
        <b>little booth <span>♡</span></b>
        <DrawablyButton boil={maxBoil} className="editor-undo" onClick={booth.undo} disabled={!booth.history.length}><span>↶</span> undo</DrawablyButton>
      </header>
      <p className="editor-note editor-note-left" aria-hidden="true">make<br />it cute<br />make it<br />yours ♡</p>
      <span className="editor-arrow" aria-hidden="true">↘</span>
      <p className="editor-note editor-note-right" aria-hidden="true">good<br />photos<br />happier<br />days ♡</p>
      <section className="editor-workspace">
        <DrawablyCard boil={maxBoil} className={`editor-board editor-layout-${booth.layout}`}>
          <i className="editor-tape" aria-hidden="true"></i>
          <BoothPreview preview={preview} photos={booth.photos} layout={booth.layout} alt="Your edited photobooth composition" />
          <img className="editor-cat" src={cat2} alt="" aria-hidden="true" />
          <span className="editor-board-heart" aria-hidden="true">♡</span>
          <span className="editor-board-sparkles" aria-hidden="true">✧<br />✧</span>
        </DrawablyCard>
        <DrawablyCard boil={maxBoil} className="editor-tools">
          <nav>
            {([['frame', '▢', 'Frame'], ['filter', '☷', 'Filter'], ['sticker', '☺', 'Sticker']] as const).map(([tool, icon, label]) => (
              <DrawablyButton boil={maxBoil} className={activeTool === tool ? "selected" : ""} onClick={() => setActiveTool(tool)} key={tool}><i>{icon}</i>{label}</DrawablyButton>
            ))}
          </nav>
          <DrawablyDivider boil={maxBoil} />
          {activeTool === "frame" && <section className="editor-panel">
            <h2>Frames</h2>
            <div className="editor-frame-grid">{frames.map((item) => <DrawablyButton boil={maxBoil} key={item.id} className={booth.frame === item.id ? "selected" : ""} onClick={() => booth.patch({ frame: item.id })}><i className={`frame-swatch frame-${item.id}`} style={{ background: item.swatch }}></i><span>{item.label}</span></DrawablyButton>)}</div>
            <h3>Color</h3>
            <div className="editor-colors">{frameColors.map((color) => <DrawablyButton boil={maxBoil} key={color} className={booth.frameColor === color ? "selected" : ""} onClick={() => booth.patch({ frameColor: color })} aria-label={`Use ${color} frame color`}><i style={{ background: color }}></i></DrawablyButton>)}</div>
            <h3>Border</h3>
            <div className="editor-border"><input type="range" min="0" max="12" value={booth.borderWidth} onChange={(event) => booth.patch({ borderWidth: Number(event.target.value) })} /><output>{booth.borderWidth}px</output></div>
          </section>}
          {activeTool === "filter" && <section className="editor-panel"><h2>Filters</h2><FilterOptions selected={booth.filter} onPick={(filter) => booth.patch({ filter })} /></section>}
          {activeTool === "sticker" && <section className="editor-panel"><h2>Stickers</h2><div className="editor-stickers">{stickerOptions.map((item) => <DrawablyButton boil={maxBoil} key={item} onClick={() => booth.addSticker({ id: crypto.randomUUID(), asset: item, x: 50, y: 50, size: 10, rotation: 0 })}>{item}</DrawablyButton>)}</div></section>}
        </DrawablyCard>
      </section>
      <footer className="editor-reference-footer">
        <DrawablyButton boil={maxBoil} className="flow-back" onClick={() => booth.setStage("session-preview")}>← back</DrawablyButton>
        <p aria-hidden="true">same silly you, always ♡</p>
        <DrawablyButton boil={maxBoil} className="primary" variant="solid" onClick={download}>download strip <span>⇩</span></DrawablyButton>
      </footer>
    </main>
  );
}

export default App;