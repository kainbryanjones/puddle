import * as THREE from "three";
import {useRef, type RefObject} from "react";
import {useFrame} from "@react-three/fiber";
import {Billboard, Text} from "@react-three/drei";
import env from "@/env.ts";

type WobbleKick = {t: number, ax: number, az: number};

const BACKGROUND_DISTANCE = 30;
const FONT_SIZE = 16;
const TEXT_COLOR = "#f8f9fa";
const OUTLINE_WIDTH = FONT_SIZE * 0.04;
const TEXT_OPACITY = 0.1;
const WOBBLE_MULTIPLIER = 0.5;

export const BackgroundText = ({kicksRef}: {
    kicksRef: RefObject<WobbleKick[]>,
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const wobbleRef = useRef<THREE.Group>(null);
    const textRef = useRef<{fillOpacity: number, outlineOpacity: number} | null>(null);
    const forwardRef = useRef(new THREE.Vector3());

    useFrame(({camera}) => {
        const group = groupRef.current;
        if (group) {
            camera.getWorldDirection(forwardRef.current);
            group.position.copy(camera.position).addScaledVector(forwardRef.current, BACKGROUND_DISTANCE);
        }

        const wobbleGroup = wobbleRef.current;
        if (!wobbleGroup) return;
        const now = performance.now() / 1000;
        const kicks = kicksRef.current;
        const cutoff = env.VITE_WOBBLE_DECAY * 4;
        const amp = env.VITE_WOBBLE_AMPLITUDE * WOBBLE_MULTIPLIER;
        let wobbleX = 0;
        let wobbleZ = 0;
        for (const k of kicks) {
            const age = now - k.t;
            if (age > cutoff) continue;
            const envelope = Math.exp(-age / env.VITE_WOBBLE_DECAY);
            const osc = Math.sin(2 * Math.PI * env.VITE_WOBBLE_FREQUENCY * age);
            wobbleX += k.ax * envelope * osc;
            wobbleZ += k.az * envelope * osc;
        }
        wobbleGroup.rotation.set(wobbleX * amp, 0, wobbleZ * amp);

        const text = textRef.current;
        if (text) {
            const horizDist = Math.hypot(camera.position.x, camera.position.z);
            const span = env.VITE_ORBIT_RADIUS_MAX - env.VITE_ORBIT_RADIUS_MIN;
            const t = span === 0 ? 0 : (horizDist - env.VITE_ORBIT_RADIUS_MIN) / span;
            const proximity = 1 - Math.min(1, Math.max(0, t));
            const opacity = TEXT_OPACITY * proximity;
            text.fillOpacity = opacity;
            text.outlineOpacity = opacity;
        }
    });

    return (
        <group ref={groupRef}>
            <Billboard>
                <group ref={wobbleRef}>
                    <Text ref={textRef}
                          fontSize={FONT_SIZE}
                          color={TEXT_COLOR}
                          fillOpacity={TEXT_OPACITY}
                          outlineWidth={OUTLINE_WIDTH}
                          outlineColor={TEXT_COLOR}
                          outlineOpacity={TEXT_OPACITY}
                          anchorX="center"
                          anchorY="middle">
                        PUDDLE
                    </Text>
                </group>
            </Billboard>
        </group>
    );
};
