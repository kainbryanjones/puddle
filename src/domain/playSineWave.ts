import * as Tone from "tone";
import env from "@/env.ts";

const reverb = new Tone.Reverb({
    decay: env.VITE_REVERB_DECAY,
    preDelay: env.VITE_REVERB_PREDELAY,
    wet: env.VITE_REVERB_WET,
});

const filter = new Tone.Filter({
    frequency: env.VITE_FILTER_FREQ,
    type: "lowpass",
    rolloff: env.VITE_FILTER_ROLLOFF as -12 | -24 | -48 | -96,
});

const limiter = new Tone.Compressor({
    threshold: env.VITE_COMPRESSOR_THRESHOLD,
    ratio: env.VITE_COMPRESSOR_RATIO,
    attack: env.VITE_COMPRESSOR_ATTACK,
    release: env.VITE_COMPRESSOR_RELEASE,
    knee: env.VITE_COMPRESSOR_KNEE,
});

const makeSynth = (type: "sine" | "square" | "sawtooth") => {
    const s = new Tone.PolySynth(Tone.Synth, {
        oscillator: {type},
        envelope: {
            attack: env.VITE_SYNTH_ATTACK,
            decay: env.VITE_SYNTH_DECAY,
            sustain: env.VITE_SYNTH_SUSTAIN,
            release: env.VITE_SYNTH_RELEASE,
        },
    });
    s.chain(filter, reverb, limiter, Tone.getDestination());
    s.volume.value = env.VITE_SYNTH_VOLUME;
    s.maxPolyphony = env.VITE_SYNTH_MAX_POLYPHONY;
    return s;
};

const synth = makeSynth("sine");
const squareSynth = makeSynth("square");
const sawSynth = makeSynth("sawtooth");
void reverb.generate();

export type Wave = "sine" | "square" | "sawtooth";
const synthsByWave: Record<Wave, Tone.PolySynth> = {
    sine: synth,
    square: squareSynth,
    sawtooth: sawSynth,
};

export const setReverbWet = (value: number) => {
    reverb.wet.value = value;
};

const noiseFilter = new Tone.Filter({
    frequency: env.VITE_NOISE_FILTER_FREQ,
    type: "bandpass",
    rolloff: env.VITE_NOISE_FILTER_ROLLOFF as -12 | -24 | -48 | -96,
});
const noise = new Tone.Noise("white");
noise.chain(noiseFilter, reverb);
noise.volume.value = env.VITE_NOISE_VOLUME;
let noiseStarted = false;
export const startAmbience = () => {
    if (noiseStarted) return;
    noiseStarted = true;
    noise.start();
};

const scale = ["C", "D", "E", "F", "G", "A", "B"];

const bassReverb = new Tone.Reverb({
    decay: env.VITE_BASS_REVERB_DECAY,
    preDelay: 0,
    wet: env.VITE_BASS_REVERB_WET,
});
void bassReverb.generate();
const bassSynth = new Tone.Synth({
    oscillator: {type: "triangle"},
    envelope: {
        attack: env.VITE_BASS_ATTACK,
        decay: env.VITE_BASS_DECAY,
        sustain: env.VITE_BASS_SUSTAIN,
        release: env.VITE_BASS_RELEASE,
        releaseCurve: "linear",
    },
});
bassSynth.chain(bassReverb, Tone.getDestination());
bassSynth.volume.value = env.VITE_BASS_SYNTH_VOLUME;

export const playBassNote = () => {
    const note = scale[Math.floor(Math.random() * scale.length)];
    bassSynth.triggerAttackRelease(note + env.VITE_BASS_OCTAVE.toString(), "2n", Tone.now());
};

const playSineWave = (octave: number, wave: Wave = "sine") => {
    const now = Tone.now();
    const note = scale[Math.floor(Math.random() * scale.length)];
    const s = synthsByWave[wave];
    const velocity = 1 / Math.sqrt(s.activeVoices + 1);
    s.triggerAttackRelease(
        note + octave.toString(),
        "4n",
        now + Math.random() * 0.001,
        velocity,
    );
};

export default playSineWave;
