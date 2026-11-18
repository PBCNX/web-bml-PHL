/*
 * 受信機内蔵音 TR-B14 第二分冊 第三編 第2部 3.3.5
 * 0: 速報チャイム1
 * 1: 速報チャイム2
 * 2: 速報チャイム3
 * 3: 速報チャイム4
 * 4: 速報チャイム5
 * 5: ボタン操作音1
 * 6: ボタン操作音2
 * 7: ボタン操作音3
 * 8: ボタン操作音4
 * 9: ボタン操作音5
 * 10:ボタン操作音6
 * 11:ボタン操作音7
 * 12:ボタン操作音8
 * 13:アラート音
 * 14:
 * 15:
**/

import { romsoundData } from "./romsound_data";
import type { AudioOutput } from "./audio_output";

function fromBase64(input: string): Uint8Array<ArrayBuffer> {
    if ("fromBase64" in globalThis.Uint8Array) {
        return Uint8Array.fromBase64(input);
    } else {
        return Uint8Array.from(window.atob(input), c => c.charCodeAt(0));
    }
}

function playBuffer(destination: AudioNode, buf: Float32Array<ArrayBuffer>, sampleRate: number) {
    const buffer = destination.context.createBuffer(1, buf.length, sampleRate)
    buffer.copyToChannel(buf, 0)
    const source = destination.context.createBufferSource();
    source.buffer = buffer;
    source.connect(destination);
    source.start(0);
}

const romSoundCache = new Map<number, { buffer: Float32Array<ArrayBuffer>, sampleRate: number }>();

export function playRomSound(soundId: number, destination: AudioNode, output?: AudioOutput | null): boolean {
    // The audio-output seam: a host that plays ROM sounds itself (Android's MediaPlayer) says so here.
    if (output?.romSound?.(soundId)) {
        return true;
    }
    let cache = romSoundCache.get(soundId);
    if (cache == null) {
        const data = romsoundData[soundId];
        // 受信機に搭載していない音声は再生失敗として通知する
        if (data == null) {
            return false;
        }
        const buffer = fromBase64(data).buffer;
        destination.context.decodeAudioData(buffer).then((audioBuffer) => {
            const cache = { buffer: audioBuffer.getChannelData(0), sampleRate: audioBuffer.sampleRate };
            romSoundCache.set(soundId, cache);
            playBuffer(destination, cache.buffer, cache.sampleRate);
        });
        return true;
    }
    playBuffer(destination, cache.buffer, cache.sampleRate);
    return true;
}
