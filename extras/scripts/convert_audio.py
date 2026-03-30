"""Convert audio/video files to MP3 using ffmpeg."""

import subprocess
import sys
from pathlib import Path


def convert_to_mp3(input_path: str, output_path: str | None = None) -> str:
    """
    Convert any ffmpeg-supported audio/video file to MP3.
    Returns the output path.
    """
    inp = Path(input_path)
    if not inp.exists():
        print(f"Error: file not found: {input_path}")
        sys.exit(1)

    if output_path is None:
        output_path = str(inp.with_suffix(".mp3"))

    if Path(output_path).exists():
        print(f"Output already exists, skipping: {output_path}")
        return output_path

    print(f"Converting {inp.name} → {Path(output_path).name} ...")
    result = subprocess.run(
        [
            "ffmpeg", "-i", input_path,
            "-vn",            # no video
            "-ar", "44100",   # sample rate
            "-ac", "2",       # stereo
            "-b:a", "192k",   # bitrate
            output_path,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print("ffmpeg error:")
        print(result.stderr)
        sys.exit(1)

    size_mb = Path(output_path).stat().st_size / 1_000_000
    print(f"Done: {output_path} ({size_mb:.1f} MB)")
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_audio.py <input_file> [output.mp3]")
        print("  Converts any audio/video file to MP3 using ffmpeg.")
        sys.exit(1)

    inp = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else None
    convert_to_mp3(inp, out)
