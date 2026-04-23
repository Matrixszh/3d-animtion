"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const FRAME_COUNT = 227;
const SCROLL_HEIGHT_DESKTOP = 500;
const SCROLL_HEIGHT_MOBILE = 620;
const MOBILE_BREAKPOINT = 768;
const PRODUCT_SCALE_DESKTOP = 0.74;
const PRODUCT_SCALE_MOBILE = 0.62;
const PRODUCT_SHIFT_DESKTOP = 0.2;
const PRODUCT_SHIFT_MOBILE = 0.08;
const FINALE_CENTER_BIAS_DESKTOP = 0.038;
const FINALE_CENTER_BIAS_MOBILE = 0.02;

type StoryPanel = {
  id: string;
  align: "left" | "right" | "center";
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  body: string;
};

const storyPanels: StoryPanel[] = [
  {
    id: "craft",
    align: "left",
    start: 0.16,
    end: 0.38,
    eyebrow: "Craftsmanship",
    title: "Grace, shaped with precision.",
    body: "Polished gold contours and translucent wings create a silhouette that feels refined, composed, and quietly distinctive.",
  },
  {
    id: "reveal",
    align: "right",
    start: 0.5,
    end: 0.74,
    eyebrow: "Design Detail",
    title: "Every element in balance.",
    body: "As the butterfly opens, each component is revealed with clarity, turning ornament into a study of proportion, material, and light.",
  },
  {
    id: "finale",
    align: "center",
    start: 0.78,
    end: 1,
    eyebrow: "Final Form",
    title: "Returned to the icon.",
    body: "The butterfly settles back into a singular silhouette, clean, cinematic, and unmistakably premium.",
  },
];

const specCards = [
  {
    label: "Metal",
    value: "Polished Gold",
    description: "Warm-toned edges with mirror-finished highlights.",
  },
  {
    label: "Stones",
    value: "Crystal Blue",
    description: "Glass-like facets that shift between smoke and ice.",
  },
  {
    label: "Silhouette",
    value: "Butterfly Form",
    description: "Balanced proportions tuned for elegance and presence.",
  },
  {
    label: "Finish",
    value: "Collector Grade",
    description: "Luxury detailing crafted to feel engineered, not ornate.",
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) {
    return outMin;
  }

  const progress = clamp((value - inMin) / (inMax - inMin));
  return outMin + (outMax - outMin) * progress;
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getFrameSource(index: number) {
  return `/butterfly3/ezgif-frame-${String(index + 1).padStart(3, "0")}.png`;
}

function findClosestLoadedFrame(
  images: (HTMLImageElement | null)[],
  frameIndex: number,
) {
  const currentImage = images[frameIndex];

  if (currentImage?.complete) {
    return { image: currentImage, index: frameIndex };
  }

  for (let offset = 1; offset < FRAME_COUNT; offset += 1) {
    const previousIndex = frameIndex - offset;
    if (previousIndex >= 0) {
      const previousImage = images[previousIndex];
      if (previousImage?.complete) {
        return { image: previousImage, index: previousIndex };
      }
    }

    const nextIndex = frameIndex + offset;
    if (nextIndex < FRAME_COUNT) {
      const nextImage = images[nextIndex];
      if (nextImage?.complete) {
        return { image: nextImage, index: nextIndex };
      }
    }
  }

  return { image: null, index: -1 };
}

function getPanelOpacity(progress: number, start: number, end: number) {
  const fadeInStart = Math.max(0, start - 0.06);
  const fadeOutEnd = Math.min(1, end + 0.06);

  if (progress < fadeInStart || progress > fadeOutEnd) {
    return 0;
  }

  if (progress < start) {
    return easeInOutCubic(mapRange(progress, fadeInStart, start, 0, 1));
  }

  if (progress > end) {
    return easeInOutCubic(mapRange(progress, fadeOutEnd, end, 0, 1));
  }

  return 1;
}

function getProductOffset(progress: number, viewportWidth: number) {
  const maxOffset =
    viewportWidth * (viewportWidth < MOBILE_BREAKPOINT ? PRODUCT_SHIFT_MOBILE : PRODUCT_SHIFT_DESKTOP);

  if (progress <= 0.14) {
    return 0;
  }

  if (progress <= 0.34) {
    return mapRange(progress, 0.14, 0.34, 0, maxOffset);
  }

  if (progress <= 0.55) {
    return mapRange(progress, 0.34, 0.55, maxOffset, -maxOffset);
  }

  if (progress <= 0.74) {
    return -maxOffset;
  }

  if (progress <= 1) {
    return mapRange(progress, 0.74, 1, -maxOffset, 0);
  }

  return 0;
}

function getFinaleCenterBias(progress: number, viewportWidth: number) {
  const maxBias =
    viewportWidth *
    (viewportWidth < MOBILE_BREAKPOINT
      ? FINALE_CENTER_BIAS_MOBILE
      : FINALE_CENTER_BIAS_DESKTOP);

  if (progress <= 0.78) {
    return 0;
  }

  return mapRange(progress, 0.78, 1, 0, maxBias);
}

function StoryPanels({ progress }: { progress: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {storyPanels.map((panel) => {
        const opacity = getPanelOpacity(progress, panel.start, panel.end);
        const translateX =
          panel.align === "left" ? -28 * (1 - opacity) : panel.align === "right" ? 28 * (1 - opacity) : 0;
        const justifyClass =
          panel.align === "left"
            ? "justify-start text-left"
            : panel.align === "right"
              ? "justify-end text-right"
              : "justify-center text-center";
        const itemsClass =
          panel.align === "center"
            ? "items-center"
            : panel.align === "left"
              ? "items-start"
              : "items-end";
        const containerClass =
          panel.align === "center"
            ? "items-end pb-14 sm:pb-18 lg:pb-22"
            : "items-start";

        return (
          <div
            key={panel.id}
            className={`absolute inset-0 flex px-6 sm:px-8 lg:px-12 ${justifyClass} ${containerClass}`}
            style={{
              opacity,
              transform: `translate3d(${translateX}px, 0, 0)`,
            }}
          >
            <div
              className={`flex flex-col gap-4 ${itemsClass} ${
                panel.align === "center"
                  ? "mx-auto w-full max-w-2xl"
                  : "mt-24 max-w-xs sm:mt-28 sm:max-w-sm lg:mt-32 lg:max-w-md"
              }`}
            >
              <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/48 backdrop-blur-md">
                {panel.eyebrow}
              </span>
              <h2 className="text-3xl font-semibold tracking-[-0.06em] text-white/92 sm:text-5xl">
                {panel.title}
              </h2>
              <p className="max-w-md text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
                {panel.body}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function JewelleryExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const animationRafRef = useRef<number | null>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const renderedFrameRef = useRef(-1);
  const targetProgressRef = useRef(0);
  const smoothProgressRef = useRef(0);
  const [navVisible, setNavVisible] = useState(false);
  const [framesReady, setFramesReady] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);

  const frameSources = useMemo(
    () => Array.from({ length: FRAME_COUNT }, (_, index) => getFrameSource(index)),
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateViewportMode = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    const update = () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const travel = rect.height - viewportHeight;
      const nextProgress = clamp(-rect.top / Math.max(travel, 1));

      targetProgressRef.current = nextProgress;
      setStoryProgress(nextProgress);
      setNavVisible(window.scrollY > 28);
    };

    const onScroll = () => {
      if (scrollRafRef.current !== null) {
        return;
      }

      scrollRafRef.current = window.requestAnimationFrame(() => {
        update();
        scrollRafRef.current = null;
      });
    };

    const onResize = () => {
      updateViewportMode();
      onScroll();
    };

    updateViewportMode();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);

      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let readyCount = 0;

    imagesRef.current = frameSources.map((source, index) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = source;
      image.onload = () => {
        if (cancelled) {
          return;
        }

        readyCount += 1;
        setFramesReady(readyCount);

        if (index === 0) {
          renderedFrameRef.current = -1;
        }
      };
      return image;
    });

    return () => {
      cancelled = true;
      imagesRef.current = [];
    };
  }, [frameSources]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      return;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";

    const drawFrame = (progressValue: number) => {
      const frameIndex = Math.round(easeInOutCubic(progressValue) * (FRAME_COUNT - 1));
      const { image, index } = findClosestLoadedFrame(imagesRef.current, frameIndex);

      if (!image) {
        return;
      }

      if (renderedFrameRef.current === index && canvas.width > 0) {
        return;
      }

      renderedFrameRef.current = index;
      context.fillStyle = "#000000";
      context.fillRect(0, 0, canvas.width, canvas.height);

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const deviceRatio = canvas.width / Math.max(viewportWidth, 1);
      const fitScale = Math.min(viewportWidth / image.width, viewportHeight / image.height);
      const presentationScale =
        viewportWidth < MOBILE_BREAKPOINT
          ? PRODUCT_SCALE_MOBILE
          : PRODUCT_SCALE_DESKTOP;
      const scale = fitScale * presentationScale * deviceRatio;
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const x =
        (canvas.width - drawWidth) / 2 +
        (getProductOffset(progressValue, viewportWidth) +
          getFinaleCenterBias(progressValue, viewportWidth)) *
          deviceRatio;
      const y =
        viewportWidth < MOBILE_BREAKPOINT
          ? (canvas.height - drawHeight) / 2 - canvas.height * 0.03
          : (canvas.height - drawHeight) / 2;

      context.drawImage(image, x, y, drawWidth, drawHeight);
    };

    const resizeCanvas = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const { innerWidth, innerHeight } = window;

      canvas.width = Math.floor(innerWidth * ratio);
      canvas.height = Math.floor(innerHeight * ratio);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;

      renderedFrameRef.current = -1;
      drawFrame(smoothProgressRef.current);
    };

    const animate = () => {
      const delta = targetProgressRef.current - smoothProgressRef.current;
      const shouldSnap = Math.abs(delta) < 0.0005;

      smoothProgressRef.current = shouldSnap
        ? targetProgressRef.current
        : smoothProgressRef.current + delta * 0.12;

      drawFrame(smoothProgressRef.current);
      animationRafRef.current = window.requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRafRef.current !== null) {
        window.cancelAnimationFrame(animationRafRef.current);
      }
    };
  }, [framesReady]);

  return (
    <main className="min-h-screen bg-black text-white">
      <header
        className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6 lg:px-8"
        style={{
          opacity: navVisible ? 1 : 0.18,
          transform: `translate3d(0, ${navVisible ? "0" : "-10px"}, 0)`,
          transition: "opacity 500ms ease, transform 500ms ease",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[rgba(5,5,5,0.75)] px-4 py-3 shadow-[0_16px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-6">
          <Link
            href="#top"
            className="text-sm font-medium tracking-[-0.02em] text-white/88"
          >
            Nurs Purple
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/58 md:flex">
            <Link href="#overview" className="transition-colors hover:text-white">
              Overview
            </Link>
            <Link href="#products" className="transition-colors hover:text-white">
              Products
            </Link>
            <Link href="#about" className="transition-colors hover:text-white">
              About
            </Link>
            <Link href="#contact" className="transition-colors hover:text-white">
              Contact
            </Link>
          </nav>

          <Link
            href="#products"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#6c49b7]/45 bg-[linear-gradient(135deg,rgba(94,55,167,0.18),rgba(153,114,212,0.08))] px-4 text-sm font-semibold text-white shadow-[0_0_24px_rgba(108,73,183,0.14)] transition-transform duration-300 hover:scale-[1.02]"
          >
            Discover
          </Link>
        </div>
      </header>

      <section
        id="top"
        className="relative overflow-clip bg-black"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(102,61,178,0.12),transparent_34%),radial-gradient(circle_at_50%_34%,rgba(169,127,223,0.06),transparent_42%)]" />
        <div className="mx-auto flex min-h-screen max-w-7xl items-end px-6 pb-14 pt-28 sm:px-8 sm:pb-20 lg:px-12">
          <div className="max-w-4xl">
            <span className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.38em] text-white/52 backdrop-blur-md sm:text-[11px]">
              High Jewellery
            </span>
            <h1 className="max-w-5xl text-5xl font-semibold tracking-[-0.08em] text-white/94 sm:text-7xl lg:text-[7.5rem] lg:leading-[0.9]">
              Jewellery, revealed with quiet drama.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
              A sculptural butterfly pendant presented against deep black, with
              a restrained violet atmosphere and a calm sense of movement.
            </p>
          </div>
        </div>
      </section>

      <section
        id="overview"
        ref={sectionRef}
        className="relative"
        style={{
          height: `${isMobile ? SCROLL_HEIGHT_MOBILE : SCROLL_HEIGHT_DESKTOP}vh`,
        }}
      >
        <div className="sticky top-0 h-screen overflow-hidden bg-black">
          <div className="absolute inset-0 bg-black" />
          <StoryPanels progress={storyProgress} />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-label="Jewellery butterfly image sequence"
          />
        </div>
      </section>

      <section
        id="products"
        className="relative border-t border-white/8 bg-black px-6 py-24 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.38em] text-white/45">
              Maison Details
            </span>
            <h2 className="mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-white/92 sm:text-6xl">
              Elegance shaped with restraint.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
              The butterfly moves from presence to detail and back again,
              revealing a composition of form, material, and symmetry with a
              calm, luxurious rhythm.
            </p>
          </div>

          <div className="grid gap-4">
            {specCards.map((card) => (
              <article
                key={card.label}
                className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 shadow-[0_22px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/42">
                  {card.label}
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white/92">
                  {card.value}
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="relative border-t border-white/8 bg-black px-6 py-24 sm:px-8 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
              Story Beat 01
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white/90">
              Assembled presence
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/58">
              The opening frame keeps the butterfly monumental and still, like a
              museum-lit hero object suspended in a black void.
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
              Story Beat 02
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white/90">
              Exploded craftsmanship
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/58">
              Mid-scroll, the form separates into a technical composition that
              makes every contour, jewel setting, and central structure legible.
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
              Story Beat 03
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-white/90">
              Return to icon
            </h3>
            <p className="mt-4 text-sm leading-6 text-white/58">
              The final motion resolves back to the signature silhouette, framing
              the piece as both collectible object and engineered artwork.
            </p>
          </article>
        </div>
      </section>

      <footer
        id="contact"
        className="border-t border-white/8 bg-[#050505] px-6 py-16 sm:px-8 lg:px-12"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-8 shadow-[0_22px_90px_rgba(0,0,0,0.38)] lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/45">
              Final Call
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white/92 sm:text-6xl">
              Made to be remembered.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/58 sm:text-lg sm:leading-8">
              Nurs Purple brings together sculptural beauty, quiet luxury, and a
              sense of modern romance.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="#top"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#6c49b7]/45 bg-[linear-gradient(135deg,rgba(94,55,167,0.18),rgba(153,114,212,0.08))] px-6 text-sm font-semibold text-white shadow-[0_0_24px_rgba(108,73,183,0.14)] transition-transform duration-300 hover:scale-[1.02]"
            >
              Rewatch Reveal
            </Link>
            <Link
              href="mailto:atelier@nurspurple.com"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              Contact Atelier
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
