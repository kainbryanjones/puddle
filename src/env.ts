import {z} from "zod";

const parser = z.object({
    // Audio - main synth
    VITE_SYNTH_VOLUME: z.coerce.number().catch(-8),
    VITE_SYNTH_MAX_POLYPHONY: z.coerce.number().int().catch(4),
    VITE_REVERB_DECAY: z.coerce.number().catch(12),
    VITE_REVERB_WET: z.coerce.number().catch(0.5),
    VITE_REVERB_WET_LFO_MIN: z.coerce.number().catch(0.2),
    VITE_REVERB_WET_LFO_MAX: z.coerce.number().catch(0.8),
    VITE_REVERB_WET_LFO_PERIOD: z.coerce.number().catch(30),
    VITE_REVERB_PREDELAY: z.coerce.number().catch(0),
    VITE_COMPRESSOR_THRESHOLD: z.coerce.number().catch(-12),
    VITE_COMPRESSOR_RATIO: z.coerce.number().catch(4),
    VITE_COMPRESSOR_ATTACK: z.coerce.number().catch(0.01),
    VITE_COMPRESSOR_RELEASE: z.coerce.number().catch(0.15),
    VITE_COMPRESSOR_KNEE: z.coerce.number().catch(12),
    VITE_FILTER_FREQ: z.coerce.number().catch(1200),
    VITE_FILTER_ROLLOFF: z.coerce.number().catch(-24),
    VITE_SYNTH_ATTACK: z.coerce.number().catch(0.01),
    VITE_SYNTH_DECAY: z.coerce.number().catch(0.1),
    VITE_SYNTH_SUSTAIN: z.coerce.number().catch(0),
    VITE_SYNTH_RELEASE: z.coerce.number().catch(0),

    // Audio - noise
    VITE_NOISE_FILTER_FREQ: z.coerce.number().catch(250),
    VITE_NOISE_FILTER_ROLLOFF: z.coerce.number().catch(-24),
    VITE_NOISE_VOLUME: z.coerce.number().catch(-32),

    // Audio - bass
    VITE_BASS_REVERB_DECAY: z.coerce.number().catch(12),
    VITE_BASS_REVERB_WET: z.coerce.number().catch(0.25),
    VITE_BASS_SYNTH_VOLUME: z.coerce.number().catch(-6),
    VITE_BASS_OCTAVE: z.coerce.number().int().catch(2),
    VITE_BASS_ATTACK: z.coerce.number().catch(0.05),
    VITE_BASS_DECAY: z.coerce.number().catch(0.5),
    VITE_BASS_SUSTAIN: z.coerce.number().catch(0.3),
    VITE_BASS_RELEASE: z.coerce.number().catch(4),

    // Audio - pitch
    VITE_PITCH_MIN: z.coerce.number().int().catch(5),
    VITE_PITCH_MAX: z.coerce.number().int().catch(7),

    // Visual - spawn
    VITE_SPAWN_INTERVAL: z.coerce.number().int().catch(100),
    VITE_SPAWN_BATCH_MIN: z.coerce.number().int().catch(0),
    VITE_SPAWN_BATCH_MAX: z.coerce.number().int().catch(1),
    VITE_SPAWN_SPREAD_X: z.coerce.number().catch(4 / 3),
    VITE_SPAWN_SPREAD_Y: z.coerce.number().catch(0.4 * 2 / 3),
    VITE_SPAWN_SPREAD_Z: z.coerce.number().catch(4 / 3),
    VITE_SPAWN_HEIGHT: z.coerce.number().catch(5),

    // Visual - sphere
    VITE_SPHERE_BASE_RADIUS: z.coerce.number().catch(0.05),
    VITE_SPHERE_SCALE_MIN: z.coerce.number().catch(0.5),
    VITE_SPHERE_SCALE_MAX: z.coerce.number().catch(2),
    VITE_SPHERE_TRIM_THRESHOLD: z.coerce.number().int().catch(100),
    VITE_SPHERE_TRIM_COUNT: z.coerce.number().int().catch(10),

    // Visual - physics
    VITE_GRAVITY_DIVISOR: z.coerce.number().int().min(1).max(10).catch(2),
    VITE_SHAPE_KILL_Y: z.coerce.number().catch(-10),

    // Visual - floor
    VITE_FLOOR_RESTITUTION: z.coerce.number().catch(2),
    VITE_FLOOR_INITIAL_COLOUR: z.string().catch("#eebefa"),
    VITE_FLOOR_TILT: z.coerce.number().catch(Math.PI / 6),
    VITE_FLOOR_PERIOD: z.coerce.number().catch(120),
    VITE_FLOOR_AMPLITUDE: z.coerce.number().catch(2 * Math.PI),
    VITE_TILT_FLIP_DURATION: z.coerce.number().catch(2),
    VITE_TILT_FLIP_MIN_DELAY: z.coerce.number().catch(20000),
    VITE_TILT_FLIP_MAX_DELAY: z.coerce.number().catch(40000),
    VITE_TILT_FLIP_LFO_PERIOD: z.coerce.number().catch(180),

    // Visual - wobble
    VITE_WOBBLE_AMPLITUDE: z.coerce.number().catch(0.01),
    VITE_WOBBLE_FREQUENCY: z.coerce.number().catch(2),
    VITE_WOBBLE_DECAY: z.coerce.number().catch(0.4),
    VITE_WOBBLE_QUEUE_MAX: z.coerce.number().int().catch(24),

    // Visual - camera
    VITE_ORBIT_RADIUS: z.coerce.number().catch(2 * Math.SQRT2),
    VITE_ORBIT_RADIUS_MIN: z.coerce.number().catch(2 * Math.SQRT2),
    VITE_ORBIT_RADIUS_MAX: z.coerce.number().catch(5),
    VITE_ORBIT_HEIGHT: z.coerce.number().catch(2),
    VITE_ORBIT_PERIOD: z.coerce.number().catch(60),
    VITE_ORBIT_AMPLITUDE: z.coerce.number().catch(0),
    VITE_ORBIT_START_ANGLE: z.coerce.number().catch(Math.PI / 4),

    // Colour
    VITE_COLOUR_QUEUE_MAX: z.coerce.number().int().catch(20),
    VITE_COLOUR_TRANSITION_DURATION: z.coerce.number().catch(0.1),

    // UI
    VITE_START_OVERLAY_BLUR_PX: z.coerce.number().catch(4),
    VITE_BUTTON_WOBBLE_PX: z.coerce.number().catch(1),
});

const env = parser.parse(import.meta.env);
export default env;
