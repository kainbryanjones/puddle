import * as THREE from "three";
import {Canvas, useFrame} from "@react-three/fiber";
import {Suspense, useCallback, useEffect, useRef, useState, type RefObject} from "react";
import {BallCollider, ConeCollider, CuboidCollider, interactionGroups, Physics, RigidBody, type RapierRigidBody} from "@react-three/rapier";
import {Box} from "@react-three/drei";
import playSineWave from "@/domain/playSineWave.ts";
import getRandomInt from "@/domain/getRandomInt.ts";
import {OPEN_COLOUR_DARK, OPEN_COLOUR_FLAT, OPEN_COLOUR_LIGHT} from "@/domain/colours.ts";
import {useAudioStart} from "@/hooks/useAudioStart.ts";
import {useToneContext} from "@/hooks/useToneContext.ts";
import {CameraOrbit} from "@/components/CameraOrbit.tsx";
import {FloorSpinner} from "@/components/FloorSpinner.tsx";
import {FloorColourTransition} from "@/components/FloorColourTransition.tsx";
import {BackgroundText} from "@/components/BackgroundText.tsx";
import env from "@/env.ts";

const SPHERES = 1;
const FLOORS = 2;
const SPHERE_GROUPS = interactionGroups(SPHERES, FLOORS);
const FLOOR_GROUPS = interactionGroups(FLOORS, SPHERES);
const SPHERE_GEOMETRY = new THREE.SphereGeometry(env.VITE_SPHERE_BASE_RADIUS);
const CUBE_GEOMETRY = new THREE.BoxGeometry(
    env.VITE_SPHERE_BASE_RADIUS * 2,
    env.VITE_SPHERE_BASE_RADIUS * 2,
    env.VITE_SPHERE_BASE_RADIUS * 2,
);
const PYRAMID_GEOMETRY = new THREE.ConeGeometry(
    env.VITE_SPHERE_BASE_RADIUS,
    env.VITE_SPHERE_BASE_RADIUS * 2,
    4,
);
const SPHERE_MATERIALS: Record<string, THREE.MeshStandardMaterial> = Object.fromEntries(
    OPEN_COLOUR_FLAT.map(c => [c, new THREE.MeshStandardMaterial({color: c})]),
);
const randomColour = () => {
    const pool = Math.random() < 0.98 ? OPEN_COLOUR_LIGHT : OPEN_COLOUR_DARK;
    return pool[Math.floor(Math.random() * pool.length)];
};

type Shape = "sphere" | "cube" | "pyramid";
const pickShape = (): Shape => {
    const r = Math.random();
    if (r < 1 / 3) return "cube";
    if (r < 2 / 3) return "pyramid";
    return "sphere";
};

type ShapeState = {
    id: number,
    position: [number, number, number],
    rotation: [number, number, number],
    colour: string,
    scale: number,
    octave: number,
    shape: Shape,
};

type WobbleKick = {t: number, ax: number, az: number};

const ShapeBody = ({s, floorColourQueueRef, wobbleKicksRef, onFall}: {
    s: ShapeState,
    floorColourQueueRef: RefObject<string[]>,
    wobbleKicksRef: RefObject<WobbleKick[]>,
    onFall: (id: number) => void,
}) => {
    const bodyRef = useRef<RapierRigidBody>(null);
    const r = env.VITE_SPHERE_BASE_RADIUS * s.scale;
    const geometry = s.shape === "cube" ? CUBE_GEOMETRY
        : s.shape === "pyramid" ? PYRAMID_GEOMETRY
        : SPHERE_GEOMETRY;

    useFrame(() => {
        const body = bodyRef.current;
        if (!body) return;
        if (body.translation().y < env.VITE_SHAPE_KILL_Y) {
            onFall(s.id);
        }
    });

    return (
        <RigidBody ref={bodyRef}
                   onCollisionEnter={() => {
                       playSineWave(
                           s.octave,
                           s.shape === "cube" ? "square"
                               : s.shape === "pyramid" ? "sawtooth"
                               : "sine",
                       );
                       if (floorColourQueueRef.current.length < env.VITE_COLOUR_QUEUE_MAX) {
                           floorColourQueueRef.current.push(s.colour);
                       }
                       const kicks = wobbleKicksRef.current;
                       if (kicks.length < env.VITE_WOBBLE_QUEUE_MAX) {
                           kicks.push({
                               t: performance.now() / 1000,
                               ax: (Math.random() - 0.5) * 2 * s.scale,
                               az: (Math.random() - 0.5) * 2 * s.scale,
                           });
                       }
                   }}
                   collisionGroups={SPHERE_GROUPS}
                   position={s.position}
                   rotation={s.rotation}
                   colliders={false}
                   ccd>
            <mesh geometry={geometry}
                  material={SPHERE_MATERIALS[s.colour]}
                  scale={s.scale}/>
            {s.shape === "sphere" && <BallCollider args={[r]}/>}
            {s.shape === "cube" && <CuboidCollider args={[r, r, r]}/>}
            {s.shape === "pyramid" && <ConeCollider args={[r, r]}/>}
        </RigidBody>
    );
};

const octaveToScale = (octave: number) => {
    const range = env.VITE_PITCH_MAX - env.VITE_PITCH_MIN;
    if (range === 0) return env.VITE_SPHERE_SCALE_MAX;
    const t = (octave - env.VITE_PITCH_MIN) / range;
    return env.VITE_SPHERE_SCALE_MAX - t * (env.VITE_SPHERE_SCALE_MAX - env.VITE_SPHERE_SCALE_MIN);
};

const App = () => {
    const [
        started,
        start,
        loading,
    ] = useAudioStart();
    const toneLoaded = useToneContext();

    const [spheres, setSpheres] = useState<ShapeState[]>([]);
    const [focused, setFocused] = useState(() => document.hasFocus());
    const floorMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
    const floorColourQueueRef = useRef<string[]>([]);
    const floorBodyRef = useRef<RapierRigidBody>(null);
    const wobbleKicksRef = useRef<WobbleKick[]>([]);
    const buttonWobbleRef = useRef<HTMLDivElement>(null);

    const handleFall = useCallback((id: number) => {
        setSpheres(prev => prev.filter(s => s.id !== id));
    }, []);

    useEffect(() => {
        let raf = 0;
        const tick = () => {
            const node = buttonWobbleRef.current;
            if (node) {
                const now = performance.now() / 1000;
                const cutoff = env.VITE_WOBBLE_DECAY * 4;
                let wobbleX = 0;
                let wobbleZ = 0;
                for (const k of wobbleKicksRef.current) {
                    const age = now - k.t;
                    if (age > cutoff) continue;
                    const envelope = Math.exp(-age / env.VITE_WOBBLE_DECAY);
                    const osc = Math.sin(2 * Math.PI * env.VITE_WOBBLE_FREQUENCY * age);
                    wobbleX += k.ax * envelope * osc;
                    wobbleZ += k.az * envelope * osc;
                }
                const px = env.VITE_BUTTON_WOBBLE_PX;
                node.style.transform = `translate(${wobbleX * px}px, ${wobbleZ * px}px)`;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    useEffect(() => {
        const onBlur = () => setFocused(false);
        const onFocus = () => setFocused(true);
        window.addEventListener("blur", onBlur);
        window.addEventListener("focus", onFocus);
        return () => {
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    useEffect(() => {
        if (!focused) return;
        const interval = setInterval(() => {
            const time = Date.now();
            const batch = getRandomInt(env.VITE_SPAWN_BATCH_MIN, env.VITE_SPAWN_BATCH_MAX);
            const newBatch = Array.from({length: batch}, (_, i) => {
                const octave = getRandomInt(env.VITE_PITCH_MIN, env.VITE_PITCH_MAX);
                return {
                    id: time + i,
                    position: [
                        (Math.random() - 0.5) * env.VITE_SPAWN_SPREAD_X,
                        env.VITE_SPAWN_HEIGHT + Math.random() * env.VITE_SPAWN_SPREAD_Y,
                        (Math.random() - 0.5) * env.VITE_SPAWN_SPREAD_Z,
                    ] as [number, number, number],
                    rotation: [
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                        Math.random() * Math.PI * 2,
                    ] as [number, number, number],
                    colour: randomColour(),
                    scale: octaveToScale(octave),
                    octave,
                    shape: pickShape(),
                };
            });
            setSpheres(prev => {
                const start = prev.length > env.VITE_SPHERE_TRIM_THRESHOLD ? env.VITE_SPHERE_TRIM_COUNT : 0;
                return prev.length === 0 && batch === 0
                    ? prev
                    : [...prev.slice(start), ...newBatch];
            });
        }, env.VITE_SPAWN_INTERVAL);
        return () => clearInterval(interval);
    }, [focused]);

    const isLoading = loading || !toneLoaded;
    const overlayHidden = started && toneLoaded;
    return <>
        <Canvas
            camera={{
                position: [2, 2, 2],
            }}
            dpr={[1, 1.5]}
            gl={{antialias: false, powerPreference: "high-performance"}}
            style={{
                height: "100vh",
            }}>
            <CameraOrbit/>
            <ambientLight intensity={0.3}/>
            <directionalLight
                lookAt={[0, 0, 0]}
                position={[0, 5, 0]}
                intensity={2}
            />
            <pointLight position={[-5, 5, -5]}
                        intensity={0.5}/>
            <Suspense>
                <BackgroundText kicksRef={wobbleKicksRef}/>
                <Physics gravity={[0, -9.81 / env.VITE_GRAVITY_DIVISOR, 0]}>
                    {spheres.map(s => (
                        <ShapeBody key={s.id}
                                   s={s}
                                   floorColourQueueRef={floorColourQueueRef}
                                   wobbleKicksRef={wobbleKicksRef}
                                   onFall={handleFall}/>
                    ))}
                    <RigidBody ref={floorBodyRef}
                               type={"kinematicPosition"}
                               collisionGroups={FLOOR_GROUPS}
                               restitution={env.VITE_FLOOR_RESTITUTION}>
                        <Box args={[2, 0.1, 2]}>
                            <meshStandardMaterial ref={floorMaterialRef} color={env.VITE_FLOOR_INITIAL_COLOUR}/>
                        </Box>
                    </RigidBody>
                    <FloorSpinner bodyRef={floorBodyRef} kicksRef={wobbleKicksRef}/>
                    <FloorColourTransition materialRef={floorMaterialRef} queueRef={floorColourQueueRef}/>
                </Physics>
            </Suspense>
        </Canvas>
        <div style={{
                 backdropFilter: `blur(${env.VITE_START_OVERLAY_BLUR_PX}px)`,
                 WebkitBackdropFilter: `blur(${env.VITE_START_OVERLAY_BLUR_PX}px)`,
             }}
             className={`fixed inset-0 flex items-center justify-center transition-opacity duration-700 ${overlayHidden ? "pointer-events-none opacity-0" : "opacity-100"}`}>
            <div ref={buttonWobbleRef} className="will-change-transform">
                <button disabled={isLoading}
                        onClick={start}
                        className="cursor-pointer rounded-full bg-white px-10 py-3 text-lg font-medium tracking-wide text-neutral-900 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.75),0_8px_20px_-4px_rgba(0,0,0,0.5)] transition hover:scale-105 hover:bg-neutral-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    {isLoading ? "loading..." : "start"}
                </button>
            </div>
        </div>
    </>;
};
export default App;
