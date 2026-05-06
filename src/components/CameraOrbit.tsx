import {useFrame} from "@react-three/fiber";
import env from "@/env.ts";
import {setReverbWet} from "@/domain/playSineWave.ts";

export const CameraOrbit = () => {
    useFrame(({camera, clock}) => {
        const t = clock.getElapsedTime();
        const angle = env.VITE_ORBIT_START_ANGLE +
            env.VITE_ORBIT_AMPLITUDE * Math.sin((2 * Math.PI * t) / env.VITE_ORBIT_PERIOD);

        const wetPhase = (2 * Math.PI * t) / env.VITE_REVERB_WET_LFO_PERIOD;
        const u = (Math.sin(wetPhase) + 1) / 2;

        const wet = env.VITE_REVERB_WET_LFO_MIN +
            u * (env.VITE_REVERB_WET_LFO_MAX - env.VITE_REVERB_WET_LFO_MIN);
        setReverbWet(wet);

        const radius = env.VITE_ORBIT_RADIUS_MIN +
            u * (env.VITE_ORBIT_RADIUS_MAX - env.VITE_ORBIT_RADIUS_MIN);
        camera.position.x = radius * Math.cos(angle);
        camera.position.z = radius * Math.sin(angle);
        camera.position.y = env.VITE_ORBIT_HEIGHT;
        camera.lookAt(0, 0, 0);
    });
    return null;
};
