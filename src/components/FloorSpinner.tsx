import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {useEffect, useMemo, useRef, type RefObject} from "react";
import type {RapierRigidBody} from "@react-three/rapier";
import {playBassNote} from "@/domain/playSineWave.ts";
import env from "@/env.ts";

const TILT_TARGETS = [-1, 0, 1] as const;

type AxisState = {
    currentSign: number;
    targetSign: number;
    swapPending: boolean;
    transition: {startTime: number, fromSign: number, toSign: number} | null;
};

const makeAxisState = (): AxisState => ({
    currentSign: 1,
    targetSign: 1,
    swapPending: false,
    transition: null,
});

const tickAxis = (state: AxisState, t: number) => {
    if (state.swapPending) {
        state.swapPending = false;
        state.transition = {
            startTime: t,
            fromSign: state.currentSign,
            toSign: state.targetSign,
        };
    }
    if (state.transition) {
        const elapsed = t - state.transition.startTime;
        const progress = Math.min(elapsed / env.VITE_TILT_FLIP_DURATION, 1);
        const eased = (1 - Math.cos(progress * Math.PI)) / 2;
        state.currentSign = state.transition.fromSign +
            (state.transition.toSign - state.transition.fromSign) * eased;
        if (progress >= 1) {
            state.transition = null;
        }
    }
    return state.currentSign;
};

const pickNextTarget = (current: number) => {
    const options = TILT_TARGETS.filter(v => v !== current);
    return options[Math.floor(Math.random() * options.length)];
};

type WobbleKick = {t: number, ax: number, az: number};

export const FloorSpinner = ({bodyRef, kicksRef}: {
    bodyRef: RefObject<RapierRigidBody | null>,
    kicksRef: RefObject<WobbleKick[]>,
}) => {
    const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
    const tmpEuler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
    const xAxis = useRef<AxisState>(makeAxisState());
    const zAxis = useRef<AxisState>(makeAxisState());

    useEffect(() => {
        const computeDelay = () => {
            const t = performance.now() / 1000;
            const phase = (2 * Math.PI * t) / env.VITE_TILT_FLIP_LFO_PERIOD;
            const u = (Math.sin(phase) + 1) / 2;
            return env.VITE_TILT_FLIP_MIN_DELAY + u * (env.VITE_TILT_FLIP_MAX_DELAY - env.VITE_TILT_FLIP_MIN_DELAY);
        };
        const scheduleAxis = (axis: RefObject<AxisState>) => {
            let timeoutId: ReturnType<typeof setTimeout>;
            const next = () => {
                timeoutId = setTimeout(() => {
                    axis.current.targetSign = pickNextTarget(axis.current.targetSign);
                    axis.current.swapPending = true;
                    playBassNote();
                    next();
                }, computeDelay());
            };
            next();
            return () => clearTimeout(timeoutId);
        };
        const cleanupX = scheduleAxis(xAxis);
        const cleanupZ = scheduleAxis(zAxis);
        return () => {
            cleanupX();
            cleanupZ();
        };
    }, []);

    useFrame(({clock}) => {
        const t = clock.getElapsedTime();
        const xSign = tickAxis(xAxis.current, t);
        const zSign = tickAxis(zAxis.current, t);

        const yAngle = env.VITE_FLOOR_AMPLITUDE * Math.sin((2 * Math.PI * t) / env.VITE_FLOOR_PERIOD);

        const now = performance.now() / 1000;
        const kicks = kicksRef.current;
        const cutoff = env.VITE_WOBBLE_DECAY * 4;
        let wobbleX = 0;
        let wobbleZ = 0;
        for (let i = kicks.length - 1; i >= 0; i--) {
            const k = kicks[i];
            const age = now - k.t;
            if (age > cutoff) {
                kicks.splice(i, 1);
                continue;
            }
            const envelope = Math.exp(-age / env.VITE_WOBBLE_DECAY);
            const osc = Math.sin(2 * Math.PI * env.VITE_WOBBLE_FREQUENCY * age);
            wobbleX += k.ax * envelope * osc;
            wobbleZ += k.az * envelope * osc;
        }

        tmpEuler.set(
            env.VITE_FLOOR_TILT * xSign + wobbleX * env.VITE_WOBBLE_AMPLITUDE,
            yAngle,
            env.VITE_FLOOR_TILT * zSign + wobbleZ * env.VITE_WOBBLE_AMPLITUDE,
            "YXZ",
        );
        tmpQuat.setFromEuler(tmpEuler);
        bodyRef.current?.setNextKinematicRotation(tmpQuat);
    });
    return null;
};
